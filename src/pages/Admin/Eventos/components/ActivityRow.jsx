import { Pencil, Trash2 } from "lucide-react";

export default function ActivityRow({ item, onEdit, onDelete, showDay = false }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0 group hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
      {showDay && (
        <div className="shrink-0 flex flex-col items-center justify-center bg-[#FDF3EA] rounded-lg px-2.5 py-1.5 min-w-[46px] border border-[#FF6D2C]/20">
          <span className="text-[#FF6D2C] font-bold text-base leading-none">{item.day}</span>
          <span className="text-[#FF6D2C] font-semibold text-[10px] uppercase">{item.month}</span>
        </div>
      )}

      {/* Nome */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1E1E1E] truncate">{item.name}</p>
      </div>

      {/* Descrição */}
      <div className="flex-1 min-w-0 hidden sm:block">
        <p className="text-sm text-[#1E1E1E]/60 truncate">{item.description || "Descrição da atividade"}</p>
      </div>

      {/* Horário */}
      <div className="shrink-0">
        <span className="text-sm font-semibold text-[#1E1E1E]">
          {item.startTime && item.endTime
            ? `${item.startTime} - ${item.endTime}`
            : item.time || "--:--"}
        </span>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
          title="Editar atividade"
        >
          <Pencil size={15} className="text-blue-600" />
        </button>
        {/* Excluir é restrito ao superadministrador: sem handler, sem botão. */}
        {onDelete && (
          <button
            onClick={() => onDelete(item)}
            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
            title="Excluir atividade"
          >
            <Trash2 size={15} className="text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}
