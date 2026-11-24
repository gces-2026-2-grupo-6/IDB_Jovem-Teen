import { useState, useEffect } from "react";
import { fetchAllLeaders, splitLeaders } from "../../../services/liderService";

function LeaderCard({ leader, isPast }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-[120px] h-[120px] md:w-[150px] md:h-[150px] rounded-2xl mb-4 overflow-hidden ${isPast ? 'bg-[#D2691E]' : 'bg-[#E85A1B]'}`}>
        {leader.image ? (
          <img src={leader.image} alt={leader.name} className="w-full h-full object-cover" />
        ) : null}
      </div>
      <h4 translate="no" className={`font-handwriting text-2xl leading-none text-center ${isPast ? 'text-white' : 'text-black'}`}>
        {leader.name}
      </h4>
      <p className={`text-xs md:text-sm text-center font-semibold mt-1 max-w-[140px] leading-tight ${isPast ? 'text-white/80' : 'text-[#D5650D]'}`}>
        {leader.role}
      </p>
      {isPast && leader.term && (
        <p className="text-[11px] md:text-xs text-center text-white/60 mt-1">Gestão {leader.term}</p>
      )}
    </div>
  );
}

function EmptyMessage({ title, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 relative z-10">
      <h3 className="text-white text-4xl md:text-5xl font-handwriting tracking-wider opacity-90">{title}</h3>
      <p className="text-white/80 mt-4 text-center max-w-md font-medium">{text}</p>
    </div>
  );
}

export default function LideresSection() {
  const [showPast, setShowPast] = useState(false);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAllLeaders()
      .then((data) => active && setLeaders(data))
      .catch(() => active && setLeaders([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const { current: currentLeaders, past: pastLeaders } = splitLeaders(leaders);

  // Diretores nacionais (2 primeiros) em destaque; demais líderes abaixo
  const currentDirectors = currentLeaders.slice(0, 2);
  const currentOthers = currentLeaders.slice(2);

  const pastDirectors = pastLeaders.slice(0, 2);
  const pastOthers = pastLeaders.slice(2);

  if (loading) return null;

  return (
    <section className="w-full py-16 md:py-24 px-4 bg-[#D5650D]">
      <div className={`max-w-[1200px] mx-auto rounded-[3rem] p-8 md:p-16 transition-colors duration-500 relative ${showPast ? 'bg-[#7A3614]' : 'bg-[#FF7F11]'}`}>

        <div className="flex flex-col md:flex-row justify-between items-center mb-12 relative z-10">
          <h2 className="text-white font-black text-4xl md:text-5xl text-center md:text-left flex flex-col md:flex-row items-center gap-2">
            {showPast ? (
              "Galeria de Diretores"
            ) : (
              <>
                <span className="font-handwriting font-normal text-5xl md:text-6xl tracking-wide">Nosso Organograma</span>
              </>
            )}
          </h2>

          <button
            onClick={() => setShowPast(!showPast)}
            className="mt-6 md:mt-0 bg-white text-sm md:text-base text-black font-semibold px-6 py-2 rounded-full hover:scale-105 transition-transform"
          >
            {showPast ? "Líderes Atuais" : "Galeria de Diretores"}
          </button>
        </div>

        {showPast ? (
          pastLeaders.length === 0 ? (
            <EmptyMessage
              title="Em construção..."
              text="Em breve você poderá conhecer nossa galeria de diretores anteriores aqui."
            />
          ) : (
            <div className="flex flex-col items-center gap-12 relative z-10">
              <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                {pastDirectors.map(leader => <LeaderCard key={leader.id} leader={leader} isPast />)}
              </div>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                {pastOthers.map(leader => <LeaderCard key={leader.id} leader={leader} isPast />)}
              </div>
            </div>
          )
        ) : currentLeaders.length === 0 ? (
          <EmptyMessage
            title="Em breve..."
            text="Nossos líderes serão apresentados aqui assim que forem cadastrados."
          />
        ) : (
          <div className="flex flex-col items-center relative z-10">
            {/* Container principal */}
            <div className="bg-[#FFFDF9] rounded-[2.5rem] p-8 md:p-12 shadow-sm flex flex-col items-center max-w-[800px] w-full">
              <div className="flex flex-wrap justify-center gap-8 md:gap-24 mb-12">
                {currentDirectors.map(leader => <LeaderCard key={leader.id} leader={leader} />)}
              </div>
            </div>
            {/* Container secundário */}
            {currentOthers.length > 0 && (
              <div className="bg-[#FFFDF9] rounded-[2.5rem] p-8 md:p-12 shadow-sm flex flex-col items-center w-full max-w-full -mt-8 pt-16">
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                  {currentOthers.map(leader => <LeaderCard key={leader.id} leader={leader} />)}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
