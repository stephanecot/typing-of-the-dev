# TYPING OF THE DEV 🧟⌨️

Jeu de stand pour le **DevFest Toulouse 2026** — un hommage à *The Typing of the Dead* :
les bugs zombies sortent du backlog et avancent vers la PROD. Tapez leur mot pour les
écraser avant l'incident.

## Lancer (stand)

```bash
node server.js
# Jeu         → http://localhost:3000
# Leaderboard → http://localhost:3000/leaderboard.html   (second écran, auto-refresh)
# Admin       → http://localhost:3000/admin.html         (stats + exports)
```

**Zéro dépendance npm** (Node ≥ 22.5 requis : SQLite natif via `node:sqlite`).
Tout fonctionne **offline** : Phaser, police et sons sont locaux/procéduraux.

## Gameplay

- Tapez la **première lettre** d'un ennemi pour le verrouiller, finissez son mot pour le tuer.
- `ÉCHAP` met en pause (puis `Q` pour quitter la partie). `TAB` relâche la cible
  (sa saisie est remise à zéro). `F2` coupe le son.
- 3 incidents (ennemis qui atteignent la PROD) → **LA PROD EST DOWN**.
- **Boss** tous les 4 sprints : enchaîner plusieurs commandes terminal complètes.
- **Power-ups dorés** : `coffee` (ralenti), `git revert` (recul), `sudo reboot` (purge l'écran).
- Combo : pas de faute = multiplicateur de score qui grimpe.
- Chaque ennemi affiche son **niveau** (`niv.1 ▲` à `niv.3 ▲▲▲`) ; les points gagnés
  (longueur du mot × 10 × niveau × multiplicateur) s'affichent à chaque kill.
- Certains ennemis **lâchent un bonus** à leur mort : `+1 vie`, points, `combo +5`
  ou slow-mo. Plus l'ennemi est haut niveau, plus la probabilité est forte
  (élite 35 %, legacy 20 %, deadline 15 %, bug 8 %). Le boss lâche toujours une vie.

### Ennemis

| Classe | Apparence | Ce qu'on tape | Vitesse |
|---|---|---|---|
| Bug zombie | insectes ASCII verts | jargon dev court | normale |
| Bug d'élite | gros insectes | exceptions CamelCase | lente |
| Legacy | pierres tombales ambre (COBOL, IE6…) | snippets de code | lente |
| Deadline | faucheuses magenta | horreurs du quotidien | **rapide** |
| Boss | incident prod géant | commandes terminal | très lente |

### Difficultés

| | STAGIAIRE | DEV CONFIRMÉ | SENIOR 10X | CTO BURNOUT |
|---|---|---|---|---|
| Vitesse | ×0.62 | ×1.0 | ×1.35 | ×1.7 |
| Incidents tolérés | 4 | 3 | 2 | **1** |
| Multiplicateur score | ×1 | ×1.5 | ×2 | ×3 |
| Commandes du boss | 2 | 3 | 4 | 5 |

## Base de données & exports

SQLite dans `db/typing-of-the-dev.sqlite` (créée au premier lancement).
Chaque partie enregistre : pseudo, prénom/nom/email/téléphone *(optionnels,
conservés uniquement si la case de consentement RGPD est cochée)*, difficulté,
score, sprints, WPM, précision, combo max, durée, kills par type de monstre et
mots ratés.

Exports depuis `/admin.html` :
- `/api/export.csv` — toutes les parties (CSV `;`, BOM Excel)
- `/api/export.json` — idem en JSON
- `/api/export-emails.csv` — uniquement les contacts ayant coché le consentement
  (prénom, nom, email, téléphone, meilleur score)

L'admin affiche aussi les stats fun de fin de salon : WPM moyen, total de bugs
écrasés et **le mur de la honte** (les mots les plus ratés du DevFest).

## Stack

- [Phaser 3.87](https://phaser.io) local (`public/lib/`)
- Police VT323 locale, esthétique CRT (scanlines/vignette/glitch en CSS)
- Audio 100 % procédural en WebAudio (SFX + musique générative, intensité par vague)
- Serveur `node:http` + `node:sqlite` — aucun `npm install`
