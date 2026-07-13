"use strict";

const TAMANHO = 5;
const TENTATIVAS_PADRAO = 6;

// modelo híbrido (D-termo-2): duas corridas independentes, persistidas separadamente.
// "daily" = Corrida do Dia (determinística, 1 tentativa/dia, trava até meia-noite SP).
// "endless" = Modo Livre (Math.random, ilimitado, sem trava).
const CHAVE_RUN_DAILY = "termo.sobrevivencia.run.daily";
const CHAVE_RUN_ENDLESS = "termo.sobrevivencia.run.endless";
const CHAVE_TRAVADO_DIARIO = "termo.sobrevivencia.travado"; // trava é só da Corrida do Dia
const CHAVE_STATS = "termo.sobrevivencia.stats";
const CHAVE_CONTRASTE = "termo.contraste";

const PRECOS = { revelar: 6, eliminar: 4, extra: 5, vida: 12 };
const MAX_VIDAS = 5;
const MAX_EXTRAS = 2;
const VIDAS_INICIAIS = 3;

// ícone de moeda: SVG inline (disco dourado com brilho), não emoji — em alguns aparelhos
// (ex.: Galaxy S24) a fonte do sistema não tem o glifo 🪙 (U+1FA99, emoji de 2019) e ele
// renderiza como tofu. O disco usa var(--lugar), a mesma cor dos badges de preço dos
// power-ups (.powerup .preco), então casa com o resto da UI em qualquer tema (inclusive
// modo de alto contraste, que redefine --lugar).
const ICONE_MOEDA =
  '<svg class="icone-moeda" viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" focusable="false">' +
  '<circle cx="10" cy="10" r="9" style="fill:var(--lugar)"></circle>' +
  '<circle cx="10" cy="10" r="8.1" fill="none" style="stroke:rgba(36,27,33,0.35)" stroke-width="1"></circle>' +
  '<ellipse cx="7.3" cy="6.8" rx="2.6" ry="1.5" style="fill:rgba(255,255,255,0.5)" transform="rotate(-25 7.3 6.8)"></ellipse>' +
  '</svg>';

// localStorage pode estar bloqueado (privacidade estrita, alguns contextos file://);
// nesse caso o jogo funciona sem persistência, guardando em memória
const memoriaFallback = {};
const armazem = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return (k in memoriaFallback) ? memoriaFallback[k] : null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { memoriaFallback[k] = v; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { delete memoriaFallback[k]; } }
};

// ---------- estado ----------

let respostaNorm = "";
let tentativasRodada = TENTATIVAS_PADRAO;
let palpites = [];
let resultados = [];
let linhaAtual = [];
let cursor = 0;
let terminado = false;   // game over (aguardando decisão no modal)
let animando = false;
let travado = false;     // modal de transição aberto

// estado da corrida
let sv = null;

const tabuleiro = document.getElementById("tabuleiro");
const teclado = document.getElementById("teclado");
const telaInicio = document.getElementById("tela-inicio");

// ---------- utilitários ----------

function normalizar(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function comAcento(norm) {
  return PALAVRAS_VALIDAS[norm] || norm;
}

// rng: se informado, usado no lugar de Math.random (só a Corrida do Dia passa um rng semeado)
function palavraAleatoria(excluir, pool, rng) {
  const usadas = new Set(excluir || []);
  const base = pool || RESPOSTAS;
  let disponiveis = base.filter(p => !usadas.has(p));
  // grupo esgotado numa corrida longa: cai para o conjunto completo
  if (!disponiveis.length) disponiveis = RESPOSTAS.filter(p => !usadas.has(p));
  if (!disponiveis.length) disponiveis = base;
  const sorteio = rng ? rng() : Math.random();
  return disponiveis[Math.floor(sorteio * disponiveis.length)];
}

// ---------- PRNG semeado (só para a Corrida do Dia) ----------
//
// mulberry32: gerador determinístico simples e rápido, semeado por um inteiro 32-bit.
// hashString: deriva esse inteiro de uma string (a data de SP), sempre o mesmo pro mesmo texto.
//
// Cada rodada semeia seu próprio PRNG com `spDia() + ":" + rodada` (em vez de manter um único
// PRNG "correndo" durante a corrida inteira). Isso torna a sequência do dia reconstruível do
// zero em qualquer momento — inclusive após fechar e reabrir o jogo — sem precisar persistir
// nenhum estado interno do gerador: a palavra da rodada N depende só da data e de N.
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngDaRodadaDiaria(rodada) {
  return mulberry32(hashString(spDia() + ":" + rodada));
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => el.remove(), 2300);
}

