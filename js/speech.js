import { state } from './state.js';

let russianVoice = null;
let ttsUnlocked = false;

function findRussianVoice() {
  const voices = speechSynthesis.getVoices();
  russianVoice = voices.find(v => v.lang.startsWith('ru')) || null;
}

if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = findRussianVoice;
  findRussianVoice();
}

// iOS Safari requires speechSynthesis.speak() inside a user gesture handler
function unlockTts() {
  if (ttsUnlocked) return;
  if (typeof speechSynthesis === 'undefined') return;
  ttsUnlocked = true;
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  speechSynthesis.speak(u);
}

document.addEventListener('touchstart', unlockTts, { capture: true });
document.addEventListener('touchend', unlockTts, { capture: true });
document.addEventListener('click', unlockTts, { capture: true });

// Queue: on mobile, speak requests that come before unlock get queued
let pendingText = null;

export const speech = {
  speak(text) {
    if (typeof speechSynthesis === 'undefined') return;
    if (state.get().muted) return;

    // Strip emoji for cleaner pronunciation
    const clean = text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[❓❌✅⬜🔺]/gu, '').trim();
    if (!clean) return;

    if (!ttsUnlocked) {
      // Save for after unlock — will be spoken on next user tap
      pendingText = clean;
      return;
    }

    this._doSpeak(clean);
  },

  _doSpeak(clean) {
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    if (russianVoice) utterance.voice = russianVoice;

    // iOS workaround: delay after cancel
    setTimeout(() => {
      speechSynthesis.speak(utterance);
    }, 100);
  },

  // Called after unlock to speak any pending text
  speakPending() {
    if (pendingText && ttsUnlocked) {
      this._doSpeak(pendingText);
      pendingText = null;
    }
  },

  stop() {
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
  }
};

// After unlock, speak any pending text
document.addEventListener('click', () => {
  setTimeout(() => speech.speakPending(), 200);
}, { capture: true });
document.addEventListener('touchend', () => {
  setTimeout(() => speech.speakPending(), 200);
}, { capture: true });
