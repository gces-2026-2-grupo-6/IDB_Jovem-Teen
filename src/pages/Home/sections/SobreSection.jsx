import { Link } from "react-router-dom";
import cultoImg from "../../../assets/images/culto.png";
import { TypewriterEffect } from "../../../components/ui/typewriter-effect";

export default function SobreSection() {
  const fullText = "A IDB Jovem & Teen é o departamento nacional de jovens e adolescentes da Igreja de Deus no Brasil,  feito para quem busca viver a fé de forma real e com propósito. Com encontros, eventos e uma comunidade acolhedora, é o lugar ideal para crescer, fazer amizades e se conectar com Deus.";

  const bodyWords = fullText.split(" ").map((word) => ({
    text: word + "\u00A0",
    className: "text-black text-base md:text-lg font-normal",
  }));

  return (
    <section className="w-full flex flex-col md:flex-row min-h-[400px]">
      {/* Imagem */}
      <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-0">
        <img
          src={cultoImg}
          alt="Sobre o IDB Jovem"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Texto */}
      <div className="w-full md:w-1/2 bg-[#D5650D] flex flex-col justify-center items-center py-16 md:py-24 px-8 md:px-12 text-center overflow-hidden">
        <h2
          className="font-handwriting text-white leading-none mb-8"
          style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)" }}
        >
          CONHEÇA O IDB
          <br />
          JOVEM <span className="font-sans">&</span> TEEN
        </h2>
        <div className="max-w-md w-full mx-auto text-black text-base md:text-lg leading-relaxed mb-10 text-left min-h-[160px] md:min-h-[150px]">
          <TypewriterEffect
            words={bodyWords}
            className="text-left font-normal text-base md:text-lg"
            cursorClassName="bg-black"
          />
        </div>
        {/* US22: "Saiba mais" leva à missão, visão e valores. */}
        <Link
          to="/quem-somos"
          className="inline-block bg-white text-[#D5650D] hover:bg-neutral-100 transition-colors px-10 py-2 md:py-3 rounded-[2rem] text-lg md:text-xl tracking-wide shadow-sm"
        >
          Saiba mais
        </Link>
      </div>
    </section>
  );
}
