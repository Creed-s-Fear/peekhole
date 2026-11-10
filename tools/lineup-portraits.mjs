// Generates the four ORIGINAL lineup portraits as static SVGs (site/assets/lineup/*.svg).
// Style: bold ink outlines + flat cel shading + neon backgrounds. Bust portraits, tasteful.
// Run: node tools/lineup-portraits.mjs
// Shared geometry lives here so all four read as one set; each character only overrides
// colours, hair, outfit, accessories and background.

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT_DIR = fileURLToPath(new URL('../site/assets/lineup/', import.meta.url));
const INK = '#1a0b12';
const HEART_D = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

/* ------------------------------------------------------------------ helpers */
const mirrorX = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${400 - Number(x)} ${y}`);

function heart(cx, cy, w, attrs) {
  const s = w / 20;
  return `<path d="${HEART_D}" transform="translate(${(cx - 12 * s).toFixed(2)} ${(cy - 12.2 * s).toFixed(2)}) scale(${s.toFixed(3)})" vector-effect="non-scaling-stroke" ${attrs}/>`;
}

// Outlined silhouette from overlapping circles (curly hair, fur): stroked pass, then fill pass.
function blob(circles, fill, strokeW = 6) {
  const s = circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
  return `<g fill="${fill}" stroke="${INK}" stroke-width="${strokeW}">${s}</g><g fill="${fill}">${s}</g>`;
}

function sparkle(x, y, r, fill = '#fff', op = 0.9) {
  const k = r / 4;
  return `<path d="M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z" fill="${fill}" opacity="${op}"/>`;
}

function hoops(r, color = '#ffc94a') {
  return [137, 263].map((x) => `
    <circle cx="${x}" cy="${196 + r}" r="${r}" fill="none" stroke="${INK}" stroke-width="7"/>
    <circle cx="${x}" cy="${196 + r}" r="${r}" fill="none" stroke="${color}" stroke-width="3.5"/>`).join('');
}

function beadsAlong(x0, y0, cx, cy, x1, y1, n, r, fill, stroke) {
  let out = '';
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t ** 2 * x1;
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t ** 2 * y1;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
  }
  return out;
}

/* ------------------------------------------------------------- shared body */
const FACE = 'M200 96 C246 96 268 128 266 170 C265 204 250 230 228 247 C216 256 206 260 200 260 C194 260 184 256 172 247 C150 230 135 204 134 170 C132 128 154 96 200 96 Z';
const FACE_SHADE = 'M200 96 C154 96 132 128 134 170 C135 204 150 230 172 247 C184 256 194 260 200 260 C176 246 158 222 154 186 C150 146 166 112 200 96 Z';

// Head parts are drawn inside <g transform="translate(0 HEAD_DY)"> so the neck reads shorter.
const HEAD_DY = 12;

const body = (s) => `
  <path d="M52 440 C56 372 104 326 170 308 L230 308 C296 326 344 372 348 440 Z" fill="${s.base}" stroke="${INK}" stroke-width="3"/>
  <path d="M52 440 C56 372 104 326 170 308 L176 318 C126 336 92 374 86 440 Z" fill="${s.shade}" opacity=".5"/>
  <path d="M52 440 C56 372 104 326 170 308 L176 318 C126 336 92 374 86 440 Z" fill="url(#ink)" opacity=".16"/>
  <path d="M150 342 Q174 352 192 344 M208 344 Q226 352 250 342" fill="none" stroke="${s.shade}" stroke-width="3" stroke-linecap="round"/>`;

const neck = (s) => `
  <path d="M176 236 L224 236 L230 314 C214 324 186 324 170 314 Z" fill="${s.base}"/>
  <path d="M176 250 C190 274 210 274 224 250 L227 286 C210 296 190 296 173 286 Z" fill="${s.shade}" opacity=".8"/>
  <path d="M176 250 C190 274 210 274 224 250 L227 286 C210 296 190 296 173 286 Z" fill="url(#ink)" opacity=".2"/>
  <path d="M176 236 L170 314 M224 236 L230 314" fill="none" stroke="${INK}" stroke-width="3"/>`;

const face = (s, rim) => `
  <ellipse cx="137" cy="182" rx="10" ry="17" fill="${s.base}" stroke="${INK}" stroke-width="3"/>
  <ellipse cx="263" cy="182" rx="10" ry="17" fill="${s.base}" stroke="${INK}" stroke-width="3"/>
  <path d="${FACE}" fill="${s.base}" stroke="${INK}" stroke-width="3"/>
  <path d="${FACE_SHADE}" fill="${s.shade}" opacity=".55"/>
  <path d="${FACE_SHADE}" fill="url(#ink)" opacity=".16"/>
  <path d="M138 160 C150 128 176 112 200 110 C226 112 252 128 262 160 C250 140 228 128 200 126 C172 128 150 140 138 160 Z" fill="${s.shade}" opacity=".55"/>
  <path d="M263 176 C259 204 247 226 229 242 C239 222 247 200 251 180 Z" fill="${s.shade}" opacity=".5"/>
  <path d="M146 190 Q152 214 170 232" fill="none" stroke="${s.shade}" stroke-width="3" stroke-linecap="round" opacity=".8"/>
  <path d="M234 106 C258 118 270 142 266 172 C264 200 252 226 232 244" fill="none" stroke="${rim}" stroke-width="5" stroke-linecap="round" opacity=".9"/>
  <ellipse cx="160" cy="204" rx="15" ry="8" fill="${s.blush}" opacity=".32"/>
  <ellipse cx="240" cy="204" rx="15" ry="8" fill="${s.blush}" opacity=".32"/>
  <path d="M203 176 Q207 196 211 205 Q205 211 196 208" fill="none" stroke="${s.dark}" stroke-width="2.5" stroke-linecap="round"/>`;

function eye(cx, side, o) {
  const id = side < 0 ? 'eyeL' : 'eyeR';
  const white = `M${cx - 17} 168 Q${cx} 155 ${cx + 17} 168 Q${cx} 179 ${cx - 17} 168 Z`;
  const outer = side < 0 ? cx - 19 : cx + 19;
  const wing = side < 0 ? cx - 28 : cx + 28;
  return `
  <path d="M${cx - 21} 166 Q${cx} 140 ${cx + 21} 164 Q${cx} 152 ${cx - 21} 166 Z" fill="${o.shadow}" opacity=".8"/>
  <clipPath id="${id}"><path d="${white}"/></clipPath>
  <path d="${white}" fill="#fff8f4"/>
  <g clip-path="url(#${id})">
    <circle cx="${cx + 1}" cy="168" r="7" fill="${o.iris}"/>
    <circle cx="${cx + 1}" cy="168" r="3.2" fill="${INK}"/>
    <circle cx="${cx + 3.5}" cy="165.5" r="1.8" fill="#fff"/>
  </g>
  <path d="M${cx - 19} 167 Q${cx} 151 ${cx + 19} 166" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M${outer} 166.5 L${wing} 160" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M${cx - 14} 172 Q${cx} 179 ${cx + 14} 172" fill="none" stroke="${o.lower}" stroke-width="1.6" stroke-linecap="round"/>`;
}

const brows = (c) => `<path d="M150 150 Q168 135 190 145 M210 145 Q232 135 250 150" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;

