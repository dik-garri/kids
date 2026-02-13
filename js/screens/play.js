import { router } from '../router.js';
import { state } from '../state.js';
import { engine } from '../engine.js';
import { speech } from '../speech.js';

export async function playScreen(el, params) {
  const topicId = params.topic;

  async function loadNext() {
    const task = await engine.getTask(topicId);
    if (!task) {
      // All tasks completed
      el.innerHTML = `
        <div class="screen complete">
          <div class="owl">🦉</div>
          <h1>Молодец!</h1>
          <p>Все задания пройдены!</p>
          <p class="stars-count">⭐ ${state.get().stars}</p>
          <button class="btn btn-play" id="btn-back-topics">К темам</button>
        </div>
      `;
      el.querySelector('#btn-back-topics').addEventListener('click', () => router.navigate('/topics'));
      return;
    }

    el.innerHTML = `
      <div class="screen play">
        <div class="play-header">
          <button class="btn btn-back btn-small" id="btn-home">🏠</button>
          <span class="stars-count">⭐ ${state.get().stars}</span>
        </div>
        <div id="game-area"></div>
      </div>
    `;

    el.querySelector('#btn-home').addEventListener('click', () => router.navigate('/topics'));

    const gameArea = el.querySelector('#game-area');
    engine.render(gameArea, task, topicId, (correct) => {
      // Show brief feedback overlay then load next task
      const feedback = document.createElement('div');
      feedback.className = correct ? 'feedback correct' : 'feedback wrong';
      feedback.innerHTML = correct
        ? '<div class="owl">🦉</div><p>Правильно!</p>'
        : '<div class="owl">🦉</div><p>Попробуй ещё!</p>';
      gameArea.appendChild(feedback);
      speech.speak(correct ? 'Правильно! Молодец!' : 'Попробуй ещё!');

      setTimeout(() => loadNext(), 1500);
    });
  }

  await loadNext();
}
