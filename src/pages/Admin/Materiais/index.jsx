import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, ExternalLink, FileText, Image, Video } from "lucide-react";
import {
  fetchAllMaterials,
  handleDeleteMaterial,
  ROTULO_DO_TIPO,
} from "../../../services/materialService";
import usePermissao from "../../../hooks/usePermissao";
import useModal from "../../../hooks/useModal";
import SectionTitle from "../../../components/ui/SectionTitle";
import EmptyState from "../../../components/ui/EmptyState";
import Loading from "../../../components/ui/Loading";
import DeleteMaterialModal from "./components/DeleteMaterialModal";

/* Painel de materiais (US11, CA1, CA2 e CA4).

   A tela inteira é exclusiva da superadministradora: "só o superadmin envia".
   A rota já exige o papel, e o servidor recusa a escrita de qualquer outro —
   esta tela só evita oferecer o que seria recusado. */

const ICONE_DO_TIPO = {
  foto: Image,
  video: Video,
  documento: FileText,
};

function MaterialRow({ material, onEdit, onDelete }) {
  const Icone = ICONE_DO_TIPO[material.type] || FileText;

  return (
    <div
      data-testid="material-row"
      className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors"
    >
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#FFD9B3] text-[#8A3816] shrink-0">
        <Icone size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#1E1E1E] truncate">{material.title}</p>
        <span className="text-xs text-[#1E1E1E]/50">
          {ROTULO_DO_TIPO[material.type] || material.type}
          {material.description ? ` · ${material.description}` : ""}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href={material.link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          title="Abrir o arquivo no Drive"
        >
          <ExternalLink size={16} className="text-[#1E1E1E]/60" />
        </a>
        <button
          onClick={() => onEdit(material.id)}
          className="w-9 h-9 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
          title="Editar"
        >
          <Pencil size={16} className="text-green-600" />
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(material)}
            className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
            title="Excluir"
          >
            <Trash2 size={16} className="text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminMateriais() {
  const navigate = useNavigate();
  const { podeExcluir } = usePermissao();
  const deleteModal = useModal();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchAllMaterials()
      .then((lista) => {
        if (!active) return;
        setMaterials(lista);
        setError(null);
      })
      .catch(() => active && setError("Não foi possível carregar os materiais."))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const handleConfirmDelete = async () => {
    if (!deleteModal.data) return;
    const result = await handleDeleteMaterial(deleteModal.data.id);
    deleteModal.close();
    if (result.success) {
      /* CA4: excluído aqui, some também da área pública — ela lê a mesma
         lista, então basta recarregar. */
      setReloadKey((k) => k + 1);
    } else {
      setError(result.error);
    }
  };

  const rightContent = (
    <Link
      to="/admin/materiais/criar"
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
    >
      Cadastrar Material
      <Plus size={18} />
    </Link>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionTitle title="Materiais" rightContent={rightContent} />

      <p className="text-sm text-[#1E1E1E]/50 -mt-4">
        Vídeos, fotos e documentos que qualquer visitante baixa pelo site, sem precisar entrar.
        O arquivo continua no Drive: aqui se cadastra o link.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
        {loading ? (
          <Loading />
        ) : materials.length > 0 ? (
          <div>
            {materials.map((material) => (
              <MaterialRow
                key={material.id}
                material={material}
                onEdit={(id) => navigate(`/admin/materiais/${id}/editar`)}
                onDelete={podeExcluir ? (m) => deleteModal.open(m) : undefined}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            message="Nenhum material cadastrado ainda."
            className="border-none shadow-none p-6"
          />
        )}
      </div>

      <DeleteMaterialModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
        materialTitle={deleteModal.data?.title}
      />
    </div>
  );
}
