// ============================================================
// MAIN — bootstrap, estado central, game loop, fases e input.
// Sistemas novos (heróis, clima, eventos): registrar update/draw aqui.
// ============================================================

import { JOGO, TORRES, ECONOMIA, UPGRADE, TRABALHADOR } from './config.js';
import { LARGURA, ALTURA, CASTELO, SITES, PLATAFORMAS, RECORTE_CASTELO, MAPAS, MAPA_IDX, desenharTerreno } from './map.js';
import { Torre, Construcao, Efeito, efeitoTexto } from './entities.js';
import { ONDAS_POR_MAPA, Spawner } from './waves.js';

// ondas da fase ativa (mapas sem definição própria usam a do mapa 1)
const ONDAS = ONDAS_POR_MAPA[Math.min(MAPA_IDX, ONDAS_POR_MAPA.length - 1)];
const TOTAL_ONDAS = ONDAS.length;
import { initUI, els, atualizarHUD, abrirMenu, fecharMenu, menuAberto, atualizarMenu, toast, mostrarOverlay, esconderOverlay } from './ui.js';
import { carregarSave, gravarSave } from './save.js';
import { dist } from './util.js';
import { precarregar, sprite } from './sprites.js';
import { iniciarAudio, tocar, mutado, alternarMudo, obterVolume, definirVolume } from './sound.js';

// ---------------------------------------------------------- Estado central
const state = {
  fase: 'inicio', // inicio | preparo | onda | derrota | vitoria
  vidas: JOGO.vidas,
  ouro: MAPA_IDX === 1 ? JOGO.ouroInicial * 2 : JOGO.ouroInicial,  // 2º nível começa com o dobro de ouro
  madeira: JOGO.madeiraInicial,
  onda: 0,             // última onda iniciada (1..10)
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

function ajustarTela() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = window.innerWidth, ch = window.innerHeight;
  escala = Math.min(cw / LARGURA, ch / ALTURA);
  canvas.style.width = `${LARGURA * escala}px`;
  canvas.style.height = `${ALTURA * escala}px`;
  canvas.width = Math.round(LARGURA * escala * dpr);
  canvas.height = Math.round(ALTURA * escala * dpr);
  ctx.setTransform(escala * dpr, 0, 0, escala * dpr, 0, 0);
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
  if (state.fase !== 'preparo') return;
  tocar('onda_inicio', { volume: 0.6 });
  state.onda++;
  state.escalaHP = 1 + (state.onda - 1) * JOGO.escalaHPPorOnda;
  const def = ONDAS[state.onda - 1];
  state.spawner = new Spawner(def);
  state.fase = 'onda';
  state.perigoCacadores = def.especial;
  fecharMenu();
  state.selecionado = null;
  if (def.especial) {
    toast('⚠️ Lobos à caça! Proteja seus trabalhadores!', 4000, 'perigo');
  } else if (def.grupos.some(g => g.tipo === 'golem' || g.tipo === 'reiGoblin')) {
    toast('👑 Um chefe se aproxima!', 3500, 'perigo');
  } else {
    toast(`Onda ${state.onda} — preparados!`, 1800);
  }
}

function fimDeOnda() {
  tocar('onda_vitoria', { volume: 0.55 });
  state.spawner = null;
  state.perigoCacadores = false;
  state.ouro += JOGO.bonusOndaOuro;
  state.madeira += JOGO.bonusOndaMadeira;
  efeitoTexto(state, CASTELO.x - 14, CASTELO.y - 80, `Bônus: +${JOGO.bonusOndaOuro}`, '#ffd166', 'icone_ouro');
  efeitoTexto(state, CASTELO.x + 6, CASTELO.y - 60, `+${JOGO.bonusOndaMadeira}`, '#c98d4b', 'icone_madeira');
  state.save.melhorOnda = Math.max(state.save.melhorOnda, state.onda);
  gravarSave(state.save);
  if (state.onda >= TOTAL_ONDAS) { vitoria(); return; }
  state.fase = 'preparo';
  state.tPreparo = JOGO.tempoPreparo;
  toast(`Onda ${state.onda} vencida! ✔`, 2200);
}

