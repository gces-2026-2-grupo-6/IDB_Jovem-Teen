import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

/* O servidor de desenvolvimento serve os modulos de `src/` um a um; o build
   serve um bundle unico. Parte da suite depende do primeiro: ela importa
   `/src/services/...` dentro do navegador para exercitar funcao por funcao, e e
   tambem de onde sai a cobertura do vite-plugin-istanbul, que so instrumenta em
   dev. Essa parte esta marcada com a tag `@fonte`.

   No CI os dois servidores sobem e cada natureza roda onde funciona: os testes
   de tela contra o build publicado, os marcados com `@fonte` contra o dev.
   Localmente so o dev sobe e tudo aponta para ele, para o `npm run test:coverage`
   continuar medindo a suite inteira. */
const PORTA_DEV = 5173;
const PORTA_BUILD = 4173;

const URL_DEV = `http://localhost:${PORTA_DEV}`;
const URL_BUILD = CI ? `http://localhost:${PORTA_BUILD}` : URL_DEV;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,
  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      /* O que o visitante e o administrador veem, contra o artefato que vai
         para producao. */
      name: 'build',
      grepInvert: /@fonte/,
      use: { ...devices['Desktop Chrome'], baseURL: URL_BUILD },
    },
    {
      /* Testes que importam modulo de `src/` dentro do navegador. Rodam no dev
         porque o caminho `/src/...` nao existe no build. */
      name: 'fonte',
      grep: /@fonte/,
      use: { ...devices['Desktop Chrome'], baseURL: URL_DEV },
    },
  ],

  webServer: CI
    ? [
        {
          command: 'npm run dev',
          url: URL_DEV,
          reuseExistingServer: false,
          timeout: 120000,
        },
        {
          command: `npm run preview -- --port ${PORTA_BUILD}`,
          url: `http://localhost:${PORTA_BUILD}`,
          reuseExistingServer: false,
          timeout: 120000,
        },
      ]
    : [
        {
          command: 'npm run dev',
          url: URL_DEV,
          reuseExistingServer: true,
          timeout: 120000,
        },
      ],
});
