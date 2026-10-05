import { Link, useNavigate } from "react-router-dom";
import { Building2, Clock } from "lucide-react";
import { formatEventDates, isMultiDay, toFormResponseUrl } from "../../../services/eventService";

export default function EventList({ events }) {
  const navigate = useNavigate();

  /* "Inscreva-se" é o fluxo de participante (US09) — antes este botão abria o
     formulário de voluntariado, que é outra coisa. Sem link de participante
     cadastrado, leva à página do evento: lá a pessoa vê o que de fato existe,
     inclusive o voluntariado, se for o único fluxo aberto. */
  const inscreverParticipante = (event) => {
    if (event.linkFormularioParticipantes) {
      window.open(toFormResponseUrl(event.linkFormularioParticipantes), "_blank", "noopener,noreferrer");
    } else {
      navigate(`/eventos/${event.slug}`);
    }
  };

  const inscreverVoluntario = (event) => {
    window.open(toFormResponseUrl(event.linkFormularioVoluntarios), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group"
        >
          {/* Imagem */}
          <Link to={`/eventos/${event.slug}`} className="block relative overflow-hidden h-52">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-semibold text-[#FF6D2C] text-base mb-3">
              {event.title}
            </h3>
            <div className="flex flex-col gap-1.5 mb-4">
              <div className="flex items-center gap-2 text-sm text-[#1E1E1E]/60">
                <Building2 size={14} className="shrink-0" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#1E1E1E]/60">
                <Clock size={14} className="shrink-0" />
                {/* Evento de um dia cabe com o horário; em faixa de datas o
                    horário fica só na página do evento, para a linha não virar
                    uma sequência de quatro separadores. */}
                <span>
                  {formatEventDates(event)}
                  {!isMultiDay(event) && event.time ? ` · ${event.time}` : ""}
                </span>
              </div>
            </div>

            {/* Botões — o voluntariado só aparece nos eventos que abriram
                esse fluxo, para não prometer o que não existe. */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Link
                  to={`/eventos/${event.slug}`}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#1E1E1E] border border-[#1E1E1E]/15 rounded-lg px-4 py-2 hover:border-[#FF6D2C] hover:text-[#FF6D2C] transition-colors"
                >
                  Veja mais →
                </Link>
                <button
                  onClick={() => inscreverParticipante(event)}
                  className="flex-1 text-sm font-semibold bg-[#FF6D2C] hover:bg-[#e65c18] text-white rounded-lg px-4 py-2 transition-colors"
                >
                  Inscreva-se
                </button>
              </div>
              {event.linkFormularioVoluntarios && (
                <button
                  onClick={() => inscreverVoluntario(event)}
                  className="w-full text-sm font-semibold border-2 border-[#FF6D2C] text-[#FF6D2C] hover:bg-[#FF6D2C] hover:text-white rounded-lg px-4 py-2 transition-colors"
                >
                  Seja Voluntário
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
