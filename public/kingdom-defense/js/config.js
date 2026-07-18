// ============================================================
// DADOS DE BALANCEAMENTO — tudo que define números do jogo.
// Adicionar um inimigo/torre novo = adicionar uma entrada aqui.
// ============================================================

export const INIMIGOS = {
  goblin:    { nome: 'Goblin',          hp: 50,   vel: 66, dano: 1,  ouro: 6,   raio: 9,  cor: '#6ab04c' },
  orc:       { nome: 'Orc',             hp: 120,  vel: 46, dano: 2,  ouro: 12,  raio: 12, cor: '#3d7a24', armadura: 0.2 },
  esqueleto: { nome: 'Skeleton',       hp: 80,   vel: 56, dano: 1,  ouro: 9,   raio: 10, cor: '#e8e8e0', revive: true },
  lobo:      { nome: 'Wolf',            hp: 60,   vel: 98, dano: 1,  ouro: 10,  raio: 10, cor: '#57606f', cacador: true },
  ogro:      { nome: 'Ogre',            hp: 200,  vel: 33, dano: 3,  ouro: 20,  raio: 15, cor: '#c9a66b', armadura: 0.4 },
  voador:    { nome: 'Flyer',          hp: 60,   vel: 62, dano: 1,  ouro: 10,  raio: 9,  cor: '#8e44ad', voador: true },
  golem:     { nome: 'Stone Golem',  hp: 850,  vel: 23, dano: 5,  ouro: 80,  raio: 19, cor: '#7f8c8d', armadura: 0.5, chefe: true },
  reiGoblin: { nome: 'Goblin King',      hp: 1700, vel: 27, dano: 10, ouro: 200, raio: 21, cor: '#2ecc71', armadura: 0.3, chefe: true, invoca: 'goblin' },
};

export const TORRES = {
  arqueiro: { nome: 'Archers',    custo: { ouro: 100 }, alcance: 115, cadencia: 0.45, dano: 14, tipoDano: 'fisico', antiAereo: true,  cor: '#a1713a', corProj: '#7a4a1e', velProj: 280 },
  canhao:   { nome: 'Cannon',       custo: { ouro: 150 }, alcance: 100, cadencia: 1.8, dano: 42, tipoDano: 'fisico', antiAereo: false, cor: '#4b6584', corProj: '#2f3640', velProj: 190, area: 44 },
  magica:   { nome: 'Magic Tower', custo: { ouro: 120 }, alcance: 125, cadencia: 1.1, dano: 26, tipoDano: 'magico', antiAereo: true,  cor: '#8e44ad', corProj: '#c56cf0', velProj: 320 },
  gelo:     { nome: 'Ice Tower', custo: { ouro: 140 }, alcance: 108, cadencia: 1.5, dano: 16, tipoDano: 'magico', antiAereo: true,  cor: '#4aa3d4', corProj: '#8fd6f5', velProj: 300, area: 52, slow: { fator: 0.5, dur: 1.6 } },
};

// Upgrade: até nível 3. Custo e multiplicadores por nível ganho.
export const UPGRADE = {
  maxNivel: 4,
  custo: (base, nivel) => ({ ouro: Math.round(base.custo.ouro * 0.8 * nivel), madeira: 22 * nivel }),
  multDano: 1.7,
  multAlcance: 1.12,
  multCadencia: 0.88, // menor = atira mais rápido
};

export const ECONOMIA = {
  mina:       { nome: 'Gold Mine', custo: { ouro: 100 }, trabalhadores: 2, maxTrabalhadores: 4, recurso: 'ouro',    porViagem: 12, tipoIcone: 'icone_ouro' },
  madeireira: { nome: 'Lumber Mill',   custo: { ouro: 100 }, trabalhadores: 2, maxTrabalhadores: 4, recurso: 'madeira', porViagem: 8,  tipoIcone: 'icone_madeira' },
};

export const TRABALHADOR = {
  vel: 62,
  velRecuo: 1.6,       // multiplicador ao recuar
  tempoColeta: 1.2,    // segundos parado coletando
  respawn: 15,         // segundos p/ repor trabalhador morto
  custoContratar: 50,  // ouro p/ contratar trabalhador extra
};

export const JOGO = {
  vidas: 20,
  ouroInicial: 300,
  madeiraInicial: 60,
  bonusOndaOuro: 60,   // +50% (era 40)
  bonusOndaMadeira: 18, // +50% (era 12)
  escalaHPPorOnda: 0.15,   // +15% HP por onda
  tempoPreparo: 30,        // countdown entre ondas
  tempoPreparoInicial: 60,
};

// ============================================================
// MODO CAOS — laboratório, especiais e ondas infinitas.
// ============================================================

