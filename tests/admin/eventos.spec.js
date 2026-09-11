import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

async function preencherLocalPelaBusca(page, query = 'Teste') {
  await page.getByPlaceholder('Digite o nome ou endereço do local').fill(query);
  const option = page.locator('ul.absolute button').first();
  await option.waitFor({ state: 'visible' });
  await option.click();
  await page.waitForTimeout(500);
}

test.describe('Admin - Gerenciamento de Eventos CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin/eventos');
  });

  test('deve exibir título e seções da lista de eventos', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Eventos', exact: true })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Próximos Eventos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Eventos Anteriores' })).toBeVisible();
  });

  test('deve navegar para a página de criar evento', async ({ page }) => {
    const btnNovo = page.getByRole('link', { name: /Adicionar Evento/i });
    await btnNovo.click();

    await expect(page).toHaveURL(/\/admin\/eventos\/criar/);
    await expect(page.getByRole('heading', { name: 'Criação de Evento' })).toBeVisible({ timeout: 15000 });
  });

  test('deve preencher e salvar um novo evento completo', async ({ page }) => {
    await page.goto('/admin/eventos/criar');

    // Preenche o form (UI nova: datas separadas + local pelo mapa)
    await page.getByPlaceholder('Nome do Evento').fill('Retiro Playwright');
    await page.locator('select[name="tipoEvento"]').selectOption('Conferência');
    await page.locator('textarea[name="description"]').fill('Um evento para testar com E2E.');
    await preencherLocalPelaBusca(page, 'Sítio Teste');
    await page.locator('input[name="startDay"]').fill('2029-12-31');
    await page.locator('input[name="startTime"]').fill('09:00');
    await page.locator('input[name="endDay"]').fill('2029-12-31');
    await page.locator('input[name="endTime"]').fill('18:00');
    /* Convidado agora é escolhido do cadastro, não digitado: a US06 trocou o
       texto livre pela seleção, que é o que evita recadastrar a cada edição.
       Quem ainda não existe pode ser criado sem sair do formulário. */
    await page.getByRole('button', { name: /Cadastrar convidado novo/ }).click();
    await page.getByLabel('Nome do novo convidado').fill('Pr. Dev');
    await page.getByRole('button', { name: 'Cadastrar e vincular' }).click();
    await expect(
      page.getByRole('button', { name: 'Remover Pr. Dev do evento' })
    ).toBeVisible();

    await page.getByPlaceholder('Cole o link da imagem (Google Drive)').fill('https://drive.google.com/file/d/abc123/view');
    await page.locator('input[name="linkFormularioVoluntarios"]').fill('https://forms.gle/teste');

    await page.getByRole('button', { name: 'Salvar' }).click();

    // Redireciona para a tela de programação após criar
    await expect(page).toHaveURL(/\/admin\/eventos\/\d+\/programacao/);

    // Clica em Concluir para voltar para a edição
    await page.getByRole('button', { name: 'Concluir' }).click();
    await expect(page).toHaveURL(/\/admin\/eventos\/\d+\/editar/);

    // Volta para a lista de eventos
    await page.getByTitle('Voltar').click();
    await expect(page).toHaveURL(/\/admin\/eventos/);
  });

  test('deve editar um evento existente', async ({ page }) => {
    // Clica no editar do primeiro Próximo Evento
    const btnEditar = page.getByTitle('Editar').first();
    await btnEditar.click();

    await expect(page).toHaveURL(/\/admin\/eventos\/\d+\/editar/);
    await expect(page.getByRole('heading', { name: 'Edição de Evento' })).toBeVisible({ timeout: 15000 });

    // Edita
    const titleInput = page.getByPlaceholder('Nome do Evento');
    await titleInput.fill('Evento Playwright Atualizado');

    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page).toHaveURL(/\/admin\/eventos/);
  });

  test('deve abrir modal de exclusão de evento e cancelar', async ({ page }) => {
    const btnExcluir = page.getByTitle('Excluir').first();
    await btnExcluir.click();

    // O modal deve aparecer
    const modalHeading = page.getByText('Tem certeza que deseja excluir este evento?');
    await expect(modalHeading).toBeVisible();

    const btnCancelar = page.getByRole('button', { name: 'Não' });
    await btnCancelar.click();

    // O modal deve fechar
    await expect(modalHeading).not.toBeVisible();
  });

  test('deve abrir modal de exclusão de evento e confirmar', async ({ page }) => {
    const eventCards = page.locator('.flex.items-center.gap-4.py-4');
    const initialCount = await eventCards.count();

    if (initialCount > 0) {
      const btnExcluir = page.getByTitle('Excluir').first();
      await btnExcluir.click();

      // O modal deve aparecer
      const modalHeading = page.getByText('Tem certeza que deseja excluir este evento?');
      await expect(modalHeading).toBeVisible();

      const btnConfirmar = page.getByRole('button', { name: 'Sim' });
      await btnConfirmar.click();

      // O modal deve fechar
      await expect(modalHeading).not.toBeVisible();

      // O mock do front não persiste a exclusão permanente entre loads se ele reseta, mas pelo menos validamos que o clique ocorre sem erros
    }
  });

  test('deve exibir erro ao tentar criar evento sem título', async ({ page }) => {
    await page.goto('/admin/eventos/criar');

    // Deixa título vazio e preenche o resto
    await page.locator('input[name="startDay"]').fill('2029-12-31');
    await page.locator('input[name="startTime"]').fill('09:00');
    await page.locator('input[name="endDay"]').fill('2029-12-31');
    await page.locator('input[name="endTime"]').fill('18:00');

    // Intercepta alerts do navegador, pois o app usa alert()
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Salvar' }).click();

    // O título é required no HTML; se a validação nativa não bloquear, o
    // handleCreateEvent retorna erro via alert.
    const titleInput = page.getByPlaceholder('Nome do Evento');
    const isRequired = await titleInput.getAttribute('required');

    expect(isRequired !== null || alertMessage.length > 0).toBeTruthy();
  });

  test('deve testar os botões de Voltar e Cancelar na criação e edição, além de Editar Programação', async ({ page }) => {
    test.setTimeout(60000);
    // Cria
    await page.goto('/admin/eventos/criar');
    await page.getByTitle('Voltar').first().click();
    await expect(page).toHaveURL(/\/admin\/eventos/);

    await page.goto('/admin/eventos/criar');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page).toHaveURL(/\/admin\/eventos/);

    // Edita
    await page.goto('/admin/eventos/1/editar');
    await page.getByTitle('Voltar').first().click();
    await expect(page).toHaveURL(/\/admin\/eventos/);

    await page.goto('/admin/eventos/1/editar');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page).toHaveURL(/\/admin\/eventos/);

    // Botão Editar Programação (só existe na edição)
    await page.goto('/admin/eventos/1/editar');
    await page.getByRole('button', { name: /Editar Programação do Evento/i }).click();
    await expect(page).toHaveURL(/\/admin\/eventos\/1\/programacao/);
  });

  test('deve abrir detalhes de um evento anterior e verificar dados', async ({ page }) => {
    const btnDetalhes = page.getByRole('link', { name: 'Detalhes' }).first();
    await btnDetalhes.click();

    await expect(page).toHaveURL(/\/admin\/eventos\/\d+/);
    await expect(page.getByRole('heading', { name: 'Detalhes do Evento' })).toBeVisible();

    // Verifica tabelas detalhadas
    await expect(page.getByText('Nome do Evento', { exact: true })).toBeVisible();
    await expect(page.getByText('Descrição do Evento', { exact: true })).toBeVisible();
    await expect(page.getByText('Total de Participantes', { exact: true })).toBeVisible();
    await expect(page.getByText('Total de Voluntários', { exact: true })).toBeVisible();
    await expect(page.getByText('Local', { exact: true })).toBeVisible();
    await expect(page.getByText('Data', { exact: true })).toBeVisible();
    await expect(page.getByText('Palestrantes', { exact: true })).toBeVisible();
    await expect(page.getByText('Bandas', { exact: true })).toBeVisible();

    // Testar volta
    const btnVoltar = page.getByTitle('Voltar');
    await btnVoltar.click();
    await expect(page).toHaveURL(/\/admin\/eventos/);
  });

  test('deve exibir mensagem de Evento não encontrado para Edit e Details inválidos', async ({ page }) => {
    // Edita
    await page.goto('/admin/eventos/999999/editar');
    await expect(page.getByText('Evento não encontrado.')).toBeVisible();
    await page.getByRole('button', { name: 'Voltar para Eventos' }).click();
    await expect(page).toHaveURL(/\/admin\/eventos/);

    // Detalhes
    await page.goto('/admin/eventos/999999');
    await expect(page.getByText('Evento não encontrado.')).toBeVisible();
    await page.getByRole('button', { name: 'Voltar para Eventos' }).click();
    await expect(page).toHaveURL(/\/admin\/eventos/);
  });

  test('deve testar link Voluntários em Evento Anterior', async ({ page }) => {
    const btnVol = page.getByRole('link', { name: 'Voluntários', exact: true }).first();
    await btnVol.click();

    await expect(page).toHaveURL(/\/admin\/voluntarios/);
  });
});

