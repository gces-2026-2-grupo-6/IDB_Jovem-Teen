import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, ImagePlus, Plus, Trash2, Link2 } from "lucide-react";
import {
  FUNCOES,
  LIMITE_MINI_BIO,
  normalizarFuncao,
} from "../../../../services/speakerService";
import { toDriveImageUrl } from "../../../../utils/driveImage";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-4 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all";

const REDES_SUGERIDAS = ["Instagram", "YouTube", "Spotify", "Site", "Facebook"];

function linhaVazia() {
  return { rede: "", url: "" };
}

function comLinhaPadrao(redes) {
  return redes.length > 0 ? redes : [linhaVazia()];
}

/* Formulário de convidado, usado no cadastro e na edição. A única diferença
   entre os dois é o que chega em `initialData` e o texto do botão. */
export default function ConvidadoForm({ initialData = {}, onSubmit, erro }) {
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({
    name: initialData.name || "",
    /* Cadastro antigo pode ter profissão fora das três funções; a derivação
       escolhe a mais próxima em vez de esvaziar o campo. */
    role: initialData.role
      ? normalizarFuncao(initialData.role)
      : FUNCOES[0],
    image: initialData.photoLink || "",
    miniBio: initialData.miniBio || "",
  });

  const [redes, setRedes] = useState(comLinhaPadrao(initialData.redes || []));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const mudarRede = (index, campo, valor) =>
    setRedes((prev) => prev.map((r, i) => (i === index ? { ...r, [campo]: valor } : r)));
  const adicionarRede = () => setRedes((prev) => [...prev, linhaVazia()]);
  const removerRede = (index) =>
    setRedes((prev) => comLinhaPadrao(prev.filter((_, i) => i !== index)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await onSubmit({
        ...form,
        redes: redes.filter((r) => r.rede.trim() && r.url.trim()),
      });
    } finally {
      setEnviando(false);
    }
  };

  const restante = LIMITE_MINI_BIO - form.miniBio.length;

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {erro && (
          <p className="mb-5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {erro}
          </p>
        )}

        {/* Nome */}
        <div className="mb-1">
          <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Nome</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nome do convidado ou da banda"
            className={inputClass}
            required
          />
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Função */}
        <div className="mb-1">
          <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E] mb-2">
            <User size={16} className="text-[#FF6D2C]" />
            Função
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className={`${inputClass} sm:max-w-md`}
            required
          >
            {FUNCOES.map((funcao) => (
              <option key={funcao} value={funcao}>
                {funcao}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-[#1E1E1E]/50">
            A função separa os convidados na página pública do evento.
          </p>
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Foto */}
        <div className="mb-1">
          <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E] mb-2">
            <ImagePlus size={16} className="text-[#FF6D2C]" />
            Foto
          </label>
          <input
            type="text"
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="Cole o link da foto (Google Drive)"
            className={inputClass}
          />
          {form.image?.trim() ? (
            <div className="mt-3">
              <img
                src={toDriveImageUrl(form.image)}
                alt="Prévia da foto"
                className="w-24 h-24 rounded-full object-cover border border-gray-200"
              />
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-[#1E1E1E]/50">
              Sem foto, o convidado usa a imagem padrão do IDB Jovem.
            </p>
          )}
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Mini-biografia */}
        <div className="mb-1">
          <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Mini-biografia</label>
          <textarea
            name="miniBio"
            value={form.miniBio}
            onChange={handleChange}
            placeholder="Uma linha ou duas sobre o convidado"
            rows={3}
            maxLength={LIMITE_MINI_BIO}
            className={`${inputClass} resize-none`}
          />
          <p
            className={`mt-1.5 text-xs ${restante < 30 ? "text-[#D5650D]" : "text-[#1E1E1E]/50"}`}
          >
            {restante} caracteres restantes
          </p>
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Redes sociais */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E]">
              <Link2 size={16} className="text-[#FF6D2C]" />
              Redes sociais
            </label>
            <button
              type="button"
              onClick={adicionarRede}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#FF6D2C] hover:text-[#e65c18] transition-colors"
            >
              <Plus size={18} />
              Adicionar
            </button>
          </div>

          <div className="space-y-3">
            {redes.map((rede, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  list="redes-sugeridas"
                  aria-label={`Rede ${index + 1}`}
                  value={rede.rede}
                  onChange={(e) => mudarRede(index, "rede", e.target.value)}
                  placeholder="Instagram"
                  className={`${inputClass} sm:w-[190px]`}
                />
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    aria-label={`Endereço da rede ${index + 1}`}
                    value={rede.url}
                    onChange={(e) => mudarRede(index, "url", e.target.value)}
                    placeholder="instagram.com/perfil"
                    className={`${inputClass} flex-1 min-w-0`}
                  />
                  <button
                    type="button"
                    onClick={() => removerRede(index)}
                    aria-label={`Remover rede ${index + 1}`}
                    className="w-11 h-11 shrink-0 rounded-lg border border-gray-300 bg-[#FFF8F3] flex items-center justify-center text-[#1E1E1E]/40 hover:text-red-500 hover:border-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <datalist id="redes-sugeridas">
            {REDES_SUGERIDAS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <p className="mt-1.5 text-xs text-[#1E1E1E]/50">
            Pode colar o endereço sem o “https://”.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-8">
          <button
            type="button"
            onClick={() => navigate("/admin/palestrantes")}
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
  );
}
