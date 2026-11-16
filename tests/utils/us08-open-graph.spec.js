import { test, expect } from '../helpers/testWithCoverage.js';

/* US08 (RF08) — card de compartilhamento por evento.
 *
 * O site é um SPA e o robô do WhatsApp não executa JavaScript: quando ele lê
 * a página, só existem as tags fixas do index.html. Por isso o link de um
 * evento aparecia com o card genérico do site.
 *
 * A montagem das tags está isolada em `src/utils/openGraph.js`, sem rede e
 * sem navegador, para poder ser verificada aqui função por função. A função
 * na borda (`api/evento-og.js`) só a chama e devolve o HTML; a ligação entre
 * as duas é configuração do `vercel.json`, que não roda nos testes.
 *
 * Marcado `@fonte` porque importa de `/src/`, caminho que só existe no
 * servidor de desenvolvimento.
 */

test.describe('US08 - Reconhecer o robô de prévia', () => {
  test('reconhece os robôs que leem o card', { tag: '@fonte' }, async ({ page }) => {
    await page.goto('/');
    const resultado = await page.evaluate(async () => {
      const { ehRoboDePrevia } = await import('/src/utils/openGraph.js');
      return {
        whatsapp: ehRoboDePrevia('WhatsApp/2.23.20.0'),
        facebook: ehRoboDePrevia('facebookexternalhit/1.1'),
        telegram: ehRoboDePrevia('TelegramBot (like TwitterBot)'),
        /* Maiúsculas e minúsculas não podem decidir se o card aparece. */
        caixaBaixa: ehRoboDePrevia('whatsapp/2.0'),
        navegador: ehRoboDePrevia(
          'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36'
        ),
        vazio: ehRoboDePrevia(''),
        nulo: ehRoboDePrevia(null),
      };
    });

    expect(resultado).toEqual({
      whatsapp: true,
      facebook: true,
      telegram: true,
      caixaBaixa: true,
      navegador: false,
      vazio: false,
      nulo: false,
    });
  });
});

test.describe('US08 - Montagem das tags', () => {
  test('o card traz o nome, a descrição e a imagem do evento', { tag: '@fonte' }, async ({ page }) => {
    await page.goto('/');
    const html = await page.evaluate(async () => {
      const { montarHtmlOpenGraph } = await import('/src/utils/openGraph.js');
      return montarHtmlOpenGraph({
        evento: {
          nome: 'Conferência Nacional',
          descricao: 'Três dias reunindo jovens de todas as regiões.',
          link_imagem: 'https://drive.google.com/file/d/ABC123/view',
        },
        urlCanonica: 'https://www.idbjovemeteen.tech/eventos/1-conferencia-nacional',
        apiUrl: 'https://api.exemplo.test',
        imagemPadrao: 'https://www.idbjovemeteen.tech/logo_geral.png',
      });
    });

    expect(html).toContain('<meta property="og:title" content="Conferência Nacional · IDB Jovem e Teen" />');
    expect(html).toContain('Três dias reunindo jovens de todas as regiões.');
    /* A imagem sai pelo proxy do back-end: o hotlink direto do Drive responde
       429/403 para quem vem de fora. */
    expect(html).toContain('https://api.exemplo.test/drive/imagem/ABC123');
    expect(html).toContain('<meta property="og:url" content="https://www.idbjovemeteen.tech/eventos/1-conferencia-nacional" />');
    expect(html).toContain('summary_large_image');
  });

  test('evento sem imagem cai na do site, sem card quebrado', { tag: '@fonte' }, async ({ page }) => {
    await page.goto('/');
    const html = await page.evaluate(async () => {
      const { montarHtmlOpenGraph } = await import('/src/utils/openGraph.js');
      return montarHtmlOpenGraph({
        evento: { nome: 'Culto', descricao: '', link_imagem: '' },
        urlCanonica: 'https://site.test/eventos/9-culto',
        apiUrl: 'https://api.test',
        imagemPadrao: 'https://site.test/logo_geral.png',
      });
    });

    expect(html).toContain('https://site.test/logo_geral.png');
    /* Sem descrição própria, usa a institucional em vez de deixar vazio. */
    expect(html).toContain('Agenda, eventos e informações');
  });

  test('sem evento, devolve o card institucional', { tag: '@fonte' }, async ({ page }) => {
    await page.goto('/');
    const html = await page.evaluate(async () => {
      const { montarHtmlOpenGraph } = await import('/src/utils/openGraph.js');
      return montarHtmlOpenGraph({
        evento: null,
        urlCanonica: 'https://site.test/eventos/404-sumido',
        apiUrl: 'https://api.test',
        imagemPadrao: 'https://site.test/logo_geral.png',
      });
    });

    expect(html).toContain('<meta property="og:title" content="IDB Jovem e Teen" />');
    expect(html).toContain('<meta property="og:type" content="website" />');
  });

  test('aspas e sinais no nome não quebram a marcação', { tag: '@fonte' }, async ({ page }) => {
    await page.goto('/');
    const html = await page.evaluate(async () => {
      const { montarHtmlOpenGraph } = await import('/src/utils/openGraph.js');
      return montarHtmlOpenGraph({
        evento: { nome: 'Retiro "Eis-me Aqui" & Cia <2027>', descricao: 'x', link_imagem: '' },
        urlCanonica: 'https://site.test/eventos/3-retiro',
        apiUrl: 'https://api.test',
        imagemPadrao: 'https://site.test/logo.png',
      });
    });

    /* O valor escapado não pode fechar o atributo nem abrir uma tag. */
    expect(html).toContain('&quot;Eis-me Aqui&quot; &amp; Cia &lt;2027&gt;');
    expect(html).not.toContain('content="Retiro "Eis-me');
  });

  test('descrição longa é resumida para não truncar no meio', { tag: '@fonte' }, async ({ page }) => {
    await page.goto('/');
    const resultado = await page.evaluate(async () => {
      const { resumir } = await import('/src/utils/openGraph.js');
      return {
        curta: resumir('Evento curto'),
        longa: resumir('a'.repeat(400)),
        espacos: resumir('  muitos   espaços \n e quebras  '),
      };
    });

    expect(resultado.curta).toBe('Evento curto');
    expect(resultado.longa.length).toBeLessThanOrEqual(200);
    expect(resultado.longa.endsWith('…')).toBe(true);
    expect(resultado.espacos).toBe('muitos espaços e quebras');
  });

  test('o id do evento sai do slug', { tag: '@fonte' }, async ({ page }) => {
    await page.goto('/');
    const resultado = await page.evaluate(async () => {
      const { idDoSlug } = await import('/src/utils/openGraph.js');
      return {
        completo: idDoSlug('12-conferencia-nacional'),
        soId: idDoSlug('7'),
        semId: idDoSlug('conferencia'),
        vazio: idDoSlug(''),
      };
    });

    expect(resultado).toEqual({ completo: 12, soId: 7, semId: null, vazio: null });
  });
});
