import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* O calendário do painel desenhava apenas das 8h às 17h. Um evento fora dessa
   faixa não aparecia em lugar nenhum: o segmento recebia a hora de início, o
   laço de desenho só percorria 8 a 17, nenhuma linha casava, e nada era
   renderizado — sem erro e sem aviso.

   Para um ministério de jovens isso escondia quase tudo, porque culto, ensaio
   e reunião são à noite. Encontrado com a cliente em 23/11/2026, num evento
   das 20h às 21h que não aparecia.

   A grade passou a cobrir o dia inteiro. Estes testes varrem as pontas: 23h,
   0h e a faixa que já funcionava. */

/* Uma data desta semana, no formato que a API devolve. A grade monta sempre a
   semana corrente (domingo a sábado), então o evento precisa cair nela. */
function diaDestaSemana(offsetDoDomingo = 3) {
  const hoje = new Date();
  const domingo = new Date(hoje);
  domingo.setDate(hoje.getDate() - hoje.getDay() + offsetDoDomingo);
  const p = (n) => String(n).padStart(2, '0');
  return `${domingo.getFullYear()}-${p(domingo.getMonth() + 1)}-${p(domingo.getDate())}`;
}

async function servirEventoUnico(page, { nome, inicio, fim }) {
  const dia = diaDestaSemana();
  await page.route(/\/evento\/?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          evento_id: 1,
          nome,
          descricao: 'Evento de teste do calendário',
          data_inicio: `${dia}T${inicio}:00`,
          data_fim: `${dia}T${fim}:00`,
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

test.describe('Calendário do painel — cobre o dia inteiro', () => {
  test('evento da noite aparece (o caso que a cliente encontrou)', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await servirEventoUnico(page, { nome: 'Culto de Jovens', inicio: '20:00', fim: '21:00' });

    await page.goto('/admin');

    await expect(page.getByTitle('Culto de Jovens').first()).toBeVisible();
  });

  test('evento que termina às 23h aparece', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await servirEventoUnico(page, { nome: 'Vigilia de Oracao', inicio: '22:00', fim: '23:30' });

    await page.goto('/admin');

    await expect(page.getByTitle('Vigilia de Oracao').first()).toBeVisible();
  });

  test('evento de madrugada aparece', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await servirEventoUnico(page, { nome: 'Madrugada de Oracao', inicio: '00:00', fim: '02:00' });

    await page.goto('/admin');

    await expect(page.getByTitle('Madrugada de Oracao').first()).toBeVisible();
  });

  test('evento comercial continua aparecendo', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await servirEventoUnico(page, { nome: 'Reuniao da Diretoria', inicio: '09:00', fim: '11:00' });

    await page.goto('/admin');

    await expect(page.getByTitle('Reuniao da Diretoria').first()).toBeVisible();
  });
});
