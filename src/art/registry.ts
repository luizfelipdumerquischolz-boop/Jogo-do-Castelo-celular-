// Registro de TODAS as imagens do jogo. Cada entrada tem:
// - o nome do arquivo que o jogador pode fornecer em public/arte/
// - tamanho e descrição (usados para gerar a lista de artes)
// - um desenho padrão feito por código, usado enquanto o arquivo não existir.
import { BUILDINGS, BUILDING_IDS, type BuildingId } from '../sim/data/buildings';
import { ITEMS, ITEM_IDS } from '../sim/data/items';
import { UNITS, type UnitId } from '../sim/data/units';
import { drawBuilding, drawScaffold } from './buildings';
import { ITEM_ICONS, STAT_ICONS, UI_ICONS } from './icons';
import { TILE_H, TILE_W, hashRand, poly, shade, type Ctx } from './iso';
import {
  EFFECT_KINDS,
  ILLUSTRATION_KINDS,
  TERRAIN_KINDS,
  UNIT_ART_IDS,
  WALL_PIECES,
  drawDecoration,
  drawDeposit,
  drawEffect,
  drawGroundTile,
  drawHeroPortrait,
  drawIllustration,
  drawMapSettlement,
  drawTerrainTile,
  drawTraveler,
  drawUnit,
  drawWallPiece,
} from './world';

export interface ArtSpec {
  key: string;
  group: string;
  name: string;
  description: string;
  w: number;
  h: number;
  /** Perspectiva isométrica (true) ou ícone plano (false). */
  iso: boolean;
  draw: (c: Ctx, w: number, h: number) => void;
}

export const GROUPS: { id: string; title: string; intro: string }[] = [
  { id: 'interface', title: 'Interface (botões, barras e painéis)', intro: 'Peças da tela. Botões e painéis são esticados pelo jogo: deixe as bordas decoradas e o miolo liso.' },
  { id: 'icones-interface', title: 'Ícones dos botões e abas', intro: 'Ícones planos, sem perspectiva, legíveis em 24 px. Fundo transparente.' },
  { id: 'icones-recursos', title: 'Ícones de recursos, alimentos e itens', intro: 'Ícones planos de 128 × 128 px, sem perspectiva, bem legíveis em tamanho pequeno.' },
  { id: 'icones-status', title: 'Ícones de status', intro: 'Ícones planos de 128 × 128 px usados nos painéis (população, felicidade etc.).' },
  { id: 'construcoes', title: 'Construções (3 estágios cada)', intro: 'Isométricas 2:1, luz de cima e da esquerda. Estágio 1 = níveis 1–2 (madeira, simples), 2 = níveis 3–4 (pedra), 3 = nível 5 (imponente, bandeiras). A base do prédio encosta embaixo da imagem.' },
  { id: 'obras', title: 'Andaimes de obra', intro: 'Aparecem enquanto uma construção é erguida ou melhorada.' },
  { id: 'chao', title: 'Chão e decoração do assentamento', intro: 'Ladrilhos isométricos de 128 × 64 px que se repetem sem emenda.' },
  { id: 'muralhas', title: 'Muralha, portão e fosso', intro: 'Peças isométricas que se encaixam em volta do terreno do assentamento. 3 estágios e versão danificada.' },
  { id: 'terreno', title: 'Terreno do mapa-múndi', intro: 'Ladrilhos isométricos de 128 × 64 px (relevo e árvores podem ser mais altos, com a base embaixo).' },
  { id: 'depositos', title: 'Depósitos de recursos no mapa', intro: 'Ícones de 128 × 128 px vistos levemente de cima, com versão esgotada.' },
  { id: 'mapa', title: 'Assentamentos e acampamentos no mapa', intro: 'Ícones de 128 × 128 px. Deixe uma bandeira cinza clara: o jogo pinta a cor de cada reino por cima.' },
  { id: 'viajantes', title: 'Unidades em viagem no mapa', intro: 'Sprites de 64 × 64 px (carroças, mensageiros, navios...).' },
  { id: 'soldados', title: 'Soldados (retrato e boneco de batalha)', intro: 'Retrato de corpo inteiro 256 × 256 px e boneco de 64 × 64 px usado no mapa e nas batalhas.' },
  { id: 'herois', title: 'Heróis', intro: 'Retratos de 256 × 256 px do peito para cima.' },
  { id: 'efeitos', title: 'Efeitos', intro: 'Sprites de 64 × 64 px para batalhas e eventos.' },
  { id: 'ilustracoes', title: 'Ilustrações', intro: 'Imagens grandes para telas especiais.' },
];

