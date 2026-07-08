// ============================================================
// MAPA — 100% dados + desenho do terreno.
// Trocar este módulo = trocar o mapa (preparado p/ novos biomas).
// Mundo lógico: 960x640. Vegetação procedural com seed fixa,
// posicionada por amostragem com rejeição (nunca cobre rotas).
// ============================================================

import { sprite, desenharAncoradoBase } from './sprites.js';

export const LARGURA = 960;
export const ALTURA = 640;

// ============================================================
// REGISTRO DE MAPAS — cada fase é 100% dados. Trocar de fase =
// trocar o índice em localStorage['kd-mapa']. Preparado p/ novos biomas.
// ============================================================
export const MAPAS = [
  {
    nome: 'Reino Verde',
    icone: '🌲',
    terreno: 'terreno',
    castelo: { x: 305, y: 312, raio: 46 },
    // recorte do castelo (PNG transparente) p/ oclusão por profundidade
    recorte: { key: 'casteloRecorte', x: 205, y: 150, w: 205, h: 215, base: 350 },
    // Rotas das WAVES (inimigos): leste-A, leste-B, norte → castelo (à esquerda).
    rotas: [
      [[985, 160], [845, 168], [792, 172], [705, 210], [625, 230], [535, 256], [450, 266], [372, 294], [318, 308]],
      [[985, 485], [845, 478], [800, 468], [710, 452], [616, 428], [536, 396], [458, 376], [392, 344], [320, 318]],
      [[612, -20], [606, 70], [588, 140], [546, 196], [494, 232], [432, 262], [368, 290], [318, 306]],
    ],
    // Estradas comerciais (trabalhadores), separadas das rotas das waves.
    sites: [
      { tipo: 'mina',       x: 110, y: 115, rota: [[110, 115], [152, 160], [192, 206], [240, 262], [288, 300]] },
      { tipo: 'mina',       x: 185, y: 88,  rota: [[185, 88], [214, 148], [240, 208], [264, 258], [292, 298]] },
      { tipo: 'madeireira', x: 118, y: 532, rota: [[118, 532], [154, 494], [194, 448], [240, 382], [290, 326]] },
      { tipo: 'madeireira', x: 200, y: 566, rota: [[200, 566], [224, 510], [250, 452], [270, 390], [293, 330]] },
    ],
    plataformas: [
      [834, 205], [700, 245], [645, 165], [715, 98], [540, 75], [468, 150],
      [445, 300], [575, 320],
      [838, 428], [655, 408], [438, 428], [575, 485],
    ],
    portais: [[946, 160], [946, 488], [612, 14]],
  },
  {
    nome: 'Terras de Lava',
    icone: '🌋',
    terreno: 'terreno2',
    castelo: { x: 482, y: 148, raio: 52 },
    // castelo no topo: quem entrega chega por baixo (fica na frente); recorte via terreno
    recorte: { key: null, x: 340, y: 0, w: 300, h: 205, base: 185 },
    // Rotas traçadas por pathfinding sobre as estradas pintadas (ver memória do projeto).
    // 9 entradas: 8 portais (índices 0-7, sentido horário a partir do topo-esquerdo)
    // + portão sul (índice 8) — a rota MAIS LONGA, reservada p/ chefes.
    rotas: [
      [[271, 96], [321, 181], [362, 222], [338, 276], [348, 301], [405, 305], [471, 244], [482, 200]],
      [[113, 185], [143, 231], [209, 238], [278, 275], [332, 280], [351, 303], [386, 308], [408, 303], [474, 241], [482, 200]],
      [[63, 353], [95, 383], [137, 388], [233, 349], [275, 346], [338, 308], [395, 309], [471, 244], [482, 200]],
      [[70, 510], [111, 544], [155, 539], [205, 496], [265, 472], [313, 417], [273, 368], [280, 344], [346, 306], [402, 308], [477, 236], [482, 200]],
      [[747, 100], [703, 148], [655, 206], [629, 266], [564, 278], [533, 269], [497, 245], [482, 200]],
      [[850, 207], [813, 246], [699, 306], [629, 266], [564, 278], [533, 269], [497, 245], [482, 200]],
      [[897, 353], [865, 394], [830, 413], [736, 397], [702, 374], [626, 380], [571, 346], [565, 299], [497, 245], [482, 200]],
      [[867, 520], [831, 570], [806, 569], [679, 492], [622, 429], [626, 384], [566, 342], [563, 295], [492, 240], [482, 200]],
      [[446, 612], [446, 569], [510, 507], [517, 473], [482, 421], [480, 387], [425, 337], [414, 302], [482, 200]],
    ],
    // Coleta espalhada pelo mapa (compartilha a teia com as waves) —
    // trabalhadores expostos com muita frequência. Esse é o twist da fase.
    // O castelo tem 3 bocas de estrada: central (485,245) é dos MONSTROS;
    // trabalhadores entregam nas laterais — esquerda (450,248) e direita (525,250),
    // cada site pela boca mais próxima (mina e madeireira dir → direita).
    sites: [
      { tipo: 'madeireira', x: 95, y: 455,  rota: [[95, 455], [142, 388], [314, 323], [325, 283], [353, 257], [371, 215], [408, 185]] },
      { tipo: 'madeireira', x: 850, y: 467, rota: [[850, 467], [822, 455], [810, 415], [731, 393], [702, 316], [640, 264], [629, 222], [576, 195], [530, 150]] },
      { tipo: 'mina',       x: 578, y: 597, rota: [[578, 597], [568, 562], [518, 515], [516, 494], [530, 463], [615, 428], [622, 380], [570, 345], [561, 322], [577, 282], [620, 258], [633, 236], [621, 214], [569, 188], [530, 150]] },
    ],
    plataformas: [
      [530, 320], [390, 250], [340, 350], [430, 390], [690, 340], [250, 300], [300, 210], [600, 460],
      [520, 410], [780, 370], [770, 230], [670, 250], [170, 480], [870, 330], [160, 340], [690, 450],
    ],
    portais: [[271, 96], [113, 185], [63, 353], [70, 510], [747, 100], [850, 207], [897, 353], [867, 520], [446, 612]],
  },
];

