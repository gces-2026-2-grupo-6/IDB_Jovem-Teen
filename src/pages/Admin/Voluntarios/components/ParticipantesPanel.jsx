import { useState, useEffect } from "react";
import { Users, ExternalLink, PlugZap } from "lucide-react";
import {
  fetchParticipantesByEvent,
  ListagemIndisponivelError,
} from "../../../../services/inscricaoService";
import AdminTable from "../../components/AdminTable";
import Loading from "../../../../components/ui/Loading";
import EmptyState from "../../../../components/ui/EmptyState";
import { StatCard } from "../../../../components/card/VolunteerCard";
import LinkDoFluxo from "./LinkDoFluxo";

const COLUNAS = [
  { key: "name", label: "Nome", width: "1fr" },
  { key: "email", label: "Email", width: "1fr" },
  { key: "form", label: "Resposta", width: "130px" },
];

const GRID = "1fr 1fr 130px";

/* Listagem do fluxo de participantes — quem vai ao evento.

   Sem status: ninguém aprova uma inscrição de participante. É o que separa
   esta tabela da de voluntários, que mantém pendente/aprovado/reprovado.

   A listagem depende de um endpoint que o back-end ainda não expõe. Enquanto
   não existir, a chamada responde 404 e a tela diz isso com todas as letras,
   em vez de fingir que o evento não tem inscritos ou de acusar falha de
   carregamento. O link de inscrição, acima, já funciona de qualquer forma. */
export default function ParticipantesPanel({ event, eventId }) {
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const lista = await fetchParticipantesByEvent(eventId);
        if (!active) return;
        setParticipantes(lista);
        setIndisponivel(false);
        setError(null);
      } catch (err) {
        if (!active) return;
        if (err instanceof ListagemIndisponivelError) {
          setIndisponivel(true);
        } else {
          setError("Não foi possível carregar as inscrições deste evento.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [eventId]);

  const renderRow = (p, index) => (
    <div
      key={p.id}
      className={`grid px-6 py-4 items-center transition-colors hover:bg-gray-50/70 ${
        index < participantes.length - 1 ? "border-b border-gray-100" : ""
      }`}
      style={{ gridTemplateColumns: GRID }}
    >
      <span className="text-sm text-[#1E1E1E] font-medium truncate pr-3">
        {p.name}
      </span>
      <span className="text-sm text-[#1E1E1E]/70 truncate pr-3">
        {p.email}
      </span>
      <div>
        <a
          href={p.linkResposta || event.linkFormularioParticipantes || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold border-2 border-[#FF6D2C] text-[#FF6D2C] px-3 py-1.5 rounded-md hover:bg-[#FF6D2C] hover:text-white transition-colors"
        >
          <ExternalLink size={12} />
          Abrir Resposta
        </a>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <LinkDoFluxo
        link={event.linkFormularioParticipantes}
        rotulo="participantes"
        eventId={eventId}
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <EmptyState message={error} />
      ) : indisponivel ? (
        <EmptyState
          icon={<PlugZap size={28} className="text-[#FF6D2C]/60" />}
          message="A listagem de participantes ainda não é fornecida pela API. O link de inscrição acima já pode ser divulgado — as respostas aparecerão aqui assim que a integração estiver pronta."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={Users}
              label="Total de Inscritos"
              value={participantes.length}
              color="text-[#FF6D2C]"
            />
          </div>

          <AdminTable
            columns={COLUNAS}
            data={participantes}
            renderRow={renderRow}
            emptyMessage="Nenhum participante inscrito neste evento."
          />
        </>
      )}
    </div>
  );
}
