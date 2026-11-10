// Peekhole front-end. No dependencies, no build step.
// Security: every value coming from the network is written with textContent (never innerHTML),
// numbers are validated with Number.isFinite, and addresses must match base58 before they are
// put into any URL or iframe src.

import { CONFIG } from './config.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const session = {
  set(key, value) {
    try { sessionStorage.setItem(key, value); } catch { /* storage unavailable: ignore */ }
  },
};

const CA = String(CONFIG.token.contractAddress || '').trim();
const HAS_CA = BASE58.test(CA);
if (CA && !HAS_CA) console.warn('[Peekhole] contractAddress is not a valid Solana address — staying in pre-launch mode.');

/* ------------------------------------------------------------------ toast */
let toastTimer = 0;
function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* --------------------------------------------------------------- age gate */
function initGate() {
  const root = document.documentElement;
  const gate = $('#gate');
  const app = $('#app');

  const params = new URLSearchParams(location.search);
  if (params.get('ref') === 'poster') {
    $('#gate-from').hidden = false;
    // Clean the URL so shared links don't carry the tracking param.
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
    app.inert = false;
    gate.remove();
    $('#main').focus({ preventScroll: true });
    init3D(); // heavy WebGL work only starts once the visitor is actually inside
  }, { once: true });
}

/* -------------------------------------------------------------- hero 3D */
// three.js is code-split: fetched only here, after the gate, when the browser is idle.
// Skipped on data-saver connections; the CSS poster stays as the fallback on any failure.
function init3D() {
  const container = $('#hero-art');
  const canvas = $('#hero-3d');
  if (!container || !canvas) return;
  if (navigator.connection?.saveData) return;

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

/* ------------------------------------------------------------ lineup 3D busts */
// Photos from config first; the optional 3D busts (config.lineup3d) are imported only when the
// lineup gets close to the viewport. SVG illustrations are the default and the fallback.
function initLineup3D() {
  const section = $('#lineup');
  if (!section) return;
  const cards = $$('.creator', section);

  // Optional real images (config.lineup, same order as the cards). Only local files under
  // assets/ are accepted, so config can never point the page at a third-party host.
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
  if (cards.every((card) => card.dataset.photo)) return; // nothing left for WebGL to draw

  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    import('./lineup3d.js')
      .then((m) => m.mountLineup3D({ cards, section, reducedMotion: reducedMotion.matches }))
      .catch((err) => console.warn('[Peekhole] lineup 3D disabled:', err));
  }, { rootMargin: '400px 0px' });
  io.observe(section);
}

/* ------------------------------------------------------------ 3D tilt cards */
function initTilt() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine || reducedMotion.matches) return;
  const MAX = 9; // degrees
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
    if (!frame) frame = requestAnimationFrame(apply); // at most one layout read per frame
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => {
    if (active) reset(active);
    active = null;
  });
}

/* -------------------------------------------------------------- nav (mobile) */
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

/* ------------------------------------------------------- static config bits */
function safeHttpsUrl(template) {
  if (typeof template !== 'string' || !template) return null;
  const href = template.replaceAll('{ca}', encodeURIComponent(CA));
  try {
    const url = new URL(href);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function initConfigBits() {
  // Contract address
  $$('[data-ca]').forEach((el) => { el.textContent = HAS_CA ? CA : 'Drops at launch'; });
  $$('[data-copy-ca]').forEach((btn) => {
    btn.disabled = !HAS_CA;
    btn.addEventListener('click', () => copyCA(btn));
  });

  // Buy / chart / explorer links: only enabled once the CA is valid
  $$('[data-link]').forEach((a) => {
    const href = HAS_CA ? safeHttpsUrl(CONFIG.links[a.dataset.link]) : null;
    if (href) {
      a.href = href;
      a.removeAttribute('aria-disabled');
    } else {
      a.removeAttribute('href');
      a.setAttribute('aria-disabled', 'true');
    }
  });

  // Socials: hidden unless configured with a valid https URL
  $$('[data-social]').forEach((a) => {
    const href = safeHttpsUrl(CONFIG.socials[a.dataset.social]);
    if (href) { a.href = href; a.hidden = false; }
  });

  // Token facts
  const dl = $('#facts');
  for (const [term, value] of CONFIG.token.facts) {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = term;
    dd.textContent = value;
    row.append(dt, dd);
    dl.append(row);
  }

  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
}

async function copyCA(btn) {
  if (!HAS_CA) return;
  try {
    await navigator.clipboard.writeText(CA);
    toast('Contract address copied ♥');
    const label = btn.querySelector('span');
    btn.classList.add('copied');
    if (label) label.textContent = 'Copied';
    setTimeout(() => {
      btn.classList.remove('copied');
      if (label) label.textContent = 'Copy';
    }, 1600);
  } catch {
    toast('Copy failed — select the address and copy it manually');
  }
}

/* ---------------------------------------------------------------- ticker */
function initTicker() {
  const track = $('#ticker-track');
  const group = track.firstElementChild;
  // Second copy makes the -50% marquee loop seamless.
  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.append(clone);
}

/* ----------------------------------------------------------- formatting */
const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2,
});
const intFmt = new Intl.NumberFormat('en-US');
const SUBSCRIPT = '₀₁₂₃₄₅₆₇₈₉';

const num = (v) => {
  const n = typeof v === 'number' ? v : Number.parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
};

