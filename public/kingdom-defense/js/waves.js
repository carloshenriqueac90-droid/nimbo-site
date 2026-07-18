// ============================================================
// ONDAS — definição declarativa por MAPA + Spawner.
// especial: true → wave com caçadores (lobos atrás dos trabalhadores).
// atraso: segundos antes do grupo começar. rota: índice em ROTAS do mapa.
// mult: multiplicador de HP do grupo (chefões de rotas longas).
// ============================================================

import { Inimigo } from './entities.js';
import { CAOS } from './config.js';

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

// ---------- Mapa 3 "Floresta Sombria"
// Rotas: 0 roxo · 1 azul-A · 2 azul-B · 3 verde · 4 vermelho-A · 5 vermelho-B · 6 CHEFE.
// Azul e vermelho são bifurcados: as ondas alternam os braços A/B.
const ONDAS_MAPA3 = [
  { grupos: [{ tipo: 'goblin', qtd: 6, intervalo: 1.5, rota: 0 }] },
  { grupos: [
    { tipo: 'goblin', qtd: 8, intervalo: 1.1, rota: 4 },
    { tipo: 'orc', qtd: 2, intervalo: 2.5, rota: 0, atraso: 4 },
  ] },
  { grupos: [
    { tipo: 'esqueleto', qtd: 6, intervalo: 1.2, rota: 1 },
    { tipo: 'goblin', qtd: 8, intervalo: 1.0, rota: 5, atraso: 2 },
  ] },
  // lobos pelo sul (perto da mina) + azul pelo braço baixo
  { especial: true, grupos: [
    { tipo: 'lobo', qtd: 6, intervalo: 1.5, rota: 3 },
    { tipo: 'goblin', qtd: 8, intervalo: 1.0, rota: 2, atraso: 3 },
  ] },
  // mini-chefe pela rota do chefe
  { grupos: [
    { tipo: 'golem', qtd: 1, intervalo: 0, rota: 6 },
    { tipo: 'orc', qtd: 5, intervalo: 1.7, rota: 0, atraso: 2 },
    { tipo: 'orc', qtd: 4, intervalo: 1.8, rota: 4, atraso: 4 },
  ] },
  { grupos: [
    { tipo: 'goblin', qtd: 10, intervalo: 0.8, rota: 1 },
    { tipo: 'goblin', qtd: 8, intervalo: 0.9, rota: 5, atraso: 1 },
    { tipo: 'voador', qtd: 6, intervalo: 1.4, rota: 4, atraso: 3 },
  ] },
  { grupos: [
    { tipo: 'orc', qtd: 8, intervalo: 1.2, rota: 2 },
    { tipo: 'esqueleto', qtd: 8, intervalo: 1.1, rota: 4, atraso: 2 },
    { tipo: 'ogro', qtd: 3, intervalo: 2.8, rota: 6, atraso: 4 },
  ] },
  // caçada dupla no sul + pressão aérea
  { especial: true, grupos: [
    { tipo: 'lobo', qtd: 7, intervalo: 1.3, rota: 3 },
    { tipo: 'lobo', qtd: 5, intervalo: 1.5, rota: 2, atraso: 2 },
    { tipo: 'voador', qtd: 6, intervalo: 1.5, rota: 5, atraso: 3 },
    { tipo: 'goblin', qtd: 8, intervalo: 0.9, rota: 1, atraso: 5 },
  ] },
  { grupos: [
    { tipo: 'ogro', qtd: 4, intervalo: 2.2, rota: 0 },
    { tipo: 'ogro', qtd: 4, intervalo: 2.2, rota: 5, atraso: 1 },
    { tipo: 'orc', qtd: 9, intervalo: 1.0, rota: 2, atraso: 3 },
    { tipo: 'esqueleto', qtd: 9, intervalo: 1.0, rota: 3, atraso: 5 },
    { tipo: 'voador', qtd: 6, intervalo: 1.3, rota: 4, atraso: 7 },
  ] },
  // CHEFÃO pela rota do chefe, escoltado por um segundo golem
  { grupos: [
    { tipo: 'reiGoblin', qtd: 1, intervalo: 0, rota: 6, mult: 2.0 },
    { tipo: 'golem', qtd: 1, intervalo: 0, rota: 6, atraso: 5 },
    { tipo: 'goblin', qtd: 10, intervalo: 1.0, rota: 0, atraso: 3 },
    { tipo: 'goblin', qtd: 10, intervalo: 1.0, rota: 4, atraso: 4 },
    { tipo: 'ogro', qtd: 3, intervalo: 2.8, rota: 1, atraso: 8 },
  ] },
];

export const ONDAS_POR_MAPA = [ONDAS_MAPA1, ONDAS_MAPA2, ONDAS_MAPA3];

