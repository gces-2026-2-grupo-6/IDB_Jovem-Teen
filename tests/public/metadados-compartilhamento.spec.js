import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

// Regressão: a cliente relatou que "ao compartilhar aparece o nome do link e
// não aparece foto" — sem tags Open Graph o WhatsApp não monta a prévia do link.
// (O idioma e a duplicação de líderes, relatados junto no mesmo defeito, já
// são cobertos por tests/public/idioma.spec.js.)

test.describe('Metadados de compartilhamento', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
  });

  test('deve conter tags Open Graph para compartilhamento', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', /.+/);
  });
});
