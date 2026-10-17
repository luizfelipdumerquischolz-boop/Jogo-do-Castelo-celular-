# Coroa de Pedra — lista de imagens

Total: **402 imagens** em 18 grupos. Esta lista é gerada pelo próprio jogo (`npm run artes`), então nunca fica desatualizada.

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
| Sombras | 7 |
| Chão dos terrenos das construções | 9 |
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
| **Total** | **402** |

## Interface (botões, barras e painéis) (12)

Peças da tela. Botões e painéis são esticados pelo jogo: deixe as bordas decoradas e o miolo liso.

1. **Botão principal** — `ui-botao.png` · 192 × 72 px · plano  
   Botão verde de ação (Construir, Melhorar, Recrutar). Esticado na largura: bordas arredondadas com moldura, miolo liso.
2. **Botão de perigo** — `ui-botao-perigo.png` · 192 × 72 px · plano  
   Botão vermelho (Atacar, Demolir).
3. **Botão neutro** — `ui-botao-neutro.png` · 192 × 72 px · plano  
   Botão marrom para ações secundárias (Cancelar, Voltar).
4. **Botão desativado** — `ui-botao-desativado.png` · 192 × 72 px · plano  
   Botão acinzentado quando a ação não está disponível.
5. **Barra superior** — `ui-barra-topo.png` · 512 × 96 px · plano  
   Faixa de madeira escura atrás dos recursos no topo da tela. Repete na horizontal.
6. **Barra de navegação** — `ui-barra-inferior.png` · 512 × 128 px · plano  
   Faixa de madeira atrás das abas na parte de baixo. Repete na horizontal.
7. **Painel de pergaminho** — `ui-painel.png` · 512 × 512 px · plano  
   Fundo dos painéis que sobem de baixo (informações de construções, exércitos). Textura de pergaminho que se repete, com borda escura de 16 px.
8. **Fundo das telas de menu** — `ui-fundo.png` · 512 × 512 px · plano  
   Couro ou madeira escura atrás das listas (cartas, pesquisa, diplomacia). Repete sem emenda.
9. **Moldura de retrato** — `ui-moldura-retrato.png` · 256 × 256 px · plano  
   Moldura dourada redonda para retratos de heróis e soldados. Miolo transparente.
10. **Selo de cera** — `ui-selo.png` · 96 × 96 px · plano  
   Selo vermelho das cartas não lidas.
11. **Papel de carta** — `ui-carta.png` · 512 × 640 px · plano  
   Folha de pergaminho para ler cartas. Bordas levemente queimadas.
12. **Ícone do aplicativo** — `ui-icone-app.png` · 1024 × 1024 px · plano  
   Ícone que aparece na tela inicial do celular. Castelo ou coroa de pedra, sem texto, fundo escuro.

## Ícones dos botões e abas (31)

Ícones planos, sem perspectiva, legíveis em 24 px. Fundo transparente.

1. **Aba Reino (mapa)** — `icone-ui-reino.png` · 96 × 96 px · plano  
   Ícone do botão "Aba Reino (mapa)".
2. **Aba Cidade** — `icone-ui-cidade.png` · 96 × 96 px · plano  
   Ícone do botão "Aba Cidade".
3. **Aba Exércitos** — `icone-ui-exercitos.png` · 96 × 96 px · plano  
   Ícone do botão "Aba Exércitos".
4. **Aba Cartas** — `icone-ui-cartas.png` · 96 × 96 px · plano  
   Ícone do botão "Aba Cartas".
5. **Aba Mais** — `icone-ui-mais.png` · 96 × 96 px · plano  
   Ícone do botão "Aba Mais".
6. **Construir** — `icone-ui-construir.png` · 96 × 96 px · plano  
   Ícone do botão "Construir".
7. **Melhorar** — `icone-ui-melhorar.png` · 96 × 96 px · plano  
   Ícone do botão "Melhorar".
8. **Mover construção** — `icone-ui-mover.png` · 96 × 96 px · plano  
   Ícone do botão "Mover construção".
9. **Demolir** — `icone-ui-demolir.png` · 96 × 96 px · plano  
   Ícone do botão "Demolir".
10. **Atacar / conquistar** — `icone-ui-atacar.png` · 96 × 96 px · plano  
   Ícone do botão "Atacar / conquistar".
11. **Saquear** — `icone-ui-saquear.png` · 96 × 96 px · plano  
   Ícone do botão "Saquear".
12. **Espionar** — `icone-ui-espionar.png` · 96 × 96 px · plano  
   Ícone do botão "Espionar".
13. **Defender** — `icone-ui-defender.png` · 96 × 96 px · plano  
   Ícone do botão "Defender".
14. **Voltar para casa** — `icone-ui-voltar.png` · 96 × 96 px · plano  
   Ícone do botão "Voltar para casa".
15. **Fechar painel** — `icone-ui-fechar.png` · 96 × 96 px · plano  
   Ícone do botão "Fechar painel".
16. **Pesquisa** — `icone-ui-pesquisa.png` · 96 × 96 px · plano  
   Ícone do botão "Pesquisa".
17. **Diplomacia** — `icone-ui-diplomacia.png` · 96 × 96 px · plano  
   Ícone do botão "Diplomacia".
18. **Taverna** — `icone-ui-taverna.png` · 96 × 96 px · plano  
   Ícone do botão "Taverna".
19. **Heróis** — `icone-ui-herois.png` · 96 × 96 px · plano  
   Ícone do botão "Heróis".
20. **Missões** — `icone-ui-missoes.png` · 96 × 96 px · plano  
   Ícone do botão "Missões".
21. **Mercado** — `icone-ui-mercado.png` · 96 × 96 px · plano  
   Ícone do botão "Mercado".
22. **Rotas e carroças** — `icone-ui-rotas.png` · 96 × 96 px · plano  
   Ícone do botão "Rotas e carroças".
23. **Colonos** — `icone-ui-colonos.png` · 96 × 96 px · plano  
   Ícone do botão "Colonos".
24. **Relatórios de batalha** — `icone-ui-relatorios.png` · 96 × 96 px · plano  
   Ícone do botão "Relatórios de batalha".
25. **Crônica do reino** — `icone-ui-cronica.png` · 96 × 96 px · plano  
   Ícone do botão "Crônica do reino".
26. **Lista de artes** — `icone-ui-artes.png` · 96 × 96 px · plano  
   Ícone do botão "Lista de artes".
27. **Ajuda** — `icone-ui-ajuda.png` · 96 × 96 px · plano  
   Ícone do botão "Ajuda".
28. **Novo jogo** — `icone-ui-novo.png` · 96 × 96 px · plano  
   Ícone do botão "Novo jogo".
29. **Zoom do mapa** — `icone-ui-zoom.png` · 96 × 96 px · plano  
   Ícone do botão "Zoom do mapa".
30. **Fundar assentamento** — `icone-ui-fundar.png` · 96 × 96 px · plano  
   Ícone do botão "Fundar assentamento".
31. **Recrutar** — `icone-ui-recrutar.png` · 96 × 96 px · plano  
   Ícone do botão "Recrutar".

## Ícones de recursos, alimentos e itens (39)

Ícones planos de 128 × 128 px, sem perspectiva, bem legíveis em tamanho pequeno.

1. **Madeira** — `icone-wood.png` · 128 × 128 px · plano  
   Ícone de madeira.
2. **Pedra** — `icone-stone.png` · 128 × 128 px · plano  
   Ícone de pedra.
3. **Ferro** — `icone-iron.png` · 128 × 128 px · plano  
   Ícone de ferro.
4. **Diamante** — `icone-diamond.png` · 128 × 128 px · plano  
   Ícone de diamante.
5. **Trigo** — `icone-wheat.png` · 128 × 128 px · plano  
   Ícone de trigo.
6. **Aveia** — `icone-oats.png` · 128 × 128 px · plano  
   Ícone de aveia.
7. **Cevada** — `icone-barley.png` · 128 × 128 px · plano  
   Ícone de cevada.
8. **Uva** — `icone-grapes.png` · 128 × 128 px · plano  
   Ícone de uva.
9. **Gado** — `icone-cattle.png` · 128 × 128 px · plano  
   Ícone de gado.
10. **Leite** — `icone-milk.png` · 128 × 128 px · plano  
   Ícone de leite.
11. **Lã** — `icone-wool.png` · 128 × 128 px · plano  
   Ícone de lã.
12. **Cera** — `icone-wax.png` · 128 × 128 px · plano  
   Ícone de cera.
13. **Farinha** — `icone-flour.png` · 128 × 128 px · plano  
   Ícone de farinha.
14. **Carvão** — `icone-charcoal.png` · 128 × 128 px · plano  
   Ícone de carvão.
15. **Aço** — `icone-steel.png` · 128 × 128 px · plano  
   Ícone de aço.
