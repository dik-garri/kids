export function renderMatch(el, task, onAnswer) {
  const rightShuffled = [...task.pairs].sort(() => Math.random() - 0.5).map(p => p.right);
  const matched = new Set(); // indices of matched left items
  let selectedLeft = null;

  function render() {
    el.innerHTML = `
      <div class="game match">
        <div class="game-question">${task.question}</div>
        <div class="match-columns">
          <div class="match-col match-left">
            ${task.pairs.map((p, i) => `
              <button class="btn match-item match-item-left ${matched.has(i) ? 'matched' : ''} ${selectedLeft === i ? 'selected' : ''}"
                data-index="${i}" ${matched.has(i) ? 'disabled' : ''}>${p.left}</button>
            `).join('')}
          </div>
          <div class="match-col match-right">
            ${rightShuffled.map((item, i) => {
              const isMatched = [...matched].some(mi => task.pairs[mi].right === item);
              return `<button class="btn match-item match-item-right ${isMatched ? 'matched' : ''}"
                data-index="${i}" ${isMatched ? 'disabled' : ''}>${item}</button>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Left column click
    el.querySelectorAll('.match-item-left:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedLeft = Number(btn.dataset.index);
        render();
      });
    });

    // Right column click
    el.querySelectorAll('.match-item-right:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        if (selectedLeft === null) return;
        const rightItem = rightShuffled[Number(btn.dataset.index)];
        const leftPair = task.pairs[selectedLeft];

        if (leftPair.right === rightItem) {
          // Correct match
          matched.add(selectedLeft);
          selectedLeft = null;
          render();

          if (matched.size === task.pairs.length) {
            setTimeout(() => onAnswer(true), 500);
          }
        } else {
          // Wrong match — flash and reset
          btn.classList.add('wrong');
          el.querySelector(`.match-item-left[data-index="${selectedLeft}"]`)
            ?.classList.add('wrong');
          setTimeout(() => {
            selectedLeft = null;
            render();
          }, 600);
        }
      });
    });
  }

  render();
}
