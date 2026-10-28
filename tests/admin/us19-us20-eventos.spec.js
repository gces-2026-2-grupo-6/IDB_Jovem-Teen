import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* US19 (painel): o cadastro de evento marca se ele é online ou presencial.
   Online dispensa o endereço e guarda o link da transmissão; presencial
   continua exatamente como era.

   US20 (painel): antes de excluir, o modal mostra quantas inscrições saem
   junto com o evento (A1), e uma falha na agenda do Google não apaga nada
   (A3). */

const LINK = 'https://youtube.com/live/abc123';

async function preencherBasico(page, nome) {
  await page.getByPlaceholder('Nome do Evento').fill(nome);
  await page.locator('select[name="tipoEvento"]').selectOption('Conferência');
  await page.locator('input[name="startDay"]').fill('2031-06-10');
  await page.locator('input[name="startTime"]').fill('19:00');
  await page.locator('input[name="endDay"]').fill('2031-06-10');
  await page.locator('input[name="endTime"]').fill('21:00');
}

function capturarCorpo(page, metodo, padrao) {
  return page.waitForRequest(
    (req) => req.method() === metodo && padrao.test(new URL(req.url()).pathname)
  );
}

function linhaDoEvento(page, titulo) {
  return page
    .locator('div')
    .filter({ has: page.getByText(titulo, { exact: true }) })
    .filter({ has: page.getByTitle('Excluir') })
    .last();
}

