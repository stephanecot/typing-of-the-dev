/* Game Over : stats de la partie, formulaire DOM (pseudo + email optionnel RGPD),
   enregistrement en BDD, leaderboard, retour menu automatique après inactivité. */
'use strict';

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  init(data) {
    this.diff = data.difficulty;
    this.results = data.results;
    this.saved = false;
  }

  create() {
    const r = this.results;
    const cx = GAME_W / 2;

    // victoire (DSI vaincu) ou post-mortem classique
    this.add.text(cx, 80, r.won ? T('goWin') : 'POST-MORTEM', {
      fontFamily: FONT, fontSize: '72px', color: r.won ? CSS.green : CSS.red,
    }).setOrigin(0.5);
    this.add.text(cx, 140, `${T('goDiff')} ${diffLabel(this.diff)}`, {
      fontFamily: FONT, fontSize: '26px', color: CSS.magenta,
    }).setOrigin(0.5);

    const kills = r.kills;
    const lines = [
      ['SCORE', String(r.score)],
      [T('statSprints'), String(r.wave)],
      [T('statSpeed'), `${r.wpm} ${T('wpmUnit')}`],
      [T('statAccuracy'), `${r.accuracy}%`],
      ['COMBO MAX', `x${r.maxCombo}`],
      [T('statBugs'), String((kills.bug || 0) + (kills.legacy || 0) + (kills.deadline || 0))],
      [T('statBosses'), String(kills.boss || 0)],
    ];
    if (r.won && r.timeBonus) lines.push([T('timeBonus'), `+${r.timeBonus}`]);
    // stats dans la moitié gauche : le formulaire s'affiche à droite, sur le même écran
    lines.forEach(([k, v], i) => {
      const y = 250 + i * 52;
      this.add.text(150, y, k, { fontFamily: FONT, fontSize: '32px', color: CSS.greenDim })
        .setOrigin(0, 0.5);
      const val = this.add.text(700, y, v, { fontFamily: FONT, fontSize: '36px', color: CSS.green })
        .setOrigin(1, 0.5).setAlpha(0);
      this.tweens.add({ targets: val, alpha: 1, duration: 200, delay: 300 + i * 180 });
    });
    this.time.delayedCall(350, () => Sfx.waveClear());

    if (r.godMode) {
      // pas de leaderboard pour les tricheurs : tout le monde doit le savoir
      const shame = this.add.text(cx, 545,
        T('shame'), {
          fontFamily: FONT, fontSize: '34px', color: CSS.red, align: 'center',
        }).setOrigin(0.5);
      this.tweens.add({ targets: shame, alpha: 0.3, duration: 450, yoyo: true, repeat: -1 });
      this.time.delayedCall(2500, () => this.showLeaderboard(null, null));
    } else {
      // formulaire DOM à droite des stats (même écran, rien n'est caché)
      this.time.delayedCall(900, () => this.showForm());
    }

    // retour menu auto (stand : éviter un écran figé)
    this.idleTimer = this.time.delayedCall(60000, () => this.backToMenu());
    this.input.keyboard.on('keydown', () => this.idleTimer.reset({ delay: 60000, callback: () => this.backToMenu() }));
  }

  showForm() {
    const overlay = document.getElementById('save-overlay');
    const form = document.getElementById('save-form');
    const pseudoInput = document.getElementById('input-pseudo');
    const firstNameInput = document.getElementById('input-firstname');
    const lastNameInput = document.getElementById('input-lastname');
    const emailInput = document.getElementById('input-email');
    const phoneInput = document.getElementById('input-phone');
    const consentInput = document.getElementById('input-consent');
    const skipBtn = document.getElementById('btn-skip');
    overlay.classList.add('visible');
    [pseudoInput, firstNameInput, lastNameInput, emailInput, phoneInput]
      .forEach((i) => { i.value = ''; });
    consentInput.checked = false;
    setTimeout(() => pseudoInput.focus(), 50);

    const close = () => {
      overlay.classList.remove('visible');
      form.onsubmit = null;
      skipBtn.onclick = null;
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      if (this.saved) return;
      this.saved = true;
      const payload = {
        pseudo: pseudoInput.value.trim() || 'ANONYME',
        firstName: firstNameInput.value.trim() || null,
        lastName: lastNameInput.value.trim() || null,
        email: emailInput.value.trim() || null,
        phone: phoneInput.value.trim() || null,
        consent: consentInput.checked,
        difficulty: this.diff.key,
        ...this.results,
      };
      close();
      const res = await Api.saveGame(payload);
      this.showLeaderboard(payload.pseudo, res ? res.rank : null);
    };
    skipBtn.onclick = () => { close(); this.showLeaderboard(null, null); };
  }

  async showLeaderboard(pseudo, rank) {
    const cx = GAME_W / 2;
    const panel = this.add.container(cx, 0).setDepth(70);
    const bg = this.add.rectangle(0, GAME_H / 2, GAME_W, GAME_H, 0x050a07, 0.93);
    panel.add(bg);

    panel.add(this.add.text(0, 90, '-- HALL OF FAME --', {
      fontFamily: FONT, fontSize: '56px', color: CSS.cyan,
    }).setOrigin(0.5));
    if (rank) {
      panel.add(this.add.text(0, 150, T('ranked')(rank), {
        fontFamily: FONT, fontSize: '32px', color: CSS.gold,
      }).setOrigin(0.5));
    }

    const rows = await Api.leaderboard('all', 10);
    if (!rows.length) {
      panel.add(this.add.text(0, 300, T('offline'), {
        fontFamily: FONT, fontSize: '26px', color: CSS.greenDim,
      }).setOrigin(0.5));
    }
    rows.forEach((row, i) => {
      const isMe = pseudo && row.pseudo === pseudo && rank && i + 1 === rank;
      panel.add(this.add.text(0, 210 + i * 42,
        `${String(i + 1).padStart(2)}. ${row.pseudo.slice(0, 14).padEnd(14)} ${String(row.score).padStart(8)}  ${row.difficulty.toUpperCase().padEnd(6)} ${row.wpm} wpm`, {
          fontFamily: FONT, fontSize: '30px', color: isMe ? CSS.gold : (i === 0 ? CSS.amber : CSS.green),
        }).setOrigin(0.5));
    });

    const replay = this.add.text(0, GAME_H - 90, T('replay'), {
      fontFamily: FONT, fontSize: '34px', color: CSS.white,
    }).setOrigin(0.5);
    panel.add(replay);
    this.tweens.add({ targets: replay, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    this.input.keyboard.on('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.scene.start('Game', { difficulty: this.diff });
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'Escape') {
        this.backToMenu();
      }
    });
  }

  backToMenu() {
    document.getElementById('save-overlay').classList.remove('visible');
    this.scene.start('Menu');
  }
}