// dispara um evento de analytics (best-effort; nunca pode travar o jogo — ver analytics.js)
function evt(nome, props) {
  if (typeof window.tsTrack === "function") window.tsTrack(nome, props);
}

// ---------- persistência ----------

// Stats:
//   recorde        → RANQUEADO: melhor nº de rodadas na Corrida do Dia (o que "conta")
//   recordeTreino  → melhor nº de rodadas no Modo Livre (treino, local, NÃO é ranking)
//   corridas/rodadas → totais de atividade dos DOIS modos (não são ranking)
function carregarStats() {
  const base = { corridas: 0, rodadas: 0, recorde: 0, recordeTreino: 0 };
  try {
    const s = JSON.parse(armazem.get(CHAVE_STATS));
    if (s && typeof s.recorde === "number") {
      // normaliza estados salvos antes do split ranqueado/treino
      if (typeof s.recordeTreino !== "number") s.recordeTreino = 0;
      return Object.assign(base, s);
    }
  } catch (e) { /* corrompido */ }
  return base;
}

// Só a Corrida do Dia (modo === "daily") mexe no recorde RANQUEADO; o Modo Livre mexe apenas no
// "melhor no treino". Retorna se bateu o recorde da categoria do modo (para o modal de fim).
function registrarCorrida(rodadasVencidas, modo) {
  const s = carregarStats();
  s.corridas++;
  s.rodadas += rodadasVencidas;
  let novoRecorde = false;
  if (modo === "daily") {
    novoRecorde = rodadasVencidas > s.recorde;
    if (novoRecorde) s.recorde = rodadasVencidas;
  } else {
    novoRecorde = rodadasVencidas > s.recordeTreino;
    if (novoRecorde) s.recordeTreino = rodadasVencidas;
  }
  armazem.set(CHAVE_STATS, JSON.stringify(s));
  return novoRecorde;
}

// data no fuso de São Paulo (YYYY-MM-DD) — define o "dia" do desafio
function spDia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());
}

function chaveRun(modo) {
  return modo === "daily" ? CHAVE_RUN_DAILY : CHAVE_RUN_ENDLESS;
}

function salvarRun() {
  if (!sv || terminado) return;
  armazem.set(chaveRun(sv.modo), JSON.stringify({
    sv: sv,
    palavra: respostaNorm,
    palpites: palpites,
    tentativasRodada: tentativasRodada,
    dia: spDia()
  }));
}

// modo: "daily" | "endless". A Corrida do Dia expira se salva num dia diferente de hoje (a
// sequência de palavras é derivada da data); o Modo Livre não tem essa restrição — fica
// disponível para retomar em qualquer dia, já que não tem trava nenhuma.
function carregarRun(modo) {
  try {
    const r = JSON.parse(armazem.get(chaveRun(modo)));
    if (r && r.sv && r.palavra && r.sv.vidas > 0) {
      if (modo === "daily" && r.dia !== spDia()) { limparRun(modo); return null; } // corrida de outro dia: expira
      return r;
    }
  } catch (e) { /* corrompido */ }
  return null;
}

function limparRun(modo) {
  armazem.del(chaveRun(modo));
}

// bloqueio diário: ao perder as vidas na Corrida do Dia, o jogador só volta no dia seguinte
// (o Modo Livre nunca é afetado por esta trava)
function salvarTravado(rodadas) {
  armazem.set(CHAVE_TRAVADO_DIARIO, JSON.stringify({ dia: spDia(), rodadas: rodadas }));
}

function travadoHoje() {
  try {
    const t = JSON.parse(armazem.get(CHAVE_TRAVADO_DIARIO));
    if (t && t.dia === spDia()) return t;
  } catch (e) { /* corrompido */ }
  return null;
}

// segundos até a próxima meia-noite no fuso de São Paulo
function segAteMeiaNoiteSP() {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).formatToParts(new Date());
  const g = t => parseInt(p.find(x => x.type === t).value, 10);
  const h = g("hour") % 24, m = g("minute"), s = g("second");
  return (23 - h) * 3600 + (59 - m) * 60 + (60 - s);
}

function atualizarContagemAmanha() {
  const el = document.getElementById("contagem-amanha");
  if (!el) return;
  const s = segAteMeiaNoiteSP();
  const pad = n => String(n).padStart(2, "0");
  el.textContent = pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
}

// ---------- montagem da interface ----------

function montarTabuleiro(nLinhas) {
  tabuleiro.innerHTML = "";
  tabuleiro.classList.remove("compacto");
  for (let l = 0; l < nLinhas; l++) adicionarLinha();
}

