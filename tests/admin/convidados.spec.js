import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin, loginComPapeis } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* Catálogo de convidados servido por cima do mock padrão. */
const CONVIDADOS = [
  { participante_id: 1, nome: 'Pr. Samuel Tavares', profissao: 'Pregador', link_foto: '' },
  { participante_id: 2, nome: 'Adoração Viva', profissao: 'Banda', link_foto: '' },
  { participante_id: 3, nome: 'Mariley Ribeiro', profissao: 'Líder', link_foto: '' },
];

const EVENTOS = [
  {
    evento_id: 1,
    nome: 'Conferência Nacional',
    descricao: 'Evento de teste.',
    tipo_evento: 'Conferência',
    data_inicio: '2030-05-10T08:00:00',
    data_fim: '2030-05-10T18:00:00',
    nome_local: 'Sede Nacional',
    local_latitude: -15.79,
    local_longitude: -47.88,
    link_galeria: '',
    formulario_link: '',
    link_imagem: '',
    calendario_evento_id: null,
  },
];

/* Mock com estado: guarda quem foi criado e quem está vinculado a cada evento,
   para conseguir verificar o reaproveitamento entre eventos. */
function criarEstado() {
  return {
    convidados: CONVIDADOS.map((c) => ({ ...c })),
    vinculos: { 1: [1] },
    criados: [],
    proximoId: 100,
  };
}

async function serveConvidados(page, estado) {
  await page.route('**/banda-palestrante**', async (route) => {
    const req = route.request();
    const url = req.url();

    if (req.method() === 'GET' && /\/banda-palestrante\/?(\?.*)?$/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(estado.convidados),
      });
    }

    if (req.method() === 'POST') {
      const corpo = JSON.parse(req.postData() || '{}');
      const novo = { ...corpo, participante_id: ++estado.proximoId };
      estado.convidados.push(novo);
      estado.criados.push(corpo);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(novo),
      });
    }

    const porId = url.match(/\/banda-palestrante\/(\d+)/);
    if (porId) {
      const id = Number(porId[1]);
      const alvo = estado.convidados.find((c) => c.participante_id === id);

      if (req.method() === 'GET') {
        if (!alvo) return route.fulfill({ status: 404, body: '{}' });
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(alvo),
        });
      }
      if (req.method() === 'PUT') {
        const corpo = JSON.parse(req.postData() || '{}');
        Object.assign(alvo, corpo);
        estado.criados.push(corpo);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(alvo),
        });
      }
      if (req.method() === 'DELETE') {
        estado.convidados = estado.convidados.filter((c) => c.participante_id !== id);
        return route.fulfill({ status: 204, body: '' });
      }
    }

    return route.fallback();
  });
}

async function serveEventos(page, estado) {
  await page.route('**/evento**', async (route) => {
    const req = route.request();
    const url = req.url();

    const participantes = url.match(/\/evento\/(\d+)\/participantes(?:\/(\d+))?/);
    if (participantes) {
      const eventoId = Number(participantes[1]);
      const participanteId = participantes[2] ? Number(participantes[2]) : null;
      estado.vinculos[eventoId] = estado.vinculos[eventoId] || [];

      if (req.method() === 'GET') {
        const ids = estado.vinculos[eventoId];
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(estado.convidados.filter((c) => ids.includes(c.participante_id))),
        });
      }
      if (req.method() === 'POST') {
        if (!estado.vinculos[eventoId].includes(participanteId)) {
          estado.vinculos[eventoId].push(participanteId);
        }
        return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      }
      if (req.method() === 'DELETE') {
        estado.vinculos[eventoId] = estado.vinculos[eventoId].filter((id) => id !== participanteId);
        return route.fulfill({ status: 204, body: '' });
      }
    }

    if (req.method() === 'GET' && /\/evento\/?(\?.*)?$/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EVENTOS),
      });
    }

    const porId = url.match(/\/evento\/(\d+)(\?.*)?$/);
    if (req.method() === 'GET' && porId) {
      const ev = EVENTOS.find((e) => String(e.evento_id) === porId[1]);
      if (ev) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(ev),
        });
      }
    }

    return route.fallback();
  });
}

