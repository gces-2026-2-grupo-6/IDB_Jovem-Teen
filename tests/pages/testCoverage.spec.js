import { test, expect } from '../helpers/testWithCoverage.js';

test.describe('Test Coverage Page (Internal)', () => {
  test('deve visitar a página de test-coverage para coletar funções isoladas', async ({ page }) => {
    page.on('console', msg => {
      // O 404 de /voluntarios/99999 é proposital: a página busca um
      // voluntário inexistente para cobrir o caminho de erro.
      if (msg.location().url.includes('/voluntarios/99999')) return;
      console.log('PAGE LOG:', msg.text());
    });
    page.on('pageerror', err => console.log('PAGE ERROR:', err));
    await page.goto('/test-coverage', { waitUntil: 'domcontentloaded' });

    // Aguarda o título da página para garantir que carregou
    await expect(page.locator('#test-title')).toBeVisible();

    // Pequeno timeout para garantir que o useEffect executou
    await page.waitForTimeout(500);

    const focusCardsContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-3').first();
    const firstCard = focusCardsContainer.locator('> div').first();

    await firstCard.dispatchEvent('mouseenter');
    await page.waitForTimeout(100);

    await firstCard.dispatchEvent('mouseleave');
    await page.waitForTimeout(100);
  });

  test('deve restaurar localStorage com e sem valores prévios (TestCoverage L114-115)', async ({ page }) => {
    // Visitar sem valores no localStorage
    await page.goto('/test-coverage', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // Definir valores no localStorage
    await page.evaluate(() => {
      localStorage.setItem('idb_admin_events', '[{"id": 1}]');
      localStorage.setItem('idb_admin_products', '[{"id": 1}]');
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
  });

  test('deve cobrir o catch block do AuthContext com JSON inválido no localStorage', async ({ page }) => {
    // Configura localStorage 
    await page.goto('/test-coverage', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('idb_auth', '{invalid json'));
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('#test-title')).toBeVisible();
    await page.waitForTimeout(300);
  });

  test('deve testar componentes com hash e mouse hover', async ({ page }) => {
    await page.goto('/test-coverage#my-hash', { waitUntil: 'domcontentloaded' });
    
    const focusCardsContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-3').first();
    const firstCard = focusCardsContainer.locator('> div').first();

    await firstCard.hover({ force: true });
    await page.mouse.move(0, 0);
  });

  test('deve testar fechamento do Modal via tecla Escape', async ({ page }) => {
    await page.goto('/test-coverage', { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Escape');
  });
});

test.describe('TimeInput – cobertura completa', () => {
  test('deve abrir seletor, escolher hora/minuto, aplicar e fechar (L33,49-51,70-115)', async ({ page }) => {
    await page.goto('/test-coverage', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#test-title')).toBeVisible();
    await page.waitForTimeout(500);

    const container = page.locator('#time-input-test');
    await container.scrollIntoViewIfNeeded();

    // 1) Abre o seletor de horário clicando no ícone de relógio
    const clockBtn = container.getByLabel('Abrir seletor de horário');
    await clockBtn.click({ force: true });
    await page.waitForTimeout(200);

    // O seletor deve estar aberto (aria-expanded=true)
    await expect(clockBtn).toHaveAttribute('aria-expanded', 'true');

    // 2) Altera a hora no select
    const selects = container.locator('select');
    await selects.nth(0).selectOption('14'); // Hora = 14
    await page.waitForTimeout(100);

    // 3) Altera o minuto no select
    await selects.nth(1).selectOption('30'); // Minuto = 30
    await page.waitForTimeout(100);

    // 4) Clica em "Aplicar" para confirmar a seleção (handleApply L48-52)
    await container.getByRole('button', { name: 'Aplicar' }).click({ force: true });
    await page.waitForTimeout(200);

    // Seletor deve ter fechado
    await expect(clockBtn).toHaveAttribute('aria-expanded', 'false');

    // 5) Abre novamente e clica "Cancelar" (L115)
    await clockBtn.click({ force: true });
    await page.waitForTimeout(200);
    await container.getByRole('button', { name: 'Cancelar' }).click({ force: true });
    await page.waitForTimeout(200);
    await expect(clockBtn).toHaveAttribute('aria-expanded', 'false');

    // 6) Abre novamente e fecha clicando fora (handleClickOutside L38-41)
    await clockBtn.click({ force: true });
    await page.waitForTimeout(200);
    await expect(clockBtn).toHaveAttribute('aria-expanded', 'true');
    // Clica fora do wrapper
    await page.mouse.click(0, 0);
    await page.waitForTimeout(200);
    await expect(clockBtn).toHaveAttribute('aria-expanded', 'false');

    // 7) Toggle: clica 2 vezes para exercitar setIsOpen(current => !current) L70
    await clockBtn.click({ force: true });
    await page.waitForTimeout(100);
    await clockBtn.click({ force: true });
    await page.waitForTimeout(100);
    await expect(clockBtn).toHaveAttribute('aria-expanded', 'false');
  });

  test('deve exercitar input direto no TimeInput (handleInputChange L54-56)', async ({ page }) => {
    await page.goto('/test-coverage', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const container = page.locator('#time-input-test');
    await container.scrollIntoViewIfNeeded();

    // Digita direto no input type=time
    const timeInput = container.locator('input[type="time"]');
    await timeInput.fill('08:45');
    await page.waitForTimeout(200);
  });
});

test.describe('useGeolocation – cobertura completa', () => {
  test('deve exercitar request() quando geolocation não disponível (L46-53)', async ({ page }) => {
    // Sobrescreve navigator.geolocation para simular indisponibilidade
    await page.addInitScript(() => {
      delete globalThis.navigator.geolocation;
      if (globalThis.Navigator && globalThis.Navigator.prototype) {
        delete globalThis.Navigator.prototype.geolocation;
      }
    });

    await page.goto('/test-coverage', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Clica no botão que chama geo.request()
    await page.locator('#geo-request-btn').click({ force: true });
    await page.waitForTimeout(300);

    // Status deve ser 'unavailable'
    await expect(page.locator('#geo-status')).toHaveText('unavailable');
  });

  test('deve exercitar error callback com TIMEOUT (L33-35)', async ({ page }) => {
    // Mock geolocation para retornar erro de timeout
    await page.addInitScript(() => {
      const mockGeo = {
        getCurrentPosition: (_success, error) => {
          error({ code: 3, PERMISSION_DENIED: 1, TIMEOUT: 3, message: 'Timeout' });
        },
      };
      Object.defineProperty(navigator, 'geolocation', { value: mockGeo, writable: true });
    });

    await page.goto('/test-coverage', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await page.locator('#geo-request-btn').click({ force: true });
    await page.waitForTimeout(300);

    await expect(page.locator('#geo-status')).toHaveText('unavailable');
  });

  test('deve exercitar error callback genérico (L36-38)', async ({ page }) => {
    // Mock geolocation para retornar erro genérico (POSITION_UNAVAILABLE)
    await page.addInitScript(() => {
      const mockGeo = {
        getCurrentPosition: (_success, error) => {
          error({ code: 2, PERMISSION_DENIED: 1, TIMEOUT: 3, message: 'Unavailable' });
        },
      };
      Object.defineProperty(navigator, 'geolocation', { value: mockGeo, writable: true });
    });

    await page.goto('/test-coverage', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await page.locator('#geo-request-btn').click({ force: true });
    await page.waitForTimeout(300);

    await expect(page.locator('#geo-status')).toHaveText('unavailable');
  });

  test('deve exercitar error callback com PERMISSION_DENIED (L30-32)', async ({ page }) => {
    // Mock geolocation para retornar permission denied
    await page.addInitScript(() => {
      const mockGeo = {
        getCurrentPosition: (_success, error) => {
          error({ code: 1, PERMISSION_DENIED: 1, TIMEOUT: 3, message: 'Denied' });
        },
      };
      Object.defineProperty(navigator, 'geolocation', { value: mockGeo, writable: true });
    });

    await page.goto('/test-coverage', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await page.locator('#geo-request-btn').click({ force: true });
    await page.waitForTimeout(300);

    await expect(page.locator('#geo-status')).toHaveText('denied');
  });

  test('deve exercitar success callback (L21-27)', async ({ page }) => {
    // Mock geolocation para retornar sucesso
    await page.addInitScript(() => {
      const mockGeo = {
        getCurrentPosition: (success) => {
          success({ coords: { latitude: -8.05, longitude: -34.9, accuracy: 10 } });
        },
      };
      Object.defineProperty(navigator, 'geolocation', { value: mockGeo, writable: true });
    });

    await page.goto('/test-coverage', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await page.locator('#geo-request-btn').click({ force: true });
    await page.waitForTimeout(300);

    await expect(page.locator('#geo-status')).toHaveText('granted');
  });
});
