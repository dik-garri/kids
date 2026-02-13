let voiceReady = false;
let russianVoice = null;

function findRussianVoice() {
  const voices = speechSynthesis.getVoices();
  russianVoice = voices.find(v => v.lang.startsWith('ru')) || null;
  voiceReady = true;
}

// Voices load asynchronously in some browsers
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = findRussianVoice;
  findRussianVoice();
}

export const speech = {
  speak(text) {
    if (typeof speechSynthesis === 'undefined') return;

    // Strip emoji for cleaner pronunciation
    const clean = text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[❓❌✅⬜🔺]/gu, '').trim();
    if (!clean) return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    if (russianVoice) utterance.voice = russianVoice;

    speechSynthesis.speak(utterance);
  },

  stop() {
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
  }
};
