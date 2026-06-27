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
  const x = 196;
  const n = players.length;
  const span = 470, top = 176;
  return players.map((p, i) => {
    const y = n <= 1 ? GAME_H / 2 - 30 : top + i * (span / (n - 1));
    const me = p.id === localId;
    const art = scene.add.text(x, y, ASCII.player, { fontFamily: FONT, fontSize: '22px', color: p.color, align: 'center', lineSpacing: -4 }).setOrigin(0.5).setDepth(3);
    const name = scene.add.text(x, y + 36, '', { fontFamily: FONT, fontSize: '20px', color: p.color, align: 'center' }).setOrigin(0.5).setDepth(3);
    const score = scene.add.text(x, y + 60, '', { fontFamily: FONT, fontSize: '28px', color: CSS.white, align: 'center' }).setOrigin(0.5).setDepth(3);
    const pv = scene.add.text(x, y + 84, '', { fontFamily: FONT, fontSize: '15px', color: CSS.greenSoft, align: 'center' }).setOrigin(0.5).setDepth(3);
    if (me && !REDUCED_MOTION) scene.tweens.add({ targets: art, y: y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return { p, art, name, score, pv, me };
  });
}

function mpRefreshAvatars(avatars, localId) {
  if (!avatars) return;
  for (const a of avatars) {
    const p = a.p;
    const me = p.id === localId;
    a.art.setColor(p.alive ? p.color : CSS.greenDim).setAlpha(p.alive ? 1 : 0.3);
    a.name.setText(`${me ? '▶ ' : ''}${p.name}`).setColor(p.alive ? p.color : CSS.greenDim);
    a.score.setText(String(p.score)).setColor(me ? CSS.gold : CSS.white);
    a.pv.setText(p.alive ? `${T('mpLivesShort')} ${p.lives}` : T('mpDead'));
    a.pv.setColor(p.alive ? CSS.greenSoft : CSS.red);
  }
}

/* Écran de classement final, partagé par l'hôte (GameScene) et les miroirs
   (MpMirrorScene). Affiché par-dessus la scène en cours. */
function showMpResults(scene, winnerId, results, localId) {
  const cx = GAME_W / 2;
  const panel = scene.add.container(0, 0).setDepth(80);
  panel.add(scene.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x020503, 0.95));
  panel.add(scene.add.text(cx, 110, T('mpResultsTitle'), {
    fontFamily: FONT, fontSize: '64px', color: CSS.cyan,
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
