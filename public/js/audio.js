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

/* Musique générative : séquenceur pas-à-pas avec lookahead.
   4 niveaux d'intensité — basse seule, + hats, + arpège, boss. */
const Music = {
  playing: false,
  intensity: 1,
  step: 0,
  nextTime: 0,
  timer: null,

  // gammes en La mineur (fréquences)
  BASS: [55, 0, 55, 0, 65.4, 0, 55, 0, 41.2, 0, 55, 0, 49, 0, 55, 0],
  BASS_BOSS: [55, 55, 51.9, 51.9, 55, 55, 61.7, 49, 55, 55, 51.9, 51.9, 65.4, 0, 49, 0],
  ARP: [220, 261.6, 329.6, 392, 440, 392, 329.6, 261.6, 220, 261.6, 329.6, 523.3, 440, 392, 329.6, 261.6],

  bpm() { return this.intensity >= 4 ? 150 : 104 + this.intensity * 10; },

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

  setIntensity(i) { this.intensity = Math.max(1, Math.min(4, i)); },

  schedule() {
    if (!this.playing || !Sfx.ctx) return;
    const stepDur = 60 / this.bpm() / 2; // croches
    while (this.nextTime < Sfx.ctx.currentTime + 0.12) {
      this.playStep(this.step % 16, this.nextTime - Sfx.ctx.currentTime);
      this.nextTime += stepDur;
      this.step++;
    }
  },

  playStep(s, when) {
    const boss = this.intensity >= 4;
    const bass = (boss ? this.BASS_BOSS : this.BASS)[s];
    if (bass) {
      Sfx.tone({ type: 'sawtooth', f: bass, dur: 0.22, vol: boss ? 0.34 : 0.26, when, dest: Sfx.music });
      Sfx.tone({ type: 'square', f: bass / 2, dur: 0.22, vol: 0.12, when, dest: Sfx.music });
    }
    if (this.intensity >= 2 && s % 2 === 0) {
      Sfx.noise({ dur: 0.04, vol: s % 8 === 4 ? 0.12 : 0.05, filterF: 8000, type: 'highpass', when, dest: Sfx.music });
    }
    if (this.intensity >= 3 && s % 2 === 1) {
      Sfx.tone({ type: 'triangle', f: this.ARP[s], dur: 0.14, vol: 0.1, when, dest: Sfx.music });
    }
    if (boss && s % 4 === 0) { // kick sur le boss
      Sfx.tone({ type: 'sine', f: 120, f2: 40, dur: 0.18, vol: 0.4, when, dest: Sfx.music });
    }
  },
};
