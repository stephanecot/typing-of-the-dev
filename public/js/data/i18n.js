/* i18n FR/EN — textes d'interface. Les banques de mots à taper restent
   majoritairement communes (jargon dev) ; seules les banques très françaises
   (deadlines, recruteur, missiles) ont une variante anglaise dans words.js. */
'use strict';

let LANG = localStorage.getItem('totd-lang') || 'fr';

const I18N = {
  fr: {
    // ---- menu
    menuTagline: 'Les bugs sont sortis du backlog. Tapez pour survivre.',
    menuSelect: '> SÉLECTIONNEZ VOTRE GRADE <',
    menuDeploy: '[ ENTRÉE pour déployer en prod ]',
    menuFooter: 'H: aide & règles · flèches: choisir · ENTRÉE: jouer · ÉCHAP: pause · TAB: changer de cible · F2: muet',
    menuLang: '[ L ] langue : FRANÇAIS',
    helpTitle: '> AIDE — RÈGLES DU JEU_',
    helpClose: '[ H ou ÉCHAP : retour au menu ]',
    helpPageHint: (cur, total) => `[ ←/→ : page ${cur}/${total} · H ou ÉCHAP : retour au menu ]`,
    helpDiffTitle: '> DIFFICULTÉS_',
    helpGoal: (n) => `Objectif : tenir ${n} sprints puis vaincre LE DSI ÉNERVÉ.\nChaque seconde d'avance sur le chrono = points bonus !`,
    helpLives: 'vies',
    helpSpeed: 'vitesse',
    helpSpawn: 'cadence',
    helpMaxLen: 'mots max',
    helpBossCmds: 'cmds boss',
    helpEnemiesTitle: '> BESTIAIRE — LES ENNEMIS_',
    helpBossesTitle: '> LES BOSS_',
    bestiary: [
      ['bug', 'BUG', 'niv.1 — le tout-venant du backlog :\njargon dev court. Lent, mais nombreux.', 'toutes difficultés'],
      ['missile', 'INMAIL', 'niv.1 — missile du recruteur : mot\ncourt et très rapide.', 'toutes difficultés'],
      ['ghost', 'BUG FANTÔME', 'niv.2 — disparaît par intermittence.\nGardez son mot en tête !', 'toutes · dès le sprint 4'],
      ['virus', 'VIRUS', 'niv.2 — se réplique en 2 mini-bugs\nà sa mort. Nettoyez vite !', 'toutes · dès le sprint 5'],
      ['microservice', 'LE MICROSERVICE', 'niv.2 — se scinde en 2 instances\ntoutes les 8 s. Scale out !', 'toutes · dès le sprint 5'],
      ['legacy', 'ZOMBIE LEGACY', 'niv.2 — code et technos qui refusent\nde mourir. Lent mais long à taper.', 'toutes difficultés'],
      ['deadline', 'FAUCHEUSE DEADLINE', 'niv.2 — l\'horreur du quotidien\n(réunions, jira…). Rapide !', 'toutes difficultés'],
      ['bug', 'BUG D\'ÉLITE', 'niv.3 — exceptions CamelCase,\nmajuscules comprises. Teigneux.', 'toutes difficultés'],
      ['spammer', 'LE RECRUTEUR', 'niv.3 — campe au fond et spamme des\nInMails. Éliminez la source !', 'toutes · dès le sprint 3'],
      ['monolith', 'LE MONOLITHE', 'niv.3 — exige 2 mots pour tomber,\net recule entre les deux.', 'toutes · dès le sprint 6'],
      ['spec', 'LA SPEC FOIREUSE', 'niv.3 — son mot ne veut RIEN dire\n(généré au hasard). Bon courage.', 'toutes · dès le sprint 4'],
      ['consultant', 'LE CONSULTANT', 'niv.4 — buzzwords à rallonge,\net il accélère vers la prod.', '★★★★ et ★★★★★'],
      ['ransomware', 'LE RANSOMWARE', 'niv.5 — rechiffre son mot toutes les\n6 s : tout est à refaire !', '★★★★★ uniquement'],
      ['powerup', 'POWER-UP', 'bonus doré — le taper déclenche son\npouvoir : coffee, revert, reboot.', 'toutes difficultés'],
    ],
    bestiaryBosses: [
      ['boss', 'INCIDENT PROD MAJEUR', 'Apparaît tous les 4 sprints.\nEnchaînez ses commandes terminal pour\nle faire reculer. Lâche toujours +1 vie.', 'toutes difficultés'],
      ['finalBoss', 'LE DSI ÉNERVÉ', 'Boss final du dernier sprint :\nencaisse 2 commandes de plus.\nLe vaincre = victoire + bonus temps !', 'dernier sprint'],
    ],
    flippedBadge: ' [retourné]',
    virusSplit: 'RÉPLICATION !',
    microSplit: 'SCALE OUT !',
    reEncrypted: 'rechiffré_',
    mutedTag: ' · 🔇 muet (F2)',
    konami: '☠ KONAMI CODE — GOD MODE ARMÉ — TRICHEUR REPÉRÉ ☠',
    helpSections: [
      ['OBJECTIF', [
        'Protège ta PROD : chaque ennemi qui l\'atteint = un INCIDENT. Trop d\'incidents = GAME OVER.',
      ]],
      ['COMMENT TUER UN BUG', [
        'Tape la PREMIÈRE LETTRE d\'un ennemi pour le verrouiller, puis finis',
        'son mot sans faute (les espaces sont facultatifs). Une faute remet le combo à zéro.',
      ]],
      ['NIVEAUX & POINTS', [
        'niv.1 ▲ bugs · niv.2 ▲▲ deadlines (rapides !) et legacy · niv.3 ▲▲▲ élites.',
        'Points = longueur × 10 × niveau × combo × VITESSE (rapide = jusqu\'à ×3 !).',
        'Certains ennemis lâchent un bonus : +1 vie, points, combo +5, slow-mo, items.',
      ]],
      ['POUVOIRS ENNEMIS', [
        'Mots MINIFIÉS : des lettres sont masquées (?), à toi de les deviner !',
        'Mots RETOURNÉS : affichés tête en bas — ça se tape normalement, ça se lit moins bien.',
        'LE RECRUTEUR [in] spamme des messages : tape-les avant qu\'ils touchent la prod.',
      ]],
      ['ITEMS', [
        'ENTRÉE : KILL -9 (max 3) — tue le process ennemi le plus proche de la prod.',
        'EFFACER : AUTOCOMPLETE (max 5) — l\'IA complète les 4 lettres suivantes.',
      ]],
      ['POWER-UPS & BOSS', [
        'Mots dorés : coffee = ralenti · git revert = recul · sudo reboot = purge.',
        'Tous les 4 sprints, un BOSS : enchaîne ses commandes. Il lâche +1 vie.',
      ]],
      ['TOUCHES', [
        'TAB : relâcher la cible · ÉCHAP : pause (puis Q : quitter) · F2 : muet · L (menu) : langue',
      ]],
    ],
    // ---- jeu
    hudGod: '  ☠ GOD MODE = TRICHEUR ☠',
    hudItems: (bombs, lasers) => `kill -9 x${bombs} [ENTRÉE]   autocomplete x${lasers} [EFFACER]`,
    hudTime: 'TEMPS',
    bannerBossWave: '!! INCIDENT MAJEUR DÉTECTÉ !!',
    bannerWave: 'déploiement des bugs...',
    bannerFinal: '!! LE DSI ÉNERVÉ ARRIVE !!',
    finalBossName: 'LE DSI ÉNERVÉ',
    prodSaved: 'LA PROD EST SAUVÉE !',
    timeBonus: 'BONUS TEMPS',
    pauseSub: 'les bugs attendent patiemment...',
    pauseResume: '[ ÉCHAP ou ENTRÉE : reprendre ]',
    pauseQuit: '[ Q : quitter la partie — score non sauvegardé ]',
    lvl: 'niv.',
    minified: ' [minifié]',
    recruiter: ' [recruteur]',
    bossName: 'INCIDENT PROD MAJEUR',
    newMessage: 'nouveau message !',
    fast: '>> RAPIDE',
    noBombs: 'PLUS DE KILL -9 !',
    noProcess: 'AUCUN PROCESS À TUER',
    bombSent: 'kill -9 envoyé_',
    noLasers: 'PLUS D\'AUTOCOMPLETE !',
    lockFirst: 'VERROUILLE UNE CIBLE !',
    suggestion: 'suggestion acceptée_',
    lifeUp: '+1 VIE — PROD RESTAURÉE',
    prodHealthy: 'PROD SAINE',
    stockFull: 'stock plein',
    invincible: 'INVINCIBLE (tricheur)',
    bossTouch: '!! LE BOSS A TOUCHÉ LA PROD !!',
    incident: 'INCIDENT EN PROD !',
    powerSlowmo: '☕ PAUSE CAFÉ\nralenti 5 s',
    powerRevert: 'GIT REVERT\nles bugs reculent !',
    powerNuke: 'SUDO REBOOT\nécran purgé !',
    prodDown: 'LA PROD EST DOWN',
    // ---- game over
    goWin: 'VICTOIRE — PROD SAUVÉE',
    goDiff: 'difficulté :',
    statSprints: 'SPRINTS TENUS',
    statSpeed: 'VITESSE',
    wpmUnit: 'mots/min',
    statAccuracy: 'PRÉCISION',
    statBugs: 'BUGS ÉCRASÉS',
    statBosses: 'BOSS VAINCUS',
    shame: '☠ GOD MODE DÉTECTÉ — SCORE DE TRICHEUR, NON ENREGISTRÉ ☠',
    ranked: (rank) => `Tu es classé #${rank} du DevFest !`,
    offline: '(serveur injoignable — score non enregistré)',
    replay: '[ ENTRÉE : rejouer ]    [ M : menu ]',
    // ---- formulaire DOM
    formTitle: '> ENREGISTRER TON SCORE_',
    formPseudo: 'pseudo *',
    formFirstName: 'prénom ',
    formLastName: 'nom ',
    formEmail: 'email ',
    formPhone: 'téléphone ',
    formOpt: '(optionnel)',
    formConsent: 'J\'accepte d\'être recontacté·e après le DevFest. Sans cette case, '
      + 'nom, prénom, email et téléphone ne sont pas conservés (RGPD : données '
      + 'supprimées après le tirage, jamais cédées).',
    formSave: '[ ENREGISTRER ]',
    formSkip: '[ passer ]',
  },

  en: {
    // ---- menu
    menuTagline: 'The bugs escaped the backlog. Type to survive.',
    menuSelect: '> SELECT YOUR RANK <',
    menuDeploy: '[ ENTER to deploy to prod ]',
    menuFooter: 'H: help & rules · arrows: select · ENTER: play · ESC: pause · TAB: switch target · F2: mute',
    menuLang: '[ L ] language: ENGLISH',
    helpTitle: '> HELP — HOW TO PLAY_',
    helpClose: '[ H or ESC: back to menu ]',
    helpPageHint: (cur, total) => `[ ←/→: page ${cur}/${total} · H or ESC: back to menu ]`,
    helpDiffTitle: '> DIFFICULTY LEVELS_',
    helpGoal: (n) => `Goal: survive ${n} sprints, then defeat THE FURIOUS CIO.\nEvery second left on the clock = bonus points!`,
    helpLives: 'lives',
    helpSpeed: 'speed',
    helpSpawn: 'spawn rate',
    helpMaxLen: 'max word',
    helpBossCmds: 'boss cmds',
    helpEnemiesTitle: '> BESTIARY — THE ENEMIES_',
    helpBossesTitle: '> THE BOSSES_',
    bestiary: [
      ['bug', 'BUG', 'lvl.1 — backlog regulars: short dev\njargon. Slow, but they swarm.', 'all difficulties'],
      ['missile', 'INMAIL', 'lvl.1 — recruiter missile: short\nword, very fast.', 'all difficulties'],
      ['ghost', 'GHOST BUG', 'lvl.2 — fades out intermittently.\nKeep its word in mind!', 'all · from sprint 4'],
      ['virus', 'VIRUS', 'lvl.2 — splits into 2 mini-bugs\nwhen killed. Clean up fast!', 'all · from sprint 5'],
      ['microservice', 'THE MICROSERVICE', 'lvl.2 — splits into 2 instances\nevery 8 s. Scale out!', 'all · from sprint 5'],
      ['legacy', 'LEGACY ZOMBIE', 'lvl.2 — code and tech that refuse\nto die. Slow but long to type.', 'all difficulties'],
      ['deadline', 'DEADLINE REAPER', 'lvl.2 — everyday horror (meetings,\njira…). Fast!', 'all difficulties'],
      ['bug', 'ELITE BUG', 'lvl.3 — CamelCase exceptions,\ncapital letters included. Mean.', 'all difficulties'],
      ['spammer', 'THE RECRUITER', 'lvl.3 — camps in the back and spams\nInMails. Kill the source!', 'all · from sprint 3'],
      ['monolith', 'THE MONOLITH', 'lvl.3 — takes 2 words to bring down,\nand knocks back in between.', 'all · from sprint 6'],
      ['spec', 'THE BOTCHED SPEC', 'lvl.3 — its word means NOTHING\n(randomly generated). Good luck.', 'all · from sprint 4'],
      ['consultant', 'THE CONSULTANT', 'lvl.4 — endless buzzwords, and it\naccelerates toward prod.', '★★★★ and ★★★★★'],
      ['ransomware', 'THE RANSOMWARE', 'lvl.5 — re-encrypts its word every\n6 s: start all over again!', '★★★★★ only'],
      ['powerup', 'POWER-UP', 'golden bonus — typing it triggers its\npower: coffee, revert, reboot.', 'all difficulties'],
    ],
    bestiaryBosses: [
      ['boss', 'MAJOR PROD INCIDENT', 'Shows up every 4 sprints.\nChain its terminal commands to push\nit back. Always drops +1 life.', 'all difficulties'],
      ['finalBoss', 'THE FURIOUS CIO', 'Final boss of the last sprint:\ntakes 2 extra commands.\nBeat it for victory + time bonus!', 'last sprint'],
    ],
    flippedBadge: ' [flipped]',
    virusSplit: 'REPLICATING!',
    microSplit: 'SCALING OUT!',
    reEncrypted: 're-encrypted_',
    mutedTag: ' · 🔇 muted (F2)',
    konami: '☠ KONAMI CODE — GOD MODE ARMED — CHEATER SPOTTED ☠',
    helpSections: [
      ['GOAL', [
        'Protect your PROD: every enemy that reaches it = an INCIDENT. Too many incidents = GAME OVER.',
      ]],
      ['HOW TO KILL A BUG', [
        'Type the FIRST LETTER of an enemy to lock it, then finish',
        'its word without a typo (spaces are optional). A typo resets the combo.',
      ]],
      ['LEVELS & POINTS', [
        'lvl.1 ▲ bugs · lvl.2 ▲▲ deadlines (fast!) and legacy · lvl.3 ▲▲▲ elites.',
        'Points = length × 10 × level × combo × SPEED (fast typing = up to ×3!).',
        'Some enemies drop a bonus: +1 life, points, combo +5, slow-mo, items.',
      ]],
      ['ENEMY POWERS', [
        'MINIFIED words: some letters are masked (?), guess them!',
        'FLIPPED words: shown upside down — typed normally, read painfully.',
        'THE RECRUITER [in] spams messages: type them before they hit prod.',
      ]],
      ['ITEMS', [
        'ENTER: KILL -9 (max 3) — kills the enemy process closest to prod.',
        'BACKSPACE: AUTOCOMPLETE (max 5) — the AI types the next 4 letters.',
      ]],
      ['POWER-UPS & BOSS', [
        'Golden words: coffee = slow-mo · git revert = knockback · sudo reboot = purge.',
        'Every 4 sprints, a BOSS: chain its commands. It always drops +1 life.',
      ]],
      ['KEYS', [
        'TAB: release target · ESC: pause (then Q: quit) · F2: mute · L (menu): language',
      ]],
    ],
    // ---- game
    hudGod: '  ☠ GOD MODE = CHEATER ☠',
    hudItems: (bombs, lasers) => `kill -9 x${bombs} [ENTER]   autocomplete x${lasers} [BACKSPACE]`,
    hudTime: 'TIME',
    bannerBossWave: '!! MAJOR INCIDENT DETECTED !!',
    bannerWave: 'deploying bugs...',
    bannerFinal: '!! THE FURIOUS CIO IS COMING !!',
    finalBossName: 'THE FURIOUS CIO',
    prodSaved: 'PROD IS SAVED!',
    timeBonus: 'TIME BONUS',
    pauseSub: 'the bugs are waiting patiently...',
    pauseResume: '[ ESC or ENTER: resume ]',
    pauseQuit: '[ Q: quit game — score not saved ]',
    lvl: 'lvl.',
    minified: ' [minified]',
    recruiter: ' [recruiter]',
    bossName: 'MAJOR PROD INCIDENT',
    newMessage: 'new message!',
    fast: '>> FAST',
    noBombs: 'OUT OF KILL -9!',
    noProcess: 'NO PROCESS TO KILL',
    bombSent: 'kill -9 sent_',
    noLasers: 'OUT OF AUTOCOMPLETE!',
    lockFirst: 'LOCK A TARGET FIRST!',
    suggestion: 'suggestion accepted_',
    lifeUp: '+1 LIFE — PROD RESTORED',
    prodHealthy: 'PROD HEALTHY',
    stockFull: 'stock full',
    invincible: 'INVINCIBLE (cheater)',
    bossTouch: '!! THE BOSS HIT PROD !!',
    incident: 'PROD INCIDENT!',
    powerSlowmo: '☕ COFFEE BREAK\nslow-mo 5 s',
    powerRevert: 'GIT REVERT\nbugs knocked back!',
    powerNuke: 'SUDO REBOOT\nscreen purged!',
    prodDown: 'PROD IS DOWN',
    // ---- game over
    goWin: 'VICTORY — PROD SAVED',
    goDiff: 'difficulty:',
    statSprints: 'SPRINTS SURVIVED',
    statSpeed: 'SPEED',
    wpmUnit: 'wpm',
    statAccuracy: 'ACCURACY',
    statBugs: 'BUGS SQUASHED',
    statBosses: 'BOSSES DEFEATED',
    shame: '☠ GOD MODE DETECTED — CHEATER SCORE, NOT SAVED ☠',
    ranked: (rank) => `You ranked #${rank} at DevFest!`,
    offline: '(server unreachable — score not saved)',
    replay: '[ ENTER: replay ]    [ M: menu ]',
    // ---- DOM form
    formTitle: '> SAVE YOUR SCORE_',
    formPseudo: 'nickname *',
    formFirstName: 'first name ',
    formLastName: 'last name ',
    formEmail: 'email ',
    formPhone: 'phone ',
    formOpt: '(optional)',
    formConsent: 'I agree to be contacted after DevFest. Without this box, '
      + 'name, email and phone are not stored (GDPR: data deleted '
      + 'after the prize draw, never shared).',
    formSave: '[ SAVE ]',
    formSkip: '[ skip ]',
  },
};

