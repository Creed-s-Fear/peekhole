
import * as THREE from './vendor/three.module.min.js';
import { makeEnvironment } from './scene3d.js';

const W = 480;
const H = 528;
const SPHERE = new THREE.SphereGeometry(1, 32, 24);
const INK = 0x1a0b12;

/* ----------------------------------------------------------------- helpers */
function mesh(geo, mat, [x, y, z] = [0, 0, 0], scale = 1, [rx, ry, rz] = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (Array.isArray(scale)) m.scale.set(...scale); else m.scale.setScalar(scale);
  m.rotation.set(rx, ry, rz);
  return m;
}
const ball = (mat, pos, scale, rot) => mesh(SPHERE, mat, pos, scale, rot);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const GOLD = std(0xe8b23a, { metalness: 1, roughness: 0.25 });
const PEARL = new THREE.MeshPhysicalMaterial({ color: 0xfff6ee, roughness: 0.25, clearcoat: 1 });

// Thin cylinder between two points.
function stick(a, b, r, mat) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), 10), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.sub(va).normalize());
  return m;
}

// Deterministic pseudo-random (stable layout between visits).
const rnd = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function headGeometry() {
  const g = new THREE.SphereGeometry(1, 48, 36);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i += 1) {
    let x = p.getX(i) * 0.82;
    const y = p.getY(i);
    let z = p.getZ(i) * 0.88;
    if (y < 0) { // taper the jaw toward the chin
      const t = -y;
      x *= 1 - 0.3 * t ** 1.5;
      z *= 1 - 0.15 * t;
    }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}
const HEAD = headGeometry();
const CAP = new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.56);

function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -1);
  s.bezierCurveTo(-0.6, -0.55, -1.0, -0.15, -1.0, 0.3);
  s.bezierCurveTo(-1.0, 0.8, -0.45, 1.05, 0, 0.6);
  s.bezierCurveTo(0.45, 1.05, 1.0, 0.8, 1.0, 0.3);
  s.bezierCurveTo(1.0, -0.15, 0.6, -0.55, 0, -1);
  return new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 14 }).center();
}

/* -------------------------------------------------------------- base bust */
function baseBust(c) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  const head = new THREE.Group();
  const eyes = new THREE.Group();
  root.add(body, head);

  const skin = std(c.skin, { roughness: 0.55 });
  const hair = std(c.hair, { roughness: 0.42 });
  const dark = std(INK, { roughness: 0.5 });

  // Body
  body.add(mesh(new THREE.CylinderGeometry(0.34, 0.4, 1.0, 24), skin, [0, -1.3, 0]));
  body.add(ball(skin, [0, -2.25, 0], [1.7, 0.7, 0.85]));

  // Head + ears + nose
  head.add(new THREE.Mesh(HEAD, skin));
  for (const s of [-1, 1]) head.add(ball(skin, [s * 0.8, 0, 0], [0.08, 0.16, 0.1]));
  head.add(ball(skin, [0, -0.1, 0.86], [0.1, 0.2, 0.15]));
  head.add(ball(skin, [0, -0.2, 0.9], [0.13, 0.08, 0.1]));

  // Eyes (grouped so a blink is a single scale change)
  const white = std(0xfff8f4, { roughness: 0.2 });
  const iris = std(c.iris, { roughness: 0.2 });
  for (const s of [-1, 1]) {
    const e = new THREE.Group();
    e.position.set(s * 0.3, 0.1, 0.77);
    e.add(ball(white, [0, 0, 0], [0.16, 0.095, 0.065]));
    e.add(ball(iris, [0, 0, 0.045], [0.07, 0.07, 0.03]));
    e.add(ball(dark, [0, 0, 0.065], [0.035, 0.035, 0.015]));
    e.add(ball(white, [0.025, 0.025, 0.078], 0.012));
    eyes.add(e);
    // Lash line + wing, brow
    head.add(mesh(new THREE.TorusGeometry(0.16, 0.022, 6, 18, Math.PI), dark, [s * 0.3, 0.1, 0.8], [1, 0.62, 1]));
    head.add(ball(dark, [s * 0.49, 0.13, 0.74], [0.07, 0.018, 0.02], [0, 0, s * 0.5]));
    head.add(ball(std(c.brow), [s * 0.31, 0.33, 0.8], [0.15, 0.028, 0.03], [0, s * -0.25, s * 0.16]));
  }
  head.add(eyes);

  // Lips
  const lip = new THREE.MeshPhysicalMaterial({ color: c.lip, roughness: 0.3, clearcoat: 0.8 });
  head.add(ball(lip, [0, -0.43, 0.75], [0.19, 0.045, 0.07]));
  head.add(ball(lip, [0, -0.5, 0.73], [0.15, 0.06, 0.075]));

  // Hair cap: hemisphere tilted back so the rim runs forehead → ears → nape
  head.add(mesh(CAP, hair, [0, 0.02, -0.02], [0.93, 1.1, 1.03], [-0.7, 0, 0]));
  head.position.y = -0.22; // shorter neck

  return { root, body, head, eyes, skin, hair, dark };
}