test.describe('US19 - Modalidade no cadastro de evento', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
  });

  test('o cadastro começa como presencial, com o mapa', async ({ page }) => {
    await page.goto('/admin/eventos/criar');

    await expect(page.getByRole('radio', { name: 'Presencial' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('radio', { name: 'Online' })).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByPlaceholder('Digite o nome ou endereço do local')).toBeVisible();
    await expect(page.getByLabel('Link da transmissão')).toHaveCount(0);
  });

  test('marcar online troca o mapa pelo link da transmissão', async ({ page }) => {
    await page.goto('/admin/eventos/criar');

    await page.getByRole('radio', { name: 'Online' }).click();

    await expect(page.getByRole('radio', { name: 'Online' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByLabel('Link da transmissão')).toBeVisible();
    await expect(page.getByPlaceholder('Digite o nome ou endereço do local')).toHaveCount(0);
    await expect(page.getByText('Evento online não tem endereço nem mapa.')).toBeVisible();
  });

  test('evento online é salvo sem endereço e com o link', async ({ page }) => {
    await page.goto('/admin/eventos/criar');
    await preencherBasico(page, 'Live de Oração');
    await page.getByRole('radio', { name: 'Online' }).click();
    await page.getByLabel('Link da transmissão').fill(LINK);

    const requisicao = capturarCorpo(page, 'POST', /\/evento\/?$/);
    await page.getByRole('button', { name: 'Salvar' }).click();
    const corpo = (await requisicao).postDataJSON();

    expect(corpo.modalidade).toBe('online');
    expect(corpo.link_transmissao).toBe(LINK);
    expect(corpo.local_latitude).toBeNull();
    expect(corpo.local_longitude).toBeNull();
    await expect(page).toHaveURL(/\/admin\/eventos\/\d+\/programacao/);
  });

  test('evento online pode ser salvo sem link, para cadastrar depois', async ({ page }) => {
    await page.goto('/admin/eventos/criar');
    await preencherBasico(page, 'Live sem link');
    await page.getByRole('radio', { name: 'Online' }).click();

    const requisicao = capturarCorpo(page, 'POST', /\/evento\/?$/);
    await page.getByRole('button', { name: 'Salvar' }).click();
    const corpo = (await requisicao).postDataJSON();

    expect(corpo.modalidade).toBe('online');
    expect(corpo.link_transmissao).toBeNull();
  });

  test('link da transmissão sem https é recusado antes de enviar', async ({ page }) => {
    await page.goto('/admin/eventos/criar');
    await preencherBasico(page, 'Live com link errado');
    await page.getByRole('radio', { name: 'Online' }).click();
    await page.getByLabel('Link da transmissão').fill('youtube.com/live');

    /* O campo é type="url": o próprio navegador barraria o envio. A regra
       também vale no serviço, então a validação nativa sai do caminho. */
    await page.evaluate(() => document.querySelector('form').setAttribute('novalidate', ''));

    let alerta = '';
    page.on('dialog', async (dialog) => {
      alerta = dialog.message();
      await dialog.accept();
    });
    let enviou = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && /\/evento\/?$/.test(new URL(req.url()).pathname)) enviou = true;
    });

    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect.poll(() => alerta).toContain('https://');
    expect(enviou).toBe(false);
  });

  test('evento presencial continua enviando o endereço', async ({ page }) => {
    await page.goto('/admin/eventos/criar');
    await preencherBasico(page, 'Retiro presencial');
    await page.getByPlaceholder('Digite o nome ou endereço do local').fill('Igreja');
    await page.locator('ul.absolute button').first().click();

    const requisicao = capturarCorpo(page, 'POST', /\/evento\/?$/);
    await page.getByRole('button', { name: 'Salvar' }).click();
    const corpo = (await requisicao).postDataJSON();

    expect(corpo.modalidade).toBe('presencial');
    expect(corpo.link_transmissao).toBeNull();
    expect(typeof corpo.local_latitude).toBe('number');
    expect(typeof corpo.local_longitude).toBe('number');
  });

  test('editar evento antigo, sem o campo, abre como presencial e salva como presencial', async ({ page }) => {
    /* CA4: os eventos do mock não têm `modalidade`, como os de produção. */
    await page.goto('/admin/eventos/1/editar');
    await expect(page.getByRole('heading', { name: 'Edição de Evento' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('radio', { name: 'Presencial' })).toHaveAttribute('aria-checked', 'true');
    /* O evento do mock não tem tipo, e o campo é obrigatório no formulário. */
    await page.locator('select[name="tipoEvento"]').selectOption('Conferência');

    const requisicao = capturarCorpo(page, 'PUT', /\/evento\/1$/);
    await page.getByRole('button', { name: 'Salvar' }).click();
    const corpo = (await requisicao).postDataJSON();

    expect(corpo.modalidade).toBe('presencial');
    expect(corpo.local_latitude).toBe(-8.05);
  });

  test('evento presencial passado para online perde o endereço ao salvar', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');
    await expect(page.getByRole('heading', { name: 'Edição de Evento' })).toBeVisible({ timeout: 15000 });

    await page.locator('select[name="tipoEvento"]').selectOption('Conferência');
    await page.getByRole('radio', { name: 'Online' }).click();
    await page.getByLabel('Link da transmissão').fill(LINK);

    const requisicao = capturarCorpo(page, 'PUT', /\/evento\/1$/);
    await page.getByRole('button', { name: 'Salvar' }).click();
    const corpo = (await requisicao).postDataJSON();

    expect(corpo.modalidade).toBe('online');
    expect(corpo.link_transmissao).toBe(LINK);
    expect(corpo.local_latitude).toBeNull();
    await expect(page).toHaveURL(/\/admin\/eventos$/);
  });

  test('evento online abre a edição com a opção e o link preenchidos', async ({ page }) => {
    await page.route(/\/evento\/1$/, (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          evento_id: 1, nome: 'Live de Oração', descricao: '',
          data_inicio: '2031-06-10T19:00:00', data_fim: '2031-06-10T21:00:00',
          nome_local: null, local_latitude: null, local_longitude: null,
          modalidade: 'online', link_transmissao: LINK, tipo_evento: 'Outros',
          link_galeria: '', formulario_link: '', formulario_participante_link: '',
          link_imagem: '', calendario_evento_id: null,
        }),
      });
    });

    await page.goto('/admin/eventos/1/editar');

    await expect(page.getByRole('radio', { name: 'Online' })).toHaveAttribute('aria-checked', 'true', { timeout: 15000 });
    await expect(page.getByLabel('Link da transmissão')).toHaveValue(LINK);

    /* Voltar para presencial sem escolher o local é barrado com orientação. */
    await page.getByRole('radio', { name: 'Presencial' }).click();
    let alerta = '';
    page.on('dialog', async (dialog) => {
      alerta = dialog.message();
      await dialog.accept();
    });
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect.poll(() => alerta).toContain('Escolha o local do evento no mapa');
  });

  test('a página de detalhes do painel mostra a modalidade', async ({ page }) => {
    await page.goto('/admin/eventos/1');
    await expect(page.getByText('Modalidade', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Presencial', { exact: true })).toBeVisible();
    await expect(page.getByText('Local', { exact: true })).toBeVisible();
  });
});

