// ============================================================
// MAIN — bootstrap, estado central, game loop, fases e input.
// Sistemas novos (heróis, clima, eventos): registrar update/draw aqui.
// ============================================================

import { JOGO, TORRES, ECONOMIA, UPGRADE, TRABALHADOR, LAB, COLETA } from './config.js';
import { LARGURA, ALTURA, CASTELO, SITES, PLATAFORMAS, RECORTE_CASTELO, MAPAS, MAPA_IDX, MODO, LAB_POS, desenharTerreno } from './map.js';
import { Torre, Construcao, Efeito, efeitoTexto, Inimigo } from './entities.js';
import { ONDAS_POR_MAPA, Spawner, gerarOndaCaos } from './waves.js';
import { lab, nivelLab, custoDano, custoVel, melhorarDano, melhorarVel, especialNivel, especialLiberavel, noMaximoEspecial, custoEspecial, liberarEspecial, desenharLab } from './lab.js';

const CAOS_MODO = MODO === 'caos';
// ondas da fase ativa; no modo caos são geradas proceduralmente (infinitas)
const ONDAS = CAOS_MODO ? null : ONDAS_POR_MAPA[Math.min(MAPA_IDX, ONDAS_POR_MAPA.length - 1)];
const TOTAL_ONDAS = CAOS_MODO ? Infinity : ONDAS.length;
import { initUI, els, atualizarHUD, abrirMenu, fecharMenu, menuAberto, atualizarMenu, abrirOverlayImg, abrirPainelImg, fecharPainel, registrarFecharPainel, painelAberto, toast, mostrarOverlay, esconderOverlay } from './ui.js';

// ---------------------------------------------------------- Arte dos menus (imagens cortadas)
const UI = nome => `./assets/ui/${nome}.png`;
import { carregarSave, gravarSave } from './save.js';
import { dist } from './util.js';
import { precarregar, sprite } from './sprites.js';
import { iniciarAudio, tocar, mutado, alternarMudo, obterVolume, definirVolume } from './sound.js';

// ---------------------------------------------------------- Estado central
const state = {
  fase: 'inicio', // inicio | preparo | onda | derrota | vitoria
  vidas: JOGO.vidas,
  ouro: CAOS_MODO ? JOGO.ouroInicial : 600,  // todos os modos normais começam com 600; caos mantém o padrão
  madeira: JOGO.madeiraInicial,
  coletaOuro: CAOS_MODO ? COLETA.ouroInicial : COLETA.ouroInicialNormal,  // ouro por viagem: 5 no caos / 7 no normal (melhorável)
  coletaMadeira: CAOS_MODO ? COLETA.madeiraInicial : COLETA.madeiraInicialNormal, // madeira: 3 no caos / 5 no normal (melhorável)
  labConstruido: false, // no caos o laboratório precisa ser erguido (1000 ouro)
  onda: 0,             // última onda iniciada (1..10)
  ondaPaga: 0,         // última onda cuja recompensa já foi paga (p/ rush de ondas)
  tPreparo: JOGO.tempoPreparoInicial,
  velocidade: 1,
  escalaHP: 1,
  recuados: false,
  perigoCacadores: false,
  spawner: null,
  inimigos: [],
  trabalhadores: [],
  torres: [],
  projeteis: [],
  construcoes: [],
  efeitos: [],
  selecionado: null,   // { tipo: 'spot'|'torre', ref } p/ desenhar alcance
  save: carregarSave(),
};

// ---------------------------------------------------------- Canvas
const canvas = document.getElementById('tela');
const ctx = canvas.getContext('2d');
let escala = 1;

// terreno pré-renderizado (2x p/ nitidez) — criado após o preload dos sprites, em iniciar()
let terreno = null;

// Moldura em volta do jogo: frações do canvas reservadas para as vigas
// (o mapa encolhe levemente e fica dentro da abertura do molde).
const MOLDE = { esq: 0.032, dir: 0.032, topo: 0.048, base: 0.043 };

function ajustarTela() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = window.innerWidth, ch = window.innerHeight;
  escala = Math.min(cw / (LARGURA * (1 + MOLDE.esq + MOLDE.dir)),
                    ch / (ALTURA * (1 + MOLDE.topo + MOLDE.base)));
  canvas.style.width = `${LARGURA * escala}px`;
  canvas.style.height = `${ALTURA * escala}px`;
  canvas.width = Math.round(LARGURA * escala * dpr);
  canvas.height = Math.round(ALTURA * escala * dpr);
  ctx.setTransform(escala * dpr, 0, 0, escala * dpr, 0, 0);
  // padding da arena = área das vigas da moldura (HUD do topo vive na viga)
  const arena = document.getElementById('arena');
  const pt = ALTURA * escala * MOLDE.topo;
  arena.style.padding = `${pt}px ${LARGURA * escala * MOLDE.dir}px ${ALTURA * escala * MOLDE.base}px ${LARGURA * escala * MOLDE.esq}px`;
  arena.style.setProperty('--molde-topo', `${pt}px`);
}
window.addEventListener('resize', ajustarTela);
ajustarTela();

