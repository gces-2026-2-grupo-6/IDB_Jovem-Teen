import { Globe, MapPin } from "lucide-react";
import { isOnlineEvent } from "../../../services/eventService";

/* Selo de modalidade do evento (US19, CA5). Texto escuro sobre fundo claro
   para manter o contraste acima de 4,5:1 nos dois casos. */
const ESTILOS = {
  online: { rotulo: "Online", Icone: Globe, classes: "bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]" },
  presencial: { rotulo: "Presencial", Icone: MapPin, classes: "bg-[#FFF1E8] text-[#9A3412] border-[#FED7AA]" },
};

export default function ModalidadeBadge({ event, className = "" }) {
  const { rotulo, Icone, classes } = ESTILOS[isOnlineEvent(event) ? "online" : "presencial"];

  return (
    <span
      data-testid="selo-modalidade"
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${classes} ${className}`}
    >
      <Icone size={12} aria-hidden="true" />
      {rotulo}
    </span>
  );
}
