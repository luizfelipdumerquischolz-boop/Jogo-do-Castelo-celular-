import { expect, test } from '@playwright/test';

test('joga offline: abre, constrói uma fazenda e treina uma tropa sem nenhuma requisição de rede', async ({ page, context }) => {
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
    // Requisições feitas pela página e atendidas pelo service worker não saem para a rede;
    // as que o próprio service worker fizesse (fetch de verdade) seriam registradas aqui.
    if (req.serviceWorker()) network.push(`sw: ${req.url()}`);
  });
  context.on('requestfailed', (req) => failed.push(req.url()));
  page.on('response', (res) => {
    if (!res.fromServiceWorker()) network.push(`rede: ${res.url()}`);
  });

  await page.reload();
  await expect(page.getByTestId('tab-castle')).toBeVisible();
  await expect(page.getByTestId('level-farm')).toHaveText('Nv 0/5');

  // Constrói a fazenda.
  await page.getByTestId('upgrade-farm').click();
  await expect(page.getByTestId('progress-farm')).toBeVisible();
  await expect(page.getByTestId('level-farm')).toHaveText('Nv 1/5', { timeout: 15_000 });

  // Constrói o quartel e treina um lanceiro.
  await expect(page.getByTestId('upgrade-barracks')).toBeEnabled();
  await page.getByTestId('upgrade-barracks').click();
  await expect(page.getByTestId('level-barracks')).toHaveText('Nv 1/5', { timeout: 20_000 });
  await page.getByTestId('tab-army').click();
  await expect(page.getByTestId('troops-spearman')).toHaveText('0');
  await page.getByTestId('train-spearman-1').click();
  await expect(page.getByTestId('troops-spearman')).toHaveText('1', { timeout: 15_000 });

  // O mapa abre e mostra o castelo do jogador e as fortalezas inimigas.
  await page.getByTestId('tab-map').click();
  await expect(page.getByTestId('fort-player')).toBeVisible();
  expect(await page.locator('.cell.fort').count()).toBeGreaterThanOrEqual(9);
  await page.getByTestId('fort-bandit-ratos').click();
  await expect(page.getByTestId('sheet')).toContainText('Covil dos Ratos de Estrada');

  // O progresso foi salvo no IndexedDB e sobrevive a um recarregamento offline.
  await page.waitForTimeout(500);
  await page.reload();
  await page.getByTestId('tab-army').click();
  await expect(page.getByTestId('troops-spearman')).toHaveText('1');
  await page.getByTestId('tab-castle').click();
  await expect(page.getByTestId('level-farm')).toHaveText('Nv 1/5');

  expect(network, 'nenhuma requisição deve ir para a rede').toEqual([]);
  expect(failed, 'nenhuma requisição deve falhar').toEqual([]);
});

test('cabe em tela retrato de 360px sem rolagem horizontal', async ({ page }) => {
  await page.goto('/');
  for (const tab of ['castle', 'army', 'map', 'reports']) {
    await page.getByTestId(`tab-${tab}`).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `aba ${tab}`).toBeLessThanOrEqual(0);
  }
});
