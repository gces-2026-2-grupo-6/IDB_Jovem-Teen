/* Datas de evento — módulo puro, sem dependência de API ou de assets, para que
   a regra de data possa ser testada isoladamente. Todas as funções trabalham
   sobre o "relógio de parede" da string recebida: `new Date("2026-07-10")` seria
   interpretado como UTC e deslocaria o dia em UTC-3, então a string é lida por
   expressão regular e os componentes são usados como vieram.

   Um evento tem duas formas possíveis de ocupar o calendário:

   · **período contínuo** — descrito por `date` e `endDate`, como um acampamento
     de 10 a 12 de julho. É o formato original e segue sendo o padrão.
   · **dias específicos** — descrito por `days`, uma lista de "YYYY-MM-DD", como
     três sábados seguidos. Usado quando os dias têm intervalos entre si.

   `date` e `endDate` continuam preenchidos nas duas formas, apontando para o
   primeiro e o último dia, para que quem não conhece `days` — integração com
   Google Calendar, ordenação, classificação de passado/futuro — siga
   funcionando. Quem precisa dos dias exatos chama `eventDayKeys`. */

const pad = (n) => String(n).padStart(2, "0");

function parseWallClock(value) {
  if (!value) return null;
  const m = String(value).match(
    /(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/
  );
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: m[4] ? Number(m[4]) : 0,
    minute: m[5] ? Number(m[5]) : 0,
  };
}

export function formatDate(isoDate) {
  const p = parseWallClock(isoDate);
  if (!p) return "";
  return `${pad(p.day)}/${pad(p.month)}/${p.year}`;
}

/* Data única para eventos de um dia; intervalo "início - fim" para eventos de vários dias. */
export function formatDateRange(start, end) {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e && e !== s) return `${s} - ${e}`;
  return s || e || "";
}

/* Chave numérica YYYYMMDDHHmm para comparar e ordenar datas sem passar por
   `new Date`, que interpretaria uma data sem hora como UTC e deslocaria o dia. */
export function dateSortKey(isoDate) {
  const p = parseWallClock(isoDate);
  if (!p) return 0;
  return p.year * 1e8 + p.month * 1e6 + p.day * 1e4 + p.hour * 100 + p.minute;
}

/* Normaliza a lista de dias específicos de um evento: aceita string
   ("2026-07-05" ou "2026-07-05T08:00"), ou objeto com `data`/`dia`/`date`, e
   devolve chaves "YYYY-MM-DD" únicas e ordenadas. A tolerância de formato é
   deliberada: o campo vem da API e o formato exato pode mudar. */
export function normalizeEventDays(days) {
  if (!Array.isArray(days)) return [];
  const chaves = days
    .map((item) => {
      const bruto =
        item && typeof item === "object" ? item.data ?? item.dia ?? item.date : item;
      return splitDateTime(bruto).day;
    })
    .filter(Boolean);
  return [...new Set(chaves)].sort();
}

/* Verdadeiro quando o evento cobre mais de um dia de calendário. */
export function isMultiDay(event) {
  const dias = normalizeEventDays(event?.days);
  if (dias.length > 0) return dias.length > 1;

  const inicio = splitDateTime(event?.date).day;
  const fim = splitDateTime(event?.endDate).day;
  return Boolean(inicio && fim && fim !== inicio);
}

/* Verdadeiro quando o evento tem dias específicos com intervalo entre eles —
   três sábados seguidos, por exemplo. Uma lista de dias corridos descreve um
   período contínuo e não conta como não consecutiva. */
export function isNonConsecutive(event) {
  const dias = normalizeEventDays(event?.days);
  if (dias.length < 2) return false;

  const contiguos = eventDayKeys({ date: dias[0], endDate: dias[dias.length - 1] });
  return contiguos.length !== dias.length;
}

/* Todos os dias em que o evento acontece, como chaves "YYYY-MM-DD".

   Quando o evento traz dias específicos, são eles — e só eles. Sem lista, o
   resultado é o período contínuo do primeiro ao último dia. O limite de 366
   iterações protege a interface de um intervalo inconsistente vindo da API. */
