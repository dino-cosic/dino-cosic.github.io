// Reads the inlined portrait strokes from the DOM and prepares the two states the
// hero moves between: the drawing as made ("resolved") and a ball of yarn ("tangled").

const NUM = /-?\d+(?:\.\d+)?/g;

export function readStrokes(svg) {
  const [, , w, h] = svg.viewBox.baseVal
    ? [0, 0, svg.viewBox.baseVal.width, svg.viewBox.baseVal.height]
    : [0, 0, 640, 838];
  const strokes = [];
  for (const path of svg.querySelectorAll('path')) {
    const n = path.getAttribute('d').match(NUM).map(Number);
    const pts = [];
    for (let i = 0; i < n.length; i += 2) pts.push([n[i], n[i + 1]]);
    if (pts.length > 1) strokes.push(pts);
  }
  return { strokes, width: w, height: h };
}

// Small seeded PRNG so the tangle is identical on every visit.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Each stroke is shrunk, rotated and dropped somewhere inside an ellipse near the
// centre of the drawing, so the whole thing reads as one knotted scribble.
export function buildTangle(strokes, width, height) {
  const rand = rng(1995);
  const cx = width * 0.5, cy = height * 0.42;
  const rx = width * 0.36, ry = height * 0.28;

  return strokes.map((pts) => {
    let mx = 0, my = 0;
    for (const [x, y] of pts) { mx += x; my += y; }
    mx /= pts.length; my /= pts.length;

    const ang = rand() * Math.PI * 2;
    const rad = Math.sqrt(rand());
    const tx = cx + Math.cos(ang) * rad * rx;
    const ty = cy + Math.sin(ang) * rad * ry;
    const rot = rand() * Math.PI * 2;
    const scale = 0.4 + rand() * 0.55;
    const c = Math.cos(rot), s = Math.sin(rot);

    return pts.map(([x, y]) => {
      const dx = (x - mx) * scale, dy = (y - my) * scale;
      return [tx + dx * c - dy * s, ty + dx * s + dy * c];
    });
  });
}

// Top-of-drawing strokes resolve first, so the face appears before the shoulders.
export function resolveOrder(strokes) {
  const rand = rng(7);
  const keyed = strokes.map((pts, i) => {
    let my = 0;
    for (const p of pts) my += p[1];
    return { i, y: my / pts.length };
  });
  keyed.sort((a, b) => a.y - b.y);
  const delays = new Array(strokes.length);
  keyed.forEach((k, rank) => {
    delays[k.i] = (rank / Math.max(1, keyed.length - 1)) * 1.5 + rand() * 0.25;
  });
  return delays;
}
