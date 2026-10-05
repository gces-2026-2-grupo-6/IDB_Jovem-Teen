import { api } from "../api";

/**
 * Inscricao de um voluntario num evento (resposta de formulario).
 * @typedef {Object} Inscricao
 * @property {number} evento_id
 * @property {number} voluntario_id
 * @property {string} nome
 * @property {string} email
 * @property {string} status
 * @property {string} resposta_id
 * @property {string} link_resposta
 */

/**
 * GET /formulario/eventos/{evento_id}/inscricoes (publico)
 * @param {number} eventoId
 * @returns {Promise<Inscricao[]>}
 */
export async function listarInscricoes(eventoId) {
  const { data } = await api.get(`/formulario/eventos/${eventoId}/inscricoes`);
  return data;
}

/**
 * GET /formulario/eventos/{evento_id}/inscricoes-participantes (publico)
 *
 * Fluxo de participantes da US09. CONTRATO ASSUMIDO: o back-end hoje expõe
 * apenas a listagem do fluxo de voluntariado (`/inscricoes`, acima), amarrada
 * à tabela `trabalha`. Enquanto este caminho não existir, a chamada responde
 * 404 e `fetchParticipantesByEvent` a traduz em "listagem indisponível", em
 * vez de erro — ver src/services/inscricaoService.js.
 *
 * @param {number} eventoId
 * @returns {Promise<Inscricao[]>}
 */
export async function listarInscricoesParticipantes(eventoId) {
  const { data } = await api.get(
    `/formulario/eventos/${eventoId}/inscricoes-participantes`
  );
  return data;
}