// Mapa ativo (lido uma vez no load; trocar = gravar localStorage + recarregar).
export const MAPA_IDX = (() => {
  const i = parseInt(localStorage.getItem('kd-mapa'), 10);
  return i >= 0 && i < MAPAS.length ? i : 0;
})();
const M = MAPAS[MAPA_IDX];

export const CASTELO = M.castelo;
export const RECORTE_CASTELO = M.recorte;
export const ROTAS = M.rotas;
export const SITES = M.sites.map(s => ({ ...s, construcao: null }));
export const PLATAFORMAS = M.plataformas.map(([x, y]) => ({ x, y, torre: null }));
const PORTAIS = M.portais;

// ---------- Geometria auxiliar ----------

// gerador determinístico (mesma floresta em todo load)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function pertoDePolilinha(x, y, pontos, margem) {
  for (let i = 0; i < pontos.length - 1; i++) {
    if (distSeg(x, y, pontos[i][0], pontos[i][1], pontos[i + 1][0], pontos[i + 1][1]) < margem) return true;
  }
  return false;
}

function centroRio(y) {
  return 770 + ((y + 20) / 680) * 25;
}

// posição livre p/ decoração (não cobre nada jogável)
function livre(x, y, margem) {
  if (Math.abs(x - centroRio(y)) < 36 + margem) return false;
  if (Math.hypot(x - CASTELO.x, y - CASTELO.y) < 92 + margem) return false;
  for (const p of PLATAFORMAS) if (Math.hypot(x - p.x, y - p.y) < 34 + margem) return false;
  for (const s of SITES) if (Math.hypot(x - s.x, y - s.y) < 36 + margem) return false;
  for (const [px, py] of PORTAIS) if (Math.hypot(x - px, y - py) < 46 + margem) return false;
  for (const r of ROTAS) if (pertoDePolilinha(x, y, r, 20 + margem)) return false;
  for (const s of SITES) if (pertoDePolilinha(x, y, s.rota, 13 + margem)) return false;
  return true;
}

// ---------- Elementos de desenho ----------

const PALETAS_ARVORE = [
  ['#2e5c2e', '#3a7a3a'],
  ['#27522c', '#357036'],
  ['#33663a', '#42854a'],
];

function arvore(c, x, y, s, v) {
  const [escura, clara] = PALETAS_ARVORE[v];
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.beginPath(); c.ellipse(x + 2, y + 6 * s, 9 * s, 3.5 * s, 0, 0, 7); c.fill();
  c.fillStyle = '#5d4028';
  c.fillRect(x - 2 * s, y, 4 * s, 7 * s);
  c.fillStyle = escura;
  c.beginPath(); c.arc(x, y - 4 * s, 9 * s, 0, 7); c.fill();
  c.fillStyle = clara;
  c.beginPath(); c.arc(x - 3 * s, y - 7 * s, 6 * s, 0, 7); c.fill();
}

function arbusto(c, x, y, s) {
  c.fillStyle = '#3d6b35';
  c.beginPath(); c.ellipse(x, y, 7 * s, 5 * s, 0, 0, 7); c.fill();
  c.fillStyle = '#4c7f42';
  c.beginPath(); c.ellipse(x - 2 * s, y - 2 * s, 4 * s, 3 * s, 0, 0, 7); c.fill();
}

