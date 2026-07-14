// i18n/en.js — ENGLISH language pack (Word Survivor, nimbo.games/word-survivor).
//
// Copy revisada (localização, não tradução): pt e en são o MESMO jogo, mas o texto em inglês é
// escrito como inglês nativo casual (tom de grupo de amigos), não como espelho do português.
// Decisões de copy que valem para qualquer idioma futuro:
//   - Nome dos modos: "Daily Run" (ranqueada) x "Endless Run" (treino, ilimitada). O par Daily/Endless
//     comunica a diferença sozinho; "run" é o termo nativo de roguelike. Manter consistente em TODA
//     chave (botões, modais, share, tutorial).
//   - Recorde = "best" (inglês de placar), nunca "record".
//   - MARCA/JURÍDICO: a palavra "Wordle" (marca da NYT) NÃO pode aparecer em NENHUMA string visível,
//     nem nomes terminados em "-dle". Descrever como "5-letter word game" e pronto.
//   - Derrota é acolhedora, nunca sarcástica (Gate de Diversão).
//
// Mesmas regras do pt.js: o literal abaixo é JSON ESTRITO (o publica.ps1 o lê com ConvertFrom-Json
// para gerar manifest.json e as meta tags de <head>). Sem comentários internos, sem vírgula final.
//
// As listas `palavras_en.js` / `respostas_en.js` são geradas em separado e devem expor os MESMOS
// globais do pt: PALAVRAS_VALIDAS (normalizada -> exibição), RESPOSTAS_FACIL / RESPOSTAS_MEDIO /
// RESPOSTAS_DIFICIL / RESPOSTAS.
//
// localStorage: chaves PRÓPRIAS (prefixo word.survivor.*). Os dois jogos vivem na MESMA origin
// (nimbo.games), então compartilhariam o storage — reusar as chaves do PT corromperia as duas
// corridas. Não unifique.
window.NIMBO_I18N = window.NIMBO_I18N || {};
window.NIMBO_I18N.en = {
  "config": {
    "lang": "en",
    "htmlLang": "en",
    "slug": "word-survivor",
    "timeZone": "America/New_York",
    "normalizaAcentos": false,
    "dataCurta": "m/d",
    "listas": {
      "validas": "palavras_en.js",
      "respostas": "respostas_en.js"
    },
    "chaves": {
      "runDaily": "word.survivor.run.daily",
      "runEndless": "word.survivor.run.endless",
      "travado": "word.survivor.locked",
      "stats": "word.survivor.stats",
      "contraste": "word.survivor.contrast",
      "recordeAntigo": ""
    },
    "analytics": {
      "game": "word-survivor"
    },
    "link": "nimbo.games/word-survivor?s=sh",
    "meta": {
      "title": "Word Survivor",
      "description": "A word roguelike: guess 5-letter words round after round on just 3 lives, cash in coins for power-ups, and see how far you get before the words win. Free, in your browser.",
      "ogTitle": "Word Survivor 🔥",
      "ogDescription": "One 5-letter word, then another, then another. Three lives, coins to spend on power-ups, and words that keep getting meaner. How many rounds can you survive? Free, in your browser.",
      "ogImage": "https://nimbo.games/word-survivor/og-image.png",
      "ogUrl": "https://nimbo.games/word-survivor/"
    },
    "manifest": {
      "name": "Word Survivor",
      "short_name": "Word Survivor",
      "description": "A word roguelike: 3 lives, endless rounds, power-ups. How many rounds can you survive?",
      "lang": "en"
    }
  },

  "ui": {
    "logo": {
      "palavra": "WORD",
      "certo": 0,
      "lugar": 2,
      "sub": "SURVIVOR",
      "aria": "Word",
      "miniForte": "WORD",
      "miniResto": "SURVIVOR"
    },
    "tagline": "Word after word after word.<br>Three lives. How far do you get?",
    "stats": {
      "recorde": "🏆 ranked best",
      "jogos": "runs",
      "rodadas": "rounds won"
    },
    "inicio": {
      "daily": "Daily Run 🔥",
      "dailyContinuar": "▶ Daily Run — Round {n}",
      "dailyLegenda": "<span class=\"selo selo-ranqueado\">🏆 Ranked</span> same words for everyone, every day",
      "endless": "Endless Run ♾️",
      "endlessContinuar": "▶ Endless Run — Round {n}",
      "endlessLegenda": "<span class=\"selo selo-treino\">Practice</span> doesn't count toward the ranking",
      "como": "How to play",
      "travadoTitulo": "🌘 Today's run is done",
      "travadoResultado": "You survived {n} {plural} today.",
      "travadoResultadoZero": "The words got you in round 1 today.",
      "travadoContagem": "Fresh words in <strong id=\"contagem-amanha\">--:--:--</strong>"
    },
    "header": {
      "menu": "Back to menu",
      "ajuda": "How to play"
    },
    "hud": {
      "vidas": "Lives",
      "moedas": "Coins",
      "rodada": "Round {n}"
    },
    "niveis": {
      "facil": "easy",
      "medio": "medium",
      "dificil": "hard"
    },
    "aria": {
      "tabuleiro": "Game board",
      "dicas": "Revealed letters",
      "powerups": "Power-ups",
      "teclado": "On-screen keyboard"
    },
    "powerups": {
      "revelar": "Peek — reveals one letter right where it belongs",
      "eliminar": "Sweep — knocks 3 dead letters off the keyboard",
      "extra": "Extra Row — one more guess (max 2 per round)",
      "vida": "Extra Life — max 5"
    },
    "teclado": {
      "enter": "enter",
      "apagar": "⌫"
    },
    "ordinais": ["1st", "2nd", "3rd", "4th", "5th"],
    "plurais": {
      "rodada": ["round", "rounds"]
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
      "letrasInsuficientes": "Needs 5 letters",
      "palavraInvalida": "Not in the word list",
      "moedasInsuficientes": "Not enough coins",
      "nadaRevelar": "Nothing left to peek at",
      "revelada": "The {ordinal} letter is “{letra}”",
      "nadaEliminar": "Nothing left to sweep",
      "eliminadas": "Swept: {letras}",
      "limiteExtras": "No more extra rows this round",
      "extraAdicionada": "Extra row, coming up",
      "vidasMax": "Lives already maxed",
      "vidaExtra": "Extra life! {coracoes}",
      "copiado": "Copied — go paste it 🔥",
      "erroCopiar": "Couldn't copy that"
    },
    "elogios": ["Genius!", "Nailed it!", "Sharp!", "Nice one!", "Got there!", "Phew!", "Too close!", "By a hair!"],
    "botoes": {
      "proximaRodada": "Next round",
      "treinarDeNovo": "Run it again",
      "comecarRodada1": "Start round 1",
      "compartilhar": "Share your run 🔥",
      "menu": "Menu"
    },
    "modal": {
      "vitoriaTitulo": "Round {n} down! 🎉",
      "vitoriaTexto": "+{ganho} coins (total: {total}). Next round gives you {tentativas} guesses.{aviso}",
      "avisoMedio": "Medium words start now! 🔶",
      "avisoDificil": "From here on, hard words only! 🔥",
      "vidaPerdidaTitulo": "There goes a life 💔",
      "vidaPerdidaTexto": "The word was “{palavra}”. Lives left: {coracoes}",
      "fimDailyRecorde": "New ranked best! 🏆",
      "fimDailyTitulo": "Daily Run over 💀",
      "fimDailyTexto": "The word was “{palavra}”. You survived {n} {plural} in today's Daily Run 🏆 (ranked) — same words everyone else got. Ranked best: {recorde}. Fresh words at midnight (New York time). The Endless Run never closes, if you want another go right now.",
      "fimDailyTextoZero": "The word was “{palavra}”. The words got you in round 1 — it happens, and today everyone is facing the same ones. Ranked best: {recorde}. Fresh words at midnight (New York time). The Endless Run never closes, if you want another go right now.",
      "fimTreinoRecorde": "New endless best! 🎯",
      "fimTreinoTitulo": "Endless Run over 💪",
      "fimTreinoTexto": "The word was “{palavra}”. You made it to {n} {plural} this run. Your endless best: {recorde} (practice doesn't count toward the ranking — that's the Daily Run 🏆).",
      "fimTreinoTextoZero": "The word was “{palavra}”. The words got you in round 1 this time — that's what practice is for. Your endless best: {recorde} (practice doesn't count toward the ranking — that's the Daily Run 🏆).",
      "viradaDiaTitulo": "New day, new words! 🌅",
      "viradaDiaTexto": "Yesterday's Daily Run closed at midnight (New York time). Today's run is waiting — let's take it from round 1!"
    },
    "compartilhar": {
      "gradeCabecalho": "Round {n} ({nivel}) — this is where they got me:",
      "daily": "🔥 Word Survivor — Daily Run {data}\nSurvived {n} {plural}. Ranked best: {recorde} 🏆\n{grade}\nSame words for everyone today. Beat me:\n{link}",
      "dailyZero": "🔥 Word Survivor — Daily Run {data}\nThe words got me in round 1 😅 Ranked best: {recorde} 🏆\n{grade}\nSame words for everyone today. Beat me:\n{link}",
      "endless": "🔥 Word Survivor — Endless Run\nSurvived {n} {plural} before the words got me 💪\n{grade}\nYour turn:\n{link}",
      "endlessZero": "🔥 Word Survivor — Endless Run\nThe words got me in round 1 this time 💪\n{grade}\nYour turn:\n{link}"
    },
    "ajuda": {
      "titulo": "How to play",
      "contraste": "High contrast mode (colorblind-friendly colors)",
      "corpo": [
        "<p>Guess a 5-letter word. Then another. Then another — all on <strong>3 lives</strong>. Blow a round and it costs you a life. Lose all three and the run is over.</p>",
        "<div class=\"exemplo\">",
        "  <div class=\"linha-exemplo\">",
        "    <span class=\"celula certo\">T</span><span class=\"celula\">R</span><span class=\"celula\">A</span><span class=\"celula\">I</span><span class=\"celula\">N</span>",
        "  </div>",
        "  <p><strong>T</strong> is in the word, exactly where you put it.</p>",
        "</div>",
        "<div class=\"exemplo\">",
        "  <div class=\"linha-exemplo\">",
        "    <span class=\"celula\">P</span><span class=\"celula lugar\">I</span><span class=\"celula\">A</span><span class=\"celula\">N</span><span class=\"celula\">O</span>",
        "  </div>",
        "  <p><strong>I</strong> is in the word, but somewhere else.</p>",
        "</div>",
        "<div class=\"exemplo\">",
        "  <div class=\"linha-exemplo\">",
        "    <span class=\"celula\">P</span><span class=\"celula\">U</span><span class=\"celula errado\">L</span><span class=\"celula\">S</span><span class=\"celula\">E</span>",
        "  </div>",
        "  <p><strong>L</strong> isn't in the word at all.</p>",
        "</div>",
        "<p>Clear a round and you get paid in <strong>coins {moeda}</strong> — 2, plus 1 for every guess you didn't need. Spend them whenever you like:</p>",
        "<ul class=\"lista-powerups\">",
        "  <li>💡 <strong>Peek</strong> (6) — reveals one letter right where it belongs</li>",
        "  <li>🚫 <strong>Sweep</strong> (4) — knocks 3 dead letters off the keyboard</li>",
        "  <li>➕ <strong>Extra Row</strong> (5) — one more guess, max 2 per round</li>",
        "  <li>❤️ <strong>Extra Life</strong> (12) — up to 5 lives</li>",
        "</ul>",
        "<p>The words fight back as you go. Rounds <strong>1–5</strong> are easy words with 6 guesses. Rounds <strong>6–10</strong> get medium words and 5 guesses. From round <strong>11</strong> on, it's hard words with only 4 guesses — and it stays that way.</p>",
        "<p>Two ways to play. The <strong>Daily Run 🔥</strong> deals everyone the same words today, and you get <strong>one shot</strong> at it — burn your 3 lives and you're waiting until <strong>midnight (New York time)</strong>. The <strong>Endless Run ♾️</strong> picks words at random and never runs out: die, start over, immediately. Close the tab in either one and you'll pick up right where you left off.</p>",
        "<p>The <strong>Daily Run is the ranked one</strong> 🏆 — everybody faces the same words, so the score actually means something, and that's what sets your <strong>ranked best</strong>. The <strong>Endless Run is practice</strong>: great for sharpening up and chasing your own \"endless best\", but it <strong>doesn't count toward the ranking</strong>.</p>"
      ]
    }
  }
};