const specs: ArtSpec[] = [];
function add(s: ArtSpec): void {
  specs.push(s);
}

// Interface -------------------------------------------------------------------------

function woodTexture(c: Ctx, w: number, h: number, base: string): void {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, shade(base, 0.12));
  g.addColorStop(1, shade(base, -0.2));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(0,0,0,0.12)';
  for (let y = 6; y < h; y += 9) {
    c.beginPath();
    c.moveTo(0, y);
    c.bezierCurveTo(w * 0.3, y + 3, w * 0.6, y - 3, w, y);
    c.stroke();
  }
}

function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function button(c: Ctx, w: number, h: number, color: string): void {
  roundRect(c, 2, 2, w - 4, h - 4, 12);
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, shade(color, 0.18));
  g.addColorStop(1, shade(color, -0.2));
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = shade(color, -0.45);
  c.lineWidth = 3;
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.25)';
  c.lineWidth = 2;
  roundRect(c, 6, 6, w - 12, h / 2 - 4, 8);
  c.stroke();
}

add({ key: 'ui-botao', group: 'interface', name: 'Botão principal', description: 'Botão verde de ação (Construir, Melhorar, Recrutar). Esticado na largura: bordas arredondadas com moldura, miolo liso.', w: 192, h: 72, iso: false, draw: (c, w, h) => button(c, w, h, '#3d7a3a') });
add({ key: 'ui-botao-perigo', group: 'interface', name: 'Botão de perigo', description: 'Botão vermelho (Atacar, Demolir).', w: 192, h: 72, iso: false, draw: (c, w, h) => button(c, w, h, '#a83232') });
add({ key: 'ui-botao-neutro', group: 'interface', name: 'Botão neutro', description: 'Botão marrom para ações secundárias (Cancelar, Voltar).', w: 192, h: 72, iso: false, draw: (c, w, h) => button(c, w, h, '#7a5a3a') });
add({ key: 'ui-botao-desativado', group: 'interface', name: 'Botão desativado', description: 'Botão acinzentado quando a ação não está disponível.', w: 192, h: 72, iso: false, draw: (c, w, h) => button(c, w, h, '#8a8070') });
add({ key: 'ui-barra-topo', group: 'interface', name: 'Barra superior', description: 'Faixa de madeira escura atrás dos recursos no topo da tela. Repete na horizontal.', w: 512, h: 96, iso: false, draw: (c, w, h) => woodTexture(c, w, h, '#4d3722') });
add({ key: 'ui-barra-inferior', group: 'interface', name: 'Barra de navegação', description: 'Faixa de madeira atrás das abas na parte de baixo. Repete na horizontal.', w: 512, h: 128, iso: false, draw: (c, w, h) => woodTexture(c, w, h, '#3b2a1a') });
add({
  key: 'ui-painel',
  group: 'interface',
  name: 'Painel de pergaminho',
  description: 'Fundo dos painéis que sobem de baixo (informações de construções, exércitos). Textura de pergaminho que se repete, com borda escura de 16 px.',
  w: 512,
  h: 512,
  iso: false,
  draw: (c, w, h) => {
    c.fillStyle = '#f3e7c9';
    c.fillRect(0, 0, w, h);
    const r = hashRand(11);
    for (let i = 0; i < 400; i++) {
      c.fillStyle = `rgba(150,110,60,${r() * 0.05})`;
      c.fillRect(r() * w, r() * h, 3, 3);
    }
    c.strokeStyle = '#c9b07a';
    c.lineWidth = 16;
    c.strokeRect(0, 0, w, h);
  },
});
add({ key: 'ui-fundo', group: 'interface', name: 'Fundo das telas de menu', description: 'Couro ou madeira escura atrás das listas (cartas, pesquisa, diplomacia). Repete sem emenda.', w: 512, h: 512, iso: false, draw: (c, w, h) => woodTexture(c, w, h, '#2a1d10') });
add({ key: 'ui-moldura-retrato', group: 'interface', name: 'Moldura de retrato', description: 'Moldura dourada redonda para retratos de heróis e soldados. Miolo transparente.', w: 256, h: 256, iso: false, draw: (c, w) => {
  c.strokeStyle = '#c9a14a';
  c.lineWidth = 18;
  c.beginPath();
  c.arc(w / 2, w / 2, w / 2 - 12, 0, Math.PI * 2);
  c.stroke();
} });
add({ key: 'ui-selo', group: 'interface', name: 'Selo de cera', description: 'Selo vermelho das cartas não lidas.', w: 96, h: 96, iso: false, draw: (c, w) => {
  c.fillStyle = '#a83232';
  c.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const r = i % 2 ? w * 0.4 : w * 0.46;
    c.lineTo(w / 2 + Math.cos(a) * r, w / 2 + Math.sin(a) * r);
  }
  c.closePath();
  c.fill();
  c.fillStyle = '#7a1f1f';
  c.beginPath();
  c.arc(w / 2, w / 2, w * 0.26, 0, Math.PI * 2);
  c.fill();
} });
add({ key: 'ui-carta', group: 'interface', name: 'Papel de carta', description: 'Folha de pergaminho para ler cartas. Bordas levemente queimadas.', w: 512, h: 640, iso: false, draw: (c, w, h) => {
  c.fillStyle = '#efe0bd';
  c.fillRect(0, 0, w, h);
  c.strokeStyle = '#a8865a';
  c.lineWidth = 10;
  c.strokeRect(5, 5, w - 10, h - 10);
} });
add({ key: 'ui-icone-app', group: 'interface', name: 'Ícone do aplicativo', description: 'Ícone que aparece na tela inicial do celular. Castelo ou coroa de pedra, sem texto, fundo escuro.', w: 1024, h: 1024, iso: false, draw: (c, w, h) => {
  woodTexture(c, w, h, '#3b2a1a');
  const s = w / 512;
  poly(c, [96, 420, 96, 230, 144, 230, 144, 186, 184, 186, 184, 230, 220, 230, 220, 130, 292, 130, 292, 230, 328, 230, 328, 186, 368, 186, 368, 230, 416, 230, 416, 420].reduce<{ x: number; y: number }[]>((acc, v, i, arr) => (i % 2 ? acc : [...acc, { x: v * s, y: arr[i + 1] * s }]), []), '#a9a196');
} });

