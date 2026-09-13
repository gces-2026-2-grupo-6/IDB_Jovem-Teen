import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import Modal from "../../../../components/ui/Modal";

export default function DeleteLeaderModal({ isOpen, onClose, onConfirm, leader }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-xl w-[min(92vw,500px)] flex flex-col gap-3.5">
        {/* Mensagem */}
        <h3 className="text-2xl font-bold text-[#1E1E1E] leading-snug">Excluir diretor/líder?</h3>

        <p className="text-[15px] text-[#1E1E1E]/65 leading-relaxed">
          O registro de <strong className="font-semibold text-[#1E1E1E]/80">{leader?.name}</strong> será
          removido permanentemente, junto com a foto e a mini-biografia. Esta ação não pode ser desfeita.
        </p>

        <p className="flex items-center gap-2 bg-[#FEF0C7] text-[#93370D] text-[13px] font-semibold rounded-lg px-3.5 py-2.5">
          <ShieldAlert size={15} className="shrink-0" />
          Apenas o superadministrador pode excluir registros.
        </p>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-1.5">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#1E1E1E] border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
