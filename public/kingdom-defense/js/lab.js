// ============================================================
// LABORATÓRIO — upgrades GLOBAIS do Modo Caos (valem para todas as torres).
// Duas trilhas melhoráveis (dano e velocidade de ataque), custo crescente
// por nível. Ao somar LAB.nivelEspeciais níveis nas duas trilhas, liberam-se
// os ataques especiais: um desbloqueio único e muito caro por tipo de torre.
// ============================================================

import { LAB } from './config.js';
import { desenharAncoradoBase } from './sprites.js';

// Estado mutável da partida (reiniciado junto com o resto do jogo).
// especiais: TIER atual de cada especial (0 = não liberado; 1/2/3 = tiers comprados).
export const lab = {
  nivelDano: 0,
  nivelVel: 0,
  especiais: { arqueiro: 0, canhao: 0, magica: 0, gelo: 0 },
};

const MAX_TIER = 3;

// Soma dos níveis das duas trilhas — é o que libera os especiais.
export function nivelLab() {
  return lab.nivelDano + lab.nivelVel;
}

// Multiplicador de dano aplicado a todas as torres (aditivo por nível, ≥1).
export function multDano() {
  return 1 + lab.nivelDano * LAB.ganhoDano;
}

// Multiplicador de cadência aplicado a todas as torres (≤1: menor cadência = atira mais rápido).
export function multCadencia() {
  return Math.pow(LAB.ganhoVel, lab.nivelVel);
}

// Custo do PRÓXIMO nível de cada trilha.
export function custoDano() {
  return LAB.custo(LAB.baseDano, lab.nivelDano);
}
export function custoVel() {
  return LAB.custo(LAB.baseVel, lab.nivelVel);
}

// Compra um nível em cada trilha (a checagem de recursos é responsabilidade de quem chama).
export function melhorarDano() {
  lab.nivelDano++;
}
export function melhorarVel() {
  lab.nivelVel++;
}

// Ataques especiais em 3 tiers (liberados nos níveis LAB.nivelPorTier = 30/60/90).
// lab.especiais[tipo] guarda o TIER já comprado (0..3).

// tier atualmente ativo do especial (0 = nenhum)
export function especialNivel(tipo) {
  return lab.especiais[tipo];
}

// há algum tier ativo? (usado pelas torres p/ decidir se disparam o especial)
export function especialAtivo(tipo) {
  return lab.especiais[tipo] > 0;
}

export function especialMaxTier() { return MAX_TIER; }

// parâmetros do tier ATIVO (dano/cooldown/alvos/etc.) ou null se não liberado
export function especialParams(tipo) {
  const t = lab.especiais[tipo];
  return t > 0 ? LAB.especiais[tipo].niveis[t - 1] : null;
}

// o próximo tier já pode ser comprado? (existe e o laboratório atingiu o nível exigido)
export function especiaisLiberados() {
  return nivelLab() >= LAB.nivelPorTier[0];
}

export function noMaximoEspecial(tipo) {
  return lab.especiais[tipo] >= MAX_TIER;
}

// nível do laboratório exigido para liberar o PRÓXIMO tier deste especial
export function nivelExigidoProximo(tipo) {
  return LAB.nivelPorTier[lab.especiais[tipo]] ?? Infinity;
}

// o próximo tier existe E o laboratório já tem nível suficiente
export function especialLiberavel(tipo) {
  return lab.especiais[tipo] < MAX_TIER && nivelLab() >= nivelExigidoProximo(tipo);
}

// custo do PRÓXIMO tier (ou null se já está no máximo)
export function custoEspecial(tipo) {
  const t = lab.especiais[tipo];
  return t < MAX_TIER ? LAB.especiais[tipo].niveis[t].custo : null;
}

export function liberarEspecial(tipo) {
  if (lab.especiais[tipo] < MAX_TIER) lab.especiais[tipo]++;
}

// Desenha o prédio do Laboratório ancorado pela base (bottom-center) em (x, yBase).
// Usa o sprite 'lab' se já estiver carregado; senão cai no fallback procedural.
export function desenharLab(c, x, yBase, w) {
  if (desenharAncoradoBase(c, 'lab', x, yBase, w)) return true;

  // Fallback: casinha/torre de pedra com telhado azulado e janelinha acesa.
  const largCorpo = w * 0.72;
  const altCorpo = w * 0.85;
  const topoCorpo = yBase - altCorpo;

  // corpo de pedra
  c.fillStyle = '#8a8a82';
  c.fillRect(x - largCorpo / 2, topoCorpo, largCorpo, altCorpo);
  c.fillStyle = '#6f6f68'; // faixa de base, sombra
  c.fillRect(x - largCorpo / 2, yBase - 6, largCorpo, 6);

  // telhado azulado
  const altTelhado = w * 0.5;
  c.fillStyle = '#2e5f8a';
  c.beginPath();
  c.moveTo(x - largCorpo / 2 - 6, topoCorpo);
  c.lineTo(x, topoCorpo - altTelhado);
  c.lineTo(x + largCorpo / 2 + 6, topoCorpo);
  c.closePath();
  c.fill();

  // porta
  c.fillStyle = '#4a3420';
  const largPorta = largCorpo * 0.32;
  c.fillRect(x - largPorta / 2, yBase - altCorpo * 0.42, largPorta, altCorpo * 0.42);

  // janelinha acesa (com leve brilho ao redor)
  const janX = x - largCorpo * 0.28;
  const janY = topoCorpo + altCorpo * 0.22;
  const tamJanela = w * 0.14;
  c.save();
  c.globalAlpha = 0.35;
  c.fillStyle = '#fff3b0';
  c.beginPath();
  c.arc(janX, janY + tamJanela / 2, tamJanela * 1.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.fillStyle = '#ffe27a';
  c.fillRect(janX - tamJanela / 2, janY, tamJanela, tamJanela);

  return true;
}
