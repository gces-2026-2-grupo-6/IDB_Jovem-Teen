import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Images, Trash2 } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import usePermissao from "../../../../hooks/usePermissao";
import { excluirFotosDoAlbum, fetchAlbumDoEvento } from "../../../../services/eventService";

function plural(n, singular, pluralForm) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/* US18 — excluir fotos específicas do álbum de um evento, para atender na hora
   o responsável que pede a remoção da imagem de um menor, sem tirar o álbum
   inteiro do ar.

   - A superadministradora seleciona uma ou mais fotos e confirma (CA1).
   - As fotos somem do site; as outras fotos e os outros álbuns não mudam (CA2, CA4).
   - A capa é a primeira foto: excluída a capa, a seguinte assume (CA3).
   - Administrador de setor vê o álbum, mas não a opção de excluir (CA5).
   - O arquivo no Drive não é alterado (CA6). */
export default function AlbumDoEvento({ eventId, temAlbum }) {
  const { podeExcluir } = usePermissao();
  const [leitura, setLeitura] = useState({ carregando: true, fotos: [], erro: null });
  const [selecionadas, setSelecionadas] = useState([]);
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    if (!temAlbum) return undefined;
    let ativo = true;
    fetchAlbumDoEvento(eventId)
      .then((fotos) => ativo && setLeitura({ carregando: false, fotos, erro: null }))
      .catch(() =>
        ativo && setLeitura({ carregando: false, fotos: [], erro: "Não foi possível carregar o álbum." })
      );
    return () => {
      ativo = false;
    };
  }, [eventId, temAlbum]);

  const alternar = (id) =>
    setSelecionadas((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));

  const confirmar = async () => {
    setExcluindo(true);
    const resultado = await excluirFotosDoAlbum(eventId, selecionadas);
    setExcluindo(false);
    setConfirmando(false);
    if (!resultado.success) {
      setMensagem({ tipo: "erro", texto: resultado.error });
      return;
    }
    const removidas = selecionadas.length;
    setLeitura((atual) => ({ ...atual, fotos: atual.fotos.filter((f) => !selecionadas.includes(f.id)) }));
    setSelecionadas([]);
    setMensagem({
      tipo: "sucesso",
      texto: `${plural(removidas, "foto excluída", "fotos excluídas")} do site. O arquivo no Drive não foi alterado.`,
    });
  };

  const { carregando, fotos, erro } = leitura;
  const todasSelecionadas = fotos.length > 0 && selecionadas.length === fotos.length;

  return (
    <section aria-labelledby="titulo-album" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 id="titulo-album" className="flex items-center gap-2 font-bold text-[#1E1E1E] text-lg">
          <Images size={20} className="text-[#FF6D2C]" />
          Álbum do evento
          {temAlbum && !carregando && !erro && (
            <span className="text-sm font-semibold text-[#1E1E1E]/50">
              ({plural(fotos.length, "foto", "fotos")})
            </span>
          )}
        </h2>

        {podeExcluir && fotos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelecionadas(todasSelecionadas ? [] : fotos.map((f) => f.id))}
              className="text-sm font-semibold text-[#1E1E1E]/70 border border-gray-300 rounded-lg px-3 py-2 hover:border-[#FF6D2C] hover:text-[#FF6D2C] transition-colors"
            >
              {todasSelecionadas ? "Limpar seleção" : "Selecionar todas"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMensagem(null);
                setConfirmando(true);
              }}
              disabled={selecionadas.length === 0}
              className="inline-flex items-center gap-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              Excluir selecionadas{selecionadas.length > 0 ? ` (${selecionadas.length})` : ""}
            </button>
          </div>
        )}
      </div>

      {!temAlbum ? (
        <p className="text-sm text-[#1E1E1E]/50">Este evento não tem álbum de fotos cadastrado.</p>
      ) : carregando ? (
        <p role="status" className="text-sm text-[#1E1E1E]/50">Carregando fotos...</p>
      ) : erro ? (
        <p role="alert" className="text-sm font-semibold text-red-600">{erro}</p>
      ) : fotos.length === 0 ? (
        <p className="text-sm text-[#1E1E1E]/50">O álbum não tem fotos.</p>
      ) : (
        <>
          {!podeExcluir && (
            <p className="text-sm text-[#1E1E1E]/50 mb-4">
              Só a superadministradora pode excluir fotos do álbum.
            </p>
          )}
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {fotos.map((foto, indice) => {
              const marcada = selecionadas.includes(foto.id);
              const rotulo = `Foto ${indice + 1}${indice === 0 ? " (capa)" : ""}`;
              return (
                <li key={foto.id} data-testid="foto-do-album" className="relative">
                  <label
                    className={`block rounded-xl overflow-hidden aspect-square border-4 transition-colors ${
                      marcada ? "border-red-500" : "border-transparent"
                    } ${podeExcluir ? "cursor-pointer" : ""}`}
                  >
                    <img src={foto.url} alt={rotulo} className="w-full h-full object-cover" />
                    {podeExcluir && (
                      <input
                        type="checkbox"
                        checked={marcada}
                        onChange={() => alternar(foto.id)}
                        aria-label={`Selecionar ${rotulo.toLowerCase()}`}
                        className="absolute top-2 right-2 w-5 h-5 accent-red-500 cursor-pointer"
                      />
                    )}
                  </label>
                  {indice === 0 && (
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md">
                      Capa
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {mensagem && (
        <p
          role={mensagem.tipo === "erro" ? "alert" : "status"}
          className={`mt-4 flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-3 ${
            mensagem.tipo === "erro"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-green-50 border border-green-200 text-green-700"
          }`}
        >
          {mensagem.tipo === "sucesso" && <CheckCircle2 size={16} />}
          {mensagem.texto}
        </p>
      )}

      <Modal isOpen={confirmando} onClose={excluindo ? () => {} : () => setConfirmando(false)}>
        <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-xl max-w-md w-full text-center">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full border-[3px] border-red-500 flex items-center justify-center">
              <AlertCircle size={36} className="text-red-500" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-[#1E1E1E] leading-snug mb-4">
            Excluir {plural(selecionadas.length, "foto", "fotos")} do álbum?
          </h3>
          <p className="text-sm text-[#1E1E1E]/70 mb-6 text-left">
            {selecionadas.length === 1 ? "Ela deixa" : "Elas deixam"} de aparecer na galeria, na página do
            evento e em "Já aconteceram". As outras fotos continuam. O arquivo no Drive não é apagado.
          </p>
          <div className="flex justify-center gap-6">
            <button
              onClick={confirmar}
              disabled={excluindo}
              className="px-10 py-3 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {excluindo ? "Excluindo..." : "Sim"}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              disabled={excluindo}
              className="px-10 py-3 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Não
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
