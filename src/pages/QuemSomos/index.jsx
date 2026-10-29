import { Link } from "react-router-dom";
import { ArrowLeft, Target, Eye, Heart } from "lucide-react";
import useInstitucional from "../../hooks/useInstitucional";

/* US22 — página institucional: missão, visão e valores, com o texto que a
   superadministradora mantém no painel. Cada bloco só aparece quando tem
   conteúdo. */
function Bloco({ id, icone, titulo, children }) {
  return (
    <section aria-labelledby={id} className="bg-white rounded-3xl shadow-sm border border-[#F5E1D3] p-6 md:p-10">
      <h2 id={id} className="flex items-center gap-3 font-black text-[#93370D] text-2xl md:text-3xl mb-4">
        <span className="w-11 h-11 rounded-full bg-[#FFF1E8] flex items-center justify-center text-[#D5650D]">
          {icone}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export default function QuemSomos() {
  const { carregando, conteudo } = useInstitucional();

  return (
    <main className="min-h-screen bg-[#FDF3EA] pt-[70px] md:pt-[82px]">
      <div className="w-full max-w-4xl mx-auto px-4 py-10 md:py-16">
        <Link
          to="/"
          aria-label="Voltar para a página inicial"
          className="inline-flex w-10 h-10 rounded-full hover:bg-[#1E1E1E]/5 items-center justify-center transition-colors mb-6"
        >
          <ArrowLeft size={22} className="text-[#1E1E1E]" />
        </Link>

        <h1 className="text-center mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>
          <span className="font-black text-[#93370D]">Quem </span>
          <em className="not-italic font-handwriting text-[#D5650D]">somos</em>
        </h1>
        <p className="text-center text-[#1E1E1E]/70 mb-10 md:mb-14">
          A missão, a visão e os valores do IDB Jovem &amp; Teen.
        </p>

        {carregando ? (
          <p role="status" className="text-center text-[#D5650D] font-bold animate-pulse">
            Carregando...
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {conteudo.missao && (
              <Bloco id="titulo-missao" icone={<Target size={22} />} titulo="Missão">
                <p className="text-[#1E1E1E]/80 text-base md:text-lg leading-relaxed whitespace-pre-line">
                  {conteudo.missao}
                </p>
              </Bloco>
            )}
            {conteudo.visao && (
              <Bloco id="titulo-visao" icone={<Eye size={22} />} titulo="Visão">
                <p className="text-[#1E1E1E]/80 text-base md:text-lg leading-relaxed whitespace-pre-line">
                  {conteudo.visao}
                </p>
              </Bloco>
            )}
            {conteudo.valores.length > 0 && (
              <Bloco id="titulo-valores" icone={<Heart size={22} />} titulo="Valores">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {conteudo.valores.map((valor, i) => (
                    <li
                      key={`${i}-${valor}`}
                      className="flex items-start gap-2 bg-[#FFF8F3] border border-[#F5E1D3] rounded-xl px-4 py-3 text-[#1E1E1E]/80 font-semibold"
                    >
                      <span aria-hidden="true" className="text-[#D5650D] font-black">•</span>
                      {valor}
                    </li>
                  ))}
                </ul>
              </Bloco>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
