// Совёнок — App Entry Point

import { router } from './router.js';
import { homeScreen } from './screens/home.js';
import { modeScreen } from './screens/mode.js';
import { topicsScreen } from './screens/topics.js';
import { state } from './state.js';

state.load();
router.add('/', homeScreen);
router.add('/mode', modeScreen);
router.add('/topics', topicsScreen);

document.addEventListener('DOMContentLoaded', () => {
  router.init();
});
