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
 * Inscricao de um participante num evento (resposta de formulario).
 * @typedef {Object} InscricaoParticipante
 * @property {number} evento_id
 * @property {number} participante_id
 * @property {string} nome
 * @property {string} email
 * @property {string} resposta_id
 * @property {string} link_resposta
 */

/**
 * GET /formulario/eventos/{evento_id}/inscricoes (setor Inscrições)
 * @param {number} eventoId
 * @returns {Promise<Inscricao[]>}
 */
export async function listarInscricoes(eventoId) {
  const { data } = await api.get(`/formulario/eventos/${eventoId}/inscricoes`);
  return data;
}

/**
 * GET /formulario/eventos/{evento_id}/participantes (setor Inscrições)
 *
 * Inscritos no fluxo de participantes (US09), separado do de voluntariado
 * logo acima. Sem status: a aprovação existe só no voluntariado.
 *
 * @param {number} eventoId
 * @returns {Promise<InscricaoParticipante[]>}
 */
export async function listarInscricoesParticipantes(eventoId) {
  const { data } = await api.get(`/formulario/eventos/${eventoId}/participantes`);
  return data;
}
