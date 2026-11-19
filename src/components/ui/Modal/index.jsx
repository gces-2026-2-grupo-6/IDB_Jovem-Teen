import { useEffect, useRef } from "react";

/* Diálogo modal (US16, RNF02).

   Três coisas que o leitor de tela e o teclado precisam e que não vêm de
   graça num `<div>`:

   · **anunciar-se como diálogo** — `role="dialog"` com `aria-modal` faz o
     leitor dizer que abriu um diálogo e parar de ler o que está atrás;
   · **prender o foco** — sem isso o Tab sai do modal e vai para os botões da
     página de trás, que o `aria-modal` já declarou inertes. A pessoa
     continuaria "navegando" por controles que não consegue ver;
   · **devolver o foco** — ao fechar, o foco volta para o elemento que abriu o
     diálogo, em vez de voltar ao início da página.

   O Esc já fechava antes e continua. O clique no fundo também, e é o caminho
   do mouse; o do teclado é o Esc. */

const FOCALIZAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ isOpen, onClose, children, ariaLabel = "Diálogo" }) {
  const caixaRef = useRef(null);
  /* Quem tinha o foco antes de abrir, para devolvê-lo ao fechar. */
  const focoAnteriorRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    focoAnteriorRef.current = document.activeElement;

    /* O primeiro controle do diálogo recebe o foco; se não houver nenhum, a
       própria caixa o recebe, para o leitor anunciar o conteúdo. */
    const caixa = caixaRef.current;
    const primeiro = caixa?.querySelector(FOCALIZAVEIS);
    (primeiro || caixa)?.focus();

    return () => {
      /* `focus` em elemento que saiu do documento não faz nada e não quebra. */
      focoAnteriorRef.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const aoTeclar = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const caixa = caixaRef.current;
      if (!caixa) return;

      const focalizaveis = [...caixa.querySelectorAll(FOCALIZAVEIS)];
      if (focalizaveis.length === 0) {
        e.preventDefault();
        return;
      }

      /* O Tab é conduzido aqui do começo ao fim, em vez de só nas pontas da
         lista.

         Antes, no meio da lista, a navegação era deixada para o navegador —
         o que funciona no Chromium mas não no WebKit, que inclui o <body> na
         ordem de tabulação: o foco saía do diálogo por um passo antes de
         voltar. Decidindo o próximo elemento aqui, o foco fica preso em
         qualquer motor. */
      const atual = document.activeElement;
      const posicao = focalizaveis.indexOf(atual);
      const passo = e.shiftKey ? -1 : 1;

      /* Foco fora da lista (o <body>, por exemplo): entra pela ponta que faz
         sentido para a direção. */
      const proximo =
        posicao === -1
          ? e.shiftKey
            ? focalizaveis.length - 1
            : 0
          : (posicao + passo + focalizaveis.length) % focalizaveis.length;

      e.preventDefault();
      focalizaveis[proximo].focus();
    };

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Fundo decorativo: o leitor de tela não tem o que anunciar aqui. */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" aria-hidden="true" />
      <div
        ref={caixaRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className="relative z-10 animate-scale-in focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
