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
    nome: 'Green Kingdom',
    icone: '🌲',
    terreno: 'terreno',
    castelo: { x: 305, y: 312, raio: 46 },
    // recorte do castelo (PNG transparente) p/ oclusão por profundidade
    recorte: { key: 'casteloRecorte', x: 205, y: 150, w: 205, h: 215, base: 350 },
    // Rotas das WAVES (inimigos), traçadas sobre as estradas pintadas do
    // terreno: leste-A (ponte de cima), leste-B (ponte de baixo), norte → castelo.
    rotas: [
      [[925, 155], [850, 153], [800, 165], [755, 174], [705, 189], [655, 205], [605, 224], [555, 240], [510, 253], [487, 258], [450, 276], [405, 295], [365, 310], [338, 318]],
      [[915, 487], [845, 486], [795, 482], [745, 472], [700, 456], [655, 438], [610, 422], [565, 404], [520, 388], [478, 372], [438, 356], [400, 340], [365, 327], [342, 320]],
      [[608, 10], [602, 58], [592, 105], [574, 145], [550, 178], [526, 203], [506, 228], [492, 250], [470, 265], [435, 283], [395, 299], [360, 311], [338, 318]],
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
    portais: [[925, 155], [915, 487], [608, 10]],
  },
  {
    nome: 'Lava Lands',
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
      { tipo: 'mina',       x: 850, y: 467, rota: [[850, 467], [822, 455], [810, 415], [731, 393], [702, 316], [640, 264], [629, 222], [576, 195], [530, 150]] },
    ],
    plataformas: [
      [530, 320], [390, 250], [340, 350], [430, 390], [690, 340], [250, 300], [300, 210], [600, 460],
      [520, 410], [780, 370], [770, 230], [670, 250], [170, 480], [870, 330], [160, 340], [690, 450],
    ],
    portais: [[271, 96], [113, 185], [63, 353], [70, 510], [747, 100], [850, 207], [897, 353], [867, 520], [446, 612]],
  },
  {
    nome: 'Dark Forest',
    icone: '🌲',
    terreno: 'terreno3',
    castelo: { x: 487, y: 268, raio: 46 },
    // recorte do próprio terreno pintado sobre a região do castelo (oclusão por profundidade)
    recorte: { key: null, x: 430, y: 185, w: 120, h: 125, base: 302 },
    // Rotas traçadas sobre as estradas pintadas (desenhos do Gabriel).
    // Portais azul e vermelho têm BIFURCAÇÃO — cada onda usa um braço:
    // 0 roxo · 1 azul-A (ponte oeste) · 2 azul-B (ponte sudoeste) · 3 verde ·
    // 4 vermelho-A (corredor alto) · 5 vermelho-B (pelo leste) · 6 CHEFE
    // (entra pela direita perto do moinho, ponte SE, entroncamento sul, diagonal, castelo).
    rotas: [
      [[62, 58], [88, 92], [115, 122], [142, 152], [170, 177], [205, 192], [245, 200], [280, 207], [305, 215], [340, 227], [370, 240], [400, 250], [432, 258], [455, 262]],
      [[48, 265], [80, 288], [118, 297], [152, 300], [182, 287], [210, 270], [232, 254], [255, 240], [280, 228], [305, 215], [340, 227], [370, 240], [400, 250], [432, 258], [455, 262]],
      [[48, 265], [80, 288], [118, 297], [142, 302], [158, 325], [172, 350], [190, 372], [215, 390], [243, 400], [270, 385], [298, 368], [330, 350], [362, 340], [392, 333], [418, 322], [440, 312], [465, 305]],
      [[88, 518], [125, 520], [152, 508], [178, 490], [200, 468], [218, 443], [232, 420], [243, 400], [258, 385], [278, 372], [305, 358], [332, 348], [362, 340], [392, 333], [418, 322], [440, 312], [465, 305]],
      [[812, 68], [800, 100], [790, 132], [782, 163], [770, 192], [748, 210], [712, 222], [672, 230], [632, 238], [592, 246], [558, 255], [535, 262]],
      [[812, 68], [800, 100], [790, 132], [782, 163], [770, 195], [758, 222], [765, 255], [772, 292], [758, 330], [725, 352], [688, 366], [650, 372], [612, 368], [578, 352], [555, 330], [538, 308]],
      [[888, 548], [876, 524], [858, 506], [838, 490], [818, 475], [798, 462], [780, 436], [762, 410], [742, 393], [706, 391], [668, 393], [640, 396], [630, 408], [612, 424], [590, 440], [570, 456], [561, 472], [542, 486], [520, 493], [498, 491], [476, 489], [458, 476], [449, 458], [444, 438], [430, 422], [400, 410], [372, 398], [360, 380], [363, 362], [376, 347], [394, 336], [412, 328], [430, 322]],
    ],
    // Coleta: 2 madeireiras na mata ao norte (círculos vermelhos) e 1 mina de ouro
    // na saída sul (círculo amarelo) — a rota 4 dos chefes passa ao lado dela.
    // Trabalhadores pelo corredor magenta do Gabriel: madeireiras descem o corredor
    // x~545 até o castelo; mina sobe pela estrada SE (lado DIREITO do castelo).
    sites: [
      { tipo: 'mina', x: 525, y: 112, rota: [[525, 112], [540, 135], [545, 172], [548, 210], [540, 240], [527, 262], [512, 275]] },
      { tipo: 'mina', x: 628, y: 59, rota: [[628, 59], [652, 90], [656, 120], [640, 140], [610, 150], [580, 146], [555, 140], [545, 172], [548, 210], [540, 240], [527, 262], [512, 275]] },
    ],
    plataformas: [
      [164, 143], [146, 276], [565, 230], [820, 210], [822, 452],
      [250, 300], [360, 290], [415, 375], [548, 370], [672, 390], [595, 318], [790, 305], [820, 540],
    ],
    portais: [[62, 58], [48, 265], [88, 518], [812, 68]],
  },
  {
    // ---- MAPA DO MODO CAOS ----
    // 4 rotas de invasão vindas do leste (4 portais) convergem no castelo.
    // Atrás do castelo (oeste) há 5 estradas de coleta: 3 minas + 2 madeireiras.
    // A parte sudoeste fica livre para o Laboratório (upgrades globais).
    nome: 'Chaos',
    icone: '🌀',
    caos: true,
    terreno: 'caos',
    castelo: { x: 212, y: 266, raio: 46 },
    // recorte do próprio terreno pintado sobre a região do castelo (oclusão por profundidade)
    recorte: { key: null, x: 148, y: 165, w: 132, h: 142, base: 300 },
    // Laboratório fixo no canto sudoeste (parte vazia do mapa).
    lab: { x: 196, y: 470 },
    // Rotas dos monstros: portal (leste) → curva → castelo (212,266).
    rotas: [
      [[881, 85], [836, 86], [768, 114], [699, 141], [630, 136], [561, 125], [492, 114], [430, 128], [372, 178], [322, 232], [272, 258], [212, 266]],
      [[871, 193], [836, 193], [768, 218], [699, 232], [630, 231], [561, 224], [492, 219], [432, 232], [372, 248], [312, 260], [252, 264], [212, 266]],
      [[880, 311], [836, 316], [768, 335], [699, 336], [630, 330], [561, 334], [492, 340], [432, 332], [372, 312], [312, 288], [258, 272], [212, 266]],
      [[877, 432], [836, 447], [768, 443], [699, 446], [630, 435], [561, 439], [492, 439], [438, 420], [388, 372], [332, 318], [282, 286], [238, 272], [212, 266]],
    ],
    // Estradas comerciais (trabalhadores): sítio → castelo, pelos spokes oeste.
    // Marcadores encostados na trilha (snap por detecção de estrada).
    sites: [
      { tipo: 'mina',       x: 201, y: 149, rota: [[201, 149], [204, 190], [208, 228], [210, 258]] },
      { tipo: 'mina',       x: 91,  y: 189, rota: [[91, 189], [134, 210], [168, 233], [198, 255]] },
      { tipo: 'mina',       x: 80,  y: 276, rota: [[80, 276], [120, 262], [160, 262], [196, 265]] },
      { tipo: 'madeireira', x: 115, y: 347, rota: [[115, 347], [140, 320], [172, 296], [200, 278]] },
      { tipo: 'madeireira', x: 206, y: 392, rota: [[206, 392], [209, 352], [211, 314], [212, 286]] },
    ],
    // 4 colunas externas nas aberturas entre as rotas + cluster interno perto do
    // castelo (2 movidas + 3 novas) para defender o entroncamento.
    plataformas: [
      [520, 165], [620, 175], [720, 180], [795, 168],
      [470, 272], [560, 278], [660, 282], [760, 286],
      [520, 388], [620, 392], [720, 396], [792, 424],
      [345, 192], [345, 345],
      [418, 166], [366, 270], [418, 366],
    ],
    portais: [[881, 85], [871, 193], [880, 311], [877, 432]],
  },
];

// Modo ativo: 'caos' força o mapa do caos; 'normal' usa a seleção salva.
export const MODO = localStorage.getItem('kd-modo') === 'caos' ? 'caos' : 'normal';
const CAOS_IDX = MAPAS.findIndex(m => m.caos);

// Mapa ativo (lido uma vez no load; trocar = gravar localStorage + recarregar).
// No modo caos o mapa é sempre o do caos; no normal, a seleção salva (nunca o caos).
export const MAPA_IDX = (() => {
  if (MODO === 'caos') return CAOS_IDX;
  const i = parseInt(localStorage.getItem('kd-mapa'), 10);
  return i >= 0 && i < MAPAS.length && !MAPAS[i].caos ? i : 0;
})();
const M = MAPAS[MAPA_IDX];

export const CASTELO = M.castelo;
export const RECORTE_CASTELO = M.recorte;
export const ROTAS = M.rotas;
export const SITES = M.sites.map(s => ({ ...s, construcao: null }));
export const PLATAFORMAS = M.plataformas.map(([x, y]) => ({ x, y, torre: null }));
export const LAB_POS = M.lab || null;   // posição do laboratório (só no mapa caos)
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
