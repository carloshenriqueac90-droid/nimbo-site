# Kingdom Defense — Arquitetura

## 1. Decisão de engine

**JavaScript puro (ES Modules) + Canvas 2D.** Sem build step, sem dependências.

| Critério (contrato Nimbo) | Godot/Unity Web | JS + Canvas |
|---|---|---|
| Build estático | Sim, mas 30–80MB | Sim, ~100KB |
| Caminhos relativos | Configuração frágil | Nativo |
| Mobile-first | Carregamento lento em 4G | Instantâneo |
| Publicar em `public/<jogo>/` | Precisa de headers especiais (SharedArrayBuffer) | Copiar a pasta |

O jogo roda direto de `public/kingdom-defense/index.html`. Nenhum bundler necessário.

## 2. Estrutura de pastas

```
kingdom-defense/
├── index.html          # Shell HTML + HUD (DOM)
├── css/style.css       # Layout mobile-first, HUD, menus, overlays
├── js/
│   ├── main.js         # Bootstrap, game loop, estado central, input, fases
│   ├── config.js       # DADOS DE BALANCEAMENTO (inimigos, torres, economia)
│   ├── map.js          # Geometria do mapa: rotas, estradas, plataformas, terreno
│   ├── entities.js     # Classes: Inimigo, Trabalhador, Torre, Projetil, Construcao, Efeito
│   ├── waves.js        # Definição das ondas + Spawner
│   ├── ui.js           # HUD, menus de contexto, toasts, overlays
│   ├── save.js         # Persistência (localStorage)
│   └── util.js         # Matemática: distância, seguidor de rota, movimento
├── ARQUITETURA.md      # Este arquivo
├── ASSETS.md           # Origem e licença de cada recurso visual
└── README.md           # Como rodar e publicar
```

## 3. Entidades

| Entidade | Responsabilidade | IA |
|---|---|---|
| `Inimigo` | HP, armadura, recompensa, dano ao castelo | Estratégia por tipo (ver §5) |
| `Trabalhador` | Ciclo coleta→entrega automático | Máquina de estados: coletando → entregando → voltando → (recuando/abrigado) |
| `Torre` | Alvo, disparo, upgrade (3 níveis) | Prioriza inimigo mais perto do castelo |
| `Projetil` | Voo teleguiado, dano (área p/ canhão) | — |
| `Construcao` | Mina/Madeireira: gera e repõe trabalhadores | Respawn de trabalhador morto em 15s |
| `Efeito` | Explosões, textos flutuantes | — |

## 4. Sistemas (todos desacoplados)

- **Defesa**: `waves.js` (spawn) + `Torre`/`Projetil` (combate). Dano físico sofre redução de armadura; mágico ignora.
- **Economia**: `Construcao` + `Trabalhador`. Trabalhadores usam **estradas comerciais próprias** (`SITES[].rota` em map.js), fisicamente separadas das rotas das waves.
- **Mecânica central**: monstros comuns **ignoram** trabalhadores. Só o tipo `cacador` (Lobo) abandona a rota e persegue trabalhadores expostos. Botões **Recuar / Retomar** controlam a exposição — recuar protege mas zera a produção.
- **Mapa**: 3 rotas de invasão (leste A, leste B, norte), rio com pontes, plataformas fixas de construção (não se constrói em qualquer lugar), 4 sítios de economia.
- **Progressão**: HP escala +15%/onda; onda 5 = mini-chefe (Golem), onda 10 = chefe (Rei Goblin, invoca goblins). Ondas 4 e 8 = especiais (lobos caçadores).
- **Save**: melhor onda + vitórias em `localStorage`, gravado ao fim de cada onda.

## 5. IA por tipo de inimigo

| Tipo | Comportamento |
|---|---|
| Goblin | Rápido, segue a rota |
| Orc | Armadura 20% |
| Esqueleto | Revive 1x com 50% HP |
| Lobo (caçador) | Sai da rota, persegue trabalhadores expostos; sem alvos → ataca o castelo |
| Ogro | Lento, armadura 40%, dano 3 ao castelo |
| Voador | Ignora rotas e obstáculos, voa direto ao castelo; canhão não o atinge |
| Golem (mini-chefe) | Armadura 50%, 1200 HP |
| Rei Goblin (chefe) | Invoca 2 goblins a cada 6s |

## 6. Pontos de extensão preparados (não implementados)

- **Novos inimigos/torres**: adicionar entrada em `config.js` — zero código novo para tipos que reusam IAs existentes; IA nova = um método em `Inimigo`.
- **Novos mapas/biomas**: `map.js` tem o registro `MAPAS[]` (terreno, rotas, sites, plataformas, castelo) — adicionar uma fase = adicionar uma entrada; o jogador escolhe na tela inicial (persistido em `localStorage['kd-mapa']`).
- **Novas ondas/campanha**: array `ONDAS` em `waves.js`.
- **Heróis, pesquisa, clima, dia/noite, eventos**: ganchos no loop central (`main.js` chama `update(dt, state)` de cada sistema — basta registrar um sistema novo).
- **Multiplayer coop**: estado do jogo já é um objeto único serializável (`state`).

## 7. Plano de desenvolvimento

1. ✅ Arquitetura e dados de balanceamento
2. ✅ Mapa (rotas, estradas comerciais, plataformas, terreno)
3. ✅ Defesa (torres, projéteis, waves, chefes)
4. ✅ Economia (construções, trabalhadores, recuar/retomar)
5. ✅ Lobos caçadores (a mecânica diferencial)
6. ✅ HUD, menus, save, telas de vitória/derrota
7. ✅ Modo Caos (mapa próprio, laboratório, especiais, ondas infinitas)
8. ⏭️ Balanceamento fino, sons, animações, arte final

## 8. Modo Caos (segundo modo de jogo)

A tela de entrada oferece **Modo Normal** (a campanha acima) e **Modo Caos**. O modo
é gravado em `localStorage['kd-modo']` e lido no load (como o mapa). `map.js` exporta
`MODO`; quando `'caos'`, força o mapa `MAPAS[].caos` e ignora a seleção normal.

- **Mapa** (`assets/caos.png`): 4 rotas de invasão a leste convergindo no castelo; 5
  estradas de coleta a oeste (3 minas + 2 madeireiras); clareira sudoeste com o
  Laboratório (`LAB_POS`).
- **Ondas infinitas** (`waves.js#gerarOndaCaos(n)`): geração procedural determinística
  — a cada bloco de 10 ondas entram mais grupos/monstros e mais HP; mini-chefe a cada 5,
  chefe a cada 10. `TOTAL_ONDAS = Infinity`; o HUD mostra `N ∞`.
- **Laboratório** (`lab.js` + config `LAB`): upgrades GLOBAIS de dano e velocidade para
  todas as torres, com custo exponencial por nível. Ao somar `LAB.nivelEspeciais` (30)
  níveis, liberam-se os **ataques especiais** (config `LAB.especiais`): desbloqueio único
  e caríssimo por tipo de torre. Torres com o especial ativo o disparam sozinhas no
  cooldown — arqueiro (múltiplas flechas), canhão (bola de fogo que queima), mágica
  (dano massivo), gelo (congela em área). Status novos no `Inimigo`: `congeladoT`,
  `queimaT`/`queimaDps`.
- **Sem caça**: os lobos não perseguem trabalhadores no caos (gate `MODO !== 'caos'` em
  `Inimigo.update`); os botões Recuar/Retomar ficam ocultos.
