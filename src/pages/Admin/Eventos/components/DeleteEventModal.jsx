import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import { fetchDeletionSummary } from "../../../../services/eventService";

function plural(n, singular, pluralForm) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/* US20 (Opção A): o evento é excluído junto com as inscrições, a programação
   e os vínculos com convidados. Antes de confirmar, o modal mostra quanto
   será apagado (A1), para a exclusão não ser uma surpresa. */
function ResumoExclusao({ carregando, resumo }) {
  if (carregando) {
    return (
      <p role="status" className="text-sm text-[#1E1E1E]/60 mb-6">
        Conferindo as inscrições do evento...
      </p>
    );
  }

  if (!resumo) {
    return (
      <p role="alert" className="text-sm text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-4 py-3 mb-6 text-left">
        Não foi possível conferir as inscrições deste evento. Se houver alguma,
        ela será apagada junto com o evento.
      </p>
    );
  }

  const inscricoes = resumo.participantes + resumo.voluntarios;
  const extras = [
    resumo.atividades > 0 && plural(resumo.atividades, "atividade da programação", "atividades da programação"),
    resumo.convidados > 0 && plural(resumo.convidados, "vínculo com convidado", "vínculos com convidados"),
  ].filter(Boolean);

  if (inscricoes === 0 && extras.length === 0) {
    return (
      <p data-testid="resumo-exclusao" className="text-sm text-[#1E1E1E]/60 mb-6">
        Este evento não tem inscrições.
      </p>
    );
  }

  return (
    <div
      data-testid="resumo-exclusao"
      role="alert"
      className="text-sm text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 mb-6 text-left space-y-1"
    >
      {inscricoes > 0 && (
        <p className="font-bold">
          {plural(inscricoes, "inscrição será apagada", "inscrições serão apagadas")} junto com o evento:{" "}
          {plural(resumo.participantes, "participante", "participantes")} e{" "}
          {plural(resumo.voluntarios, "voluntário", "voluntários")}.
        </p>
      )}
      {extras.length > 0 && (
        <p>
          {inscricoes > 0 ? "Também saem " : "Saem junto com o evento "}
          {extras.join(" e ")}. O cadastro dos convidados continua.
        </p>
      )}
      <p>O evento também sai da agenda do Google. Essa ação não pode ser desfeita.</p>
    </div>
  );
}

export default function DeleteEventModal({ isOpen, onClose, onConfirm, eventId, excluindo = false }) {
  /* O resumo fica guardado junto com o id do evento a que se refere: ao abrir
     o modal para outro evento, a contagem antiga não aparece nem por um
     instante, e não é preciso zerar estado dentro do efeito. */
  const [carregado, setCarregado] = useState({ eventId: null, resumo: null });

  useEffect(() => {
    if (!isOpen || eventId == null) return undefined;
    let ativo = true;
    fetchDeletionSummary(eventId).then((resumo) => {
      if (ativo) setCarregado({ eventId, resumo });
    });
    return () => {
      ativo = false;
    };
  }, [isOpen, eventId]);

  const carregando = eventId != null && carregado.eventId !== eventId;
  const bloqueado = carregando || excluindo;

  return (
    <Modal isOpen={isOpen} onClose={excluindo ? () => {} : onClose}>
      <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-xl max-w-md w-full text-center">
        {/* Ícone de alerta */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full border-[3px] border-red-500 flex items-center justify-center">
            <AlertCircle size={36} className="text-red-500" />
          </div>
        </div>

        {/* Mensagem */}
        <h3 className="text-lg font-bold text-[#1E1E1E] leading-snug mb-4">
          Tem certeza que deseja excluir este evento?
        </h3>

        <ResumoExclusao carregando={carregando} resumo={carregando ? null : carregado.resumo} />

        {/* Botões */}
        <div className="flex justify-center gap-6">
          <button
            onClick={onConfirm}
            disabled={bloqueado}
            className="px-10 py-3 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {excluindo ? "Excluindo..." : "Sim"}
          </button>
          <button
            onClick={onClose}
            disabled={excluindo}
            className="px-10 py-3 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Não
          </button>
        </div>
      </div>
    </Modal>
  );
}