function telaParaMundo(ev) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (ev.clientX - r.left) / escala,
    y: (ev.clientY - r.top) / escala,
  };
}
function mundoParaTela(x, y) {
  const r = canvas.getBoundingClientRect();
  return { x: r.left + x * escala, y: r.top + y * escala };
}

// ---------------------------------------------------------- Economia de recursos
function podePagar(custo) {
  return state.ouro >= (custo.ouro || 0) && state.madeira >= (custo.madeira || 0);
}
function pagar(custo) {
  state.ouro -= custo.ouro || 0;
  state.madeira -= custo.madeira || 0;
}
function iconeHTML(nome) {
  return `<img src="./assets/${nome}.png" class="icone-inline" alt="">`;
}
function textoCusto(custo) {
  const p = [];
  if (custo.ouro) p.push(`${custo.ouro} ${iconeHTML('icone_ouro')}`);
  if (custo.madeira) p.push(`${custo.madeira} ${iconeHTML('icone_madeira')}`);
  return p.join(' + ');
}

// ---------------------------------------------------------- Fases
function iniciarOnda() {
  // sem travamento: pode chamar a próxima onda no preparo OU no meio de uma onda
  // (os inimigos empilham). No normal, no máximo TOTAL_ONDAS chamadas; no caos é infinito.
  if (state.fase !== 'preparo' && state.fase !== 'onda') return;
  if (state.onda >= TOTAL_ONDAS) return;
  tocar('onda_inicio', { volume: 0.6 });
  state.onda++;
  const esc = 1 + (state.onda - 1) * JOGO.escalaHPPorOnda;
  state.escalaHP = esc;   // usado pelo invoca do Rei Goblin
  const def = CAOS_MODO ? gerarOndaCaos(state.onda) : ONDAS[state.onda - 1];
  if (state.fase === 'onda' && state.spawner) {
    state.spawner.merge(def, esc);          // empilha na onda em andamento
  } else {
    state.spawner = new Spawner(def, esc);
    state.fase = 'onda';
  }
  state.perigoCacadores = state.perigoCacadores || !!def.especial;
  fecharMenu();
  state.selecionado = null;
  if (def.especial) {
    toast('⚠️ Wolves on the hunt! Protect your workers!', 4000, 'perigo');
  } else if (def.grupos.some(g => g.tipo === 'golem' || g.tipo === 'reiGoblin')) {
    toast('👑 A boss approaches!', 3500, 'perigo');
  } else {
    toast(`Wave ${state.onda} — get ready!`, 1800);
  }
}

function fimDeOnda() {
  tocar('onda_vitoria', { volume: 0.55 });
  state.spawner = null;
  state.perigoCacadores = false;
  const limpas = Math.max(1, state.onda - state.ondaPaga);  // ondas vencidas neste lote (rush = várias)
  state.ondaPaga = state.onda;
  const bO = JOGO.bonusOndaOuro * limpas, bM = JOGO.bonusOndaMadeira * limpas;
  state.ouro += bO;
  state.madeira += bM;
  efeitoTexto(state, CASTELO.x - 14, CASTELO.y - 80, `Bonus: +${bO}`, '#ffd166', 'icone_ouro');
  efeitoTexto(state, CASTELO.x + 6, CASTELO.y - 60, `+${bM}`, '#c98d4b', 'icone_madeira');
  state.save.melhorOnda = Math.max(state.save.melhorOnda, state.onda);
  gravarSave(state.save);
  if (state.onda >= TOTAL_ONDAS) { vitoria(); return; }
  state.fase = 'preparo';
  state.tPreparo = JOGO.tempoPreparo;
  toast(`Wave ${state.onda} cleared! ✔`, 2200);
}

function derrota() {
  tocar('jogo_derrota', { volume: 0.7 });
  state.fase = 'derrota';
  gravarSave(state.save);
  abrirOverlayImg({
    src: UI('menu_derrota'),
    hots: [
      { cx: 50.1, cy: 69.3, w: 56.8, h: 8.7, onClick: () => location.reload() },
    ],
  });
}

function vitoria() {
  tocar('jogo_vitoria', { volume: 0.7 });
  state.fase = 'vitoria';
  state.save.vitorias++;
  gravarSave(state.save);
  mostrarOverlay(`
    <div class="aviso">
      <h1>🏆 Victory!</h1>
      <p>The kingdom is safe — all ${TOTAL_ONDAS} waves cleared!<br>Lives left: ${state.vidas} · Wins: ${state.save.vitorias}</p>
      <button id="btnReiniciar" type="button">Play again</button>
    </div>`);
  document.getElementById('btnReiniciar').addEventListener('click', () => location.reload());
}

