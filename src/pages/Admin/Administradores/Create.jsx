import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { handleCreateAdmin } from "../../../services/adminService";
import usePermissao from "../../../hooks/usePermissao";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-4 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all";

export default function AdminAdministradorCreate() {
  const navigate = useNavigate();
  const { SETORES, ROTULO_DO_SETOR } = usePermissao();

  const [form, setForm] = useState({ nome: "", email: "", keycloakId: "" });
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await handleCreateAdmin(form);
      if (!resultado.success) {
        setErro(resultado.error);
        return;
      }
      navigate("/admin/administradores");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1
          className="font-black text-[#1E1E1E]"
          style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)" }}
        >
          Novo Administrador
        </h1>
        <button
          onClick={() => navigate("/admin/administradores")}
          className="w-10 h-10 rounded-full bg-[#FF6D2C] hover:bg-[#e65c18] flex items-center justify-center transition-colors shadow-md"
          title="Voltar"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {erro && (
            <p className="mb-5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {erro}
            </p>
          )}

          <div className="mb-1">
            <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Nome</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Nome completo"
              className={inputClass}
              required
            />
          </div>

          <hr className="my-5 border-gray-100" />

          <div className="mb-1">
            <label className="block text-sm font-bold text-[#1E1E1E] mb-2">E-mail</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="pessoa@exemplo.com"
              className={inputClass}
              required
            />
          </div>

          <hr className="my-5 border-gray-100" />

          <div className="mb-1">
            <label className="block text-sm font-bold text-[#1E1E1E] mb-2">
              ID do Keycloak
            </label>
            <input
              type="text"
              name="keycloakId"
              value={form.keycloakId}
              onChange={handleChange}
              placeholder="Identificador da conta no Keycloak"
              className={inputClass}
              required
            />
            <p className="mt-1.5 text-xs text-[#1E1E1E]/50">
              É o identificador da pessoa no Keycloak. Copie do cadastro de usuário lá.
            </p>
          </div>

          <hr className="my-5 border-gray-100" />

          {/* Os setores não são editáveis aqui: quem concede é o Keycloak, pelos
              papéis do usuário. Listar os setores existentes evita a dúvida de
              onde isso se define. */}
          <div className="mb-1">
            <span className="block text-sm font-bold text-[#1E1E1E] mb-2">Setores</span>
            <div className="flex flex-wrap gap-2 mb-2">
              {SETORES.map((setor) => (
                <span
                  key={setor}
                  className="text-xs font-semibold text-[#B14A08] bg-[#FFF1E8] border border-[#F0CFB0] px-3 py-1.5 rounded-lg"
                >
                  {ROTULO_DO_SETOR[setor]}
                </span>
              ))}
            </div>
            <p className="text-xs text-[#1E1E1E]/50">
              Os setores que a pessoa administra vêm dos papéis dela no Keycloak, e uma
              mesma pessoa pode responder por mais de um. Este cadastro dá o acesso ao
              painel; o papel define o que ela vê.
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-8">
            <button
              type="button"
              onClick={() => navigate("/admin/administradores")}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {enviando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