16. **Couro** — `icone-leather.png` · 128 × 128 px · plano  
   Ícone de couro.
17. **Tecido** — `icone-cloth.png` · 128 × 128 px · plano  
   Ícone de tecido.
18. **Joias** — `icone-jewels.png` · 128 × 128 px · plano  
   Ícone de joias.
19. **Pão** — `icone-bread.png` · 128 × 128 px · plano  
   Ícone de pão.
20. **Mingau** — `icone-porridge.png` · 128 × 128 px · plano  
   Ícone de mingau.
21. **Carne** — `icone-meat.png` · 128 × 128 px · plano  
   Ícone de carne.
22. **Peixe** — `icone-fish.png` · 128 × 128 px · plano  
   Ícone de peixe.
23. **Ovos** — `icone-eggs.png` · 128 × 128 px · plano  
   Ícone de ovos.
24. **Queijo** — `icone-cheese.png` · 128 × 128 px · plano  
   Ícone de queijo.
25. **Legumes** — `icone-vegetables.png` · 128 × 128 px · plano  
   Ícone de legumes.
26. **Frutas** — `icone-fruit.png` · 128 × 128 px · plano  
   Ícone de frutas.
27. **Cerveja** — `icone-beer.png` · 128 × 128 px · plano  
   Ícone de cerveja.
28. **Vinho** — `icone-wine.png` · 128 × 128 px · plano  
   Ícone de vinho.
29. **Mel** — `icone-honey.png` · 128 × 128 px · plano  
   Ícone de mel.
30. **Arma** — `icone-weapon.png` · 128 × 128 px · plano  
   Ícone de arma.
31. **Armadura** — `icone-armor.png` · 128 × 128 px · plano  
   Ícone de armadura.
32. **Escudo** — `icone-shield.png` · 128 × 128 px · plano  
   Ícone de escudo.
33. **Besta** — `icone-crossbow.png` · 128 × 128 px · plano  
   Ícone de besta.
34. **Arma de aço** — `icone-steelWeapon.png` · 128 × 128 px · plano  
   Ícone de arma de aço.
35. **Armadura de aço** — `icone-steelArmor.png` · 128 × 128 px · plano  
   Ícone de armadura de aço.
36. **Arco** — `icone-bow.png` · 128 × 128 px · plano  
   Ícone de arco.
37. **Cavalo** — `icone-horse.png` · 128 × 128 px · plano  
   Ícone de cavalo.
38. **Estandarte** — `icone-banner.png` · 128 × 128 px · plano  
   Ícone de estandarte.
39. **Ouro** — `icone-gold.png` · 128 × 128 px · plano  
   Pilha de moedas de ouro (tesouro do reino).

## Ícones de status (8)

Ícones planos de 128 × 128 px usados nos painéis (população, felicidade etc.).

1. **População** — `icone-population.png` · 128 × 128 px · plano  
   Ícone de população.
2. **Felicidade** — `icone-happiness.png` · 128 × 128 px · plano  
   Ícone de felicidade.
3. **Saúde** — `icone-health.png` · 128 × 128 px · plano  
   Ícone de saúde.
4. **Moral** — `icone-morale.png` · 128 × 128 px · plano  
   Ícone de moral.
5. **Lealdade** — `icone-loyalty.png` · 128 × 128 px · plano  
   Ícone de lealdade.
6. **Cultura** — `icone-culture.png` · 128 × 128 px · plano  
   Ícone de cultura.
7. **Pesquisa** — `icone-research.png` · 128 × 128 px · plano  
   Ícone de pesquisa.
8. **Tempo / estação** — `icone-time.png` · 128 × 128 px · plano  
   Ícone de tempo / estação.

## Construções (3 estágios cada) (147)

Isométricas 2:1, luz de cima e da esquerda. SÓ a construção e seus objetos: SEM chão, SEM base de terra ou pedra embaixo e SEM sombra (o chão e a sombra são imagens separadas). A ponta da frente das paredes encosta embaixo da imagem, no centro. Estágio 1 = níveis 1–2 (madeira, simples), 2 = níveis 3–4 (pedra), 3 = nível 5 (imponente).

1. **Torre de Menagem — estágio 1** — `construcao-keep-1.png` · 384 × 452 px · isométrico  
   Coração da capital. O nível libera terreno, bairros, construções e o limite de assentamentos. Ocupa 3×3 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
2. **Torre de Menagem — estágio 2** — `construcao-keep-2.png` · 384 × 452 px · isométrico  
   Coração da capital. O nível libera terreno, bairros, construções e o limite de assentamentos. Ocupa 3×3 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
3. **Torre de Menagem — estágio 3** — `construcao-keep-3.png` · 384 × 452 px · isométrico  
   Coração da capital. O nível libera terreno, bairros, construções e o limite de assentamentos. Ocupa 3×3 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
4. **Salão do governador — estágio 1** — `construcao-governor_hall-1.png` · 256 × 298 px · isométrico  
   Sede do cônsul nos outros assentamentos. O nível aumenta terreno, moradia e o bônus da vocação. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
5. **Salão do governador — estágio 2** — `construcao-governor_hall-2.png` · 256 × 298 px · isométrico  
   Sede do cônsul nos outros assentamentos. O nível aumenta terreno, moradia e o bônus da vocação. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
6. **Salão do governador — estágio 3** — `construcao-governor_hall-3.png` · 256 × 298 px · isométrico  
   Sede do cônsul nos outros assentamentos. O nível aumenta terreno, moradia e o bônus da vocação. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
7. **Casa — estágio 1** — `construcao-house-1.png` · 128 × 204 px · isométrico  
   Moradia para 8 cidadãos por nível. Gera impostos. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
8. **Casa — estágio 2** — `construcao-house-2.png` · 128 × 204 px · isométrico  
   Moradia para 8 cidadãos por nível. Gera impostos. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
9. **Casa — estágio 3** — `construcao-house-3.png` · 128 × 204 px · isométrico  
   Moradia para 8 cidadãos por nível. Gera impostos. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
10. **Fazenda de trigo — estágio 1** — `construcao-wheat_farm-1.png` · 256 × 298 px · isométrico  
   Planta trigo. A colheita se concentra no outono. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
11. **Fazenda de trigo — estágio 2** — `construcao-wheat_farm-2.png` · 256 × 298 px · isométrico  
   Planta trigo. A colheita se concentra no outono. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
12. **Fazenda de trigo — estágio 3** — `construcao-wheat_farm-3.png` · 256 × 298 px · isométrico  
   Planta trigo. A colheita se concentra no outono. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
13. **Fazenda de aveia — estágio 1** — `construcao-oat_farm-1.png` · 256 × 298 px · isométrico  
   Planta aveia para mingau e para os cavalos. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
14. **Fazenda de aveia — estágio 2** — `construcao-oat_farm-2.png` · 256 × 298 px · isométrico  
   Planta aveia para mingau e para os cavalos. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
15. **Fazenda de aveia — estágio 3** — `construcao-oat_farm-3.png` · 256 × 298 px · isométrico  
   Planta aveia para mingau e para os cavalos. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
16. **Fazenda de cevada — estágio 1** — `construcao-barley_farm-1.png` · 256 × 298 px · isométrico  
   Planta cevada para a cervejaria. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
17. **Fazenda de cevada — estágio 2** — `construcao-barley_farm-2.png` · 256 × 298 px · isométrico  
   Planta cevada para a cervejaria. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
18. **Fazenda de cevada — estágio 3** — `construcao-barley_farm-3.png` · 256 × 298 px · isométrico  
   Planta cevada para a cervejaria. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
19. **Horta — estágio 1** — `construcao-vegetable_garden-1.png` · 128 × 204 px · isométrico  
   Legumes: o grupo das vitaminas, que protege contra doenças. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
20. **Horta — estágio 2** — `construcao-vegetable_garden-2.png` · 128 × 204 px · isométrico  
   Legumes: o grupo das vitaminas, que protege contra doenças. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
21. **Horta — estágio 3** — `construcao-vegetable_garden-3.png` · 128 × 204 px · isométrico  
   Legumes: o grupo das vitaminas, que protege contra doenças. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
22. **Pomar — estágio 1** — `construcao-orchard-1.png` · 256 × 298 px · isométrico  
   Árvores frutíferas: vitaminas para o povo. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
23. **Pomar — estágio 2** — `construcao-orchard-2.png` · 256 × 298 px · isométrico  
   Árvores frutíferas: vitaminas para o povo. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
24. **Pomar — estágio 3** — `construcao-orchard-3.png` · 256 × 298 px · isométrico  
   Árvores frutíferas: vitaminas para o povo. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
25. **Vinhedo — estágio 1** — `construcao-vineyard-1.png` · 256 × 298 px · isométrico  
   Uvas para o lagar. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
26. **Vinhedo — estágio 2** — `construcao-vineyard-2.png` · 256 × 298 px · isométrico  
   Uvas para o lagar. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
