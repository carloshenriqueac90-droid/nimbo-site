// ============================================================
// UI — HUD (DOM), menus de contexto, toasts e overlays.
// Não conhece regras do jogo: recebe dados e callbacks do main.
// ============================================================

const $ = id => document.getElementById(id);

let toastTimer = null;

export const els = {};

export function initUI() {
  for (const id of ['hudVidas', 'hudOuro', 'hudMadeira', 'hudOnda', 'barraOnda',
    'btnOnda', 'btnVel', 'btnRecuar', 'btnRetomar', 'btnMenuJogo', 'lblOnda', 'barraInferior',
    'painelMenu', 'btnMudo', 'sliderVolume', 'menuContexto', 'toast', 'overlay']) {
    els[id] = $(id);
  }
}

export function atualizarHUD(state, totalOndas) {
  els.hudVidas.textContent = Math.max(0, state.vidas);
  els.hudOuro.textContent = Math.floor(state.ouro);
  els.hudMadeira.textContent = Math.floor(state.madeira);
  els.hudOnda.textContent = Number.isFinite(totalOndas)
    ? `${Math.min(state.onda, totalOndas)}/${totalOndas}`
    : `${state.onda} ∞`;

  // barra de progresso da onda
  if (state.fase === 'onda' && state.spawner) {
    const total = state.spawner.total;
    const vivos = state.inimigos.length + (total - state.spawner.spawnados());
    els.barraOnda.style.width = `${(1 - vivos / Math.max(total, 1)) * 100}%`;
  } else {
    els.barraOnda.style.width = state.fase === 'preparo' ? '0%' : '100%';
  }

  // botões de imagem: só habilitação/realce; a contagem vai no rótulo
  // sem travamento durante a onda: só desabilita fora do jogo ou quando todas as ondas já foram chamadas
  els.btnOnda.disabled = (state.fase !== 'preparo' && state.fase !== 'onda') || state.onda >= totalOndas;
  els.lblOnda.textContent = state.fase === 'preparo' ? `${Math.ceil(state.tPreparo)}s` : '';
  els.btnVel.classList.toggle('ativo', state.velocidade !== 1);
  els.btnRecuar.disabled = state.recuados || state.trabalhadores.length === 0;
  els.btnRetomar.disabled = !state.recuados;
  els.btnRecuar.classList.toggle('alerta', !state.recuados && state.perigoCacadores);
}

// itens: [{ rotulo, sub, desabilitado | desabilitadoFn, acao }]
// desabilitadoFn é reavaliada a cada frame (menu "acorda" quando o recurso chega).
let menuItens = null;
let menuBotoes = null;

export function abrirMenu(itens, sx, sy) {
  const m = els.menuContexto;
  m.innerHTML = '';
  menuItens = itens;
  menuBotoes = [];
  for (const item of itens) {
    const b = document.createElement('button');
    b.className = 'item-menu';
    b.disabled = item.desabilitadoFn ? item.desabilitadoFn() : !!item.desabilitado;
    b.innerHTML = `<span>${item.rotulo}</span>${item.sub ? `<small>${item.sub}</small>` : ''}`;
    b.addEventListener('click', ev => { ev.stopPropagation(); item.acao(); });
    m.appendChild(b);
    menuBotoes.push(b);
  }
  m.classList.remove('oculto');
  // posiciona sem sair da tela
  const r = m.getBoundingClientRect();
  const x = Math.min(Math.max(8, sx - r.width / 2), window.innerWidth - r.width - 8);
  const y = Math.min(Math.max(8, sy - r.height - 16), window.innerHeight - r.height - 8);
  m.style.left = `${x}px`;
  m.style.top = `${y}px`;
}

// chamada no loop: reavalia habilitação/textos dos menus abertos (recursos mudam a cada frame)
export function atualizarMenu() {
  if (menuItens && !els.menuContexto.classList.contains('oculto')) {
    menuItens.forEach((item, i) => {
      if (item.desabilitadoFn) menuBotoes[i].disabled = item.desabilitadoFn();
    });
  }
  if (menuImgAtual) {
    if (menuImgAtual.container.classList.contains('oculto')) { menuImgAtual = null; return; }
    for (const v of menuImgAtual.vivosT) {
      const n = v.get();
      if (n !== v.s.innerHTML) v.s.innerHTML = n;
    }
    for (const v of menuImgAtual.vivosH) {
      if (v.din) v.b.classList.toggle('desab', !!(v.din() || {}).desab);
      if (v.tipEl && typeof v.tip === 'function') {
        const t = v.tip();
        if (t !== v.tipEl.innerHTML) v.tipEl.innerHTML = t;
      }
      if (v.rotEl && typeof v.rotulo === 'function') {
        const r = v.rotulo();
        if (r !== v.rotEl.innerHTML) v.rotEl.innerHTML = r;
      }
    }
  }
}

export function fecharMenu() {
  els.menuContexto.classList.add('oculto');
  menuItens = null;
  menuBotoes = null;
}

export function menuAberto() {
  return !els.menuContexto.classList.contains('oculto');
}