function comecarPartida(msg) {
  iniciarAudio(); // precisa de gesto do usuário; primeiro clique do jogo
  esconderOverlay();
  state.fase = 'preparo';
  toast(msg, 3000);
}

// Tela de entrada: escolha do modo de jogo (arte menu_modos, 2 cartões clicáveis).
function telaModos() {
  const irNormal = () => {
    if (MODO !== 'normal') { localStorage.setItem('kd-modo', 'normal'); sessionStorage.setItem('kd-goto', 'normal'); location.reload(); }
    else telaInicial();
  };
  const irCaos = () => {
    localStorage.setItem('kd-modo', 'caos');
    if (MODO !== 'caos') location.reload();  // recarrega no mapa caos → telaCaos
    else telaCaos();
  };
  abrirOverlayImg({
    src: UI('menu_modos'),
    hots: [
      { cx: 50, cy: 47.8, w: 61.7, h: 19.3, onClick: irNormal,
        tip: 'Campaign across 3 maps, 10 waves each. Mines and lumber mills gather on their own; wolves hunt on special waves.' },
      { cx: 50, cy: 72.4, w: 61.8, h: 17.6, onClick: irCaos,
        tip: 'Endless waves that grow stronger every 10 waves. Build the Laboratory and unlock the towers special attacks.' },
    ],
  });
}

// Modo Normal: seleção de mapa (arte menu_normal_intro) + recorde vivo.
function telaInicial() {
  const normais = MAPAS.map((m, i) => ({ m, i })).filter(o => !o.m.caos);
  const cx = [29.2, 50, 70.6];   // centros dos 3 cartões de mapa na arte
  const trocarMapa = idx => {
    if (idx === MAPA_IDX) { comecarPartida('Build your defenses and your economy!'); return; }
    localStorage.setItem('kd-mapa', String(idx));
    sessionStorage.setItem('kd-goto', 'normal');
    location.reload();
  };
  const hots = normais.slice(0, 3).map((o, k) => ({
    cx: cx[k], cy: 61.3, w: 17, h: 13, cls: o.i === MAPA_IDX ? 'sel' : '',
    onClick: () => trocarMapa(o.i),
    tip: `<b>${o.m.nome}</b>${o.i === MAPA_IDX ? ' (current map)' : ''} — tap to play here.`,
  }));
  hots.push({ cx: 50, cy: 73.3, w: 52, h: 6, onClick: () => comecarPartida('Build your defenses and your economy!') });
  hots.push({ cx: 49.7, cy: 81, w: 52, h: 5.5, onClick: telaModos });
  abrirOverlayImg({
    src: UI('menu_normal_intro'),
    hots,
  });
}

// Modo Caos: introdução e início da partida infinita (arte menu_caos_intro).
function telaCaos() {
  abrirOverlayImg({
    src: UI('menu_caos_intro'),
    hots: [
      { cx: 50.4, cy: 65, w: 49.1, h: 7.9, onClick: () => comecarPartida('Chaos Mode! Build and survive.') },
      { cx: 50.2, cy: 75.8, w: 48.8, h: 6.2, onClick: () => { localStorage.setItem('kd-modo', 'normal'); location.reload(); } },
    ],
  });
}

// ---------------------------------------------------------- Menus de contexto
// Construir torre (arte 'torres': 4 linhas — arqueiro, canhão, mágica, gelo).
function menuConstruirTorre(spot) {
  tocar('clique', { volume: 0.3 });
  state.selecionado = { tipo: 'spot', ref: spot };
  const linhas = [['arqueiro', 17.8], ['canhao', 41.7], ['magica', 65.4], ['gelo', 87.6]];
  const hots = linhas.map(([tipo, cy]) => {
    const def = TORRES[tipo];
    return {
      cx: 50.6, cy, w: 85.4, h: 20,
      din: () => ({ desab: !podePagar(def.custo) }),
      tip: `<b>${def.nome}</b> — ${textoCusto(def.custo)} · dmg ${def.dano}${def.area ? ' (area)' : ''}${def.slow ? ' · slow' : ''}${def.antiAereo ? '' : ' · no flyers'}.`,
      onClick: () => {
        if (!podePagar(def.custo)) return;
        pagar(def.custo);
        tocar('confirmar', { volume: 0.4 });
        const t = new Torre(spot, tipo);
        spot.torre = t;
        state.torres.push(t);
        fecharTudo();
      },
    };
  });
  abrirPainelImg({ src: UI('torres'), peq: true, hots });
}

