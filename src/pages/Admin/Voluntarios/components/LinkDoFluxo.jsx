import { ExternalLink, LinkIcon } from "lucide-react";
import { toFormResponseUrl } from "../../../../services/eventService";

/* O link de inscrição do fluxo, mostrado na própria listagem dele.

   Cada fluxo tem o seu (US09), e é daqui que a administradora copia o
   endereço para divulgar — por isso o link aparece em texto, e não só como
   botão. Quando o evento não abriu aquele fluxo, o aviso diz onde cadastrar,
   em vez de deixar a tela muda. */
export default function LinkDoFluxo({ link, rotulo, eventId }) {
  if (!link) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-200 px-5 py-4">
        <p className="text-sm text-[#1E1E1E]/50">
          Este evento ainda não tem link de inscrição para {rotulo}. Cadastre em{" "}
          <a
            href={`/admin/eventos/${eventId}/editar`}
            className="font-bold text-[#FF6D2C] hover:underline"
          >
            editar evento
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <LinkIcon size={16} className="text-[#FF6D2C] shrink-0" />
        <span className="text-sm text-[#1E1E1E]/70 truncate">{link}</span>
      </div>
      <a
        href={toFormResponseUrl(link)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-bold border-2 border-[#FF6D2C] text-[#FF6D2C] px-3 py-1.5 rounded-md hover:bg-[#FF6D2C] hover:text-white transition-colors shrink-0"
      >
        <ExternalLink size={12} />
        Ver formulário
      </a>
    </div>
  );
}