function T(key) {
  const v = I18N[LANG][key] ?? I18N.fr[key];
  return v !== undefined ? v : key;
}

/* Libellé/tagline de difficulté selon la langue (définis dans main.js). */
function diffLabel(d) { return LANG === 'en' && d.labelEn ? d.labelEn : d.label; }
function diffTagline(d) { return LANG === 'en' && d.taglineEn ? d.taglineEn : d.tagline; }

function setLang(lang) {
  LANG = lang;
  localStorage.setItem('totd-lang', lang);
  document.documentElement.lang = lang;
  applyFormLang();
}

/* Le formulaire de fin de partie est en DOM (index.html) : on le traduit ici. */
function applyFormLang() {
  const set = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };
  set('#save-form h2', T('formTitle'));
  set('label[for="input-pseudo"]', T('formPseudo'));
  const opt = ` <span class="opt">${T('formOpt')}</span>`;
  const setOpt = (sel, txt) => {
    const el = document.querySelector(sel);
    if (el) el.innerHTML = txt + opt;
  };
  setOpt('label[for="input-firstname"]', T('formFirstName'));
  setOpt('label[for="input-lastname"]', T('formLastName'));
  setOpt('label[for="input-email"]', T('formEmail'));
  setOpt('label[for="input-phone"]', T('formPhone'));
  set('.consent span', T('formConsent'));
  set('#save-form button[type="submit"]', T('formSave'));
  set('#btn-skip', T('formSkip'));
}

// scripts chargés en fin de body : le DOM du formulaire existe déjà
document.documentElement.lang = LANG;
applyFormLang();
