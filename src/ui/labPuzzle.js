// The Interaction Design Lab: a tiny playable interface puzzle.
//   1. Select components and move them so the screen reads in a sensible order.
//   2. Trigger the interaction and watch the interface respond.
//   3. Compare before and after.
// Fully keyboard and screen-reader friendly: plain buttons, a live status line.

const COMPONENTS = {
  title: { label: 'Join the studio', kind: 'title' },
  email: { label: 'Email', kind: 'field' },
  password: { label: 'Password', kind: 'field' },
  cta: { label: 'Create account', kind: 'button' },
};
const CORRECT = ['title', 'email', 'password', 'cta'];
const START = ['cta', 'email', 'title', 'password'];

function comp(id, opts = {}) {
  const c = COMPONENTS[id];
  if (c.kind === 'title') return `<span class="ui-title">${c.label}</span>`;
  if (c.kind === 'field') return `<span class="ui-field"><span class="ui-field__label">${c.label}</span><span class="ui-field__box"></span></span>`;
  return `<span class="ui-button${opts.state ? ` is-${opts.state}` : ''}">${opts.state === 'loading' ? '<span class="ui-spinner"></span>' : opts.state === 'done' ? '✓ Account created' : c.label}</span>`;
}

export function mountLabPuzzle(root, { audio, onSolved }) {
  let order = [...START];
  let selected = null;
  let step = 'arrange';

  const say = (msg) => { const s = root.querySelector('.lab-status'); if (s) s.textContent = msg; };

  function render() {
    if (step === 'compare') return renderCompare();
    root.innerHTML = `
      <p class="lab-steps"><span class="${step === 'arrange' ? 'is-on' : 'is-done'}">1 · Arrange</span><span class="${step === 'interact' ? 'is-on' : ''}">2 · Interact</span><span>3 · Before / after</span></p>
      <p class="lab-help">${step === 'arrange'
        ? 'This sign-up screen is jumbled. Select a piece, then move it so the screen reads naturally from top to bottom.'
        : 'The screen makes sense now. Press the button and watch how the interface responds.'}</p>
      <div class="lab-stage">
        <ol class="lab-phone" aria-label="Phone screen">
          ${order.map((id, i) => `
            <li>
              <button type="button" class="lab-piece${selected === id ? ' is-selected' : ''}${step !== 'arrange' ? ' is-locked' : ''}" data-id="${id}" aria-pressed="${selected === id}" ${step !== 'arrange' && id !== 'cta' ? 'tabindex="-1"' : ''}>
                ${comp(id)}
                <span class="sr-only">position ${i + 1}</span>
              </button>
            </li>`).join('')}
        </ol>
        ${step === 'arrange' ? `
        <div class="lab-moves">
          <button type="button" class="pixel-btn pixel-btn--small" data-move="-1" ${selected ? '' : 'disabled'}>▲ Move up</button>
          <button type="button" class="pixel-btn pixel-btn--small" data-move="1" ${selected ? '' : 'disabled'}>▼ Move down</button>
        </div>` : ''}
      </div>
      <p class="lab-status" role="status" aria-live="polite"></p>`;
    root.querySelectorAll('.lab-piece').forEach((b) => b.addEventListener('click', () => onPiece(b.dataset.id)));
    root.querySelectorAll('[data-move]').forEach((b) => b.addEventListener('click', () => move(+b.dataset.move)));
  }

  function onPiece(id) {
    if (step === 'arrange') {
      selected = selected === id ? null : id;
      audio?.sfx('click');
      render();
      const again = root.querySelector(`.lab-piece[data-id="${id}"]`);
      if (again) again.focus();
      if (selected) say(`${COMPONENTS[id].label} selected. Move it up or down.`);
      return;
    }
    if (step === 'interact' && id === 'cta') press();
  }

  function move(dir) {
    if (!selected) return;
    const i = order.indexOf(selected);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    audio?.sfx('click');
    const id = selected;
    if (order.join() === CORRECT.join()) {
      selected = null;
      step = 'interact';
      audio?.sfx('success');
      render();
      say('Nice. Heading first, then the fields, then the action.');
      const cta = root.querySelector('.lab-piece[data-id="cta"]');
      if (cta) cta.focus();
      return;
    }
    render();
    say(`${COMPONENTS[id].label} moved to position ${j + 1}.`);
    const again = root.querySelector(`.lab-piece[data-id="${id}"]`);
    if (again) again.focus();
  }

  function press() {
    const btn = root.querySelector('.lab-piece[data-id="cta"]');
    if (!btn || btn.dataset.busy) return;
    btn.dataset.busy = '1';
    audio?.sfx('click');
    btn.innerHTML = comp('cta', { state: 'pressed' });
    setTimeout(() => {
      btn.innerHTML = comp('cta', { state: 'loading' });
      say('Loading… the interface tells you it is working.');
    }, 160);
    setTimeout(() => {
      btn.innerHTML = comp('cta', { state: 'done' });
      audio?.sfx('success');
      say('Done. Clear feedback at every step.');
    }, 1300);
    setTimeout(() => {
      step = 'compare';
      onSolved?.();
      render();
    }, 2500);
  }

  function renderCompare() {
    root.innerHTML = `
      <p class="lab-steps"><span class="is-done">1 · Arrange</span><span class="is-done">2 · Interact</span><span class="is-on">3 · Before / after</span></p>
      <div class="lab-compare">
        <figure>
          <figcaption>Before</figcaption>
          <div class="lab-phone lab-phone--before">${START.map((id) => `<div>${comp(id)}</div>`).join('')}</div>
          <p>Jumbled order, no clear first step, no feedback.</p>
        </figure>
        <figure>
          <figcaption>After</figcaption>
          <div class="lab-phone lab-phone--after">${CORRECT.map((id) => `<div>${comp(id, id === 'cta' ? { state: 'done' } : {})}</div>`).join('')}</div>
          <p>A clear reading order, one obvious action, and a response you can see.</p>
        </figure>
      </div>
      <p class="lab-status" role="status" aria-live="polite">Same pieces. A very different experience.</p>`;
  }

  render();
}
