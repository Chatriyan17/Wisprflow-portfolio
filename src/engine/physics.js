// Axis-separated AABB collision against static rectangles.
// Bodies use x = horizontal centre, y = feet (bottom edge).
// Solids: { x, y, w, h, oneWay? }  (x/y = top-left)

export function bodyRect(b) {
  return { l: b.x - b.w / 2, r: b.x + b.w / 2, t: b.y - b.h, b: b.y };
}

function overlaps(r, s) {
  return r.l < s.x + s.w && r.r > s.x && r.t < s.y + s.h && r.b > s.y;
}

const STEP_HEIGHT = 13;   // walk straight up stairs / low lips without jumping

export function moveAndCollide(body, solids, dt) {
  const result = { hitWall: 0, landed: false, hitHead: false };

  // conveyor belts carry whatever stands on them
  if (body.onGround && body.groundSolid && body.groundSolid.kind === 'conveyor') {
    body.x += body.groundSolid.speed * dt;
  }

  // horizontal
  body.x += body.vx * dt;
  let r = bodyRect(body);
  for (const s of solids) {
    if (s.oneWay) continue;
    if (!overlaps(r, s)) continue;
    if (body.onGround && s.y < body.y && body.y - s.y <= STEP_HEIGHT) {
      body.y = s.y;
      r = bodyRect(body);
      continue;
    }
    if (body.vx > 0) {
      body.x = s.x - body.w / 2 - 0.01;
      result.hitWall = 1;
    } else if (body.vx < 0) {
      body.x = s.x + s.w + body.w / 2 + 0.01;
      result.hitWall = -1;
    }
    body.vx = 0;
    r = bodyRect(body);
  }

  // vertical
  const prevBottom = body.y;
  body.y += body.vy * dt;
  r = bodyRect(body);
  const wasGrounded = body.onGround;
  body.onGround = false;
  for (const s of solids) {
    if (!overlaps(r, s)) continue;
    if (s.oneWay) {
      if (body.vy < 0 || body.dropThrough > 0) continue;
      if (prevBottom > s.y + 0.5) continue;
    }
    if (body.vy >= 0) {
      body.y = s.y;
      body.vy = 0;
      body.onGround = true;
      body.groundSolid = s;
    } else {
      body.y = s.y + s.h + body.h;
      body.vy = 0;
      result.hitHead = true;
    }
    r = bodyRect(body);
  }
  // stick to the ground when walking down stairs instead of hopping off each step
  if (!body.onGround && wasGrounded && body.vy >= 0 && body.dropThrough <= 0) {
    r = bodyRect(body);
    let best = null;
    for (const s of solids) {
      if (r.r <= s.x || r.l >= s.x + s.w) continue;
      if (s.y >= body.y && s.y - body.y <= STEP_HEIGHT && (!best || s.y < best.y)) best = s;
    }
    if (best) {
      body.y = best.y;
      body.vy = 0;
      body.onGround = true;
      body.groundSolid = best;
    }
  }
  result.landed = body.onGround && !wasGrounded;
  return result;
}

// Highest walkable surface at or below `fromY` for column x (used for shadows / spawning).
export function surfaceBelow(solids, x, fromY) {
  let best = Infinity;
  for (const s of solids) {
    if (x < s.x || x > s.x + s.w) continue;
    if (s.y >= fromY - 1 && s.y < best) best = s.y;
  }
  return best;
}
