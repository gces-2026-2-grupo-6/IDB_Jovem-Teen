import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { handleCreateEvent } from "../../../services/eventService";
import EventForm from "../../../components/forms/EventForm";

export default function AdminEventoCreate() {
  const navigate = useNavigate();
  const { state } = useLocation();

  /* US13: a listagem manda aqui os dados de um evento existente, já sem o que
     pertence à edição anterior. Sem isso, a tela é a criação normal. */
  const copia = state?.duplicarDe ?? null;

  const handleSubmit = async (formData) => {
    const result = await handleCreateEvent(formData);

    if (result.success) {
      /* Vai direto para a programação do evento recém-criado */
      navigate(`/admin/eventos/${result.event.id}/programacao`);
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
          {copia ? "Duplicação de Evento" : "Criação de Evento"}
        </h1>
        <button
          onClick={() => navigate("/admin/eventos")}
          className="w-10 h-10 rounded-full bg-[#FF6D2C] hover:bg-[#e65c18] flex items-center justify-center transition-colors shadow-md"
          title="Voltar"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
      </div>

      {/* Avisa o que não veio junto: herdar data, galeria ou formulário do
          evento anterior seria erro silencioso, então a cópia os deixa em
          branco de propósito. */}
      {copia && (
        <div
          role="status"
          className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-xl px-4 py-3"
        >
          Cópia de um evento existente. Informe as datas: elas não são copiadas, assim como o
          álbum de fotos e os links de inscrição, que pertencem à edição anterior.
        </div>
      )}

      {/* Formulário */}
      <EventForm initialData={copia ?? {}} onSubmit={handleSubmit} />
    </div>
  );
}
