import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAllEvents,
  splitDateTime,
  eventDayKeys,
  isNonConsecutive,
} from "../../../../services/eventService";

const WEEK_DAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const pad = (n) => String(n).padStart(2, "0");

/* Paleta de cores estável: cada evento sempre cai na mesma cor (pelo id). */
const EVENT_COLORS = [
  "bg-blue-200/70 text-blue-900",
  "bg-green-200/70 text-green-900",
  "bg-purple-200/70 text-purple-900",
  "bg-amber-200/70 text-amber-900",
  "bg-pink-200/70 text-pink-900",
];

function colorForEvent(id) {
  return EVENT_COLORS[Math.abs(Number(id) || 0) % EVENT_COLORS.length];
}

function inicioDaSemana(data) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/* Quantas semanas de diferença existem entre a semana atual e a primeira
   semana do mês/ano escolhidos. Quando o usuário escolhe o mês/ano correntes,
   volta direto para a semana de hoje (offset 0). */
function semanasAte(ano, mes) {
  const hoje = new Date();
  if (ano === hoje.getFullYear() && mes === hoje.getMonth()) {
    return 0;
  }
  const domingoAtual = inicioDaSemana(hoje);
  const domingoAlvo = inicioDaSemana(new Date(ano, mes, 1));
  const msPorSemana = 7 * 24 * 60 * 60 * 1000;
  return Math.round((domingoAlvo - domingoAtual) / msPorSemana);
}

/* Dias de uma semana (DOM → SÁB) com a chave "YYYY-MM-DD" para casar com os
   eventos. `offsetSemanas` desloca a semana exibida: 0 é a atual, -1 a
   anterior, +1 a seguinte. */
function generateCalendarDays(offsetSemanas = 0) {
  const today = new Date();
  const startDate = inicioDaSemana(today);
  startDate.setDate(startDate.getDate() + offsetSemanas * 7);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push({
      day: d.getDate(),
      key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      isToday: d.toDateString() === today.toDateString(),
    });
  }
  return days;
}

/* A grade cobre o dia inteiro, 0h às 23h.

   Antes ela ia das 8h às 17h, e um evento fora dessa faixa simplesmente não
   era desenhado: o segmento recebia startHour 20, o laço só percorria 8 a 17,
   nenhuma linha casava e nada aparecia — sem erro, sem aviso. Para um
   ministério de jovens isso escondia quase tudo, porque culto, ensaio e
   reunião são à noite. Encontrado com a cliente em 23/11/2026, num evento das
   20h às 21h que não aparecia no painel.

   Qualquer faixa menor que o dia inteiro só adia o mesmo defeito para o
   próximo horário de fora. A altura é resolvida com rolagem, não encurtando a
   grade. */
const PRIMEIRA_HORA = 0;
const ULTIMA_HORA = 23;

/* Hora para onde a grade rola sozinha quando a semana não tem evento. */
const HORA_DE_REFERENCIA = 8;

function horaDe(texto, padrao) {
  const h = Number(String(texto ?? "").slice(0, 2));
  return Number.isFinite(h) ? Math.min(Math.max(h, PRIMEIRA_HORA), ULTIMA_HORA) : padrao;
}

/* Última linha ocupada por quem termina em `texto`. Terminar às HH:00 não
   ocupa a linha HH inteira. */
function ultimaHoraDe(texto, inicio) {
  const [h, m] = String(texto ?? "")
    .split(":")
    .map(Number);
  if (!Number.isFinite(h)) return inicio;
  const fim = m > 0 ? h : h - 1;
  return Math.min(Math.max(fim, inicio), ULTIMA_HORA);
}

/* Converte um evento nos segmentos que ele ocupa na grade: um por dia coberto
   que caia na semana exibida. Devolve lista vazia se nenhum dia cair nela.

   Em "dias avulsos" o horário informado vale para todos os dias — é o que a
   própria tela de cadastro promete. Antes, só o primeiro e o último dia
   usavam o horário do evento e os do meio ocupavam a coluna inteira, o que
   desenhava um evento de 20h às 21h como se tomasse o dia todo. */
