// "The way I think": the school memory as a small, pressure-free puzzle.
// Watch the teacher's method, then use the same pattern on a slightly different
// problem by putting the solution steps in order. No timers. Hints, retries and
// a "show me" option for visitors who'd rather watch.

import { MATH_PUZZLE as P } from '../content/chapter01.js';

const shuffle = (a) => {
  const order = [3, 1, 0, 2];   // a fixed, friendly shuffle: never already solved
  return order.map((i) => a[i]);
};

export function mountMathPuzzle(root, { audio, onSolved, preferWatch = false }) {
  const cards = shuffle([...P.correct, P.distractor]);
  let slots = [null, null, null];
  let solved = false;
  let revealed = 0;   // example steps shown so far

  root.innerHTML = `
    <div class="mp">
      <section class="mp-example" aria-label="The teacher's example">
        <p class="mp-label">The teacher solves it on the board</p>
        <p class="mp-problem">${P.example.problem}</p>
        <ol class="mp-steps">${P.example.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        <p class="mp-answer">= ${P.example.answer}</p>
      </section>
      <section class="mp-new" aria-label="The new problem">
        <p class="mp-label">Then a new problem, with a small change</p>
        <p class="mp-problem">${P.problem}</p>
        <p class="mp-teacher"><span class="mp-chalk"></span>The teacher is still writing… but you've seen the pattern.</p>
        <ol class="mp-slots">${slots.map((_, i) => `<li><button type="button" class="mp-slot" data-slot="${i}" aria-label="Step ${i + 1}, empty">Step ${i + 1}</button></li>`).join('')}</ol>
        <p class="mp-help">Pick the steps in the order the teacher used them.</p>
        <div class="mp-cards">${cards.map((c, i) => `<button type="button" class="mp-card" data-card="${i}">${c}</button>`).join('')}</div>
        <div class="mp-actions">
          <button type="button" class="pixel-btn pixel-btn--small" data-act="hint">Hint</button>
          <button type="button" class="pixel-btn pixel-btn--small" data-act="retry">Start again</button>
          <button type="button" class="pixel-btn pixel-btn--small" data-act="watch">Show me how he did it</button>
        </div>
        <p class="mp-status" role="status" aria-live="polite"></p>
      </section>
      <div class="mp-confetti" aria-hidden="true"></div>
    </div>`;

  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => [...root.querySelectorAll(sel)];
  const say = (msg, kind = '') => { const s = $('.mp-status'); s.textContent = msg; s.dataset.kind = kind; };

  // the example appears step by step, like chalk on the board
  const steps = $$('.mp-steps li');
  const answer = $('.mp-answer');
  const showNext = () => {
    if (revealed < steps.length) { steps[revealed].classList.add('is-on'); revealed++; audio?.sfx('chalk'); setTimeout(showNext, 700); }
    else answer.classList.add('is-on');
  };
  setTimeout(showNext, 400);

  function render() {
    $$('.mp-slot').forEach((b, i) => {
      const c = slots[i];
      b.textContent = c === null ? `Step ${i + 1}` : cards[c];
      b.classList.toggle('is-filled', c !== null);
      b.setAttribute('aria-label', c === null ? `Step ${i + 1}, empty` : `Step ${i + 1}: ${cards[c]}. Press to remove.`);
    });
    $$('.mp-card').forEach((b) => {
      const used = slots.includes(+b.dataset.card);
      b.disabled = used || solved;
      b.classList.toggle('is-used', used);
    });
  }

  function place(ci) {
    if (solved) return;
    const i = slots.indexOf(null);
    if (i < 0) return;
    slots[i] = ci;
    audio?.sfx('chalk');
    render();
    if (!slots.includes(null)) check();
    else say(`Step ${i + 1}: ${cards[ci]}`);
  }

  function check() {
    const chosen = slots.map((c) => cards[c]);
    const wrongAt = chosen.findIndex((c, i) => c !== P.correct[i]);
    if (wrongAt < 0) return win();
    audio?.sfx('click');
    const slot = $$('.mp-slot')[wrongAt];
    slot.classList.add('is-wrong');
    setTimeout(() => slot.classList.remove('is-wrong'), 600);
    const msg = chosen[wrongAt] === P.distractor
      ? 'Not quite. The teacher never added anything. Compare with the steps on the left.'
      : `Not quite: step ${wrongAt + 1} doesn't follow the teacher's order. Tap a step to take it back, or start again.`;
    say(msg, 'wrong');
  }

  function win() {
    solved = true;
    render();
    $$('.mp-slot').forEach((b) => b.classList.add('is-right'));
    root.querySelector('.mp-new').classList.add('is-solved');
    $('.mp-teacher').textContent = `${P.problem.replace('?', P.answer)}. Solved, before the teacher finished writing.`;
    say('Same method, new numbers. That\'s recognising the pattern.', 'right');
    audio?.sfx('success');
    const conf = $('.mp-confetti');
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('span');
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 0.4}s`;
      p.style.background = ['#ffe28a', '#ff9ad5', '#8eeaff', '#9effc8'][i % 4];
      conf.appendChild(p);
    }
    $$('[data-act]').forEach((b) => { if (b.dataset.act !== 'done') b.hidden = true; });
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'pixel-btn';
    done.textContent = 'Continue ▸';
    done.addEventListener('click', () => onSolved?.(true));
    $('.mp-actions').appendChild(done);
    done.focus();
    onSolved?.(false);
  }

  function hint() {
    const i = slots.indexOf(null);
    const k = i < 0 ? 0 : i;
    steps.forEach((s, j) => s.classList.toggle('is-hint', j === k));
    say(`Hint: look at step ${k + 1} of the teacher's example, then find the same move for ${P.problem.replace(' = ?', '')}.`);
  }

  function retry() {
    slots = [null, null, null];
    steps.forEach((s) => s.classList.remove('is-hint'));
    render();
    say('Fresh start.');
  }

  function watch() {
    if (solved) return;
    retry();
    let i = 0;
    const next = () => {
      if (i >= 3) return;
      place(cards.indexOf(P.correct[i]));
      i++;
      setTimeout(next, 650);
    };
    next();
  }

  $$('.mp-card').forEach((b) => b.addEventListener('click', () => place(+b.dataset.card)));
  $$('.mp-slot').forEach((b) => b.addEventListener('click', () => {
    if (solved) return;
    const i = +b.dataset.slot;
    if (slots[i] === null) return;
    slots[i] = null;
    render();
    say(`Step ${i + 1} cleared.`);
  }));
  root.querySelector('[data-act="hint"]').addEventListener('click', hint);
  root.querySelector('[data-act="retry"]').addEventListener('click', retry);
  root.querySelector('[data-act="watch"]').addEventListener('click', watch);
  render();
  if (preferWatch) setTimeout(() => root.querySelector('[data-act="watch"]').focus(), 50);
  else setTimeout(() => root.querySelector('.mp-card').focus(), 50);

  // used by "Skip scene"
  return { solveNow() { if (!solved) { slots = P.correct.map((c) => cards.indexOf(c)); win(); } } };
}
