// Luxury Audio Synthesizer via Web Audio API (Zero external assets, 100% reliable)

let audioCtx = null;
let soundEnabled = false;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  if (soundEnabled) {
    getAudioContext();
    playCrystalChime(520, 0.08); // pleasant warm confirmation tone
  }
  return soundEnabled;
}

export function toggleSound() {
  return setSoundEnabled(!soundEnabled);
}

// Baccarat / Riedel Crystal Glass Harmonic Chime
export function playCrystalChime(rootFreq = 880, intensity = 0.12) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const harmonics = [1, 2.02, 2.98, 4.04];
  const weights = [1.0, 0.45, 0.22, 0.12];

  harmonics.forEach((h, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(rootFreq * h, now);

    // Warm high-shelf filter to tame piercing high frequencies
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, now);

    const amp = intensity * weights[i];
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(amp, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + (1.2 + i * 0.3));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 2.0);
  });
}

// Cinematic Sub-Bass Atmosphere Swell (Movie Trailer Style)
export function playCinematicSwell() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(48, now);
  osc.frequency.exponentialRampToValueAtTime(72, now + 1.2);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(140, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.09, now + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 2.0);
}

// Precision Mechanical Haptic Click (Macro camera transition)
export function playMacroClick() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

// Soft Air/Optical Whoosh for Camera Transitions
export function playWhoosh() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.25);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.26);
}

// Convenience Aliases for UI integration
export const playMechanicalClick = playMacroClick;
export const playSwell = playCinematicSwell;
export const toggleAudio = toggleSound;
export const getAudioStatus = isSoundEnabled;

