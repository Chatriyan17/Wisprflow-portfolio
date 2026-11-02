// The golem's three puzzle challenges (the fourth, motion timing, happens in the
// world itself). Each is gentle on purpose: no timers, no failure, unlimited
// retries, a hint after the first slip, and big targets that work with a mouse,
// a finger or the keyboard. Every challenge can be solved by drag-and-drop,
// or by picking a piece and then picking where it goes.

const INK = '#1d1222';
const DASH = 'stroke="#9a7ab8" stroke-width="2.5" stroke-dasharray="6 5" fill="rgba(183,154,216,0.08)"';

// ---------------------------------------------------------------------------
// Shared: match each piece to its slot
// ---------------------------------------------------------------------------

function mountMatch(root, cfg) {
  const { pieces, slots, audio, onMiss, onPlace, onDone } = cfg;
  root.innerHTML = `
    <div class="bc ${cfg.cls}">
      ${cfg.refHTML || ''}
      <div class="bc-board">${slots.map((s) => `<button type="button" class="bc-slot" data-slot="${s.id}" style="${s.style}" aria-label="${s.label}: empty">${s.outline}${s.tag ? `<span class="bc-slot__tag">${s.tag}</span>` : ''}</button>`).join('')}</div>
      <div class="bc-tray" role="group" aria-label="Pieces">${pieces.map((p, i) => `<button type="button" class="bc-piece" data-piece="${p.id}" style="--i:${i}" aria-pressed="false" aria-label="${p.label}">${p.html}</button>`).join('')}</div>
    </div>
    <p class="bc-help">${cfg.help}</p>
    <div class="bc-actions">
      <button type="button" class="pixel-btn pixel-btn--small" data-act="hint">Hint</button>
      <button type="button" class="pixel-btn pixel-btn--small" data-act="reset">Start again</button>
    </div>
    <p class="bc-status" role="status" aria-live="polite"></p>`;

  const $ = (s) => root.querySelector(s);
  const pieceEl = (id) => root.querySelector(`[data-piece="${id}"]`);
  const slotEl = (id) => root.querySelector(`[data-slot="${id}"]`);
  const P = (id) => pieces.find((p) => p.id === id);
  const S = (id) => slots.find((s) => s.id === id);
  let selected = null;
  let placed = {};
  let misses = 0;
  let done = false;

  const say = (msg, kind = '') => { const el = $('.bc-status'); el.textContent = msg; el.dataset.kind = kind; };
  const clearHints = () => root.querySelectorAll('.bc-slot').forEach((el) => el.classList.remove('is-hint', 'is-over'));

  function select(id) {
    if (done || Object.values(placed).includes(id)) return;
    selected = selected === id ? null : id;
    root.querySelectorAll('.bc-piece').forEach((el) => {
      const on = el.dataset.piece === selected;
      el.classList.toggle('is-selected', on);
      el.setAttribute('aria-pressed', String(on));
    });
    clearHints();
    if (selected) {
      audio?.sfx('click');
      if (misses > 0) slotEl(P(selected).fits).classList.add('is-hint');
      say(`${P(selected).label} picked up. Now choose where it goes.`);
    }
  }

  function showHint(id) {
    clearHints();
    const p = P(id);
    slotEl(p.fits).classList.add('is-hint');
    say(cfg.hint(p), 'hint');
  }

  function tryPlace(pid, sid) {
    if (done) return;
    const p = P(pid);
    const s = slotEl(sid);
    if (placed[sid]) { say('That spot is already filled. Try another one.'); return; }
    if (p.fits === sid) {
      placed[sid] = pid;
      s.classList.add('is-filled');
      s.classList.remove('is-hint');
      s.innerHTML = `<span class="bc-slot__fill">${p.html}</span>`;
      s.setAttribute('aria-label', `${S(sid).label}: ${p.label}`);
      const el = pieceEl(pid);
      el.classList.add('is-placed');
      el.disabled = true;
      el.setAttribute('aria-pressed', 'false');
      selected = null;
      clearHints();
      audio?.sfx('place');
      onPlace?.();
      const left = pieces.length - Object.keys(placed).length;
      if (!left) {
        done = true;
        root.querySelector('.bc').classList.add('is-solved');
        say(cfg.successText, 'right');
        setTimeout(() => onDone?.(), 900);
      } else {
        say(`Perfect fit! ${left} more to go.`, 'right');
        const next = root.querySelector('.bc-piece:not(.is-placed)');
        next?.focus({ preventScroll: true });
      }
    } else {
      misses++;
      const el = pieceEl(pid);
      el.classList.remove('is-wrong'); s.classList.remove('is-wrong');
      void el.offsetWidth;
      el.classList.add('is-wrong'); s.classList.add('is-wrong');
      audio?.sfx('wrong');
      onMiss?.();
      // a hint arrives straight after the first slip
      showHint(pid);
    }
  }

  function reset() {
    placed = {};
    selected = null;
    done = false;
    root.querySelector('.bc').classList.remove('is-solved');
    slots.forEach((s) => {
      const el = slotEl(s.id);
      el.classList.remove('is-filled', 'is-hint', 'is-wrong');
      el.innerHTML = `${s.outline}${s.tag ? `<span class="bc-slot__tag">${s.tag}</span>` : ''}`;
      el.setAttribute('aria-label', `${s.label}: empty`);
    });
    root.querySelectorAll('.bc-piece').forEach((el) => { el.classList.remove('is-placed', 'is-selected', 'is-wrong'); el.disabled = false; el.setAttribute('aria-pressed', 'false'); });
    say('Fresh start. Take your time.');
  }

  // generous drop targets: the nearest slot within reach of the pointer
  function slotAt(x, y) {
    let best = null, bestD = Infinity;
    for (const s of slots) {
      const r = slotEl(s.id).getBoundingClientRect();
      const m = 28;
      if (x < r.left - m || x > r.right + m || y < r.top - m || y > r.bottom + m) continue;
      const d = Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2);
      if (d < bestD) { best = s.id; bestD = d; }
    }
    return best;
  }

  root.querySelectorAll('.bc-piece').forEach((el) => {
    const id = el.dataset.piece;
    let start = null, dragging = false, justDragged = false;
    el.addEventListener('pointerdown', (e) => {
      if (done || el.disabled) return;
      start = { x: e.clientX, y: e.clientY };
      dragging = false;
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!dragging && Math.hypot(dx, dy) > 7) {
        dragging = true;
        if (selected !== id) select(id);
        el.classList.add('is-dragging');
      }
      if (dragging) {
        el.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
        const over = slotAt(e.clientX, e.clientY);
        root.querySelectorAll('.bc-slot').forEach((s) => s.classList.toggle('is-over', s.dataset.slot === over));
      }
    });
    const end = (e) => {
      if (!start) return;
      const wasDragging = dragging;
      start = null;
      dragging = false;
      el.classList.remove('is-dragging');
      el.style.transform = '';
      root.querySelectorAll('.bc-slot').forEach((s) => s.classList.remove('is-over'));
      if (!wasDragging) return;
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 50);
      const sid = e.type === 'pointerup' ? slotAt(e.clientX, e.clientY) : null;
      if (sid) tryPlace(id, sid);
      else say('Drop it onto one of the outlines.');
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('click', () => { if (!justDragged) select(id); });
  });

  root.querySelectorAll('.bc-slot').forEach((el) => {
    el.addEventListener('click', () => {
      if (done) return;
      if (!selected) { say('First pick a piece, then choose its spot.'); return; }
      tryPlace(selected, el.dataset.slot);
    });
  });

  $('[data-act="hint"]').addEventListener('click', () => {
    if (done) return;
    const id = selected || pieces.find((p) => !Object.values(placed).includes(p.id))?.id;
    if (!id) return;
    if (selected !== id) select(id);
    showHint(id);
  });
  $('[data-act="reset"]').addEventListener('click', reset);

  setTimeout(() => root.querySelector('.bc-piece')?.focus({ preventScroll: true }), 650);
  say(cfg.startText);

  return {
    solveNow() {
      if (done) return;
      for (const p of pieces) if (!Object.values(placed).includes(p.id)) tryPlace(p.id, p.fits);
    },
  };
}

