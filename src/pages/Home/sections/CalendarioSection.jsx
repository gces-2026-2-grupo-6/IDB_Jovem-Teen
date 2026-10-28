import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon, History } from "lucide-react";
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

const CAIXA_BASE = "flex flex-col items-center justify-center border rounded-xl p-4 min-w-[100px] shrink-0";
const CAIXA_DE_DATA = `${CAIXA_BASE} bg-[#FFF5EB] border-[#FFD0B0] text-[#D5650D]`;
/* US23: evento que já aconteceu fica em tons de cinza, para não competir com
   a agenda que vem pela frente. */
const CAIXA_DE_DATA_PASSADO = `${CAIXA_BASE} bg-neutral-100 border-neutral-200 text-neutral-500`;

/* Caixa de data do card.

   Período contínuo mostra a faixa, repetindo o mês só quando o evento atravessa
   a virada. Dias avulsos mostram o primeiro dia do evento **naquele mês** e
   quantos outros dias ele tem ali — "até" seria falso, porque afirmaria que os
   dias entre as pontas fazem parte do evento. */
function DateBox({ event, monthIndex, year, passado = false }) {
  const caixa = passado ? CAIXA_DE_DATA_PASSADO : CAIXA_DE_DATA;
  const inicio = extractDayMonth(event.date);
  const fim = extractDayMonth(event.endDate);

  if (isNonConsecutive(event)) {
    const prefixoDoMes = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`;
    const diasNoMes = eventDayKeys(event).filter((dia) => dia.startsWith(prefixoDoMes));
    const primeiro = extractDayMonth(diasNoMes[0] || event.date);
    const outros = Math.max(diasNoMes.length - 1, 0);

    return (
      <div className={caixa}>
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
    <div className={caixa}>
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
     acampamento de 28/07 a 02/08 aparece em julho e em agosto.

     US23: o calendário também guarda o que já aconteceu. Antes, o evento com
     término no passado era descartado aqui e os meses anteriores ficavam
     vazios. O término continua decidindo o que é passado: evento já iniciado
     e ainda em curso segue com a aparência normal (CA3). */
  const monthEvents = events
    .filter((event) => occursInMonth(event, currentDate.getMonth(), currentYear))
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
              <p className="text-neutral-500 font-medium">Nenhum evento neste mês.</p>
            </div>
          ) : (
            monthEvents.map(event => {
              const passado = !isOngoingOrFuture(event);
              return (
                <div
                  key={event.id}
                  data-passado={passado ? "sim" : undefined}
                  className={`flex flex-col md:flex-row gap-6 border rounded-2xl p-4 md:p-6 hover:shadow-md transition-shadow group ${
                    passado ? "bg-neutral-50 border-neutral-200" : "bg-white border-neutral-200"
                  }`}
                >

                  <DateBox
                    event={event}
                    monthIndex={currentDate.getMonth()}
                    year={currentYear}
                    passado={passado}
                  />

                  {/* Info */}
                  <div className="flex flex-col justify-center flex-1">
                    {passado && (
                      <span className="inline-flex items-center gap-1 self-start mb-2 px-2.5 py-1 rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold">
                        <History size={12} aria-hidden="true" />
                        Já aconteceu
                      </span>
                    )}
                    <h4
                      className={`text-xl md:text-2xl font-bold mb-2 group-hover:text-[#D5650D] transition-colors ${
                        passado ? "text-neutral-500" : "text-neutral-800"
                      }`}
                    >
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
                    {/* No passado, o botão leva ao álbum quando há fotos (CA4). */}
                    <Link
                      to={`/eventos/${event.slug}`}
                      className={`px-6 py-2.5 font-bold rounded-full transition-colors w-full text-center md:w-auto ${
                        passado
                          ? "bg-white text-neutral-700 border border-neutral-300 hover:border-[#D5650D] hover:text-[#D5650D]"
                          : "bg-[#D5650D] text-white hover:bg-[#C2580B]"
                      }`}
                    >
                      {passado && event.linkGaleria ? "Ver fotos" : "Detalhes"}
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
