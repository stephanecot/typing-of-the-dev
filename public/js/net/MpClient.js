/* Client réseau multijoueur — transport uniquement (aucune logique de jeu).
   Serveur → client : SSE (EventSource). Client → serveur : POST.
   Tolérant comme Api : en cas d'échec on log, le jeu ne crashe pas. */
'use strict';

class MpClient {
  constructor() {
    this.code = null;
    this.playerId = null;
    this.color = null;
    this.isHost = false;
    this.es = null;
    this.handlers = {};
  }

  async _post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  // fire-and-forget : on n'attend pas la réponse (snapshots ~12 Hz, claims…)
  _send(path, body) {
    fetch(path, {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    }).catch(() => {});
  }

  async create(opts) {
    const d = await this._post('/api/mp/create', opts);
    this.code = d.code; this.playerId = d.playerId; this.color = d.color; this.isHost = true;
    return d;
  }

  async join(opts) {
    const d = await this._post('/api/mp/join', opts);
    this.code = d.code; this.playerId = d.playerId; this.color = d.color; this.isHost = false;
    return d;
  }

  connect() {
    if (!this.code || !this.playerId || this.es) return;
    this.es = new EventSource(`/api/mp/${this.code}/events?playerId=${this.playerId}`);
    const types = ['lobby', 'start', 'snapshot', 'keyframe', 'kill', 'incident',
      'wave', 'boss', 'powerup', 'playerEliminated', 'gameOver', 'sessionEnded',
      'claim', 'item'];
    for (const t of types) {
      this.es.addEventListener(t, (ev) => {
        let data = {};
        try { data = JSON.parse(ev.data); } catch { /* ping/commentaire */ }
        this._emit(t, data);
      });
    }
  }

  on(type, cb) { (this.handlers[type] = this.handlers[type] || []).push(cb); return this; }
  _emit(type, data) { (this.handlers[type] || []).forEach((cb) => cb(data)); }
  // au changement de scène : on repart de zéro pour ne pas garder les handlers
  // de la scène précédente (sinon une reconnexion SSE relancerait le lobby)
  clearHandlers() { this.handlers = {}; }

  start() { return this._post(`/api/mp/${this.code}/start`, { playerId: this.playerId }); }
  setReady(v) { return this._post(`/api/mp/${this.code}/ready`, { playerId: this.playerId, ready: !!v }); }

  // hôte → serveur → miroirs
  push(type, payload) { this._send(`/api/mp/${this.code}/host`, { playerId: this.playerId, type, payload }); }
  // miroir → serveur → hôte
  claim(enemyId, dur, cmdIndex) { this._send(`/api/mp/${this.code}/claim`, { playerId: this.playerId, enemyId, dur, cmdIndex }); }
  useItem(item, targetId) { this._send(`/api/mp/${this.code}/item`, { playerId: this.playerId, item, targetId }); }

  close() { if (this.es) { this.es.close(); this.es = null; } }

  shareUrl() {
    return `${location.origin}/mp.html?s=${this.code}`;
  }
}

const Mp = new MpClient();

/* Avatars des joueurs CÔTE À CÔTE près de la PROD : un personnage par joueur,
   dans sa couleur, avec pseudo + SCORE (en évidence) + PV (en petit). Partagé
   par l'hôte (GameScene) et les miroirs (MpMirrorScene). */
function mpBuildAvatars(scene, players, localId) {
  const x = 190;
  const n = players.length;
  const span = 480, top = 166;
  return players.map((p, i) => {
    const y = n <= 1 ? GAME_H / 2 - 40 : top + i * (span / (n - 1));
    const me = p.id === localId;
    const art = scene.add.text(x, y, ASCII.player, { fontFamily: FONT, fontSize: '20px', color: p.color, align: 'center', lineSpacing: -4 }).setOrigin(0.5, 0.5).setDepth(3);
    const baseY = y + art.height / 2;  // bas de l'avatar (espace l'avatar du pseudo)
    const name = scene.add.text(x, baseY + 14, '', { fontFamily: FONT, fontSize: '20px', color: p.color, align: 'center' }).setOrigin(0.5, 0).setDepth(3);
    const score = scene.add.text(x, baseY + 38, '', { fontFamily: FONT, fontSize: '26px', color: CSS.white, align: 'center' }).setOrigin(0.5, 0).setDepth(3);
    const pips = scene.add.container(x, baseY + 74).setDepth(3); // vies = carrés (plus lisibles)
    return { p, scene, art, name, score, pips, me, lastLives: -1, lastAlive: null };
  });
}

