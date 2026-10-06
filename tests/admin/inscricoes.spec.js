import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* US09 — inscrição separada para voluntários.
 *
 * Um evento passa a ter dois fluxos de inscrição independentes: participantes
 * (quem vai ao evento) e voluntários (quem trabalha nele). Cada um tem o seu
 * link e a sua listagem; só o de voluntariado tem aprovação.
 *
 * O evento 1 do mock abre os dois fluxos; o evento 2 não abre nenhum.
 */

test.describe('US09 - Painel: dois fluxos de inscrição por evento', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin/voluntarios/1');
  });

  test('deve exibir uma aba para cada fluxo, abrindo em Voluntários', async ({ page }) => {
    const abaVoluntarios = page.getByRole('tab', { name: 'Voluntários' });
    const abaParticipantes = page.getByRole('tab', { name: 'Participantes' });

    await expect(abaVoluntarios).toBeVisible();
    await expect(abaParticipantes).toBeVisible();

    await expect(abaVoluntarios).toHaveAttribute('aria-selected', 'true');
    await expect(abaParticipantes).toHaveAttribute('aria-selected', 'false');
  });

  test('deve identificar de qual evento são as inscrições', async ({ page }) => {
    await expect(page.getByText('Retiro de Verão')).toBeVisible();
  });

  test('a listagem de voluntários mantém o status pendente/aprovado/reprovado', async ({ page }) => {
    await expect(page.getByText('Maria Silva')).toBeVisible();
    await expect(page.getByText('Status', { exact: true })).toBeVisible();

    const badge = page.getByRole('button', { name: 'Pendente' }).first();
    await badge.click();
    await page.locator('button.w-full', { hasText: 'Aprovado' }).click();

    await expect(page.getByRole('button', { name: 'Aprovado' }).first()).toBeVisible();
  });

  test('a listagem de participantes é separada e não tem status', async ({ page }) => {
    await page.getByRole('tab', { name: 'Participantes' }).click();

    // Inscritos do fluxo de participantes, que não aparecem no de voluntários
    await expect(page.getByText('Carla Mendes')).toBeVisible();
    await expect(page.getByText('Rafael Dias')).toBeVisible();

    // E os voluntários não vazam para esta aba
    await expect(page.getByText('Maria Silva')).toHaveCount(0);

    // Participante não passa por aprovação: nenhuma coluna ou badge de status
    await expect(page.getByText('Status', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^(Pendente|Aprovado|Reprovado)$/ })).toHaveCount(0);
  });

  test('cada fluxo mostra o seu próprio link de inscrição', async ({ page }) => {
    await expect(page.getByText('https://forms.gle/retiro', { exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Participantes' }).click();

    await expect(page.getByText('https://forms.gle/retiro-participantes')).toBeVisible();
    await expect(page.getByText('https://forms.gle/retiro', { exact: true })).toHaveCount(0);
  });

  test('deve voltar para a listagem de eventos pelo botão de voltar', async ({ page }) => {
    await page.locator('button[title="Voltar"]').first().click();
    await expect(page).toHaveURL(/\/admin\/voluntarios$/);
  });
});

test.describe('US09 - Painel: evento sem fluxo aberto', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin/voluntarios/2');
  });

  test('deve orientar onde cadastrar o link que falta, em cada aba', async ({ page }) => {
    await expect(
      page.getByText('Este evento ainda não tem link de inscrição para voluntários.')
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Participantes' }).click();

    await expect(
      page.getByText('Este evento ainda não tem link de inscrição para participantes.')
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'editar evento' })).toBeVisible();
  });

  test('deve informar lista vazia quando o fluxo não tem inscritos', async ({ page }) => {
    await page.getByRole('tab', { name: 'Participantes' }).click();

    await expect(page.getByText('Nenhum participante inscrito neste evento.')).toBeVisible();
  });
});

test.describe('US09 - Painel: falha ao carregar a listagem de participantes', () => {
  /* As duas listagens exigem o setor Inscrições e devolvem 404 quando o evento
     não existe, então a de participantes não tem tratamento especial de erro:
     mostra a mesma mensagem que a de voluntários já mostrava. */
  test('deve acusar erro quando a API falha', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);

    await page.route('**/formulario/eventos/*/participantes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Erro interno' }),
      })
    );

    await page.goto('/admin/voluntarios/1');
    await page.getByRole('tab', { name: 'Participantes' }).click();

    await expect(
      page.getByText('Não foi possível carregar as inscrições deste evento.')
    ).toBeVisible();
  });

  test('deve acusar erro quando falta permissão de setor', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);

    await page.route('**/formulario/eventos/*/participantes', (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Sem permissão' }),
      })
    );

    await page.goto('/admin/voluntarios/1');
    await page.getByRole('tab', { name: 'Participantes' }).click();

    await expect(
      page.getByText('Não foi possível carregar as inscrições deste evento.')
    ).toBeVisible();
  });
});

test.describe('US09 - Formulário de evento: dois links de inscrição', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
  });

  test('deve carregar os dois links já cadastrados na edição', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');

    await expect(page.locator('input[name="linkFormularioParticipantes"]')).toHaveValue(
      'https://forms.gle/retiro-participantes'
    );
    await expect(page.locator('input[name="linkFormularioVoluntarios"]')).toHaveValue(
      'https://forms.gle/retiro'
    );
  });

  test('deve enviar os dois links ao salvar', async ({ page }) => {
    let enviado = null;
    await page.route('**/evento/1', async (route) => {
      if (route.request().method() === 'PUT') {
        enviado = JSON.parse(route.request().postData() || '{}');
      }
      await route.fallback();
    });

    await page.goto('/admin/eventos/1/editar');

    const campoParticipantes = page.locator('input[name="linkFormularioParticipantes"]');
    await campoParticipantes.fill('https://forms.gle/novo-participantes');

    // Os eventos do mock não trazem tipo, que é obrigatório para salvar
    await page.locator('select[name="tipoEvento"]').selectOption('Conferência');

    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page).toHaveURL(/\/admin\/eventos(\/\d+)?$/, { timeout: 15000 });

    expect(enviado?.formulario_participante_link).toBe('https://forms.gle/novo-participantes');
    expect(enviado?.formulario_link).toBe('https://forms.gle/retiro');
  });
});
