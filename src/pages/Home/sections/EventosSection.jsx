import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import defaultEventImage from "../../../assets/images/idbJovemOne.png";
import EventStatusNotice from "../../../components/ui/EventStatusNotice";

export default function EventosSection({ events = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselEvents = events.slice(0, 4);

  useEffect(() => {
    if (carouselEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselEvents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselEvents.length]);

  const featured = carouselEvents[currentIndex];
  const coverImage = featured?.image || defaultEventImage;

  return (
    <section className="w-full bg-[#8A3816] py-16 md:py-24 overflow-hidden">
      {/* Cabeçalho */}
      <div className="w-full max-w-6xl mx-auto px-4 mb-16 text-center">
        <h2 className="font-handwriting text-white flex flex-col items-center justify-center leading-[0.85]">
          <span className="uppercase" style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)" }}>PROGRAMAÇÃO</span>
          <span className="lowercase -mt-2 md:-mt-4" style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)" }}>conheça nossos</span>
          <span className="lowercase -mt-2 md:-mt-4" style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)" }}>eventos</span>
        </h2>
      </div>

      {/* Evento em destaque (Carrossel) */}
      {featured && (
        <div className="w-full max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Imagem com botão Saiba mais*/}
          <div className="relative z-20 group w-full h-[400px] md:h-[550px] border-[2px] border-neutral-900 bg-neutral-900 overflow-hidden shrink-0 shadow-lg">
            <img
              key={coverImage}
              src={coverImage}
              alt={featured.title}
              onError={(e) => {
                if (e.currentTarget.src !== defaultEventImage) {
                  e.currentTarget.src = defaultEventImage;
                }
              }}
              className="w-full h-full object-cover animate-fade-in transition-transform duration-[7000ms] ease-out group-hover:scale-105"
            />

            {/* Saiba mais */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
              <Link
                to={`/eventos/${featured.slug}`}
                className="inline-block bg-white text-[#DE6B16] font-semibold px-12 py-3 rounded-full text-base md:text-lg shadow-xl hover:bg-neutral-100 transition-colors whitespace-nowrap"
              >
                Saiba mais
              </Link>
            </div>
          </div>

          {/* Info do evento */}
          <div key={featured.id} className="relative z-10 flex flex-col items-center justify-center animate-fade-in-up px-4 min-w-0">

            {/* Container oval de fundo*/}
            <div className="relative z-10 mb-8 flex justify-center items-center py-8 px-4 md:px-6 w-full max-w-[90%] sm:max-w-[85%] md:max-w-[420px] aspect-[4/3] sm:aspect-auto sm:min-h-[160px]">

              <div
                className="absolute inset-0 bg-[#DE6B16] rounded-[100%] -z-10 shadow-lg"
                style={{ transform: "scale(1.1, 1.2)" }}
              />

              <h3
                className="font-black uppercase leading-none text-white text-center tracking-tighter w-full line-clamp-3 sm:line-clamp-4 py-1"
                style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)", transform: "scaleY(1.05)" }}
                title={featured.title}
              >
                {featured.title}
              </h3>
            </div>

            <p 
              className="text-white text-base md:text-lg font-medium leading-relaxed text-center max-w-md mt-2 relative z-10 line-clamp-3 sm:line-clamp-4"
              title={featured.description}
            >
              {featured.description}
            </p>

            {/* Aviso na home (US14, CA2): o evento em destaque continua no
                carrossel, com a situação dita por extenso. */}
            <EventStatusNotice event={featured} className="mt-4 relative z-10" />
          </div>
        </div>
      )}
    </section>
  );
}
