import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* O calendário da home era fixo na semana corrente e mostrava apenas os
   números dos dias: não havia como ver o evento do mês passado nem o do mês
   que vem, e o número sozinho não dizia de que mês era.

   Encontrado em 23/11/2026, depois de a grade passar a cobrir o dia inteiro:
   a faixa de horas estava certa, mas a faixa de datas continuava presa. */

function diaComOffset(offsetDias) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* Serve um evento num dia qualquer, inclusive fora da semana atual. */
async function servirEvento(page, { nome, offsetDias }) {
  const dia = diaComOffset(offsetDias);
  await page.route(/\/evento\/?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          evento_id: 1,
          nome,
          descricao: 'Evento de teste do calendário',
          data_inicio: `${dia}T10:00:00`,
          data_fim: `${dia}T11:00:00`,
          nome_local: 'Sede',
          local_latitude: -8.05,
          local_longitude: -34.9,
          link_galeria: '',
          formulario_link: '',
          formulario_participante_link: '',
          link_imagem: '',
          calendario_evento_id: null,
        },
      ]),
    }),
  );
}

/* Nome do mês que a grade deve anunciar para uma data. */
function mesDe(offsetDias) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toLocaleDateString('pt-BR', { month: 'long' });
}

test.describe('Calendário do painel — mês e navegação', () => {
  test('anuncia o mês da semana exibida', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin');

    await expect(
      page.getByText(new RegExp(`${mesDe(0)}`, 'i')).first(),
    ).toBeVisible();
  });

  test('evento de duas semanas atrás aparece ao voltar', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await servirEvento(page, { nome: 'Retiro Passado', offsetDias: -14 });
    await page.goto('/admin');

    /* Não está na semana atual. */
    await expect(page.getByTitle('Retiro Passado')).toHaveCount(0);

    await page.getByRole('button', { name: 'Semana anterior' }).click();
    await page.getByRole('button', { name: 'Semana anterior' }).click();

    await expect(page.getByTitle('Retiro Passado').first()).toBeVisible();
  });

  test('evento de duas semanas à frente aparece ao avançar', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await servirEvento(page, { nome: 'Congresso Futuro', offsetDias: 14 });
    await page.goto('/admin');

    await expect(page.getByTitle('Congresso Futuro')).toHaveCount(0);

    await page.getByRole('button', { name: 'Semana seguinte' }).click();
    await page.getByRole('button', { name: 'Semana seguinte' }).click();

    await expect(page.getByTitle('Congresso Futuro').first()).toBeVisible();
  });

  test('o botão Hoje volta para a semana atual', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await servirEvento(page, { nome: 'Culto de Hoje', offsetDias: 0 });
    await page.goto('/admin');

    const hoje = page.getByRole('button', { name: 'Hoje' });
    await expect(hoje).toBeDisabled();

    await page.getByRole('button', { name: 'Semana seguinte' }).click();
    await expect(hoje).toBeEnabled();

    await hoje.click();
    await expect(hoje).toBeDisabled();
    await expect(page.getByTitle('Culto de Hoje').first()).toBeVisible();
  });

  test('navegar entre semanas não refaz a busca de eventos', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);

    let buscas = 0;
    await page.route(/\/evento\/?$/, (route) => {
      buscas += 1;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/admin');
    await expect(page.getByRole('button', { name: 'Semana seguinte' })).toBeVisible();
    const inicial = buscas;

    await page.getByRole('button', { name: 'Semana seguinte' }).click();
    await page.getByRole('button', { name: 'Semana anterior' }).click();

    expect(buscas).toBe(inicial);
  });
});