// ---------------------------------------------------------------------------
// Phase 1 · Graphic Design · Poster Assembly
// ---------------------------------------------------------------------------

export function mountPoster(root, opts) {
  const sun = (fill) => fill
    ? `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#c8553d" stroke="${INK}" stroke-width="2.5"/><circle cx="14" cy="14" r="5" fill="#f2b58a"/></svg>`
    : `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" ${DASH}/></svg>`;
  const title = (fill) => fill
    ? `<svg viewBox="0 0 100 25" aria-hidden="true"><rect x="1.5" y="1.5" width="97" height="22" fill="#e3b13c" stroke="${INK}" stroke-width="2.5"/><text x="50" y="17.5" text-anchor="middle" font-family="Silkscreen, monospace" font-size="13" fill="${INK}">CREATE</text></svg>`
    : `<svg viewBox="0 0 100 25" aria-hidden="true"><rect x="1.5" y="1.5" width="97" height="22" ${DASH}/></svg>`;
  const hill = (fill) => fill
    ? `<svg viewBox="0 0 60 40" aria-hidden="true"><polygon points="2,38 24,4 58,38" fill="#8fae8b" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><polygon points="24,4 30,13 18,13" fill="#f3e6d2"/></svg>`
    : `<svg viewBox="0 0 60 40" aria-hidden="true"><polygon points="2,38 24,4 58,38" ${DASH} stroke-linejoin="round"/></svg>`;
  return mountMatch(root, {
    ...opts,
    cls: 'bc-poster',
    slots: [
      { id: 'sun', label: 'Round outline, top right', style: 'left:56%;top:6%;width:36%;height:27%', outline: sun(false) },
      { id: 'title', label: 'Long outline, middle', style: 'left:8%;top:41%;width:84%;height:16%', outline: title(false) },
      { id: 'hill', label: 'Triangle outline, bottom', style: 'left:8%;top:62%;width:60%;height:30%', outline: hill(false) },
    ],
    pieces: [
      { id: 'hill', fits: 'hill', label: 'Green triangle', html: hill(true), shape: 'triangle' },
      { id: 'sun', fits: 'sun', label: 'Red circle', html: sun(true), shape: 'circle' },
      { id: 'title', fits: 'title', label: 'Yellow headline', html: title(true), shape: 'long bar' },
    ],
    help: 'Drag each piece onto the outline with the same shape. Or tap a piece, then tap its outline.',
    startText: 'The paintbrush threw the poster apart! Rebuild it.',
    successText: 'Poster complete! The paintbrush is sputtering…',
    hint: (p) => `Hint: match the shapes. The ${p.shape} fits the glowing outline.`,
  });
}

