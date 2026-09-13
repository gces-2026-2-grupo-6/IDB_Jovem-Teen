import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  CalendarRange,
  Users,
  Music,
  CalendarCog,
  ImagePlus,
  Plus,
  Trash2,
  Ticket,
  Phone,
  DollarSign,
  Link2,
  FileText,
} from "lucide-react";
import LocationPicker from "./LocationPicker";
import ConvidadosPicker from "./ConvidadosPicker";
import TimeInput from "../../ui/TimeInput";
import {
  splitDateTime,
  isNonConsecutive,
  normalizeEventDays,
  TIPOS_EVENTO,
} from "../../../services/eventService";
import { toDriveImageUrl } from "../../../utils/driveImage";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-4 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all";

/* Base sem w-full para os campos de data/hora (largura controlada via flex) */
const dateTimeBase =
  "border border-gray-300 rounded-lg px-3 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all";

export default function EventForm({ initialData = {}, onSubmit, eventId }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const start = splitDateTime(initialData.date);
  const end = splitDateTime(initialData.endDate);

  /* O evento entra em "dias" quando já foi salvo com dias avulsos; o padrão
     segue sendo o período contínuo. */
  const diasIniciais = normalizeEventDays(initialData.days);
  const [dateMode, setDateMode] = useState(
    isNonConsecutive({ days: diasIniciais }) ? "dias" : "periodo"
  );
  const [specificDays, setSpecificDays] = useState(
    diasIniciais.length > 0 ? diasIniciais : [""]
  );

  const [form, setForm] = useState({
    title: initialData.title || "",
    tipoEvento: initialData.tipoEvento || "",
    description: initialData.description || "",
    vagas: initialData.vagas ?? "",
    contatoResponsavel: initialData.contatoResponsavel || "",
    valorInvestimento: initialData.valorInvestimento || "",
    linkPagamento: initialData.linkPagamento || "",
    linkRegulamento: initialData.linkRegulamento || "",
    latitude: initialData.latitude ?? "",
    longitude: initialData.longitude ?? "",
    startDay: start.day,
    startTime: start.time,
    endDay: end.day,
    endTime: end.time,
    linkGaleria: initialData.linkGaleria || "",
    linkFormularioVoluntarios: initialData.linkFormularioVoluntarios || "",
    image: initialData.linkImagem || "",
  });

  /* Ids dos convidados vinculados.

     Começa em `null`, não em lista vazia, e isso é deliberado: o seletor carrega
     os vinculados de forma assíncrona, e uma lista vazia significaria "remova
     todos". Quem salvasse antes do carregamento terminar desvincularia todos os
     convidados do evento sem perceber. `null` significa "ainda não sei", e a
     sincronização não mexe em nada nesse caso. */
  const [convidadosIds, setConvidadosIds] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const changeDay = (index, value) =>
    setSpecificDays((prev) => prev.map((d, i) => (i === index ? value : d)));
  const addDay = () => setSpecificDays((prev) => [...prev, ""]);
  const removeDay = (index) =>
    setSpecificDays((prev) => {
      const restante = prev.filter((_, i) => i !== index);
      return restante.length > 0 ? restante : [""];
    });

  const handleLocationChange = (lat, lng) => {
    setForm((prev) => ({
      ...prev,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dias = dateMode === "dias" ? normalizeEventDays(specificDays) : [];

      /* Em dias específicos, o mesmo horário vale para todos os dias, e
         início/término apontam para o primeiro e o último — é o que mantém
         ordenação, calendário e classificação de passado/futuro funcionando. */
      const primeiroDia = dias.length > 0 ? dias[0] : form.startDay;
      const ultimoDia = dias.length > 0 ? dias[dias.length - 1] : form.endDay;

      const date = primeiroDia && form.startTime ? `${primeiroDia}T${form.startTime}` : "";
      const endDate = ultimoDia && form.endTime ? `${ultimoDia}T${form.endTime}` : "";
      await onSubmit({
        ...form,
        convidadosIds,
        date,
        endDate,
        days: dias,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/eventos");
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {/* Nome */}
        <div className="mb-1">
          <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Nome</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Nome do Evento"
            className={inputClass}
            required
          />
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Tipo de evento */}
        <div className="mb-1">
          <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Tipo de evento</label>
          <select
            name="tipoEvento"
            value={form.tipoEvento}
            onChange={handleChange}
            className={`${inputClass} sm:max-w-md`}
            required
          >
            <option value="" disabled>
              Selecione o tipo
            </option>
            {TIPOS_EVENTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Descrição */}
        <div className="mb-1">
          <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Descrição</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Descrição do Evento"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Vagas + Contato do responsável (RF11) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-1">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E] mb-2">
              <Ticket size={16} className="text-[#FF6D2C]" />
              Quantidade de vagas
            </label>
            <input
              type="number"
              name="vagas"
              min="0"
              value={form.vagas}
              onChange={handleChange}
              placeholder="Ex: 50"
              className={inputClass}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E] mb-2">
              <Phone size={16} className="text-[#FF6D2C]" />
              Contato do responsável
            </label>
            <input
              type="text"
              name="contatoResponsavel"
              value={form.contatoResponsavel}
              onChange={handleChange}
              placeholder="Telefone ou e-mail"
              className={inputClass}
            />
          </div>
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Valor/Investimento + Link de pagamento (RF11) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-1">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E] mb-2">
              <DollarSign size={16} className="text-[#FF6D2C]" />
              Valor / Investimento
            </label>
            <input
              type="text"
              name="valorInvestimento"
              value={form.valorInvestimento}
              onChange={handleChange}
              placeholder="Ex: R$ 30,00 ou Gratuito"
              className={inputClass}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E] mb-2">
              <Link2 size={16} className="text-[#FF6D2C]" />
              Link de pagamento
            </label>
            <input
              type="url"
              name="linkPagamento"
              value={form.linkPagamento}
              onChange={handleChange}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Local — selecionado direto no mapa */}
        <div className="mb-1">
          <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E] mb-2">
            <MapPin size={16} className="text-[#FF6D2C]" />
            Local do evento
          </label>
          <LocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            initialAddress={initialData.location || ""}
            onChange={handleLocationChange}
          />
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Quando acontece — período contínuo ou dias específicos */}
        <div className="mb-1">
          <span className="block text-sm font-bold text-[#1E1E1E] mb-2">Quando acontece</span>

          <div role="radiogroup" aria-label="Formato das datas do evento" className="flex flex-col sm:flex-row gap-2 mb-4">
            <button
              type="button"
              role="radio"
              aria-checked={dateMode === "periodo"}
              onClick={() => setDateMode("periodo")}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border transition-colors ${
                dateMode === "periodo"
                  ? "border-[#FF6D2C] bg-[#FFF1E8] text-[#D5650D]"
                  : "border-gray-300 bg-[#FFF8F3] text-[#1E1E1E]/70 hover:border-[#FF6D2C]/50"
              }`}
            >
              <CalendarRange size={16} />
              Dias seguidos
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={dateMode === "dias"}
              onClick={() => setDateMode("dias")}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border transition-colors ${
                dateMode === "dias"
                  ? "border-[#FF6D2C] bg-[#FFF1E8] text-[#D5650D]"
                  : "border-gray-300 bg-[#FFF8F3] text-[#1E1E1E]/70 hover:border-[#FF6D2C]/50"
              }`}
            >
              <CalendarDays size={16} />
              Dias avulsos
            </button>
          </div>

          {dateMode === "periodo" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E] mb-2">
                  <CalendarDays size={16} className="text-[#FF6D2C]" />
                  Início
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="startDay"
                    value={form.startDay}
                    onChange={handleChange}
                    className={`${dateTimeBase} flex-1 min-w-0`}
                    required
                  />
                  <TimeInput
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    className={dateTimeBase}
                    wrapperClassName="w-[150px]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E] mb-2">
                  <CalendarDays size={16} className="text-[#FF6D2C]" />
                  Término
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="endDay"
                    value={form.endDay}
                    onChange={handleChange}
                    className={`${dateTimeBase} flex-1 min-w-0`}
                    required
                  />
                  <TimeInput
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                    className={dateTimeBase}
                    wrapperClassName="w-[150px]"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E]">
                  <CalendarDays size={16} className="text-[#FF6D2C]" />
                  Dias do evento
                </label>
                <button
                  type="button"
                  onClick={addDay}
                  title="Adicionar dia"
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#FF6D2C] hover:text-[#e65c18] transition-colors"
                >
                  <Plus size={18} />
                  Adicionar dia
                </button>
              </div>

              <div className="space-y-3">
                {specificDays.map((dia, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="date"
                      aria-label={`Dia ${index + 1} do evento`}
                      value={dia}
                      onChange={(e) => changeDay(index, e.target.value)}
                      className={`${dateTimeBase} flex-1 min-w-0`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeDay(index)}
                      title="Remover dia"
                      aria-label={`Remover dia ${index + 1}`}
                      className="w-11 h-11 shrink-0 rounded-lg border border-gray-300 bg-[#FFF8F3] flex items-center justify-center text-[#1E1E1E]/40 hover:text-red-500 hover:border-red-300 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                <div>
                  <label className="block text-sm font-bold text-[#1E1E1E] mb-2">
                    Começa às
                  </label>
                  <TimeInput
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    className={`${dateTimeBase} w-full`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1E1E1E] mb-2">
                    Termina às
                  </label>
                  <TimeInput
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                    className={`${dateTimeBase} w-full`}
                    required
                  />
                </div>
              </div>

              <p className="mt-2 text-xs text-[#1E1E1E]/50">
                Use para eventos que acontecem em dias separados, como três sábados
                seguidos. O horário informado vale para todos os dias, e o local do
                evento é o mesmo em todos.
              </p>
            </div>
          )}
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Palestrantes/convidados — selecionados via ConvidadosPicker */}
        <ConvidadosPicker
          eventId={eventId}
          selecionados={convidadosIds ?? []}
          onChange={setConvidadosIds}
        />

        <hr className="my-5 border-gray-100" />

        {/* Link Formulário Voluntários */}
        <div className="mb-1">
          <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Link Formulário Voluntários</label>
          <input
            type="url"
            name="linkFormularioVoluntarios"
            value={form.linkFormularioVoluntarios}
            onChange={handleChange}
            placeholder="https://forms.gle/..."
            className={`${inputClass} sm:max-w-md`}
          />
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Imagem de capa (URL do Drive) */}
        <div className="mb-1">
          <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Imagem de Capa</label>
          <div className="relative">
            <input
              type="url"
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="Cole o link da imagem (Google Drive)"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all"
            />
            <ImagePlus size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E1E1E]/30" />
          </div>
          {form.image?.trim() ? (
            <div className="mt-3 w-40 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
              <img
                src={toDriveImageUrl(form.image)}
                alt="Pré-visualização da capa"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-[#1E1E1E]/50">
              Sem imagem, o evento usa a capa padrão do IDB Jovem.
            </p>
          )}
        </div>

        <hr className="my-5 border-gray-100" />

        <div className="mb-1">
          <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Galeria de Fotos</label>
          <div className="relative">
            <input
              type="text"
              name="linkGaleria"
              value={form.linkGaleria}
              onChange={handleChange}
              placeholder="Nome ou link da pasta de fotos"
              className={`${inputClass} pr-10`}
            />
            <ImagePlus size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E1E1E]/30" />
          </div>
          <p className="mt-1.5 text-xs text-[#1E1E1E]/50">
            Informe o nome (ou link) da pasta onde estão as fotos do evento.
          </p>
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Regulamento (RF11) — mesmo padrão de link usado na capa e na galeria */}
        <div className="mb-1">
          <label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E] mb-2">
            <FileText size={16} className="text-[#FF6D2C]" />
            Regulamento (PDF)
          </label>
          <input
            type="url"
            name="linkRegulamento"
            value={form.linkRegulamento}
            onChange={handleChange}
            placeholder="Cole o link do PDF (Google Drive)"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-[#1E1E1E]/50">
            Compartilhe o PDF no Drive como "qualquer pessoa com o link" e cole aqui.
          </p>
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Programação do evento (atividades/horários) — exige um evento já salvo */}
        <div className="flex flex-col gap-2 mb-1">
          <label className="block text-sm font-bold text-[#1E1E1E]">Programação do evento</label>
          <button
            type="button"
            disabled={!eventId}
            onClick={() => eventId && navigate(`/admin/eventos/${eventId}/programacao`)}
            className="flex items-center gap-2 self-start border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#1E1E1E] hover:border-[#FF6D2C] hover:text-[#FF6D2C] transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-[#1E1E1E]"
          >
            Editar Programação do Evento
            <CalendarCog size={16} />
          </button>
          {!eventId && (
            <p className="text-xs text-[#1E1E1E]/50">
              Salve o evento primeiro para adicionar a programação (atividades e horários).
            </p>
          )}
        </div>

        <hr className="my-5 border-gray-100" />

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </form>
  );
}