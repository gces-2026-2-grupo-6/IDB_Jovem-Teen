import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Clock } from "lucide-react";
import EventFilters from "./components/EventFilters";
import EventSearch from "./components/EventSearch";
import EventList from "./components/EventList";
import PastEvents from "./components/PastEvents";
import EmptyEvents from "./components/EmptyEvents";
import {
  fetchAllEvents,
  formatDateRange,
  isOngoingOrFuture,
  splitDateTime,
  toFormResponseUrl,
} from "../../services/eventService";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function inferRegionFromLocation(location) {
  const text = normalizeText(location);
  const regionMap = [
    ["norte", [/\b(amazonas|acre|amapa|para|rondonia|roraima|tocantins|manaus|belem|maca|macapa)\b/, /\b(am|ac|ap|pa|ro|rr|to)\b/]],
    ["nordeste", [/\b(alagoas|bahia|ceara|maranhao|paraiba|pernambuco|piaui|rio grande do norte|sergipe|fortaleza|recife)\b/, /\b(al|ba|ce|ma|pb|pe|pi|rn|se)\b/]],
    ["centro-oeste", [/\b(distrito federal|brasilia|goiania|campo grande|cuiaba)\b/, /\b(df|go|mt|ms)\b/, /\bcentro\s*-\s*oeste\b/]],
    ["sudeste", [/\b(sao paulo|rio de janeiro|minas gerais|espirito santo|sao paulo|rio)\b/, /\b(sp|rj|mg|es)\b/]],
    ["sul", [/\b(parana|santa catarina|rio grande do sul|curitiba|florianopolis|porto alegre)\b/, /\b(pr|sc|rs)\b/]],
  ];

  for (const [region, matchers] of regionMap) {
    if (matchers.some((matcher) => matcher.test(text))) {
      return region;
    }
  }

  return "";
}

