/* Moteur audio 100% procédural (WebAudio) : SFX + musique générative.
   Aucun asset, fonctionne offline. L'intensité musicale suit la progression. */
'use strict';

const Sfx = {
  ctx: null,
  master: null,
  sfx: null,
  music: null,
  noiseBuf: null,
  muted: false,

  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.8;
      this.sfx.connect(this.master);
      this.music = this.ctx.createGain();
      this.music.gain.value = 0.34;
      this.music.connect(this.master);
      // buffer de bruit blanc partagé (hi-hats, explosions)
      const len = this.ctx.sampleRate * 1;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggleMute() {
    this.ensure();
    this.muted = !this.muted;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.02);
    return this.muted;
  },

  tone({ type = 'square', f = 440, f2 = null, dur = 0.1, vol = 0.2, when = 0, dest = null }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t0);
    if (f2 !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(dest || this.sfx);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  noise({ dur = 0.15, vol = 0.2, filterF = 4000, type = 'lowpass', when = 0, dest = null }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterF;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(dest || this.sfx);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.02);
  },

  // ---- SFX gameplay --------------------------------------------------
  blip(combo = 0) { // frappe juste : le pitch monte avec le combo
    this.tone({ type: 'square', f: 1400 + Math.min(combo, 40) * 35, dur: 0.04, vol: 0.06 });
  },
  error() {
    this.tone({ type: 'sawtooth', f: 110, f2: 55, dur: 0.2, vol: 0.22 });
    this.noise({ dur: 0.08, vol: 0.1, filterF: 900 });
  },
  kill() {
    this.noise({ dur: 0.25, vol: 0.28, filterF: 5000 });
    this.tone({ type: 'square', f: 740, f2: 80, dur: 0.22, vol: 0.18 });
  },
  incident() { // un ennemi a atteint la prod
    this.tone({ type: 'sine', f: 60, f2: 28, dur: 0.7, vol: 0.55 });
    this.tone({ type: 'square', f: 880, dur: 0.12, vol: 0.14, when: 0.05 });
    this.tone({ type: 'square', f: 660, dur: 0.12, vol: 0.14, when: 0.22 });
    this.tone({ type: 'square', f: 880, dur: 0.12, vol: 0.14, when: 0.39 });
  },
  powerup() {
    [523, 659, 784, 1047].forEach((f, i) =>
      this.tone({ type: 'triangle', f, dur: 0.12, vol: 0.16, when: i * 0.07 }));
  },
  waveClear() {
    [330, 392, 494, 659, 784].forEach((f, i) =>
      this.tone({ type: 'square', f, dur: 0.1, vol: 0.12, when: i * 0.06 }));
  },
  missile() { // le recruteur envoie un InMail
    this.tone({ type: 'square', f: 340, f2: 980, dur: 0.13, vol: 0.12 });
    this.tone({ type: 'square', f: 980, dur: 0.06, vol: 0.08, when: 0.14 });
  },
  bomb() { // kill -9 : grosse détonation sourde
    this.tone({ type: 'sine', f: 90, f2: 30, dur: 0.45, vol: 0.5 });
    this.noise({ dur: 0.35, vol: 0.3, filterF: 1800 });
    this.tone({ type: 'square', f: 500, f2: 60, dur: 0.3, vol: 0.15, when: 0.04 });
  },
  laser() { // autocomplete : zap descendant rapide
    this.tone({ type: 'sawtooth', f: 2400, f2: 180, dur: 0.18, vol: 0.2 });
    this.noise({ dur: 0.1, vol: 0.08, filterF: 6000, type: 'highpass' });
  },
  bossHit() {
    this.tone({ type: 'sawtooth', f: 200, f2: 50, dur: 0.35, vol: 0.3 });
    this.noise({ dur: 0.3, vol: 0.2, filterF: 2500 });
  },
  bossSpawn() {
    this.tone({ type: 'sawtooth', f: 40, f2: 110, dur: 1.2, vol: 0.4 });
    this.tone({ type: 'sawtooth', f: 41, f2: 112, dur: 1.2, vol: 0.4 });
  },
  gameOver() {
    [392, 370, 349, 330].forEach((f, i) =>
      this.tone({ type: 'sawtooth', f, dur: 0.4, vol: 0.2, when: i * 0.3 }));
    this.tone({ type: 'sine', f: 55, f2: 25, dur: 1.6, vol: 0.5, when: 1.1 });
  },
};

/* Musique générative : séquenceur pas-à-pas avec lookahead, 5 pistes
   procédurales très différentes (choisies avec B au menu, persistées).
   Chaque piste gère les intensités 0 (menu, doux) à 4 (boss). */

