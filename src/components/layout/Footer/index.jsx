import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { FaInstagram, FaFacebookF } from "react-icons/fa6";
import useInstitucional from "../../../hooks/useInstitucional";
const logoSvg = "/logo.svg";

export default function Footer() {
  /* US22: a missão do rodapé é a mesma que a superadministradora edita. */
  const { conteudo } = useInstitucional();

  return (
    <footer id="contato" className="w-full bg-white text-neutral-800 border-t border-neutral-200">
      <div className="w-full max-w-[1400px] mx-auto px-4 py-16 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center md:text-left">

          {/* Esquerda - Contato */}
          <div className="flex flex-col gap-6 md:pl-10">
            <h3 className="text-[#FF7F11] font-bold tracking-wide uppercase text-2xl">
              ENTRE EM CONTATO
            </h3>
            <ul className="flex flex-col gap-4">
              <li>
                <a href="mailto:idbjovemnacional@gmail.com" className="flex items-center gap-3 text-neutral-700 hover:text-[#FF7F11] transition-colors font-semibold text-sm">
                  <div className="w-6 h-6 flex items-center justify-center border-2 border-neutral-800 rounded-sm">
                    <Mail size={14} className="text-neutral-800" strokeWidth={2.5} />
                  </div>
                  <span>idbjovemnacional@gmail.com</span>
                </a>
              </li>
              <li>
                <a href="https://instagram.com/idbjovemoficial" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-700 hover:text-[#FF7F11] transition-colors font-semibold text-sm">
                  <div className="w-6 h-6 flex items-center justify-center border-2 border-neutral-800 rounded-sm">
                    <FaInstagram size={14} className="text-neutral-800" />
                  </div>
                  <span>@idbjovemoficial</span>
                </a>
              </li>
              <li>
                <a href="https://facebook.com/idbjovemoficial" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-700 hover:text-[#FF7F11] transition-colors font-semibold text-sm">
                  <div className="w-6 h-6 flex items-center justify-center border-2 border-neutral-800 rounded-sm">
                    <FaFacebookF size={14} className="text-neutral-800" />
                  </div>
                  <span>@idbjovemoficial</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Centro - Logos e Missão */}
          <div className="flex flex-col items-center gap-6 justify-center">
            <div className="flex items-center gap-6">
              <img src={logoSvg} alt="IDB Jovem & Teen" className="w-[70px] h-auto shrink-0" />
              <div className="w-[2px] h-12 bg-neutral-200 rounded-full"></div>
              <img src="/logo_geral.png" alt="Logo IDB Geral" className="h-[60px] w-auto shrink-0 object-contain" />
            </div>
            {conteudo.missao && (
              <p className="text-neutral-600 text-sm leading-relaxed max-w-[320px] font-bold text-center">
                {conteudo.missao}
              </p>
            )}
            <Link
              to="/quem-somos"
              className="text-sm font-bold text-[#C2410C] hover:text-[#9A3412] underline underline-offset-4"
            >
              Missão, visão e valores
            </Link>
          </div>
          {/* Direita - Botões */}
          <div className="flex flex-col items-start md:items-end gap-6 md:pr-10">
            <Link
              to="/login"
              className="px-10 py-2 border-[2.5px] border-[#FF7F11] text-[#FF7F11] bg-white font-bold rounded-2xl hover:bg-orange-50 transition-all shadow-[4px_4px_0_#2B2B2B] active:translate-y-1 active:shadow-none"
            >
              Login
            </Link>
            <Link
              to="/eventos"
              className="px-6 py-3 bg-[#FF7F11] text-white font-bold rounded-2xl hover:bg-[#E56A00] transition-all shadow-[4px_4px_0_#2B2B2B] active:translate-y-1 active:shadow-none uppercase tracking-wide text-sm border-[2.5px] border-[#2B2B2B]"
            >
              SEJA UM VOLUNTÁRIO
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
