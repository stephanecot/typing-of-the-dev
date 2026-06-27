/**
 * Typing of the Dev — serveur du jeu (stand, salon, bureau…)
 * Zéro dépendance : node:http pour le statique + API, node:sqlite pour la BDD.
 * Lancement : node server.js  →  http://localhost:3333
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3333;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DB_DIR = path.join(__dirname, 'db');
const DB_FILE = path.join(DB_DIR, 'typing-of-the-dev.sqlite');

// ---------------------------------------------------------------- BDD
fs.mkdirSync(DB_DIR, { recursive: true });
const db = new DatabaseSync(DB_FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo        TEXT    NOT NULL,
    first_name    TEXT,
    last_name     TEXT,
    email         TEXT,
    phone         TEXT,
    consent       INTEGER NOT NULL DEFAULT 0,
    difficulty    TEXT    NOT NULL,
    score         INTEGER NOT NULL DEFAULT 0,
    wave          INTEGER NOT NULL DEFAULT 0,
    wpm           REAL    NOT NULL DEFAULT 0,
    accuracy      REAL    NOT NULL DEFAULT 0,
    max_combo     INTEGER NOT NULL DEFAULT 0,
    duration_s    REAL    NOT NULL DEFAULT 0,
    kills_bug     INTEGER NOT NULL DEFAULT 0,
    kills_legacy  INTEGER NOT NULL DEFAULT 0,
    kills_deadline INTEGER NOT NULL DEFAULT 0,
    kills_boss    INTEGER NOT NULL DEFAULT 0,
    kills_powerup INTEGER NOT NULL DEFAULT 0,
    missed_words  TEXT    NOT NULL DEFAULT '[]',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_games_score ON games (score DESC);
`);

// migration : ajoute les colonnes manquantes sur une BDD créée avant leur introduction
const existingCols = new Set(db.prepare('PRAGMA table_info(games)').all().map((c) => c.name));
for (const col of ['first_name', 'last_name', 'phone']) {
  if (!existingCols.has(col)) db.exec(`ALTER TABLE games ADD COLUMN ${col} TEXT`);
}

// réglages du jeu pilotables depuis l'admin (clé/valeur)
db.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
const setSetting = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
                               ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
function readConfig() {
  const row = getSetting.get('maxSprints');
  return { maxSprints: row ? Number(row.value) : 10 };
}

const insertGame = db.prepare(`
  INSERT INTO games (pseudo, first_name, last_name, email, phone, consent, difficulty,
                     score, wave, wpm, accuracy, max_combo, duration_s, kills_bug,
                     kills_legacy, kills_deadline, kills_boss, kills_powerup, missed_words)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// ---------------------------------------------------------------- Helpers
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > maxBytes) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows, columns) {
  const head = columns.join(';');
  const lines = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(';'));
  return '﻿' + [head, ...lines].join('\n'); // BOM pour Excel
}

const clampInt = (v, min, max) => Math.max(min, Math.min(max, Math.trunc(Number(v) || 0)));
const clampFloat = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));

// ---------------------------------------------------------------- API
function handleApi(req, res, url) {
  // POST /api/games — enregistre une partie
  if (req.method === 'POST' && url.pathname === '/api/games') {
    return readBody(req).then((raw) => {
      const p = JSON.parse(raw);
      const pseudo = String(p.pseudo || 'ANONYME').trim().slice(0, 20) || 'ANONYME';
      const consent = p.consent ? 1 : 0;
      // RGPD : les données de contact ne sont conservées qu'avec consentement
      const contact = (v, max) => (consent && v ? String(v).trim().slice(0, max) : null);
      const firstName = contact(p.firstName, 60);
      const lastName = contact(p.lastName, 60);
      const email = contact(p.email, 120);
      const phone = contact(p.phone, 20);
      const difficulty = ['facile', 'normal', 'hard', 'cto', 'ultime'].includes(p.difficulty) ? p.difficulty : 'normal';
      const kills = p.kills || {};
      const missed = Array.isArray(p.missedWords)
        ? p.missedWords.slice(0, 200).map((w) => String(w).slice(0, 60))
        : [];
      const result = insertGame.run(
        pseudo, firstName, lastName, email, phone, consent, difficulty,
        clampInt(p.score, 0, 1e9), clampInt(p.wave, 0, 999),
        clampFloat(p.wpm, 0, 500), clampFloat(p.accuracy, 0, 100),
        clampInt(p.maxCombo, 0, 1e6), clampFloat(p.durationS, 0, 86400),
        clampInt(kills.bug, 0, 1e6), clampInt(kills.legacy, 0, 1e6),
        clampInt(kills.deadline, 0, 1e6), clampInt(kills.boss, 0, 1e6),
        clampInt(kills.powerup, 0, 1e6), JSON.stringify(missed)
      );
      const rank = db.prepare('SELECT COUNT(*) + 1 AS r FROM games WHERE score > ?')
        .get(clampInt(p.score, 0, 1e9)).r;
      sendJson(res, 201, { id: Number(result.lastInsertRowid), rank });
    }).catch((e) => sendJson(res, 400, { error: e.message }));
  }

  // GET /api/leaderboard?difficulty=&limit=
  if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
    const limit = clampInt(url.searchParams.get('limit') || 10, 1, 100);
    const diff = url.searchParams.get('difficulty');
    const rows = diff && diff !== 'all'
      ? db.prepare(`SELECT pseudo, score, wave, wpm, accuracy, max_combo, difficulty, created_at
                    FROM games WHERE difficulty = ? ORDER BY score DESC LIMIT ?`).all(diff, limit)
      : db.prepare(`SELECT pseudo, score, wave, wpm, accuracy, max_combo, difficulty, created_at
                    FROM games ORDER BY score DESC LIMIT ?`).all(limit);
    return sendJson(res, 200, rows);
  }

  // GET /api/stats — agrégats pour l'admin (et les stats fun de fin de salon)
  if (req.method === 'GET' && url.pathname === '/api/stats') {
    const totals = db.prepare(`
      SELECT COUNT(*) AS games, COUNT(DISTINCT pseudo) AS players,
             COALESCE(MAX(score), 0) AS bestScore, COALESCE(ROUND(AVG(wpm), 1), 0) AS avgWpm,
             COALESCE(ROUND(AVG(accuracy), 1), 0) AS avgAccuracy,
             COALESCE(SUM(kills_bug + kills_legacy + kills_deadline + kills_boss), 0) AS totalKills,
             COUNT(CASE WHEN email IS NOT NULL THEN 1 END) AS emails
      FROM games`).get();
    const byDifficulty = db.prepare(
      'SELECT difficulty, COUNT(*) AS games, MAX(score) AS best FROM games GROUP BY difficulty').all();
    const missCount = new Map();
    for (const row of db.prepare('SELECT missed_words FROM games').all()) {
      try {
        for (const w of JSON.parse(row.missed_words)) missCount.set(w, (missCount.get(w) || 0) + 1);
      } catch { /* ligne corrompue : ignorée */ }
    }
    const topMissed = [...missCount.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 15)
      .map(([word, count]) => ({ word, count }));
    return sendJson(res, 200, { totals, byDifficulty, topMissed });
  }

  // GET /api/export.csv | /api/export.json — export complet
  if (req.method === 'GET' && (url.pathname === '/api/export.csv' || url.pathname === '/api/export.json')) {
    const rows = db.prepare('SELECT * FROM games ORDER BY id').all();
    if (url.pathname === '/api/export.json') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="typing-of-the-dev-export.json"',
      });
      return res.end(JSON.stringify(rows, null, 2));
    }
    const columns = ['id', 'pseudo', 'first_name', 'last_name', 'email', 'phone', 'consent',
      'difficulty', 'score', 'wave', 'wpm', 'accuracy', 'max_combo', 'duration_s',
      'kills_bug', 'kills_legacy', 'kills_deadline', 'kills_boss', 'kills_powerup',
      'missed_words', 'created_at'];
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="typing-of-the-dev-export.csv"',
    });
    return res.end(toCsv(rows, columns));
  }

  // GET /api/export-emails.csv — uniquement les contacts ayant consenti (RGPD)
  if (req.method === 'GET' && url.pathname === '/api/export-emails.csv') {
    const rows = db.prepare(`SELECT pseudo, first_name, last_name, email, phone,
                                    MAX(score) AS best_score, COUNT(*) AS games
                             FROM games
                             WHERE consent = 1
                               AND (email IS NOT NULL OR phone IS NOT NULL
                                    OR first_name IS NOT NULL OR last_name IS NOT NULL)
                             GROUP BY COALESCE(email, phone, first_name || last_name)
                             ORDER BY best_score DESC`).all();
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="typing-of-the-dev-contacts.csv"',
    });
    return res.end(toCsv(rows, ['pseudo', 'first_name', 'last_name', 'email', 'phone', 'best_score', 'games']));
  }

  // GET /api/config — réglages publics du jeu (nb max de sprints…)
  if (req.method === 'GET' && url.pathname === '/api/config') {
    return sendJson(res, 200, readConfig());
  }

  // POST /api/config — modifié depuis l'admin
  if (req.method === 'POST' && url.pathname === '/api/config') {
    return readBody(req).then((raw) => {
      const p = JSON.parse(raw);
      if (p.maxSprints !== undefined) {
        setSetting.run('maxSprints', String(clampInt(p.maxSprints, 1, 99)));
      }
      sendJson(res, 200, readConfig());
    }).catch((e) => sendJson(res, 400, { error: e.message }));
  }

  return sendJson(res, 404, { error: 'not found' });
}

