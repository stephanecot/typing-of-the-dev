#!/usr/bin/env node
/* Évalue une expression JS dans la WebView de l'app Android (émulateur ou
   téléphone branché) via le protocole DevTools — zéro dépendance.
   Usage : node mobile/scripts/webview-eval.mjs "game.scene.getScenes(true).map(s => s.scene.key)"
   Le résultat est affiché en JSON (les Promises sont attendues). */
import { execSync } from 'node:child_process';

const adb = process.env.ADB || `${process.env.HOME}/Library/Android/sdk/platform-tools/adb`;
const expression = process.argv[2];
if (!expression) {
  console.error('usage: node webview-eval.mjs "<expression>"');
  process.exit(2);
}

let unix = '';
try {
  unix = execSync(`${adb} shell cat /proc/net/unix`, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
} catch {
  console.error('aucun appareil Android : lancer l\'émulateur (ou brancher un téléphone) puis l\'app');
  process.exit(1);
}
const sockets = unix.match(/webview_devtools_remote_\d+/g);
if (!sockets) {
  console.error('aucune WebView débogable : l\'app est-elle lancée (build debug) ?');
  process.exit(1);
}
execSync(`${adb} forward tcp:9222 localabstract:${sockets.pop()}`);
const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = pages.find((p) => p.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve));
ws.send(JSON.stringify({
  id: 1,
  method: 'Runtime.evaluate',
  params: { expression, awaitPromise: true, returnByValue: true },
}));
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.id !== 1) return;
  const r = d.result;
  if (r.exceptionDetails) {
    console.error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    process.exit(1);
  }
  console.log(JSON.stringify(r.result.value ?? r.result, null, 1));
  process.exit(0);
});
