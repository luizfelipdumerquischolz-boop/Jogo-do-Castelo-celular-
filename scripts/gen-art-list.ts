// Gera docs/LISTA-DE-ARTES.md a partir do registro de artes do jogo.
// Uso: npm run artes
import { mkdirSync, writeFileSync } from 'node:fs';
import { ART_SPECS, GROUPS, artFileName } from '../src/art/registry';

const lines: string[] = [];
lines.push('# Coroa de Pedra — lista de imagens');
lines.push('');
lines.push(`Total: **${ART_SPECS.length} imagens** em ${GROUPS.length} grupos. Esta lista é gerada pelo próprio jogo (\`npm run artes\`), então nunca fica desatualizada.`);
lines.push('');
lines.push('## Como entregar as imagens');
lines.push('');
lines.push('- Formato **PNG com fundo transparente** (menos os ladrilhos de chão e de terreno, que cobrem a casa inteira).');
lines.push('- Use **exatamente o nome do arquivo** indicado (letras minúsculas, sem acento, com hífens).');
lines.push('- O tamanho indicado é o recomendado. Pode ser maior se mantiver a proporção (por exemplo, o dobro).');
lines.push('- **Isométrico 2:1**: uma casa do chão tem 128 × 64 px (losango). Luz vindo de cima e da esquerda.');
lines.push('- Pode mandar aos poucos: cada imagem que chegar substitui o desenho provisório do jogo. As que faltarem continuam com o desenho padrão.');
lines.push('- No jogo, a tela **Mais → Lista de artes** mostra quais já foram entregues.');
lines.push('');
lines.push('## Resumo');
lines.push('');
lines.push('| Grupo | Quantidade |');
lines.push('|---|---|');
for (const g of GROUPS) lines.push(`| ${g.title} | ${ART_SPECS.filter((s) => s.group === g.id).length} |`);
lines.push(`| **Total** | **${ART_SPECS.length}** |`);
lines.push('');
for (const g of GROUPS) {
  const list = ART_SPECS.filter((s) => s.group === g.id);
  if (!list.length) continue;
  lines.push(`## ${g.title} (${list.length})`);
  lines.push('');
  lines.push(g.intro);
  lines.push('');
  list.forEach((s, i) => {
    lines.push(`${i + 1}. **${s.name}** — \`${artFileName(s.key)}\` · ${s.w} × ${s.h} px · ${s.iso ? 'isométrico' : 'plano'}  `);
    lines.push(`   ${s.description}`);
  });
  lines.push('');
}
mkdirSync('docs', { recursive: true });
writeFileSync('docs/LISTA-DE-ARTES.md', lines.join('\n'));
console.log(`docs/LISTA-DE-ARTES.md: ${ART_SPECS.length} imagens`);
