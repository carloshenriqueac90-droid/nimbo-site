// ============================================================
// ENTIDADES — cada classe cuida do próprio update() e desenhar().
// IA dos inimigos: comportamento decidido por flags do config
// (cacador, voador, revive, invoca) → fácil criar tipos novos.
// ============================================================

import { INIMIGOS, TORRES, UPGRADE, ECONOMIA, TRABALHADOR } from './config.js';
import { CASTELO, ROTAS } from './map.js';
import { dist, moverPara, SeguidorRota, indiceSegProximo } from './util.js';
import { sprite, desenharAncoradoBase } from './sprites.js';
import { tocar } from './sound.js';

// largura de exibição de cada sprite de inimigo, em px de mundo (altura = aspecto da imagem)
const TAMANHO_SPRITE_INIMIGO = {
  goblin: 46,
  orc: 64,
  lobo: 78,
  esqueleto: 46,
  ogro: 76,
  voador: 54,
  golem: 92,
  reiGoblin: 98,
};

let proximoId = 1;

// ---------------------------------------------------------- Efeito
export class Efeito {
  constructor(opts) {
    Object.assign(this, { t: 1, dur: 1 }, opts);
    this.dur = this.t;
  }
  update(dt) {
    this.t -= dt;
    if (this.tipo === 'texto') this.y -= 32 * dt;
    if (this.t <= 0) this.remover = true;
  }
  desenhar(c) {
    const a = Math.max(0, this.t / this.dur);
    c.globalAlpha = a;
    if (this.tipo === 'texto') {
      c.font = 'bold 13px system-ui, sans-serif';
      c.textAlign = 'center';
      c.strokeStyle = 'rgba(0,0,0,0.7)'; c.lineWidth = 3;
      c.strokeText(this.txt, this.x, this.y);
      c.fillStyle = this.cor;
      c.fillText(this.txt, this.x, this.y);
      if (this.icone) {
        const img = sprite(this.icone);
        if (img) c.drawImage(img, this.x + c.measureText(this.txt).width / 2 + 3, this.y - 12, 14, 14);
      }
    } else if (this.tipo === 'explosao') {
      const r = Math.max(0, this.r * (1 - a * 0.5));
      const gelo = this.variante === 'gelo';
      c.fillStyle = gelo ? 'rgba(120,200,240,0.5)' : 'rgba(255,140,40,0.55)';
      c.beginPath(); c.arc(this.x, this.y, r, 0, 7); c.fill();
      c.fillStyle = gelo ? 'rgba(220,245,255,0.75)' : 'rgba(255,230,120,0.7)';
      c.beginPath(); c.arc(this.x, this.y, r * 0.5, 0, 7); c.fill();
    } else { // faisca
      c.fillStyle = this.cor || '#fff';
      c.beginPath(); c.arc(this.x, this.y, 4 * a, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
  }
}

export function efeitoTexto(state, x, y, txt, cor, icone = null) {
  state.efeitos.push(new Efeito({ tipo: 'texto', x, y, txt, cor, icone, t: 1 }));
}

// ---------------------------------------------------------- Inimigo
export class Inimigo {
  constructor(tipo, rotaIdx, escalaHP = 1) {
    this.id = proximoId++;
    this.tipo = tipo;
    this.def = INIMIGOS[tipo];
    this.rotaIdx = rotaIdx;
    this.hpMax = Math.round(this.def.hp * escalaHP);
    this.hp = this.hpMax;
    this.vel = this.def.vel;
    const ini = ROTAS[rotaIdx][0];
    this.x = ini[0]; this.y = ini[1];
    // Voadores têm movimento livre; os demais (inclusive caçadores) seguem a rota.
    if (!this.def.voador) this.seg = new SeguidorRota(ROTAS[rotaIdx]);
    this.tInvoca = 4;
    this.pausa = 0;
    this.anim = Math.random() * 7;
  }

  distCastelo() {
    return this.seg ? this.seg.restante() : dist(this, CASTELO);
  }

  update(dt, state) {
    this.anim += dt * 6;
    // Esqueleto "morto" aguardando reviver
    if (this.morto) {
      this.tRevive -= dt;
      if (this.tRevive <= 0) { this.morto = false; this.hp = Math.round(this.hpMax * 0.5); }
      return;
    }
    if (this.slowT > 0) this.slowT -= dt;
    if (this.pausa > 0) { this.pausa -= dt; return; }

    const v = this.velEfetiva();
    if (this.def.cacador) this.updateCacador(dt, state, v);
    else if (this.def.voador) this.updateLivre(dt, state);
    else {
      this.seg.avancar(v * dt);
      this.x = this.seg.x; this.y = this.seg.y;
      if (this.seg.fim) this.chegouCastelo(state);
    }

    // Chefe invocador (Rei Goblin)
    if (this.def.invoca && !this.remover) {
      this.tInvoca -= dt;
      if (this.tInvoca <= 0) {
        this.tInvoca = 6;
        for (let i = 0; i < 2; i++) {
          const g = new Inimigo(this.def.invoca, this.rotaIdx, state.escalaHP);
          g.x = this.x + (i ? 14 : -14); g.y = this.y;
          if (g.seg) { g.seg.i = this.seg ? this.seg.i : 0; g.seg.x = g.x; g.seg.y = g.y; }
          state.inimigos.push(g);
        }
        efeitoTexto(state, this.x, this.y - 26, 'Invocou!', '#a6f77b');
      }
    }
  }

  // IA do caçador (Lobo): segue a rota normal, mas desvia para caçar
  // trabalhadores expostos que estejam perto. Sem alvo (ex.: após Recuar),
  // volta ao ponto da rota de onde saiu e retoma a marcha ao castelo.
  // Velocidade após efeito de lentidão (torre de gelo).
  velEfetiva() {
    return this.slowT > 0 ? this.vel * this.slowFator : this.vel;
  }

  // Aplica lentidão; mantém o efeito mais forte se já estiver lento.
  aplicarSlow(fator, dur) {
    this.slowFator = this.slowT > 0 ? Math.min(this.slowFator, fator) : fator;
    this.slowT = Math.max(this.slowT || 0, dur);
  }

  updateCacador(dt, state, v = this.vel) {
    const RAIO_CACA = 260;
    let alvo = null, md = Infinity;
    for (const t of state.trabalhadores) {
      if (t.remover || !t.exposto()) continue;
      const d = dist(this, t);
      if (d < md) { md = d; alvo = t; }
    }
    if (alvo && md < RAIO_CACA) {
      this.foraDaRota = true;
      moverPara(this, alvo, v * dt);
      if (dist(this, alvo) < 13) {
        alvo.morrer(state);
        this.pausa = 0.45;
      }
    } else if (this.foraDaRota) {
      // retorna ao ponto da rota onde abandonou a marcha
      if (moverPara(this, { x: this.seg.x, y: this.seg.y }, v * dt) <= 0) {
        this.foraDaRota = false;
      }
    } else {
      this.seg.avancar(v * dt);
      this.x = this.seg.x; this.y = this.seg.y;
      if (this.seg.fim) this.chegouCastelo(state);
    }
  }

  // Movimento livre direto ao castelo (voadores / caçadores sem alvo).
  updateLivre(dt, state, mult = 1) {
    moverPara(this, CASTELO, this.velEfetiva() * dt * mult);
    if (dist(this, CASTELO) < CASTELO.raio * 0.6) this.chegouCastelo(state);
  }

  chegouCastelo(state) {
    if (this.remover) return;
    this.remover = true;
    state.vidas -= this.def.dano;
    efeitoTexto(state, CASTELO.x, CASTELO.y - 60, `-${this.def.dano} ❤`, '#ff6b6b');
  }

  takeDano(dano, tipoDano, state) {
    if (this.remover || this.morto) return;
    if (tipoDano === 'fisico' && this.def.armadura) dano *= (1 - this.def.armadura);
    this.hp -= dano;
    if (this.hp <= 0) {
      if (this.def.revive && !this.reviveu) {
        this.reviveu = true;
        this.morto = true;
        this.tRevive = 1.6;
      } else {
        this.remover = true;
        state.ouro += this.def.ouro;
        efeitoTexto(state, this.x, this.y - 14, `+${this.def.ouro}`, '#ffd166', 'icone_ouro');
        // criaturas maiores soam mais graves (pitch inversamente prop. ao raio)
        const pitch = Math.max(0.6, Math.min(1.4, 1.3 - this.def.raio * 0.012));
        tocar('morte', { volume: 0.5, pitch });
      }
    }
  }

  desenhar(c) {
    const { raio, cor } = this.def;
    const bob = this.def.voador ? Math.sin(this.anim) * 3 : 0;
    const y = this.y + bob;
    if (this.morto) { // pilha de ossos do esqueleto
      c.fillStyle = '#d8d8ce';
      c.beginPath(); c.ellipse(this.x, this.y + 4, raio, raio * 0.45, 0, 0, 7); c.fill();
      return;
    }
    // sombra no chão
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath(); c.ellipse(this.x, this.y + raio * 0.9, raio * 1.1, raio * 0.4, 0, 0, 7); c.fill();

    // aura de gelo quando lento (halo azulado atrás do corpo)
    if (this.slowT > 0) {
      c.fillStyle = 'rgba(140,215,255,0.28)';
      c.beginPath(); c.arc(this.x, y, raio * 1.35, 0, 7); c.fill();
    }

    const tamW = TAMANHO_SPRITE_INIMIGO[this.tipo];
    const img = tamW ? sprite(this.tipo) : null;
    let desenhouSprite = false, topoSprite = null;
    if (img) {
      const h = tamW * (img.height / img.width);
      const yBase = y + raio * 0.9; // pés alinhados com a sombra
      c.drawImage(img, this.x - tamW / 2, yBase - h, tamW, h);
      desenhouSprite = true;
      topoSprite = yBase - h;
    }

    if (!desenhouSprite) {
      // asas do voador
      if (this.def.voador) {
        const w = Math.sin(this.anim * 2) * 4;
        c.fillStyle = '#6c3483';
        c.beginPath(); c.moveTo(this.x - 4, y); c.lineTo(this.x - raio - 8, y - 8 - w); c.lineTo(this.x - 6, y + 4); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(this.x + 4, y); c.lineTo(this.x + raio + 8, y - 8 - w); c.lineTo(this.x + 6, y + 4); c.closePath(); c.fill();
      }
      // corpo
      c.fillStyle = cor;
      if (this.def.cacador) {
        c.beginPath(); c.ellipse(this.x, y, raio * 1.25, raio * 0.8, 0, 0, 7); c.fill();
        // orelhas
        c.beginPath(); c.moveTo(this.x - raio * 0.8, y - raio * 0.5); c.lineTo(this.x - raio * 0.4, y - raio * 1.3); c.lineTo(this.x - raio * 0.1, y - raio * 0.5); c.closePath(); c.fill();
      } else {
        c.beginPath(); c.arc(this.x, y, raio, 0, 7); c.fill();
      }
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2;
      c.stroke();
      // olhos
      c.fillStyle = this.def.cacador ? '#ff4d4d' : '#fff';
      c.beginPath(); c.arc(this.x - raio * 0.35, y - raio * 0.2, raio * 0.18, 0, 7); c.fill();
      c.beginPath(); c.arc(this.x + raio * 0.35, y - raio * 0.2, raio * 0.18, 0, 7); c.fill();
    }
    // coroa do chefe (só no desenho procedural; sprites já têm a própria coroa)
    if (this.def.chefe && !desenhouSprite) {
      c.fillStyle = '#ffd700';
      c.beginPath();
      c.moveTo(this.x - raio * 0.7, y - raio - 2);
      c.lineTo(this.x - raio * 0.7, y - raio - 12);
      c.lineTo(this.x - raio * 0.3, y - raio - 5);
      c.lineTo(this.x, y - raio - 14);
      c.lineTo(this.x + raio * 0.3, y - raio - 5);
      c.lineTo(this.x + raio * 0.7, y - raio - 12);
      c.lineTo(this.x + raio * 0.7, y - raio - 2);
      c.closePath(); c.fill();
    }
    // barra de vida (acima do sprite, quando houver)
    if (this.hp < this.hpMax) {
      const w = Math.max(24, (tamW || raio * 2) * 0.8), frac = Math.max(0, this.hp / this.hpMax);
      const yBarra = topoSprite !== null ? topoSprite - 8 : y - raio - (this.def.chefe ? 22 : 10);
      c.fillStyle = 'rgba(0,0,0,0.6)';
      c.fillRect(this.x - w / 2, yBarra, w, 4);
      c.fillStyle = frac > 0.5 ? '#2ecc71' : frac > 0.25 ? '#f39c12' : '#e74c3c';
      c.fillRect(this.x - w / 2, yBarra, w * frac, 4);
    }
  }
}

// ---------------------------------------------------------- Trabalhador
export class Trabalhador {
  constructor(site, construcao, abrigado = false) {
    this.id = proximoId++;
    this.site = site;
    this.construcao = construcao;
    this.rota = site.rota;                          // sítio → castelo
    this.rotaInv = [...site.rota].reverse();        // castelo → sítio
    this.carregando = false;
    if (abrigado) {
      this.estado = 'abrigado';
      this.x = CASTELO.x; this.y = CASTELO.y;
    } else {
      this.estado = 'coletando';
      this.tColeta = TRABALHADOR.tempoColeta + Math.random() * 0.8;
      this.x = site.x; this.y = site.y;
    }
  }

  exposto() { return !this.remover && this.estado !== 'abrigado'; }

  update(dt, state) {
    // espera escalonada (evita todos saírem juntos e sobrepor os sprites)
    if (this.tEspera > 0) { this.tEspera -= dt; return; }
    const v = TRABALHADOR.vel * (this.estado === 'recuando' ? TRABALHADOR.velRecuo : 1);
    switch (this.estado) {
      case 'coletando':
        this.tColeta -= dt;
        if (this.tColeta <= 0) {
          this.carregando = true;
          this.seg = new SeguidorRota(this.rota);
          this.estado = 'entregando';
        }
        break;
      case 'entregando':
      case 'recuando':
        this.seg.avancar(v * dt);
        this.x = this.seg.x; this.y = this.seg.y;
        if (this.seg.fim) {
          if (this.carregando) this.entregar(state);
          if (this.estado === 'recuando' || state.recuados) {
            this.estado = 'abrigado';
          } else {
            this.seg = new SeguidorRota(this.rotaInv);
            this.estado = 'voltando';
          }
        }
        break;
      case 'voltando':
        this.seg.avancar(v * dt);
        this.x = this.seg.x; this.y = this.seg.y;
        if (this.seg.fim) {
          this.estado = 'coletando';
          // variação leve evita que os ciclos sincronizem e os sprites se sobreponham
          this.tColeta = TRABALHADOR.tempoColeta + Math.random() * 0.8;
        }
        break;
      case 'abrigado':
        break;
    }
  }

  entregar(state) {
    const def = ECONOMIA[this.construcao.tipo];
    state[def.recurso] += def.porViagem;
    const ouro = def.recurso === 'ouro';
    efeitoTexto(state, CASTELO.x + 30, CASTELO.y - 30, `+${def.porViagem}`, ouro ? '#ffd166' : '#c98d4b', ouro ? 'icone_ouro' : 'icone_madeira');
    tocar(ouro ? 'moeda' : 'madeira', { volume: 0.4 });
    this.carregando = false;
  }

  recuar() {
    if (this.estado === 'abrigado' || this.estado === 'recuando') return;
    if (this.estado === 'coletando') {
      this.seg = new SeguidorRota(this.rota);
    } else if (this.estado === 'voltando') {
      // volta pelo caminho que já percorreu, em direção ao castelo
      const volta = [[this.x, this.y]];
      for (let j = this.seg.i; j >= 0; j--) volta.push(this.rotaInv[j]);
      this.seg = new SeguidorRota(volta);
    }
    // se estava 'entregando', mantém o seg atual (já vai ao castelo)
    this.estado = 'recuando';
  }

  // atraso: segundos de espera antes de sair (saída em fila, um por vez)
  retomar(atraso = 0) {
    this.tEspera = atraso;
    if (this.estado === 'abrigado') {
      this.carregando = false;
      this.seg = new SeguidorRota(this.rotaInv);
      this.estado = 'voltando';
    } else if (this.estado === 'recuando') {
      if (this.carregando) {
        // com carga: termina a viagem, entrega e retoma o ciclo sozinho
        this.estado = 'entregando';
      } else {
        // sem carga: dá meia-volta imediata rumo ao sítio pelo caminho conhecido
        const i = indiceSegProximo(this.rota, this.x, this.y);
        const caminho = [[this.x, this.y]];
        for (let j = i; j >= 0; j--) caminho.push(this.rota[j]);
        this.seg = new SeguidorRota(caminho);
        this.estado = 'voltando';
      }
    }
  }

  morrer(state) {
    this.remover = true;
    this.construcao.agendarRespawn();
    state.efeitos.push(new Efeito({ tipo: 'explosao', x: this.x, y: this.y, r: 14, t: 0.3 }));
    efeitoTexto(state, this.x, this.y - 16, 'Trabalhador perdido!', '#ff6b6b');
  }

  desenhar(c) {
    if (this.estado === 'abrigado') return;
    // sombra
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath(); c.ellipse(this.x, this.y + 7, 7, 3, 0, 0, 7); c.fill();
    if (!desenharAncoradoBase(c, 'trabalhador', this.x, this.y + 8, 22)) {
      // fallback procedural
      c.fillStyle = '#3867d6';
      c.beginPath(); c.arc(this.x, this.y, 5.5, 0, 7); c.fill();
      c.fillStyle = '#f7b731';
      c.beginPath(); c.arc(this.x, this.y - 3, 4.5, Math.PI, 0); c.fill();
    }
    // saco de recurso quando carregado
    if (this.carregando) {
      c.fillStyle = '#8a5a2b';
      c.beginPath(); c.arc(this.x + 8, this.y - 4, 4.5, 0, 7); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1;
      c.stroke();
    }
  }
}

// ---------------------------------------------------------- Construção (economia)
export class Construcao {
  constructor(site, state) {
    this.site = site;
    this.tipo = site.tipo;
    this.def = ECONOMIA[site.tipo];
    this.filaRespawn = [];
    for (let i = 0; i < this.def.trabalhadores; i++) {
      state.trabalhadores.push(new Trabalhador(site, this, state.recuados));
    }
  }
  agendarRespawn() { this.filaRespawn.push(TRABALHADOR.respawn); }
  contarTrabalhadores(state) {
    return state.trabalhadores.filter(t => t.construcao === this && !t.remover).length + this.filaRespawn.length;
  }
  contratar(state) {
    state.trabalhadores.push(new Trabalhador(this.site, this, state.recuados));
    efeitoTexto(state, this.site.x, this.site.y - 24, 'Trabalhador contratado!', '#a6f77b');
  }
  update(dt, state) {
    for (let i = this.filaRespawn.length - 1; i >= 0; i--) {
      this.filaRespawn[i] -= dt;
      if (this.filaRespawn[i] <= 0) {
        this.filaRespawn.splice(i, 1);
        state.trabalhadores.push(new Trabalhador(this.site, this, state.recuados));
        efeitoTexto(state, this.site.x, this.site.y - 24, 'Novo trabalhador', '#a6f77b');
      }
    }
  }
  desenhar(c) {
    const { x, y } = this.site;
    // sem sombra desenhada: a arte da construção já tem a própria base
    if (desenharAncoradoBase(c, this.tipo, x, y + 18, 76)) return;
    // fallback procedural
    if (this.tipo === 'mina') {
      c.fillStyle = '#5b5b54';
      c.beginPath(); c.arc(x, y, 16, Math.PI, 0); c.fill();
      c.fillRect(x - 16, y, 32, 6);
      c.fillStyle = '#241f1a';
      c.beginPath(); c.arc(x, y + 2, 9, Math.PI, 0); c.fill();
      c.fillRect(x - 9, y + 2, 18, 4);
      c.fillStyle = '#f5c542';
      c.beginPath(); c.arc(x - 10, y - 4, 2.5, 0, 7); c.fill();
      c.beginPath(); c.arc(x + 10, y - 6, 2.5, 0, 7); c.fill();
    } else {
      c.fillStyle = '#8a5a2b';
      c.fillRect(x - 14, y - 8, 28, 16);
      c.fillStyle = '#2e5fa3';
      c.beginPath(); c.moveTo(x - 18, y - 8); c.lineTo(x, y - 22); c.lineTo(x + 18, y - 8); c.closePath(); c.fill();
      c.fillStyle = '#6d4c2c'; // toras
      c.fillRect(x - 16, y + 8, 12, 5);
      c.fillRect(x + 4, y + 8, 12, 5);
    }
  }
}

// ---------------------------------------------------------- Torre
export class Torre {
  constructor(spot, tipo) {
    this.spot = spot;
    this.x = spot.x; this.y = spot.y;
    this.tipo = tipo;
    this.base = TORRES[tipo];
    this.nivel = 1;
    this.cooldown = 0;
    this.calcularStats();
  }
  calcularStats() {
    const n = this.nivel - 1;
    this.dano = Math.round(this.base.dano * Math.pow(UPGRADE.multDano, n));
    this.alcance = Math.round(this.base.alcance * Math.pow(UPGRADE.multAlcance, n));
    this.cadencia = this.base.cadencia * Math.pow(UPGRADE.multCadencia, n);
  }
  custoUpgrade() { return UPGRADE.custo(this.base, this.nivel); }
  update(dt, state) {
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    let alvo = null, melhor = Infinity;
    for (const e of state.inimigos) {
      if (e.remover || e.morto) continue;
      if (e.def.voador && !this.base.antiAereo) continue;
      if (dist(this, e) > this.alcance) continue;
      const d = e.distCastelo();
      if (d < melhor) { melhor = d; alvo = e; }
    }
    if (alvo) {
      state.projeteis.push(new Projetil(this, alvo));
      this.cooldown = this.cadencia;
      const volTiro = { arqueiro: 0.3, canhao: 0.5, magica: 0.35, gelo: 0.35 };
      tocar(`tiro_${this.tipo}`, { volume: volTiro[this.tipo] ?? 0.4 });
    }
  }
  desenhar(c, state = null) {
    // sprite do nível atual (cresce um pouco a cada nível); cai pro nível 2 se faltar
    // (sem sombra desenhada: a arte da torre já tem a própria base)
    const largura = [56, 62, 70, 80][this.nivel - 1] || 62;

    // fica translúcida quando alguém passa atrás dela (não esconder monstros na estrada)
    let translucida = false;
    if (state) {
      const base = this.y + 16, topo = base - largura * 1.5, meiaLarg = largura * 0.62;
      const atras = e => !e.remover && !e.morto && e.y < base && e.y > topo && Math.abs(e.x - this.x) < meiaLarg;
      translucida = state.inimigos.some(atras) || state.trabalhadores.some(e => e.estado !== 'abrigado' && atras(e));
    }
    if (translucida) c.globalAlpha = 0.55;

    if (!desenharAncoradoBase(c, `${this.tipo}_${this.nivel}`, this.x, this.y + 16, largura) &&
        !desenharAncoradoBase(c, `${this.tipo}_2`, this.x, this.y + 16, largura)) {
      // fallback procedural (usado só se o sprite não carregar)
      c.fillStyle = '#77776f';
      c.beginPath(); c.arc(this.x, this.y + 2, 15, 0, 7); c.fill();
      c.fillStyle = '#8b8b83';
      c.beginPath(); c.arc(this.x, this.y, 13, 0, 7); c.fill();
      c.fillStyle = this.base.cor;
      if (this.tipo === 'arqueiro') {
        c.beginPath(); c.arc(this.x, this.y - 4, 9, 0, 7); c.fill();
        c.fillStyle = '#5d4028';
        c.fillRect(this.x - 2, this.y - 16, 4, 10);
      } else if (this.tipo === 'canhao') {
        c.beginPath(); c.arc(this.x, this.y - 2, 9, 0, 7); c.fill();
        c.fillStyle = '#2f3640';
        c.fillRect(this.x - 3, this.y - 16, 6, 12);
      } else {
        c.beginPath(); c.arc(this.x, this.y - 2, 8, 0, 7); c.fill();
        c.fillStyle = '#c56cf0';
        c.beginPath();
        c.moveTo(this.x, this.y - 20); c.lineTo(this.x + 6, this.y - 10);
        c.lineTo(this.x, this.y - 2); c.lineTo(this.x - 6, this.y - 10);
        c.closePath(); c.fill();
      }
    }
    // pips de nível
    c.fillStyle = '#ffd700';
    for (let i = 0; i < this.nivel; i++) {
      c.beginPath(); c.arc(this.x - 8 + i * 8, this.y + 22, 2.5, 0, 7); c.fill();
    }
    if (translucida) c.globalAlpha = 1;
  }
}

// ---------------------------------------------------------- Projétil
export class Projetil {
  constructor(torre, alvo) {
    this.x = torre.x; this.y = torre.y - 12;
    this.alvo = alvo;
    this.tx = alvo.x; this.ty = alvo.y;
    this.dano = torre.dano;
    this.tipoDano = torre.base.tipoDano;
    this.area = torre.base.area || 0;
    this.vel = torre.base.velProj;
    this.cor = torre.base.corProj;
    this.tipoTorre = torre.tipo;
    this.antiAereo = torre.base.antiAereo;
    this.slow = torre.base.slow || null;
  }
  update(dt, state) {
    if (!this.alvo.remover && !this.alvo.morto) { this.tx = this.alvo.x; this.ty = this.alvo.y; }
    const resto = moverPara(this, { x: this.tx, y: this.ty }, this.vel * dt);
    if (resto <= 0.5) {
      this.impacto(state);
      this.remover = true;
    }
  }
  impacto(state) {
    const somImpacto = { arqueiro: 'impacto_flecha', canhao: 'impacto_canhao', magica: 'impacto_magica', gelo: 'impacto_magica' };
    if (this.area) {
      const cor = this.tipoTorre === 'gelo' ? 'gelo' : null;
      state.efeitos.push(new Efeito({ tipo: 'explosao', x: this.x, y: this.y, r: this.area, t: 0.35, variante: cor }));
      tocar(somImpacto[this.tipoTorre], { volume: 0.4 });
      for (const e of state.inimigos) {
        if (e.remover || e.morto) continue;
        // canhão não atinge voadores; gelo (antiaéreo) atinge
        if (e.def.voador && !this.antiAereo) continue;
        if (dist(this, e) <= this.area) {
          e.takeDano(this.dano, this.tipoDano, state);
          if (this.slow) e.aplicarSlow(this.slow.fator, this.slow.dur);
        }
      }
    } else if (!this.alvo.remover && !this.alvo.morto && dist(this, this.alvo) < 16) {
      this.alvo.takeDano(this.dano, this.tipoDano, state);
      if (this.slow) this.alvo.aplicarSlow(this.slow.fator, this.slow.dur);
      state.efeitos.push(new Efeito({ tipo: 'faisca', x: this.x, y: this.y, cor: this.cor, t: 0.2 }));
      tocar(somImpacto[this.tipoTorre], { volume: 0.3 });
    }
  }
  desenhar(c) {
    c.fillStyle = this.cor;
    c.beginPath(); c.arc(this.x, this.y, this.area ? 5 : 3.5, 0, 7); c.fill();
  }
}
