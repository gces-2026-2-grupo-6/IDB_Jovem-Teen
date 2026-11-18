import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMaterialById, handleUpdateMaterial } from "../../../services/materialService";
import SectionTitle from "../../../components/ui/SectionTitle";
import MaterialForm from "../../../components/forms/MaterialForm";
import Loading from "../../../components/ui/Loading";

export default function AdminMaterialEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    fetchMaterialById(id)
      .then((dados) => active && setMaterial(dados))
      .catch(() => active && setMaterial(null))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmit = async (formData) => {
    setError(null);
    const result = await handleUpdateMaterial(id, formData);

    if (result.success) {
      navigate("/admin/materiais");
      return;
    }

    setError(result.error);
  };

  if (loading) {
    return <Loading />;
  }

  if (!material) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold text-[#1E1E1E]/60 mb-4">Material não encontrado.</p>
        <button
          onClick={() => navigate("/admin/materiais")}
          className="text-sm font-bold text-[#FF6D2C] hover:underline"
        >
          Voltar para Materiais
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle title="Edição de Material" onBack={() => navigate("/admin/materiais")} />
      <MaterialForm
        initialData={material}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/admin/materiais")}
        submitLabel="Salvar"
        error={error}
      />
    </div>
  );
}
