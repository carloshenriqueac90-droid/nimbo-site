// i18n/pt.js — pacote de idioma PORTUGUÊS (Termo Survival, nimbo.games/termo-survival).
//
// REGRAS DESTE ARQUIVO (valem também para en.js e qualquer idioma futuro):
//
// 1. O literal abaixo é JSON ESTRITO (chaves entre aspas, sem comentários internos, sem vírgula
//    final, sem funções). Isso é intencional: o `publica.ps1` extrai esse literal com regex e o
//    lê com ConvertFrom-Json para gerar, no build, o `manifest.json` e as meta tags de <head>
//    (crawlers de rede social NÃO executam JS — OG tag precisa sair estática no HTML publicado).
//    Se este literal deixar de ser JSON válido, o build quebra.
// 2. `config` = comportamento por idioma (fuso do desafio diário, normalização de acentos, listas
//    de palavras, chaves de localStorage, metadados). `ui` = todas as strings de interface.
// 3. Placeholders no formato {nome} — interpolados por fmt() no i18n.js. `{moeda}` (só em strings
//    HTML) vira o SVG do ícone de moeda.
// 4. Chaves de localStorage: os valores de `config.chaves` do PT são os que estão EM PRODUÇÃO
//    desde o soft launch (13/07/2026). NÃO MUDE — quebraria o progresso de quem já joga.
//    Cada idioma PRECISA de chaves próprias: os jogos são servidos na mesma origin
//    (nimbo.games/termo-survival e nimbo.games/word-survivor), logo COMPARTILHAM o localStorage.
window.NIMBO_I18N = window.NIMBO_I18N || {};
window.NIMBO_I18N.pt = {
  "config": {
    "lang": "pt",
    "htmlLang": "pt-BR",
    "slug": "termo-survival",
    "timeZone": "America/Sao_Paulo",
    "normalizaAcentos": true,
    "dataCurta": "d/m",
    "listas": {
      "validas": "palavras.js",
      "respostas": "respostas.js"
    },
    "chaves": {
      "runDaily": "termo.sobrevivencia.run.daily",
      "runEndless": "termo.sobrevivencia.run.endless",
      "travado": "termo.sobrevivencia.travado",
      "stats": "termo.sobrevivencia.stats",
      "contraste": "termo.contraste",
      "recordeAntigo": "termo.sobrevivencia.recorde"
    },
    "analytics": {
      "game": "termo-survival"
    },
    "link": "nimbo.games/termo-survival?s=sh",
    "meta": {
      "title": "Termo Survival",
      "description": "Roguelike de palavras: adivinhe uma palavra após a outra com só 3 vidas, ganhe moedas para power-ups e veja até onde a dificuldade te leva. Grátis, no navegador.",
      "ogTitle": "Termo Survival 🔥",
      "ogDescription": "Adivinhe palavras de 5 letras, uma rodada após a outra, com só 3 vidas. Ganhe moedas, compre power-ups e sobreviva o máximo que aguentar. Grátis, no navegador.",
      "ogImage": "https://nimbo.games/termo-survival/og-image.png",
      "ogUrl": "https://nimbo.games/termo-survival/"
    },
    "manifest": {
      "name": "Termo Survival",
      "short_name": "Termo Survival",
      "description": "Roguelike de palavras: 3 vidas, rodadas sem fim, power-ups. Quantas rodadas você aguenta?",
      "lang": "pt-BR"
    }
  },

  "ui": {
    "logo": {
      "palavra": "TERMO",
      "certo": 0,
      "lugar": 3,
      "sub": "SURVIVAL",
      "aria": "Termo",
      "miniForte": "TERMO",
      "miniResto": "SURVIVAL"
    },
    "tagline": "Palavras sem fim. 3 vidas.<br>Quantas rodadas você aguenta?",
    "stats": {
      "recorde": "🏆 recorde ranqueado",
      "jogos": "jogos",
      "rodadas": "rodadas vencidas"
    },
    "inicio": {
      "daily": "Corrida do Dia 🔥",
      "dailyContinuar": "▶ Corrida do Dia — Rodada {n}",
      "dailyLegenda": "<span class=\"selo selo-ranqueado\">🏆 Ranqueada</span> mesma pra todos, todo dia",
      "endless": "Modo Livre ♾️",
      "endlessContinuar": "▶ Modo Livre — Rodada {n}",
      "endlessLegenda": "<span class=\"selo selo-treino\">Treino</span> não conta pro ranking",
      "como": "Como jogar",
      "travadoTitulo": "🌘 Corrida do Dia esgotada",
      "travadoResultado": "Você venceu {n} {plural} hoje.",
      "travadoResultadoZero": "Hoje as palavras venceram logo na rodada 1.",
      "travadoContagem": "Nova corrida em <strong id=\"contagem-amanha\">--:--:--</strong>"
    },
    "header": {
      "menu": "Voltar ao menu",
      "ajuda": "Como jogar"
    },
    "hud": {
      "vidas": "Vidas",
      "moedas": "Moedas",
      "rodada": "Rodada {n}"
    },
    "niveis": {
      "facil": "fácil",
      "medio": "médio",
      "dificil": "difícil"
    },
    "aria": {
      "tabuleiro": "Tabuleiro do jogo",
      "dicas": "Letras reveladas",
      "powerups": "Power-ups",
      "teclado": "Teclado virtual"
    },
    "powerups": {
      "revelar": "Revelar uma letra na posição certa",
      "eliminar": "Eliminar 3 letras que não estão na palavra",
      "extra": "Tentativa extra (máx. 2 por rodada)",
      "vida": "Vida extra (máx. 5)"
    },
    "teclado": {
      "enter": "enter",
      "apagar": "⌫"
    },
    "ordinais": ["1ª", "2ª", "3ª", "4ª", "5ª"],
    "plurais": {
      "rodada": ["rodada", "rodadas"]
    },
    "grade": {
      "certo": "🟩",
      "lugar": "🟨",
      "errado": "⬛",
      "certoContraste": "🟧",
      "lugarContraste": "🟦"
    },
    "dicaChip": "{ordinal}: {letra}",
    "toast": {
      "letrasInsuficientes": "Letras insuficientes",
      "palavraInvalida": "Essa palavra não é aceita",
      "moedasInsuficientes": "Moedas insuficientes",
      "nadaRevelar": "Nada para revelar",
      "revelada": "A {ordinal} letra é “{letra}”",
      "nadaEliminar": "Nada para eliminar",
      "eliminadas": "Eliminadas: {letras}",
      "limiteExtras": "Limite de tentativas extras",
      "extraAdicionada": "Tentativa extra adicionada",
      "vidasMax": "Vidas no máximo",
      "vidaExtra": "Vida extra! {coracoes}",
      "copiado": "Resultado copiado!",
      "erroCopiar": "Não foi possível copiar"
    },
    "elogios": ["Genial!", "Fantástico!", "Impressionante!", "Ótimo!", "Muito bem!", "Ufa!", "Na trave!", "Por pouco!"],
    "botoes": {
      "proximaRodada": "Próxima rodada",
      "treinarDeNovo": "Treinar de novo",
      "comecarRodada1": "Começar rodada 1",
      "compartilhar": "Compartilhar 🔥",
      "menu": "Menu"
    },
    "modal": {
      "vitoriaTitulo": "Rodada {n} vencida! 🎉",
      "vitoriaTexto": "+{ganho} moedas (total: {total}). A próxima tem {tentativas} tentativas.{aviso}",
      "avisoMedio": "Agora vêm as palavras médias! 🔶",
      "avisoDificil": "Daqui em diante, só palavras difíceis! 🔥",
      "vidaPerdidaTitulo": "Perdeu uma vida 💔",
      "vidaPerdidaTexto": "A palavra era “{palavra}”. Vidas restantes: {coracoes}",
      "fimDailyRecorde": "Novo recorde ranqueado! 🏆",
      "fimDailyTitulo": "Fim da Corrida do Dia 💀",
      "fimDailyTexto": "A palavra era “{palavra}”. Você venceu {n} {plural} na Corrida do Dia 🏆 (ranqueada). Recorde ranqueado: {recorde}. Nova tentativa à meia-noite (horário de Brasília). O Modo Livre (treino) continua liberado.",
      "fimDailyTextoZero": "A palavra era “{palavra}”. As palavras venceram logo na rodada 1 — acontece, e hoje elas são as mesmas pra todo mundo. Recorde ranqueado: {recorde}. Nova tentativa à meia-noite (horário de Brasília). O Modo Livre (treino) continua liberado.",
      "fimTreinoRecorde": "Novo melhor no treino! 🎯",
      "fimTreinoTitulo": "Fim do treino 💪",
      "fimTreinoTexto": "A palavra era “{palavra}”. No treino você chegou a {n} {plural}. Seu melhor no treino: {recorde} (não conta pro ranking). O ranking é só na Corrida do Dia 🏆.",
      "fimTreinoTextoZero": "A palavra era “{palavra}”. Dessa vez as palavras venceram logo na rodada 1 — o treino existe pra isso. Seu melhor no treino: {recorde} (não conta pro ranking). O ranking é só na Corrida do Dia 🏆.",
      "viradaDiaTitulo": "Virou o dia! 🌅",
      "viradaDiaTexto": "A Corrida do Dia de ontem terminou (meia-noite de São Paulo). Vamos começar a corrida de hoje, na rodada 1!"
    },
    "compartilhar": {
      "gradeCabecalho": "Rodada {n} ({nivel}) — foi aqui que eu caí:",
      "daily": "🔥 Termo Survival — Corrida do Dia {data}\nSobrevivi a {n} {plural}! Recorde ranqueado: {recorde} 🏆\n{grade}\nMesmas palavras pra todo mundo hoje. Tenta bater:\n{link}",
      "dailyZero": "🔥 Termo Survival — Corrida do Dia {data}\nAs palavras me venceram logo na rodada 1 😅 Recorde ranqueado: {recorde} 🏆\n{grade}\nMesmas palavras pra todo mundo hoje. Tenta bater:\n{link}",
      "endless": "🔥 Termo Survival — Treino\nCheguei a {n} {plural} no treino 💪\n{grade}\nSua vez:\n{link}",
      "endlessZero": "🔥 Termo Survival — Treino\nDessa vez as palavras me venceram logo na rodada 1 💪\n{grade}\nSua vez:\n{link}"
    },
    "ajuda": {
      "titulo": "Como jogar",
      "contraste": "Modo de alto contraste (cores para daltônicos)",
      "corpo": [
        "<p>Adivinhe palavras de 5 letras, uma rodada após a outra, com <strong>3 vidas</strong>. Errou a palavra da rodada? Perde uma vida. Perdeu todas? Fim de jogo.</p>",
        "<div class=\"exemplo\">",
        "  <div class=\"linha-exemplo\">",
        "    <span class=\"celula certo\">T</span><span class=\"celula\">U</span><span class=\"celula\">R</span><span class=\"celula\">M</span><span class=\"celula\">A</span>",
        "  </div>",
        "  <p>A letra <strong>T</strong> está na palavra, na posição correta.</p>",
        "</div>",
        "<div class=\"exemplo\">",
        "  <div class=\"linha-exemplo\">",
        "    <span class=\"celula\">V</span><span class=\"celula lugar\">I</span><span class=\"celula\">O</span><span class=\"celula\">L</span><span class=\"celula\">A</span>",
        "  </div>",
        "  <p>A letra <strong>I</strong> está na palavra, mas em outra posição.</p>",
        "</div>",
        "<div class=\"exemplo\">",
        "  <div class=\"linha-exemplo\">",
        "    <span class=\"celula\">P</span><span class=\"celula\">U</span><span class=\"celula errado\">L</span><span class=\"celula\">S</span><span class=\"celula\">O</span>",
        "  </div>",
        "  <p>A letra <strong>L</strong> não está na palavra.</p>",
        "</div>",
        "<p>Vencer uma rodada rende <strong>moedas {moeda}</strong> — 2 + 1 por tentativa não usada. Gaste nos power-ups a qualquer momento:</p>",
        "<ul class=\"lista-powerups\">",
        "  <li>💡 <strong>Revelar letra</strong> (6) — mostra uma letra na posição certa</li>",
        "  <li>🚫 <strong>Eliminar letras</strong> (4) — apaga 3 letras do teclado</li>",
        "  <li>➕ <strong>Tentativa extra</strong> (5) — mais uma linha, máx. 2 por rodada</li>",
        "  <li>❤️ <strong>Vida extra</strong> (12) — máx. 5 vidas</li>",
        "</ul>",
        "<p>A dificuldade sobe em degraus: rodadas <strong>1–5</strong> têm palavras fáceis e 6 tentativas, <strong>6–10</strong> têm palavras médias e 5 tentativas, e da <strong>11ª</strong> em diante são palavras difíceis com só 4 tentativas. Os acentos são preenchidos automaticamente.</p>",
        "<p>Tem dois jeitos de jogar: a <strong>Corrida do Dia 🔥</strong> tem as mesmas palavras pra todo mundo hoje e só permite <strong>uma tentativa por dia</strong> — perdeu as 3 vidas, espera até a <strong>meia-noite (horário de Brasília)</strong> pra tentar de novo. O <strong>Modo Livre ♾️</strong> tem palavras sorteadas e corridas <strong>ilimitadas</strong>: perdeu, começa outra na hora. Os dois dá pra fechar e retomar de onde parou.</p>",
        "<p>A <strong>Corrida do Dia é a modalidade ranqueada</strong> 🏆: como o desafio é igual pra todo mundo, o resultado é comparável e é ele que forma o seu <strong>recorde ranqueado</strong>. O <strong>Modo Livre é treino</strong> — vale pra praticar e bater seu próprio \"melhor no treino\", mas <strong>não conta pro ranking</strong>.</p>"
      ]
    }
  }
};
