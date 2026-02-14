import { sounds } from '../sounds.js';
import { speech } from '../speech.js';

export function renderMatch(el, task, onAnswer) {
  speech.speakTask(task.id, task.question);

  const rightShuffled = [...task.pairs].sort(() => Math.random() - 0.5).map(p => p.right);
  const matched = new Set(); // indices of matched left items
  const connections = []; // { leftIdx, rightIdx }
  let selected = null; // { side: 'left'|'right', index }
  let dragLine = null;

  function getCenter(btn, container) {
    const cr = container.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    return {
      x: br.left + br.width / 2 - cr.left,
      y: br.top + br.height / 2 - cr.top,
    };
  }

  function isRightMatched(rightIdx) {
    return [...matched].some(mi => task.pairs[mi].right === rightShuffled[rightIdx]);
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
                <button class="btn match-item match-item-left ${matched.has(i) ? 'matched' : ''} ${selected?.side === 'left' && selected.index === i ? 'selected' : ''}"
                  data-index="${i}" ${matched.has(i) ? 'disabled' : ''}>${p.left}</button>
              `).join('')}
            </div>
            <div class="match-col match-right">
              ${rightShuffled.map((item, i) => {
                const im = isRightMatched(i);
                return `<button class="btn match-item match-item-right ${im ? 'matched' : ''} ${selected?.side === 'right' && selected.index === i ? 'selected' : ''}"
                  data-index="${i}" ${im ? 'disabled' : ''}>${item}</button>`;
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
    const line = svg?.querySelector('.drag-line');
    if (line) {
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
    }
  }

  // Try to match: given a leftIdx and rightIdx, check if they form a pair
  function tryMatch(leftIdx, rightIdx) {
    const rightItem = rightShuffled[rightIdx];
    const leftPair = task.pairs[leftIdx];

    if (leftPair.right === rightItem) {
      matched.add(leftIdx);
      connections.push({ leftIdx, rightIdx });
      sounds.correct();
      selected = null;
      dragLine = null;
      render();

      if (matched.size === task.pairs.length) {
        setTimeout(() => onAnswer(true), 600);
      }
    } else {
      sounds.wrong();
      const rightBtn = el.querySelector(`.match-item-right[data-index="${rightIdx}"]`);
      const leftBtn = el.querySelector(`.match-item-left[data-index="${leftIdx}"]`);
      if (rightBtn) rightBtn.classList.add('wrong');
      if (leftBtn) leftBtn.classList.add('wrong');

      dragLine = null;
      drawLines();

      setTimeout(() => {
        selected = null;
        render();
      }, 600);
    }
  }

  function bindEvents() {
    const area = el.querySelector('.match-area');
    if (!area) return;

    // --- Left column ---
    el.querySelectorAll('.match-item-left:not([disabled])').forEach(btn => {
      const idx = Number(btn.dataset.index);

      // Click: select, or if right is already selected — try match
      btn.addEventListener('click', () => {
        if (selected?.side === 'right') {
          tryMatch(idx, selected.index);
        } else {
          selected = { side: 'left', index: idx };
          dragLine = null;
          render();
        }
      });

      // Drag (touch + mouse)
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrag(btn, 'left', idx, e.touches[0].clientX, e.touches[0].clientY, 'touch', area);
      }, { passive: false });

      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrag(btn, 'left', idx, e.clientX, e.clientY, 'mouse', area);
      });
    });

    // --- Right column ---
    el.querySelectorAll('.match-item-right:not([disabled])').forEach(btn => {
      const idx = Number(btn.dataset.index);

      // Click: select, or if left is already selected — try match
      btn.addEventListener('click', () => {
        if (selected?.side === 'left') {
          tryMatch(selected.index, idx);
        } else {
          selected = { side: 'right', index: idx };
          dragLine = null;
          render();
        }
      });

      // Drag (touch + mouse)
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrag(btn, 'right', idx, e.touches[0].clientX, e.touches[0].clientY, 'touch', area);
      }, { passive: false });

      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrag(btn, 'right', idx, e.clientX, e.clientY, 'mouse', area);
      });
    });
  }

  function startDrag(btn, side, idx, startX, startY, mode, area) {
    selected = { side, index: idx };
    const from = getCenter(btn, area);
    const ar = area.getBoundingClientRect();
    dragLine = { x1: from.x, y1: from.y, x2: startX - ar.left, y2: startY - ar.top };

    // Highlight
    el.querySelectorAll('.match-item').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    drawLines();

    const oppositeSide = side === 'left' ? 'match-item-right' : 'match-item-left';

    function moveHandler(cx, cy) {
      dragLine.x2 = cx - ar.left;
      dragLine.y2 = cy - ar.top;
      updateDragLine(dragLine.x2, dragLine.y2);
    }

    function endHandler(cx, cy) {
      const target = document.elementFromPoint(cx, cy);
      if (target && target.classList.contains(oppositeSide) && !target.disabled) {
        const targetIdx = Number(target.dataset.index);
        if (side === 'left') {
          tryMatch(idx, targetIdx);
        } else {
          tryMatch(targetIdx, idx);
        }
      } else {
        dragLine = null;
        selected = null;
        render();
      }
    }

    if (mode === 'touch') {
      function onMove(ev) {
        ev.preventDefault();
        moveHandler(ev.touches[0].clientX, ev.touches[0].clientY);
      }
      function onEnd(ev) {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        const t = ev.changedTouches[0];
        endHandler(t.clientX, t.clientY);
      }
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    } else {
      function onMove(ev) {
        moveHandler(ev.clientX, ev.clientY);
      }
      function onEnd(ev) {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        endHandler(ev.clientX, ev.clientY);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
    }
  }

  render();
}
