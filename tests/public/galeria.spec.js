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

  test('deve renderizar os cards de álbuns no grid', async ({ page }) => {
    // Aguarda o grid carregar
    const gridContainer = page.locator('section > div.grid');
    await expect(gridContainer).toBeVisible();

    // Cada álbum mostra a capa do evento
    const imagens = gridContainer.locator('img');
    await expect(imagens.first()).toBeVisible();

    // O nome do evento é o título do card do álbum
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

  test('deve ter alt text correto nas capas e nas fotos do álbum', async ({ page }) => {
    const gridContainer = page.locator('section > div.grid');
    await expect(gridContainer).toBeVisible();

    // Na lista, cada imagem é a capa de um álbum
    await expect(gridContainer.getByAltText('Capa do álbum Retiro de Verão')).toBeVisible();
    await expect(gridContainer.getByAltText('Capa do álbum Congresso 2020')).toBeVisible();

    // Dentro do álbum, o alt segue o padrão "Evento - Local"
    await gridContainer.getByRole('button', { name: /Retiro de Verão/ }).click();

    const fotos = page.locator('section > div.grid img');
    const count = await fotos.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(fotos.nth(i)).toHaveAttribute('alt', 'Retiro de Verão - Sítio Boa Vista');
    }
  });

  test('deve agrupar as fotos em um álbum por evento', async ({ page }) => {
    const gridContainer = page.locator('section > div.grid');
    await expect(gridContainer).toBeVisible();

    // As fixtures têm 2 fotos do evento 1 e 1 foto do evento 3 → 2 álbuns
    await expect(gridContainer.locator('img')).toHaveCount(2);
    await expect(gridContainer.locator('h2')).toHaveCount(2);

    const retiro = gridContainer.getByRole('button', { name: /Retiro de Verão/ });
    const congresso = gridContainer.getByRole('button', { name: /Congresso 2020/ });
    await expect(retiro.getByText('2 fotos')).toBeVisible();
    await expect(congresso.getByText('1 foto', { exact: true })).toBeVisible();
  });

  test('deve mostrar só as fotos do evento ao abrir o álbum e voltar à lista', async ({ page }) => {
    await page.locator('section > div.grid').getByRole('button', { name: /Congresso 2020/ }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Congresso 2020' })).toBeVisible();
    await expect(page.locator('section > div.grid img')).toHaveCount(1);
    await expect(page.getByAltText(/^Retiro de Verão/)).toHaveCount(0);

    // O botão de voltar fecha o álbum em vez de sair da página
    await page.getByLabel('Voltar').click();
    await expect(page).toHaveURL('/galeria');
    await expect(page.getByRole('heading', { name: /Galeria de fotos/i })).toBeVisible();
    await expect(page.locator('section > div.grid img')).toHaveCount(2);
  });

  test('deve tratar erro (catch block) se a api falhar ao carregar galeria agregada', async ({ page }) => {
    await page.route('**/evento/', async route => route.abort('failed'));
    await page.goto('/galeria');

    // Deve renderizar a página vazia sem travar
    const titulo = page.getByRole('heading', { name: /Galeria de fotos/i });
    await expect(titulo).toBeVisible();

    // Sem fotos reais, mostra o estado vazio e nenhum álbum fictício
    await expect(page.getByText('Nenhuma foto publicada ainda.')).toBeVisible();
    await expect(page.locator('section > div.grid img')).toHaveCount(0);
  });

  test('deve mostrar o estado vazio quando nenhum evento tem fotos', async ({ page }) => {
    await page.route(/\/evento\/\d+\/galeria$/, async route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/galeria');

    await expect(page.getByText('Nenhuma foto publicada ainda.')).toBeVisible();
    await expect(page.locator('section > div.grid img')).toHaveCount(0);
  });
});
