import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, MapPin, ExternalLink } from "lucide-react";
import { fetchSpeakerById, fetchParticipacoesPorConvidado } from "../../../services/speakerService";
import { formatEventDates } from "../../../services/eventService";
import SectionTitle from "../../../components/ui/SectionTitle";
import EmptyState from "../../../components/ui/EmptyState";
import Loading from "../../../components/ui/Loading";

/* Histórico de participações de um convidado (RF51).

   O dado já era calculado na listagem, para avisar antes de excluir alguém
   vinculado, mas só a contagem aparecia e a lista era descartada. Esta tela é
   a visualização que faltava.

   A listagem passa as participações por `state` da navegação quando já as
   tem: assim abrir o histórico de quem veio da lista não refaz a agregação,
   que custa uma requisição por evento. Abrir a URL direto continua
   funcionando — aí a tela busca por conta própria. */
export default function AdminPalestranteDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [convidado, setConvidado] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    setLoading(true);

    (async () => {
      try {
        const [dados, participacoes] = await Promise.all([
          fetchSpeakerById(id),
          fetchParticipacoesPorConvidado(),
        ]);
        if (!ativo) return;
        setConvidado(dados);
        setEventos(participacoes[Number(id)] || []);
      } catch {
        if (ativo) setErro("Não foi possível carregar o convidado.");
      } finally {
        if (ativo) setLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (erro || !convidado) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold text-[#1E1E1E]/60 mb-4">
          {erro || "Convidado não encontrado."}
        </p>
        <button
          onClick={() => navigate("/admin/palestrantes")}
          className="text-sm font-bold text-[#FF6D2C] hover:underline"
        >
          Voltar para Convidados
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle title={convidado.name} onBack={() => navigate("/admin/palestrantes")} />

      {/* Identificação */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <img
            src={convidado.image}
            alt={`Foto de ${convidado.name}`}
            className="w-20 h-20 rounded-full object-cover shrink-0 border border-gray-100"
          />
          <div className="min-w-0">
            <p className="font-bold text-lg text-[#1E1E1E]">{convidado.name}</p>
            {convidado.role && (
              <p className="text-sm text-[#1E1E1E]/50 mt-0.5">{convidado.role}</p>
            )}
            <p className="text-xs text-[#1E1E1E]/40 mt-2">
              {eventos.length === 0
                ? "Ainda não vinculado a nenhum evento"
                : eventos.length === 1
                  ? "Participou de 1 evento"
                  : `Participou de ${eventos.length} eventos`}
            </p>
          </div>
        </div>

        {convidado.miniBio && (
          <>
            <hr className="my-5 border-gray-100" />
            <p className="text-sm text-[#1E1E1E]/70 leading-relaxed">{convidado.miniBio}</p>
          </>
        )}
      </div>

      {/* Participações */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-[#1E1E1E] text-lg mb-1">Participações</h2>
        <p className="text-xs text-[#1E1E1E]/50 mb-4">
          Eventos em que este convidado está anunciado, do mais recente para o mais antigo.
        </p>
        <hr className="border-gray-200 mb-3" />

        {eventos.length === 0 ? (
          <EmptyState
            message="Este convidado ainda não foi vinculado a nenhum evento. Vincule-o pelo formulário do evento."
            className="border-none shadow-none p-6"
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {eventos.map((evento) => (
              <div
                key={evento.id}
                className="flex items-center gap-4 py-3.5 px-2 rounded-lg hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1E1E1E] truncate">{evento.title}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="flex items-center gap-1 text-xs text-[#1E1E1E]/50">
                      <CalendarDays size={11} />
                      {formatEventDates(evento)}
                    </span>
                    {evento.location && (
                      <span className="flex items-center gap-1 text-xs text-[#1E1E1E]/50">
                        <MapPin size={11} />
                        {evento.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Leva à página pública do evento: é lá que se vê como o
                    convidado aparece anunciado. */}
                <Link
                  to={`/eventos/${evento.slug}`}
                  className="inline-flex items-center gap-1.5 shrink-0 text-xs font-bold text-[#1E1E1E]/70 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-[#FF6D2C] hover:text-[#FF6D2C] transition-colors"
                >
                  <ExternalLink size={13} />
                  Ver evento
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
