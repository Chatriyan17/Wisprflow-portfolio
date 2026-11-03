// Keyboard + touch input mapped to game actions.

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump',
  KeyE: 'interact', Enter: 'confirm',
  ShiftLeft: 'run', ShiftRight: 'run',
  Escape: 'cancel',
};

// A focused button only keeps Space/Enter for itself while it can actually be seen and
// used. A faded-out one (e.g. "Skip intro" once the intro is over) must not swallow
// the game's keys.
function usableButton(el) {
  if (!el || !el.isConnected || el.disabled || el.closest('[hidden]') || !el.getClientRects().length) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.pointerEvents !== 'none' && parseFloat(cs.opacity) > 0.05;
}

// Keys that would scroll the page if we didn't stop them while exploring.
const SCROLL_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown', 'Home', 'End']);

export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.virtual = new Set();
    this.captureScrollKeys = false;   // true while Explore World is active
    this.listeners = { action: [], anykey: [] };

    window.addEventListener('keydown', (e) => this.onKeyDown(e), { passive: false });
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => { this.down.clear(); this.virtual.clear(); });
  }

  on(type, fn) { this.listeners[type].push(fn); }

  isTypingTarget(e) {
    const t = e.target;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  }

  onKeyDown(e) {
    if (this.isTypingTarget(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    // Let focused buttons keep Space/Enter for activation.
    let onButton = e.target && e.target.closest && e.target.closest('button, a, [role="button"], summary');
    if (onButton && !usableButton(onButton)) { onButton.blur(); onButton = null; }
    const action = KEYMAP[e.code];
    for (const fn of this.listeners.anykey) fn(e, action);
    if (!action) return;
    if (onButton && (e.code === 'Space' || e.code === 'Enter')) return;
    if (this.captureScrollKeys && SCROLL_KEYS.has(e.code)) e.preventDefault();
    if (!e.repeat) {
      this.pressed.add(action);
      for (const fn of this.listeners.action) fn(action, e);
    }
    this.down.add(action);
  }

  onKeyUp(e) {
    const action = KEYMAP[e.code];
    if (!action) return;
    this.down.delete(action);
    this.released.add(action);
  }

  setVirtual(action, isDown) {
    if (isDown) {
      if (!this.virtual.has(action)) {
        this.pressed.add(action);
        for (const fn of this.listeners.action) fn(action, null);
      }
      this.virtual.add(action);
    } else {
      if (this.virtual.has(action)) this.released.add(action);
      this.virtual.delete(action);
    }
  }

  isDown(action) { return this.down.has(action) || this.virtual.has(action); }
  wasPressed(action) { return this.pressed.has(action); }
  wasReleased(action) { return this.released.has(action); }

  axis() {
    return (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0);
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }
}