for (const [k, name] of Object.entries({
  reino: 'Aba Reino (mapa)',
  cidade: 'Aba Cidade',
  exercitos: 'Aba Exércitos',
  cartas: 'Aba Cartas',
  mais: 'Aba Mais',
  construir: 'Construir',
  melhorar: 'Melhorar',
  mover: 'Mover construção',
  demolir: 'Demolir',
  atacar: 'Atacar / conquistar',
  saquear: 'Saquear',
  espionar: 'Espionar',
  defender: 'Defender',
  voltar: 'Voltar para casa',
  fechar: 'Fechar painel',
  pesquisa: 'Pesquisa',
  diplomacia: 'Diplomacia',
  taverna: 'Taverna',
  herois: 'Heróis',
  missoes: 'Missões',
  mercado: 'Mercado',
  rotas: 'Rotas e carroças',
  colonos: 'Colonos',
  relatorios: 'Relatórios de batalha',
  cronica: 'Crônica do reino',
  artes: 'Lista de artes',
  ajuda: 'Ajuda',
  novo: 'Novo jogo',
  zoom: 'Zoom do mapa',
  fundar: 'Fundar assentamento',
  recrutar: 'Recrutar',
})) {
  add({ key: `icone-ui-${k}`, group: 'icones-interface', name, description: `Ícone do botão "${name}".`, w: 96, h: 96, iso: false, draw: (c, w) => UI_ICONS[k](c, w) });
}

