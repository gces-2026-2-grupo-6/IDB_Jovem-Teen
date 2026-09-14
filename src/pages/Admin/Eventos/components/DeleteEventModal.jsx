import { AlertCircle } from "lucide-react";
import Modal from "../../../../components/ui/Modal";

export default function DeleteEventModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-xl max-w-sm w-full text-center">
        {/* Ícone de alerta */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full border-[3px] border-red-500 flex items-center justify-center">
            <AlertCircle size={36} className="text-red-500" />
          </div>
        </div>

        {/* Mensagem */}
        <h3 className="text-lg font-bold text-[#1E1E1E] leading-snug mb-8">
          Tem certeza que deseja excluir este evento?
        </h3>

        {/* Botões */}
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