27. **Vinhedo — estágio 3** — `construcao-vineyard-3.png` · 256 × 298 px · isométrico  
   Uvas para o lagar. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
28. **Pasto — estágio 1** — `construcao-pasture-1.png` · 256 × 298 px · isométrico  
   Cria gado e dá leite. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
29. **Pasto — estágio 2** — `construcao-pasture-2.png` · 256 × 298 px · isométrico  
   Cria gado e dá leite. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
30. **Pasto — estágio 3** — `construcao-pasture-3.png` · 256 × 298 px · isométrico  
   Cria gado e dá leite. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
31. **Pasto de ovelhas — estágio 1** — `construcao-sheep_pasture-1.png` · 256 × 298 px · isométrico  
   Ovelhas dão lã para a tecelagem. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
32. **Pasto de ovelhas — estágio 2** — `construcao-sheep_pasture-2.png` · 256 × 298 px · isométrico  
   Ovelhas dão lã para a tecelagem. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
33. **Pasto de ovelhas — estágio 3** — `construcao-sheep_pasture-3.png` · 256 × 298 px · isométrico  
   Ovelhas dão lã para a tecelagem. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
34. **Galinheiro — estágio 1** — `construcao-henhouse-1.png` · 128 × 204 px · isométrico  
   Galinhas botam ovos: proteína barata. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
35. **Galinheiro — estágio 2** — `construcao-henhouse-2.png` · 128 × 204 px · isométrico  
   Galinhas botam ovos: proteína barata. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
36. **Galinheiro — estágio 3** — `construcao-henhouse-3.png` · 128 × 204 px · isométrico  
   Galinhas botam ovos: proteína barata. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
37. **Pescador — estágio 1** — `construcao-fisher-1.png` · 128 × 204 px · isométrico  
   Pesca no rio ou no mar. Precisa de água perto. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
38. **Pescador — estágio 2** — `construcao-fisher-2.png` · 128 × 204 px · isométrico  
   Pesca no rio ou no mar. Precisa de água perto. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
39. **Pescador — estágio 3** — `construcao-fisher-3.png` · 128 × 204 px · isométrico  
   Pesca no rio ou no mar. Precisa de água perto. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
40. **Apiário — estágio 1** — `construcao-apiary-1.png` · 128 × 204 px · isométrico  
   Abelhas dão mel e cera. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
41. **Apiário — estágio 2** — `construcao-apiary-2.png` · 128 × 204 px · isométrico  
   Abelhas dão mel e cera. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
42. **Apiário — estágio 3** — `construcao-apiary-3.png` · 128 × 204 px · isométrico  
   Abelhas dão mel e cera. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
43. **Moinho — estágio 1** — `construcao-mill-1.png` · 256 × 298 px · isométrico  
   Mói o trigo e faz farinha. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
44. **Moinho — estágio 2** — `construcao-mill-2.png` · 256 × 298 px · isométrico  
   Mói o trigo e faz farinha. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
45. **Moinho — estágio 3** — `construcao-mill-3.png` · 256 × 298 px · isométrico  
   Mói o trigo e faz farinha. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
46. **Padaria — estágio 1** — `construcao-bakery-1.png` · 128 × 204 px · isométrico  
   Transforma farinha em pão. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
47. **Padaria — estágio 2** — `construcao-bakery-2.png` · 128 × 204 px · isométrico  
   Transforma farinha em pão. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
48. **Padaria — estágio 3** — `construcao-bakery-3.png` · 128 × 204 px · isométrico  
   Transforma farinha em pão. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
49. **Cozinha comunitária — estágio 1** — `construcao-kitchen-1.png` · 128 × 204 px · isométrico  
   Cozinha aveia e faz mingau. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
50. **Cozinha comunitária — estágio 2** — `construcao-kitchen-2.png` · 128 × 204 px · isométrico  
   Cozinha aveia e faz mingau. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
51. **Cozinha comunitária — estágio 3** — `construcao-kitchen-3.png` · 128 × 204 px · isométrico  
   Cozinha aveia e faz mingau. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
52. **Açougue — estágio 1** — `construcao-butcher-1.png` · 128 × 204 px · isométrico  
   Gado vira carne. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
53. **Açougue — estágio 2** — `construcao-butcher-2.png` · 128 × 204 px · isométrico  
   Gado vira carne. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
54. **Açougue — estágio 3** — `construcao-butcher-3.png` · 128 × 204 px · isométrico  
   Gado vira carne. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
55. **Queijaria — estágio 1** — `construcao-dairy-1.png` · 128 × 204 px · isométrico  
   Leite vira queijo, que dura muito no armazém. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
56. **Queijaria — estágio 2** — `construcao-dairy-2.png` · 128 × 204 px · isométrico  
   Leite vira queijo, que dura muito no armazém. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
57. **Queijaria — estágio 3** — `construcao-dairy-3.png` · 128 × 204 px · isométrico  
   Leite vira queijo, que dura muito no armazém. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
58. **Cervejaria — estágio 1** — `construcao-brewery-1.png` · 256 × 298 px · isométrico  
   Cevada vira cerveja. Moral alta, mas cuidado com a embriaguez. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
59. **Cervejaria — estágio 2** — `construcao-brewery-2.png` · 256 × 298 px · isométrico  
   Cevada vira cerveja. Moral alta, mas cuidado com a embriaguez. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
60. **Cervejaria — estágio 3** — `construcao-brewery-3.png` · 256 × 298 px · isométrico  
   Cevada vira cerveja. Moral alta, mas cuidado com a embriaguez. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
61. **Lagar — estágio 1** — `construcao-winepress-1.png` · 128 × 204 px · isométrico  
   Uva vira vinho. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
62. **Lagar — estágio 2** — `construcao-winepress-2.png` · 128 × 204 px · isométrico  
   Uva vira vinho. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
63. **Lagar — estágio 3** — `construcao-winepress-3.png` · 128 × 204 px · isométrico  
   Uva vira vinho. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
64. **Serraria — estágio 1** — `construcao-sawmill-1.png` · 256 × 298 px · isométrico  
   Lenhadores e serras: madeira. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
65. **Serraria — estágio 2** — `construcao-sawmill-2.png` · 256 × 298 px · isométrico  
   Lenhadores e serras: madeira. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
66. **Serraria — estágio 3** — `construcao-sawmill-3.png` · 256 × 298 px · isométrico  
   Lenhadores e serras: madeira. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
67. **Pedreira — estágio 1** — `construcao-quarry-1.png` · 256 × 298 px · isométrico  
   Corta blocos de pedra. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
68. **Pedreira — estágio 2** — `construcao-quarry-2.png` · 256 × 298 px · isométrico  
   Corta blocos de pedra. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
69. **Pedreira — estágio 3** — `construcao-quarry-3.png` · 256 × 298 px · isométrico  
   Corta blocos de pedra. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
70. **Mina de ferro — estágio 1** — `construcao-iron_mine-1.png` · 256 × 298 px · isométrico  
   Extrai ferro. Só perto de um depósito de ferro. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
71. **Mina de ferro — estágio 2** — `construcao-iron_mine-2.png` · 256 × 298 px · isométrico  
   Extrai ferro. Só perto de um depósito de ferro. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
72. **Mina de ferro — estágio 3** — `construcao-iron_mine-3.png` · 256 × 298 px · isométrico  
   Extrai ferro. Só perto de um depósito de ferro. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
73. **Mina de ouro — estágio 1** — `construcao-gold_mine-1.png` · 256 × 298 px · isométrico  
   Extrai ouro para o tesouro. Só perto de um depósito de ouro. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
74. **Mina de ouro — estágio 2** — `construcao-gold_mine-2.png` · 256 × 298 px · isométrico  
   Extrai ouro para o tesouro. Só perto de um depósito de ouro. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
75. **Mina de ouro — estágio 3** — `construcao-gold_mine-3.png` · 256 × 298 px · isométrico  
   Extrai ouro para o tesouro. Só perto de um depósito de ouro. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
76. **Mina de diamante — estágio 1** — `construcao-diamond_mine-1.png` · 256 × 298 px · isométrico  
   Extrai diamantes. Só perto de um depósito de diamante. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
77. **Mina de diamante — estágio 2** — `construcao-diamond_mine-2.png` · 256 × 298 px · isométrico  
   Extrai diamantes. Só perto de um depósito de diamante. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
78. **Mina de diamante — estágio 3** — `construcao-diamond_mine-3.png` · 256 × 298 px · isométrico  
   Extrai diamantes. Só perto de um depósito de diamante. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
79. **Carvoaria — estágio 1** — `construcao-charcoal_kiln-1.png` · 128 × 204 px · isométrico  
   Queima madeira e faz carvão para a fundição. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
80. **Carvoaria — estágio 2** — `construcao-charcoal_kiln-2.png` · 128 × 204 px · isométrico  
   Queima madeira e faz carvão para a fundição. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
