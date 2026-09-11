import { Link } from "react-router-dom";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import {
  extractDayMonth,
  isMultiDay,
  isNonConsecutive,
  eventDayKeys,
} from "../../../../services/eventService";

/* Caixa de data da linha. Evento de um dia mantém dia grande + mês; evento de
   vários dias mostra a faixa, e quando ela atravessa a virada do mês os dois
   meses aparecem para a data não ficar ambígua. */
function DateBox({ event, muted = false }) {
  const inicio = extractDayMonth(event.date);
  const fim = extractDayMonth(event.endDate);
  const fundo = muted ? "bg-[#FFD9B3]/70" : "bg-[#FFD9B3]";
  const base = `flex flex-col items-center justify-center h-16 rounded-xl ${fundo} text-[#1E1E1E] font-bold shrink-0 shadow-sm`;

  /* Dias avulsos: o primeiro dia e a contagem dos demais. Uma faixa "05–19"
     afirmaria que o evento ocupa tudo entre as pontas. */
  if (isNonConsecutive(event)) {
    const outros = Math.max(eventDayKeys(event).length - 1, 0);
    return (
      <div className={`${base} w-16`}>
        <span className="text-lg leading-tight">{inicio.day}</span>
        <span className="text-[10px] uppercase tracking-wider font-semibold">{inicio.month}</span>
        <span className="text-[9px] font-semibold opacity-60 leading-none mt-0.5">
          + {outros} {outros === 1 ? "dia" : "dias"}
        </span>
      </div>
    );
  }

  if (!isMultiDay(event)) {
    return (
      <div className={`${base} w-14`}>
        <span className="text-lg leading-tight">{inicio.day}</span>
        <span className="text-[10px] uppercase tracking-wider font-semibold">{inicio.month}</span>
      </div>
    );
  }

  if (fim.month === inicio.month) {
    return (
      <div className={`${base} w-16`}>
        <span className="text-base leading-tight">
          {inicio.day}–{fim.day}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-semibold">{inicio.month}</span>
      </div>
    );
  }

  return (
    <div className={`${base} w-16`}>
      <span className="text-[11px] uppercase tracking-wide leading-tight">
        {inicio.day} {inicio.month}
      </span>
      <span className="text-[9px] font-semibold opacity-50 leading-none my-0.5">até</span>
      <span className="text-[11px] uppercase tracking-wide leading-tight">
        {fim.day} {fim.month}
      </span>
    </div>
  );
}

export function UpcomingEventRow({ event, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-0 group hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
      <DateBox event={event} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#1E1E1E] truncate">{event.title}</p>
        <span className="flex items-center gap-1 text-xs text-[#1E1E1E]/50 mt-0.5">
          <MapPin size={11} />
          {event.location}
        </span>
      </div>

      {/* Acoes */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onEdit(event.id)}
          className="w-9 h-9 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors group/btn"
          title="Editar"
        >
          <Pencil size={16} className="text-green-600 group-hover/btn:scale-110 transition-transform" />
        </button>
        {/* Excluir é restrito ao superadministrador: sem handler, sem botão. */}
        {onDelete && (
          <button
            onClick={() => onDelete(event)}
            className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors group/btn"
            title="Excluir"
          >
            <Trash2 size={16} className="text-red-500 group-hover/btn:scale-110 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}

/* Eventos Anteriores */
export function PastEventRow({ event }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-0 group hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
      {/* Data */}
      <DateBox event={event} muted />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#1E1E1E] truncate">{event.title}</p>
        <span className="flex items-center gap-1 text-xs text-[#1E1E1E]/50 mt-0.5">
          <MapPin size={11} />
          {event.location}
        </span>
      </div>

      {/* Acoes */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <Link
          to={`/admin/eventos/${event.id}`}
          className="text-[11px] font-bold bg-[#FF6D2C] text-white px-4 py-1.5 rounded-md hover:bg-[#e65c18] transition-colors text-center"
        >
          Detalhes
        </Link>
        <Link
          to="/admin/voluntarios"
          className="text-[11px] font-bold bg-[#333] text-white px-4 py-1.5 rounded-md hover:bg-[#1a1a1a] transition-colors text-center"
        >
          Voluntários
        </Link>
      </div>
    </div>
  );
}
