# Preschool Learning App — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working SPA for teaching preschoolers (3–6 years) — math, literacy, logic, world knowledge, attention/memory.

**Architecture:** Single-page vanilla JS app with hash-based routing. Game tasks defined as JSON configs, rendered by a universal engine. Progress stored in localStorage. No build tools, no dependencies.

**Tech Stack:** HTML5, CSS3 (custom properties, flexbox/grid), vanilla ES modules, localStorage. Emoji/CSS/SVG for graphics (no external image assets needed for MVP).

---

## Phase 1: Foundation

### Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `css/styles.css`
- Create: `js/app.js`

**Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Совёнок — Учимся играя</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

**Step 2: Create base CSS with design tokens**

`css/styles.css` — CSS-переменные, reset, базовые стили для детского UI:
- `--base-size` от `vmin` для масштабирования
- Пастельная палитра: `--color-bg`, `--color-primary`, `--color-success`, `--color-error`
- `--radius: 1.5rem` скруглённые углы
- `.btn` — минимум 60×60px тап-зона
- Анимации: `.bounce`, `.shake`, `.flash-green`
- Mobile-first, `#app` занимает весь экран

**Step 3: Create app.js entry point**

```js
import { router } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  router.init();
});
```

**Step 4: Verify in browser**

Open `index.html` via local server. Should see blank page, no console errors.

Run: `python3 -m http.server 8000` and open `http://localhost:8000`

**Step 5: Commit**

```bash
git add index.html css/styles.css js/app.js
git commit -m "feat: project scaffold with base HTML, CSS tokens, app entry"
```

---

### Task 2: Hash Router

**Files:**
- Create: `js/router.js`

**Step 1: Implement router**

`js/router.js` — минимальный хеш-роутер:

```js
const routes = {};
let appEl = null;

export const router = {
  add(path, handler) {
    routes[path] = handler;
  },

  init() {
    appEl = document.getElementById('app');
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  resolve() {
    const hash = location.hash.slice(1) || '/';
    // Exact match first, then pattern match
    const handler = routes[hash] || this.matchPattern(hash) || routes['/'];
    if (handler) {
      appEl.innerHTML = '';
      handler(appEl, this.getParams(hash));
    }
  },

  matchPattern(hash) {
    for (const [pattern, handler] of Object.entries(routes)) {
      if (!pattern.includes(':')) continue;
      const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$');
      if (regex.test(hash)) return handler;
    }
    return null;
  },

  getParams(hash) {
    for (const pattern of Object.keys(routes)) {
      if (!pattern.includes(':')) continue;
      const keys = [...pattern.matchAll(/:(\w+)/g)].map(m => m[1]);
      const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$');
      const match = hash.match(regex);
      if (match) {
        const params = {};
        keys.forEach((key, i) => params[key] = match[i + 1]);
        return params;
      }
    }
    return {};
  },

  navigate(path) {
    location.hash = path;
  }
};
```

**Step 2: Register test route in app.js and verify**

Temporarily add in `app.js`:
```js
router.add('/', (el) => { el.innerHTML = '<h1>Home</h1>'; });
router.add('/test', (el) => { el.innerHTML = '<h1>Test</h1>'; });
```

Open browser, check `/` shows "Home", navigate to `#/test` shows "Test".

**Step 3: Commit**

```bash
git add js/router.js js/app.js
git commit -m "feat: hash-based router with pattern matching"
```

---

### Task 3: State Management

**Files:**
- Create: `js/state.js`

**Step 1: Implement state module**

`js/state.js` — обёртка над localStorage с дефолтной структурой:

