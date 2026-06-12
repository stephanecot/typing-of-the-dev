# TYPING OF THE DEV 🧟⌨️

Jeu de stand pour le **DevFest Toulouse 2026** — un hommage à *The Typing of the Dead* :
les bugs zombies sortent du backlog et avancent vers la PROD. Tapez leur mot pour les
écraser avant l'incident.

## Lancer (stand)

```bash
node server.js
# Jeu         → http://localhost:3333
# Leaderboard → http://localhost:3333/leaderboard.html   (second écran, auto-refresh)
# Admin       → http://localhost:3333/admin.html         (stats + exports)
```

**Zéro dépendance npm** (Node ≥ 22.5 requis : SQLite natif via `node:sqlite`).
Tout fonctionne **offline** : Phaser, police et sons sont locaux/procéduraux.

## Gameplay

- Tapez la **première lettre** d'un ennemi pour le verrouiller, finissez son mot pour le tuer
  (les **espaces sont facultatifs** : taper directement la lettre suivante les saute).
- `ÉCHAP` met en pause (puis `Q` pour quitter la partie). `TAB` relâche la cible
  (sa saisie est remise à zéro). `F2` coupe le son.
- 3 incidents (ennemis qui atteignent la PROD) → **LA PROD EST DOWN**.
- **Objectif : tenir 10 sprints** (réglable depuis l'admin) puis vaincre le boss final,
  **LE DSI ÉNERVÉ**. Un compte à rebours est affiché : chaque seconde restante à la
  victoire rapporte des points bonus.
- **Boss** tous les 4 sprints : enchaîner plusieurs commandes terminal complètes.
- **Pouvoirs ennemis** : certains mots arrivent **MINIFIÉS** (des lettres sont
  masquées par des `?`, devine-les !) ou **RETOURNÉS** (affichés tête en bas) ;
  **LE RECRUTEUR** `[in]` spamme des InMails-missiles (`cv ?`, `dispo ?`, `tjm ?`…)
  qu'il faut abattre aussi.
- **Power-ups dorés** : `coffee` (ralenti), `git revert` (recul), `sudo reboot` (purge l'écran).
- Combo : pas de faute = multiplicateur de score qui grimpe.
- Chaque ennemi affiche son **niveau** (`niv.1 ▲` à `niv.3 ▲▲▲`) ; les points gagnés
  s'affichent à chaque kill : longueur du mot × 10 × niveau × multiplicateur de
  combo × **bonus de vitesse** (chrono du verrouillage à la mort : ~3 caractères/s
  = neutre, frappe éclair = jusqu'à ×3, mot long tapé vite = jackpot).
- Certains ennemis **lâchent un bonus** à leur mort : `+1 vie`, points, `combo +5`,
  slow-mo ou un item. Plus l'ennemi est haut niveau, plus la probabilité est forte
  (élite 55 %, legacy 40 %, deadline 30 %, bug 18 %). Le boss lâche toujours une vie.
- **Items** (on démarre avec 1 de chaque) :
  - `ENTRÉE` → **KILL -9** (max 3) : tue le process ennemi le plus proche de la prod
    (ne touche ni le boss ni les power-ups).
  - `EFFACER` → **AUTOCOMPLETE** (max 5) : l'IA complète les 4 prochaines lettres
    de la cible verrouillée (peut achever un mot, marche aussi sur le boss).
- `H` sur l'écran d'accueil : aide complète sur 4 pages (règles, difficultés,
  bestiaire, boss). `L` : bascule la langue FR/EN (interface + banques de mots
  les plus franchouillardes).
- 🥚 Il paraît qu'un certain code bien connu des joueurs rend invincible…
  mais le jeu affiche alors `☠ GOD MODE = TRICHEUR ☠` à côté du score et
  refuse d'enregistrer la partie. On n'aime pas les tricheurs.

### Ennemis

| Classe | Niveau | Ce qu'on tape | Particularité |
|---|---|---|---|
| Bug zombie | 1 | jargon dev court | nombreux |
| InMail | 1 | mots courts | missile du recruteur, rapide |
| Bug fantôme | 2 | jargon dev | disparaît par intermittence |
| Virus | 2 | mots courts | se réplique en 2 mini-bugs à sa mort |
| Le microservice | 2 | mots courts | se scinde en 2 instances toutes les 8 s |
| Legacy | 2 | snippets de code | lent, pierres tombales (COBOL, IE6…) |
| Deadline | 2 | horreurs du quotidien | **rapide** |
| Bug d'élite | 3 | exceptions CamelCase | majuscules comprises |
| Le recruteur | 3 | — | campe et spamme des InMails |
| Le monolithe | 3 | exceptions ×2 | exige 2 mots, recule entre les deux |
| La spec foireuse | 3 | du charabia aléatoire | son mot ne veut rien dire |
| Le consultant | 4 | buzzwords | **CTO/DIEU uniquement**, accélère |
| Le ransomware | 5 | commandes | **DIEU uniquement**, rechiffre son mot / 6 s |
| Boss | — | commandes terminal | tous les 4 sprints |
| LE DSI ÉNERVÉ | — | commandes terminal | boss final, victoire à la clé |

### Difficultés

| | STAGIAIRE | DEV CONFIRMÉ | SENIOR 10X | CTO BURNOUT | DIEU DU TERMINAL |
|---|---|---|---|---|---|
| Vitesse | ×0.62 | ×1.0 | ×1.35 | ×1.7 | ×2.1 |
| Incidents tolérés | 4 | 3 | 2 | **1** | **1** |
| Multiplicateur score | ×1 | ×1.5 | ×2 | ×3 | ×4 |
| Commandes du boss | 2 | 3 | 4 | 5 | 6 |

## Base de données & exports

SQLite dans `db/typing-of-the-dev.sqlite` (créée au premier lancement).
Chaque partie enregistre : pseudo, prénom/nom/email/téléphone *(optionnels,
conservés uniquement si la case de consentement RGPD est cochée)*, difficulté,
score, sprints, WPM, précision, combo max, durée, kills par type de monstre et
mots ratés.

L'admin permet aussi de **régler le nombre de sprints** nécessaires pour affronter
le DSI énervé (`POST /api/config`, persisté en BDD, lu par le jeu au chargement du menu).

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
