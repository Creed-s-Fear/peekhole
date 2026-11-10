// Hero 3D scene: the Jack of Hearts card, spinning $PEEK coins, bills and glossy hearts.
// Loaded lazily (dynamic import) after the age gate, so three.js (~170 KB gzip) never blocks
// first paint. All textures are drawn on <canvas> at runtime: no image requests, CSP stays 'self'.
// Performance guards: DPR cap, render loop paused when off-screen or tab hidden,
// a single static frame under prefers-reduced-motion, and graceful fallback to the CSS poster.

import * as THREE from './vendor/three.module.min.js';

const HEART_KEY = new Path2D('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35zM12 7.4a2.3 2.3 0 0 0-1.15 4.29L10.3 15.6h3.4l-.55-3.91A2.3 2.3 0 0 0 12 7.4z');
const HEART = new Path2D('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z');

const CARD_W = 2.5;
const CARD_H = 3.5;
const CARD_R = 0.16;
const RED = '#d61f45';
const INK = '#1a0b12';

/* ------------------------------------------------------------ canvas helpers */
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function roundRectPath(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Draws a 24-unit SVG path centred at (cx, cy) with the given width.
function drawIcon(g, path, cx, cy, width, rule = 'nonzero') {
  const s = width / 20;
  g.save();
  g.translate(cx - 12 * s, cy - 12.2 * s);
  g.scale(s, s);
  g.fill(path, rule);
  g.restore();
}

function spacing(g, px) {
  if ('letterSpacing' in g) g.letterSpacing = `${px}px`;
}

// Shrinks the font until the text fits maxWidth.
function fitFont(g, text, maxWidth, weight, family, size) {
  let s = size;
  g.font = `${weight} ${s}px ${family}`;
  while (g.measureText(text).width > maxWidth && s > 10) {
    s -= 4;
    g.font = `${weight} ${s}px ${family}`;
  }
}

/* ---------------------------------------------------------------- textures */
function cardFrontCanvas() {
  const W = 1000;
  const H = 1400;
  const c = makeCanvas(W, H);
  const g = c.getContext('2d');
  roundRectPath(g, 0, 0, W, H, (CARD_R / CARD_W) * W);
  g.clip();

  const bg = g.createRadialGradient(W / 2, H * 0.36, 40, W / 2, H * 0.45, H * 0.78);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(0.58, '#fff3e8');
  bg.addColorStop(1, '#eccdb9');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  g.fillStyle = 'rgba(214, 31, 69, 0.07)';
  drawIcon(g, HEART, W / 2, H * 0.47, 860);

  g.strokeStyle = 'rgba(214, 31, 69, 0.6)';
  g.lineWidth = 6;
  roundRectPath(g, 44, 44, W - 88, H - 88, 40);
  g.stroke();

  const corner = () => {
    g.fillStyle = RED;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    spacing(g, 0);
    g.font = '400 110px "Bebas Neue", Impact, sans-serif';
    g.fillText('J', 0, 0);
    drawIcon(g, HEART, 0, 52, 62);
  };
  g.save(); g.translate(112, 175); corner(); g.restore();
  g.save(); g.translate(W - 112, H - 175); g.rotate(Math.PI); corner(); g.restore();

  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';

  g.fillStyle = RED;
  spacing(g, 22);
  g.font = '400 66px "Bebas Neue", Impact, sans-serif';
  g.fillText('JACK OF HEARTS', W / 2 + 11, 520);

  spacing(g, 0);
  g.save();
  g.translate(W / 2, 700);
  g.rotate(-0.1);
  fitFont(g, 'Make it Rain', 760, 400, '"Sacramento", "Brush Script MT", cursive', 200);
  g.fillStyle = 'rgba(214, 31, 69, 0.18)';
  g.fillText('Make it Rain', 0, 8);
  g.fillStyle = RED;
  g.fillText('Make it Rain', 0, 0);
  g.restore();

  g.fillStyle = INK;
  spacing(g, 8);
  g.font = '400 240px "Bebas Neue", Impact, sans-serif';
  g.fillText('MONDAYS', W / 2 + 4, 920);

  spacing(g, 9);
  g.font = '700 38px Barlow, system-ui, sans-serif';
  g.fillText('DOORS 10PM · TIPS IN $PEEK', W / 2 + 4, 1010);

  g.fillStyle = '#6b3a4c';
  spacing(g, 5);
  g.font = '700 30px Barlow, system-ui, sans-serif';
  g.fillText('FIND US ON PEEKHOLE', W / 2 + 26, H - 150);
  g.fillStyle = RED;
  const tw = g.measureText('FIND US ON PEEKHOLE').width;
  drawIcon(g, HEART_KEY, W / 2 + 26 - tw / 2 - 30, H - 161, 38, 'evenodd');
  return c;
}

function cardBackCanvas() {
  const W = 1000;
  const H = 1400;
  const c = makeCanvas(W, H);
  const g = c.getContext('2d');
  roundRectPath(g, 0, 0, W, H, (CARD_R / CARD_W) * W);
  g.clip();

  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#ff2e88');
  bg.addColorStop(1, '#4a0c86');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // Diamond lattice
  g.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  g.lineWidth = 3;
  for (let i = -H; i < W + H; i += 56) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + H, H); g.stroke();
    g.beginPath(); g.moveTo(i, H); g.lineTo(i + H, 0); g.stroke();
  }

  g.strokeStyle = '#fff3e8';
  g.lineWidth = 10;
  roundRectPath(g, 50, 50, W - 100, H - 100, 40);
  g.stroke();

  g.fillStyle = 'rgba(10, 6, 16, 0.78)';
  g.beginPath(); g.arc(W / 2, H / 2 - 40, 250, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255, 243, 232, 0.8)';
  g.lineWidth = 6;
  g.stroke();

  g.fillStyle = '#ff2e88';
  g.shadowColor = 'rgba(255, 46, 136, 0.9)';
  g.shadowBlur = 40;
  drawIcon(g, HEART_KEY, W / 2, H / 2 - 50, 300, 'evenodd');
  g.shadowBlur = 0;

  g.textAlign = 'center';
  g.fillStyle = '#fff3e8';
  spacing(g, 10);
  g.font = '400 130px "Bebas Neue", Impact, sans-serif';
  g.fillText('PEEKHOLE', W / 2 + 5, H / 2 + 360);
  spacing(g, 8);
  g.font = '700 34px Barlow, system-ui, sans-serif';
  g.fillText('MAKE IT RAIN MONDAYS', W / 2 + 4, H / 2 + 420);
  return c;
}