function pedra(c, x, y, s = 1) {
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.beginPath(); c.ellipse(x + 1, y + 5 * s, 9 * s, 3 * s, 0, 0, 7); c.fill();
  c.fillStyle = '#7d7d76';
  c.beginPath();
  c.moveTo(x - 8 * s, y + 5 * s); c.lineTo(x - 3 * s, y - 6 * s);
  c.lineTo(x + 5 * s, y - 4 * s); c.lineTo(x + 8 * s, y + 5 * s);
  c.closePath(); c.fill();
  c.fillStyle = '#93938c';
  c.beginPath();
  c.moveTo(x - 3 * s, y - 6 * s); c.lineTo(x + 5 * s, y - 4 * s); c.lineTo(x + 2 * s, y + 5 * s); c.lineTo(x - 4 * s, y + 5 * s);
  c.closePath(); c.fill();
}

function estrada(c, pontos, largura, cor, borda) {
  for (const [w, col] of [[largura + 6, borda], [largura, cor]]) {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(pontos[0][0], pontos[0][1]);
    for (let i = 1; i < pontos.length; i++) c.lineTo(pontos[i][0], pontos[i][1]);
    c.stroke();
  }
}

function portal(c, x, y) {
  c.fillStyle = '#241a1a';
  c.beginPath(); c.arc(x, y, 20, Math.PI, 0); c.fill();
  c.fillRect(x - 20, y, 40, 12);
  c.fillStyle = '#8b1e1e';
  c.beginPath(); c.arc(x, y, 12, Math.PI, 0); c.fill();
  c.fillRect(x - 12, y, 24, 10);
}

function castelo(c) {
  const { x, y } = CASTELO;
  if (desenharAncoradoBase(c, 'castelo', x, y + 46, 175)) return;
  // fallback procedural (usado só se o sprite não carregar)
  c.fillStyle = '#8f959d';
  c.fillRect(x - 34, y - 16, 68, 40);
  for (const tx of [x - 30, x + 30]) {
    c.fillStyle = '#9aa0a8';
    c.fillRect(tx - 9, y - 34, 18, 52);
    c.fillStyle = '#2e5fa3';
    c.beginPath(); c.moveTo(tx - 12, y - 34); c.lineTo(tx, y - 54); c.lineTo(tx + 12, y - 34); c.closePath(); c.fill();
  }
  c.fillStyle = '#a6acb4';
  c.fillRect(x - 10, y - 46, 20, 40);
  c.fillStyle = '#2e5fa3';
  c.beginPath(); c.moveTo(x - 14, y - 46); c.lineTo(x, y - 68); c.lineTo(x + 14, y - 46); c.closePath(); c.fill();
  c.fillStyle = '#4a3320';
  c.beginPath(); c.arc(x, y + 24, 10, Math.PI, 0); c.fill();
  c.fillRect(x - 10, y + 14, 20, 10);
}

