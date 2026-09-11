import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Clock, CalendarDays, CalendarPlus } from "lucide-react";
import {
  buildGoogleCalendarUrl,
  formatEventDates,
  formatEventTimeLabel,
  toFormResponseUrl,
} from "../../../services/eventService";

export default function EventHero({ event }) {
  const navigate = useNavigate();
  const googleCalendarUrl = buildGoogleCalendarUrl(event);

  const dateRange = formatEventDates(event);
  const timeLabel = formatEventTimeLabel(event);

  return (
    <section className="w-full bg-[#FDF3EA]">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[380px]">
          {/* Lado esquerdo — info */}
          <div className="flex flex-col justify-center px-6 md:px-10 py-10 md:py-16 gap-5">
            {/* Botão voltar */}
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-transparent hover:bg-[#1E1E1E]/5 flex items-center justify-center transition-colors self-start -ml-2"
              aria-label="Voltar"
            >
              <ArrowLeft size={22} className="text-[#1E1E1E]" />
            </button>

            {/* Título com badge laranja */}
            <h1>
              <span className="inline-block bg-[#FF6D2C] text-white font-black uppercase text-xl md:text-2xl px-5 py-2 rounded-lg tracking-wide">
                {event.title}
              </span>
            </h1>

            {/* Descrição */}
            <p className="text-[#1E1E1E]/70 text-sm md:text-base leading-relaxed max-w-md">
              {event.description}
            </p>

            {/* Local, data e horário */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="flex items-center gap-2 text-[#1E1E1E]/70 text-sm">
                <Building2 size={16} className="text-[#1E1E1E]/50" />
                {event.location}
              </span>
              {dateRange && (
                <span className="flex items-center gap-2 text-[#1E1E1E]/70 text-sm">
                  <CalendarDays size={16} className="text-[#1E1E1E]/50" />
                  {dateRange}
                </span>
              )}
              {timeLabel && (
                <span className="flex items-center gap-2 text-[#1E1E1E]/70 text-sm">
                  <Clock size={16} className="text-[#1E1E1E]/50" />
                  {timeLabel}
                </span>
              )}
            </div>

            {/* Adicionar ao Google Calendar do usuário */}
            {googleCalendarUrl && (
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 self-start text-sm font-bold text-black bg-[#F5E6DA] hover:bg-[#ead3c1] px-4 py-2.5 rounded-xl transition-colors shadow-sm mt-1"
              >
                <CalendarPlus size={18} className="text-[#FF6D2C]" />
                Adicionar ao Google Calendar
              </a>
            )}
            {/* Botão de voluntário */}
            <div className="mt-2">
              <button
                onClick={() => {
                  if (event.linkFormularioVoluntarios) {
                    window.open(toFormResponseUrl(event.linkFormularioVoluntarios), "_blank", "noopener,noreferrer");
                  }
                }}
                className="flex-1 text-sm font-semibold bg-[#FF6D2C] hover:bg-[#e65c18] text-white rounded-lg px-4 py-2 transition-colors"
              >
                Seja Voluntário
              </button>
            </div>
          </div>

          {/* Lado direito — imagem */}
          <div className="flex items-center justify-center p-6 md:p-10">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-auto max-h-[600px] object-contain rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
