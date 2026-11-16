import { Download } from "lucide-react";

/* Galeria do evento, com download por foto (US11, CA5).

   O endereço vem pronto do back-end (`url_download`): o arquivo sai com o nome
   original e não pede login. O front não monta URL do Drive. */
export default function EventGallery({ gallery = [] }) {
  if (gallery.length === 0) return null;

  return (
    <section className="w-full bg-white py-14 md:py-20">
      <div className="w-full max-w-6xl mx-auto px-6">
        <h2
          className="font-bold text-[#1E1E1E] text-center mb-10"
          style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
        >
          Galeria do evento
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {gallery.map((item, index) => {
            /* Tolera tanto o objeto da API quanto uma string solta, que é como
               a galeria era montada antes de a foto passar a trazer o link de
               download. */
            const url = typeof item === "string" ? item : item.url;
            const downloadUrl = typeof item === "string" ? "" : item.downloadUrl;
            /* O alt descreve a foto para quem não a vê; o nome do arquivo
               ("foto1.jpg") não descreve nada, então serve só para nomear a
               ação de baixar. */
            const alt = `Foto ${index + 1} do evento`;
            const nome = (typeof item === "string" ? "" : item.nome) || alt;

            return (
              <div
                key={(typeof item === "string" ? item : item.id) ?? index}
                className="relative group overflow-hidden rounded-lg aspect-square"
              >
                <img
                  src={url}
                  alt={alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download
                    title={`Baixar ${nome}`}
                    aria-label={`Baixar ${nome}`}
                    /* Sempre acessível ao teclado e ao toque; o hover só
                       controla a opacidade no mouse. O foco traz de volta. */
                    className="absolute bottom-2 right-2 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-black/60 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 hover:bg-black/80 transition-opacity"
                  >
                    <Download size={16} />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