function coinFaceCanvas() {
  const S = 512;
  const c = makeCanvas(S, S);
  const g = c.getContext('2d');
  const r = S / 2;
  const grad = g.createRadialGradient(r * 0.7, r * 0.6, 20, r, r, r);
  grad.addColorStop(0, '#fff2bf');
  grad.addColorStop(0.55, '#f2c14e');
  grad.addColorStop(1, '#b07800');
  g.fillStyle = grad;
  g.beginPath(); g.arc(r, r, r, 0, Math.PI * 2); g.fill();

  g.strokeStyle = 'rgba(122, 78, 0, 0.75)';
  g.lineWidth = 10;
  g.beginPath(); g.arc(r, r, r - 34, 0, Math.PI * 2); g.stroke();
  g.setLineDash([4, 12]);
  g.lineWidth = 6;
  g.beginPath(); g.arc(r, r, r - 14, 0, Math.PI * 2); g.stroke();
  g.setLineDash([]);

  // Embossed heart-keyhole: highlight, shadow, body
  g.fillStyle = 'rgba(255, 250, 220, 0.9)';
  drawIcon(g, HEART_KEY, r - 4, r - 30, 250, 'evenodd');
  g.fillStyle = 'rgba(90, 55, 0, 0.55)';
  drawIcon(g, HEART_KEY, r + 4, r - 22, 250, 'evenodd');
  g.fillStyle = '#d9a21f';
  drawIcon(g, HEART_KEY, r, r - 26, 250, 'evenodd');

  g.textAlign = 'center';
  g.fillStyle = '#7a4e00';
  spacing(g, 6);
  g.font = '400 70px "Bebas Neue", Impact, sans-serif';
  g.fillText('$PEEK', r + 3, r + 150);
  return c;
}

