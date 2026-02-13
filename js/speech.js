import { state } from './state.js';

// --- Pre-recorded WAV speech ---
let speechAudio = null; // reusable <audio> element for speech WAV files
let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  // Create and unlock the audio element
  if (!speechAudio) {
    speechAudio = document.createElement('audio');
    speechAudio.preload = 'auto';
  }
  speechAudio.muted = true;
  speechAudio.src = 'assets/sounds/silence.wav';
  const p = speechAudio.play();
  if (p) p.then(() => {
    speechAudio.pause();
    speechAudio.muted = false;
    speechAudio.currentTime = 0;
  }).catch(() => {
    speechAudio.muted = false;
  });
}

document.addEventListener('touchstart', unlockAudio, { capture: true });
document.addEventListener('touchend', unlockAudio, { capture: true });
document.addEventListener('click', unlockAudio, { capture: true });

// --- TTS fallback ---
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

// --- Pending queue for pre-unlock requests ---
let pendingTaskId = null;
let pendingText = null;

export const speech = {
  /**
   * Play pre-recorded WAV for a task, with TTS fallback.
   * @param {string} taskId - e.g. "m1", "l3", "lg5"
   * @param {string} fallbackText - question text for TTS fallback
   */
  speakTask(taskId, fallbackText) {
    if (state.get().muted) return;

    if (!audioUnlocked) {
      pendingTaskId = taskId;
      pendingText = fallbackText;
      return;
    }

    this._doSpeakTask(taskId, fallbackText);
  },

  _doSpeakTask(taskId, fallbackText) {
    // Stop any current playback
    this.stop();

    if (!speechAudio) {
      speechAudio = document.createElement('audio');
      speechAudio.preload = 'auto';
    }

    const wavUrl = `assets/speech/${taskId}.wav`;
    speechAudio.src = wavUrl;
    speechAudio.currentTime = 0;
    speechAudio.volume = 1.0;

    // Try WAV file, fallback to TTS on error
    speechAudio.onerror = () => {
      this._doSpeakTts(fallbackText);
    };

    speechAudio.play().catch(() => {
      this._doSpeakTts(fallbackText);
    });
  },

  /**
   * Speak arbitrary text via TTS (for feedback, story dialogue, etc.)
   */
  speak(text) {
    if (state.get().muted) return;

    const clean = text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[❓❌✅⬜🔺]/gu, '').trim();
    if (!clean) return;

    if (!ttsUnlocked) {
      pendingText = clean;
      pendingTaskId = null;
      return;
    }

    this._doSpeakTts(clean);
  },

  _doSpeakTts(text) {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    if (russianVoice) utterance.voice = russianVoice;

    setTimeout(() => {
      speechSynthesis.speak(utterance);
    }, 100);
  },

  speakPending() {
    if (pendingTaskId && audioUnlocked) {
      this._doSpeakTask(pendingTaskId, pendingText);
      pendingTaskId = null;
      pendingText = null;
    } else if (pendingText && ttsUnlocked) {
      this._doSpeakTts(pendingText);
      pendingText = null;
    }
  },

  stop() {
    if (speechAudio) {
      speechAudio.pause();
      speechAudio.currentTime = 0;
    }
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
  }
};

// After unlock, speak any pending
document.addEventListener('click', () => {
  setTimeout(() => speech.speakPending(), 200);
}, { capture: true });
document.addEventListener('touchend', () => {
  setTimeout(() => speech.speakPending(), 200);
}, { capture: true });
