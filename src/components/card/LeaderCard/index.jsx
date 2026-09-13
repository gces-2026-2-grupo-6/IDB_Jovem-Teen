import { Pencil, Trash2, User } from "lucide-react";
import { isNationalLeader } from "../../../services/liderService";

const PILL = {
  nacional: "bg-[#FFD2A6] text-[#93370D]",
  regional: "bg-[#FFD2A6] text-[#93370D]",
  atual: "bg-[#D1FADF] text-[#05603A]",
  anterior: "bg-gray-200 text-gray-600",
};

function Pill({ kind, children }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none ${PILL[kind]}`}>
      {children}
    </span>
  );
}

export default function LeaderCard({ leader, onEdit, onDelete }) {
  const national = isNationalLeader(leader);
  // anteriores mostram o período de gestão; atuais, a região
  const detail = leader.isPast
    ? leader.term && `Gestão ${leader.term}`
    : leader.region;

  return (
    <article
      className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
      data-testid="leader-card"
    >
      {/* Foto */}
      <div className="h-[150px] rounded-lg bg-[#FFE0D2] overflow-hidden flex items-center justify-center">
        {leader.image ? (
          <img
            src={leader.image}
            alt={leader.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#93370D]">
            <User size={16} />
            Foto
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="font-bold text-lg text-[#1E1E1E] leading-tight truncate">{leader.name}</h3>
        <p className="text-sm font-medium text-[#1E1E1E]/70 leading-snug">{leader.role}</p>
        {detail && <p className="text-xs text-[#1E1E1E]/50">{detail}</p>}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Pill kind={national ? "nacional" : "regional"}>{national ? "Nacional" : "Regional"}</Pill>
        <Pill kind={leader.isPast ? "anterior" : "atual"}>{leader.isPast ? "Anterior" : "Atual"}</Pill>
      </div>

      {/* Ações */}
      <div className="flex gap-3 mt-auto pt-1">
        <button
          onClick={() => onEdit(leader.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Pencil size={14} />
          Editar
        </button>
        <button
          onClick={() => onDelete(leader)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
        >
          <Trash2 size={14} />
          Excluir
        </button>
      </div>
    </article>
  );
}
