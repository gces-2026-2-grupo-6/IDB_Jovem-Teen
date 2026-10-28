import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* Painel administrativo em tela pequena.
 *
 * Roda nos projetos móveis do playwright.config (Pixel 7 e iPhone 13). No
 * desktop a barra lateral fica sempre aberta e a largura sobra, então nada
 * aqui se aplica.
 *
 * Três garantias: o menu abre e leva a cada tela; nenhuma tela principal
 * estoura a largura (nem a página, nem o <main>, que tem rolagem própria);
 * e os controles de ação cabem inteiros na tela, sem ficar cortados por um
 * contêiner com overflow escondido.
 */

test.skip(({ isMobile }) => !isMobile, 'Só se aplica aos projetos móveis');

/* O token do helper é de superadministradora, que vê todos os itens. */
const ITENS_DO_MENU = [
  { nome: 'Eventos', url: /\/admin\/eventos$/, titulo: 'Eventos' },
  { nome: 'Convidados', url: /\/admin\/palestrantes$/, titulo: 'Convidados' },
  { nome: 'Voluntários', url: /\/admin\/voluntarios$/, titulo: 'Voluntários' },
  { nome: 'Produtos', url: /\/admin\/produtos$/, titulo: 'Produtos' },
  { nome: 'Diretores & Líderes', url: /\/admin\/lideres$/, titulo: /Diretores|Líderes/ },
  { nome: 'Administradores', url: /\/admin\/administradores$/, titulo: 'Administradores' },
];

/* Listagens e formulários principais do painel. */
const TELAS = [
  '/admin',
  '/admin/eventos',
  '/admin/eventos/criar',
  '/admin/palestrantes',
  '/admin/palestrantes/criar',
  '/admin/voluntarios',
  '/admin/voluntarios/1',
  '/admin/produtos',
  '/admin/produtos/criar',
  '/admin/lideres',
  '/admin/lideres/criar',
  '/admin/administradores',
  '/admin/administradores/criar',
];

/* Defeitos confirmados, por projeto e tela. A marcação `test.fail` mantém o
   teste rodando: quando o defeito for corrigido ele passa a falhar, avisando
   para retirar a linha daqui. */
const DEFEITOS_DE_LARGURA = {
  'mobile-iphone': {
    /* O cabeçalho com o botão "Adicionar Administrador" não quebra linha e
       passa 6px da tela de 390px: o <main> ganha rolagem lateral. */
    '/admin/administradores': 'cabeçalho mais largo que a tela',
  },
};

async function abrirPainel(page, rota) {
  await loginAsAdmin(page);
  await setupApiMock(page);
  await page.goto(rota);
}

/* Mede a tela com o conteúdo já carregado. Devolve a largura da janela, a
   largura rolável da página e do <main>, e os controles de ação que não
   cabem inteiros na área visível — fora da janela ou cortados por um
   ancestral que esconde o que transborda. O mapa (Leaflet) fica de fora: ele
   é um contêiner de rolagem por natureza. */
function medirLargura() {
  const largura = document.documentElement.clientWidth;
  const main = document.querySelector('main');

  const area = (el) => {
    let { left, right } = el.getBoundingClientRect();
    for (let pai = el.parentElement; pai && pai !== document.body; pai = pai.parentElement) {
      if (getComputedStyle(pai).overflowX !== 'visible') {
        const r = pai.getBoundingClientRect();
        left = Math.max(left, r.left);
        right = Math.min(right, r.right);
      }
    }
    return { left: Math.max(left, 0), right: Math.min(right, largura) };
  };

  const cortados = [...main.querySelectorAll('button, a[href], input, select, textarea')]
    .filter((el) => !el.closest('.leaflet-container'))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    })
    .filter((el) => {
      const r = el.getBoundingClientRect();
      const visivel = area(el);
      return visivel.right - visivel.left < r.width - 1;
    })
    .map((el) => (el.innerText || el.getAttribute('aria-label') || el.title || el.name || el.tagName).trim());

  return {
    largura,
    pagina: document.documentElement.scrollWidth,
    main: main.scrollWidth,
    cortados,
  };
}

