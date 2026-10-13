import { defineConfig, devices } from '@playwright/test';

// Faz o Playwright reportar também as requisições feitas pelo service worker,
// para o teste offline provar que nada sai para a rede.
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173/',
    ...devices['Pixel 5'],
    viewport: { width: 360, height: 740 },
  },
  projects: [{ name: 'celular', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
