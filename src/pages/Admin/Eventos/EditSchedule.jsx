import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import {
  fetchEventById,
  fetchActivities,
  handleCreateActivity,
  handleUpdateActivity,
  handleDeleteActivity,
} from "../../../services/eventService";
import useModal from "../../../hooks/useModal";
import SectionTitle from "../../../components/ui/SectionTitle";
import EmptyState from "../../../components/ui/EmptyState";
import DeleteActivityModal from "./components/DeleteActivityModal";
import ActivityRow from "./components/ActivityRow";
import ActivityInlineForm from "./components/ActivityInlineForm";
import usePermissao from "../../../hooks/usePermissao";

export default function AdminEventoEditSchedule() {
  const { podeExcluir } = usePermissao();
  const navigate = useNavigate();
  const { id } = useParams();
  const deleteModal = useModal();

  const [event, setEvent] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ev, atividades] = await Promise.all([
        fetchEventById(id),
        fetchActivities(id),
      ]);
      setEvent(ev);
      setSchedule(atividades);
    } catch {
      setError("Não foi possível carregar a programação.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBack = () => {
    navigate(`/admin/eventos/${id}/editar`);
  };

  /* Adicionar nova atividade */
  const handleAddActivity = async (data) => {
    const result = await handleCreateActivity(id, data, event?.date);
    if (!result.success) {
      alert(result.error);
      return;
    }
    setShowAddForm(false);
    loadData();
  };

  /* Editar atividade */
  const handleEditActivity = async (data) => {
    const result = await handleUpdateActivity(editingItem.id, data, event?.date);
    if (!result.success) {
      alert(result.error);
      return;
    }
    setEditingItem(null);
    loadData();
  };

  /* Excluir atividade */
  const handleConfirmDelete = async () => {
    if (deleteModal.data) {
      const result = await handleDeleteActivity(deleteModal.data.id);
      deleteModal.close();
      if (!result.success) {
        alert(result.error);
        return;
      }
      loadData();
    }
  };

  const dayKey = (v) => (String(v || "").match(/\d{4}-\d{2}-\d{2}/) || [""])[0];
  const isMultiDay = !!event && dayKey(event.endDate) !== "" && dayKey(event.endDate) !== dayKey(event.date);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold text-[#1E1E1E]/60">Carregando programação...</p>
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
      <SectionTitle
        title="Programação do Evento"
        onBack={handleBack}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Card da Programação */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
        {/* Lista de atividades */}
        {schedule.length > 0 ? (
          <div>
            {schedule.map((item) => (
              <div key={item.id}>
                {editingItem?.id === item.id ? (
                  <ActivityInlineForm
                    initialData={item}
                    onSave={handleEditActivity}
                    onCancel={() => setEditingItem(null)}
                    eventStart={event?.date}
                    eventEnd={event?.endDate}
                  />
                ) : (
                  <ActivityRow
                    item={item}
                    onEdit={(it) => setEditingItem(it)}
                    onDelete={podeExcluir ? (it) => deleteModal.open(it) : undefined}
                    showDay={isMultiDay}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          !showAddForm && (
            <EmptyState message="Nenhuma atividade cadastrada." className="border-none shadow-none p-6" />
          )
        )}

        {/* Botão Adicionar */}
        {!showAddForm && !editingItem && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="text-[#FF6D2C] hover:text-[#e65c18] transition-colors"
              title="Adicionar atividade"
            >
              <PlusCircle size={32} />
            </button>
          </div>
        )}

        {/* Formulário de adicionar */}
        {showAddForm && (
          <ActivityInlineForm
            onSave={handleAddActivity}
            onCancel={() => setShowAddForm(false)}
            eventStart={event?.date}
            eventEnd={event?.endDate}
          />
        )}

        {/* Botão Concluir */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleBack}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
          >
            Concluir
          </button>
        </div>
      </div>

      {/* Modal de exclusão de atividade */}
      <DeleteActivityModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
