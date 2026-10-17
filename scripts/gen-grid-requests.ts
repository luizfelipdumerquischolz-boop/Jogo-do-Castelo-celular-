// Gera docs/PEDIDOS-EM-GRADE.txt (e docs/pedidos-em-grade.json): todas as artes do jogo
// divididas em pedidos de grade prontos para colar numa IA de imagens.
// Uso: npm run artes
import { mkdirSync, writeFileSync } from 'node:fs';
import { ART_SPECS, GROUPS, artFileName, type ArtSpec } from '../src/art/registry';
import { BUILDINGS, BUILDING_IDS } from '../src/sim/data/buildings';

const STYLE =
  'Estilo de todas: arte digital pintada à mão, jogo de estratégia medieval para celular, cores quentes e saturadas, contornos escuros limpos, bem legível em tamanho pequeno, mesmo estilo e mesma luz (vinda de cima e da esquerda) em todos os desenhos.';
const NO_GROUND =
  'MUITO IMPORTANTE: desenhe SÓ o objeto. NÃO desenhe chão, gramado, terra, piso, base, plataforma ou bloco embaixo dele, e NÃO desenhe sombra no chão (sombras e chãos são feitos em imagens separadas). Fora do objeto fica apenas o fundo cinza liso da grade.';

function gridText(cols: number, rows: number, cell: number): string {
  const W = cols * cell;
  const H = Math.round(rows * cell * 1.15);
  return `Monte uma única imagem em GRADE com ${cols} colunas × ${rows} linhas, fundo cinza escuro liso de uma cor só (sem xadrez, sem degradê, sem textura). Cada desenho fica centralizado na sua célula, inteiro, sem encostar nos vizinhos, com espaço vazio entre as células. Embaixo de cada desenho escreva em letras pequenas o nome do arquivo indicado. A imagem final deve ter pelo menos ${W} × ${H} pixels (cada célula com cerca de ${cell} pixels de largura). Siga a ordem da lista, da esquerda para a direita e de cima para baixo.`;
}

interface Req {
  title: string;
  body: string;
  files: string[];
}
const reqs: Req[] = [];
const used = new Set<string>();

function line(s: ArtSpec, i: number): string {
  return `${i}. ${artFileName(s.key)} — ${s.name}. ${s.description}`;
}

function request(title: string, items: ArtSpec[], cols: number, cell: number, extra: string, noGround = true): void {
  if (!items.length) return;
  const rows = Math.ceil(items.length / cols);
  const body = [
    `${gridText(cols, rows, cell)} ${extra}${noGround ? ` ${NO_GROUND}` : ''} ${STYLE}`,
    'Lista:',
    ...items.map((s, i) => line(s, i + 1)),
  ].join('\n');
  reqs.push({ title: `${title} (${items.length} imagens)`, body, files: items.map((s) => artFileName(s.key)) });
  for (const s of items) used.add(s.key);
}

const byGroup = (g: string) => ART_SPECS.filter((s) => s.group === g);
const ICON = 'Ícones planos vistos de frente, sem perspectiva, um objeto principal grande e reconhecível em miniatura, sem cenário.';

request('Peças da interface', byGroup('interface'), 4, 420, 'Peças de interface vistas de frente, sem perspectiva. Barras, painel e fundo de menu são texturas que se repetem: sem ícones nem objetos dentro. Botões sem texto.', false);
request('Ícones dos botões e abas', byGroup('icones-interface'), 6, 300, ICON, false);
request('Ícones de recursos, alimentos e itens', byGroup('icones-recursos'), 7, 280, ICON, false);
request('Ícones de status', byGroup('icones-status'), 4, 300, ICON, false);

// Construções: 3 por grade (uma por linha, com os 3 estágios lado a lado).
const BUILD =
  'Construções isométricas 2:1 (ângulo de jogo de construção de cidade). Cada construção aparece em 3 estágios lado a lado na mesma linha: 1 = simples, de madeira e palha; 2 = melhorada, pedra e telhas; 3 = refinada e imponente. Mesma construção, mesmo ângulo e mesma posição nos 3 estágios. A ponta da frente das paredes fica embaixo, no centro da célula.';
