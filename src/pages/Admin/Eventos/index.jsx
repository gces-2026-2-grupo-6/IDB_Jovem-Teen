import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { getGroupedEvents, handleDeleteEvent } from "../../../services/eventService";
import usePermissao from "../../../hooks/usePermissao";
import useModal from "../../../hooks/useModal";
import SectionTitle from "../../../components/ui/SectionTitle";
import EmptyState from "../../../components/ui/EmptyState";
import { UpcomingEventRow, PastEventRow } from "./components/EventRow";
import DeleteEventModal from "./components/DeleteEventModal";

export default function AdminEventos() {
  const navigate = useNavigate();
  const deleteModal = useModal();
  /* Excluir conteúdo é restrito ao superadministrador. */
  const { podeExcluir } = usePermissao();
  const [events, setEvents] = useState({ proximos: [], emAndamento: [], anteriores: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const grouped = await getGroupedEvents();
      setEvents(grouped);
    } catch {
      setError("Não foi possível carregar os eventos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleEdit = (id) => {
    navigate(`/admin/eventos/${id}/editar`);
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.data) {
      const result = await handleDeleteEvent(deleteModal.data.id);
      deleteModal.close();
      if (!result.success) {
        setError(result.error);
        return;
      }
      loadEvents();
    }
  };

  const rightContent = (
    <Link
      to="/admin/eventos/criar"
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
    >
      Adicionar Evento
      <Plus size={18} />
    </Link>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <SectionTitle title="Eventos" rightContent={rightContent} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center text-[#1E1E1E]/50 text-sm font-semibold py-8">
          Carregando eventos...
        </div>
      )}

      {/* Próximos Eventos */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-[#1E1E1E] text-lg mb-1">Próximos Eventos</h2>
        <hr className="border-gray-200 mb-3" />

        {events.proximos.length > 0 ? (
          <div>
            {events.proximos.map((event) => (
              <UpcomingEventRow
                key={event.id}
                event={event}
                onEdit={handleEdit}
                onDelete={podeExcluir ? (ev) => deleteModal.open(ev) : undefined}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="Nenhum evento próximo cadastrado." className="border-none shadow-none p-6" />
        )}
      </div>

      {/* Eventos em Andamento */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-[#1E1E1E] text-lg mb-1">Eventos em Andamento</h2>
        <hr className="border-gray-200 mb-3" />

        {events.emAndamento.length > 0 ? (
          <div>
            {events.emAndamento.map((event) => (
              <UpcomingEventRow
                key={event.id}
                event={event}
                onEdit={handleEdit}
                onDelete={podeExcluir ? (ev) => deleteModal.open(ev) : undefined}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="Nenhum evento em andamento no momento." className="border-none shadow-none p-6" />
        )}
      </div>

      {/* Eventos Anteriores */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-[#1E1E1E] text-lg mb-1">Eventos Anteriores</h2>
        <hr className="border-gray-200 mb-3" />

        {events.anteriores.length > 0 ? (
          <div>
            {events.anteriores.map((event) => (
              <PastEventRow key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState message="Nenhum evento anterior encontrado." className="border-none shadow-none p-6" />
        )}
      </div>

      {/* Modal de exclusão */}
      <DeleteEventModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
        eventTitle={deleteModal.data?.title}
      />
    </div>
  );
}
