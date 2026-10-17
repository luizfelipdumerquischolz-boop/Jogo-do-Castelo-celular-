# Coroa de Pedra (alpha)

Jogo de estratégia medieval para celular. Roda no navegador, funciona **100% offline** e pode ser
instalado na tela inicial como aplicativo (PWA).

Você governa um reino no **Continente X**, um continente de 256 × 256 casas cercado pelo mar, ao lado de
quatro reinos rivais, tribos bárbaras, bandidos e hordas que chegam de navio. Nomes, textos e o desenho
provisório foram criados para este projeto.

## O que tem no alpha

- **Cidade em visão isométrica**: arraste as construções para o terreno, mova e melhore. A torre de menagem
  libera mais terreno, bairros (até +14% de produção, +40% num bairro especializado) e mais assentamentos.
- **Assentamentos**: capital, cidades, aldeias, castelos e postos avançados, com zonas (centro, meio, fronteira)
  e vocações.
- **População com idade** (criança, adulto, idoso): toda construção precisa de trabalhadores adultos; colonos saem
  da população.
- **Cadeias de produção**: trigo → moinho → farinha → padaria → pão; ferro + madeira → ferreiro → armas;
  aveia → estábulo → cavalos; fundição, tecelagem, curtume, cervejaria e outras. Sem a construção não há o produto.
- **Comida em grupos** (energia, proteína, vitaminas, prazer): variedade dá bônus, falta ou excesso trazem
  problemas e doenças.
- **Estações de 5 minutos** e ano de 20 minutos; a colheita se concentra no outono e o inverno quase para as lavouras.
- **Exércitos no mapa**: lanceiros, arqueiros, escudeiros, besteiros, cavaleiros, batedores e máquinas de cerco;
  batalhas e cercos visíveis no mapa, formações, comandantes heróis ou comando direto.
- **Espiões** contratados na Taverna (podem mentir conforme o pagamento e a moral), contraespionagem e suborno.
- **Diplomacia por cartas**: propostas viajam com mensageiros e podem ser interceptadas (quem intercepta lê).
- **Rivais e tribos com IA própria** que pensa em intervalos (sem turnos), constrói, guerreia entre si e com você,
  mais agressiva quanto mais perto for a fronteira.
- **Vitória**: conquistar ou vassalar os 4 rivais e controlar 75% das terras dá o título de **Imperador**; o jogo
  continua, com hordas mais fortes. Com 100% do mapa chega uma carta secreta do Continente Y.
- **Derrota**: perder todos os assentamentos (se a capital cair, outra vira capital).
- **Tempo**: o jogo só anda com o app aberto e visível. Fechou, congelou.
- **Salvamento automático** no aparelho (IndexedDB) a cada poucos segundos e após cada ordem.

## Imagens

Todo o desenho do jogo é provisório e gerado por código. A lista completa de imagens necessárias, com nome
de arquivo, tamanho e descrição, está em **[docs/LISTA-DE-ARTES.md](docs/LISTA-DE-ARTES.md)** (gerada com
`npm run artes`). Para trocar uma imagem, coloque o PNG com o nome indicado em `public/arte/` e gere o build:
o jogo usa a imagem nova e mantém o desenho provisório nas que faltarem. No jogo, **Mais → Lista de artes**
mostra o que já foi entregue.

## Como rodar

Requer Node.js 20 ou mais recente.

```bash
npm install
npm run dev        # servidor de desenvolvimento em http://localhost:5173
npm run build      # gera a versão final em dist/
npm run preview    # serve dist/ em http://localhost:4173 (com service worker)
npm run artes      # atualiza docs/LISTA-DE-ARTES.md
```

### Testes

```bash
npm test           # testes da simulação e do registro de artes (Vitest)
npm run test:e2e   # build + teste no navegador com Playwright (Chromium)
```

- `tests/sim.test.ts`: mapa e reinos, tempo congelado, estações, construção, cadeias de produção, trabalhadores,
  comida, recrutamento, marcha, batalha e conquista, cartas por mensageiro, espiões, salvar/carregar
  (inclusive IndexedDB) e 2 horas de simulação sem números quebrados.
- `tests/art.test.ts`: toda arte usada pelo jogo existe na lista, com nome único, tamanho e descrição.
- `e2e/offline.spec.ts`: abre o jogo **sem rede**, constrói um quartel, recruta, recarrega e confere que o
  progresso ficou salvo e que nenhuma requisição saiu do navegador; também confere a tela de 360 px.

Na primeira execução do Playwright fora deste ambiente, instale o navegador com `npx playwright install chromium`.

## Como instalar no celular

O endereço do jogo publicado é **https://luizfelipdumerquischolz-boop.github.io/Jogo-do-Castelo-celular-/**.
Ele é atualizado pelo workflow `.github/workflows/pages.yml` a cada push no `main`.

**Android (Chrome):** abra o endereço, toque no menu ⋮ e escolha **Instalar app** (ou **Adicionar à tela inicial**).

**iPhone/iPad (Safari):** abra o endereço, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**.

Depois da primeira abertura o jogo fica guardado no aparelho e funciona em modo avião. O progresso fica salvo
no próprio celular; limpar os dados do site ou desinstalar o app apaga o save.

## Estrutura

```
src/sim/          simulação pura (sem DOM): dados, mapa, população, economia, exércitos, batalhas,
                  logística, heróis, espiões, diplomacia, IA, progresso, tick, save, ações
src/client/       núcleo que roda a simulação num Web Worker e manda retratos do estado para a tela
src/art/          registro de todas as imagens e o desenho provisório de cada uma
src/ui/           interface: mapa e cidade em canvas isométrico, painéis, estilos
src/main.ts       início do app e registro do service worker
src/sw-template.js  modelo do service worker (a lista de arquivos é preenchida no build)
public/arte/      imagens fornecidas (substituem o desenho provisório)
scripts/          geração de ícones e da lista de artes
tests/  e2e/      testes Vitest e Playwright
```

A função central é `tick(state, segundos)` em `src/sim/tick.ts`: avança o mundo de forma determinística, em
passos de no máximo 1 segundo, sem ler relógio nem fazer I/O. O núcleo chama `tick` com o tempo decorrido
(limitado a 1 s por quadro), então pausas com o app em segundo plano nunca viram produção.

## App Android (APK)

`android/` é um app Android mínimo (sem bibliotecas extras) que abre o jogo publicado em tela cheia.
Como ele carrega o site, o jogo dentro do app se atualiza sozinho a cada publicação; depois da primeira
abertura funciona offline pelo service worker. O APK fica em `public/coroa-de-pedra.apk` e é baixado em
**https://luizfelipdumerquischolz-boop.github.io/Jogo-do-Castelo-celular-/coroa-de-pedra.apk**.

Para gerar de novo (só é preciso se o app em si mudar): instale o Android SDK, crie `android/local.properties`
com `sdk.dir=...` e `android/chave.properties` com a chave de assinatura (fora do repositório; para o Android
aceitar a atualização sem desinstalar, use sempre a mesma chave e aumente `versionCode`), e rode
`gradle assembleRelease` dentro de `android/`.