function derrota() {
  tocar('jogo_derrota', { volume: 0.7 });
  state.fase = 'derrota';
  gravarSave(state.save);
  mostrarOverlay(`
    <div class="painel">
      <h1>💀 Derrota</h1>
      <h2>O castelo caiu na onda ${state.onda}</h2>
      <p class="recorde">Melhor onda: ${state.save.melhorOnda} · Vitórias: ${state.save.vitorias}</p>
      <button id="btnReiniciar">Tentar de novo</button>
    </div>`);
  document.getElementById('btnReiniciar').addEventListener('click', () => location.reload());
}

function vitoria() {
  tocar('jogo_vitoria', { volume: 0.7 });
  state.fase = 'vitoria';
  state.save.vitorias++;
  gravarSave(state.save);
  mostrarOverlay(`
    <div class="painel">
      <h1>🏆 Vitória!</h1>
      <h2>O reino está a salvo — todas as ${TOTAL_ONDAS} ondas vencidas!</h2>
      <p class="recorde">Vidas restantes: ${state.vidas} · Vitórias: ${state.save.vitorias}</p>
      <button id="btnReiniciar">Jogar de novo</button>
    </div>`);
  document.getElementById('btnReiniciar').addEventListener('click', () => location.reload());
}

function telaInicial() {
  const cards = MAPAS.map((m, i) => `
    <button class="card-mapa${i === MAPA_IDX ? ' ativo' : ''}" data-mapa="${i}">
      <span class="card-icone">${m.icone}</span>
      <span class="card-nome">${m.nome}</span>
    </button>`).join('');
  mostrarOverlay(`
    <div class="painel">
      <h1>🏰 Kingdom Defense</h1>
      <h2>Defenda o castelo. Administre o reino.</h2>
      <ul>
        <li>🗼 Toque nas <b>plataformas</b> perto das rotas para construir torres.</li>
        <li>⛏ Construa <b>minas e madeireiras</b> — trabalhadores coletam sozinhos.</li>
        <li>🐺 Em ondas especiais, <b>lobos caçam seus trabalhadores</b>. Use <b>Recuar</b> para protegê-los (a produção para!).</li>
        <li>❤️ Sobreviva às ${TOTAL_ONDAS} ondas.</li>
      </ul>
      <p class="rotulo-mapa">Escolha o mapa:</p>
      <div class="mapas">${cards}</div>
      ${state.save.melhorOnda ? `<p class="recorde">Melhor onda: ${state.save.melhorOnda} · Vitórias: ${state.save.vitorias}</p>` : ''}
      <button id="btnJogar">Jogar</button>
    </div>`);
  // trocar de mapa recarrega a página (map.js relê o índice no load)
  for (const card of document.querySelectorAll('.card-mapa')) {
    card.addEventListener('click', () => {
      const idx = +card.dataset.mapa;
      if (idx === MAPA_IDX) return;
      localStorage.setItem('kd-mapa', String(idx));
      location.reload();
    });
  }
  document.getElementById('btnJogar').addEventListener('click', () => {
    iniciarAudio(); // precisa de gesto do usuário; primeiro clique do jogo
    esconderOverlay();
    state.fase = 'preparo';
    toast('Construa suas defesas e sua economia!', 3000);
  });
}

// ---------------------------------------------------------- Menus de contexto
function menuConstruirTorre(spot) {
  tocar('clique', { volume: 0.3 });
  state.selecionado = { tipo: 'spot', ref: spot };
  const p = mundoParaTela(spot.x, spot.y);
  const itens = Object.entries(TORRES).map(([tipo, def]) => ({
    rotulo: `🗼 ${def.nome}`,
    sub: `${textoCusto(def.custo)} · dano ${def.dano}${def.area ? ' (área)' : ''}${def.slow ? ' · lentidão' : ''}${def.antiAereo ? '' : ' · não atinge voadores'}`,
    desabilitadoFn: () => !podePagar(def.custo),
    acao: () => {
      pagar(def.custo);
      tocar('confirmar', { volume: 0.4 });
      const t = new Torre(spot, tipo);
      spot.torre = t;
      state.torres.push(t);
      fecharTudo();
    },
  }));
  abrirMenu(itens, p.x, p.y);
}

