# Coroa de Pedra — lista de imagens

Total: **386 imagens** em 16 grupos. Esta lista é gerada pelo próprio jogo (`npm run artes`), então nunca fica desatualizada.

## Como entregar as imagens

- Formato **PNG com fundo transparente** (menos os ladrilhos de chão e de terreno, que cobrem a casa inteira).
- Use **exatamente o nome do arquivo** indicado (letras minúsculas, sem acento, com hífens).
- O tamanho indicado é o recomendado. Pode ser maior se mantiver a proporção (por exemplo, o dobro).
- **Isométrico 2:1**: uma casa do chão tem 128 × 64 px (losango). Luz vindo de cima e da esquerda.
- Pode mandar aos poucos: cada imagem que chegar substitui o desenho provisório do jogo. As que faltarem continuam com o desenho padrão.
- No jogo, a tela **Mais → Lista de artes** mostra quais já foram entregues.

## Resumo

| Grupo | Quantidade |
|---|---|
| Interface (botões, barras e painéis) | 12 |
| Ícones dos botões e abas | 31 |
| Ícones de recursos, alimentos e itens | 39 |
| Ícones de status | 8 |
| Construções (3 estágios cada) | 147 |
| Andaimes de obra | 3 |
| Chão e decoração do assentamento | 7 |
| Muralha, portão e fosso | 31 |
| Terreno do mapa-múndi | 15 |
| Depósitos de recursos no mapa | 12 |
| Assentamentos e acampamentos no mapa | 12 |
| Unidades em viagem no mapa | 6 |
| Soldados (retrato e boneco de batalha) | 42 |
| Heróis | 8 |
| Efeitos | 8 |
| Ilustrações | 5 |
| **Total** | **386** |

## Interface (botões, barras e painéis) (12)

Peças da tela. Botões e painéis são esticados pelo jogo: deixe as bordas decoradas e o miolo liso.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `ui-botao.png` | Botão principal | 192 × 72 | plano | Botão verde de ação (Construir, Melhorar, Recrutar). Esticado na largura: bordas arredondadas com moldura, miolo liso. |
| `ui-botao-perigo.png` | Botão de perigo | 192 × 72 | plano | Botão vermelho (Atacar, Demolir). |
| `ui-botao-neutro.png` | Botão neutro | 192 × 72 | plano | Botão marrom para ações secundárias (Cancelar, Voltar). |
| `ui-botao-desativado.png` | Botão desativado | 192 × 72 | plano | Botão acinzentado quando a ação não está disponível. |
| `ui-barra-topo.png` | Barra superior | 512 × 96 | plano | Faixa de madeira escura atrás dos recursos no topo da tela. Repete na horizontal. |
| `ui-barra-inferior.png` | Barra de navegação | 512 × 128 | plano | Faixa de madeira atrás das abas na parte de baixo. Repete na horizontal. |
| `ui-painel.png` | Painel de pergaminho | 512 × 512 | plano | Fundo dos painéis que sobem de baixo (informações de construções, exércitos). Textura de pergaminho que se repete, com borda escura de 16 px. |
| `ui-fundo.png` | Fundo das telas de menu | 512 × 512 | plano | Couro ou madeira escura atrás das listas (cartas, pesquisa, diplomacia). Repete sem emenda. |
| `ui-moldura-retrato.png` | Moldura de retrato | 256 × 256 | plano | Moldura dourada redonda para retratos de heróis e soldados. Miolo transparente. |
| `ui-selo.png` | Selo de cera | 96 × 96 | plano | Selo vermelho das cartas não lidas. |
| `ui-carta.png` | Papel de carta | 512 × 640 | plano | Folha de pergaminho para ler cartas. Bordas levemente queimadas. |
| `ui-icone-app.png` | Ícone do aplicativo | 1024 × 1024 | plano | Ícone que aparece na tela inicial do celular. Castelo ou coroa de pedra, sem texto, fundo escuro. |

## Ícones dos botões e abas (31)

Ícones planos, sem perspectiva, legíveis em 24 px. Fundo transparente.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `icone-ui-reino.png` | Aba Reino (mapa) | 96 × 96 | plano | Ícone do botão "Aba Reino (mapa)". |
| `icone-ui-cidade.png` | Aba Cidade | 96 × 96 | plano | Ícone do botão "Aba Cidade". |
| `icone-ui-exercitos.png` | Aba Exércitos | 96 × 96 | plano | Ícone do botão "Aba Exércitos". |
| `icone-ui-cartas.png` | Aba Cartas | 96 × 96 | plano | Ícone do botão "Aba Cartas". |
| `icone-ui-mais.png` | Aba Mais | 96 × 96 | plano | Ícone do botão "Aba Mais". |
| `icone-ui-construir.png` | Construir | 96 × 96 | plano | Ícone do botão "Construir". |
| `icone-ui-melhorar.png` | Melhorar | 96 × 96 | plano | Ícone do botão "Melhorar". |
| `icone-ui-mover.png` | Mover construção | 96 × 96 | plano | Ícone do botão "Mover construção". |
| `icone-ui-demolir.png` | Demolir | 96 × 96 | plano | Ícone do botão "Demolir". |
| `icone-ui-atacar.png` | Atacar / conquistar | 96 × 96 | plano | Ícone do botão "Atacar / conquistar". |
| `icone-ui-saquear.png` | Saquear | 96 × 96 | plano | Ícone do botão "Saquear". |
| `icone-ui-espionar.png` | Espionar | 96 × 96 | plano | Ícone do botão "Espionar". |
| `icone-ui-defender.png` | Defender | 96 × 96 | plano | Ícone do botão "Defender". |
| `icone-ui-voltar.png` | Voltar para casa | 96 × 96 | plano | Ícone do botão "Voltar para casa". |
| `icone-ui-fechar.png` | Fechar painel | 96 × 96 | plano | Ícone do botão "Fechar painel". |
| `icone-ui-pesquisa.png` | Pesquisa | 96 × 96 | plano | Ícone do botão "Pesquisa". |
| `icone-ui-diplomacia.png` | Diplomacia | 96 × 96 | plano | Ícone do botão "Diplomacia". |
| `icone-ui-taverna.png` | Taverna | 96 × 96 | plano | Ícone do botão "Taverna". |
| `icone-ui-herois.png` | Heróis | 96 × 96 | plano | Ícone do botão "Heróis". |
| `icone-ui-missoes.png` | Missões | 96 × 96 | plano | Ícone do botão "Missões". |
| `icone-ui-mercado.png` | Mercado | 96 × 96 | plano | Ícone do botão "Mercado". |
| `icone-ui-rotas.png` | Rotas e carroças | 96 × 96 | plano | Ícone do botão "Rotas e carroças". |
| `icone-ui-colonos.png` | Colonos | 96 × 96 | plano | Ícone do botão "Colonos". |
| `icone-ui-relatorios.png` | Relatórios de batalha | 96 × 96 | plano | Ícone do botão "Relatórios de batalha". |
| `icone-ui-cronica.png` | Crônica do reino | 96 × 96 | plano | Ícone do botão "Crônica do reino". |
| `icone-ui-artes.png` | Lista de artes | 96 × 96 | plano | Ícone do botão "Lista de artes". |
| `icone-ui-ajuda.png` | Ajuda | 96 × 96 | plano | Ícone do botão "Ajuda". |
| `icone-ui-novo.png` | Novo jogo | 96 × 96 | plano | Ícone do botão "Novo jogo". |
| `icone-ui-zoom.png` | Zoom do mapa | 96 × 96 | plano | Ícone do botão "Zoom do mapa". |
| `icone-ui-fundar.png` | Fundar assentamento | 96 × 96 | plano | Ícone do botão "Fundar assentamento". |
| `icone-ui-recrutar.png` | Recrutar | 96 × 96 | plano | Ícone do botão "Recrutar". |

