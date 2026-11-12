// The hero: the portrait is drawn as one set of strokes. It loads as a knotted
// tangle and resolves into the drawing, stroke by stroke, with a blue wavefront.
// Afterwards the pointer gently pushes nearby lines apart. Rendering is
// on demand: the loop only runs while something is moving.

import * as THREE from 'three';
import { readStrokes, buildTangle, resolveOrder } from './portrait.js';

const MARGIN = 0.06;          // canvas extends 6% beyond the art on every side
const LINE_PX = 1.7;          // stroke thickness in CSS pixels
const INTRO_START = 0.25;     // seconds before the first stroke starts moving
const STROKE_DUR = 1.25;      // seconds each stroke takes to resolve
const INTRO_END = INTRO_START + 1.75 + STROKE_DUR;

const VERT = /* glsl */ `
  attribute vec2 aA;
  attribute vec2 aB;
  attribute vec2 aTA;
  attribute vec2 aTB;
  attribute vec2 aSide;
  attribute float aDelay;

  uniform float uTime;
  uniform float uDur;
  uniform float uHalf;
  uniform vec2 uPointer;
  uniform float uPush;
  uniform float uRadius;
  uniform vec3 uInk;
  uniform vec3 uGraphite;
  uniform vec3 uSignal;

  varying vec3 vColor;
  varying float vAlpha;

  float ease(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }
  vec2 wobble(vec2 p, float k) {
    return vec2(sin(p.y * 0.05 + uTime * 1.4 + k), cos(p.x * 0.055 + uTime * 1.1 + k * 1.7));
  }
  vec2 push(vec2 p, float e) {
    vec2 d = p - uPointer;
    float f = exp(-dot(d, d) / (uRadius * uRadius));
    return p + d * f * 0.22 * uPush * e;
  }

  void main() {
    float t = clamp((uTime - aDelay) / uDur, 0.0, 1.0);
    float e = ease(t);
    float loose = 1.0 - e;

    vec2 a = mix(aTA + wobble(aTA, aDelay * 6.0) * 3.5 * loose, aA, e);
    vec2 b = mix(aTB + wobble(aTB, aDelay * 6.0) * 3.5 * loose, aB, e);
    a = push(a, e);
    b = push(b, e);

    vec2 dir = normalize(b - a + vec2(1e-5));
    vec2 n = vec2(-dir.y, dir.x);
    vec2 p = mix(a, b, aSide.x) + n * aSide.y * uHalf + dir * (aSide.x * 2.0 - 1.0) * uHalf * 0.9;

    float front = sin(3.14159265 * t) * step(0.001, t) * step(t, 0.999);
    vColor = mix(mix(uGraphite, uInk, e), uSignal, front * 0.9);
    vAlpha = mix(0.5, 1.0, e);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(vColor * vAlpha, vAlpha);
  }
`;

function buildGeometry(strokes, tangled, delays) {
  let segs = 0;
  for (const s of strokes) segs += s.length - 1;

  const aA = new Float32Array(segs * 4 * 2);
  const aB = new Float32Array(segs * 4 * 2);
  const aTA = new Float32Array(segs * 4 * 2);
  const aTB = new Float32Array(segs * 4 * 2);
  const aSide = new Float32Array(segs * 4 * 2);
  const aDelay = new Float32Array(segs * 4);
  const index = new Uint32Array(segs * 6);

  const corners = [[0, -1], [0, 1], [1, -1], [1, 1]];
  let seg = 0;
  strokes.forEach((pts, si) => {
    const tg = tangled[si];
    for (let k = 0; k < pts.length - 1; k++, seg++) {
      // Segments nearer the stroke's start resolve a hair earlier, so each stroke "runs".
      const delay = delays[si] + (k / (pts.length - 1)) * 0.18;
      for (let c = 0; c < 4; c++) {
        const v = seg * 4 + c;
        aA.set(pts[k], v * 2);
        aB.set(pts[k + 1], v * 2);
        aTA.set(tg[k], v * 2);
        aTB.set(tg[k + 1], v * 2);
        aSide.set(corners[c], v * 2);
        aDelay[v] = delay;
      }
      const i = seg * 6, v0 = seg * 4;
      index.set([v0, v0 + 1, v0 + 2, v0 + 2, v0 + 1, v0 + 3], i);
    }
  });

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs * 4 * 3), 3));
  g.setAttribute('aA', new THREE.BufferAttribute(aA, 2));
  g.setAttribute('aB', new THREE.BufferAttribute(aB, 2));
  g.setAttribute('aTA', new THREE.BufferAttribute(aTA, 2));
  g.setAttribute('aTB', new THREE.BufferAttribute(aTB, 2));
  g.setAttribute('aSide', new THREE.BufferAttribute(aSide, 2));
  g.setAttribute('aDelay', new THREE.BufferAttribute(aDelay, 1));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  return g;
}