test.describe('Convidados — listagem e cadastro', () => {
  let estado;

  test.beforeEach(async ({ page }) => {
    estado = criarEstado();
    await loginAsAdmin(page);
    await setupApiMock(page);
    await serveConvidados(page, estado);
    await serveEventos(page, estado);
  });

  test('lista os convidados com função e uso em eventos', async ({ page }) => {
    await page.goto('/admin/palestrantes');

    await expect(page.getByRole('heading', { name: 'Convidados' })).toBeVisible();
    await expect(page.getByText('Pr. Samuel Tavares')).toBeVisible();
    await expect(page.getByText('Adoração Viva')).toBeVisible();

    /* O reaproveitamento fica visível: Samuel já está num evento. */
    await expect(page.getByText('Em 1 evento')).toBeVisible();
    await expect(page.getByText('Ainda não vinculado').first()).toBeVisible();
  });

  test('busca por nome e por função, ignorando acento', async ({ page }) => {
    await page.goto('/admin/palestrantes');
    await expect(page.getByText('Pr. Samuel Tavares')).toBeVisible();

    const busca = page.getByLabel('Buscar convidado');
    await busca.fill('adoracao');
    await expect(page.getByText('Adoração Viva')).toBeVisible();
    await expect(page.getByText('Pr. Samuel Tavares')).toHaveCount(0);

    await busca.fill('pregador');
    await expect(page.getByText('Pr. Samuel Tavares')).toBeVisible();
    await expect(page.getByText('Adoração Viva')).toHaveCount(0);
  });

  test('cadastra convidado com biografia e redes sociais', async ({ page }) => {
    await page.goto('/admin/palestrantes/criar');

    await page.fill('input[name="name"]', 'Banda Nova Aliança');
    await page.selectOption('select[name="role"]', 'Banda');
    await page.fill('textarea[name="miniBio"]', 'Ministério de louvor da região sul.');
    await page.getByLabel('Rede 1', { exact: true }).fill('Instagram');
    await page.getByLabel('Endereço da rede 1').fill('instagram.com/novaalianca');

    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page).toHaveURL(/\/admin\/palestrantes$/);

    const enviado = estado.criados.at(-1);
    expect(enviado.nome).toBe('Banda Nova Aliança');
    expect(enviado.profissao).toBe('Banda');
    /* Campos que a API ainda não guarda seguem sendo enviados: ela os ignora
       em vez de recusar, então nada quebra enquanto o back não os persistir. */
    expect(enviado.mini_bio).toBe('Ministério de louvor da região sul.');
    expect(enviado.redes_sociais).toEqual([
      { rede: 'Instagram', url: 'instagram.com/novaalianca' },
    ]);
  });

  test('recusa endereço de rede social inválido', async ({ page }) => {
    await page.goto('/admin/palestrantes/criar');

    await page.fill('input[name="name"]', 'Convidado Teste');
    await page.getByLabel('Rede 1', { exact: true }).fill('Instagram');
    await page.getByLabel('Endereço da rede 1').fill('meu perfil');

    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText(/Instagram.*link válido/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/palestrantes\/criar/);
  });

  test('editar abre com a função derivada do cadastro antigo', async ({ page }) => {
    /* "Líder" não é uma das três funções; a derivação escolhe a mais próxima
       em vez de deixar o campo vazio. */
    await page.goto('/admin/palestrantes/3/editar');

    await expect(page.locator('input[name="name"]')).toHaveValue('Mariley Ribeiro');
    await expect(page.locator('select[name="role"]')).toHaveValue('Convidado');
  });
});