test.describe('Painel em tela pequena — menu', () => {
  test('o menu abre pelo botão e começa fechado', async ({ page }) => {
    await abrirPainel(page, '/admin');

    const menu = page.getByRole('navigation');
    await expect(menu.getByRole('link', { name: 'Eventos' })).not.toBeInViewport();

    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(menu.getByRole('link', { name: 'Eventos' })).toBeInViewport();
  });

  for (const item of ITENS_DO_MENU) {
    test(`o menu leva a ${item.nome} e se fecha`, async ({ page }) => {
      await abrirPainel(page, '/admin');

      await page.getByRole('button', { name: 'Abrir menu' }).click();
      const link = page.getByRole('navigation').getByRole('link', { name: item.nome, exact: true });
      await link.click();

      await expect(page).toHaveURL(item.url);
      await expect(page.getByRole('heading', { name: item.titulo, exact: typeof item.titulo === 'string' }).first()).toBeVisible();
      /* Depois de navegar o menu sai da frente do conteúdo. */
      await expect(link).not.toBeInViewport();
    });
  }

  test('o botão Sair é alcançável pelo menu', async ({ page }) => {
    await abrirPainel(page, '/admin');

    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const sair = page.getByRole('button', { name: 'Sair' });
    await sair.scrollIntoViewIfNeeded();
    await expect(sair).toBeInViewport();
    await sair.click();

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Painel em tela pequena — largura das telas', () => {
  for (const rota of TELAS) {
    test(`${rota} cabe na largura da tela`, async ({ page }, testInfo) => {
      const defeito = DEFEITOS_DE_LARGURA[testInfo.project.name]?.[rota];
      test.fail(!!defeito, defeito);

      await abrirPainel(page, rota);
      await expect(page.getByRole('heading').first()).toBeVisible();
      await page.waitForLoadState('networkidle');

      const medida = await page.evaluate(medirLargura);

      expect(medida.pagina, 'a página não rola para o lado').toBeLessThanOrEqual(medida.largura);
      expect(medida.main, 'o conteúdo do painel não rola para o lado').toBeLessThanOrEqual(medida.largura);
      expect(medida.cortados, 'controles cortados ou fora da tela').toEqual([]);
    });
  }
});

/* A ação de cadastro de cada listagem precisa caber inteira na tela. */
const ACOES_PRINCIPAIS = [
  { rota: '/admin/eventos', nome: 'Adicionar Evento' },
  { rota: '/admin/palestrantes', nome: 'Adicionar Convidado' },
  { rota: '/admin/produtos', nome: 'Cadastrar Produto' },
  { rota: '/admin/lideres', nome: 'Cadastrar Diretor/Líder' },
  { rota: '/admin/administradores', nome: 'Adicionar Administrador' },
];

test.describe('Painel em tela pequena — ações', () => {
  for (const acao of ACOES_PRINCIPAIS) {
    test(`"${acao.nome}" fica inteiro na tela`, async ({ page }, testInfo) => {
      const defeito = DEFEITOS_DE_LARGURA[testInfo.project.name]?.[acao.rota];
      test.fail(!!defeito, defeito);

      await abrirPainel(page, acao.rota);
      /* 0.99 e não 1: o WebKit arredonda a borda em frações de pixel. Um
         corte de verdade, como os 6px do botão de administradores, fica
         bem abaixo disso. */
      await expect(page.getByRole('link', { name: acao.nome })).toBeInViewport({ ratio: 0.99 });
    });
  }

  test('as opções de status do voluntário podem ser tocadas', async ({ page }) => {
    /* DEFEITO CONHECIDO (Pixel 7 e iPhone 13): o menu do status abre com
       posição fixa logo abaixo do botão, sem conferir o espaço que sobra. Na
       última linha da tabela as opções ficam abaixo da área visível e não há
       mais página para rolar. Quando for corrigido, retirar esta linha. */
    test.fail(true, 'opções do status fora da tela');

    await abrirPainel(page, '/admin/voluntarios/1');
    const status = page.getByRole('button', { name: /^(Pendente|Aprovado|Reprovado)$/ }).last();
    await status.click();

    /* As opções vão para um portal no fim do <body>, então são os últimos
       botões com esse nome na página. */
    for (const opcao of ['Pendente', 'Aprovado', 'Reprovado']) {
      await expect(page.getByRole('button', { name: opcao, exact: true }).last()).toBeInViewport({ ratio: 0.99 });
    }
  });
});