export function initHeroScene({ canvas, svg, still }) {
  const { strokes, width: W, height: H } = readStrokes(svg);
  const tangled = buildTangle(strokes, W, H);
  const delays = resolveOrder(strokes).map((d) => d + INTRO_START);
  const geometry = buildGeometry(strokes, tangled, delays);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.OrthographicCamera(
    -W * MARGIN, W * (1 + MARGIN), -H * MARGIN, H * (1 + MARGIN), -1, 1
  ); // top < bottom on purpose: the drawing uses y-down SVG coordinates

  const uniforms = {
    uTime: { value: still ? 99 : 0 },
    uDur: { value: STROKE_DUR },
    uHalf: { value: 1 },
    uPointer: { value: new THREE.Vector2(-9999, -9999) },
    uPush: { value: 0 },
    uRadius: { value: W * 0.16 },
    uInk: { value: new THREE.Color(0.063, 0.071, 0.086) },
    uGraphite: { value: new THREE.Color(0.33, 0.35, 0.38) },
    uSignal: { value: new THREE.Color(0.141, 0.22, 1.0) },
  };
  // Color() converts sRGB hex to linear; these are already the display values.
  uniforms.uInk.value.setRGB(0.063, 0.071, 0.086, THREE.LinearSRGBColorSpace);
  uniforms.uGraphite.value.setRGB(0.33, 0.35, 0.38, THREE.LinearSRGBColorSpace);
  uniforms.uSignal.value.setRGB(0.141, 0.22, 1.0, THREE.LinearSRGBColorSpace);

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    premultipliedAlpha: true,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  });

  const scene = new THREE.Scene();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  // ---- sizing ----
  const ro = new ResizeObserver(() => resize());
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    const unitsPerPx = (W * (1 + 2 * MARGIN)) / w;
    uniforms.uHalf.value = (LINE_PX / 2) * unitsPerPx;
    uniforms.uRadius.value = 90 * unitsPerPx;
    draw();
  }

  // ---- on-demand loop ----
  let raf = 0, t0 = 0, visible = true, disposed = false;
  const target = new THREE.Vector2(-9999, -9999);
  let pushTarget = 0;

  function draw() { renderer.render(scene, camera); }

  function frame(now) {
    raf = 0;
    if (disposed) return;
    if (!t0) t0 = now;
    if (!still) uniforms.uTime.value = (now - t0) / 1000;

    const p = uniforms.uPointer.value;
    if (p.x < -9000) p.copy(target);
    p.lerp(target, 0.16);
    uniforms.uPush.value += (pushTarget - uniforms.uPush.value) * 0.1;
    draw();

    const moving =
      uniforms.uTime.value < INTRO_END ||
      p.distanceTo(target) > 0.15 ||
      Math.abs(pushTarget - uniforms.uPush.value) > 0.004;
    if (moving && visible) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && !disposed && visible) raf = requestAnimationFrame(frame); }

  // ---- pointer ----
  function onMove(e) {
    if (still || !visible) return;
    const r = canvas.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) {
      target.set(
        ((e.clientX - r.left) / r.width) * W * (1 + 2 * MARGIN) - W * MARGIN,
        ((e.clientY - r.top) / r.height) * H * (1 + 2 * MARGIN) - H * MARGIN
      );
      pushTarget = 1;
    } else {
      pushTarget = 0;
    }
    wake();
  }
  function onLeave() { pushTarget = 0; wake(); }

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  });
  io.observe(canvas);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.documentElement.classList.add('gl-failed');
  });

  ro.observe(canvas);
  resize();
  if (!still) wake();

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
