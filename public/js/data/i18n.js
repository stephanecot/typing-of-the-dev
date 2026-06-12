/* i18n FR/EN — textes d'interface. Les banques de mots à taper restent
   majoritairement communes (jargon dev) ; seules les banques très françaises
   (deadlines, recruteur, missiles) ont une variante anglaise dans words.js. */
'use strict';

let LANG = localStorage.getItem('totd-lang') || 'fr';

const I18N = {
  fr: {
    // ---- menu
    menuTagline: 'Les bugs sont sortis du backlog. Tapez pour survivre.',
    menuSelect: '> SÉLECTIONNEZ VOTRE GRADE <',
    menuDeploy: '[ ENTRÉE pour déployer en prod ]',
    menuFooter: 'H: aide & règles · flèches: choisir · ENTRÉE: jouer · ÉCHAP: pause · TAB: changer de cible · S: muet',
    menuLang: '[ L ] langue : FRANÇAIS',
    menuMusic: (name) => `[ B ] musique : ${name}`,
    menuMode: (inf) => inf ? '[ I ] mode : INFINI ∞' : `[ I ] mode : ${GAME_CONFIG.maxSprints} SPRINTS + DSI`,
    helpTitle: '> AIDE — RÈGLES DU JEU_',
    helpClose: '[ H ou ÉCHAP : retour au menu ]',
    helpPageHint: (cur, total) => `[ ←/→ : page ${cur}/${total} · ↑/↓ : défiler · H ou ÉCHAP : retour au menu ]`,
    helpDiffTitle: '> DIFFICULTÉS_',
    helpGoal: (n) => `Objectif : tenir ${n} sprints puis vaincre LE DSI ÉNERVÉ.\nChaque seconde d'avance sur le chrono = points bonus !`,
    helpLives: 'vies',
    helpSpeed: 'vitesse',
    helpSpawn: 'cadence',
    helpMaxLen: 'mots max',
    helpBossCmds: 'cmds boss',
    helpEnemiesTitle: '> BESTIAIRE — LES ENNEMIS_',
    helpPctNote: '(~% : part des apparitions sur une partie complète en ★★★★★ — hors scissions et InMails)',
    helpBossesTitle: '> LES BOSS_',
    helpNotesTitle: '> NOTES DE VERSION_',
    helpCurrent: '(actuelle)',
    releaseNotes: [
      ['v1.3.0', [
        'Mode INFINI (touche I) : pas de chrono, des sprints sans fin — avec 3 boss exclusifs : LE MAINFRAME, LA DETTE TECHNIQUE et LE STAGIAIRE VENGEUR',
        'Invite CODE SECRET (touche C, le Konami s\'y saisit aussi) — pour le reste, on n\'en dira pas plus…',
        'La touche S coupe le son (la frappe garde la priorité) · +25 % de mots dans toutes les banques',
        'Vagues rééquilibrées : le bug de base passe de 36 % à 24 % des apparitions, les spéciaux arrivent plus tôt',
      ]],
      ['v1.2.0', [
        '5 musiques procédurales au choix : MATRIX, SYNTHWAVE, LOUNGE, RAVE, 8-BIT HERO (touche B au menu)',
        'SUPER COMBO ULTIME dès ★★★ : étoiles de combat aux paliers 5/10/15, pouvoirs A bouclier · Z +1 vie · E frappe',
        '10 nouveaux ennemis du niv.1 au niv.5 (fantôme, virus, microservice, monolithe, spec foireuse, indép, obfuscateur, consultant, ransomware, PO inspiré)',
        'Bestiaire par niveau avec % d\'apparition · +15 % d\'ennemis spéciaux · pouvoir RETOURNÉ',
        'Couleurs par difficulté · CTO BURNOUT passe à 2 vies · le serveur brûle au game over',
        'Accessibilité : contrastes AA, animations réduites, plus de mots avec accolades/crochets',
        'Des choses secrètes se sont glissées dans le jeu…',
      ]],
      ['v1.1.0', [
        'Objectif : tenir 10 sprints (réglable depuis l\'admin) puis battre LE DSI ÉNERVÉ — bonus de temps à la victoire',
        'Interface FR/EN (touche L), aide multi-pages, chrono et progression de sprints dans le HUD',
        'PV en icônes, fond CRT, espaces facultatifs à la frappe, 5e difficulté DIEU DU TERMINAL',
      ]],
      ['v1.0.0', [
        'Le jeu du stand : tapez pour écraser les bugs, leaderboard plein écran, admin, formulaire RGPD',
      ]],
    ],
    helpCont: '(suite)',
    /* Bestiaire groupé par niveau : [titre du groupe, [[kind, nom, desc, dispo], …]].
       Ajouter un ennemi = une ligne dans le bon groupe, la mise en page suit. */
    bestiaryGroups: [
      ['NIVEAU 1 ▲', [
        ['bug', 'BUG', 'le tout-venant du backlog : jargon\ndev court. Lent, mais nombreux.', 'toutes difficultés'],
        ['missile', 'INMAIL', 'missile du recruteur : mot court\net très rapide.', 'toutes difficultés'],
      ]],
      ['NIVEAU 2 ▲▲', [
        ['ghost', 'BUG FANTÔME', 'disparaît par intermittence.\nGardez son mot en tête !', 'toutes · dès le sprint 3'],
        ['virus', 'VIRUS', 'se réplique en 2 mini-bugs à sa\nmort. Nettoyez vite !', 'toutes · dès le sprint 4'],
        ['microservice', 'LE MICROSERVICE', 'se scinde en 2 instances toutes\nles 8 s. Scale out !', 'toutes · dès le sprint 4'],
        ['legacy', 'ZOMBIE LEGACY', 'code et technos qui refusent de\nmourir. Lent mais long à taper.', 'toutes difficultés'],
        ['deadline', 'FAUCHEUSE DEADLINE', 'l\'horreur du quotidien\n(réunions, jira…). Rapide !', 'toutes difficultés'],
      ]],
      ['NIVEAU 3 ▲▲▲', [
        ['bug', 'BUG D\'ÉLITE', 'exceptions CamelCase, majuscules\ncomprises. Teigneux.', 'toutes difficultés'],
        ['spammer', 'LE RECRUTEUR', 'campe au fond et spamme des\nInMails. Éliminez la source !', 'toutes · dès le sprint 2'],
        ['monolith', 'LE MONOLITHE', 'exige 2 mots pour tomber, et\nrecule entre les deux.', 'toutes · dès le sprint 5'],
        ['spec', 'LA SPEC FOIREUSE', 'son mot ne veut RIEN dire (généré\nau hasard). Bon courage.', 'toutes · dès le sprint 3'],
      ['indep', 'L\'INDÉP', 'esquive à la moitié du mot — mais sa\nmort élimine l\'ennemi le plus proche !', 'toutes · dès le sprint 4'],
      ]],
      ['NIVEAU 4 ▲▲▲▲', [
        ['consultant', 'LE CONSULTANT', 'buzzwords à rallonge, et il\naccélère vers la prod.', '★★★★ et ★★★★★'],
        ['obfuscator', 'L\'OBFUSCATEUR', 'sa mort lâche un écran de fumée\nqui masque les bugs 5 s.', '★★★★ et ★★★★★'],
      ]],
      ['NIVEAU 5 ▲▲▲▲▲', [
        ['ransomware', 'LE RANSOMWARE', 'rechiffre son mot toutes les 6 s :\ntout est à refaire !', '★★★★★ uniquement'],
        ['po', 'LE PO INSPIRÉ', 'une idée toutes les 5 s : le mot\nd\'un autre ennemi se rallonge !', '★★★★★ uniquement'],
      ]],
      ['BONUS', [
        ['powerup', 'POWER-UP', 'le taper déclenche son pouvoir :\ncoffee, revert, reboot.', 'toutes difficultés'],
      ]],
    ],
    bestiaryBosses: [
      ['boss', 'INCIDENT PROD MAJEUR', 'Apparaît tous les 4 sprints.\nEnchaînez ses commandes pour le faire\nreculer. Lâche toujours +1 vie.', 'toutes difficultés'],
      ['finalBoss', 'LE DSI ÉNERVÉ', 'Boss final du dernier sprint :\nencaisse 2 commandes de plus.\nLe vaincre = victoire + bonus temps !', 'dernier sprint'],
    ],
    bestiaryBossesInf: [
      ['mainframe', 'LE MAINFRAME', 'Lent mais blindé : 3 commandes\nde plus. Il tourne depuis 1974\net compte bien continuer.'],
      ['dette', 'LA DETTE TECHNIQUE', 'Ses commandes sont les plus\nlongues du shell — elle\ns\'accumule depuis des années.'],
      ['stagiaireBoss', 'LE STAGIAIRE VENGEUR', 'Une commande de moins, mais\nfonce deux fois plus vite.\nIl a fini la machine à café.'],
      ['commercial', 'LE COMMERCIAL', 'Chaque commande encaissée lui\nfait vendre une deadline de plus.\nSouriez, c\'est signé.'],
      ['datacenter', 'LE DATACENTER EN FEU', 'Deux commandes de plus, et chaque\ncoup lâche un écran de fumée.\nTout est sous contrôle.'],
    ],
    flippedBadge: ' [retourné]',
    virusSplit: 'RÉPLICATION !',
    microSplit: 'SCALE OUT !',
    smokeScreen: 'ÉCRAN DE FUMÉE !',
    newIdea: '« j\'ai une idée ! »',
    ginesOn: '🔥 MODE GINÈS — les bugs vont t\'insulter 🔥',
    ginesBadge: 'MODE GINÈS',
    discoOn: '🪩 MODE DISCO — que la prod brille 🪩',
    discoBadge: 'MODE DISCO 🪩',
    boissonOn: '🍺 MODE BOISSON — qui a invité l\'apéro en prod ? 🍺',
    boissonBadge: 'MODE BOISSON 🍺',
    speedOn: '⚡ MODE SPEED — tout va 30 % plus vite ⚡',
    speedBadge: 'MODE SPEED ⚡',
    menuCode: '[ C ] code secret…',
    codeTitle: '> CODE SECRET_',
    codeHint: '[ ENTRÉE : valider · ÉCHAP : fermer ]',
    codeUnknown: 'code inconnu_',
    indepDodge: '« pas dispo, déjà en mission ! »',
    indepHired: '« j\'accepte la mission ! »',
    indepKill: 'facturé par l\'indép_',
    scopeCreep: 'SCOPE CREEP +1 !',
    reEncrypted: 'rechiffré_',
    mutedTag: ' · 🔇 muet (S)',
    konami: '☠ KONAMI CODE — GOD MODE ARMÉ — TRICHEUR REPÉRÉ ☠',
    helpSections: [
      ['OBJECTIF', [
        'Protège ta PROD : chaque ennemi qui l\'atteint = un INCIDENT. Trop d\'incidents = GAME OVER.',
        'Tiens tous les sprints puis bats LE DSI ÉNERVÉ : victoire, et le temps restant fait bonus !',
      ]],
      ['COMMENT TUER UN BUG', [
        'Tape la PREMIÈRE LETTRE d\'un ennemi pour le verrouiller, puis finis',
        'son mot sans faute (les espaces sont facultatifs). Une faute remet le combo à zéro.',
      ]],
      ['NIVEAUX & POINTS', [
        'niv.1 ▲ bugs · niv.2 ▲▲ deadlines (rapides !) et legacy · niv.3 ▲▲▲ élites.',
        'Points = longueur × 10 × niveau × combo × VITESSE (rapide = jusqu\'à ×3 !).',
        'Certains ennemis lâchent un bonus : +1 vie, points, combo +5, slow-mo, items.',
        'Dès ★★★ : SUPER COMBO ULTIME — combo 5/10/15 = +1/+2/+3 étoiles de combat',
        '(max 6, gardées même si le combo casse). Pouvoirs (si la lettre ne sert pas',
        'à taper) : A bouclier 3 s (1★) · Z +1 vie (3★) · E frappe le plus fort (2★).',
      ]],
      ['POUVOIRS ENNEMIS', [
        'Mots MINIFIÉS : des lettres sont masquées (?), à toi de les deviner !',
        'Mots RETOURNÉS : affichés tête en bas — ça se tape normalement, ça se lit moins bien.',
        'LE RECRUTEUR [in] spamme des messages : tape-les avant qu\'ils touchent la prod.',
      ]],
      ['ITEMS', [
        'ENTRÉE : KILL -9 (max 3) — tue le process ennemi le plus proche de la prod.',
        'EFFACER : AUTOCOMPLETE (max 5) — l\'IA complète les 4 lettres suivantes.',
      ]],
      ['POWER-UPS & BOSS', [
        'Mots dorés : coffee = ralenti · git revert = recul · sudo reboot = purge.',
        'Tous les 4 sprints, un BOSS : enchaîne ses commandes. Il lâche +1 vie.',
      ]],
      ['TOUCHES', [
        'TAB : relâcher la cible · ÉCHAP : pause (puis Q : quitter) · S : muet · L (menu) : langue · B (menu) : musique',
      ]],
    ],
    // ---- jeu
    hudGod: '  ☠ GOD MODE = TRICHEUR ☠',
    hudItems: (bombs, lasers) => `kill -9 x${bombs} [ENTRÉE]   autocomplete x${lasers} [EFFACER]`,
    hudTime: 'TEMPS',
    hudStars: 'SUPER COMBO',
    hudStarsKeys: '  ·  A bouclier 1★ · Z +1 vie 3★ · E frappe 2★',
    starGain: (n) => `+${n} ÉTOILE${n > 1 ? 'S' : ''} DE COMBAT !`,
    starShield: 'BOUCLIER ★ 3 s !',
    starShieldBlock: 'bouclier ★ !',
    starLife: '+1 VIE ★',
    starSmite: 'ANNIHILÉ ★',
    bannerBossWave: '!! INCIDENT MAJEUR DÉTECTÉ !!',
    bannerWave: 'déploiement des bugs...',
    bannerFinal: '!! LE DSI ÉNERVÉ ARRIVE !!',
    finalBossName: 'LE DSI ÉNERVÉ',
    bossMainframe: 'LE MAINFRAME',
    bossDette: 'LA DETTE TECHNIQUE',
    bossStagiaire: 'LE STAGIAIRE VENGEUR',
    bossCommercial: 'LE COMMERCIAL',
    bossDatacenter: 'LE DATACENTER EN FEU',
    bossesSectionMain: 'BOSS DE LA CAMPAGNE',
    bossesSectionInf: 'BOSS DU MODE INFINI ∞',
    prodSaved: 'LA PROD EST SAUVÉE !',
    timeBonus: 'BONUS TEMPS',
    pauseSub: 'les bugs attendent patiemment...',
    pauseResume: '[ ÉCHAP ou ENTRÉE : reprendre ]',
    pauseQuit: '[ Q : quitter la partie — score non sauvegardé ]',
    lvl: 'niv.',
    minified: ' [minifié]',
    recruiter: ' [recruteur]',
    bossName: 'INCIDENT PROD MAJEUR',
    newMessage: 'nouveau message !',
    fast: '>> RAPIDE',
    noBombs: 'PLUS DE KILL -9 !',
    noProcess: 'AUCUN PROCESS À TUER',
    bombSent: 'kill -9 envoyé_',
    noLasers: 'PLUS D\'AUTOCOMPLETE !',
    lockFirst: 'VERROUILLE UNE CIBLE !',
    suggestion: 'suggestion acceptée_',
    lifeUp: '+1 VIE — PROD RESTAURÉE',
    prodHealthy: 'PROD SAINE',
    stockFull: 'stock plein',
    invincible: 'INVINCIBLE (tricheur)',
    bossTouch: '!! LE BOSS A TOUCHÉ LA PROD !!',
    incident: 'INCIDENT EN PROD !',
    powerSlowmo: '☕ PAUSE CAFÉ\nralenti 5 s',
    powerRevert: 'GIT REVERT\nles bugs reculent !',
    powerNuke: 'SUDO REBOOT\nécran purgé !',
    prodDown: 'LA PROD EST DOWN',
    // ---- game over
    goWin: 'VICTOIRE — PROD SAUVÉE',
    goDiff: 'difficulté :',
    statSprints: 'SPRINTS TENUS',
    statSpeed: 'VITESSE',
    wpmUnit: 'mots/min',
    statAccuracy: 'PRÉCISION',
    statBugs: 'BUGS ÉCRASÉS',
    statBosses: 'BOSS VAINCUS',
    shame: '☠ GOD MODE DÉTECTÉ — SCORE DE TRICHEUR, NON ENREGISTRÉ ☠',
    ranked: (rank) => `Tu es classé #${rank} du DevFest !`,
    offline: '(serveur injoignable — score non enregistré)',
    replay: '[ ENTRÉE : rejouer ]    [ M : menu ]',
    // ---- formulaire DOM
    formTitle: '> ENREGISTRER TON SCORE_',
    formPseudo: 'pseudo *',
    formFirstName: 'prénom ',
    formLastName: 'nom ',
    formEmail: 'email ',
    formPhone: 'téléphone ',
    formOpt: '(optionnel)',
    formConsent: 'J\'accepte d\'être recontacté·e après le DevFest. Sans cette case, '
      + 'nom, prénom, email et téléphone ne sont pas conservés (RGPD : données '
      + 'supprimées après le tirage, jamais cédées).',
    formSave: '[ ENREGISTRER ]',
    formSkip: '[ passer ]',
  },

  en: {
    // ---- menu
    menuTagline: 'The bugs escaped the backlog. Type to survive.',
    menuSelect: '> SELECT YOUR RANK <',
    menuDeploy: '[ ENTER to deploy to prod ]',
    menuFooter: 'H: help & rules · arrows: select · ENTER: play · ESC: pause · TAB: switch target · S: mute',
    menuLang: '[ L ] language: ENGLISH',
    menuMusic: (name) => `[ B ] music: ${name}`,
    menuMode: (inf) => inf ? '[ I ] mode: ENDLESS ∞' : `[ I ] mode: ${GAME_CONFIG.maxSprints} SPRINTS + CIO`,
    helpTitle: '> HELP — HOW TO PLAY_',
    helpClose: '[ H or ESC: back to menu ]',
    helpPageHint: (cur, total) => `[ ←/→: page ${cur}/${total} · ↑/↓: scroll · H or ESC: back to menu ]`,
    helpDiffTitle: '> DIFFICULTY LEVELS_',
    helpGoal: (n) => `Goal: survive ${n} sprints, then defeat THE FURIOUS CIO.\nEvery second left on the clock = bonus points!`,
    helpLives: 'lives',
    helpSpeed: 'speed',
    helpSpawn: 'spawn rate',
    helpMaxLen: 'max word',
    helpBossCmds: 'boss cmds',
    helpEnemiesTitle: '> BESTIARY — THE ENEMIES_',
    helpPctNote: '(~%: share of spawns over a full ★★★★★ run — splits and InMails excluded)',
    helpBossesTitle: '> THE BOSSES_',
    helpNotesTitle: '> RELEASE NOTES_',
    helpCurrent: '(current)',
    releaseNotes: [
      ['v1.3.0', [
        'ENDLESS mode (I key): no timer, endless sprints — with 3 exclusive bosses: THE MAINFRAME, TECHNICAL DEBT and THE VENGEFUL INTERN',
        'SECRET CODE prompt (C key, the Konami works there too) — as for the rest, our lips are sealed…',
        'S key mutes the sound (typing keeps priority) · +25% words in every bank',
        'Rebalanced waves: base bug drops from 36% to 24% of spawns, specials show up earlier',
      ]],
      ['v1.2.0', [
        '5 procedural music tracks: MATRIX, SYNTHWAVE, LOUNGE, RAVE, 8-BIT HERO (B key in the menu)',
        'ULTIMATE SUPER COMBO from ★★★: combat stars at combo 5/10/15, powers A shield · Z +1 life · E smite',
        '10 new enemies from lvl.1 to lvl.5 (ghost, virus, microservice, monolith, botched spec, freelancer, obfuscator, consultant, ransomware, inspired PO)',
        'Bestiary by level with spawn % · +15% special enemies · FLIPPED words power',
        'Colors per difficulty · CTO BURNOUT now has 2 lives · the server burns on game over',
        'Accessibility: AA contrast, reduced motion, no more words with braces/brackets',
        'Secret things have crept into the game…',
      ]],
      ['v1.1.0', [
        'Goal: survive 10 sprints (admin-configurable) then beat THE FURIOUS CIO — time bonus on victory',
        'FR/EN interface (L key), multi-page help, timer and sprint progression in the HUD',
        'HP as icons, CRT background, optional spaces while typing, 5th difficulty TERMINAL GOD',
      ]],
      ['v1.0.0', [
        'The booth game: type to squash bugs, fullscreen leaderboard, admin, GDPR form',
      ]],
    ],
    helpCont: '(cont.)',
    bestiaryGroups: [
      ['LEVEL 1 ▲', [
        ['bug', 'BUG', 'backlog regulars: short dev\njargon. Slow, but they swarm.', 'all difficulties'],
        ['missile', 'INMAIL', 'recruiter missile: short word,\nvery fast.', 'all difficulties'],
      ]],
      ['LEVEL 2 ▲▲', [
        ['ghost', 'GHOST BUG', 'fades out intermittently.\nKeep its word in mind!', 'all · from sprint 3'],
        ['virus', 'VIRUS', 'splits into 2 mini-bugs when\nkilled. Clean up fast!', 'all · from sprint 4'],
        ['microservice', 'THE MICROSERVICE', 'splits into 2 instances every\n8 s. Scale out!', 'all · from sprint 4'],
        ['legacy', 'LEGACY ZOMBIE', 'code and tech that refuse to\ndie. Slow but long to type.', 'all difficulties'],
        ['deadline', 'DEADLINE REAPER', 'everyday horror (meetings,\njira…). Fast!', 'all difficulties'],
      ]],
      ['LEVEL 3 ▲▲▲', [
        ['bug', 'ELITE BUG', 'CamelCase exceptions, capital\nletters included. Mean.', 'all difficulties'],
        ['spammer', 'THE RECRUITER', 'camps in the back and spams\nInMails. Kill the source!', 'all · from sprint 2'],
        ['monolith', 'THE MONOLITH', 'takes 2 words to bring down,\nknocks back in between.', 'all · from sprint 5'],
        ['spec', 'THE BOTCHED SPEC', 'its word means NOTHING (randomly\ngenerated). Good luck.', 'all · from sprint 3'],
      ['indep', 'THE FREELANCER', 'dodges at half word — but its death\ntakes out the closest enemy!', 'all · from sprint 4'],
      ]],
      ['LEVEL 4 ▲▲▲▲', [
        ['consultant', 'THE CONSULTANT', 'endless buzzwords, and it\naccelerates toward prod.', '★★★★ and ★★★★★'],
        ['obfuscator', 'THE OBFUSCATOR', 'dies in a smoke screen that\nhides bugs for 5 s.', '★★★★ and ★★★★★'],
      ]],
      ['LEVEL 5 ▲▲▲▲▲', [
        ['ransomware', 'THE RANSOMWARE', 're-encrypts its word every 6 s:\nstart all over again!', '★★★★★ only'],
        ['po', 'THE INSPIRED PO', 'one idea every 5 s: another\nenemy\'s word gets longer!', '★★★★★ only'],
      ]],
      ['BONUS', [
        ['powerup', 'POWER-UP', 'typing it triggers its power:\ncoffee, revert, reboot.', 'all difficulties'],
      ]],
    ],
    bestiaryBosses: [
      ['boss', 'MAJOR PROD INCIDENT', 'Shows up every 4 sprints.\nChain its commands to push it\nback. Always drops +1 life.', 'all difficulties'],
      ['finalBoss', 'THE FURIOUS CIO', 'Final boss of the last sprint:\ntakes 2 extra commands.\nBeat it for victory + time bonus!', 'last sprint'],
    ],
    bestiaryBossesInf: [
      ['mainframe', 'THE MAINFRAME', 'Slow but armored: 3 extra\ncommands. Running since 1974\nand not planning to stop.'],
      ['dette', 'TECHNICAL DEBT', 'Its commands are the longest\nin the shell — it has been\npiling up for years.'],
      ['stagiaireBoss', 'THE VENGEFUL INTERN', 'One command less, but moves\ntwice as fast. Finished the\ncoffee machine.'],
      ['commercial', 'THE SALESMAN', 'Every command it takes makes\nit sell one more deadline.\nSmile, it is signed.'],
      ['datacenter', 'THE BURNING DATACENTER', 'Two extra commands, and every\nhit drops a smoke screen.\nEverything is under control.'],
    ],
    flippedBadge: ' [flipped]',
    virusSplit: 'REPLICATING!',
    microSplit: 'SCALING OUT!',
    smokeScreen: 'SMOKE SCREEN!',
    newIdea: '"I have an idea!"',
    ginesOn: '🔥 GINÈS MODE — the bugs are about to get rude 🔥',
    ginesBadge: 'GINÈS MODE',
    discoOn: '🪩 DISCO MODE — let prod shine 🪩',
    discoBadge: 'DISCO MODE 🪩',
    boissonOn: '🍺 DRINK MODE — who invited happy hour to prod? 🍺',
    boissonBadge: 'DRINK MODE 🍺',
    speedOn: '⚡ SPEED MODE — everything 30% faster ⚡',
    speedBadge: 'SPEED MODE ⚡',
    menuCode: '[ C ] secret code…',
    codeTitle: '> SECRET CODE_',
    codeHint: '[ ENTER: submit · ESC: close ]',
    codeUnknown: 'unknown code_',
    indepDodge: '"not available, on a gig!"',
    indepHired: '"I accept the mission!"',
    indepKill: 'billed by the freelancer_',
    scopeCreep: 'SCOPE CREEP +1!',
    reEncrypted: 're-encrypted_',
    mutedTag: ' · 🔇 muted (S)',
    konami: '☠ KONAMI CODE — GOD MODE ARMED — CHEATER SPOTTED ☠',
    helpSections: [
      ['GOAL', [
        'Protect your PROD: every enemy that reaches it = an INCIDENT. Too many incidents = GAME OVER.',
        'Survive every sprint then beat THE FURIOUS CIO: victory, and the remaining time pays a bonus!',
      ]],
      ['HOW TO KILL A BUG', [
        'Type the FIRST LETTER of an enemy to lock it, then finish',
        'its word without a typo (spaces are optional). A typo resets the combo.',
      ]],
      ['LEVELS & POINTS', [
        'lvl.1 ▲ bugs · lvl.2 ▲▲ deadlines (fast!) and legacy · lvl.3 ▲▲▲ elites.',
        'Points = length × 10 × level × combo × SPEED (fast typing = up to ×3!).',
        'Some enemies drop a bonus: +1 life, points, combo +5, slow-mo, items.',
        'From ★★★: ULTIMATE SUPER COMBO — combo 5/10/15 = +1/+2/+3 combat stars',
        '(max 6, kept when the combo breaks). Powers (when the letter is not a valid',
        'keystroke): A shield 3 s (1★) · Z +1 life (3★) · E smite strongest (2★).',
      ]],
      ['ENEMY POWERS', [
        'MINIFIED words: some letters are masked (?), guess them!',
        'FLIPPED words: shown upside down — typed normally, read painfully.',
        'THE RECRUITER [in] spams messages: type them before they hit prod.',
      ]],
      ['ITEMS', [
        'ENTER: KILL -9 (max 3) — kills the enemy process closest to prod.',
        'BACKSPACE: AUTOCOMPLETE (max 5) — the AI types the next 4 letters.',
      ]],
      ['POWER-UPS & BOSS', [
        'Golden words: coffee = slow-mo · git revert = knockback · sudo reboot = purge.',
        'Every 4 sprints, a BOSS: chain its commands. It always drops +1 life.',
      ]],
      ['KEYS', [
        'TAB: release target · ESC: pause (then Q: quit) · S: mute · L (menu): language · B (menu): music',
      ]],
    ],
    // ---- game
    hudGod: '  ☠ GOD MODE = CHEATER ☠',
    hudItems: (bombs, lasers) => `kill -9 x${bombs} [ENTER]   autocomplete x${lasers} [BACKSPACE]`,
    hudTime: 'TIME',
    hudStars: 'SUPER COMBO',
    hudStarsKeys: '  ·  A shield 1★ · Z +1 life 3★ · E smite 2★',
    starGain: (n) => `+${n} COMBAT STAR${n > 1 ? 'S' : ''}!`,
    starShield: 'SHIELD ★ 3 s!',
    starShieldBlock: 'shield ★!',
    starLife: '+1 LIFE ★',
    starSmite: 'SMITTEN ★',
    bannerBossWave: '!! MAJOR INCIDENT DETECTED !!',
    bannerWave: 'deploying bugs...',
    bannerFinal: '!! THE FURIOUS CIO IS COMING !!',
    finalBossName: 'THE FURIOUS CIO',
    bossMainframe: 'THE MAINFRAME',
    bossDette: 'TECHNICAL DEBT',
    bossStagiaire: 'THE VENGEFUL INTERN',
    bossCommercial: 'THE SALESMAN',
    bossDatacenter: 'THE BURNING DATACENTER',
    bossesSectionMain: 'CAMPAIGN BOSSES',
    bossesSectionInf: 'ENDLESS MODE BOSSES ∞',
    prodSaved: 'PROD IS SAVED!',
    timeBonus: 'TIME BONUS',
    pauseSub: 'the bugs are waiting patiently...',
    pauseResume: '[ ESC or ENTER: resume ]',
    pauseQuit: '[ Q: quit game — score not saved ]',
    lvl: 'lvl.',
    minified: ' [minified]',
    recruiter: ' [recruiter]',
    bossName: 'MAJOR PROD INCIDENT',
    newMessage: 'new message!',
    fast: '>> FAST',
    noBombs: 'OUT OF KILL -9!',
    noProcess: 'NO PROCESS TO KILL',
    bombSent: 'kill -9 sent_',
    noLasers: 'OUT OF AUTOCOMPLETE!',
    lockFirst: 'LOCK A TARGET FIRST!',
    suggestion: 'suggestion accepted_',
    lifeUp: '+1 LIFE — PROD RESTORED',
    prodHealthy: 'PROD HEALTHY',
    stockFull: 'stock full',
    invincible: 'INVINCIBLE (cheater)',
    bossTouch: '!! THE BOSS HIT PROD !!',
    incident: 'PROD INCIDENT!',
    powerSlowmo: '☕ COFFEE BREAK\nslow-mo 5 s',
    powerRevert: 'GIT REVERT\nbugs knocked back!',
    powerNuke: 'SUDO REBOOT\nscreen purged!',
    prodDown: 'PROD IS DOWN',
    // ---- game over
    goWin: 'VICTORY — PROD SAVED',
    goDiff: 'difficulty:',
    statSprints: 'SPRINTS SURVIVED',
    statSpeed: 'SPEED',
    wpmUnit: 'wpm',
    statAccuracy: 'ACCURACY',
    statBugs: 'BUGS SQUASHED',
    statBosses: 'BOSSES DEFEATED',
    shame: '☠ GOD MODE DETECTED — CHEATER SCORE, NOT SAVED ☠',
    ranked: (rank) => `You ranked #${rank} at DevFest!`,
    offline: '(server unreachable — score not saved)',
    replay: '[ ENTER: replay ]    [ M: menu ]',
    // ---- DOM form
    formTitle: '> SAVE YOUR SCORE_',
    formPseudo: 'nickname *',
    formFirstName: 'first name ',
    formLastName: 'last name ',
    formEmail: 'email ',
    formPhone: 'phone ',
    formOpt: '(optional)',
    formConsent: 'I agree to be contacted after DevFest. Without this box, '
      + 'name, email and phone are not stored (GDPR: data deleted '
      + 'after the prize draw, never shared).',
    formSave: '[ SAVE ]',
    formSkip: '[ skip ]',
  },
};

