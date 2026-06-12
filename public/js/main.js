/* Configuration globale + lancement Phaser. */
'use strict';

const APP_VERSION = 'v1.1.0';

const GAME_W = 1600;
const GAME_H = 900;

/* Réglages pilotés par l'admin (rafraîchis via Api.loadConfig au démarrage).
   maxSprints : nb de sprints à tenir pour affronter LE DSI ÉNERVÉ et gagner. */
const GAME_CONFIG = { maxSprints: 10 };
/* Temps "par" par sprint : sert au compte à rebours affiché et au bonus de
   temps si le joueur va au bout des sprints. */
const PAR_SECONDS_PER_SPRINT = 60;

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
  // même teinte que greenDim mais contraste AA (≥4.5:1) : pour le petit texte
  // informatif ; greenDim reste réservé au décor et aux grands textes
  greenSoft: '#2da55e',
};

/* Easter egg : taper GINES sur l'écran d'accueil remplace tous les mots du
   jeu par des insultes geek bon enfant. Se désactive en retapant GINES. */
let GINES_MODE = false;

/* Accessibilité : coupe secousses de caméra et glitchs cosmétiques quand
   l'OS demande de réduire les animations. */
const REDUCED_MOTION = typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Niveaux de difficulté : vitesse, cadence de spawn, vies (incidents avant
   PROD DOWN), multiplicateur de score, longueur max des mots, commandes du boss. */
const DIFFICULTIES = [
  {
    key: 'facile', label: 'STAGIAIRE', tagline: 'Le café est offert',
    labelEn: 'INTERN', taglineEn: 'Free coffee included', color: '#39ff7a',
    speed: 0.62, spawnMs: 2500, lives: 4, scoreMult: 1, maxLen: 10,
    bossCmds: 2, eliteWave: 4, deadlineWave: 5,
  },
  {
    key: 'normal', label: 'DEV CONFIRMÉ', tagline: 'La prod attend',
    labelEn: 'MID-LEVEL DEV', taglineEn: 'Prod is waiting', color: '#41f2ff',
    speed: 1.0, spawnMs: 1800, lives: 3, scoreMult: 1.5, maxLen: 18,
    bossCmds: 3, eliteWave: 3, deadlineWave: 3,
  },
  {
    key: 'hard', label: 'SENIOR 10X', tagline: 'MEP un vendredi à 18h59',
    labelEn: 'SENIOR 10X', taglineEn: 'Deploying on Friday at 6:59pm', color: '#ffb000',
    speed: 1.35, spawnMs: 1250, lives: 2, scoreMult: 2, maxLen: 99,
    bossCmds: 4, eliteWave: 2, deadlineWave: 2,
  },
  {
    key: 'cto', label: 'CTO BURNOUT', tagline: 'Une seule vie. On-call depuis 1999.',
    labelEn: 'CTO BURNOUT', taglineEn: 'One life. On-call since 1999.', color: '#ff3b3b',
    speed: 1.7, spawnMs: 950, lives: 1, scoreMult: 3, maxLen: 99,
    bossCmds: 5, eliteWave: 1, deadlineWave: 1,
  },
  {
    key: 'ultime', label: 'DIEU DU TERMINAL', tagline: 'Même vim a peur de vous.',
    labelEn: 'TERMINAL GOD', taglineEn: 'Even vim fears you.', color: '#ff5cf0',
    speed: 2.1, spawnMs: 750, lives: 1, scoreMult: 4, maxLen: 99,
    bossCmds: 6, eliteWave: 1, deadlineWave: 1,
  },
];

const FONT = '"VT323", monospace';

window.addEventListener('load', () => {
  Api.loadConfig(); // réglages admin (asynchrone, valeurs par défaut en attendant)
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
