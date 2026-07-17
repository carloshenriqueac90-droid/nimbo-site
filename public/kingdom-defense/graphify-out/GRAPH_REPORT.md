# Graph Report - C:/Claude/kingdom-defense  (2026-07-14)

## Corpus Check
- Large corpus: 96 files · ~671,723 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 191 nodes · 465 edges · 10 communities (8 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Módulos JS
- Módulos JS
- Módulos JS
- Módulos JS
- Módulos JS
- Módulos JS
- Módulos JS
- Módulos JS
- Módulos JS
- Módulos JS

## God Nodes (most connected - your core abstractions)
1. `menuLab()` - 19 edges
2. `tocar()` - 18 edges
3. `iniciar()` - 17 edges
4. `Inimigo` - 14 edges
5. `efeitoTexto()` - 12 edges
6. `desenharTerreno()` - 12 edges
7. `Torre` - 11 edges
8. `menuContratar()` - 10 edges
9. `desenharAncoradoBase()` - 10 edges
10. `dist()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `fimDeOnda()` --calls--> `efeitoTexto()`  [EXTRACTED]
  js/main.js → js/entities.js
- `menuLab()` --calls--> `efeitoTexto()`  [EXTRACTED]
  js/main.js → js/entities.js
- `menuTorre()` --calls--> `efeitoTexto()`  [EXTRACTED]
  js/main.js → js/entities.js
- `iniciar()` --references--> `Torre`  [EXTRACTED]
  js/main.js → js/entities.js
- `iniciarOnda()` --calls--> `gerarOndaCaos()`  [EXTRACTED]
  js/main.js → js/waves.js

## Import Cycles
- None detected.

## Communities (10 total, 2 thin omitted)

### Community 0 - "Módulos JS"
Cohesion: 0.14
Nodes (33): $(), anterior, canvas, ctx, derrota(), fecharTudo(), fimDeOnda(), iconeHTML() (+25 more)

### Community 1 - "Módulos JS"
Cohesion: 0.09
Nodes (15): Construcao, Efeito, desenharLab(), desenharAlcance(), desenharCamadaCastelo(), desenharMarcadores(), draw(), animacao() (+7 more)

### Community 2 - "Módulos JS"
Cohesion: 0.16
Nodes (6): efeitoTexto(), Inimigo, Projetil, Torre, dist(), moverPara()

### Community 3 - "Módulos JS"
Cohesion: 0.16
Nodes (13): ECONOMIA, INIMIGOS, JOGO, LAB, TORRES, TRABALHADOR, UPGRADE, LADO_ANIM (+5 more)

### Community 4 - "Módulos JS"
Cohesion: 0.20
Nodes (18): comecarPartida(), iniciar(), telaCaos(), telaInicial(), telaModos(), alternarMudo(), aplicarGanho(), buffers (+10 more)

### Community 5 - "Módulos JS"
Cohesion: 0.17
Nodes (18): arbusto(), arvore(), CAOS_IDX, castelo(), centroRio(), desenharTerreno(), distSeg(), estrada() (+10 more)

### Community 6 - "Módulos JS"
Cohesion: 0.22
Nodes (13): custoDano(), custoEspecial(), custoVel(), especiaisLiberados(), especialAtivo(), lab, liberarEspecial(), melhorarDano() (+5 more)

### Community 7 - "Módulos JS"
Cohesion: 0.14
Nodes (11): CAOS, gerarOndaCaos(), ONDAS_MAPA1, ONDAS_MAPA2, ONDAS_MAPA3, ONDAS_POR_MAPA, POOL_CAOS_INICIAL, POOL_CAOS_MEDIO (+3 more)

## Knowledge Gaps
- **22 isolated node(s):** `TAMANHO_SPRITE_INIMIGO`, `LADO_SPRITE_INIMIGO`, `LADO_ANIM`, `state`, `canvas` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Inimigo` connect `Módulos JS` to `Módulos JS`, `Módulos JS`, `Módulos JS`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `Trabalhador` connect `Módulos JS` to `Módulos JS`, `Módulos JS`, `Módulos JS`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `tocar()` connect `Módulos JS` to `Módulos JS`, `Módulos JS`, `Módulos JS`, `Módulos JS`, `Módulos JS`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `iniciar()` (e.g. with `iniciarOnda()` and `loop()`) actually correct?**
  _`iniciar()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `TAMANHO_SPRITE_INIMIGO`, `LADO_SPRITE_INIMIGO`, `LADO_ANIM` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Módulos JS` be split into smaller, more focused modules?**
  _Cohesion score 0.1379800853485064 - nodes in this community are weakly interconnected._
- **Should `Módulos JS` be split into smaller, more focused modules?**
  _Cohesion score 0.0873015873015873 - nodes in this community are weakly interconnected._