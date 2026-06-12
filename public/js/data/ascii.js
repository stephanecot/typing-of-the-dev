/* Sprites ASCII — tout le jeu est typographique, y compris les monstres. */
'use strict';

const ASCII = {
  bug: [
    ' /\\oo/\\\n<|=00=|>\n /|/\\|\\',
    '  _ _\n (o.o)\n<(   )>\n  d b',
    ' \\ | /\n-(x.x)-\n / | \\',
    ' ,_,\n(O,O)\n(   )\n-"-"-',
    ' /\\_/\\\n( >x< )\n  )=(',
    ' \\,,/\n(o.o)\n<|::|>\n ^^^^',
    '  __\n /oo\\\n|=()=|\n \\__/',
    ' /^\\_/^\\\n |>o.o<|\n  \\\\_//',
  ],
  legacy: [
    ' .------.\n |  RIP  |\n | <tech>|\n_|________|_\n   (x_x)/',
    '  _____\n /     \\\n| (X_X) |\n \\_____/\n  /|||\\\n   | |',
    ' [######]\n [#x..x#]\n [##~~##]\n  ||  ||',
    '   ___\n  /   \\\n | EOL |\n  \\___/\n (x_x)\n /|_|\\',
    ' .-[]-.\n |5.25"|\n |_____|\n (x_x)/',
    ' ______\n| o__o |\n| \\__/ |\n \'----\'\n /|  |\\',
  ],
  deadline: [
    '  .----.\n ( 23:59 )\n  \'----\'\n   /||\\',
    '   _!_\n  / ! \\\n |DEAD |\n |LINE |\n  \\___/',
    '  \\!/\n (@_@)\n /|_|\\\n  | |',
    ' .-----.\n( URGENT )\n \'-----\'\n  // \\\\',
    ' _____\n \\ o /\n  ) (\n / o \\\n -----',
    '  .----.\n ( H-1 !! )\n  \'----\'\n   /||\\',
  ],
  powerup: [
    '  ( (\n   ) )\n c[___]',
    '   ) )\n  ( (\nc[####]',
  ],
  spammer: [
    '  ____\n / o_o \\\n |  v  |\n  \\___/\n  /|$|\\\n  [in]',
    '  .---.\n ( $_$ )\n  \'---\'\n  /|#|\\\n  [in]',
    '  ____\n / ^_^ \\\n | [in] |\n  \\___/\n  /|%|\\',
  ],
  missile: [
    '<==[@]',
    '<--(M)',
    '<==(in)',
    '<-=[!]',
  ],
  ghost: [
    ' .--.\n( o_o )\n(    )\n \\/\\/\\/',
    '  .--.\n ( -_- )\n (     )\n  ~/\\/~',
  ],
  virus: [
    '  \\^/\n>(**)<\n  /v\\',
    ' \\|/\n<(xx)>\n /|\\',
  ],
  monolith: [
    ' _____\n|#####|\n|#x.x#|\n|#####|\n|_____|',
    ' _____\n|=====|\n|=o.o=|\n|=====|\n|__|__|',
  ],
  spec: [
    ' .____.\n | ?? |\n |~~~~|\n |____|\n  /||\\',
    ' .____.\n |?!?!|\n |~~~~|\n |____|\n  /||\\',
  ],
  microservice: [
    ' .---.\n |API|\n \'---\'\n  d b',
    ' .---.\n |uSV|\n \'---\'\n  d b',
  ],
  indep: [
    ' (o_o)\n<[##]>\n /||\\\n  $ $',
    ' (-_o)\n<[%%]>\n /||\\\n  $ $',
  ],
  po: [
    '  \\!/\n (^o^)\n /|::|\\\n  d b',
    '  \\!/\n (^u^)\n /|--|\\\n  d b',
  ],
  obfuscator: [
    ' _____\n|*#%@!|\n|!@%#*|\n|_____|\n  /|\\',
    ' _____\n|?$*&#|\n|#&*$?|\n|_____|\n  /|\\',
  ],
  consultant: [
    '  ____\n ( o_O )\n /|===|\\\n  |$$$|\n  d   b',
    '  ____\n ( ¬_¬ )\n /|===|\\\n  |€€€|\n  d   b',
  ],
  ransomware: [
    '  .--.\n /.--.\\\n ||  ||\n.-====-.\n|[$$$$]|\n\'------\'',
  ],
  boss: [
    '    ________\n   /        \\\n  | (X)  (X) |\n  |    __    |\n  |  \\____/  |\n   \\________/\n   _|XXXXXX|_\n  / |XXXXXX| \\\n    |X|  |X|',
    '   ______\n  /==||==\\\n | (o)(o) |\n |   /\\   |\n |  ====  |\n  \\______/\n _|######|_\n/ |######| \\\n  |_|  |_|',
  ],
  // Boss du mode infini
  mainframe: [
    ' _________\n|MAINFRAME|\n| ###  ## |\n| oo o oo |\n| ###  ## |\n| oo o oo |\n|_________|\n |__|  |__|',
  ],
  dette: [
    '    ____\n   |RIP |\n  _|____|_\n | LEGACY |\n |__ ____ |\n |  DETTE |\n |________|',
  ],
  stagiaireBoss: [
    '  \\!!/\n (>_<)\n<|###|>\n /|_|\\\n d   b',
  ],

  commercial: [
    '   ____\n  ( ^o^ )\n /|+++|\\\n  |---|\n  d   b',
  ],
  datacenter: [
    ' )  ( )\n( ) ) (\n|=====|\n|#x.x#|\n|#####|\n|__,__|',
  ],

  // Le boss final : LE DSI ÉNERVÉ — costume, cravate, sourcils froncés
  finalBoss: [
    '     _________\n    /  _____  \\\n   |  \\\\   //  |\n   | (\\@) (@/) |\n   |    ___    |\n   |   /___\\   |\n    \\_________/\n   __|       |__\n  /  |  \\_/  |  \\\n |   | (===) |   |\n |___|  |#|  |___|\n  (_)   |#|   (_)\n        |_|',
  ],
  discoBall:
    '   |\n .-+-.\n( / \\ )\n( \\ / )\n \'-+-\'',
  player:
    '  (o_o)\n<)   )>\n /   \\\n[#####]',
  prod:
    '[==PROD==]\n[ ###### ]\n[ :::::: ]\n[ ###### ]\n[ :::::: ]\n[ ###### ]\n[________]',
  prodBurnt:
    '[==pr0d==]\n[ %;%.;% ]\n[ x.. .x ]\n[ ;%,;%, ]\n[  ..;.  ]\n[ ,%;.%; ]\n[__/_,___]',
};

function pickArt(kind, techName) {
  const arts = ASCII[kind];
  let art = arts[Math.floor(Math.random() * arts.length)];
  if (techName) {
    const name = techName.toUpperCase().slice(0, 8);
    const pad = Math.max(0, 6 - name.length);
    art = art.replace('<tech>', name + ' '.repeat(pad));
  }
  return art;
}
