import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

/**
 * Componente genérico de dropdown com suporte a opções coloridas.
 *
 * @param {{
 *   value: string,
 *   onChange: (newValue: string) => void,
 *   options: Array<{ value: string, label: string }>,
 *   styles: Record<string, { bg: string, text: string, border: string, hoverBg: string, optionBg: string, optionHover: string, optionText: string }>,
 *   className?: string
 * }} props
 */
export default function Dropdown({ value, onChange, options, styles, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const currentStyle = styles[value] || Object.values(styles)[0];
  const currentLabel = options.find((o) => o.value === value)?.label || "";

  /* O menu abria sempre logo abaixo do botão, sem conferir o espaço que
     sobrava. Na última linha de uma tabela em tela de celular ele caía fora
     da área visível, e não havia mais página para rolar: as opções ficavam
     inalcançáveis. Agora, quando não cabe embaixo, ele abre para cima; e a
     posição horizontal é limitada para não passar da borda direita.

     A altura vem do menu já renderizado quando ele existe; na primeira
     abertura, antes de existir, é estimada pelo número de opções. */
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    const MARGEM = 6;
    const ALTURA_POR_OPCAO = 36;
    const alturaMenu =
      menuRef.current?.offsetHeight || options.length * ALTURA_POR_OPCAO + 8;
    const larguraMenu = menuRef.current?.offsetWidth || 144;

    const cabeAbaixo = rect.bottom + MARGEM + alturaMenu <= window.innerHeight;
    const top = cabeAbaixo
      ? rect.bottom + MARGEM
      : Math.max(MARGEM, rect.top - MARGEM - alturaMenu);

    const left = Math.max(
      MARGEM,
      Math.min(rect.left, window.innerWidth - larguraMenu - MARGEM)
    );

    setMenuPos({ top, left });
  }, [options.length]);

  /* `useLayoutEffect` e não `useEffect`: o reposicionamento acontece antes da
     pintura, então o menu não aparece no lugar errado para depois saltar. É
     também aqui que o menu já está montado, o que permite medir a altura real
     em vez da estimativa. */
  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        buttonRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return;
      }
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (newValue) => {
    if (newValue !== value) {
      onChange(newValue);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Botão principal */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-bold
          border-2 ${currentStyle.border} ${currentStyle.bg} ${currentStyle.text}
          ${currentStyle.hoverBg}
          transition-all duration-200 cursor-pointer shadow-sm
          focus:outline-none focus:ring-2 focus:ring-offset-1
        `}
      >
        {currentLabel}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown options */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuPos.top, left: menuPos.left }}
            className="w-36 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[1000] animate-fade-in overflow-hidden"
          >
            {options.map((option) => {
              const optStyle = styles[option.value];
              const isActive = option.value === value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full text-left px-3 py-2 text-sm font-semibold
                    transition-colors duration-150
                    ${isActive ? `${optStyle.optionBg} ${optStyle.optionText}` : `text-gray-600 ${optStyle.optionHover}`}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${optStyle.bg}`} />
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
