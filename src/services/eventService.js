import { api } from "./api";
import defaultEventImage from "../assets/images/idbJovemOne.png";
import { toDriveImageUrl } from "../utils/driveImage";
import { podeExcluirAgora, ERRO_SEM_PERMISSAO_PARA_EXCLUIR } from "./auth/permissaoAtual";

const DEFAULT_EVENT_IMAGE = defaultEventImage;

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeSlug(id, nome) {
  return `${id}-${slugify(nome)}`;
}

export function parseEventId(slugOrId) {
  const match = String(slugOrId ?? "").match(/^\d+/);
  return match ? Number(match[0]) : null;
}

import {
  dateSortKey,
  normalizeEventDays,
  formatTime,
  formatTimeRange,
  extractDayMonth,
  getEventStatus,
  splitDateTime,
} from "../utils/eventDates";

/* Re-exportado para que as páginas sigam importando data de um lugar só. */
export {
  formatDate,
  formatEventDates,
  isNonConsecutive,
  normalizeEventDays,
  formatTime,
  formatTimeRange,
  formatDateRange,
  dateSortKey,
  isMultiDay,
  eventDayKeys,
  occursInMonth,
  formatEventTimeLabel,
  extractDayMonth,
  toInputDateTime,
  splitDateTime,
  isFutureEvent,
  getEventStatus,
  isOngoingOrFuture,
} from "../utils/eventDates";

