import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarDays, Images } from "lucide-react";
import { fetchPastEventsWithPhotos, formatEventDates } from "../../../services/eventService";

/* Histórico de eventos (US15) — o que já aconteceu, com as fotos de cada um.

   Mora no fim da página de eventos, depois da agenda, porque a ordem da
   página acompanha a do tempo: o que vem aí primeiro, o que já passou no fim.
   Cada card leva à página do evento, onde o álbum da US07 já é exibido. */
export default function PastEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const passados = await fetchPastEventsWithPhotos();
        if (active) setEvents(passados);
      } catch {
        /* O histórico é complemento da agenda: se falhar, a seção não aparece
           e o resto da página continua servindo. */
        if (active) setEvents([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading || events.length === 0) return null;

  return (
    /* `pb-20` nao: a agenda acima ja usa essa classe como ancora nos testes,
       e repeti-la aqui faria os dois blocos responderem ao mesmo seletor. */
    <section id="historico" className="w-full bg-[#FDF3EA] pb-24">
      <div className="w-full max-w-6xl mx-auto px-4">
        <h2
          className="font-handwriting text-[#1E1E1E] mb-2"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}
        >
          Já aconteceram
        </h2>
        <p className="text-sm text-[#1E1E1E]/60 mb-6 max-w-xl">
          Reveja os eventos anteriores e as fotos de cada um.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/eventos/${event.slug}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group"
            >
              <div className="relative overflow-hidden h-44">
                <img
                  src={event.cover}
                  alt={`${event.title} — ${event.location || "evento anterior"}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  /* A capa vem do Drive e pode falhar: cai na imagem do
                     evento. A marca evita repetir a troca se a reserva também
                     falhar, o que deixaria o onError em laço. */
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.reserva) return;
                    img.dataset.reserva = "1";
                    img.src = event.image;
                  }}
                />

                {/* Só anuncia fotos quando elas existem — evento antigo sem
                    álbum cadastrado não deve prometer o que não tem. */}
                {event.totalFotos > 0 && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    <Images size={13} />
                    {event.totalFotos} {event.totalFotos === 1 ? "foto" : "fotos"}
                  </span>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-[#FF6D2C] text-base mb-3">
                  {event.title}
                </h3>

                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-2 text-sm text-[#1E1E1E]/60">
                    <CalendarDays size={14} className="shrink-0" />
                    {formatEventDates(event)}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-2 text-sm text-[#1E1E1E]/60">
                      <Building2 size={14} className="shrink-0" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
