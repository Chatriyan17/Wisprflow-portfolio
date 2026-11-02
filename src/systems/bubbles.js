// Speech bubbles anchored to characters in the world (non-blocking hints).
export class Bubbles {
  constructor(container) {
    this.container = container;
    this.items = new Map();   // entity -> { el, time, duration }
  }

  say(entity, text, { duration = 4, kind = 'girl' } = {}) {
    let item = this.items.get(entity);
    if (!item) {
      const el = document.createElement('div');
      el.className = `bubble bubble--${kind}`;
      this.container.appendChild(el);
      item = { el };
      this.items.set(entity, item);
    }
    item.el.textContent = text;
    item.time = 0;
    item.duration = duration;
    requestAnimationFrame(() => item.el.classList.add('is-on'));
  }

  clear() {
    for (const item of this.items.values()) item.duration = 0;
  }

  update(dt, toScreen) {
    for (const [entity, item] of this.items) {
      item.time += dt;
      if (item.time > item.duration) {
        item.el.classList.remove('is-on');
        if (item.time > item.duration + 0.4) {
          item.el.remove();
          this.items.delete(entity);
        }
        continue;
      }
      const p = toScreen(entity.x, entity.y - entity.sheet.meta.spriteHeight + 2);
      // keep the bubble on screen; the tail still points at the speaker
      const half = (item.el.offsetWidth || 200) / 2;
      const x = Math.min(Math.max(p.x, half + 8), window.innerWidth - half - 8);
      item.el.style.setProperty('--tail', `${Math.round(p.x - x)}px`);
      item.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(p.y - 10)}px) translate(-50%, -100%)`;
    }
  }
}
