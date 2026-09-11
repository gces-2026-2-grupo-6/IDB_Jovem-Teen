import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  occursInMonth,
  isOngoingOrFuture,
  isMultiDay,
  isNonConsecutive,
  eventDayKeys,
  extractDayMonth,
  formatEventDates,
  dateSortKey,
} from "../../../services/eventService";

const CAIXA_DE_DATA =
  "flex flex-col items-center justify-center bg-[#FFF5EB] border border-[#FFD0B0] text-[#D5650D] rounded-xl p-4 min-w-[100px] shrink-0";

/* Caixa de data do card.

   Período contínuo mostra a faixa, repetindo o mês só quando o evento atravessa
   a virada. Dias avulsos mostram o primeiro dia do evento **naquele mês** e
   quantos outros dias ele tem ali — "até" seria falso, porque afirmaria que os
   dias entre as pontas fazem parte do evento. */
function DateBox({ event, monthIndex, year }) {
  const inicio = extractDayMonth(event.date);
  const fim = extractDayMonth(event.endDate);

  if (isNonConsecutive(event)) {
    const prefixoDoMes = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`;
    const diasNoMes = eventDayKeys(event).filter((dia) => dia.startsWith(prefixoDoMes));
    const primeiro = extractDayMonth(diasNoMes[0] || event.date);
    const outros = Math.max(diasNoMes.length - 1, 0);

    return (
      <div className={CAIXA_DE_DATA}>
        <span className="text-xs font-bold uppercase">{primeiro.month}</span>
        <span className="text-4xl font-black leading-none my-1">{primeiro.day}</span>
        {outros > 0 && (
          <span className="text-[11px] font-bold uppercase leading-none text-center">
            + {outros} {outros === 1 ? "dia" : "dias"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={CAIXA_DE_DATA}>
      <span className="text-xs font-bold uppercase">{inicio.month}</span>
      <span className="text-4xl font-black leading-none my-1">{inicio.day}</span>
      {isMultiDay(event) && (
        <span className="text-[11px] font-bold uppercase leading-none text-center">
          até {fim.day}
          {fim.month !== inicio.month ? ` ${fim.month}` : ""}
        </span>
      )}
    </div>
  );
}

export default function CalendarioSection({ events = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  /* Um evento entra no mês quando qualquer dia do seu intervalo cai nele — um
     acampamento de 28/07 a 02/08 aparece em julho e em agosto. O corte é por
     data de término (`isOngoingOrFuture`), então evento já iniciado e ainda em
     curso continua listado em vez de desaparecer. */
  const monthEvents = events
    .filter(
      (event) =>
        occursInMonth(event, currentDate.getMonth(), currentYear) &&
        isOngoingOrFuture(event)
    )
    .sort((a, b) => dateSortKey(a.date) - dateSortKey(b.date));

  return (
    <section className="w-full py-16 md:py-24 px-4 bg-[#DC6803]">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-white font-black text-4xl md:text-5xl uppercase tracking-wide">
            Calendário de Eventos
          </h2>
          <p className="text-white/80 mt-2 font-medium">Acompanhe nossa agenda para o ano todo</p>
        </div>

        {/* Calendar Header */}
        <div className="flex items-center justify-between bg-[#F9FAFB] border border-neutral-200 rounded-2xl p-4 md:p-6 mb-8 shadow-sm">
          <button
            onClick={prevMonth}
            aria-label="Mês anterior"
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-[#D5650D]" />
          </button>
          
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-black text-neutral-800 capitalize">
              {currentMonthName}
            </h3>
            <span className="text-neutral-500 font-bold">{currentYear}</span>
          </div>

          <button
            onClick={nextMonth}
            aria-label="Próximo mês"
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <ChevronRight size={24} className="text-[#D5650D]" />
          </button>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {monthEvents.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-100">
              <CalendarIcon size={48} className="mx-auto text-neutral-300 mb-4" />
              <p className="text-neutral-500 font-medium">Nenhum evento agendado para este mês.</p>
            </div>
          ) : (
            monthEvents.map(event => {
              return (
                <div key={event.id} className="flex flex-col md:flex-row gap-6 bg-white border border-neutral-200 rounded-2xl p-4 md:p-6 hover:shadow-md transition-shadow group">

                  <DateBox
                    event={event}
                    monthIndex={currentDate.getMonth()}
                    year={currentYear}
                  />

                  {/* Info */}
                  <div className="flex flex-col justify-center flex-1">
                    <h4 className="text-xl md:text-2xl font-bold text-neutral-800 mb-2 group-hover:text-[#D5650D] transition-colors">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2 text-neutral-500 text-sm font-medium mb-1">
                      <CalendarIcon size={16} />
                      <span>{formatEventDates(event)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-500 text-sm font-medium mb-1">
                      <MapPin size={16} />
                      <span>{event.location}</span>
                    </div>
                    <p className="text-neutral-600 text-sm line-clamp-2 mt-2">{event.description}</p>
                  </div>

                  {/* Action */}
                  <div className="flex items-center md:justify-end shrink-0">
                    <Link
                      to={`/eventos/${event.slug}`}
                      className="px-6 py-2.5 bg-[#D5650D] text-white font-bold rounded-full hover:bg-[#C2580B] transition-colors w-full text-center md:w-auto"
                    >
                      Detalhes
                    </Link>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </section>
  );
}
