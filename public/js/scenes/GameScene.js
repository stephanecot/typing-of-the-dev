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

/* Composition (déterministe) d'une vague pour une difficulté donnée.
   Partagée avec l'aide du menu, qui s'en sert pour calculer les %
   d'apparition des ennemis. */
function waveQueueFor(diff, n, bossWave) {
  const q = [];
  // les bugs de base plafonnent vite (~24 % des apparitions au lieu de 36 %) :
  // la variété vient des spéciaux, qui arrivent aussi plus tôt dans la partie
  const bugCount = bossWave ? 3 : Math.min(3 + Math.ceil(n / 2), 8);
  for (let i = 0; i < bugCount; i++) q.push('bug');
  if (!bossWave) {
    for (let i = 0; i < Math.min(1 + Math.floor(n / 3), 4); i++) q.push('typo');
    if (n >= 2) for (let i = 0; i < Math.min(1 + Math.floor(n / 2), 5); i++) q.push('legacy');
    if (n >= diff.deadlineWave) for (let i = 0; i < Math.min(1 + Math.floor(n / 2), 6); i++) q.push('deadline');
    if (n >= diff.eliteWave) for (let i = 0; i < Math.min(Math.floor(n / 3) + 1, 4); i++) q.push('elite');
    if (n >= 2) for (let i = 0; i < Math.min(1 + Math.floor((n - 2) / 3), 2); i++) q.push('spammer');
    if (n >= 3) for (let i = 0; i < Math.min(1 + Math.floor((n - 3) / 3), 3); i++) q.push('ghost');
    if (n >= 4) for (let i = 0; i < Math.min(1 + Math.floor((n - 4) / 3), 3); i++) q.push('virus');
    if (n >= 5) for (let i = 0; i < Math.min(1 + Math.floor((n - 5) / 4), 2); i++) q.push('monolith');
    if (n >= 4) for (let i = 0; i < Math.min(1 + Math.floor((n - 4) / 3), 2); i++) q.push('microservice');
    if (n >= 3) for (let i = 0; i < Math.min(1 + Math.floor((n - 3) / 3), 2); i++) q.push('spec');
    if (n >= 4) for (let i = 0; i < Math.min(1 + Math.floor((n - 4) / 4), 2); i++) q.push('indep');
    // niv.4 et 5 : seulement en CTO BURNOUT et DIEU DU TERMINAL
    const hardcore = diff.key === 'cto' || diff.key === 'ultime';
    if (hardcore && n >= 2) for (let i = 0; i < Math.min(1 + Math.floor((n - 2) / 3), 3); i++) q.push('consultant');
    if (hardcore && n >= 3) for (let i = 0; i < Math.min(1 + Math.floor((n - 3) / 4), 2); i++) q.push('obfuscator');
    if (diff.key === 'ultime' && n >= 3) for (let i = 0; i < Math.min(1 + Math.floor((n - 3) / 4), 2); i++) q.push('ransomware');
    if (diff.key === 'ultime' && n >= 4) q.push('po'); // 1 seul PO à la fois suffit largement

    // +15 % d'ennemis spéciaux : on repioche (déterministe, pour que les %
    // affichés dans l'aide restent stables) parmi les non-bugs de la vague
    const specials = q.filter((k) => k !== 'bug');
    const extra = Math.round(specials.length * 0.15);
    for (let i = 0; i < extra; i++) q.push(specials[i % specials.length]);
  }
  return q;
}