function billCanvas() {
  const W = 600;
  const H = 270;
  const c = makeCanvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = '#2f9e5b';
  roundRectPath(g, 0, 0, W, H, 14); g.fill();
  g.strokeStyle = '#1d6b3c';
  g.lineWidth = 8;
  roundRectPath(g, 16, 16, W - 32, H - 32, 10); g.stroke();
  g.strokeStyle = 'rgba(217, 245, 227, 0.25)';
  g.lineWidth = 2;
  for (let x = 40; x < W - 40; x += 14) {
    g.beginPath(); g.moveTo(x, 34); g.lineTo(x + 20, H - 34); g.stroke();
  }
  g.fillStyle = '#d9f5e3';
  g.beginPath(); g.ellipse(W / 2, H / 2, 82, 92, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1d6b3c';
  drawIcon(g, HEART_KEY, W / 2, H / 2 - 4, 110, 'evenodd');
  g.fillStyle = '#d9f5e3';
  g.textAlign = 'center';
  g.font = '400 64px "Bebas Neue", Impact, sans-serif';
  g.fillText('100', 82, 92);
  g.fillText('100', W - 82, H - 44);
  spacing(g, 4);
  g.font = '400 34px "Bebas Neue", Impact, sans-serif';
  g.fillText('$PEEK', W - 90, 70);
  g.fillText('$PEEK', 92, H - 50);
  return c;
}

function toTexture(canvas, renderer) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

/* ------------------------------------------------------------- environment */
// Tiny procedural "club" environment for reflections (pink + cyan neon, warm floor light).
export function makeEnvironment(renderer) {
  const env = new THREE.Scene();
  const disposables = [];
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(20, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x140a1c, side: THREE.BackSide }),
  );
  env.add(room);
  disposables.push(room);
  const panel = (hex, intensity, pos, w, h) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
    disposables.push(m);
  };
  // Neon accents kept low so gold still reads as gold; white + warm panels do the heavy lifting.
  panel(0xff2e88, 2.2, [-7, 2, 3], 5, 8);
  panel(0x2be4d4, 1.4, [7, -1, 3], 4, 6);
  panel(0xffffff, 7, [0, 8, 4], 12, 4);
  panel(0xfff1d6, 2, [2, 1, 9], 6, 6);
  panel(0xffc94a, 3, [0, -7, 5], 8, 2);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(env, 0.04);
  pmrem.dispose();
  for (const m of disposables) { m.geometry.dispose(); m.material.dispose(); }
  return target.texture;
}

/* ------------------------------------------------------------------ meshes */
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -1);
  s.bezierCurveTo(-0.6, -0.55, -1.0, -0.15, -1.0, 0.3);
  s.bezierCurveTo(-1.0, 0.8, -0.45, 1.05, 0, 0.6);
  s.bezierCurveTo(0.45, 1.05, 1.0, 0.8, 1.0, 0.3);
  s.bezierCurveTo(1.0, -0.15, 0.6, -0.55, 0, -1);
  return s;
}

function buildCard(renderer) {
  const group = new THREE.Group();
  const depth = 0.035;
  const bevel = 0.012;
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedRectShape(CARD_W, CARD_H, CARD_R), {
      depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10,
    }).center(),
    new THREE.MeshStandardMaterial({ color: 0xf1d6c4, roughness: 0.55 }),
  );
  group.add(body);

  const faceZ = depth / 2 + bevel + 0.002;
  const faceGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);
  const front = new THREE.Mesh(faceGeo, new THREE.MeshPhysicalMaterial({
    map: toTexture(cardFrontCanvas(), renderer), alphaTest: 0.5,
    roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.3, envMapIntensity: 0.45,
  }));
  front.position.z = faceZ;
  group.add(front);

  const back = new THREE.Mesh(faceGeo, new THREE.MeshPhysicalMaterial({
    map: toTexture(cardBackCanvas(), renderer), alphaTest: 0.5,
    roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.12,
  }));
  back.position.z = -faceZ;
  back.rotation.y = Math.PI;
  group.add(back);
  return group;
}