// Melhorar torre: menu de contexto simples ao lado da torre.
function menuTorre(torre) {
  tocar('clique', { volume: 0.3 });
  state.selecionado = { tipo: 'torre', ref: torre };
  const p = mundoParaTela(torre.x, torre.y);
  const itens = [];
  if (torre.nivel < UPGRADE.maxNivel) {
    const custo = torre.custoUpgrade();
    itens.push({
      rotulo: `⬆ Upgrade ${torre.base.nome} (lvl ${torre.nivel + 1})`,
      sub: textoCusto(custo),
      desabilitadoFn: () => !podePagar(custo),
      acao: () => {
        pagar(custo);
        tocar('confirmar', { volume: 0.4 });
        torre.nivel++;
        torre.calcularStats();
        efeitoTexto(state, torre.x, torre.y - 26, 'Upgraded!', '#a6f77b');
        fecharTudo();
      },
    });
  } else {
    itens.push({ rotulo: `⭐ ${torre.base.nome} — max level`, desabilitado: true, acao: () => {} });
  }
  abrirMenu(itens, p.x, p.y);
}

// Construir economia (arte botoes_construir): esquerda = Madeireira, direita = Mina.
// Escolha LIVRE em qualquer sítio — os dois lados sempre ficam disponíveis.
function menuSite(site) {
  tocar('clique', { volume: 0.3 });
  const construir = tipo => {
    const def = ECONOMIA[tipo];
    if (!podePagar(def.custo)) return;
    site.tipo = tipo;                 // o jogador decide: mina ou madeireira
    pagar(def.custo);
    tocar('confirmar', { volume: 0.4 });
    const c = new Construcao(site, state);
    site.construcao = c;
    state.construcoes.push(c);
    fecharTudo();
  };
  abrirPainelImg({
    src: UI('botoes_construir'),
    hots: [
      { cx: 25.1, cy: 42.1, w: 41, h: 19,
        din: () => ({ desab: !podePagar(ECONOMIA.madeireira.custo) }),
        tip: 'Build Lumber Mill — gathers wood on its own. 100 gold · 2 workers.',
        onClick: () => construir('madeireira') },
      { cx: 75.5, cy: 42.1, w: 41, h: 19,
        din: () => ({ desab: !podePagar(ECONOMIA.mina.custo) }),
        tip: 'Build Gold Mine — gathers gold on its own. 100 gold · 2 workers.',
        onClick: () => construir('mina') },
    ],
  });
}

// Painel da mina/madeireira (arte painel_mina): esquerda = melhorar coleta (caos),
// direita = contratar trabalhador. Custos/contagens em tempo real.
function menuContratar(site) {
  tocar('clique', { volume: 0.3 });
  const c = site.construcao;
  const def = c.def;
  const custoH = { ouro: TRABALHADOR.custoContratar };
  const hots = [], textos = [];
  // Geometria dos 2 slots depende da arte (mina e madeira têm proporções diferentes).
  // s = [cx esquerdo, cx direito]; cy/w/h dos slots; ty = y do texto de custo.
  const geo = def.recurso === 'ouro'
    ? { img: 'painel_mina',    s: [30.2, 70.0], cy: 55.3, w: 33,   h: 44,   ty: 73 }
    : { img: 'painel_madeira', s: [29.2, 70.2], cy: 49,   w: 33,   h: 33,   ty: 61 };

  // Melhoria de coleta, nos DOIS modos: ouro (5→20 caos / 7→15 normal) e
  // madeira (3→15 caos / 5→10 normal) — cada modo com seu próprio teto/base.
  const ouro = def.recurso === 'ouro';
  const inicialC = ouro
    ? (CAOS_MODO ? COLETA.ouroInicial : COLETA.ouroInicialNormal)
    : (CAOS_MODO ? COLETA.madeiraInicial : COLETA.madeiraInicialNormal);
  const nivel = () => (ouro ? state.coletaOuro : state.coletaMadeira);
  const max = ouro
    ? (CAOS_MODO ? COLETA.ouroMax : COLETA.ouroMaxNormal)
    : (CAOS_MODO ? COLETA.madeiraMax : COLETA.madeiraMaxNormal);
  // mapas normais: metade do preço para melhorar a coleta (ouro e madeira); caos mantém
  const fatorPreco = CAOS_MODO ? 1 : 0.5;
  const custoC = () => {
    const c = ouro ? COLETA.custoOuro(nivel(), inicialC) : COLETA.custoMadeira(nivel(), inicialC);
    return { ouro: Math.round(c.ouro * fatorPreco) };
  };
  const noMax = () => nivel() >= max;
  hots.push({
    cx: geo.s[0], cy: geo.cy, w: geo.w, h: geo.h,
    din: () => ({ desab: noMax() || !podePagar(custoC()) }),
    tip: () => noMax()
      ? `Gathering maxed (${max} per trip).`
      : `Each trip will yield <b>${nivel() + 1}</b>. Cost: ${textoCusto(custoC())}.`,
    onClick: () => {
      if (noMax() || !podePagar(custoC())) return;
      pagar(custoC()); tocar('confirmar', { volume: 0.4 });
      if (ouro) state.coletaOuro++; else state.coletaMadeira++;
      efeitoTexto(state, site.x, site.y - 24, 'Gather +1!', '#a6f77b');
    },
  });
  textos.push({ cx: geo.s[0], cy: geo.ty, cls: 'custo',
    get: () => noMax() ? `Gather ${max} (max)` : `Gather ${nivel()} → ${nivel() + 1}<br>${textoCusto(custoC())}` });

  const atual = () => c.contarTrabalhadores(state);
  const cheio = () => atual() >= def.maxTrabalhadores;
  hots.push({
    cx: geo.s[1], cy: geo.cy, w: geo.w, h: geo.h,
    din: () => ({ desab: cheio() || !podePagar(custoH) }),
    tip: () => cheio()
      ? `Team is full (${def.maxTrabalhadores} workers).`
      : `Hire one more worker for the ${def.nome}. Cost: ${textoCusto(custoH)}.`,
    onClick: () => {
      if (cheio() || !podePagar(custoH)) return;
      pagar(custoH); tocar('confirmar', { volume: 0.4 }); c.contratar(state);
    },
  });
  textos.push({ cx: geo.s[1], cy: geo.ty, cls: 'custo',
    get: () => cheio() ? `${atual()}/${def.maxTrabalhadores} · full` : `${atual()}/${def.maxTrabalhadores}<br>${textoCusto(custoH)}` });

  abrirPainelImg({ src: UI(geo.img), peq: true, hots, textos });
}

