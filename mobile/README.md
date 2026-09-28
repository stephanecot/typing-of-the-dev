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

## Version mobile du jeu

Dans l'app (ou sur un écran tactile, ou avec `?mobile=1` dans un navigateur),
le jeu passe en mode `MOBILE` : portrait, écran de jeu en haut, clavier virtuel
en bas (`public/js/mobile/keyboard.js`), menus tactiles en HTML
(`public/js/mobile/ui.js`). Pas de multijoueur ni de bandeau événement.

## Développer avec l'émulateur Android

```bash
node server.js                                   # à la racine du projet
adb reverse tcp:3333 tcp:3333                    # l'émulateur voit localhost:3333
npx cap run android --live-reload --host localhost --port 3333
```

Relancer l'app suffit ensuite à recharger `public/` (pas de rebuild).

**Java** : Gradle 8.14 ne supporte pas Java 25 (celui d'Android Studio 2026).
Utiliser un JDK 21–24 : `JAVA_HOME=/chemin/vers/jdk-24`, et dans Android Studio
*Settings → Build Tools → Gradle → Gradle JDK*.

## Limites actuelles

- L'API est appelée en relatif (`/api/...`) : dans l'app, le backend est absent,
  le jeu tourne en MODE LOCAL (solo jouable, scores non sauvegardés).
- Le bouton retour Android quitte l'app (pas encore relié à la pause).
- Icône et écran de démarrage : ceux de Capacitor par défaut.