```js
const STORAGE_KEY = 'owl-kids-progress';

const defaultState = {
  age: 0,        // 0 = not selected, 1 = 3-4yo, 2 = 5-6yo
  stars: 0,
  topics: {},
  story: { chapter: 1, point: 0 }
};

export const state = {
  _data: null,

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this._data = saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
    } catch {
      this._data = { ...defaultState };
    }
    return this._data;
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
  },

  get() {
    if (!this._data) this.load();
    return this._data;
  },

  setAge(age) {
    this.get().age = age;
    this.save();
  },

  addStar() {
    this.get().stars += 1;
    this.save();
  },

  getTopicProgress(topicId) {
    const data = this.get();
    if (!data.topics[topicId]) {
      data.topics[topicId] = { completed: [], current: 0, history: [] };
    }
    return data.topics[topicId];
  },

  recordAnswer(topicId, taskIndex, correct) {
    const topic = this.getTopicProgress(topicId);
    topic.history.push(correct ? 1 : 0);
    if (topic.history.length > 10) topic.history.shift();
    if (correct) {
      if (!topic.completed.includes(taskIndex)) topic.completed.push(taskIndex);
      this.addStar();
    }
    this.save();
  },

  getDifficulty(topicId) {
    const topic = this.getTopicProgress(topicId);
    const last5 = topic.history.slice(-5);
    if (last5.length < 5) return this.get().age || 1;
    const correct = last5.reduce((a, b) => a + b, 0);
    if (correct >= 4) return 2;
    if (correct <= 1) return 1;
    return this.get().age || 1;
  },

  reset() {
    this._data = { ...defaultState };
    this.save();
  }
};
```

**Step 2: Verify in browser console**

Open console, test:
```js
import('/js/state.js').then(m => { m.state.load(); console.log(m.state.get()); });
```

**Step 3: Commit**

```bash
git add js/state.js
git commit -m "feat: state management with localStorage persistence"
```

---

## Phase 2: Screens

### Task 4: Home Screen

**Files:**
- Create: `js/screens/home.js`
- Modify: `js/app.js`
- Modify: `css/styles.css`

**Step 1: Create home screen**

`js/screens/home.js` — главный экран с совёнком (emoji), кнопкой "Играть", выбором возраста:

```js
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
}
```

**Step 2: Add styles for home screen**

Add to `css/styles.css`:
- `.screen` — flex column, center, full height
- `.owl` — large emoji, bounce animation on load
- `.title` — large font, playful color
- `.age-select` — flex row, gap
- `.btn-age` — card-style button with icon, `.active` state highlighted
- `.btn-play` — large green button, disabled state grayed out

**Step 3: Register route in app.js**

```js
import { router } from './router.js';
import { homeScreen } from './screens/home.js';
import { state } from './state.js';

state.load();
router.add('/', homeScreen);
router.init();
```

**Step 4: Verify — open browser, see owl, age buttons, play button**

**Step 5: Commit**

```bash
git add js/screens/home.js js/app.js css/styles.css
git commit -m "feat: home screen with age selection and owl character"
```

---

### Task 5: Mode Selection Screen

**Files:**
- Create: `js/screens/mode.js`
- Modify: `js/app.js`

**Step 1: Create mode selection screen**

`js/screens/mode.js` — две карточки: "Приключение" и "Выбери сам":

```js
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
```

**Step 2: Add styles — `.mode-cards` grid, `.card` large clickable cards with hover/active states**

**Step 3: Register route: `router.add('/mode', modeScreen);`**

**Step 4: Verify — home → play → mode selection with 2 cards, back button works**

**Step 5: Commit**

```bash
git add js/screens/mode.js js/app.js css/styles.css
git commit -m "feat: mode selection screen (adventure / free play)"
```

---

### Task 6: Topic Selection Screen (Free Mode)

**Files:**
- Create: `js/screens/topics.js`
- Create: `data/games.json`
- Modify: `js/app.js`

**Step 1: Create games catalog**

`data/games.json`:
```json
{
  "topics": [
    { "id": "math", "title": "Цифры и счёт", "icon": "🔢", "color": "#FFB74D" },
    { "id": "literacy", "title": "Буквы и слова", "icon": "📖", "color": "#81C784" },
    { "id": "logic", "title": "Логика", "icon": "🧩", "color": "#64B5F6" },
    { "id": "world", "title": "Мир вокруг", "icon": "🌍", "color": "#BA68C8" },
    { "id": "attention", "title": "Внимание", "icon": "👀", "color": "#FF8A65" }
  ]
}
```