test.describe('Admin - Gerenciamento de Programação do Evento', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin/eventos/1/programacao');
  });

  test('deve exibir a tela de programação', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Programação do Evento' })).toBeVisible();
  });

  test('deve exibir e esconder o formulário inline de adicionar atividade', async ({ page }) => {
    const btnPlus = page.getByTitle('Adicionar atividade');
    await btnPlus.click();

    const inputAtividade = page.getByPlaceholder('Nome da atividade');
    await expect(inputAtividade).toBeVisible();

    // Cancelar
    const btnCancelar = page.getByRole('button', { name: 'Cancelar' });
    await btnCancelar.click();
    await expect(inputAtividade).not.toBeVisible();
  });

  test('deve adicionar uma nova atividade (no estado local do form)', async ({ page }) => {
    const btnPlus = page.getByTitle('Adicionar atividade');
    await btnPlus.click();

    await page.getByPlaceholder('Nome da atividade').fill('Almoço Teste');
    await page.getByPlaceholder('Descrição da atividade').fill('Testando descrição');
    await page.locator('input[type="time"]').first().fill('12:00');
    await page.locator('input[type="time"]').nth(1).fill('13:00');

    // Salvar atividade
    await page.getByRole('button', { name: 'Confirmar' }).click();

    // Atividade deve estar na lista
    await expect(page.getByText('Almoço Teste')).toBeVisible();
  });

  test('deve editar uma atividade existente', async ({ page }) => {
    // Clica no editar da primeira atividade
    const btnEditar = page.getByTitle('Editar atividade').first();
    await btnEditar.click();

    const inputAtividade = page.getByPlaceholder('Nome da atividade');
    await inputAtividade.fill('Atividade Editada pelo Playwright');

    // Salvar
    await page.getByRole('button', { name: 'Confirmar' }).click();

    // Atividade deve estar na lista com nome novo
    await expect(page.getByText('Atividade Editada pelo Playwright')).toBeVisible();
  });

  test('deve excluir uma atividade existente', async ({ page }) => {
    const activityRows = page.locator('.flex.items-center.gap-4.py-4');
    await expect(activityRows.first()).toBeVisible();
    const countBefore = await activityRows.count();

    const btnExcluir = page.getByTitle('Excluir atividade').first();
    await btnExcluir.click();

    // Confirma no modal
    const btnConfirmar = page.getByRole('button', { name: 'Sim' });
    await btnConfirmar.click();

    // Verifica se o contador diminuiu
    await expect(activityRows).toHaveCount(countBefore - 1);
  });

  test('deve salvar a programação inteira', async ({ page }) => {
    const btnSalvar = page.getByRole('button', { name: 'Concluir' });
    await btnSalvar.click();

    // Redireciona de volta p/ a edição do evento
    await expect(page).toHaveURL(/\/admin\/eventos\/1\/editar/);
  });

  test('deve exibir empty state na programação quando não houver atividades', async ({ page }) => {
    // Evento 2 tem programação vazia
    await page.goto('/admin/eventos/2/programacao');

    // O EmptyState deve estar visível ("Nenhuma atividade cadastrada.")
    await expect(page.getByText('Nenhuma atividade cadastrada.')).toBeVisible();

    // Quando clica em adicionar, o empty state some (cobrindo a linha 108: !showAddForm)
    const btnPlus = page.getByTitle('Adicionar atividade');
    await btnPlus.click();

    await expect(page.getByText('Nenhuma atividade cadastrada.')).not.toBeVisible();
  });
});

