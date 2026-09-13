import { TOKEN_KEY } from "../api";
import { lerPapeisDoToken, podeExcluir } from "../../utils/permissoes";

/* Permissão do usuário da sessão atual, para uso nos serviços.

   As telas consultam `usePermissao`; os serviços não têm acesso ao contexto do
   React e precisam ler o token direto. Isto existe para que esconder um botão
   não seja a única barreira: mesmo que a interface ofereça a ação por engano,
   o serviço recusa antes de chamar a API.

   Isto não substitui o controle do servidor, que é o que de fato protege. */
export function papeisAtuais() {
  try {
    return lerPapeisDoToken(localStorage.getItem(TOKEN_KEY));
  } catch {
    return [];
  }
}

export function podeExcluirAgora() {
  return podeExcluir(papeisAtuais());
}

export const ERRO_SEM_PERMISSAO_PARA_EXCLUIR =
  "Apenas a superadministradora pode excluir conteúdo.";
