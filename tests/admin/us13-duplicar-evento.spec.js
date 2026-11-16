import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* US13 (RF09) — duplicar evento.
 *
 * Duplicar serve a quem repete o mesmo evento em outra edição. O que descreve
 * o evento é copiado; o que pertence àquela edição não é — datas, situação,
 * álbum e formulários de inscrição —, porque herdar isso cria erro silencioso.
 *
 * No mock padrão o evento 1 é "Retiro de Verão", com galeria e os dois links
 * de inscrição preenchidos: serve justamente para verificar o que NÃO é
 * copiado.
 */

/* O evento 1 do mock não traz `tipo_evento`, e o campo é obrigatório no
   formulário. Onde o teste precisa de um evento completo — para conferir a
   cópia do tipo e para conseguir salvar —, ele serve a lista inteira.

   Serve, e não intercepta-e-repassa: `route.fetch()` sairia para a rede real
   em vez de cair no mock, porque as rotas do Playwright são atendidas da mais
   recente para a mais antiga. */
const pad = (n) => String(n).padStart(2, '0');
const noMesSeguinte = (dia) => {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const EVENTO_COM_TIPO = {
  evento_id: 1,
  nome: 'Retiro de Verão',
  descricao: 'Um retiro incrível para os jovens.',
  tipo_evento: 'Acampamento',
  data_inicio: `${noMesSeguinte(12)}T08:00:00`,
  data_fim: `${noMesSeguinte(12)}T18:00:00`,
  datas: null,
  nome_local: 'Sítio Boa Vista',
  local_latitude: -8.05,
  local_longitude: -34.9,
  link_galeria: 'pasta-retiro',
  formulario_link: 'https://forms.gle/retiro',
  formulario_participante_link: 'https://forms.gle/retiro-participantes',
  link_imagem: '',
  calendario_evento_id: null,
};

async function servirEventoComTipo(page) {
  await page.route(/^https?:\/\/[^/]+\/evento\/?(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([EVENTO_COM_TIPO]),
    })
  );
}

test.describe('US13 - Duplicar evento', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);
    await page.goto('/admin/eventos');
  });

  test('o botão leva à criação, marcada como duplicação', async ({ page }) => {
    await page.getByTitle('Duplicar').first().click();

    await expect(page).toHaveURL(/\/admin\/eventos\/criar$/);
    await expect(page.getByRole('heading', { name: 'Duplicação de Evento' })).toBeVisible();
  });

  test('copia o que descreve o evento', async ({ page }) => {
    await servirEventoComTipo(page);
    await page.reload();

    await page.getByTitle('Duplicar').first().click();

    await expect(page.getByPlaceholder('Nome do Evento')).toHaveValue('Retiro de Verão (cópia)');
    await expect(page.locator('select[name="tipoEvento"]')).toHaveValue('Acampamento');
    await expect(page.locator('textarea[name="description"]')).toHaveValue(
      'Um retiro incrível para os jovens.'
    );
  });

  test('não copia as datas — herdar a antiga criaria evento no passado', async ({ page }) => {
    await page.getByTitle('Duplicar').first().click();

    await expect(page.locator('input[name="startDay"]')).toHaveValue('');
    await expect(page.locator('input[name="endDay"]')).toHaveValue('');
  });

  test('não copia álbum nem formulários de inscrição', async ({ page }) => {
    await page.getByTitle('Duplicar').first().click();

    /* O evento 1 tem os três preenchidos; a cópia nasce sem nenhum, porque
       apontariam para as fotos e os inscritos da edição anterior. */
    await expect(page.locator('input[name="linkGaleria"]')).toHaveValue('');
    await expect(page.locator('input[name="linkFormularioParticipantes"]')).toHaveValue('');
    await expect(page.locator('input[name="linkFormularioVoluntarios"]')).toHaveValue('');
  });

  test('avisa o que ficou de fora', async ({ page }) => {
    await page.getByTitle('Duplicar').first().click();

    await expect(page.getByRole('status')).toContainText('não são copiadas');
  });

  test('salvar cria um evento novo e não altera o original', async ({ page }) => {
    await servirEventoComTipo(page);
    await page.reload();

    await page.getByTitle('Duplicar').first().click();

    await page.locator('input[name="startDay"]').fill('2031-07-10');
    await page.locator('input[name="startTime"]').fill('08:00');
    await page.locator('input[name="endDay"]').fill('2031-07-12');
    await page.locator('input[name="endTime"]').fill('18:00');

    const criacao = page.waitForRequest(
      (r) => /\/evento\/?$/.test(r.url()) && r.method() === 'POST'
    );
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    const corpo = (await criacao).postDataJSON();
    expect(corpo.nome).toBe('Retiro de Verão (cópia)');
    /* O que pertence à edição anterior não vai no corpo. */
    expect(corpo.link_galeria).toBeFalsy();
    expect(corpo.formulario_link).toBeFalsy();
    expect(corpo.formulario_participante_link).toBeFalsy();

    /* O original continua lá, com o nome intacto. */
    await page.goto('/admin/eventos');
    await expect(page.getByText('Retiro de Verão', { exact: true }).first()).toBeVisible();
  });

  test('evento encerrado também pode ser duplicado', async ({ page }) => {
    /* É o caso mais comum: a edição do ano seguinte parte do evento passado. */
    const anteriores = page.locator('div').filter({ hasText: 'Eventos Anteriores' }).last();
    await anteriores.getByRole('button', { name: 'Duplicar' }).first().click();

    await expect(page).toHaveURL(/\/admin\/eventos\/criar$/);
    await expect(page.getByPlaceholder('Nome do Evento')).toHaveValue(/\(cópia\)$/);
  });

  test('entrar direto na criação continua sendo criação em branco', async ({ page }) => {
    await page.goto('/admin/eventos/criar');

    await expect(page.getByRole('heading', { name: 'Criação de Evento' })).toBeVisible();
    await expect(page.getByPlaceholder('Nome do Evento')).toHaveValue('');
    await expect(page.getByRole('status')).toHaveCount(0);
  });
});
