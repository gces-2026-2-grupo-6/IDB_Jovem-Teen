import { ABAS } from "../fluxos";

/* Alternador entre os dois fluxos de inscrição de um evento (US09).

   Os fluxos são listagens separadas, não um filtro sobre a mesma lista: o
   participante não passa por aprovação e o voluntário sim, então as colunas e
   as ações de cada um são diferentes. */
export default function FluxoTabs({ ativo, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Fluxos de inscrição"
      className="flex gap-1 p-1 bg-white rounded-xl border border-gray-100 shadow-sm w-fit"
    >
      {ABAS.map((aba) => {
        const selecionada = aba.id === ativo;
        return (
          <button
            key={aba.id}
            role="tab"
            aria-selected={selecionada}
            onClick={() => onChange(aba.id)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              selecionada
                ? "bg-[#FF6D2C] text-white shadow-sm"
                : "text-[#1E1E1E]/60 hover:text-[#FF6D2C] hover:bg-[#FF6D2C]/5"
            }`}
          >
            {aba.label}
          </button>
        );
      })}
    </div>
  );
}