81. **Carvoaria — estágio 3** — `construcao-charcoal_kiln-3.png` · 128 × 204 px · isométrico  
   Queima madeira e faz carvão para a fundição. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
82. **Fundição — estágio 1** — `construcao-foundry-1.png` · 256 × 298 px · isométrico  
   Ferro e carvão viram aço. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
83. **Fundição — estágio 2** — `construcao-foundry-2.png` · 256 × 298 px · isométrico  
   Ferro e carvão viram aço. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
84. **Fundição — estágio 3** — `construcao-foundry-3.png` · 256 × 298 px · isométrico  
   Ferro e carvão viram aço. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
85. **Curtume — estágio 1** — `construcao-tannery-1.png` · 128 × 204 px · isométrico  
   Gado vira couro para escudos e máquinas de cerco. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
86. **Curtume — estágio 2** — `construcao-tannery-2.png` · 128 × 204 px · isométrico  
   Gado vira couro para escudos e máquinas de cerco. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
87. **Curtume — estágio 3** — `construcao-tannery-3.png` · 128 × 204 px · isométrico  
   Gado vira couro para escudos e máquinas de cerco. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
88. **Tecelagem — estágio 1** — `construcao-weaver-1.png` · 256 × 298 px · isométrico  
   Lã vira tecido; tecido vira estandartes. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
89. **Tecelagem — estágio 2** — `construcao-weaver-2.png` · 256 × 298 px · isométrico  
   Lã vira tecido; tecido vira estandartes. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
90. **Tecelagem — estágio 3** — `construcao-weaver-3.png` · 256 × 298 px · isométrico  
   Lã vira tecido; tecido vira estandartes. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
91. **Joalheiro — estágio 1** — `construcao-jeweler-1.png` · 128 × 204 px · isométrico  
   Diamante e ouro viram joias de alto valor. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
92. **Joalheiro — estágio 2** — `construcao-jeweler-2.png` · 128 × 204 px · isométrico  
   Diamante e ouro viram joias de alto valor. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
93. **Joalheiro — estágio 3** — `construcao-jeweler-3.png` · 128 × 204 px · isométrico  
   Diamante e ouro viram joias de alto valor. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
94. **Armazém — estágio 1** — `construcao-storehouse-1.png` · 256 × 298 px · isométrico  
   Aumenta o limite de cada recurso e esconde parte deles dos saqueadores. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
95. **Armazém — estágio 2** — `construcao-storehouse-2.png` · 256 × 298 px · isométrico  
   Aumenta o limite de cada recurso e esconde parte deles dos saqueadores. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
96. **Armazém — estágio 3** — `construcao-storehouse-3.png` · 256 × 298 px · isométrico  
   Aumenta o limite de cada recurso e esconde parte deles dos saqueadores. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
97. **Ferreiro — estágio 1** — `construcao-blacksmith-1.png` · 256 × 298 px · isométrico  
   Forja armas, armaduras, escudos, bestas e itens de aço. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
98. **Ferreiro — estágio 2** — `construcao-blacksmith-2.png` · 256 × 298 px · isométrico  
   Forja armas, armaduras, escudos, bestas e itens de aço. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
99. **Ferreiro — estágio 3** — `construcao-blacksmith-3.png` · 256 × 298 px · isométrico  
   Forja armas, armaduras, escudos, bestas e itens de aço. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
100. **Flecheiro — estágio 1** — `construcao-fletcher-1.png` · 128 × 204 px · isométrico  
   Faz arcos com madeira. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
101. **Flecheiro — estágio 2** — `construcao-fletcher-2.png` · 128 × 204 px · isométrico  
   Faz arcos com madeira. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
102. **Flecheiro — estágio 3** — `construcao-fletcher-3.png` · 128 × 204 px · isométrico  
   Faz arcos com madeira. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
103. **Estábulo — estágio 1** — `construcao-stable-1.png` · 256 × 298 px · isométrico  
   Cria cavalos com aveia. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
104. **Estábulo — estágio 2** — `construcao-stable-2.png` · 256 × 298 px · isométrico  
   Cria cavalos com aveia. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
105. **Estábulo — estágio 3** — `construcao-stable-3.png` · 256 × 298 px · isométrico  
   Cria cavalos com aveia. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
106. **Quartel — estágio 1** — `construcao-barracks-1.png` · 256 × 298 px · isométrico  
   Recruta soldados. O nível acelera o treino. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
107. **Quartel — estágio 2** — `construcao-barracks-2.png` · 256 × 298 px · isométrico  
   Recruta soldados. O nível acelera o treino. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
108. **Quartel — estágio 3** — `construcao-barracks-3.png` · 256 × 298 px · isométrico  
   Recruta soldados. O nível acelera o treino. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
109. **Campo de treino — estágio 1** — `construcao-training_ground-1.png` · 256 × 298 px · isométrico  
   A guarnição ganha experiência sem lutar. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
110. **Campo de treino — estágio 2** — `construcao-training_ground-2.png` · 256 × 298 px · isométrico  
   A guarnição ganha experiência sem lutar. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
111. **Campo de treino — estágio 3** — `construcao-training_ground-3.png` · 256 × 298 px · isométrico  
   A guarnição ganha experiência sem lutar. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
112. **Oficina de cerco — estágio 1** — `construcao-siege_workshop-1.png` · 384 × 392 px · isométrico  
   Constrói aríetes, catapultas, escadas e torres de cerco. Ocupa 3×3 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
113. **Oficina de cerco — estágio 2** — `construcao-siege_workshop-2.png` · 384 × 392 px · isométrico  
   Constrói aríetes, catapultas, escadas e torres de cerco. Ocupa 3×3 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
114. **Oficina de cerco — estágio 3** — `construcao-siege_workshop-3.png` · 384 × 392 px · isométrico  
   Constrói aríetes, catapultas, escadas e torres de cerco. Ocupa 3×3 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
115. **Enfermaria — estágio 1** — `construcao-infirmary-1.png` · 256 × 298 px · isométrico  
   Parte dos soldados derrotados volta ferida em vez de morrer; trata doenças. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
116. **Enfermaria — estágio 2** — `construcao-infirmary-2.png` · 256 × 298 px · isométrico  
   Parte dos soldados derrotados volta ferida em vez de morrer; trata doenças. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
117. **Enfermaria — estágio 3** — `construcao-infirmary-3.png` · 256 × 298 px · isométrico  
   Parte dos soldados derrotados volta ferida em vez de morrer; trata doenças. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
118. **Torre de vigia — estágio 1** — `construcao-watchtower-1.png` · 128 × 234 px · isométrico  
   Avisa ataques mais cedo, revela exércitos e dificulta espiões. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
119. **Torre de vigia — estágio 2** — `construcao-watchtower-2.png` · 128 × 234 px · isométrico  
   Avisa ataques mais cedo, revela exércitos e dificulta espiões. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
120. **Torre de vigia — estágio 3** — `construcao-watchtower-3.png` · 128 × 234 px · isométrico  
   Avisa ataques mais cedo, revela exércitos e dificulta espiões. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
121. **Masmorra — estágio 1** — `construcao-dungeon-1.png` · 256 × 298 px · isométrico  
   Guarda prisioneiros para pedir resgate. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
122. **Masmorra — estágio 2** — `construcao-dungeon-2.png` · 256 × 298 px · isométrico  
   Guarda prisioneiros para pedir resgate. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
123. **Masmorra — estágio 3** — `construcao-dungeon-3.png` · 256 × 298 px · isométrico  
   Guarda prisioneiros para pedir resgate. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
124. **Mercado — estágio 1** — `construcao-market-1.png` · 256 × 298 px · isométrico  
   Troca recursos com taxa e envia caravanas. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
125. **Mercado — estágio 2** — `construcao-market-2.png` · 256 × 298 px · isométrico  
   Troca recursos com taxa e envia caravanas. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
126. **Mercado — estágio 3** — `construcao-market-3.png` · 256 × 298 px · isométrico  
   Troca recursos com taxa e envia caravanas. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
127. **Taverna — estágio 1** — `construcao-tavern-1.png` · 256 × 298 px · isométrico  
   Contrata espiões, heróis e mercenários; contraespionagem. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
128. **Taverna — estágio 2** — `construcao-tavern-2.png` · 256 × 298 px · isométrico  
   Contrata espiões, heróis e mercenários; contraespionagem. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
129. **Taverna — estágio 3** — `construcao-tavern-3.png` · 256 × 298 px · isométrico  
   Contrata espiões, heróis e mercenários; contraespionagem. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
130. **Capela — estágio 1** — `construcao-chapel-1.png` · 256 × 298 px · isométrico  
   Felicidade, moral e cultura. Usa cera para velas, se houver. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
131. **Capela — estágio 2** — `construcao-chapel-2.png` · 256 × 298 px · isométrico  
   Felicidade, moral e cultura. Usa cera para velas, se houver. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
