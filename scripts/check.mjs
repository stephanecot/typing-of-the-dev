#!/usr/bin/env node
/* Validations du projet — zéro dépendance, lancé par `npm run check`.
   Vérifie les invariants documentés dans CLAUDE.md :
   1. syntaxe de tous les fichiers JS ;
   2. mots à taper : pas de { } [ ], pas d'accents, assez de mots courts
      par banque pour la difficulté STAGIAIRE (maxLen 10) ;
   3. i18n : mêmes clés en FR et EN, mêmes formes (fonction/tableau/chaîne),
      mêmes tailles de structures (bestiaires, sections d'aide, notes) ;
   4. cohérence : sprites ASCII référencés par les bestiaires et les boss,
      version identique entre main.js et package.json. */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];

// ---------------------------------------------------------------- 1. syntaxe
const jsFiles = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'node_modules' || name === '.git' || name === 'lib') continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.js') || name.endsWith('.mjs')) jsFiles.push(p);
  }
};
walk(ROOT);
for (const f of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    errors.push(`syntaxe : ${f}\n${e.stderr}`);
  }
}

// ------------------------------------------------- chargement des data files
// Les fichiers data sont des scripts globaux : on les évalue dans un bac à
// sable minimal qui imite ce dont ils ont besoin.
const sandboxEval = (files) => {
  const src = files.map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n;\n');
  const fn = new Function('localStorage', 'document', `${src}
    ;return { WORDS: typeof WORDS !== 'undefined' ? WORDS : null,
              ASCII: typeof ASCII !== 'undefined' ? ASCII : null,
              I18N: typeof I18N !== 'undefined' ? I18N : null };`);
  return fn(
    { getItem: () => null, setItem: () => {} },
    { documentElement: { lang: '' }, querySelector: () => null },
  );
};
let WORDS = null;
let ASCII = null;
let I18N = null;
try {
  ({ WORDS, ASCII, I18N } = sandboxEval([
    'public/js/data/words.js', 'public/js/data/ascii.js', 'public/js/data/i18n.js',
  ]));
} catch (e) {
  errors.push(`chargement des data files : ${e.message}`);
}

// ---------------------------------------------------------------- 2. mots
if (WORDS) {
  const banks = [];
  const collect = (obj, prefix) => {
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val)) banks.push([prefix + key, val]);
      else if (val && typeof val === 'object') collect(val, `${prefix}${key}.`);
      else if (typeof val === 'string') banks.push([prefix + key, [val]]);
    }
  };
  collect(WORDS, '');
  for (const [name, list] of banks) {
    for (const w of list) {
      if (/[{}\[\]]/.test(w)) errors.push(`mot avec {}/[] (AZERTY) dans ${name} : "${w}"`);
      if (/[à-üÀ-Ü]/.test(w)) errors.push(`mot accentué dans ${name} : "${w}"`);
    }
    // STAGIAIRE (maxLen 10) : seules les banques filtrées par maxLen dans
    // labelFor() ont besoin de mots courts (les autres l'ignorent)
    const MAXLEN_BANKS = new Set(['keywords', 'exceptions', 'snippets', 'legacyNames',
      'deadlines', 'typos', 'insults', 'freelance',
      'en.deadlines', 'en.insults', 'en.freelance']);
    const courts = list.filter((w) => w.length <= 10).length;
    if (MAXLEN_BANKS.has(name) && list.length >= 8 && courts < 3) {
      warnings.push(`banque ${name} : seulement ${courts} mot(s) ≤ 10 caractères (difficulté STAGIAIRE)`);
    }
  }
}

// ---------------------------------------------------------------- 3. i18n
if (I18N) {
  const shape = (v) => Array.isArray(v) ? `array(${v.length})` : typeof v;
  const frKeys = Object.keys(I18N.fr);
  const enKeys = Object.keys(I18N.en);
  for (const k of frKeys) {
    if (!(k in I18N.en)) errors.push(`i18n : clé "${k}" présente en FR mais absente en EN`);
    else if (shape(I18N.fr[k]) !== shape(I18N.en[k])) {
      errors.push(`i18n : clé "${k}" de forme différente (fr=${shape(I18N.fr[k])}, en=${shape(I18N.en[k])})`);
    }
  }
  for (const k of enKeys) {
    if (!(k in I18N.fr)) errors.push(`i18n : clé "${k}" présente en EN mais absente en FR`);
  }
  // structures appariées élément par élément
  for (const key of ['helpSections', 'releaseNotes', 'bestiaryBosses', 'bestiaryBossesInf']) {
    const fr = I18N.fr[key] || [];
    const en = I18N.en[key] || [];
    if (fr.length !== en.length) errors.push(`i18n : ${key} n'a pas la même taille (fr=${fr.length}, en=${en.length})`);
  }
  const frGroups = I18N.fr.bestiaryGroups || [];
  const enGroups = I18N.en.bestiaryGroups || [];
  if (frGroups.length !== enGroups.length) {
    errors.push(`i18n : bestiaryGroups n'a pas le même nombre de groupes (fr=${frGroups.length}, en=${enGroups.length})`);
  } else {
    frGroups.forEach(([title, entries], i) => {
      if (entries.length !== enGroups[i][1].length) {
        errors.push(`i18n : groupe bestiaire "${title}" — ${entries.length} entrées FR vs ${enGroups[i][1].length} EN`);
      }
    });
  }
}

// ---------------------------------------------------------------- 4. cohérence
if (I18N && ASCII) {
  const checkArtKeys = (entries, label) => {
    for (const [kind] of entries) {
      if (!ASCII[kind] || !ASCII[kind][0]) errors.push(`${label} : sprite ASCII "${kind}" introuvable`);
    }
  };
  for (const [, entries] of I18N.fr.bestiaryGroups || []) checkArtKeys(entries, 'bestiaire');
  checkArtKeys(I18N.fr.bestiaryBosses || [], 'boss campagne');
  checkArtKeys(I18N.fr.bestiaryBossesInf || [], 'boss infinis');
}

const mainSrc = readFileSync(join(ROOT, 'public/js/main.js'), 'utf8');
const appVersion = (mainSrc.match(/APP_VERSION = 'v([\d.]+)'/) || [])[1];
const pkgVersion = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
if (appVersion !== pkgVersion) {
  errors.push(`version désynchronisée : main.js dit v${appVersion}, package.json dit ${pkgVersion}`);
}

// boss du mode infini : chaque nameKey doit exister en i18n,
// et il doit y avoir autant d'entrées au bestiaire que de variantes
const gameSrc = readFileSync(join(ROOT, 'public/js/scenes/GameScene.js'), 'utf8');
const nameKeys = [...gameSrc.matchAll(/nameKey: '(\w+)'/g)].map((m) => m[1]);
if (I18N) {
  for (const k of nameKeys) {
    if (!I18N.fr[k]) errors.push(`boss infini : clé i18n "${k}" manquante`);
  }
  const inf = (I18N.fr.bestiaryBossesInf || []).length;
  if (nameKeys.length !== inf) {
    warnings.push(`${nameKeys.length} boss infinis dans le code mais ${inf} entrées au bestiaire`);
  }
}

// ---------------------------------------------------------------- rapport
for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\n${errors.length} erreur(s).`);
  process.exit(1);
}
console.log(`✓ ${jsFiles.length} fichiers JS valides, banques de mots saines, i18n FR/EN apparié, versions synchronisées.`);
