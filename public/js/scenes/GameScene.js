/* Scène de jeu principale.
   Mécanique façon ZType / Typing of the Dead : taper la 1re lettre verrouille
   l'ennemi correspondant le plus proche de la prod ; finir son mot le tue.
   Les ennemis avancent de droite à gauche vers le serveur PROD. */
'use strict';

const PLAYER_X = 190;
const PROD_X = 95;
const SPAWN_X = GAME_W + 80;
const LANE_TOP = 130;
const LANE_BOTTOM = GAME_H - 90;

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.diff = data.difficulty || DIFFICULTIES[1];
    this.enemies = [];
    this.target = null;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lives = this.diff.lives;
    this.wave = 0;
    this.spawnQueue = [];
    this.boss = null;
    this.bossPending = false;
    this.timeScale = 1;
    this.over = false;
    this.paused = false;
    this.stats = {
      typedOK: 0, errors: 0, startTime: 0,
      kills: { bug: 0, legacy: 0, deadline: 0, boss: 0, powerup: 0 },
      missedWords: [],
    };
  }

  create() {
    this.stats.startTime = this.time.now;
    this.buildDecor();
    this.buildHud();
    this.buildEmitters();

    this.keyHandler = (e) => this.onKey(e);
    this.input.keyboard.on('keydown', this.keyHandler);
    this.events.on('shutdown', () => this.input.keyboard.off('keydown', this.keyHandler));

    Music.start(1);
    this.nextWave();
    // power-up indépendant des vagues, à partir de la vague 2
    this.time.addEvent({
      delay: 30000, loop: true, startAt: 0,
      callback: () => { if (this.wave >= 2 && !this.over) this.spawnPowerup(); },
    });
    this.cameras.main.fadeIn(350, 5, 10, 7);
  }

  // ------------------------------------------------------------ décor & HUD
  buildDecor() {
    // pluie de caractères en fond, très discrète
    this.bgGlyphs = [];
    for (let i = 0; i < 26; i++) {
      const t = this.add.text(
        Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(0, GAME_H),
        Phaser.Utils.Array.GetRandom(['0', '1', ';', '{', '}', '$', '#', '>', '/']),
        { fontFamily: FONT, fontSize: '22px', color: CSS.greenDim }
      ).setAlpha(0.16);
      t.fall = Phaser.Math.FloatBetween(12, 45);
      this.bgGlyphs.push(t);
    }

    // serveur PROD + dev à défendre
    this.add.text(PROD_X, GAME_H / 2, ASCII.prod, {
      fontFamily: FONT, fontSize: '24px', color: CSS.cyan, align: 'center', lineSpacing: -4,
    }).setOrigin(0.5).setAlpha(0.95);
    this.player = this.add.text(PLAYER_X, GAME_H / 2 + 150, ASCII.player, {
      fontFamily: FONT, fontSize: '22px', color: CSS.green, align: 'center', lineSpacing: -4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.player, y: '+=8', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // ligne de danger
    const danger = this.add.graphics();
    danger.lineStyle(2, PALETTE.red, 0.25);
    danger.lineBetween(PROD_X + 75, LANE_TOP - 40, PROD_X + 75, LANE_BOTTOM + 40);

    this.lockLine = this.add.graphics();
    this.flashRect = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0xff2222, 0)
      .setDepth(50);
  }

  buildHud() {
    const styleSm = { fontFamily: FONT, fontSize: '28px', color: CSS.green };
    this.hudScore = this.add.text(24, 16, '', styleSm).setDepth(40);
    this.hudCombo = this.add.text(24, 50, '', { ...styleSm, color: CSS.amber }).setDepth(40);
    this.hudWave = this.add.text(GAME_W / 2, 28, '', {
      fontFamily: FONT, fontSize: '32px', color: CSS.white,
    }).setOrigin(0.5, 0.5).setDepth(40);
    this.hudDiff = this.add.text(GAME_W - 24, 16, this.diff.label, {
      fontFamily: FONT, fontSize: '26px', color: CSS.magenta,
    }).setOrigin(1, 0).setDepth(40);
    this.hudProd = this.add.text(GAME_W - 24, 50, '', styleSm).setOrigin(1, 0).setDepth(40);
    this.banner = this.add.text(GAME_W / 2, GAME_H / 2 - 60, '', {
      fontFamily: FONT, fontSize: '64px', color: CSS.amber, align: 'center',
    }).setOrigin(0.5).setDepth(45).setAlpha(0);
    this.buildPauseOverlay();
    this.refreshHud();
  }

  buildPauseOverlay() {
    const cx = GAME_W / 2;
    this.pauseOverlay = this.add.container(0, 0).setDepth(100).setVisible(false);
    this.pauseOverlay.add([
      this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x020503, 0.86),
      this.add.text(cx, GAME_H / 2 - 130, '|| PAUSE ||', {
        fontFamily: FONT, fontSize: '96px', color: CSS.amber,
      }).setOrigin(0.5),
      this.add.text(cx, GAME_H / 2 - 50, 'les bugs attendent patiemment...', {
        fontFamily: FONT, fontSize: '26px', color: CSS.greenDim,
      }).setOrigin(0.5),
      this.add.text(cx, GAME_H / 2 + 60, '[ ÉCHAP ou ENTRÉE : reprendre ]', {
        fontFamily: FONT, fontSize: '36px', color: CSS.green,
      }).setOrigin(0.5),
      this.add.text(cx, GAME_H / 2 + 120, '[ Q : quitter la partie — score non sauvegardé ]', {
        fontFamily: FONT, fontSize: '30px', color: CSS.red,
      }).setOrigin(0.5),
    ]);
  }

  togglePause() {
    if (this.over) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.time.paused = true;       // gèle spawns, power-ups, banners
      this.tweens.pauseAll();
      Music.stop();
      this.pauseOverlay.setVisible(true);
    } else {
      this.time.paused = false;
      this.tweens.resumeAll();
      Music.start(1);
      Music.setIntensity(this.boss ? 4 : Math.min(3, 1 + Math.floor(this.wave / 3)));
      this.pauseOverlay.setVisible(false);
      Sfx.blip(10);
    }
  }

  quitToMenu() {
    Music.stop();
    this.scene.start('Menu');
  }

  refreshHud() {
    this.hudScore.setText(`SCORE ${this.score}`);
    const mult = this.multiplier();
    this.hudCombo.setText(this.combo > 1 ? `COMBO x${this.combo}  (×${mult})` : '');
    this.hudWave.setText(`SPRINT ${this.wave}`);
    const blocks = '█'.repeat(this.lives) + '░'.repeat(Math.max(0, this.diff.lives - this.lives));
    const pct = Math.round((this.lives / this.diff.lives) * 100);
    this.hudProd.setText(`PROD [${blocks}] ${pct}%`);
    this.hudProd.setColor(this.lives <= 1 ? CSS.red : pct < 70 ? CSS.amber : CSS.green);
  }

  buildEmitters() {
    this.sparks = this.add.particles(0, 0, 'px', {
      speed: { min: 90, max: 420 }, lifespan: 550, scale: { start: 1.8, end: 0 },
      tint: [PALETTE.green, PALETTE.amber, PALETTE.white], emitting: false,
    }).setDepth(30);
    this.redSparks = this.add.particles(0, 0, 'px', {
      speed: { min: 120, max: 500 }, lifespan: 700, scale: { start: 2.2, end: 0 },
      tint: [PALETTE.red, 0xff8855], emitting: false,
    }).setDepth(30);
  }

  multiplier() { return (1 + Math.floor(this.combo / 5)) * this.diff.scoreMult; }

  // ------------------------------------------------------------ vagues
  nextWave() {
    if (this.over) return;
    this.wave++;
    Music.setIntensity(Math.min(3, 1 + Math.floor(this.wave / 3)));
    this.refreshHud();

    const isBossWave = this.wave % 4 === 0;
    this.showBanner(isBossWave
      ? `SPRINT ${this.wave}\n!! INCIDENT MAJEUR DÉTECTÉ !!`
      : `SPRINT ${this.wave}\ndéploiement des bugs...`);

    this.spawnQueue = this.buildWaveQueue(this.wave, isBossWave);
    this.time.delayedCall(1800, () => this.scheduleSpawn());
    if (isBossWave) {
      // empêche checkWaveEnd de passer à la vague suivante si les sbires
      // meurent avant l'apparition (différée) du boss
      this.bossPending = true;
      this.time.delayedCall(2400, () => this.spawnBoss());
    }
  }

  buildWaveQueue(n, bossWave) {
    const q = [];
    const bugCount = bossWave ? 3 : Math.min(4 + n, 14);
    for (let i = 0; i < bugCount; i++) q.push('bug');
    if (!bossWave) {
      if (n >= 2) for (let i = 0; i < Math.min(1 + Math.floor(n / 2), 6); i++) q.push('legacy');
      if (n >= this.diff.deadlineWave) for (let i = 0; i < Math.min(Math.floor(n / 2), 7); i++) q.push('deadline');
      if (n >= this.diff.eliteWave) for (let i = 0; i < Math.min(Math.floor(n / 3) + 1, 4); i++) q.push('elite');
    }
    return Phaser.Utils.Array.Shuffle(q);
  }

  scheduleSpawn() {
    if (this.over || !this.spawnQueue.length) return;
    this.spawnEnemy(this.spawnQueue.shift());
    const delay = this.diff.spawnMs * Phaser.Math.FloatBetween(0.75, 1.25)
      * Math.max(0.55, 1 - this.wave * 0.03);
    this.time.delayedCall(delay, () => this.scheduleSpawn());
  }

  showBanner(text) {
    this.banner.setText(text).setAlpha(0);
    this.tweens.add({
      targets: this.banner, alpha: 1, duration: 250, yoyo: true, hold: 1300,
    });
  }

  // ------------------------------------------------------------ ennemis
  labelFor(kind) {
    const ex = new Set(this.enemies.map((e) => e.label));
    const opts = { maxLen: this.diff.maxLen, exclude: ex };
    switch (kind) {
      case 'bug': return pickWord(WORDS.keywords, opts);
      case 'elite': return pickWord(WORDS.exceptions, { exclude: ex, maxLen: this.diff.maxLen + 8 });
      case 'legacy': return Math.random() < 0.55
        ? pickWord(WORDS.snippets, opts) : pickWord(WORDS.legacyNames, opts);
      case 'deadline': return pickWord(WORDS.deadlines, opts);
      default: return pickWord(WORDS.keywords, opts);
    }
  }

  spawnEnemy(kind) {
    const conf = {
      bug: { color: CSS.green, tint: PALETTE.green, speed: 42, art: 'bug', cls: 'bug', size: 18, level: 1 },
      deadline: { color: CSS.magenta, tint: PALETTE.magenta, speed: 75, art: 'deadline', cls: 'deadline', size: 17, level: 2 },
      legacy: { color: CSS.amber, tint: PALETTE.amber, speed: 26, art: 'legacy', cls: 'legacy', size: 18, level: 2 },
      elite: { color: CSS.green, tint: PALETTE.green, speed: 34, art: 'bug', cls: 'bug', size: 22, level: 3 },
    }[kind];
    const label = this.labelFor(kind);
    const techName = conf.art === 'legacy' ? label : null;
    this.addEnemy({
      kind, cls: conf.cls, label, level: conf.level,
      x: SPAWN_X, y: Phaser.Math.Between(LANE_TOP, LANE_BOTTOM),
      speed: conf.speed * this.diff.speed * (1 + this.wave * 0.04) * Phaser.Math.FloatBetween(0.9, 1.1),
      color: conf.color, artKind: conf.art, techName, artSize: conf.size,
    });
  }

  spawnPowerup() {
    if (this.enemies.some((e) => e.cls === 'powerup')) return;
    const types = [
      { effect: 'slowmo', label: WORDS.powerups.slowmo },
      { effect: 'knockback', label: WORDS.powerups.knockback },
      { effect: 'nuke', label: WORDS.powerups.nuke },
    ];
    const t = Phaser.Utils.Array.GetRandom(types);
    this.addEnemy({
      kind: 'powerup', cls: 'powerup', label: t.label, effect: t.effect,
      x: SPAWN_X, y: Phaser.Math.Between(LANE_TOP, LANE_BOTTOM),
      speed: 95 * this.diff.speed, color: CSS.gold, artKind: 'powerup', artSize: 18,
    });
  }

  addEnemy(spec) {
    const c = this.add.container(spec.x, spec.y);
    const art = this.add.text(0, 0, pickArt(spec.artKind, spec.techName), {
      fontFamily: FONT, fontSize: `${spec.artSize}px`, color: spec.color,
      align: 'center', lineSpacing: -3,
    }).setOrigin(0.5, 1);
    if (spec.level) {
      const lvlColor = [CSS.greenDim, CSS.amber, CSS.red][spec.level - 1] || CSS.red;
      c.add(this.add.text(0, -art.height - 16, `niv.${spec.level} ${'▲'.repeat(spec.level)}`, {
        fontFamily: FONT, fontSize: '19px', color: lvlColor,
      }).setOrigin(0.5));
    }
    const typed = this.add.text(0, 8, '', {
      fontFamily: FONT, fontSize: '30px', color: CSS.amber,
    }).setOrigin(0, 0);
    const rest = this.add.text(0, 8, spec.label, {
      fontFamily: FONT, fontSize: '30px', color: spec.cls === 'powerup' ? CSS.gold : CSS.white,
    }).setOrigin(0, 0);
    c.add([art, typed, rest]);

    const e = {
      ...spec, container: c, art, typedText: typed, restText: rest,
      progress: 0, baseY: spec.y, phase: Math.random() * Math.PI * 2,
      glitchAt: this.time.now + Phaser.Math.Between(800, 3000),
    };
    this.layoutLabel(e);
    this.enemies.push(e);
    return e;
  }

  layoutLabel(e) {
    const tw = e.typedText.width;
    const total = tw + e.restText.width;
    e.typedText.setX(-total / 2);
    e.restText.setX(-total / 2 + tw);
  }

  // ------------------------------------------------------------ boss
  spawnBoss() {
    if (this.over) return;
    this.bossPending = false;
    Sfx.bossSpawn();
    Music.setIntensity(4);
    this.cameras.main.shake(500, 0.006);
    const cmds = [];
    const used = new Set();
    for (let i = 0; i < this.diff.bossCmds; i++) {
      const c = pickWord(WORDS.commands, { exclude: used });
      used.add(c);
      cmds.push(c);
    }
    const c = this.add.container(SPAWN_X + 100, GAME_H / 2);
    const art = this.add.text(0, 0, ASCII.boss[0], {
      fontFamily: FONT, fontSize: '30px', color: CSS.red, align: 'center', lineSpacing: -4,
    }).setOrigin(0.5, 1);
    const name = this.add.text(0, -art.height - 36, 'INCIDENT PROD MAJEUR', {
      fontFamily: FONT, fontSize: '26px', color: CSS.red,
    }).setOrigin(0.5);
    const hp = this.add.text(0, -art.height - 10, '', {
      fontFamily: FONT, fontSize: '24px', color: CSS.amber,
    }).setOrigin(0.5);
    const typed = this.add.text(0, 12, '', { fontFamily: FONT, fontSize: '32px', color: CSS.amber }).setOrigin(0, 0);
    const rest = this.add.text(0, 12, cmds[0], { fontFamily: FONT, fontSize: '32px', color: CSS.white }).setOrigin(0, 0);
    c.add([name, hp, art, typed, rest]);

    this.boss = {
      kind: 'boss', cls: 'boss', container: c, art, typedText: typed, restText: rest,
      hpText: hp, cmds, cmdIndex: 0, label: cmds[0], progress: 0,
      x: SPAWN_X + 100, y: GAME_H / 2, baseY: GAME_H / 2, phase: 0,
      speed: 14 * this.diff.speed, color: CSS.red,
      glitchAt: this.time.now + 500,
    };
    this.layoutLabel(this.boss);
    this.refreshBossHp();
    this.enemies.push(this.boss);
  }

  refreshBossHp() {
    const b = this.boss;
    const left = b.cmds.length - b.cmdIndex;
    b.hpText.setText('HP ' + '▓'.repeat(left) + '░'.repeat(b.cmds.length - left));
  }

  bossHit() {
    const b = this.boss;
    Sfx.bossHit();
    this.cameras.main.shake(220, 0.005);
    this.sparks.explode(40, b.container.x, b.container.y - 60);
    b.cmdIndex++;
    const pts = Math.round(b.label.length * 15 * this.multiplier());
    this.score += pts;
    this.scorePopup(b.container.x, b.container.y - 140, `+${pts}`, CSS.amber, 36);
    if (b.cmdIndex >= b.cmds.length) return this.killEnemy(b);
    b.container.x = Math.min(b.container.x + 170, SPAWN_X);
    b.label = b.cmds[b.cmdIndex];
    b.progress = 0;
    b.typedText.setText('');
    b.restText.setText(b.label);
    this.layoutLabel(b);
    this.refreshBossHp();
    this.refreshHud();
  }

  // ------------------------------------------------------------ frappe
  onKey(e) {
    if (this.over) return;
    if (this.paused) {
      if (e.key === 'Escape' || e.key === 'Enter') this.togglePause();
      else if (e.key === 'q' || e.key === 'Q') this.quitToMenu();
      return;
    }
    if (e.key === 'Escape') { this.togglePause(); return; }
    // TAB relâche la cible ; ÉCHAP est pris par la pause
    if (e.key === 'Tab') { e.preventDefault(); this.releaseTarget(); return; }
    // F2 et pas M : les mots à taper peuvent contenir un m
    if (e.key === 'F2') { Sfx.toggleMute(); return; }
    if (e.key.length !== 1) return;
    e.preventDefault();
    Sfx.ensure();
    const char = e.key;

    if (!this.target) {
      // verrouille l'ennemi correspondant le plus proche de la prod
      const candidates = this.enemies.filter((en) => en.label[0] === char);
      if (!candidates.length) { this.softMiss(); return; }
      candidates.sort((a, b) => a.container.x - b.container.x);
      this.target = candidates[0];
    }

    const t = this.target;
    if (char === t.label[t.progress]) {
      t.progress++;
      this.stats.typedOK++;
      Sfx.blip(this.combo);
      t.typedText.setText(t.label.slice(0, t.progress));
      t.restText.setText(t.label.slice(t.progress));
      this.layoutLabel(t);
      if (t.progress >= t.label.length) {
        if (t.kind === 'boss') { this.target = null; this.bossHit(); }
        else this.killEnemy(t);
      }
    } else {
      this.typoOn(t);
    }
  }

  softMiss() {
    this.stats.errors++;
    Sfx.error();
  }

  typoOn(t) {
    this.stats.errors++;
    this.combo = 0;
    Sfx.error();
    this.cameras.main.shake(90, 0.002);
    if (!this.stats.missedWords.includes(t.label) || Math.random() < 0.5) {
      this.stats.missedWords.push(t.label);
    }
    t.restText.setColor(CSS.red);
    this.time.delayedCall(140, () => {
      if (t.restText.active) t.restText.setColor(t.cls === 'powerup' ? CSS.gold : CSS.white);
    });
    this.refreshHud();
  }

  releaseTarget() {
    const t = this.target;
    if (!t) return;
    t.progress = 0;
    t.typedText.setText('');
    t.restText.setText(t.label);
    this.layoutLabel(t);
    this.target = null;
    this.lockLine.clear();
  }

  // ------------------------------------------------------------ mort & effets
  killEnemy(e) {
    if (this.target === e) { this.target = null; this.lockLine.clear(); }
    Phaser.Utils.Array.Remove(this.enemies, e);
    if (e.kind === 'boss') {
      this.boss = null;
      this.stats.kills.boss++;
      Music.setIntensity(Math.min(3, 1 + Math.floor(this.wave / 3)));
      this.cameras.main.shake(400, 0.008);
      this.sparks.explode(120, e.container.x, e.container.y - 80);
      const pts = Math.round(500 * this.multiplier());
      this.score += pts;
      this.scorePopup(e.container.x, e.container.y - 80, `+${pts}`, CSS.gold, 44);
      this.dropBonus(e, 'life'); // le boss lâche toujours une vie
    } else {
      this.stats.kills[e.cls] = (this.stats.kills[e.cls] || 0) + 1;
      const pts = Math.round(e.label.length * 10 * (e.level || 1) * this.multiplier());
      this.score += pts;
      this.scorePopup(e.container.x, e.container.y - 50, `+${pts}`, CSS.white, 30);
      this.sparks.explode(Math.min(14 + e.label.length * 2, 50), e.container.x, e.container.y);
      this.rollDrop(e);
    }
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    Sfx.kill();
    this.explodeLetters(e);
    if (e.cls === 'powerup') this.applyPowerup(e.effect);
    e.container.destroy();
    this.refreshHud();
    this.checkWaveEnd();
  }

  /* Texte flottant : points gagnés, bonus ramassés... */
  scorePopup(x, y, text, color, size = 30) {
    const t = this.add.text(x, y, text, {
      fontFamily: FONT, fontSize: `${size}px`, color,
    }).setOrigin(0.5).setDepth(38);
    this.tweens.add({
      targets: t, y: y - 70, alpha: 0, duration: 900, ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  /* Certains ennemis lâchent un bonus à leur mort, selon leur classe. */
  rollDrop(e) {
    const chance = { elite: 0.35, legacy: 0.2, deadline: 0.15, bug: 0.08 }[e.kind] || 0;
    if (Math.random() >= chance) return;
    const pool = ['life', 'score', 'combo', 'slowmo'];
    this.dropBonus(e, Phaser.Utils.Array.GetRandom(pool));
  }

  dropBonus(e, type) {
    const x = e.container.x;
    const y = e.container.y - 90;
    Sfx.powerup();
    if (type === 'life' && this.lives < this.diff.lives) {
      this.lives++;
      this.scorePopup(x, y, '+1 VIE — PROD RESTAURÉE', CSS.cyan, 34);
    } else if (type === 'life') {
      // vies au max : converti en points
      const pts = Math.round(300 * this.diff.scoreMult);
      this.score += pts;
      this.scorePopup(x, y, `PROD SAINE +${pts}`, CSS.cyan, 32);
    } else if (type === 'score') {
      const pts = Math.round(250 * this.multiplier());
      this.score += pts;
      this.scorePopup(x, y, `BONUS +${pts}`, CSS.gold, 36);
    } else if (type === 'combo') {
      this.combo += 5;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.scorePopup(x, y, 'COMBO +5', CSS.amber, 34);
    } else if (type === 'slowmo') {
      this.timeScale = 0.35;
      this.time.delayedCall(3000, () => { this.timeScale = 1; });
      this.scorePopup(x, y, '☕ SLOW-MO 3s', CSS.gold, 34);
    }
    this.refreshHud();
  }

  explodeLetters(e) {
    const chars = e.label.slice(0, 14).split('');
    chars.forEach((ch) => {
      const t = this.add.text(e.container.x, e.container.y, ch, {
        fontFamily: FONT, fontSize: '28px', color: e.color,
      }).setOrigin(0.5).setDepth(35);
      this.tweens.add({
        targets: t,
        x: e.container.x + Phaser.Math.Between(-180, 180),
        y: e.container.y + Phaser.Math.Between(-160, 120),
        angle: Phaser.Math.Between(-200, 200),
        alpha: 0, duration: Phaser.Math.Between(380, 700),
        ease: 'Cubic.easeOut',
        onComplete: () => t.destroy(),
      });
    });
  }

  applyPowerup(effect) {
    this.stats.kills.powerup++;
    Sfx.powerup();
    if (effect === 'slowmo') {
      this.showBanner('☕ PAUSE CAFÉ\nralenti 5 s');
      this.timeScale = 0.35;
      this.time.delayedCall(5000, () => { this.timeScale = 1; });
    } else if (effect === 'knockback') {
      this.showBanner('GIT REVERT\nles bugs reculent !');
      this.enemies.forEach((e) => {
        if (e.kind !== 'boss') this.tweens.add({ targets: e.container, x: e.container.x + 260, duration: 350 });
      });
    } else if (effect === 'nuke') {
      this.showBanner('SUDO REBOOT\nécran purgé !');
      [...this.enemies].forEach((e) => {
        if (e.kind !== 'boss' && e.cls !== 'powerup') {
          this.score += Math.round(e.label.length * 5 * this.diff.scoreMult);
          this.sparks.explode(16, e.container.x, e.container.y);
          this.explodeLetters(e);
          if (this.target === e) { this.target = null; this.lockLine.clear(); }
          Phaser.Utils.Array.Remove(this.enemies, e);
          e.container.destroy();
        }
      });
      this.checkWaveEnd();
    }
  }

  // ------------------------------------------------------------ incidents
  incident(e) {
    Phaser.Utils.Array.Remove(this.enemies, e);
    if (this.target === e) { this.target = null; this.lockLine.clear(); }
    if (e.cls !== 'powerup') {
      this.lives -= e.kind === 'boss' ? 2 : 1;
      this.combo = 0;
      this.stats.missedWords.push(e.label);
      Sfx.incident();
      this.cameras.main.shake(350, 0.01);
      this.redSparks.explode(60, PROD_X + 80, e.container.y);
      this.flashRect.setAlpha(0.35);
      this.tweens.add({ targets: this.flashRect, alpha: 0, duration: 450 });
      this.showBanner(e.kind === 'boss' ? '!! LE BOSS A TOUCHÉ LA PROD !!' : 'INCIDENT EN PROD !');
    }
    if (e.kind === 'boss') this.boss = null;
    e.container.destroy();
    this.refreshHud();
    if (this.lives <= 0) return this.gameOver();
    this.checkWaveEnd();
  }

  checkWaveEnd() {
    if (this.over || this.spawnQueue.length || this.enemies.length || this.boss || this.bossPending) return;
    this.score += Math.round(100 * this.wave * this.diff.scoreMult);
    Sfx.waveClear();
    this.refreshHud();
    this.time.delayedCall(1600, () => this.nextWave());
  }

  gameOver() {
    this.over = true;
    // si la fin arrive dans un état suspendu (pause, slowmo), tout rétablir
    this.paused = false;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.pauseOverlay.setVisible(false);
    Music.stop();
    Sfx.gameOver();
    this.input.keyboard.off('keydown', this.keyHandler);
    this.lockLine.clear();
    this.enemies.forEach((e) => e.container.destroy());
    this.enemies = [];

    const duration = (this.time.now - this.stats.startTime) / 1000;
    const minutes = Math.max(duration / 60, 1 / 60);
    const wpm = Math.round((this.stats.typedOK / 5) / minutes);
    const total = this.stats.typedOK + this.stats.errors;
    const accuracy = total ? Math.round((this.stats.typedOK / total) * 1000) / 10 : 100;

    const downTxt = this.add.text(GAME_W / 2, GAME_H / 2, 'LA PROD EST DOWN', {
      fontFamily: FONT, fontSize: '120px', color: CSS.red, align: 'center',
    }).setOrigin(0.5).setDepth(60).setAlpha(0);
    this.tweens.add({ targets: downTxt, alpha: 1, duration: 200, yoyo: true, repeat: 6 });
    this.cameras.main.shake(900, 0.012);

    this.time.delayedCall(2300, () => {
      this.scene.start('GameOver', {
        difficulty: this.diff,
        results: {
          score: this.score, wave: this.wave, wpm, accuracy,
          maxCombo: this.maxCombo, durationS: Math.round(duration),
          kills: this.stats.kills, missedWords: this.stats.missedWords.slice(0, 100),
        },
      });
    });
  }

  // ------------------------------------------------------------ update
  update(time, delta) {
    if (this.over || this.paused) return;
    // clamp : au retour d'un onglet en pause, delta peut valoir plusieurs
    // secondes et téléporter tous les ennemis sur la prod
    const dt = (Math.min(delta, 50) / 1000) * this.timeScale;

    // pluie de fond
    for (const g of this.bgGlyphs) {
      g.y += g.fall * dt;
      if (g.y > GAME_H) { g.y = -20; g.x = Phaser.Math.Between(0, GAME_W); }
    }

    for (const e of [...this.enemies]) {
      e.container.x -= e.speed * dt;
      e.phase += dt * 2.2;
      e.container.y = e.baseY + Math.sin(e.phase) * 9;
      // glitch visuel périodique
      if (time > e.glitchAt) {
        e.glitchAt = time + Phaser.Math.Between(900, 2600);
        e.art.setX(Phaser.Math.Between(-4, 4));
        e.art.setAlpha(0.55);
        this.time.delayedCall(90, () => {
          if (e.art.active) { e.art.setX(0); e.art.setAlpha(1); }
        });
      }
      if (e.container.x < PROD_X + 80) this.incident(e);
    }

    // ligne de verrouillage
    this.lockLine.clear();
    if (this.target && this.target.container.active) {
      const t = this.target;
      this.lockLine.lineStyle(2, PALETTE.amber, 0.55);
      this.lockLine.lineBetween(PLAYER_X + 40, this.player.y - 30, t.container.x, t.container.y);
      this.lockLine.lineStyle(2, PALETTE.amber, 0.9);
      const w = Math.max(t.restText.width + t.typedText.width, 60) + 26;
      this.lockLine.strokeRect(t.container.x - w / 2, t.container.y - 56, w, 96);
    }
  }
}