// ---------------------------------------------------------------- Multijoueur
// Sessions éphémères en mémoire. Transport temps réel : SSE (serveur → clients)
// + POST (clients → serveur). L'HÔTE fait tourner la vraie simulation du jeu et
// pousse l'état ; le serveur n'est qu'un relais + arbitre de session.
const sessions = new Map();
const MP_COLORS = ['#39ff7a', '#41f2ff', '#ffd76a', '#ff5cf0']; // 1 couleur par joueur

function mpCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I/O/0/1 ambigus
  let c = '';
  for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)];
  return sessions.has(c) ? mpCode() : c;
}
const mpId = () => 'p' + Math.random().toString(36).slice(2, 8);

function sseSend(res, type, data) {
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}
function lobbyView(s) {
  return {
    status: s.status, hostId: s.hostId, difficulty: s.difficulty, mode: s.mode,
    players: s.players.map((p) => ({ id: p.id, name: p.name, color: p.color, ready: p.ready })),
  };
}
function mpBroadcast(s, type, data, exceptId) {
  for (const [pid, res] of s.subs) if (pid !== exceptId) sseSend(res, type, data);
}

function handleMp(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api','mp',code?,action?]

  if (req.method === 'POST' && parts[2] === 'create') {
    return readBody(req).then((raw) => {
      const p = JSON.parse(raw || '{}');
      const code = mpCode();
      const id = mpId();
      const difficulty = ['facile', 'normal', 'hard', 'cto', 'ultime'].includes(p.difficulty) ? p.difficulty : 'normal';
      const mode = ['5', '10', 'inf'].includes(String(p.mode)) ? String(p.mode) : '5';
      const name = (String(p.name || 'HOTE').trim().slice(0, 16)) || 'HOTE';
      const color = MP_COLORS.includes(p.color) ? p.color : MP_COLORS[0];
      sessions.set(code, {
        code, status: 'lobby', difficulty, mode, hostId: id,
        players: [{ id, name, color, ready: true }],
        subs: new Map(), keyframe: null, gameOver: null, createdAt: Date.now(),
      });
      return sendJson(res, 201, { code, playerId: id, color });
    }).catch((e) => sendJson(res, 400, { error: e.message }));
  }

  if (req.method === 'POST' && parts[2] === 'join') {
    return readBody(req).then((raw) => {
      const p = JSON.parse(raw || '{}');
      const s = sessions.get(String(p.code || '').toUpperCase());
      if (!s) return sendJson(res, 404, { error: 'session inconnue' });
      if (s.status !== 'lobby') return sendJson(res, 409, { error: 'partie deja lancee' });
      if (s.players.length >= 4) return sendJson(res, 409, { error: 'session pleine' });
      const id = mpId();
      const taken = new Set(s.players.map((q) => q.color));
      const color = (MP_COLORS.includes(p.color) && !taken.has(p.color))
        ? p.color : (MP_COLORS.find((c) => !taken.has(c)) || MP_COLORS[0]);
      const name = (String(p.name || 'JOUEUR').trim().slice(0, 16)) || 'JOUEUR';
      s.players.push({ id, name, color, ready: false });
      mpBroadcast(s, 'lobby', lobbyView(s));
      return sendJson(res, 200, { code: s.code, playerId: id, color });
    }).catch((e) => sendJson(res, 400, { error: e.message }));
  }

  const code = (parts[2] || '').toUpperCase();
  const s = sessions.get(code);

  // SSE : flux d'événements du serveur vers un joueur (lobby + jeu)
  if (req.method === 'GET' && parts[3] === 'events') {
    const playerId = url.searchParams.get('playerId');
    if (!s || !s.players.some((p) => p.id === playerId)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no',
    });
    res.write(': ok\n\n');
    s.subs.set(playerId, res);
    sseSend(res, 'lobby', lobbyView(s)); // état courant immédiat (gère la reconnexion)
    if (s.status === 'playing') {
      sseSend(res, 'start', { difficulty: s.difficulty, mode: s.mode, players: lobbyView(s).players });
      if (s.keyframe) sseSend(res, 'keyframe', s.keyframe);
    }
    if (s.status === 'finished' && s.gameOver) sseSend(res, 'gameOver', s.gameOver);
    const ping = setInterval(() => res.write(': ping\n\n'), 15000);
    req.on('close', () => {
      clearInterval(ping);
      s.subs.delete(playerId);
      if (playerId === s.hostId) {
        s.status = 'finished';
        mpBroadcast(s, 'sessionEnded', {});
        setTimeout(() => sessions.delete(code), 30000);
      } else if (s.status === 'lobby') {
        s.players = s.players.filter((p) => p.id !== playerId);
        mpBroadcast(s, 'lobby', lobbyView(s));
      }
    });
    return;
  }

  if (!s) return sendJson(res, 404, { error: 'session inconnue' });

  if (req.method === 'GET' && parts.length === 3) return sendJson(res, 200, lobbyView(s));

  if (req.method === 'POST' && parts[3] === 'start') {
    return readBody(req).then((raw) => {
      const p = JSON.parse(raw || '{}');
      if (p.playerId !== s.hostId) return sendJson(res, 403, { error: 'hote uniquement' });
      if (s.players.length < 2) return sendJson(res, 409, { error: 'min 2 joueurs' });
      s.status = 'playing';
      mpBroadcast(s, 'start', { difficulty: s.difficulty, mode: s.mode, players: lobbyView(s).players });
      return sendJson(res, 200, { ok: true });
    }).catch((e) => sendJson(res, 400, { error: e.message }));
  }

  if (req.method === 'POST' && parts[3] === 'ready') {
    return readBody(req).then((raw) => {
      const p = JSON.parse(raw || '{}');
      const pl = s.players.find((q) => q.id === p.playerId);
      if (pl) pl.ready = !!p.ready;
      mpBroadcast(s, 'lobby', lobbyView(s));
      return sendJson(res, 200, { ok: true });
    }).catch((e) => sendJson(res, 400, { error: e.message }));
  }

  // l'hôte pousse l'état du jeu (snapshot/keyframe/kill/incident/gameOver…) → miroirs
  if (req.method === 'POST' && parts[3] === 'host') {
    return readBody(req, 256 * 1024).then((raw) => {
      const p = JSON.parse(raw || '{}');
      if (p.playerId !== s.hostId) return sendJson(res, 403, { error: 'hote uniquement' });
      if (p.type === 'keyframe') s.keyframe = p.payload;
      if (p.type === 'gameOver') { s.gameOver = p.payload; s.status = 'finished'; }
      mpBroadcast(s, p.type, p.payload, s.hostId); // aux miroirs uniquement
      return sendJson(res, 200, { ok: true });
    }).catch((e) => sendJson(res, 400, { error: e.message }));
  }

  // un miroir envoie une revendication de kill / un usage d'item → relayé à l'hôte
  if (req.method === 'POST' && (parts[3] === 'claim' || parts[3] === 'item')) {
    return readBody(req).then((raw) => {
      const p = JSON.parse(raw || '{}');
      const hostRes = s.subs.get(s.hostId);
      if (hostRes) sseSend(hostRes, parts[3], p);
      return sendJson(res, 200, { ok: true });
    }).catch((e) => sendJson(res, 400, { error: e.message }));
  }

  return sendJson(res, 404, { error: 'not found' });
}

