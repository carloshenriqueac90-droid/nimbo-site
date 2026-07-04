# Site institucional da Nimbo (`nimbo.games`)

Landing estática da marca-mãe. **Zero build**: é um único `index.html` self-contained
(CSS e SVG inline). Deploy trivial e gratuito.

## Estrutura
- `index.html` — a landing inteira (marca, estúdio, jogos, contato).
- `_headers` — cabeçalhos de segurança/cache (Cloudflare Pages / Netlify).
- `README.md` — este arquivo.

## Deploy recomendado — Cloudflare Pages (grátis)
1. Cloudflare Dashboard → **Pages** → *Create a project* → *Connect to Git* (ou upload direto da pasta `site/`).
2. Build command: **(vazio)** · Output directory: **`/`** (ou `site` se conectar o repo inteiro).
3. Custom domain: **`nimbo.games`**. Requer transferir/gerenciar o DNS na Cloudflare
   (ver D19 — transferir o domínio da Hostinger antes de jul/2027).
4. E-mail: ativar **Email Routing** grátis → encaminhar `contato@nimbo.games` para o e-mail do CEO.

## Arquitetura de domínio (D19)
- `nimbo.games` — marca-mãe (este site).
- `ordemsecreta.nimbo.games` — o jogo Ordem Secreta (subdomínio), publicado à parte no Gate 3.

## Preview local
Qualquer servidor estático serve. Ex.: `npx serve site` ou `python -m http.server -d site 4321`.
