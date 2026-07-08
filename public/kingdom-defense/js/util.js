// Matemática e movimento reutilizáveis.

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Move obj em direção a alvo até d px. Retorna distância restante.
export function moverPara(obj, alvo, d) {
  const dx = alvo.x - obj.x, dy = alvo.y - obj.y;
  const dd = Math.hypot(dx, dy);
  if (dd <= d) { obj.x = alvo.x; obj.y = alvo.y; return 0; }
  obj.x += (dx / dd) * d;
  obj.y += (dy / dd) * d;
  return dd - d;
}

// Distância de um ponto ao segmento AB.
export function distSegPonto(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - a[0]) * dx + (py - a[1]) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

// Índice do segmento de uma polilinha mais próximo do ponto (x, y).
export function indiceSegProximo(pontos, x, y) {
  let melhor = 0, md = Infinity;
  for (let i = 0; i < pontos.length - 1; i++) {
    const d = distSegPonto(x, y, pontos[i], pontos[i + 1]);
    if (d < md) { md = d; melhor = i; }
  }
  return melhor;
}

// Segue uma polilinha de pontos [[x,y],...] a uma velocidade dada.
export class SeguidorRota {
  constructor(pontos) {
    this.pontos = pontos;
    this.i = 0;
    this.x = pontos[0][0];
    this.y = pontos[0][1];
    this.fim = pontos.length < 2;
  }
  avancar(d) {
    while (d > 0 && this.i < this.pontos.length - 1) {
      const [bx, by] = this.pontos[this.i + 1];
      const seg = Math.hypot(bx - this.x, by - this.y);
      if (seg <= d) {
        this.x = bx; this.y = by; this.i++; d -= seg;
      } else {
        this.x += ((bx - this.x) / seg) * d;
        this.y += ((by - this.y) / seg) * d;
        d = 0;
      }
    }
    if (this.i >= this.pontos.length - 1) this.fim = true;
  }
  // Distância até o fim da rota (usada p/ priorizar alvo das torres).
  restante() {
    let r = 0, px = this.x, py = this.y;
    for (let j = this.i + 1; j < this.pontos.length; j++) {
      r += Math.hypot(this.pontos[j][0] - px, this.pontos[j][1] - py);
      px = this.pontos[j][0]; py = this.pontos[j][1];
    }
    return r;
  }
}
