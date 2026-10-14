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
}

export function isProvided(key: string): boolean {
  return provided.has(artFileName(key));
}

function renderDefault(key: string): HTMLCanvasElement {
  const spec = ART_BY_KEY.get(key);
  const c = document.createElement('canvas');
  if (!spec) {
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
