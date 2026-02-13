import { router } from '../router.js';
import { state } from '../state.js';
import { engine } from '../engine.js';
import { speech } from '../speech.js';

let storyData = null;

async function loadStory() {
  if (!storyData) {
    const resp = await fetch('data/story.json');
    storyData = await resp.json();
  }
  return storyData;
}

export async function storyScreen(el) {
  const data = await loadStory();
  const progress = state.get().story;
  const chapter = data.chapters.find(c => c.id === progress.chapter);

  if (!chapter) {
    // All chapters complete
    el.innerHTML = `
      <div class="screen complete">
        <div class="owl">🦉</div>
        <h1>Приключение пройдено!</h1>
        <p>Ты прошёл все главы! Ты настоящий герой!</p>
        <p class="stars-count">⭐ ${state.get().stars}</p>
        <button class="btn btn-play" id="btn-home">На главную</button>
      </div>
    `;
    el.querySelector('#btn-home').addEventListener('click', () => router.navigate('/'));
    return;
  }

  renderMap(el, data, chapter, progress);
}

function renderMap(el, data, chapter, progress) {
  el.innerHTML = `
    <div class="screen story">
      <div class="story-header">
        <button class="btn btn-back btn-small" id="btn-back">←</button>
        <span class="stars-count">⭐ ${state.get().stars}</span>
      </div>
      <h1 class="title">${chapter.icon} ${chapter.title}</h1>
      <div class="story-map">
        ${chapter.points.map((point, i) => {
          let pointClass = 'locked';
          if (i < progress.point) pointClass = 'done';
          else if (i === progress.point) pointClass = 'current';
          return `
            <div class="story-point ${pointClass}" data-index="${i}">
              <div class="story-dot">${i < progress.point ? '✅' : i === progress.point ? chapter.icon : '🔒'}</div>
              ${i < chapter.points.length - 1 ? '<div class="story-line"></div>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  el.querySelector('#btn-back').addEventListener('click', () => router.navigate('/mode'));

  const currentPoint = el.querySelector('.story-point.current');
  if (currentPoint) {
    currentPoint.addEventListener('click', () => {
      const point = chapter.points[progress.point];
      showDialogue(el, data, chapter, progress, point);
    });
  }
}

function showDialogue(el, data, chapter, progress, point) {
  el.innerHTML = `
    <div class="screen story-dialogue">
      <div class="owl owl-big">🦉</div>
      <div class="dialogue-bubble">
        <p>${point.dialogue}</p>
      </div>
      <button class="btn btn-play" id="btn-continue">
        ${point.task ? 'Начать задание!' : 'Дальше!'}
      </button>
    </div>
  `;

  speech.speak(point.dialogue);

  el.querySelector('#btn-continue').addEventListener('click', () => {
    if (point.task) {
      showTask(el, data, chapter, progress, point);
    } else {
      advancePoint(el, data, chapter, progress);
    }
  });
}

async function showTask(el, data, chapter, progress, point) {
  // Load the specific task from the topic
  const level = await engine.loadLevel(point.task.topic);
  const task = level.tasks.find(t => t.id === point.task.taskId);

  if (!task) {
    advancePoint(el, data, chapter, progress);
    return;
  }

  el.innerHTML = `
    <div class="screen play">
      <div class="play-header">
        <span class="story-badge">${chapter.icon} ${chapter.title}</span>
        <span class="stars-count">⭐ ${state.get().stars}</span>
      </div>
      <div id="game-area"></div>
    </div>
  `;

  const gameArea = el.querySelector('#game-area');
  engine.render(gameArea, task, point.task.topic, (correct) => {
    const feedback = document.createElement('div');
    feedback.className = correct ? 'feedback correct' : 'feedback wrong';
    feedback.innerHTML = correct
      ? '<div class="owl">🦉</div><p>Правильно!</p>'
      : '<div class="owl">🦉</div><p>Попробуй ещё!</p>';
    gameArea.appendChild(feedback);
    speech.speak(correct ? 'Правильно! Молодец!' : 'Попробуй ещё!');

    setTimeout(() => {
      if (correct) {
        advancePoint(el, data, chapter, progress);
      } else {
        // Retry — show dialogue again
        showDialogue(el, data, chapter, progress, { ...point, dialogue: "Давай попробуем ещё раз!" });
      }
    }, 1500);
  });
}

function advancePoint(el, data, chapter, progress) {
  progress.point += 1;

  if (progress.point >= chapter.points.length) {
    // Chapter complete — move to next
    progress.chapter += 1;
    progress.point = 0;
    state.save();

    // Check if there are more chapters
    const nextChapter = data.chapters.find(c => c.id === progress.chapter);
    if (nextChapter) {
      renderMap(el, data, nextChapter, progress);
    } else {
      storyScreen(el); // Will show completion screen
    }
  } else {
    state.save();
    renderMap(el, data, chapter, progress);
  }
}
