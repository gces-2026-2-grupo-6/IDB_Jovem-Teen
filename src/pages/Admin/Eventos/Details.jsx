import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { fetchEventById, formatDate } from "../../../services/eventService";
import ConvidadosDoEvento from "./components/ConvidadosDoEvento";


export default function AdminEventoDetails() {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="font-black text-[#1E1E1E]"
          style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)" }}
        >
          Detalhes do Evento
        </h1>
        <button
          onClick={() => navigate("/admin/eventos")}
          className="w-10 h-10 rounded-full bg-[#FF6D2C] hover:bg-[#e65c18] flex items-center justify-center transition-colors shadow-md"
          title="Voltar"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
      </div>

      <ConvidadosDoEvento eventId={id} />

      {/* Tabela de detalhes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <tbody className="divide-y divide-gray-100">
            <tr className="border-b border-gray-100">
              <td className="py-4 px-6 font-bold text-[#1E1E1E] text-sm sm:text-base whitespace-nowrap align-top">
                Nome do Evento
              </td>
              <td className="py-4 px-6 font-bold text-[#FF6D2C] text-sm sm:text-base">
                {event.title}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-6 font-bold text-[#1E1E1E] text-sm sm:text-base whitespace-nowrap align-top">
                Descrição do Evento
              </td>
              <td className="py-4 px-6 font-bold text-[#FF6D2C] text-sm sm:text-base">
                {event.description || "—"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-6 font-bold text-[#1E1E1E] text-sm sm:text-base whitespace-nowrap align-top">
                Total de Participantes
              </td>
              <td className="py-4 px-6 font-bold text-[#FF6D2C] text-lg sm:text-xl">
                {event.totalParticipantes ?? 0}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-6 font-bold text-[#1E1E1E] text-sm sm:text-base whitespace-nowrap align-top">
                Total de Voluntários
              </td>
              <td className="py-4 px-6 font-bold text-[#FF6D2C] text-lg sm:text-xl">
                {event.totalVoluntarios ?? 0}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-6 font-bold text-[#1E1E1E] text-sm sm:text-base whitespace-nowrap align-top">
                Local
              </td>
              <td className="py-4 px-6 font-bold text-[#FF6D2C] text-sm sm:text-base">
                {event.location || "—"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-6 font-bold text-[#1E1E1E] text-sm sm:text-base whitespace-nowrap align-top">
                Data
              </td>
              <td className="py-4 px-6 font-bold text-[#FF6D2C] text-sm sm:text-base">
                {formatDate(event.date)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
