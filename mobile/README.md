# Typing of the Dev — apps Android / iOS

Emballage natif du jeu web avec [Capacitor](https://capacitorjs.com) : une WebView
plein écran qui embarque `../public`. Le jeu lui-même reste dans `public/` (zéro
dépendance) ; seul ce dossier utilise npm.

## Prérequis

| Plateforme | Outil | Notes |
|---|---|---|
| Android | [Android Studio](https://developer.android.com/studio) | gratuit, Mac/Windows/Linux |
| iOS | Xcode (App Store) | Mac obligatoire |

## Utilisation

```bash
cd mobile
npm install          # une seule fois
npm run android      # copie public/ puis ouvre Android Studio (bouton ▶ pour lancer)
npm run ios          # copie public/ puis ouvre Xcode
npm run sync         # recopie public/ dans les deux apps après une modif du jeu
```

Toute modification du jeu se fait dans `public/`, **jamais** dans
`android/app/src/main/assets/public` ni `ios/App/App/public` (copies générées,
ignorées par git, écrasées à chaque sync).

## Limites actuelles

- Le jeu n'est pas encore adapté au tactile (clavier virtuel, mise en page portrait).
- L'API est appelée en relatif (`/api/...`) : dans l'app, le backend est absent,
  le jeu tourne en MODE LOCAL (solo jouable, scores non sauvegardés, pas de multi).