const TRACKS = [
  {
    name: 'MATRIX', // chiptune sombre en La mineur (la piste historique)
    BASS: [55, 0, 55, 0, 65.4, 0, 55, 0, 41.2, 0, 55, 0, 49, 0, 55, 0],
    BASS_BOSS: [55, 55, 51.9, 51.9, 55, 55, 61.7, 49, 55, 55, 51.9, 51.9, 65.4, 0, 49, 0],
    ARP: [220, 261.6, 329.6, 392, 440, 392, 329.6, 261.6, 220, 261.6, 329.6, 523.3, 440, 392, 329.6, 261.6],
    MENU_BASS: [110, 87.3, 130.8, 98],
    MENU_ARP: [220, 261.6, 329.6, 440, 174.6, 220, 261.6, 349.2, 261.6, 329.6, 392, 523.3, 196, 246.9, 293.7, 392],
    MENU_MELODY: [440, 0, 523.3, 0, 440, 392, 0, 329.6, 0, 0, 392, 0, 440, 0, 0, 0],
    bpm(i) { return i === 0 ? 82 : i >= 4 ? 150 : 104 + i * 10; },
    step(s, when, I) {
      if (I === 0) {
        const chord = Math.floor(s / 4);
        if (s % 4 === 0) {
          Sfx.tone({ type: 'sine', f: this.MENU_BASS[chord], dur: 1.1, vol: 0.22, when, dest: Sfx.music });
          Sfx.tone({ type: 'triangle', f: this.MENU_BASS[chord] * 2, dur: 0.9, vol: 0.08, when, dest: Sfx.music });
        }
        Sfx.tone({ type: 'triangle', f: this.MENU_ARP[s], dur: 0.32, vol: 0.07, when, dest: Sfx.music });
        const m = this.MENU_MELODY[s];
        if (m) Sfx.tone({ type: 'square', f: m, dur: 0.4, vol: 0.05, when, dest: Sfx.music });
        return;
      }
      const boss = I >= 4;
      const bass = (boss ? this.BASS_BOSS : this.BASS)[s];
      if (bass) {
        Sfx.tone({ type: 'sawtooth', f: bass, dur: 0.22, vol: boss ? 0.34 : 0.26, when, dest: Sfx.music });
        Sfx.tone({ type: 'square', f: bass / 2, dur: 0.22, vol: 0.12, when, dest: Sfx.music });
      }
      if (I >= 2 && s % 2 === 0) {
        Sfx.noise({ dur: 0.04, vol: s % 8 === 4 ? 0.12 : 0.05, filterF: 8000, type: 'highpass', when, dest: Sfx.music });
      }
      if (I >= 3 && s % 2 === 1) {
        Sfx.tone({ type: 'triangle', f: this.ARP[s], dur: 0.14, vol: 0.1, when, dest: Sfx.music });
      }
      if (boss && s % 4 === 0) {
        Sfx.tone({ type: 'sine', f: 120, f2: 40, dur: 0.18, vol: 0.4, when, dest: Sfx.music });
      }
    },
  },

  {
    name: 'SYNTHWAVE', // nappes planantes en Fa mineur, kick régulier, arpège cristallin
    ROOTS: [43.7, 51.9, 38.9, 34.7], // F1, Ab1, Eb1, Db1
    PADS: [
      [174.6, 207.7, 261.6], // Fm
      [207.7, 261.6, 311.1], // Ab
      [155.6, 196, 233.1],   // Eb
      [138.6, 174.6, 220],   // Db
    ],
    bpm(i) { return i === 0 ? 74 : i >= 4 ? 138 : 96 + i * 10; },
    step(s, when, I) {
      const chord = Math.floor(s / 4);
      if (s % 4 === 0) {
        Sfx.tone({ type: 'sawtooth', f: this.ROOTS[chord], dur: I >= 4 ? 0.3 : 0.55, vol: 0.24, when, dest: Sfx.music });
        this.PADS[chord].forEach((f) =>
          Sfx.tone({ type: 'triangle', f, dur: 1.2, vol: I === 0 ? 0.05 : 0.06, when, dest: Sfx.music }));
      }
      if (I === 0) {
        if (s % 2 === 1) Sfx.tone({ type: 'sine', f: this.PADS[chord][(s >> 1) % 3] * 2, dur: 0.4, vol: 0.04, when, dest: Sfx.music });
        return;
      }
      if (I >= 2 && s % 4 === 0) Sfx.tone({ type: 'sine', f: 110, f2: 35, dur: 0.16, vol: 0.38, when, dest: Sfx.music });
      if (I >= 2 && s % 8 === 4) Sfx.noise({ dur: 0.18, vol: 0.1, filterF: 3200, when, dest: Sfx.music });
      if (I >= 3 && s % 2 === 1) {
        Sfx.tone({ type: 'triangle', f: this.PADS[chord][(s >> 1) % 3] * 2, dur: 0.18, vol: 0.09, when, dest: Sfx.music });
      }
      if (I >= 4 && s % 2 === 0) {
        Sfx.tone({ type: 'square', f: this.ROOTS[chord] * 4, dur: 0.1, vol: 0.1, when, dest: Sfx.music });
      }
    },
  },

  {
    name: 'LOUNGE', // jazz d'ascenseur swingué : walking bass et mélodie pentatonique
    WALK: [65.4, 0, 82.4, 0, 55, 0, 65.4, 0, 73.4, 0, 87.3, 0, 49, 0, 61.7, 0],
    MEL: [330, 0, 392, 0, 440, 0, 392, 330, 0, 294, 0, 262, 0, 294, 330, 0],
    bpm(i) { return i === 0 ? 80 : i >= 4 ? 132 : 88 + i * 8; },
    step(s, when, I) {
      const bass = this.WALK[s];
      if (bass) Sfx.tone({ type: 'sine', f: bass, dur: 0.34, vol: I === 0 ? 0.18 : 0.26, when, dest: Sfx.music });
      if (I === 0) {
        const m = this.MEL[s];
        if (m) Sfx.tone({ type: 'triangle', f: m, dur: 0.35, vol: 0.06, when, dest: Sfx.music });
        return;
      }
      // balai/rim feutré en contretemps swing
      if (I >= 2 && (s % 4 === 2 || s % 8 === 7)) {
        Sfx.noise({ dur: 0.05, vol: 0.05, filterF: 6500, type: 'highpass', when, dest: Sfx.music });
      }
      if (I >= 3) {
        const m = this.MEL[s];
        if (m) Sfx.tone({ type: 'triangle', f: m, dur: 0.28, vol: 0.1, when, dest: Sfx.music });
      }
      if (I >= 4) { // le boss fait monter la jam : cuivre sawtooth à l'octave
        const m = this.MEL[s];
        if (m) Sfx.tone({ type: 'sawtooth', f: m * 2, dur: 0.18, vol: 0.07, when, dest: Sfx.music });
        if (s % 4 === 0) Sfx.tone({ type: 'sine', f: 100, f2: 45, dur: 0.14, vol: 0.3, when, dest: Sfx.music });
      }
    },
  },

  {
    name: 'RAVE', // techno acide en Mi phrygien : kick 4/4 et basse 16e
    ACID: [41.2, 41.2, 43.7, 41.2, 41.2, 49, 41.2, 55, 41.2, 41.2, 43.7, 41.2, 61.7, 55, 49, 43.7],
    bpm(i) { return i === 0 ? 92 : i >= 4 ? 160 : 122 + i * 8; },
    step(s, when, I) {
      if (I === 0) {
        if (s % 4 === 0) Sfx.tone({ type: 'sine', f: this.ACID[s], dur: 0.6, vol: 0.2, when, dest: Sfx.music });
        if (s % 4 === 2) Sfx.tone({ type: 'triangle', f: this.ACID[s] * 4, dur: 0.3, vol: 0.05, when, dest: Sfx.music });
        return;
      }
      Sfx.tone({ type: 'sawtooth', f: this.ACID[s], f2: this.ACID[s] * 1.4, dur: 0.11, vol: 0.24, when, dest: Sfx.music });
      if (s % 4 === 0) Sfx.tone({ type: 'sine', f: 150, f2: 40, dur: 0.2, vol: 0.45, when, dest: Sfx.music });
      if (I >= 2 && s % 4 === 2) Sfx.noise({ dur: 0.12, vol: 0.1, filterF: 9000, type: 'highpass', when, dest: Sfx.music });
      if (I >= 3 && (s === 4 || s === 12)) {
        [164.8, 220].forEach((f) => Sfx.tone({ type: 'square', f, dur: 0.16, vol: 0.11, when, dest: Sfx.music }));
      }
      if (I >= 4 && s % 8 === 4) Sfx.noise({ dur: 0.2, vol: 0.16, filterF: 2000, when, dest: Sfx.music });
    },
  },

  {
    name: '8-BIT HERO', // hymne majeur héroïque : C-F-Am-G qui pulse à l'octave
    ROOTS: [65.4, 87.3, 110, 98],
    MEL: [523.3, 0, 659.3, 784, 698.5, 0, 659.3, 587.3, 659.3, 0, 523.3, 440, 493.9, 523.3, 587.3, 0],
    bpm(i) { return i === 0 ? 84 : i >= 4 ? 160 : 110 + i * 10; },
    step(s, when, I) {
      const root = this.ROOTS[Math.floor(s / 4)];
      if (I === 0) {
        if (s % 4 === 0) Sfx.tone({ type: 'sine', f: root, dur: 1.0, vol: 0.2, when, dest: Sfx.music });
        const m = this.MEL[s];
        if (m) Sfx.tone({ type: 'triangle', f: m / 2, dur: 0.4, vol: 0.06, when, dest: Sfx.music });
        return;
      }
      Sfx.tone({ type: 'square', f: s % 2 ? root * 2 : root, dur: 0.14, vol: 0.2, when, dest: Sfx.music });
      if (I >= 2 && s % 8 === 4) Sfx.noise({ dur: 0.12, vol: 0.12, filterF: 4000, when, dest: Sfx.music });
      if (I >= 3) {
        const m = this.MEL[s];
        if (m) Sfx.tone({ type: 'square', f: m, dur: 0.2, vol: 0.1, when, dest: Sfx.music });
      }
      if (I >= 4) {
        const m = this.MEL[s];
        if (m) Sfx.tone({ type: 'triangle', f: m * 2, dur: 0.16, vol: 0.07, when, dest: Sfx.music });
        if (s % 4 === 0) Sfx.tone({ type: 'sine', f: 130, f2: 45, dur: 0.15, vol: 0.32, when, dest: Sfx.music });
      }
    },
  },
];

