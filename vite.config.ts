import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** Lista todos os arquivos gerados em dist/ (relativos), em ordem estável. */
function listFiles(dir: string, root = dir): string[] {
  return readdirSync(dir)
    .flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? listFiles(full, root) : [relative(root, full).split('\\').join('/')];
    })
    .sort();
}

/**
 * Gera dist/sw.js depois do build com a lista de todos os arquivos do jogo.
 * O service worker guarda tudo no cache na instalação e depois responde só do cache:
 * o jogo funciona 100% offline e nunca busca nada na rede.
 */
function offlineServiceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'offline-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const files = listFiles(outDir).filter((f) => f !== 'sw.js');
      const hash = createHash('sha256');
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const version = hash.digest('hex').slice(0, 12);
      const template = readFileSync('src/sw-template.js', 'utf8');
      const sw = template
        .replace('__VERSION__', version)
        .replace('__FILES__', JSON.stringify(['./', ...files.map((f) => `./${f}`)], null, 2));
      writeFileSync(join(outDir, 'sw.js'), sw);
    },
  };
}

export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0 },
  plugins: [offlineServiceWorker()],
});
