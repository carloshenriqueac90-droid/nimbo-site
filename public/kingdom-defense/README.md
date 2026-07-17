# Kingdom Defense 🏰

Tower Defense + gerenciamento de recursos. Defenda o castelo das waves enquanto
administra trabalhadores que coletam ouro e madeira — e proteja-os dos lobos caçadores.

## Rodar localmente

É um site 100% estático com ES Modules — precisa de um servidor HTTP simples:

```bash
npx http-server . -p 8123 -c-1
# abrir http://localhost:8123
```

## Publicar na Nimbo

O jogo **já é o build final** (sem etapa de build). Basta copiar a pasta inteira para
`public/kingdom-defense/` no repositório `nimbo-site`, em uma branch, e abrir PR.

Contrato da plataforma ✔:
- Build estático (HTML/CSS/JS puros, zero dependências)
- Caminhos 100% relativos (funciona em subpasta)
- Mobile-first (toque, HUD grande, aviso de rotação)

## Documentação

- [ARQUITETURA.md](ARQUITETURA.md) — decisões, entidades, sistemas, pontos de extensão
- [ASSETS.md](ASSETS.md) — origem e licença de cada recurso
