import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { useGallery } from "./hooks/useGallery";

export default function Galeria() {
  const navigate = useNavigate();
  const { photos, loading } = useGallery();

  const [selectedEvent, setSelectedEvent] = useState(null);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#DC6803] flex items-center justify-center pt-[70px] md:pt-[82px]">
        <div className="animate-pulse text-white font-bold text-lg">
          Carregando galeria...
        </div>
      </main>
    );
  }

  // Agrupa as fotos por evento
  const albums = photos.reduce((acc, photo) => {
    const event = photo.event;

    if (!acc[event]) {
      acc[event] = [];
    }

    acc[event].push(photo);

    return acc;
  }, {});

  const albumEntries = Object.entries(albums);

  // Fotos do evento selecionado
  const selectedPhotos = selectedEvent
    ? albums[selectedEvent] || []
    : [];

  return (
    <main className="min-h-screen bg-[#DC6803] pt-[70px] md:pt-[82px]">

      {/* ================================================= */}
      {/* CABEÇALHO */}
      {/* ================================================= */}

      <section className="w-full max-w-6xl mx-auto px-6 pt-8 pb-4">

        <button
          onClick={() => {
            if (selectedEvent) {
              setSelectedEvent(null);
            } else {
              navigate(-1);
            }
          }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors mb-6"
          aria-label="Voltar"
        >
          {selectedEvent ? (
            <ChevronLeft size={22} className="text-white" />
          ) : (
            <ArrowLeft size={22} className="text-white" />
          )}
        </button>

        <h1
          className="text-center mb-2"
          style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
        >
          {selectedEvent ? (
            <span className="font-bold text-[#93370D]">
              {selectedEvent}
            </span>
          ) : (
            <>
              <span className="font-bold text-[#93370D]">
                Galeria de fotos{" "}
              </span>

              <em
                className="not-italic font-handwriting text-white"
                style={{
                  fontSize: "clamp(2.2rem, 5.5vw, 3.6rem)",
                }}
              >
                dos eventos
              </em>
            </>
          )}
        </h1>

        {selectedEvent && (
          <p className="text-center text-white/70 text-sm">
            {selectedPhotos.length}{" "}
            {selectedPhotos.length === 1 ? "foto" : "fotos"}
          </p>
        )}
      </section>

      {/* ================================================= */}
      {/* ÁLBUNS */}
      {/* ================================================= */}

      {!selectedEvent && albumEntries.length === 0 && (
        <section className="w-full max-w-6xl mx-auto px-6 py-10 pb-20">
          <p className="text-center text-white/80">
            Nenhuma foto publicada ainda.
          </p>
        </section>
      )}

      {!selectedEvent && albumEntries.length > 0 && (
        <section className="w-full max-w-6xl mx-auto px-6 py-10 pb-20">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

            {albumEntries.map(([event, eventPhotos]) => {
              const cover = eventPhotos[0];

              return (
                <button
                  key={event}
                  type="button"
                  onClick={() => setSelectedEvent(event)}
                  className="group text-left"
                >

                  <div className="relative overflow-hidden rounded-2xl aspect-[4/3] shadow-lg">

                    <img
                      src={cover.image}
                      alt={`Capa do álbum ${event}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Quantidade */}
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                      {eventPhotos.length}{" "}
                      {eventPhotos.length === 1 ? "foto" : "fotos"}
                    </div>

                    {/* Informações */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">

                      <h2 className="text-white font-bold text-xl">
                        {event}
                      </h2>

                      <p className="text-white/80 text-sm mt-1">
                        {cover.location}
                      </p>

                    </div>

                  </div>

                </button>
              );
            })}

          </div>
        </section>
      )}

      {/* ================================================= */}
      {/* FOTOS DO ÁLBUM */}
      {/* ================================================= */}

      {selectedEvent && (
        <section className="w-full max-w-6xl mx-auto px-6 py-10 pb-20">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {selectedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group cursor-pointer"
              >

                <div className="overflow-hidden rounded-2xl aspect-[4/3] shadow-lg">

                  <img
                    src={photo.image}
                    alt={`${photo.event} - ${photo.location}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                </div>

              </div>
            ))}

          </div>

        </section>
      )}

    </main>
  );


}