## Ícones de recursos, alimentos e itens (39)

Ícones planos de 128 × 128 px, sem perspectiva, bem legíveis em tamanho pequeno.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `icone-wood.png` | Madeira | 128 × 128 | plano | Ícone de madeira. |
| `icone-stone.png` | Pedra | 128 × 128 | plano | Ícone de pedra. |
| `icone-iron.png` | Ferro | 128 × 128 | plano | Ícone de ferro. |
| `icone-diamond.png` | Diamante | 128 × 128 | plano | Ícone de diamante. |
| `icone-wheat.png` | Trigo | 128 × 128 | plano | Ícone de trigo. |
| `icone-oats.png` | Aveia | 128 × 128 | plano | Ícone de aveia. |
| `icone-barley.png` | Cevada | 128 × 128 | plano | Ícone de cevada. |
| `icone-grapes.png` | Uva | 128 × 128 | plano | Ícone de uva. |
| `icone-cattle.png` | Gado | 128 × 128 | plano | Ícone de gado. |
| `icone-milk.png` | Leite | 128 × 128 | plano | Ícone de leite. |
| `icone-wool.png` | Lã | 128 × 128 | plano | Ícone de lã. |
| `icone-wax.png` | Cera | 128 × 128 | plano | Ícone de cera. |
| `icone-flour.png` | Farinha | 128 × 128 | plano | Ícone de farinha. |
| `icone-charcoal.png` | Carvão | 128 × 128 | plano | Ícone de carvão. |
| `icone-steel.png` | Aço | 128 × 128 | plano | Ícone de aço. |
| `icone-leather.png` | Couro | 128 × 128 | plano | Ícone de couro. |
| `icone-cloth.png` | Tecido | 128 × 128 | plano | Ícone de tecido. |
| `icone-jewels.png` | Joias | 128 × 128 | plano | Ícone de joias. |
| `icone-bread.png` | Pão | 128 × 128 | plano | Ícone de pão. |
| `icone-porridge.png` | Mingau | 128 × 128 | plano | Ícone de mingau. |
| `icone-meat.png` | Carne | 128 × 128 | plano | Ícone de carne. |
| `icone-fish.png` | Peixe | 128 × 128 | plano | Ícone de peixe. |
| `icone-eggs.png` | Ovos | 128 × 128 | plano | Ícone de ovos. |
| `icone-cheese.png` | Queijo | 128 × 128 | plano | Ícone de queijo. |
| `icone-vegetables.png` | Legumes | 128 × 128 | plano | Ícone de legumes. |
| `icone-fruit.png` | Frutas | 128 × 128 | plano | Ícone de frutas. |
| `icone-beer.png` | Cerveja | 128 × 128 | plano | Ícone de cerveja. |
| `icone-wine.png` | Vinho | 128 × 128 | plano | Ícone de vinho. |
| `icone-honey.png` | Mel | 128 × 128 | plano | Ícone de mel. |
| `icone-weapon.png` | Arma | 128 × 128 | plano | Ícone de arma. |
| `icone-armor.png` | Armadura | 128 × 128 | plano | Ícone de armadura. |
| `icone-shield.png` | Escudo | 128 × 128 | plano | Ícone de escudo. |
| `icone-crossbow.png` | Besta | 128 × 128 | plano | Ícone de besta. |
| `icone-steelWeapon.png` | Arma de aço | 128 × 128 | plano | Ícone de arma de aço. |
| `icone-steelArmor.png` | Armadura de aço | 128 × 128 | plano | Ícone de armadura de aço. |
| `icone-bow.png` | Arco | 128 × 128 | plano | Ícone de arco. |
| `icone-horse.png` | Cavalo | 128 × 128 | plano | Ícone de cavalo. |
| `icone-banner.png` | Estandarte | 128 × 128 | plano | Ícone de estandarte. |
| `icone-gold.png` | Ouro | 128 × 128 | plano | Pilha de moedas de ouro (tesouro do reino). |

## Ícones de status (8)

Ícones planos de 128 × 128 px usados nos painéis (população, felicidade etc.).

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `icone-population.png` | População | 128 × 128 | plano | Ícone de população. |
| `icone-happiness.png` | Felicidade | 128 × 128 | plano | Ícone de felicidade. |
| `icone-health.png` | Saúde | 128 × 128 | plano | Ícone de saúde. |
| `icone-morale.png` | Moral | 128 × 128 | plano | Ícone de moral. |
| `icone-loyalty.png` | Lealdade | 128 × 128 | plano | Ícone de lealdade. |
| `icone-culture.png` | Cultura | 128 × 128 | plano | Ícone de cultura. |
| `icone-research.png` | Pesquisa | 128 × 128 | plano | Ícone de pesquisa. |
| `icone-time.png` | Tempo / estação | 128 × 128 | plano | Ícone de tempo / estação. |

## Construções (3 estágios cada) (147)