/* Boss spéciaux du MODE INFINI, en rotation sur les vagues de boss. */
const INFINITE_BOSSES = [
  { art: 'mainframe', nameKey: 'bossMainframe', cmdDelta: 3, speedMult: 0.6, color: '#41f2ff' },
  { art: 'dette', nameKey: 'bossDette', cmdDelta: 1, speedMult: 0.9, color: '#ffb000', longest: true },
  { art: 'stagiaireBoss', nameKey: 'bossStagiaire', cmdDelta: -1, speedMult: 1.8, color: '#39ff7a' },
  { art: 'commercial', nameKey: 'bossCommercial', cmdDelta: 0, speedMult: 1.2, color: '#ffd76a', spawnOnHit: 'deadline' },
  { art: 'datacenter', nameKey: 'bossDatacenter', cmdDelta: 2, speedMult: 1.1, color: '#ff3b3b', smokeOnHit: true },
  { art: 'reunion', nameKey: 'bossReunion', cmdDelta: 4, speedMult: 0.5, color: '#ff5cf0' },
  { art: 'framework', nameKey: 'bossFramework', cmdDelta: 0, speedMult: 1.3, color: '#39ff7a', rerollOnHit: true },
  { art: 'certificat', nameKey: 'bossCertificat', cmdDelta: -1, speedMult: 1.5, color: '#ff3b3b', damage: 3 },
  { art: 'audit', nameKey: 'bossAudit', cmdDelta: 1, speedMult: 0.9, color: '#eafff0', spawnOnHit: 'consultant' },
  { art: 'facture', nameKey: 'bossFacture', cmdDelta: 2, speedMult: 0.8, color: '#ffd76a', costPerHit: 150 },
];

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.diff = data.difficulty || DIFFICULTIES[1];
    this.godModeArmed = !!data.godMode; // armé via Konami Code sur l'écran d'accueil
    // partie gagnée au bout de maxSprints (réglable depuis l'admin) ;
    // le compte à rebours "par" sert d'affichage et de bonus de fin
    this.infinite = INFINITE_MODE; // pas de chrono, sprints sans fin
    this.speedScale = SPEED_MODE ? 1.3 : 1; // code secret SPEED : +30 %
    this.maxSprints = GAME_CONFIG.maxSprints;
    this.parMs = this.maxSprints * PAR_SECONDS_PER_SPRINT * 1000;
    this.playMs = 0; // temps de jeu effectif (pauses exclues)
    this.enemies = [];
    this.target = null;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lives = this.diff.lives;
    this.wave = 0;
    // SUPER COMBO ULTIME (difficultés ★★★ et plus) : des étoiles de combat
    // gagnées aux paliers de combo 5/10/15 (+1/+2/+3, max 6). Elles ne se
    // perdent pas quand le combo retombe. Leurs pouvoirs : à venir.
    this.superComboEnabled = ['hard', 'cto', 'ultime'].includes(this.diff.key);
    this.comboStars = 0;
    this.runStarTier = 0; // paliers déjà payés dans la série de combo en cours
    this.invincibleUntil = 0; // bouclier du pouvoir A
    this.spawnQueue = [];
    this.boss = null;
    this.bossPending = false;
    this.timeScale = 1;
    this.over = false;
    this.paused = false;
    this.bombs = 1;  // item KILL -9 : ENTRÉE tue l'ennemi le plus proche de la prod, max 3
    this.lasers = 1; // item AUTOCOMPLETE : EFFACER complète les 4 prochaines lettres de la cible, max 5
    this.godMode = this.godModeArmed; // invincible, mais affiché comme tricheur et score non sauvegardé
    this.stats = {
      typedOK: 0, errors: 0, startTime: 0,
      kills: { bug: 0, legacy: 0, deadline: 0, boss: 0, powerup: 0 },
      missedWords: [],
    };
  }

  create() {
    this.stats.startTime = this.time.now;
    if (REDUCED_MOTION) this.cameras.main.shake = () => this.cameras.main;
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
  /* Fond : dégradé vertical + halos de phosphore. Les scanlines, la vignette
     et le flicker CRT sont déjà gérés en DOM par-dessus le canvas (style.css) —
     on ne les double pas ici. */
  buildCrtBackground() {
    const g = this.add.graphics().setDepth(-3);
    g.fillGradientStyle(0x0a1a10, 0x0a1a10, 0x02050a, 0x02050a, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
    // halo central très léger, comme un tube qui chauffe au milieu
    g.fillStyle(0x0e2415, 0.25);
    g.fillEllipse(GAME_W / 2, GAME_H / 2, GAME_W * 1.1, GAME_H * 0.9);
    // lueur cyan derrière le serveur PROD, pour ancrer ce qu'on défend
    g.fillStyle(0x0a2e33, 0.30);
    g.fillEllipse(PROD_X + 30, GAME_H / 2, 420, 620);
    g.fillStyle(0x0e444c, 0.18);
    g.fillEllipse(PROD_X + 30, GAME_H / 2, 240, 380);
  }

  /* MODE DISCO : boule à facettes scintillante, 6 spots qui balaient la
     piste, dance floor en damier et ennemis qui changent de couleur.
     Tout reste sous ~2,5 Hz et s'assagit en animations réduites. */
  buildDiscoAmbiance() {
    const colors = [0xff5cf0, 0x41f2ff, 0xffd76a, 0x39ff7a, 0xff3b3b, 0xeafff0];
    // 6 spots qui balaient
    colors.forEach((c, i) => {
      const spot = this.add.circle(260 + i * 220, 260 + (i % 3) * 200, 240, c, 0.08).setDepth(2);
      if (!REDUCED_MOTION) this.tweens.add({
        targets: spot,
        x: GAME_W - 260 - i * 160,
        y: GAME_H - 220 - ((i + 1) % 3) * 220,
        duration: 2200 + i * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });
    // dance floor en damier sous les ennemis
    this.discoTiles = [];
    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 2; row++) {
        this.discoTiles.push(this.add.rectangle(
          100 + col * 200, GAME_H - 175 + row * 115, 192, 108,
          colors[(col + row) % colors.length], 0.07).setDepth(-1));
      }
    }
    // boule à facettes + paillettes qui tombent
    const ball = this.add.text(GAME_W / 2, 56, ASCII.discoBall, {
      fontFamily: FONT, fontSize: '16px', color: CSS.white, align: 'center', lineSpacing: -3,
    }).setOrigin(0.5, 0).setDepth(5);
    if (!REDUCED_MOTION) {
      this.tweens.add({ targets: ball, angle: { from: -8, to: 8 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.particles(0, 0, 'px', {
        x: { min: GAME_W / 2 - 40, max: GAME_W / 2 + 40 }, y: 110,
        speedY: { min: 40, max: 120 }, speedX: { min: -60, max: 60 },
        lifespan: { min: 800, max: 1600 }, scale: { start: 1.6, end: 0 },
        tint: colors, frequency: 90,
      }).setDepth(4);
    }
  }

  buildDecor() {
    this.buildCrtBackground();
    if (DISCO_MODE) this.buildDiscoAmbiance();
    if (BOISSON_MODE) applyDrunkFx(this);
    // pluie de caractères en fond, très discrète
    this.bgGlyphs = [];
    for (let i = 0; i < 40; i++) {
      const t = this.add.text(
        Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(0, GAME_H),
        Phaser.Utils.Array.GetRandom(['0', '1', ';', '{', '}', '$', '#', '>', '/']),
        { fontFamily: FONT, fontSize: `${Phaser.Math.Between(16, 26)}px`,
          color: Math.random() < 0.12 ? CSS.cyan : CSS.greenDim }
      ).setAlpha(Phaser.Math.FloatBetween(0.08, 0.2));
      t.fall = Phaser.Math.FloatBetween(12, 45);
      this.bgGlyphs.push(t);
    }

    // serveur PROD + dev à défendre
    this.prodArt = this.add.text(PROD_X, GAME_H / 2, ASCII.prod, {
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
    this.hudFps = this.add.text(4, 0, '', {
      fontFamily: FONT, fontSize: '16px', color: CSS.greenSoft,
    }).setDepth(40).setAlpha(0.85);
    this.hudScore = this.add.text(24, 16, '', styleSm).setDepth(40);
    this.hudCombo = this.add.text(24, 50, '', { ...styleSm, color: CSS.amber }).setDepth(40);
    this.hudBombs = this.add.text(24, 84, '', { ...styleSm, color: CSS.gold }).setDepth(40);
    this.hudStars = this.add.text(24, 118, '', { ...styleSm, color: CSS.gold }).setDepth(40);
    this.hudWave = this.add.text(GAME_W / 2, 22, '', {
      fontFamily: FONT, fontSize: '32px', color: CSS.white,
    }).setOrigin(0.5, 0.5).setDepth(40);
    // progression des sprints (barre sous le titre) + temps de jeu restant
    this.sprintBar = this.add.graphics().setDepth(40);
    this.hudTime = this.add.text(GAME_W / 2, 66, '', {
      fontFamily: FONT, fontSize: '26px', color: CSS.greenSoft,
    }).setOrigin(0.5, 0.5).setDepth(40);
    this.hudDiff = this.add.text(GAME_W - 24, 16, diffLabel(this.diff), {
      fontFamily: FONT, fontSize: '26px', color: this.diff.color || CSS.magenta,
    }).setOrigin(1, 0).setDepth(40);
    // PV : une icône carrée par vie, pleine tant que la vie est là
    const n = this.diff.lives;
    this.hudProdLabel = this.add.text(GAME_W - 24 - n * 44 - 14, 48, 'PROD', {
      fontFamily: FONT, fontSize: '32px', color: CSS.green,
    }).setOrigin(1, 0).setDepth(40);
    this.lifeIcons = [];
    for (let i = 0; i < n; i++) {
      const x = GAME_W - 39 - (n - 1 - i) * 44;
      this.lifeIcons.push(this.add.rectangle(x, 66, 30, 30).setDepth(40));
    }
    this.lifePulse = null;
    // badges des modes secrets actifs, empilés sous les PV
    let badgeY = 96;
    const addBadge = (txt, color) => {
      this.add.text(GAME_W - 24, badgeY, txt, {
        fontFamily: FONT, fontSize: '22px', color,
      }).setOrigin(1, 0).setDepth(40);
      badgeY += 26;
    };
    if (GINES_MODE) addBadge(T('ginesBadge'), CSS.magenta);
    if (DISCO_MODE) addBadge(T('discoBadge'), CSS.cyan);
    if (BOISSON_MODE) addBadge(T('boissonBadge'), CSS.gold);
    if (SPEED_MODE) addBadge(T('speedBadge'), CSS.red);
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
      this.add.text(cx, GAME_H / 2 - 50, T('pauseSub'), {
        fontFamily: FONT, fontSize: '26px', color: CSS.greenSoft,
      }).setOrigin(0.5),
      this.add.text(cx, GAME_H / 2 + 60, T('pauseResume'), {
        fontFamily: FONT, fontSize: '36px', color: CSS.green,
      }).setOrigin(0.5),
      this.add.text(cx, GAME_H / 2 + 120, T('pauseQuit'), {
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
    // le tricheur est affiché à côté de son score, bien en rouge
    this.hudScore.setText(`SCORE ${this.score}${this.godMode ? T('hudGod') : ''}`);
    this.hudScore.setColor(this.godMode ? CSS.red : CSS.green);
    const mult = this.multiplier();
    this.hudCombo.setText(this.combo > 1 ? `COMBO x${this.combo}  (×${mult})` : '');
    this.hudBombs.setText(T('hudItems')(this.bombs, this.lasers));
    this.hudStars.setText(this.superComboEnabled
      ? `${T('hudStars')} ${'★'.repeat(this.comboStars)}${'☆'.repeat(6 - this.comboStars)}${this.comboStars > 0 ? T('hudStarsKeys') : ''}`
      : '');
    this.hudWave.setText(this.infinite ? `SPRINT ${this.wave} ∞` : `SPRINT ${this.wave}/${this.maxSprints}`);
    this.refreshSprintBar();
    this.refreshLives();
  }

  refreshSprintBar() {
    if (this.infinite) { this.sprintBar.clear(); return; }
    const w = 260, h = 8;
    const x = GAME_W / 2 - w / 2, y = 40;
    const done = Phaser.Math.Clamp(Math.max(this.wave - 1, 0) / this.maxSprints, 0, 1);
    this.sprintBar.clear();
    this.sprintBar.fillStyle(PALETTE.greenDim, 0.35);
    this.sprintBar.fillRect(x, y, w, h);
    this.sprintBar.fillStyle(done >= 0.9 ? PALETTE.gold : PALETTE.green, 0.95);
    this.sprintBar.fillRect(x, y, w * done, h);
    // crans à chaque sprint
    this.sprintBar.fillStyle(0x020503, 0.8);
    for (let i = 1; i < this.maxSprints; i++) {
      this.sprintBar.fillRect(x + (w / this.maxSprints) * i - 1, y, 2, h);
    }
  }

  /* Compte à rebours du temps "par" : à 0 il ne se passe rien de grave,
     mais chaque seconde restante à la victoire rapporte des points. */
  refreshTime() {
    if (this.infinite) return; // pas de chrono en mode infini
    const leftS = Math.max(0, Math.ceil((this.parMs - this.playMs) / 1000));
    if (leftS === this._shownTimeS) return;
    this._shownTimeS = leftS;
    const mm = String(Math.floor(leftS / 60)).padStart(2, '0');
    const ss = String(leftS % 60).padStart(2, '0');
    this.hudTime.setText(`${T('hudTime')} ${mm}:${ss}`);
    this.hudTime.setColor(leftS === 0 ? CSS.red : leftS <= 60 ? CSS.amber : CSS.greenSoft);
  }

  refreshLives() {
    const max = this.diff.lives;
    const tint = this.lives <= 1 ? PALETTE.red : this.lives < max ? PALETTE.amber : PALETTE.green;
    this.hudProdLabel.setColor(this.lives <= 1 ? CSS.red : this.lives < max ? CSS.amber : CSS.green);
    this.lifeIcons.forEach((icon, i) => {
      const full = i < this.lives;
      icon.setFillStyle(tint, full ? 1 : 0.06);
      icon.setStrokeStyle(3, full ? tint : PALETTE.greenDim);
    });
    // perte ou gain de vie : pop sur les icônes concernées
    if (this._shownLives !== undefined && this.lives !== this._shownLives) {
      const from = Math.max(Math.min(this.lives, this._shownLives), 0);
      const to = Math.min(Math.max(this.lives, this._shownLives), max);
      for (let i = from; i < to; i++) {
        this.lifeIcons[i].setScale(1.7);
        this.tweens.add({ targets: this.lifeIcons[i], scaleX: 1, scaleY: 1, duration: 380, ease: 'Back.easeOut' });
      }
    }
    this._shownLives = this.lives;
    // dernière vie : pulsation d'alerte
    if (this.lives <= 1 && !this.lifePulse) {
      this.lifePulse = this.tweens.add({
        targets: [this.hudProdLabel, this.lifeIcons[0]],
        alpha: 0.35, duration: 420, yoyo: true, repeat: -1,
      });
    } else if (this.lives > 1 && this.lifePulse) {
      this.lifePulse.stop();
      this.lifePulse = null;
      this.hudProdLabel.setAlpha(1);
      this.lifeIcons.forEach((icon) => icon.setAlpha(1));
    }
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

  /* Paliers du SUPER COMBO ULTIME : 5 → +1 ★, 10 → +2 ★, 15 → +3 ★ (max 6).
     Chaque palier n'est payé qu'une fois par série ; les étoiles acquises
     survivent à la perte du combo. */
  checkComboStars() {
    if (!this.superComboEnabled || this.comboStars >= 6) return;
    const tiers = [5, 10, 15];
    const gains = [1, 2, 3];
    while (this.runStarTier < tiers.length && this.combo >= tiers[this.runStarTier]) {
      const gain = Math.min(gains[this.runStarTier], 6 - this.comboStars);
      this.runStarTier++;
      if (gain <= 0) continue;
      this.comboStars += gain;
      Sfx.powerup();
      this.scorePopup(PLAYER_X + 200, this.player.y - 120,
        `${T('starGain')(gain)} ${'★'.repeat(this.comboStars)}`, CSS.gold, 36);
    }
  }

  /* Bonus vitesse : ~3 caractères/s = neutre (×1), frappe éclair = jusqu'à ×3.
     Proportionnel au mot : un long mot tapé vite rapporte beaucoup plus. */
  speedMult(e, sinceMs) {
    if (!sinceMs || sinceMs <= 0) return 1;
    const cps = e.label.length / Math.max(sinceMs / 1000, 0.15);
    return Phaser.Math.Clamp(cps / 3, 0.6, 3);
  }

  // ------------------------------------------------------------ vagues
  nextWave() {
    if (this.over) return;
    // le dernier sprint se répète tant que le DSI n'est pas vaincu (s'il
    // atteint la prod sans la détruire, il revient) ; en infini, on enchaîne
    this.wave = this.infinite ? this.wave + 1 : Math.min(this.wave + 1, this.maxSprints);
    Music.setIntensity(Math.min(3, 1 + Math.floor(this.wave / 3)));
    this.refreshHud();

    const sprintLabel = this.infinite ? `SPRINT ${this.wave}` : `SPRINT ${this.wave}/${this.maxSprints}`;
    const isFinal = !this.infinite && this.wave === this.maxSprints;
    const isBossWave = isFinal || this.wave % 4 === 0;
    this.showBanner(isFinal
      ? `${sprintLabel}\n${T('bannerFinal')}`
      : isBossWave
        ? `${sprintLabel}\n${T('bannerBossWave')}`
        : `${sprintLabel}\n${T('bannerWave')}`);

    this.spawnQueue = this.buildWaveQueue(this.wave, isBossWave);
    this.time.delayedCall(1800, () => this.scheduleSpawn());
    if (isBossWave) {
      // empêche checkWaveEnd de passer à la vague suivante si les sbires
      // meurent avant l'apparition (différée) du boss
      this.bossPending = true;
      this.time.delayedCall(2400, () => this.spawnBoss(isFinal));
    }
  }

  buildWaveQueue(n, bossWave) {
    return Phaser.Utils.Array.Shuffle(waveQueueFor(this.diff, n, bossWave));
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
    // mode Ginès : tout le monde insulte le joueur, peu importe la classe
    if (GINES_MODE) return pickWord(wordBank('insults'), opts);
    switch (kind) {
      case 'bug': return pickWord(WORDS.keywords, opts);
      case 'elite': return pickWord(WORDS.exceptions, { exclude: ex, maxLen: this.diff.maxLen + 8 });
      case 'legacy': return Math.random() < 0.55
        ? pickWord(WORDS.snippets, opts) : pickWord(WORDS.legacyNames, opts);
      case 'deadline': return pickWord(wordBank('deadlines'), opts);
      case 'spammer': return pickWord(wordBank('spammers'), { exclude: ex });
      case 'missile': return pickWord(wordBank('missiles'), { exclude: ex });
      case 'typo': return pickWord(WORDS.typos, { exclude: ex });
      case 'ghost': return pickWord(WORDS.keywords, opts);
      case 'virus': return pickWord(WORDS.keywords, { exclude: ex, maxLen: Math.min(8, this.diff.maxLen) });
      case 'monolith': return pickWord(WORDS.exceptions, { exclude: ex, maxLen: this.diff.maxLen + 8 });
      case 'microservice': return pickWord(WORDS.keywords, { exclude: ex, maxLen: Math.min(8, this.diff.maxLen) });
      case 'indep': return pickWord(wordBank('freelance'), opts);
      case 'spec': return this.gibberish(Phaser.Math.Between(5, Math.min(9, this.diff.maxLen)));
      case 'consultant': return pickWord(wordBank('buzzwords'), { exclude: ex });
      case 'obfuscator': return pickWord(WORDS.obfuscation, { exclude: ex });
      case 'ransomware': return pickWord(WORDS.commands, { exclude: ex });
      case 'po': return pickWord(wordBank('poIdeas'), { exclude: ex });
      default: return pickWord(WORDS.keywords, opts);
    }
  }

  /* Pouvoir "MINIFIÉ" : ~30 % des lettres remplacées par ? à l'écran
     (jamais la première, jamais les espaces) — il faut deviner. */
  rollMask(kind, label) {
    if (!['legacy', 'elite', 'deadline'].includes(kind)) return null;
    if (this.wave < 2 || Math.random() > 0.22) return null;
    const candidates = [];
    for (let i = 1; i < label.length; i++) if (label[i] !== ' ') candidates.push(i);
    Phaser.Utils.Array.Shuffle(candidates);
    const count = Math.max(1, Math.ceil(label.length * 0.3));
    return new Set(candidates.slice(0, count));
  }

  /* LA SPEC FOIREUSE : un mot qui ne veut rien dire, généré au hasard
     (alternance consonne/voyelle pour rester tapable). */
  gibberish(len) {
    const cons = 'bcdfghjklmnprstvz';
    const vow = 'aeiou';
    let out = '';
    for (let i = 0; i < len; i++) {
      const bank = i % 2 ? vow : cons;
      out += bank[Math.floor(Math.random() * bank.length)];
    }
    return out;
  }

  /* Pouvoir "RETOURNÉ" : le reste du mot est affiché tête en bas (flipY).
     Il se tape normalement — c'est la lecture qui pique. */
  rollFlip(kind) {
    if (!['legacy', 'elite', 'deadline', 'ghost', 'monolith'].includes(kind)) return false;
    return this.wave >= 3 && Math.random() < 0.15;
  }

  /* Partie restante du mot, avec les lettres minifiées affichées en ?. */
  maskedRest(e) {
    let out = '';
    for (let i = e.progress; i < e.label.length; i++) {
      out += e.masked && e.masked.has(i) ? '?' : e.label[i];
    }
    return out;
  }

  updateLabel(e) {
    e.typedText.setText(e.label.slice(0, e.progress));
    e.restText.setText(this.maskedRest(e));
    this.layoutLabel(e);
  }

  spawnEnemy(kind) {
    const conf = {
      bug: { color: CSS.green, tint: PALETTE.green, speed: 42, art: 'bug', cls: 'bug', size: 18, level: 1 },
      typo: { color: CSS.green, tint: PALETTE.green, speed: 46, art: 'typo', cls: 'bug', size: 17, level: 1 },
      deadline: { color: CSS.magenta, tint: PALETTE.magenta, speed: 75, art: 'deadline', cls: 'deadline', size: 17, level: 2 },
      legacy: { color: CSS.amber, tint: PALETTE.amber, speed: 26, art: 'legacy', cls: 'legacy', size: 18, level: 2 },
      elite: { color: CSS.green, tint: PALETTE.green, speed: 34, art: 'bug', cls: 'bug', size: 22, level: 3 },
      spammer: { color: CSS.cyan, tint: PALETTE.cyan, speed: 20, art: 'spammer', cls: 'deadline', size: 18, level: 3 },
      ghost: { color: CSS.white, tint: PALETTE.white, speed: 48, art: 'ghost', cls: 'bug', size: 18, level: 2 },
      virus: { color: CSS.red, tint: PALETTE.red, speed: 55, art: 'virus', cls: 'bug', size: 17, level: 2 },
      monolith: { color: CSS.amber, tint: PALETTE.amber, speed: 18, art: 'monolith', cls: 'legacy', size: 22, level: 3 },
      microservice: { color: CSS.cyan, tint: PALETTE.cyan, speed: 38, art: 'microservice', cls: 'bug', size: 17, level: 2 },
      indep: { color: CSS.cyan, tint: PALETTE.cyan, speed: 38, art: 'indep', cls: 'bug', size: 18, level: 3 },
      spec: { color: CSS.white, tint: PALETTE.white, speed: 40, art: 'spec', cls: 'deadline', size: 17, level: 3 },
      // niv.4 et 5 : réservés aux difficultés CTO BURNOUT et DIEU DU TERMINAL
      consultant: { color: CSS.gold, tint: PALETTE.gold, speed: 48, art: 'consultant', cls: 'deadline', size: 18, level: 4 },
      obfuscator: { color: CSS.white, tint: PALETTE.white, speed: 45, art: 'obfuscator', cls: 'legacy', size: 18, level: 4 },
      ransomware: { color: CSS.red, tint: PALETTE.red, speed: 32, art: 'ransomware', cls: 'legacy', size: 18, level: 5 },
      po: { color: CSS.magenta, tint: PALETTE.magenta, speed: 24, art: 'po', cls: 'deadline', size: 18, level: 5 },
    }[kind];
    const label = this.labelFor(kind);
    const techName = conf.art === 'legacy' ? label : null;
    const masked = this.rollMask(kind, label);
    this.addEnemy({
      kind, cls: conf.cls, label, level: conf.level,
      masked,
      flipped: !masked && this.rollFlip(kind),
      // le monolithe encaisse un 2e mot après le premier
      extraWords: kind === 'monolith'
        ? [pickWord(GINES_MODE ? wordBank('insults') : WORDS.exceptions,
            { maxLen: this.diff.maxLen + 8, exclude: new Set([label]) })]
        : null,
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
      const lvlColor = [CSS.greenSoft, CSS.amber, CSS.red][spec.level - 1] || CSS.red;
      let badge = `${T('lvl')}${spec.level} ${'▲'.repeat(spec.level)}`;
      if (spec.masked) badge += T('minified');
      if (spec.flipped) badge += T('flippedBadge');
      if (spec.kind === 'spammer') badge += T('recruiter');
      c.add(this.add.text(0, -art.height - 16, badge, {
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

    if (spec.flipped) rest.setFlipY(true);
    const e = {
      ...spec, container: c, art, typedText: typed, restText: rest,
      progress: 0, baseY: spec.y, phase: Math.random() * Math.PI * 2,
      glitchAt: this.time.now + Phaser.Math.Between(800, 3000),
    };
    if (e.kind === 'spammer') e.fireAt = this.time.now + 2500;
    if (e.kind === 'ghost') e.fadeAt = this.time.now + Phaser.Math.Between(1200, 2500);
    if (e.kind === 'ransomware') e.mutateAt = this.time.now + 6000;
    if (e.kind === 'po') e.ideaAt = this.time.now + 3500;
    if (e.kind === 'microservice') { e.gen = e.gen || 0; e.splitAt = this.time.now + 8000; }
    this.updateLabel(e); // applique le masquage "minifié" dès l'apparition
    this.enemies.push(e);
    return e;
  }

  /* LE RECRUTEUR lance un InMail : petit missile rapide à taper lui aussi. */
  fireMissile(sp) {
    Sfx.missile();
    this.scorePopup(sp.container.x, sp.container.y - 120, T('newMessage'), CSS.cyan, 22);
    this.addEnemy({
      kind: 'missile', cls: 'deadline', label: this.labelFor('missile'), level: 1,
      x: sp.container.x - 70,
      y: Phaser.Math.Clamp(sp.container.y + Phaser.Math.Between(-70, 70), LANE_TOP, LANE_BOTTOM),
      speed: 115 * this.diff.speed, color: CSS.red, artKind: 'missile', artSize: 16,
    });
  }

  layoutLabel(e) {
    const tw = e.typedText.width;
    const total = tw + e.restText.width;
    e.typedText.setX(-total / 2);
    e.restText.setX(-total / 2 + tw);
  }

  // ------------------------------------------------------------ boss
  spawnBoss(isFinal = false) {
    if (this.over) return;
    this.bossPending = false;
    Sfx.bossSpawn();
    Music.setIntensity(4);
    this.cameras.main.shake(isFinal ? 800 : 500, isFinal ? 0.009 : 0.006);
    // mode infini : 3 boss spéciaux tournent sur les vagues de boss
    const variant = this.infinite ? INFINITE_BOSSES[(Math.max(Math.floor(this.wave / 4), 1) - 1) % INFINITE_BOSSES.length] : null;
    // le DSI énervé encaisse 2 commandes de plus que les boss ordinaires
    const cmdCount = Math.max(2, this.diff.bossCmds + (isFinal ? 2 : variant ? variant.cmdDelta : 0));
    const cmds = [];
    const used = new Set();
    let bossBank = GINES_MODE ? wordBank('insults') : WORDS.commands;
    if (variant && variant.longest && !GINES_MODE) {
      // la dette technique : les commandes les plus interminables du shell
      bossBank = [...WORDS.commands].sort((a, b) => b.length - a.length).slice(0, 25);
    }
    for (let i = 0; i < cmdCount; i++) {
      const c = pickWord(bossBank, { exclude: used });
      used.add(c);
      cmds.push(c);
    }
    const c = this.add.container(SPAWN_X + 100, GAME_H / 2);
    const art = this.add.text(0, 0,
      isFinal ? ASCII.finalBoss[0]
        : variant ? ASCII[variant.art][0]
          : Phaser.Utils.Array.GetRandom(ASCII.boss), {
        fontFamily: FONT, fontSize: isFinal ? '26px' : '30px',
        color: isFinal ? CSS.magenta : variant ? variant.color : CSS.red,
        align: 'center', lineSpacing: -4,
      }).setOrigin(0.5, 1);
    const name = this.add.text(0, -art.height - 36,
      isFinal ? T('finalBossName') : variant ? T(variant.nameKey) : T('bossName'), {
        fontFamily: FONT, fontSize: isFinal ? '32px' : '26px', color: CSS.red,
      }).setOrigin(0.5);
    const hp = this.add.text(0, -art.height - 10, '', {
      fontFamily: FONT, fontSize: '24px', color: CSS.amber,
    }).setOrigin(0.5);
    const typed = this.add.text(0, 12, '', { fontFamily: FONT, fontSize: '32px', color: CSS.amber }).setOrigin(0, 0);
    const rest = this.add.text(0, 12, cmds[0], { fontFamily: FONT, fontSize: '32px', color: CSS.white }).setOrigin(0, 0);
    c.add([name, hp, art, typed, rest]);

    this.boss = {
      kind: 'boss', cls: 'boss', isFinal, variant, container: c, art, typedText: typed, restText: rest,
      hpText: hp, cmds, cmdIndex: 0, label: cmds[0], progress: 0,
      x: SPAWN_X + 100, y: GAME_H / 2, baseY: GAME_H / 2, phase: 0,
      speed: 18 * this.diff.speed * (variant ? variant.speedMult : 1), color: CSS.red,
      glitchAt: this.time.now + 500,
      cmdStart: this.time.now,
    };
    if (isFinal) this.tweens.add({ targets: name, alpha: 0.4, duration: 380, yoyo: true, repeat: -1 });
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
    const sm = this.speedMult(b, b.cmdStart ? this.time.now - b.cmdStart : 0);
    const pts = Math.round(b.label.length * 15 * this.multiplier() * sm);
    this.score += pts;
    this.scorePopup(b.container.x, b.container.y - 140,
      sm >= 1.5 ? `+${pts} ${T('fast')} ×${sm.toFixed(1)}` : `+${pts}`, CSS.amber, 36);
    b.cmdStart = this.time.now; // chrono de la commande suivante
    if (b.cmdIndex >= b.cmds.length) return this.killEnemy(b);
    // boss du mode infini : certains ripostent quand ils encaissent
    if (b.variant && b.variant.spawnOnHit) this.spawnEnemy(b.variant.spawnOnHit);
    if (b.variant && b.variant.smokeOnHit) this.spawnSmokeCloud(b.container.x - 320, b.container.y);
    if (b.variant && b.variant.rerollOnHit) {
      // le framework du jour pivote : la commande suivante change
      b.cmds[b.cmdIndex] = pickWord(GINES_MODE ? wordBank('insults') : WORDS.commands,
        { exclude: new Set(b.cmds) });
    }
    if (b.variant && b.variant.costPerHit) {
      // la facture cloud : chaque coup encaissé se paie
      this.score = Math.max(0, this.score - b.variant.costPerHit);
      this.scorePopup(b.container.x, b.container.y - 170, `-${b.variant.costPerHit}`, CSS.gold, 28);
    }
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
    // items : touches jamais utilisées pour taper les mots
    if (e.key === 'Enter') { this.useBomb(); return; }
    if (e.key === 'Backspace') { e.preventDefault(); this.useLaser(); return; }
    if (e.key === 'F2') { Sfx.toggleMute(); return; } // secours discret
    if (e.key.length !== 1) return;
    e.preventDefault();
    Sfx.ensure();
    const char = e.key;

    // pouvoirs du SUPER COMBO (a/z/e) : la frappe garde TOUJOURS la priorité,
    // le pouvoir ne part que si la lettre ne correspond à aucune saisie valide
    if (this.superComboEnabled && (char === 'a' || char === 'z' || char === 'e')
        && !this.isValidKeystroke(char) && this.tryStarPower(char)) return;

    // S coupe/active le son — même règle : seulement si la lettre ne tape rien
    if ((char === 's' || char === 'S') && !this.isValidKeystroke(char)) {
      Sfx.toggleMute();
      return;
    }

    if (!this.target) {
      // verrouille l'ennemi correspondant le plus proche de la prod
      const candidates = this.enemies.filter((en) => en.label[0] === char);
      if (!candidates.length) { this.softMiss(); return; }
      candidates.sort((a, b) => a.container.x - b.container.x);
      this.target = candidates[0];
      this.target.lockTime = this.time.now; // départ du chrono pour le bonus vitesse
    }

    const t = this.target;
    // l'espace est facultatif : taper directement la lettre qui le suit le saute
    const skipSpace = t.label[t.progress] === ' ' && char === t.label[t.progress + 1];
    if (char === t.label[t.progress] || skipSpace) {
      t.progress += skipSpace ? 2 : 1;
      this.stats.typedOK++;
      Sfx.blip(this.combo);
      this.updateLabel(t);
      if (t.progress >= t.label.length) {
        if (t.kind === 'boss') { this.target = null; this.bossHit(); }
        else if (t.extraWords && t.extraWords.length) this.monolithNext(t);
        else this.killEnemy(t);
      } else if (t.kind === 'indep' && !t.dodged && t.progress >= Math.ceil(t.label.length / 2)) {
        this.indepDodge(t);
      }
    } else {
      this.typoOn(t);
    }
  }

  /* L'INDÉP esquive une fois, à la moitié de son mot : "plus dispo", il se
     téléporte plus loin (la saisie et le verrouillage sont conservés). */
  indepDodge(e) {
    e.dodged = true;
    Sfx.missile();
    this.scorePopup(e.container.x, e.container.y - 90, T('indepDodge'), CSS.cyan, 24);
    e.container.x = Math.min(e.container.x + 240, SPAWN_X - 40);
    e.baseY = Phaser.Math.Between(LANE_TOP, LANE_BOTTOM);
    e.container.setAlpha(0.2);
    this.tweens.add({ targets: e.container, alpha: 1, duration: 350 });
  }

  /* …mais une fois son mot fini, il accepte la mission : il facture et
     élimine l'ennemi le plus proche de la prod avant de partir. */
  indepContract(e) {
    const targets = this.enemies.filter((v) => v.kind !== 'boss' && v.cls !== 'powerup');
    if (!targets.length) return;
    targets.sort((a, b) => a.container.x - b.container.x);
    const victim = targets[0];
    this.scorePopup(e.container.x, e.container.y - 100, T('indepHired'), CSS.cyan, 26);
    this.time.delayedCall(300, () => {
      if (!victim.container.active || !this.enemies.includes(victim) || this.over) return;
      this.scorePopup(victim.container.x, victim.container.y - 80, T('indepKill'), CSS.cyan, 24);
      this.killEnemy(victim);
    });
  }

  /* Le monolithe encaisse : premier mot fini = points partiels + recul,
     puis il faut taper son second mot. */
  monolithNext(e) {
    Sfx.bossHit();
    const pts = Math.round(e.label.length * 10 * (e.level || 1) * this.multiplier());
    this.score += pts;
    this.scorePopup(e.container.x, e.container.y - 50, `+${pts}`, CSS.amber, 30);
    this.sparks.explode(22, e.container.x, e.container.y);
    e.label = e.extraWords.shift();
    e.progress = 0;
    e.masked = null;
    e.container.x = Math.min(e.container.x + 140, SPAWN_X);
    if (this.target === e) e.lockTime = this.time.now;
    this.updateLabel(e);
    this.refreshHud();
  }

  /* Le microservice se "scale out" : il se scinde en 2 instances plus petites
     (mots plus courts) toutes les 8 s, sur 2 générations max — 1 devient 4. */
  splitMicroservice(e) {
    Phaser.Utils.Array.Remove(this.enemies, e);
    if (this.target === e) { this.target = null; this.lockLine.clear(); }
    this.scorePopup(e.container.x, e.container.y - 80, T('microSplit'), CSS.cyan, 26);
    Sfx.powerup();
    const ex = new Set(this.enemies.map((x) => x.label));
    for (let i = 0; i < 2; i++) {
      const label = pickWord(GINES_MODE ? wordBank('insults') : WORDS.keywords,
        { maxLen: Math.max(4, 7 - e.gen * 2), exclude: ex });
      ex.add(label);
      this.addEnemy({
        kind: 'microservice', cls: 'bug', label, level: 2, gen: e.gen + 1,
        x: Math.min(e.container.x + 30, SPAWN_X),
        y: Phaser.Math.Clamp(e.container.y + (i ? 80 : -80), LANE_TOP, LANE_BOTTOM),
        speed: e.speed * 1.15, color: CSS.cyan, artKind: 'microservice',
        artSize: Math.max(12, 17 - e.gen * 2),
      });
    }
    e.container.destroy();
  }

  /* LE PO INSPIRÉ : tant qu'il vit, une idée toutes les 5 s — le mot d'un
     autre ennemi se rallonge d'une "petite feature en plus" (scope creep). */
  scopeCreep(po) {
    const victims = this.enemies.filter((v) => v !== po && v.kind !== 'boss'
      && v.cls !== 'powerup' && v.label.length < 26);
    if (!victims.length) return;
    const v = Phaser.Utils.Array.GetRandom(victims);
    v.label += pickWord(wordBank('scopeCreep'), {});
    this.updateLabel(v);
    Sfx.blip(2);
    this.scorePopup(po.container.x, po.container.y - 100, T('newIdea'), CSS.magenta, 22);
    this.scorePopup(v.container.x, v.container.y - 80, T('scopeCreep'), CSS.magenta, 24);
  }

  /* L'obfuscateur meurt en lâchant un écran de fumée : un nuage opaque
     masque les ennemis dans la zone pendant 5 s, puis se dissipe. */
  spawnSmokeCloud(x, y) {
    this.scorePopup(x, y - 100, T('smokeScreen'), CSS.white, 28);
    const cloud = this.add.container(x, y).setDepth(12);
    for (let i = 0; i < 26; i++) {
      const puff = this.add.circle(
        Phaser.Math.Between(-280, 280), Phaser.Math.Between(-170, 170),
        Phaser.Math.Between(60, 130), 0x18231c, Phaser.Math.FloatBetween(0.85, 0.96));
      cloud.add(puff);
      // chaque volute respire un peu, pour un rendu moins statique
      this.tweens.add({
        targets: puff, scaleX: 1.25, scaleY: 1.25,
        duration: Phaser.Math.Between(900, 1600), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
    this.tweens.add({ targets: cloud, x: x + 50, duration: 5000 });
    this.time.delayedCall(4200, () => {
      if (!cloud.active) return;
      this.tweens.add({ targets: cloud, alpha: 0, duration: 800, onComplete: () => cloud.destroy() });
    });
  }

  /* Le virus se réplique : 2 mini-bugs apparaissent là où il meurt. */
  splitVirus(e) {
    this.scorePopup(e.container.x, e.container.y - 80, T('virusSplit'), CSS.red, 26);
    const ex = new Set(this.enemies.map((x) => x.label));
    for (let i = 0; i < 2; i++) {
      const label = pickWord(GINES_MODE ? wordBank('insults') : WORDS.keywords, { maxLen: 6, exclude: ex });
      ex.add(label);
      this.addEnemy({
        kind: 'bug', cls: 'bug', label, level: 1,
        x: Math.min(e.container.x + 50, SPAWN_X),
        y: Phaser.Math.Clamp(e.container.y + (i ? 75 : -75), LANE_TOP, LANE_BOTTOM),
        speed: 60 * this.diff.speed, color: CSS.red, artKind: 'bug', artSize: 14,
      });
    }
  }

  /* La touche servirait-elle à taper ? (lettre attendue de la cible, espace
     sautable, ou première lettre d'un ennemi verrouillable) */
  isValidKeystroke(char) {
    if (this.target) {
      const t = this.target;
      return char === t.label[t.progress]
        || (t.label[t.progress] === ' ' && char === t.label[t.progress + 1]);
    }
    return this.enemies.some((en) => en.label[0] === char);
  }

  /* Pouvoirs des étoiles de combat : A bouclier 3 s (1★) · E détruit
     l'ennemi le plus fort hors boss (2★) · Z +1 vie (3★).
     Retourne false si le pouvoir ne peut pas partir (la frappe reprend la main). */
  tryStarPower(key) {
    const cost = { a: 1, e: 2, z: 3 }[key];
    if (this.comboStars < cost) return false;

    if (key === 'z') {
      if (this.lives >= this.diff.lives) return false; // vies au max : rien à soigner
      this.comboStars -= cost;
      this.lives++;
      Sfx.powerup();
      this.scorePopup(PLAYER_X + 170, this.player.y - 90, T('starLife'), CSS.gold, 32);
    } else if (key === 'a') {
      this.comboStars -= cost;
      this.invincibleUntil = this.time.now + 3000;
      Sfx.powerup();
      this.scorePopup(PLAYER_X + 170, this.player.y - 90, T('starShield'), CSS.gold, 32);
      this.player.setColor(CSS.gold);
      this.time.delayedCall(3000, () => { if (this.player.active) this.player.setColor(CSS.green); });
    } else {
      // E : annihile l'ennemi le plus fort (niveau max, puis le plus proche)
      const targets = this.enemies.filter((v) => v.kind !== 'boss' && v.cls !== 'powerup');
      if (!targets.length) return false;
      targets.sort((x, y) => (y.level || 1) - (x.level || 1) || x.container.x - y.container.x);
      const victim = targets[0];
      this.comboStars -= cost;
      this.scorePopup(victim.container.x, victim.container.y - 80, T('starSmite'), CSS.gold, 32);
      this.redSparks.explode(45, victim.container.x, victim.container.y);
      this.killEnemy(victim);
    }
    this.refreshHud();
    return true;
  }

  softMiss() {
    this.stats.errors++;
    Sfx.error();
  }

  typoOn(t) {
    this.stats.errors++;
    this.combo = 0;
    this.runStarTier = 0; // nouvelle série — les étoiles, elles, restent
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
    this.updateLabel(t);
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
      const pts = Math.round((e.isFinal ? 1500 : 500) * this.multiplier());
      this.score += pts;
      this.scorePopup(e.container.x, e.container.y - 80, `+${pts}`, CSS.gold, 44);
      if (e.isFinal) {
        // le DSI est vaincu : la partie est gagnée
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        Sfx.kill();
        this.explodeLetters(e);
        e.container.destroy();
        return this.victory();
      }
      this.dropBonus(e, 'life'); // le boss lâche toujours une vie
    } else {
      this.stats.kills[e.cls] = (this.stats.kills[e.cls] || 0) + 1;
      const sm = this.speedMult(e, e.lockTime ? this.time.now - e.lockTime : 0);
      const pts = Math.round(e.label.length * 10 * (e.level || 1) * this.multiplier() * sm);
      this.score += pts;
      const fast = sm >= 1.5;
      this.scorePopup(e.container.x, e.container.y - 50,
        fast ? `+${pts} ${T('fast')} ×${sm.toFixed(1)}` : `+${pts}`,
        fast ? CSS.gold : CSS.white, fast ? 34 : 30);
      this.sparks.explode(Math.min(14 + e.label.length * 2, 50), e.container.x, e.container.y);
      if (e.kind === 'virus') this.splitVirus(e);
      if (e.kind === 'obfuscator') this.spawnSmokeCloud(e.container.x, e.container.y);
      if (e.kind === 'indep') this.indepContract(e);
      this.rollDrop(e);
    }
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.checkComboStars();
    Sfx.kill();
    this.explodeLetters(e);
    if (e.cls === 'powerup') this.applyPowerup(e.effect);
    e.container.destroy();
    this.refreshHud();
    this.checkWaveEnd();
  }

  /* ITEM "kill -9" (ENTRÉE) : tue le process ennemi le plus proche de la prod.
     Ne touche ni le boss ni les power-ups. */
  useBomb() {
    const px = PLAYER_X;
    if (this.bombs <= 0) {
      Sfx.error();
      this.scorePopup(px + 120, this.player.y - 60, T('noBombs'), CSS.red, 28);
      return;
    }
    const targets = this.enemies.filter((e) => e.kind !== 'boss' && e.cls !== 'powerup');
    if (!targets.length) {
      Sfx.error();
      this.scorePopup(px + 120, this.player.y - 60, T('noProcess'), CSS.red, 28);
      return;
    }
    this.bombs--;
    this.scorePopup(px + 160, this.player.y - 90, T('bombSent'), CSS.gold, 30);
    targets.sort((a, b) => a.container.x - b.container.x);
    const victim = targets[0];
    Sfx.bomb();
    this.cameras.main.shake(250, 0.006);
    this.redSparks.explode(70, victim.container.x, victim.container.y);
    this.killEnemy(victim);
    this.refreshHud();
  }

  /* ITEM "autocomplete" (EFFACER) : l'IA complète les 4 prochaines lettres
     de la cible verrouillée. */
  useLaser() {
    if (this.lasers <= 0) {
      Sfx.error();
      this.scorePopup(PLAYER_X + 120, this.player.y - 60, T('noLasers'), CSS.red, 28);
      return;
    }
    const t = this.target;
    if (!t) {
      Sfx.error();
      this.scorePopup(PLAYER_X + 120, this.player.y - 60, T('lockFirst'), CSS.red, 28);
      return;
    }
    this.lasers--;
    this.scorePopup(t.container.x, t.container.y - 90, T('suggestion'), CSS.cyan, 28);
    Sfx.laser();
    // rayon visuel éphémère du dev vers la cible
    const beam = this.add.graphics().setDepth(36);
    beam.lineStyle(5, PALETTE.cyan, 0.95);
    beam.lineBetween(PLAYER_X + 40, this.player.y - 30, t.container.x, t.container.y);
    this.tweens.add({ targets: beam, alpha: 0, duration: 280, onComplete: () => beam.destroy() });
    this.sparks.explode(25, t.container.x, t.container.y);

    t.progress = Math.min(t.progress + 4, t.label.length);
    this.updateLabel(t);
    if (t.progress >= t.label.length) {
      if (t.kind === 'boss') { this.target = null; this.bossHit(); }
      else if (t.extraWords && t.extraWords.length) this.monolithNext(t);
      else this.killEnemy(t);
    } else if (t.kind === 'indep' && !t.dodged && t.progress >= Math.ceil(t.label.length / 2)) {
      this.indepDodge(t);
    }
    this.refreshHud();
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
    // arcade de salon : drops généreux pour que ça pleuve un peu
    const chance = { elite: 0.55, legacy: 0.4, deadline: 0.3, bug: 0.18 }[e.kind] || 0;
    if (Math.random() >= chance) return;
    const pool = ['life', 'score', 'combo', 'slowmo', 'bomb', 'bomb', 'laser', 'laser'];
    this.dropBonus(e, Phaser.Utils.Array.GetRandom(pool));
  }

  dropBonus(e, type) {
    const x = e.container.x;
    const y = e.container.y - 90;
    Sfx.powerup();
    if (type === 'life' && this.lives < this.diff.lives) {
      this.lives++;
      this.scorePopup(x, y, T('lifeUp'), CSS.cyan, 34);
    } else if (type === 'life') {
      // vies au max : converti en points
      const pts = Math.round(300 * this.diff.scoreMult);
      this.score += pts;
      this.scorePopup(x, y, `${T('prodHealthy')} +${pts}`, CSS.cyan, 32);
    } else if (type === 'score') {
      const pts = Math.round(250 * this.multiplier());
      this.score += pts;
      this.scorePopup(x, y, `BONUS +${pts}`, CSS.gold, 36);
    } else if (type === 'combo') {
      this.combo += 5;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.checkComboStars();
      this.scorePopup(x, y, 'COMBO +5', CSS.amber, 34);
    } else if (type === 'slowmo') {
      this.timeScale = 0.35;
      this.time.delayedCall(3000, () => { this.timeScale = 1; });
      this.scorePopup(x, y, '☕ SLOW-MO 3s', CSS.gold, 34);
    } else if (type === 'bomb') {
      if (this.bombs < 3) {
        this.bombs++;
        this.scorePopup(x, y, '+1 KILL -9', CSS.gold, 34);
      } else {
        const pts = Math.round(150 * this.diff.scoreMult);
        this.score += pts;
        this.scorePopup(x, y, `${T('stockFull')} +${pts}`, CSS.gold, 30);
      }
    } else if (type === 'laser') {
      if (this.lasers < 5) {
        this.lasers++;
        this.scorePopup(x, y, '+1 AUTOCOMPLETE', CSS.cyan, 34);
      } else {
        const pts = Math.round(150 * this.diff.scoreMult);
        this.score += pts;
        this.scorePopup(x, y, `${T('stockFull')} +${pts}`, CSS.cyan, 30);
      }
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
      this.showBanner(T('powerSlowmo'));
      this.timeScale = 0.35;
      this.time.delayedCall(5000, () => { this.timeScale = 1; });
    } else if (effect === 'knockback') {
      this.showBanner(T('powerRevert'));
      this.enemies.forEach((e) => {
        if (e.kind !== 'boss') this.tweens.add({ targets: e.container, x: e.container.x + 260, duration: 350 });
      });
    } else if (effect === 'nuke') {
      this.showBanner(T('powerNuke'));
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
    if ((this.godMode || this.time.now < this.invincibleUntil) && e.cls !== 'powerup') {
      // invincible : l'ennemi s'écrase sur un bouclier, aucun dégât
      this.redSparks.explode(25, PROD_X + 80, e.container.y);
      this.scorePopup(PROD_X + 160, e.container.y,
        this.godMode ? T('invincible') : T('starShieldBlock'), this.godMode ? CSS.red : CSS.gold, 26);
      if (e.kind === 'boss') this.boss = null;
      e.container.destroy();
      this.checkWaveEnd();
      return;
    }
    if (e.cls !== 'powerup') {
      this.lives -= e.kind === 'boss' ? ((e.variant && e.variant.damage) || 2) : 1;
      this.combo = 0;
      this.runStarTier = 0;
      this.stats.missedWords.push(e.label);
      Sfx.incident();
      this.cameras.main.shake(350, 0.01);
      this.redSparks.explode(60, PROD_X + 80, e.container.y);
      this.flashRect.setAlpha(0.35);
      this.tweens.add({ targets: this.flashRect, alpha: 0, duration: 450 });
      this.showBanner(e.kind === 'boss' ? T('bossTouch') : T('incident'));
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

  /* Fin de partie commune (défaite ou victoire) : fige le jeu et calcule les stats. */
  endRun() {
    this.over = true;
    // si la fin arrive dans un état suspendu (pause, slowmo), tout rétablir
    this.paused = false;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.pauseOverlay.setVisible(false);
    Music.stop();
    this.input.keyboard.off('keydown', this.keyHandler);
    this.lockLine.clear();
    this.enemies.forEach((e) => e.container.destroy());
    this.enemies = [];

    const duration = (this.time.now - this.stats.startTime) / 1000;
    const minutes = Math.max(duration / 60, 1 / 60);
    const wpm = Math.round((this.stats.typedOK / 5) / minutes);
    const total = this.stats.typedOK + this.stats.errors;
    const accuracy = total ? Math.round((this.stats.typedOK / total) * 1000) / 10 : 100;
    return {
      score: this.score, wave: this.wave, wpm, accuracy,
      maxCombo: this.maxCombo, comboStars: this.comboStars, durationS: Math.round(duration),
      kills: this.stats.kills, missedWords: this.stats.missedWords.slice(0, 100),
      godMode: this.godMode,
    };
  }

  /* La prod est down : le serveur part en fumée — sprite carbonisé,
     braises qui montent et panache de fumée jusqu'au changement de scène. */
  burnProd() {
    this.prodArt.setText(ASCII.prodBurnt).setColor('#6b4226');
    if (REDUCED_MOTION) return;
    this.tweens.add({ targets: this.prodArt, alpha: 0.55, duration: 160, yoyo: true, repeat: -1 });
    this.add.particles(0, 0, 'px', {
      x: { min: PROD_X - 45, max: PROD_X + 45 },
      y: { min: GAME_H / 2 - 80, max: GAME_H / 2 + 90 },
      speedY: { min: -160, max: -60 }, speedX: { min: -20, max: 20 },
      lifespan: { min: 400, max: 900 }, scale: { start: 2.6, end: 0 },
      tint: [PALETTE.red, PALETTE.amber, PALETTE.gold], frequency: 18,
    }).setDepth(35);
    this.add.particles(0, 0, 'px', {
      x: { min: PROD_X - 40, max: PROD_X + 40 }, y: GAME_H / 2 - 95,
      speedY: { min: -90, max: -40 }, speedX: { min: -15, max: 25 },
      lifespan: { min: 900, max: 1700 }, scale: { start: 3.2, end: 0.6 },
      tint: [0x222222, 0x3a3a3a], alpha: { start: 0.8, end: 0 }, frequency: 40,
    }).setDepth(34);
  }

  gameOver() {
    const results = this.endRun();
    Sfx.gameOver();
    this.burnProd();

    const downTxt = this.add.text(GAME_W / 2, GAME_H / 2, T('prodDown'), {
      fontFamily: FONT, fontSize: '120px', color: CSS.red, align: 'center',
    }).setOrigin(0.5).setDepth(60).setAlpha(0);
    this.tweens.add({ targets: downTxt, alpha: 1, duration: 200, yoyo: true, repeat: 6 });
    this.cameras.main.shake(900, 0.012);

    this.time.delayedCall(2300, () => {
      this.scene.start('GameOver', { difficulty: this.diff, results });
    });
  }

  /* Le DSI énervé est vaincu : chaque seconde restante au compte à rebours
     rapporte des points (×25, pondérés par la difficulté). */
  victory() {
    const remainingS = Math.max(0, Math.round((this.parMs - this.playMs) / 1000));
    const timeBonus = Math.round(remainingS * 25 * this.diff.scoreMult);
    this.score += timeBonus;
    const results = this.endRun();
    results.won = true;
    results.timeBonus = timeBonus;
    Sfx.waveClear();
    Music.stop();

    const winTxt = this.add.text(GAME_W / 2, GAME_H / 2 - 40, T('prodSaved'), {
      fontFamily: FONT, fontSize: '110px', color: CSS.green, align: 'center',
    }).setOrigin(0.5).setDepth(60).setAlpha(0);
    this.tweens.add({ targets: winTxt, alpha: 1, duration: 200, yoyo: true, repeat: 6 });
    if (timeBonus > 0) {
      this.add.text(GAME_W / 2, GAME_H / 2 + 60,
        `${T('timeBonus')} +${timeBonus}  (${remainingS}s)`, {
          fontFamily: FONT, fontSize: '44px', color: CSS.gold,
        }).setOrigin(0.5).setDepth(60);
    }
    this.sparks.explode(160, GAME_W / 2, GAME_H / 2);

    this.time.delayedCall(3200, () => {
      this.scene.start('GameOver', { difficulty: this.diff, results });
    });
  }

  // ------------------------------------------------------------ update
  update(time, delta) {
    if (this.over || this.paused) return;
    // clamp : au retour d'un onglet en pause, delta peut valoir plusieurs
    // secondes et téléporter tous les ennemis sur la prod
    const dt = (Math.min(delta, 50) / 1000) * this.timeScale;

    // temps de jeu réel (pauses exclues, slow-mo inclus) + compte à rebours
    this.playMs += Math.min(delta, 50);
    this.refreshTime();

    // FPS, rafraîchi 4 fois par seconde
    if (!this._fpsAt || time > this._fpsAt) {
      this._fpsAt = time + 250;
      this.hudFps.setText(`${Math.round(this.game.loop.actualFps)} fps${Sfx.muted ? T('mutedTag') : ''}`);
    }

    // mode disco : pluie colorée, dance floor qui pulse, ennemis chamarrés
    if (DISCO_MODE && (!this._discoAt || time > this._discoAt)) {
      this._discoAt = time + (REDUCED_MOTION ? 800 : 250);
      const palette = [CSS.magenta, CSS.cyan, CSS.gold, CSS.green, CSS.red, CSS.white];
      for (let i = 0; i < 6; i++) {
        Phaser.Utils.Array.GetRandom(this.bgGlyphs)
          .setColor(Phaser.Utils.Array.GetRandom(palette));
      }
      if (!REDUCED_MOTION && this.discoTiles) {
        for (let i = 0; i < 4; i++) {
          const tile = Phaser.Utils.Array.GetRandom(this.discoTiles);
          tile.fillColor = Phaser.Display.Color.HexStringToColor(
            Phaser.Utils.Array.GetRandom(palette)).color;
        }
      }
      // les sprites des ennemis (pas leurs mots !) changent de couleur
      for (let i = 0; i < 2 && this.enemies.length; i++) {
        const e = Phaser.Utils.Array.GetRandom(this.enemies);
        if (e.art && e.art.active) e.art.setColor(Phaser.Utils.Array.GetRandom(palette));
      }
    }

    // pluie de fond
    for (const g of this.bgGlyphs) {
      g.y += g.fall * dt;
      if (g.y > GAME_H) { g.y = -20; g.x = Phaser.Math.Between(0, GAME_W); }
    }

    for (const e of [...this.enemies]) {
      e.container.x -= e.speed * dt * this.speedScale;
      e.phase += dt * 2.2;
      e.container.y = e.baseY + Math.sin(e.phase) * 9;
      // glitch visuel périodique (cosmétique : coupé en animations réduites)
      if (!REDUCED_MOTION && time > e.glitchAt) {
        e.glitchAt = time + Phaser.Math.Between(900, 2600);
        e.art.setX(Phaser.Math.Between(-4, 4));
        e.art.setAlpha(0.55);
        this.time.delayedCall(90, () => {
          if (e.art.active) { e.art.setX(0); e.art.setAlpha(1); }
        });
      }
      // le recruteur spamme tant qu'il est en vie (4 messages max à l'écran)
      if (e.kind === 'spammer' && e.container.x < GAME_W - 120 && time > e.fireAt
          && this.enemies.filter((m) => m.kind === 'missile').length < 4) {
        e.fireAt = time + Phaser.Math.Between(3800, 6200);
        this.fireMissile(e);
      }
      // le microservice se scinde en 2 instances avec le temps (2 générations max)
      if (e.kind === 'microservice' && e.gen < 2 && time > e.splitAt) {
        this.splitMicroservice(e);
        continue;
      }
      // le consultant accélère en approchant de la prod (+10 %/s)
      if (e.kind === 'consultant') e.speed += e.speed * 0.10 * dt;
      // le fantôme disparaît par intermittence
      if (e.kind === 'ghost' && time > e.fadeAt) {
        e.fadeAt = time + Phaser.Math.Between(2200, 3800);
        this.tweens.add({ targets: e.container, alpha: 0.12, duration: 220, yoyo: true, hold: 650 });
      }
      // le PO a une idée toutes les 5 s : le mot d'un autre ennemi se rallonge
      if (e.kind === 'po' && time > e.ideaAt) {
        e.ideaAt = time + 5000;
        this.scopeCreep(e);
      }
      // le ransomware "rechiffre" son mot toutes les 6 s : tout est à refaire
      if (e.kind === 'ransomware' && time > e.mutateAt) {
        e.mutateAt = time + 6000;
        e.label = this.labelFor('ransomware');
        e.progress = 0;
        if (this.target === e) e.lockTime = time;
        this.updateLabel(e);
        this.redSparks.explode(14, e.container.x, e.container.y);
        this.scorePopup(e.container.x, e.container.y - 80, T('reEncrypted'), CSS.red, 24);
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