// ---------------------------------------------------------------------------
// Phase 3 · Visual Design · Visual Hierarchy
// ---------------------------------------------------------------------------

export function mountHierarchy(root, opts) {
  const piece = (k, text) => `<span class="hp hp--${k}">${text}</span>`;
  return mountMatch(root, {
    ...opts,
    cls: 'bc-hier',
    refHTML: `
      <figure class="bc-ref" aria-label="How visual hierarchy works">
        <figcaption>How hierarchy works</figcaption>
        <div class="bc-ref__card" aria-hidden="true"><span class="r1"></span><span class="r2"></span><span class="r3"></span><span class="r3 r3--short"></span></div>
        <ol>
          <li><b>1 · Primary</b> Biggest and boldest. Seen first.</li>
          <li><b>2 · Secondary</b> Medium. Explains the primary.</li>
          <li><b>3 · Supporting</b> Small details, seen last.</li>
        </ol>
      </figure>`,
    slots: [
      { id: 'primary', label: 'Primary position, top', tag: '1 · Primary', style: 'left:6%;top:5%;width:88%;height:36%', outline: '' },
      { id: 'secondary', label: 'Secondary position, middle', tag: '2 · Secondary', style: 'left:6%;top:45%;width:88%;height:25%', outline: '' },
      { id: 'supporting', label: 'Supporting position, bottom', tag: '3 · Supporting', style: 'left:6%;top:74%;width:88%;height:21%', outline: '' },
    ],
    pieces: [
      { id: 'small', fits: 'supporting', label: 'Small text: Read more, 2 minutes', html: piece(3, 'Read more · 2 min'), shape: 'smallest text' },
      { id: 'headline', fits: 'primary', label: 'Big bold headline: Design for people', html: piece(1, 'Design for people'), shape: 'biggest, boldest text' },
      { id: 'sub', fits: 'secondary', label: 'Medium subheading: Simple, clear and useful', html: piece(2, 'Simple, clear and useful'), shape: 'medium text' },
    ],
    help: 'Put the most important element at the top. Drag, or tap an element and then a position.',
    startText: 'The prism scrambled the page! Restore its hierarchy.',
    successText: 'Clear hierarchy! The prism is losing its colour…',
    hint: (p) => `Hint: the ${p.shape} goes in the glowing position.`,
  });
}

// ---------------------------------------------------------------------------
// Phase 4 · Product Design · Connect the Flow
// ---------------------------------------------------------------------------

const ORDER = ['start', 'details', 'confirm'];
const NODE_LABEL = { start: 'START', details: 'DETAILS', confirm: 'CONFIRMATION' };
const NODE_HINT = {
  start: 'Hint: every journey begins at START.',
  details: 'Hint: after starting, a user fills in their DETAILS.',
  confirm: 'Hint: last of all, the user sees a CONFIRMATION.',
};

