import { agruparPorFuncao, comProtocolo } from "../../../services/speakerService";

/* Convidados do evento, separados por função.

   Antes o título era fixo em "Palestrantes" e todo mundo caía embaixo dele —
   uma banda aparecia anunciada como palestrante. Agora cada grupo tem o seu
   título, e grupos vazios não aparecem. */
export default function SpeakerList({ speakers = [] }) {
  const grupos = agruparPorFuncao(speakers);
  if (grupos.length === 0) return null;

  return (
    <section className="w-full bg-[#FF6D2C] py-12 md:py-16">
      <div className="w-full max-w-6xl mx-auto px-6 flex flex-col gap-12">
        {grupos.map((grupo) => (
        <div key={grupo.funcao}>
        {/* Título */}
        <h2
          className="font-handwriting text-white mb-10"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
        >
          {grupo.titulo}
        </h2>

        {/* Grid de convidados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 md:gap-10">
          {grupo.convidados.map((speaker) => (
            <div key={speaker.id} className="flex flex-col items-center text-center gap-3">
              {/* Foto circular com borda */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-3 border-white/30 shadow-lg">
                <img
                  src={speaker.image}
                  alt={speaker.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Nome */}
              <h3 className="text-white font-bold text-sm md:text-base leading-tight">
                {speaker.name}
              </h3>

              {/* Profissão */}
              <p className="text-white/80 text-xs md:text-sm -mt-1">
                {speaker.role}
              </p>

              {/* Mini-biografia, quando houver */}
              {speaker.miniBio && (
                <p className="text-white/70 text-xs leading-snug max-w-[200px]">
                  {speaker.miniBio}
                </p>
              )}

              {/* Redes sociais */}
              {speaker.redes?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-0.5">
                  {speaker.redes.map((rede) => (
                    <a
                      key={rede.rede}
                      href={comProtocolo(rede.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-white/90 underline underline-offset-2 hover:text-white transition-colors"
                    >
                      {rede.rede}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
        ))}
      </div>
    </section>
  );
}
