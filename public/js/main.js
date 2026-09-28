/* Configuration globale + lancement Phaser. */
'use strict';

const APP_VERSION = 'v2.0.0';

/* MOBILE : version téléphone (app Capacitor, ou écran uniquement tactile).
   Forçable depuis un ordinateur avec ?mobile=1 (ou désactivable avec ?mobile=0).
   Quand MOBILE est faux, la version standard est STRICTEMENT inchangée : toute
   différence passe par M(valeurStandard, valeurMobile) ou un `if (MOBILE)`.
   Mise en page mobile : l'écran de jeu en haut, le clavier virtuel en bas
   (cf. js/mobile/keyboard.js), portrait uniquement. */
const MOBILE = (() => {
  const force = new URLSearchParams(window.location.search).get('mobile');
  if (force === '1' || force === '0') return force === '1';
  const cap = window.Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) return true;
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: coarse)').matches
    && !window.matchMedia('(any-pointer: fine)').matches;
})();
const M = (standard, mobile) => (MOBILE ? mobile : standard);

/* Hauteur du clavier virtuel (px CSS) : ~1/3 de l'écran, bornée (3 rangées
   de lettres + une fine rangée d'actions). */
const MOBILE_KB_H = MOBILE ? Math.round(Math.max(200, Math.min(window.innerHeight * 0.33, 280))) : 0;

/* Mobile : on pose la mise en page (classe, hauteur du clavier, plein écran
   sous les barres système) AVANT de mesurer la zone de jeu réelle. */
if (MOBILE) {
  document.documentElement.classList.add('mobile');
  document.documentElement.style.setProperty('--kb-h', `${MOBILE_KB_H}px`);
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  }
}

/* Standard : 1600×900 (16:9). Mobile : 800 de large, hauteur calquée sur la
   zone réellement libre au-dessus du clavier (encoches comprises) : le jeu
   occupe tout l'écran, sans bandes sur les côtés. */
const GAME_W = M(1600, 800);
const GAME_H = M(900, (() => {
  const frame = document.querySelector('.crt-frame');
  const r = frame ? frame.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
  return Math.round(Math.max(700, Math.min(1600, 800 * r.height / Math.max(1, r.width))));
})());

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

/* Easter eggs (à taper sur l'écran d'accueil, retaper pour désactiver) :
   GINES — tous les mots deviennent des insultes geek bon enfant.
   DISCO — ambiance boule à facettes et musique disco. */
let GINES_MODE = false;
let DISCO_MODE = false;
let BOISSON_MODE = false;

/* MODES DE JEU (touche I au menu, persistés). Trois modes cyclés dans cet ordre :
   - '5'  : campagne courte, 5 sprints puis LE DSI ÉNERVÉ (mode par défaut) ;
   - '10' : campagne longue, 10 sprints puis LE DSI ÉNERVÉ ;
   - 'inf': INFINI — pas de chrono ni de limite, on enchaîne tant qu'on survit
            (le DSI final n'apparaît jamais).
   INFINITE_MODE et CAMPAIGN_SPRINTS sont dérivés de GAME_MODE (cf. applyGameMode). */
const CAMPAIGN_SPRINTS_SHORT = 5;
const CAMPAIGN_SPRINTS_LONG = 10;
const GAME_MODE_ORDER = ['5', '10', 'inf'];
let GAME_MODE = localStorage.getItem('totd-mode');
// migration depuis l'ancien réglage booléen 'totd-infinite'
if (!GAME_MODE_ORDER.includes(GAME_MODE)) {
  GAME_MODE = localStorage.getItem('totd-infinite') === '1' ? 'inf' : '5';
}
let INFINITE_MODE;
let CAMPAIGN_SPRINTS;
function applyGameMode() {
  INFINITE_MODE = GAME_MODE === 'inf';
  CAMPAIGN_SPRINTS = GAME_MODE === '10' ? CAMPAIGN_SPRINTS_LONG : CAMPAIGN_SPRINTS_SHORT;
}
applyGameMode();

/* Code secret SPEED : +30 % de vitesse pour tout le monde, toutes difficultés. */
let SPEED_MODE = false;

/* Bandeau événement en haut de l'accueil (DevFest Toulouse, 19/11/2026).
   Passer à false une fois le stand remballé. */
const EVENT_BANNER = true;

/* "Mode serveur" : vrai quand le backend répond (Api.loadConfig a réussi). Faux
   sur la démo statique GitHub Pages, sans backend. Pilote l'affichage du lien
   vers le leaderboard (inutile sans serveur). */
let SERVER_MODE = false;

/* MODE BOISSON : caméra qui tangue, zoom qui respire et léger flou (WebGL).
   Appliqué au menu et en jeu. Les animations respectent reduced-motion. */