**Step 2: Create topics screen**

`js/screens/topics.js` — сетка тем с иконками, цветами, звёздочками прогресса:

```js
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
      <button class="btn btn-back" id="btn-back">←</button>
      <h1 class="title">Выбери тему</h1>
      <div class="topics-grid">
        ${data.topics.map(t => {
          const progress = state.getTopicProgress(t.id);
          const stars = progress.completed.length;
          return `
            <button class="btn card topic-card" data-topic="${t.id}" style="--card-color: ${t.color}">
              <span class="card-icon">${t.icon}</span>
              <span class="card-title">${t.title}</span>
              <span class="card-stars">${'⭐'.repeat(Math.min(stars, 5))}</span>
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
```

**Step 3: Add styles — `.topics-grid` responsive grid (2 columns mobile, 3 desktop), `.topic-card` with `--card-color` background tint**

**Step 4: Register route: `router.add('/topics', topicsScreen);`**

**Step 5: Verify — navigate to topics, see 5 colored cards with emoji icons**

**Step 6: Commit**

```bash
git add js/screens/topics.js data/games.json js/app.js css/styles.css
git commit -m "feat: topic selection grid with progress indicators"
```

---

## Phase 3: Game Engine

### Task 7: Game Engine Core + Choice Type

**Files:**
- Create: `js/engine.js`
- Create: `js/screens/play.js`
- Create: `js/games/choice.js`
- Modify: `js/app.js`

**Step 1: Create game engine**

`js/engine.js` — загружает JSON с заданиями, фильтрует по сложности, выбирает текущее, делегирует рендеринг типу:

```js
import { state } from './state.js';
import { renderChoice } from './games/choice.js';

const renderers = {
  choice: renderChoice,
};

let levelCache = {};

