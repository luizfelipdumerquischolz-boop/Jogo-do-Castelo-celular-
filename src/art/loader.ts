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
  try {
    const res = await fetch('./arte/ancoras.json');
    if (res.ok) anchors = (await res.json()) as Record<string, number>;
  } catch {
    anchors = {};
  }
  applyInterfaceArt();
}

/** Centro do chão (fração da altura) para artes cujo chão foi apagado. */
let anchors: Record<string, number> = {};

/** Peças de interface fornecidas viram regras de CSS (botões, barras, painéis, carta). */
/** Botão com arte: as pontas mantêm o desenho e só o miolo estica. */
function buttonRule(sel: string, u: string): string {
  return `${sel}{background:none;border-style:solid;border-color:transparent;border-width:0 18px;border-radius:0;border-image:url(${u}) 0 84 fill / 0 18px stretch;box-shadow:none;padding-left:4px;padding-right:4px;text-shadow:0 1px 2px rgba(0,0,0,.6)}`;
}

/** Peças de interface fornecidas viram regras de CSS (botões, barras, painéis, carta). */
const UI_RULES: [string, (url: string) => string][] = [
  ['ui-botao', (u) => buttonRule('.btn.primary', u)],
  ['ui-botao-perigo', (u) => buttonRule('.btn.danger', u)],
  ['ui-botao-neutro', (u) => buttonRule('.btn.neutral', u)],
  ['ui-botao-desativado', (u) => buttonRule('.btn.primary:disabled,.btn.danger:disabled,.btn.neutral:disabled', u) + '.btn.primary:disabled,.btn.danger:disabled,.btn.neutral:disabled{opacity:.8;color:#e8e8e8}'],
  ['ui-barra-topo', (u) => `#top{background:url(${u}) left center/auto 100% repeat-x;padding:calc(12px + env(safe-area-inset-top)) 10px 12px}`],
  ['ui-barra-inferior', (u) => `#nav{background:url(${u}) left center/auto 100% repeat-x}`],
  ['ui-painel', (u) => `#sheet{background:var(--parch);border:solid transparent;border-width:24px;border-radius:0;border-image:url(${u}) 56 fill / 24px stretch;padding:4px 6px}#sheet .sheet-scroll{padding:6px 4px 10px;-webkit-mask-image:linear-gradient(transparent,#000 10px,#000 calc(100% - 10px),transparent);mask-image:linear-gradient(transparent,#000 10px,#000 calc(100% - 10px),transparent)}`],
  ['ui-fundo', (u) => `#screen{background:url(${u}) center/512px repeat}`],
  ['ui-carta', (u) => `.letter-paper{background:url(${u}) center/100% 100% no-repeat;border:none;border-radius:0;padding:28px 26px}`],
  ['ui-moldura-retrato', (u) => `.pframe{position:relative;width:72px;height:72px;align-items:center;justify-content:center}.pframe .portrait{width:52px;height:52px;border:none;border-radius:50%;object-fit:cover;background:#3b2a1a}.pframe::after{content:'';position:absolute;inset:0;background:url(${u}) center/100% 100% no-repeat;pointer-events:none}`],
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

const anchorCache = new WeakMap<object, number>();

/**
 * Altura (em px da imagem) do centro do chão de uma arte isométrica fornecida.
 * Mede a borda de baixo do bloco: a ponta da frente e a inclinação dos lados.
 */
export function groundCenterY(img: Img, key?: string): number {
  if (key && anchors[key] != null) return anchors[key] * (img.height as number);
  const hit = anchorCache.get(img);
  if (hit !== undefined) return hit;
  const W = img.width as number;
  const H = img.height as number;
  let result = H - W / 4;
  try {
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const cx = cv.getContext('2d', { willReadFrequently: true })!;
    cx.drawImage(img, 0, 0);
    const data = cx.getImageData(0, 0, W, H).data;
    const low = new Float64Array(W).fill(-1);
    for (let x = 0; x < W; x++) {
      for (let y = H - 1; y >= 0; y--) {
        if (data[(y * W + x) * 4 + 3] > 100) {
          low[x] = y;
          break;
        }
      }
    }
    let xb = 0;
    for (let x = 0; x < W; x++) if (low[x] > low[xb]) xb = x;
    const tip = low[xb];
    // Inclinação média da borda de baixo, dos dois lados da ponta.
    const slopes: number[] = [];
    for (const dir of [-1, 1]) {
      const a = Math.round(xb + dir * W * 0.08);
      const b = Math.round(xb + dir * W * 0.32);
      if (a >= 0 && a < W && b >= 0 && b < W && low[a] >= 0 && low[b] >= 0) slopes.push((low[a] - low[b]) / Math.abs(b - a));
    }
    const s = slopes.length ? slopes.reduce((p, q) => p + q, 0) / slopes.length : 0.5;
    const slope = Math.min(0.8, Math.max(0.3, s));
    result = tip - slope * (W / 2) - W * 0.035;
  } catch {
    /* imagem ainda não pronta: usa a estimativa */
  }
  anchorCache.set(img, result);
  return result;
}
