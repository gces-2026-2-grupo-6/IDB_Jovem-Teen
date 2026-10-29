import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleCreateLeader } from "../../../services/liderService";
import SectionTitle from "../../../components/ui/SectionTitle";
import LeaderForm from "../../../components/forms/LeaderForm";

export default function AdminLiderCreate() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setError(null);
    const result = await handleCreateLeader(formData);

    if (result.success) {
      navigate("/admin/lideres", { state: { flash: "Diretor/líder cadastrado com sucesso." } });
      return;
    }

    /* Inclui o 409 de cargo ocupado (US10, CA8), cuja mensagem o back-end já
       monta por extenso. Mostrar no formulário, e não num alerta, mantém os
       dados digitados enquanto a pessoa corrige o cargo. */
    setError(result.error);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle title="Cadastro de Diretor/Líder" onBack={() => navigate("/admin/lideres")} />
      <LeaderForm onSubmit={handleSubmit} submitLabel="Cadastrar" error={error} />
    </div>
  );
}
