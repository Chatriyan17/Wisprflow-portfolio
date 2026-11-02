// Global tuning values. World units are "world pixels" (one pixel of the pixel-art grid).

export const VIEW = {
  targetHeight: 340,   // how many world pixels tall the view aims to be
  minWidth: 300,       // never show fewer world pixels than this horizontally
};

export const WORLD = {
  width: 3400,
  height: 420,
  ground: 300,         // top of the main ground
};

export const PHYSICS = {
  gravity: 1400,
  maxFall: 720,
  walkSpeed: 95,
  runSpeed: 175,
  accel: 950,
  airAccel: 650,
  friction: 1300,
  jumpVelocity: 470,
  jumpCut: 0.45,       // velocity kept when jump is released early
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
};

export const SCROLL = {
  startX: 380,
  endX: 2880,
  pxPerWorldPx: 2.1,   // page-scroll pixels per world pixel travelled
};

export const PALETTE = {
  ink: '#1d1222',
  plum: '#2a1730',
  wine: '#6b2a3a',
  brick: '#8c3b3b',
  rust: '#b5643c',
  peach: '#f2c18d',
  cream: '#f6e6d0',
  rose: '#d98aa6',
  blossom: '#f2b3c8',
  lavender: '#b79ad8',
  violet: '#5a3a78',
  moss: '#9aa36b',
  leaf: '#6f8a3e',
  gold: '#f5c35b',
};

export const REDUCED_MOTION =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
