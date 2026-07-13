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
 *   - toda captura carrega a super-property fixa `game: "termo-survival"`;
 *   - todo nome de evento usa o prefixo `ts_` (distinto dos eventos do Ordem Secreta).
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
  function lerAtribuicao() {
    var out = {};
    try {
      var params = new URLSearchParams(window.location.search);
      var utmSource = params.get("utm_source");
      var utmMedium = params.get("utm_medium");
      var utmCampaign = params.get("utm_campaign");
      var s = params.get("s");
      if (utmSource) out.utm_source = utmSource;
      if (utmMedium) out.utm_medium = utmMedium;
      if (utmCampaign) out.utm_campaign = utmCampaign;
      if (s) out.s = s;
      if (document.referrer) out.referrer = document.referrer;
    } catch (e) { /* sem window/location (não deveria acontecer no navegador): segue sem atribuição */ }
    return out;
  }

  function registrarAtribuicao() {
    var a = lerAtribuicao();
    var sFallback = a.s === "sh" ? "share" : a.s;
    var origemEfetiva = a.utm_source || sFallback || "direct";

    // super-property de sessão: em TODO evento (inclusive `game`, pra não misturar com o Ordem Secreta)
    var sessionProps = { game: "termo-survival", source: origemEfetiva };
    // person property set_once: só a primeira sessão grava (retenção por canal de AQUISIÇÃO)
    var initialProps = { initial_source: origemEfetiva };

    if (a.utm_source) { sessionProps.utm_source = a.utm_source; initialProps.initial_utm_source = a.utm_source; }
    if (a.utm_medium) { sessionProps.utm_medium = a.utm_medium; initialProps.initial_utm_medium = a.utm_medium; }
    if (a.utm_campaign) { sessionProps.utm_campaign = a.utm_campaign; initialProps.initial_utm_campaign = a.utm_campaign; }
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
