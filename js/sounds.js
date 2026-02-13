import { state } from './state.js';

let ctx = null;
let unlocked = false;

function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

// iOS/Android require AudioContext.resume() after a user gesture
function unlock() {
  if (unlocked) return;
  const c = getContext();
  if (c.state === 'suspended') {
    c.resume();
  }
  // Also unlock SpeechSynthesis on iOS with an empty utterance
  if (typeof speechSynthesis !== 'undefined') {
    const empty = new SpeechSynthesisUtterance('');
    speechSynthesis.speak(empty);
  }
  unlocked = true;
}

// Listen for first user interaction to unlock audio
['touchstart', 'touchend', 'click'].forEach(evt => {
  document.addEventListener(evt, unlock, { once: false, capture: true });
});

function playTone(frequency, duration, type = 'sine') {
  if (state.get().muted) return;
  const c = getContext();
  if (c.state === 'suspended') c.resume();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.3, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export const sounds = {
  correct() {
    playTone(523, 0.15);
    setTimeout(() => playTone(659, 0.15), 100);
    setTimeout(() => playTone(784, 0.3), 200);
  },
  wrong() {
    playTone(200, 0.3, 'square');
  },
  click() {
    playTone(440, 0.05);
  },
  star() {
    playTone(880, 0.1);
    setTimeout(() => playTone(1100, 0.2), 100);
  }
};