// Construção do Laboratório (arte botao_lab): paga o custo fixo (1000 ouro).
function menuLabConstruir() {
  tocar('clique', { volume: 0.3 });
  const custo = LAB.custoConstrucao;
  abrirPainelImg({
    src: UI('botao_lab'),
    mini: true,
    hots: [{
      cx: 50, cy: 50, w: 90, h: 77,
      din: () => ({ desab: !podePagar(custo) }),
      tip: () => `Build the Laboratory for ${textoCusto(custo)}. Then upgrade the damage and speed of ALL towers.`,
      onClick: () => {
        if (!podePagar(custo)) return;
        pagar(custo); tocar('confirmar', { volume: 0.5 });
        state.labConstruido = true;
        efeitoTexto(state, LAB_POS.x, LAB_POS.y - 46, 'Laboratory built!', '#a6f77b');
        toast('⚗️ Laboratory built! Tap it to upgrade the towers.', 3500);
        fecharTudo();
      },
    }],
  });
}

// Painel do Laboratório (arte painel_lab, 6 slots 2×3): dano, velocidade e 4 especiais.
function menuLab() {
  tocar('clique', { volume: 0.3 });
  const SLOTS = [
    { cx: 24.5, cy: 35.1 }, { cx: 50.7, cy: 35.3 }, { cx: 76.9, cy: 35.2 },
    { cx: 24.4, cy: 72 },   { cx: 50.6, cy: 72 },   { cx: 77, cy: 72 },
  ];
  const box = i => ({ cx: SLOTS[i].cx, cy: SLOTS[i].cy, w: 22.3, h: 31 });
  const texto = (i, cls, get) => ({ cx: SLOTS[i].cx, cy: SLOTS[i].cy + 15, cls, get });
  const hots = [], textos = [];

  const custoD = () => custoDano(), custoV = () => custoVel();
  hots.push({ ...box(0),
    din: () => ({ desab: !podePagar(custoD()) }),
    tip: () => `<b>+${Math.round(LAB.ganhoDano * 100)}% damage</b> on all towers. Level ${lab.nivelDano}. Cost: ${textoCusto(custoD())}.`,
    onClick: () => {
      if (!podePagar(custoD())) return;
      pagar(custoD()); tocar('confirmar', { volume: 0.4 }); melhorarDano();
      state.torres.forEach(t => t.calcularStats());
      efeitoTexto(state, LAB_POS.x, LAB_POS.y - 44, 'Damage +!', '#a6f77b');
    },
  });
  textos.push(texto(0, 'custo', () => `lvl ${lab.nivelDano}<br>${textoCusto(custoD())}`));

  hots.push({ ...box(1),
    din: () => ({ desab: !podePagar(custoV()) }),
    tip: () => `<b>Faster fire rate</b> on all towers. Level ${lab.nivelVel}. Cost: ${textoCusto(custoV())}.`,
    onClick: () => {
      if (!podePagar(custoV())) return;
      pagar(custoV()); tocar('confirmar', { volume: 0.4 }); melhorarVel();
      state.torres.forEach(t => t.calcularStats());
      efeitoTexto(state, LAB_POS.x, LAB_POS.y - 44, 'Speed +!', '#a6f77b');
    },
  });
  textos.push(texto(1, 'custo', () => `lvl ${lab.nivelVel}<br>${textoCusto(custoV())}`));

  // Especiais em 3 tiers (níveis 30/60/90). Cada compra sobe um tier (mais forte).
  ['canhao', 'arqueiro', 'magica', 'gelo'].forEach((tipo, k) => {
    const i = 2 + k;
    const esp = LAB.especiais[tipo];
    const tier = especialNivel(tipo);          // 0..3
    const desc = t => esp.descricao[t - 1];    // efeito do tier t
    if (noMaximoEspecial(tipo)) {
      hots.push({ ...box(i), din: () => ({ desab: true }),
        tip: `<b>${esp.nome}</b> level 3/3 (max) — ${desc(3)}. ${TORRES[tipo].nome} towers.` });
      textos.push(texto(i, 'custo', () => '✓ lvl 3/3'));
    } else {
      const prox = tier + 1;                    // tier a ser comprado (1..3)
      const nivelReq = LAB.nivelPorTier[tier];  // nível do lab exigido p/ o próximo tier
      const custoE = () => custoEspecial(tipo);
      hots.push({ ...box(i),
        din: () => ({ desab: !especialLiberavel(tipo) || !podePagar(custoE()) }),
        tip: () => especialLiberavel(tipo)
          ? `<b>${esp.nome}</b> level ${prox}: ${desc(prox)}. ${TORRES[tipo].nome} towers. Cost: ${textoCusto(custoE())}.`
          : `<b>${esp.nome}</b> level ${prox}: ${desc(prox)}. Needs lab level ${nivelReq} (current ${nivelLab()}).`,
        onClick: () => {
          if (!especialLiberavel(tipo) || !podePagar(custoE())) return;
          pagar(custoE()); tocar('confirmar', { volume: 0.5 }); liberarEspecial(tipo);
          toast(`✨ ${esp.nome} level ${prox} unlocked on ${TORRES[tipo].nome} towers!`, 3800);
          menuLab();  // reconstrói com o novo tier
        },
      });
      textos.push(texto(i, 'custo', () => especialLiberavel(tipo)
        ? `${tier > 0 ? `lvl ${tier}→${prox}<br>` : ''}${textoCusto(custoE())}`
        : `${tier > 0 ? `lvl ${tier}/3<br>` : ''}🔒 lvl ${nivelReq}`));
    }
  });

  abrirPainelImg({ src: UI('painel_lab'), hots, textos });
}