function mpRefreshAvatars(avatars, localId) {
  if (!avatars) return;
  for (const a of avatars) {
    const p = a.p;
    const me = p.id === localId;
    a.art.setColor(p.alive ? p.color : CSS.greenDim).setAlpha(p.alive ? 1 : 0.35);
    a.name.setText(`${me ? '▶ ' : ''}${p.name}`).setColor(p.alive ? p.color : CSS.greenDim);
    a.score.setText(String(p.score)).setColor(me ? CSS.gold : CSS.white);
    // pastilles de vie en CARRÉS (comme en solo), reconstruites seulement quand ça change
    if (a.lastLives !== p.lives || a.lastAlive !== p.alive) {
      a.lastLives = p.lives; a.lastAlive = p.alive;
      a.pips.removeAll(true);
      if (!p.alive) {
        a.pips.add(a.scene.add.text(0, 0, T('mpDead'), { fontFamily: FONT, fontSize: '18px', color: CSS.red }).setOrigin(0.5));
      } else {
        const max = Math.min(p.lives, 8);
        const tint = Phaser.Display.Color.HexStringToColor(p.color).color;
        const sx = -((max - 1) * 17) / 2;
        for (let k = 0; k < max; k++) {
          a.pips.add(a.scene.add.rectangle(sx + k * 17, 0, 14, 14, tint).setStrokeStyle(2, 0x0a1a10));
        }
        if (p.lives > 8) a.pips.add(a.scene.add.text(sx + max * 17 + 4, 0, '+', { fontFamily: FONT, fontSize: '18px', color: p.color }).setOrigin(0, 0.5));
      }
    }
  }
}

/* Écran de classement final, partagé par l'hôte (GameScene) et les miroirs
   (MpMirrorScene). Affiché par-dessus la scène en cours. */
function showMpResults(scene, winnerId, results, localId, won) {
  const cx = GAME_W / 2;
  const panel = scene.add.container(0, 0).setDepth(80);
  panel.add(scene.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x020503, 0.95));
  panel.add(scene.add.text(cx, 110, won ? T('mpResultsWon') : T('mpResultsTitle'), {
    fontFamily: FONT, fontSize: '64px', color: won ? CSS.green : CSS.cyan,
  }).setOrigin(0.5));
  const winner = (results || []).find((r) => r.id === winnerId);
  if (winner) {
    panel.add(scene.add.text(cx, 190, T('mpWinner')(winner.name), {
      fontFamily: FONT, fontSize: '40px', color: CSS.gold,
    }).setOrigin(0.5));
  }
  (results || []).forEach((r, i) => {
    const me = r.id === localId;
    const row = `${i + 1}.  ${String(r.name).slice(0, 14).padEnd(14)} ${String(r.score).padStart(7)}   ${r.wpm} wpm`;
    panel.add(scene.add.text(cx, 290 + i * 56, `${me ? '▶ ' : '   '}${row}`, {
      fontFamily: FONT, fontSize: '32px', color: i === 0 ? CSS.gold : (me ? CSS.white : r.color),
    }).setOrigin(0.5));
  });
  const hint = scene.add.text(cx, GAME_H - 80, T('mpResultsHint'), {
    fontFamily: FONT, fontSize: '28px', color: CSS.green,
  }).setOrigin(0.5);
  panel.add(hint);
  if (!REDUCED_MOTION) scene.tweens.add({ targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
  scene.input.keyboard.removeAllListeners('keydown');
  scene.input.keyboard.on('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { Mp.close(); window.location.href = '/mp.html'; }
  });
}