const tubeTop = (color, o) => mesh(
  new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58),
  std(color, o), [0, -2.27, 0], [1.74, 0.72, 0.9],
);

function jacket(mat, gap = 0.9) {
  mat.side = THREE.DoubleSide;
  return mesh(
    new THREE.SphereGeometry(1, 40, 24, Math.PI / 2 + gap / 2, Math.PI * 2 - gap, Math.PI * 0.12, Math.PI * 0.88),
    mat, [0, -2.25, 0], [1.82, 0.78, 0.95],
  );
}

function beads(group, mat, n, radius, y, r) {
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const z = Math.cos(a) * radius * 0.8;
    group.add(ball(mat, [Math.sin(a) * radius, y - (z > 0 ? z * 0.45 : 0), z], r));
  }
}

function hoops(head, r) {
  for (const s of [-1, 1]) {
    head.add(mesh(new THREE.TorusGeometry(r, 0.028, 8, 32), GOLD, [s * 0.84, -0.22 - r, 0.05], 1, [0, s * 0.9, 0]));
  }
}

/* -------------------------------------------------------------- characters */
function cherry() {
  const b = baseBust({ skin: 0xf0c0a2, hair: 0xb0123a, iris: 0x5a2a1a, brow: 0x7a0a28, lip: 0xe8264f });
  // Big curls: fibonacci shell around the head, skipping the face, plus side cascades
  for (let i = 0; i < 70; i += 1) {
    const y = 1 - (i / 69) * 1.7;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * 2.39996;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    if (z > 0.3 && y < 0.6) continue;
    b.head.add(ball(b.hair, [x * 1.18, y * 1.2 + 0.1, z * 1.12 - 0.08], 0.33 + rnd(i) * 0.14));
  }
  for (let i = 0; i < 16; i += 1) {
    const s = i % 2 ? 1 : -1;
    b.head.add(ball(b.hair, [s * (1.0 + rnd(i) * 0.3), -0.25 - (i >> 1) * 0.2, 0.25 - rnd(i + 9) * 0.5], 0.3 + rnd(i + 3) * 0.12));
  }
  // Heart sunglasses
  const lens = new THREE.MeshPhysicalMaterial({ color: 0xff2e88, roughness: 0.1, transparent: true, opacity: 0.78, clearcoat: 1 });
  const hg = heartGeometry();
  for (const s of [-1, 1]) b.head.add(mesh(hg, lens, [s * 0.31, 0.1, 0.92], [0.24, 0.22, 0.12], [0, s * 0.12, 0]));
  b.head.add(stick([-0.08, 0.14, 0.94], [0.08, 0.14, 0.94], 0.02, std(0xff2e88)));
  hoops(b.head, 0.2);
  // Sequin top, straps, necklace, faux-fur stole
  const red = std(0xe8264f, { metalness: 0.35, roughness: 0.35 });
  b.body.add(tubeTop(0xe8264f, { metalness: 0.35, roughness: 0.35 }));
  for (const s of [-1, 1]) b.body.add(stick([s * 0.6, -2.02, 0.72], [s * 0.55, -1.62, 0.3], 0.03, red));
  b.body.add(mesh(new THREE.TorusGeometry(0.5, 0.014, 6, 40), GOLD, [0, -1.74, 0.14], 1, [Math.PI / 2 - 0.5, 0, 0]));
  const fur = std(0xfff0f6, { roughness: 0.95 });
  for (let i = 0; i < 16; i += 1) {
    const s = i % 2 ? 1 : -1;
    const k = i >> 1;
    b.body.add(ball(fur, [s * (0.95 + k * 0.13), -1.72 - k * 0.11, 0.3 - k * 0.05 + rnd(i) * 0.2], 0.27 + rnd(i + 5) * 0.08));
  }
  return { ...b, rim: 0xff5fa2 };
}

