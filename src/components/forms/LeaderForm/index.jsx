import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Camera, AlertTriangle } from "lucide-react";
import { toDriveImageUrl } from "../../../utils/driveImage";
import { REGIOES, REGIAO_NACIONAL } from "../../../services/liderService";

const INPUT =
  "w-full border border-gray-300 rounded-lg px-4 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all";
const LABEL = "block text-sm font-bold text-[#1E1E1E] mb-2";

export default function LeaderForm({ initialData = {}, onSubmit, submitLabel = "Salvar" }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: initialData.name || "",
    role: initialData.role || "",
    region: initialData.region || "",
    socialLinks: initialData.socialLinks || "",
    bio: initialData.bio || "",
    image: initialData.imageRaw || "",
    isPast: !!initialData.isPast,
    term: initialData.term || "",
    order: initialData.order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePast = () => {
    setForm((prev) => ({ ...prev, isPast: !prev.isPast }));
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

  const handleCancel = () => {
    navigate("/admin/lideres");
  };

  const previewUrl = form.image.trim() ? toDriveImageUrl(form.image) : "";
  const pastButNotNational = form.isPast && form.region && form.region !== REGIAO_NACIONAL;

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,260px)_1fr] gap-6 md:gap-8">
          {/* Foto (link de compartilhar do Drive) */}
          <div>
            <label className={LABEL}>{initialData.id ? "Editar Foto" : "Adicionar Foto"}</label>
            <div className="aspect-[4/5] w-full rounded-xl border border-gray-300 bg-[#FFF8F3] overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt="Preview da foto"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#1E1E1E]/40">
                  <Camera size={32} />
                  <span className="text-sm font-medium">
                    {initialData.id ? "Editar Foto" : "Adicionar Foto"}
                  </span>
                </div>
              )}
            </div>
            <div className="relative mt-3">
              <input
                type="url"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="Cole o link da foto (Google Drive)"
                className={`${INPUT} pr-10`}
              />
              <ImagePlus size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E1E1E]/30" />
            </div>
            <p className="mt-1.5 text-xs text-[#1E1E1E]/50">
              Cole o link de compartilhar do Drive (arquivo como &quot;qualquer pessoa com o link&quot;).
            </p>
          </div>

          {/* Dados */}
          <div className="space-y-5">
            <div>
              <label className={LABEL}>Nome</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nome do diretor/líder"
                className={INPUT}
                required
              />
            </div>

            <div>
              <label className={LABEL}>Cargo</label>
              <input
                type="text"
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="Ex.: Diretora Nacional de Adolescentes"
                className={INPUT}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
              <div>
                <label className={LABEL}>Região</label>
                <select
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  className={INPUT}
                >
                  <option value="">Selecione a região</option>
                  {REGIOES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Ordem de exibição</label>
                <input
                  type="number"
                  name="order"
                  min={0}
                  value={form.order}
                  onChange={handleChange}
                  className={INPUT}
                />
              </div>
            </div>

            <div>
              <label className={LABEL}>Redes Sociais</label>
              <input
                type="text"
                name="socialLinks"
                value={form.socialLinks}
                onChange={handleChange}
                placeholder="@instagram, link do YouTube… (separe por vírgula)"
                className={INPUT}
              />
            </div>

            {/* Diretor anterior */}
            <div className="flex items-start gap-3.5 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={form.isPast}
                aria-label="Marcar como diretor anterior"
                onClick={togglePast}
                className={`relative shrink-0 w-[52px] h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF6D2C]/30 ${form.isPast ? "bg-green-600" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.isPast ? "translate-x-6" : "translate-x-0"}`}
                />
              </button>
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold text-[#1E1E1E] leading-tight">
                  Marcar como diretor anterior
                </span>
                <span className="text-xs text-[#1E1E1E]/55 leading-snug">
                  A marcação é manual. A galeria de anteriores contempla apenas o cargo nacional.
                </span>
              </div>
            </div>

            {form.isPast && (
              <div className="animate-fade-in space-y-3">
                <div>
                  <label className={LABEL}>Período de gestão</label>
                  <input
                    type="text"
                    name="term"
                    value={form.term}
                    onChange={handleChange}
                    placeholder="Ex.: 2020 – 2023"
                    className={INPUT}
                  />
                </div>
                {pastButNotNational && (
                  <p className="flex items-start gap-2 text-xs font-medium text-[#93370D] bg-[#FEF0C7] rounded-lg px-3.5 py-2.5">
                    <AlertTriangle size={14} className="shrink-0 mt-px" />
                    Este líder não é do cargo nacional e, por isso, não aparecerá na galeria de diretores anteriores.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <hr className="my-6 border-gray-100" />

        {/* Mini-biografia */}
        <div>
          <label className={LABEL}>Mini-Biografia</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="Breve apresentação do diretor/líder"
            rows={6}
            className={`${INPUT} resize-none`}
          />
        </div>

        <hr className="my-6 border-gray-100" />

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
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
