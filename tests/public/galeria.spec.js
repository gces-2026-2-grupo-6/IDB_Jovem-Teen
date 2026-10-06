import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

test.describe('Página de Galeria', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await page.goto('/galeria');
  });

  test('deve exibir o título da galeria corretamente', async ({ page }) => {
    const titulo = page.getByRole('heading', { name: /Galeria de fotos/i });
    await expect(titulo).toBeVisible();
    await expect(page.getByText('dos eventos')).toBeVisible();
  });

  test('deve exibir botão de voltar e funcionar corretamente', async ({ page }) => {
    // Vamos de outra página para testar o historico
    await page.goto('/');
    await page.goto('/galeria');

    const btnVoltar = page.getByLabel('Voltar');
    await expect(btnVoltar).toBeVisible();

    await btnVoltar.click();
    await expect(page).toHaveURL('/');
  });

  test('deve renderizar um card por álbum no grid', async ({ page }) => {
    // Aguarda o grid carregar
    const gridContainer = page.locator('section > div.grid');
    await expect(gridContainer).toBeVisible();

    // Cada álbum tem a capa e o nome do evento, num h2
    const capas = gridContainer.locator('img');
    await expect(capas.first()).toBeVisible();

    const nomesEventos = gridContainer.locator('h2');
    await expect(nomesEventos.first()).toBeVisible();
  });

  test('deve exibir localização nos cards de galeria', async ({ page }) => {
    const gridContainer = page.locator('section > div.grid');
    await expect(gridContainer).toBeVisible();

    // Os cards devem ter localização
    const locations = gridContainer.locator('p');
    const count = await locations.count();
    expect(count).toBeGreaterThan(0);

    // Localizações específicas das fixtures
    await expect(gridContainer.getByText('Sítio Boa Vista').first()).toBeVisible();
    await expect(gridContainer.getByText('Centro de Convenções')).toBeVisible();
  });

  test('deve ter alt text correto nas capas dos álbuns', async ({ page }) => {
    const gridContainer = page.locator('section > div.grid');
    await expect(gridContainer).toBeVisible();

    const capas = gridContainer.locator('img');
    const count = await capas.count();
    expect(count).toBeGreaterThan(0);

    // A capa se identifica como capa, e não como uma foto qualquer do evento
    for (let i = 0; i < count; i++) {
      const alt = await capas.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt).toMatch(/^Capa do álbum /);
    }

    await expect(capas.first()).toHaveAttribute('alt', 'Capa do álbum Retiro de Verão');
  });

  test('deve usar o padrão "Evento - Local" no alt das fotos dentro do álbum', async ({ page }) => {
    await page.getByRole('button', { name: /Capa do álbum Retiro de Verão|Retiro de Verão/ }).first().click();

    const fotos = page.locator('section > div.grid img');
    const count = await fotos.count();
    expect(count).toBe(2);

    for (let i = 0; i < count; i++) {
      await expect(fotos.nth(i)).toHaveAttribute('alt', 'Retiro de Verão - Sítio Boa Vista');
    }
  });

  test('deve agrupar as fotos em um álbum por evento', async ({ page }) => {
    const gridContainer = page.locator('section > div.grid');
    await expect(gridContainer).toBeVisible();

    /* As fixtures têm 2 fotos do evento 1 e 1 do evento 3. Depois da US07 a
       galeria agrupa por evento, então são 2 álbuns — não 3 cards de foto. */
    const capas = gridContainer.locator('img');
    expect(await capas.count()).toBe(2);

    const eventNames = gridContainer.locator('h2');
    expect(await eventNames.count()).toBe(2);

    await expect(gridContainer.getByText('Retiro de Verão').first()).toBeVisible();
    await expect(gridContainer.getByText('Congresso 2020').first()).toBeVisible();

    // A contagem de fotos de cada álbum aparece no card
    await expect(gridContainer.getByText('2 fotos')).toBeVisible();
    await expect(gridContainer.getByText('1 foto')).toBeVisible();
  });

  test('deve abrir o álbum e voltar para a lista de álbuns', async ({ page }) => {
    await page.getByRole('button', { name: /Retiro de Verão/ }).first().click();

    // Dentro do álbum: título do evento e as fotos dele
    await expect(page.getByRole('heading', { name: 'Retiro de Verão' })).toBeVisible();
    await expect(page.getByText('2 fotos')).toBeVisible();
    expect(await page.locator('section > div.grid img').count()).toBe(2);

    // O botão de voltar devolve à lista, sem sair da página
    await page.getByLabel('Voltar').click();

    await expect(page.getByRole('heading', { name: /Galeria de fotos/i })).toBeVisible();
    expect(await page.locator('section > div.grid img').count()).toBe(2);
    await expect(page).toHaveURL(/\/galeria$/);
  });

  test('deve tratar erro (catch block) se a api falhar ao carregar galeria agregada', async ({ page }) => {
    await page.route('**/evento/', async route => route.abort('failed'));
    await page.goto('/galeria');
    
    // Deve renderizar a página vazia sem travar
    const titulo = page.getByRole('heading', { name: /Galeria de fotos/i });
    await expect(titulo).toBeVisible();

    // A grid não deve ter imagens
    const imagens = page.locator('section > div.grid img');
    expect(await imagens.count()).toBe(0);
  });
});
