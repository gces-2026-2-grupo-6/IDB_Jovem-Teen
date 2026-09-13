import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { fetchAdmins, handleDeleteAdmin } from "../../../services/adminService";
import useModal from "../../../hooks/useModal";
import usePermissao from "../../../hooks/usePermissao";
import SectionTitle from "../../../components/ui/SectionTitle";
import EmptyState from "../../../components/ui/EmptyState";
import DeleteAdminModal from "./components/DeleteAdminModal";

export default function AdminAdministradores() {
  const deleteModal = useModal();
  const { usuario, ROTULO_DO_SETOR, setores } = usePermissao();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Recarrega depois de remover alguém. Fora do efeito porque parte de uma ação
     da pessoa, não da montagem da tela. */
  const recarregar = async () => {
    setLoading(true);
    try {
      setAdmins(await fetchAdmins());
    } catch {
      setError("Não foi possível carregar os administradores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const lista = await fetchAdmins();
        if (ativo) setAdmins(lista);
      } catch {
        if (ativo) setError("Não foi possível carregar os administradores.");
      } finally {
        if (ativo) setLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  /* Remover a si mesma tiraria da superadministradora o acesso que ela usa para
     gerenciar as demais — e não há como desfazer pelo painel. */
  const ehVoceMesma = (admin) =>
    Boolean(usuario?.id) && admin.keycloakId === usuario.id;

  const confirmarExclusao = async () => {
    const alvo = deleteModal.data;
    if (!alvo) return;
    const resultado = await handleDeleteAdmin(alvo.id);
    deleteModal.close();
    if (!resultado.success) {
      setError(resultado.error);
      return;
    }
    recarregar();
  };

  const rightContent = (
    <Link
      to="/admin/administradores/criar"
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
    >
      Adicionar Administrador
      <Plus size={18} />
    </Link>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionTitle title="Administradores" rightContent={rightContent} />

      {error && (
        <EmptyState message={error} className="border-red-100 bg-red-50/60 text-red-700" />
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        {loading ? (
          <p className="py-3 text-sm text-[#1E1E1E]/40">Carregando administradores...</p>
        ) : admins.length === 0 ? (
          <EmptyState message="Nenhum administrador cadastrado." />
        ) : (
          <div className="divide-y divide-gray-50">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center gap-4 py-3.5 px-2 rounded-lg hover:bg-gray-50/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#FFD9B3] flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} className="text-[#B14A08]" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1E1E1E] truncate">
                    {admin.nome}
                    {ehVoceMesma(admin) && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#B14A08] bg-[#FFF1E8] px-2 py-0.5 rounded">
                        você
                      </span>
                    )}
                  </p>
                  <span className="text-xs text-[#1E1E1E]/50 truncate block">{admin.email}</span>
                </div>

                <div className="hidden sm:block text-xs text-[#1E1E1E]/40 max-w-[220px] text-right">
                  {ehVoceMesma(admin)
                    ? setores.map((s) => ROTULO_DO_SETOR[s]).join(" · ")
                    : "Setores definidos no Keycloak"}
                </div>

                <button
                  onClick={() => deleteModal.open(admin)}
                  disabled={ehVoceMesma(admin)}
                  title={
                    ehVoceMesma(admin)
                      ? "Você não pode remover o seu próprio acesso"
                      : "Remover administrador"
                  }
                  className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-red-50"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-[#1E1E1E]/50 max-w-2xl">
        Cadastrar aqui dá à pessoa acesso ao painel. Quais setores ela administra é
        definido pelos papéis no Keycloak — esta tela não altera papéis.
      </p>

      <DeleteAdminModal
        isOpen={deleteModal.isOpen}
        admin={deleteModal.data}
        onClose={deleteModal.close}
        onConfirm={confirmarExclusao}
      />
    </div>
  );
}
