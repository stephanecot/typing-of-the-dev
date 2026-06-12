/* Menu : titre glitché, sélection de difficulté (flèches + Entrée), top 5. */
'use strict';

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.selected = 1; // normal par défaut
    this.helpOpen = false;
    this.godArmed = false; // Konami Code ↑↑↓↓←→←→BA saisi ici, sur l'accueil
    this.konamiIdx = 0;
    this.ginesIdx = 0; // taper GINES bascule le mode insultes
    Api.loadConfig(); // recharge les réglages admin à chaque passage au menu
    this.buildTitle();
    this.buildDifficulties();
    this.buildFooter();
    this.buildHelp();
    this.loadTopScores();

    this.input.keyboard.on('keydown', (e) => {
      Sfx.ensure();
      if (!Music.playing) Music.start(0); // ambiance d'accueil, plus douce
      this.trackKonami(e.key);
      this.trackGines(e.key);
      if (this.helpOpen) {
        if (e.key === 'ArrowLeft') this.changeHelpPage(-1);
        else if (e.key === 'ArrowRight') this.changeHelpPage(1);
        else if (e.key === 'h' || e.key === 'H' || e.key === 'Escape' || e.key === 'Enter') this.toggleHelp();
        return;
      }
      if (e.key === 'h' || e.key === 'H') this.toggleHelp();
      else if (e.key === 'l' || e.key === 'L') this.toggleLang();
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') this.move(-1);
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') this.move(1);
      else if (e.key === 'Enter' || e.key === ' ') this.launch();
      else if (e.key === 'm' || e.key === 'M' || e.key === 'F2') Sfx.toggleMute();
      else if (e.key >= '1' && e.key <= String(DIFFICULTIES.length)) { this.selected = +e.key - 1; this.refreshDiff(); }
    });

    if (REDUCED_MOTION) this.cameras.main.shake = () => this.cameras.main;
    this.ginesBadge = null;
    this.refreshGinesBadge();
    this.cameras.main.fadeIn(400, 5, 10, 7);
  }

  /* Bascule FR ⇄ EN puis reconstruit le menu (tous les textes sont recréés). */
  toggleLang() {
    setLang(LANG === 'fr' ? 'en' : 'fr');
    Sfx.blip(14);
    this.scene.restart();
  }

  /* Aide en 3 pages : règles, niveaux de difficulté, bestiaire des ennemis.
     Navigation aux flèches ←/→, fermeture H / ÉCHAP. */
  buildHelp() {
    const cx = GAME_W / 2;
    this.helpPage = 0;
    this.helpPanel = this.add.container(0, 0).setDepth(90).setVisible(false);
    this.helpPanel.add(this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x020503, 0.94));

    this.helpPages = [this.buildHelpRules(), this.buildHelpDiffs(), this.buildHelpEnemies(), this.buildHelpBosses()];
    this.helpPages.forEach((p) => this.helpPanel.add(p));

    this.helpHint = this.add.text(cx, GAME_H - 50, '', {
      fontFamily: FONT, fontSize: '32px', color: CSS.green,
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.helpHint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    this.helpPanel.add(this.helpHint);
    this.refreshHelpPage();
  }

  refreshHelpPage() {
    this.helpPages.forEach((p, i) => p.setVisible(i === this.helpPage));
    this.helpHint.setText(T('helpPageHint')(this.helpPage + 1, this.helpPages.length));
  }

  changeHelpPage(dir) {
    this.helpPage = Phaser.Math.Wrap(this.helpPage + dir, 0, this.helpPages.length);
    Sfx.blip(12);
    this.refreshHelpPage();
  }

  // page 1 : règles
  buildHelpRules() {
    const cx = GAME_W / 2;
    const page = this.add.container(0, 0);
    // textes dans i18n.js ; les couleurs suivent l'ordre des sections
    const colors = [CSS.cyan, CSS.green, CSS.amber, CSS.cyan, CSS.red, CSS.gold, CSS.magenta];
    const sections = T('helpSections').map(([title, lines], i) => [title, colors[i] || CSS.white, lines]);

    page.add(this.add.text(cx, 60, T('helpTitle'), {
      fontFamily: FONT, fontSize: '48px', color: CSS.amber,
    }).setOrigin(0.5));

    let y = 118;
    for (const [title, color, lines] of sections) {
      page.add(this.add.text(330, y, `-- ${title} --`, {
        fontFamily: FONT, fontSize: '28px', color,
      }).setOrigin(0, 0));
      y += 34;
      for (const line of lines) {
        page.add(this.add.text(360, y, line, {
          fontFamily: FONT, fontSize: '24px', color: CSS.white,
        }).setOrigin(0, 0).setAlpha(0.92));
        y += 27;
      }
      y += 11;
    }
    return page;
  }

  // page 2 : ce qui change d'une difficulté à l'autre
  buildHelpDiffs() {
    const cx = GAME_W / 2;
    const page = this.add.container(0, 0);
    page.add(this.add.text(cx, 60, T('helpDiffTitle'), {
      fontFamily: FONT, fontSize: '48px', color: CSS.amber,
    }).setOrigin(0.5));
    page.add(this.add.text(cx, 130, T('helpGoal')(GAME_CONFIG.maxSprints), {
      fontFamily: FONT, fontSize: '26px', color: CSS.cyan, align: 'center',
    }).setOrigin(0.5));

    let y = 220;
    DIFFICULTIES.forEach((d, i) => {
      page.add(this.add.text(330, y, `${diffLabel(d)}  ${'★'.repeat(i + 1)}`, {
        fontFamily: FONT, fontSize: '36px', color: CSS.gold,
      }).setOrigin(0, 0));
      page.add(this.add.text(900, y + 6, `« ${diffTagline(d)} »`, {
        fontFamily: FONT, fontSize: '22px', color: CSS.greenSoft,
      }).setOrigin(0, 0));
      const stats = [
        `${T('helpLives')}: ${d.lives}`,
        `${T('helpSpeed')}: ×${d.speed}`,
        `${T('helpSpawn')}: ${(d.spawnMs / 1000).toFixed(1)}s`,
        `${T('helpMaxLen')}: ${d.maxLen >= 99 ? '∞' : d.maxLen}`,
        `${T('helpBossCmds')}: ${d.bossCmds}`,
        `score: ×${d.scoreMult}`,
      ].join('   ·   ');
      page.add(this.add.text(360, y + 42, stats, {
        fontFamily: FONT, fontSize: '26px', color: CSS.white,
      }).setOrigin(0, 0).setAlpha(0.92));
      y += 110;
    });
    return page;
  }

  // couleur de sprite par type d'ennemi (aide pages 3 et 4)
  static ART_COLORS = {
    bug: CSS.green, legacy: CSS.amber, deadline: CSS.magenta, spammer: CSS.cyan,
    missile: CSS.red, powerup: CSS.gold, ghost: CSS.white, virus: CSS.red,
    monolith: CSS.amber, consultant: CSS.gold, ransomware: CSS.red, microservice: CSS.cyan, spec: CSS.white, obfuscator: CSS.white, po: CSS.magenta, indep: CSS.cyan,
    boss: CSS.red, finalBoss: CSS.magenta,
  };

  // page 3 : bestiaire — ennemis groupés par niveau, sur 3 colonnes remplies
  // de haut en bas avec débordement automatique : ajouter un ennemi dans
  // bestiaryGroups (i18n.js) suffit, la mise en page absorbe la croissance.
  buildHelpEnemies() {
    const cx = GAME_W / 2;
    const page = this.add.container(0, 0);
    page.add(this.add.text(cx, 56, T('helpEnemiesTitle'), {
      fontFamily: FONT, fontSize: '48px', color: CSS.amber,
    }).setOrigin(0.5));

    // % d'apparition : part de chaque ennemi dans les vagues d'une partie
    // complète en difficulté max (la seule où toutes les classes existent)
    const diffMax = DIFFICULTIES[DIFFICULTIES.length - 1];
    const counts = {};
    let totalSpawns = 0;
    for (let n = 1; n <= GAME_CONFIG.maxSprints; n++) {
      const bossWave = n === GAME_CONFIG.maxSprints || n % 4 === 0;
      for (const k of waveQueueFor(diffMax, n, bossWave)) {
        counts[k] = (counts[k] || 0) + 1;
        totalSpawns++;
      }
    }
    const pctFor = (kind) => {
      if (!counts[kind]) return '';
      return ` · ~${Math.max(1, Math.round((counts[kind] / totalSpawns) * 100))} %`;
    };
    page.add(this.add.text(cx, 88, T('helpPctNote'), {
      fontFamily: FONT, fontSize: '18px', color: CSS.greenSoft,
    }).setOrigin(0.5));

    const COLS = [110, 610, 1110];
    const TOP = 116, BOTTOM = 812;
    const ENTRY_H = 96, HEADER_H = 42;
    const LEVEL_COLORS = [CSS.green, CSS.amber, CSS.red, CSS.magenta, CSS.cyan, CSS.gold];
    let col = 0;
    let y = TOP;

    const addHeader = (text, color) => {
      page.add(this.add.text(COLS[col], y, `-- ${text} --`, {
        fontFamily: FONT, fontSize: '26px', color,
      }).setOrigin(0, 0));
      y += HEADER_H;
    };

    T('bestiaryGroups').forEach(([groupTitle, entries], gi) => {
      const color = LEVEL_COLORS[gi] || CSS.white;
      // jamais d'en-tête orphelin en bas de colonne
      if (y + HEADER_H + ENTRY_H > BOTTOM && col < COLS.length - 1) { col++; y = TOP; }
      addHeader(groupTitle, color);

      entries.forEach(([kind, name, desc, avail]) => {
        if (y + ENTRY_H > BOTTOM && col < COLS.length - 1) {
          col++;
          y = TOP;
          addHeader(`${groupTitle} ${T('helpCont')}`, color);
        }
        // le sprite "bug" du groupe niv.3 est en réalité l'élite
        const spawnKind = gi === 2 && kind === 'bug' ? 'elite' : kind;
        const x = COLS[col];
        const art = (ASCII[kind][0] || '').replace('<tech>', 'COBOL ');
        page.add(this.add.text(x, y, art, {
          fontFamily: FONT, fontSize: '12px',
          color: MenuScene.ART_COLORS[kind] || CSS.white, align: 'center', lineSpacing: -3,
        }).setOrigin(0, 0));
        page.add(this.add.text(x + 110, y, name, {
          fontFamily: FONT, fontSize: '24px', color: MenuScene.ART_COLORS[kind] || CSS.white,
        }).setOrigin(0, 0));
        page.add(this.add.text(x + 110, y + 25, avail + pctFor(spawnKind), {
          fontFamily: FONT, fontSize: '17px', color: CSS.gold,
        }).setOrigin(0, 0).setAlpha(0.9));
        page.add(this.add.text(x + 110, y + 45, desc, {
          fontFamily: FONT, fontSize: '18px', color: CSS.white,
        }).setOrigin(0, 0).setAlpha(0.9));
        y += ENTRY_H;
      });
      y += 10; // respiration entre les groupes
    });
    return page;
  }

  // page 4 : les boss
  buildHelpBosses() {
    const cx = GAME_W / 2;
    const page = this.add.container(0, 0);
    page.add(this.add.text(cx, 56, T('helpBossesTitle'), {
      fontFamily: FONT, fontSize: '48px', color: CSS.amber,
    }).setOrigin(0.5));

    T('bestiaryBosses').forEach(([kind, name, desc, avail], i) => {
      const x = 300 + i * 660;
      const y = 180;
      page.add(this.add.text(x + 110, y + 230, ASCII[kind][0], {
        fontFamily: FONT, fontSize: '20px',
        color: MenuScene.ART_COLORS[kind] || CSS.white, align: 'center', lineSpacing: -3,
      }).setOrigin(0.5, 1));
      page.add(this.add.text(x + 110, y + 280, name, {
        fontFamily: FONT, fontSize: '36px', color: MenuScene.ART_COLORS[kind] || CSS.white, align: 'center',
      }).setOrigin(0.5, 0));
      page.add(this.add.text(x + 110, y + 322, avail, {
        fontFamily: FONT, fontSize: '24px', color: CSS.gold, align: 'center',
      }).setOrigin(0.5, 0));
      page.add(this.add.text(x + 110, y + 360, desc, {
        fontFamily: FONT, fontSize: '24px', color: CSS.white, align: 'center',
      }).setOrigin(0.5, 0).setAlpha(0.92));
    });
    return page;
  }

  toggleHelp() {
    this.helpOpen = !this.helpOpen;
    if (this.helpOpen) { this.helpPage = 0; this.refreshHelpPage(); }
    this.helpPanel.setVisible(this.helpOpen);
    Sfx.blip(this.helpOpen ? 20 : 5);
  }

  /* Taper G-I-N-E-S : bascule le mode Ginès — tous les mots du jeu
     deviennent des insultes geek (et on retape GINES pour l'éteindre). */
  trackGines(key) {
    const SEQ = ['g', 'i', 'n', 'e', 's'];
    const k = String(key).toLowerCase();
    this.ginesIdx = k === SEQ[this.ginesIdx] ? this.ginesIdx + 1 : (k === SEQ[0] ? 1 : 0);
    if (this.ginesIdx < SEQ.length) return;
    this.ginesIdx = 0;
    GINES_MODE = !GINES_MODE;
    Sfx.powerup();
    this.refreshGinesBadge();
  }

  refreshGinesBadge() {
    if (this.ginesBadge) { this.ginesBadge.destroy(); this.ginesBadge = null; }
    if (!GINES_MODE) return;
    this.ginesBadge = this.add.text(GAME_W / 2, 320, T('ginesOn'), {
      fontFamily: FONT, fontSize: '32px', color: CSS.magenta,
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: this.ginesBadge, alpha: 0.4, duration: 450, yoyo: true, repeat: -1 });
  }

  /* ↑↑↓↓←→←→BA sur l'écran d'accueil : arme le god mode pour la prochaine
     partie. Invincible, mais marqué TRICHEUR et score non enregistré. */
  trackKonami(key) {
    if (this.godArmed) return;
    const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    if (key === SEQ[this.konamiIdx]) {
      this.konamiIdx++;
      if (this.konamiIdx >= SEQ.length) this.armGodMode();
    } else {
      this.konamiIdx = key === SEQ[0] ? 1 : 0;
    }
  }

  armGodMode() {
    this.godArmed = true;
    Sfx.powerup();
    Sfx.bossSpawn();
    this.cameras.main.shake(300, 0.005);
    const badge = this.add.text(GAME_W / 2, 320,
      T('konami'), {
        fontFamily: FONT, fontSize: '34px', color: CSS.red,
      }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: badge, alpha: 0.35, duration: 400, yoyo: true, repeat: -1 });
  }

  buildTitle() {
    const cx = GAME_W / 2;
    const style = (color) => ({
      fontFamily: FONT, fontSize: '110px', color, align: 'center',
    });
    // 3 couches pour l'aberration chromatique
    this.titleR = this.add.text(cx, 150, 'TYPING OF THE DEV', style('#ff3b3b')).setOrigin(0.5).setAlpha(0.55);
    this.titleC = this.add.text(cx, 150, 'TYPING OF THE DEV', style(CSS.cyan)).setOrigin(0.5).setAlpha(0.55);
    this.title = this.add.text(cx, 150, 'TYPING OF THE DEV', style(CSS.green)).setOrigin(0.5);

    this.add.text(cx, 228, '— DEVFEST TOULOUSE 2026 —', {
      fontFamily: FONT, fontSize: '30px', color: CSS.amber, letterSpacing: 6,
    }).setOrigin(0.5);
    this.add.text(cx, 274, T('menuTagline'), {
      fontFamily: FONT, fontSize: '26px', color: CSS.greenSoft,
    }).setOrigin(0.5);

    // glitch périodique du titre (coupé en animations réduites)
    if (!REDUCED_MOTION) this.time.addEvent({
      delay: 1700, loop: true, callback: () => {
        const dx = Phaser.Math.Between(2, 6);
        this.titleR.setX(GAME_W / 2 - dx); this.titleC.setX(GAME_W / 2 + dx);
        this.title.setX(GAME_W / 2 + Phaser.Math.Between(-2, 2));
        this.time.delayedCall(110, () => {
          this.titleR.setX(GAME_W / 2 - 2); this.titleC.setX(GAME_W / 2 + 2);
          this.title.setX(GAME_W / 2);
        });
      },
    });

    // quelques bugs ASCII décoratifs qui dérivent
    for (let i = 0; i < 5; i++) {
      const t = this.add.text(
        Phaser.Math.Between(80, GAME_W - 80), Phaser.Math.Between(560, 860),
        pickArt('bug'), { fontFamily: FONT, fontSize: '17px', color: CSS.greenDim, align: 'center' }
      ).setOrigin(0.5).setAlpha(0.5);
      this.tweens.add({
        targets: t, y: t.y - Phaser.Math.Between(15, 40), duration: Phaser.Math.Between(1800, 3200),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  }

  buildDifficulties() {
    const cx = GAME_W / 2;
    this.add.text(cx, 360, T('menuSelect'), {
      fontFamily: FONT, fontSize: '28px', color: CSS.white,
    }).setOrigin(0.5);

    this.diffTexts = DIFFICULTIES.map((d, i) => {
      const y = 400 + i * 52;
      const label = this.add.text(cx, y, '', {
        fontFamily: FONT, fontSize: '40px', color: CSS.greenDim, align: 'center',
      }).setOrigin(0.5);
      // étoiles à droite du grade : 1 ★ par niveau de difficulté
      const stars = this.add.text(cx, y, '★'.repeat(i + 1), {
        fontFamily: FONT, fontSize: '24px', color: CSS.greenDim,
      }).setOrigin(0, 0.5);
      const tag = this.add.text(cx, y + 24, diffTagline(d), {
        fontFamily: FONT, fontSize: '19px', color: CSS.greenDim,
      }).setOrigin(0.5).setAlpha(0);
      return { label, stars, tag };
    });
    this.refreshDiff();
  }

  refreshDiff() {
    const cx = GAME_W / 2;
    DIFFICULTIES.forEach((d, i) => {
      const { label, stars, tag } = this.diffTexts[i];
      const on = i === this.selected;
      label.setText(on ? `[ ${diffLabel(d)} ]` : diffLabel(d));
      label.setColor(on ? CSS.amber : CSS.greenDim);
      label.setFontSize(on ? 40 : 32);
      stars.setX(cx + label.width / 2 + 18);
      stars.setColor(on ? CSS.gold : CSS.greenDim);
      stars.setAlpha(on ? 1 : 0.6);
      tag.setAlpha(on ? 0.9 : 0);
      tag.setColor(on ? CSS.amber : CSS.greenDim);
    });
  }

  move(dir) {
    this.selected = Phaser.Math.Wrap(this.selected + dir, 0, DIFFICULTIES.length);
    Sfx.blip(this.selected * 8);
    this.refreshDiff();
  }

  launch() {
    Sfx.powerup();
    Music.stop();
    this.cameras.main.fadeOut(350, 5, 10, 7);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game', { difficulty: DIFFICULTIES[this.selected], godMode: this.godArmed });
    });
  }

  buildFooter() {
    this.blink = this.add.text(GAME_W / 2, 700, T('menuDeploy'), {
      fontFamily: FONT, fontSize: '30px', color: CSS.green,
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.blink, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });

    this.add.text(GAME_W / 2, GAME_H - 24,
      T('menuFooter'), {
        fontFamily: FONT, fontSize: '20px', color: CSS.greenSoft,
      }).setOrigin(0.5);

    // version du jeu, discrète en bas à gauche
    this.add.text(16, GAME_H - 12, APP_VERSION, {
      fontFamily: FONT, fontSize: '20px', color: CSS.greenSoft,
    }).setOrigin(0, 1).setAlpha(0.85);

    // FPS en haut à gauche
    const fps = this.add.text(4, 0, '', {
      fontFamily: FONT, fontSize: '16px', color: CSS.greenSoft,
    }).setAlpha(0.85).setDepth(95);
    this.time.addEvent({
      delay: 250, loop: true,
      callback: () => fps.setText(`${Math.round(this.game.loop.actualFps)} fps${Sfx.muted ? T('mutedTag') : ''}`),
    });

    // choix de la langue (touche L), en bas à droite
    this.add.text(GAME_W - 16, GAME_H - 12, T('menuLang'), {
      fontFamily: FONT, fontSize: '22px', color: CSS.cyan,
    }).setOrigin(1, 1).setAlpha(0.85);
  }

  async loadTopScores() {
    const rows = await Api.leaderboard('all', 5);
    if (!rows.length) return;
    const x = GAME_W - 250;
    this.add.text(x, 380, '-- HALL OF FAME --', {
      fontFamily: FONT, fontSize: '24px', color: CSS.cyan,
    }).setOrigin(0.5);
    rows.forEach((r, i) => {
      this.add.text(x, 416 + i * 30,
        `${i + 1}. ${r.pseudo.slice(0, 10).padEnd(10)} ${String(r.score).padStart(7)}`, {
          fontFamily: FONT, fontSize: '22px', color: i === 0 ? CSS.gold : CSS.green,
        }).setOrigin(0.5);
    });
  }
}
