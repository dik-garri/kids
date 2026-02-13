// Совёнок — App Entry Point

import { router } from './router.js';
import { homeScreen } from './screens/home.js';
import { modeScreen } from './screens/mode.js';
import { topicsScreen } from './screens/topics.js';
import { playScreen } from './screens/play.js';
import { storyScreen } from './screens/story.js';
import { state } from './state.js';

state.load();
router.add('/', homeScreen);
router.add('/mode', modeScreen);
router.add('/topics', topicsScreen);
router.add('/play/:topic', playScreen);
router.add('/story', storyScreen);

document.addEventListener('DOMContentLoaded', () => {
  router.init();
});