export const engine = {
  async loadLevel(topicId) {
    if (!levelCache[topicId]) {
      const resp = await fetch(`data/levels/${topicId}.json`);
      levelCache[topicId] = await resp.json();
    }
    return levelCache[topicId];
  },

  async getTask(topicId) {
    const level = await this.loadLevel(topicId);
    const difficulty = state.getDifficulty(topicId);
    const progress = state.getTopicProgress(topicId);
    const available = level.tasks.filter(t =>
      t.difficulty <= difficulty && !progress.completed.includes(t.id)
    );
    if (available.length === 0) return null; // all completed
    return available[0];
  },

  render(el, task, topicId, onComplete) {
    const renderer = renderers[task.type];
    if (!renderer) {
      el.innerHTML = '<p>Неизвестный тип задания</p>';
      return;
    }
    renderer(el, task, (correct) => {
      state.recordAnswer(topicId, task.id, correct);
      onComplete(correct);
    });
  }
};
```

**Step 2: Create choice game renderer**

`js/games/choice.js`:

```js
export function renderChoice(el, task, onAnswer) {
  el.innerHTML = `
    <div class="game choice">
      <div class="game-question">${task.question}</div>
      ${task.image ? `<div class="game-image">${task.image}</div>` : ''}
      <div class="game-options">
        ${task.options.map((opt, i) => `
          <button class="btn btn-option" data-index="${i}">${opt}</button>
        `).join('')}
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = task.options[Number(btn.dataset.index)];
      const correct = selected === task.answer;

      el.querySelectorAll('.btn-option').forEach(b => b.disabled = true);

      if (correct) {
        btn.classList.add('correct');
      } else {
        btn.classList.add('wrong');
        // Highlight correct answer
        el.querySelectorAll('.btn-option').forEach(b => {
          if (task.options[Number(b.dataset.index)] === task.answer) {
            b.classList.add('correct');
          }
        });
      }

      setTimeout(() => onAnswer(correct), 1000);
    });
  });
}
```

**Step 3: Create play screen**

`js/screens/play.js`:

```js
import { router } from '../router.js';
import { state } from '../state.js';
import { engine } from '../engine.js';

export async function playScreen(el, params) {
  const topicId = params.topic;

  async function loadNext() {
    const task = await engine.getTask(topicId);
    if (!task) {
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
      // Show feedback then load next
      const feedback = document.createElement('div');
      feedback.className = correct ? 'feedback correct' : 'feedback wrong';
      feedback.innerHTML = correct
        ? '<div class="owl">🦉</div><p>Правильно!</p>'
        : '<div class="owl">🦉</div><p>Попробуй ещё!</p>';
      gameArea.appendChild(feedback);

      setTimeout(() => loadNext(), 1500);
    });
  }

  await loadNext();
}
```

**Step 4: Add styles**

- `.game` — flex column, center
- `.game-question` — large text
- `.game-options` — grid 2 columns
- `.btn-option` — large, 60px min-height, rounded
- `.btn-option.correct` — green bg, flash-green animation
- `.btn-option.wrong` — red bg, shake animation
- `.feedback` — overlay with result message

**Step 5: Register route: `router.add('/play/:topic', playScreen);`**

**Step 6: Verify — need Task 8 content to test fully**

**Step 7: Commit**

```bash
git add js/engine.js js/games/choice.js js/screens/play.js js/app.js css/styles.css
git commit -m "feat: game engine core with choice type renderer"
```

---

### Task 8: Math Content (Choice Tasks)

**Files:**
- Create: `data/levels/math.json`

**Step 1: Create math tasks**

`data/levels/math.json` — 10 заданий типа `choice`, difficulty 1 и 2:

```json
{
  "tasks": [
    {
      "id": "m1", "type": "choice", "difficulty": 1,
      "question": "Сколько яблок? 🍎🍎🍎",
      "options": ["2", "3", "4"],
      "answer": "3"
    },
    {
      "id": "m2", "type": "choice", "difficulty": 1,
      "question": "Сколько звёзд? ⭐⭐",
      "options": ["1", "2", "3"],
      "answer": "2"
    },
    {
      "id": "m3", "type": "choice", "difficulty": 1,
      "question": "Где больше? 🔵🔵🔵 или 🔴🔴",
      "options": ["🔵🔵🔵", "🔴🔴"],
      "answer": "🔵🔵🔵"
    },
    {
      "id": "m4", "type": "choice", "difficulty": 1,
      "question": "Какая цифра идёт после 2?",
      "options": ["1", "3", "4"],
      "answer": "3"
    },
    {
      "id": "m5", "type": "choice", "difficulty": 1,
      "question": "Сколько пальцев на одной руке?",
      "options": ["4", "5", "6"],
      "answer": "5"
    },
    {
      "id": "m6", "type": "choice", "difficulty": 2,
      "question": "Сколько? 🐱🐱🐱🐱🐱🐱",
      "options": ["5", "6", "7", "8"],
      "answer": "6"
    },
    {
      "id": "m7", "type": "choice", "difficulty": 2,
      "question": "2 + 3 = ?",
      "options": ["4", "5", "6", "7"],
      "answer": "5"
    },
    {
      "id": "m8", "type": "choice", "difficulty": 2,
      "question": "10 - 3 = ?",
      "options": ["5", "6", "7", "8"],
      "answer": "7"
    },
    {
      "id": "m9", "type": "choice", "difficulty": 2,
      "question": "Какое число стоит между 7 и 9?",
      "options": ["6", "7", "8", "10"],
      "answer": "8"
    },
    {
      "id": "m10", "type": "choice", "difficulty": 2,
      "question": "5 + 5 = ?",
      "options": ["8", "9", "10", "11"],
      "answer": "10"
    }
  ]
}
```

**Step 2: Verify full flow — Home → Play → Topics → Math → answer questions**

**Step 3: Commit**

```bash
git add data/levels/math.json
git commit -m "feat: math topic content with 10 choice tasks"
```

---

### Task 9: Feedback System (Animations + Sounds)

**Files:**
- Modify: `css/styles.css`
- Create: `js/sounds.js`

**Step 1: Create sound module**

`js/sounds.js` — генерирует звуки через Web Audio API (без файлов):

```js
const ctx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(frequency, duration, type = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const sounds = {
  correct() {
    playTone(523, 0.15);       // C5
    setTimeout(() => playTone(659, 0.15), 100);  // E5
    setTimeout(() => playTone(784, 0.3), 200);   // G5
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
```

**Step 2: Add CSS animations**

Add to `css/styles.css`:
- `@keyframes bounce` — масштаб 1→1.2→1
- `@keyframes shake` — сдвиг влево-вправо
- `@keyframes flash-green` — зелёная вспышка фона
- `@keyframes pop-in` — появление с масштабом 0→1.1→1
- `.feedback` — fade in overlay

**Step 3: Integrate sounds into choice.js**

Import `sounds` in `js/games/choice.js`, call `sounds.correct()` / `sounds.wrong()` on answer.

**Step 4: Verify — answer questions, hear sounds, see animations**

**Step 5: Commit**

```bash
git add js/sounds.js js/games/choice.js css/styles.css
git commit -m "feat: audio feedback via Web Audio API and CSS animations"
```

---

## Phase 4: More Game Types

### Task 10: Sequence Game Type

**Files:**
- Create: `js/games/sequence.js`
- Modify: `js/engine.js`

**Step 1: Implement sequence renderer**

`js/games/sequence.js` — ребёнок тапает элементы по порядку (1-й, 2-й, 3-й...):

```js
export function renderSequence(el, task, onAnswer) {
  // task.items = ["Б", "А", "В"] — правильный порядок
  // Показываем в случайном порядке, ребёнок выбирает по одному
  const shuffled = [...task.items].sort(() => Math.random() - 0.5);
  const selected = [];

  function render() {
    el.innerHTML = `
      <div class="game sequence">
        <div class="game-question">${task.question}</div>
        <div class="sequence-selected">
          ${selected.map(s => `<span class="seq-item done">${s}</span>`).join('')}
          ${Array(task.items.length - selected.length).fill('<span class="seq-item empty">?</span>').join('')}
        </div>
        <div class="game-options">
          ${shuffled.map((item, i) => `
            <button class="btn btn-option" data-index="${i}"
              ${selected.includes(item) ? 'disabled' : ''}>${item}</button>
          `).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('.btn-option:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = shuffled[Number(btn.dataset.index)];
        selected.push(item);

        if (selected.length === task.items.length) {
          const correct = selected.every((s, i) => s === task.items[i]);
          setTimeout(() => onAnswer(correct), 500);
        } else {
          render();
        }
      });
    });
  }

  render();
}
```

**Step 2: Register in engine.js**

```js
import { renderSequence } from './games/sequence.js';
// Add to renderers: sequence: renderSequence
```

**Step 3: Add a few sequence tasks to math.json for testing**

```json
{
  "id": "m11", "type": "sequence", "difficulty": 1,
  "question": "Расставь цифры по порядку",
  "items": ["1", "2", "3"]
}
```

**Step 4: Add styles — `.sequence-selected` flex row, `.seq-item` boxes**

**Step 5: Verify — play sequence task, select items in order**

**Step 6: Commit**

```bash
git add js/games/sequence.js js/engine.js data/levels/math.json css/styles.css
git commit -m "feat: sequence game type (order items by tapping)"
```

---

### Task 11: Drag-and-Drop Game Type

**Files:**
- Create: `js/games/dragdrop.js`
- Modify: `js/engine.js`

**Step 1: Implement drag-drop renderer**

`js/games/dragdrop.js` — поддержка touch и mouse. Элементы перетаскиваются в слоты. Fallback: тап для выбора, тап на слот для размещения.

Конфиг задания:
```json
{
  "type": "drag-drop",
  "question": "Собери слово",
  "items": ["К", "О", "Т"],
  "slots": 3,
  "answer": ["К", "О", "Т"]
}
```

Рендерер:
- Показывает `items` в случайном порядке как перетаскиваемые элементы
- Показывает пустые слоты
- Touch: `touchstart/touchmove/touchend` перетаскивание
- Tap fallback: первый тап выбирает элемент (подсвечивает), второй тап на слот — ставит
- Когда все слоты заполнены — проверяет `answer`

**Step 2: Register in engine.js**

**Step 3: Add literacy.json with drag-drop tasks**

`data/levels/literacy.json`:
```json
{
  "tasks": [
    {
      "id": "l1", "type": "choice", "difficulty": 1,
      "question": "Где буква А?",
      "options": ["А", "Б", "В"],
      "answer": "А"
    },
    {
      "id": "l2", "type": "drag-drop", "difficulty": 1,
      "question": "Собери слово КОТ",
      "items": ["К", "О", "Т"],
      "slots": 3,
      "answer": ["К", "О", "Т"]
    }
  ]
}
```

**Step 4: Add styles — `.drag-item`, `.drop-slot`, `.dragging` states, touch-action: none**

**Step 5: Verify on touch device / Chrome DevTools mobile emulation**

**Step 6: Commit**

```bash
git add js/games/dragdrop.js js/engine.js data/levels/literacy.json css/styles.css
git commit -m "feat: drag-and-drop game type with touch support"
```

---

### Task 12: Match Game Type

**Files:**
- Create: `js/games/match.js`
- Modify: `js/engine.js`

**Step 1: Implement match renderer**

`js/games/match.js` — соедини пары. Два столбца: левый и правый. Тап на элемент слева, потом на элемент справа — рисуем линию (SVG или CSS).

Конфиг:
```json
{
  "type": "match",
  "question": "Соедини цифру с количеством",
  "pairs": [
    { "left": "1", "right": "🍎" },
    { "left": "2", "right": "🍎🍎" },
    { "left": "3", "right": "🍎🍎🍎" }
  ]
}
```

- Правый столбец отображается в случайном порядке
- Тап на левый → подсветка → тап на правый → линия (SVG overlay)
- Когда все пары соединены → проверка

**Step 2: Register in engine.js**

**Step 3: Add match tasks to math.json**

**Step 4: Add styles — `.match-columns`, `.match-item`, SVG line overlay**

**Step 5: Verify**

**Step 6: Commit**

```bash
git add js/games/match.js js/engine.js data/levels/math.json css/styles.css
git commit -m "feat: match game type (connect pairs)"
```

---

## Phase 5: Content

### Task 13: All Topic Content

**Files:**
- Modify: `data/levels/math.json` — add more tasks
- Modify: `data/levels/literacy.json` — add more tasks
- Create: `data/levels/logic.json`
- Create: `data/levels/world.json`
- Create: `data/levels/attention.json`

**Step 1: Expand math.json to 10 tasks (choice + sequence + match)**

**Step 2: Expand literacy.json to 10 tasks (choice + drag-drop + match)**

**Step 3: Create logic.json — 8 tasks**
- Продолжи ряд (choice): "🔴🔵🔴🔵🔴?" → "🔵"
- Что лишнее (choice): "🍎🍐🚗🍌" → "🚗"
- Последовательность (sequence): утро→день→вечер→ночь

**Step 4: Create world.json — 8 tasks**
- Времена года (choice): "Когда идёт снег?" → "Зимой"
- Животные (match): животное ↔ детёныш
- Профессии (choice): "Кто тушит пожар?" → "Пожарный"

**Step 5: Create attention.json — 6 tasks**
- Запомни порядок (sequence): показать 3 предмета, воспроизвести
- Что изменилось (choice): показать набор, убрать один

**Step 6: Verify — play each topic through, all tasks render**

**Step 7: Commit**

```bash
git add data/levels/
git commit -m "feat: content for all 5 topics (~50 tasks total)"
```

---

## Phase 6: Story Mode

### Task 14: Story Mode Screen + Logic

**Files:**
- Create: `js/screens/story.js`
- Create: `data/story.json`
- Modify: `js/app.js`

**Step 1: Create story config**

`data/story.json` — карта приключения, 3 главы по 5 точек:

```json
{
  "chapters": [
    {
      "id": 1,
      "title": "Лесная полянка",
      "icon": "🌲",
      "points": [
        { "dialogue": "Привет! Я Совёнок. Давай вместе учиться!", "task": null },
        { "dialogue": "Помоги мне посчитать грибочки!", "task": "math:m1" },
        { "dialogue": "А теперь найдём буквы!", "task": "literacy:l1" },
        { "dialogue": "Какой ты молодец!", "task": "logic:lg1" },
        { "dialogue": "Глава пройдена! 🎉", "task": null }
      ]
    },
    {
      "id": 2,
      "title": "Горная тропинка",
      "icon": "⛰️",
      "points": [
        { "dialogue": "Мы поднимаемся в горы!", "task": null },
        { "dialogue": "Тут нужно посчитать камушки", "task": "math:m6" },
        { "dialogue": "Собери слово!", "task": "literacy:l2" },
        { "dialogue": "Что идёт потом?", "task": "logic:lg2" },
        { "dialogue": "Вершина! 🏔️", "task": null }
      ]
    },
    {
      "id": 3,
      "title": "Звёздное небо",
      "icon": "🌟",
      "points": [
        { "dialogue": "Посмотри на звёзды!", "task": null },
        { "dialogue": "Сколько звёзд на небе?", "task": "math:m7" },
        { "dialogue": "А это что за созвездие-слово?", "task": "literacy:l3" },
        { "dialogue": "Последняя загадка!", "task": "world:w1" },
        { "dialogue": "Ты прошёл всё приключение! 🎊", "task": null }
      ]
    }
  ]
}
```

**Step 2: Create story screen**

`js/screens/story.js`:
- Показывает карту-путь (вертикальный список точек с линией)
- Пройденные точки — зелёные, текущая — пульсирует, будущие — серые
- Тап на текущую точку → диалог совёнка → если есть task, загружает задание
- После выполнения → переход к следующей точке

**Step 3: Register route: `router.add('/story', storyScreen);`**

**Step 4: Add styles — `.story-map`, `.story-point`, `.story-line`, `.dialogue-bubble`**

**Step 5: Verify — play through chapter 1**

**Step 6: Commit**

```bash
git add js/screens/story.js data/story.json js/app.js css/styles.css
git commit -m "feat: story mode with adventure map and owl dialogues"
```

---

## Phase 7: Polish

### Task 15: Final Polish + Deploy

**Files:**
- Modify: `css/styles.css` — финальная полировка
- Modify: `index.html` — meta tags, favicon

**Step 1: Add meta tags and PWA basics to index.html**

```html
<meta name="description" content="Обучающее приложение для дошколят 3-6 лет">
<meta name="theme-color" content="#FFF8E1">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🦉</text></svg>">
```

**Step 2: CSS polish**

- Проверить все экраны в мобильном режиме (Chrome DevTools)
- Убедиться что тап-зоны >= 60px
- Проверить landscape/portrait
- Smooth transitions между экранами (fade)

**Step 3: Test full flow**

1. Home → выбор возраста → Play
2. Free mode → каждая тема → пройти 2-3 задания
3. Story mode → пройти главу 1
4. Проверить прогресс (звёзды сохраняются)
5. Перезагрузка — прогресс на месте

**Step 4: Commit and push**

```bash
git add -A
git commit -m "feat: final polish, meta tags, responsive fixes"
git push
```

**Step 5: Enable GitHub Pages**

Settings → Pages → Source: main branch → root folder.

---

## Summary

| Phase | Tasks | What we get |
|-------|-------|-------------|
| 1. Foundation | 1–3 | Scaffold, router, state |
| 2. Screens | 4–6 | Home, mode select, topics |
| 3. Engine | 7–9 | Choice type, math content, sounds |
| 4. Game Types | 10–12 | Sequence, drag-drop, match |
| 5. Content | 13 | All 5 topics, ~50 tasks |
| 6. Story | 14 | Adventure mode with map |
| 7. Polish | 15 | Deploy to GitHub Pages |

**Total: 15 tasks.** After each task the app works — you can test incrementally.