Isométricas 2:1, luz de cima e da esquerda. Estágio 1 = níveis 1–2 (madeira, simples), 2 = níveis 3–4 (pedra), 3 = nível 5 (imponente, bandeiras). A base do prédio encosta embaixo da imagem.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `construcao-keep-1.png` | Torre de Menagem — estágio 1 | 384 × 452 | isométrico | Coração da capital. O nível libera terreno, bairros, construções e o limite de assentamentos. Ocupa 3×3 casas. Estágio 1: madeira e palha, simples. |
| `construcao-keep-2.png` | Torre de Menagem — estágio 2 | 384 × 452 | isométrico | Coração da capital. O nível libera terreno, bairros, construções e o limite de assentamentos. Ocupa 3×3 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-keep-3.png` | Torre de Menagem — estágio 3 | 384 × 452 | isométrico | Coração da capital. O nível libera terreno, bairros, construções e o limite de assentamentos. Ocupa 3×3 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-governor_hall-1.png` | Salão do governador — estágio 1 | 256 × 298 | isométrico | Sede do cônsul nos outros assentamentos. O nível aumenta terreno, moradia e o bônus da vocação. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-governor_hall-2.png` | Salão do governador — estágio 2 | 256 × 298 | isométrico | Sede do cônsul nos outros assentamentos. O nível aumenta terreno, moradia e o bônus da vocação. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-governor_hall-3.png` | Salão do governador — estágio 3 | 256 × 298 | isométrico | Sede do cônsul nos outros assentamentos. O nível aumenta terreno, moradia e o bônus da vocação. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-house-1.png` | Casa — estágio 1 | 128 × 204 | isométrico | Moradia para 8 cidadãos por nível. Gera impostos. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-house-2.png` | Casa — estágio 2 | 128 × 204 | isométrico | Moradia para 8 cidadãos por nível. Gera impostos. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-house-3.png` | Casa — estágio 3 | 128 × 204 | isométrico | Moradia para 8 cidadãos por nível. Gera impostos. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-wheat_farm-1.png` | Fazenda de trigo — estágio 1 | 256 × 298 | isométrico | Planta trigo. A colheita se concentra no outono. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-wheat_farm-2.png` | Fazenda de trigo — estágio 2 | 256 × 298 | isométrico | Planta trigo. A colheita se concentra no outono. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-wheat_farm-3.png` | Fazenda de trigo — estágio 3 | 256 × 298 | isométrico | Planta trigo. A colheita se concentra no outono. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-oat_farm-1.png` | Fazenda de aveia — estágio 1 | 256 × 298 | isométrico | Planta aveia para mingau e para os cavalos. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-oat_farm-2.png` | Fazenda de aveia — estágio 2 | 256 × 298 | isométrico | Planta aveia para mingau e para os cavalos. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-oat_farm-3.png` | Fazenda de aveia — estágio 3 | 256 × 298 | isométrico | Planta aveia para mingau e para os cavalos. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-barley_farm-1.png` | Fazenda de cevada — estágio 1 | 256 × 298 | isométrico | Planta cevada para a cervejaria. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-barley_farm-2.png` | Fazenda de cevada — estágio 2 | 256 × 298 | isométrico | Planta cevada para a cervejaria. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-barley_farm-3.png` | Fazenda de cevada — estágio 3 | 256 × 298 | isométrico | Planta cevada para a cervejaria. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-vegetable_garden-1.png` | Horta — estágio 1 | 128 × 204 | isométrico | Legumes: o grupo das vitaminas, que protege contra doenças. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-vegetable_garden-2.png` | Horta — estágio 2 | 128 × 204 | isométrico | Legumes: o grupo das vitaminas, que protege contra doenças. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-vegetable_garden-3.png` | Horta — estágio 3 | 128 × 204 | isométrico | Legumes: o grupo das vitaminas, que protege contra doenças. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-orchard-1.png` | Pomar — estágio 1 | 256 × 298 | isométrico | Árvores frutíferas: vitaminas para o povo. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-orchard-2.png` | Pomar — estágio 2 | 256 × 298 | isométrico | Árvores frutíferas: vitaminas para o povo. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-orchard-3.png` | Pomar — estágio 3 | 256 × 298 | isométrico | Árvores frutíferas: vitaminas para o povo. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-vineyard-1.png` | Vinhedo — estágio 1 | 256 × 298 | isométrico | Uvas para o lagar. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-vineyard-2.png` | Vinhedo — estágio 2 | 256 × 298 | isométrico | Uvas para o lagar. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-vineyard-3.png` | Vinhedo — estágio 3 | 256 × 298 | isométrico | Uvas para o lagar. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-pasture-1.png` | Pasto — estágio 1 | 256 × 298 | isométrico | Cria gado e dá leite. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-pasture-2.png` | Pasto — estágio 2 | 256 × 298 | isométrico | Cria gado e dá leite. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-pasture-3.png` | Pasto — estágio 3 | 256 × 298 | isométrico | Cria gado e dá leite. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-sheep_pasture-1.png` | Pasto de ovelhas — estágio 1 | 256 × 298 | isométrico | Ovelhas dão lã para a tecelagem. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-sheep_pasture-2.png` | Pasto de ovelhas — estágio 2 | 256 × 298 | isométrico | Ovelhas dão lã para a tecelagem. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-sheep_pasture-3.png` | Pasto de ovelhas — estágio 3 | 256 × 298 | isométrico | Ovelhas dão lã para a tecelagem. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-henhouse-1.png` | Galinheiro — estágio 1 | 128 × 204 | isométrico | Galinhas botam ovos: proteína barata. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-henhouse-2.png` | Galinheiro — estágio 2 | 128 × 204 | isométrico | Galinhas botam ovos: proteína barata. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-henhouse-3.png` | Galinheiro — estágio 3 | 128 × 204 | isométrico | Galinhas botam ovos: proteína barata. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-fisher-1.png` | Pescador — estágio 1 | 128 × 204 | isométrico | Pesca no rio ou no mar. Precisa de água perto. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-fisher-2.png` | Pescador — estágio 2 | 128 × 204 | isométrico | Pesca no rio ou no mar. Precisa de água perto. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-fisher-3.png` | Pescador — estágio 3 | 128 × 204 | isométrico | Pesca no rio ou no mar. Precisa de água perto. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-apiary-1.png` | Apiário — estágio 1 | 128 × 204 | isométrico | Abelhas dão mel e cera. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-apiary-2.png` | Apiário — estágio 2 | 128 × 204 | isométrico | Abelhas dão mel e cera. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-apiary-3.png` | Apiário — estágio 3 | 128 × 204 | isométrico | Abelhas dão mel e cera. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-mill-1.png` | Moinho — estágio 1 | 256 × 298 | isométrico | Mói o trigo e faz farinha. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-mill-2.png` | Moinho — estágio 2 | 256 × 298 | isométrico | Mói o trigo e faz farinha. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-mill-3.png` | Moinho — estágio 3 | 256 × 298 | isométrico | Mói o trigo e faz farinha. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-bakery-1.png` | Padaria — estágio 1 | 128 × 204 | isométrico | Transforma farinha em pão. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-bakery-2.png` | Padaria — estágio 2 | 128 × 204 | isométrico | Transforma farinha em pão. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-bakery-3.png` | Padaria — estágio 3 | 128 × 204 | isométrico | Transforma farinha em pão. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-kitchen-1.png` | Cozinha comunitária — estágio 1 | 128 × 204 | isométrico | Cozinha aveia e faz mingau. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-kitchen-2.png` | Cozinha comunitária — estágio 2 | 128 × 204 | isométrico | Cozinha aveia e faz mingau. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-kitchen-3.png` | Cozinha comunitária — estágio 3 | 128 × 204 | isométrico | Cozinha aveia e faz mingau. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-butcher-1.png` | Açougue — estágio 1 | 128 × 204 | isométrico | Gado vira carne. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-butcher-2.png` | Açougue — estágio 2 | 128 × 204 | isométrico | Gado vira carne. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-butcher-3.png` | Açougue — estágio 3 | 128 × 204 | isométrico | Gado vira carne. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-dairy-1.png` | Queijaria — estágio 1 | 128 × 204 | isométrico | Leite vira queijo, que dura muito no armazém. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-dairy-2.png` | Queijaria — estágio 2 | 128 × 204 | isométrico | Leite vira queijo, que dura muito no armazém. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-dairy-3.png` | Queijaria — estágio 3 | 128 × 204 | isométrico | Leite vira queijo, que dura muito no armazém. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-brewery-1.png` | Cervejaria — estágio 1 | 256 × 298 | isométrico | Cevada vira cerveja. Moral alta, mas cuidado com a embriaguez. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-brewery-2.png` | Cervejaria — estágio 2 | 256 × 298 | isométrico | Cevada vira cerveja. Moral alta, mas cuidado com a embriaguez. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-brewery-3.png` | Cervejaria — estágio 3 | 256 × 298 | isométrico | Cevada vira cerveja. Moral alta, mas cuidado com a embriaguez. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-winepress-1.png` | Lagar — estágio 1 | 128 × 204 | isométrico | Uva vira vinho. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-winepress-2.png` | Lagar — estágio 2 | 128 × 204 | isométrico | Uva vira vinho. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-winepress-3.png` | Lagar — estágio 3 | 128 × 204 | isométrico | Uva vira vinho. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-sawmill-1.png` | Serraria — estágio 1 | 256 × 298 | isométrico | Lenhadores e serras: madeira. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-sawmill-2.png` | Serraria — estágio 2 | 256 × 298 | isométrico | Lenhadores e serras: madeira. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-sawmill-3.png` | Serraria — estágio 3 | 256 × 298 | isométrico | Lenhadores e serras: madeira. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-quarry-1.png` | Pedreira — estágio 1 | 256 × 298 | isométrico | Corta blocos de pedra. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-quarry-2.png` | Pedreira — estágio 2 | 256 × 298 | isométrico | Corta blocos de pedra. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-quarry-3.png` | Pedreira — estágio 3 | 256 × 298 | isométrico | Corta blocos de pedra. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-iron_mine-1.png` | Mina de ferro — estágio 1 | 256 × 298 | isométrico | Extrai ferro. Só perto de um depósito de ferro. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-iron_mine-2.png` | Mina de ferro — estágio 2 | 256 × 298 | isométrico | Extrai ferro. Só perto de um depósito de ferro. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-iron_mine-3.png` | Mina de ferro — estágio 3 | 256 × 298 | isométrico | Extrai ferro. Só perto de um depósito de ferro. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-gold_mine-1.png` | Mina de ouro — estágio 1 | 256 × 298 | isométrico | Extrai ouro para o tesouro. Só perto de um depósito de ouro. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-gold_mine-2.png` | Mina de ouro — estágio 2 | 256 × 298 | isométrico | Extrai ouro para o tesouro. Só perto de um depósito de ouro. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-gold_mine-3.png` | Mina de ouro — estágio 3 | 256 × 298 | isométrico | Extrai ouro para o tesouro. Só perto de um depósito de ouro. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-diamond_mine-1.png` | Mina de diamante — estágio 1 | 256 × 298 | isométrico | Extrai diamantes. Só perto de um depósito de diamante. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-diamond_mine-2.png` | Mina de diamante — estágio 2 | 256 × 298 | isométrico | Extrai diamantes. Só perto de um depósito de diamante. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-diamond_mine-3.png` | Mina de diamante — estágio 3 | 256 × 298 | isométrico | Extrai diamantes. Só perto de um depósito de diamante. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-charcoal_kiln-1.png` | Carvoaria — estágio 1 | 128 × 204 | isométrico | Queima madeira e faz carvão para a fundição. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-charcoal_kiln-2.png` | Carvoaria — estágio 2 | 128 × 204 | isométrico | Queima madeira e faz carvão para a fundição. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-charcoal_kiln-3.png` | Carvoaria — estágio 3 | 128 × 204 | isométrico | Queima madeira e faz carvão para a fundição. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-foundry-1.png` | Fundição — estágio 1 | 256 × 298 | isométrico | Ferro e carvão viram aço. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-foundry-2.png` | Fundição — estágio 2 | 256 × 298 | isométrico | Ferro e carvão viram aço. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-foundry-3.png` | Fundição — estágio 3 | 256 × 298 | isométrico | Ferro e carvão viram aço. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-tannery-1.png` | Curtume — estágio 1 | 128 × 204 | isométrico | Gado vira couro para escudos e máquinas de cerco. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-tannery-2.png` | Curtume — estágio 2 | 128 × 204 | isométrico | Gado vira couro para escudos e máquinas de cerco. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-tannery-3.png` | Curtume — estágio 3 | 128 × 204 | isométrico | Gado vira couro para escudos e máquinas de cerco. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-weaver-1.png` | Tecelagem — estágio 1 | 256 × 298 | isométrico | Lã vira tecido; tecido vira estandartes. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-weaver-2.png` | Tecelagem — estágio 2 | 256 × 298 | isométrico | Lã vira tecido; tecido vira estandartes. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-weaver-3.png` | Tecelagem — estágio 3 | 256 × 298 | isométrico | Lã vira tecido; tecido vira estandartes. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-jeweler-1.png` | Joalheiro — estágio 1 | 128 × 204 | isométrico | Diamante e ouro viram joias de alto valor. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-jeweler-2.png` | Joalheiro — estágio 2 | 128 × 204 | isométrico | Diamante e ouro viram joias de alto valor. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-jeweler-3.png` | Joalheiro — estágio 3 | 128 × 204 | isométrico | Diamante e ouro viram joias de alto valor. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-storehouse-1.png` | Armazém — estágio 1 | 256 × 298 | isométrico | Aumenta o limite de cada recurso e esconde parte deles dos saqueadores. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-storehouse-2.png` | Armazém — estágio 2 | 256 × 298 | isométrico | Aumenta o limite de cada recurso e esconde parte deles dos saqueadores. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-storehouse-3.png` | Armazém — estágio 3 | 256 × 298 | isométrico | Aumenta o limite de cada recurso e esconde parte deles dos saqueadores. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-blacksmith-1.png` | Ferreiro — estágio 1 | 256 × 298 | isométrico | Forja armas, armaduras, escudos, bestas e itens de aço. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-blacksmith-2.png` | Ferreiro — estágio 2 | 256 × 298 | isométrico | Forja armas, armaduras, escudos, bestas e itens de aço. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-blacksmith-3.png` | Ferreiro — estágio 3 | 256 × 298 | isométrico | Forja armas, armaduras, escudos, bestas e itens de aço. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-fletcher-1.png` | Flecheiro — estágio 1 | 128 × 204 | isométrico | Faz arcos com madeira. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-fletcher-2.png` | Flecheiro — estágio 2 | 128 × 204 | isométrico | Faz arcos com madeira. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-fletcher-3.png` | Flecheiro — estágio 3 | 128 × 204 | isométrico | Faz arcos com madeira. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-stable-1.png` | Estábulo — estágio 1 | 256 × 298 | isométrico | Cria cavalos com aveia. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-stable-2.png` | Estábulo — estágio 2 | 256 × 298 | isométrico | Cria cavalos com aveia. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-stable-3.png` | Estábulo — estágio 3 | 256 × 298 | isométrico | Cria cavalos com aveia. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-barracks-1.png` | Quartel — estágio 1 | 256 × 298 | isométrico | Recruta soldados. O nível acelera o treino. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-barracks-2.png` | Quartel — estágio 2 | 256 × 298 | isométrico | Recruta soldados. O nível acelera o treino. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-barracks-3.png` | Quartel — estágio 3 | 256 × 298 | isométrico | Recruta soldados. O nível acelera o treino. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-training_ground-1.png` | Campo de treino — estágio 1 | 256 × 298 | isométrico | A guarnição ganha experiência sem lutar. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-training_ground-2.png` | Campo de treino — estágio 2 | 256 × 298 | isométrico | A guarnição ganha experiência sem lutar. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-training_ground-3.png` | Campo de treino — estágio 3 | 256 × 298 | isométrico | A guarnição ganha experiência sem lutar. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-siege_workshop-1.png` | Oficina de cerco — estágio 1 | 384 × 392 | isométrico | Constrói aríetes, catapultas, escadas e torres de cerco. Ocupa 3×3 casas. Estágio 1: madeira e palha, simples. |
| `construcao-siege_workshop-2.png` | Oficina de cerco — estágio 2 | 384 × 392 | isométrico | Constrói aríetes, catapultas, escadas e torres de cerco. Ocupa 3×3 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-siege_workshop-3.png` | Oficina de cerco — estágio 3 | 384 × 392 | isométrico | Constrói aríetes, catapultas, escadas e torres de cerco. Ocupa 3×3 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-infirmary-1.png` | Enfermaria — estágio 1 | 256 × 298 | isométrico | Parte dos soldados derrotados volta ferida em vez de morrer; trata doenças. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-infirmary-2.png` | Enfermaria — estágio 2 | 256 × 298 | isométrico | Parte dos soldados derrotados volta ferida em vez de morrer; trata doenças. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-infirmary-3.png` | Enfermaria — estágio 3 | 256 × 298 | isométrico | Parte dos soldados derrotados volta ferida em vez de morrer; trata doenças. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-watchtower-1.png` | Torre de vigia — estágio 1 | 128 × 234 | isométrico | Avisa ataques mais cedo, revela exércitos e dificulta espiões. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-watchtower-2.png` | Torre de vigia — estágio 2 | 128 × 234 | isométrico | Avisa ataques mais cedo, revela exércitos e dificulta espiões. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-watchtower-3.png` | Torre de vigia — estágio 3 | 128 × 234 | isométrico | Avisa ataques mais cedo, revela exércitos e dificulta espiões. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-dungeon-1.png` | Masmorra — estágio 1 | 256 × 298 | isométrico | Guarda prisioneiros para pedir resgate. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-dungeon-2.png` | Masmorra — estágio 2 | 256 × 298 | isométrico | Guarda prisioneiros para pedir resgate. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-dungeon-3.png` | Masmorra — estágio 3 | 256 × 298 | isométrico | Guarda prisioneiros para pedir resgate. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-market-1.png` | Mercado — estágio 1 | 256 × 298 | isométrico | Troca recursos com taxa e envia caravanas. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-market-2.png` | Mercado — estágio 2 | 256 × 298 | isométrico | Troca recursos com taxa e envia caravanas. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-market-3.png` | Mercado — estágio 3 | 256 × 298 | isométrico | Troca recursos com taxa e envia caravanas. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-tavern-1.png` | Taverna — estágio 1 | 256 × 298 | isométrico | Contrata espiões, heróis e mercenários; contraespionagem. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-tavern-2.png` | Taverna — estágio 2 | 256 × 298 | isométrico | Contrata espiões, heróis e mercenários; contraespionagem. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-tavern-3.png` | Taverna — estágio 3 | 256 × 298 | isométrico | Contrata espiões, heróis e mercenários; contraespionagem. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-chapel-1.png` | Capela — estágio 1 | 256 × 298 | isométrico | Felicidade, moral e cultura. Usa cera para velas, se houver. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-chapel-2.png` | Capela — estágio 2 | 256 × 298 | isométrico | Felicidade, moral e cultura. Usa cera para velas, se houver. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-chapel-3.png` | Capela — estágio 3 | 256 × 298 | isométrico | Felicidade, moral e cultura. Usa cera para velas, se houver. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-library-1.png` | Biblioteca — estágio 1 | 256 × 298 | isométrico | Gera pontos de pesquisa. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. |
| `construcao-library-2.png` | Biblioteca — estágio 2 | 256 × 298 | isométrico | Gera pontos de pesquisa. Ocupa 2×2 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-library-3.png` | Biblioteca — estágio 3 | 256 × 298 | isométrico | Gera pontos de pesquisa. Ocupa 2×2 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-well-1.png` | Poço — estágio 1 | 128 × 204 | isométrico | Reduz incêndios e doenças. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-well-2.png` | Poço — estágio 2 | 128 × 204 | isométrico | Reduz incêndios e doenças. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-well-3.png` | Poço — estágio 3 | 128 × 204 | isométrico | Reduz incêndios e doenças. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-port-1.png` | Porto — estágio 1 | 384 × 392 | isométrico | Pesca no mar e comércio. Só na costa. Ocupa 3×3 casas. Estágio 1: madeira e palha, simples. |
| `construcao-port-2.png` | Porto — estágio 2 | 384 × 392 | isométrico | Pesca no mar e comércio. Só na costa. Ocupa 3×3 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-port-3.png` | Porto — estágio 3 | 384 × 392 | isométrico | Pesca no mar e comércio. Só na costa. Ocupa 3×3 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-statue-1.png` | Estátua — estágio 1 | 128 × 204 | isométrico | Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-statue-2.png` | Estátua — estágio 2 | 128 × 204 | isométrico | Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-statue-3.png` | Estátua — estágio 3 | 128 × 204 | isométrico | Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |
| `construcao-garden-1.png` | Jardim — estágio 1 | 128 × 204 | isométrico | Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. |
| `construcao-garden-2.png` | Jardim — estágio 2 | 128 × 204 | isométrico | Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 2: pedra e telhas, mais alta. |
| `construcao-garden-3.png` | Jardim — estágio 3 | 128 × 204 | isométrico | Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 3: imponente, com detalhes e bandeiras. |

## Andaimes de obra (3)

Aparecem enquanto uma construção é erguida ou melhorada.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `andaime-1.png` | Andaime 1×1 | 128 × 174 | isométrico | Andaime de madeira com blocos de pedra no chão, para construções de 1×1 casas em obra. |
| `andaime-2.png` | Andaime 2×2 | 256 × 238 | isométrico | Andaime de madeira com blocos de pedra no chão, para construções de 2×2 casas em obra. |
| `andaime-3.png` | Andaime 3×3 | 384 × 302 | isométrico | Andaime de madeira com blocos de pedra no chão, para construções de 3×3 casas em obra. |

## Chão e decoração do assentamento (7)

Ladrilhos isométricos de 128 × 64 px que se repetem sem emenda.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `chao-grama.png` | Grama dentro do assentamento | 128 × 64 | isométrico | Grama dentro do assentamento. Losango que se repete sem emenda. |
| `chao-terra.png` | Terra batida (caminhos) | 128 × 64 | isométrico | Terra batida (caminhos). Losango que se repete sem emenda. |
| `chao-pavimento.png` | Pavimento de pedra (perto da Torre) | 128 × 64 | isométrico | Pavimento de pedra (perto da Torre). Losango que se repete sem emenda. |
| `chao-bairro.png` | Chão dos bairros especializados da capital | 128 × 64 | isométrico | Chão dos bairros especializados da capital. Losango que se repete sem emenda. |
| `decoracao-arvore.png` | Árvore | 128 × 128 | isométrico | Árvore decorativa do lado de fora da muralha. |
| `decoracao-arbusto.png` | Arbusto | 128 × 128 | isométrico | Arbusto decorativa do lado de fora da muralha. |
| `decoracao-pedras.png` | Pedras | 128 × 128 | isométrico | Pedras decorativa do lado de fora da muralha. |

## Muralha, portão e fosso (31)

Peças isométricas que se encaixam em volta do terreno do assentamento. 3 estágios e versão danificada.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `muralha-reta-a-1.png` | Muralha reta (direção ↘) — estágio 1 | 128 × 154 | isométrico | Muralha reta (direção ↘). Ocupa uma casa do contorno. |
| `muralha-reta-a-1-danificada.png` | Muralha reta (direção ↘) — estágio 1 (danificada) | 128 × 154 | isométrico | Muralha reta (direção ↘). Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-reta-a-2.png` | Muralha reta (direção ↘) — estágio 2 | 128 × 154 | isométrico | Muralha reta (direção ↘). Ocupa uma casa do contorno. |
| `muralha-reta-a-2-danificada.png` | Muralha reta (direção ↘) — estágio 2 (danificada) | 128 × 154 | isométrico | Muralha reta (direção ↘). Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-reta-a-3.png` | Muralha reta (direção ↘) — estágio 3 | 128 × 154 | isométrico | Muralha reta (direção ↘). Ocupa uma casa do contorno. |
| `muralha-reta-a-3-danificada.png` | Muralha reta (direção ↘) — estágio 3 (danificada) | 128 × 154 | isométrico | Muralha reta (direção ↘). Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-reta-b-1.png` | Muralha reta (direção ↙) — estágio 1 | 128 × 154 | isométrico | Muralha reta (direção ↙). Ocupa uma casa do contorno. |
| `muralha-reta-b-1-danificada.png` | Muralha reta (direção ↙) — estágio 1 (danificada) | 128 × 154 | isométrico | Muralha reta (direção ↙). Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-reta-b-2.png` | Muralha reta (direção ↙) — estágio 2 | 128 × 154 | isométrico | Muralha reta (direção ↙). Ocupa uma casa do contorno. |
| `muralha-reta-b-2-danificada.png` | Muralha reta (direção ↙) — estágio 2 (danificada) | 128 × 154 | isométrico | Muralha reta (direção ↙). Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-reta-b-3.png` | Muralha reta (direção ↙) — estágio 3 | 128 × 154 | isométrico | Muralha reta (direção ↙). Ocupa uma casa do contorno. |
| `muralha-reta-b-3-danificada.png` | Muralha reta (direção ↙) — estágio 3 (danificada) | 128 × 154 | isométrico | Muralha reta (direção ↙). Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-canto-1.png` | Canto da muralha — estágio 1 | 128 × 154 | isométrico | Canto da muralha. Ocupa uma casa do contorno. |
| `muralha-canto-1-danificada.png` | Canto da muralha — estágio 1 (danificada) | 128 × 154 | isométrico | Canto da muralha. Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-canto-2.png` | Canto da muralha — estágio 2 | 128 × 154 | isométrico | Canto da muralha. Ocupa uma casa do contorno. |
| `muralha-canto-2-danificada.png` | Canto da muralha — estágio 2 (danificada) | 128 × 154 | isométrico | Canto da muralha. Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-canto-3.png` | Canto da muralha — estágio 3 | 128 × 154 | isométrico | Canto da muralha. Ocupa uma casa do contorno. |
| `muralha-canto-3-danificada.png` | Canto da muralha — estágio 3 (danificada) | 128 × 154 | isométrico | Canto da muralha. Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-torre-1.png` | Torre da muralha — estágio 1 | 128 × 154 | isométrico | Torre da muralha. Ocupa uma casa do contorno. |
| `muralha-torre-1-danificada.png` | Torre da muralha — estágio 1 (danificada) | 128 × 154 | isométrico | Torre da muralha. Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-torre-2.png` | Torre da muralha — estágio 2 | 128 × 154 | isométrico | Torre da muralha. Ocupa uma casa do contorno. |
| `muralha-torre-2-danificada.png` | Torre da muralha — estágio 2 (danificada) | 128 × 154 | isométrico | Torre da muralha. Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-torre-3.png` | Torre da muralha — estágio 3 | 128 × 154 | isométrico | Torre da muralha. Ocupa uma casa do contorno. |
| `muralha-torre-3-danificada.png` | Torre da muralha — estágio 3 (danificada) | 128 × 154 | isométrico | Torre da muralha. Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-portao-1.png` | Portão — estágio 1 | 128 × 154 | isométrico | Portão. Ocupa uma casa do contorno. |
| `muralha-portao-1-danificada.png` | Portão — estágio 1 (danificada) | 128 × 154 | isométrico | Portão. Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-portao-2.png` | Portão — estágio 2 | 128 × 154 | isométrico | Portão. Ocupa uma casa do contorno. |
| `muralha-portao-2-danificada.png` | Portão — estágio 2 (danificada) | 128 × 154 | isométrico | Portão. Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-portao-3.png` | Portão — estágio 3 | 128 × 154 | isométrico | Portão. Ocupa uma casa do contorno. |
| `muralha-portao-3-danificada.png` | Portão — estágio 3 (danificada) | 128 × 154 | isométrico | Portão. Ocupa uma casa do contorno. Versão com rachaduras e pedras caídas. |
| `muralha-fosso.png` | Fosso com água | 128 × 154 | isométrico | Fosso com água. Ocupa uma casa do contorno. |

## Terreno do mapa-múndi (15)

Ladrilhos isométricos de 128 × 64 px (relevo e árvores podem ser mais altos, com a base embaixo).

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `terreno-mar.png` | Mar | 128 × 64 | isométrico | Mar. Casa do mapa-múndi. |
| `terreno-grama.png` | Campo de grama | 128 × 64 | isométrico | Campo de grama. Casa do mapa-múndi. |
| `terreno-terra.png` | Terra | 128 × 64 | isométrico | Terra. Casa do mapa-múndi. |
| `terreno-areia.png` | Areia da praia | 128 × 64 | isométrico | Areia da praia. Casa do mapa-múndi. |
| `terreno-neve.png` | Neve | 128 × 64 | isométrico | Neve. Casa do mapa-múndi. |
| `terreno-colina.png` | Colina | 128 × 144 | isométrico | Colina. Casa do mapa-múndi. |
| `terreno-montanha.png` | Montanha (intransponível) | 128 × 144 | isométrico | Montanha (intransponível). Casa do mapa-múndi. |
| `terreno-rio.png` | Rio | 128 × 64 | isométrico | Rio. Casa do mapa-múndi. |
| `terreno-vau.png` | Vau (travessia rasa do rio) | 128 × 64 | isométrico | Vau (travessia rasa do rio). Casa do mapa-múndi. |
| `terreno-floresta.png` | Floresta densa | 128 × 144 | isométrico | Floresta densa. Casa do mapa-múndi. |
| `terreno-bosque.png` | Bosque | 128 × 144 | isométrico | Bosque. Casa do mapa-múndi. |
| `terreno-pantano.png` | Pântano | 128 × 64 | isométrico | Pântano. Casa do mapa-múndi. |
| `terreno-estrada.png` | Estrada | 128 × 64 | isométrico | Estrada. Casa do mapa-múndi. |
| `terreno-ponte.png` | Ponte sobre o rio | 128 × 64 | isométrico | Ponte sobre o rio. Casa do mapa-múndi. |
| `terreno-costa.png` | Transição areia → mar | 128 × 64 | isométrico | Transição areia → mar. Casa do mapa-múndi. |

## Depósitos de recursos no mapa (12)

Ícones de 128 × 128 px vistos levemente de cima, com versão esgotada.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `deposito-iron.png` | Ferro | 128 × 128 | isométrico | Depósito de ferro no mapa. |
| `deposito-iron-esgotado.png` | Ferro (esgotado) | 128 × 128 | isométrico | Depósito de ferro no mapa, já esgotado. |
| `deposito-stone.png` | Pedra | 128 × 128 | isométrico | Depósito de pedra no mapa. |
| `deposito-stone-esgotado.png` | Pedra (esgotado) | 128 × 128 | isométrico | Depósito de pedra no mapa, já esgotado. |
| `deposito-gold.png` | Ouro | 128 × 128 | isométrico | Depósito de ouro no mapa. |
| `deposito-gold-esgotado.png` | Ouro (esgotado) | 128 × 128 | isométrico | Depósito de ouro no mapa, já esgotado. |
| `deposito-diamond.png` | Diamante | 128 × 128 | isométrico | Depósito de diamante no mapa. |
| `deposito-diamond-esgotado.png` | Diamante (esgotado) | 128 × 128 | isométrico | Depósito de diamante no mapa, já esgotado. |
| `deposito-fertile.png` | Solo fértil | 128 × 128 | isométrico | Depósito de solo fértil no mapa. |
| `deposito-fertile-esgotado.png` | Solo fértil (esgotado) | 128 × 128 | isométrico | Depósito de solo fértil no mapa, já esgotado. |
| `deposito-fish.png` | Cardume (pesca) | 128 × 128 | isométrico | Depósito de cardume (pesca) no mapa. |
| `deposito-fish-esgotado.png` | Cardume (pesca) (esgotado) | 128 × 128 | isométrico | Depósito de cardume (pesca) no mapa, já esgotado. |

## Assentamentos e acampamentos no mapa (12)

Ícones de 128 × 128 px. Deixe uma bandeira cinza clara: o jogo pinta a cor de cada reino por cima.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `mapa-capital.png` | Capital | 128 × 128 | isométrico | Capital visto no mapa-múndi. |
| `mapa-city.png` | Cidade | 128 × 128 | isométrico | Cidade visto no mapa-múndi. |
| `mapa-village.png` | Aldeia | 128 × 128 | isométrico | Aldeia visto no mapa-múndi. |
| `mapa-castle.png` | Castelo | 128 × 128 | isométrico | Castelo visto no mapa-múndi. |
| `mapa-outpost.png` | Entreposto | 128 × 128 | isométrico | Entreposto visto no mapa-múndi. |
| `mapa-camp.png` | Acampamento de bandidos | 128 × 128 | isométrico | Acampamento de bandidos visto no mapa-múndi. |
| `mapa-camp-ruin.png` | Acampamento de bandidos em ruínas | 128 × 128 | isométrico | Acampamento de bandidos em ruínas visto no mapa-múndi. |
| `mapa-tribe1.png` | Acampamento tribal (nível 1) | 128 × 128 | isométrico | Acampamento tribal (nível 1) visto no mapa-múndi. |
| `mapa-tribe2.png` | Aldeia tribal (nível 2) | 128 × 128 | isométrico | Aldeia tribal (nível 2) visto no mapa-múndi. |
| `mapa-tribe3.png` | Fortaleza tribal (nível 3) | 128 × 128 | isométrico | Fortaleza tribal (nível 3) visto no mapa-múndi. |
| `mapa-tribe4.png` | Confederação tribal (nível 4) | 128 × 128 | isométrico | Confederação tribal (nível 4) visto no mapa-múndi. |
| `mapa-batalha.png` | Batalha em andamento | 128 × 128 | plano | Marca de batalha (espadas cruzadas, poeira) sobre o local do combate. |

## Unidades em viagem no mapa (6)

Sprites de 64 × 64 px (carroças, mensageiros, navios...).

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `viajante-wagon.png` | Carroça de recursos | 64 × 64 | isométrico | Carroça de recursos se movendo pelo mapa. |
| `viajante-caravan.png` | Caravana de comércio | 64 × 64 | isométrico | Caravana de comércio se movendo pelo mapa. |
| `viajante-messenger.png` | Mensageiro a cavalo | 64 × 64 | isométrico | Mensageiro a cavalo se movendo pelo mapa. |
| `viajante-colonists.png` | Grupo de colonos | 64 × 64 | isométrico | Grupo de colonos se movendo pelo mapa. |
| `viajante-spy.png` | Espião encapuzado | 64 × 64 | isométrico | Espião encapuzado se movendo pelo mapa. |
| `viajante-ship.png` | Navio da horda | 64 × 64 | isométrico | Navio da horda se movendo pelo mapa. |

## Soldados (retrato e boneco de batalha) (42)

Retrato de corpo inteiro 256 × 256 px e boneco de 64 × 64 px usado no mapa e nas batalhas.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `retrato-spearman.png` | Lanceiro (retrato) | 256 × 256 | plano | Infantaria barata com lança longa. Segura a cavalaria. Retrato de corpo inteiro. |
| `boneco-spearman.png` | Lanceiro (boneco) | 64 × 64 | isométrico | Lanceiro pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-archer.png` | Arqueiro (retrato) | 256 × 256 | plano | Atira de longe. Desfaz formações de infantaria. Retrato de corpo inteiro. |
| `boneco-archer.png` | Arqueiro (boneco) | 64 × 64 | isométrico | Arqueiro pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-knight.png` | Cavaleiro (retrato) | 256 × 256 | plano | Carga veloz que esmaga arqueiros. Retrato de corpo inteiro. |
| `boneco-knight.png` | Cavaleiro (boneco) | 64 × 64 | isométrico | Cavaleiro pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-shieldman.png` | Escudeiro (retrato) | 256 × 256 | plano | Parede de escudos: aguenta flechas. Retrato de corpo inteiro. |
| `boneco-shieldman.png` | Escudeiro (boneco) | 64 × 64 | isométrico | Escudeiro pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-crossbowman.png` | Besteiro (retrato) | 256 × 256 | plano | Virotes atravessam armaduras e escudos. Retrato de corpo inteiro. |
| `boneco-crossbowman.png` | Besteiro (boneco) | 64 × 64 | isométrico | Besteiro pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-scout.png` | Batedor (retrato) | 256 × 256 | plano | Explora a névoa, caça carroças e mensageiros. Não luta bem. Retrato de corpo inteiro. |
| `boneco-scout.png` | Batedor (boneco) | 64 × 64 | isométrico | Batedor pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-horseArcher.png` | Arqueiro montado (retrato) | 256 × 256 | plano | Atira a cavalo e foge antes do contato. Retrato de corpo inteiro. |
| `boneco-horseArcher.png` | Arqueiro montado (boneco) | 64 × 64 | isométrico | Arqueiro montado pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-heavyKnight.png` | Cavaleiro pesado (retrato) | 256 × 256 | plano | Aço da cabeça aos cascos. Caro e lento, mas quase imparável. Retrato de corpo inteiro. |
| `boneco-heavyKnight.png` | Cavaleiro pesado (boneco) | 64 × 64 | isométrico | Cavaleiro pesado pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-ram.png` | Aríete (retrato) | 256 × 256 | plano | Derruba portões. Retrato de corpo inteiro. |
| `boneco-ram.png` | Aríete (boneco) | 64 × 64 | isométrico | Aríete pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-catapult.png` | Catapulta (retrato) | 256 × 256 | plano | Arremessa pedras na muralha e nas construções. Retrato de corpo inteiro. |
| `boneco-catapult.png` | Catapulta (boneco) | 64 × 64 | isométrico | Catapulta pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-ladder.png` | Escada de cerco (retrato) | 256 × 256 | plano | Cada escada leva até 10 soldados por cima da muralha, enfraquecidos. Retrato de corpo inteiro. |
| `boneco-ladder.png` | Escada de cerco (boneco) | 64 × 64 | isométrico | Escada de cerco pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-siegeTower.png` | Torre de cerco (retrato) | 256 × 256 | plano | Leva até 25 soldados por cima da muralha sem penalidade. Bloqueada pelo fosso. Retrato de corpo inteiro. |
| `boneco-siegeTower.png` | Torre de cerco (boneco) | 64 × 64 | isométrico | Torre de cerco pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-axeman.png` | Guerreiro do machado (retrato) | 256 × 256 | plano | Guerreiro tribal que racha escudos. Retrato de corpo inteiro. |
| `boneco-axeman.png` | Guerreiro do machado (boneco) | 64 × 64 | isométrico | Guerreiro do machado pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-hunter.png` | Arqueiro de caça (retrato) | 256 × 256 | plano | Caçador tribal com arco curto. Retrato de corpo inteiro. |
| `boneco-hunter.png` | Arqueiro de caça (boneco) | 64 × 64 | isométrico | Arqueiro de caça pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-tribalRider.png` | Cavaleiro bárbaro (retrato) | 256 × 256 | plano | Ginete tribal rápido e sem armadura. Retrato de corpo inteiro. |
| `boneco-tribalRider.png` | Cavaleiro bárbaro (boneco) | 64 × 64 | isométrico | Cavaleiro bárbaro pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-brigand.png` | Bandido (retrato) | 256 × 256 | plano | Salteador de estrada mal armado. Retrato de corpo inteiro. |
| `boneco-brigand.png` | Bandido (boneco) | 64 × 64 | isométrico | Bandido pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-northman.png` | Nórdico (retrato) | 256 × 256 | plano | Infantaria pesada das hordas do mar. Retrato de corpo inteiro. |
| `boneco-northman.png` | Nórdico (boneco) | 64 × 64 | isométrico | Nórdico pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-steppeRider.png` | Cavaleiro das estepes (retrato) | 256 × 256 | plano | Ginete veloz das hordas, mestre das incursões. Retrato de corpo inteiro. |
| `boneco-steppeRider.png` | Cavaleiro das estepes (boneco) | 64 × 64 | isométrico | Cavaleiro das estepes pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-mercenary.png` | Mercenário (retrato) | 256 × 256 | plano | Soldado de aluguel bem equipado. Retrato de corpo inteiro. |
| `boneco-mercenary.png` | Mercenário (boneco) | 64 × 64 | isométrico | Mercenário pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-warlord.png` | Chefe da horda (retrato) | 256 × 256 | plano | Comandante temido que vem a cada cinco ondas. Retrato de corpo inteiro. |
| `boneco-warlord.png` | Chefe da horda (boneco) | 64 × 64 | isométrico | Chefe da horda pequeno para o mapa e as batalhas, virado para a direita. |
| `retrato-militia.png` | Miliciano (retrato) | 256 × 256 | plano | Cidadão armado às pressas para defender as muralhas. Retrato de corpo inteiro. |
| `boneco-militia.png` | Miliciano (boneco) | 64 × 64 | isométrico | Miliciano pequeno para o mapa e as batalhas, virado para a direita. |

