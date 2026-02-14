import { sounds } from '../sounds.js';
import { speech } from '../speech.js';

export function renderSequence(el, task, onAnswer) {
  speech.speakTask(task.id, task.question);

  const shuffled = [...task.items].sort(() => Math.random() - 0.5);
  const selected = [];

  function render() {
    el.innerHTML = `
      <div class="game sequence">
        <div class="game-question">${task.question}</div>
        ${task.image ? `<div class="game-image">${task.image}</div>` : ''}
        <div class="sequence-selected">
          ${selected.map(s => `<span class="seq-item done">${s}</span>`).join('')}
          ${Array(task.items.length - selected.length).fill('<span class="seq-item empty">?</span>').join('')}
        </div>
        <div class="game-options">
          ${shuffled.map((item, i) => {
            const isUsed = selected.includes(item) && countUsed(item) >= countInShuffledUpTo(item, i);
            return `<button class="btn btn-option drag-source ${isUsed ? 'used' : ''}"
              data-index="${i}" ${isUsed ? 'disabled' : ''}>${item}</button>`;
          }).join('')}
        </div>
      </div>
    `;

    bindEvents();
  }

  function countUsed(item) {
    return selected.filter(s => s === item).length;
  }

  function countInShuffledUpTo(item, index) {
    let c = 0;
    for (let i = 0; i <= index; i++) {
      if (shuffled[i] === item) c++;
    }
    return c;
  }

  function placeItem(item) {
    selected.push(item);
    sounds.click();

    if (selected.length === task.items.length) {
      const correct = selected.every((s, i) => s === task.items[i]);
      if (correct) {
        sounds.correct();
      } else {
        sounds.wrong();
      }
      setTimeout(() => onAnswer(correct), 500);
    } else {
      render();
    }
  }

  function bindEvents() {
    el.querySelectorAll('.drag-source:not([disabled])').forEach(btn => {
      // Tap fallback
      btn.addEventListener('click', () => {
        placeItem(shuffled[Number(btn.dataset.index)]);
      });

      // Touch drag
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrag(btn, e.touches[0].clientX, e.touches[0].clientY, 'touch');
      }, { passive: false });

      // Mouse drag
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrag(btn, e.clientX, e.clientY, 'mouse');
      });
    });
  }

  function startDrag(btn, startX, startY, mode) {
    const index = Number(btn.dataset.index);
    const clone = btn.cloneNode(true);
    clone.classList.add('drag-clone');
    clone.style.cssText = `
      position: fixed; z-index: 1000; pointer-events: none;
      width: ${btn.offsetWidth}px; height: ${btn.offsetHeight}px;
      left: ${startX - btn.offsetWidth / 2}px;
      top: ${startY - btn.offsetHeight / 2}px;
      opacity: 0.9; transform: scale(1.15); transition: none;
    `;
    document.body.appendChild(clone);
    btn.classList.add('dragging');

    let moved = false;
    let lastHighlight = null;

    function moveClone(cx, cy) {
      moved = true;
      clone.style.left = (cx - btn.offsetWidth / 2) + 'px';
      clone.style.top = (cy - btn.offsetHeight / 2) + 'px';

      // Highlight empty slot under cursor
      const target = document.elementFromPoint(cx, cy);
      if (lastHighlight && lastHighlight !== target) {
        lastHighlight.classList.remove('drop-hover');
      }
      if (target && target.classList.contains('seq-item') && target.classList.contains('empty')) {
        target.classList.add('drop-hover');
        lastHighlight = target;
      } else {
        lastHighlight = null;
      }
    }

    function endDrag(cx, cy) {
      clone.remove();
      btn.classList.remove('dragging');
      if (lastHighlight) lastHighlight.classList.remove('drop-hover');

      const target = document.elementFromPoint(cx, cy);
      if (target && target.classList.contains('seq-item') && target.classList.contains('empty')) {
        placeItem(shuffled[index]);
      } else if (!moved) {
        // Was just a tap, not a drag — click handler will fire
      }
    }

    if (mode === 'touch') {
      function onMove(ev) {
        ev.preventDefault();
        moveClone(ev.touches[0].clientX, ev.touches[0].clientY);
      }
      function onEnd(ev) {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        const t = ev.changedTouches[0];
        endDrag(t.clientX, t.clientY);
      }
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    } else {
      function onMove(ev) {
        moveClone(ev.clientX, ev.clientY);
      }
      function onEnd(ev) {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        endDrag(ev.clientX, ev.clientY);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
    }
  }

  render();
}
