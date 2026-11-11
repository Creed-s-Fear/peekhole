import { CONFIG } from './config.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const session = {
  set(key, value) {
    try { sessionStorage.setItem(key, value); } catch { /* private mode */ }
  },
};

/* toast */
let toastTimer = 0;
function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* age gate */
function initGate() {
  const root = document.documentElement;
  const gate = $('#gate');
  const app = $('#app');

  const params = new URLSearchParams(location.search);
  if (params.get('ref') === 'poster') {
    $('#gate-from').hidden = false;
    params.delete('ref');
    const qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
  }

  if (root.classList.contains('age-ok')) {
    gate.remove();
    init3D();
    return;
  }

  app.inert = true;
  const enter = $('#gate-enter');
  enter.focus();
  enter.addEventListener('click', () => {
    session.set('ph_age_ok', '1');
    root.classList.add('age-ok');
    gate.classList.add('gate-leaving');
    app.inert = false;
    app.classList.add('app-entering');
    init3D();
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      gate.remove();
      app.classList.remove('app-entering');
      $('#main').focus({ preventScroll: true });
    };
    gate.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 450);
  }, { once: true });
}

/* hero 3D */
function init3D() {
  const container = $('#hero-art');
  const canvas = $('#hero-3d');
  if (!container || !canvas) return;
  if (window.innerWidth < 768 || navigator.connection?.saveData) return;

  const start = () => {
    import('./scene3d.js')
      .then((m) => m.mountHero3D({ canvas, container, reducedMotion: reducedMotion.matches }))
      .then((ok) => { if (ok) container.classList.add('has-3d'); })
      .catch((err) => console.warn('[Peekhole] 3D scene disabled:', err));
  };
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 });
  else setTimeout(start, 200);
  initLineup3D();
}

/* lineup */
function initLineup3D() {
  const section = $('#lineup');
  if (!section) return;
  const cards = $$('.creator', section);

  const LOCAL_IMAGE = /^assets\/[\w\-./]+\.(?:webp|avif|jpe?g|png)$/i;
  cards.forEach((card, i) => {
    const entry = CONFIG.lineup?.[i];
    const img = card.querySelector('.creator-photo');
    if (!entry?.photo || !img || !LOCAL_IMAGE.test(entry.photo) || entry.photo.includes('..')) return;
    img.src = entry.photo;
    if (entry.alt) img.alt = entry.alt;
    img.classList.add('is-photo');
    if (/^\d{1,3}% \d{1,3}%$/.test(entry.position || '')) img.style.objectPosition = entry.position;
    card.dataset.photo = '1';
  });
  if (!CONFIG.lineup3d || !('IntersectionObserver' in window)) return;
  if (cards.every((card) => card.dataset.photo)) return;

  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    import('./lineup3d.js')
      .then((m) => m.mountLineup3D({ cards, section, reducedMotion: reducedMotion.matches }))
      .catch((err) => console.warn('[Peekhole] lineup 3D disabled:', err));
  }, { rootMargin: '400px 0px' });
  io.observe(section);
}

/* tilt cards */
function initTilt() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine || reducedMotion.matches) return;
  const MAX = 9;
  let active = null;
  let lastEvent = null;
  let frame = 0;

  const reset = (el) => {
    el.classList.remove('tilting');
    for (const p of ['--rx', '--ry', '--mx', '--my']) el.style.removeProperty(p);
  };
  const apply = () => {
    frame = 0;
    if (!active || !lastEvent) return;
    const r = active.getBoundingClientRect();
    const px = Math.min(Math.max((lastEvent.clientX - r.left) / r.width, 0), 1);
    const py = Math.min(Math.max((lastEvent.clientY - r.top) / r.height, 0), 1);
    active.classList.add('tilting');
    active.style.setProperty('--ry', `${((px - 0.5) * 2 * MAX).toFixed(2)}deg`);
    active.style.setProperty('--rx', `${(-(py - 0.5) * 2 * MAX).toFixed(2)}deg`);
    active.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    active.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  };

  document.addEventListener('pointermove', (e) => {
    const el = e.target instanceof Element ? e.target.closest('.tilt') : null;
    if (active && active !== el) reset(active);
    active = el;
    if (!el) return;
    lastEvent = e;
    if (!frame) frame = requestAnimationFrame(apply);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => {
    if (active) reset(active);
    active = null;
  });
}

