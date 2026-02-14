import { sounds } from '../sounds.js';
import { speech } from '../speech.js';

export function renderDragDrop(el, task, onAnswer) {
  speech.speakTask(task.id, task.question);

  const shuffled = [...task.items].sort(() => Math.random() - 0.5);
  const slots = new Array(task.slots).fill(null);
  let selectedItem = null;
  let answered = false;

  function render() {
    el.innerHTML = `
      <div class="game dragdrop">
        <div class="game-question">${task.question}</div>
        ${task.image ? `<div class="game-image">${task.image}</div>` : ''}
        <div class="drop-slots">
          ${slots.map((s, i) => `
            <div class="drop-slot ${s !== null ? 'filled' : ''}" data-slot="${i}">
              ${s !== null ? s : ''}
            </div>
          `).join('')}
        </div>
        <div class="drag-items">
          ${shuffled.map((item, i) => {
            const isUsed = isItemUsed(i);
            return `<button class="btn drag-item ${isUsed ? 'used' : ''} ${selectedItem === i ? 'selected' : ''}"
              data-index="${i}" ${isUsed ? 'disabled' : ''}>${item}</button>`;
          }).join('')}
        </div>
      </div>
    `;

    if (answered) return;
    bindEvents();
  }

  function isItemUsed(shuffledIndex) {
    const item = shuffled[shuffledIndex];
    let countBefore = 0;
    for (let i = 0; i <= shuffledIndex; i++) {
      if (shuffled[i] === item) countBefore++;
    }
    let countInSlotsVal = 0;
    for (let i = 0; i < slots.length; i++) {
      if (slots[i] === item) countInSlotsVal++;
    }
    return countBefore <= countInSlotsVal;
  }

  function placeInSlot(slotIdx, itemIndex) {
    if (slots[slotIdx] !== null) return false;
    slots[slotIdx] = shuffled[itemIndex];
    sounds.click();
    selectedItem = null;
    render();

    if (slots.every(s => s !== null)) {
      checkAnswer();
    }
    return true;
  }

  function checkAnswer() {
    answered = true;
    const correct = slots.every((s, i) => s === task.answer[i]);

    if (correct) {
      sounds.correct();
    } else {
      sounds.wrong();
      setTimeout(() => {
        answered = false;
        for (let i = 0; i < slots.length; i++) slots[i] = null;
        selectedItem = null;
        render();
      }, 1200);
    }

    setTimeout(() => onAnswer(correct), correct ? 500 : 1000);
  }

  function bindEvents() {
    // Drag items — tap to select, drag to place
    el.querySelectorAll('.drag-item:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedItem = Number(btn.dataset.index);
        render();
      });

      // Touch drag
      btn.addEventListener('touchstart', (e) => {
        if (answered) return;
        e.preventDefault();
        startDrag(btn, e.touches[0].clientX, e.touches[0].clientY, 'touch');
      }, { passive: false });

      // Mouse drag
      btn.addEventListener('mousedown', (e) => {
        if (answered) return;
        e.preventDefault();
        startDrag(btn, e.clientX, e.clientY, 'mouse');
      });
    });

    // Slots — tap to place selected or remove existing
    el.querySelectorAll('.drop-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        if (answered) return;
        const slotIdx = Number(slot.dataset.slot);

        if (slots[slotIdx] !== null) {
          slots[slotIdx] = null;
          selectedItem = null;
          render();
          return;
        }

        if (selectedItem !== null) {
          placeInSlot(slotIdx, selectedItem);
        }
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

    selectedItem = index;
    render();

    let lastHighlight = null;

    function moveClone(cx, cy) {
      clone.style.left = (cx - btn.offsetWidth / 2) + 'px';
      clone.style.top = (cy - btn.offsetHeight / 2) + 'px';

      // Highlight empty slot under cursor
      const target = document.elementFromPoint(cx, cy);
      if (lastHighlight && lastHighlight !== target) {
        lastHighlight.classList.remove('drop-hover');
      }
      if (target && target.classList.contains('drop-slot') && !target.classList.contains('filled')) {
        target.classList.add('drop-hover');
        lastHighlight = target;
      } else {
        lastHighlight = null;
      }
    }

    function endDrag(cx, cy) {
      clone.remove();
      if (lastHighlight) lastHighlight.classList.remove('drop-hover');

      const target = document.elementFromPoint(cx, cy);
      if (target && target.classList.contains('drop-slot') && !target.classList.contains('filled')) {
        placeInSlot(Number(target.dataset.slot), index);
      } else {
        selectedItem = null;
        render();
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