test.describe('Convidados — exclusão', () => {
  let estado;

  test.beforeEach(async ({ page }) => {
    estado = criarEstado();
    await setupApiMock(page);
    await serveConvidados(page, estado);
    await serveEventos(page, estado);
  });

  test('administrador de setor não recebe o botão de excluir', async ({ page }) => {
    await loginComPapeis(page, ['admin', 'admin-eventos']);
    await page.goto('/admin/palestrantes');
    await expect(page.getByText('Pr. Samuel Tavares')).toBeVisible();

    await expect(page.getByTitle('Excluir')).toHaveCount(0);
    await expect(page.getByTitle('Editar').first()).toBeVisible();
  });

  test('avisa quando o convidado está vinculado a eventos', async ({ page }) => {
    await loginComPapeis(page, ['admin', 'superadmin']);
    await page.goto('/admin/palestrantes');
    await expect(page.getByText('Pr. Samuel Tavares')).toBeVisible();

    await page.getByTitle('Excluir').first().click();

    await expect(page.getByText(/Excluir Pr\. Samuel Tavares/)).toBeVisible();
    await expect(page.getByText(/vinculado a 1 evento/)).toBeVisible();
  });
});

test.describe('Reaproveitamento entre eventos', () => {
  let estado;

  test.beforeEach(async ({ page }) => {
    estado = criarEstado();
    await loginAsAdmin(page);
    await setupApiMock(page);
    await serveConvidados(page, estado);
    await serveEventos(page, estado);
  });

  test('o formulário do evento oferece os convidados já cadastrados', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');

    /* Quem já está vinculado aparece escolhido, sem redigitar nada. */
    await expect(page.getByText('Pr. Samuel Tavares')).toBeVisible();

    const busca = page.getByLabel('Buscar convidado para o evento');
    await busca.fill('adoracao');
    await page.getByRole('button', { name: /Adoração Viva/ }).click();

    await expect(
      page.getByRole('button', { name: 'Remover Adoração Viva do evento' })
    ).toBeVisible();
  });

  test('salvar vincula por id, sem recadastrar convidado', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');
    await expect(page.getByText('Pr. Samuel Tavares')).toBeVisible();

    await page.getByLabel('Buscar convidado para o evento').fill('adoracao');
    await page.getByRole('button', { name: /Adoração Viva/ }).click();
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page).toHaveURL(/\/admin\/eventos$/);

    /* O vínculo aconteceu e nenhum convidado novo foi criado — é isso que
       diferencia reaproveitar de recadastrar. */
    await expect(async () => {
      expect(estado.vinculos[1]).toContain(2);
    }).toPass();
    expect(estado.criados).toHaveLength(0);
    expect(estado.convidados).toHaveLength(3);
  });

  test('cadastrar convidado sem sair do formulário do evento', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');
    await expect(page.getByText('Pr. Samuel Tavares')).toBeVisible();

    await page.getByRole('button', { name: /Cadastrar convidado novo/ }).click();
    await page.getByLabel('Nome do novo convidado').fill('Pr. Convidado Surpresa');
    await page.getByRole('button', { name: 'Cadastrar e vincular' }).click();

    /* Fica escolhido na hora, sem perder o que já estava preenchido no evento. */
    await expect(
      page.getByRole('button', { name: 'Remover Pr. Convidado Surpresa do evento' })
    ).toBeVisible();
    await expect(page.locator('input[name="title"]')).toHaveValue('Conferência Nacional');
  });

  test('desvincular na tela de detalhe do evento vale na hora', async ({ page }) => {
    await page.goto('/admin/eventos/1');

    const chip = page.getByRole('button', { name: 'Remover Pr. Samuel Tavares do evento' });
    await expect(chip).toBeVisible();
    await chip.click();

    await expect(page.getByText('Nenhum convidado vinculado a este evento.')).toBeVisible();
    expect(estado.vinculos[1]).toEqual([]);
  });
});
