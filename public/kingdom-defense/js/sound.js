// ============================================================
// SOM — Web Audio API. Sons decodificados uma vez em AudioBuffer
// e tocados via BufferSourceNode: permite dezenas de sons
// sobrepostos (ex.: vários goblins morrendo juntos) sem cortar
// um ao outro, o que <audio>/Audio() reaproveitado não permite.
//
// O ambiente (vento de floresta) é sintetizado em código —
// ruído filtrado, sem arquivo — porque não achei um loop de
// floresta CC0 pronto no Kenney (ver ASSETS.md).
// ============================================================

const CAMINHOS = {
  tiro_arqueiro: './assets/sfx/tiro_arqueiro.mp3',
  tiro_canhao: './assets/sfx/tiro_canhao.mp3',
  tiro_magica: './assets/sfx/tiro_magica.mp3',
  tiro_gelo: './assets/sfx/tiro_magica.mp3', // reusa som glassy da mágica
  impacto_flecha: ['./assets/sfx/impacto_flecha1.mp3', './assets/sfx/impacto_flecha2.mp3', './assets/sfx/impacto_flecha3.mp3'],
  impacto_canhao: './assets/sfx/impacto_canhao.mp3',
  impacto_magica: './assets/sfx/impacto_magica.mp3',
  morte: ['./assets/sfx/morte1.mp3', './assets/sfx/morte2.mp3', './assets/sfx/morte3.mp3', './assets/sfx/morte4.mp3'],
  moeda: ['./assets/sfx/moeda1.mp3', './assets/sfx/moeda2.mp3'],
  madeira: './assets/sfx/madeira.mp3',
  clique: './assets/sfx/clique.mp3',
  confirmar: './assets/sfx/confirmar.mp3',
  onda_inicio: './assets/sfx/onda_inicio.mp3',
  recuar: './assets/sfx/recuar.mp3',
  retomar: './assets/sfx/retomar.mp3',
  onda_vitoria: './assets/sfx/onda_vitoria.mp3',
  jogo_vitoria: './assets/sfx/jogo_vitoria.mp3',
  jogo_derrota: './assets/sfx/jogo_derrota.mp3',
};

let ctx = null;
let master = null;
const buffers = {}; // nome -> AudioBuffer | AudioBuffer[]
let mudo = localStorage.getItem('kd-mudo') === '1';
let volume = (() => {
  const v = parseFloat(localStorage.getItem('kd-volume'));
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8;
})();

// TODO o áudio (efeitos E ambiente) passa pelo master: mudo/volume valem para tudo.
function aplicarGanho() {
  if (master) master.gain.value = mudo ? 0 : volume;
}

export function mutado() { return mudo; }

export function alternarMudo() {
  mudo = !mudo;
  localStorage.setItem('kd-mudo', mudo ? '1' : '0');
  aplicarGanho();
  return mudo;
}

export function obterVolume() { return volume; }

export function definirVolume(v) {
  volume = Math.min(1, Math.max(0, v));
  localStorage.setItem('kd-volume', String(volume));
  aplicarGanho();
}

// Precisa ser chamado a partir de um gesto do usuário (clique em "Jogar"):
// navegadores bloqueiam AudioContext antes de uma interação.
export function iniciarAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.connect(ctx.destination);
  aplicarGanho();
  iniciarAmbiente();
  precarregarSons();
}

async function carregarBuffer(url) {
  const resp = await fetch(url);
  const arr = await resp.arrayBuffer();
  return ctx.decodeAudioData(arr);
}

async function precarregarSons() {
  await Promise.all(Object.entries(CAMINHOS).map(async ([nome, caminho]) => {
    try {
      buffers[nome] = Array.isArray(caminho)
        ? await Promise.all(caminho.map(carregarBuffer))
        : await carregarBuffer(caminho);
    } catch { /* arquivo ausente não deve travar o jogo */ }
  }));
}

// Toca um som (ou uma variação aleatória, se `nome` tiver várias).
// opts: { volume = 1, pitch = 1 }
export function tocar(nome, opts = {}) {
  if (!ctx || mudo) return;
  const buf = buffers[nome];
  if (!buf) return;
  const escolhido = Array.isArray(buf) ? buf[Math.floor(Math.random() * buf.length)] : buf;
  const src = ctx.createBufferSource();
  src.buffer = escolhido;
  src.playbackRate.value = opts.pitch ?? 1;
  const gain = ctx.createGain();
  gain.gain.value = opts.volume ?? 1;
  src.connect(gain).connect(master);
  src.start();
}

// Vento de floresta: ruído filtrado em loop, bem discreto.
function iniciarAmbiente() {
  const dur = 4;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const dados = buf.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < dados.length; i++) {
    const branco = Math.random() * 2 - 1;
    ultimo = (ultimo + 0.02 * branco) / 1.02; // integração leve → mais grave que ruído branco puro
    dados[i] = ultimo * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.value = 600;
  filtro.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.value = 0.13;
  src.connect(filtro).connect(gain).connect(master);
  src.start();
}
