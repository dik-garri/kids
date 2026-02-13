import { state } from './state.js';

// Audio pool approach — most reliable for iOS Safari + Android Chrome
// Pre-create <audio> elements, unlock all on first tap, reuse for playback

const SOUND_FILES = {
  correct: 'assets/sounds/correct.wav',
  wrong: 'assets/sounds/wrong.wav',
  click: 'assets/sounds/click.wav',
  star: 'assets/sounds/star.wav',
  silence: 'assets/sounds/silence.wav',
};

// Pre-create audio elements for each sound
const audioPool = {};
for (const [name, src] of Object.entries(SOUND_FILES)) {
  const audio = document.createElement('audio');
  audio.preload = 'auto';
  audio.src = src;
  audioPool[name] = audio;
}

// Unlock all audio elements on first user interaction
// iOS requires .play() to be called directly inside a touch/click handler
let unlocked = false;
function unlockAll() {
  if (unlocked) return;
  unlocked = true;

  for (const audio of Object.values(audioPool)) {
    audio.muted = true;
    const p = audio.play();
    if (p) p.then(() => {
      audio.pause();
      audio.muted = false;
      audio.currentTime = 0;
    }).catch(() => {
      audio.muted = false;
    });
  }
}

document.addEventListener('touchstart', unlockAll, { capture: true });
document.addEventListener('touchend', unlockAll, { capture: true });
document.addEventListener('click', unlockAll, { capture: true });

function play(name) {
  if (state.get().muted) return;
  const audio = audioPool[name];
  if (!audio) return;
  audio.currentTime = 0;
  audio.volume = 0.5;
  audio.play().catch(() => {});
}

export const sounds = {
  correct() { play('correct'); },
  wrong() { play('wrong'); },
  click() { play('click'); },
  star() { play('star'); },
};