function adicionarLinha() {
  const l = tabuleiro.children.length;
  const linha = document.createElement("div");
  linha.className = "linha pendente";
  linha.dataset.linha = l;
  for (let c = 0; c < TAMANHO; c++) {
    const cel = document.createElement("div");
    cel.className = "celula";
    cel.dataset.col = c;
    cel.addEventListener("click", () => {
      if (Number(linha.dataset.linha) === palpites.length && !terminado && !travado) {
        cursor = c;
        desenharLinhaAtual();
      }
    });
    linha.appendChild(cel);
  }
  tabuleiro.appendChild(linha);
  tabuleiro.classList.toggle("compacto", tabuleiro.children.length > TENTATIVAS_PADRAO);
}

const LINHAS_TECLADO = [
  "qwertyuiop".split(""),
  "asdfghjkl".split(""),
  ["enter", ..."zxcvbnm".split(""), "apagar"]
];

function montarTeclado() {
  teclado.innerHTML = "";
  for (const linhaTeclas of LINHAS_TECLADO) {
    const linha = document.createElement("div");
    linha.className = "teclado-linha";
    for (const t of linhaTeclas) {
      const btn = document.createElement("button");
      btn.className = "tecla";
      btn.dataset.tecla = t;
      if (t === "enter" || t === "apagar") {
        btn.classList.add("larga");
        btn.textContent = t === "enter" ? "enter" : "⌫";
      } else {
        btn.textContent = t;
      }
      btn.addEventListener("click", () => tratarTecla(t));
      linha.appendChild(btn);
    }
    teclado.appendChild(linha);
  }
}

// ---------- desenho ----------

function linhaEl(i) {
  return tabuleiro.children[i];
}

function desenharLinhaAtual() {
  if (terminado || palpites.length >= tentativasRodada) return;
  const linha = linhaEl(palpites.length);
  linha.classList.remove("pendente");
  linha.classList.add("atual");
  for (let c = 0; c < TAMANHO; c++) {
    const cel = linha.children[c];
    cel.textContent = linhaAtual[c] || "";
    cel.classList.toggle("cursor", c === cursor);
  }
}

function desenharPalpite(i, animar) {
  const linha = linhaEl(i);
  linha.classList.remove("atual", "pendente");
  const exibicao = comAcento(palpites[i]);
  for (let c = 0; c < TAMANHO; c++) {
    const cel = linha.children[c];
    cel.classList.remove("cursor");
    if (animar) {
      setTimeout(() => {
        cel.classList.add("virando");
        setTimeout(() => {
          cel.textContent = exibicao[c];
          cel.classList.add(resultados[i][c]);
        }, 220);
      }, c * 180);
    } else {
      cel.textContent = exibicao[c];
      cel.classList.add(resultados[i][c]);
    }
  }
}

function pintarTeclado() {
  const prioridade = { errado: 1, lugar: 2, certo: 3 };
  const melhor = {};
  for (let i = 0; i < palpites.length; i++) {
    for (let c = 0; c < TAMANHO; c++) {
      const letra = palpites[i][c];
      const r = resultados[i][c];
      if (!melhor[letra] || prioridade[r] > prioridade[melhor[letra]]) melhor[letra] = r;
    }
  }
  if (sv) {
    for (const l of sv.eliminadas) {
      if (!melhor[l]) melhor[l] = "errado";
    }
  }
  document.querySelectorAll(".tecla").forEach(btn => {
    btn.classList.remove("certo", "lugar", "errado");
    const r = melhor[btn.dataset.tecla];
    if (r) btn.classList.add(r);
  });
}

// ---------- HUD ----------

function atualizarHUD() {
  if (!sv) return;
  const vidasEl = document.getElementById("hud-vidas");
  vidasEl.textContent = "❤️".repeat(sv.vidas) + "🖤".repeat(MAX_VIDAS - sv.vidas);
  vidasEl.classList.toggle("critico", sv.vidas === 1);
  document.getElementById("hud-rodada").textContent = "Rodada " + sv.rodada;
  const nivel = nivelDaRodada(sv.rodada);
  const nivelEl = document.getElementById("hud-nivel");
  nivelEl.textContent = NOME_NIVEL[nivel];
  nivelEl.className = "hud-nivel nivel-" + nivel;
  // o tom do fundo/fogo esquenta com a dificuldade
  document.body.classList.remove("tom-medio", "tom-dificil");
  if (nivel !== "facil") document.body.classList.add("tom-" + nivel);
  document.getElementById("hud-moedas").innerHTML = ICONE_MOEDA + " " + sv.moedas;

  document.querySelectorAll(".powerup").forEach(btn => {
    const pu = btn.dataset.pu;
    let indisponivel = sv.moedas < PRECOS[pu] || terminado || travado;
    if (pu === "extra" && sv.extras >= MAX_EXTRAS) indisponivel = true;
    if (pu === "vida" && sv.vidas >= MAX_VIDAS) indisponivel = true;
    btn.disabled = indisponivel;
  });

  const dicasEl = document.getElementById("dicas");
  dicasEl.innerHTML = "";
  if (sv.dicas.length) {
    dicasEl.classList.remove("escondido");
    for (const d of sv.dicas) {
      const chip = document.createElement("span");
      chip.className = "dica-chip";
      chip.textContent = (d.pos + 1) + "ª: " + d.letra;
      dicasEl.appendChild(chip);
    }
  } else {
    dicasEl.classList.add("escondido");
  }
}

