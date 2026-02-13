import { state } from './state.js';
import { renderChoice } from './games/choice.js';
import { renderSequence } from './games/sequence.js';
import { renderMatch } from './games/match.js';
import { renderDragDrop } from './games/dragdrop.js';

const renderers = {
  choice: renderChoice,
  sequence: renderSequence,
  match: renderMatch,
  'drag-drop': renderDragDrop,
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
    // Filter tasks: difficulty <= current difficulty, not yet completed
    const available = level.tasks.filter(t =>
      t.difficulty <= difficulty && !progress.completed.includes(t.id)
    );
    if (available.length === 0) return null; // all done
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
  },

  registerType(type, renderer) {
    renderers[type] = renderer;
  }
};