// ---------- Menus por imagem (arte cortada + botões clicáveis + texto vivo) ----------
// cfg = {
//   src,
//   hots:   [{ cx, cy, w, h, cls?, onClick, tip?(str|fn), din?() -> {desab} }],
//   textos: [{ cx, cy, w?, cls?, get() -> html, estatico? }]
// }
// cx/cy = centro em %; w/h = tamanho em % da imagem. Coordenadas medidas sobre a arte.
let menuImgAtual = null;

function preencherMenuImg(container, cfg) {
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'menu-img';
  const img = document.createElement('img');
  img.className = 'menu-fundo';
  img.src = cfg.src; img.draggable = false;
  wrap.appendChild(img);

  const vivosH = [], vivosT = [];
  for (const h of cfg.hots || []) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'menu-hot' + (h.cls ? ' ' + h.cls : '');
    b.style.left = `${h.cx}%`; b.style.top = `${h.cy}%`;
    b.style.width = `${h.w}%`; b.style.height = `${h.h}%`;
    let tipEl = null, rotEl = null;
    if (h.rotulo) {          // rótulo visível dentro do botão (botões que não têm arte gravada)
      rotEl = document.createElement('span');
      rotEl.className = 'menu-hot-rotulo';
      rotEl.innerHTML = typeof h.rotulo === 'function' ? h.rotulo() : h.rotulo;
      b.appendChild(rotEl);
    }
    if (h.tip) {
      tipEl = document.createElement('span');
      tipEl.className = 'menu-tip';
      tipEl.innerHTML = typeof h.tip === 'function' ? h.tip() : h.tip;
      b.appendChild(tipEl);
    }
    if (h.din) b.classList.toggle('desab', !!(h.din() || {}).desab);
    b.addEventListener('click', ev => {
      ev.stopPropagation();
      if (b.classList.contains('desab')) return;
      h.onClick && h.onClick();
    });
    wrap.appendChild(b);
    if (h.din || (tipEl && typeof h.tip === 'function') || (rotEl && typeof h.rotulo === 'function')) {
      vivosH.push({ b, tipEl, din: h.din, tip: h.tip, rotEl, rotulo: h.rotulo });
    }
  }
  for (const t of cfg.textos || []) {
    const s = document.createElement('span');
    s.className = 'menu-vivo' + (t.cls ? ' ' + t.cls : '');
    s.style.left = `${t.cx}%`; s.style.top = `${t.cy}%`;
    if (t.w) s.style.width = `${t.w}%`;
    s.innerHTML = t.get();
    wrap.appendChild(s);
    if (!t.estatico) vivosT.push({ s, get: t.get });
  }
  container.appendChild(wrap);
  return { container, vivosH, vivosT };
}

// Telas centrais (modo / pausa / intro / fim): overlay escurecido e modal.
export function abrirOverlayImg(cfg) {
  menuImgAtual = preencherMenuImg(els.overlay, cfg);
  els.overlay.classList.remove('oculto');
}
// Callback de fechamento dos painéis (registrado pelo main → fecharTudo, que
// também limpa o alvo selecionado). Fallback: só esconde o painel.
let fecharPainelCb = null;
export function registrarFecharPainel(fn) { fecharPainelCb = fn; }

// Painéis sobre o mapa (laboratório / mina): o jogo continua visível atrás.
// cfg.mini: painel compacto (ex.: botão único de construir o laboratório).
// cfg.peq: painel pequeno (ex.: mina/madeireira, só 2 slots).
export function abrirPainelImg(cfg) {
  menuImgAtual = preencherMenuImg(els.painelMenu, cfg);
  els.painelMenu.classList.toggle('mini', !!cfg.mini);
  els.painelMenu.classList.toggle('peq', !!cfg.peq);
  // botão de fechar (X) no canto — comum a todos os painéis centrais
  const wrap = els.painelMenu.querySelector('.menu-img');
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'menu-fechar';
  x.setAttribute('aria-label', 'Close');
  x.innerHTML = '✕';
  x.addEventListener('click', ev => { ev.stopPropagation(); (fecharPainelCb || fecharPainel)(); });
  wrap.appendChild(x);
  els.painelMenu.classList.remove('oculto');
}

export function fecharPainel() {
  els.painelMenu.classList.add('oculto');
  els.painelMenu.innerHTML = '';
  if (menuImgAtual && menuImgAtual.container === els.painelMenu) menuImgAtual = null;
}

export function painelAberto() {
  return !els.painelMenu.classList.contains('oculto');
}

export function toast(msg, dur = 2600, classe = '') {
  const t = els.toast;
  t.textContent = msg;
  t.className = `toast ${classe}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('oculto'), dur);
}

export function mostrarOverlay(html) {
  els.overlay.innerHTML = html;
  els.overlay.classList.remove('oculto');
}

export function esconderOverlay() {
  els.overlay.classList.add('oculto');
  els.overlay.innerHTML = '';
  if (menuImgAtual && menuImgAtual.container === els.overlay) menuImgAtual = null;
}
