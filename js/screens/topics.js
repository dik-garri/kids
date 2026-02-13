import { router } from '../router.js';
import { state } from '../state.js';

let gamesData = null;

async function loadGames() {
  if (!gamesData) {
    const resp = await fetch('data/games.json');
    gamesData = await resp.json();
  }
  return gamesData;
}

export async function topicsScreen(el) {
  const data = await loadGames();

  el.innerHTML = `
    <div class="screen topics">
      <button class="btn btn-back" id="btn-back">\u2190</button>
      <h1 class="title">Выбери тему</h1>
      <div class="topics-grid">
        ${data.topics.map(t => {
          const progress = state.getTopicProgress(t.id);
          const stars = progress.completed.length;
          return `
            <button class="btn card topic-card" data-topic="${t.id}" style="--card-color: ${t.color}">
              <span class="card-icon">${t.icon}</span>
              <span class="card-title">${t.title}</span>
              <span class="card-stars">${'\u2B50'.repeat(Math.min(stars, 5))}</span>
            </button>`;
        }).join('')}
      </div>
    </div>
  `;

  el.querySelector('#btn-back').addEventListener('click', () => router.navigate('/mode'));
  el.querySelectorAll('.topic-card').forEach(btn => {
    btn.addEventListener('click', () => {
      router.navigate('/play/' + btn.dataset.topic);
    });
  });
}
