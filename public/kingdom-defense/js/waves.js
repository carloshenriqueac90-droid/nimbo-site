// ============================================================
// ONDAS — definição declarativa por MAPA + Spawner.
// especial: true → wave com caçadores (lobos atrás dos trabalhadores).
// atraso: segundos antes do grupo começar. rota: índice em ROTAS do mapa.
// mult: multiplicador de HP do grupo (chefões de rotas longas).
// ============================================================

import { Inimigo } from './entities.js';

// ---------- Mapa 1 "Reino Verde" (3 rotas: 0 leste-A, 1 leste-B, 2 norte)
const ONDAS_MAPA1 = [
  { grupos: [{ tipo: 'goblin', qtd: 6, intervalo: 1.5, rota: 0 }] },
  { grupos: [
    { tipo: 'goblin', qtd: 8, intervalo: 1.1, rota: 0 },
    { tipo: 'orc', qtd: 2, intervalo: 2.5, rota: 0, atraso: 5 },
  ] },
  { grupos: [
    { tipo: 'goblin', qtd: 8, intervalo: 1.0, rota: 1 },
    { tipo: 'esqueleto', qtd: 6, intervalo: 1.2, rota: 0 },
  ] },
  { especial: true, grupos: [
    { tipo: 'lobo', qtd: 6, intervalo: 1.5, rota: 2 },
    { tipo: 'goblin', qtd: 8, intervalo: 1.0, rota: 0, atraso: 3 },
  ] },
  { grupos: [
    { tipo: 'golem', qtd: 1, intervalo: 0, rota: 0 },
    { tipo: 'orc', qtd: 6, intervalo: 1.6, rota: 1, atraso: 2 },
  ] },
  { grupos: [
    { tipo: 'goblin', qtd: 14, intervalo: 0.7, rota: 1 },
    { tipo: 'voador', qtd: 6, intervalo: 1.4, rota: 0, atraso: 3 },
  ] },
  { grupos: [
    { tipo: 'orc', qtd: 8, intervalo: 1.3, rota: 0 },
    { tipo: 'esqueleto', qtd: 8, intervalo: 1.1, rota: 1, atraso: 2 },
    { tipo: 'ogro', qtd: 4, intervalo: 2.5, rota: 2, atraso: 5 },
  ] },
  { especial: true, grupos: [
    { tipo: 'lobo', qtd: 10, intervalo: 1.2, rota: 2 },
    { tipo: 'voador', qtd: 6, intervalo: 1.5, rota: 1, atraso: 2 },
    { tipo: 'goblin', qtd: 10, intervalo: 0.8, rota: 0, atraso: 4 },
  ] },
  { grupos: [
    { tipo: 'ogro', qtd: 6, intervalo: 2.0, rota: 0 },
    { tipo: 'orc', qtd: 10, intervalo: 1.0, rota: 1, atraso: 2 },
    { tipo: 'esqueleto', qtd: 10, intervalo: 1.0, rota: 2, atraso: 4 },
    { tipo: 'voador', qtd: 8, intervalo: 1.2, rota: 0, atraso: 8 },
  ] },
  { grupos: [
    { tipo: 'reiGoblin', qtd: 1, intervalo: 0, rota: 0 },
    { tipo: 'goblin', qtd: 12, intervalo: 1.0, rota: 1, atraso: 3 },
    { tipo: 'ogro', qtd: 4, intervalo: 2.5, rota: 2, atraso: 6 },
  ] },
];

