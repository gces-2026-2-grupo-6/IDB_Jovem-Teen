import {
  listarInscricoes,
  listarInscricoesParticipantes,
} from "./api/formularioApi";

/* Inscrições de um evento.

   A US09 separou o que antes era um fluxo só: um evento tem agora duas
   inscrições distintas, cada uma com o seu link e a sua listagem.

   · participantes — quem vai ao evento. Não passa por aprovação.
   · voluntários   — quem vai trabalhar no evento. Mantém o ciclo
                     pendente/aprovado/reprovado que já existia.

   Os dois adaptadores vivem aqui porque é aqui que o nome dos campos da API
   fica isolado do resto do front. */

function toInscricao(api) {
  return {
    id: api.voluntario_id,
    eventId: api.evento_id,
    name: api.nome,
    email: api.email,
    status: api.status,
    respostaId: api.resposta_id,
    linkResposta: api.link_resposta,
  };
}

/* O participante não tem status: diferente do voluntário, ninguém aprova uma
   inscrição de participante — é o que separa os dois schemas na API. */
function toParticipante(api) {
  return {
    id: api.participante_id,
    eventId: api.evento_id,
    name: api.nome,
    email: api.email,
    respostaId: api.resposta_id,
    linkResposta: api.link_resposta,
  };
}

/**
 * Inscrições do fluxo de voluntariado.
 * @param {number|string} eventId
 * @returns {Promise<Array>}
 */
export async function fetchInscricoesByEvent(eventId) {
  const data = await listarInscricoes(eventId);
  return data.map(toInscricao);
}

/**
 * Inscrições do fluxo de participantes.
 *
 * As duas listagens exigem o setor Inscrições e respondem 404 quando o evento
 * não existe, então nenhuma falha recebe tratamento especial aqui: quem chama
 * mostra o erro, como já faz com o voluntariado.
 *
 * @param {number|string} eventId
 * @returns {Promise<Array>}
 */
export async function fetchParticipantesByEvent(eventId) {
  const data = await listarInscricoesParticipantes(eventId);
  return (Array.isArray(data) ? data : []).map(toParticipante);
}