function screen(id) {
  const frame = `<rect x="1.5" y="1.5" width="45" height="33" rx="2" fill="#f3e6d2" stroke="${INK}" stroke-width="2.5"/><rect x="1.5" y="1.5" width="45" height="6" fill="#b79ad8" stroke="${INK}" stroke-width="2.5"/>`;
  const inner = {
    start: `<circle cx="24" cy="19" r="6" fill="#4fb3a8"/><polygon points="22,16 22,22 27,19" fill="#f3e6d2"/><rect x="12" y="27" width="24" height="4" fill="#e3b13c"/>`,
    details: `<rect x="7" y="11" width="34" height="4" fill="#d8c8b0"/><rect x="7" y="18" width="34" height="4" fill="#d8c8b0"/><rect x="7" y="25" width="16" height="5" fill="#e3b13c"/>`,
    confirm: `<circle cx="24" cy="20" r="8" fill="#8fae8b"/><polyline points="19,20 23,24 29,16" fill="none" stroke="#f3e6d2" stroke-width="3"/>`,
  }[id];
  return `<svg viewBox="0 0 48 36" aria-hidden="true">${frame}${inner}</svg>`;
}

export function mountFlow(root, { audio, onMiss, onPlace, onDone }) {
  root.innerHTML = `
    <div class="bc bc-flow">
      <div class="bc-flow__canvas">
        <svg class="bc-flow__wires" aria-hidden="true">
          <defs><marker id="bc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#f5c35b"/></marker></defs>
          <g class="bc-flow__done"></g>
          <line class="bc-flow__rubber" x1="0" y1="0" x2="0" y2="0" stroke="#f5c35b" stroke-width="4" stroke-dasharray="6 5" visibility="hidden"/>
        </svg>
        <button type="button" class="bc-node" data-node="confirm" style="left:4%;top:5%">${screen('confirm')}<span>CONFIRMATION</span></button>
        <button type="button" class="bc-node" data-node="start" style="left:35%;top:52%">${screen('start')}<span>START</span></button>
        <button type="button" class="bc-node" data-node="details" style="left:66%;top:5%">${screen('details')}<span>DETAILS</span></button>
      </div>
    </div>
    <p class="bc-help">Connect the screens in the order a user moves through them. Tap one screen, then the next, or drag a line between them.</p>
    <div class="bc-actions">
      <button type="button" class="pixel-btn pixel-btn--small" data-act="hint">Hint</button>
      <button type="button" class="pixel-btn pixel-btn--small" data-act="reset">Start again</button>
    </div>
    <p class="bc-status" role="status" aria-live="polite"></p>`;

  const $ = (s) => root.querySelector(s);
  const canvas = $('.bc-flow__canvas');
  const wires = $('.bc-flow__done');
  const rubber = $('.bc-flow__rubber');
  const node = (id) => root.querySelector(`[data-node="${id}"]`);
  let chain = [];
  let misses = 0;
  let done = false;

  const say = (msg, kind = '') => { const el = $('.bc-status'); el.textContent = msg; el.dataset.kind = kind; };
  const clearHints = () => root.querySelectorAll('.bc-node').forEach((el) => el.classList.remove('is-hint'));

  function box(id) {
    const c = canvas.getBoundingClientRect();
    const r = node(id).getBoundingClientRect();
    return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2, hw: r.width / 2 + 4, hh: r.height / 2 + 4 };
  }
  // where the line from a towards b leaves a's box
  function edge(a, bx, by) {
    const dx = bx - a.x, dy = by - a.y;
    const k = Math.min(a.hw / Math.max(1e-3, Math.abs(dx)), a.hh / Math.max(1e-3, Math.abs(dy)));
    return { x: a.x + dx * Math.min(1, k), y: a.y + dy * Math.min(1, k) };
  }
  function drawWires() {
    wires.innerHTML = '';
    for (let i = 1; i < chain.length; i++) {
      const a = box(chain[i - 1]), b = box(chain[i]);
      const p = edge(a, b.x, b.y), q = edge(b, a.x, a.y);
      wires.insertAdjacentHTML('beforeend', `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#f5c35b" stroke-width="4" stroke-linecap="round" marker-end="url(#bc-arrow)" class="bc-wire"/>`);
    }
  }
  function mark() {
    root.querySelectorAll('.bc-node').forEach((el) => {
      const id = el.dataset.node;
      const i = chain.indexOf(id);
      el.classList.toggle('is-linked', i >= 0);
      el.classList.toggle('is-active', i >= 0 && i === chain.length - 1 && !done);
      el.setAttribute('aria-label', `${NODE_LABEL[id]} screen${i >= 0 ? `, step ${i + 1} of the flow` : ''}`);
    });
  }

  function miss(expected, msg) {
    misses++;
    audio?.sfx('wrong');
    onMiss?.();
    clearHints();
    node(expected).classList.add('is-hint');
    say(msg || NODE_HINT[expected], 'hint');
  }

  function choose(id) {
    if (done) return;
    const expected = ORDER[chain.length];
    if (id === expected) {
      chain.push(id);
      clearHints();
      audio?.sfx(chain.length === 1 ? 'click' : 'place');
      if (chain.length > 1) onPlace?.();
      drawWires();
      mark();
      if (chain.length === ORDER.length) {
        done = true;
        mark();
        root.querySelector('.bc').classList.add('is-solved');
        say('START → DETAILS → CONFIRMATION. A clear flow! The projector is flickering…', 'right');
        setTimeout(() => onDone?.(), 900);
      } else if (chain.length === 1) {
        say('START is selected. Now pick the screen that comes next.');
        if (misses) node(ORDER[1]).classList.add('is-hint');
      } else {
        say('Connected! One more link.', 'right');
        if (misses) node(ORDER[2]).classList.add('is-hint');
      }
    } else if (chain.includes(id)) {
      say(`${NODE_LABEL[id]} is already part of the flow.`);
    } else {
      const el = node(id);
      el.classList.remove('is-wrong'); void el.offsetWidth; el.classList.add('is-wrong');
      miss(expected);
    }
  }

  function reset() {
    chain = [];
    done = false;
    root.querySelector('.bc').classList.remove('is-solved');
    clearHints();
    drawWires();
    mark();
    say('Fresh start. Where does a user begin?');
  }

  // dragging a line from one screen to another
  root.querySelectorAll('.bc-node').forEach((el) => {
    const id = el.dataset.node;
    let start = null, dragging = false, justDragged = false;
    el.addEventListener('pointerdown', (e) => { if (done) return; start = { x: e.clientX, y: e.clientY }; dragging = false; el.setPointerCapture?.(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      if (!start) return;
      if (!dragging && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) dragging = true;
      if (!dragging) return;
      const c = canvas.getBoundingClientRect();
      const a = box(id);
      const p = edge(a, e.clientX - c.left, e.clientY - c.top);
      rubber.setAttribute('x1', p.x); rubber.setAttribute('y1', p.y);
      rubber.setAttribute('x2', e.clientX - c.left); rubber.setAttribute('y2', e.clientY - c.top);
      rubber.setAttribute('visibility', 'visible');
    });
    const end = (e) => {
      if (!start) return;
      const was = dragging;
      start = null; dragging = false;
      rubber.setAttribute('visibility', 'hidden');
      if (!was) return;
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 50);
      let target = null;
      for (const other of ORDER) {
        if (other === id) continue;
        const r = node(other).getBoundingClientRect();
        if (e.clientX > r.left - 20 && e.clientX < r.right + 20 && e.clientY > r.top - 20 && e.clientY < r.bottom + 20) target = other;
      }
      if (!target) { say('Drop the line onto another screen.'); return; }
      if (!chain.length) {
        if (id !== 'start') { miss('start'); return; }
        choose('start');
        choose(target);
      } else if (id === chain[chain.length - 1]) choose(target);
      else if (target === chain[chain.length - 1]) choose(id);
      else miss(ORDER[chain.length], `Hint: continue from ${NODE_LABEL[chain[chain.length - 1]]}, the last connected screen.`);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('click', () => { if (!justDragged) choose(id); });
  });

  $('[data-act="hint"]').addEventListener('click', () => {
    if (done) return;
    const next = ORDER[chain.length];
    clearHints();
    node(next).classList.add('is-hint');
    say(NODE_HINT[next], 'hint');
  });
  $('[data-act="reset"]').addEventListener('click', reset);
  const onResize = () => drawWires();
  window.addEventListener('resize', onResize);

  mark();
  say('The projector scattered three screens. Link them into a flow.');
  setTimeout(() => node('confirm')?.focus({ preventScroll: true }), 650);

  return {
    solveNow() { if (!done) for (const id of ORDER.slice(chain.length)) choose(id); },
    destroy() { window.removeEventListener('resize', onResize); },
  };
}
