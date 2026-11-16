import { CalendarClock, Ban } from "lucide-react";
import { avisoDeSituacao, eventoCancelado, eventoAdiado } from "../../../services/eventService";

/* Aviso de evento cancelado ou adiado (US14, CA2).

   O mesmo componente serve à agenda, ao calendário, à home e à página do
   evento, para que o visitante leia a mesma frase nas quatro telas. Em evento
   ativo os dois componentes não renderizam nada, então quem usa não precisa
   repetir a condição.

   O texto vem do serviço (`avisoDeSituacao`): a regra de quando dizer "Adiado
   para 10/04/2027" e quando dizer "nova data em breve" mora num lugar só. */

function estilo(event) {
  if (eventoCancelado(event)) {
    return {
      Icone: Ban,
      banner: "bg-red-50 border-red-200 text-red-700",
      badge: "bg-red-600 text-white",
    };
  }
  return {
    Icone: CalendarClock,
    banner: "bg-amber-50 border-amber-200 text-amber-800",
    badge: "bg-amber-500 text-white",
  };
}

/* Faixa com o aviso por extenso — para a página do evento e os cards. */
export default function EventStatusNotice({ event, className = "" }) {
  const aviso = avisoDeSituacao(event);
  if (!aviso) return null;

  const { Icone, banner } = estilo(event);

  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${banner} ${className}`}
    >
      <Icone size={16} className="shrink-0" />
      <span>{aviso}</span>
    </div>
  );
}

/* Selo curto — para linhas de lista e sobre a imagem do evento, onde a faixa
   inteira não cabe. O texto completo continua no card, no `EventStatusNotice`. */
export function EventStatusBadge({ event, className = "" }) {
  if (!eventoCancelado(event) && !eventoAdiado(event)) return null;

  const { badge } = estilo(event);
  const rotulo = eventoCancelado(event) ? "Cancelado" : "Adiado";

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge} ${className}`}
    >
      {rotulo}
    </span>
  );
}
