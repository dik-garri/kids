import { router } from '../router.js';

export function modeScreen(el) {
  el.innerHTML = `
    <div class="screen mode">
      <button class="btn btn-back" id="btn-back">←</button>
      <h1 class="title">Как будем играть?</h1>
      <div class="mode-cards">
        <button class="btn card card-story" data-mode="story">
          <span class="card-icon">🗺️</span>
          <span class="card-title">Приключение</span>
          <span class="card-desc">Отправимся в путешествие с Совёнком!</span>
        </button>
        <button class="btn card card-free" data-mode="free">
          <span class="card-icon">🎯</span>
          <span class="card-title">Выбери сам</span>
          <span class="card-desc">Выбирай любые задания</span>
        </button>
      </div>
    </div>
  `;

  el.querySelector('#btn-back').addEventListener('click', () => router.navigate('/'));
  el.querySelector('[data-mode="story"]').addEventListener('click', () => router.navigate('/story'));
  el.querySelector('[data-mode="free"]').addEventListener('click', () => router.navigate('/topics'));
}
