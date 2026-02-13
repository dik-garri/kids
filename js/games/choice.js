import { sounds } from '../sounds.js';
import { speech } from '../speech.js';

export function renderChoice(el, task, onAnswer) {
  speech.speak(task.question);

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

      // Disable all buttons
      el.querySelectorAll('.btn-option').forEach(b => b.disabled = true);

      if (correct) {
        btn.classList.add('correct');
        sounds.correct();
      } else {
        btn.classList.add('wrong');
        sounds.wrong();
        // Highlight the correct answer
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
