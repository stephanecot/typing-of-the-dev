/* Scène MIROIR (joueurs non-hôtes) : ne SIMULE rien. Elle dessine les ennemis
   d'après l'état poussé par l'hôte (spawn/snapshot/keyframe), capture la frappe
   locale et envoie une revendication (claim) à chaque mot fini. Les positions
   sont extrapolées entre deux snapshots (déplacement linéaire). */
'use strict';

class MpMirrorScene extends Phaser.Scene {
  constructor() { super('MpMirror'); }

  init(data) {
    this.net = data.net;
    this.diff = data.difficulty || DIFFICULTIES[1];
    this.mode = data.mode || 'inf';
    this.infinite = this.mode === 'inf';
    this.maxSprints = this.mode === '10' ? 10 : 5;
    this.localId = data.localId;
    this.roster = data.players || [];
    this.players = this.roster.map((p) => ({ id: p.id, name: p.name, color: p.color, score: 0, lives: this.diff.lives, alive: true, combo: 0 }));
    this.localPlayer = this.players.find((p) => p.id === this.localId) || this.players[0];
    this.enemies = [];
    this.eMap = new Map();
    this.target = null;
    this.wave = 1;
    this.over = false;
    this.bombs = 1;   // KILL-9 (ENTRÉE) : demande à l'hôte de tuer le plus proche
    this.lasers = 1;  // AUTOCOMPLETE (EFFACER) : aide de frappe locale
  }

  create() {
    this.cameras.main.setBackgroundColor('#050a07');
    if (REDUCED_MOTION) this.cameras.main.shake = () => this.cameras.main;
    this.buildDecor();
    this.buildHud();
    this.avatars = mpBuildAvatars(this, this.players, this.localId);
    this.localAvatar = this.avatars.find((a) => a.me) || this.avatars[0]; // origine de la ligne de visée
    mpRefreshAvatars(this.avatars, this.localId);
    this.flashRect = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0xff3b3b, 0).setDepth(50);
    this.redSparks = this.add.particles(0, 0, 'px', { lifespan: 500, speed: { min: 60, max: 260 }, scale: { start: 2, end: 0 }, tint: PALETTE.red, emitting: false }).setDepth(36);

    this.keyHandler = (e) => this.onKey(e);
    this.input.keyboard.on('keydown', this.keyHandler);
    this.events.on('shutdown', () => this.input.keyboard.off('keydown', this.keyHandler));

    // écoute réseau (on oublie d'abord les handlers du lobby)
    this.net.clearHandlers();
    this.net.on('spawn', (w) => this.makeEnemy(w));
    this.net.on('snapshot', (s) => this.onSnapshot(s));
    this.net.on('keyframe', (k) => this.onKeyframe(k));
    this.net.on('kill', (k) => this.onKill(k));
    this.net.on('incident', (k) => this.onIncident(k));
    this.net.on('wave', (w) => { this.wave = w.n; this.hudWave.setText(this.waveLabel(w.n)); });
    this.net.on('boss', (b) => this.showBossBanner(b));
    this.net.on('bosscmd', (b) => this.onBossCmd(b));
    this.net.on('gameOver', (g) => this.onGameOver(g));
    this.net.on('sessionEnded', () => this.onSessionEnded());