function applyDrunkFx(scene) {
  const cam = scene.cameras.main;
  if (scene.game.renderer && scene.game.renderer.type === Phaser.WEBGL && cam.postFX) {
    cam.postFX.addBlur(0, 2, 2, 0.55);
  }
  if (REDUCED_MOTION) return;
  scene.tweens.add({
    targets: cam, zoom: { from: 1, to: 1.05 },
    duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  });
  scene.tweens.add({
    targets: cam, angle: { from: -1.2, to: 1.2 },
    duration: 3400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  });
}

/* Accessibilité : coupe secousses de caméra et glitchs cosmétiques quand
   l'OS demande de réduire les animations. */
const REDUCED_MOTION = typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Niveaux de difficulté — barème d'équilibrage UNIFORME (cf. waveQueueFor) :
   - speed     : multiplicateur de vitesse, pas réguliers +0,30 (0,70 → 1,90) ;
   - spawnMs   : cadence d'apparition (plus court = plus dense) ;
   - lives     : incidents tolérés avant PROD DOWN, pas régulier −1 (5 → 1) ;
   - scoreMult : multiplicateur de score ;
   - maxLen    : longueur max des mots tapés (STAGIAIRE = mots courts) ;
   - bossCmds  : commandes à enchaîner pour faire reculer un boss (+1 par cran) ;
   - maxLevel  : palier d'ennemis le plus élevé qui apparaît (1-5) ;
   - waveStart : nombre d'ennemis au sprint 1 ;
   - waveGrowth: ennemis ajoutés par sprint suivant ;
   - bugRatio  : part de bugs de base (le reste = ennemis spéciaux).
   Le NOMBRE d'ennemis par sprint = round(waveStart + (n-1)·waveGrowth). */
const DIFFICULTIES = [
  {
    key: 'facile', label: 'STAGIAIRE', tagline: 'Le café est offert',
    labelEn: 'INTERN', taglineEn: 'Free coffee included', color: '#39ff7a',
    speed: 0.70, spawnMs: 2200, lives: 5, scoreMult: 1, maxLen: 10,
    bossCmds: 2, maxLevel: 2, waveStart: 5, waveGrowth: 0.5, bugRatio: 0.70,
  },
  {
    key: 'normal', label: 'DEV CONFIRMÉ', tagline: 'La prod attend',
    labelEn: 'MID-LEVEL DEV', taglineEn: 'Prod is waiting', color: '#41f2ff',
    speed: 1.00, spawnMs: 1700, lives: 4, scoreMult: 1.5, maxLen: 18,
    bossCmds: 3, maxLevel: 3, waveStart: 6, waveGrowth: 1.0, bugRatio: 0.55,
  },
  {
    key: 'hard', label: 'SENIOR 10X', tagline: 'MEP un vendredi à 18h59',
    labelEn: 'SENIOR 10X', taglineEn: 'Deploying on Friday at 6:59pm', color: '#ffb000',
    speed: 1.30, spawnMs: 1350, lives: 3, scoreMult: 2, maxLen: 99,
    bossCmds: 4, maxLevel: 3, waveStart: 7, waveGrowth: 1.4, bugRatio: 0.50,
  },
  {
    key: 'cto', label: 'CTO BURNOUT', tagline: 'Deux vies. On-call depuis 1999.',
    labelEn: 'CTO BURNOUT', taglineEn: 'Two lives. On-call since 1999.', color: '#ff3b3b',
    speed: 1.60, spawnMs: 1050, lives: 2, scoreMult: 3, maxLen: 99,
    bossCmds: 5, maxLevel: 4, waveStart: 8, waveGrowth: 1.8, bugRatio: 0.48,
  },
  {
    key: 'ultime', label: 'DIEU DU TERMINAL', tagline: 'Même vim a peur de vous.',
    labelEn: 'TERMINAL GOD', taglineEn: 'Even vim fears you.', color: '#ff5cf0',
    speed: 1.90, spawnMs: 850, lives: 1, scoreMult: 4, maxLen: 99,
    bossCmds: 6, maxLevel: 5, waveStart: 9, waveGrowth: 2.2, bugRatio: 0.45,
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
    // mp.html pose window.MP_PAGE : on enregistre alors le lobby + la scène
    // miroir (la simulation, elle, reste GameScene, partagée avec le solo).
    scene: window.MP_PAGE
      ? [BootScene, MpLobbyScene, MenuScene, GameScene, MpMirrorScene, GameOverScene]
      : [BootScene, MenuScene, GameScene, GameOverScene],
  };
  window.game = new Phaser.Game(config);
});
