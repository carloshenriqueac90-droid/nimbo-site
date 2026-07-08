// ============================================================
// UI — HUD (DOM), menus de contexto, toasts e overlays.
// Não conhece regras do jogo: recebe dados e callbacks do main.
// ============================================================

const $ = id => document.getElementById(id);

let toastTimer = null;

export const els = {};

export function initUI() {
  for (const id of ['hudVidas', 'hudOuro', 'hudMadeira', 'hudOnda', 'barraOnda',
    'btnOnda', 'btnVel', 'btnRecuar', 'btnRetomar', 'btnMudo', 'sliderVolume', 'menuContexto', 'toast', 'overlay']) {
    els[id] = $(id);
  }
}

export function atualizarHUD(state, totalOndas) {
  els.hudVidas.textContent = Math.max(0, state.vidas);
  els.hudOuro.textContent = Math.floor(state.ouro);
  els.hudMadeira.textContent = Math.floor(state.madeira);
  els.hudOnda.textContent = `${Math.min(state.onda, totalOndas)}/${totalOndas}`;

  // barra de progresso da onda
  if (state.fase === 'onda' && state.spawner) {
    const total = state.spawner.total;
    const vivos = state.inimigos.length + (total - state.spawner.spawnados());
    els.barraOnda.style.width = `${(1 - vivos / Math.max(total, 1)) * 100}%`;
  } else {
    els.barraOnda.style.width = state.fase === 'preparo' ? '0%' : '100%';
  }

  // botão de onda
  if (state.fase === 'preparo') {
    els.btnOnda.disabled = false;
    els.btnOnda.textContent = `▶ Iniciar Onda (${Math.ceil(state.tPreparo)}s)`;
  } else {
    els.btnOnda.disabled = true;
    els.btnOnda.textContent = state.fase === 'onda' ? '⚔ Onda em curso' : '▶ Iniciar Onda';
  }

  els.btnVel.textContent = state.velocidade === 1 ? '⏩ x1' : '⏩ x2';
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

// chamada no loop: reavalia habilitação dos itens do menu aberto
export function atualizarMenu() {
  if (!menuItens || els.menuContexto.classList.contains('oculto')) return;
  menuItens.forEach((item, i) => {
    if (item.desabilitadoFn) menuBotoes[i].disabled = item.desabilitadoFn();
  });
}

export function fecharMenu() {
  els.menuContexto.classList.add('oculto');
  menuItens = null;
  menuBotoes = null;
}

export function menuAberto() {
  return !els.menuContexto.classList.contains('oculto');
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
}