function roxy() {
  const b = baseBust({ skin: 0xd39a72, hair: 0xf2c35b, iris: 0x2f7f6f, brow: 0xc98f2e, lip: 0xe8616f });
  // Long straight hair: back sheet + two front locks
  b.head.add(ball(b.hair, [0, -0.95, -0.5], [0.95, 1.55, 0.45]));
  for (const s of [-1, 1]) {
    b.head.add(ball(b.hair, [s * 0.8, -0.95, 0.22], [0.22, 1.3, 0.38]));
    b.head.add(ball(b.hair, [s * 0.5, 0.56, 0.66], [0.42, 0.14, 0.2], [0, 0, s * -0.55]));
  }
  // Aviators pushed up
  const lens = new THREE.MeshPhysicalMaterial({ color: 0x2be4d4, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.85 });
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(s * 0.22, 0.9, 0.6);
    g.rotation.set(-1.0, 0, 0);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 28), GOLD));
    g.add(new THREE.Mesh(new THREE.CircleGeometry(0.17, 28), lens));
    b.head.add(g);
    b.head.add(ball(GOLD, [s * 0.84, -0.22, 0.05], 0.04));
  }
  // White top + open palm shirt + pearls
  b.body.add(tubeTop(0xfff8f0));
  for (const s of [-1, 1]) b.body.add(stick([s * 0.55, -2.02, 0.74], [s * 0.5, -1.62, 0.3], 0.03, std(0xfff8f0)));
  b.body.add(jacket(std(0x1fb5a5, { roughness: 0.7 }), 1.3));
  const petal = std(0xffe39a);
  const dot = std(0xff5f9e);
  for (let i = 0; i < 14; i += 1) {
    const s = i % 2 ? 1 : -1;
    const phi = 0.95 + rnd(i) * 0.9;
    const th = 1.0 + rnd(i + 4) * 0.5;
    const p = [s * Math.sin(phi) * Math.sin(th) * 1.84, Math.cos(th) * 0.79 - 2.25, Math.cos(phi) * Math.sin(th) * 0.97];
    b.body.add(ball(i % 3 ? petal : dot, p, i % 3 ? [0.13, 0.05, 0.03] : 0.05, [0, 0, rnd(i + 8) * 3]));
  }
  beads(b.body, PEARL, 26, 0.5, -1.72, 0.035);
  return { ...b, rim: 0xff9a4d };
}

