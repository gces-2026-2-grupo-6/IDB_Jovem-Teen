import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Mic, Plus, X, Search } from "lucide-react";
import {
  fetchSpeakers,
  fetchSpeakersByEvent,
  filtrarConvidados,
} from "../../../../services/speakerService";
import {
  vincularConvidado,
  desvincularConvidado,
} from "../../../../services/eventService";

/* Convidados do evento na tela de detalhe. Cada ação vale na hora — é onde a
   administradora ajusta o elenco de um evento já criado, sem reabrir o
   formulário inteiro. */
export default function ConvidadosDoEvento({ eventId }) {
  const [vinculados, setVinculados] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [termo, setTermo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = async () => {
    const [lista, todos] = await Promise.all([
      fetchSpeakersByEvent(eventId).catch(() => []),
      fetchSpeakers().catch(() => []),
    ]);
    setVinculados(lista);
    setCatalogo(todos);
  };

  useEffect(() => {
    let ativo = true;

    (async () => {
      const [lista, todos] = await Promise.all([
        fetchSpeakersByEvent(eventId).catch(() => []),
        fetchSpeakers().catch(() => []),
      ]);
      if (!ativo) return;
      setVinculados(lista);
      setCatalogo(todos);
      setCarregando(false);
    })();

    return () => {
      ativo = false;
    };
  }, [eventId]);

  const disponiveis = useMemo(() => {
    const ids = vinculados.map((c) => c.id);
    return filtrarConvidados(catalogo.filter((c) => !ids.includes(c.id)), termo);
  }, [catalogo, vinculados, termo]);

  const adicionar = async (convidado) => {
    setErro(null);
    const resultado = await vincularConvidado(eventId, convidado.id);
    if (!resultado.success) {
      setErro(resultado.error);
      return;
    }
    setTermo("");
    carregar();
  };

  const remover = async (convidado) => {
    setErro(null);
    const resultado = await desvincularConvidado(eventId, convidado.id);
    if (!resultado.success) {
      setErro(resultado.error);
      return;
    }
    carregar();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-bold text-[#1E1E1E] text-lg">
          <Mic size={18} className="text-[#FF6D2C]" />
          Convidados
        </h2>
        <Link
          to="/admin/palestrantes"
          className="text-xs font-semibold text-[#FF6D2C] hover:underline"
        >
          Gerenciar convidados
        </Link>
      </div>

      {erro && <p className="mb-3 text-sm font-semibold text-red-600">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-[#1E1E1E]/40">Carregando convidados...</p>
      ) : (
        <>
          {vinculados.length === 0 ? (
            <p className="text-sm text-[#1E1E1E]/50 mb-4">
              Nenhum convidado vinculado a este evento.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {vinculados.map((convidado) => (
                <span
                  key={convidado.id}
                  className="inline-flex items-center gap-2 bg-[#FFF1E8] border border-[#F0CFB0] rounded-full pl-1.5 pr-2 py-1"
                >
                  <img src={convidado.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-sm font-semibold text-[#1E1E1E]">{convidado.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#B14A08] font-bold">
                    {convidado.funcao}
                  </span>
                  <button
                    type="button"
                    onClick={() => remover(convidado)}
                    aria-label={`Remover ${convidado.name} do evento`}
                    className="text-[#1E1E1E]/40 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E1E1E]/30"
            />
            <input
              type="search"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Vincular convidado já cadastrado"
              aria-label="Buscar convidado para vincular"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all"
            />
          </div>

          {termo.trim() !== "" && (
            <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-48 overflow-y-auto">
              {disponiveis.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[#1E1E1E]/50">
                  Nenhum convidado disponível com esse nome.
                </p>
              ) : (
                disponiveis.map((convidado) => (
                  <button
                    key={convidado.id}
                    type="button"
                    onClick={() => adicionar(convidado)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#FFF8F3] transition-colors text-left"
                  >
                    <img src={convidado.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-[#1E1E1E] truncate">
                        {convidado.name}
                      </span>
                      <span className="block text-xs text-[#1E1E1E]/50">{convidado.role}</span>
                    </span>
                    <Plus size={16} className="text-[#FF6D2C] shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