function placeEvent(event, days) {
  const dias = eventDayKeys(event);
  if (dias.length === 0) return [];

  const inicio = horaDe(splitDateTime(event.date).time, PRIMEIRA_HORA);
  const fim = ultimaHoraDe(splitDateTime(event.endDate || event.date).time, inicio);

  const avulsos = isNonConsecutive(event);
  const segmentos = [];

  dias.forEach((key, i) => {
    const col = days.findIndex((d) => d.key === key);
    if (col === -1) return; // dia fora da semana exibida

    const isPrimeiro = i === 0;
    const isUltimo = i === dias.length - 1;

    let startHour;
    let lastHour;

    if (avulsos || (isPrimeiro && isUltimo)) {
      /* Dia solto, ou evento de um dia só: o horário do evento vale inteiro. */
      startHour = inicio;
      lastHour = fim;
    } else if (isPrimeiro) {
      /* Período contínuo: começa no horário e atravessa a virada do dia. */
      startHour = inicio;
      lastHour = ULTIMA_HORA;
    } else if (isUltimo) {
      startHour = PRIMEIRA_HORA;
      lastHour = fim;
    } else {
      /* Dia do meio de um período contínuo: o evento está em curso o dia todo. */
      startHour = PRIMEIRA_HORA;
      lastHour = ULTIMA_HORA;
    }

    segmentos.push({ col, startHour, lastHour, title: event.title, id: event.id });
  });

  return segmentos;
}

function capitalizarPrimeiraLetra(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
}

/* De que mês é a grade: "Novembro de 2026", ou "Nov – dez de 2026" quando a
   semana atravessa a virada do mês. Apenas a inicial é capitalizada para
   manter a preposição "de" em minúsculo. */
function rotuloDoPeriodo(days) {
  const primeiro = new Date(`${days[0].key}T12:00:00`);
  const ultimo = new Date(`${days[6].key}T12:00:00`);
  const mes = (d, formato) => d.toLocaleDateString("pt-BR", { month: formato });

  let rotulo;
  if (primeiro.getMonth() === ultimo.getMonth()) {
    rotulo = `${mes(primeiro, "long")} de ${primeiro.getFullYear()}`;
  } else if (primeiro.getFullYear() === ultimo.getFullYear()) {
    rotulo = `${mes(primeiro, "short")} – ${mes(ultimo, "short")} de ${ultimo.getFullYear()}`;
  } else {
    rotulo = `${mes(primeiro, "short")} ${primeiro.getFullYear()} – ${mes(ultimo, "short")} ${ultimo.getFullYear()}`;
  }
  return capitalizarPrimeiraLetra(rotulo);
}

