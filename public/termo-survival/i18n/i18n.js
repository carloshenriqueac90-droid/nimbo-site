"use strict";

/**
 * i18n/i18n.js — camada de idioma (runtime).
 *
 * Um único código-fonte serve os dois jogos:
 *   pt → "Termo Survival"  (nimbo.games/termo-survival)
 *   en → "Word Survivor"   (nimbo.games/word-survivor)
 *
 * O idioma é escolhido NO CARREGAMENTO, não em runtime: o index.html publicado carrega UM único
 * pacote (`i18n/pt.js` OU `i18n/en.js`) e declara `<html data-lang="...">`. Não há detecção por
 * navegador nem seletor dentro do jogo (decisão do briefing). O `publica.ps1` cabeia isso por
 * pasta de destino; a fonte fica em pt (dev default), então servir a fonte crua = jogo em pt,
 * igual ao que está no ar.
 *
 * Expõe:
 *   I18N.cfg              → config do idioma (fuso, acentos, listas, chaves de localStorage, meta)
 *   I18N.t(caminho)       → string ("modal.vitoriaTitulo"); devolve o próprio caminho se faltar
 *   I18N.f(caminho, vars) → string com {placeholders} interpolados
 *   I18N.plural(n, chave) → forma singular/plural
 *   I18N.ordinal(i)       → "1ª" / "1st" (i é 0-based)
 *   I18N.iconeMoeda(px)   → SVG do ícone de moeda
 *
 * Aplica automaticamente ao DOM (no load, antes do script.js):
 *   data-i18n="chave"       → textContent
 *   data-i18n-html="chave"  → innerHTML (strings com marcação; {moeda} vira o SVG da moeda)
 *   data-i18n-attr="title:chave;aria-label:chave"  → atributos
 *   data-i18n-logo          → monta as peças do logo a partir de ui.logo
 * e preenche <title>/description/OG em runtime (em produção o publica.ps1 já os escreve
 * estáticos no HTML, porque crawlers de rede social não executam JS).
 */
(function () {
  var pacotes = window.NIMBO_I18N || {};
  var lang = document.documentElement.getAttribute("data-lang") || Object.keys(pacotes)[0];
  var pacote = pacotes[lang];

  if (!pacote) {
    throw new Error("i18n: pacote de idioma '" + lang + "' não carregado (veja as tags <script> do index.html)");
  }

  var ui = pacote.ui;
  var cfg = pacote.config;

  // ícone de moeda: SVG inline (disco dourado com brilho), não emoji — em alguns aparelhos
  // (ex.: Galaxy S24) a fonte do sistema não tem o glifo 🪙 (U+1FA99, emoji de 2019) e ele
  // renderiza como tofu. O disco usa var(--lugar), a mesma cor dos badges de preço dos
  // power-ups (.powerup .preco), então casa com o resto da UI em qualquer tema (inclusive
  // modo de alto contraste, que redefine --lugar).
  function iconeMoeda(px) {
    return '<svg class="icone-moeda" viewBox="0 0 20 20" width="' + px + '" height="' + px + '" aria-hidden="true" focusable="false">' +
      '<circle cx="10" cy="10" r="9" style="fill:var(--lugar)"></circle>' +
      '<circle cx="10" cy="10" r="8.1" fill="none" style="stroke:rgba(36,27,33,0.35)" stroke-width="1"></circle>' +
      '<ellipse cx="7.3" cy="6.8" rx="2.6" ry="1.5" style="fill:rgba(255,255,255,0.5)" transform="rotate(-25 7.3 6.8)"></ellipse>' +
      '</svg>';
  }

  function buscar(caminho) {
    var no = ui;
    var partes = caminho.split(".");
    for (var i = 0; i < partes.length; i++) {
      if (no == null) return undefined;
      no = no[partes[i]];
    }
    return no;
  }

  function t(caminho) {
    var v = buscar(caminho);
    if (v == null) {
      console.warn("i18n: chave ausente em '" + lang + "': " + caminho);
      return caminho;
    }
    return Array.isArray(v) ? v.join("\n") : v;
  }

  function interpolar(texto, vars) {
    return texto.replace(/\{(\w+)\}/g, function (tudo, nome) {
      return (vars && nome in vars) ? String(vars[nome]) : tudo;
    });
  }

  function f(caminho, vars) {
    return interpolar(t(caminho), vars);
  }

  function plural(n, chave) {
    var formas = ui.plurais[chave];
    return n === 1 ? formas[0] : formas[1];
  }

  function ordinal(i) {
    return ui.ordinais[i] || String(i + 1);
  }

  // strings de HTML (tutorial, legendas): array de linhas ou string; {moeda} vira o ícone
  function html(caminho) {
    var v = buscar(caminho);
    var s = Array.isArray(v) ? v.join("\n") : (v == null ? caminho : v);
    return s.replace(/\{moeda\}/g, iconeMoeda(14));
  }

  // ---------- aplicação ao DOM ----------

  function aplicarDOM(raiz) {
    var r = raiz || document;

    r.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });

    r.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = html(el.getAttribute("data-i18n-html"));
    });

    r.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (par) {
        if (!par.trim()) return;
        var i = par.indexOf(":");
        el.setAttribute(par.slice(0, i).trim(), t(par.slice(i + 1).trim()));
      });
    });

    // logo: peças do tabuleiro soletrando o nome do jogo (uma peça "certo", uma "lugar")
    var logo = r.querySelector("[data-i18n-logo]");
    if (logo) {
      logo.setAttribute("aria-label", ui.logo.aria);
      logo.innerHTML = ui.logo.palavra.split("").map(function (letra, i) {
        var cls = "tt" + (i === ui.logo.certo ? " certo" : (i === ui.logo.lugar ? " lugar" : ""));
        return '<span class="' + cls + '">' + letra + "</span>";
      }).join("");
    }
  }

  // <head>: em produção já vem estático do build; aqui garante o dev (fonte servida crua)
  function aplicarHead() {
    var m = cfg.meta;
    document.documentElement.lang = cfg.htmlLang;
    document.title = m.title;
    var alvos = [
      ['meta[name="description"]', "content", m.description],
      ['meta[property="og:title"]', "content", m.ogTitle],
      ['meta[property="og:description"]', "content", m.ogDescription],
      ['meta[property="og:image"]', "content", m.ogImage],
      ['meta[property="og:url"]', "content", m.ogUrl],
      ['meta[name="twitter:image"]', "content", m.ogImage]
    ];
    alvos.forEach(function (a) {
      var el = document.querySelector(a[0]);
      if (el) el.setAttribute(a[1], a[2]);
    });
  }

  window.I18N = {
    lang: lang,
    cfg: cfg,
    ui: ui,
    t: t,
    f: f,
    html: html,
    plural: plural,
    ordinal: ordinal,
    iconeMoeda: iconeMoeda,
    aplicarDOM: aplicarDOM
  };

  aplicarHead();
  aplicarDOM(document);
})();
