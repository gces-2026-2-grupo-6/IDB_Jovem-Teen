/* Tags Open Graph por evento (US08, RF08).
 *
 * O site é um SPA: o robô do WhatsApp, do Instagram e do Facebook **não
 * executa JavaScript**. Trocar a tag com `useEffect` depois que a página
 * monta não adianta — quando o robô lê o HTML, ele ainda traz as tags fixas
 * do `index.html`, que descrevem o site inteiro. Por isso o link de um evento
 * aparecia com o card genérico.
 *
 * A saída daqui é servida por uma função na borda (`api/evento-og.js`), que
 * responde o HTML já com as tags preenchidas quando quem pede é um robô. Este
 * módulo é só a montagem — sem rede, sem navegador, sem `import.meta` —
 * justamente para poder ser testado sozinho e para o Node da função
 * conseguir importá-lo.
 */

/* Robôs que leem o card de prévia. A lista é por engenho, não por aplicativo:
   o WhatsApp e o Instagram usam o do Facebook. */
export const ROBOS_DE_PREVIA = [
  "facebookexternalhit",
  "facebookcatalog",
  "WhatsApp",
  "Twitterbot",
  "LinkedInBot",
  "TelegramBot",
  "Slackbot",
  "Discordbot",
  "Pinterest",
  "SkypeUriPreview",
  "redditbot",
  "Googlebot",
  "bingbot",
];

export function ehRoboDePrevia(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  const ua = userAgent.toLowerCase();
  return ROBOS_DE_PREVIA.some((robo) => ua.includes(robo.toLowerCase()));
}

/* O slug é `<id>-<nome>`; só o número à frente identifica o evento. Mesmo
   formato que `parseEventId` do eventService — repetido aqui de propósito,
   para este módulo não arrastar a camada de API para dentro da função. */
export function idDoSlug(slug) {
  const achado = String(slug ?? "").match(/^\d+/);
  return achado ? Number(achado[0]) : null;
}

export function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* O id do arquivo no Drive, nas formas que o cadastro aceita. */
function idDoDrive(url) {
  const texto = String(url ?? "").trim();
  if (!texto) return null;
  const padroes = [
    /lh3\.googleusercontent\.com\/d\/([\w-]+)/,
    /\/file\/d\/([\w-]+)/,
    /[?&]id=([\w-]+)/,
    /\/drive\/imagem\/([\w-]+)/,
  ];
  for (const padrao of padroes) {
    const achado = texto.match(padrao);
    if (achado) return achado[1];
  }
  return null;
}

/* A imagem do card precisa de uma URL absoluta que o robô consiga buscar sem
   login. O hotlink direto para o lh3 do Google responde 429/403 quando vem de
   fora — é o mesmo motivo pelo qual o site já usa o proxy do back-end para a
   capa do evento. Então o card aponta para o proxy. */
export function urlDaImagem(linkImagem, { apiUrl, imagemPadrao }) {
  const id = idDoDrive(linkImagem);
  if (id && apiUrl) {
    return `${String(apiUrl).replace(/\/$/, "")}/drive/imagem/${id}`;
  }
  /* Link que não é do Drive, mas já é absoluto, serve como está. */
  const texto = String(linkImagem ?? "").trim();
  if (/^https?:\/\//i.test(texto)) return texto;
  return imagemPadrao;
}

/* Uma linha só, para o card não truncar no meio de uma frase. */
export function resumir(texto, limite = 200) {
  const limpo = String(texto ?? "").replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;
  return `${limpo.slice(0, limite - 1).trimEnd()}…`;
}

/* HTML mínimo com as tags do evento.
 *
 * `evento` vem na forma da API (`nome`, `descricao`, `link_imagem`), e não na
 * do front: quem chama é a função na borda, que fala direto com o back-end.
 * Evento ausente cai no card institucional, em vez de card quebrado. */
export function montarHtmlOpenGraph({
  evento,
  urlCanonica,
  apiUrl,
  siteNome = "IDB Jovem e Teen",
  descricaoPadrao = "Agenda, eventos e informações do IDB Jovem e Teen.",
  imagemPadrao,
}) {
  const titulo = evento?.nome ? `${evento.nome} · ${siteNome}` : siteNome;
  const descricao = resumir(evento?.descricao) || descricaoPadrao;
  const imagem = evento
    ? urlDaImagem(evento.link_imagem, { apiUrl, imagemPadrao })
    : imagemPadrao;

  const tags = [
    ["og:type", evento ? "article" : "website"],
    ["og:site_name", siteNome],
    ["og:title", titulo],
    ["og:description", descricao],
    ["og:image", imagem],
    ["og:url", urlCanonica],
  ];

  const metas = tags
    .filter(([, conteudo]) => conteudo)
    .map(([nome, conteudo]) => `    <meta property="${nome}" content="${escaparHtml(conteudo)}" />`)
    .join("\n");

  /* `twitter:card` grande é o que faz a imagem aparecer inteira, em vez de
     miniatura ao lado do texto. */
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>${escaparHtml(titulo)}</title>
${metas}
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${escaparHtml(urlCanonica)}" />
  </head>
  <body>
    <p><a href="${escaparHtml(urlCanonica)}">${escaparHtml(titulo)}</a></p>
  </body>
</html>
`;
}
