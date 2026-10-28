import { api } from "./api";

/* US22 — Missão, visão e valores, editáveis pelo painel.

   Contrato esperado do back-end (a cargo do trio de back-end):

     GET /institucional            público
       -> { "missao": str | null, "visao": str | null, "valores": [str] }
     PUT /institucional            só superadmin
       <- o mesmo objeto; devolve o conteúdo salvo

   Enquanto a rota não existir, o site mostra apenas a missão que já está
   publicada no rodapé desde antes desta história — nada de texto inventado. */

export const MISSAO_PUBLICADA =
  "Inspirar e capacitar as novas gerações a viverem o propósito cristão com autenticidade, unindo fé, protagonismo e serviço para transformar a sociedade.";

/* Conteúdo exibido quando o back-end ainda não tem a rota (ou falhou). */
export const CONTEUDO_PADRAO = { missao: MISSAO_PUBLICADA, visao: "", valores: [] };

function limparTexto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function limparValores(valores) {
  if (!Array.isArray(valores)) return [];
  return valores.map(limparTexto).filter(Boolean);
}

export function adaptInstitucional(dados) {
  if (!dados || typeof dados !== "object") return null;
  return {
    missao: limparTexto(dados.missao),
    visao: limparTexto(dados.visao),
    valores: limparValores(dados.valores),
  };
}

export function toApiInstitucional(form) {
  return {
    missao: limparTexto(form.missao) || null,
    visao: limparTexto(form.visao) || null,
    valores: limparValores(form.valores),
  };
}

export function temConteudo(conteudo) {
  return Boolean(conteudo && (conteudo.missao || conteudo.visao || conteudo.valores.length > 0));
}

/* O rodapé aparece em todas as páginas: a leitura é feita uma vez por visita
   e reaproveitada, em vez de uma chamada a cada navegação. */
let leituraEmAndamento = null;

export function limparCacheInstitucional() {
  leituraEmAndamento = null;
}

/* Devolve o conteúdo salvo, ou `null` se a rota não existir ou falhar. */
export function fetchInstitucional() {
  if (!leituraEmAndamento) {
    leituraEmAndamento = api
      .get("/institucional")
      .then(({ data }) => adaptInstitucional(data))
      .catch(() => {
        leituraEmAndamento = null;
        return null;
      });
  }
  return leituraEmAndamento;
}

function mensagemDeErro(error) {
  const status = error?.response?.status;
  if (status === 403) return "Apenas a superadministradora pode alterar este conteúdo.";
  if (status === 404) return "O servidor ainda não oferece o cadastro deste conteúdo.";
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  return "Não foi possível salvar. Tente novamente.";
}

export async function salvarInstitucional(form) {
  const corpo = toApiInstitucional(form);
  if (!corpo.missao && !corpo.visao && corpo.valores.length === 0) {
    return { success: false, error: "Preencha ao menos a missão, a visão ou um valor." };
  }
  try {
    const { data } = await api.put("/institucional", corpo);
    const salvo = adaptInstitucional(data) || adaptInstitucional(corpo);
    leituraEmAndamento = Promise.resolve(salvo);
    return { success: true, data: salvo };
  } catch (error) {
    return { success: false, error: mensagemDeErro(error) };
  }
}
