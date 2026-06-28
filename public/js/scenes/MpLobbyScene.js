/* Lobby multijoueur : créer ou rejoindre une session, choisir son pseudo,
   attendre les joueurs (2 à 4), puis l'hôte lance la partie. Tout au clavier.
   Le transport est dans MpClient (objet global Mp) ; ici, uniquement l'UI. */
'use strict';

class MpLobbyScene extends Phaser.Scene {
  constructor() { super('MpLobby'); }

  create() {
    this.cameras.main.setBackgroundColor('#050a07');
    this.ui = this.add.container(0, 0);
    this.state = 'choose';
    this.intent = null;        // 'create' | 'join'
    this.buffer = '';          // saisie clavier (pseudo / code)
    this.joinCode = '';
    this.diffIndex = 1;        // DEV CONFIRMÉ par défaut
    this.mode = '5';
    this.roster = [];
    this.busy = false;
    this.error = '';

    // accès direct par URL : /mp.html?s=CODE → on enchaîne sur la saisie du pseudo
    const s = new URLSearchParams(location.search).get('s');
    if (s) { this.intent = 'join'; this.joinCode = s.toUpperCase().slice(0, 4); this.state = 'name'; }

    // événements réseau
    Mp.on('lobby', (d) => { this.roster = d.players; this.mode = d.mode; this.diffKey = d.difficulty; if (this.state === 'lobby') this.redraw(); });
    Mp.on('start', (d) => this.launch(d));
    Mp.on('sessionEnded', () => { this.error = T('mpHostLeft'); this.state = 'choose'; this.intent = null; this.redraw(); });

    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    if (REDUCED_MOTION) this.cameras.main.shake = () => this.cameras.main;
    this.cameras.main.fadeIn(300, 5, 10, 7);
    this.redraw();
  }