function matchesDateFilter(eventDate, selectedFilter) {
  if (selectedFilter === "Data") return true;

  const parsed = splitDateTime(eventDate).day;
  if (!parsed) return false;

  const eventDay = new Date(`${parsed}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedFilter === "Esta semana") {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return eventDay >= today && eventDay < weekEnd;
  }

  if (selectedFilter === "Este mês") {
    return (
      eventDay.getFullYear() === today.getFullYear() &&
      eventDay.getMonth() === today.getMonth() &&
      eventDay >= today
    );
  }

  if (selectedFilter === "Próximos 3 meses") {
    const limit = new Date(today);
    limit.setMonth(limit.getMonth() + 3);
    return eventDay >= today && eventDay < limit;
  }

  return true;
}

function matchesEventFilters(event, filters) {
  if (!isOngoingOrFuture(event)) return false;

  const tipoAtivo = filters.tipo === "Tipo de evento" || event.category === filters.tipo;
  const regiaoAtiva =
    filters.regiao === "Região" || inferRegionFromLocation(event.location) === normalizeText(filters.regiao);
  const dataAtiva = matchesDateFilter(event.date, filters.data);

  return tipoAtivo && regiaoAtiva && dataAtiva;
}

/* Fluxo de participante (US09). Sem link cadastrado, leva à página do evento
   em vez de abrir o formulário de voluntariado, que é outra inscrição. */
function inscreverEvento(event, navigate) {
  if (event.linkFormularioParticipantes) {
    window.open(toFormResponseUrl(event.linkFormularioParticipantes), "_blank", "noopener,noreferrer");
  } else {
    navigate(`/eventos/${event.slug}`);
  }
}

function seVoluntariar(event) {
  window.open(toFormResponseUrl(event.linkFormularioVoluntarios), "_blank", "noopener,noreferrer");
}

export default function Eventos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearchState] = useState(searchParams.get("q") || "");

  const setSearch = (val) => {
    setSearchState(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };
  const [filters, setFilters] = useState({
    tipo: "Tipo de evento",
    regiao: "Região",
    data: "Data",
  });

  const [allEvents, setAllEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Carrega todos os eventos uma vez */
  useEffect(() => {
    let active = true;
    fetchAllEvents()
      .then((all) => {
        if (!active) return;
        setAllEvents(all);
        setResults(all);
      })
      .catch(() => active && setError("Não foi possível carregar os eventos."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  /* Busca local quando há termo (>= 2 caracteres) */
  useEffect(() => {
    const termo = search.trim();
    if (termo.length < 2) {
      setResults(allEvents);
      return;
    }
    const query = normalizeText(termo);
    const filtered = allEvents.filter((event) => {
      const haystack = normalizeText([
        event.title,
        event.location,
        event.description,
        event.category,
      ].join(" "));
      return haystack.includes(query);
    });
    setResults(filtered);
  }, [search, allEvents]);

  /* Apenas eventos que ainda não terminaram (vão acontecer ou estão acontecendo) */
  const upcoming = allEvents
    .filter(isOngoingOrFuture)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const featured = upcoming[0] || null;

  /* Grid "Todos os eventos" também esconde os já encerrados e aplica os filtros selecionados */
  const visibleResults = results.filter((event) => matchesEventFilters(event, filters));

  return (
    <main className="min-h-screen bg-[#FDF3EA] pt-[70px] md:pt-[82px]">
      {/* Topo: título + filtros */}
      <section className="w-full bg-[#FDF3EA] pt-10 pb-6">
        <div className="w-full max-w-6xl mx-auto px-4">
          <h1
            className="font-black text-[#1E1E1E] mb-6"
            style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
          >
            Eventos
          </h1>

          {/* Filtros + busca */}
          <div className="flex flex-wrap gap-3 items-center">
            <EventFilters filters={filters} onChange={setFilters} />
            <EventSearch
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
            />
          </div>
        </div>
      </section>

      {/* Em breve (evento destaque) */}
      {featured && (
        <section className="w-full bg-[#FDF3EA] py-10">
          <div className="w-full max-w-6xl mx-auto px-4">
            <h2 className="font-handwriting text-[#1E1E1E] mb-6" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
              Em breve
            </h2>

            <div className="rounded-[32px] overflow-hidden max-w-3xl border-[6px] border-black bg-black mx-auto">
              <Link to={`/eventos/${featured.slug}`} className="block relative">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-[300px] object-cover rounded-t-[26px]"
                />
              </Link>
              {/* Info sobre a imagem */}
              <div className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#FF6D2C] text-2xl leading-tight">
                    {featured.title}
                  </h3>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="flex items-center gap-1.5 text-white/90 text-sm">
                      <Building2 size={16} />
                      {featured.location}
                    </span>
                    <span className="flex items-center gap-1.5 text-white/90 text-sm">
                      <Clock size={16} />
                      {formatDateRange(featured.date, featured.endDate)}
                      {featured.time ? ` - ${featured.time}` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end shrink-0">
                  <Link
                    to={`/eventos/${featured.slug}`}
                    className="flex items-center justify-between gap-2 bg-[#E0E0E0] text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#d1d1d1] transition-colors w-[130px]"
                  >
                    Veja mais <span className="text-black text-lg leading-none">→</span>
                  </Link>
                  <button
                    onClick={() => inscreverEvento(featured, navigate)}
                    className="bg-[#FF6D2C] hover:bg-[#e65c18] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors w-[130px]"
                  >
                    Inscreva-se
                  </button>
                  {featured.linkFormularioVoluntarios && (
                    <button
                      onClick={() => seVoluntariar(featured)}
                      className="border-2 border-[#FF6D2C] text-[#FF6D2C] hover:bg-[#FF6D2C] hover:text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors w-[130px]"
                    >
                      Seja Voluntário
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}


      {/* Todos os eventos (grid com filtro) */}
      <section className="w-full bg-[#FDF3EA] py-10 pb-20">
        <div className="w-full max-w-6xl mx-auto px-4">
          {loading ? (
            <p className="text-center text-[#1E1E1E]/50 font-semibold py-10">
              Carregando eventos...
            </p>
          ) : error ? (
            <p className="text-center text-red-500 font-semibold py-10">{error}</p>
          ) : visibleResults.length > 0 ? (
            <EventList events={visibleResults} />
          ) : (
            <EmptyEvents />
          )}
        </div>
      </section>

      {/* Histórico (US15): o que já aconteceu vem depois da agenda, e a seção
          se esconde sozinha quando não há evento encerrado. */}
      <PastEvents />
    </main>
  );
}
