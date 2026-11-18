import Dropdown from "../../../../components/ui/Dropdown";

/* Situações do pedido (US21 CA2). Diferem das do voluntário — por isso o
   badge próprio, em vez de reusar o StatusBadge de inscrições. As cores
   seguem a mesma leitura dos demais status do painel: amarelo para o que
   espera ação, azul para o que está em curso, verde para o concluído e
   vermelho para o cancelado. */
const ESTILOS = {
  pendente: {
    bg: "bg-[#F5C518]",
    text: "text-[#1E1E1E]",
    border: "border-[#F5C518]",
    hoverBg: "hover:bg-[#e6b800]",
    optionBg: "bg-[#FFFBE6]",
    optionHover: "hover:bg-[#FFF3B0]",
    optionText: "text-[#8B7000]",
  },
  em_andamento: {
    bg: "bg-[#3B82F6]",
    text: "text-white",
    border: "border-[#3B82F6]",
    hoverBg: "hover:bg-[#2563EB]",
    optionBg: "bg-[#EFF6FF]",
    optionHover: "hover:bg-[#DBEAFE]",
    optionText: "text-[#1E40AF]",
  },
  concluido: {
    bg: "bg-[#22C55E]",
    text: "text-white",
    border: "border-[#22C55E]",
    hoverBg: "hover:bg-[#16A34A]",
    optionBg: "bg-[#F0FDF4]",
    optionHover: "hover:bg-[#DCFCE7]",
    optionText: "text-[#166534]",
  },
  cancelado: {
    bg: "bg-[#EF4444]",
    text: "text-white",
    border: "border-[#EF4444]",
    hoverBg: "hover:bg-[#DC2626]",
    optionBg: "bg-[#FEF2F2]",
    optionHover: "hover:bg-[#FEE2E2]",
    optionText: "text-[#991B1B]",
  },
};

const OPCOES = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

export default function PedidoStatusBadge({ status, onChange }) {
  return (
    <Dropdown value={status} onChange={onChange} options={OPCOES} styles={ESTILOS} />
  );
}
