import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* US16 (RNF02) — acessibilidade e leitor de tela.
 *
 * Antes desta história os rótulos acessíveis entravam só de carona, onde
 * outra história passava. Duas lacunas estruturais ficavam:
 *
 * · formulários cujos <label> não estavam ligados ao campo, então o leitor de
 *   tela anunciava "caixa de edição" sem dizer de quê;
 * · modais que eram <div> comum: não se anunciavam como diálogo, não prendiam
 *   o foco e não o devolviam ao fechar.
 */

/* Todo campo de um formulário precisa ter nome acessível — por <label for>,
   por aria-label ou por um <label> que o envolva. */
async function camposSemNome(page) {
  return page.evaluate(() => {
    const campos = [...document.querySelectorAll('input, select, textarea')];
    return campos
      .filter((c) => c.type !== 'hidden')
      .filter((c) => {
        if (c.getAttribute('aria-label')) return false;
        if (c.getAttribute('aria-labelledby')) return false;
        if (c.id && document.querySelector(`label[for="${CSS.escape(c.id)}"]`)) return false;
        if (c.closest('label')) return false;
        return true;
      })
      .map((c) => c.name || c.type);
  });
}

test.describe('US16 - Rótulo associado ao campo', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);
  });

  for (const [nome, url] of [
    ['cadastro de diretor/líder', '/admin/lideres/criar'],
    ['cadastro de produto', '/admin/produtos/criar'],
    ['cadastro de convidado', '/admin/palestrantes/criar'],
    ['cadastro de administrador', '/admin/administradores/criar'],
    ['criação de evento', '/admin/eventos/criar'],
  ]) {
    test(`todo campo tem nome acessível — ${nome}`, async ({ page }) => {
      await page.goto(url);
      await page.waitForTimeout(600);

      expect(await camposSemNome(page)).toEqual([]);
    });
  }

  test('o rótulo leva o foco ao campo quando clicado', async ({ page }) => {
    await page.goto('/admin/lideres/criar');

    /* É o efeito prático da associação: clicar no texto foca o campo. */
    await page.getByText('Cargo', { exact: true }).click();

    const focado = await page.evaluate(() => document.activeElement?.name);
    expect(focado).toBe('role');
  });

  test('a tela de login também associa os rótulos', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(400);

    expect(await camposSemNome(page)).toEqual([]);
  });
});

test.describe('US16 - Diálogo modal', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);
    await page.goto('/admin/produtos');
    await page.getByRole('button', { name: 'Excluir' }).first().click();
  });

  test('anuncia-se como diálogo, com nome', async ({ page }) => {
    const dialogo = page.getByRole('dialog');

    await expect(dialogo).toBeVisible();
    await expect(dialogo).toHaveAttribute('aria-modal', 'true');
    await expect(dialogo).toHaveAttribute('aria-label', /exclusão de produto/i);
  });

  test('o foco entra no diálogo ao abrir', async ({ page }) => {
    const dentro = await page.evaluate(() =>
      !!document.activeElement?.closest('[role="dialog"]')
    );
    expect(dentro).toBe(true);
  });

  test('o foco não escapa do diálogo pelo Tab', async ({ page }) => {
    /* Sem a prisão de foco, o Tab sairia para os botões da página de trás —
       que o aria-modal já declarou inertes para o leitor de tela. */
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const dentro = await page.evaluate(() =>
        !!document.activeElement?.closest('[role="dialog"]')
      );
      expect(dentro).toBe(true);
    }
  });

  test('Shift+Tab também mantém o foco dentro', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Shift+Tab');
      const dentro = await page.evaluate(() =>
        !!document.activeElement?.closest('[role="dialog"]')
      );
      expect(dentro).toBe(true);
    }
  });

  test('Esc fecha e o foco volta para quem o tinha antes', async ({ page }) => {
    /* O contrato é devolver o foco a quem o tinha antes de abrir — e não
       presumir que era o botão.

       Chromium foca um botão ao ser clicado; o WebKit não, por convenção do
       macOS. Então, abrindo com o mouse, o "antes" é o botão num e o <body>
       no outro, e os dois estão certos. Quem navega por teclado aciona o
       botão com Enter, aí ele tem o foco em qualquer motor — que é o caso
       em que a devolução importa. */
    /* O beforeEach já abriu um diálogo; este teste precisa do estado
       anterior à abertura, então fecha e recomeça registrando o foco. */
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const antes = await page.evaluate(() => {
      window.__focoAntesDoDialogo = document.activeElement;
      return document.activeElement?.tagName;
    });

    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await page.getByRole('dialog').waitFor();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const voltouAoMesmo = await page.evaluate(
      () => document.activeElement === window.__focoAntesDoDialogo
    );
    expect(voltouAoMesmo, `o foco deveria voltar ao ${antes} que o tinha antes`).toBe(true);
  });
});
