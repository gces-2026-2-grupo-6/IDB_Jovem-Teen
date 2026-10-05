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
   inscrição de participante. O identificador aceita mais de um nome porque o
   contrato ainda não foi fechado com a equipe do back-end — ver abaixo. */
function toParticipante(api) {
  return {
    id: api.inscricao_id ?? api.participante_id ?? api.resposta_id ?? api.email,
    eventId: api.evento_id,
    name: api.nome,
    email: api.email,
    respostaId: api.resposta_id,
    linkResposta: api.link_resposta,
  };
}

/* O back-end ainda não expõe a listagem de participantes. Isso não é um erro
   da aplicação — é uma funcionalidade que falta do outro lado —, então a
   interface precisa distinguir os dois casos para não acusar falha de
   carregamento onde o que há é uma pendência de integração. */
export class ListagemIndisponivelError extends Error {
  constructor() {
    super("A listagem de participantes ainda não está disponível na API.");
    this.name = "ListagemIndisponivelError";
  }
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
 * Lança `ListagemIndisponivelError` quando a API responde 404, que é o que
 * acontece hoje: o caminho ainda não existe. Qualquer outra falha sobe como
 * erro normal, para não mascarar indisponibilidade real do servidor.
 *
 * @param {number|string} eventId
 * @returns {Promise<Array>}
 */
export async function fetchParticipantesByEvent(eventId) {
  try {
    const data = await listarInscricoesParticipantes(eventId);
    return (Array.isArray(data) ? data : []).map(toParticipante);
  } catch (err) {
    if (err?.response?.status === 404) {
      throw new ListagemIndisponivelError();
    }
    throw err;
  }
}
