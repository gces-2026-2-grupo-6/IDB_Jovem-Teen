import { AlertCircle } from "lucide-react";
import Modal from "../../../../components/ui/Modal";

export default function DeleteMaterialModal({ isOpen, onClose, onConfirm, materialTitle }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-xl max-w-sm w-full text-center">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full border-[3px] border-red-500 flex items-center justify-center">
            <AlertCircle size={36} className="text-red-500" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-[#1E1E1E] leading-snug mb-2">
          Excluir {materialTitle ? `“${materialTitle}”` : "este material"}?
        </h3>
        {/* O arquivo não é apagado do Drive: o site só guarda o cadastro e o
            link. Dizer isso evita a dúvida na hora de confirmar. */}
        <p className="text-sm text-[#1E1E1E]/50 mb-8">
          Ele deixa de aparecer na área pública. O arquivo continua no Drive.
        </p>

        <div className="flex justify-center gap-6">
          <button
            onClick={onConfirm}
            className="px-10 py-3 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm min-w-[120px]"
          >
            Sim
          </button>
          <button
            onClick={onClose}
            className="px-10 py-3 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm min-w-[120px]"
          >
            Não
          </button>
        </div>
      </div>
    </Modal>
  );
}
