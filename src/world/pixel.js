// Low-level pixel painting helpers. Everything snaps to the integer pixel grid.

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function px(ctx, color, x, y, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Ordered-dither a colour over a rect. density 0..1
export function dither(ctx, color, x, y, w, h, density) {
  ctx.fillStyle = color;
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const gx = x + i, gy = y + j;
      if (BAYER4[gy & 3][gx & 3] / 16 < density) ctx.fillRect(gx, gy, 1, 1);
    }
  }
}

export function bayer(x, y) {
  return BAYER4[y & 3][x & 3] / 16;
}

export function disc(ctx, color, cx, cy, r) {
  ctx.fillStyle = color;
  cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
    ctx.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
  }
}

export function ellipse(ctx, color, cx, cy, rx, ry) {
  ctx.fillStyle = color;
  cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -ry; dy <= ry; dy++) {
    const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.5))));
    ctx.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
  }
}

// 1px line (Bresenham)
export function line(ctx, color, x0, y0, x1, y1) {
  ctx.fillStyle = color;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// Crisp pixel text: render with the pixel font, then threshold the anti-aliasing away.
export function pixelText(ctx, text, x, y, { size = 8, color = '#f6e6d0', align = 'left', font = 'Silkscreen', shadow = null } = {}) {
  const tmp = document.createElement('canvas');
  const tctx = tmp.getContext('2d');
  tctx.font = `${size}px "${font}", monospace`;
  const w = Math.ceil(tctx.measureText(text).width) + 4;
  const h = Math.ceil(size * 1.6) + 4;
  tmp.width = w;
  tmp.height = h;
  tctx.font = `${size}px "${font}", monospace`;
  tctx.textBaseline = 'top';
  tctx.fillStyle = '#fff';
  tctx.fillText(text, 2, 2);
  const img = tctx.getImageData(0, 0, w, h);
  const out = tctx.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] > 110) out.data[i + 3] = 255;
  }
  tctx.putImageData(out, 0, 0);
  tctx.globalCompositeOperation = 'source-in';
  const colored = (c) => {
    tctx.fillStyle = c;
    tctx.fillRect(0, 0, w, h);
  };
  const ox = align === 'center' ? Math.round(x - w / 2) : align === 'right' ? Math.round(x - w) : Math.round(x);
  if (shadow) {
    colored(shadow);
    ctx.drawImage(tmp, ox + 1, Math.round(y) + 1);
  }
  colored(color);
  ctx.drawImage(tmp, ox, Math.round(y));
  return w - 4;
}
