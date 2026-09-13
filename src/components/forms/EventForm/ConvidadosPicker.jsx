import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Mic, Plus, X, Search, UserPlus } from "lucide-react";
import {
  fetchSpeakers,
  fetchSpeakersByEvent,
  handleCreateSpeaker,
  filtrarConvidados,
  FUNCOES,
} from "../../../services/speakerService";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-4 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all";

/* Seleção de convidados do evento.

   Antes esta parte do formulário era texto livre, e o vínculo era resolvido
   comparando nomes: dois "Pr. Samuel" viravam um só, e um nome corrigido criava
   um convidado novo. Agora a pessoa escolhe de quem já está cadastrado, e o que
   viaja para a API é o id — que é o que torna o reaproveitamento confiável.

   Quem ainda não existe pode ser criado aqui mesmo, sem perder o que já foi
   preenchido no evento. */
export default function ConvidadosPicker({ eventId, selecionados, onChange }) {
  const [convidados, setConvidados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [termo, setTermo] = useState("");
  const [abrindoCadastro, setAbrindoCadastro] = useState(false);
  const [novo, setNovo] = useState({ name: "", role: FUNCOES[0] });
  const [erroNovo, setErroNovo] = useState(null);
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  /* Carrega o catálogo e, na edição, quem já está vinculado ao evento. */
  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const [catalogo, vinculados] = await Promise.all([
          fetchSpeakers().catch(() => []),
          eventId ? fetchSpeakersByEvent(eventId).catch(() => []) : Promise.resolve([]),
        ]);
        if (!ativo) return;
        setConvidados(catalogo);
        /* Confirma o que veio mesmo quando não há ninguém vinculado: é isso que
           tira o formulário do estado "ainda não sei" e libera a sincronização. */
        onChange(vinculados.map((c) => c.id));
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const escolhidos = useMemo(
    () => selecionados.map((id) => convidados.find((c) => c.id === id)).filter(Boolean),
    [selecionados, convidados]
  );

  const disponiveis = useMemo(() => {
    const livres = convidados.filter((c) => !selecionados.includes(c.id));
    return filtrarConvidados(livres, termo);
  }, [convidados, selecionados, termo]);

  const adicionar = (id) => {
    if (!selecionados.includes(id)) onChange([...selecionados, id]);
    setTermo("");
  };

  const remover = (id) => onChange(selecionados.filter((outro) => outro !== id));

  const criarEVincular = async () => {
    setErroNovo(null);
    setSalvandoNovo(true);
    try {
      const resultado = await handleCreateSpeaker(novo);
      if (!resultado.success) {
        setErroNovo(resultado.error);
        return;
      }
      setConvidados((prev) => [...prev, resultado.speaker]);
      onChange([...selecionados, resultado.speaker.id]);
      setNovo({ name: "", role: FUNCOES[0] });
      setAbrindoCadastro(false);
    } finally {
      setSalvandoNovo(false);
    }
  };

  return (
    <div className="mb-1">
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E]">
          <Mic size={16} className="text-[#FF6D2C]" />
          Convidados
        </label>
        <Link
          to="/admin/palestrantes"
          className="text-xs font-semibold text-[#FF6D2C] hover:underline"
        >
          Gerenciar convidados
        </Link>
      </div>

      {/* Escolhidos */}
      {escolhidos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {escolhidos.map((convidado) => (
            <span
              key={convidado.id}
              className="inline-flex items-center gap-2 bg-[#FFF1E8] border border-[#F0CFB0] rounded-full pl-1.5 pr-2 py-1"
            >
              <img
                src={convidado.image}
                alt=""
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-sm font-semibold text-[#1E1E1E]">{convidado.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#B14A08] font-bold">
                {convidado.funcao}
              </span>
              <button
                type="button"
                onClick={() => remover(convidado.id)}
                aria-label={`Remover ${convidado.name} do evento`}
                className="text-[#1E1E1E]/40 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Busca no catálogo */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E1E1E]/30"
        />
        <input
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder={
            carregando ? "Carregando convidados..." : "Buscar convidado já cadastrado"
          }
          aria-label="Buscar convidado para o evento"
          disabled={carregando}
          className={`${inputClass} pl-10`}
        />
      </div>

      {/* Resultados */}
      {!carregando && termo.trim() !== "" && (
        <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-56 overflow-y-auto">
          {disponiveis.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#1E1E1E]/50">
              Nenhum convidado disponível com esse nome.
            </p>
          ) : (
            disponiveis.map((convidado) => (
              <button
                key={convidado.id}
                type="button"
                onClick={() => adicionar(convidado.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#FFF8F3] transition-colors text-left"
              >
                <img
                  src={convidado.image}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
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

      {/* Cadastro rápido, para não interromper o cadastro do evento */}
      {abrindoCadastro ? (
        <div className="mt-3 border border-[#F0CFB0] bg-[#FFF8F3] rounded-lg p-4">
          {erroNovo && (
            <p className="mb-3 text-sm font-semibold text-red-600">{erroNovo}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={novo.name}
              onChange={(e) => setNovo((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nome do convidado"
              aria-label="Nome do novo convidado"
              className={`${inputClass} bg-white sm:flex-1`}
            />
            <select
              value={novo.role}
              onChange={(e) => setNovo((p) => ({ ...p, role: e.target.value }))}
              aria-label="Função do novo convidado"
              className={`${inputClass} bg-white sm:w-[180px]`}
            >
              {FUNCOES.map((funcao) => (
                <option key={funcao} value={funcao}>
                  {funcao}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => {
                setAbrindoCadastro(false);
                setErroNovo(null);
              }}
              className="px-4 py-2 rounded-lg text-sm font-bold text-[#1E1E1E]/60 hover:text-[#1E1E1E] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={criarEVincular}
              disabled={salvandoNovo}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#FF6D2C] hover:bg-[#e65c18] transition-colors disabled:opacity-60"
            >
              {salvandoNovo ? "Salvando..." : "Cadastrar e vincular"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[#1E1E1E]/50">
            Foto, biografia e redes podem ser preenchidas depois, em Convidados.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAbrindoCadastro(true)}
          className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[#FF6D2C] hover:text-[#e65c18] transition-colors"
        >
          <UserPlus size={18} />
          Cadastrar convidado novo
        </button>
      )}

      <p className="mt-2 text-xs text-[#1E1E1E]/50">
        Os convidados escolhidos aparecem na página pública do evento. Quem já foi
        cadastrado antes é reaproveitado — não precisa cadastrar de novo.
      </p>
    </div>
  );
}