const sizeName: Record<number, string> = { 1: 'pequenas (1 casa)', 2: 'médias (2×2 casas)', 3: 'grandes (3×3 casas)' };
const cellFor: Record<number, number> = { 1: 450, 2: 560, 3: 640 };
for (const size of [3, 2, 1]) {
  const ids = BUILDING_IDS.filter((id) => BUILDINGS[id].size === size);
  for (let i = 0; i < ids.length; i += 3) {
    const chunk = ids.slice(i, i + 3);
    const items = chunk.flatMap((id) => [1, 2, 3].map((st) => ART_SPECS.find((s) => s.key === `construcao-${id}-${st}`)!));
    request(`Construções ${sizeName[size]}: ${chunk.map((id) => BUILDINGS[id].name).join(', ')}`, items, 3, cellFor[size], `${BUILD} Ocupa ${size}×${size} casas.`);
  }
}
request('Andaimes de obra', byGroup('obras'), 3, 500, 'Andaimes de madeira isométricos 2:1, com blocos de pedra empilhados.');
request('Chão dos terrenos das construções', byGroup('lotes'), 3, 500, 'Cada imagem é SÓ um losango plano visto de cima (2 vezes mais largo que alto), sem espessura, sem bloco, sem bordas pretas e sem objetos. As bordas do losango ficam suaves para se misturar com a grama.', false);
request('Sombras', byGroup('sombras'), 4, 360, 'Cada imagem é SÓ uma sombra: mancha preta suave e semitransparente, vista de cima em isométrico, esticada para baixo e para a direita. Sem nenhum objeto. Se a ferramenta não fizer transparência, desenhe a sombra preta sobre o fundo cinza que eu converto.', false);
request(
  'Terreno do mapa e chão da cidade',
  [...byGroup('terreno'), ...byGroup('chao')],
  6,
  300,
  'Cada ladrilho é um LOSANGO PLANO isométrico (2 vezes mais largo que alto), visto de cima em ângulo, SEM bloco de terra embaixo, SEM espessura e SEM linhas na borda, que se encaixa lado a lado sem emenda. Colina, montanha, floresta e bosque podem subir acima do losango. Decorações (árvore, arbusto, pedras) são objetos soltos.',
  false,
);
const WALL =
  "Peças isométricas que se encaixam formando uma muralha contínua em volta da cidade, todas na mesma escala e altura. 'reta-a' corre na diagonal ↘ (de cima-esquerda para baixo-direita), 'reta-b' na diagonal ↙, o portão na mesma direção da reta-a. Estágio 1 = paliçada de troncos; 2 = muro de pedra simples com ameias; 3 = muro alto de pedra clara com ameias. '-danificada' = a mesma peça com rachaduras e pedras caídas.";
const walls = byGroup('muralhas');
request('Muralhas (estágios 1 e 2)', walls.filter((s) => /-[12](-|$)/.test(s.key)), 5, 320, WALL);
request('Muralhas (estágio 3) e fosso', walls.filter((s) => !/-[12](-|$)/.test(s.key)), 4, 320, `${WALL} O fosso é só a água e as bordas da vala.`);
request('Depósitos de recursos e efeitos', [...byGroup('depositos'), ...byGroup('efeitos')], 5, 300, "Depósitos: vistos levemente de cima; a versão '-esgotado' é o mesmo depósito quase vazio. Efeitos: um único quadro, solto.");
request('Marcadores e viajantes do mapa', [...byGroup('mapa'), ...byGroup('viajantes')], 6, 300, 'Ícones vistos levemente de cima (isométrico suave), base embaixo, silhueta simples. Bandeiras em cinza claro (o jogo pinta a cor de cada reino).');
const sold = byGroup('soldados');
request('Retratos dos soldados', sold.filter((s) => s.key.startsWith('retrato-')), 5, 400, 'Retratos de corpo inteiro, de frente e levemente de lado, pose heroica, uma unidade por célula, nada cortado. Cada tipo bem diferente do outro (arma, armadura, roupa e cores).');
request('Bonecos de batalha e heróis', [...sold.filter((s) => s.key.startsWith('boneco-')), ...byGroup('herois')], 6, 330, 'Bonecos: a unidade inteira, pequena, vista em isométrico suave, virada para a DIREITA, silhueta forte. Heróis: retrato do peito para cima, rostos bem variados (jovens, velhos, homens e mulheres).');

const ill = byGroup('ilustracoes');
reqs.push({
  title: `Ilustrações (${ill.length} imagens, uma por vez, sem grade)`,
  body: [
    `Faça cada uma separada, imagem horizontal 16:9 com pelo menos 1536 × 864 pixels, cena completa sem transparência e sem moldura, sem letras. ${STYLE}`,
    ...ill.map((s, i) => line(s, i + 1)),
  ].join('\n'),
  files: ill.map((s) => artFileName(s.key)),
});
for (const s of ill) used.add(s.key);

const missing = ART_SPECS.filter((s) => !used.has(s.key));
if (missing.length) throw new Error(`Artes fora dos pedidos: ${missing.map((s) => s.key).join(', ')}`);
void GROUPS;

const head = [
  `COROA DE PEDRA — PEDIDOS EM GRADE (${ART_SPECS.length} imagens em ${reqs.length} pedidos)`,
  '',
  'Como usar: copie um PEDIDO por vez (do texto até o fim da lista dele) e cole na IA. Me mande a grade pronta; eu recorto, limpo e coloco no jogo.',
  'Se a IA não conseguir fazer tudo numa grade, peça metade da lista e depois a outra metade.',
  'Regra de ouro: construções, muralhas, andaimes, soldados e objetos vêm SEM chão e SEM sombra. Chãos e sombras têm pedidos próprios.',
  '',
];
const txt = [...head, ...reqs.flatMap((r, i) => ['', '='.repeat(44), `PEDIDO ${i + 1} — ${r.title}`, '='.repeat(44), r.body])].join('\n') + '\n';
mkdirSync('docs', { recursive: true });
writeFileSync('docs/PEDIDOS-EM-GRADE.txt', txt);
writeFileSync('docs/pedidos-em-grade.json', JSON.stringify({ head: head.join('\n').trim(), reqs: reqs.map((r, i) => ({ t: `PEDIDO ${i + 1} — ${r.title}`, b: r.body })) }));
console.log(`docs/PEDIDOS-EM-GRADE.txt: ${reqs.length} pedidos, ${ART_SPECS.length} imagens`);
