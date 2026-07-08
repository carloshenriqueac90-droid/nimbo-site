// ============================================================
// DADOS DE BALANCEAMENTO — tudo que define números do jogo.
// Adicionar um inimigo/torre novo = adicionar uma entrada aqui.
// ============================================================

export const INIMIGOS = {
  goblin:    { nome: 'Goblin',          hp: 50,   vel: 66, dano: 1,  ouro: 6,   raio: 9,  cor: '#6ab04c' },
  orc:       { nome: 'Orc',             hp: 120,  vel: 46, dano: 2,  ouro: 12,  raio: 12, cor: '#3d7a24', armadura: 0.2 },
  esqueleto: { nome: 'Esqueleto',       hp: 80,   vel: 56, dano: 1,  ouro: 9,   raio: 10, cor: '#e8e8e0', revive: true },
  lobo:      { nome: 'Lobo',            hp: 60,   vel: 98, dano: 1,  ouro: 10,  raio: 10, cor: '#57606f', cacador: true },
  ogro:      { nome: 'Ogro',            hp: 200,  vel: 33, dano: 3,  ouro: 20,  raio: 15, cor: '#c9a66b', armadura: 0.4 },
  voador:    { nome: 'Voador',          hp: 60,   vel: 62, dano: 1,  ouro: 10,  raio: 9,  cor: '#8e44ad', voador: true },
  golem:     { nome: 'Golem de Pedra',  hp: 850,  vel: 23, dano: 5,  ouro: 80,  raio: 19, cor: '#7f8c8d', armadura: 0.5, chefe: true },
  reiGoblin: { nome: 'Rei Goblin',      hp: 1700, vel: 27, dano: 10, ouro: 200, raio: 21, cor: '#2ecc71', armadura: 0.3, chefe: true, invoca: 'goblin' },
};

export const TORRES = {
  arqueiro: { nome: 'Arqueiros',    custo: { ouro: 100 }, alcance: 115, cadencia: 0.45, dano: 14, tipoDano: 'fisico', antiAereo: true,  cor: '#a1713a', corProj: '#7a4a1e', velProj: 280 },
  canhao:   { nome: 'Canhão',       custo: { ouro: 150 }, alcance: 100, cadencia: 1.8, dano: 42, tipoDano: 'fisico', antiAereo: false, cor: '#4b6584', corProj: '#2f3640', velProj: 190, area: 44 },
  magica:   { nome: 'Torre Mágica', custo: { ouro: 120 }, alcance: 125, cadencia: 1.1, dano: 26, tipoDano: 'magico', antiAereo: true,  cor: '#8e44ad', corProj: '#c56cf0', velProj: 320 },
  gelo:     { nome: 'Torre de Gelo', custo: { ouro: 140 }, alcance: 108, cadencia: 1.5, dano: 16, tipoDano: 'magico', antiAereo: true,  cor: '#4aa3d4', corProj: '#8fd6f5', velProj: 300, area: 52, slow: { fator: 0.5, dur: 1.6 } },
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
  mina:       { nome: 'Mina de Ouro', custo: { ouro: 100 }, trabalhadores: 2, maxTrabalhadores: 4, recurso: 'ouro',    porViagem: 12, tipoIcone: 'icone_ouro' },
  madeireira: { nome: 'Madeireira',   custo: { ouro: 100 }, trabalhadores: 2, maxTrabalhadores: 4, recurso: 'madeira', porViagem: 8,  tipoIcone: 'icone_madeira' },
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
  bonusOndaOuro: 40,
  bonusOndaMadeira: 12,
  escalaHPPorOnda: 0.15,   // +15% HP por onda
  tempoPreparo: 30,        // countdown entre ondas
  tempoPreparoInicial: 60,
};
