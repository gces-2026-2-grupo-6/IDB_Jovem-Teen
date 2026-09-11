import { AlertCircle } from "lucide-react";
import Modal from "../../../../components/ui/Modal";

export default function DeleteConvidadoModal({ isOpen, convidado, onClose, onConfirm }) {
  const eventos = convidado?.eventos || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-xl max-w-sm w-full text-center">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full border-[3px] border-red-500 flex items-center justify-center">
            <AlertCircle size={36} className="text-red-500" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-[#1E1E1E] leading-snug mb-2">
          Excluir {convidado?.name || "este convidado"}?
        </h3>

        {/* Avisar do vínculo evita apagar alguém que está anunciado num evento
            publicado, o que mudaria a página pública sem a pessoa perceber. */}
        {eventos.length > 0 ? (
          <p className="text-sm text-[#1E1E1E]/70 mb-8">
            {eventos.length === 1
              ? "Este convidado está vinculado a 1 evento"
              : `Este convidado está vinculado a ${eventos.length} eventos`}{" "}
            e deixará de aparecer na página deles.
          </p>
        ) : (
          <p className="text-sm text-[#1E1E1E]/60 mb-8">
            Este convidado não está vinculado a nenhum evento.
          </p>
        )}

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
