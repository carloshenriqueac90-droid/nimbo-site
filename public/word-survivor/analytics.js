"use strict";

/**
 * analytics.js — PostHog Cloud (EU), MESMO projeto do Ordem Secreta (ver
 * c09-ordem-secreta/app/src/platform/analytics.ts para o padrão de referência: taxonomia de
 * eventos + atribuição por UTM/`s`/referrer com super-properties e person properties
 * `set_once` prefixadas com `initial_`).
 *
 * Termo Survival não tem build/bundler, então a key fica hardcoded aqui em vez de vir de env
 * var — é o mesmo valor de VITE_POSTHOG_KEY em c09-ordem-secreta/app/.env.production (token
 * público de cliente, não é segredo).
 *
 * Como é o MESMO projeto do Ordem Secreta, pra não misturar as coortes dos dois jogos:
 *   - toda captura carrega as super-properties fixas `game` ("termo-survival" | "word-survivor")
 *     e `lang` ("pt" | "en"), vindas do pacote de idioma;
 *   - todo nome de evento usa o prefixo `ts_` (distinto dos eventos do Ordem Secreta) — o prefixo
 *     é o MESMO nos dois idiomas: quem separa as coortes é `game`/`lang`, não o nome do evento.
 *
 * Loader: stub oficial do PostHog em array (carrega assíncrono de eu-assets.i.posthog.com/
 * static/array.js). Se a rede/CDN estiver bloqueada, o script real nunca chega — o callback
 * `loaded` nunca dispara, `window.tsTrack` simplesmente enfileira pra sempre e nunca lança
 * exceção. O jogo funciona 100% igual sem analytics.
 *
 * API exposta: window.tsTrack(nome, props) — chamado pelo script.js. Enfileira internamente
 * até o PostHog terminar de inicializar (mesmo padrão de fila do analytics.ts do Ordem
 * Secreta).
 */
