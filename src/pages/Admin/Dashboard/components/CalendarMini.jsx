import { useEffect, useState } from "react";
import { fetchAllEvents, splitDateTime, eventDayKeys } from "../../../../services/eventService";

const WEEK_DAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

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

/* Dias da semana atual (DOM → SÁB) com a chave "YYYY-MM-DD" para casar com os eventos. */
function generateCalendarDays() {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - today.getDay());

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

/* Primeira e última linha da grade de horas exibida. */
const FIRST_HOUR = 8;
const LAST_HOUR = 17;

/* Converte um evento nos segmentos que ele ocupa na grade: um por dia coberto
   que caia na semana exibida. Um evento de vários dias ocupa uma coluna por
   dia — o primeiro dia começa no horário de início, o último termina no de
   término e os dias do meio ocupam a coluna inteira. Devolve lista vazia se
   nenhum dia do evento cair na semana. */
function placeEvent(event, days) {
  const dias = eventDayKeys(event);
  if (dias.length === 0) return [];

  const start = splitDateTime(event.date);
  const end = splitDateTime(event.endDate || event.date);
  const segmentos = [];

  dias.forEach((key, i) => {
    const col = days.findIndex((d) => d.key === key);
    if (col === -1) return; // dia fora da semana exibida

    const isPrimeiro = i === 0;
    const isUltimo = i === dias.length - 1;

    let startHour = isPrimeiro ? Number(start.time.slice(0, 2)) : FIRST_HOUR;
    if (!Number.isFinite(startHour)) startHour = FIRST_HOUR;

    let lastHour;
    if (isUltimo) {
      const [endH, endM] = end.time.split(":").map(Number);
      /* termina às HH:00 não ocupa a linha HH inteira */
      lastHour = Number.isFinite(endH) ? (endM > 0 ? endH : endH - 1) : startHour;
    } else {
      lastHour = LAST_HOUR;
    }
    /* garante ao menos a linha de início */
    if (!Number.isFinite(lastHour) || lastHour < startHour) lastHour = startHour;

    segmentos.push({ col, startHour, lastHour, title: event.title, id: event.id });
  });

  return segmentos;
}

/* Componente Calendário Mini */
export default function CalendarMini() {
  const days = generateCalendarDays();
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => i + FIRST_HOUR);
  const [placed, setPlaced] = useState([]);

  useEffect(() => {
    let active = true;
    fetchAllEvents()
      .then((events) => {
        if (!active) return;
        setPlaced(events.flatMap((e) => placeEvent(e, days)));
      })
      .catch(() => active && setPlaced([]));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📅</span>
        <h3 className="font-bold text-[#1E1E1E] text-lg">Calendário</h3>
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

      {/* Grid de Horas */}
      <div className="border-t border-gray-100 pt-2 space-y-0">
        {hours.map((hour) => (
          <div key={hour} className="flex items-stretch min-h-[28px] border-b border-gray-50">
            <span className="text-[10px] text-[#1E1E1E]/30 w-10 shrink-0 pt-1">{hour}:00</span>
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
