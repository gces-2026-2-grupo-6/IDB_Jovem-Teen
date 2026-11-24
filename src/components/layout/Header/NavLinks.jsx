import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { User, ExternalLink } from "lucide-react";
import { NAV_LINKS } from "./header.constants";
import { fetchLinkCadastroLideres } from "../../../services/painelService";

export default function NavLinks() {
  const navigate = useNavigate();
  const location = useLocation();
  const [linkCadastro, setLinkCadastro] = useState("");

  useEffect(() => {
    let active = true;
    fetchLinkCadastroLideres()
      .then((url) => active && setLinkCadastro(url))
      .catch(() => active && setLinkCadastro(""));
    return () => {
      active = false;
    };
  }, []);

  const handleClick = (e, item) => {
    if (item.path.startsWith("/#")) {
      e.preventDefault();
      const sectionId = item.path.replace("/#", "");

      if (location.pathname === "/") {
        // Já está na Home — apenas rola
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        // Navega para Home e depois rola
        navigate("/");
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  };

  return (
    <nav className="flex items-center gap-2 shrink-0">
      {NAV_LINKS.map((item) => {
        const isHashLink = item.path.startsWith("/#");

        return (
          <NavLink
            key={item.path}
            to={isHashLink ? "/" : item.path}
            onClick={(e) => handleClick(e, item)}
            end={isHashLink}
          >
            {({ isActive }) => (
              <div
                className={`
                  h-[45px]
                  rounded-[10px]
                  px-4
                  flex
                  items-center
                  justify-center
                  group
                  transition-all
                  duration-300
                  ${
                    !isHashLink && isActive
                      ? "bg-[#FF6D2C]/10"
                      : "hover:bg-[#FF6D2C]"
                  }
                `}
              >
                <span
                  className={`
                    text-[15px]
                    font-medium
                    whitespace-nowrap
                    transition-all
                    duration-300
                    ${
                      !isHashLink && isActive
                        ? "text-[#FF6D2C]"
                        : "text-black group-hover:text-white"
                    }
                  `}
                >
                  {item.label}
                </span>
              </div>
            )}
          </NavLink>
        );
      })}

      {linkCadastro && (
        <a
          href={linkCadastro}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-cadastro-lideres-publico"
          className="
            h-[40px]
            rounded-[10px]
            px-4
            bg-[#FF6D2C]
            hover:bg-[#e65c18]
            text-white
            text-[14px]
            font-bold
            whitespace-nowrap
            inline-flex
            items-center
            gap-1.5
            shadow-sm
            hover:scale-[1.03]
            transition-all
            duration-300
          "
        >
          <span>Cadastro de líderes nacionais</span>
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}

      <NavLink to="/login">
        <button
          className="
            w-[35px]
            h-[35px]
            rounded-full
            bg-[#FF6D2C]
            flex
            items-center
            justify-center
            hover:scale-110
            transition-all
            duration-300
          "
        >
          <User size={20} className="text-white" />
        </button>
      </NavLink>
    </nav>
  );
}