132. **Capela — estágio 3** — `construcao-chapel-3.png` · 256 × 298 px · isométrico  
   Felicidade, moral e cultura. Usa cera para velas, se houver. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
133. **Biblioteca — estágio 1** — `construcao-library-1.png` · 256 × 298 px · isométrico  
   Gera pontos de pesquisa. Ocupa 2×2 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
134. **Biblioteca — estágio 2** — `construcao-library-2.png` · 256 × 298 px · isométrico  
   Gera pontos de pesquisa. Ocupa 2×2 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
135. **Biblioteca — estágio 3** — `construcao-library-3.png` · 256 × 298 px · isométrico  
   Gera pontos de pesquisa. Ocupa 2×2 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
136. **Poço — estágio 1** — `construcao-well-1.png` · 128 × 204 px · isométrico  
   Reduz incêndios e doenças. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
137. **Poço — estágio 2** — `construcao-well-2.png` · 128 × 204 px · isométrico  
   Reduz incêndios e doenças. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
138. **Poço — estágio 3** — `construcao-well-3.png` · 128 × 204 px · isométrico  
   Reduz incêndios e doenças. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
139. **Porto — estágio 1** — `construcao-port-1.png` · 384 × 392 px · isométrico  
   Pesca no mar e comércio. Só na costa. Ocupa 3×3 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
140. **Porto — estágio 2** — `construcao-port-2.png` · 384 × 392 px · isométrico  
   Pesca no mar e comércio. Só na costa. Ocupa 3×3 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
141. **Porto — estágio 3** — `construcao-port-3.png` · 384 × 392 px · isométrico  
   Pesca no mar e comércio. Só na costa. Ocupa 3×3 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
142. **Estátua — estágio 1** — `construcao-statue-1.png` · 128 × 204 px · isométrico  
   Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
143. **Estátua — estágio 2** — `construcao-statue-2.png` · 128 × 204 px · isométrico  
   Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
144. **Estátua — estágio 3** — `construcao-statue-3.png` · 128 × 204 px · isométrico  
   Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.
145. **Jardim — estágio 1** — `construcao-garden-1.png` · 128 × 204 px · isométrico  
   Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 1: madeira e palha, simples. Sem chão e sem sombra.
146. **Jardim — estágio 2** — `construcao-garden-2.png` · 128 × 204 px · isométrico  
   Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 2: pedra e telhas, melhorada. Sem chão e sem sombra.
147. **Jardim — estágio 3** — `construcao-garden-3.png` · 128 × 204 px · isométrico  
   Decoração: felicidade e cultura. Ocupa 1×1 casas. Estágio 3: refinada e imponente. Sem chão e sem sombra.

## Andaimes de obra (3)

Aparecem enquanto uma construção é erguida ou melhorada. Sem chão e sem sombra.

1. **Andaime 1×1** — `andaime-1.png` · 128 × 174 px · isométrico  
   Andaime de madeira com blocos de pedra empilhados, para construções de 1×1 casas em obra. Sem chão e sem sombra.
2. **Andaime 2×2** — `andaime-2.png` · 256 × 238 px · isométrico  
   Andaime de madeira com blocos de pedra empilhados, para construções de 2×2 casas em obra. Sem chão e sem sombra.
3. **Andaime 3×3** — `andaime-3.png` · 384 × 302 px · isométrico  
   Andaime de madeira com blocos de pedra empilhados, para construções de 3×3 casas em obra. Sem chão e sem sombra.

## Sombras (7)

Sombras separadas, colocadas pelo jogo embaixo de cada objeto. Mancha preta suave e semitransparente (cerca de 40%), vista de cima em isométrico, projetada para baixo e para a direita (luz vinda de cima e da esquerda). Sem nenhum objeto, só a sombra.

1. **Sombra de construção 1×1** — `sombra-construcao-1.png` · 128 × 64 px · isométrico  
   Sombra para construções de 1×1 casas: o contorno do losango da base esticado para a direita e para baixo.
2. **Sombra de construção 2×2** — `sombra-construcao-2.png` · 256 × 128 px · isométrico  
   Sombra para construções de 2×2 casas: o contorno do losango da base esticado para a direita e para baixo.
3. **Sombra de construção 3×3** — `sombra-construcao-3.png` · 384 × 192 px · isométrico  
   Sombra para construções de 3×3 casas: o contorno do losango da base esticado para a direita e para baixo.
4. **Sombra de construção alta** — `sombra-alta.png` · 256 × 128 px · isométrico  
   Sombra comprida para torres e construções altas (Torre de Menagem, torre de vigia, capela), projetada bem para a direita.
5. **Sombra de trecho de muralha** — `sombra-muralha.png` · 128 × 64 px · isométrico  
   Faixa de sombra de um trecho de muralha (uma casa).
6. **Sombra de soldado ou viajante** — `sombra-unidade.png` · 64 × 32 px · isométrico  
   Oval pequena de sombra sob soldados, carroças e viajantes.
7. **Sombra de árvore** — `sombra-arvore.png` · 128 × 64 px · isométrico  
   Sombra arredondada e irregular de copa de árvore.

## Chão dos terrenos das construções (9)

Losango isométrico 2:1 que fica embaixo de cada construção, no tamanho exato das casas que ela ocupa. Visto de cima, plano, SEM bloco de terra embaixo, sem objetos e sem sombra. As bordas se misturam suavemente com a grama.

1. **Terra batida 1×1** — `lote-terra-1.png` · 128 × 64 px · isométrico  
   Terra batida sob construções de 1×1 casas.
2. **Terra batida 2×2** — `lote-terra-2.png` · 256 × 128 px · isométrico  
   Terra batida sob construções de 2×2 casas.
3. **Terra batida 3×3** — `lote-terra-3.png` · 384 × 192 px · isométrico  
   Terra batida sob construções de 3×3 casas.
4. **Pavimento de pedra 1×1** — `lote-pavimento-1.png` · 128 × 64 px · isométrico  
   Pavimento de pedra sob construções de 1×1 casas.
5. **Pavimento de pedra 2×2** — `lote-pavimento-2.png` · 256 × 128 px · isométrico  
   Pavimento de pedra sob construções de 2×2 casas.
6. **Pavimento de pedra 3×3** — `lote-pavimento-3.png` · 384 × 192 px · isométrico  
   Pavimento de pedra sob construções de 3×3 casas.
7. **Grama aparada 1×1** — `lote-grama-1.png` · 128 × 64 px · isométrico  
   Grama aparada sob construções de 1×1 casas.
8. **Grama aparada 2×2** — `lote-grama-2.png` · 256 × 128 px · isométrico  
   Grama aparada sob construções de 2×2 casas.
9. **Grama aparada 3×3** — `lote-grama-3.png` · 384 × 192 px · isométrico  
   Grama aparada sob construções de 3×3 casas.

## Chão e decoração do assentamento (7)

Ladrilhos: losango isométrico 2:1 PLANO (sem bloco de terra embaixo, sem bordas desenhadas, sem linhas), que se repete sem emenda. Decorações: só o objeto, sem chão e sem sombra.

1. **Grama dentro do assentamento** — `chao-grama.png` · 128 × 64 px · isométrico  
   Grama dentro do assentamento. Losango que se repete sem emenda.
2. **Terra batida (caminhos)** — `chao-terra.png` · 128 × 64 px · isométrico  
   Terra batida (caminhos). Losango que se repete sem emenda.
3. **Pavimento de pedra (perto da Torre)** — `chao-pavimento.png` · 128 × 64 px · isométrico  
   Pavimento de pedra (perto da Torre). Losango que se repete sem emenda.
4. **Chão dos bairros especializados da capital** — `chao-bairro.png` · 128 × 64 px · isométrico  
   Chão dos bairros especializados da capital. Losango que se repete sem emenda.
5. **Árvore** — `decoracao-arvore.png` · 128 × 128 px · isométrico  
   Árvore decorativa do lado de fora da muralha.
6. **Arbusto** — `decoracao-arbusto.png` · 128 × 128 px · isométrico  
   Arbusto decorativa do lado de fora da muralha.
7. **Pedras** — `decoracao-pedras.png` · 128 × 128 px · isométrico  
   Pedras decorativa do lado de fora da muralha.

## Muralha, portão e fosso (31)

Peças isométricas que se encaixam em volta do terreno do assentamento, sem chão e sem sombra. 3 estágios e versão danificada.