// Ícones de recursos ------------------------------------------------------------------

for (const id of ITEM_IDS) {
  add({ key: `icone-${id}`, group: 'icones-recursos', name: ITEMS[id].name, description: `Ícone de ${ITEMS[id].name.toLowerCase()}.`, w: 128, h: 128, iso: false, draw: (c, w) => ITEM_ICONS[id](c, w) });
}
add({ key: 'icone-gold', group: 'icones-recursos', name: 'Ouro', description: 'Pilha de moedas de ouro (tesouro do reino).', w: 128, h: 128, iso: false, draw: (c, w) => ITEM_ICONS.gold(c, w) });
for (const [k, name] of Object.entries({ population: 'População', happiness: 'Felicidade', health: 'Saúde', morale: 'Moral', loyalty: 'Lealdade', culture: 'Cultura', research: 'Pesquisa', time: 'Tempo / estação' })) {
  add({ key: `icone-${k}`, group: 'icones-status', name, description: `Ícone de ${name.toLowerCase()}.`, w: 128, h: 128, iso: false, draw: (c, w) => STAT_ICONS[k](c, w) });
}

// Construções -----------------------------------------------------------------------

export function buildingSpriteSize(id: BuildingId): { w: number; h: number } {
  const n = BUILDINGS[id].size;
  const extra = id === 'keep' ? 260 : id === 'watchtower' || id === 'chapel' || id === 'mill' ? 170 : 110 + n * 30;
  return { w: n * TILE_W, h: n * TILE_H + extra };
}

const STAGE_DESC = ['', 'madeira e palha, simples', 'pedra e telhas, mais alta', 'imponente, com detalhes e bandeiras'];
for (const id of BUILDING_IDS) {
  const def = BUILDINGS[id];
  const { w, h } = buildingSpriteSize(id);
  for (let st = 1; st <= 3; st++) {
    add({
      key: `construcao-${id}-${st}`,
      group: 'construcoes',
      name: `${def.name} — estágio ${st}`,
      description: `${def.description} Ocupa ${def.size}×${def.size} casas. Estágio ${st}: ${STAGE_DESC[st]}.`,
      w,
      h,
      iso: true,
      draw: (c, ww, hh) => drawBuilding(c, id, def.size, st, ww, hh),
    });
  }
}
for (const n of [1, 2, 3]) {
  add({ key: `andaime-${n}`, group: 'obras', name: `Andaime ${n}×${n}`, description: `Andaime de madeira com blocos de pedra no chão, para construções de ${n}×${n} casas em obra.`, w: n * TILE_W, h: n * TILE_H + 110, iso: true, draw: (c, w, h) => { void w; drawScaffold(c, n, h); } });
}

// Chão, muralhas ------------------------------------------------------------------------

