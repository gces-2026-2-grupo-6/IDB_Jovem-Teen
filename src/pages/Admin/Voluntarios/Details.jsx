import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchEventById } from "../../../services/eventService";
import SectionTitle from "../../../components/ui/SectionTitle";
import Loading from "../../../components/ui/Loading";
import FluxoTabs from "./components/FluxoTabs";
import { FLUXO } from "./fluxos";
import VoluntariosPanel from "./components/VoluntariosPanel";
import ParticipantesPanel from "./components/ParticipantesPanel";

/* Inscrições de um evento.

   A US09 separou o que era uma listagem só em dois fluxos independentes —
   participantes e voluntários —, cada um com o seu link e a sua tabela. Esta
   página é a casca: carrega o evento e entrega a aba ativa ao painel
   correspondente, que cuida dos próprios dados. */
export default function AdminVoluntarioDetails() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fluxo, setFluxo] = useState(FLUXO.VOLUNTARIOS);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ev = await fetchEventById(eventId);
        if (active) setEvent(ev);
      } catch {
        if (active) setEvent(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [eventId]);

  if (loading) {
    return <Loading />;
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold text-[#1E1E1E]/60 mb-4">Evento não encontrado.</p>
        <button
          onClick={() => navigate("/admin/voluntarios")}
          className="text-sm font-bold text-[#FF6D2C] hover:underline"
        >
          Voltar para Voluntários
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle
        title="Voluntários"
        onBack={() => navigate("/admin/voluntarios")}
      />

      <p className="text-sm text-[#1E1E1E]/50 -mt-3">
        Inscrições de <span className="font-bold text-[#1E1E1E]/70">{event.title}</span>
      </p>

      <FluxoTabs ativo={fluxo} onChange={setFluxo} />

      {/* Cada painel carrega os próprios dados quando entra em tela. A troca
          de aba desmonta o outro, então uma resposta atrasada do fluxo que
          saiu não escreve sobre o que está sendo mostrado. */}
      {fluxo === FLUXO.VOLUNTARIOS ? (
        <VoluntariosPanel event={event} eventId={eventId} />
      ) : (
        <ParticipantesPanel event={event} eventId={eventId} />
      )}
    </div>
  );
}
