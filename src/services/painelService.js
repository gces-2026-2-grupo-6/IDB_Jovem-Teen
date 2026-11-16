import { obterLinksPainel, atualizarLinksPainel } from "./api/painelApi";

/* Links fixados na página inicial do painel (US10).

   O cadastro dos mais de 2500 líderes acontece fora do site, num formulário
   externo cujas respostas caem numa planilha. O site não guarda esses dados:
   só fixa os dois endereços para a superadministradora divulgar um e consultar
   o outro. */

/* Campo vazio na API significa "ainda não configurado" — a tela mostra
   "Configurar" no lugar do link. */
function toLinks(api) {
  return {
    cadastro: api?.link_cadastro_lideres || "",
    planilha: api?.link_planilha_lideres || "",
  };
}

export const CAMPOS_DE_LINK = {
  cadastro: "link_cadastro_lideres",
  planilha: "link_planilha_lideres",
};

export async function fetchLinksPainel() {
  return toLinks(await obterLinksPainel());
}

/* Valida antes de enviar o que o servidor recusaria com 422. O campo vazio é
   válido de propósito: é assim que se remove um link fixado. */
export function validarLink(valor) {
  const link = String(valor ?? "").trim();
  if (!link) return null;
  if (!/^https?:\/\//i.test(link)) {
    return "O link deve começar com https:// ou http://.";
  }
  return null;
}

function resolveError(err, fallback) {
  const status = err?.response?.status;
  if (status === 403) {
    return "Apenas a superadministradora pode ver e alterar estes links.";
  }
  const detail = err?.response?.data?.detail;
  /* O 422 do FastAPI chega como lista de erros de campo; a mensagem útil mora
     em `msg`, depois de um prefixo "Value error, " que não interessa à tela. */
  if (Array.isArray(detail)) {
    const msg = detail
      .map((d) => (typeof d === "string" ? d : d?.msg))
      .filter(Boolean)
      .join("; ")
      .replace(/Value error,\s*/g, "");
    if (msg) return msg;
  }
  if (typeof detail === "string" && detail) return detail;
  return fallback;
}

/* Atualização parcial: envia só o campo editado, para que salvar um link não
   apague o outro. */
export async function handleSalvarLink(campo, valor) {
  const nomeNaApi = CAMPOS_DE_LINK[campo];
  if (!nomeNaApi) {
    return { success: false, error: "Link desconhecido." };
  }

  const invalido = validarLink(valor);
  if (invalido) {
    return { success: false, error: invalido };
  }

  try {
    const atualizados = await atualizarLinksPainel({ [nomeNaApi]: String(valor ?? "").trim() });
    return { success: true, links: toLinks(atualizados), error: null };
  } catch (err) {
    return { success: false, error: resolveError(err, "Não foi possível salvar o link.") };
  }
}
