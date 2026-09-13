import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { handleCreateSpeaker } from "../../../services/speakerService";
import ConvidadoForm from "./components/ConvidadoForm";

export default function AdminPalestranteCreate() {
  const navigate = useNavigate();
  const [erro, setErro] = useState(null);

  const handleSubmit = async (dados) => {
    setErro(null);
    const resultado = await handleCreateSpeaker(dados);
    if (!resultado.success) {
      setErro(resultado.error);
      return;
    }
    navigate("/admin/palestrantes");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1
          className="font-black text-[#1E1E1E]"
          style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)" }}
        >
          Novo Convidado
        </h1>
        <button
          onClick={() => navigate("/admin/palestrantes")}
          className="w-10 h-10 rounded-full bg-[#FF6D2C] hover:bg-[#e65c18] flex items-center justify-center transition-colors shadow-md"
          title="Voltar"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
      </div>

      <ConvidadoForm onSubmit={handleSubmit} erro={erro} />
    </div>
  );
}
