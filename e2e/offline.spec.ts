import { expect, test } from '@playwright/test';

test('joga offline: abre, constrói, recruta e o progresso fica salvo, sem nenhuma requisição de rede', async ({ page, context }) => {
  // 1ª visita (online): o service worker instala e guarda o jogo inteiro no cache.
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  // Daqui em diante: sem rede. Qualquer requisição que saia do navegador é registrada.
  await context.setOffline(true);
  const network: string[] = [];
  const failed: string[] = [];
  context.on('request', (req) => {
    if (req.serviceWorker()) network.push(`sw: ${req.url()}`);
  });
  context.on('requestfailed', (req) => failed.push(req.url()));
  page.on('response', (res) => {
    if (!res.fromServiceWorker()) network.push(`rede: ${res.url()}`);
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.reload();
  await page.getByTestId('start-game').click();
  await expect(page.getByTestId('resbar')).toBeVisible();

  // Constrói um quartel arrastando o fantasma para um lugar livre.
  await page.getByTestId('open-build').click();
  await page.getByRole('button', { name: 'Militar' }).click();
  await page.getByTestId('pick-barracks').click();
  await expect(page.getByTestId('ghost-confirm')).toBeEnabled();
  await page.getByTestId('ghost-confirm').click();

  // Espera a obra (o tempo do jogo anda acelerado no teste).
  await page.evaluate(() => (window as unknown as { app: { engine: { speed(x: number): void } } }).app.engine.speed(8));
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const st = (window as unknown as { app: { state: { settlements: { buildings: { type: string; build: unknown }[] }[] } } }).app.state;
          return st.settlements.some((s) => s.buildings.some((b) => b.type === 'barracks' && !b.build));
        }),
      { timeout: 30_000 },
    )
    .toBe(true);

  // Recruta um lanceiro pelo painel.
  await page.getByTestId('open-overview').click();
  await page.getByRole('button', { name: 'Defesa' }).click();
  await page.locator('[data-action=open-recruit]').first().click();
  await page.getByTestId('recruit-spearman-1').click();

  // O mapa abre e mostra o reino.
  await page.getByTestId('tab-map').click();
  await expect(page.locator('#map')).toBeVisible();

  // O progresso foi salvo no IndexedDB e sobrevive a um recarregamento offline.
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(page.getByTestId('start-game')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const st = (window as unknown as { app: { state?: { settlements: { buildings: { type: string }[] }[] } } }).app.state;
        return !!st && st.settlements.some((s) => s.buildings.some((b) => b.type === 'barracks'));
      }),
    )
    .toBe(true);

  expect(errors, 'sem erros na página').toEqual([]);
  expect(network, 'nenhuma requisição deve ir para a rede').toEqual([]);
  expect(failed, 'nenhuma requisição deve falhar').toEqual([]);
});

test('cabe em tela retrato de 360px sem rolagem horizontal', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-game').click();
  for (const tab of ['city', 'map', 'armies', 'letters', 'more']) {
    await page.getByTestId(`tab-${tab}`).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `aba ${tab}`).toBeLessThanOrEqual(0);
  }
});