export function eventDayKeys(event) {
  const especificos = normalizeEventDays(event?.days);
  if (especificos.length > 0) return especificos;

  const inicio = parseWallClock(event?.date);
  if (!inicio) return [];
  const fim = parseWallClock(event?.endDate) || inicio;

  const chave = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const cursor = new Date(inicio.year, inicio.month - 1, inicio.day);
  const ultimo = new Date(fim.year, fim.month - 1, fim.day);
  if (ultimo < cursor) return [chave(cursor)];

  const dias = [];
  for (let i = 0; cursor <= ultimo && i < 366; i++) {
    dias.push(chave(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

/* Verdadeiro se o evento cobre o mês informado (monthIndex de 0 a 11), inclusive
   quando começa num mês e termina no seguinte. */
export function occursInMonth(event, monthIndex, year) {
  const especificos = normalizeEventDays(event?.days);
  if (especificos.length > 0) {
    const prefixo = `${year}-${pad(monthIndex + 1)}-`;
    return especificos.some((dia) => dia.startsWith(prefixo));
  }

  const inicio = parseWallClock(event?.date);
  if (!inicio) return false;
  const fim = parseWallClock(event?.endDate) || inicio;

  const alvo = year * 12 + monthIndex;
  const de = inicio.year * 12 + (inicio.month - 1);
  const ate = fim.year * 12 + (fim.month - 1);
  return alvo >= Math.min(de, ate) && alvo <= Math.max(de, ate);
}

/* Texto das datas do evento, pronto para exibição.

   Período contínuo vira "10/07/2026 - 12/07/2026"; dias específicos viram
   "05, 12 e 19/07/2026", comprimindo mês e ano quando são os mesmos em todos os
   dias. A faixa com hífen seria simplesmente falsa para dias avulsos, porque
   afirma que tudo entre as pontas faz parte do evento. */
export function formatEventDates(event) {
  if (!isNonConsecutive(event)) {
    return formatDateRange(event?.date, event?.endDate);
  }

  const dias = normalizeEventDays(event?.days);
  const partes = dias.map(parseWallClock).filter(Boolean);
  const mesmoMesEAno = partes.every(
    (p) => p.month === partes[0].month && p.year === partes[0].year
  );

  const rotulos = mesmoMesEAno
    ? partes.map((p, i) =>
        i === partes.length - 1
          ? `${pad(p.day)}/${pad(p.month)}/${p.year}`
          : pad(p.day)
      )
    : partes.map((p) => `${pad(p.day)}/${pad(p.month)}/${p.year}`);

  if (rotulos.length === 1) return rotulos[0];
  return `${rotulos.slice(0, -1).join(", ")} e ${rotulos[rotulos.length - 1]}`;
}

/* Rótulo de horário do evento. Em evento de um dia "08:00 - 22:00" se explica
   sozinho; quando o evento cruza dias o intervalo solto fica ambíguo, então os
   dois horários passam a ser nomeados. */
export function formatEventTimeLabel(event) {
  const inicio = formatTime(event?.date);
  const fim = formatTime(event?.endDate);
  if (!inicio && !fim) return "";
  if (!isMultiDay(event)) return formatTimeRange(event?.date, event?.endDate);
  /* Em dias específicos o mesmo horário vale para cada dia, então o intervalo
     curto volta a ser correto — basta dizer que ele se repete. */
  if (isNonConsecutive(event) && inicio && fim) {
    return `${inicio} - ${fim} em cada dia`;
  }
  if (inicio && fim) return `Início ${inicio} · Término ${fim}`;
  return inicio || fim;
}

export function extractDayMonth(isoDate) {
  const p = parseWallClock(isoDate);
  if (!p) return { day: "--", month: "---" };
  const d = new Date(p.year, p.month - 1, p.day);
  const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return { day: pad(p.day), month: month.charAt(0).toUpperCase() + month.slice(1) };
}

export function formatTime(isoDate) {
  const p = parseWallClock(isoDate);
  if (!p) return "";
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatTimeRange(start, end) {
  const s = formatTime(start);
  const e = formatTime(end);
  if (s && e) return `${s} - ${e}`;
  return s || e || "";
}

export function toInputDateTime(isoDate) {
  const p = parseWallClock(isoDate);
  if (!p) return "";
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function splitDateTime(isoDate) {
  const p = parseWallClock(isoDate);
  if (!p) return { day: "", time: "" };
  return {
    day: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

export function isFutureEvent(isoDate) {
  const p = parseWallClock(isoDate);
  if (!p) return false;
  const eventDate = new Date(p.year, p.month - 1, p.day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate >= today;
}

/* Classifica o evento em relação ao dia de hoje:
   "upcoming" ainda não começou | "ongoing" começou e não terminou | "past" já terminou. */
export function getEventStatus(event) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = parseWallClock(event?.date);
  const end = parseWallClock(event?.endDate || event?.date);
  const startDate = start ? new Date(start.year, start.month - 1, start.day) : null;
  const endDate = end ? new Date(end.year, end.month - 1, end.day) : null;
  if (endDate && endDate < today) return "past";
  if (startDate && startDate > today) return "upcoming";
  return "ongoing";
}

export function isOngoingOrFuture(event) {
  const p = parseWallClock(event?.endDate || event?.date);
  if (!p) return false;
  const endDate = new Date(p.year, p.month - 1, p.day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return endDate >= today;
}
