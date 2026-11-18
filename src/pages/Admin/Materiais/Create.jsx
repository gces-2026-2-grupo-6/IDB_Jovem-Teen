import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleCreateMaterial } from "../../../services/materialService";
import SectionTitle from "../../../components/ui/SectionTitle";
import MaterialForm from "../../../components/forms/MaterialForm";

export default function AdminMaterialCreate() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setError(null);
    const result = await handleCreateMaterial(formData);

    if (result.success) {
      navigate("/admin/materiais");
      return;
    }

    setError(result.error);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle title="Cadastro de Material" onBack={() => navigate("/admin/materiais")} />
      <MaterialForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/admin/materiais")}
        submitLabel="Cadastrar"
        error={error}
      />
    </div>
  );
}
