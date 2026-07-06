# Site da Nimbo (`nimbo.games`)

Site estático da marca + portfólio de jogos, servido pela pasta `public/`. Deploy automático
no Cloudflare Pages a cada push na `main`.

## Estrutura
- `public/index.html` — landing da marca (CSS e SVG inline, self-contained).
- `public/<jogo>/` — cada jogo é uma subpasta (ex.: `public/ordem-secreta/` → `nimbo.games/ordem-secreta`).
- `public/_headers` — cabeçalhos de segurança/cache.
- `functions/` — Cloudflare Pages Functions (ex.: proxy de analytics first-party).
- `PUBLICAR-JOGO.md` — como publicar um jogo novo no site.

## Deploy — Cloudflare Pages
- Conectado ao repositório. **Build command:** vazio · **Output directory:** `public`.
- Push na `main` → produção em `nimbo.games`.
- Qualquer outra branch → preview automático em `*.nimbo-site.pages.dev` (isolado da produção).
- Domínio e e-mail (`contato@nimbo.games`, via Email Routing) são gerenciados na Cloudflare.

## Arquitetura de domínio
- `nimbo.games` — site da marca, com os jogos em subpasta (`nimbo.games/<jogo>`).

## Preview local
Qualquer servidor estático serve. Ex.: `npx serve public` ou `python -m http.server -d public 4321`.

## Publicar um jogo
Ver [`PUBLICAR-JOGO.md`](PUBLICAR-JOGO.md).
