import { sounds } from '../sounds.js';
import { speech } from '../speech.js';

export function renderMatch(el, task, onAnswer) {
  speech.speakTask(task.id, task.question);

  const rightShuffled = [...task.pairs].sort(() => Math.random() - 0.5).map(p => p.right);
  const matched = new Set(); // indices of matched left items
  // Store matched connections: { leftIdx, rightIdx }
  const connections = [];
  let selectedLeft = null;
  let dragLine = null; // active drag line coords

  function getCenter(btn, container) {
    const cr = container.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    return {
      x: br.left + br.width / 2 - cr.left,
      y: br.top + br.height / 2 - cr.top,
    };
  }

  function render() {
    el.innerHTML = `
      <div class="game match">
        <div class="game-question">${task.question}</div>
        ${task.image ? `<div class="game-image">${task.image}</div>` : ''}
        <div class="match-area">
          <svg class="match-svg"></svg>
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
      </div>
    `;

    drawLines();
    bindEvents();
  }

  function drawLines() {
    const area = el.querySelector('.match-area');
    const svg = el.querySelector('.match-svg');
    if (!area || !svg) return;

    const ar = area.getBoundingClientRect();
    svg.setAttribute('width', ar.width);
    svg.setAttribute('height', ar.height);
    svg.innerHTML = '';

    // Draw matched connections
    for (const conn of connections) {
      const leftBtn = el.querySelector(`.match-item-left[data-index="${conn.leftIdx}"]`);
      const rightBtn = el.querySelector(`.match-item-right[data-index="${conn.rightIdx}"]`);
      if (!leftBtn || !rightBtn) continue;

      const from = getCenter(leftBtn, area);
      const to = getCenter(rightBtn, area);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      line.setAttribute('class', 'match-line matched-line');
      svg.appendChild(line);
    }

    // Draw active drag line
    if (dragLine) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', dragLine.x1);
      line.setAttribute('y1', dragLine.y1);
      line.setAttribute('x2', dragLine.x2);
      line.setAttribute('y2', dragLine.y2);
      line.setAttribute('class', 'match-line drag-line');
      svg.appendChild(line);
    }
  }

  function updateDragLine(x2, y2) {
    const svg = el.querySelector('.match-svg');
    let line = svg?.querySelector('.drag-line');
    if (line) {
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
    }
  }

  function tryMatch(rightIdx) {
    if (selectedLeft === null) return;
    const rightItem = rightShuffled[rightIdx];
    const leftPair = task.pairs[selectedLeft];

    if (leftPair.right === rightItem) {
      matched.add(selectedLeft);
      connections.push({ leftIdx: selectedLeft, rightIdx });
      sounds.correct();
      selectedLeft = null;
      dragLine = null;
      render();

      if (matched.size === task.pairs.length) {
        setTimeout(() => onAnswer(true), 600);
      }
    } else {
      sounds.wrong();
      // Flash wrong
      const rightBtn = el.querySelector(`.match-item-right[data-index="${rightIdx}"]`);
      const leftBtn = el.querySelector(`.match-item-left[data-index="${selectedLeft}"]`);
      if (rightBtn) rightBtn.classList.add('wrong');
      if (leftBtn) leftBtn.classList.add('wrong');

      dragLine = null;
      drawLines();

      setTimeout(() => {
        selectedLeft = null;
        render();
      }, 600);
    }
  }

  function bindEvents() {
    const area = el.querySelector('.match-area');
    if (!area) return;

    // Left column — click to select, or start drag
    el.querySelectorAll('.match-item-left:not([disabled])').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.detail === -1) return; // ignore synthetic
        selectedLeft = Number(btn.dataset.index);
        dragLine = null;
        render();
      });

      // Touch drag from left item
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        selectedLeft = Number(btn.dataset.index);
        const from = getCenter(btn, area);
        const touch = e.touches[0];
        const ar = area.getBoundingClientRect();
        dragLine = { x1: from.x, y1: from.y, x2: touch.clientX - ar.left, y2: touch.clientY - ar.top };

        // Highlight selected
        el.querySelectorAll('.match-item-left').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        drawLines();

        function onMove(ev) {
          ev.preventDefault();
          const t = ev.touches[0];
          dragLine.x2 = t.clientX - ar.left;
          dragLine.y2 = t.clientY - ar.top;
          updateDragLine(dragLine.x2, dragLine.y2);
        }

        function onEnd(ev) {
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend', onEnd);

          const t = ev.changedTouches[0];
          const target = document.elementFromPoint(t.clientX, t.clientY);
          if (target && target.classList.contains('match-item-right') && !target.disabled) {
            tryMatch(Number(target.dataset.index));
          } else {
            dragLine = null;
            selectedLeft = null;
            render();
          }
        }

        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
      }, { passive: false });

      // Mouse drag from left item
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectedLeft = Number(btn.dataset.index);
        const from = getCenter(btn, area);
        const ar = area.getBoundingClientRect();
        dragLine = { x1: from.x, y1: from.y, x2: e.clientX - ar.left, y2: e.clientY - ar.top };

        el.querySelectorAll('.match-item-left').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        drawLines();

        function onMove(ev) {
          dragLine.x2 = ev.clientX - ar.left;
          dragLine.y2 = ev.clientY - ar.top;
          updateDragLine(dragLine.x2, dragLine.y2);
        }

        function onUp(ev) {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);

          const target = document.elementFromPoint(ev.clientX, ev.clientY);
          if (target && target.classList.contains('match-item-right') && !target.disabled) {
            tryMatch(Number(target.dataset.index));
          } else {
            dragLine = null;
            selectedLeft = null;
            render();
          }
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });

    // Right column — click to match (tap-based fallback)
    el.querySelectorAll('.match-item-right:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        if (selectedLeft === null) return;
        tryMatch(Number(btn.dataset.index));
      });
    });
  }

  render();
}
