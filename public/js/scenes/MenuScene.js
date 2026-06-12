/* Menu : titre glitché, sélection de difficulté (flèches + Entrée), top 5. */
'use strict';

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.selected = 1; // normal par défaut
    this.buildTitle();
    this.buildDifficulties();
    this.buildFooter();
    this.loadTopScores();

    this.input.keyboard.on('keydown', (e) => {
      Sfx.ensure();
      if (!Music.playing) Music.start(1);
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') this.move(-1);
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') this.move(1);
      else if (e.key === 'Enter' || e.key === ' ') this.launch();
      else if (e.key === 'm' || e.key === 'M') Sfx.toggleMute();
      else if (e.key >= '1' && e.key <= '3') { this.selected = +e.key - 1; this.refreshDiff(); }
    });

    this.cameras.main.fadeIn(400, 5, 10, 7);
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
    this.add.text(cx, 274, 'Les bugs sont sortis du backlog. Tapez pour survivre.', {
      fontFamily: FONT, fontSize: '26px', color: CSS.greenDim,
    }).setOrigin(0.5);

    // glitch périodique du titre
    this.time.addEvent({
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
    this.add.text(cx, 360, '> SÉLECTIONNEZ VOTRE GRADE <', {
      fontFamily: FONT, fontSize: '28px', color: CSS.white,
    }).setOrigin(0.5);

    this.diffTexts = DIFFICULTIES.map((d, i) => {
      const y = 420 + i * 62;
      const label = this.add.text(cx, y, '', {
        fontFamily: FONT, fontSize: '40px', color: CSS.greenDim, align: 'center',
      }).setOrigin(0.5);
      const tag = this.add.text(cx, y + 26, d.tagline, {
        fontFamily: FONT, fontSize: '20px', color: CSS.greenDim,
      }).setOrigin(0.5).setAlpha(0);
      return { label, tag };
    });
    this.refreshDiff();
  }

  refreshDiff() {
    DIFFICULTIES.forEach((d, i) => {
      const { label, tag } = this.diffTexts[i];
      const on = i === this.selected;
      label.setText(on ? `[ ${d.label} ]` : d.label);
      label.setColor(on ? CSS.amber : CSS.greenDim);
      label.setFontSize(on ? 44 : 36);
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
      this.scene.start('Game', { difficulty: DIFFICULTIES[this.selected] });
    });
  }

  buildFooter() {
    this.blink = this.add.text(GAME_W / 2, 652, '[ ENTRÉE pour déployer en prod ]', {
      fontFamily: FONT, fontSize: '30px', color: CSS.green,
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.blink, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });

    this.add.text(GAME_W / 2, GAME_H - 24,
      'flèches: choisir · ENTRÉE: jouer · F2: muet · ÉCHAP en jeu: changer de cible', {
        fontFamily: FONT, fontSize: '20px', color: CSS.greenDim,
      }).setOrigin(0.5);
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