export class Spawner {
  constructor(def, escala = 1) {
    this.especial = !!def.especial;
    this.grupos = def.grupos.map(g => ({ ...g, spawned: 0, t: g.atraso || 0, esc: escala * (g.mult || 1) }));
    this.terminou = false;
    this.total = def.grupos.reduce((s, g) => s + g.qtd, 0);
  }
  // empilha os grupos de outra onda no mesmo spawner (rush: chamar a próxima
  // onda sem esperar a atual terminar — cada onda mantém sua própria escala de HP).
  merge(def, escala = 1) {
    for (const g of def.grupos) this.grupos.push({ ...g, spawned: 0, t: g.atraso || 0, esc: escala * (g.mult || 1) });
    this.total += def.grupos.reduce((s, g) => s + g.qtd, 0);
    this.terminou = false;
  }
  update(dt, state) {
    let ativos = false;
    for (const g of this.grupos) {
      if (g.spawned >= g.qtd) continue;
      ativos = true;
      g.t -= dt;
      while (g.t <= 0 && g.spawned < g.qtd) {
        state.inimigos.push(new Inimigo(g.tipo, g.rota, g.esc));
        g.spawned++;
        g.t += Math.max(g.intervalo, 0.001);
      }
    }
    if (!ativos) this.terminou = true;
  }
  spawnados() { return this.grupos.reduce((s, g) => s + g.spawned, 0); }
}

// ============================================================
// MODO CAOS — geração procedural de ondas infinitas.
// Determinístico em função de n: a mesma onda n sempre gera o mesmo
// resultado (sem Math.random; variação vem de contas sobre o próprio n).
// Onda gerada = { grupos: [...], caos: true }, consumida pelo Spawner acima.
// ============================================================

// Pools de tipos por "bloco" de 10 ondas (early → mid → late), usados para
// variar o mix de inimigos de forma determinística. 'lobo' aparece como
// corredor rápido ocasional (a lógica de caçador fica em outro módulo).
const POOL_CAOS_INICIAL = ['goblin', 'esqueleto', 'orc', 'goblin', 'esqueleto', 'lobo'];
const POOL_CAOS_MEDIO   = ['goblin', 'orc', 'esqueleto', 'ogro', 'voador', 'orc', 'lobo'];
const POOL_CAOS_PESADO  = ['orc', 'ogro', 'voador', 'ogro', 'esqueleto', 'voador', 'orc', 'lobo'];

function tipoCaos(n, bloco, i) {
  const pool = bloco === 0 ? POOL_CAOS_INICIAL : bloco <= 2 ? POOL_CAOS_MEDIO : POOL_CAOS_PESADO;
  return pool[(n - 1 + i * 3) % pool.length];
}

// Gera a onda n (1, 2, 3, ...) do Modo Caos.
// bloco = Math.floor((n-1)/10): 0 nas ondas 1-10, 1 nas 11-20, etc. — cada
// bloco aumenta o nº de grupos simultâneos (em rotas diferentes), a
// quantidade por grupo e o HP extra (mult), por cima do escalaHP linear.
export function gerarOndaCaos(n) {
  const bloco = Math.floor((n - 1) / 10);
  const numGrupos = Math.max(1, Math.min(CAOS.rotas, CAOS.gruposBase + bloco * CAOS.gruposPorBloco));
  const qtd = CAOS.qtdBase + bloco * CAOS.qtdPorBloco + Math.floor((n % 10) / 3);
  const multBloco = 1 + bloco * CAOS.hpBonusPorBloco;

  const grupos = [];
  for (let i = 0; i < numGrupos; i++) {
    grupos.push({
      tipo: tipoCaos(n, bloco, i),
      qtd,
      intervalo: Math.max(0.6, 1.5 - bloco * 0.05 - i * 0.05),
      rota: i % CAOS.rotas,
      atraso: i * 2, // escalona os grupos p/ não spawnar tudo junto
      mult: multBloco,
    });
  }

  // Chefão a cada CAOS.chefeCada ondas tem prioridade sobre o mini-chefe
  // (que cairia na mesma onda, já que chefeCada é múltiplo de miniChefeCada)
  // — assim não empilha golem + reiGoblin toda vez, exceto como escolta.
  if (n % CAOS.chefeCada === 0) {
    const rotaChefe = bloco % CAOS.rotas;
    grupos.push({
      tipo: 'reiGoblin', qtd: 1, intervalo: 0, rota: rotaChefe,
      atraso: numGrupos * 2 + 3,
      mult: 1.5 + bloco * 0.5,
    });
    if (bloco >= 2) {
      // escolta de golem em blocos altos
      grupos.push({
        tipo: 'golem', qtd: 1, intervalo: 0, rota: (rotaChefe + 1) % CAOS.rotas,
        atraso: numGrupos * 2 + 5,
        mult: 1 + bloco * 0.5,
      });
    }
  } else if (n % CAOS.miniChefeCada === 0) {
    grupos.push({
      tipo: 'golem', qtd: 1, intervalo: 0, rota: (n / CAOS.miniChefeCada) % CAOS.rotas,
      atraso: numGrupos * 2 + 1,
      mult: 1 + bloco * 0.5,
    });
  }

  return { grupos, caos: true };
}