function buildCoinFactory(renderer) {
  const R = 0.42;
  const H = 0.07;
  const edge = new THREE.CylinderGeometry(R, R, H, 56, 1, true).rotateX(Math.PI / 2);
  const face = new THREE.CircleGeometry(R, 56);
  const gold = new THREE.MeshStandardMaterial({ color: 0xe8b23a, metalness: 1, roughness: 0.32 });
  const faceMat = new THREE.MeshStandardMaterial({
    map: toTexture(coinFaceCanvas(), renderer), metalness: 0.55, roughness: 0.38,
  });
  return () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(edge, gold));
    const f = new THREE.Mesh(face, faceMat);
    f.position.z = H / 2;
    const b = new THREE.Mesh(face, faceMat);
    b.position.z = -H / 2;
    b.rotation.y = Math.PI;
    g.add(f, b);
    return g;
  };
}

/* ------------------------------------------------------------------- mount */
function waitForFonts(ms) {
  if (!document.fonts?.load) return Promise.resolve();
  const loads = Promise.all([
    document.fonts.load('400 100px "Bebas Neue"'),
    document.fonts.load('400 100px "Sacramento"'),
    document.fonts.load('700 40px "Barlow"'),
  ]).catch(() => {});
  return Promise.race([loads, new Promise((r) => setTimeout(r, ms))]);
}

/**
 * Mounts the hero scene. Resolves to true once the first frame is on screen,
 * false if WebGL is unavailable (caller keeps the CSS poster).
 */