/* Piste cachée du MODE DISCO : four-on-the-floor, charley en contretemps,
   basse octave funky et stabs de cordes. Prend le dessus sur la piste choisie. */
const DISCO_TRACK = {
  name: 'DISCO 🪩',
  ROOTS: [73.4, 98, 65.4, 110], // Dm — G — C — Am, la pompe funky
  CHORDS: [[220, 261.6, 349.2], [196, 246.9, 293.7], [261.6, 329.6, 392], [220, 261.6, 329.6]],
  MEL: [440, 0, 523.3, 587.3, 0, 523.3, 440, 0, 392, 440, 0, 349.2, 392, 0, 440, 0],
  bpm(i) { return i === 0 ? 104 : i >= 4 ? 142 : 114 + i * 6; },
  step(s, when, I) {
    const chord = Math.floor(s / 4);
    const root = this.ROOTS[chord];
    // basse octave sur chaque croche, signature disco
    Sfx.tone({ type: 'sawtooth', f: s % 2 ? root * 2 : root, dur: 0.13, vol: I === 0 ? 0.14 : 0.2, when, dest: Sfx.music });
    if (I === 0) {
      if (s % 4 === 0) this.CHORDS[chord].forEach((f) =>
        Sfx.tone({ type: 'triangle', f, dur: 0.9, vol: 0.04, when, dest: Sfx.music }));
      return;
    }
    if (s % 2 === 0) Sfx.tone({ type: 'sine', f: 130, f2: 45, dur: 0.15, vol: 0.4, when, dest: Sfx.music });
    else Sfx.noise({ dur: 0.14, vol: 0.09, filterF: 9000, type: 'highpass', when, dest: Sfx.music });
    if (I >= 2 && (s === 2 || s === 7 || s === 10 || s === 15)) {
      this.CHORDS[chord].forEach((f) => Sfx.tone({ type: 'square', f, dur: 0.14, vol: 0.05, when, dest: Sfx.music }));
    }
    if (I >= 3) {
      const m = this.MEL[s];
      if (m) Sfx.tone({ type: 'triangle', f: m, dur: 0.2, vol: 0.1, when, dest: Sfx.music });
    }
    if (I >= 4 && s % 4 === 2) Sfx.noise({ dur: 0.2, vol: 0.14, filterF: 2200, when, dest: Sfx.music });
  },
};