function fecharTudo() {
  fecharMenu();
  fecharPainel();
  state.selecionado = null;
}

// Menu de pausa (arte menu_pausa): Continuar / Recomeçar / Voltar ao início.
function menuPausa() {
  if (state.fase !== 'preparo' && state.fase !== 'onda') return;
  tocar('clique', { volume: 0.3 });
  fecharTudo();
  state.pausado = true;
  abrirOverlayImg({
    src: UI('menu_pausa'),
    hots: [
      { cx: 49.9, cy: 49.4, w: 60.3, h: 8.5,
        onClick: () => { tocar('clique', { volume: 0.3 }); state.pausado = false; esconderOverlay(); } },
      { cx: 49.7, cy: 61.2, w: 60.3, h: 8.5, onClick: () => location.reload() },
      { cx: 49.9, cy: 73, w: 60.3, h: 8.6,
        onClick: () => { localStorage.setItem('kd-modo', 'normal'); sessionStorage.removeItem('kd-goto'); location.reload(); } },
    ],
  });
}

canvas.addEventListener('pointerdown', ev => {
  if (state.fase === 'inicio' || state.fase === 'derrota' || state.fase === 'vitoria') return;
  const m = telaParaMundo(ev);
  if (menuAberto() || painelAberto()) { fecharTudo(); return; }
  // laboratório (modo caos): antes de erguer → menu de construção; depois → upgrades
  if (LAB_POS && dist(m, LAB_POS) < 52) { state.labConstruido ? menuLab() : menuLabConstruir(); return; }
  // torre existente → upgrade
  for (const t of state.torres) {
    if (dist(m, t) < 22) { menuTorre(t); return; }
  }
  // plataforma vazia → construir torre
  for (const spot of PLATAFORMAS) {
    if (!spot.torre && dist(m, spot) < 24) { menuConstruirTorre(spot); return; }
  }
  // sítio de economia: vazio → construir; construído → contratar
  for (const site of SITES) {
    if (dist(m, site) < 28) {
      if (site.construcao) menuContratar(site);
      else menuSite(site);
      return;
    }
  }
  fecharTudo();
});
document.addEventListener('pointerdown', ev => {
  if (ev.target === canvas) return; // o handler do canvas já decide
  if (menuAberto() && !els.menuContexto.contains(ev.target)) fecharTudo();
  else if (painelAberto() && !els.painelMenu.contains(ev.target)) fecharTudo();
});

