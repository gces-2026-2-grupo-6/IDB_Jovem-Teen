import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import SectionTitle from "../../../components/ui/SectionTitle";
import { MapPin } from "lucide-react";
import CalendarMini from "./components/CalendarMini";
import EmptyState from "../../../components/ui/EmptyState";
import { fetchAllEvents, getEventStatus, extractDayMonth } from "../../../services/eventService";
import usePermissao from "../../../hooks/usePermissao";
import { SETOR } from "../../../utils/permissoes";

function DashboardEventRow({ event, isPast = false }) {
  const { administra } = usePermissao();
  const { day, month } = event.day && event.month ? event : extractDayMonth(event.date);

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 group hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
      <div className={`flex flex-col items-center justify-center w-12 h-14 rounded-xl text-white font-bold shrink-0 ${isPast ? "bg-[#FF6D2C]/70" : "bg-[#FF6D2C]"}`}>
        <span className="text-lg leading-tight">{day}</span>
        <span className="text-[10px] uppercase tracking-wider">{month}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#1E1E1E] truncate">{event.title}</p>
        <span className="flex items-center gap-1 text-xs text-[#1E1E1E]/50">
          <MapPin size={11} />
          {event.location}
        </span>
      </div>

      {/* Açoes */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <Link
          to={`/admin/eventos`}
          className="text-[10px] font-bold bg-[#FF6D2C] text-white px-3 py-1 rounded-md hover:bg-[#e65c18] transition-colors text-center"
        >
          Detalhes
        </Link>
        {administra(SETOR.INSCRICOES) && (
          <Link
            to={`/admin/voluntarios`}
            className="text-[10px] font-bold border border-[#1E1E1E]/20 text-[#1E1E1E]/70 px-3 py-1 rounded-md hover:border-[#FF6D2C] hover:text-[#FF6D2C] transition-colors text-center"
          >
            {isPast ? "Voluntários" : "Gerenciar Voluntários"}
          </Link>
        )}
      </div>
    </div>
  );
}

function byDateAsc(a, b) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function byDateDesc(a, b) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

/* Tela inicial do painel: o resumo da agenda de eventos.

   US03 (revisão, CA1): produtos e eventos ficam em telas separadas, cada uma
   com o seu item de menu. Antes, "Produtos Cadastrados" dividia esta tela com
   o calendário de eventos; o resumo da loja agora é a própria tela Produtos. */
export default function AdminDashboard() {
  const { administra } = usePermissao();
  const veEventos = administra(SETOR.EVENTOS);

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        /* Não busca o que a pessoa não pode ver: além de poupar a requisição,
           evita um erro de permissão da API virar erro na tela inteira. */
        const allEvents = veEventos ? await fetchAllEvents() : [];

        if (!active) return;

        const nextEvents = allEvents
          .filter((event) => getEventStatus(event) === "upcoming")
          .sort(byDateAsc)
          .slice(0, 4)
          .map((event) => ({ ...event, ...extractDayMonth(event.date) }));

        const currentEvents = allEvents
          .filter((event) => getEventStatus(event) === "ongoing")
          .sort(byDateAsc)
          .slice(0, 4)
          .map((event) => ({ ...event, ...extractDayMonth(event.date) }));

        const previousEvents = allEvents
          .filter((event) => getEventStatus(event) === "past")
          .sort(byDateDesc)
          .slice(0, 4)
          .map((event) => ({ ...event, ...extractDayMonth(event.date) }));

        setUpcomingEvents(nextEvents);
        setOngoingEvents(currentEvents);
        setPastEvents(previousEvents);
      } catch {
        if (active) {
          setError("Não foi possível carregar os dados do dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [veEventos]);

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionTitle
        title="Dashboard"
        titleStyle={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 600 }}
      />

      {error && <EmptyState message={error} className="border-red-100 bg-red-50/60 text-red-700" />}

      {/* Quem não administra eventos não tem o que ver aqui — o painel inicial
          resume a agenda. */}
      {!veEventos && (
        <EmptyState message="Use o menu ao lado para acessar os setores que você administra." />
      )}

      {/* eventos em andamento (só aparece quando há algum acontecendo) */}
      {veEventos && !loading && ongoingEvents.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1E1E1E] text-lg">Eventos em Andamento</h2>
            <Link
              to="/admin/eventos"
              className="text-xs font-semibold text-[#FF6D2C] hover:underline flex items-center gap-0.5"
            >
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {ongoingEvents.map((event) => (
              <DashboardEventRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* linha de eventos */}
      {veEventos && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* próximos eventos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1E1E1E] text-lg">Próximos Eventos</h2>
            <Link
              to="/admin/eventos"
              className="text-xs font-semibold text-[#FF6D2C] hover:underline flex items-center gap-0.5"
            >
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <p className="py-3 text-sm text-[#1E1E1E]/40">Carregando eventos...</p>
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => <DashboardEventRow key={event.id} event={event} />)
            ) : (
              <div className="py-4">
                <EmptyState message="Nenhum evento próximo encontrado." className="border-none shadow-none p-0 bg-transparent" />
              </div>
            )}
          </div>
        </div>

        {/* eventos passados */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1E1E1E] text-lg">Eventos Anteriores</h2>
            <Link
              to="/admin/eventos"
              className="text-xs font-semibold text-[#FF6D2C] hover:underline flex items-center gap-0.5"
            >
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <p className="py-3 text-sm text-[#1E1E1E]/40">Carregando eventos...</p>
            ) : pastEvents.length > 0 ? (
              pastEvents.map((event) => <DashboardEventRow key={event.id} event={event} isPast />)
            ) : (
              <div className="py-4">
                <EmptyState message="Nenhum evento anterior encontrado." className="border-none shadow-none p-0 bg-transparent" />
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* calendário — é a agenda de eventos */}
      {veEventos && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalendarMini />
        </div>
      )}
    </div>
  );
}