    Music.start(1);
    this.cameras.main.fadeIn(350, 5, 10, 7);
  }

  // ---- décor minimal (PROD à gauche, joueur, ligne de front)
  buildDecor() {
    const g = this.add.graphics().setDepth(-3);
    g.fillGradientStyle(0x0a1a10, 0x0a1a10, 0x02050a, 0x02050a, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
    g.fillStyle(0x0a2e33, 0.30); g.fillEllipse(PROD_X + 30, GAME_H / 2, 420, 620);
    this.prodArt = this.add.text(PROD_X, GAME_H / 2, ASCII.prod, {
      fontFamily: FONT, fontSize: '22px', color: CSS.cyan, align: 'center', lineSpacing: -4,
    }).setOrigin(0.5).setDepth(2);
    this.lockLine = this.add.graphics().setDepth(3);
  }

  buildHud() {
    this.hudWave = this.add.text(GAME_W / 2, 22, this.waveLabel(1), { fontFamily: FONT, fontSize: '30px', color: CSS.white }).setOrigin(0.5).setDepth(40);
    this.add.text(GAME_W / 2, 58, T('mpMirrorTag'), { fontFamily: FONT, fontSize: '20px', color: CSS.greenSoft }).setOrigin(0.5).setDepth(40);
    this.hudItems = this.add.text(24, 16, '', { fontFamily: FONT, fontSize: '24px', color: CSS.gold }).setDepth(40);
    this.refreshItems();
  }

  refreshItems() {
    if (this.hudItems) this.hudItems.setText(T('hudItems')(this.bombs, this.lasers));
  }

  waveLabel(n) { return this.infinite ? `SPRINT ${n} ∞` : `SPRINT ${n}/${this.maxSprints}`; }

  refreshScoreboard() { mpRefreshAvatars(this.avatars, this.localId); }

  // ---- ennemis (création / rendu d'après le réseau)
  makeEnemy(w) {
    if (this.eMap.has(w.id) || this.over) return;
    const c = this.add.container(w.x, w.y);
    const art = this.add.text(0, 0, pickArt(w.artKind, w.techName), {
      fontFamily: FONT, fontSize: `${w.artSize}px`, color: w.color, align: 'center', lineSpacing: -3,
    }).setOrigin(0.5, 1);
    const ly = w.boss ? 12 : 8;
    const typed = this.add.text(0, ly, '', { fontFamily: FONT, fontSize: '30px', color: CSS.amber }).setOrigin(0, 0);
    const rest = this.add.text(0, ly, '', { fontFamily: FONT, fontSize: '30px', color: w.cls === 'powerup' ? CSS.gold : CSS.white }).setOrigin(0, 0);
    if (w.flipped) rest.setFlipY(true);
    c.add([art, typed, rest]);
    let nameT = null, hpT = null;
    if (w.boss) {
      nameT = this.add.text(0, -art.height - 36, w.name || 'BOSS', { fontFamily: FONT, fontSize: '26px', color: CSS.red }).setOrigin(0.5);
      hpT = this.add.text(0, -art.height - 10, '', { fontFamily: FONT, fontSize: '24px', color: CSS.amber }).setOrigin(0.5);
      c.add([nameT, hpT]);
    }
    const e = {
      id: w.id, kind: w.kind, label: w.label, color: w.color, speed: w.speed || 40,
      masked: w.masked ? new Set(w.masked) : null, flipped: w.flipped,
      boss: !!w.boss, name: w.name, cmdIndex: w.cmdIndex || 0, cmdTotal: w.cmdTotal || 1, hpT,
      x: w.x, y: w.y, serverX: w.x, container: c, art, typed, rest, progress: 0,
    };
    this.eMap.set(w.id, e);
    this.enemies.push(e);
    this.drawLabel(e);
    if (e.boss) this.drawBossHp(e);
    return e;
  }

  drawLabel(e) {
    let disp = '';
    for (let i = 0; i < e.label.length; i++) disp += (e.masked && e.masked.has(i)) ? '?' : e.label[i];
    e.typed.setText(disp.slice(0, e.progress));
    e.rest.setText(disp.slice(e.progress));
    const total = e.typed.width + e.rest.width;
    e.typed.x = -total / 2;
    e.rest.x = e.typed.x + e.typed.width;
  }

  drawBossHp(e) {
    if (!e.hpT) return;
    const left = e.cmdTotal - e.cmdIndex;
    e.hpT.setText('HP ' + '▓'.repeat(Math.max(0, left)) + '░'.repeat(Math.max(0, e.cmdTotal - left)));
  }

  removeEnemy(id) {
    const e = this.eMap.get(id);
    if (!e) return;
    if (this.target === e) { this.target = null; this.lockLine.clear(); }
    e.container.destroy();
    this.eMap.delete(id);
    Phaser.Utils.Array.Remove(this.enemies, e);
  }

  // ---- réseau entrant
  onSnapshot(s) {
    for (const [id, x, y] of s.e) {
      const e = this.eMap.get(id);
      if (e) { e.serverX = x; e.y = y; }
    }
    for (const [id, score, lives, alive, combo] of s.p) {
      const p = this.players.find((q) => q.id === id);
      if (p) { p.score = score; p.lives = lives; p.alive = !!alive; p.combo = combo; }
    }
    this.refreshScoreboard();
  }

  onKeyframe(k) {
    this.wave = k.wave;
    const seen = new Set();
    for (const w of k.e) {
      seen.add(w.id);
      const e = this.eMap.get(w.id);
      if (!e) { this.makeEnemy(w); }
      else if (e.label !== w.label) { e.label = w.label; e.masked = w.masked ? new Set(w.masked) : null; this.drawLabel(e); }
    }
    // retire les ennemis que l'hôte ne connaît plus (kill manqué)
    for (const e of [...this.enemies]) if (!seen.has(e.id)) this.removeEnemy(e.id);
    if (k.p) for (const pp of k.p) { const p = this.players.find((q) => q.id === pp.id); if (p) Object.assign(p, pp); }
    this.refreshScoreboard();
  }

  onKill(k) {
    const e = this.eMap.get(k.id);
    if (e) {
      this.redSparks; // (réservé)
      this.scorePop(e.container.x, e.container.y - 40, `+${k.pts}`, k.byId === this.localId ? CSS.gold : CSS.greenSoft);
      Sfx.kill();
    }
    this.removeEnemy(k.id);
  }

  onIncident(k) {
    Sfx.incident();
    this.cameras.main.shake(300, 0.009);
    this.redSparks.explode(50, PROD_X + 80, k.fy || GAME_H / 2);
    this.flashRect.setAlpha(0.35);
    this.tweens.add({ targets: this.flashRect, alpha: 0, duration: 450 });
    this.removeEnemy(k.id);
  }

  showBossBanner(b) {
    const t = this.add.text(GAME_W / 2, GAME_H / 2 - 60, `! ${b.name} !`, {
      fontFamily: FONT, fontSize: '56px', color: CSS.red, align: 'center',
    }).setOrigin(0.5).setDepth(45);
    this.tweens.add({ targets: t, alpha: 0, duration: 1600, delay: 600, onComplete: () => t.destroy() });
  }

  onBossCmd(b) {
    const e = this.eMap.get(b.id);
    if (!e) return;
    e.label = b.label; e.cmdIndex = b.cmdIndex; e.cmdTotal = b.cmdTotal; e.progress = 0; e.masked = null;
    this.drawLabel(e);
    this.drawBossHp(e);
    this.scorePop(e.container.x, e.container.y - 120, `+${b.pts}`, b.byId === this.localId ? CSS.gold : CSS.amber);
    if (this.target === e) { this.target = null; this.lockLine.clear(); } // commande passée → relock
  }

  scorePop(x, y, txt, color) {
    const t = this.add.text(x, y, txt, { fontFamily: FONT, fontSize: '28px', color }).setOrigin(0.5).setDepth(45);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  onGameOver(g) {
    if (this.over) return;
    this.over = true;
    this.input.keyboard.off('keydown', this.keyHandler);
    this.enemies.forEach((e) => e.container.destroy());
    this.enemies = []; this.eMap.clear();
    Music.stop();
    showMpResults(this, g.winnerId, g.results, this.localId, g.won);
  }

  onSessionEnded() {
    if (this.over) return;
    this.over = true;
    this.add.text(GAME_W / 2, GAME_H / 2, T('mpHostLeft'), {
      fontFamily: FONT, fontSize: '40px', color: CSS.red, align: 'center',
    }).setOrigin(0.5).setDepth(80);
    this.input.keyboard.on('keydown', () => { Mp.close(); window.location.href = '/mp.html'; });
  }

  // ---- frappe locale : on revendique le mot, l'hôte tranche
  onKey(e) {
    if (this.over) return;
    Sfx.ensure();
    const k = e.key;
    if (k === 'Enter') { e.preventDefault(); this.useBomb(); return; }
    if (k === 'Backspace') { e.preventDefault(); this.useLaser(); return; }
    if (k.length !== 1) return; // ignore Maj/Tab/etc.
    if (!this.target) {
      // verrouille l'ennemi le plus avancé dont la 1re lettre correspond
      const cands = this.enemies
        .filter((en) => this.firstChar(en) && this.firstChar(en).toLowerCase() === k.toLowerCase())
        .sort((a, b) => a.container.x - b.container.x);
      if (!cands.length) { Sfx.blip(6); return; }
      this.target = cands[0];
      this.target.progress = 0;
      this.target.lockAt = this.time.now;
      this.advance(this.target, k);
      return;
    }
    this.advance(this.target, k);
  }

  /* KILL-9 : on demande à l'hôte de tuer le process le plus proche (il crédite
     ce joueur et diffuse le kill). Le décompte local est purement indicatif. */
  useBomb() {
    if (this.bombs <= 0) { Sfx.error(); return; }
    if (!this.enemies.some((en) => !en.boss)) { Sfx.error(); return; }
    this.bombs--;
    Sfx.bomb();
    this.net.useItem('bomb');
    this.scorePop(PLAYER_X + 160, GAME_H / 2 - 90, T('bombSent'), CSS.gold);
    this.refreshItems();
  }

  /* AUTOCOMPLETE : aide de frappe 100 % locale (complète 4 lettres de la cible),
     puis revendique si le mot est fini. */
  useLaser() {
    const t = this.target;
    if (this.lasers <= 0 || !t) { Sfx.error(); return; }
    this.lasers--;
    Sfx.laser();
    t.progress = Math.min(t.progress + 4, t.label.length);
    this.drawLabel(t);
    this.refreshItems();
    if (t.progress >= t.label.length) {
      const dur = Math.round(this.time.now - (t.lockAt || this.time.now));
      this.net.claim(t.id, dur, t.boss ? t.cmdIndex : undefined);
      if (!t.boss) { this.target = null; this.lockLine.clear(); }
      else { t.progress = 0; this.drawLabel(t); }
    }
  }

  firstChar(e) { let i = 0; while (e.label[i] === ' ') i++; return e.label[i]; }

  advance(e, k) {
    // saute les espaces facultatifs
    while (e.label[e.progress] === ' ') e.progress++;
    if (e.label[e.progress] && e.label[e.progress].toLowerCase() === k.toLowerCase()) {
      e.progress++;
      this.drawLabel(e);
      if (e.progress >= e.label.length) {
        // mot/commande fini → revendication (l'hôte crédite le plus rapide ;
        // pour un boss, on précise la commande pour rejeter les coups périmés)
        const dur = Math.round(this.time.now - (e.lockAt || this.time.now));
        this.net.claim(e.id, dur, e.boss ? e.cmdIndex : undefined);
        if (!e.boss) { this.target = null; this.lockLine.clear(); }
        else { e.progress = 0; this.drawLabel(e); } // boss : on garde la cible, l'hôte confirmera via bosscmd
      }
    } else {
      Sfx.error();
      this.localPlayer.combo = 0;
    }
  }

  update(time, delta) {
    if (this.over) return;
    const dt = Math.min(delta, 100) / 1000;
    for (const e of this.enemies) {
      e.x -= e.speed * dt;                       // extrapolation linéaire
      e.x += (e.serverX - e.x) * 0.15;           // correction douce vers le serveur
      e.container.x = e.x;
      e.container.y = e.y;
    }
    // ligne de visée
    this.lockLine.clear();
    if (this.target && this.target.container.active) {
      const t = this.target;
      // la ligne part de l'avatar du joueur LOCAL (et non du centre de l'écran)
      const ox = this.localAvatar.art.x + 30;
      const oy = this.localAvatar.art.y;
      this.lockLine.lineStyle(2, PALETTE.amber, 0.7);
      this.lockLine.lineBetween(ox, oy, t.container.x, t.container.y);
    }
  }
}
