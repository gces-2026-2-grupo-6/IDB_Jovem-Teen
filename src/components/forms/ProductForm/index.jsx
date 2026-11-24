import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus } from "lucide-react";
import { toDriveImageUrl } from "../../../utils/driveImage";

export default function ProductForm({ initialData = {}, onSubmit }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: initialData.name || "",
    description: initialData.description || "",
    link: initialData.link || "",
    image: initialData.imageRaw || "",
    // US21: formulário do Google que recebe os pedidos/interesses deste produto.
    formularioPedidoLink: initialData.formularioPedidoLink || "",
  });

  /* O preview escondia a imagem no onError. Formato que o navegador nao abre
     - HEIC de iPhone e o caso comum - sumia sem dizer nada, e a pessoa so
     descobria olhando a loja publica depois. Agora a falha fala. */
  const [previewFalhou, setPreviewFalhou] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "image") setPreviewFalhou(false);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const handleCancel = () => {
    navigate("/admin/produtos");
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {/* Nome */}
        <div className="mb-1">
          <label htmlFor="name" className="block text-sm font-bold text-[#1E1E1E] mb-2">Nome</label>
          <input
            id="name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nome do produto"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all"
            required
          />
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Descrição */}
        <div className="mb-1">
          <label htmlFor="description" className="block text-sm font-bold text-[#1E1E1E] mb-2">Descrição</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Descrição do produto"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all resize-none"
          />
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Link do produto */}
        <div className="mb-1">
          <label htmlFor="link" className="block text-sm font-bold text-[#1E1E1E] mb-2">Link do Produto</label>
          <input
            id="link"
            type="url"
            name="link"
            value={form.link}
            onChange={handleChange}
            placeholder="http://produto.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all"
          />
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Campo "Formulário de Pedido" (US21) retirado em 23/11/2026 junto
            com a tela de Pedidos. O campo formulario_pedido_link continua no
            back-end e no productService; só não é mais oferecido aqui. */}

        {/* Foto do produto (link de compartilhar do Drive) */}
        <div className="mb-1">
          <label htmlFor="image" className="block text-sm font-bold text-[#1E1E1E] mb-2">Foto do Produto</label>
          <div className="relative">
            <input
              id="image"
              type="url"
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="Cole o link da imagem (Google Drive)"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all"
            />
            <ImagePlus size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E1E1E]/30" />
          </div>
          <p className="mt-1.5 text-xs text-[#1E1E1E]/50">
            Cole o link de compartilhar do Drive (arquivo como &quot;qualquer pessoa com o link&quot;).
            Formatos aceitos: <strong>.jpg</strong>, <strong>.png</strong> ou <strong>.webp</strong>.
            Foto de iPhone costuma sair em .heic, que o navegador não exibe.
          </p>
        </div>

        {/* Preview da imagem */}
        {form.image?.trim() && (
          <>
            <hr className="my-5 border-gray-100" />
            <div className="mb-1">
              <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Preview</label>
              <div className="w-32 h-32 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                <img
                  src={toDriveImageUrl(form.image)}
                  alt="Preview do produto"
                  className="w-full h-full object-cover"
                  onLoad={() => setPreviewFalhou(false)}
                  onError={() => setPreviewFalhou(true)}
                />
              </div>
              {previewFalhou && (
                <p
                  role="alert"
                  data-testid="erro-preview-produto"
                  className="mt-2 text-xs text-[#C0504D] max-w-sm"
                >
                  Não foi possível exibir esta imagem. Confira se o arquivo está
                  compartilhado como &quot;qualquer pessoa com o link&quot; e se é
                  .jpg, .png ou .webp &mdash; .heic (foto de iPhone) não aparece no
                  navegador.
                </p>
              )}
            </div>
          </>
        )}

        <hr className="my-5 border-gray-100" />

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
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
          >
            Salvar
          </button>
        </div>
      </div>
    </form>
  );
}
