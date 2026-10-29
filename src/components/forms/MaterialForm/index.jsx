import { useState } from "react";
import { FileText, Image, Video } from "lucide-react";
import { TIPOS_MATERIAL, ROTULO_DO_TIPO } from "../../../services/materialService";

/* Formulário de material (US11).

   O site não recebe upload: o arquivo fica no Drive e o que se cadastra aqui é
   o link de compartilhar. É a mesma decisão da galeria — o servidor guarda
   cadastro e link, nunca o arquivo. */

const INPUT =
  "w-full border border-gray-300 rounded-lg px-4 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all";
const LABEL = "block text-sm font-bold text-[#1E1E1E] mb-2";

const ICONE_DO_TIPO = {
  foto: Image,
  video: Video,
  documento: FileText,
};

export default function MaterialForm({
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
  error = null,
}) {
  const [form, setForm] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    type: initialData.type || "documento",
    link: initialData.link || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {/* Título */}
        <div>
          <label className={LABEL} htmlFor="material-titulo">
            Título
          </label>
          <input
            id="material-titulo"
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ex.: Manual do Líder 2026"
            className={INPUT}
            required
          />
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Tipo — é por ele que o material é identificado na área pública. */}
        <div>
          <span className={LABEL}>Tipo</span>
          <div className="flex flex-wrap gap-3">
            {TIPOS_MATERIAL.map((tipo) => {
              const Icone = ICONE_DO_TIPO[tipo];
              const escolhido = form.type === tipo;
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: tipo }))}
                  aria-pressed={escolhido}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold border-2 transition-colors ${
                    escolhido
                      ? "bg-[#FF6D2C] text-white border-[#FF6D2C]"
                      : "border-gray-200 text-[#1E1E1E]/60 hover:border-[#FF6D2C] hover:text-[#FF6D2C]"
                  }`}
                >
                  <Icone size={16} />
                  {ROTULO_DO_TIPO[tipo]}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Link */}
        <div>
          <label className={LABEL} htmlFor="material-link">
            Link do arquivo
          </label>
          <input
            id="material-link"
            type="url"
            name="link"
            value={form.link}
            onChange={handleChange}
            placeholder="https://drive.google.com/file/d/..."
            className={INPUT}
            required
          />
          <p className="mt-1.5 text-xs text-[#1E1E1E]/50">
            Cole o link de compartilhar do Drive. O arquivo precisa estar compartilhado com a
            conta institucional, a mesma da galeria. Link externo, como um vídeo no YouTube,
            também funciona — nesse caso o botão abre o vídeo em vez de baixar.
          </p>
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Descrição */}
        <div>
          <label className={LABEL} htmlFor="material-descricao">
            Descrição (opcional)
          </label>
          <textarea
            id="material-descricao"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Ex.: Versão para impressão"
            rows={3}
            className={`${INPUT} resize-none`}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-4 py-3"
          >
            {error}
          </div>
        )}

        <hr className="my-5 border-gray-100" />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {saving ? "Salvando..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