// LABORATÓRIO — upgrades globais (valem para TODAS as torres do mapa).
// Duas trilhas melhoráveis (dano e velocidade), com custo que sobe a cada
// nível. Ao atingir LAB.nivelEspeciais (soma das trilhas), liberam-se os
// ataques especiais — desbloqueios únicos e MUITO caros, um por tipo de torre.
export const LAB = {
  nivelEspeciais: 30,        // soma (nívelDano + nívelVel) p/ liberar o 1º tier dos especiais
  nivelPorTier: [30, 60, 90],// soma de níveis exigida p/ liberar cada tier do especial
  ganhoDano: 0.06,           // +6% de dano por nível de dano (aditivo)
  ganhoVel: 0.975,           // cadência ×0.975 por nível de velocidade (atira mais rápido)
  baseDano: { ouro: 120, madeira: 52 },   // madeira +30%
  baseVel:  { ouro: 140, madeira: 65 },   // madeira +30%
  // custo do PRÓXIMO nível: sobe exponencialmente com o nível já comprado.
  custo: (base, nivel) => ({
    ouro: Math.round(base.ouro * Math.pow(1.16, nivel)),
    madeira: Math.round(base.madeira * Math.pow(1.14, nivel)),
  }),
  // Ataques especiais: agora com 3 TIERS por torre (liberados nos níveis 30/60/90
  // do laboratório). Cada tier é mais caro e mais forte / faz mais do seu efeito.
  // Depois de liberado, toda torre daquele tipo dispara o especial sozinha, no cooldown.
  // Toda a madeira dos custos já está +30%.
  especiais: {
    arqueiro: {
      nome: 'Arrow Rain', icone: '🏹',
      descricao: ['arrows at multiple targets', 'MORE targets per volley', 'MANY MORE targets per volley'],
      niveis: [
        { custo: { ouro: 6000,  madeira: 3120 },  cooldown: 10, alvos: 5,  multDano: 1.0 },
        { custo: { ouro: 12000, madeira: 6240 },  cooldown: 9,  alvos: 8,  multDano: 1.15 },
        { custo: { ouro: 21000, madeira: 10900 }, cooldown: 8,  alvos: 13, multDano: 1.3 },
      ],
    },
    canhao: {
      nome: 'Fireball', icone: '🔥',
      descricao: ['explodes and burns', 'MORE fire damage over time', 'LARGE AREA explosion'],
      niveis: [
        { custo: { ouro: 7500,  madeira: 3900 },  cooldown: 13, raio: 95,  dano: 150, queima: { dps: 35, dur: 4 } },
        { custo: { ouro: 15000, madeira: 7800 },  cooldown: 12, raio: 105, dano: 200, queima: { dps: 70, dur: 6 } },
        { custo: { ouro: 26000, madeira: 13500 }, cooldown: 11, raio: 175, dano: 340, queima: { dps: 95, dur: 6 } },
      ],
    },
    magica: {
      nome: 'Massive Damage', icone: '💥',
      descricao: ['huge damage to target + splash', 'MORE damage', 'strong AREA damage'],
      niveis: [
        { custo: { ouro: 9000,  madeira: 4680 },  cooldown: 15, multDano: 8,  respingo: 60,  fracRespingo: 0.4 },
        { custo: { ouro: 18000, madeira: 9360 },  cooldown: 14, multDano: 12, respingo: 75,  fracRespingo: 0.5 },
        { custo: { ouro: 31000, madeira: 16100 }, cooldown: 13, multDano: 16, respingo: 125, fracRespingo: 0.75 },
      ],
    },
    gelo: {
      nome: 'Freeze', icone: '❄️',
      descricao: ['freezes in an area', 'freezes for LONGER', 'freezes with LESS cooldown'],
      niveis: [
        { custo: { ouro: 8000,  madeira: 4160 },  cooldown: 16, raio: 140, dur: 2.5 },
        { custo: { ouro: 16000, madeira: 8320 },  cooldown: 16, raio: 150, dur: 4.0 },
        { custo: { ouro: 28000, madeira: 14500 }, cooldown: 10, raio: 165, dur: 4.5 },
      ],
    },
  },
  custoConstrucao: { ouro: 1000 },   // custo para erguer o laboratório no mapa
};

// Coleta de recursos melhorável de 1 em 1 no menu da construção.
// Ouro: começa em 5 nos DOIS modos — máx 20 no caos, máx 15 no normal.
export const COLETA = {
  ouroInicial: 5,     ouroMax: 20,    ouroMaxNormal: 15,   ouroInicialNormal: 7,
  madeiraInicial: 3,  madeiraMax: 15, madeiraInicialNormal: 5, madeiraMaxNormal: 10,
  // custo (em ouro) do próximo +1, subindo com o nível atual de coleta.
  // "inicial" = ponto de partida do modo ativo (caos e normal começam em níveis diferentes).
  custoOuro:   (atual, inicial = COLETA.ouroInicial)    => ({ ouro: 80 + (atual - inicial) * 60 }),
  custoMadeira:(atual, inicial = COLETA.madeiraInicial) => ({ ouro: 70 + (atual - inicial) * 55 }),
};

// Sintonia das ondas infinitas do modo caos (usada por gerarOndaCaos em waves.js).
export const CAOS = {
  rotas: 4,               // rotas de invasão disponíveis (índices 0..3)
  qtdBase: 6,             // monstros por grupo no começo
  qtdPorBloco: 2,         // +N por grupo a cada bloco de 10 ondas ("mais monstros")
  gruposBase: 1,          // grupos simultâneos no começo
  gruposPorBloco: 1,      // +1 grupo por bloco de 10 ondas (até o nº de rotas)
  miniChefeCada: 5,       // Golem a cada 5 ondas
  chefeCada: 10,          // Rei Goblin a cada 10 ondas
  hpBonusPorBloco: 0.25,  // mult de HP extra por bloco de 10 ondas (além do escalaHP linear)
};