function lips(o) {
  const rc = o.smirk ? '224 222' : '222 226';
  return `
  <path d="M178 226 Q200 247 ${rc} Q200 233 178 226 Z" fill="${o.lip}" stroke="${INK}" stroke-width="2"/>
  <path d="M178 226 Q189 215 200 220 Q211 215 ${rc} Q200 231 178 226 Z" fill="${o.lipDark}" stroke="${INK}" stroke-width="2"/>
  <ellipse cx="206" cy="235" rx="6" ry="2.4" fill="#fff" opacity=".5"/>`;
}

function portrait(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" width="400" height="440" role="img" aria-label="${p.title}">
<title>${p.title}</title>
<defs>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
  <pattern id="dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.5" fill="#fff"/></pattern>
  <pattern id="ink" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.15" fill="${INK}"/></pattern>
  <radialGradient id="vig" cx="50%" cy="42%" r="72%"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
  ${p.defs || ''}
</defs>
${p.background}
<rect width="400" height="440" fill="url(#dots)" opacity=".07"/>
<g transform="translate(0 ${HEAD_DY})">${p.backHair}</g>
${body(p.skin)}
${p.outfit}
${neck(p.skin)}
${p.outfitFront || ''}
<g transform="translate(0 ${HEAD_DY})">
${face(p.skin, p.rim)}
${eye(172, -1, p.eye)}${eye(228, 1, p.eye)}
${brows(p.brow)}
${lips(p.lips)}
${p.details || ''}
${p.frontHair}
${p.accessories || ''}
</g>
<rect width="400" height="440" fill="url(#vig)"/>
</svg>
`;
}

/* ------------------------------------------------------------ the lineup */
const cherry = (() => {
  const skin = { base: '#f2c4a8', shade: '#d9967a', dark: '#b06a52', blush: '#ff6f91' };
  const hair = { base: '#b0123a', shade: '#7a0a28', light: '#ff5a7a' };
  const curls = [[200, 118, 98], [118, 150, 62], [282, 150, 62], [104, 226, 58], [296, 226, 58], [112, 298, 50], [290, 298, 50], [150, 86, 52], [252, 86, 52], [200, 64, 52], [130, 345, 38], [272, 345, 38]];
  const curlMarks = 'M120 130 q12 -16 26 -4 M262 136 q12 -16 26 -4 M92 220 q12 -16 26 -4 M284 226 q12 -16 26 -4 M104 292 q12 -16 26 -4 M278 296 q12 -16 26 -4 M156 66 q12 -16 26 -4 M220 60 q12 -16 26 -4';
  const fur = [[70, 404, 36], [98, 370, 28], [114, 424, 30], [84, 440, 30], [56, 440, 30], [126, 352, 20]];
  const TOP = 'M116 440 L124 370 Q162 386 200 388 Q238 386 276 370 L284 440 Z';
  let sequins = '';
  for (let y = 374; y < 440; y += 9) for (let x = 118 + ((y / 9) % 2) * 4.5; x < 284; x += 9) sequins += `<circle cx="${x}" cy="${y}" r="2.1"/>`;
  return {
    file: 'cherry-vice.svg',
    title: 'Cherry Vice, headliner — original illustration',
    skin, rim: '#ffd1e6',
    eye: { iris: '#5a2a1a', shadow: '#ff4fa0', lower: skin.dark },
    brow: hair.shade,
    lips: { lip: '#e8264f', lipDark: '#a8143a', smirk: true },
    defs: `
      <radialGradient id="bg" cx="50%" cy="32%" r="78%"><stop offset="0" stop-color="#ff5fa2"/><stop offset=".55" stop-color="#b0126a"/><stop offset="1" stop-color="#3a0a4a"/></radialGradient>
      <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="lens" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff2e88"/><stop offset="1" stop-color="#ff9ccf"/></linearGradient>
      <clipPath id="top"><path d="${TOP}"/></clipPath>`,
    background: `
      <rect width="400" height="440" fill="url(#bg)"/>
      <path d="M168 0 L232 0 L340 440 L60 440 Z" fill="url(#beam)" opacity=".35"/>
      <g filter="url(#glow)">${heart(200, 214, 390, 'fill="none" stroke="#ff9ccf" stroke-width="5"')}</g>
      ${sparkle(58, 70, 12)}${sparkle(344, 110, 9)}${sparkle(330, 40, 6)}${sparkle(40, 180, 6)}`,
    backHair: `${blob(curls, hair.base)}
      <path d="${curlMarks}" fill="none" stroke="${hair.shade}" stroke-width="4" stroke-linecap="round"/>
      <path d="${curlMarks}" transform="translate(4 -6)" fill="none" stroke="${hair.light}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`,
    outfit: `
      <path d="${TOP}" fill="#e8264f" stroke="${INK}" stroke-width="3"/>
      <g clip-path="url(#top)" fill="#ffb3c6" opacity=".55">${sequins}</g>
      <path d="M140 374 L160 316 M260 374 L240 316" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M140 374 L160 316 M260 374 L240 316" stroke="#e8264f" stroke-width="4" stroke-linecap="round"/>
      ${blob(fur, '#fff0f6', 5)}${blob(fur.map(([x, y, r]) => [400 - x, y, r]), '#fff0f6', 5)}
      <g fill="#f3c6da">${fur.map(([x, y, r]) => `<circle cx="${x - r * 0.3}" cy="${y + r * 0.3}" r="${r * 0.45}"/><circle cx="${400 - x + r * 0.3}" cy="${y + r * 0.3}" r="${r * 0.45}"/>`).join('')}</g>
      <path d="M168 314 Q200 346 232 314" fill="none" stroke="#ffc94a" stroke-width="2.5"/>
      ${heart(200, 349, 16, `fill="#ffc94a" stroke="${INK}" stroke-width="2"`)}`,
    frontHair: `
      <path d="M134 172 C124 108 162 70 208 72 C256 74 282 114 268 170 C262 140 246 120 222 114 C206 132 178 142 156 150 C146 156 139 164 134 172 Z" fill="${hair.base}" stroke="${INK}" stroke-width="3"/>
      <path d="M222 114 Q214 128 196 136 M210 80 Q190 100 186 124" fill="none" stroke="${hair.shade}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M166 96 Q200 82 238 94" fill="none" stroke="${hair.light}" stroke-width="4" stroke-linecap="round" opacity=".85"/>`,
    accessories: `
      ${hoops(16)}
      <path d="M147 164 L136 172 M253 164 L264 172" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M147 164 L136 172 M253 164 L264 172" stroke="#ff2e88" stroke-width="3" stroke-linecap="round"/>
      ${heart(171, 172, 54, `fill="url(#lens)" fill-opacity=".9" stroke="${INK}" stroke-width="7"`)}
      ${heart(229, 172, 54, `fill="url(#lens)" fill-opacity=".9" stroke="${INK}" stroke-width="7"`)}
      ${heart(171, 172, 54, 'fill="none" stroke="#ff2e88" stroke-width="3.5"')}
      ${heart(229, 172, 54, 'fill="none" stroke="#ff2e88" stroke-width="3.5"')}
      <path d="M195 166 Q200 159 205 166" fill="none" stroke="#ff2e88" stroke-width="4" stroke-linecap="round"/>
      <path d="M155 160 q6 -7 13 -4 M213 160 q6 -7 13 -4" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".85"/>`,
  };
})();