for (const [k, d] of Object.entries({ grama: 'Grama dentro do assentamento', terra: 'Terra batida (caminhos)', pavimento: 'Pavimento de pedra (perto da Torre)', bairro: 'Chão dos bairros especializados da capital' })) {
  add({ key: `chao-${k}`, group: 'chao', name: d, description: `${d}. Losango que se repete sem emenda.`, w: TILE_W, h: TILE_H, iso: true, draw: (c, w, h) => drawGroundTile(c, k, w, h) });
}
for (const [k, d] of Object.entries({ arvore: 'Árvore', arbusto: 'Arbusto', pedras: 'Pedras' })) {
  add({ key: `decoracao-${k}`, group: 'chao', name: d, description: `${d} decorativa do lado de fora da muralha.`, w: 128, h: 128, iso: true, draw: (c, w) => drawDecoration(c, k, w) });
}
const WALL_NAMES: Record<string, string> = { 'reta-a': 'Muralha reta (direção ↘, de cima-esquerda para baixo-direita)', 'reta-b': 'Muralha reta (direção ↙, de cima-direita para baixo-esquerda)', canto: 'Canto da muralha', torre: 'Torre da muralha', portao: 'Portão', fosso: 'Fosso com água' };
for (const piece of WALL_PIECES) {
  for (let st = 1; st <= (piece === 'fosso' ? 1 : 3); st++) {
    for (const dmg of piece === 'fosso' ? [false] : [false, true]) {
      add({
        key: `muralha-${piece}${piece === 'fosso' ? '' : `-${st}`}${dmg ? '-danificada' : ''}`,
        group: 'muralhas',
        name: `${WALL_NAMES[piece]}${piece === 'fosso' ? '' : ` — estágio ${st}`}${dmg ? ' (danificada)' : ''}`,
        description: `${WALL_NAMES[piece]}. Ocupa uma casa do contorno.${piece.startsWith('reta') || piece === 'portao' ? ' O trecho vai de uma ponta à outra do losango da casa, para os pedaços se encaixarem lado a lado formando uma muralha contínua.' : ''}${piece === 'portao' ? ' Mesma direção da muralha reta ↘, com o portão de madeira na face da frente.' : ''}${piece === 'fosso' ? '' : [' Estágio 1: paliçada de troncos de madeira.', ' Estágio 2: muro de pedra simples com ameias.', ' Estágio 3: muro alto de pedra clara, imponente, com ameias e detalhes.'][st - 1]}${dmg ? ' Versão com rachaduras e pedras caídas.' : ''}`,
        w: TILE_W,
        h: TILE_H + 90,
        iso: true,
        draw: (c, w, h) => drawWallPiece(c, piece, w, st, dmg, h),
      });
    }
  }
}

// Mapa -------------------------------------------------------------------------------------

const TERRAIN_NAMES: Record<string, string> = {
  mar: 'Mar',
  grama: 'Campo de grama',
  terra: 'Terra',
  areia: 'Areia da praia',
  neve: 'Neve',
  colina: 'Colina',
  montanha: 'Montanha (intransponível)',
  rio: 'Rio',
  vau: 'Vau (travessia rasa do rio)',
  floresta: 'Floresta densa',
  bosque: 'Bosque',
  pantano: 'Pântano',
  estrada: 'Estrada',
  ponte: 'Ponte sobre o rio',
  costa: 'Transição areia → mar',
};
for (const t of TERRAIN_KINDS) {
  const tall = t === 'montanha' || t === 'floresta' || t === 'bosque' || t === 'colina';
  add({ key: `terreno-${t}`, group: 'terreno', name: TERRAIN_NAMES[t], description: `${TERRAIN_NAMES[t]}. Casa do mapa-múndi.`, w: TILE_W, h: tall ? TILE_H + 80 : TILE_H, iso: true, draw: (c, w, h) => drawTerrainTile(c, t, w, h) });
}
const DEPOSIT_NAMES: Record<string, string> = { iron: 'Ferro', stone: 'Pedra', gold: 'Ouro', diamond: 'Diamante', fertile: 'Solo fértil', fish: 'Cardume (pesca)' };
for (const [k, n] of Object.entries(DEPOSIT_NAMES)) {
  for (const dep of [false, true]) {
    add({ key: `deposito-${k}${dep ? '-esgotado' : ''}`, group: 'depositos', name: `${n}${dep ? ' (esgotado)' : ''}`, description: `Depósito de ${n.toLowerCase()} no mapa${dep ? ', já esgotado' : ''}.`, w: 128, h: 128, iso: true, draw: (c, w) => drawDeposit(c, k, w, dep) });
  }
}
const MAP_OBJ: Record<string, string> = {
  capital: 'Capital',
  city: 'Cidade',
  village: 'Aldeia',
  castle: 'Castelo',
  outpost: 'Entreposto',
  camp: 'Acampamento de bandidos',
  'camp-ruin': 'Acampamento de bandidos em ruínas',
  tribe1: 'Acampamento tribal (nível 1)',
  tribe2: 'Aldeia tribal (nível 2)',
  tribe3: 'Fortaleza tribal (nível 3)',
  tribe4: 'Confederação tribal (nível 4)',
};
for (const [k, n] of Object.entries(MAP_OBJ)) {
  add({ key: `mapa-${k}`, group: 'mapa', name: n, description: `${n} visto no mapa-múndi.`, w: 128, h: 128, iso: true, draw: (c, w) => drawMapSettlement(c, k, w) });
}
add({ key: 'mapa-batalha', group: 'mapa', name: 'Batalha em andamento', description: 'Marca de batalha (espadas cruzadas, poeira) sobre o local do combate.', w: 128, h: 128, iso: false, draw: (c, w) => drawEffect(c, 'batalha', w) });
const TRAVELERS: Record<string, string> = { wagon: 'Carroça de recursos', caravan: 'Caravana de comércio', messenger: 'Mensageiro a cavalo', colonists: 'Grupo de colonos', spy: 'Espião encapuzado', ship: 'Navio da horda' };
for (const [k, n] of Object.entries(TRAVELERS)) {
  add({ key: `viajante-${k}`, group: 'viajantes', name: n, description: `${n} se movendo pelo mapa.`, w: 64, h: 64, iso: true, draw: (c, w) => drawTraveler(c, k, w) });
}

