import { useState, useEffect } from "react";
import { ShoppingBag, Clock, Loader2, RefreshCw } from "lucide-react";
import {
  fetchAllPedidos,
  handleUpdatePedidoStatus,
  sincronizarTodosOsPedidos,
  computePedidoStats,
} from "../../../services/pedidoService";
import SectionTitle from "../../../components/ui/SectionTitle";
import EmptyState from "../../../components/ui/EmptyState";
import Loading from "../../../components/ui/Loading";
import AdminTable from "../components/AdminTable";
import { StatCard } from "../../../components/card/VolunteerCard";
import PedidoStatusBadge from "./components/PedidoStatusBadge";

const COLUNAS = [
  { key: "produto", label: "Produto", width: "1fr" },
  { key: "solicitante", label: "Solicitante", width: "1fr" },
  { key: "contato", label: "Contato", width: "1fr" },
  { key: "data", label: "Data", width: "120px" },
  { key: "status", label: "Situação", width: "160px" },
];

const GRID = "1fr 1fr 1fr 120px 160px";

/* Mostra a data no fuso de Brasília. O back grava com fuso (timestamptz); aqui
   só a data importa para a administradora acompanhar o pedido. */
function formatarData(iso) {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

/* US21 — tela de pedidos do setor Loja e Produtos.

   CA1: listar os pedidos com produto, solicitante, contato, situação e data,
   do mais recente para o mais antigo (a ordenação vem do servidor).
   CA2: mudar a situação do pedido, no mesmo molde do voluntário.

   O pedido nasce no formulário do Google ligado ao produto; "Sincronizar"
   relê esses formulários e grava um pedido por resposta, sem duplicar. */
export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const lista = await fetchAllPedidos();
        if (!active) return;
        setPedidos(lista);
        setError(null);
      } catch {
        if (active) setError("Não foi possível carregar os pedidos.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onSincronizar = async () => {
    setSincronizando(true);
    const resultado = await sincronizarTodosOsPedidos();
    if (resultado.pedidos) setPedidos(resultado.pedidos);
    if (!resultado.success && resultado.error) alert(resultado.error);
    setSincronizando(false);
  };

  /* Atualização otimista: a situação muda na hora e volta ao estado anterior
     se o servidor recusar — a administradora não espera o ida e volta a cada
     troca. */
  const onStatusChange = async (pedidoId, novoStatus) => {
    const anterior = pedidos;
    setPedidos(anterior.map((p) => (p.id === pedidoId ? { ...p, status: novoStatus } : p)));

    const resultado = await handleUpdatePedidoStatus(pedidoId, novoStatus);
    if (!resultado.success) {
      setPedidos(anterior);
      alert(resultado.error);
    }
  };

  const stats = computePedidoStats(pedidos);

  const rightContent = (
    <button
      onClick={onSincronizar}
      disabled={sincronizando}
      className="flex items-center gap-2 bg-[#FF6D2C] hover:bg-[#e65c18] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
    >
      {sincronizando ? "Sincronizando…" : "Sincronizar"}
      {sincronizando ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <RefreshCw size={16} />
      )}
    </button>
  );

  const renderRow = (pedido, index) => (
    <div
      key={pedido.id}
      className={`grid px-6 py-4 items-center transition-colors hover:bg-gray-50/70 ${
        index < pedidos.length - 1 ? "border-b border-gray-100" : ""
      }`}
      style={{ gridTemplateColumns: GRID }}
    >
      <span className="text-sm text-[#1E1E1E] font-medium truncate pr-3">
        {pedido.produto}
      </span>
      <span className="text-sm text-[#1E1E1E]/70 truncate pr-3">
        {pedido.solicitante}
      </span>
      <span className="text-sm text-[#1E1E1E]/70 truncate pr-3">
        {pedido.contato}
      </span>
      <span className="text-sm text-[#1E1E1E]/60">{formatarData(pedido.criadoEm)}</span>
      <div>
        <PedidoStatusBadge
          status={pedido.status}
          onChange={(novoStatus) => onStatusChange(pedido.id, novoStatus)}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionTitle title="Pedidos" rightContent={rightContent} />

      {loading ? (
        <Loading />
      ) : error ? (
        <EmptyState message={error} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={ShoppingBag}
              label="Total de Pedidos"
              value={stats.total}
              color="text-[#FF6D2C]"
            />
            <StatCard
              icon={Clock}
              label="Pendentes"
              value={stats.pendentes}
              color="text-[#F5C518]"
            />
            <StatCard
              icon={Loader2}
              label="Em andamento"
              value={stats.emAndamento}
              color="text-[#3B82F6]"
            />
          </div>

          <AdminTable
            columns={COLUNAS}
            data={pedidos}
            renderRow={renderRow}
            emptyMessage="Nenhum pedido registrado. Use Sincronizar para buscar as respostas dos formulários."
          />
        </>
      )}
    </div>
  );
}
