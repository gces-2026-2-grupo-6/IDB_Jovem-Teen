import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { fetchSpeakerById, handleUpdateSpeaker } from "../../../services/speakerService";
import ConvidadoForm from "./components/ConvidadoForm";

export default function AdminPalestranteEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [convidado, setConvidado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const dados = await fetchSpeakerById(id);
        if (ativo) setConvidado(dados);
      } catch {
        if (ativo) setConvidado(null);
      } finally {
        if (ativo) setLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [id]);

  const handleSubmit = async (dados) => {
    setErro(null);
    const resultado = await handleUpdateSpeaker(id, dados);
    if (!resultado.success) {
      setErro(resultado.error);
      return;
    }
    navigate("/admin/palestrantes");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold text-[#1E1E1E]/60">Carregando convidado...</p>
      </div>
    );
  }

  if (!convidado) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold text-[#1E1E1E]/60 mb-4">Convidado não encontrado.</p>
        <button
          onClick={() => navigate("/admin/palestrantes")}
          className="text-sm font-bold text-[#FF6D2C] hover:underline"
        >
          Voltar para Convidados
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1
          className="font-black text-[#1E1E1E]"
          style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)" }}
        >
          Editar Convidado
        </h1>
        <button
          onClick={() => navigate("/admin/palestrantes")}
          className="w-10 h-10 rounded-full bg-[#FF6D2C] hover:bg-[#e65c18] flex items-center justify-center transition-colors shadow-md"
          title="Voltar"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
      </div>

      <ConvidadoForm initialData={convidado} onSubmit={handleSubmit} erro={erro} />
    </div>
  );
}