(function () {
  var POSTHOG_KEY = "phc_pjJR3RRLLFdB5CeScpYHTriFWpdSgs4tGQSofB7mkVTy"; // mesmo projeto EU do Ordem Secreta (D23)
  var POSTHOG_HOST = "https://eu.i.posthog.com";

  // identidade do jogo na taxonomia: pt = "termo-survival", en = "word-survivor" (config.analytics.game).
  // O PREFIXO dos eventos continua `ts_` nos dois — os funis são os mesmos; quem separa as coortes
  // (e a retenção por idioma) são as super-properties `game` e `lang`.
  var JOGO = (window.I18N && window.I18N.cfg.analytics.game) || "termo-survival";
  var LANG = (window.I18N && window.I18N.cfg.lang) || "pt";

  // ---------- loader oficial do PostHog (stub em array) ----------
  (function (t, e) {
    var o, n, p, r;
    if (e.__SV) return;
    window.posthog = e;
    e._i = [];
    e.init = function (i, s, a) {
      function g(t, e) {
        var o = e.split(".");
        if (o.length === 2) { t = t[o[0]]; e = o[1]; }
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      }
      p = t.createElement("script");
      p.type = "text/javascript";
      p.crossOrigin = "anonymous";
      p.async = true;
      p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
      r = t.getElementsByTagName("script")[0];
      r.parentNode.insertBefore(p, r);
      var u = e;
      if (a !== undefined) { u = e[a] = []; } else { a = "posthog"; }
      u.people = u.people || [];
      u.toString = function (t) {
        var e = "posthog";
        if (a !== "posthog") e += "." + a;
        if (!t) e += " (stub)";
        return e;
      };
      u.people.toString = function () { return u.toString(1) + ".people (stub)"; };
      o = ("init capture register register_once register_for_session unregister " +
        "unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled " +
        "reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on " +
        "onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys " +
        "renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group " +
        "resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags " +
        "setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id " +
        "getGroups get_session_id get_session_replay_url alias set_config " +
        "startSessionRecording stopSessionRecording sessionRecordingStarted captureException " +
        "loadToolbar get_property createPersonProfile opt_in_capturing opt_out_capturing " +
        "has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug").split(" ");
      for (n = 0; n < o.length; n++) g(u, o[n]);
      e._i.push([i, s, a]);
    };
    e.__SV = 1;
  })(document, window.posthog || []);

  // ---------- fila local: drena para o PostHog assim que ele estiver pronto ----------
  var pronto = false;
  var pendentes = [];

  function disparar(nome, props) {
    try {
      window.posthog.capture(nome, props || {});
    } catch (e) { /* best-effort: nunca trava o jogo */ }
  }

  function drenar() {
    var fila = pendentes;
    pendentes = [];
    for (var i = 0; i < fila.length; i++) disparar(fila[i].nome, fila[i].props);
  }

  window.tsTrack = function (nome, props) {
    try {
      if (pronto) {
        disparar(nome, props);
      } else {
        pendentes.push({ nome: nome, props: props });
      }
    } catch (e) { /* best-effort: nunca trava o jogo */ }
  };

  // ---------- atribuição (UTM / s / referrer) — mesma convenção do Ordem Secreta (D27) ----------
  //
  // `s=sh` é o atalho compacto pro loop viral (veio de um share_click de outra sessão) e só
  // vira source efetivo quando não há utm_source explícito na URL (campanha paga sempre manda).
  //
  // `utm_content` é o que identifica o AD SET na campanha Meta (é por ele que se lê retenção por
  // criativo/público) e `utm_term` cobre o caso de busca paga — os dois vão junto com os demais,
  // como super-property de sessão E person property `initial_*` (set_once). Nada disso é PII: são
  // rótulos de campanha escolhidos por nós.
  var UTMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  function lerAtribuicao() {
    var out = {};
    try {
      var params = new URLSearchParams(window.location.search);
      for (var i = 0; i < UTMS.length; i++) {
        var v = params.get(UTMS[i]);
        if (v) out[UTMS[i]] = v;
      }
      var s = params.get("s");
      if (s) out.s = s;
      if (document.referrer) out.referrer = document.referrer;
    } catch (e) { /* sem window/location (não deveria acontecer no navegador): segue sem atribuição */ }
    return out;
  }

  function registrarAtribuicao() {
    var a = lerAtribuicao();
    var sFallback = a.s === "sh" ? "share" : a.s;
    var origemEfetiva = a.utm_source || sFallback || "direct";

    // super-property de sessão: em TODO evento. `game` e `lang` separam as coortes (o projeto do
    // PostHog é o mesmo do Ordem Secreta e o prefixo `ts_` é o mesmo nos dois idiomas —
    // pt: "termo-survival"/"pt", en: "word-survivor"/"en"; vêm do pacote de idioma).
    var sessionProps = { game: JOGO, lang: LANG, source: origemEfetiva };
    // person property set_once: só a primeira sessão grava (retenção por canal de AQUISIÇÃO)
    var initialProps = { initial_source: origemEfetiva };

    for (var i = 0; i < UTMS.length; i++) {
      var k = UTMS[i];
      if (a[k]) { sessionProps[k] = a[k]; initialProps["initial_" + k] = a[k]; }
    }
    if (a.s) { sessionProps.s = a.s; initialProps.initial_s = a.s; }
    if (a.referrer) { sessionProps.referrer = a.referrer; initialProps.initial_referrer = a.referrer; }

    window.posthog.register(sessionProps);
    window.posthog.setPersonProperties(undefined, initialProps);
  }

  // ---------- inicialização ----------
  try {
    window.posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Retenção D1/coortes por id anônimo, sem exigir login (sem PII).
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      loaded: function () {
        try { registrarAtribuicao(); } catch (e) { /* segue sem atribuição */ }
        pronto = true;
        drenar();
      },
    });
  } catch (e) {
    // PostHog indisponível (CDN bloqueado, script.js chamando antes do stub existir, etc.):
    // window.tsTrack já está definido acima e simplesmente enfileira pra sempre — no-op silencioso.
  }
})();
