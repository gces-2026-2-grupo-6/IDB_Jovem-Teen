import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchLeaderById, handleUpdateLeader } from "../../../services/liderService";
import SectionTitle from "../../../components/ui/SectionTitle";
import LeaderForm from "../../../components/forms/LeaderForm";
import Loading from "../../../components/ui/Loading";

export default function AdminLiderEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [leader, setLeader] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchLeaderById(id);
        if (active) setLeader(data);
      } catch {
        if (active) setLeader(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmit = async (formData) => {
    const result = await handleUpdateLeader(id, formData);

    if (result.success) {
      navigate("/admin/lideres", { state: { flash: "Diretor/líder atualizado com sucesso." } });
    } else {
      alert(result.error);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!leader) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold text-[#1E1E1E]/60 mb-4">Diretor/líder não encontrado.</p>
        <button
          onClick={() => navigate("/admin/lideres")}
          className="text-sm font-bold text-[#FF6D2C] hover:underline"
        >
          Voltar para Diretores &amp; Líderes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle title="Edição de Diretor/Líder" onBack={() => navigate("/admin/lideres")} />
      <LeaderForm initialData={leader} onSubmit={handleSubmit} submitLabel="Salvar" />
    </div>
  );
}