  // ---- saisie clavier, dispatch selon l'état
  onKey(e) {
    if (this.busy) return;
    Sfx.ensure();
    if (this.state === 'choose') {
      if (e.key === 'c' || e.key === 'C') { this.intent = 'create'; this.state = 'config'; this.error = ''; this.redraw(); }
      else if (e.key === 'j' || e.key === 'J') { this.intent = 'join'; this.state = 'code'; this.buffer = ''; this.error = ''; this.redraw(); }
      else if (e.key === 'Escape') { window.location.href = '/'; }
      return;
    }
    if (this.state === 'config') {
      if (e.key >= '1' && e.key <= String(DIFFICULTIES.length)) { this.diffIndex = +e.key - 1; this.redraw(); }
      else if (e.key === 'ArrowLeft') { this.diffIndex = Phaser.Math.Wrap(this.diffIndex - 1, 0, DIFFICULTIES.length); this.redraw(); }
      else if (e.key === 'ArrowRight') { this.diffIndex = Phaser.Math.Wrap(this.diffIndex + 1, 0, DIFFICULTIES.length); this.redraw(); }
      else if (e.key === 'i' || e.key === 'I') { this.mode = this.mode === '5' ? '10' : this.mode === '10' ? 'inf' : '5'; this.redraw(); }
      else if (e.key === 'Enter') { this.buffer = ''; this.state = 'name'; this.redraw(); }
      else if (e.key === 'Escape') { this.state = 'choose'; this.redraw(); }
      return;
    }
    if (this.state === 'code') {
      if (e.key === 'Enter' && this.buffer.length >= 3) { this.joinCode = this.buffer; this.buffer = ''; this.state = 'name'; this.redraw(); }
      else if (e.key === 'Backspace') { this.buffer = this.buffer.slice(0, -1); this.redraw(); }
      else if (e.key === 'Escape') { this.state = 'choose'; this.redraw(); }
      else if (/^[a-zA-Z0-9]$/.test(e.key) && this.buffer.length < 4) { this.buffer = (this.buffer + e.key).toUpperCase(); this.redraw(); }
      return;
    }
    if (this.state === 'name') {
      if (e.key === 'Enter' && this.buffer.trim().length >= 2) this.submitName();
      else if (e.key === 'Backspace') { this.buffer = this.buffer.slice(0, -1); this.redraw(); }
      else if (e.key === 'Escape') { this.state = this.intent === 'create' ? 'config' : 'choose'; this.redraw(); }
      else if (/^[\w .'-]$/.test(e.key) && this.buffer.length < 16) { this.buffer += e.key; this.redraw(); }
      return;
    }
    if (this.state === 'lobby') {
      if (Mp.isHost && e.key === 'Enter' && this.roster.length >= 2) this.doStart();
      else if (e.key === 'Escape') { Mp.close(); window.location.href = '/'; }
      return;
    }
  }

  async submitName() {
    this.busy = true;
    const name = this.buffer.trim();
    try {
      if (this.intent === 'create') {
        await Mp.create({ name, difficulty: DIFFICULTIES[this.diffIndex].key, mode: this.mode });
      } else {
        await Mp.join({ code: this.joinCode, name });
      }
      Mp.connect();
      this.state = 'lobby';
      this.error = '';
    } catch (err) {
      this.error = err.message;
      this.state = this.intent === 'create' ? 'config' : 'code';
    }
    this.busy = false;
    this.redraw();
  }

  async doStart() {
    this.busy = true;
    try { await Mp.start(); } catch (err) { this.error = err.message; }
    this.busy = false;
    this.redraw();
  }

  launch(d) {
    // applique le mode (5 / 10 / infini) aux globals lus par GameScene
    GAME_MODE = d.mode; applyGameMode();
    const diff = DIFFICULTIES.find((x) => x.key === d.difficulty) || DIFFICULTIES[1];
    const data = {
      mp: true, net: Mp, host: Mp.isHost, localId: Mp.playerId,
      difficulty: diff, mode: d.mode, players: d.players,
    };
    const go = () => {
      if (this._launched) return;
      this._launched = true;
      this.scene.start(Mp.isHost ? 'Game' : 'MpMirror', data);
    };
    this.cameras.main.fadeOut(300, 5, 10, 7);
    this.cameras.main.once('camerafadeoutcomplete', go);
    this.time.delayedCall(700, go); // filet si le fondu est gelé (onglet en arrière-plan)
  }

  // ---- rendu (reconstruit l'UI à chaque changement d'état)
  redraw() {
    this.ui.removeAll(true);
    const cx = GAME_W / 2;
    this.add.existing(this.ui);
    const title = (t, color) => this.ui.add(this.add.text(cx, 90, t, {
      fontFamily: FONT, fontSize: '64px', color: color || CSS.green,
    }).setOrigin(0.5));
    const line = (y, t, color, size) => this.ui.add(this.add.text(cx, y, t, {
      fontFamily: FONT, fontSize: `${size || 28}px`, color: color || CSS.white, align: 'center',
    }).setOrigin(0.5));

    title('MULTIJOUEUR ∞', CSS.cyan);
    if (this.error) line(GAME_H - 60, `⚠ ${this.error}`, CSS.red, 24);

    if (this.state === 'choose') {
      line(330, T('mpChoose'), CSS.greenSoft, 26);
      line(430, T('mpCreateOpt'), CSS.green, 40);
      line(500, T('mpJoinOpt'), CSS.gold, 40);
      line(GAME_H - 110, T('mpBackHome'), CSS.greenSoft, 22);
    } else if (this.state === 'config') {
      const d = DIFFICULTIES[this.diffIndex];
      line(280, T('mpPickGame'), CSS.greenSoft, 26);
      line(370, `${LANG === 'en' ? d.labelEn : d.label}  ${'★'.repeat(this.diffIndex + 1)}`, d.color, 46);
      line(430, T('mpDiffHint'), CSS.greenSoft, 22);
      const modeTxt = this.mode === 'inf' ? 'INFINI ∞' : `${this.mode} SPRINTS + DSI`;
      line(520, `[ I ] ${T('mpModeLabel')} : ${modeTxt}`, CSS.gold, 30);
      line(620, T('mpConfigGo'), CSS.green, 30);
    } else if (this.state === 'code') {
      line(330, T('mpEnterCode'), CSS.greenSoft, 28);
      line(430, `${this.buffer}${this.buffer.length < 4 ? '_' : ''}`, CSS.cyan, 70);
      line(540, T('mpCodeHint'), CSS.greenSoft, 22);
    } else if (this.state === 'name') {
      line(300, this.intent === 'create' ? T('mpYourNameHost') : `${T('mpYourName')} (${this.joinCode})`, CSS.greenSoft, 26);
      line(420, `${this.buffer}_`, CSS.green, 60);
      line(540, T('mpNameHint'), CSS.greenSoft, 22);
      if (this.busy) line(620, '…', CSS.greenSoft, 28);
    } else if (this.state === 'lobby') {
      line(230, `${T('mpCodeLabel')} : ${Mp.code}`, CSS.cyan, 40);
      line(280, Mp.shareUrl(), CSS.greenSoft, 20);
      // liste des joueurs
      this.roster.forEach((p, i) => {
        const me = p.id === Mp.playerId;
        this.ui.add(this.add.text(cx, 360 + i * 50,
          `${me ? '▶ ' : '   '}${p.name}${p.id === (this.roster[0] && this.roster[0].id) ? '' : ''}${me ? ' (toi)' : ''}`, {
            fontFamily: FONT, fontSize: '34px', color: p.color,
          }).setOrigin(0.5));
      });
      const enough = this.roster.length >= 2;
      if (Mp.isHost) {
        line(GAME_H - 140, enough ? T('mpStartReady') : T('mpWaitPlayers'), enough ? CSS.green : CSS.greenSoft, 30);
      } else {
        line(GAME_H - 140, T('mpWaitHost'), CSS.greenSoft, 28);
      }
      line(GAME_H - 90, T('mpLobbyFoot')(this.roster.length), CSS.greenSoft, 22);
    }
  }
}