/* nav */
function initNav() {
  const nav = $('#nav');
  const btn = $('#nav-toggle');
  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); btn.focus(); }
  });
}

/* header scroll */
function initHeaderScroll() {
  const header = $('header');
  if (!header) return;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('header-scrolled', window.scrollY > 40);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* nav highlight */
function initNavHighlight() {
  $$('#nav a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      const id = link.getAttribute('href')?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      const heading = target.querySelector('h2, h3') || target;
      setTimeout(() => {
        heading.classList.add('section-highlight');
        setTimeout(() => heading.classList.remove('section-highlight'), 800);
      }, 500);
    });
  });
}

/* config */
function safeHttpsUrl(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function initConfigBits() {
  $$('[data-social]').forEach((a) => {
    const href = safeHttpsUrl(CONFIG.socials[a.dataset.social]);
    if (href) { a.href = href; a.hidden = false; }
  });

  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
}

/* ticker */
function initTicker() {
  const track = $('#ticker-track');
  if (!track) return;
  const group = track.firstElementChild;
  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.append(clone);
}

/* countdown */
function initCountdown() {
  const el = $('#countdown');
  if (!el) return;
  el.classList.add('countdown-digits');
  const { weekday, hour, durationHours, timeZone } = CONFIG.event;
  const DAY = 86_400;
  const WEEK = 7 * DAY;
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
    });
  } catch {
    el.textContent = 'Mondays · 10PM';
    return;
  }

  const pad = (n) => String(n).padStart(2, '0');

  function update() {
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
    const now = WD[parts.weekday] * DAY + Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second);
    const start = weekday * DAY + hour * 3600;
    const sinceStart = (((now - start) % WEEK) + WEEK) % WEEK;
    if (sinceStart < durationHours * 3600) {
      el.textContent = 'Doors are open';
      el.dataset.live = '1';
      el.classList.add('countdown-live');
      return;
    }
    el.dataset.live = '';
    el.classList.remove('countdown-live');
    const left = WEEK - sinceStart;
    const d = Math.floor(left / DAY);
    const h = Math.floor((left % DAY) / 3600);
    const m = Math.floor((left % 3600) / 60);
    const s = left % 60;
    el.textContent = `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  }

  update();
  setInterval(() => { if (!document.hidden) update(); }, 1000);
}

/* make it rain */
function initRain() {
  const canvas = $('#rain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const MAX = 360;
  let particles = [];
  let raf = 0;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let sprites = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  function makeSprite(w, h, paint) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * 2);
    c.height = Math.ceil(h * 2);
    const g = c.getContext('2d');
    g.scale(2, 2);
    paint(g, w, h);
    return { img: c, w, h };
  }
  const rrect = (g, x, y, w, h, r) => {
    g.beginPath();
    if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h);
  };
  function buildSprites() {
    const bill = makeSprite(46, 22, (g, w, h) => {
      g.fillStyle = '#2f9e5b';
      rrect(g, 0.5, 0.5, w - 1, h - 1, 3); g.fill();
      g.strokeStyle = '#1d6b3c'; g.lineWidth = 1.2;
      rrect(g, 3, 3, w - 6, h - 6, 2); g.stroke();
      g.fillStyle = '#d9f5e3';
      g.beginPath(); g.ellipse(w / 2, h / 2, 6.5, 6.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1d6b3c'; g.font = '700 11px Inter, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('$', w / 2, h / 2 + 0.5);
    });
    const heart = makeSprite(22, 20, (g) => {
      g.fillStyle = '#ff2e88';
      g.beginPath();
      g.moveTo(11, 19);
      g.bezierCurveTo(-6, 8, 4, -4, 11, 5);
      g.bezierCurveTo(18, -4, 28, 8, 11, 19);
      g.fill();
    });
    const coin = makeSprite(24, 24, (g, w) => {
      const r = w / 2;
      const grad = g.createRadialGradient(r - 3, r - 3, 2, r, r, r);
      grad.addColorStop(0, '#fff1b8'); grad.addColorStop(1, '#e6a800');
      g.fillStyle = grad;
      g.beginPath(); g.arc(r, r, r - 0.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#8a5a00'; g.font = '700 13px "Bebas Neue", Impact, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('P', r, r + 1);
    });
    return [bill, bill, bill, coin, heart];
  }

  function spawn(count) {
    const room = Math.max(0, MAX - particles.length);
    for (let i = 0; i < Math.min(count, room); i += 1) {
      particles.push({
        x: Math.random() * W,
        y: -30 - Math.random() * H * 0.7,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 1.2 + Math.random() * 2.2,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.09,
        sway: Math.random() * Math.PI * 2,
        scale: 0.75 + Math.random() * 0.6,
        sprite: sprites[Math.floor(Math.random() * sprites.length)],
      });
    }
  }

  function frame() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const next = [];
    for (const p of particles) {
      p.sway += 0.035;
      p.x += p.vx + Math.sin(p.sway) * 0.7;
      p.y += p.vy;
      p.vy = Math.min(p.vy + 0.015, 4.5);
      p.rot += p.vr;
      if (p.y > H + 40) continue;
      next.push(p);
      const flip = 0.3 + 0.7 * Math.abs(Math.cos(p.sway * 1.4));
      const cos = Math.cos(p.rot) * p.scale * dpr;
      const sin = Math.sin(p.rot) * p.scale * dpr;
      ctx.setTransform(cos, sin, -sin * flip, cos * flip, p.x * dpr, p.y * dpr);
      const { img, w, h } = p.sprite;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    }
    particles = next;
    if (particles.length) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  const rainMessages = [
    '\u{1F4B8} Make it rain!',
    '\u{1F4B8} The ceiling just got expensive',
    '\u{1F4B8} Monday energy',
    '\u{1F4B8} VIP treatment',
    '\u{1F4B8} That\'s how Vice City tips',
  ];

  const rainFlash = document.createElement('div');
  rainFlash.className = 'rain-flash';
  rainFlash.setAttribute('aria-hidden', 'true');
  document.body.appendChild(rainFlash);

  function makeItRain() {
    document.dispatchEvent(new CustomEvent('peekhole:rain'));
    const msg = rainMessages[Math.floor(Math.random() * rainMessages.length)];
    if (reducedMotion.matches) { toast(msg); return; }
    rainFlash.classList.remove('flash-active');
    void rainFlash.offsetWidth;
    rainFlash.classList.add('flash-active');
    toast(msg);
    if (!sprites) sprites = buildSprites();
    if (!raf) resize();
    spawn(Math.round(Math.min(160, 60 + W / 8)));
    if (!raf) raf = requestAnimationFrame(frame);
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (raf) resize(); }, 120);
  }, { passive: true });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-rain]')) makeItRain();
  });
}

/* scroll reveal */
function initReveal() {
  const items = $$('.reveal');
  if (!('IntersectionObserver' in window) || reducedMotion.matches) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting);
    visible.forEach((entry, i) => {
      entry.target.style.transitionDelay = `${i * 90}ms`;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
      entry.target.addEventListener('transitionend', () => {
        entry.target.style.transitionDelay = '';
      }, { once: true });
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  items.forEach((el) => io.observe(el));
}

/* touch feedback */
function initTouchFeedback() {
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.addEventListener('touchstart', (e) => {
    const btn = e.target instanceof Element ? e.target.closest('button, .btn, [data-rain]') : null;
    if (btn) btn.classList.add('touch-active');
  }, { passive: true });
  const clearTouch = () => {
    $$('.touch-active').forEach((el) => el.classList.remove('touch-active'));
  };
  document.addEventListener('touchend', clearTouch, { passive: true });
  document.addEventListener('touchcancel', clearTouch, { passive: true });
}

/* boot */
function boot() {
  $('#main').tabIndex = -1;
  initGate();
  initNav();
  initHeaderScroll();
  initNavHighlight();
  initConfigBits();
  initTicker();
  initCountdown();
  initRain();
  initReveal();
  initTilt();
  initTouchFeedback();
}

boot();