// ---------------------------------------------------------- Update
function update(dt) {
  if (state.fase === 'preparo') {
    state.tPreparo -= dt;
    if (state.tPreparo <= 0) iniciarOnda();
  }

  if (state.fase === 'onda' && state.spawner) state.spawner.update(dt, state);

  for (const e of state.inimigos) e.update(dt, state);
  for (const t of state.trabalhadores) t.update(dt, state);
  for (const c of state.construcoes) c.update(dt, state);
  for (const t of state.torres) t.update(dt, state);
  for (const p of state.projeteis) p.update(dt, state);
  for (const f of state.efeitos) f.update(dt);

  state.inimigos = state.inimigos.filter(e => !e.remover);
  state.trabalhadores = state.trabalhadores.filter(t => !t.remover);
  state.projeteis = state.projeteis.filter(p => !p.remover);
  state.efeitos = state.efeitos.filter(f => !f.remover);

  if (state.vidas <= 0 && state.fase === 'onda') { derrota(); return; }

  if (state.fase === 'onda' && state.spawner?.terminou && state.inimigos.length === 0) {
    fimDeOnda();
  }
}

// ---------------------------------------------------------- Draw
function desenharMarcadores() {
  // plataformas vazias
  for (const spot of PLATAFORMAS) {
    if (spot.torre) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(spot.x, spot.y, 17, 0, 7); ctx.fill();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255,215,0,0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(spot.x, spot.y, 16, 0, 7); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,225,90,1)';
    ctx.font = 'bold 17px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+', spot.x, spot.y + 1);
  }
  // sítios de economia vazios
  for (const site of SITES) {
    if (site.construcao) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(site.x, site.y, 19, 0, 7); ctx.fill();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(140,220,255,0.95)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(site.x, site.y, 18, 0, 7); ctx.stroke();
    ctx.setLineDash([]);
    // escolha livre: mostra moeda + tora lado a lado (mina OU madeireira)
    const io = sprite('icone_ouro'), im = sprite('icone_madeira');
    if (io && im) {
      ctx.drawImage(io, site.x - 14, site.y - 7, 13, 13);
      ctx.drawImage(im, site.x + 1, site.y - 7, 13, 13);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '13px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⛏🪓', site.x, site.y + 1);
    }
  }
  // marcador do laboratório (tocável) — modo caos.
  // Antes de erguer: terreno vazio com 🔨 (construir). Depois: ⚗️ abaixo do prédio.
  if (LAB_POS) {
    const construido = state.labConstruido;
    const mx = LAB_POS.x, my = construido ? LAB_POS.y + 52 : LAB_POS.y;
    const raio = construido ? 15 : 24;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.arc(mx, my, raio + 1, 0, 7); ctx.fill();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(190,150,255,0.95)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(mx, my, raio, 0, 7); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.98)';
    ctx.font = `${construido ? 15 : 20}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(construido ? '⚗️' : '🔨', mx, my + 1);
  }
  ctx.textBaseline = 'alphabetic';
}

function desenharAlcance() {
  const sel = state.selecionado;
  if (!sel) return;
  const alcance = sel.tipo === 'torre' ? sel.ref.alcance : 115;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(sel.ref.x, sel.ref.y, alcance, 0, 7);
  ctx.fill(); ctx.stroke();
}

// Região do castelo (redesenhada sobre quem passa "atrás"). Vem do mapa ativo.
function desenharCamadaCastelo() {
  const r = RECORTE_CASTELO;
  // recorte com transparência (só o castelo), quando o mapa fornece; senão retângulo do terreno
  const recorte = r.key ? sprite(r.key) : null;
  if (recorte) {
    ctx.drawImage(recorte, r.x, r.y, r.w, r.h);
  } else {
    // o offscreen do terreno é renderizado em 2x
    ctx.drawImage(terreno, r.x * 2, r.y * 2, r.w * 2, r.h * 2, r.x, r.y, r.w, r.h);
  }
}

function draw() {
  ctx.clearRect(0, 0, LARGURA, ALTURA);
  ctx.drawImage(terreno, 0, 0, LARGURA, ALTURA);
  desenharMarcadores();
  desenharAlcance();
  // TUDO ordenado por profundidade (pé/base no eixo y): trabalhadores, monstros,
  // torres, construções e o próprio castelo — quem está mais ao norte fica atrás.
  // Monstros e trabalhadores que chegam ao castelo têm prioridade: dentro da
  // região do recorte, desenham DEPOIS do castelo (ficam na frente, não atrás).
  const r = RECORTE_CASTELO;
  const profChegada = e => (e.x >= r.x - 12 && e.x <= r.x + r.w + 12 && e.y >= r.y - 12 && e.y <= r.y + r.h + 12)
    ? r.base + 40 + e.y * 0.001 : e.y;
  const camadas = [
    ...state.trabalhadores.map(e => ({ prof: profChegada(e), desenhar: () => e.desenhar(ctx) })),
    ...state.inimigos.map(e => ({ prof: profChegada(e), desenhar: () => e.desenhar(ctx) })),
    ...state.torres.map(t => ({ prof: t.y + 16, desenhar: () => t.desenhar(ctx, state) })),
    ...state.construcoes.map(c => ({ prof: c.site.y + 18, desenhar: () => c.desenhar(ctx) })),
    ...(LAB_POS && state.labConstruido ? [{ prof: LAB_POS.y + 40, desenhar: () => desenharLab(ctx, LAB_POS.x, LAB_POS.y + 40, 120) }] : []),
    { prof: RECORTE_CASTELO.base, desenhar: desenharCamadaCastelo },
  ].sort((a, b) => a.prof - b.prof);
  for (const camada of camadas) camada.desenhar();
  for (const p of state.projeteis) p.desenhar(ctx);
  for (const f of state.efeitos) f.desenhar(ctx);
}

// ---------------------------------------------------------- Loop
let anterior = performance.now();
window.__kdFrames = 0;
window.__kdUltimoErro = null;
function loop(agora) {
  try {
    const dtReal = Math.max(0, Math.min((agora - anterior) / 1000, 0.05));
    anterior = agora;
    if (!state.pausado && (state.fase === 'preparo' || state.fase === 'onda')) {
      update(dtReal * state.velocidade);
    }
    draw();
    atualizarHUD(state, TOTAL_ONDAS);
    atualizarMenu();
    window.__kdFrames++;
  } catch (err) {
    window.__kdUltimoErro = err.stack || String(err);
  }
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------- Bootstrap
async function iniciar() {
  initUI();
  registrarFecharPainel(fecharTudo);   // X dos painéis centrais → limpa tudo (inclui alvo selecionado)
  els.btnMudo.textContent = mutado() ? '🔇' : '🔊';
  abrirOverlayImg({ src: UI('menu_carregando') });
  await precarregar();

  terreno = document.createElement('canvas');
  terreno.width = LARGURA * 2;
  terreno.height = ALTURA * 2;
  const tc = terreno.getContext('2d');
  tc.scale(2, 2);
  desenharTerreno(tc);

  els.btnOnda.addEventListener('click', iniciarOnda);
  els.btnVel.addEventListener('click', () => {
    state.velocidade = state.velocidade === 1 ? 2 : 1;
  });
  els.btnMenuJogo.addEventListener('click', menuPausa);
  els.btnRecuar.addEventListener('click', () => {
    tocar('recuar', { volume: 0.5 });
    state.recuados = true;
    for (const t of state.trabalhadores) t.recuar();
    toast('🏰 Workers retreating to the castle — production paused.', 2800);
  });
  els.btnRetomar.addEventListener('click', () => {
    tocar('retomar', { volume: 0.5 });
    state.recuados = false;
    // saída em fila: cada um espera um pouco mais que o anterior
    state.trabalhadores.forEach((t, i) => t.retomar(i * 0.5));
    toast('⛏ Workers heading back to work.', 2200);
  });
  els.btnMudo?.addEventListener('click', () => {
    const m = alternarMudo();
    els.btnMudo.textContent = m ? '🔇' : '🔊';
  });
  els.sliderVolume.value = Math.round(obterVolume() * 100);
  els.sliderVolume.addEventListener('input', () => {
    definirVolume(els.sliderVolume.value / 100);
    // mexer no volume desmuta (comportamento padrão de players)
    if (mutado()) {
      alternarMudo();
      els.btnMudo.textContent = '🔊';
    }
  });

  // Sem lobos caçadores no caos: barra menor (3 botões), sem recuar/retomar.
  if (CAOS_MODO) {
    els.barraInferior.classList.add('caos');
    const fundoBarra = els.barraInferior.querySelector('.menu-fundo');
    if (fundoBarra) fundoBarra.src = UI('barra_caos');
  }

  // Tela de entrada: caos vai direto ao briefing; normal volta à seleção de modo
  // (ou direto ao mapa, quando veio de uma troca que recarregou a página).
  const goto = sessionStorage.getItem('kd-goto');
  sessionStorage.removeItem('kd-goto');
  if (CAOS_MODO) telaCaos();
  else if (goto === 'normal') telaInicial();
  else telaModos();

  requestAnimationFrame(loop);

  // exposto p/ depuração e testes automatizados
  window.__kd = state;
  window.__kdTick = t => loop(t ?? performance.now());
  window.__kdTerreno = terreno;
  window.__kdDbg = { LAB_POS, SITES, PLATAFORMAS, mundoParaTela, Inimigo, lab, get escala() { return escala; } };
}

iniciar();
