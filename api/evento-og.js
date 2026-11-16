import {
  ehRoboDePrevia,
  idDoSlug,
  montarHtmlOpenGraph,
} from "../src/utils/openGraph.js";

/* Card de compartilhamento por evento (US08, RF08).
 *
 * O `vercel.json` manda para cá só as requisições de `/eventos/:slug` cujo
 * user-agent é de um robô de prévia. Visitante de verdade continua recebendo
 * o `index.html` e a aplicação, sem passar por esta função.
 *
 * A checagem do user-agent é repetida aqui de propósito: se alguém abrir a
 * rota direto, ou se a condição do `vercel.json` mudar, a pessoa é mandada
 * para a página de verdade em vez de ver o HTML cru do card.
 */

const SITE_URL = (process.env.SITE_URL || "https://www.idbjovemeteen.tech").replace(/\/$/, "");
const API_URL = (process.env.VITE_API_URL || process.env.API_URL || "").replace(/\/$/, "");
const IMAGEM_PADRAO = `${SITE_URL}/logo_geral.png`;

async function buscarEvento(id) {
  if (!id || !API_URL) return null;
  try {
    /* O robô espera pouco: se a API demorar, é melhor o card institucional
       do que nenhum card. */
    const controle = new AbortController();
    const prazo = setTimeout(() => controle.abort(), 2500);
    const resposta = await fetch(`${API_URL}/evento/${id}`, { signal: controle.signal });
    clearTimeout(prazo);
    if (!resposta.ok) return null;
    return await resposta.json();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const slug = String(req.query?.slug ?? "");
  const urlCanonica = `${SITE_URL}/eventos/${slug}`;

  if (!ehRoboDePrevia(req.headers?.["user-agent"])) {
    res.setHeader("Location", urlCanonica);
    res.status(302).end();
    return;
  }

  const evento = await buscarEvento(idDoSlug(slug));

  const html = montarHtmlOpenGraph({
    evento,
    urlCanonica,
    apiUrl: API_URL,
    imagemPadrao: IMAGEM_PADRAO,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  /* O card pode ser servido de cache: o robô costuma pedir várias vezes, e o
     evento muda pouco. `stale-while-revalidate` evita que uma edição demore a
     aparecer sem deixar o robô esperando. */
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  res.status(200).send(html);
}
