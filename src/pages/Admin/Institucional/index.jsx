import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink, Plus, Trash2, Info } from "lucide-react";
import SectionTitle from "../../../components/ui/SectionTitle";
import Loading from "../../../components/ui/Loading";
import useInstitucional from "../../../hooks/useInstitucional";
import { MISSAO_PUBLICADA, salvarInstitucional } from "../../../services/institucionalService";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-4 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all";

/* O formulário nasce com o conteúdo já carregado (a tela só o monta depois da
   leitura), então não precisa copiar o servidor para o estado num efeito. */
function FormularioInstitucional({ inicial, semConteudoSalvo }) {
  const [form, setForm] = useState({
    missao: inicial.missao,
    visao: inicial.visao,
    valores: inicial.valores.length > 0 ? inicial.valores : [""],
  });
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  const alterar = (campo) => (e) => setForm((anterior) => ({ ...anterior, [campo]: e.target.value }));
  const alterarValor = (indice, texto) =>
    setForm((anterior) => ({
      ...anterior,
      valores: anterior.valores.map((v, i) => (i === indice ? texto : v)),
    }));
  const adicionarValor = () => setForm((anterior) => ({ ...anterior, valores: [...anterior.valores, ""] }));
  const removerValor = (indice) =>
    setForm((anterior) => {
      const restantes = anterior.valores.filter((_, i) => i !== indice);
      return { ...anterior, valores: restantes.length > 0 ? restantes : [""] };
    });

  const enviar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    const resultado = await salvarInstitucional(form);
    setSalvando(false);
    setMensagem(
      resultado.success
        ? { tipo: "sucesso", texto: "Missão, visão e valores salvos. A página pública já mostra o novo texto." }
        : { tipo: "erro", texto: resultado.error }
    );
  };

  return (
    <form onSubmit={enviar} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
      {semConteudoSalvo && (
        <p className="flex items-start gap-2 text-sm text-[#1E3A8A] bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-4 py-3">
          <Info size={16} className="shrink-0 mt-0.5" />
          Ainda não há conteúdo salvo. A missão abaixo é a que já aparece no rodapé do site.
        </p>
      )}

      <div>
        <label htmlFor="missao" className="block text-sm font-bold text-[#1E1E1E] mb-2">Missão</label>
        <textarea id="missao" rows={4} value={form.missao} onChange={alterar("missao")}
          placeholder="Por que o IDB Jovem & Teen existe" className={`${inputClass} resize-y`} />
      </div>

      <div>
        <label htmlFor="visao" className="block text-sm font-bold text-[#1E1E1E] mb-2">Visão</label>
        <textarea id="visao" rows={4} value={form.visao} onChange={alterar("visao")}
          placeholder="Aonde o IDB Jovem & Teen quer chegar" className={`${inputClass} resize-y`} />
      </div>

      <fieldset>
        <legend className="block text-sm font-bold text-[#1E1E1E] mb-2">Valores</legend>
        <div className="space-y-2">
          {form.valores.map((valor, indice) => (
            <div key={indice} className="flex gap-2">
              <input
                type="text"
                value={valor}
                onChange={(e) => alterarValor(indice, e.target.value)}
                aria-label={`Valor ${indice + 1}`}
                placeholder="Ex: Fé"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removerValor(indice)}
                aria-label={`Remover valor ${indice + 1}`}
                className="w-11 shrink-0 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={adicionarValor}
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#D5650D] hover:text-[#9A3412]"
        >
          <Plus size={16} />
          Adicionar valor
        </button>
      </fieldset>

      {mensagem && (
        <p
          role={mensagem.tipo === "erro" ? "alert" : "status"}
          className={`flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-3 ${
            mensagem.tipo === "erro"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-green-50 border border-green-200 text-green-700"
          }`}
        >
          {mensagem.tipo === "sucesso" && <CheckCircle2 size={16} />}
          {mensagem.texto}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/quem-somos"
          target="_blank"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E1E1E]/70 hover:text-[#D5650D]"
        >
          <ExternalLink size={16} />
          Ver a página pública
        </Link>
        <button
          type="submit"
          disabled={salvando}
          className="px-8 py-3 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

/* US22 — edição de missão, visão e valores, restrita à superadministradora
   (o conteúdo institucional fica no setor "Conteúdo", com os líderes). */
export default function AdminInstitucional() {
  const { carregando, salvo } = useInstitucional();
  const inicial = salvo || { missao: MISSAO_PUBLICADA, visao: "", valores: [] };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle title="Missão, visão e valores" />
      <p className="text-sm text-[#1E1E1E]/60 -mt-3">
        Este texto aparece na página "Quem somos" e a missão também no rodapé do site.
      </p>
      {carregando ? (
        <Loading message="Carregando conteúdo..." />
      ) : (
        <FormularioInstitucional inicial={inicial} semConteudoSalvo={!salvo} />
      )}
    </div>
  );
}