export function buildGoogleCalendarUrl(event) {
  if (!event?.date) return null;
  const toGCal = (iso) => {
    const { day, time } = splitDateTime(iso);
    if (!day) return null;
    return `${day.replace(/-/g, "")}T${(time || "00:00").replace(":", "")}00`;
  };
  const start = toGCal(event.date);
  const end = toGCal(event.endDate || event.date) || start;
  if (!start) return null;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "Evento",
    dates: `${start}/${end}`,
    details: event.description || "",
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function toFormResponseUrl(url) {
  if (!url || typeof url !== "string") return url || "";
  let result = url.trim();
  if (!/docs\.google\.com\/forms\//i.test(result)) return result;
  result = result.replace(/#.*$/, "");
  result = result.replace(/\/edit(?=$|\?)/i, "/viewform");
  return result;
}

function adaptEvent(apiEvent) {
  if (!apiEvent) return null;
  return {
    id: apiEvent.evento_id,
    title: apiEvent.nome,
    slug: makeSlug(apiEvent.evento_id, apiEvent.nome),
    description: apiEvent.descricao || "",
    date: apiEvent.data_inicio,
    endDate: apiEvent.data_fim,
    /* Dias específicos, quando o evento não é um período contínuo. Lista vazia
       significa "usar data_inicio..data_fim". O nome do campo na API está
       isolado aqui: se o back-end fechar com outro nome, só esta linha muda. */
    days: normalizeEventDays(apiEvent.datas),
    time: formatTimeRange(apiEvent.data_inicio, apiEvent.data_fim),
    location: apiEvent.nome_local || "",
    latitude: apiEvent.local_latitude,
    longitude: apiEvent.local_longitude,
    linkGaleria: apiEvent.link_galeria || "",
    linkFormularioVoluntarios: apiEvent.formulario_link || "",
    calendarioEventoId: apiEvent.calendario_evento_id || null,
    tipoEvento: apiEvent.tipo_evento || "",
    linkImagem: apiEvent.link_imagem || "",
    image: toDriveImageUrl(apiEvent.link_imagem) || DEFAULT_EVENT_IMAGE,
    category: apiEvent.tipo_evento || "Outros",
    featured: false,
    totalParticipantes: 0,
    totalVoluntarios: 0,
    speakers: [],
    schedule: [],
    galeria: [],
    palestrantes: [],
    bandas: [],
  };
}

function toApiEvent(form) {
  const toIso = (v) => (v ? `${v}:00`.slice(0, 19) : null);
  const dias = normalizeEventDays(form.days);
  return {
    nome: form.title,
    tipo_evento: form.tipoEvento || null,
    descricao: form.description || null,
    local_latitude: Number(form.latitude),
    local_longitude: Number(form.longitude),
    data_inicio: toIso(form.date),
    data_fim: toIso(form.endDate),
    /* `datas` só vai preenchido quando o evento tem dias específicos. Um
       back-end que ainda não conheça o campo o ignora, e o evento continua
       sendo lido como o período contínuo de data_inicio a data_fim. */
    datas: dias.length > 0 ? dias : null,
    link_galeria: form.linkGaleria || null,
    formulario_link: form.linkFormularioVoluntarios || null,
    link_imagem: (form.image && form.image.trim()) || null,
  };
}

function adaptActivity(apiAct) {
  const { day, month } = extractDayMonth(apiAct.horario_inicio);
  return {
    id: apiAct.atividade_id,
    eventId: apiAct.evento_id,
    name: apiAct.nome,
    activity: apiAct.nome,
    description: apiAct.descricao || "",
    start: apiAct.horario_inicio,
    end: apiAct.horario_termino,
    time: formatTime(apiAct.horario_inicio),
    startTime: formatTime(apiAct.horario_inicio),
    endTime: formatTime(apiAct.horario_termino),
    day,
    month,
  };
}

function toApiActivity(form, eventDate) {
  const fallback = (eventDate ? String(eventDate) : new Date().toISOString()).slice(0, 10);
  const dia = (form.day ? String(form.day) : fallback).slice(0, 10);
  const combinar = (hora) => (hora ? `${dia}T${hora}:00` : null);
  return {
    nome: form.name,
    descricao: form.description || null,
    horario_inicio: combinar(form.start || form.time),
    horario_termino: combinar(form.end || form.start || form.time),
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

export async function fetchAllEvents() {
  const { data } = await api.get("/evento/");
  return data.map(adaptEvent);
}

export async function searchEvents(termo) {
  const { data } = await api.get("/evento/buscar", { params: { termo } });
  return data.map(adaptEvent);
}

export async function fetchEventById(slugOrId) {
  const id = parseEventId(slugOrId);
  if (!id) return null;
  const { data } = await api.get(`/evento/${id}`);
  const event = adaptEvent(data);
  try {
    const { data: partData } = await api.get(`/evento/${id}/participantes`);
    if (partData && partData.length > 0) {
      const palestrantes = partData.filter(p => p.profissao !== "Banda");
      const bandas = partData.filter(p => p.profissao === "Banda");
      event.palestrantes = palestrantes.map((p) => ({
        name: p.nome,
        image: p.link_foto || "",
      }));
      event.bandas = bandas.map((p) => ({
        name: p.nome,
        image: p.link_foto || "",
      }));
    }
  } catch {
    // ignorar falha ao buscar participantes
  }
  return event;
}

export async function getGroupedEvents() {
  const all = await fetchAllEvents();
  const proximos = [];
  const emAndamento = [];
  const anteriores = [];
  for (const e of all) {
    const status = getEventStatus(e);
    if (status === "upcoming") proximos.push(e);
    else if (status === "ongoing") emAndamento.push(e);
    else anteriores.push(e);
  }
  return { proximos, emAndamento, anteriores };
}

export const TIPOS_EVENTO = ["Conferência", "Acampamento", "Campanha Nacional", "Outros"];

/* Vínculo avulso, para a tela de detalhe do evento, onde cada ação vale na
   hora — diferente do formulário, que sincroniza tudo ao salvar. */
export async function vincularConvidado(eventId, participanteId) {
  const id = parseEventId(eventId);
  try {
    await api.post(`/evento/${id}/participantes/${participanteId}`);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao vincular convidado.") };
  }
}

export async function desvincularConvidado(eventId, participanteId) {
  const id = parseEventId(eventId);
  try {
    await api.delete(`/evento/${id}/participantes/${participanteId}`);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao remover convidado.") };
  }
}

/* Sincroniza os convidados do evento a partir dos ids escolhidos.

   A versão anterior recebia nomes digitados e casava convidado por string em
   minúsculas. Isso quebrava de dois jeitos: dois convidados de mesmo nome
   viravam um só, e corrigir a grafia de um nome criava um convidado novo em vez
   de atualizar o existente — exatamente o recadastro que a história quer
   eliminar. Agora o vínculo é por id, então nada depende de como o nome foi
   escrito. */
async function syncEventSpeakers(eventId, convidadosIds) {
  if (!Array.isArray(convidadosIds)) return;

  try {
    const desejados = [...new Set(convidadosIds.filter((id) => id != null))];

    const { data: vinculados } = await api.get(`/evento/${eventId}/participantes`);
    const atuais = vinculados.map((p) => p.participante_id);

    const remover = atuais.filter((id) => !desejados.includes(id));
    const adicionar = desejados.filter((id) => !atuais.includes(id));

    await Promise.all([
      ...remover.map((id) =>
        api.delete(`/evento/${eventId}/participantes/${id}`).catch(() => {})
      ),
      ...adicionar.map((id) =>
        api.post(`/evento/${eventId}/participantes/${id}`).catch(() => {})
      ),
    ]);
  } catch (err) {
    console.error("Erro ao sincronizar convidados:", err);
  }
}

/* Validações de data comuns à criação e à edição. Devolve a mensagem de erro
   ou null quando está tudo certo. */
function validateEventDates(data) {
  const dias = normalizeEventDays(data.days);

  if (dias.length > 0 && (!data.date || !data.endDate)) {
    return "Informe o horário de início e de término dos dias selecionados.";
  }
  if (dias.length === 0 && (!data.date || !data.endDate)) {
    return "Datas de início e término são obrigatórias.";
  }

  /* O término tem de ser estritamente depois do início — a API recusa os dois
     iguais ("o valor final deve ser maior que o valor inicial"), e o formulário
     de atividades já adota a mesma regra. Validar aqui evita uma ida ao
     servidor para receber a recusa. Em dias avulsos a comparação continua
     valendo, porque início e término derivam do primeiro e do último dia. */
  if (dateSortKey(data.endDate) <= dateSortKey(data.date)) {
    return "O término do evento deve ser depois do início.";
  }
  return null;
}

export async function handleCreateEvent(data) {
  if (!data.title || !data.title.trim()) {
    return { success: false, error: "Nome do evento é obrigatório." };
  }
  if (!TIPOS_EVENTO.includes(data.tipoEvento)) {
    return { success: false, error: "Selecione o tipo de evento." };
  }
  const erroDeData = validateEventDates(data);
  if (erroDeData) {
    return { success: false, error: erroDeData };
  }
  if (data.latitude === "" || data.longitude === "" || data.latitude == null || data.longitude == null) {
    return { success: false, error: "Latitude e longitude são obrigatórias." };
  }
  try {
    const { data: created } = await api.post("/evento/", toApiEvent(data));
    const newEvent = adaptEvent(created);
    await syncEventSpeakers(newEvent.id, data.convidadosIds);
    return { success: true, event: newEvent };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao criar evento.") };
  }
}

export async function handleUpdateEvent(slugOrId, data) {
  if (!data.title || !data.title.trim()) {
    return { success: false, error: "Nome do evento é obrigatório." };
  }
  if (!TIPOS_EVENTO.includes(data.tipoEvento)) {
    return { success: false, error: "Selecione o tipo de evento." };
  }
  const erroDeData = validateEventDates(data);
  if (erroDeData) {
    return { success: false, error: erroDeData };
  }
  const id = parseEventId(slugOrId);
  try {
    const { data: updated } = await api.put(`/evento/${id}`, toApiEvent(data));
    const updEvent = adaptEvent(updated);
    await syncEventSpeakers(id, data.convidadosIds);
    return { success: true, event: updEvent };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao atualizar evento.") };
  }
}

export async function handleDeleteEvent(slugOrId) {
  if (!podeExcluirAgora()) {
    return { success: false, error: ERRO_SEM_PERMISSAO_PARA_EXCLUIR };
  }
  const id = parseEventId(slugOrId);
  try {
    await api.delete(`/evento/${id}`);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir evento.") };
  }
}

export async function fetchActivities(eventId) {
  const id = parseEventId(eventId);
  const { data } = await api.get(`/evento/${id}/atividade`);
  return data.map(adaptActivity);
}

export async function fetchEventGallery(eventId) {
  const id = parseEventId(eventId);
  if (!id) return [];
  try {
    const { data } = await api.get(`/evento/${id}/galeria`);
    return data.map((foto) => ({
      id: foto.id,
      nome: foto.nome,
      url: foto.url_visualizacao,
    }));
  } catch {
    return [];
  }
}

export async function fetchAggregatedGallery() {
  const events = await fetchAllEvents();
  const comGaleria = events.filter((e) => e.linkGaleria);
  const grupos = await Promise.all(
    comGaleria.map(async (ev) => {
      const fotos = await fetchEventGallery(ev.id);
      return fotos.map((foto) => ({
        id: foto.id,
        image: foto.url,
        event: ev.title,
        location: ev.location || "",
      }));
    })
  );
  return grupos.flat();
}

export async function handleCreateActivity(eventId, data, eventDate) {
  const id = parseEventId(eventId);
  if (!data.name || !data.name.trim()) {
    return { success: false, error: "Nome da atividade é obrigatório." };
  }
  try {
    const { data: created } = await api.post(
      `/evento/${id}/atividade`,
      toApiActivity(data, eventDate)
    );
    return { success: true, data: adaptActivity(created) };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao criar atividade.") };
  }
}

export async function handleUpdateActivity(activityId, data, eventDate) {
  try {
    const { data: updated } = await api.put(
      `/evento/atividade/${activityId}`,
      toApiActivity(data, eventDate)
    );
    return { success: true, data: adaptActivity(updated) };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao atualizar atividade.") };
  }
}

export async function handleDeleteActivity(activityId) {
  if (!podeExcluirAgora()) {
    return { success: false, error: ERRO_SEM_PERMISSAO_PARA_EXCLUIR };
  }
  try {
    await api.delete(`/evento/atividade/${activityId}`);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir atividade.") };
  }
}
