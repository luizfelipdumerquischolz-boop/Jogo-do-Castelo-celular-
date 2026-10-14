import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { ART_BY_KEY, ART_SPECS, GROUPS, artFileName } from '../src/art/registry';
import { BUILDINGS } from '../src/sim/data/buildings';
import { UNITS } from '../src/sim/data/units';
import { ITEMS } from '../src/sim/data/items';

const PREFIX = /['`"]((?:ui|icone|construcao|andaime|chao|decoracao|muralha|terreno|deposito|mapa|viajante|retrato|boneco|heroi|efeito|ilustracao)-[a-z0-9-]+)['`"]/g;

describe('registro de artes', () => {
  test('cada arte tem nome de arquivo único, grupo, tamanho e descrição', () => {
    const files = new Set<string>();
    const groups = new Set(GROUPS.map((g) => g.id));
    for (const s of ART_SPECS) {
      expect(files.has(artFileName(s.key)), s.key).toBe(false);
      files.add(artFileName(s.key));
      expect(groups.has(s.group), s.key).toBe(true);
      expect(s.w).toBeGreaterThan(0);
      expect(s.h).toBeGreaterThan(0);
      expect(s.name.length, s.key).toBeGreaterThan(1);
      expect(s.description.length, s.key).toBeGreaterThan(5);
    }
  });

  test('toda construção tem 3 estágios e toda tropa tem retrato e boneco', () => {
    for (const id of Object.keys(BUILDINGS)) for (const st of [1, 2, 3]) expect(ART_BY_KEY.has(`construcao-${id}-${st}`), `${id}-${st}`).toBe(true);
    for (const id of Object.keys(UNITS)) {
      expect(ART_BY_KEY.has(`retrato-${id}`), id).toBe(true);
      expect(ART_BY_KEY.has(`boneco-${id}`), id).toBe(true);
    }
  });

  test('todo recurso e item tem ícone', () => {
    for (const id of Object.keys(ITEMS)) expect(ART_BY_KEY.has(`icone-${id}`), id).toBe(true);
  });

  test('todas as artes citadas pela interface existem no registro', () => {
    const dirs = ['../src/ui', '../src/client'].map((d) => join(__dirname, d));
    const missing: string[] = [];
    for (const dir of dirs) for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
      const src = readFileSync(join(dir, f), 'utf8');
      for (const m of src.matchAll(PREFIX)) if (!m[1].endsWith('-') && !ART_BY_KEY.has(m[1])) missing.push(`${f}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });
});
