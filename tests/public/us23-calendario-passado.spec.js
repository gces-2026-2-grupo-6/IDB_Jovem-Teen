import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

/* US23: o calendário da página inicial guarda os eventos que já
   aconteceram. Antes, evento com término no passado era descartado e os meses
   anteriores ficavam vazios. Agora o passado aparece com aparência discreta e
   leva à página do evento — com o álbum, quando houver (CA1 a CA4). */

const pad = (n) => String(n).padStart(2, '0');
const dia = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const noMes = (deslocamento, diaDoMes) => {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + deslocamento, diaDoMes);
};
const somarDias = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const base = {
  descricao: 'Descrição do evento.',
  tipo_evento: 'Conferência',
  formulario_link: '',
  formulario_participante_link: '',
  link_imagem: '',
  calendario_evento_id: null,
  local_latitude: -15.79,
  local_longitude: -47.88,
};

const passadoComFotos = noMes(-1, 10);
const passadoSemFotos = noMes(-1, 20);
const futuro = noMes(1, 10);

const EVENTOS = [
  {
    ...base, evento_id: 801, nome: 'Retiro com Álbum', nome_local: 'Sítio Boa Vista',
    data_inicio: `${dia(passadoComFotos)}T08:00:00`, data_fim: `${dia(passadoComFotos)}T18:00:00`,
    link_galeria: 'pasta-retiro-album',
  },
  {
    ...base, evento_id: 802, nome: 'Culto sem Fotos', nome_local: 'Igreja Central',
    data_inicio: `${dia(passadoSemFotos)}T19:00:00`, data_fim: `${dia(passadoSemFotos)}T21:00:00`,
    link_galeria: '',
  },
  {
    /* Começou ontem e termina amanhã: está em curso, não é passado (CA3). */
    ...base, evento_id: 803, nome: 'Acampamento em Curso', nome_local: 'Camping Serra',
    data_inicio: `${dia(somarDias(-1))}T08:00:00`, data_fim: `${dia(somarDias(1))}T18:00:00`,
    link_galeria: '',
  },
  {
    ...base, evento_id: 804, nome: 'Congresso Futuro', nome_local: 'Centro de Convenções',
    data_inicio: `${dia(futuro)}T09:00:00`, data_fim: `${dia(futuro)}T18:00:00`,
    link_galeria: '',
  },
];

function secaoCalendario(page) {
  return page.locator('section').filter({ has: page.getByRole('heading', { name: /Calendário de Eventos/i }) });
}

function cardDoEvento(page, titulo) {
  return secaoCalendario(page)
    .locator('div.group')
    .filter({ has: page.getByRole('heading', { name: titulo }) });
}

test.describe('US23 - Calendário com os eventos já ocorridos', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await page.route(/^https?:\/\/[^/]+\/evento\/?$/, (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EVENTOS) });
    });
    await page.goto('/');
    await expect(secaoCalendario(page)).toBeVisible();
  });

  test('voltando um mês, os eventos passados aparecem no dia em que ocorreram', async ({ page }) => {
    /* CA1 e CA2. */
    await secaoCalendario(page).getByLabel('Mês anterior').click();

    await expect(cardDoEvento(page, 'Retiro com Álbum')).toBeVisible();
    await expect(cardDoEvento(page, 'Culto sem Fotos')).toBeVisible();
    await expect(secaoCalendario(page).getByText('Nenhum evento neste mês.')).toHaveCount(0);
  });

  test('o evento passado tem aparência discreta e a etiqueta "Já aconteceu"', async ({ page }) => {
    /* CA4. */
    await secaoCalendario(page).getByLabel('Mês anterior').click();
    const card = cardDoEvento(page, 'Retiro com Álbum');

    await expect(card).toHaveAttribute('data-passado', 'sim');
    await expect(card.getByText('Já aconteceu')).toBeVisible();
    await expect(card.getByRole('heading', { name: 'Retiro com Álbum' })).toHaveClass(/text-neutral-500/);
  });

  test('passado com álbum oferece "Ver fotos" e leva à página do evento', async ({ page }) => {
    await secaoCalendario(page).getByLabel('Mês anterior').click();
    const card = cardDoEvento(page, 'Retiro com Álbum');

    await card.getByRole('link', { name: 'Ver fotos' }).click();

    await expect(page).toHaveURL(/\/eventos\/801-retiro-com-album$/);
  });

  test('passado sem álbum continua com "Detalhes"', async ({ page }) => {
    await secaoCalendario(page).getByLabel('Mês anterior').click();
    const card = cardDoEvento(page, 'Culto sem Fotos');

    await expect(card.getByRole('link', { name: 'Detalhes' })).toHaveAttribute('href', '/eventos/802-culto-sem-fotos');
    await expect(card.getByRole('link', { name: 'Ver fotos' })).toHaveCount(0);
  });

  test('evento em curso continua com a aparência normal', async ({ page }) => {
    /* CA3: começou ontem e termina amanhã. */
    const card = cardDoEvento(page, 'Acampamento em Curso');

    await expect(card).toBeVisible();
    await expect(card).not.toHaveAttribute('data-passado', 'sim');
    await expect(card.getByText('Já aconteceu')).toHaveCount(0);
    await expect(card.getByRole('link', { name: 'Detalhes' })).toBeVisible();
  });

  test('evento futuro não ganha a etiqueta', async ({ page }) => {
    await secaoCalendario(page).getByLabel('Próximo mês').click();
    const card = cardDoEvento(page, 'Congresso Futuro');

    await expect(card).toBeVisible();
    await expect(card.getByText('Já aconteceu')).toHaveCount(0);
  });

  test('mês sem nenhum evento mostra a mensagem de vazio', async ({ page }) => {
    for (let i = 0; i < 3; i += 1) {
      await secaoCalendario(page).getByLabel('Próximo mês').click();
    }
    await expect(secaoCalendario(page).getByText('Nenhum evento neste mês.')).toBeVisible();
  });

  test('a lista do mês segue a ordem das datas, passado e futuro juntos', async ({ page }) => {
    await secaoCalendario(page).getByLabel('Mês anterior').click();
    const titulos = await secaoCalendario(page).locator('div.group h4').allInnerTexts();
    expect(titulos).toEqual(['Retiro com Álbum', 'Culto sem Fotos']);
  });
});
