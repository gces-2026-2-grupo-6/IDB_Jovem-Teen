import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, ShieldCheck, CheckCircle2 } from "lucide-react";
import { fetchAllLeaders, handleDeleteLeader, splitLeaders } from "../../../services/liderService";
import useModal from "../../../hooks/useModal";
import SectionTitle from "../../../components/ui/SectionTitle";
import EmptyState from "../../../components/ui/EmptyState";
import Loading from "../../../components/ui/Loading";
import LeaderCard from "../../../components/card/LeaderCard";
import DeleteLeaderModal from "./components/DeleteLeaderModal";

const TABS = [
  { key: "atuais", label: "Líderes atuais" },
  { key: "anteriores", label: "Diretores anteriores" },
];

const FLASH_TIMEOUT_MS = 4000;

export default function AdminLideres() {
  const navigate = useNavigate();
  const location = useLocation();
  const deleteModal = useModal();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState("atuais");
  // mensagem de sucesso (vem do state da navegação ou da exclusão nesta tela)
  const [flash, setFlash] = useState(location.state?.flash || null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const all = await fetchAllLeaders();
        if (!active) return;
        setLeaders(all);
        setError(null);
      } catch {
        if (active) setError("Não foi possível carregar os diretores e líderes.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!flash) return;
    // limpa o state da rota para a mensagem não voltar num refresh
    if (location.state?.flash) {
      navigate(location.pathname, { replace: true, state: null });
    }
    const t = setTimeout(() => setFlash(null), FLASH_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [flash, location.pathname, location.state, navigate]);

  const handleEdit = (id) => {
    navigate(`/admin/lideres/${id}/editar`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.data) return;
    const result = await handleDeleteLeader(deleteModal.data.id);
    deleteModal.close();
    if (result.success) {
      setFlash("Diretor/líder excluído com sucesso.");
      setReloadKey((k) => k + 1);
    } else {
      alert(result.error);
    }
  };

  const { current, past } = splitLeaders(leaders);
  const visible = tab === "atuais" ? current : past;
  const emptyMessage =
    tab === "atuais"
      ? "Nenhum líder atual cadastrado."
      : "Nenhum diretor anterior cadastrado. Marque um líder de cargo nacional como \"diretor anterior\" para exibi-lo aqui.";

  const rightContent = (
    <Link
      to="/admin/lideres/criar"
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm whitespace-nowrap"
    >
      Cadastrar Diretor/Líder
      <Plus size={18} />
    </Link>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <SectionTitle title="Diretores & Líderes" rightContent={rightContent} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 bg-[#FFD2A6] text-[#93370D] text-xs font-semibold px-3.5 py-1.5 rounded-full">
            <ShieldCheck size={14} />
            Acesso exclusivo do Superadministrador
          </span>
          {flash && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 bg-[#D1FADF] text-[#05603A] text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#05603A]/20 animate-fade-in"
            >
              <CheckCircle2 size={14} />
              {flash}
            </span>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="space-y-2">
        <div role="tablist" className="inline-flex bg-white border border-gray-200 rounded-[10px] p-1 shadow-sm">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  active ? "bg-[#FF6D2C] text-white shadow-sm" : "text-[#1E1E1E]/70 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-[#1E1E1E]/55">
          A galeria de diretores anteriores contempla apenas o cargo nacional.
        </p>
      </div>

      {/* Estados */}
      {loading ? (
        <Loading />
      ) : error ? (
        <EmptyState message={error} />
      ) : visible.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {visible.map((leader) => (
            <LeaderCard
              key={leader.id}
              leader={leader}
              onEdit={handleEdit}
              onDelete={(l) => deleteModal.open(l)}
            />
          ))}
        </div>
      ) : (
        <EmptyState message={emptyMessage} />
      )}

      {/* Modal de exclusão */}
      <DeleteLeaderModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
        leader={deleteModal.data}
      />
    </div>
  );
}
