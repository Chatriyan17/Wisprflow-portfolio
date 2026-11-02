import { CHAPTER_01 } from '../content/chapter01.js';

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

  setProgress(prologue) {
    const n = CHAPTER_01.locations.length;
    this.fill.style.width = `${(prologue / n) * 100}%`;
    const first = this.pips.firstElementChild;
    if (prologue >= 1) {
      first.classList.remove('is-next');
      first.classList.add('is-reached');
      this.now.textContent = '01 · The Old Workshop';
    } else {
      this.now.textContent = 'Prologue · on the way to The Old Workshop';
    }
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

  journeyHTML({ reachedWorkshop }) {
    const c = CHAPTER_01;
    const items = c.locations.map((loc, i) => {
      const here = i === 0;
      const status = i === 0 ? (reachedWorkshop ? 'You are here' : 'Next stop') : 'Opens soon';
      return `<li class="${here ? 'is-here' : ''}"><div><strong>${loc.name}</strong><span>${loc.summary}</span></div><em>${status}</em></li>`;
    }).join('');
    return `
      <p class="lede">${c.theme}</p>
      <p>${c.objective}</p>
      <ol class="journey">${items}</ol>`;
  }
}
