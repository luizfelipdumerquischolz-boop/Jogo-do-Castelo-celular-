import './ui/style.css';
import { initArt } from './art/loader';
import { Engine } from './client/engine';
import { App } from './ui/app';

async function boot(): Promise<void> {
  let app: App | null = null;
  await initArt(() => {
    if (app) {
      app.map.dirty = true;
      app.city.dirty = true;
    }
  });
  const params = new URLSearchParams(location.search);
  const engine = new Engine(params.get('worker') !== '0');
  app = new App(engine);
  (window as unknown as { app: App }).app = app;
  app.resize();
  await app.boot();
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker não registrado', err));
  });
}

void boot();