// Soldados e heróis ------------------------------------------------------------------------

for (const id of UNIT_ART_IDS) {
  const u = UNITS[id as UnitId];
  add({ key: `retrato-${id}`, group: 'soldados', name: `${u.name} (retrato)`, description: `${u.description} Retrato de corpo inteiro.`, w: 256, h: 256, iso: false, draw: (c, w) => drawUnit(c, id, w, true) });
  add({ key: `boneco-${id}`, group: 'soldados', name: `${u.name} (boneco)`, description: `${u.name} pequeno para o mapa e as batalhas, virado para a direita.`, w: 64, h: 64, iso: true, draw: (c, w) => drawUnit(c, id, w, false) });
}
for (let i = 1; i <= 8; i++) {
  add({ key: `heroi-${i}`, group: 'herois', name: `Herói ${i}`, description: 'Retrato de herói (comandante ou cônsul). Faça rostos variados: jovens, velhos, homens e mulheres.', w: 256, h: 256, iso: false, draw: (c, w) => drawHeroPortrait(c, i, w) });
}

// Efeitos e ilustrações -----------------------------------------------------------------------

const EFFECT_NAMES: Record<string, string> = { fogo: 'Fogo', fumaca: 'Fumaça', poeira: 'Poeira de marcha', flecha: 'Flecha', impacto: 'Impacto na muralha', neve: 'Neve caindo', chuva: 'Chuva', batalha: 'Choque de batalha' };
for (const e of EFFECT_KINDS) {
  add({ key: `efeito-${e}`, group: 'efeitos', name: EFFECT_NAMES[e], description: `${EFFECT_NAMES[e]}. Pode ser uma tira de 4 quadros lado a lado (256 × 64 px) para animar.`, w: 64, h: 64, iso: false, draw: (c, w) => drawEffect(c, e, w) });
}
const ILL: Record<string, string> = {
  titulo: 'Tela de abertura: o castelo ao amanhecer',
  vitoria: 'Vitória numa batalha',
  derrota: 'Derrota (castelo em chamas, fumaça)',
  imperador: 'Coroação do Imperador do Continente X',
  'carta-secreta': 'Mensagem secreta do Continente Y (navio ao luar)',
};
for (const k of ILLUSTRATION_KINDS) {
  add({ key: `ilustracao-${k}`, group: 'ilustracoes', name: ILL[k], description: `${ILL[k]}.`, w: 768, h: 432, iso: false, draw: (c, w, h) => drawIllustration(c, k, w, h) });
}

export const ART_SPECS: ArtSpec[] = specs;
export const ART_BY_KEY: Map<string, ArtSpec> = new Map(specs.map((s) => [s.key, s]));

export function artFileName(key: string): string {
  return `${key}.png`;
}

/** Estágio visual pelo nível da construção. */
export function stageForLevel(level: number): number {
  return level >= 5 ? 3 : level >= 3 ? 2 : 1;
}

void TILE_H;