function animarMoedas() {
  const el = document.getElementById("hud-moedas");
  el.classList.remove("ganho");
  void el.offsetWidth; // reinicia a animação
  el.classList.add("ganho");
}

function tremerTela() {
  document.body.classList.remove("tremor");
  void document.body.offsetWidth;
  document.body.classList.add("tremor");
  setTimeout(() => document.body.classList.remove("tremor"), 550);
}

// ---------- telas ----------

function mostrarInicio() {
  // a tela inicial sempre usa o tom base (fácil)
  document.body.classList.remove("tom-medio", "tom-dificil");
  const s = carregarStats();
  document.getElementById("ini-recorde").textContent = s.recorde;         // ranqueado (destaque)
  document.getElementById("ini-corridas").textContent = s.corridas;
  document.getElementById("ini-rodadas").textContent = s.rodadas;

  const btnDaily = document.getElementById("btn-jogar-daily");
  const btnEndless = document.getElementById("btn-jogar-endless");
  const legendaDaily = document.getElementById("legenda-daily");
  const travadoEl = document.getElementById("inicio-travado");
  const trav = travadoHoje();

  if (trav) {
    // Corrida do Dia esgotada: bloqueia só ela até a meia-noite (Modo Livre continua liberado)
    btnDaily.classList.add("escondido");
    legendaDaily.classList.add("escondido");
    travadoEl.classList.remove("escondido");
    document.getElementById("travado-resultado").textContent =
      "Você venceu " + trav.rodadas + (trav.rodadas === 1 ? " rodada" : " rodadas") + " hoje.";
    atualizarContagemAmanha();
  } else {
    btnDaily.classList.remove("escondido");
    legendaDaily.classList.remove("escondido");
    travadoEl.classList.add("escondido");
    const runDaily = carregarRun("daily");
    // botão de continuar SEMPRE diz o modo (nunca fica idêntico ao do outro modo)
    btnDaily.textContent = runDaily ? "▶ Corrida do Dia — Rodada " + runDaily.sv.rodada : "Corrida do Dia 🔥";
  }

  const runEndless = carregarRun("endless");
  btnEndless.textContent = runEndless ? "▶ Modo Livre — Rodada " + runEndless.sv.rodada : "Modo Livre ♾️";

  telaInicio.classList.remove("escondido");
  document.getElementById("header-jogo").classList.add("escondido");
  document.getElementById("jogo").classList.add("escondido");
}

function mostrarJogo() {
  telaInicio.classList.add("escondido");
  document.getElementById("header-jogo").classList.remove("escondido");
  document.getElementById("jogo").classList.remove("escondido");
}

function comecarJogo(modo) {
  if (modo === "daily" && travadoHoje()) { mostrarInicio(); return; } // Corrida do Dia esgotada hoje
  mostrarJogo();
  const salva = carregarRun(modo);
  if (salva) {
    sv = salva.sv;
    sv.modo = modo; // defensivo: garante o campo mesmo em estado salvo antigo/incompleto
    // rodada salva já tinha terminado (fechou no modal de transição): começa a próxima
    const rodadaEncerrada = salva.palpites.includes(salva.palavra) || salva.palpites.length >= salva.tentativasRodada;
    if (rodadaEncerrada) {
      iniciarRodada();
      return;
    }
    respostaNorm = salva.palavra;
    tentativasRodada = salva.tentativasRodada;
    palpites = [];
    resultados = [];
    for (const p of salva.palpites) {
      palpites.push(p);
      resultados.push(avaliar(p, respostaNorm));
    }
    linhaAtual = [];
    cursor = 0;
    terminado = false;
    travado = false;
    montarTabuleiro(tentativasRodada);
    for (let i = 0; i < palpites.length; i++) desenharPalpite(i, false);
    pintarTeclado();
    desenharLinhaAtual();
    atualizarHUD();
    return;
  }
  novaCorrida(modo);
  evt("ts_run_start", { mode: modo });
  iniciarRodada();
}

// ---------- corrida ----------

