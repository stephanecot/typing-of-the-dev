/* Client API — tolère un backend absent (le jeu reste jouable, on log juste un warning). */
'use strict';

const Api = {
  async saveGame(payload) {
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
    } catch (e) {
      console.warn('[api] config indisponible, valeurs par défaut :', e.message);
    }
    return GAME_CONFIG;
  },

  async leaderboard(difficulty = 'all', limit = 10) {
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
