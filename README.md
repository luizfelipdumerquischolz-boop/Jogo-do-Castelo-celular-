# Coroa de Pedra

Jogo de estratégia medieval de construção de castelo para celular. Roda no navegador,
funciona **100% offline** e pode ser instalado na tela inicial como aplicativo (PWA).

Você ergue seu castelo, produz recursos, treina tropas e enfrenta três facções controladas
pelo computador num mapa em grade. Nomes, textos e arte foram criados para este projeto.

## Como jogar

- **Recursos:** comida, madeira, pedra e ouro são produzidos sem parar enquanto o app está aberto.
- **Construções** (5 níveis cada, com custo e tempo crescentes):
  - **Fazenda**, **Serraria** e **Pedreira** aumentam a produção de comida, madeira e pedra.
  - **Quartel** libera tropas (nível 1: lanceiros, 2: arqueiros, 3: cavaleiros), acelera o treino e aumenta o limite de tropas.
  - **Muralha** multiplica a defesa do castelo.
  - **Armazém** aumenta o limite de cada recurso e esconde parte deles dos saqueadores.
  - O ouro vem de impostos e cresce com o total de níveis dos seus edifícios.
- **Tropas** no estilo pedra-papel-tesoura: **lanceiro** vence **cavaleiro**, **cavaleiro** vence **arqueiro** e **arqueiro** vence **lanceiro**.
- **Mapa:** toque numa fortaleza para ver a guarnição, a previsão dos batedores e enviar um ataque.
  - **Bandidos:** acampamentos fracos, bons para saquear. Depois de destruídos, se reconstroem em alguns minutos.
  - **Senhores rivais** (Lorde Aldren, Dama Ysolde e Barão Corvino): constroem, treinam e sobem de nível como você,
    cada um com sua personalidade. Atacam você quando ficam mais fortes (depois de 15 minutos de proteção de novato)
    e atacam uns aos outros.
  - **Invasores:** a cada 9 minutos uma horda marcha até o seu castelo, cada onda mais forte que a anterior.
    Destruir um acampamento invasor atrasa a próxima onda.
- **Combate** por fórmula determinística: o lado com mais poder vence (empate favorece a defesa), o perdedor perde
  todas as tropas e o vencedor perde uma fração (poder do perdedor / poder do vencedor)^1,5. Cada batalha gera um
  relatório na aba **Relatórios**.
- **Tempo:** o jogo só avança com o app aberto e visível. Ao fechar ou trocar de app, tudo congela; ao voltar,
  continua exatamente de onde parou, sem produção acumulada.
- **Salvamento automático** no aparelho (IndexedDB) a cada poucos segundos, a cada evento importante e ao sair.

## Como rodar

Requer Node.js 20 ou mais recente.

```bash
npm install
npm run dev        # servidor de desenvolvimento em http://localhost:5173
npm run build      # gera a versão final em dist/
npm run preview    # serve dist/ em http://localhost:4173 (com service worker)
```

Para jogar no celular durante o desenvolvimento, use `npm run dev -- --host` ou `npm run preview -- --host`
e abra no celular o endereço de rede mostrado no terminal (celular e computador na mesma rede Wi-Fi).

### Testes

```bash
npm test           # testes de lógica (Vitest)
npm run test:e2e   # build + teste no navegador com Playwright (Chromium)
```

- `tests/economy.test.ts`: produção de recursos, custos e tempos de construção, treino.
- `tests/combat.test.ts`: pedra-papel-tesoura, fórmula de batalha, muralha, saque.
- `tests/ai.test.ts`: senhores rivais, bandidos e ondas de invasores.
- `tests/save.test.ts`: salvar e carregar no IndexedDB e congelamento do tempo.
- `tests/simulation.test.ts`: simula 2 horas de jogo e confere que senhores evoluem e atacam o jogador.
- `e2e/offline.spec.ts`: abre o jogo **sem rede**, constrói uma fazenda, treina uma tropa e verifica que nenhuma
  requisição saiu do navegador; também confere que a tela de 360 px não tem rolagem horizontal.

Na primeira execução do Playwright fora deste ambiente, instale o navegador com `npx playwright install chromium`.

## Como instalar no celular

O endereço do jogo publicado é **https://luizfelipdumerquischolz-boop.github.io/Jogo-do-Castelo-celular-/**.
Ele é atualizado automaticamente pelo workflow `.github/workflows/pages.yml` a cada push no `main`.

O jogo precisa ser aberto uma vez a partir de um endereço **HTTPS** (ou `localhost`) para que o navegador permita
a instalação e o modo offline. Qualquer hospedagem de arquivos estáticos serve: publique o conteúdo de `dist/`
(por exemplo no GitHub Pages, Netlify ou Cloudflare Pages). Como o build usa caminhos relativos, ele também
funciona em subpastas como `https://usuario.github.io/repositorio/`.

**Android (Chrome):**
1. Abra o endereço do jogo no Chrome.
2. Toque no menu ⋮ e escolha **Instalar app** (ou **Adicionar à tela inicial**).
3. Confirme. O ícone da Coroa de Pedra aparece na tela inicial e abre em tela cheia.

**iPhone/iPad (Safari):**
1. Abra o endereço do jogo no Safari.
2. Toque em **Compartilhar** (quadrado com seta para cima).
3. Escolha **Adicionar à Tela de Início** e confirme.

Depois da primeira abertura, o jogo fica guardado no aparelho e funciona em modo avião. O progresso fica salvo
no próprio celular; limpar os dados do site ou desinstalar o app apaga o save.

## Estrutura

```
src/game/      lógica pura do jogo (sem DOM): tipos, dados, economia, combate, IA, tick, save
src/ui/        interface: renderização, ícones SVG originais, estilos
src/main.ts    loop do jogo, toques, salvamento automático e registro do service worker
src/sw-template.js  modelo do service worker (a lista de arquivos é preenchida no build)
public/        manifesto do PWA e ícones
tests/         testes Vitest
e2e/           teste Playwright offline
```

A função central é `tick(state, segundos)` em `src/game/tick.ts`: avança o mundo de forma determinística,
em passos de no máximo 1 segundo, sem ler relógio nem fazer I/O. A interface chama `tick` a cada quadro
com o tempo decorrido (limitado a 1 s), então pausas com o app em segundo plano nunca viram produção.
