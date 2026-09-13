import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  fetchSpeakers,
  fetchSpeakersByEvent,
  handleDeleteSpeaker,
  filtrarConvidados,
  normalizarFuncao,
} from "../../../services/speakerService";
import { fetchAllEvents } from "../../../services/eventService";
import useModal from "../../../hooks/useModal";
import usePermissao from "../../../hooks/usePermissao";
import SectionTitle from "../../../components/ui/SectionTitle";
import EmptyState from "../../../components/ui/EmptyState";
import DeleteConvidadoModal from "./components/DeleteConvidadoModal";

export default function AdminPalestrantes() {
  const navigate = useNavigate();
  const deleteModal = useModal();
  const { podeExcluir } = usePermissao();

  const [convidados, setConvidados] = useState([]);
  const [vinculos, setVinculos] = useState({});
  const [termo, setTermo] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  /* Quantos eventos usam cada convidado. Serve para avisar antes de excluir —
     apagar um convidado vinculado o remove de eventos já publicados. */
  const carregarVinculos = async () => {
    const eventos = await fetchAllEvents().catch(() => []);
    const porEvento = await Promise.all(
      eventos.map((ev) =>
        fetchSpeakersByEvent(ev.id)
          .then((lista) => ({ evento: ev, lista }))
          .catch(() => ({ evento: ev, lista: [] }))
      )
    );

    const contagem = {};
    for (const { evento, lista } of porEvento) {
      for (const convidado of lista) {
        contagem[convidado.id] = contagem[convidado.id] || [];
        contagem[convidado.id].push(evento.title);
      }
    }
    return contagem;
  };

  const recarregar = async () => {
    setLoading(true);
    try {
      const [lista, contagem] = await Promise.all([fetchSpeakers(), carregarVinculos()]);
      setConvidados(lista);
      setVinculos(contagem);
    } catch {
      setErro("Não foi possível carregar os convidados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const [lista, contagem] = await Promise.all([fetchSpeakers(), carregarVinculos()]);
        if (!ativo) return;
        setConvidados(lista);
        setVinculos(contagem);
      } catch {
        if (ativo) setErro("Não foi possível carregar os convidados.");
      } finally {
        if (ativo) setLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  const visiveis = useMemo(() => filtrarConvidados(convidados, termo), [convidados, termo]);

  const confirmarExclusao = async () => {
    const alvo = deleteModal.data;
    if (!alvo) return;
    const resultado = await handleDeleteSpeaker(alvo.id);
    deleteModal.close();
    if (!resultado.success) {
      setErro(resultado.error);
      return;
    }
    recarregar();
  };

  const rightContent = (
    <Link
      to="/admin/palestrantes/criar"
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
    >
      Adicionar Convidado
      <Plus size={18} />
    </Link>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionTitle title="Convidados" rightContent={rightContent} />

      {erro && <EmptyState message={erro} className="border-red-100 bg-red-50/60 text-red-700" />}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        {/* Busca */}
        <div className="relative mb-5">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E1E1E]/30"
          />
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar por nome ou função"
            aria-label="Buscar convidado"
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all"
          />
        </div>

        {loading ? (
          <p className="py-3 text-sm text-[#1E1E1E]/40">Carregando convidados...</p>
        ) : convidados.length === 0 ? (
          <EmptyState message="Nenhum convidado cadastrado. Cadastre uma vez e reaproveite em todos os eventos." />
        ) : visiveis.length === 0 ? (
          <EmptyState message={`Nenhum convidado encontrado para “${termo}”.`} />
        ) : (
          <div className="divide-y divide-gray-50">
            {visiveis.map((convidado) => {
              const eventos = vinculos[convidado.id] || [];
              return (
                <div
                  key={convidado.id}
                  className="flex items-center gap-4 py-3.5 px-2 rounded-lg hover:bg-gray-50/50 transition-colors"
                >
                  <img
                    src={convidado.image}
                    alt={convidado.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-100"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#1E1E1E] truncate">
                      {convidado.name}
                    </p>
                    <span className="text-xs text-[#1E1E1E]/50">
                      {convidado.role || normalizarFuncao(convidado.role)}
                    </span>
                  </div>

                  {/* O reaproveitamento é o ponto da história: mostrar em quantos
                      eventos o convidado já está torna isso visível. */}
                  <div className="hidden sm:block text-xs text-[#1E1E1E]/40 max-w-[200px] text-right">
                    {eventos.length === 0
                      ? "Ainda não vinculado"
                      : eventos.length === 1
                        ? "Em 1 evento"
                        : `Em ${eventos.length} eventos`}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/admin/palestrantes/${convidado.id}/editar`)}
                      className="w-9 h-9 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                      title="Editar"
                    >
                      <Pencil size={16} className="text-green-600" />
                    </button>

                    {/* Excluir é restrito ao superadministrador (US03). */}
                    {podeExcluir && (
                      <button
                        onClick={() => deleteModal.open({ ...convidado, eventos })}
                        className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DeleteConvidadoModal
        isOpen={deleteModal.isOpen}
        convidado={deleteModal.data}
        onClose={deleteModal.close}
        onConfirm={confirmarExclusao}
      />
    </div>
  );
}