function menuTorre(torre) {
  tocar('clique', { volume: 0.3 });
  state.selecionado = { tipo: 'torre', ref: torre };
  const p = mundoParaTela(torre.x, torre.y);
  const itens = [];
  if (torre.nivel < UPGRADE.maxNivel) {
    const custo = torre.custoUpgrade();
    itens.push({
      rotulo: `⬆ Melhorar ${torre.base.nome} (nv ${torre.nivel + 1})`,
      sub: textoCusto(custo),
      desabilitadoFn: () => !podePagar(custo),
      acao: () => {
        pagar(custo);
        tocar('confirmar', { volume: 0.4 });
        torre.nivel++;
        torre.calcularStats();
        efeitoTexto(state, torre.x, torre.y - 26, 'Melhorada!', '#a6f77b');
        fecharTudo();
      },
    });
  } else {
    itens.push({ rotulo: `⭐ ${torre.base.nome} — nível máximo`, desabilitado: true, acao: () => {} });
  }
  abrirMenu(itens, p.x, p.y);
}

function menuSite(site) {
  tocar('clique', { volume: 0.3 });
  const def = ECONOMIA[site.tipo];
  const p = mundoParaTela(site.x, site.y);
  abrirMenu([{
    rotulo: `${iconeHTML(def.tipoIcone)} Construir ${def.nome}`,
    sub: `${textoCusto(def.custo)} · ${def.trabalhadores} trabalhadores`,
    desabilitadoFn: () => !podePagar(def.custo),
    acao: () => {
      pagar(def.custo);
      tocar('confirmar', { volume: 0.4 });
      const c = new Construcao(site, state);
      site.construcao = c;
      state.construcoes.push(c);
      fecharTudo();
    },
  }], p.x, p.y);
}

function menuContratar(site) {
  tocar('clique', { volume: 0.3 });
  const c = site.construcao;
  const def = c.def;
  const atual = c.contarTrabalhadores(state);
  const custo = { ouro: TRABALHADOR.custoContratar };
  const cheio = atual >= def.maxTrabalhadores;
  const p = mundoParaTela(site.x, site.y);
  abrirMenu([{
    rotulo: `👷 Contratar trabalhador (${atual}/${def.maxTrabalhadores})`,
    sub: cheio ? 'Limite atingido' : textoCusto(custo),
    desabilitadoFn: () => cheio || !podePagar(custo),
    acao: () => {
      pagar(custo);
      tocar('confirmar', { volume: 0.4 });
      c.contratar(state);
      fecharTudo();
    },
  }], p.x, p.y);
}

function fecharTudo() {
  fecharMenu();
  state.selecionado = null;
}

canvas.addEventListener('pointerdown', ev => {
  if (state.fase === 'inicio' || state.fase === 'derrota' || state.fase === 'vitoria') return;
  const m = telaParaMundo(ev);
  if (menuAberto()) { fecharTudo(); return; }
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
  if (menuAberto() && !els.menuContexto.contains(ev.target) && ev.target !== canvas) fecharTudo();
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
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(site.tipo === 'mina' ? '⛏' : '🪓', site.x, site.y + 1);
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
  const camadas = [
    ...state.trabalhadores.map(e => ({ prof: e.y, desenhar: () => e.desenhar(ctx) })),
    ...state.inimigos.map(e => ({ prof: e.y, desenhar: () => e.desenhar(ctx) })),
    ...state.torres.map(t => ({ prof: t.y + 16, desenhar: () => t.desenhar(ctx, state) })),
    ...state.construcoes.map(c => ({ prof: c.site.y + 18, desenhar: () => c.desenhar(ctx) })),
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
    if (state.fase === 'preparo' || state.fase === 'onda') {
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
  els.btnMudo.textContent = mutado() ? '🔇' : '🔊';
  mostrarOverlay('<div class="painel"><h1>🏰 Kingdom Defense</h1><h2>Carregando...</h2></div>');
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
  els.btnRecuar.addEventListener('click', () => {
    tocar('recuar', { volume: 0.5 });
    state.recuados = true;
    for (const t of state.trabalhadores) t.recuar();
    toast('🏰 Trabalhadores recuando ao castelo — produção pausada.', 2800);
  });
  els.btnRetomar.addEventListener('click', () => {
    tocar('retomar', { volume: 0.5 });
    state.recuados = false;
    // saída em fila: cada um espera um pouco mais que o anterior
    state.trabalhadores.forEach((t, i) => t.retomar(i * 0.5));
    toast('⛏ Trabalhadores voltando ao trabalho.', 2200);
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

  telaInicial();
  requestAnimationFrame(loop);

  // exposto p/ depuração e testes automatizados
  window.__kd = state;
  window.__kdTick = t => loop(t ?? performance.now());
  window.__kdTerreno = terreno;
}

iniciar();
