/* Interface mobile — menus tactiles en DOM, plein écran (MOBILE uniquement).
   Remplace visuellement l'accueil Phaser sur téléphone : grandes cartes à
   toucher, défilement natif, boutons plutôt que raccourcis clavier.
   Toute la logique reste dans MenuScene (lancement, codes secrets, musique,
   langue, mode) : ce module n'est qu'une façade qui appelle ses méthodes.
   Pas de multijoueur ni de bandeau événement dans la version mobile.
   Invariant n°6 : les codes secrets ne sont jamais listés ici. */
'use strict';

const MobileUI = (() => {
  if (!MOBILE) return null;

  const root = document.createElement('div');
  root.id = 'm-ui';
  root.hidden = true;
  document.body.appendChild(root);
  // clavier virtuel masqué dès le chargement : il n'apparaît qu'en partie
  document.documentElement.classList.add('m-menu');

  let scene = null; // MenuScene active
  let over = null; // fin de partie : { scene: GameOverScene, pseudo, rank }
  let screen = 'home';
  let helpTab = 0;
  let pendingGrade = 1;

  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const stars = (i) => '★'.repeat(i + 1);
  const back = () => `<button type="button" class="m-back" data-action="home">${esc(T('mBack'))}</button>`;

  // ------------------------------------------------------------ écrans
  function homeHtml() {
    const badges = [
      GINES_MODE && [T('ginesOn'), CSS.magenta],
      DISCO_MODE && [T('discoOn'), CSS.cyan],
      BOISSON_MODE && [T('boissonOn'), CSS.gold],
      SPEED_MODE && [T('speedOn'), CSS.red],
      scene && scene.godArmed && [T('konami'), CSS.red],
    ].filter(Boolean);
    return `
      <header class="m-hero">
        <div class="m-title-wrap">
          <h1 class="m-title">TYPING<br>OF THE DEV</h1>
          <span class="m-ribbon">${esc(T('mRibbon'))}</span>
        </div>
        <p class="m-tagline">${esc(T('menuTagline'))}</p>
        ${badges.map(([t, c]) => `<p class="m-badge" style="--c:${c}">${esc(t)}</p>`).join('')}
      </header>
      <h2 class="m-h2">${esc(T('mSelect'))}</h2>
      <div class="m-grades">
        ${DIFFICULTIES.map((d, i) => `
          <button type="button" class="m-grade" data-action="grade" data-i="${i}" style="--c:${d.color}">
            <span class="m-grade-name">${esc(diffLabel(d))}</span>
            <span class="m-grade-stars" aria-hidden="true">${stars(i)}</span>
            <span class="m-grade-tag">${esc(diffTagline(d))}</span>
          </button>`).join('')}
      </div>
      <h2 class="m-h2">${esc(T('mModeLabel'))}</h2>
      <div class="m-seg" role="radiogroup" aria-label="${esc(T('mModeLabel'))}">
        ${GAME_MODE_ORDER.map((m) => `
          <button type="button" role="radio" aria-checked="${m === GAME_MODE}" data-action="mode" data-mode="${m}">
            ${esc(T('mMode')(m))}</button>`).join('')}
      </div>
      <div class="m-actions">
        <button type="button" data-action="help">? ${esc(T('mHelp'))}</button>
        <button type="button" data-action="lb">★ ${esc(T('mLeaderboard'))}</button>
        <button type="button" data-action="code">&gt;_ ${esc(T('mCode'))}</button>
      </div>
      <div class="m-actions m-settings">
        <button type="button" data-action="music">♪ ${esc(Music.track().name)}</button>
        <button type="button" data-action="lang" aria-label="${esc(T('mLang'))}">${LANG === 'en' ? 'EN' : 'FR'}</button>
        <button type="button" data-action="mute">${esc(T('mSound')(Sfx.muted))}</button>
      </div>
      <p class="m-version">${esc(APP_VERSION)}</p>`;
  }

  function briefingHtml() {
    const d = DIFFICULTIES[pendingGrade];
    return `
      ${back()}
      <h2 class="m-title2">${esc(T('briefingTitle'))}</h2>
      <p class="m-brief-grade" style="--c:${d.color}">${esc(T('briefingGrade')(diffLabel(d)))} ${stars(pendingGrade)}</p>
      <ol class="m-steps">
        ${T('mBriefingSteps').map(([n, line]) => `<li><b>${esc(n)}</b> ${esc(line)}</li>`).join('')}
      </ol>
      <button type="button" class="m-primary" data-action="start">${esc(T('mStart'))}</button>`;
  }

  /* Part d'apparition de chaque ennemi (même calcul que l'aide standard :
     campagne longue en difficulté max, via waveQueueFor, déterministe). */
  function spawnShares() {
    const diffMax = DIFFICULTIES[DIFFICULTIES.length - 1];
    const counts = {};
    let total = 0;
    for (let n = 1; n <= CAMPAIGN_SPRINTS_LONG; n++) {
      const bossWave = n === CAMPAIGN_SPRINTS_LONG || n % 4 === 0;
      for (const k of waveQueueFor(diffMax, n, bossWave)) { counts[k] = (counts[k] || 0) + 1; total++; }
    }
    return (kind) => (counts[kind] ? ` · ~${Math.max(1, Math.round((counts[kind] / total) * 100))} %` : '');
  }

  const artColor = (kind) => (MenuScene.ART_COLORS && MenuScene.ART_COLORS[kind]) || CSS.white;
  const art = (kind) => `<pre class="m-art" style="--c:${artColor(kind)}" aria-hidden="true">${
    esc((ASCII[kind] && ASCII[kind][0] || '').replace('<tech>', 'COBOL '))}</pre>`;

  const HELP_PAGES = [
    // règles
    () => {
      const colors = [CSS.cyan, CSS.green, CSS.amber, CSS.cyan, CSS.red, CSS.gold, CSS.magenta];
      // les lignes sont coupées pour la largeur standard : on recolle celles
      // qui s'arrêtent en milieu de phrase pour reformer des paragraphes
      const paragraphs = (lines) => lines.reduce((acc, l) => {
        if (acc.length && !/[.!?:)»]$/.test(acc[acc.length - 1].trim())) acc[acc.length - 1] += ` ${l.trim()}`;
        else acc.push(l.trim());
        return acc;
      }, []);
      return T('helpSections').map(([title, lines], i) => `
        <h3 style="--c:${colors[i] || CSS.white}">${esc(title)}</h3>
        ${paragraphs(lines).map((l) => `<p>${esc(l)}</p>`).join('')}`).join('');
    },
    // grades
    () => `<p class="m-note">${esc(T('helpGoal')(CAMPAIGN_SPRINTS_SHORT, CAMPAIGN_SPRINTS_LONG))}</p>
      ${DIFFICULTIES.map((d, i) => `
        <h3 style="--c:${d.color}">${esc(diffLabel(d))} ${stars(i)}</h3>
        <p class="m-dim">« ${esc(diffTagline(d))} »</p>
        <p>${esc(T('helpLives'))} : ${d.lives} · ${esc(T('helpSpeed'))} : ×${d.speed} ·
          ${esc(T('helpSpawn'))} : ${(d.spawnMs / 1000).toFixed(1)}s · ${esc(T('helpMaxLen'))} :
          ${d.maxLen >= 99 ? '∞' : d.maxLen} · ${esc(T('helpBossCmds'))} : ${d.bossCmds} · score ×${d.scoreMult}</p>`).join('')}`,
    // bestiaire
    () => {
      const pct = spawnShares();
      const levelColors = [CSS.green, CSS.amber, CSS.red, CSS.magenta, CSS.cyan, CSS.gold];
      return `<p class="m-note">${esc(T('helpPctNote'))}</p>` + T('bestiaryGroups').map(([group, entries], gi) => `
        <h3 style="--c:${levelColors[gi] || CSS.white}">${esc(group)}</h3>
        ${entries.map(([kind, name, desc, avail]) => `
          <div class="m-entry">${art(kind)}<div>
            <p class="m-entry-name" style="--c:${artColor(kind)}">${esc(name)}</p>
            <p class="m-gold">${esc(avail + pct(gi === 2 && kind === 'bug' ? 'elite' : kind))}</p>
            <p>${esc(desc)}</p></div></div>`).join('')}`).join('');
    },
    // boss
    () => `<h3 style="--c:${CSS.red}">${esc(T('bossesSectionMain'))}</h3>
      ${T('bestiaryBosses').map(([kind, name, desc, avail]) => `
        <div class="m-entry">${art(kind)}<div>
          <p class="m-entry-name" style="--c:${artColor(kind)}">${esc(name)}</p>
          <p class="m-gold">${esc(avail)}</p><p>${esc(desc)}</p></div></div>`).join('')}
      <h3 style="--c:${CSS.cyan}">${esc(T('bossesSectionInf'))}</h3>
      ${T('bestiaryBossesInf').map(([kind, name, desc]) => `
        <div class="m-entry">${art(kind)}<div>
          <p class="m-entry-name" style="--c:${artColor(kind)}">${esc(name)}</p><p>${esc(desc)}</p></div></div>`).join('')}`,
    // notes de version
    () => T('releaseNotes').map(([version, lines], vi) => `
      <h3 style="--c:${[CSS.green, CSS.cyan][vi] || CSS.greenSoft}">${esc(version)}${vi === 0 ? ` ${esc(T('helpCurrent'))}` : ''}</h3>
      <ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`).join(''),
  ];

  function helpHtml() {
    return `
      ${back()}
      <div class="m-tabs" role="tablist">
        ${T('mHelpTabs').map((t, i) => `
          <button type="button" role="tab" aria-selected="${i === helpTab}" data-action="tab" data-i="${i}">${esc(t)}</button>`).join('')}
      </div>
      <div class="m-help" role="tabpanel">${HELP_PAGES[helpTab]()}</div>`;
  }

  function codeHtml() {
    return `
      ${back()}
      <h2 class="m-title2">${esc(T('codeTitle'))}</h2>
      <form class="m-code" data-form="code" autocomplete="off">
        <input id="m-code-input" type="text" maxlength="12" autocapitalize="off" autocorrect="off"
               spellcheck="false" enterkeyhint="done" aria-label="${esc(T('mCode'))}">
        <button type="submit" class="m-primary">${esc(T('mCodeSubmit'))}</button>
        <p class="m-code-status" role="status"></p>
      </form>`;
  }

  const localNote = () => (SERVER_MODE ? '' : `<p class="m-local">${esc(T('mLocalScores'))}</p>`);

  function lbHtml() {
    return `
      ${back()}
      <h2 class="m-title2">-- HALL OF FAME --</h2>
      ${localNote()}
      <ol class="m-lb" aria-busy="true"></ol>`;
  }

  // ------------------------------------------------------------ fin de partie
  const endButtons = () => `
    <div class="m-actions m-end">
      <button type="button" data-action="replay">${esc(T('mReplay'))}</button>
      <button type="button" data-action="menu">${esc(T('mMenu'))}</button>
    </div>`;

  function overHtml() {
    const { results: r, diff: d } = over.scene;
    const canSave = !r.godMode && !over.scene.saved;
    return `
      <h2 class="m-over-title" style="--c:${r.won ? CSS.green : CSS.red}">${esc(r.won ? T('goWin') : 'POST-MORTEM')}</h2>
      <p class="m-brief-grade" style="--c:${d.color || CSS.magenta}">${esc(T('goDiff'))} ${esc(diffLabel(d))}</p>
      ${r.godMode ? `<p class="m-shame">${esc(T('shame'))}</p>` : ''}
      <dl class="m-stats">
        ${GameOverScene.statLines(r).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
      </dl>
      ${canSave ? `<button type="button" class="m-primary" data-action="save">${esc(T('mSaveScore'))}</button>` : ''}
      ${endButtons()}`;
  }

  /* Sans serveur : un simple pseudo (mémorisé), score gardé sur l'appareil. */
  function nameHtml() {
    let last = '';
    try { last = localStorage.getItem('totd-pseudo') || ''; } catch { /* stockage indisponible */ }
    return `
      <h2 class="m-title2">${esc(T('mPseudo'))}</h2>
      <form class="m-code" data-form="name" autocomplete="off">
        <input id="m-name-input" type="text" minlength="2" maxlength="20" required value="${esc(last)}"
               autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done"
               placeholder="xX_DevSlayer_Xx" aria-label="${esc(T('mPseudo'))}">
        <button type="submit" class="m-primary">${esc(T('mSave'))}</button>
      </form>
      ${localNote()}
      ${endButtons()}`;
  }

  function rankHtml() {
    return `
      <h2 class="m-title2">-- HALL OF FAME --</h2>
      ${over.rank ? `<p class="m-brief-grade" style="--c:${CSS.gold}">${esc(T('ranked')(over.rank))}</p>` : ''}
      ${localNote()}
      <ol class="m-lb" aria-busy="true"></ol>
      ${endButtons()}`;
  }

  // clé de difficulté stockée (« normal ») → nom du grade (« DEV CONFIRMÉ »)
  const gradeName = (key) => {
    const d = DIFFICULTIES.find((x) => x.key === key);
    return d ? diffLabel(d) : String(key).toUpperCase();
  };

  async function fillLeaderboard() {
    const list = root.querySelector('.m-lb');
    const shownOn = screen;
    const rows = await Api.leaderboard('all', 10);
    if (!list || screen !== shownOn) return; // écran quitté pendant la requête
    list.removeAttribute('aria-busy');
    const isMe = (r, i) => over && over.pseudo && over.rank === i + 1 && r.pseudo === over.pseudo;
    list.innerHTML = rows.length
      ? rows.map((r, i) => `<li class="${i === 0 ? 'm-first' : ''} ${isMe(r, i) ? 'm-me' : ''}">
          <span>${esc(r.pseudo)}</span><b>${r.score}</b>
          <small>${esc(gradeName(r.difficulty))} · ${r.wpm} wpm</small></li>`).join('')
      : `<li class="m-dim">${esc(T('lbEmpty'))}</li>`;
  }

  const SCREENS = {
    home: homeHtml, briefing: briefingHtml, help: helpHtml, code: codeHtml, lb: lbHtml,
    over: overHtml, name: nameHtml, rank: rankHtml,
  };

  function render() {
    if (over ? !over.scene : !scene) return;
    root.className = `m-screen-${screen}`;
    root.innerHTML = `<div class="m-inner">${SCREENS[screen]()}</div>`;
    root.scrollTop = 0;
    if (screen === 'lb' || screen === 'rank') fillLeaderboard();
  }

  function go(next) {
    screen = next;
    Sfx.blip(8);
    render();
  }

  // ------------------------------------------------------------ actions
  const ACTIONS = {
    home: () => go('home'),
    grade: (b) => { pendingGrade = Number(b.dataset.i); go('briefing'); },
    start: () => {
      scene.selected = pendingGrade;
      hide();
      scene.startGame();
    },
    mode: (b) => {
      while (GAME_MODE !== b.dataset.mode) scene.toggleInfinite();
      render();
    },
    help: () => { helpTab = 0; go('help'); },
    tab: (b) => { helpTab = Number(b.dataset.i); go('help'); },
    lb: () => go('lb'),
    code: () => {
      go('code');
      setTimeout(() => { const i = root.querySelector('#m-code-input'); if (i) i.focus(); }, 60);
    },
    music: () => { scene.cycleMusic(); render(); },
    lang: () => { screen = 'home'; scene.toggleLang(); }, // redémarre la scène → show()
    mute: () => { Sfx.ensure(); Sfx.toggleMute(); render(); },
    // fin de partie : formulaire DOM existant (#save-overlay), puis showRanking
    // avec serveur : formulaire du stand ; sinon pseudo seul, stocké sur l'appareil
    save: () => {
      if (SERVER_MODE) { over.scene.showForm(); return; }
      go('name');
      setTimeout(() => { const i = root.querySelector('#m-name-input'); if (i) i.focus(); }, 60);
    },
    replay: () => {
      const s = over.scene;
      hide();
      document.getElementById('save-overlay').classList.remove('visible');
      s.scene.start('Game', { difficulty: s.diff });
    },
    menu: () => over.scene.backToMenu(), // → MenuScene.create → show()
  };

  root.addEventListener('pointerdown', () => {
    // premier contact = geste utilisateur : on peut démarrer l'audio
    Sfx.ensure();
    if (!over && !Music.playing) Music.start(0); // ambiance d'accueil (menus seulement)
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (b && ACTIONS[b.dataset.action]) ACTIONS[b.dataset.action](b);
  });
  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (e.target.dataset.form === 'name') {
      const s = over.scene;
      if (s.saved) return;
      const input = root.querySelector('#m-name-input');
      const pseudo = input.value.trim() || 'ANONYME';
      input.blur();
      s.saved = true;
      try { localStorage.setItem('totd-pseudo', pseudo); } catch { /* stockage indisponible */ }
      const res = await Api.saveGame({ pseudo, difficulty: s.diff.key, ...s.results });
      showRanking(s, pseudo, res ? res.rank : null);
      return;
    }
    const input = root.querySelector('#m-code-input');
    scene.codeBuffer = input.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const restarting = scene.codeBuffer === 'boisson'; // la scène redémarre d'elle-même
    if (scene.submitCode() === false) {
      root.querySelector('.m-code-status').textContent = T('codeUnknown');
      input.value = '';
      return;
    }
    input.blur();
    if (!restarting) { screen = 'home'; render(); }
    else screen = 'home';
  });

  // ------------------------------------------------------------ API
  function open(next) {
    screen = next;
    root.hidden = false;
    document.documentElement.classList.add('m-menu');
    render();
  }

  function show(menuScene) {
    scene = menuScene;
    over = null;
    open(screen === 'over' || screen === 'rank' ? 'home' : screen);
  }

  function showGameOver(goScene) { over = { scene: goScene }; open('over'); }

  function showRanking(goScene, pseudo, rank) { over = { scene: goScene, pseudo, rank }; open('rank'); }

  function hide() {
    root.hidden = true;
    document.documentElement.classList.remove('m-menu');
  }

  return { show, showGameOver, showRanking, hide, render };
})();
