// Совёнок — App Entry Point

import { router } from './router.js';

router.add('/', (el) => {
  el.innerHTML = '<div class="screen"><div style="font-size:5rem">🦉</div><h1 class="title">Совёнок</h1><p class="subtitle">Загрузка...</p></div>';
});

document.addEventListener('DOMContentLoaded', () => {
  router.init();
});
