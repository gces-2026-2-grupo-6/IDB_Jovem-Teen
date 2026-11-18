import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText, Image, Video } from "lucide-react";
import {
  fetchAllMaterials,
  ehLinkExterno,
  ROTULO_DO_TIPO,
  TIPOS_MATERIAL,
} from "../../services/materialService";

/* Área pública de materiais (US11, CA3 e CA5).

   Aberta a qualquer visitante: a rota não exige login, e esta tela não fala
   com o contexto de autenticação. "Todas as pessoas podem baixar, sem login."

   O download sai pelo `url_download` que o back-end já entrega pronto — o
   front não monta URL do Drive. Arquivo do Drive volta como anexo, com o nome
   original; link externo volta como está, e aí abrir em outra aba é o certo,
   porque não há o que baixar. */

const ICONE_DO_TIPO = {
  foto: Image,
  video: Video,
  documento: FileText,
};

const FILTROS = [
  { valor: "", rotulo: "Todos" },
  ...TIPOS_MATERIAL.map((tipo) => ({ valor: tipo, rotulo: `${ROTULO_DO_TIPO[tipo]}s` })),
];

function MaterialCard({ material }) {
  const Icone = ICONE_DO_TIPO[material.type] || FileText;
  const externo = ehLinkExterno(material);

  return (
    <article className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3 h-full">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#FFD9B3] text-[#8A3816] shrink-0">
          <Icone size={18} />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#8A3816]">
            {ROTULO_DO_TIPO[material.type] || material.type}
          </span>
          <h2 className="font-bold text-[#1E1E1E] leading-snug">{material.title}</h2>
        </div>
      </div>

      {material.description && (
        <p className="text-sm text-[#1E1E1E]/60 leading-relaxed">{material.description}</p>
      )}

      <div className="mt-auto pt-2">
        <a
          href={material.downloadUrl || material.link}
          /* `download` só faz sentido no arquivo que vem do nosso back-end;
             num link externo o atributo é ignorado pelo navegador e o alvo é
             outra origem, então o certo ali é abrir em nova aba. */
          {...(externo
            ? { target: "_blank", rel: "noopener noreferrer" }
            : { download: true })}
          className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#DC6803] hover:bg-[#b45309] rounded-lg px-4 py-2.5 transition-colors"
        >
          {externo ? <ExternalLink size={16} /> : <Download size={16} />}
          {externo ? "Abrir" : "Baixar"}
        </a>
      </div>
    </article>
  );
}

export default function Materiais() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchAllMaterials(filtro || undefined)
      .then((lista) => {
        if (!active) return;
        setMaterials(lista);
        setError(null);
      })
      .catch(() => active && setError("Não foi possível carregar os materiais."))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [filtro]);

  return (
    <main className="min-h-screen bg-[#DC6803] pt-[70px] md:pt-[82px]">
      <section className="w-full max-w-6xl mx-auto px-6 pt-10 pb-4">
        <h1 className="text-center mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>
          <span className="font-bold text-[#93370D]">Materiais para </span>
          <em
            className="not-italic font-handwriting text-white"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.6rem)" }}
          >
            download
          </em>
        </h1>
        <p className="text-center text-white/80 text-sm max-w-xl mx-auto">
          Vídeos, fotos e documentos da organização. É só baixar — não precisa entrar.
        </p>

        {/* Filtro por tipo */}
        <div className="flex flex-wrap justify-center gap-2 mt-7">
          {FILTROS.map(({ valor, rotulo }) => (
            <button
              key={valor || "todos"}
              type="button"
              onClick={() => setFiltro(valor)}
              aria-pressed={filtro === valor}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                filtro === valor
                  ? "bg-white text-[#DC6803]"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto px-6 py-10 pb-20">
        {loading ? (
          <p className="text-center text-white/80 font-semibold animate-pulse">
            Carregando materiais...
          </p>
        ) : error ? (
          <p className="text-center text-white/90 font-semibold">{error}</p>
        ) : materials.length === 0 ? (
          <p className="text-center text-white/80">
            {filtro
              ? "Nenhum material deste tipo publicado ainda."
              : "Nenhum material publicado ainda."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
