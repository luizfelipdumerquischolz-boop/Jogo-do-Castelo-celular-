// Gera docs/PROMPTS-DE-IMAGENS.txt: um texto pronto para colar numa IA de imagens para cada arte do jogo.
// Uso: npm run artes
import { mkdirSync, writeFileSync } from 'node:fs';
import { ART_SPECS, GROUPS, artFileName, type ArtSpec } from '../src/art/registry';

const STYLE =
  'Estilo: arte digital pintada à mão, jogo de estratégia medieval para celular (no espírito de Stronghold e Empire: Four Kingdoms), cores quentes e saturadas, contornos limpos, bem legível em tamanho pequeno. Sem texto, sem letras, sem logotipo, sem marca d\'água.';

const RATIOS: [number, number][] = [[1, 1], [4, 3], [3, 4], [3, 2], [2, 3], [16, 9], [9, 16], [2, 1], [1, 2], [8, 3], [4, 1], [5, 4], [4, 5], [6, 5], [5, 6]];

/** Proporção comum mais próxima (as IAs costumam aceitar só estas). */
function ratio(w: number, h: number): string {
  let best = RATIOS[0];
  for (const r of RATIOS) if (Math.abs(Math.log(r[0] / r[1] / (w / h))) < Math.abs(Math.log(best[0] / best[1] / (w / h)))) best = r;
  const exact = best[0] / best[1] === w / h;
  return `${exact ? '' : 'cerca de '}${best[0]}:${best[1]}`;
}

/** Descrição sem repetir o nome. */
function details(s: ArtSpec): string {
  const head = s.name.split(' — ')[0];
  let d = s.description;
  if (d.startsWith(head)) d = d.slice(head.length).replace(/^[.:,]\s*/, '');
  return d ? ` ${d}` : '';
}

function framing(s: ArtSpec): string {
  switch (s.group) {
    case 'interface':
      return 'Peça de interface vista de frente (sem perspectiva). Fundo transparente onde não houver a peça.';
    case 'icones-interface':
    case 'icones-recursos':
    case 'icones-status':
      return 'Ícone plano visto de frente, sem perspectiva, um único objeto centralizado ocupando quase toda a imagem, com contorno escuro fino. Fundo transparente.';
    case 'chao':
    case 'terreno':
      return 'Visão isométrica 2:1 vista de cima em ângulo (como em jogos de construção). O desenho é um losango deitado que ocupa a largura inteira da imagem, com a ponta de baixo encostando no pé da imagem; deve se repetir lado a lado sem emendas. Tudo fora do losango é transparente (relevo e árvores podem subir acima do losango).';
    case 'construcoes':
    case 'obras':
    case 'muralhas':
      return 'Visão isométrica 2:1 (ângulo de cerca de 30 graus, como em jogos de construção de cidade), luz vindo de cima e da esquerda, sombras suaves para a direita. O objeto fica centralizado e a ponta de baixo do seu chão encosta no pé da imagem. Fundo transparente, sem chão em volta.';
    case 'depositos':
    case 'mapa':
      return 'Ícone para mapa-múndi visto levemente de cima (isométrico suave), centralizado, com a base encostando embaixo. Fundo transparente.';
    case 'viajantes':
    case 'efeitos':
      return 'Sprite pequeno visto em isométrico suave, centralizado, legível mesmo bem pequeno. Fundo transparente.';
    case 'soldados':
      return s.key.startsWith('boneco-')
        ? 'Boneco pequeno de corpo inteiro em vista isométrica suave, virado para a direita, pés encostando embaixo, legível em 32 px. Fundo transparente.'
        : 'Retrato de corpo inteiro, de frente e levemente de lado, pose heroica, centralizado. Fundo transparente.';
    case 'herois':
      return 'Retrato do peito para cima, de frente e levemente de lado, expressão marcante. Fundo transparente ou neutro escuro.';
    case 'ilustracoes':
      return 'Ilustração de cena, cinematográfica, cheia de detalhes, ocupando a imagem toda.';
    default:
      return 'Fundo transparente.';
  }
}

const out: string[] = [];
out.push('COROA DE PEDRA — TEXTOS PARA GERAR AS IMAGENS');
out.push('');
out.push(`São ${ART_SPECS.length} imagens. Cada bloco abaixo é um pedido completo: copie do "Crie" até o fim do bloco e cole na IA de imagens.`);
out.push('');
out.push('Dicas:');
out.push('- Faça tudo na mesma conversa da IA, assim o estilo fica parecido entre as imagens. Se uma sair diferente, diga "use o mesmo estilo da imagem anterior".');
out.push('- Peça sempre PNG com fundo transparente (menos as ilustrações).');
out.push('- Salve cada imagem com o nome de arquivo indicado no bloco (exatamente igual) e me mande. Pode mandar aos poucos.');
out.push('- O tamanho em pixels é o ideal; se a IA não deixar escolher, use a proporção indicada que eu ajusto.');
out.push('');
let n = 0;
for (const g of GROUPS) {
  const list = ART_SPECS.filter((s) => s.group === g.id);
  if (!list.length) continue;
  out.push('');
  out.push('############################################################');
  out.push(`# ${g.title.toUpperCase()} (${list.length})`);
  out.push('############################################################');
  for (const s of list) {
    n++;
    out.push('');
    out.push(`=== ${n}/${ART_SPECS.length} · arquivo: ${artFileName(s.key)} ===`);
    out.push(
      `Crie uma imagem para um jogo: ${s.name}.${details(s)} ${framing(s)} ${STYLE} Tamanho: ${s.w} × ${s.h} pixels (proporção ${ratio(s.w, s.h)}), formato PNG.`,
    );
  }
}
mkdirSync('docs', { recursive: true });
writeFileSync('docs/PROMPTS-DE-IMAGENS.txt', out.join('\n') + '\n');
console.log(`docs/PROMPTS-DE-IMAGENS.txt: ${n} textos`);
