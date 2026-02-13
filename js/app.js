// Совёнок — App Entry Point

import { router } from './router.js';
import { homeScreen } from './screens/home.js';
import { state } from './state.js';

state.load();
router.add('/', homeScreen);

document.addEventListener('DOMContentLoaded', () => {
  router.init();
});
