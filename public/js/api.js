/* Client API — tolère un backend absent (le jeu reste jouable, on log juste un warning). */
'use strict';

/* Scores stockés sur l'appareil — version MOBILE sans serveur (app native).
   Lignes au même format que /api/leaderboard ; aucune donnée de contact
   (le formulaire RGPD est propre au stand). Le stockage peut être indisponible
   (navigation privée…) : on dégrade en silence, le jeu reste jouable. */
const LocalScores = {
  KEY: 'totd-scores',
  MAX: 200,
  all() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; }
  },
  add(p) {
    const row = {
      pseudo: String(p.pseudo || 'ANONYME').trim().slice(0, 20) || 'ANONYME',
      score: Math.max(0, Math.trunc(Number(p.score) || 0)),
      wave: p.wave || 0, wpm: p.wpm || 0, accuracy: p.accuracy || 0,
      max_combo: p.maxCombo || 0, difficulty: p.difficulty || 'normal',
      created_at: new Date().toISOString(),
    };
    const rows = this.all();
    // même règle que le serveur : rang = nb de scores strictement meilleurs + 1
    const rank = rows.filter((r) => r.score > row.score).length + 1;
    rows.splice(rank - 1, 0, row); // liste déjà triée : insertion à son rang
    try { localStorage.setItem(this.KEY, JSON.stringify(rows.slice(0, this.MAX))); } catch { return null; }
    return { rank };
  },
  top(difficulty, limit) {
    return this.all()
      .filter((r) => difficulty === 'all' || r.difficulty === difficulty)
      .slice(0, limit);
  },
};

/* Mobile sans backend joignable : les scores vivent sur l'appareil. */
const localScoresMode = () => MOBILE && !SERVER_MODE;

const Api = {
  async saveGame(payload) {
    if (localScoresMode()) return LocalScores.add(payload);
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json(); // { id, rank }
    } catch (e) {
      console.warn('[api] sauvegarde impossible :', e.message);
      return null;
    }
  },

  /* Réglages serveur (admin). Met à jour GAME_CONFIG, avec valeurs par défaut
     si le backend est absent. */
  async loadConfig() {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      Object.assign(GAME_CONFIG, await res.json());
      SERVER_MODE = true; // backend joignable : on active les fonctions en ligne
    } catch (e) {
      SERVER_MODE = false;
      console.warn('[api] config indisponible, valeurs par défaut :', e.message);
    }
    return GAME_CONFIG;
  },

  async leaderboard(difficulty = 'all', limit = 10) {
    if (localScoresMode()) return LocalScores.top(difficulty, limit);
    try {
      const res = await fetch(`/api/leaderboard?difficulty=${difficulty}&limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('[api] leaderboard indisponible :', e.message);
      return [];
    }
  },
};