/* Componente Calendário Mini */
export default function CalendarMini() {
  /* Semana exibida, em semanas a partir da atual. A grade era fixa na semana
     corrente: não havia como ver o evento do mês passado nem o do mês que vem,
     embora a lista "Eventos Anteriores" ao lado prometesse o passado. */
  const [offsetSemanas, setOffsetSemanas] = useState(0);
  const days = useMemo(() => generateCalendarDays(offsetSemanas), [offsetSemanas]);

  const dataReferencia = useMemo(
    () => (offsetSemanas === 0 ? new Date() : new Date(`${days[6].key}T12:00:00`)),
    [offsetSemanas, days],
  );
  const mesSelecionado = dataReferencia.getMonth();
  const anoSelecionado = dataReferencia.getFullYear();

  const hours = Array.from(
    { length: ULTIMA_HORA - PRIMEIRA_HORA + 1 },
    (_, i) => i + PRIMEIRA_HORA,
  );
  const [eventos, setEventos] = useState([]);
  const grade = useRef(null);

  const anosDisponiveis = useMemo(() => {
    const base = new Date().getFullYear();
    const anos = new Set([base - 2, base - 1, base, base + 1, base + 2, anoSelecionado]);
    for (const ev of eventos) {
      const y = Number(String(ev.date || "").slice(0, 4));
      if (Number.isFinite(y) && y > 1900) anos.add(y);
    }
    return Array.from(anos).sort((a, b) => a - b);
  }, [eventos, anoSelecionado]);

  /* Busca uma vez. A navegação entre semanas é recorte do que já está em
     memória — trocar de semana não deve ir à rede de novo. */
  useEffect(() => {
    let active = true;
    fetchAllEvents()
      .then((events) => active && setEventos(events))
      .catch(() => active && setEventos([]));
    return () => {
      active = false;
    };
  }, []);

  const placed = useMemo(
    () => eventos.flatMap((e) => placeEvent(e, days)),
    [eventos, days],
  );

  /* Com o dia inteiro na grade, a semana sem evento abriria na madrugada.
     Rola até o primeiro evento da semana, ou até a manhã quando não há nenhum. */
  const primeiroEvento = useMemo(() => {
    if (placed.length === 0) return HORA_DE_REFERENCIA;
    return Math.min(...placed.map((p) => p.startHour));
  }, [placed]);

  useEffect(() => {
    const caixa = grade.current;
    if (!caixa) return;
    const linha = caixa.querySelector(`[data-hora="${primeiroEvento}"]`);
    if (linha) caixa.scrollTop = linha.offsetTop;
  }, [primeiroEvento]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">📅</span>
        <h3 className="font-bold text-[#1E1E1E] text-lg">Calendário</h3>
      </div>

      {/* Mês da grade e navegação rápida por mês/ano ou semana */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-sm font-semibold text-[#1E1E1E]/70">
          {rotuloDoPeriodo(days)}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            aria-label="Selecionar mês"
            value={mesSelecionado}
            onChange={(e) =>
              setOffsetSemanas(semanasAte(anoSelecionado, Number(e.target.value)))
            }
            className="h-7 px-2 rounded-lg border border-gray-200 bg-gray-50/70 text-xs font-semibold text-[#1E1E1E]/80 hover:border-[#FF6D2C]/50 focus:outline-none focus:border-[#FF6D2C] transition-colors cursor-pointer"
          >
            {MESES.map((nome, idx) => (
              <option key={nome} value={idx}>
                {nome}
              </option>
            ))}
          </select>
          <select
            aria-label="Selecionar ano"
            value={anoSelecionado}
            onChange={(e) =>
              setOffsetSemanas(semanasAte(Number(e.target.value), mesSelecionado))
            }
            className="h-7 px-2 rounded-lg border border-gray-200 bg-gray-50/70 text-xs font-semibold text-[#1E1E1E]/80 hover:border-[#FF6D2C]/50 focus:outline-none focus:border-[#FF6D2C] transition-colors cursor-pointer"
          >
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Semana anterior"
              onClick={() => setOffsetSemanas((n) => n - 1)}
              className="w-7 h-7 rounded-full text-[#1E1E1E]/60 hover:bg-gray-100 hover:text-[#1E1E1E] transition-colors"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setOffsetSemanas(0)}
              disabled={offsetSemanas === 0}
              className="px-2 h-7 rounded-full text-xs font-semibold text-[#FF6D2C] hover:bg-[#FF6D2C]/10 disabled:text-[#1E1E1E]/25 disabled:hover:bg-transparent transition-colors"
            >
              Hoje
            </button>
            <button
              type="button"
              aria-label="Semana seguinte"
              onClick={() => setOffsetSemanas((n) => n + 1)}
              className="w-7 h-7 rounded-full text-[#1E1E1E]/60 hover:bg-gray-100 hover:text-[#1E1E1E] transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Cabeçalho da semana */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {WEEK_DAYS.map((day, i) => (
          <div key={day} className="text-center">
            <span className="text-[10px] font-semibold text-[#1E1E1E]/40 uppercase">{day}</span>
            <div
              className={`mt-1 w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold transition-all ${days[i].isToday
                ? "bg-[#FF6D2C] text-white shadow-md"
                : "text-[#1E1E1E]/70 hover:bg-gray-100"
                }`}
            >
              {days[i].day}
            </div>
          </div>
        ))}
      </div>

      {/* Grid de Horas — dia inteiro, com rolagem para não dominar o painel */}
      <div
        ref={grade}
        className="border-t border-gray-100 pt-2 space-y-0 max-h-[320px] overflow-y-auto"
      >
        {hours.map((hour) => (
          <div
            key={hour}
            data-hora={hour}
            className="flex items-stretch min-h-[28px] border-b border-gray-50"
          >
            <span className="text-[10px] text-[#1E1E1E]/30 w-10 shrink-0 pt-1">{pad(hour)}:00</span>
            <div className="flex-1 grid grid-cols-7 gap-0.5">
              {WEEK_DAYS.map((_, col) => {
                const ev = placed.find(
                  (p) => p.col === col && hour >= p.startHour && hour <= p.lastHour
                );
                if (!ev) return <div key={col} className="rounded-sm" />;
                const isStart = hour === ev.startHour;
                const isEnd = hour === ev.lastHour;
                return (
                  <div
                    key={col}
                    title={ev.title}
                    className={`px-1 overflow-hidden ${colorForEvent(ev.id)} ${isStart ? "rounded-t-sm" : ""} ${isEnd ? "rounded-b-sm" : ""}`}
                  >
                    {isStart && (
                      <span className="block text-[8px] font-semibold leading-[28px] truncate">
                        {ev.title}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