function nina() {
  const b = baseBust({ skin: 0x7a4a30, hair: 0x7b3fe4, iris: 0x3a2010, brow: 0x2a1220, lip: 0xb0407a });
  // Sharp bob + fringe + cyan streak
  b.head.add(ball(b.hair, [0, -0.3, -0.5], [0.88, 0.82, 0.5]));
  for (const s of [-1, 1]) b.head.add(ball(b.hair, [s * 0.78, -0.3, 0.02], [0.24, 0.72, 0.62]));
  b.head.add(ball(b.hair, [0, 0.5, 0.74], [0.66, 0.17, 0.16], [0.25, 0, 0]));
  b.head.add(ball(std(0x2be4d4, { emissive: 0x2be4d4, emissiveIntensity: 0.5 }), [0.74, -0.2, 0.45], [0.07, 0.6, 0.09]));
  hoops(b.head, 0.27);
  // Choker with heart, black top, holographic bomber
  b.body.add(mesh(new THREE.TorusGeometry(0.37, 0.05, 8, 32), b.dark, [0, -1.25, 0], 1, [Math.PI / 2, 0, 0]));
  b.body.add(mesh(heartGeometry(), std(0xff2e88, { emissive: 0xff2e88, emissiveIntensity: 0.4 }), [0, -1.3, 0.4], 0.06));
  b.body.add(tubeTop(0x1a0b12));
  b.body.add(jacket(new THREE.MeshPhysicalMaterial({
    color: 0xcfd8ff, metalness: 0.9, roughness: 0.18, iridescence: 1, iridescenceIOR: 1.8, clearcoat: 1,
  }), 1.0));
  b.body.add(mesh(new THREE.TorusGeometry(0.55, 0.09, 10, 32), std(0x2a1a4a), [0, -1.72, 0], [1.15, 0.8, 1], [Math.PI / 2, 0, 0]));
  return { ...b, rim: 0x2be4d4 };
}

function luck() {
  const b = baseBust({ skin: 0xf3d2c0, hair: 0x1c1420, iris: 0x6a4a2a, brow: 0x1c1420, lip: 0xc0143e });
  b.hair.roughness = 0.22;
  // High ponytail sweeping over one shoulder
  const curve = new THREE.CatmullRomCurve3([[0.25, 0.95, -0.45], [0.6, 1.3, -0.8], [0.98, 0.6, -0.75], [1.08, -0.5, -0.4], [0.95, -1.5, -0.05]].map((p) => new THREE.Vector3(...p)));
  b.head.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.2, 12), b.hair));
  b.head.add(ball(b.hair, [0.95, -1.5, -0.05], [0.2, 0.3, 0.2]));
  b.head.add(ball(b.hair, [0.25, 0.95, -0.45], 0.27));
  b.head.add(mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 20), GOLD, [0.42, 1.12, -0.62], 1, [0.6, 0.6, 0]));
  b.head.add(ball(b.dark, [0.42, -0.36, 0.7], 0.02)); // beauty mark
  // Drop earrings
  for (const s of [-1, 1]) {
    b.head.add(ball(GOLD, [s * 0.84, -0.2, 0.05], 0.04));
    b.head.add(ball(GOLD, [s * 0.84, -0.36, 0.05], [0.055, 0.1, 0.055]));
  }
  // Wine top, black blazer with gold lapels, pearls, playing card in the pocket
  b.body.add(tubeTop(0x3a0a1e));
  b.body.add(jacket(std(0x151018, { roughness: 0.45 }), 0.9));
  for (const s of [-1, 1]) {
    b.body.add(mesh(new THREE.BoxGeometry(0.16, 0.75, 0.04), GOLD, [s * 0.66, -2.0, 0.87], 1, [-0.35, s * 0.35, s * 0.42]));
  }
  beads(b.body, PEARL, 26, 0.5, -1.72, 0.04);
  b.body.add(mesh(new THREE.BoxGeometry(0.2, 0.28, 0.02), std(0xfff8f0), [1.0, -2.2, 0.82], 1, [-0.2, 0.5, -0.2]));
  b.body.add(mesh(heartGeometry(), std(0xd61f45), [1.0, -2.17, 0.84], 0.045, [-0.2, 0.5, -0.2]));
  return { ...b, rim: 0xffc94a };
}

const BUILDERS = [cherry, roxy, nina, luck];