// ---------- Mapa 2 "Terras de Lava" (rotas 0-7 = 8 portais; 8 = portão sul/chefes)
// Progressão: poucas entradas no início, cada vez mais portais ativos.
// O chefão final sai do portão sul (rota mais longa) MUITO mais forte (mult).
const ONDAS_MAPA2 = [
  // 2 portais (laterais médios)
  { grupos: [
    { tipo: 'goblin', qtd: 6, intervalo: 1.5, rota: 2 },
    { tipo: 'goblin', qtd: 4, intervalo: 1.8, rota: 6, atraso: 2 },
  ] },
  { grupos: [
    { tipo: 'goblin', qtd: 8, intervalo: 1.1, rota: 2 },
    { tipo: 'orc', qtd: 3, intervalo: 2.5, rota: 6, atraso: 3 },
  ] },
  // flancos baixos entram (perto da coleta!)
  { grupos: [
    { tipo: 'esqueleto', qtd: 6, intervalo: 1.3, rota: 3 },
    { tipo: 'goblin', qtd: 8, intervalo: 1.0, rota: 7, atraso: 2 },
  ] },
  { especial: true, grupos: [
    { tipo: 'lobo', qtd: 5, intervalo: 1.5, rota: 3 },
    { tipo: 'lobo', qtd: 4, intervalo: 1.6, rota: 7, atraso: 3 },
    { tipo: 'goblin', qtd: 8, intervalo: 1.0, rota: 1, atraso: 2 },
  ] },
  // mini-chefe pelo portão sul
  { grupos: [
    { tipo: 'golem', qtd: 1, intervalo: 0, rota: 8 },
    { tipo: 'orc', qtd: 5, intervalo: 1.8, rota: 2, atraso: 2 },
    { tipo: 'orc', qtd: 5, intervalo: 1.8, rota: 6, atraso: 4 },
  ] },
  // topo entra (chão, pressão rápida) + PRIMEIROS voadores dos portais DISTANTES
  // de baixo (rotas 3 e 7): voam em linha reta ao castelo, então dão tempo de abater.
  { grupos: [
    { tipo: 'goblin', qtd: 8, intervalo: 1.0, rota: 0 },
    { tipo: 'goblin', qtd: 8, intervalo: 1.0, rota: 4, atraso: 1 },
    { tipo: 'voador', qtd: 5, intervalo: 1.4, rota: 3, atraso: 3 },
    { tipo: 'voador', qtd: 5, intervalo: 1.4, rota: 7, atraso: 4 },
  ] },
  // 4 portais
  { grupos: [
    { tipo: 'orc', qtd: 7, intervalo: 1.3, rota: 1 },
    { tipo: 'esqueleto', qtd: 8, intervalo: 1.1, rota: 5, atraso: 2 },
    { tipo: 'ogro', qtd: 3, intervalo: 3.0, rota: 8, atraso: 4 },
    { tipo: 'goblin', qtd: 8, intervalo: 0.9, rota: 0, atraso: 6 },
  ] },
  // 5 portais, caçada dupla + voadores dos portais laterais DISTANTES (2 e 6)
  { especial: true, grupos: [
    { tipo: 'lobo', qtd: 6, intervalo: 1.3, rota: 3 },
    { tipo: 'lobo', qtd: 6, intervalo: 1.3, rota: 7, atraso: 1 },
    { tipo: 'voador', qtd: 5, intervalo: 1.5, rota: 2, atraso: 3 },
    { tipo: 'voador', qtd: 5, intervalo: 1.5, rota: 6, atraso: 4 },
    { tipo: 'goblin', qtd: 10, intervalo: 0.8, rota: 8, atraso: 5 },
  ] },
  // 6 portais + voadores do portão sul distante (rota 7)
  { grupos: [
    { tipo: 'ogro', qtd: 4, intervalo: 2.4, rota: 2 },
    { tipo: 'ogro', qtd: 4, intervalo: 2.4, rota: 6, atraso: 1 },
    { tipo: 'orc', qtd: 8, intervalo: 1.1, rota: 1, atraso: 3 },
    { tipo: 'orc', qtd: 8, intervalo: 1.1, rota: 5, atraso: 4 },
    { tipo: 'esqueleto', qtd: 8, intervalo: 1.0, rota: 3, atraso: 6 },
    { tipo: 'voador', qtd: 6, intervalo: 1.3, rota: 7, atraso: 8 },
  ] },
  // CHEFÃO do portão sul (rota mais longa → bem mais forte) + pressão dos portais curtos
  { grupos: [
    { tipo: 'reiGoblin', qtd: 1, intervalo: 0, rota: 8, mult: 2.2 },
    { tipo: 'goblin', qtd: 10, intervalo: 1.0, rota: 0, atraso: 3 },
    { tipo: 'goblin', qtd: 10, intervalo: 1.0, rota: 4, atraso: 4 },
    { tipo: 'ogro', qtd: 3, intervalo: 3.0, rota: 2, atraso: 8 },
    { tipo: 'ogro', qtd: 3, intervalo: 3.0, rota: 6, atraso: 9 },
  ] },
];

export const ONDAS_POR_MAPA = [ONDAS_MAPA1, ONDAS_MAPA2];

export class Spawner {
  constructor(def) {
    this.especial = !!def.especial;
    this.grupos = def.grupos.map(g => ({ ...g, spawned: 0, t: g.atraso || 0 }));
    this.terminou = false;
    this.total = def.grupos.reduce((s, g) => s + g.qtd, 0);
  }
  update(dt, state) {
    let ativos = false;
    for (const g of this.grupos) {
      if (g.spawned >= g.qtd) continue;
      ativos = true;
      g.t -= dt;
      while (g.t <= 0 && g.spawned < g.qtd) {
        state.inimigos.push(new Inimigo(g.tipo, g.rota, state.escalaHP * (g.mult || 1)));
        g.spawned++;
        g.t += Math.max(g.intervalo, 0.001);
      }
    }
    if (!ativos) this.terminou = true;
  }
  spawnados() { return this.grupos.reduce((s, g) => s + g.spawned, 0); }
}
