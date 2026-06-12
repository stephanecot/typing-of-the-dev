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