1. **Muralha reta (direção ↘, de cima-esquerda para baixo-direita) — estágio 1** — `muralha-reta-a-1.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↘, de cima-esquerda para baixo-direita). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 1: paliçada de troncos de madeira.
2. **Muralha reta (direção ↘, de cima-esquerda para baixo-direita) — estágio 1 (danificada)** — `muralha-reta-a-1-danificada.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↘, de cima-esquerda para baixo-direita). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 1: paliçada de troncos de madeira. Versão com rachaduras e pedras caídas.
3. **Muralha reta (direção ↘, de cima-esquerda para baixo-direita) — estágio 2** — `muralha-reta-a-2.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↘, de cima-esquerda para baixo-direita). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 2: muro de pedra simples com ameias.
4. **Muralha reta (direção ↘, de cima-esquerda para baixo-direita) — estágio 2 (danificada)** — `muralha-reta-a-2-danificada.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↘, de cima-esquerda para baixo-direita). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 2: muro de pedra simples com ameias. Versão com rachaduras e pedras caídas.
5. **Muralha reta (direção ↘, de cima-esquerda para baixo-direita) — estágio 3** — `muralha-reta-a-3.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↘, de cima-esquerda para baixo-direita). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 3: muro alto de pedra clara, imponente, com ameias e detalhes.
6. **Muralha reta (direção ↘, de cima-esquerda para baixo-direita) — estágio 3 (danificada)** — `muralha-reta-a-3-danificada.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↘, de cima-esquerda para baixo-direita). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 3: muro alto de pedra clara, imponente, com ameias e detalhes. Versão com rachaduras e pedras caídas.
7. **Muralha reta (direção ↙, de cima-direita para baixo-esquerda) — estágio 1** — `muralha-reta-b-1.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↙, de cima-direita para baixo-esquerda). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 1: paliçada de troncos de madeira.
8. **Muralha reta (direção ↙, de cima-direita para baixo-esquerda) — estágio 1 (danificada)** — `muralha-reta-b-1-danificada.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↙, de cima-direita para baixo-esquerda). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 1: paliçada de troncos de madeira. Versão com rachaduras e pedras caídas.
9. **Muralha reta (direção ↙, de cima-direita para baixo-esquerda) — estágio 2** — `muralha-reta-b-2.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↙, de cima-direita para baixo-esquerda). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 2: muro de pedra simples com ameias.
10. **Muralha reta (direção ↙, de cima-direita para baixo-esquerda) — estágio 2 (danificada)** — `muralha-reta-b-2-danificada.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↙, de cima-direita para baixo-esquerda). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 2: muro de pedra simples com ameias. Versão com rachaduras e pedras caídas.
11. **Muralha reta (direção ↙, de cima-direita para baixo-esquerda) — estágio 3** — `muralha-reta-b-3.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↙, de cima-direita para baixo-esquerda). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 3: muro alto de pedra clara, imponente, com ameias e detalhes.
12. **Muralha reta (direção ↙, de cima-direita para baixo-esquerda) — estágio 3 (danificada)** — `muralha-reta-b-3-danificada.png` · 128 × 154 px · isométrico  
   Muralha reta (direção ↙, de cima-direita para baixo-esquerda). Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Estágio 3: muro alto de pedra clara, imponente, com ameias e detalhes. Versão com rachaduras e pedras caídas.
13. **Canto da muralha — estágio 1** — `muralha-canto-1.png` · 128 × 154 px · isométrico  
   Canto da muralha. Ocupa uma casa do contorno. Estágio 1: paliçada de troncos de madeira.
14. **Canto da muralha — estágio 1 (danificada)** — `muralha-canto-1-danificada.png` · 128 × 154 px · isométrico  
   Canto da muralha. Ocupa uma casa do contorno. Estágio 1: paliçada de troncos de madeira. Versão com rachaduras e pedras caídas.
15. **Canto da muralha — estágio 2** — `muralha-canto-2.png` · 128 × 154 px · isométrico  
   Canto da muralha. Ocupa uma casa do contorno. Estágio 2: muro de pedra simples com ameias.
16. **Canto da muralha — estágio 2 (danificada)** — `muralha-canto-2-danificada.png` · 128 × 154 px · isométrico  
   Canto da muralha. Ocupa uma casa do contorno. Estágio 2: muro de pedra simples com ameias. Versão com rachaduras e pedras caídas.
17. **Canto da muralha — estágio 3** — `muralha-canto-3.png` · 128 × 154 px · isométrico  
   Canto da muralha. Ocupa uma casa do contorno. Estágio 3: muro alto de pedra clara, imponente, com ameias e detalhes.
18. **Canto da muralha — estágio 3 (danificada)** — `muralha-canto-3-danificada.png` · 128 × 154 px · isométrico  
   Canto da muralha. Ocupa uma casa do contorno. Estágio 3: muro alto de pedra clara, imponente, com ameias e detalhes. Versão com rachaduras e pedras caídas.
19. **Torre da muralha — estágio 1** — `muralha-torre-1.png` · 128 × 154 px · isométrico  
   Torre da muralha. Ocupa uma casa do contorno. Estágio 1: paliçada de troncos de madeira.
20. **Torre da muralha — estágio 1 (danificada)** — `muralha-torre-1-danificada.png` · 128 × 154 px · isométrico  
   Torre da muralha. Ocupa uma casa do contorno. Estágio 1: paliçada de troncos de madeira. Versão com rachaduras e pedras caídas.
21. **Torre da muralha — estágio 2** — `muralha-torre-2.png` · 128 × 154 px · isométrico  
   Torre da muralha. Ocupa uma casa do contorno. Estágio 2: muro de pedra simples com ameias.
22. **Torre da muralha — estágio 2 (danificada)** — `muralha-torre-2-danificada.png` · 128 × 154 px · isométrico  
   Torre da muralha. Ocupa uma casa do contorno. Estágio 2: muro de pedra simples com ameias. Versão com rachaduras e pedras caídas.
23. **Torre da muralha — estágio 3** — `muralha-torre-3.png` · 128 × 154 px · isométrico  
   Torre da muralha. Ocupa uma casa do contorno. Estágio 3: muro alto de pedra clara, imponente, com ameias e detalhes.
24. **Torre da muralha — estágio 3 (danificada)** — `muralha-torre-3-danificada.png` · 128 × 154 px · isométrico  
   Torre da muralha. Ocupa uma casa do contorno. Estágio 3: muro alto de pedra clara, imponente, com ameias e detalhes. Versão com rachaduras e pedras caídas.
25. **Portão — estágio 1** — `muralha-portao-1.png` · 128 × 154 px · isométrico  
   Portão. Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Mesma direção da muralha reta ↘, com o portão de madeira na face da frente. Estágio 1: paliçada de troncos de madeira.
26. **Portão — estágio 1 (danificada)** — `muralha-portao-1-danificada.png` · 128 × 154 px · isométrico  
   Portão. Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Mesma direção da muralha reta ↘, com o portão de madeira na face da frente. Estágio 1: paliçada de troncos de madeira. Versão com rachaduras e pedras caídas.
27. **Portão — estágio 2** — `muralha-portao-2.png` · 128 × 154 px · isométrico  
   Portão. Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Mesma direção da muralha reta ↘, com o portão de madeira na face da frente. Estágio 2: muro de pedra simples com ameias.
28. **Portão — estágio 2 (danificada)** — `muralha-portao-2-danificada.png` · 128 × 154 px · isométrico  
   Portão. Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Mesma direção da muralha reta ↘, com o portão de madeira na face da frente. Estágio 2: muro de pedra simples com ameias. Versão com rachaduras e pedras caídas.
29. **Portão — estágio 3** — `muralha-portao-3.png` · 128 × 154 px · isométrico  
   Portão. Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Mesma direção da muralha reta ↘, com o portão de madeira na face da frente. Estágio 3: muro alto de pedra clara, imponente, com ameias e detalhes.
30. **Portão — estágio 3 (danificada)** — `muralha-portao-3-danificada.png` · 128 × 154 px · isométrico  
   Portão. Ocupa uma casa do contorno. O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua. Mesma direção da muralha reta ↘, com o portão de madeira na face da frente. Estágio 3: muro alto de pedra clara, imponente, com ameias e detalhes. Versão com rachaduras e pedras caídas.
31. **Fosso com água** — `muralha-fosso.png` · 128 × 154 px · isométrico  
   Fosso com água. Ocupa uma casa do contorno.

## Terreno do mapa-múndi (15)

Ladrilhos: losango isométrico 2:1 PLANO visto de cima, SEM bloco de terra embaixo e sem linhas de borda; se repete sem emenda. Colina, montanha, floresta e bosque podem subir acima do losango. Sem sombra.

1. **Mar** — `terreno-mar.png` · 128 × 64 px · isométrico  
   Mar. Casa do mapa-múndi.
2. **Campo de grama** — `terreno-grama.png` · 128 × 64 px · isométrico  
   Campo de grama. Casa do mapa-múndi.
3. **Terra** — `terreno-terra.png` · 128 × 64 px · isométrico  
   Terra. Casa do mapa-múndi.
4. **Areia da praia** — `terreno-areia.png` · 128 × 64 px · isométrico  
   Areia da praia. Casa do mapa-múndi.
5. **Neve** — `terreno-neve.png` · 128 × 64 px · isométrico  
   Neve. Casa do mapa-múndi.
6. **Colina** — `terreno-colina.png` · 128 × 144 px · isométrico  
   Colina. Casa do mapa-múndi.
7. **Montanha (intransponível)** — `terreno-montanha.png` · 128 × 144 px · isométrico  
   Montanha (intransponível). Casa do mapa-múndi.
8. **Rio** — `terreno-rio.png` · 128 × 64 px · isométrico  
   Rio. Casa do mapa-múndi.
9. **Vau (travessia rasa do rio)** — `terreno-vau.png` · 128 × 64 px · isométrico  
   Vau (travessia rasa do rio). Casa do mapa-múndi.
10. **Floresta densa** — `terreno-floresta.png` · 128 × 144 px · isométrico  
   Floresta densa. Casa do mapa-múndi.
11. **Bosque** — `terreno-bosque.png` · 128 × 144 px · isométrico  
   Bosque. Casa do mapa-múndi.
12. **Pântano** — `terreno-pantano.png` · 128 × 64 px · isométrico  
   Pântano. Casa do mapa-múndi.
13. **Estrada** — `terreno-estrada.png` · 128 × 64 px · isométrico  
   Estrada. Casa do mapa-múndi.
14. **Ponte sobre o rio** — `terreno-ponte.png` · 128 × 64 px · isométrico  
   Ponte sobre o rio. Casa do mapa-múndi.
15. **Transição areia → mar** — `terreno-costa.png` · 128 × 64 px · isométrico  
   Transição areia → mar. Casa do mapa-múndi.

## Depósitos de recursos no mapa (12)

Ícones de 128 × 128 px vistos levemente de cima, sem chão em volta e sem sombra, com versão esgotada.

1. **Ferro** — `deposito-iron.png` · 128 × 128 px · isométrico  
   Depósito de ferro no mapa.
2. **Ferro (esgotado)** — `deposito-iron-esgotado.png` · 128 × 128 px · isométrico  
   Depósito de ferro no mapa, já esgotado.
3. **Pedra** — `deposito-stone.png` · 128 × 128 px · isométrico  
   Depósito de pedra no mapa.
4. **Pedra (esgotado)** — `deposito-stone-esgotado.png` · 128 × 128 px · isométrico  
   Depósito de pedra no mapa, já esgotado.
5. **Ouro** — `deposito-gold.png` · 128 × 128 px · isométrico  
   Depósito de ouro no mapa.
6. **Ouro (esgotado)** — `deposito-gold-esgotado.png` · 128 × 128 px · isométrico  
   Depósito de ouro no mapa, já esgotado.
7. **Diamante** — `deposito-diamond.png` · 128 × 128 px · isométrico  
   Depósito de diamante no mapa.
8. **Diamante (esgotado)** — `deposito-diamond-esgotado.png` · 128 × 128 px · isométrico  
   Depósito de diamante no mapa, já esgotado.
9. **Solo fértil** — `deposito-fertile.png` · 128 × 128 px · isométrico  
   Depósito de solo fértil no mapa.
10. **Solo fértil (esgotado)** — `deposito-fertile-esgotado.png` · 128 × 128 px · isométrico  
   Depósito de solo fértil no mapa, já esgotado.
11. **Cardume (pesca)** — `deposito-fish.png` · 128 × 128 px · isométrico  
   Depósito de cardume (pesca) no mapa.
12. **Cardume (pesca) (esgotado)** — `deposito-fish-esgotado.png` · 128 × 128 px · isométrico  
   Depósito de cardume (pesca) no mapa, já esgotado.

## Assentamentos e acampamentos no mapa (12)

Ícones de 128 × 128 px, sem chão em volta e sem sombra. Deixe uma bandeira cinza clara: o jogo pinta a cor de cada reino por cima.

1. **Capital** — `mapa-capital.png` · 128 × 128 px · isométrico  
   Capital visto no mapa-múndi.
2. **Cidade** — `mapa-city.png` · 128 × 128 px · isométrico  
   Cidade visto no mapa-múndi.
3. **Aldeia** — `mapa-village.png` · 128 × 128 px · isométrico  
   Aldeia visto no mapa-múndi.
4. **Castelo** — `mapa-castle.png` · 128 × 128 px · isométrico  
   Castelo visto no mapa-múndi.
5. **Entreposto** — `mapa-outpost.png` · 128 × 128 px · isométrico  
   Entreposto visto no mapa-múndi.
6. **Acampamento de bandidos** — `mapa-camp.png` · 128 × 128 px · isométrico  
   Acampamento de bandidos visto no mapa-múndi.
7. **Acampamento de bandidos em ruínas** — `mapa-camp-ruin.png` · 128 × 128 px · isométrico  
   Acampamento de bandidos em ruínas visto no mapa-múndi.
8. **Acampamento tribal (nível 1)** — `mapa-tribe1.png` · 128 × 128 px · isométrico  
   Acampamento tribal (nível 1) visto no mapa-múndi.
9. **Aldeia tribal (nível 2)** — `mapa-tribe2.png` · 128 × 128 px · isométrico  
   Aldeia tribal (nível 2) visto no mapa-múndi.
10. **Fortaleza tribal (nível 3)** — `mapa-tribe3.png` · 128 × 128 px · isométrico  
   Fortaleza tribal (nível 3) visto no mapa-múndi.
11. **Confederação tribal (nível 4)** — `mapa-tribe4.png` · 128 × 128 px · isométrico  
   Confederação tribal (nível 4) visto no mapa-múndi.
12. **Batalha em andamento** — `mapa-batalha.png` · 128 × 128 px · plano  
   Marca de batalha (espadas cruzadas, poeira) sobre o local do combate.

## Unidades em viagem no mapa (6)

Sprites de 64 × 64 px (carroças, mensageiros, navios...), sem chão e sem sombra.

1. **Carroça de recursos** — `viajante-wagon.png` · 64 × 64 px · isométrico  
   Carroça de recursos se movendo pelo mapa.
2. **Caravana de comércio** — `viajante-caravan.png` · 64 × 64 px · isométrico  
   Caravana de comércio se movendo pelo mapa.
3. **Mensageiro a cavalo** — `viajante-messenger.png` · 64 × 64 px · isométrico  
   Mensageiro a cavalo se movendo pelo mapa.
4. **Grupo de colonos** — `viajante-colonists.png` · 64 × 64 px · isométrico  
   Grupo de colonos se movendo pelo mapa.
5. **Espião encapuzado** — `viajante-spy.png` · 64 × 64 px · isométrico  
   Espião encapuzado se movendo pelo mapa.
6. **Navio da horda** — `viajante-ship.png` · 64 × 64 px · isométrico  
   Navio da horda se movendo pelo mapa.

## Soldados (retrato e boneco de batalha) (42)

Retrato de corpo inteiro 256 × 256 px e boneco de 64 × 64 px usado no mapa e nas batalhas. Sem chão e sem sombra.

1. **Lanceiro (retrato)** — `retrato-spearman.png` · 256 × 256 px · plano  
   Infantaria barata com lança longa. Segura a cavalaria. Retrato de corpo inteiro.
2. **Lanceiro (boneco)** — `boneco-spearman.png` · 64 × 64 px · isométrico  
   Lanceiro pequeno para o mapa e as batalhas, virado para a direita.
3. **Arqueiro (retrato)** — `retrato-archer.png` · 256 × 256 px · plano  
   Atira de longe. Desfaz formações de infantaria. Retrato de corpo inteiro.
4. **Arqueiro (boneco)** — `boneco-archer.png` · 64 × 64 px · isométrico  
   Arqueiro pequeno para o mapa e as batalhas, virado para a direita.
5. **Cavaleiro (retrato)** — `retrato-knight.png` · 256 × 256 px · plano  
   Carga veloz que esmaga arqueiros. Retrato de corpo inteiro.
6. **Cavaleiro (boneco)** — `boneco-knight.png` · 64 × 64 px · isométrico  
   Cavaleiro pequeno para o mapa e as batalhas, virado para a direita.
7. **Escudeiro (retrato)** — `retrato-shieldman.png` · 256 × 256 px · plano  
   Parede de escudos: aguenta flechas. Retrato de corpo inteiro.
8. **Escudeiro (boneco)** — `boneco-shieldman.png` · 64 × 64 px · isométrico  
   Escudeiro pequeno para o mapa e as batalhas, virado para a direita.
9. **Besteiro (retrato)** — `retrato-crossbowman.png` · 256 × 256 px · plano  
   Virotes atravessam armaduras e escudos. Retrato de corpo inteiro.
10. **Besteiro (boneco)** — `boneco-crossbowman.png` · 64 × 64 px · isométrico  
   Besteiro pequeno para o mapa e as batalhas, virado para a direita.
11. **Batedor (retrato)** — `retrato-scout.png` · 256 × 256 px · plano  
   Explora a névoa, caça carroças e mensageiros. Não luta bem. Retrato de corpo inteiro.
12. **Batedor (boneco)** — `boneco-scout.png` · 64 × 64 px · isométrico  
   Batedor pequeno para o mapa e as batalhas, virado para a direita.
13. **Arqueiro montado (retrato)** — `retrato-horseArcher.png` · 256 × 256 px · plano  
   Atira a cavalo e foge antes do contato. Retrato de corpo inteiro.
14. **Arqueiro montado (boneco)** — `boneco-horseArcher.png` · 64 × 64 px · isométrico  
   Arqueiro montado pequeno para o mapa e as batalhas, virado para a direita.
15. **Cavaleiro pesado (retrato)** — `retrato-heavyKnight.png` · 256 × 256 px · plano  
   Aço da cabeça aos cascos. Caro e lento, mas quase imparável. Retrato de corpo inteiro.
16. **Cavaleiro pesado (boneco)** — `boneco-heavyKnight.png` · 64 × 64 px · isométrico  
   Cavaleiro pesado pequeno para o mapa e as batalhas, virado para a direita.
17. **Aríete (retrato)** — `retrato-ram.png` · 256 × 256 px · plano  
   Derruba portões. Retrato de corpo inteiro.
18. **Aríete (boneco)** — `boneco-ram.png` · 64 × 64 px · isométrico  
   Aríete pequeno para o mapa e as batalhas, virado para a direita.
19. **Catapulta (retrato)** — `retrato-catapult.png` · 256 × 256 px · plano  
   Arremessa pedras na muralha e nas construções. Retrato de corpo inteiro.
20. **Catapulta (boneco)** — `boneco-catapult.png` · 64 × 64 px · isométrico  
   Catapulta pequeno para o mapa e as batalhas, virado para a direita.
21. **Escada de cerco (retrato)** — `retrato-ladder.png` · 256 × 256 px · plano  
   Cada escada leva até 10 soldados por cima da muralha, enfraquecidos. Retrato de corpo inteiro.
22. **Escada de cerco (boneco)** — `boneco-ladder.png` · 64 × 64 px · isométrico  
   Escada de cerco pequeno para o mapa e as batalhas, virado para a direita.
23. **Torre de cerco (retrato)** — `retrato-siegeTower.png` · 256 × 256 px · plano  
   Leva até 25 soldados por cima da muralha sem penalidade. Bloqueada pelo fosso. Retrato de corpo inteiro.
24. **Torre de cerco (boneco)** — `boneco-siegeTower.png` · 64 × 64 px · isométrico  
   Torre de cerco pequeno para o mapa e as batalhas, virado para a direita.
25. **Guerreiro do machado (retrato)** — `retrato-axeman.png` · 256 × 256 px · plano  
   Guerreiro tribal que racha escudos. Retrato de corpo inteiro.
26. **Guerreiro do machado (boneco)** — `boneco-axeman.png` · 64 × 64 px · isométrico  
   Guerreiro do machado pequeno para o mapa e as batalhas, virado para a direita.
27. **Arqueiro de caça (retrato)** — `retrato-hunter.png` · 256 × 256 px · plano  
   Caçador tribal com arco curto. Retrato de corpo inteiro.
28. **Arqueiro de caça (boneco)** — `boneco-hunter.png` · 64 × 64 px · isométrico  
   Arqueiro de caça pequeno para o mapa e as batalhas, virado para a direita.
29. **Cavaleiro bárbaro (retrato)** — `retrato-tribalRider.png` · 256 × 256 px · plano  
   Ginete tribal rápido e sem armadura. Retrato de corpo inteiro.
30. **Cavaleiro bárbaro (boneco)** — `boneco-tribalRider.png` · 64 × 64 px · isométrico  
   Cavaleiro bárbaro pequeno para o mapa e as batalhas, virado para a direita.
31. **Bandido (retrato)** — `retrato-brigand.png` · 256 × 256 px · plano  
   Salteador de estrada mal armado. Retrato de corpo inteiro.
32. **Bandido (boneco)** — `boneco-brigand.png` · 64 × 64 px · isométrico  
   Bandido pequeno para o mapa e as batalhas, virado para a direita.
33. **Nórdico (retrato)** — `retrato-northman.png` · 256 × 256 px · plano  
   Infantaria pesada das hordas do mar. Retrato de corpo inteiro.
34. **Nórdico (boneco)** — `boneco-northman.png` · 64 × 64 px · isométrico  
   Nórdico pequeno para o mapa e as batalhas, virado para a direita.
35. **Cavaleiro das estepes (retrato)** — `retrato-steppeRider.png` · 256 × 256 px · plano  
   Ginete veloz das hordas, mestre das incursões. Retrato de corpo inteiro.
36. **Cavaleiro das estepes (boneco)** — `boneco-steppeRider.png` · 64 × 64 px · isométrico  
   Cavaleiro das estepes pequeno para o mapa e as batalhas, virado para a direita.
37. **Mercenário (retrato)** — `retrato-mercenary.png` · 256 × 256 px · plano  
   Soldado de aluguel bem equipado. Retrato de corpo inteiro.
38. **Mercenário (boneco)** — `boneco-mercenary.png` · 64 × 64 px · isométrico  
   Mercenário pequeno para o mapa e as batalhas, virado para a direita.
39. **Chefe da horda (retrato)** — `retrato-warlord.png` · 256 × 256 px · plano  
   Comandante temido que vem a cada cinco ondas. Retrato de corpo inteiro.
40. **Chefe da horda (boneco)** — `boneco-warlord.png` · 64 × 64 px · isométrico  
   Chefe da horda pequeno para o mapa e as batalhas, virado para a direita.
41. **Miliciano (retrato)** — `retrato-militia.png` · 256 × 256 px · plano  
   Cidadão armado às pressas para defender as muralhas. Retrato de corpo inteiro.
42. **Miliciano (boneco)** — `boneco-militia.png` · 64 × 64 px · isométrico  
   Miliciano pequeno para o mapa e as batalhas, virado para a direita.

## Heróis (8)

Retratos de 256 × 256 px do peito para cima.

1. **Herói 1** — `heroi-1.png` · 256 × 256 px · plano  
   Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres.
2. **Herói 2** — `heroi-2.png` · 256 × 256 px · plano  
   Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres.
3. **Herói 3** — `heroi-3.png` · 256 × 256 px · plano  
   Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres.
4. **Herói 4** — `heroi-4.png` · 256 × 256 px · plano  
   Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres.
5. **Herói 5** — `heroi-5.png` · 256 × 256 px · plano  
   Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres.
6. **Herói 6** — `heroi-6.png` · 256 × 256 px · plano  
   Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres.
7. **Herói 7** — `heroi-7.png` · 256 × 256 px · plano  
   Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres.
8. **Herói 8** — `heroi-8.png` · 256 × 256 px · plano  
   Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres.

## Efeitos (8)

Sprites de 64 × 64 px para batalhas e eventos.

1. **Fogo** — `efeito-fogo.png` · 64 × 64 px · plano  
   Fogo. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar.
2. **Fumaça** — `efeito-fumaca.png` · 64 × 64 px · plano  
   Fumaça. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar.
3. **Poeira de marcha** — `efeito-poeira.png` · 64 × 64 px · plano  
   Poeira de marcha. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar.
4. **Flecha** — `efeito-flecha.png` · 64 × 64 px · plano  
   Flecha. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar.
5. **Impacto na muralha** — `efeito-impacto.png` · 64 × 64 px · plano  
   Impacto na muralha. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar.
6. **Neve caindo** — `efeito-neve.png` · 64 × 64 px · plano  
   Neve caindo. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar.
7. **Chuva** — `efeito-chuva.png` · 64 × 64 px · plano  
   Chuva. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar.
8. **Choque de batalha** — `efeito-batalha.png` · 64 × 64 px · plano  
   Choque de batalha. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar.

## Ilustrações (5)

Imagens grandes para telas especiais.

1. **Tela de abertura: o castelo ao amanhecer** — `ilustracao-titulo.png` · 768 × 432 px · plano  
   Tela de abertura: o castelo ao amanhecer.
2. **Vitória numa batalha** — `ilustracao-vitoria.png` · 768 × 432 px · plano  
   Vitória numa batalha.
3. **Derrota (castelo em chamas, fumaça)** — `ilustracao-derrota.png` · 768 × 432 px · plano  
   Derrota (castelo em chamas, fumaça).
4. **Coroação do Imperador do Continente X** — `ilustracao-imperador.png` · 768 × 432 px · plano  
   Coroação do Imperador do Continente X.
5. **Mensagem secreta do Continente Y (navio ao luar)** — `ilustracao-carta-secreta.png` · 768 × 432 px · plano  
   Mensagem secreta do Continente Y (navio ao luar).
