import { state } from '../state.js';
import { router } from '../router.js';

export function homeScreen(el) {
  const age = state.get().age;

  el.innerHTML = `
    <div class="screen home">
      <div class="owl">🦉</div>
      <h1 class="title">Совёнок</h1>
      <p class="subtitle">Учимся играя!</p>
      <div class="age-select">
        <button class="btn btn-age ${age === 1 ? 'active' : ''}" data-age="1">
          <span class="btn-icon">👶</span>
          <span>3–4 года</span>
        </button>
        <button class="btn btn-age ${age === 2 ? 'active' : ''}" data-age="2">
          <span class="btn-icon">🧒</span>
          <span>5–6 лет</span>
        </button>
      </div>
      <button class="btn btn-play" id="btn-play" ${age === 0 ? 'disabled' : ''}>
        Играть!
      </button>
      <button class="btn-reset" id="btn-reset">Начать заново</button>
    </div>
  `;

  el.querySelectorAll('.btn-age').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = Number(btn.dataset.age);
      state.setAge(selected);
      el.querySelectorAll('.btn-age').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      el.querySelector('#btn-play').disabled = false;
    });
  });

  el.querySelector('#btn-play').addEventListener('click', () => {
    router.navigate('/mode');
  });

  el.querySelector('#btn-reset').addEventListener('click', () => {
    state.reset();
    homeScreen(el);
  });
}
