/* istanbul ignore file */
import { Link } from "react-router-dom";
import bgGif from "../../../assets/gifs/IDB_Jovem.gif";

const CountdownBox = ({ value, label }) => (
  <div className="flex flex-col items-center justify-center bg-[#D9D9D9]/50 w-16 h-20 md:w-20 md:h-24 rounded-sm shadow-lg">
    <span className="text-white font-black text-2xl md:text-4xl tabular-nums leading-none">
      {String(value).padStart(2, "0")}
    </span>
    <span className="text-white text-[10px] md:text-xs font-bold mt-1 md:mt-2 uppercase tracking-widest">
      {label}
    </span>
  </div>
);

export default function HeroSection({ countdown, nextEvent }) {
  return (
    <section className="relative w-full min-h-[calc(100dvh-70px)] md:min-h-[calc(100dvh-82px)] mt-[70px] md:mt-[82px] overflow-hidden flex flex-col justify-center items-center bg-black">
      <img
        src={bgGif}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        aria-hidden="true"
      />

      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full max-w-5xl mx-auto py-8">
        {/* Título principal */}
        <h1
          translate="no"
          className="text-white font-black uppercase leading-none tracking-tight"
          style={{
            fontSize: "clamp(2.8rem, 10vw, 8rem)",
            textShadow: "-4px 2px 0px #D5650D, 2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          IDB JOVEM & TEEN
        </h1>

        {/* Countdown */}
        <div className="mt-6 md:mt-10 w-full max-w-2xl">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 justify-center">
            <span className="text-white font-bold uppercase tracking-widest text-2xl md:text-3xl whitespace-nowrap drop-shadow-md">
              PRÓXIMO EVENTO:
            </span>
            <div className="flex items-center gap-2 md:gap-3">
              <CountdownBox value={countdown.days} label="dias" />
              <CountdownBox value={countdown.hours} label="horas" />
              <CountdownBox value={countdown.minutes} label="min" />
              <CountdownBox value={countdown.seconds} label="seg" />
            </div>
          </div>
        </div>

        {nextEvent && (
          <Link
            to={`/eventos/${nextEvent.slug}`}
            className="mt-8 md:mt-10 inline-block bg-orange-500 hover:bg-orange-600 transition-colors text-white font-bold px-8 py-3 md:px-10 md:py-4 rounded-sm uppercase tracking-wider text-base shadow-xl"
          >
            Ver evento
          </Link>
        )}
      </div>
    </section>
  );
}
