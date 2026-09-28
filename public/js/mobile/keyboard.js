/* Clavier virtuel — version MOBILE uniquement (sans effet sinon).
   Dessiné en DOM sous l'écran de jeu, il émet de VRAIS évènements clavier
   (keydown/keyup sur window) : les scènes Phaser les reçoivent exactement comme
   ceux d'un clavier physique, aucune logique de jeu n'est dupliquée.
   Deux pages : lettres (AZERTY en FR, QWERTY en EN) et chiffres/symboles, sous
   une rangée de contrôle fixe (ÉCHAP = pause, TAB = changer de cible). Les
   menus, eux, sont tactiles (js/mobile/ui.js) : pas besoin de flèches.
   Couvre tout le jeu de caractères des mots (cf. words.js). */
'use strict';

const VKB = (() => {
  if (!MOBILE) return null;

  // touches spéciales : libellé affiché → valeur de KeyboardEvent.key
  const SPECIAL = { ESC: 'Escape', TAB: 'Tab', BKSP: 'Backspace', ENTER: 'Enter' };
  const CONTROL_ROW = ['ESC', 'TAB'];
  const PAGES = {
    fr: [
      ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
      ['SHIFT', 'w', 'x', 'c', 'v', 'b', 'n', 'BKSP'],
      ['SYM', ',', ' ', '.', 'ENTER'],
    ],
    en: [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['SHIFT', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'BKSP'],
      ['SYM', ',', ' ', '.', 'ENTER'],
    ],
    sym: [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['-', '_', '/', ':', ';', '(', ')', '&', '@', '"'],
      ['?', '!', "'", '#', '$', '%', '*', '+', '=', 'BKSP'],
      ['ABC', '<', '>', '^', '|', '~', ' ', 'ENTER'],
    ],
  };
  const LABELS = { BKSP: '⌫', ENTER: '⏎', SYM: '?123', ABC: 'ABC', ' ': '␣' };
  const WIDE = { ' ': 4, SHIFT: 1.5, BKSP: 1.5, SYM: 1.5, ABC: 1.5, ENTER: 1.8 };

  let page = 'letters';
  let shift = 0; // 0 = minuscules, 1 = une majuscule, 2 = verrouillé (double tap)
  let lastShiftTap = 0;

  const root = document.createElement('div');
  root.id = 'vkb';
  root.setAttribute('role', 'group');
  document.body.appendChild(root); // hauteur (--kb-h) posée par main.js

  function emit(key) {
    const init = {
      key, bubbles: true, cancelable: true,
      shiftKey: key.length === 1 && key !== key.toLowerCase(),
    };
    window.dispatchEvent(new KeyboardEvent('keydown', init));
    window.dispatchEvent(new KeyboardEvent('keyup', init));
  }

  function labelFor(k) {
    if (k === 'ESC') return T('vkbEsc');
    if (k === 'TAB') return 'TAB';
    if (k === 'SHIFT') return shift === 2 ? '⇪' : '⇧';
    if (LABELS[k]) return LABELS[k];
    return shift ? k.toUpperCase() : k;
  }

  function render() {
    const rows = [CONTROL_ROW, ...(page === 'sym' ? PAGES.sym : PAGES[LANG === 'en' ? 'en' : 'fr'])];
    root.setAttribute('aria-label', T('vkbLabel'));
    root.innerHTML = '';
    rows.forEach((row, r) => {
      const line = document.createElement('div');
      line.className = r === 0 ? 'vkb-row vkb-control' : 'vkb-row';
      row.forEach((k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.tabIndex = -1; // jamais de focus : le jeu garde la main
        b.dataset.k = k;
        b.textContent = labelFor(k);
        b.style.flexGrow = WIDE[k] || 1;
        if (SPECIAL[k] || k === 'SHIFT' || k === 'SYM' || k === 'ABC') b.classList.add('vkb-special');
        if (k === 'SHIFT' && shift) b.classList.add('vkb-on');
        if (k === ' ') b.setAttribute('aria-label', T('vkbSpace'));
        line.appendChild(b);
      });
      root.appendChild(line);
    });
  }

  function press(k) {
    if (k === 'SHIFT') {
      const now = Date.now();
      shift = shift === 0 ? (now - lastShiftTap < 350 ? 2 : 1) : 0;
      lastShiftTap = now;
      render();
      return;
    }
    if (k === 'SYM' || k === 'ABC') {
      page = k === 'SYM' ? 'sym' : 'letters';
      render();
      return;
    }
    if (SPECIAL[k]) { emit(SPECIAL[k]); return; }
    const onLetters = page === 'letters' && /^[a-z]$/.test(k);
    emit(onLetters && shift ? k.toUpperCase() : k);
    if (onLetters && shift === 1) { shift = 0; render(); }
  }

  // pointerdown (et non click) : réactif, multi-touch, et n'ôte pas le focus
  root.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button');
    e.preventDefault();
    if (!b) return;
    b.classList.add('vkb-down');
    setTimeout(() => b.classList.remove('vkb-down'), 90);
    press(b.dataset.k);
  });
  root.addEventListener('contextmenu', (e) => e.preventDefault());

  // un vrai champ de saisie (formulaire de score) a le focus : on laisse la
  // place au clavier natif du téléphone
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('input, textarea')) document.documentElement.classList.add('vkb-off');
  });
  document.addEventListener('focusout', () => document.documentElement.classList.remove('vkb-off'));

  // la page lettres suit la langue du jeu (AZERTY ⇄ QWERTY)
  const baseSetLang = setLang;
  setLang = (lang) => { baseSetLang(lang); render(); }; // eslint-disable-line no-global-assign

  render();
  return { render };
})();
