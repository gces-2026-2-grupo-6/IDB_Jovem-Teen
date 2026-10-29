import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

test.describe('Página Eventos Próximos', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await page.goto('/eventos-proximos');
  });

  test('deve exibir o título corretamente', async ({ page }) => {
    const titulo = page.getByRole('heading', { name: 'Eventos mais Próximos de Você' });
    await expect(titulo).toBeVisible();
  });

  test('deve possuir um mapa (Leaflet) carregado', async ({ page }) => {
    /* A página só troca "Obtendo sua localização..." pelo mapa quando a
       geolocalização responde. Sem permissão concedida, quem responde é o
       `timeout: 10000` do useGeolocation, e o teste passava a depender de uma
       corrida: 10s de espera do navegador contra 15s de orçamento da asserção.
       Em máquina carregada, ou com os dois servidores de pé e um worker só, a
       corrida se perde. Mocando a localização como o teste dos marcadores já
       faz, o mapa aparece de imediato e o que se verifica continua sendo o
       mesmo: que o container do Leaflet é renderizado. */
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({ coords: { latitude: -8.05, longitude: -34.9 } });
      };
      navigator.geolocation.watchPosition = (success) => {
        success({ coords: { latitude: -8.05, longitude: -34.9 } });
        return 1;
      };
    });

    /* O beforeEach já navegou; o initScript vale da próxima navegação em diante. */
    await page.goto('/eventos-proximos');

    // O mapa agora é renderizado com Leaflet (não mais um iframe do Google)
    const mapa = page.locator('.leaflet-container');
    await expect(mapa).toBeVisible({ timeout: 15000 });
  });

  test('deve possuir um botão para voltar', async ({ page }) => {
    // Vamos de / para /eventos-proximos para testar navegação de volta
    await page.goto('/');
    await page.goto('/eventos-proximos');

    const btnVoltar = page.getByLabel('Voltar');
    await expect(btnVoltar).toBeVisible();
    
    await btnVoltar.click();
    await expect(page).toHaveURL('/');
  });

  test('deve exibir mensagem de erro se fetchAllEvents falhar', async ({ page }) => {
    await page.route('**/evento/', async route => {
      await route.abort('failed');
    });
    await page.goto('/eventos-proximos');

    const msgErro = page.getByText('Não foi possível carregar os eventos.');
    await expect(msgErro).toBeVisible();
  });

  test('deve ordenar por data quando a localização não estiver disponível', async ({ page }) => {
    // Força o erro de geolocalização mockando o navegador
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (success, error) => {
        error({ code: 1, message: "User denied Geolocation", PERMISSION_DENIED: 1 });
      };
    });

    await page.goto('/eventos-proximos');
    
    // O fallback message deve estar visível
    const fallbackMsg = page.getByText(/User denied Geolocation|Permissão de localização negada|Mostrando todos os eventos por data/i);
    await expect(fallbackMsg.first()).toBeVisible();

    // A lista de eventos deve aparecer. A asserção espera a lista: contar
    // uma vez só corria contra a carga dos eventos e falhava no WebKit.
    const list = page.locator('a[href^="/eventos/"]');
    await expect(list.first()).toBeVisible();
  });

  test('deve interagir com os marcadores do mapa (abrir e fechar)', async ({ page }) => {
    // Mocka a localização com sucesso para os marcadores aparecerem corretamente
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({ coords: { latitude: -8.05, longitude: -34.9 } });
      };
      // Permite watchPosition tbm
      navigator.geolocation.watchPosition = (success) => {
        success({ coords: { latitude: -8.05, longitude: -34.9 } });
        return 1;
      };
    });

    await page.goto('/eventos-proximos');
    
    // Espera o mapa carregar os marcadores
    const mapa = page.locator('.leaflet-container');
    await expect(mapa).toBeVisible({ timeout: 15000 });

    // O marcador do evento pode ser o segundo ou o terceiro (o primeiro é a localização do usuário)
    const marcadores = page.locator('.leaflet-marker-icon');
    await expect(marcadores).toHaveCount(3);
    const marcadorEvento = marcadores.nth(1);
    await marcadorEvento.waitFor({ state: 'visible' });
    // O popup (com botão 'Ver evento') deve aparecer. O clique se repete: no
    // WebKit o primeiro toque às vezes chega antes do mapa assentar e o
    // Leaflet o descarta.
    const popup = page.locator('.leaflet-popup');
    await expect(async () => {
      await marcadorEvento.click({ force: true });
      await expect(popup).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(popup.getByRole('link', { name: /Ver evento/i })).toBeVisible();

    // Testa fechar o popup
    const closeBtn = page.locator('.leaflet-popup-close-button');
    await closeBtn.click();
    await expect(popup).not.toBeVisible();
  });
});
