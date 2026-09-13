import { useNavigate } from "react-router-dom";
import { handleCreateLeader } from "../../../services/liderService";
import SectionTitle from "../../../components/ui/SectionTitle";
import LeaderForm from "../../../components/forms/LeaderForm";

export default function AdminLiderCreate() {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    const result = await handleCreateLeader(formData);

    if (result.success) {
      navigate("/admin/lideres", { state: { flash: "Diretor/líder cadastrado com sucesso." } });
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle title="Cadastro de Diretor/Líder" onBack={() => navigate("/admin/lideres")} />
      <LeaderForm onSubmit={handleSubmit} submitLabel="Cadastrar" />
    </div>
  );
}