test.describe('US20 - Exclusão de evento com inscritos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin/eventos');
    await expect(page.getByRole('heading', { name: 'Próximos Eventos' })).toBeVisible();
  });

  test('o modal mostra quantas inscrições serão apagadas antes de confirmar', async ({ page }) => {
    await linhaDoEvento(page, 'Retiro de Verão').getByTitle('Excluir').click();

    const resumo = page.getByTestId('resumo-exclusao');
    await expect(resumo).toContainText('4 inscrições serão apagadas junto com o evento: 2 participantes e 2 voluntários.');
    await expect(resumo).toContainText('Também saem 4 atividades da programação e 4 vínculos com convidados.');
    await expect(resumo).toContainText('O cadastro dos convidados continua.');
    await expect(resumo).toContainText('O evento também sai da agenda do Google.');
    await expect(page.getByRole('button', { name: 'Sim' })).toBeEnabled();
  });

  test('evento sem inscrições nem vínculos avisa que não há inscrições', async ({ page }) => {
    await page.route(/\/evento\/\d+\/exclusao$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ evento_id: 2, participantes: 0, voluntarios: 0, atividades: 0, convidados: 0 }),
      })
    );

    await linhaDoEvento(page, 'Acampamento Jovem').getByTitle('Excluir').click();

    await expect(page.getByTestId('resumo-exclusao')).toHaveText('Este evento não tem inscrições.');
  });

  test('o singular é usado quando há uma inscrição só', async ({ page }) => {
    await page.route(/\/evento\/\d+\/exclusao$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ evento_id: 2, participantes: 1, voluntarios: 0, atividades: 1, convidados: 0 }),
      })
    );

    await linhaDoEvento(page, 'Acampamento Jovem').getByTitle('Excluir').click();

    const resumo = page.getByTestId('resumo-exclusao');
    await expect(resumo).toContainText('1 inscrição será apagada junto com o evento: 1 participante e 0 voluntários.');
    await expect(resumo).toContainText('Também saem 1 atividade da programação.');
  });

  test('só a programação e os convidados saem quando não há inscrição', async ({ page }) => {
    await page.route(/\/evento\/\d+\/exclusao$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ evento_id: 2, participantes: 0, voluntarios: 0, atividades: 0, convidados: 4 }),
      })
    );

    await linhaDoEvento(page, 'Acampamento Jovem').getByTitle('Excluir').click();

    const resumo = page.getByTestId('resumo-exclusao');
    await expect(resumo).toContainText('Saem junto com o evento 4 vínculos com convidados.');
    await expect(resumo).not.toContainText('inscrições serão apagadas');
  });

  test('enquanto a contagem carrega, a confirmação fica travada', async ({ page }) => {
    let liberar;
    const espera = new Promise((resolve) => { liberar = resolve; });
    await page.route(/\/evento\/\d+\/exclusao$/, async (route) => {
      await espera;
      return route.fallback();
    });

    await linhaDoEvento(page, 'Retiro de Verão').getByTitle('Excluir').click();

    await expect(page.getByRole('status')).toHaveText('Conferindo as inscrições do evento...');
    await expect(page.getByRole('button', { name: 'Sim' })).toBeDisabled();

    liberar();
    await expect(page.getByTestId('resumo-exclusao')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sim' })).toBeEnabled();
  });

  test('se a contagem falhar, o modal avisa e a exclusão continua possível', async ({ page }) => {
    await page.route(/\/evento\/\d+\/exclusao$/, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"erro"}' })
    );

    await linhaDoEvento(page, 'Retiro de Verão').getByTitle('Excluir').click();

    await expect(page.getByRole('alert')).toContainText('Não foi possível conferir as inscrições deste evento.');
    await expect(page.getByRole('button', { name: 'Sim' })).toBeEnabled();
  });

  test('confirmar exclui o evento e ele some da lista', async ({ page }) => {
    await linhaDoEvento(page, 'Retiro de Verão').getByTitle('Excluir').click();
    await expect(page.getByTestId('resumo-exclusao')).toBeVisible();

    const exclusao = page.waitForRequest(
      (req) => req.method() === 'DELETE' && /\/evento\/1$/.test(new URL(req.url()).pathname)
    );
    await page.getByRole('button', { name: 'Sim' }).click();
    await exclusao;

    await expect(page.getByText('Tem certeza que deseja excluir este evento?')).not.toBeVisible();
    await expect(page.getByText('Retiro de Verão', { exact: true })).toHaveCount(0);
  });

  test('falha na agenda do Google mostra o aviso do servidor e mantém o evento', async ({ page }) => {
    await page.route(/\/evento\/1$/, (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      return route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Não foi possível remover o evento da agenda do Google. Nada foi apagado.',
        }),
      });
    });

    await linhaDoEvento(page, 'Retiro de Verão').getByTitle('Excluir').click();
    await expect(page.getByTestId('resumo-exclusao')).toBeVisible();
    await page.getByRole('button', { name: 'Sim' }).click();

    await expect(page.getByText('Nada foi apagado.')).toBeVisible();
    await expect(page.getByText('Retiro de Verão', { exact: true })).toBeVisible();
  });

  test('durante a exclusão os botões ficam travados contra clique duplo', async ({ page }) => {
    let liberar;
    const espera = new Promise((resolve) => { liberar = resolve; });
    let exclusoes = 0;
    await page.route(/\/evento\/1$/, async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      exclusoes += 1;
      await espera;
      return route.fallback();
    });

    await linhaDoEvento(page, 'Retiro de Verão').getByTitle('Excluir').click();
    await expect(page.getByTestId('resumo-exclusao')).toBeVisible();
    await page.getByRole('button', { name: 'Sim' }).click();

    await expect(page.getByRole('button', { name: 'Excluindo...' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Não' })).toBeDisabled();

    liberar();
    await expect(page.getByText('Tem certeza que deseja excluir este evento?')).not.toBeVisible();
    expect(exclusoes).toBe(1);
  });
});
