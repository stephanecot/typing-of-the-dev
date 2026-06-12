/* Configuration globale + lancement Phaser. */
'use strict';

const GAME_W = 1600;
const GAME_H = 900;

const PALETTE = {
  bg: 0x050a07,
  green: 0x39ff7a,
  greenDim: 0x1d7a44,
  amber: 0xffb000,
  red: 0xff3b3b,
  magenta: 0xff5cf0,
  gold: 0xffd76a,
  cyan: 0x41f2ff,
  white: 0xeafff0,
};
const CSS = {
  green: '#39ff7a', greenDim: '#1d7a44', amber: '#ffb000', red: '#ff3b3b',
  magenta: '#ff5cf0', gold: '#ffd76a', cyan: '#41f2ff', white: '#eafff0',
};

/* Niveaux de difficulté : vitesse, cadence de spawn, vies (incidents avant
   PROD DOWN), multiplicateur de score, longueur max des mots, commandes du boss. */
const DIFFICULTIES = [
  {
    key: 'facile', label: 'STAGIAIRE', tagline: 'Le café est offert',
    speed: 0.62, spawnMs: 2500, lives: 4, scoreMult: 1, maxLen: 10,
    bossCmds: 2, eliteWave: 4, deadlineWave: 5,
  },
  {
    key: 'normal', label: 'DEV CONFIRMÉ', tagline: 'La prod attend',
    speed: 1.0, spawnMs: 1800, lives: 3, scoreMult: 1.5, maxLen: 18,
    bossCmds: 3, eliteWave: 3, deadlineWave: 3,
  },
  {
    key: 'hard', label: 'SENIOR 10X', tagline: 'MEP un vendredi à 18h59',
    speed: 1.35, spawnMs: 1250, lives: 2, scoreMult: 2, maxLen: 99,
    bossCmds: 4, eliteWave: 2, deadlineWave: 2,
  },
];

const FONT = '"VT323", monospace';

window.addEventListener('load', () => {
  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_W,
    height: GAME_H,
    backgroundColor: '#050a07',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
  };
  window.game = new Phaser.Game(config);
});
