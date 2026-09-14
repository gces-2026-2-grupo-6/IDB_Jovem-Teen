import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { fetchEventById } from "../../../services/eventService";
import {
  fetchVolunteersByEvent,
  handleUpdateStatus,
  computeVolunteerStats,
} from "../../../services/volunteerService";
import StatusBadge from "../components/StatusBadge";
import SectionTitle from "../../../components/ui/SectionTitle";
import AdminTable from "../components/AdminTable";
import Loading from "../../../components/ui/Loading";
import EmptyState from "../../../components/ui/EmptyState";
import { StatCard } from "../../../components/card/VolunteerCard";

/* Página: Detalhes de Voluntários (inscrições) de um Evento */
export default function AdminVoluntarioDetails() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState({ total: 0, aprovados: 0, pendentes: 0, reprovados: 0 });
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let ev;
        try {
          ev = await fetchEventById(eventId);
        } catch {
          ev = null;
        }
        if (!active) return;
        setEvent(ev);
        
        if (ev) {
          try {
            const vols = await fetchVolunteersByEvent(eventId);
            if (!active) return;
            setVolunteers(vols);
            setStats(computeVolunteerStats(vols));
            setError(null);
          } catch {
            if (active) setError("Não foi possível carregar as inscrições deste evento.");
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [eventId]);

  const onStatusChange = async (volunteerId, newStatus) => {
    const previous = volunteers;

    const updated = previous.map((v) =>
      v.id === volunteerId ? { ...v, status: newStatus } : v
    );
    setVolunteers(updated);
    setStats(computeVolunteerStats(updated));

    const result = await handleUpdateStatus(volunteerId, eventId, newStatus);
    if (!result.success) {
      setVolunteers(previous);
      setStats(computeVolunteerStats(previous));
      alert(result.error);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionTitle title="Voluntários" onBack={() => navigate("/admin/voluntarios")} />
        <EmptyState message={error} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-lg font-semibold text-[#1E1E1E]/60 mb-4">Evento não encontrado.</p>
        <button
          onClick={() => navigate("/admin/voluntarios")}
          className="text-sm font-bold text-[#FF6D2C] hover:underline"
        >
          Voltar para Voluntários
        </button>
      </div>
    );
  }

  const tableColumns = [
    { key: "name", label: "Nome", width: "1fr" },
    { key: "email", label: "Email", width: "1fr" },
    { key: "status", label: "Status", width: "140px" },
    { key: "form", label: "Formulário", width: "130px" },
  ];

  const renderVolunteerRow = (vol, index) => (
    <div
      key={vol.id}
      className={`grid px-6 py-4 items-center transition-colors hover:bg-gray-50/70 ${
        index < volunteers.length - 1 ? "border-b border-gray-100" : ""
      }`}
      style={{ gridTemplateColumns: "1fr 1fr 140px 130px" }}
    >
      <span className="text-sm text-[#1E1E1E] font-medium truncate pr-3">
        {vol.name}
      </span>
      <span className="text-sm text-[#1E1E1E]/70 truncate pr-3">
        {vol.email}
      </span>
      <div>
        <StatusBadge
          status={vol.status}
          onChange={(newStatus) => onStatusChange(vol.id, newStatus)}
        />
      </div>
      <div>
        <a
          href={vol.linkResposta || event.linkFormularioVoluntarios || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold border-2 border-[#FF6D2C] text-[#FF6D2C] px-3 py-1.5 rounded-md hover:bg-[#FF6D2C] hover:text-white transition-colors"
        >
          <ExternalLink size={12} />
          Abrir Formulário
        </a>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <SectionTitle
        title="Voluntários"
        onBack={() => navigate("/admin/voluntarios")}
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total de Inscritos"
          value={stats.total}
          color="text-[#FF6D2C]"
        />
        <StatCard
          icon={CheckCircle}
          label="Aprovados"
          value={stats.aprovados}
          color="text-[#22C55E]"
        />
        <StatCard
          icon={Clock}
          label="Pendentes"
          value={stats.pendentes}
          color="text-[#F5C518]"
        />
      </div>

      {/* Tabela de Voluntários */}
      <AdminTable
        columns={tableColumns}
        data={volunteers}
        renderRow={renderVolunteerRow}
        emptyMessage="Nenhum voluntário inscrito neste evento."
      />
    </div>
  );
}
