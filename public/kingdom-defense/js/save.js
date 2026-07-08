// Persistência simples em localStorage.
const CHAVE = 'kingdom-defense-save';

export function carregarSave() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || { melhorOnda: 0, vitorias: 0 };
  } catch {
    return { melhorOnda: 0, vitorias: 0 };
  }
}

export function gravarSave(dados) {
  try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch { /* storage cheio/bloqueado */ }
}
