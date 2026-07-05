/**
 * Reverse proxy do PostHog (D23 / anti-adblock). Roteia o analytics pelo PRÓPRIO domínio
 * (`nimbo.games/ingest/*`, first-party) em vez de `eu.i.posthog.com` — assim bloqueadores de
 * anúncio não derrubam 10-25% dos eventos (retenção/share medem melhor).
 *
 * Cloudflare Pages Function (catch-all): qualquer /ingest/<algo> cai aqui.
 *   /ingest/static/*  -> eu-assets.i.posthog.com/static/*   (scripts: array, recorder, config…)
 *   /ingest/*         -> eu.i.posthog.com/*                 (ingestão: /e/, /s/, /decide/, /flags/…)
 * O client aponta `api_host` para `https://nimbo.games/ingest` (via VITE_POSTHOG_HOST no build).
 */
const API_HOST = 'eu.i.posthog.com';
const ASSET_HOST = 'eu-assets.i.posthog.com';

export const onRequest = async ({ request }) => {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/^\/ingest/, '');
  const host = pathname.startsWith('/static/') ? ASSET_HOST : API_HOST;
  const target = `https://${host}${pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host'); // fetch define o Host correto a partir da URL de destino
  headers.delete('cookie'); // não vaza cookies de 1ª parte para o PostHog

  return fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  });
};