// Desenha todo o terreno estático em um contexto.
// Se a pintura gerada por IA estiver disponível, ela é a base (castelo,
// pontes e portais já vêm pintados nela). O procedural é o fallback.
export function desenharTerreno(c) {
  const pintura = sprite(M.terreno);
  if (pintura) {
    c.drawImage(pintura, 0, 0, LARGURA, ALTURA);
    return;
  }
  // fallback dark p/ mapas com terreno próprio que ainda não carregou
  if (M.terreno !== 'terreno') {
    c.fillStyle = '#241a1a';
    c.fillRect(0, 0, LARGURA, ALTURA);
    return;
  }
  const rnd = mulberry32(42);

  // ---- grama base ----
  const g = c.createLinearGradient(0, 0, 0, ALTURA);
  g.addColorStop(0, '#5a7a3c');
  g.addColorStop(1, '#4c6a33');
  c.fillStyle = g;
  c.fillRect(0, 0, LARGURA, ALTURA);

  // manchas escuras orgânicas
  for (let i = 0; i < 70; i++) {
    const x = rnd() * LARGURA, y = rnd() * ALTURA;
    c.fillStyle = `rgba(20,40,10,${0.03 + rnd() * 0.05})`;
    c.beginPath(); c.ellipse(x, y, 25 + rnd() * 50, 12 + rnd() * 25, rnd() * 3, 0, 7); c.fill();
  }
  // pontinhos claros de grama
  c.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 400; i++) {
    c.fillRect(rnd() * LARGURA, rnd() * ALTURA, 2, 2);
  }

  // colinas (noroeste)
  c.fillStyle = '#6b8a4a';
  c.beginPath(); c.ellipse(140, 28, 90, 32, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(280, 18, 70, 24, 0, 0, 7); c.fill();

  // ---- rio (leste) ----
  c.strokeStyle = '#2f5d8f'; c.lineWidth = 60; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(770, -20); c.quadraticCurveTo(768, 200, 778, 340); c.quadraticCurveTo(786, 480, 795, 660);
  c.stroke();
  c.strokeStyle = '#4d86c2'; c.lineWidth = 44;
  c.beginPath();
  c.moveTo(770, -20); c.quadraticCurveTo(768, 200, 778, 340); c.quadraticCurveTo(786, 480, 795, 660);
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2;
  for (const [wx, wy] of [[768, 90], [774, 250], [782, 400], [790, 560]]) {
    c.beginPath(); c.moveTo(wx - 8, wy); c.quadraticCurveTo(wx, wy - 4, wx + 8, wy); c.stroke();
  }

  // ---- estradas ----
  for (const rota of ROTAS) estrada(c, rota, 24, '#c2a877', '#a08654');
  for (const s of SITES) estrada(c, s.rota, 12, '#e0cfa4', '#bfa87d');

  // ---- pontes ----
  for (const [bx, by] of [[775, 166], [775, 481]]) {
    c.fillStyle = '#6d4c2c';
    c.fillRect(bx - 34, by - 17, 68, 34);
    c.fillStyle = '#7f5a35';
    for (let i = 0; i < 6; i++) c.fillRect(bx - 32 + i * 11, by - 15, 8, 30);
    c.strokeStyle = '#4a3320'; c.lineWidth = 3;
    c.strokeRect(bx - 34, by - 17, 68, 34);
  }

  // ---- portais de spawn ----
  for (const [px, py] of PORTAIS) portal(c, px, py);

  // ---- depósito de ouro (perto das minas) ----
  pedra(c, 78, 148, 1.4); pedra(c, 60, 185, 1.1); pedra(c, 145, 60, 1.2);
  c.fillStyle = '#f5c542';
  for (const [gx, gy] of [[74, 146], [64, 182], [86, 158], [142, 58]]) {
    c.beginPath(); c.arc(gx, gy, 2.5, 0, 7); c.fill();
  }

  // ---- flores ----
  const CORES_FLOR = ['#e8e26b', '#e89ab8', '#ffffff', '#d97b4f'];
  for (let i = 0; i < 70; i++) {
    const x = rnd() * LARGURA, y = rnd() * ALTURA;
    if (!livre(x, y, -6)) continue;
    c.fillStyle = CORES_FLOR[Math.floor(rnd() * CORES_FLOR.length)];
    c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fill();
  }

  // ---- pedras e arbustos ----
  const decors = [];
  let tent = 0;
  while (decors.length < 16 && tent++ < 800) {
    const x = rnd() * LARGURA, y = rnd() * ALTURA;
    if (!livre(x, y, 6)) continue;
    if (decors.some(d => Math.hypot(d[0] - x, d[1] - y) < 40)) continue;
    decors.push([x, y, 0.8 + rnd() * 0.7]);
  }
  const arbustos = [];
  tent = 0;
  while (arbustos.length < 45 && tent++ < 1500) {
    const x = rnd() * LARGURA, y = rnd() * ALTURA;
    if (!livre(x, y, 2)) continue;
    if (arbustos.some(a => Math.hypot(a[0] - x, a[1] - y) < 20)) continue;
    arbustos.push([x, y, 0.8 + rnd() * 0.8]);
  }

  // ---- floresta densa (bordas + clareiras) ----
  const arvores = [];
  tent = 0;
  while (arvores.length < 190 && tent++ < 6000) {
    let x, y;
    if (rnd() < 0.5) { // viés p/ bordas do mapa (moldura de floresta)
      const lado = Math.floor(rnd() * 4);
      if (lado === 0) { x = rnd() * LARGURA; y = rnd() * 75; }
      else if (lado === 1) { x = rnd() * LARGURA; y = ALTURA - rnd() * 75; }
      else if (lado === 2) { x = rnd() * 75; y = rnd() * ALTURA; }
      else { x = LARGURA - rnd() * 75; y = rnd() * ALTURA; }
    } else {
      x = rnd() * LARGURA; y = rnd() * ALTURA;
    }
    if (!livre(x, y, 5)) continue;
    if (arvores.some(a => Math.hypot(a[0] - x, a[1] - y) < 21)) continue;
    arvores.push([x, y, 1.0 + rnd() * 0.9, Math.floor(rnd() * 3)]);
  }

  // desenha em ordem de profundidade (y)
  for (const [x, y, s] of decors) pedra(c, x, y, s);
  const vegetacao = [
    ...arbustos.map(a => ({ y: a[1], fn: () => arbusto(c, a[0], a[1], a[2]) })),
    ...arvores.map(a => ({ y: a[1], fn: () => arvore(c, a[0], a[1], a[2], a[3]) })),
  ].sort((a, b) => a.y - b.y);
  for (const v of vegetacao) v.fn();

  castelo(c);
}
