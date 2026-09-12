import { ChevronDown } from "lucide-react";

const tiposEvento = ["Tipo de evento", "Conferência", "Acampamento", "Campanha Nacional", "Outros"];
const regioes = ["Região", "Norte", "Nordeste", "Centro-Oeste", "Sul", "Sudeste"];
const datas = ["Data", "Esta semana", "Este mês", "Próximos 3 meses"];

function FilterSelect({ id, options, value, onChange }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#FF6D2C] text-white font-semibold text-sm pl-4 pr-9 py-2.5 rounded-lg cursor-pointer focus:outline-none hover:bg-[#e65c18] transition-colors min-w-[130px]"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-white text-[#1E1E1E]">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none"
      />
    </div>
  );
}

export default function EventFilters({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <FilterSelect
        id="filter-tipo"
        label="Tipo de evento"
        options={tiposEvento}
        value={filters.tipo}
        onChange={(v) => onChange({ ...filters, tipo: v })}
      />
      <FilterSelect
        id="filter-regiao"
        label="Região"
        options={regioes}
        value={filters.regiao}
        onChange={(v) => onChange({ ...filters, regiao: v })}
      />
      <FilterSelect
        id="filter-data"
        label="Data"
        options={datas}
        value={filters.data}
        onChange={(v) => onChange({ ...filters, data: v })}
      />
    </div>
  );
}
