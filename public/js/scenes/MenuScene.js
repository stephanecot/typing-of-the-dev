/* Menu : titre glitché, sélection de difficulté (flèches + Entrée), top 5. */
'use strict';

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.selected = 1; // normal par défaut
    this.helpOpen = false;
    this.godArmed = false; // Konami Code ↑↑↓↓←→←→BA saisi ici, sur l'accueil
    this.konamiIdx = 0;
    this.buildTitle();
    this.buildDifficulties();
    this.buildFooter();
    this.buildHelp();
    this.loadTopScores();

    this.input.keyboard.on('keydown', (e) => {
      Sfx.ensure();
      if (!Music.playing) Music.start(0); // ambiance d'accueil, plus douce
      this.trackKonami(e.key);
      if (this.helpOpen) {
        if (e.key === 'h' || e.key === 'H' || e.key === 'Escape' || e.key === 'Enter') this.toggleHelp();
        return;
      }
      if (e.key === 'h' || e.key === 'H') this.toggleHelp();
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') this.move(-1);
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') this.move(1);
      else if (e.key === 'Enter' || e.key === ' ') this.launch();
      else if (e.key === 'm' || e.key === 'M' || e.key === 'F2') Sfx.toggleMute();
      else if (e.key >= '1' && e.key <= String(DIFFICULTIES.length)) { this.selected = +e.key - 1; this.refreshDiff(); }
    });

    this.cameras.main.fadeIn(400, 5, 10, 7);
  }

  buildHelp() {
    const cx = GAME_W / 2;
    this.helpPanel = this.add.container(0, 0).setDepth(90).setVisible(false);

    const sections = [
      ['OBJECTIF', CSS.cyan, [
        'Protège ta PROD : chaque ennemi qui l\'atteint = un INCIDENT. Trop d\'incidents = GAME OVER.',
      ]],
      ['COMMENT TUER UN BUG', CSS.green, [
        'Tape la PREMIÈRE LETTRE d\'un ennemi pour le verrouiller, puis finis',
        'son mot sans faute. Une faute remet le combo (= multiplicateur) à zéro.',
      ]],
      ['NIVEAUX & POINTS', CSS.amber, [
        'niv.1 ▲ bugs · niv.2 ▲▲ deadlines (rapides !) et legacy · niv.3 ▲▲▲ élites.',
        'Points = longueur × 10 × niveau × combo × VITESSE (rapide = jusqu\'à ×3 !).',
        'Certains ennemis lâchent un bonus : +1 vie, points, combo +5, slow-mo, items.',
      ]],
      ['POUVOIRS ENNEMIS', CSS.cyan, [
        'Mots MINIFIÉS : des lettres sont masquées (?), à toi de les deviner !',
        'LE RECRUTEUR [in] spamme des messages : tape-les avant qu\'ils touchent la prod.',
      ]],
      ['ITEMS', CSS.red, [
        'ENTRÉE : KILL -9 (max 3) — tue le process ennemi le plus proche de la prod.',
        'EFFACER : AUTOCOMPLETE (max 5) — l\'IA complète les 4 lettres suivantes.',
      ]],
      ['POWER-UPS & BOSS', CSS.gold, [
        'Mots dorés : coffee = ralenti · git revert = recul · sudo reboot = purge.',
        'Tous les 4 sprints, un BOSS : enchaîne ses commandes. Il lâche +1 vie.',
      ]],
      ['TOUCHES', CSS.magenta, [
        'TAB : relâcher la cible · ÉCHAP : pause (puis Q : quitter) · F2 : muet',
      ]],
    ];

    const children = [
      this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x020503, 0.94),
      this.add.text(cx, 60, '> AIDE — RÈGLES DU JEU_', {
        fontFamily: FONT, fontSize: '48px', color: CSS.amber,
      }).setOrigin(0.5),
    ];

    let y = 118;
    for (const [title, color, lines] of sections) {
      children.push(this.add.text(330, y, `-- ${title} --`, {
        fontFamily: FONT, fontSize: '28px', color,
      }).setOrigin(0, 0));
      y += 34;
      for (const line of lines) {
        children.push(this.add.text(360, y, line, {
          fontFamily: FONT, fontSize: '24px', color: CSS.white,
        }).setOrigin(0, 0).setAlpha(0.92));
        y += 27;
      }
      y += 11;
    }

    const closeHint = this.add.text(cx, GAME_H - 50, '[ H ou ÉCHAP : retour au menu ]', {
      fontFamily: FONT, fontSize: '32px', color: CSS.green,
    }).setOrigin(0.5);
    this.tweens.add({ targets: closeHint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    children.push(closeHint);

    this.helpPanel.add(children);
  }

  toggleHelp() {
    this.helpOpen = !this.helpOpen;
    this.helpPanel.setVisible(this.helpOpen);
    Sfx.blip(this.helpOpen ? 20 : 5);
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
      '☠ KONAMI CODE — GOD MODE ARMÉ — TRICHEUR REPÉRÉ ☠', {
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
      const y = 408 + i * 58;
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
      this.scene.start('Game', { difficulty: DIFFICULTIES[this.selected], godMode: this.godArmed });
    });
  }

  buildFooter() {
    this.blink = this.add.text(GAME_W / 2, 672, '[ ENTRÉE pour déployer en prod ]', {
      fontFamily: FONT, fontSize: '30px', color: CSS.green,
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.blink, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });

    this.add.text(GAME_W / 2, GAME_H - 24,
      'H: aide & règles · flèches: choisir · ENTRÉE: jouer · ÉCHAP: pause · TAB: changer de cible · F2: muet', {
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