const Music = {
  playing: false,
  intensity: 1,
  step: 0,
  nextTime: 0,
  timer: null,
  trackIndex: Math.min(TRACKS.length - 1, Math.max(0, Number(localStorage.getItem('totd-music')) || 0)),

  track() {
    if (typeof DISCO_MODE !== 'undefined' && DISCO_MODE) return DISCO_TRACK;
    return TRACKS[this.trackIndex];
  },

  /* Change de piste (B au menu) : prend effet immédiatement, persiste. */
  setTrack(i) {
    this.trackIndex = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    localStorage.setItem('totd-music', String(this.trackIndex));
    this.step = 0;
    return this.track().name;
  },

  bpm() { return this.track().bpm(this.intensity); },

  start(intensity = 1) {
    Sfx.ensure();
    this.intensity = intensity;
    if (this.playing) return;
    this.playing = true;
    this.step = 0;
    this.nextTime = Sfx.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this.schedule(), 25);
  },

  stop() {
    this.playing = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  },

  setIntensity(i) { this.intensity = Math.max(0, Math.min(4, i)); },

  schedule() {
    if (!this.playing || !Sfx.ctx) return;
    const stepDur = 60 / this.bpm() / 2; // croches
    while (this.nextTime < Sfx.ctx.currentTime + 0.12) {
      this.track().step(this.step % 16, this.nextTime - Sfx.ctx.currentTime, this.intensity);
      this.nextTime += stepDur;
      this.step++;
    }
  },
};