export async function mountHero3D({ canvas, container, reducedMotion }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return false;
  }
  await waitForFonts(2500);

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = makeEnvironment(renderer);
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const key = new THREE.DirectionalLight(0xfff4e6, 2.2);
  key.position.set(3, 4, 6);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(-4, -1, 5);
  // Neon rim lights sit behind the scene, so they edge-light instead of tinting the faces.
  const pink = new THREE.PointLight(0xff2e88, 14, 0, 2);
  pink.position.set(-3.5, 1.5, -1.5);
  const cyan = new THREE.PointLight(0x2be4d4, 9, 0, 2);
  cyan.position.set(3.5, -1.5, -1.5);
  scene.add(key, fill, pink, cyan);

  // Card
  const card = buildCard(renderer);
  scene.add(card);

  // Coins
  const makeCoin = buildCoinFactory(renderer);
  const coinSpots = [
    [-2.15, 1.3, 0.6, 1.0], [2.05, 1.75, -0.4, 0.9], [2.3, -0.55, 0.8, 1.05], [-2.3, -1.2, -0.3, 0.85],
    [1.35, -2.25, 1.1, 0.8], [-1.05, 2.3, -1.0, 0.75], [-0.2, -2.45, -1.3, 0.7],
  ];
  const coins = coinSpots.map(([x, y, z, s], i) => {
    const mesh = makeCoin();
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(s);
    mesh.rotation.set(0.3 * Math.sin(i * 2.1), i, 0.25 * Math.cos(i * 1.7));
    scene.add(mesh);
    return { mesh, baseY: y, spin: 0.9 + (i % 3) * 0.45, speed: 0.8 + (i % 4) * 0.2, phase: i * 1.3 };
  });

  // Bills
  const billMat = new THREE.MeshStandardMaterial({
    map: toTexture(billCanvas(), renderer), side: THREE.DoubleSide, roughness: 0.75,
  });
  const billGeo = new THREE.PlaneGeometry(1.15, 0.52);
  const bills = [[-2.45, 0.25, -1.2], [2.55, 0.8, -1.6], [-1.65, -2.1, 0.9], [1.95, 2.45, 0.5]].map(([x, y, z], i) => {
    const mesh = new THREE.Mesh(billGeo, billMat);
    mesh.position.set(x, y, z);
    const rx = 0.4 * (i % 2 ? 1 : -1);
    const rz = 0.5 * (i % 3 ? -1 : 1);
    mesh.rotation.set(rx, 0.3 * i, rz);
    scene.add(mesh);
    return { mesh, baseY: y, rx, rz, speed: 0.9 + i * 0.25, phase: i * 2.2 };
  });

  // Hearts
  const heartGeo = new THREE.ExtrudeGeometry(heartShape(), {
    depth: 0.28, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 4, curveSegments: 18,
  }).center();
  const heartMat = new THREE.MeshPhysicalMaterial({
    color: 0xff2e88, emissive: 0xff2e88, emissiveIntensity: 0.35, roughness: 0.22, metalness: 0.1, clearcoat: 1,
  });
  const hearts = [[-1.95, -0.3, 1.4, 0.3], [2.15, 0.45, 1.6, 0.22], [-0.55, 2.5, 1.2, 0.18]].map(([x, y, z, s], i) => {
    const mesh = new THREE.Mesh(heartGeo, heartMat);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(s);
    mesh.rotation.z = (i - 1) * 0.35;
    scene.add(mesh);
    return { mesh, baseY: y, phase: i * 1.9 };
  });

  /* ---------------------------------------------------------- interaction */
  const pointer = { x: 0, y: 0, inside: false, moved: false };
  const ndc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let flipTarget = 0;
  let flipCurrent = 0;
  let boost = 1;
  const tilt = { x: 0, y: 0 };

  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
  }
  function hitsCard() {
    ndc.set(pointer.x, pointer.y);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(card, true).length > 0;
  }
  container.addEventListener('pointermove', (e) => {
    setPointer(e);
    pointer.inside = true;
    pointer.moved = true;
    if (!running) renderOnce();
  }, { passive: true });
  container.addEventListener('pointerleave', () => {
    pointer.inside = false;
    container.style.cursor = '';
  });
  container.addEventListener('click', (e) => {
    setPointer(e);
    if (hitsCard()) {
      flipTarget += Math.PI;
      if (reducedMotion) { flipCurrent = flipTarget; renderOnce(); }
    }
  });
  document.addEventListener('perk:rain', () => { boost = 7; });

  /* ---------------------------------------------------------------- sizing */
  function fit() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const need = 3.05; // half-extent of the composition in world units
    const dist = Math.max(need / Math.tan(halfFov), need / (Math.tan(halfFov) * camera.aspect));
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  /* ---------------------------------------------------------------- loop */
  let t = 0;
  let last = performance.now();
  let raf = 0;
  let running = false;
  let onScreen = true;

  function update(dt) {
    t += dt;
    boost = 1 + (boost - 1) * Math.exp(-dt * 1.1);
    const k = 1 - Math.exp(-dt * 4);
    tilt.x += ((pointer.inside ? -pointer.y * 0.28 : 0) - tilt.x) * k;
    tilt.y += ((pointer.inside ? pointer.x * 0.5 : 0) - tilt.y) * k;
    flipCurrent += (flipTarget - flipCurrent) * (1 - Math.exp(-dt * 5));

    card.rotation.set(
      tilt.x + Math.sin(t * 0.7) * 0.05,
      flipCurrent + tilt.y + Math.sin(t * 0.5) * 0.18,
      Math.sin(t * 0.4) * 0.03,
    );
    card.position.y = Math.sin(t * 1.1) * 0.08;

    for (const c of coins) {
      c.mesh.rotation.y += c.spin * dt * boost;
      c.mesh.position.y = c.baseY + Math.sin(t * c.speed + c.phase) * 0.18;
    }
    for (const b of bills) {
      b.mesh.rotation.x = b.rx + Math.sin(t * b.speed + b.phase) * 0.5;
      b.mesh.rotation.z = b.rz + Math.cos(t * b.speed * 0.8 + b.phase) * 0.3;
      b.mesh.position.y = b.baseY + Math.sin(t * 0.6 + b.phase) * 0.2;
    }
    for (const h of hearts) {
      h.mesh.rotation.y += dt * 0.9 * Math.min(boost, 3);
      h.mesh.position.y = h.baseY + Math.sin(t * 1.3 + h.phase) * 0.12;
    }

    if (pointer.moved) {
      pointer.moved = false;
      container.style.cursor = hitsCard() ? 'pointer' : '';
    }
  }

  function renderOnce() {
    renderer.render(scene, camera);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    renderer.render(scene, camera);
  }

  function sync() {
    const should = onScreen && !document.hidden && !reducedMotion;
    if (should && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  new ResizeObserver(() => { fit(); if (!running) renderOnce(); }).observe(canvas);
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); }).observe(container);
  document.addEventListener('visibilitychange', sync);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
    cancelAnimationFrame(raf);
    container.classList.remove('has-3d'); // fall back to the CSS poster
  });

  fit();
  update(0);
  renderOnce();
  sync();
  return true;
}