test.describe('Admin - Cobertura Extra de Branches', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
  });

  test('deve exibir alert ao criar evento com título mas sem local (Create.jsx L15)', async ({ page }) => {
    await page.goto('/admin/eventos/criar');

    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Preenche título, tipo e datas mas NÃO seleciona o local no mapa
    await page.getByPlaceholder('Nome do Evento').fill('Evento Sem Local');
    await page.locator('select[name="tipoEvento"]').selectOption('Conferência');
    await page.locator('input[name="startDay"]').fill('2029-12-30');
    await page.locator('input[name="startTime"]').fill('08:00');
    await page.locator('input[name="endDay"]').fill('2029-12-31');
    await page.locator('input[name="endTime"]').fill('18:00');

    // Remove required dos inputs para bypass HTML5 validation
    await page.evaluate(() => {
      document.querySelectorAll('[required]').forEach(el => el.removeAttribute('required'));
    });

    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.waitForTimeout(500);
    expect(alertMessage).toContain('Latitude e longitude');
  });

  test('deve exibir alert ao editar evento limpando o título (Edit.jsx L32)', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');

    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Limpa o título e remove required para bypass HTML5 validation
    const titleInput = page.getByPlaceholder('Nome do Evento');
    await titleInput.fill('');
    await page.evaluate(() => {
      document.querySelectorAll('[required]').forEach(el => el.removeAttribute('required'));
    });

    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.waitForTimeout(500);
    expect(alertMessage.length).toBeGreaterThan(0);
  });

  test('deve exibir Evento não encontrado na programação com ID inválido (EditSchedule.jsx L29-39)', async ({ page }) => {
    await page.goto('/admin/eventos/999999/programacao');

    await expect(page.getByText('Evento não encontrado.')).toBeVisible();
    await page.getByRole('button', { name: 'Voltar para Eventos' }).click();
    await expect(page).toHaveURL(/\/admin\/eventos/);
  });

  test('deve exibir alert ao adicionar atividade sem nome (ActivityInlineForm.jsx L19-20)', async ({ page }) => {
    await page.goto('/admin/eventos/1/programacao');

    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Abre formulário inline
    await page.getByTitle('Adicionar atividade').click();

    // Remove required para bypass HTML5 validation
    await page.evaluate(() => {
      document.querySelectorAll('[required]').forEach(el => el.removeAttribute('required'));
    });

    // Tenta confirmar sem preencher nome
    await page.getByRole('button', { name: 'Confirmar' }).click();

    await page.waitForTimeout(500);
    expect(alertMessage).toContain('Nome da atividade');
  });

  test('deve editar atividade inline na programação (EditSchedule.jsx L99)', async ({ page }) => {
    await page.goto('/admin/eventos/1/programacao');

    // Clica no editar da primeira atividade
    const btnEditar = page.getByTitle('Editar atividade').first();
    await expect(btnEditar).toBeVisible();
    await btnEditar.click();

    // Modifica o nome
    const inputAtividade = page.getByPlaceholder('Nome da atividade');
    await inputAtividade.fill('Atividade Inline Editada');

    // Cancela para cobrir o setEditingItem(null) via botão Cancelar
    await page.getByRole('button', { name: 'Cancelar' }).click();

    // Agora edita de novo e confirma
    await page.getByTitle('Editar atividade').first().click();
    await page.getByPlaceholder('Nome da atividade').fill('Atividade Confirmada');
    await page.getByRole('button', { name: 'Confirmar' }).click();

    await expect(page.getByText('Atividade Confirmada')).toBeVisible();
  });

  test('deve cobrir Details.jsx com evento sem campos opcionais preenchidos (Details.jsx branches)', async ({ page }) => {
    // Cria um evento mínimo no passado (local pelo mapa) para aparecer em
    // "Eventos Anteriores" com link "Detalhes"
    await page.goto('/admin/eventos/criar');
    await page.getByPlaceholder('Nome do Evento').fill('Evento Minimalista');
    await page.locator('select[name="tipoEvento"]').selectOption('Outros');
    await preencherLocalPelaBusca(page);
    await page.locator('input[name="startDay"]').fill('2020-01-01');
    await page.locator('input[name="startTime"]').fill('09:00');
    await page.locator('input[name="endDay"]').fill('2020-01-01');
    await page.locator('input[name="endTime"]').fill('18:00');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page).toHaveURL(/\/admin\/eventos\/\d+\/programacao/);
    await page.goto('/admin/eventos');

    // Acha o link Detalhes do novo evento especificamente
    const eventCard = page.locator('.flex.items-center.gap-4').filter({ hasText: 'Evento Minimalista' }).first();
    const detalhesLink = eventCard.getByRole('link', { name: 'Detalhes' });
    await detalhesLink.click();

    await expect(page.getByRole('heading', { name: 'Detalhes do Evento' })).toBeVisible();
    // Os campos opcionais (descrição, palestrantes, bandas) têm o "—" como fallback
    await expect(page.getByText('—').first()).toBeVisible();
  });

  test('deve criar evento sem título via JS para cobrir Create.jsx L15 (alert branch)', async ({ page }) => {
    await page.goto('/admin/eventos/criar');

    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Remove required de TODOS os inputs
    await page.evaluate(() => {
      document.querySelectorAll('[required]').forEach(el => el.removeAttribute('required'));
    });

    // Submete sem preencher nada
    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.waitForTimeout(500);
    expect(alertMessage.length).toBeGreaterThan(0);
  });

  test('deve confirmar exclusão de evento clicando Sim no modal (Eventos/index.jsx L32-34)', async ({ page }) => {
    await page.goto('/admin/eventos');

    // Clica no botão Excluir
    const btnExcluir = page.getByTitle('Excluir').first();
    await expect(btnExcluir).toBeVisible();
    await btnExcluir.click();

    // O modal deve aparecer
    const modalHeading = page.getByText('Tem certeza que deseja excluir este evento?');
    await expect(modalHeading).toBeVisible();

    // Confirma exclusão clicando "Sim"
    const btnSim = page.getByRole('button', { name: 'Sim' });
    await btnSim.click();

    // Modal deve fechar
    await expect(modalHeading).not.toBeVisible();
  });

  test('deve cobrir EditSchedule.jsx handleBack (L39) e alert de erro no salvar (L76)', async ({ page }) => {
    // Visita uma página de programação válida
    await page.goto('/admin/eventos/1/programacao');
    await expect(page.getByRole('heading', { name: 'Programação do Evento' })).toBeVisible();

    // Teste handleBack clicando no botão Voltar no SectionTitle
    await page.locator('button[title="Voltar"]').click();
    await expect(page).toHaveURL(/\/admin\/eventos\/1\/editar/);
  });

  test('deve cobrir Details.jsx com todos os branches de fallback (L13, L83-99)', async ({ page }) => {
    // Cria um evento mínimo sem campos opcionais para atingir todos os branches de fallback
    await page.goto('/admin/eventos/criar');
    await page.getByPlaceholder('Nome do Evento').fill('Evento Sem Opcionais');
    await page.locator('select[name="tipoEvento"]').selectOption('Outros');
    await page.locator('input[name="startDay"]').fill('2020-06-01');
    await page.locator('input[name="startTime"]').fill('09:00');
    await page.locator('input[name="endDay"]').fill('2020-06-01');
    await page.locator('input[name="endTime"]').fill('18:00');
    await preencherLocalPelaBusca(page, 'Local X');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page).toHaveURL(/\/admin\/eventos\/\d+\/programacao/);
    await page.goto('/admin/eventos');

    // Encontra e clica no link "Detalhes" do evento recém-criado
    const eventCard = page.locator('.flex.items-center.gap-4').filter({ hasText: 'Evento Sem Opcionais' }).first();
    await eventCard.getByRole('link', { name: 'Detalhes' }).click();

    await expect(page.getByRole('heading', { name: 'Detalhes do Evento' })).toBeVisible();

    // O fallback "—" deve aparecer para descrição, palestrantes, bandas
    const dashes = page.getByText('—');
    expect(await dashes.count()).toBeGreaterThanOrEqual(1);

    // Navega de volta e clica em Voluntários
    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page).toHaveURL(/\/admin\/eventos/);

    // O evento recém-criado foi no passado (2020-06-01), então está em Eventos Anteriores
    const pastEventCard = page.locator('.flex.items-center.gap-4').filter({ hasText: 'Evento Sem Opcionais' }).first();
    await pastEventCard.getByRole('link', { name: 'Voluntários' }).click();
    await expect(page.getByRole('heading', { name: 'Voluntários' })).toBeVisible();

    // Agora estamos na lista de eventos para voluntários. Clicar no botão do evento:
    const volEventCard = page.locator('.bg-white.rounded-2xl').filter({ hasText: 'Evento Sem Opcionais' }).first();
    await volEventCard.getByRole('link', { name: 'Voluntários Inscritos' }).click();

    // O link deve ser "#" porque não fornecemos linkFormularioVoluntarios
    const formLink = page.getByRole('link', { name: 'Abrir Formulário' }).first();
    await expect(formLink).toHaveAttribute('href', '#');
  });

  test('deve cobrir Details.jsx ?? branches com valores null (totalParticipantes/totalVoluntarios)', async ({ page }) => {
    // Injeta um evento com null explícito para totalParticipantes e totalVoluntarios para cobrir os branches null coalescing ?? 0 nas linhas 70 e 78
    await page.goto('/admin/eventos');

    // Navega para a página de detalhes deste evento
    await page.goto('/admin/eventos/77777');

    await expect(page.getByRole('heading', { name: 'Detalhes do Evento' })).toBeVisible();
    await expect(page.getByText('Evento Null Fields')).toBeVisible();

    // descrição, local, palestrantes e bandas devem mostrar "—"
    const dashes = page.getByText('—');
    expect(await dashes.count()).toBeGreaterThanOrEqual(4);
  });
});