// dificuldade em degraus: 5 rodadas fáceis, 5 médias e o resto difíceis
function nivelDaRodada(rodada) {
  if (rodada <= 5) return "facil";
  if (rodada <= 10) return "medio";
  return "dificil";
}

const POOL_NIVEL = { facil: RESPOSTAS_FACIL, medio: RESPOSTAS_MEDIO, dificil: RESPOSTAS_DIFICIL };
const NOME_NIVEL = { facil: "fácil", medio: "médio", dificil: "difícil" };

function tentativasBase(rodada) {
  if (rodada <= 5) return 6;
  if (rodada <= 10) return 5;
  return 4;
}

function novaCorrida(modo) {
  sv = { modo: modo, vidas: VIDAS_INICIAIS, moedas: 0, rodada: 1, usadas: [], extras: 0, eliminadas: [], dicas: [] };
}

function iniciarRodada() {
  tentativasRodada = tentativasBase(sv.rodada);
  sv.extras = 0;
  sv.eliminadas = [];
  sv.dicas = [];
  const rng = sv.modo === "daily" ? rngDaRodadaDiaria(sv.rodada) : null;
  respostaNorm = palavraAleatoria(sv.usadas, POOL_NIVEL[nivelDaRodada(sv.rodada)], rng);
  sv.usadas.push(respostaNorm);
  palpites = [];
  resultados = [];
  linhaAtual = [];
  cursor = 0;
  terminado = false;
  travado = false;
  montarTabuleiro(tentativasRodada);
  pintarTeclado();
  desenharLinhaAtual();
  atualizarHUD();
  salvarRun();
}

function fimPalpite(palavra) {
  if (palavra === respostaNorm) {
    const ganho = 2 + (tentativasRodada - palpites.length);
    sv.moedas += ganho;
    celebrar(palpites.length - 1);
    animarMoedas();
    sv.rodada++;
    evt("ts_round_won", { round: sv.rodada - 1, mode: sv.modo });
    salvarRun();
    atualizarHUD();
    let aviso = "";
    if (sv.rodada === 6) aviso = " Agora vêm as palavras médias! 🔶";
    if (sv.rodada === 11) aviso = " Daqui em diante, só palavras difíceis! 🔥";
    setTimeout(() => {
      abrirModalRodada(
        "Rodada " + (sv.rodada - 1) + " vencida! 🎉",
        "+" + ganho + " moedas (total: " + sv.moedas + "). A próxima tem " + tentativasBase(sv.rodada) + " tentativas." + aviso,
        "Próxima rodada"
      );
    }, 1100);
  } else if (palpites.length >= tentativasRodada) {
    sv.vidas--;
    tremerTela();
    atualizarHUD();
    if (sv.vidas > 0) {
      salvarRun();
      setTimeout(() => {
        abrirModalRodada(
          "Perdeu uma vida 💔",
          "A palavra era “" + comAcento(respostaNorm).toUpperCase() + "”. Vidas restantes: " + "❤️".repeat(sv.vidas),
          "Próxima rodada"
        );
      }, 700);
    } else {
      const rodadasVencidas = sv.rodada - 1;
      const modoFinalizado = sv.modo;
      const novoRecorde = registrarCorrida(rodadasVencidas, modoFinalizado);
      limparRun(modoFinalizado);
      terminado = true;
      evt("ts_run_end", { rounds_survived: rodadasVencidas, mode: modoFinalizado });
      if (modoFinalizado === "daily") {
        salvarTravado(rodadasVencidas); // trava a Corrida do Dia até a meia-noite (SP); Modo Livre continua liberado
      }
      const stats = carregarStats();
      const plural = rodadasVencidas === 1 ? " rodada" : " rodadas";
      const palavraEra = "A palavra era “" + comAcento(respostaNorm).toUpperCase() + "”. ";
      setTimeout(() => {
        if (modoFinalizado === "daily") {
          abrirModalRodada(
            novoRecorde ? "Novo recorde ranqueado! 🏆" : "Fim da Corrida do Dia 💀",
            palavraEra + "Você venceu " + rodadasVencidas + plural + " na Corrida do Dia 🏆 (ranqueada). " +
              "Recorde ranqueado: " + stats.recorde + ". Nova tentativa à meia-noite (horário de Brasília). " +
              "O Modo Livre (treino) continua liberado.",
            null,
            true
          );
        } else {
          abrirModalRodada(
            novoRecorde ? "Novo melhor no treino! 🎯" : "Fim do treino 💪",
            palavraEra + "No treino você chegou a " + rodadasVencidas + plural + ". " +
              "Seu melhor no treino: " + stats.recordeTreino + " (não conta pro ranking). " +
              "O ranking é só na Corrida do Dia 🏆.",
            "Treinar de novo",
            true
          );
        }
      }, 700);
    }
  } else {
    salvarRun();
    desenharLinhaAtual();
  }
}