const roxy = (() => {
  const skin = { base: '#d9a07a', shade: '#b77a55', dark: '#8f5636', blush: '#ff8a7a' };
  const hair = { base: '#f2c35b', shade: '#c98f2e', light: '#fff0b8' };
  const LEFT_SHIRT = 'M52 440 C56 372 104 326 166 308 L150 350 L132 440 Z';
  const LEFT_COLLAR = 'M166 308 L178 298 L170 346 L150 350 Z';
  const leaves = [[80, 410, -30], [110, 384, 20], [72, 372, 40], [122, 430, -10], [96, 438, 60]];
  const LEFT_LOCK = 'M200 100 C168 104 144 128 136 172 C130 220 140 270 128 320 C122 350 130 386 152 398 C146 366 156 330 158 290 C160 240 148 200 152 160 C160 128 180 110 200 100 Z';
  return {
    file: 'roxy-keys.svg',
    title: 'Roxy Keys, Leonida Keys — original illustration',
    skin, rim: '#ffe0b0',
    eye: { iris: '#2f7f6f', shadow: '#ff9a6b', lower: skin.dark },
    brow: hair.shade,
    lips: { lip: '#e8616f', lipDark: '#c44a5a', smirk: false },
    defs: `
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2380"/><stop offset=".42" stop-color="#ff2e88"/><stop offset=".78" stop-color="#ff9a4d"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>
      <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#ff5f6d"/></linearGradient>
      <linearGradient id="aviator" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2be4d4"/><stop offset="1" stop-color="#ff9a4d"/></linearGradient>
      <clipPath id="shirt"><path d="${LEFT_SHIRT}"/><path d="${mirrorX(LEFT_SHIRT)}"/></clipPath>`,
    background: `
      <rect width="400" height="440" fill="url(#sky)"/>
      <circle cx="200" cy="300" r="150" fill="url(#sun)"/>
      <g fill="#ff8a5a">${[318, 340, 360, 378, 394].map((y, i) => `<rect x="40" y="${y}" width="320" height="${3 + i * 1.6}"/>`).join('')}</g>
      <path d="M44 440 C52 360 62 282 94 204" fill="none" stroke="#2a0f2e" stroke-width="14" stroke-linecap="round"/>
      <g fill="#2a0f2e">
        <path d="M94 204 C62 182 30 190 8 218 C40 198 66 198 94 204 Z"/>
        <path d="M94 204 C80 170 54 156 24 162 C58 168 78 182 94 204 Z"/>
        <path d="M94 204 C104 168 132 150 162 154 C130 164 110 182 94 204 Z"/>
        <path d="M94 204 C126 196 152 210 166 238 C140 220 118 212 94 204 Z"/>
        <path d="M94 204 C84 226 62 246 40 250 C62 236 80 222 94 204 Z"/>
      </g>
      ${sparkle(340, 60, 8)}${sparkle(300, 30, 5)}`,
    backHair: `
      <path d="M200 70 C122 70 96 138 100 218 C103 286 82 338 98 398 C112 424 146 414 152 380 C158 344 150 300 158 262 L242 262 C250 300 242 344 248 380 C254 414 288 424 302 398 C318 338 297 286 300 218 C304 138 278 70 200 70 Z" fill="${hair.base}" stroke="${INK}" stroke-width="3"/>
      <path d="M112 240 Q124 290 108 340 M288 240 Q276 290 292 340" fill="none" stroke="${hair.shade}" stroke-width="3" stroke-linecap="round"/>`,
    outfit: `
      <path d="M128 440 L134 362 Q200 382 266 362 L272 440 Z" fill="#fff8f0" stroke="${INK}" stroke-width="3"/>
      <path d="M146 364 L162 314 M254 364 L238 314" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M146 364 L162 314 M254 364 L238 314" stroke="#fff8f0" stroke-width="4" stroke-linecap="round"/>
      <path d="${LEFT_SHIRT}" fill="#1fb5a5" stroke="${INK}" stroke-width="3"/>
      <path d="${mirrorX(LEFT_SHIRT)}" fill="#1fb5a5" stroke="${INK}" stroke-width="3"/>
      <g clip-path="url(#shirt)">
        ${leaves.map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="13" ry="5" transform="rotate(${a} ${x} ${y})" fill="#ffe39a" opacity=".8"/><ellipse cx="${400 - x}" cy="${y}" rx="13" ry="5" transform="rotate(${-a} ${400 - x} ${y})" fill="#ffe39a" opacity=".8"/>`).join('')}
        ${[[92, 396], [66, 430], [128, 404], [308, 396], [334, 430], [272, 404]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#ff5f9e"/>`).join('')}
      </g>
      <path d="${LEFT_COLLAR}" fill="#18978a" stroke="${INK}" stroke-width="2.5"/>
      <path d="${mirrorX(LEFT_COLLAR)}" fill="#18978a" stroke="${INK}" stroke-width="2.5"/>
      ${beadsAlong(172, 318, 200, 346, 228, 318, 10, 2.6, '#fff8f0', '#c9b8a8')}`,
    details: `<g fill="${skin.dark}" opacity=".55">${[[184, 196], [190, 201], [178, 202], [216, 196], [210, 201], [222, 202], [200, 190]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g>`,
    frontHair: `
      <path d="M134 172 C126 110 160 76 200 76 C240 76 274 110 266 172 C256 128 232 104 200 100 C168 104 144 128 134 172 Z" fill="${hair.base}" stroke="${INK}" stroke-width="3"/>
      <path d="${LEFT_LOCK}" fill="${hair.base}" stroke="${INK}" stroke-width="3"/>
      <path d="${mirrorX(LEFT_LOCK)}" fill="${hair.base}" stroke="${INK}" stroke-width="3"/>
      <path d="M144 200 Q140 260 136 320 M256 200 Q260 260 264 320" fill="none" stroke="${hair.shade}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M160 108 Q198 88 240 104" fill="none" stroke="${hair.light}" stroke-width="4" stroke-linecap="round" opacity=".9"/>`,
    accessories: `
      <ellipse cx="176" cy="96" rx="23" ry="15" transform="rotate(-8 176 96)" fill="url(#aviator)" stroke="${INK}" stroke-width="6"/>
      <ellipse cx="224" cy="96" rx="23" ry="15" transform="rotate(8 224 96)" fill="url(#aviator)" stroke="${INK}" stroke-width="6"/>
      <ellipse cx="176" cy="96" rx="23" ry="15" transform="rotate(-8 176 96)" fill="none" stroke="#ffc94a" stroke-width="2.5"/>
      <ellipse cx="224" cy="96" rx="23" ry="15" transform="rotate(8 224 96)" fill="none" stroke="#ffc94a" stroke-width="2.5"/>
      <path d="M197 90 Q200 86 203 90" fill="none" stroke="#ffc94a" stroke-width="3"/>
      <path d="M164 90 q6 -5 12 -3 M212 90 q6 -5 12 -3" fill="none" stroke="#fff" stroke-width="2" opacity=".8" stroke-linecap="round"/>
      ${sparkle(137, 202, 6, '#ffc94a', 1)}${sparkle(263, 202, 6, '#ffc94a', 1)}`,
  };
})();

const nina = (() => {
  const skin = { base: '#8a5236', shade: '#6a3a24', dark: '#4a2414', blush: '#d0607a' };
  const hair = { base: '#7b3fe4', shade: '#4b1fa0', light: '#c9a2ff' };
  const LEFT_JACKET = 'M52 440 C56 372 104 326 164 306 L178 336 L156 440 Z';
  const COLLAR = 'M162 302 Q200 322 238 302 L244 322 Q200 346 156 322 Z';
  let ribs = '';
  for (let x = 160; x <= 240; x += 7) ribs += `M${x} 300 L${x} 346 `;
  const gridV = Array.from({ length: 13 }, (_, i) => `M200 300 L${200 + (i - 6) * 70} 440`).join(' ');
  return {
    file: 'neon-nina.svg',
    title: 'Neon Nina, late set — original illustration',
    skin, rim: '#2be4d4',
    eye: { iris: '#3a2010', shadow: '#b06cff', lower: skin.dark },
    brow: '#2a1220',
    lips: { lip: '#b0407a', lipDark: '#7a2050', smirk: true },
    defs: `
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0f3a"/><stop offset=".6" stop-color="#3a1670"/><stop offset="1" stop-color="#0b0820"/></linearGradient>
      <linearGradient id="holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b06cff"/><stop offset=".5" stop-color="#2be4d4"/><stop offset="1" stop-color="#ff6fb1"/></linearGradient>
      <clipPath id="collar"><path d="${COLLAR}"/></clipPath>`,
    background: `
      <rect width="400" height="440" fill="url(#bg)"/>
      <path d="${gridV} M0 320 L400 320 M0 346 L400 346 M0 378 L400 378 M0 416 L400 416" stroke="#ff2e88" stroke-width="2" opacity=".45"/>
      <circle cx="200" cy="178" r="150" fill="none" stroke="#2be4d4" stroke-width="5" filter="url(#glow)"/>
      <circle cx="200" cy="178" r="168" fill="none" stroke="#ff2e88" stroke-width="2.5" opacity=".7" filter="url(#glow)"/>
      ${sparkle(60, 60, 10)}${sparkle(346, 84, 7)}${sparkle(332, 260, 5, '#2be4d4')}`,
    backHair: `
      <path d="M200 70 C128 70 106 128 110 196 C112 236 116 262 122 276 C150 284 250 286 280 278 C286 260 292 232 292 196 C294 128 272 70 200 70 Z" fill="${hair.base}" stroke="${INK}" stroke-width="3"/>`,
    outfit: `
      <path d="M138 440 L146 362 Q200 376 254 362 L262 440 Z" fill="#1a0b12" stroke="${INK}" stroke-width="3"/>
      <path d="${LEFT_JACKET}" fill="url(#holo)" stroke="${INK}" stroke-width="3"/>
      <path d="${mirrorX(LEFT_JACKET)}" fill="url(#holo)" stroke="${INK}" stroke-width="3"/>
      <path d="M80 424 Q90 382 122 352 M320 424 Q310 382 278 352" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>`,
    outfitFront: `
      <path d="M174 276 Q200 286 226 276 L227 288 Q200 298 173 288 Z" fill="${INK}"/>
      ${heart(200, 301, 13, `fill="#ff2e88" stroke="${INK}" stroke-width="1.5"`)}
      <path d="${COLLAR}" fill="#2a1a4a" stroke="${INK}" stroke-width="2.5"/>
      <path d="${ribs}" clip-path="url(#collar)" stroke="#4b3a7a" stroke-width="2"/>`,
    frontHair: `
      <path d="M132 176 C124 110 160 74 204 74 C250 74 280 112 280 176 C282 214 284 250 282 280 C270 262 266 230 262 200 C258 160 240 126 206 120 C178 124 156 140 146 166 C142 176 138 182 132 176 Z" fill="${hair.base}" stroke="${INK}" stroke-width="3"/>
      <path d="M132 176 C130 204 128 232 122 262 C136 248 142 222 144 196 Z" fill="${hair.base}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M206 120 C232 130 250 152 258 192 M170 92 Q210 84 244 102" fill="none" stroke="${hair.shade}" stroke-width="3" stroke-linecap="round"/>
      <path d="M188 80 C232 82 266 116 272 180 C274 210 276 240 278 268" fill="none" stroke="#2be4d4" stroke-width="5" stroke-linecap="round" opacity=".95"/>
      <path d="M156 106 Q182 90 214 90" fill="none" stroke="${hair.light}" stroke-width="3.5" stroke-linecap="round" opacity=".85"/>`,
    accessories: hoops(22),
  };
})();

const luck = (() => {
  const skin = { base: '#f6d3c0', shade: '#dba48d', dark: '#b8806a', blush: '#ff8aa0' };
  const hair = { base: '#1c1420', shade: '#0d0a10', light: '#6a5a8a' };
  const LEFT_BLAZER = 'M52 440 C56 372 104 326 166 308 L186 384 L170 440 Z';
  const LEFT_LAPEL = 'M166 308 L186 384 L176 396 L158 330 Z';
  const bokeh = [[50, 60, 22, 0.25], [110, 30, 12, 0.3], [330, 50, 26, 0.22], [360, 150, 14, 0.3], [40, 200, 16, 0.2], [300, 230, 10, 0.3], [70, 300, 20, 0.15], [350, 300, 18, 0.2]];
  return {
    file: 'lady-luck.svg',
    title: 'Lady Luck, VIP room — original illustration',
    skin, rim: '#ffc94a',
    eye: { iris: '#6a4a2a', shadow: '#c9a34a', lower: skin.dark },
    brow: hair.base,
    lips: { lip: '#c0143e', lipDark: '#800a2a', smirk: true },
    defs: `
      <radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#8a1430"/><stop offset=".55" stop-color="#3a0814"/><stop offset="1" stop-color="#0a0306"/></radialGradient>
      <linearGradient id="streak" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc94a" stop-opacity="0"/><stop offset=".5" stop-color="#ffc94a" stop-opacity=".35"/><stop offset="1" stop-color="#ffc94a" stop-opacity="0"/></linearGradient>`,
    background: `
      <rect width="400" height="440" fill="url(#bg)"/>
      <path d="M0 120 L400 -40 L400 10 L0 170 Z" fill="url(#streak)"/>
      <g filter="url(#soft)">${bokeh.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffc94a" opacity="${o}"/>`).join('')}</g>
      ${sparkle(330, 110, 9, '#ffe39a')}${sparkle(66, 130, 6, '#ffe39a')}`,
    backHair: `
      <path d="M200 76 C150 76 128 120 132 176 L268 176 C272 120 250 76 200 76 Z" fill="${hair.base}" stroke="${INK}" stroke-width="3"/>
      <path d="M236 88 C300 58 352 116 332 196 C318 252 340 300 318 356 C300 312 286 268 294 206 C300 156 280 116 240 104 Z" fill="${hair.base}" stroke="${INK}" stroke-width="3"/>
      <path d="M300 96 Q332 140 318 204 M312 250 Q322 290 316 330" fill="none" stroke="${hair.light}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
    outfit: `
      <path d="M146 440 L156 368 Q200 380 244 368 L254 440 Z" fill="#3a0a1e" stroke="${INK}" stroke-width="3"/>
      <path d="${LEFT_BLAZER}" fill="#151018" stroke="${INK}" stroke-width="3"/>
      <path d="${mirrorX(LEFT_BLAZER)}" fill="#151018" stroke="${INK}" stroke-width="3"/>
      <path d="${LEFT_LAPEL}" fill="#c9a34a" stroke="${INK}" stroke-width="2.5"/>
      <path d="${mirrorX(LEFT_LAPEL)}" fill="#c9a34a" stroke="${INK}" stroke-width="2.5"/>
      <path d="M80 424 Q90 384 126 348 M320 424 Q310 384 274 348" fill="none" stroke="#4a3a5a" stroke-width="4" stroke-linecap="round" opacity=".7"/>
      <g transform="rotate(-12 276 410)">
        <rect x="262" y="384" width="28" height="40" rx="3" fill="#fff8f0" stroke="${INK}" stroke-width="2"/>
        ${heart(276, 401, 14, 'fill="#d61f45"')}
      </g>
      <path d="M250 418 L304 408" stroke="#2a2030" stroke-width="4" stroke-linecap="round"/>
      ${beadsAlong(170, 316, 200, 356, 230, 316, 12, 3.4, '#fff8f0', '#c9b8a8')}`,
    details: `<circle cx="244" cy="214" r="2.2" fill="${INK}"/>`,
    frontHair: `
      <path d="M134 172 C128 112 160 78 200 78 C242 78 272 110 266 172 C258 136 236 108 200 104 C166 106 144 132 134 172 Z" fill="${hair.base}" stroke="${INK}" stroke-width="3"/>
      <path d="M170 108 Q200 96 232 104" fill="none" stroke="${hair.shade}" stroke-width="2" stroke-linecap="round"/>
      <path d="M156 102 Q194 84 236 94" fill="none" stroke="${hair.light}" stroke-width="4" stroke-linecap="round" opacity=".85"/>
      <ellipse cx="240" cy="92" rx="8" ry="12" transform="rotate(30 240 92)" fill="#c9a34a" stroke="${INK}" stroke-width="2"/>`,
    accessories: [137, 263].map((x) => `
      <circle cx="${x}" cy="204" r="4" fill="#ffc94a" stroke="${INK}" stroke-width="1.5"/>
      <path d="M${x} 208 C${x + 7} 218 ${x + 6} 228 ${x} 230 C${x - 6} 228 ${x - 7} 218 ${x} 208 Z" fill="#ffc94a" stroke="${INK}" stroke-width="1.5"/>`).join(''),
  };
})();

mkdirSync(OUT_DIR, { recursive: true });
for (const p of [cherry, roxy, nina, luck]) {
  writeFileSync(OUT_DIR + p.file, portrait(p));
  console.log('wrote', p.file);
}