/* ------------------------------------------------------------------- mount */
export function mountLineup3D({ cards, section, reducedMotion }) {
  const glCanvas = document.createElement('canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true });
  } catch {
    return false;
  }
  const pr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(1);
  renderer.setSize(Math.round(W * pr), Math.round(H * pr), false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  scene.environment = makeEnvironment(renderer);
  scene.environmentIntensity = 0.7;
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 50);
  camera.position.set(0, -0.35, 9.2);
  camera.lookAt(0, -0.55, 0);
  const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
  key.position.set(2.5, 3, 5);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-4, 0, 4);
  const rim = new THREE.PointLight(0xffffff, 30, 0, 2);
  rim.position.set(-2.5, 1.5, -2.5);
  const rim2 = new THREE.PointLight(0xffffff, 18, 0, 2);
  rim2.position.set(3, 0.5, -2);
  scene.add(key, fill, rim, rim2);

  const chars = cards.map((card, i) => {
    if (card.dataset.photo) return null; // this card uses a real image from config.lineup
    const c = BUILDERS[i % BUILDERS.length]();
    c.root.visible = false;
    scene.add(c.root);
    const art = card.querySelector('.creator-art');
    const img = art.querySelector('img');
    const canvas = document.createElement('canvas');
    canvas.className = 'creator-3d';
    canvas.width = glCanvas.width;
    canvas.height = glCanvas.height;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', (img?.alt || 'Character portrait').replace('Illustrated portrait', '3D bust'));
    art.append(canvas);
    const state = { ...c, art, ctx: canvas.getContext('2d'), px: 0, py: 0, yaw: 0, pitch: 0, hover: false, phase: i * 1.7, nextBlink: 2 + i, blink: 0 };
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      state.px = ((e.clientX - r.left) / r.width) * 2 - 1;
      state.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      state.hover = true;
    }, { passive: true });
    card.addEventListener('pointerleave', () => { state.hover = false; });
    return state;
  }).filter(Boolean);
  if (!chars.length) { renderer.dispose(); return false; }

  let t = 0;
  function draw(c, dt) {
    const ty = c.hover ? c.px * 0.7 : Math.sin(t * 0.6 + c.phase) * 0.3;
    const tp = c.hover ? c.py * 0.2 : Math.sin(t * 0.45 + c.phase) * 0.05;
    const k = 1 - Math.exp(-dt * 5);
    c.yaw += (ty - c.yaw) * k;
    c.pitch += (tp - c.pitch) * k;
    c.root.rotation.y = c.yaw * 0.4;
    c.head.rotation.set(c.pitch, c.yaw * 0.6, Math.sin(t * 0.5 + c.phase) * 0.03);
    c.body.scale.y = 1 + Math.sin(t * 1.6 + c.phase) * 0.006; // breathing
    if (t > c.nextBlink) { c.blink = 0.13; c.nextBlink = t + 2.5 + rnd(Math.floor(t) + c.phase) * 3; }
    c.blink = Math.max(0, c.blink - dt);
    c.eyes.scale.y = c.blink > 0 ? 0.12 : 1;

    for (const o of chars) o.root.visible = o === c;
    rim.color.set(c.rim);
    rim2.color.set(c.rim);
    renderer.render(scene, camera);
    c.ctx.clearRect(0, 0, glCanvas.width, glCanvas.height);
    c.ctx.drawImage(glCanvas, 0, 0);
  }

  let raf = 0;
  let running = false;
  let onScreen = false;
  let last = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;
    for (const c of chars) draw(c, dt);
  }
  function sync() {
    const should = onScreen && !document.hidden && !reducedMotion;
    if (should && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(section);
  document.addEventListener('visibilitychange', sync);
  glCanvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
    cancelAnimationFrame(raf);
    for (const c of chars) c.art.classList.remove('has-3d'); // back to the SVG portraits
  });

  for (const c of chars) { draw(c, 0); c.art.classList.add('has-3d'); }
  sync();
  return true;
}