// ---------- regras ----------

function avaliar(palpite, resposta) {
  const res = new Array(TAMANHO).fill("errado");
  const sobras = {};
  for (let i = 0; i < TAMANHO; i++) {
    if (palpite[i] === resposta[i]) {
      res[i] = "certo";
    } else {
      sobras[resposta[i]] = (sobras[resposta[i]] || 0) + 1;
    }
  }
  for (let i = 0; i < TAMANHO; i++) {
    if (res[i] !== "certo" && sobras[palpite[i]] > 0) {
      res[i] = "lugar";
      sobras[palpite[i]]--;
    }
  }
  return res;
}

function tratarTecla(t) {
  if (terminado || animando || travado) return;

  if (t === "enter") {
    enviarPalpite();
    return;
  }
  if (t === "apagar") {
    if (linhaAtual[cursor]) {
      linhaAtual[cursor] = "";
    } else if (cursor > 0) {
      cursor--;
      linhaAtual[cursor] = "";
    }
    desenharLinhaAtual();
    return;
  }
  if (/^[a-z]$/.test(t)) {
    linhaAtual[cursor] = t;
    if (cursor < TAMANHO - 1) cursor++;
    desenharLinhaAtual();
  }
}

function enviarPalpite() {
  const palavra = linhaAtual.join("");
  const linha = linhaEl(palpites.length);

  if (palavra.length < TAMANHO || linhaAtual.filter(Boolean).length < TAMANHO) {
    toast("Letras insuficientes");
    linha.classList.add("tremendo");
    setTimeout(() => linha.classList.remove("tremendo"), 450);
    return;
  }
  if (!PALAVRAS_VALIDAS[palavra]) {
    toast("Essa palavra não é aceita");
    linha.classList.add("tremendo");
    setTimeout(() => linha.classList.remove("tremendo"), 450);
    return;
  }

  const resultado = avaliar(palavra, respostaNorm);
  palpites.push(palavra);
  resultados.push(resultado);
  linhaAtual = [];
  cursor = 0;

  animando = true;
  desenharPalpite(palpites.length - 1, true);

  const fimAnimacao = TAMANHO * 180 + 300;
  setTimeout(() => {
    animando = false;
    pintarTeclado();
    fimPalpite(palavra);
  }, fimAnimacao);
}

const ELOGIOS = ["Genial!", "Fantástico!", "Impressionante!", "Ótimo!", "Muito bem!", "Ufa!", "Na trave!", "Por pouco!"];

function celebrar(indiceLinha) {
  toast(ELOGIOS[Math.min(indiceLinha, ELOGIOS.length - 1)]);
  const linha = linhaEl(indiceLinha);
  for (let c = 0; c < TAMANHO; c++) {
    setTimeout(() => linha.children[c].classList.add("pulando"), c * 90);
  }
}

// ---------- power-ups ----------

function comprarPowerup(pu) {
  if (!sv || terminado || travado || animando) return;
  if (sv.moedas < PRECOS[pu]) { toast("Moedas insuficientes"); return; }

  if (pu === "revelar") {
    const conhecidas = new Set(sv.dicas.map(d => d.pos));
    for (const r of resultados) {
      for (let i = 0; i < TAMANHO; i++) if (r[i] === "certo") conhecidas.add(i);
    }
    const candidatas = [];
    for (let i = 0; i < TAMANHO; i++) if (!conhecidas.has(i)) candidatas.push(i);
    if (!candidatas.length) { toast("Nada para revelar"); return; }
    const pos = candidatas[Math.floor(Math.random() * candidatas.length)];
    sv.dicas.push({ pos: pos, letra: respostaNorm[pos] });
    linhaAtual[pos] = respostaNorm[pos];
    desenharLinhaAtual();
    toast("A " + (pos + 1) + "ª letra é “" + respostaNorm[pos].toUpperCase() + "”");
  }

  if (pu === "eliminar") {
    const jaMarcadas = new Set(sv.eliminadas);
    for (let i = 0; i < palpites.length; i++) {
      for (let c = 0; c < TAMANHO; c++) {
        if (resultados[i][c] === "errado" && !respostaNorm.includes(palpites[i][c])) jaMarcadas.add(palpites[i][c]);
      }
    }
    const candidatas = "abcdefghijklmnopqrstuvwxyz".split("")
      .filter(l => !respostaNorm.includes(l) && !jaMarcadas.has(l));
    if (!candidatas.length) { toast("Nada para eliminar"); return; }
    const removidas = [];
    for (let i = 0; i < 3 && candidatas.length; i++) {
      const idx = Math.floor(Math.random() * candidatas.length);
      removidas.push(candidatas.splice(idx, 1)[0]);
    }
    sv.eliminadas.push(...removidas);
    pintarTeclado();
    toast("Eliminadas: " + removidas.map(l => l.toUpperCase()).join(", "));
  }

  if (pu === "extra") {
    if (sv.extras >= MAX_EXTRAS) { toast("Limite de tentativas extras"); return; }
    sv.extras++;
    tentativasRodada++;
    adicionarLinha();
    toast("Tentativa extra adicionada");
  }

  if (pu === "vida") {
    if (sv.vidas >= MAX_VIDAS) { toast("Vidas no máximo"); return; }
    sv.vidas++;
    toast("Vida extra! " + "❤️".repeat(sv.vidas));
  }

  sv.moedas -= PRECOS[pu];
  evt("ts_powerup_buy", { powerup: pu, mode: sv.modo });
  atualizarHUD();
  salvarRun();
}

