// ============================================================
// SPRITES — pré-carrega as artes geradas e desenha ancoradas pela base.
// Se um tipo não tiver sprite gerado ainda, os módulos que chamam
// desenharAncoradoBase() caem no desenho procedural (fallback).
// ============================================================

const CAMINHOS = {
  terreno: './assets/terreno.jpg',
  terreno2: './assets/terreno2.jpg',
  icone_ouro: './assets/icone_ouro.png',
  icone_madeira: './assets/icone_madeira.png',
  // recorte do castelo do próprio terreno pintado (para oclusão por profundidade)
  casteloRecorte: './assets/castelo_recorte.png',
  castelo: './assets/castelo.png',
  goblin: './assets/goblin.png',
  orc: './assets/orc.png',
  lobo: './assets/lobo.png',
  esqueleto: './assets/esqueleto.png',
  ogro: './assets/ogro.png',
  voador: './assets/voador.png',
  golem: './assets/golem.png',
  reiGoblin: './assets/rei_goblin.png',
  trabalhador: './assets/trabalhador.png',
  mina: './assets/mina.png',
  madeireira: './assets/madeireira.png',
  arqueiro_1: './assets/torre_arqueiro_1.png',
  arqueiro_2: './assets/torre_arqueiro.png',
  arqueiro_3: './assets/torre_arqueiro_3.png',
  arqueiro_4: './assets/torre_arqueiro_4.png',
  canhao_1: './assets/torre_canhao_1.png',
  canhao_2: './assets/torre_canhao.png',
  canhao_3: './assets/torre_canhao_3.png',
  canhao_4: './assets/torre_canhao_4.png',
  magica_1: './assets/torre_magica_1.png',
  magica_2: './assets/torre_magica.png',
  magica_3: './assets/torre_magica_3.png',
  magica_4: './assets/torre_magica_4.png',
  gelo_1: './assets/torre_gelo_1.png',
  gelo_2: './assets/torre_gelo_2.png',
  gelo_3: './assets/torre_gelo_3.png',
  gelo_4: './assets/torre_gelo_4.png',
};

const cache = {};

export function precarregar() {
  const promessas = Object.entries(CAMINHOS).map(([nome, src]) => new Promise(resolve => {
    const img = new Image();
    img.onload = () => { cache[nome] = img; resolve(); };
    img.onerror = () => resolve(); // segue sem o sprite; quem desenha usa fallback
    img.src = src;
  }));
  return Promise.all(promessas);
}

export function sprite(nome) {
  return cache[nome] || null;
}

// Desenha a imagem ancorada pela base (bottom-center) em (x, yBase), com largura alvo.
// h é opcional: se omitido, é calculado pelo aspecto da imagem.
// Retorna true se desenhou, false se o sprite ainda não está disponível (chamador deve usar fallback).
export function desenharAncoradoBase(c, nome, x, yBase, w, h) {
  const img = sprite(nome);
  if (!img) return false;
  const alt = h ?? w * (img.height / img.width);
  c.drawImage(img, x - w / 2, yBase - alt, w, alt);
  return true;
}