// DexScreener-style price: $0.0₄1234 means 0.00001234 (subscript = number of zeros).
function fmtPrice(p) {
  if (!Number.isFinite(p) || p <= 0) return '—';
  if (p >= 1) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
  if (p >= 0.001) return `$${p.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}`;
  let zeros = Math.ceil(-Math.log10(p)) - 1;
  let sig = Math.round(p * 10 ** (zeros + 4));
  if (sig >= 10000) { zeros -= 1; sig = Math.round(sig / 10); }
  const digits = String(sig).replace(/0+$/, '') || '0';
  if (zeros < 4) return `$0.${'0'.repeat(zeros)}${digits}`;
  const sub = String(zeros).split('').map((d) => SUBSCRIPT[Number(d)]).join('');
  return `$0.0${sub}${digits}`;
}
const fmtUsd = (v) => (Number.isFinite(v) ? usdCompact.format(v) : '—');
const fmtInt = (v) => (Number.isFinite(v) ? intFmt.format(v) : '—');

function setField(field, text) {
  $$(`[data-f="${field}"]`).forEach((el) => { el.textContent = text; });
}

function setStatus(state, text) {
  const status = $('#status');
  status.dataset.state = state;
  $('#status-text').textContent = text;
  $$('[data-f="state"]').forEach((el) => {
    el.dataset.state = state;
    el.textContent = state === 'live' ? 'Live' : text;
  });
}

/* ----------------------------------------------------------- market data */
async function fetchJSON(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loadBestPair() {
  const chain = encodeURIComponent(CONFIG.token.chain);
  const data = await fetchJSON(`https://api.dexscreener.com/tokens/v1/${chain}/${CA}`, 8000);
  const pairs = Array.isArray(data) ? data : Array.isArray(data?.pairs) ? data.pairs : [];
  // Our token must be the base token; pick the deepest pool.
  const ours = pairs.filter((p) => p?.baseToken?.address === CA);
  ours.sort((a, b) => (num(b?.liquidity?.usd) || 0) - (num(a?.liquidity?.usd) || 0));
  return ours[0] || null;
}

let chartMounted = false;
function mountChart(pairAddress) {
  if (chartMounted || !BASE58.test(pairAddress)) return;
  chartMounted = true;
  const chain = encodeURIComponent(CONFIG.token.chain);
  const params = 'embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=usd&interval=15';
  const iframe = document.createElement('iframe');
  iframe.src = `https://dexscreener.com/${chain}/${pairAddress}?${params}`;
  iframe.title = '$PEEK price chart (DexScreener)';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
  $('#chart-empty').remove();
  $('#chart').append(iframe);
}

function render(pair) {
  if (!pair) {
    setStatus('waiting', 'Awaiting liquidity');
    return;
  }
  const price = num(pair.priceUsd);
  const change = num(pair?.priceChange?.h24);
  const mcap = num(pair.marketCap ?? pair.fdv);
  const liq = num(pair?.liquidity?.usd);
  const vol = num(pair?.volume?.h24);
  const buys = num(pair?.txns?.h24?.buys);
  const sells = num(pair?.txns?.h24?.sells);

  setField('price', fmtPrice(price));
  setField('mcap', fmtUsd(mcap));
  setField('liq', fmtUsd(liq));
  setField('vol', fmtUsd(vol));
  setField('buys', fmtInt(buys));
  setField('sells', fmtInt(sells));
  setField('updated', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  const changeText = Number.isFinite(change) ? `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%` : '—';
  $$('[data-f="change"]').forEach((el) => {
    el.textContent = changeText;
    el.dataset.dir = !Number.isFinite(change) ? '' : change >= 0 ? 'up' : 'down';
  });

  setStatus('live', 'Live');
  mountChart(String(pair.pairAddress || ''));
}

function initMarket() {
  if (!HAS_CA) {
    $('.ticker').dataset.state = 'prelaunch';
    $$('.ticker [data-f="price"]').forEach((el) => { el.textContent = 'CA drops at launch'; });
    setStatus('prelaunch', 'Pre-launch');
    return;
  }

  const base = Math.max(15_000, Number(CONFIG.refreshMs) || 30_000);
  let failures = 0;
  let timer = 0;
  let inflight = false;
  let lastOk = 0;
  let hasData = false;

  async function tick() {
    clearTimeout(timer);
    if (inflight) return;
    if (document.hidden) return; // resumes on visibilitychange — no polling in background tabs
    inflight = true;
    try {
      const pair = await loadBestPair();
      render(pair);
      hasData = hasData || Boolean(pair);
      failures = 0;
      lastOk = Date.now();
    } catch {
      failures += 1;
      if (hasData) setStatus('stale', 'Reconnecting');
    } finally {
      inflight = false;
    }
    // Exponential backoff with jitter on failure, capped at 5 minutes.
    const delay = failures ? Math.min(base * 2 ** failures, 300_000) : base;
    timer = setTimeout(tick, delay + Math.random() * 2000);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastOk >= base) tick();
  });
  tick();
}

/* --------------------------------------------------------------- countdown */
function initCountdown() {
  const el = $('#countdown');
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
      return;
    }
    el.dataset.live = '';
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

/* -------------------------------------------------------------- make it rain */
function initRain() {
  const canvas = $('#rain');
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

  // Pre-render each particle type once; drawImage per frame is far cheaper than paths + text.
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
      const flip = 0.3 + 0.7 * Math.abs(Math.cos(p.sway * 1.4)); // paper flutter
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

  function makeItRain() {
    document.dispatchEvent(new CustomEvent('perk:rain')); // 3D coins spin up too
    if (reducedMotion.matches) { toast('💸 You made it rain'); return; }
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

/* ------------------------------------------------------------- scroll reveal */
function initReveal() {
  const items = $$('.reveal');
  if (!('IntersectionObserver' in window) || reducedMotion.matches) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  items.forEach((el) => io.observe(el));
}

/* -------------------------------------------------------------------- boot */
function boot() {
  $('#main').tabIndex = -1;
  initGate();
  initNav();
  initConfigBits();
  initTicker();
  initMarket();
  initCountdown();
  initRain();
  initReveal();
  initTilt();
}

boot();
