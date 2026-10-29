import { useState } from "react";
import { CalendarClock, Ban, CheckCircle2 } from "lucide-react";
import {
  SITUACAO,
  handleAlterarSituacaoEvento,
  toInputDateTime,
} from "../../../../services/eventService";

/* Marcação de evento cancelado ou adiado (US14, CA1).

   Fica fora do formulário do evento de propósito. São duas ações de natureza
   diferente: editar o evento reescreve tudo o que está no formulário, enquanto
   marcar a situação é uma decisão isolada, que vale na hora e não deveria
   depender de o restante do formulário estar válido. Separadas, cancelar um
   evento não exige revalidar coordenadas, datas e links.

   Nada é apagado ao marcar (CA3) e ninguém é avisado (CA5): a comunicação com
   os inscritos continua sendo feita pela equipe, por fora. */

const OPCOES = [
  {
    valor: SITUACAO.ATIVO,
    rotulo: "Ativo",
    Icone: CheckCircle2,
    ativo: "bg-green-600 text-white border-green-600",
    descricao: "O evento aparece normalmente, com os botões de inscrição.",
  },
  {
    valor: SITUACAO.CANCELADO,
    rotulo: "Cancelado",
    Icone: Ban,
    ativo: "bg-red-600 text-white border-red-600",
    descricao: "O evento continua no site com o aviso de cancelamento, e a inscrição some.",
  },
  {
    valor: SITUACAO.ADIADO,
    rotulo: "Adiado",
    Icone: CalendarClock,
    ativo: "bg-amber-500 text-white border-amber-500",
    descricao: "A nova data é opcional: sem ela, o site informa “nova data em breve”.",
  },
];

export default function SituacaoEventoCard({ event, onChange }) {
  const [situacao, setSituacao] = useState(event?.situacao || SITUACAO.ATIVO);
  const [novaData, setNovaData] = useState(toInputDateTime(event?.novaData) || "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);

  const atual = event?.situacao || SITUACAO.ATIVO;
  const dataAtual = toInputDateTime(event?.novaData) || "";
  const mudou = situacao !== atual || (situacao === SITUACAO.ADIADO && novaData !== dataAtual);

  const escolher = (valor) => {
    setSituacao(valor);
    setErro(null);
    setAviso(null);
  };

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    setAviso(null);

    const resultado = await handleAlterarSituacaoEvento(event.id, situacao, novaData || null);

    setSalvando(false);

    if (!resultado.success) {
      setErro(resultado.error);
      return;
    }

    setAviso(
      situacao === SITUACAO.ATIVO
        ? "Marcação desfeita. O evento voltou a aparecer como ativo."
        : "Situação salva. O evento continua no site, com o aviso para o visitante."
    );
    if (onChange) onChange(resultado.event);
  };

  const opcaoEscolhida = OPCOES.find((o) => o.valor === situacao);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h2 className="font-bold text-[#1E1E1E] text-lg">Situação do evento</h2>
      <p className="text-sm text-[#1E1E1E]/50 mt-1">
        Marcar não apaga nada: o evento, as inscrições e as fotos continuam guardados, e o site
        não envia aviso a ninguém.
      </p>

      <hr className="my-5 border-gray-100" />

      <div className="flex flex-wrap gap-3">
        {OPCOES.map((opcao) => {
          const { valor, rotulo, ativo } = opcao;
          const Icone = opcao.Icone;

          return (
            <button
              key={valor}
              type="button"
              onClick={() => escolher(valor)}
              aria-pressed={situacao === valor}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold border-2 transition-colors ${
                situacao === valor
                  ? ativo
                  : "border-gray-200 text-[#1E1E1E]/60 hover:border-[#FF6D2C] hover:text-[#FF6D2C]"
              }`}
            >
              <Icone size={16} />
              {rotulo}
            </button>
          );
        })}
      </div>

      {opcaoEscolhida && (
        <p className="mt-3 text-xs text-[#1E1E1E]/50">{opcaoEscolhida.descricao}</p>
      )}

      {/* A nova data só existe no adiado — nas outras situações o servidor a
          descarta, e pedi-la aqui só confundiria. */}
      {situacao === SITUACAO.ADIADO && (
        <div className="mt-5">
          <label className="block text-sm font-bold text-[#1E1E1E] mb-2" htmlFor="nova-data">
            Nova data (opcional)
          </label>
          <input
            id="nova-data"
            type="datetime-local"
            value={novaData}
            onChange={(e) => setNovaData(e.target.value)}
            className="w-full sm:max-w-xs border border-gray-300 rounded-lg px-4 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all"
          />
          <p className="mt-1.5 text-xs text-[#1E1E1E]/50">
            Deixe em branco enquanto a nova data não estiver definida.
          </p>
        </div>
      )}

      {erro && (
        <div className="mt-5 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl px-4 py-3">
          {erro}
        </div>
      )}

      {aviso && (
        <div className="mt-5 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl px-4 py-3">
          {aviso}
        </div>
      )}

      <hr className="my-5 border-gray-100" />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || !mudou}
          className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {salvando ? "Atualizando..." : "Atualizar situação"}
        </button>
      </div>
    </div>
  );
}