// ---------- modais ----------

function abrirModal(id) {
  document.getElementById(id).classList.remove("escondido");
}

function fecharModal(id) {
  document.getElementById(id).classList.add("escondido");
}

function abrirModalRodada(titulo, texto, rotulo, fimDeJogo) {
  travado = true;
  document.getElementById("rodada-titulo").textContent = titulo;
  document.getElementById("rodada-texto").textContent = texto;
  const btnCont = document.getElementById("btn-continuar");
  btnCont.classList.toggle("escondido", !rotulo);
  if (rotulo) btnCont.textContent = rotulo;
  document.getElementById("btn-compartilhar").classList.toggle("escondido", !fimDeJogo);
  document.getElementById("btn-sair").classList.toggle("escondido", !fimDeJogo);
  atualizarHUD();
  abrirModal("modal-rodada");
}

// DD/MM a partir da data de SP (spDia() retorna "YYYY-MM-DD")
function dataCurtaSP() {
  const partes = spDia().split("-");
  return partes[2] + "/" + partes[1];
}

function compartilhar() {
  const s = carregarStats();
  const rodadas = sv ? sv.rodada - 1 : 0;
  const modo = sv ? sv.modo : "endless";
  const plural = rodadas === 1 ? " rodada" : " rodadas";
  const link = "nimbo.games/termo-survival?s=sh";
  // Diário = ranqueado/comparável (mesmo desafio pra todos, mostra recorde 🏆). Livre = treino,
  // enquadrado como treino e SEM sugerir ranking.
  const texto = modo === "daily"
    ? "🔥 Termo Survival — Corrida do Dia " + dataCurtaSP() + "\nSobrevivi a " + rodadas + plural +
      "! Recorde ranqueado: " + s.recorde + " 🏆\n" + link
    : "🔥 Termo Survival — Treino\nCheguei a " + rodadas + plural + " no treino 💪\n" + link;
  evt("ts_share_click", { mode: modo });
  navigator.clipboard.writeText(texto).then(
    () => toast("Resultado copiado!"),
    () => toast("Não foi possível copiar")
  );
}

// ---------- eventos ----------

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (!telaInicio.classList.contains("escondido")) {
    if (e.key === "Enter") {
      // Enter ativa o CTA primário visível: Corrida do Dia, ou Modo Livre se aquela estiver travada
      const btnDaily = document.getElementById("btn-jogar-daily");
      if (!btnDaily.classList.contains("escondido")) btnDaily.click();
      else document.getElementById("btn-jogar-endless").click();
    }
    return;
  }
  if (!document.getElementById("modal-rodada").classList.contains("escondido")) {
    if (e.key === "Enter") document.getElementById("btn-continuar").click();
    return;
  }
  if (!document.getElementById("modal-ajuda").classList.contains("escondido")) {
    if (e.key === "Escape") fecharModal("modal-ajuda");
    return;
  }
  if (e.key === "Enter") { tratarTecla("enter"); return; }
  if (e.key === "Backspace") { tratarTecla("apagar"); return; }
  if (e.key === "ArrowLeft" && cursor > 0) { cursor--; desenharLinhaAtual(); return; }
  if (e.key === "ArrowRight" && cursor < TAMANHO - 1) { cursor++; desenharLinhaAtual(); return; }
  if (e.key === " " || e.code === "Space") {
    // espaço "pula uma casa": avança o cursor sem preencher a letra atual (deixa lacunas
    // pra posicionar letras já conhecidas). preventDefault sempre, mesmo na última casa,
    // senão a barra de espaço rola a página.
    e.preventDefault();
    if (cursor < TAMANHO - 1) cursor++;
    desenharLinhaAtual();
    return;
  }
  const letra = normalizar(e.key);
  if (/^[a-z]$/.test(letra)) tratarTecla(letra);
});

