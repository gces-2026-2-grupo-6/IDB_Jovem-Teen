import { useEffect, useState } from "react";
import { ExternalLink, Copy, Check, Pencil, Link2, Table2, UserPlus } from "lucide-react";
import { fetchLinksPainel, handleSalvarLink } from "../../../../services/painelService";
import usePermissao from "../../../../hooks/usePermissao";

/* Os dois links fixados na página inicial do painel (US10, CA1 a CA4).

   O cadastro dos mais de 2500 líderes acontece fora do site: cada líder se
   inscreve por um formulário externo e as respostas caem numa planilha. O
   painel só fixa os dois endereços — um para divulgar, outro para consultar —
   e permite trocá-los sem depender da equipe técnica (CA4).

   O card inteiro é exclusivo da superadministradora (CA3). Para o
   administrador de setor não basta esconder: a rota sequer é chamada, porque a
   planilha reúne nome, e-mail e WhatsApp de mais de 2500 pessoas e o back-end
   recusa a leitura com 403. */

const CARDS = [
  {
    campo: "cadastro",
    titulo: "Link de cadastro de líderes",
    Icone: UserPlus,
    ajuda: "Formulário externo que cada líder preenche. É este o link para divulgar.",
    placeholder: "https://forms.gle/...",
  },
  {
    campo: "planilha",
    titulo: "Planilha de respostas",
    Icone: Table2,
    ajuda: "Planilha com as respostas do formulário. É de consulta, não para divulgar.",
    placeholder: "https://docs.google.com/spreadsheets/d/...",
  },
];

function LinkFixado({ card, valor, onSalvar }) {
  const { campo, titulo, Icone, ajuda, placeholder } = card;

  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(valor);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [copiado, setCopiado] = useState(false);

  /* O valor pode mudar por fora — ao salvar o outro link, a resposta traz os
     dois atualizados. */
  useEffect(() => {
    if (!editando) setRascunho(valor);
  }, [valor, editando]);

  const abrirEdicao = () => {
    setRascunho(valor);
    setErro(null);
    setEditando(true);
  };

  const cancelar = () => {
    setRascunho(valor);
    setErro(null);
    setEditando(false);
  };

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    const resultado = await onSalvar(campo, rascunho);
    setSalvando(false);
    if (!resultado.success) {
      setErro(resultado.error);
      return;
    }
    setEditando(false);
  };

  /* `navigator.clipboard` não existe fora de contexto seguro; sem ele, o link
     continua visível e copiável à mão, então a falha não bloqueia nada. */
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Não foi possível copiar. Selecione o endereço e copie manualmente.");
    }
  };

  return (
    <div
      data-testid={`link-${campo}`}
      className="border border-gray-100 rounded-xl p-4 bg-[#FFF8F3]/60"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icone size={16} className="text-[#FF6D2C] shrink-0" />
        <h3 className="font-bold text-sm text-[#1E1E1E]">{titulo}</h3>
      </div>
      <p className="text-xs text-[#1E1E1E]/50 mb-3">{ajuda}</p>

      {editando ? (
        <div className="space-y-2">
          <input
            type="url"
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            placeholder={placeholder}
            aria-label={titulo}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all"
          />
          <p className="text-[11px] text-[#1E1E1E]/40">
            Deixe em branco para remover o link fixado.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={cancelar}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#1E1E1E]/60 border border-gray-200 hover:border-[#FF6D2C] hover:text-[#FF6D2C] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : valor ? (
        <>
          <p className="text-xs text-[#1E1E1E]/60 break-all mb-3 font-mono">{valor}</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={valor}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#FF6D2C] hover:bg-[#e65c18] transition-colors"
            >
              <ExternalLink size={13} />
              Abrir
            </a>
            <button
              type="button"
              onClick={copiar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1E1E1E]/70 border border-gray-200 hover:border-[#FF6D2C] hover:text-[#FF6D2C] transition-colors"
            >
              {copiado ? <Check size={13} /> : <Copy size={13} />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
            <button
              type="button"
              onClick={abrirEdicao}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1E1E1E]/70 border border-gray-200 hover:border-[#FF6D2C] hover:text-[#FF6D2C] transition-colors"
            >
              <Pencil size={13} />
              Trocar
            </button>
          </div>
        </>
      ) : (
        /* Link ainda não configurado: o card não some, senão a superadmin não
           teria por onde cadastrá-lo pela primeira vez. */
        <button
          type="button"
          onClick={abrirEdicao}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#FF6D2C] border border-dashed border-[#FF6D2C]/40 hover:bg-[#FF6D2C]/5 transition-colors"
        >
          <Link2 size={13} />
          Configurar
        </button>
      )}

      {erro && <p className="mt-2 text-xs font-semibold text-red-600">{erro}</p>}
    </div>
  );
}

export default function LinksLideresCard() {
  const { ehSuperadmin } = usePermissao();

  const [links, setLinks] = useState({ cadastro: "", planilha: "" });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    /* CA3: para quem não é superadministradora, nem a requisição acontece. */
    if (!ehSuperadmin) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetchLinksPainel()
      .then((dados) => active && setLinks(dados))
      .catch(() => active && setErro("Não foi possível carregar os links de cadastro de líderes."))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [ehSuperadmin]);

  const salvar = async (campo, valor) => {
    const resultado = await handleSalvarLink(campo, valor);
    if (resultado.success) {
      /* A resposta traz os dois links já atualizados: a tela adota o estado do
         servidor em vez de adivinhar o que ficou salvo. */
      setLinks(resultado.links);
    }
    return resultado;
  };

  if (!ehSuperadmin) return null;

  return (
    <div data-testid="links-lideres" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="mb-4">
        <h2 className="font-bold text-[#1E1E1E] text-lg">Cadastro nacional de líderes</h2>
        <p className="text-xs text-[#1E1E1E]/50 mt-1">
          Os líderes se cadastram pelo formulário externo e as respostas vão para a planilha.
          Publicar um diretor no site continua sendo feito por você, em Diretores &amp; Líderes.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[#1E1E1E]/40">Carregando links...</p>
      ) : erro ? (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl px-4 py-3">
          {erro}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CARDS.map((card) => (
            <LinkFixado
              key={card.campo}
              card={card}
              valor={links[card.campo]}
              onSalvar={salvar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