function T(key) {
  const v = I18N[LANG][key] ?? I18N.fr[key];
  return v !== undefined ? v : key;
}

/* Libellé/tagline de difficulté selon la langue (définis dans main.js). */
function diffLabel(d) { return LANG === 'en' && d.labelEn ? d.labelEn : d.label; }
function diffTagline(d) { return LANG === 'en' && d.taglineEn ? d.taglineEn : d.tagline; }

function setLang(lang) {
  LANG = lang;
  localStorage.setItem('totd-lang', lang);
  document.documentElement.lang = lang;
  applyFormLang();
}

/* Le formulaire de fin de partie est en DOM (index.html) : on le traduit ici. */
function applyFormLang() {
  const set = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };
  set('#save-form h2', T('formTitle'));
  set('label[for="input-pseudo"]', T('formPseudo'));
  const opt = ` <span class="opt">${T('formOpt')}</span>`;
  const setOpt = (sel, txt) => {
    const el = document.querySelector(sel);
    if (el) el.innerHTML = txt + opt;
  };
  setOpt('label[for="input-firstname"]', T('formFirstName'));
  setOpt('label[for="input-lastname"]', T('formLastName'));
  setOpt('label[for="input-email"]', T('formEmail'));
  setOpt('label[for="input-phone"]', T('formPhone'));
  set('.consent span', T('formConsent'));
  set('#save-form button[type="submit"]', T('formSave'));
  set('#btn-skip', T('formSkip'));
}

// scripts chargés en fin de body : le DOM du formulaire existe déjà
document.documentElement.lang = LANG;
applyFormLang();