// sem isto, o Enter físico reativa o último botão clicado (o foco fica nele)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (btn) btn.blur();
});

document.getElementById("btn-jogar-daily").addEventListener("click", () => comecarJogo("daily"));
document.getElementById("btn-jogar-endless").addEventListener("click", () => comecarJogo("endless"));
document.getElementById("btn-como").addEventListener("click", () => abrirModal("modal-ajuda"));
document.getElementById("btn-ajuda").addEventListener("click", () => abrirModal("modal-ajuda"));
document.getElementById("btn-menu").addEventListener("click", () => {
  // a corrida já fica salva a cada jogada; só volta ao menu
  mostrarInicio();
});

document.getElementById("btn-continuar").addEventListener("click", () => {
  fecharModal("modal-rodada");
  travado = false;
  if (terminado) {
    // "Começar rodada 1" (virada de dia) ou "Jogar de novo" (fim de jogo no Modo Livre): nova corrida
    const modoAtual = sv.modo;
    novaCorrida(modoAtual);
    evt("ts_run_start", { mode: modoAtual });
  }
  iniciarRodada();
});
document.getElementById("btn-sair").addEventListener("click", () => {
  fecharModal("modal-rodada");
  travado = false;
  mostrarInicio();
});
document.getElementById("btn-compartilhar").addEventListener("click", compartilhar);

document.querySelectorAll(".powerup").forEach(btn =>
  btn.addEventListener("click", () => comprarPowerup(btn.dataset.pu))
);

document.querySelectorAll(".modal-fechar").forEach(btn =>
  btn.addEventListener("click", () => fecharModal(btn.dataset.fecha))
);
document.querySelectorAll(".modal-fundo").forEach(m =>
  m.addEventListener("click", (e) => {
    if (e.target === m && m.id !== "modal-rodada") m.classList.add("escondido");
  })
);

// ---------- alto contraste ----------

const chkContraste = document.getElementById("chk-contraste");
if (armazem.get(CHAVE_CONTRASTE) === "1") {
  document.body.classList.add("contraste");
  chkContraste.checked = true;
}
chkContraste.addEventListener("change", () => {
  document.body.classList.toggle("contraste", chkContraste.checked);
  armazem.set(CHAVE_CONTRASTE, chkContraste.checked ? "1" : "0");
});

// ---------- virada de dia (meia-noite, horário de São Paulo) ----------

let diaSPAtual = spDia();

function aoVirarDia() {
  const noJogo = !document.getElementById("jogo").classList.contains("escondido");
  const emCorridaDiaria = noJogo && sv && !terminado && sv.modo === "daily";
  const emCorridaLivre = noJogo && sv && !terminado && sv.modo === "endless";

  if (emCorridaDiaria) {
    // a sequência de palavras da Corrida do Dia é derivada da data: a de ontem não continua
    limparRun("daily");
    registrarCorrida(Math.max(0, sv.rodada - 1), "daily"); // conta o progresso da corrida ranqueada encerrada
    terminado = true;
    abrirModalRodada(
      "Virou o dia! 🌅",
      "A Corrida do Dia de ontem terminou (meia-noite de São Paulo). Vamos começar a corrida de hoje, na rodada 1!",
      "Começar rodada 1",
      false
    );
    return;
  }
  if (emCorridaLivre) {
    // Modo Livre não depende da data e não tem trava: a corrida em andamento segue sem interrupção
    return;
  }
  // no menu, no fim de jogo, ou sem corrida ativa: fecha modal e recarrega o menu
  // (isso também exibe a Corrida do Dia destravada — travadoHoje() expira sozinho por data)
  fecharModal("modal-rodada");
  mostrarInicio();
}

setInterval(() => {
  const hoje = spDia();
  if (hoje !== diaSPAtual) { diaSPAtual = hoje; aoVirarDia(); return; }
  // atualiza a contagem quando a tela de bloqueio está visível
  if (!telaInicio.classList.contains("escondido") &&
      !document.getElementById("inicio-travado").classList.contains("escondido")) {
    atualizarContagemAmanha();
  }
}, 1000);

// ---------- início ----------

// migra o recorde da versão anterior (chave antiga separada)
const recordeAntigo = parseInt(armazem.get("termo.sobrevivencia.recorde"), 10);
if (!isNaN(recordeAntigo) && recordeAntigo > 0) {
  const s = carregarStats();
  if (recordeAntigo > s.recorde) {
    s.recorde = recordeAntigo;
    armazem.set(CHAVE_STATS, JSON.stringify(s));
  }
  armazem.del("termo.sobrevivencia.recorde");
}

evt("ts_session_start", {});
montarTeclado();
mostrarInicio();
