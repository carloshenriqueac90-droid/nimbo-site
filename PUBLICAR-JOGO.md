# Como publicar um jogo na Nimbo (`nimbo.games`)

Guia para estúdios parceiros. Você desenvolve o jogo **do seu jeito, no seu próprio
repositório** — a Nimbo não interfere na sua metodologia. Este repositório (`nimbo-site`)
é só o **ponto de publicação**: é daqui que o Cloudflare põe o jogo no ar.

## Como o site funciona
- Cada jogo é uma pasta dentro de `public/`. Ex.: `public/ordem-secreta/` → vai pro ar em
  `nimbo.games/ordem-secreta`.
- **Build estático apenas.** O seu jogo precisa virar arquivos prontos (HTML/CSS/JS/assets).
  Se você usa Vite/bundler, é o conteúdo da pasta `dist/` depois do build.
- A pasta é **autocontida**: use caminhos relativos, para funcionar dentro de `/<seu-jogo>/`.

## O contrato de publicação (as 3 regras)
1. **Mexa só na SUA pasta.** Crie `public/<seu-jogo>/` e coloque seu build lá. Não altere
   `public/index.html`, `public/ordem-secreta/`, `public/_headers` nem `functions/`.
2. **Funciona no celular.** A maioria do nosso público é mobile — teste no telefone antes do PR.
3. **Carrega sozinho.** Sem depender de servidor próprio; é estático servido pelo Cloudflare.

## Passo a passo

### 1. Clonar o repositório
```bash
git clone https://github.com/carloshenriqueac90-droid/nimbo-site.git
cd nimbo-site
```

### 2. Criar uma branch para o seu jogo
Nunca trabalhe na `main` (ela é a produção e é protegida).
```bash
git checkout -b jogo/<seu-jogo>
```

### 3. Colocar o build na sua pasta
Copie os arquivos prontos do seu jogo para `public/<seu-jogo>/`. No fim deve existir
`public/<seu-jogo>/index.html`.

### 4. Subir a branch (isso gera o ambiente de teste)
```bash
git add public/<seu-jogo>
git commit -m "Publica <seu-jogo> (preview)"
git push -u origin jogo/<seu-jogo>
```

### 5. Testar no ambiente de teste (URL automática)
Assim que você dá `push`, o Cloudflare cria um **deploy de preview isolado** — a produção
(`nimbo.games`) **não é afetada**. A URL aparece:
- no **comentário automático do Cloudflare** no seu Pull Request, e
- no Cloudflare Dashboard → *Workers & Pages* → `nimbo-site` → *Deployments*.

O endereço tem o formato:
```
https://<branch>.nimbo-site.pages.dev/<seu-jogo>/
```
Ex.: branch `jogo/labirinto` → `https://jogo-labirinto.nimbo-site.pages.dev/labirinto/`.

Teste aí à vontade — inclusive abrindo no celular. Cada novo `push` na branch atualiza
esse preview.

### 6. Abrir o Pull Request (para ir ao ar de verdade)
Quando estiver bom, abra um **Pull Request** da sua branch para a `main` no GitHub.
Um revisor da Nimbo confere o básico (carrega, funciona no mobile, não quebra o resto)
e faz o merge. **Merge na `main` = jogo no ar** em `nimbo.games/<seu-jogo>`.

Você **não** consegue publicar direto na produção — é sempre via PR. Isso protege os jogos
que já estão no ar (o seu e os dos outros).

## Dúvidas
Fale com o COO da Nimbo (via CEO). O que precisar de decisão — nome da pasta, marca no
rodapé, etc. — a gente alinha no PR.
