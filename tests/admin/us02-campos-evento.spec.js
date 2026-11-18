import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* US02 (RF11) — os cinco campos do evento não podiam ser descartados.
 *
 * O formulário já os coletava, mas `toApiEvent` não os enviava e
 * `adaptEvent` não os lia: a administradora digitava vagas, valor, contato,
 * link de pagamento e regulamento, salvava, e o dado sumia sem aviso — os
 * campos nem são obrigatórios, então nada sinalizava a perda.
 *
 * Estes testes fixam o contrato do lado do front. O back-end ainda não tem as
 * colunas: enquanto não tiver, a API ignora o campo desconhecido e o dado
 * continua não persistindo. O que deixa de acontecer é o front jogar fora em
 * silêncio o que a pessoa digitou.
 */

const pad = (n) => String(n).padStart(2, '0');
const noMesSeguinte = (dia) => {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* Evento presencial exige coordenadas, e elas vêm da busca no mapa — sem
   isso o serviço recusa antes de sair para a API. */
async function preencherLocal(page) {
  await page.getByPlaceholder('Digite o nome ou endereço do local').fill('Sede');
  const opcao = page.locator('ul.absolute button').first();
  await opcao.waitFor({ state: 'visible' });
  await opcao.click();
  await page.waitForTimeout(500);
}

test.describe('US02 - Campos completos do evento', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);
  });

  test('os cinco campos chegam à API ao salvar', async ({ page }) => {
    await page.goto('/admin/eventos/criar');

    await page.getByPlaceholder('Nome do Evento').fill('Congresso com inscrição paga');
    await page.locator('select[name="tipoEvento"]').selectOption('Conferência');
    await preencherLocal(page);
    await page.locator('input[name="startDay"]').fill(noMesSeguinte(10));
    await page.locator('input[name="startTime"]').fill('08:00');
    await page.locator('input[name="endDay"]').fill(noMesSeguinte(12));
    await page.locator('input[name="endTime"]').fill('18:00');

    await page.locator('input[name="vagas"]').fill('250');
    await page.locator('input[name="contatoResponsavel"]').fill('(61) 99999-0000');
    await page.locator('input[name="valorInvestimento"]').fill('R$ 180,00');
    await page.locator('input[name="linkPagamento"]').fill('https://pagamento.test/congresso');
    await page.locator('input[name="linkRegulamento"]').fill('https://drive.google.com/file/d/REG/view');

    const envio = page.waitForRequest(
      (r) => /\/evento\/?$/.test(r.url()) && r.method() === 'POST'
    );
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    const corpo = (await envio).postDataJSON();
    expect(corpo).toMatchObject({
      vagas: 250,
      contato_responsavel: '(61) 99999-0000',
      valor_investimento: 'R$ 180,00',
      link_pagamento: 'https://pagamento.test/congresso',
      link_regulamento: 'https://drive.google.com/file/d/REG/view',
    });
  });

  test('vagas vazio vai como nulo, não como texto vazio', async ({ page }) => {
    await page.goto('/admin/eventos/criar');

    await page.getByPlaceholder('Nome do Evento').fill('Evento sem vagas definidas');
    await page.locator('select[name="tipoEvento"]').selectOption('Outros');
    await preencherLocal(page);
    await page.locator('input[name="startDay"]').fill(noMesSeguinte(10));
    await page.locator('input[name="startTime"]').fill('08:00');
    await page.locator('input[name="endDay"]').fill(noMesSeguinte(10));
    await page.locator('input[name="endTime"]').fill('18:00');

    const envio = page.waitForRequest(
      (r) => /\/evento\/?$/.test(r.url()) && r.method() === 'POST'
    );
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    const corpo = (await envio).postDataJSON();
    /* Gravar "" numa coluna numérica seria recusado pelo banco. */
    expect(corpo.vagas).toBeNull();
    expect(corpo.contato_responsavel).toBeNull();
  });

  test('o que a API devolve volta preenchido na edição', async ({ page }) => {
    /* Simula o back-end já com as colunas: a edição tem de reexibir o que
       está salvo, senão salvar de novo apagaria tudo. */
    await page.route(/^https?:\/\/[^/]+\/evento\/1$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          evento_id: 1,
          nome: 'Congresso',
          descricao: 'x',
          tipo_evento: 'Conferência',
          data_inicio: `${noMesSeguinte(10)}T08:00:00`,
          data_fim: `${noMesSeguinte(10)}T18:00:00`,
          nome_local: 'Sede',
          local_latitude: -15.79,
          local_longitude: -47.88,
          link_galeria: '',
          formulario_link: '',
          formulario_participante_link: '',
          link_imagem: '',
          calendario_evento_id: null,
          vagas: 300,
          contato_responsavel: '(61) 98888-1111',
          valor_investimento: 'R$ 200,00',
          link_pagamento: 'https://pagamento.test/x',
          link_regulamento: 'https://drive.google.com/file/d/R/view',
        }),
      })
    );

    await page.goto('/admin/eventos/1/editar');

    await expect(page.locator('input[name="vagas"]')).toHaveValue('300');
    await expect(page.locator('input[name="contatoResponsavel"]')).toHaveValue('(61) 98888-1111');
    await expect(page.locator('input[name="valorInvestimento"]')).toHaveValue('R$ 200,00');
    await expect(page.locator('input[name="linkPagamento"]')).toHaveValue('https://pagamento.test/x');
    await expect(page.locator('input[name="linkRegulamento"]')).toHaveValue(
      'https://drive.google.com/file/d/R/view'
    );
  });
});
