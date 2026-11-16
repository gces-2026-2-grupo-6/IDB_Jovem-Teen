import { api } from "./api";
import idbJovemOne from "../assets/images/idbJovemOne.png";
import { toBackendImageUrl } from "../utils/driveImage";
import {
  normalizarFuncao,
  normalizarRedes,
  validarConvidado,
} from "../utils/convidados";
import { podeExcluirAgora, ERRO_SEM_PERMISSAO_PARA_EXCLUIR } from "./auth/permissaoAtual";
import { fetchAllEvents, dateSortKey } from "./eventService";

/* Re-exportado para as telas importarem convidado de um lugar só. */
export {
  FUNCAO,
  FUNCOES,
  ROTULO_PLURAL,
  agruparPorFuncao,
  filtrarConvidados,
  normalizarFuncao,
  normalizarRedes,
  comProtocolo,
  LIMITE_MINI_BIO,
} from "../utils/convidados";

const DEFAULT_SPEAKER_IMAGE = idbJovemOne;

function adaptSpeaker(apiSpeaker) {
  if (!apiSpeaker) return null;
  return {
    id: apiSpeaker.participante_id,
    name: apiSpeaker.nome,
    photoLink: apiSpeaker.link_foto || "",
    image: apiSpeaker.link_foto ? toBackendImageUrl(apiSpeaker.link_foto) : DEFAULT_SPEAKER_IMAGE,
    /* `role` é o texto como foi gravado, para exibir sem descaracterizar o
       cadastro antigo; `funcao` é a classificação derivada, usada para agrupar. */
    role: apiSpeaker.profissao || "",
    funcao: normalizarFuncao(apiSpeaker.profissao),
    /* Campos que a API ainda não guarda. O nome deles está isolado aqui: se o
       back-end fechar com outro nome, só estas duas linhas mudam. */
    miniBio: apiSpeaker.mini_bio || "",
    redes: normalizarRedes(apiSpeaker.redes_sociais),
  };
}

function toApiSpeaker(form) {
  const redes = normalizarRedes(form.redes);
  return {
    nome: form.name ?? form.nome,
    link_foto: form.image || null,
    profissao: form.role || form.funcao || null,
    /* Enviados mesmo sem coluna correspondente: os schemas da API não usam
       extra="forbid", então o campo desconhecido é ignorado em vez de recusado.
       Nada quebra enquanto o back-end não os persistir. */
    mini_bio: form.miniBio?.trim() || null,
    redes_sociais: redes.length > 0 ? redes : null,
  };
}

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    const msg = detail
      .map((d) => (typeof d === "string" ? d : d?.msg))
      .filter(Boolean)
      .join("; ");
    if (msg) return msg;
  }
  if (typeof detail === "string" && detail) return detail;
  if (detail && typeof detail === "object" && detail.msg) return detail.msg;
  return error?.message || fallback;
}

export async function fetchSpeakers() {
  const { data } = await api.get("/banda-palestrante/");
  return data.map(adaptSpeaker);
}

export async function fetchSpeakerById(participanteId) {
  const { data } = await api.get(`/banda-palestrante/${participanteId}`);
  return adaptSpeaker(data);
}

export async function fetchSpeakersByEvent(eventId) {
  const { data } = await api.get(`/evento/${eventId}/participantes`);
  const isBanda = (s) => (s.profissao || "") === "Banda";
  const ordenados = [...data].sort((a, b) => Number(isBanda(a)) - Number(isBanda(b)));
  return ordenados.map(adaptSpeaker);
}

/* Em quais eventos cada convidado já esteve (RF51).

   A API não tem rota de "eventos de um convidado": o vínculo só é legível
   pelo lado do evento, por `GET /evento/{id}/participantes`. A agregação
   acontece aqui, num lugar só, e serve tanto à contagem da listagem quanto ao
   histórico de cada um — antes ela morava dentro da tela de listagem e o
   resultado era descartado.

   É uma requisição por evento. Enquanto a agenda for pequena isso sai mais
   barato do que ficar sem o dado; se a quantidade de eventos crescer, a conta
   se inverte e o certo passa a ser uma rota no back-end.

   Devolve `{ [convidadoId]: Evento[] }`, com os eventos do mais recente para o
   mais antigo. Falha de um evento não derruba o conjunto: aquele evento
   simplesmente não contribui. */
export async function fetchParticipacoesPorConvidado() {
  const eventos = await fetchAllEvents().catch(() => []);

  const porEvento = await Promise.all(
    eventos.map((evento) =>
      fetchSpeakersByEvent(evento.id)
        .then((lista) => ({ evento, lista }))
        .catch(() => ({ evento, lista: [] }))
    )
  );

  const participacoes = {};
  for (const { evento, lista } of porEvento) {
    for (const convidado of lista) {
      participacoes[convidado.id] = participacoes[convidado.id] || [];
      participacoes[convidado.id].push(evento);
    }
  }

  for (const id of Object.keys(participacoes)) {
    participacoes[id].sort((a, b) => dateSortKey(b.date) - dateSortKey(a.date));
  }

  return participacoes;
}

export async function handleCreateSpeaker(form) {
  const erro = validarConvidado({ ...form, nome: form.name ?? form.nome });
  if (erro) {
    return { success: false, error: erro };
  }
  try {
    const { data } = await api.post("/banda-palestrante/", toApiSpeaker(form));
    return { success: true, speaker: adaptSpeaker(data) };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao criar participante.") };
  }
}

export async function handleUpdateSpeaker(participanteId, form) {
  const erro = validarConvidado({ ...form, nome: form.name ?? form.nome });
  if (erro) {
    return { success: false, error: erro };
  }
  try {
    const { data } = await api.put(`/banda-palestrante/${participanteId}`, toApiSpeaker(form));
    return { success: true, speaker: adaptSpeaker(data) };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao atualizar participante.") };
  }
}

export async function handleDeleteSpeaker(participanteId) {
  /* Excluir conteúdo é restrito ao superadministrador (US03). */
  if (!podeExcluirAgora()) {
    return { success: false, error: ERRO_SEM_PERMISSAO_PARA_EXCLUIR };
  }
  try {
    await api.delete(`/banda-palestrante/${participanteId}`);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir participante.") };
  }
}
