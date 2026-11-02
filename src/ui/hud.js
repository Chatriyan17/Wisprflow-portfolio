import { CHAPTER_01 } from '../content/chapter01.js';

// How many chapter locations are playable so far
// (Stage 4: The Old Workshop, The Discovery Path, The Learning Camp, The First Workplace).
const BUILT_LOCATIONS = 4;

// DOM HUD: chapter progress, mode switch, sound toggle, controls panel, toasts, story card.
export class HUD {
  constructor() {
    this.fill = document.getElementById('progress-fill');
    this.pips = document.getElementById('progress-pips');
    this.now = document.getElementById('progress-now');
    this.toastEl = document.getElementById('toast');
    this.card = document.getElementById('card');
    this.toastTimer = null;
    this.buildPips();

    const controls = document.getElementById('controls');
    const toggle = document.getElementById('controls-toggle');
    toggle.addEventListener('click', () => {
      const collapsed = controls.dataset.collapsed === 'true';
      controls.dataset.collapsed = collapsed ? 'false' : 'true';
      toggle.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
    });
    document.getElementById('card-close').addEventListener('click', () => this.closeCard());
    this.card.addEventListener('click', (e) => { if (e.target === this.card) this.closeCard(); });
    this.card.addEventListener('close', () => { this.onCardClose?.(); });
  }

  buildPips() {
    const n = CHAPTER_01.locations.length;
    CHAPTER_01.locations.forEach((loc, i) => {
      const li = document.createElement('li');
      li.style.position = 'absolute';
      li.style.left = `calc(${((i + 1) / n) * 100}% - 7px)`;
      li.title = `${String(i + 1).padStart(2, '0')} · ${loc.name}`;
      li.setAttribute('aria-label', `${loc.name}${i === 0 ? ' (next stop)' : ' (opens in a later stage)'}`);
      if (i === 0) li.classList.add('is-next');
      this.pips.appendChild(li);
    });
    this.pips.style.display = 'block';
  }

  // progress in location units: 0 = start, 1 = The Old Workshop, 2 = gateway to the Discovery Path
  setProgress(progress) {
    const n = CHAPTER_01.locations.length;
    if (this.lastProgress !== undefined && Math.abs(this.lastProgress - progress) < 0.002) return;
    this.lastProgress = progress;
    this.fill.style.width = `${(Math.min(progress, n) / n) * 100}%`;
    [...this.pips.children].forEach((li, i) => {
      // only locations that exist in the world can be reached; the next one waits at its doorstep
      const reached = i < BUILT_LOCATIONS && progress >= i + 1 - 0.001;
      const next = !reached && i <= BUILT_LOCATIONS && progress >= i - 0.001 && (i === 0 || progress >= i);
      li.classList.toggle('is-reached', reached);
      li.classList.toggle('is-next', next);
    });
    const locs = CHAPTER_01.locations;
    const i = Math.floor(progress + 0.001);
    const num = (k) => String(k + 1).padStart(2, '0');
    this.now.textContent = progress < 1
      ? `Prologue · on the way to ${locs[0].name}`
      : progress >= BUILT_LOCATIONS + 0.97
        ? `Gateway to ${num(BUILT_LOCATIONS)} · ${locs[BUILT_LOCATIONS].name}`
        : `${num(Math.min(i, BUILT_LOCATIONS) - 1)} · ${locs[Math.min(i, BUILT_LOCATIONS) - 1].name}`;
  }

  setMode(mode) {
    document.getElementById('mode-scroll').setAttribute('aria-pressed', String(mode === 'scroll'));
    document.getElementById('mode-explore').setAttribute('aria-pressed', String(mode === 'explore'));
    document.getElementById('controls-tag').textContent = mode === 'scroll' ? 'Scroll' : 'Explore';
  }

  setSound(on) {
    const b = document.getElementById('sound-toggle');
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on');
  }

  setVoices(on) {
    const b = document.getElementById('voice-toggle');
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Character voices on. Turn voices off' : 'Character voices off. Turn voices on');
  }

  toast(text, ms = 2600) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('is-on');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('is-on'), ms);
  }

  get cardOpen() { return this.card.open; }

  openCard({ eyebrow, title, html }) {
    document.getElementById('card-eyebrow').textContent = eyebrow;
    document.getElementById('card-title').textContent = title;
    document.getElementById('card-body').innerHTML = html;
    if (!this.card.open) this.card.showModal();
    return new Promise((resolve) => { this.onCardClose = () => { this.onCardClose = null; resolve(); }; });
  }

  closeCard() {
    if (this.card.open) this.card.close();
  }

  journeyHTML({ progress = 0 } = {}) {
    const c = CHAPTER_01;
    const here = Math.floor(progress + 0.001) - 1;   // index of the location you're in
    const items = c.locations.map((loc, i) => {
      let status = 'Opens soon';
      let cls = '';
      const atDoor = progress >= BUILT_LOCATIONS + 0.97;
      if (i < BUILT_LOCATIONS) {
        if (i === here && !atDoor) { status = 'You are here'; cls = 'is-here'; }
        else if (i < here || atDoor) status = 'Explored';
        else status = i === here + 1 ? 'Next stop' : 'Ahead';
      } else if (i === BUILT_LOCATIONS && atDoor) {
        status = 'Gateway found · opens soon';
        cls = 'is-here';
      }
      return `<li class="${cls}"><div><strong>${loc.name}</strong><span>${loc.summary}</span></div><em>${status}</em></li>`;
    }).join('');
    return `
      <p class="lede">${c.theme}</p>
      <p>${c.objective}</p>
      <ol class="journey">${items}</ol>`;
  }
}
