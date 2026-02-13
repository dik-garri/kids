import { sounds } from '../sounds.js';
import { speech } from '../speech.js';

export function renderDragDrop(el, task, onAnswer) {
  speech.speak(task.question);

  const shuffled = [...task.items].sort(() => Math.random() - 0.5);
  const slots = new Array(task.slots).fill(null);
  let selectedItem = null; // index in shuffled
  let answered = false;

  function render() {
    const allFilled = slots.every(s => s !== null);

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
            const used = slots.includes(item) && slots.indexOf(item) !== -1
              && countInSlots(item) >= countInShuffledUpTo(item, i);
            const isUsed = isItemUsed(i);
            return `<button class="btn drag-item ${isUsed ? 'used' : ''} ${selectedItem === i ? 'selected' : ''}"
              data-index="${i}" ${isUsed ? 'disabled' : ''}>${item}</button>`;
          }).join('')}
        </div>
      </div>
    `;

    if (answered) return;

    // Tap on item to select
    el.querySelectorAll('.drag-item:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedItem = Number(btn.dataset.index);
        render();
      });

      // Touch drag support
      btn.addEventListener('touchstart', handleTouchStart, { passive: false });
    });

    // Tap on slot to place selected item or remove existing
    el.querySelectorAll('.drop-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        if (answered) return;
        const slotIdx = Number(slot.dataset.slot);

        if (slots[slotIdx] !== null) {
          // Remove item from slot
          slots[slotIdx] = null;
          selectedItem = null;
          render();
          return;
        }

        if (selectedItem !== null) {
          slots[slotIdx] = shuffled[selectedItem];
          selectedItem = null;
          render();

          // Check if all slots filled
          if (slots.every(s => s !== null)) {
            checkAnswer();
          }
        }
      });
    });
  }

  // Track which shuffled indices have been placed in slots
  function isItemUsed(shuffledIndex) {
    const item = shuffled[shuffledIndex];
    // Count how many times this item value appears in shuffled up to and including this index
    let countBefore = 0;
    for (let i = 0; i <= shuffledIndex; i++) {
      if (shuffled[i] === item) countBefore++;
    }
    // Count how many times this item value is in slots
    let countInSlotsVal = 0;
    for (let i = 0; i < slots.length; i++) {
      if (slots[i] === item) countInSlotsVal++;
    }
    return countBefore <= countInSlotsVal;
  }

  function countInSlots(item) {
    return slots.filter(s => s === item).length;
  }

  function countInShuffledUpTo(item, index) {
    let count = 0;
    for (let i = 0; i <= index; i++) {
      if (shuffled[i] === item) count++;
    }
    return count;
  }

  function checkAnswer() {
    answered = true;
    const correct = slots.every((s, i) => s === task.answer[i]);

    if (correct) {
      sounds.correct();
    } else {
      sounds.wrong();
      // Allow retry after a delay — reset slots
      setTimeout(() => {
        answered = false;
        for (let i = 0; i < slots.length; i++) slots[i] = null;
        selectedItem = null;
        render();
      }, 1200);
    }

    setTimeout(() => onAnswer(correct), correct ? 500 : 1000);
  }

  // --- Touch drag support ---
  function handleTouchStart(e) {
    if (answered) return;
    e.preventDefault();

    const btn = e.currentTarget;
    const index = Number(btn.dataset.index);
    const touch = e.touches[0];
    const clone = btn.cloneNode(true);

    clone.classList.add('drag-clone');
    clone.style.position = 'fixed';
    clone.style.zIndex = '1000';
    clone.style.pointerEvents = 'none';
    clone.style.width = btn.offsetWidth + 'px';
    clone.style.height = btn.offsetHeight + 'px';
    clone.style.left = (touch.clientX - btn.offsetWidth / 2) + 'px';
    clone.style.top = (touch.clientY - btn.offsetHeight / 2) + 'px';
    clone.style.opacity = '0.9';
    clone.style.transform = 'scale(1.15)';
    clone.style.transition = 'none';
    document.body.appendChild(clone);

    selectedItem = index;
    render();

    function onTouchMove(ev) {
      ev.preventDefault();
      const t = ev.touches[0];
      clone.style.left = (t.clientX - btn.offsetWidth / 2) + 'px';
      clone.style.top = (t.clientY - btn.offsetHeight / 2) + 'px';
    }

    function onTouchEnd(ev) {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      clone.remove();

      const t = ev.changedTouches[0];
      const dropTarget = document.elementFromPoint(t.clientX, t.clientY);

      if (dropTarget && dropTarget.classList.contains('drop-slot')) {
        const slotIdx = Number(dropTarget.dataset.slot);
        if (slots[slotIdx] === null) {
          slots[slotIdx] = shuffled[index];
          selectedItem = null;
          render();

          if (slots.every(s => s !== null)) {
            checkAnswer();
          }
          return;
        }
      }

      // If not dropped on a valid slot, deselect
      selectedItem = null;
      render();
    }

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  render();
}
