/* Clavier virtuel — version MOBILE uniquement (sans effet sinon).
   Dessiné en DOM sous l'écran de jeu, il émet de VRAIS évènements clavier
   (keydown/keyup sur window) : les scènes Phaser les reçoivent exactement comme
   ceux d'un clavier physique, aucune logique de jeu n'est dupliquée.
   Sur mobile on ne tape que des LETTRES (casse, espaces, chiffres et symboles
   sont remplis d'office, cf. GameScene.sameKey) : trois rangées de lettres
   (AZERTY en FR, QWERTY en EN) sous une rangée d'actions — ÉCHAP pause,
   TAB changer de cible, ⏎ kill -9, ⌫ autocomplete (éloigné des lettres : ce
   n'est pas une correction). Les menus, eux, sont tactiles (js/mobile/ui.js). */
'use strict';

const VKB = (() => {
  if (!MOBILE) return null;

  // touches d'action : identifiant → valeur de KeyboardEvent.key
  const SPECIAL = { ESC: 'Escape', TAB: 'Tab', ENTER: 'Enter', BKSP: 'Backspace' };
  const CONTROL_ROW = ['ESC', 'TAB', 'ENTER', 'BKSP'];
  // GAP = demi-touche vide : centre les rangées plus courtes
  const PAGES = {
    fr: [
      ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
      ['GAP', 'GAP', 'GAP', 'GAP', 'w', 'x', 'c', 'v', 'b', 'n', 'GAP', 'GAP', 'GAP', 'GAP'],
    ],
    en: [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['GAP', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'GAP'],
      ['GAP', 'GAP', 'GAP', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'GAP', 'GAP', 'GAP'],
    ],
  };
  const LABELS = { TAB: 'TAB', ENTER: '⏎', BKSP: '⌫' };

  const root = document.createElement('div');
  root.id = 'vkb';
  root.setAttribute('role', 'group');
  document.body.appendChild(root); // hauteur (--kb-h) posée par main.js

  function emit(key) {
    const init = { key, bubbles: true, cancelable: true };
    window.dispatchEvent(new KeyboardEvent('keydown', init));
    window.dispatchEvent(new KeyboardEvent('keyup', init));
  }

  function render() {
    const rows = [CONTROL_ROW, ...PAGES[LANG === 'en' ? 'en' : 'fr']];
    root.setAttribute('aria-label', T('vkbLabel'));
    root.innerHTML = '';
    rows.forEach((row, r) => {
      const line = document.createElement('div');
      line.className = r === 0 ? 'vkb-row vkb-control' : 'vkb-row';
      row.forEach((k) => {
        if (k === 'GAP') {
          const gap = document.createElement('span');
          gap.className = 'vkb-gap';
          line.appendChild(gap);
          return;
        }
        const b = document.createElement('button');
        b.type = 'button';
        b.tabIndex = -1; // jamais de focus : le jeu garde la main
        b.dataset.k = k;
        b.textContent = k === 'ESC' ? T('vkbEsc') : (LABELS[k] || k);
        if (SPECIAL[k]) b.classList.add('vkb-special');
        line.appendChild(b);
      });
      root.appendChild(line);
    });
  }

  // pointerdown (et non click) : réactif, multi-touch, et n'ôte pas le focus
  root.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button');
    e.preventDefault();
    if (!b) return;
    b.classList.add('vkb-down');
    setTimeout(() => b.classList.remove('vkb-down'), 90);
    emit(SPECIAL[b.dataset.k] || b.dataset.k);
  });
  root.addEventListener('contextmenu', (e) => e.preventDefault());

  // un vrai champ de saisie (formulaire de score) a le focus : on laisse la
  // place au clavier natif du téléphone
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('input, textarea')) document.documentElement.classList.add('vkb-off');
  });
  document.addEventListener('focusout', () => document.documentElement.classList.remove('vkb-off'));

  // la disposition suit la langue du jeu (AZERTY ⇄ QWERTY)
  const baseSetLang = setLang;
  setLang = (lang) => { baseSetLang(lang); render(); }; // eslint-disable-line no-global-assign

  render();
  return { render };
})();
