import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { fetchEventById, handleUpdateEvent } from "../../../services/eventService";
import EventForm from "../../../components/forms/EventForm";
import SituacaoEventoCard from "./components/SituacaoEventoCard";

export default function AdminEventoEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchEventById(id)
      .then((data) => active && setEvent(data))
      .catch(() => active && setEvent(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold text-[#1E1E1E]/60">Carregando evento...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold text-[#1E1E1E]/60 mb-4">Evento não encontrado.</p>
        <button
          onClick={() => navigate("/admin/eventos")}
          className="text-sm font-bold text-[#FF6D2C] hover:underline"
        >
          Voltar para Eventos
        </button>
      </div>
    );
  }

  const handleSubmit = async (formData) => {
    const result = await handleUpdateEvent(id, formData);

    if (result.success) {
      navigate("/admin/eventos");
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="font-black text-[#1E1E1E]"
          style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)" }}
        >
          Edição de Evento
        </h1>
        <button
          onClick={() => navigate("/admin/eventos")}
          className="w-10 h-10 rounded-full bg-[#FF6D2C] hover:bg-[#e65c18] flex items-center justify-center transition-colors shadow-md"
          title="Voltar"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
      </div>

      {/* Situação (US14) — antes do formulário, porque marcar um evento como
          cancelado costuma ser a razão de abrir esta tela, e porque é uma ação
          isolada: salva sozinha, sem passar pelo formulário. */}
      <SituacaoEventoCard event={event} onChange={setEvent} />

      {/* Formulário pré-preenchido */}
      <EventForm initialData={event} onSubmit={handleSubmit} eventId={id} />
    </div>
  );
}