// ---------------------------------------------------------------- Statique
function serveStatic(req, res, url) {
  let filePath = decodeURIComponent(url.pathname);
  if (filePath === '/') filePath = '/index.html';
  const resolved = path.normalize(path.join(PUBLIC_DIR, filePath));
  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); return res.end('forbidden');
  }
  fs.readFile(resolved, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(resolved)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/mp/')) return handleMp(req, res, url);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  return serveStatic(req, res, url);
});

// hygiène mémoire : purge les sessions terminées (5 min) ou abandonnées (1 h)
const mpCleanup = setInterval(() => {
  const now = Date.now();
  for (const [code, s] of sessions) {
    const doneOld = s.status === 'finished' && now - s.createdAt > 5 * 60 * 1000;
    const abandoned = s.subs.size === 0 && now - s.createdAt > 60 * 60 * 1000;
    if (doneOld || abandoned) sessions.delete(code);
  }
}, 5 * 60 * 1000);
if (mpCleanup.unref) mpCleanup.unref();

server.listen(PORT, () => {
  console.log('');
  console.log('  ████ TYPING OF THE DEV ████');
  console.log(`  Jeu        : http://localhost:${PORT}`);
  console.log(`  Leaderboard: http://localhost:${PORT}/leaderboard.html`);
  console.log(`  Admin      : http://localhost:${PORT}/admin.html`);
  console.log(`  BDD        : ${DB_FILE}`);
  console.log('');
});
