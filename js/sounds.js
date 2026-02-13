import { state } from './state.js';

// Generate WAV blob from PCM samples — works everywhere including iOS
function generateWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Generate tone samples
function tone(freq, duration, sampleRate, type = 'sine', volume = 0.3) {
  const len = Math.floor(sampleRate * duration);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / duration); // fade out
    let wave;
    if (type === 'sine') {
      wave = Math.sin(2 * Math.PI * freq * t);
    } else { // square
      wave = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
    }
    samples[i] = wave * envelope * volume;
  }
  return samples;
}

// Merge multiple sample arrays with time offsets
function mixSamples(parts, sampleRate) {
  let totalLen = 0;
  for (const { samples, offset } of parts) {
    totalLen = Math.max(totalLen, Math.floor(offset * sampleRate) + samples.length);
  }
  const mixed = new Float32Array(totalLen);
  for (const { samples, offset } of parts) {
    const start = Math.floor(offset * sampleRate);
    for (let i = 0; i < samples.length; i++) {
      mixed[start + i] += samples[i];
    }
  }
  return mixed;
}

const RATE = 22050;

// Pre-generate all sound blobs
const correctSamples = mixSamples([
  { samples: tone(523, 0.15, RATE), offset: 0 },
  { samples: tone(659, 0.15, RATE), offset: 0.1 },
  { samples: tone(784, 0.3, RATE), offset: 0.2 },
], RATE);

const wrongSamples = tone(200, 0.3, RATE, 'square', 0.2);

const clickSamples = tone(440, 0.05, RATE);

const starSamples = mixSamples([
  { samples: tone(880, 0.1, RATE), offset: 0 },
  { samples: tone(1100, 0.2, RATE), offset: 0.1 },
], RATE);

const blobs = {
  correct: URL.createObjectURL(generateWav(correctSamples, RATE)),
  wrong: URL.createObjectURL(generateWav(wrongSamples, RATE)),
  click: URL.createObjectURL(generateWav(clickSamples, RATE)),
  star: URL.createObjectURL(generateWav(starSamples, RATE)),
};

// Unlock audio on iOS: play a silent audio on first interaction
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  const a = new Audio();
  a.src = blobs.click;
  a.volume = 0;
  a.play().catch(() => {});
  audioUnlocked = true;
}

['touchstart', 'touchend', 'click'].forEach(evt => {
  document.addEventListener(evt, unlockAudio, { capture: true });
});

function play(name) {
  if (state.get().muted) return;
  const a = new Audio(blobs[name]);
  a.volume = 0.5;
  a.play().catch(() => {});
}

export const sounds = {
  correct() { play('correct'); },
  wrong() { play('wrong'); },
  click() { play('click'); },
  star() { play('star'); },
};
