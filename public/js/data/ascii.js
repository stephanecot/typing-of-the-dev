/* Sprites ASCII — tout le jeu est typographique, y compris les monstres. */
'use strict';

const ASCII = {
  bug: [
    ' /\\oo/\\\n<|=00=|>\n /|/\\|\\',
    '  _ _\n (o.o)\n<(   )>\n  d b',
    ' \\ | /\n-(x.x)-\n / | \\',
    ' ,_,\n(O,O)\n(   )\n-"-"-',
    ' /\\_/\\\n( >x< )\n  )=(',
  ],
  legacy: [
    ' .------.\n |  RIP  |\n | <tech>|\n_|________|_\n   (x_x)/',
    '  _____\n /     \\\n| (X_X) |\n \\_____/\n  /|||\\\n   | |',
    ' [######]\n [#x..x#]\n [##~~##]\n  ||  ||',
    '   ___\n  /   \\\n | EOL |\n  \\___/\n (x_x)\n /|_|\\',
  ],
  deadline: [
    '  .----.\n ( 23:59 )\n  \'----\'\n   /||\\',
    '   _!_\n  / ! \\\n |DEAD |\n |LINE |\n  \\___/',
    '  \\!/\n (@_@)\n /|_|\\\n  | |',
    ' .-----.\n( URGENT )\n \'-----\'\n  // \\\\',
  ],
  powerup: [
    '  ( (\n   ) )\n c[___]',
  ],
  boss: [
    '    ________\n   /        \\\n  | (X)  (X) |\n  |    __    |\n  |  \\____/  |\n   \\________/\n   _|XXXXXX|_\n  / |XXXXXX| \\\n    |X|  |X|',
  ],
  player:
    '  (o_o)\n<)   )>\n /   \\\n[#####]',
  prod:
    '[==PROD==]\n[ ###### ]\n[ :::::: ]\n[ ###### ]\n[ :::::: ]\n[ ###### ]\n[________]',
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