## Heróis (8)

Retratos de 256 × 256 px do peito para cima.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `heroi-1.png` | Herói 1 | 256 × 256 | plano | Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres. |
| `heroi-2.png` | Herói 2 | 256 × 256 | plano | Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres. |
| `heroi-3.png` | Herói 3 | 256 × 256 | plano | Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres. |
| `heroi-4.png` | Herói 4 | 256 × 256 | plano | Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres. |
| `heroi-5.png` | Herói 5 | 256 × 256 | plano | Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres. |
| `heroi-6.png` | Herói 6 | 256 × 256 | plano | Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres. |
| `heroi-7.png` | Herói 7 | 256 × 256 | plano | Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres. |
| `heroi-8.png` | Herói 8 | 256 × 256 | plano | Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres. |

## Efeitos (8)

Sprites de 64 × 64 px para batalhas e eventos.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `efeito-fogo.png` | Fogo | 64 × 64 | plano | Fogo. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar. |
| `efeito-fumaca.png` | Fumaça | 64 × 64 | plano | Fumaça. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar. |
| `efeito-poeira.png` | Poeira de marcha | 64 × 64 | plano | Poeira de marcha. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar. |
| `efeito-flecha.png` | Flecha | 64 × 64 | plano | Flecha. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar. |
| `efeito-impacto.png` | Impacto na muralha | 64 × 64 | plano | Impacto na muralha. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar. |
| `efeito-neve.png` | Neve caindo | 64 × 64 | plano | Neve caindo. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar. |
| `efeito-chuva.png` | Chuva | 64 × 64 | plano | Chuva. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar. |
| `efeito-batalha.png` | Choque de batalha | 64 × 64 | plano | Choque de batalha. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar. |

## Ilustrações (5)

Imagens grandes para telas especiais.

| Arquivo | O que é | Tamanho | Estilo | Descrição |
|---|---|---|---|---|
| `ilustracao-titulo.png` | Tela de abertura: o castelo ao amanhecer | 768 × 432 | plano | Tela de abertura: o castelo ao amanhecer. |
| `ilustracao-vitoria.png` | Vitória numa batalha | 768 × 432 | plano | Vitória numa batalha. |
| `ilustracao-derrota.png` | Derrota (castelo em chamas, fumaça) | 768 × 432 | plano | Derrota (castelo em chamas, fumaça). |
| `ilustracao-imperador.png` | Coroação do Imperador do Continente X | 768 × 432 | plano | Coroação do Imperador do Continente X. |
| `ilustracao-carta-secreta.png` | Mensagem secreta do Continente Y (navio ao luar) | 768 × 432 | plano | Mensagem secreta do Continente Y (navio ao luar). |
