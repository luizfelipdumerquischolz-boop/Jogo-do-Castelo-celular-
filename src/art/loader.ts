// Carrega as artes: usa o arquivo do jogador se existir em public/arte/, senão o desenho padrão.
import { ART_BY_KEY, artFileName } from './registry';

type Img = HTMLCanvasElement | HTMLImageElement;

const cache = new Map<string, Img>();
const urlCache = new Map<string, string>();
let provided = new Set<string>();
let onUpdate: () => void = () => {};

/** Lê public/arte/manifest.json (gerado no build) com a lista de artes fornecidas. */
export async function initArt(changed: () => void): Promise<void> {
  onUpdate = changed;
  try {
    const res = await fetch('./arte/manifest.json');
    if (res.ok) {
      const list = (await res.json()) as string[];
      provided = new Set(list);
    }
  } catch {
    provided = new Set();
  }
  applyInterfaceArt();
}

/** Peças de interface fornecidas viram regras de CSS (botões, barras, painéis, carta). */
const UI_RULES: [string, (url: string) => string][] = [
  ['ui-botao', (u) => `.btn.primary{background:url(${u}) center/100% 100% no-repeat;border-color:transparent}`],
  ['ui-botao-perigo', (u) => `.btn.danger{background:url(${u}) center/100% 100% no-repeat;border-color:transparent}`],
  ['ui-botao-neutro', (u) => `.btn.neutral{background:url(${u}) center/100% 100% no-repeat;border-color:transparent}`],
  ['ui-botao-desativado', (u) => `.btn:disabled{background:url(${u}) center/100% 100% no-repeat;border-color:transparent}`],
  ['ui-barra-topo', (u) => `#top{background:url(${u}) left center/auto 100% repeat-x}`],
  ['ui-barra-inferior', (u) => `#nav{background:url(${u}) left center/auto 100% repeat-x}`],
  ['ui-painel', (u) => `#sheet{background:url(${u}) center/100% 100%}`],
  ['ui-fundo', (u) => `#screen{background:url(${u}) repeat}`],
  ['ui-carta', (u) => `.letter-paper{background:url(${u}) center/100% 100% no-repeat}`],
  ['ui-moldura-retrato', (u) => `.portrait{position:relative}.portrait::after{content:'';position:absolute;inset:0;background:url(${u}) center/100% 100% no-repeat;pointer-events:none}`],
];

function applyInterfaceArt(): void {
  if (typeof document === 'undefined') return;
  const css = UI_RULES.filter(([k]) => isProvided(k))
    .map(([k, rule]) => rule(`./arte/${artFileName(k)}`))
    .join('\n');
  if (!css) return;
  const el = document.createElement('style');
  el.id = 'arte-interface';
  el.textContent = css;
  document.head.appendChild(el);
}

export function isProvided(key: string): boolean {
  return provided.has(artFileName(key));
}

function renderDefault(key: string): HTMLCanvasElement {
  const spec = ART_BY_KEY.get(key);
  const c = document.createElement('canvas');
  if (!spec) {
    console.warn('Arte desconhecida: ' + key);
    c.width = c.height = 4;
    return c;
  }
  c.width = spec.w;
  c.height = spec.h;
  const ctx = c.getContext('2d')!;
  spec.draw(ctx, spec.w, spec.h);
  return c;
}

/** Imagem pronta para desenhar no canvas. */
export function art(key: string): Img {
  let img = cache.get(key);
  if (img) return img;
  img = renderDefault(key);
  cache.set(key, img);
  if (isProvided(key)) {
    const real = new Image();
    real.onload = () => {
      cache.set(key, real);
      urlCache.delete(key);
      onUpdate();
    };
    real.src = `./arte/${artFileName(key)}`;
  }
  return img;
}

/** Endereço da imagem para usar em <img> na interface. */
export function artUrl(key: string): string {
  if (isProvided(key)) return `./arte/${artFileName(key)}`;
  let u = urlCache.get(key);
  if (!u) {
    const img = art(key);
    u = img instanceof HTMLCanvasElement ? img.toDataURL() : img.src;
    urlCache.set(key, u);
  }
  return u;
}

export function artSize(key: string): { w: number; h: number } {
  const s = ART_BY_KEY.get(key);
  return s ? { w: s.w, h: s.h } : { w: 1, h: 1 };
}
