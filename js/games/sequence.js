export function renderSequence(el, task, onAnswer) {
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
