import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

/* US14 — Evento cancelado ou adiado, nas telas públicas.
 *
 * O evento marcado **continua aparecendo**: o que muda é que um aviso informa
 * a situação e os botões de inscrição somem enquanto ela durar. Esconder o
 * evento tiraria do visitante justamente o aviso que a história quer dar.
 */

/* Serve o evento já marcado, antes de a tela abrir.

   Antes isto importava `/src/services/eventService.js` para chamar o PATCH do
   mock. Funcionava no servidor de desenvolvimento e **quebrava no CI**: o
   projeto `build` roda contra o bundle publicado, onde o caminho `/src/...`
   não existe. Marcar com `@fonte` resolveria, mas tiraria do build testes que
   são justamente de tela pública — é lá que eles têm valor.

   Então o cenário é servido direto. A lista inteira vem daqui, sem repassar a
   resposta do mock: `route.fetch()` sairia para a rede real, porque as rotas
   do Playwright são atendidas da mais recente para a mais antiga. */
const pad = (n) => String(n).padStart(2, '0');

/* Mesmo critério do mock: um dia do mês corrente, à frente de hoje, para o
   evento aparecer na agenda e no calendário da página inicial. */
function diaNoMesCorrente() {
  const hoje = new Date();
  const dia = hoje.getDate() <= 26 ? hoje.getDate() + 2 : hoje.getDate();
  return `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(dia)}`;
}

function eventoRetiro({ situacao, novaData }) {
  const dia = diaNoMesCorrente();
  return {
    evento_id: 1,
    nome: 'Retiro de Verão',
    descricao: 'Um retiro incrível para os jovens.',
    tipo_evento: 'Acampamento',
    data_inicio: `${dia}T08:00:00`,
    data_fim: `${dia}T18:00:00`,
    datas: null,
    nome_local: 'Sítio Boa Vista',
    local_latitude: -8.05,
    local_longitude: -34.9,
    link_galeria: '',
    formulario_link: 'https://forms.gle/retiro',
    formulario_participante_link: 'https://forms.gle/retiro-participantes',
    link_imagem: '',
    calendario_evento_id: null,
    situacao,
    nova_data: novaData,
  };
}

async function marcarEvento(page, { situacao, novaData = null }) {
  const evento = eventoRetiro({ situacao, novaData });
  const json = (corpo) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(corpo),
  });

  await page.route(/^https?:\/\/[^/]+\/evento\/?(\?.*)?$/, (route) =>
    route.fulfill(json([evento]))
  );
  await page.route(/^https?:\/\/[^/]+\/evento\/1$/, (route) => route.fulfill(json(evento)));
}

test.describe('US14 - Página do evento', () => {
  test('CA2: evento cancelado mostra o aviso', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'cancelado' });

    await page.goto('/eventos/1-retiro-de-verao');

    await expect(page.getByRole('status').filter({ hasText: 'Evento cancelado' })).toBeVisible();
  });

  test('CA4: evento adiado com nova data mostra a data', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'adiado', novaData: '2027-04-10T09:00:00' });

    await page.goto('/eventos/1-retiro-de-verao');

    await expect(page.getByText('Adiado para 10/04/2027')).toBeVisible();
  });

  test('CA4: evento adiado sem nova data avisa que ela vem depois', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'adiado' });

    await page.goto('/eventos/1-retiro-de-verao');

    await expect(page.getByText('Evento adiado — nova data em breve')).toBeVisible();
  });

  test('CA4: os botões de inscrição somem enquanto durar a situação', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'cancelado' });

    await page.goto('/eventos/1-retiro-de-verao');

    /* O evento 1 abre os dois fluxos quando está ativo (US09). */
    await expect(page.getByRole('button', { name: 'Inscreva-se' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Seja Voluntário' })).toHaveCount(0);
  });

  test('evento ativo segue com os botões e sem aviso', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/eventos/1-retiro-de-verao');

    await expect(page.getByRole('button', { name: 'Inscreva-se' })).toBeVisible();
    await expect(page.getByText('Evento cancelado')).toHaveCount(0);
  });
});

test.describe('US14 - Agenda de eventos', () => {
  test('CA4: o evento continua na lista, com aviso e sem inscrição', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'cancelado' });

    await page.goto('/eventos');

    const grid = page.locator('section.pb-20 > div > div.grid');
    const card = grid.locator('> div').filter({ hasText: 'Retiro de Verão' }).first();

    /* Não filtre o evento marcado: ele precisa ser encontrado. */
    await expect(card).toBeVisible();
    await expect(card.getByText('Evento cancelado')).toBeVisible();
    await expect(card.getByText('Cancelado', { exact: true })).toBeVisible();

    await expect(card.getByRole('button', { name: 'Inscreva-se' })).toHaveCount(0);
    await expect(card.getByRole('button', { name: 'Seja Voluntário' })).toHaveCount(0);

    /* "Veja mais" fica: é lá que o visitante entende o que aconteceu. */
    await expect(card.getByRole('link', { name: /Veja mais/ })).toBeVisible();
  });

  test('o adiado mostra a nova data no card', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'adiado', novaData: '2027-04-10T09:00:00' });

    await page.goto('/eventos');

    const grid = page.locator('section.pb-20 > div > div.grid');
    const card = grid.locator('> div').filter({ hasText: 'Retiro de Verão' }).first();

    await expect(card.getByText('Adiado para 10/04/2027')).toBeVisible();
  });
});

test.describe('US14 - Página inicial', () => {
  test('CA2: o calendário da home mostra a situação', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'cancelado' });

    await page.goto('/');

    const calendario = page.locator('section').filter({ hasText: 'Calendário de Eventos' });
    await expect(
      calendario.getByText('Evento cancelado').first()
    ).toBeVisible();
  });
});
