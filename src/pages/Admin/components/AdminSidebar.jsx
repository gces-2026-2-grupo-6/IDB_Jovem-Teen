import { NavLink, useNavigate } from "react-router-dom";
import { Home, CalendarDays, Users, ShoppingCart, UsersRound, LogOut, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
const logoSvg = "/logo.svg";

const sidebarLinks = [
  { label: "Home", path: "/admin", icon: Home },
  { label: "Eventos", path: "/admin/eventos", icon: CalendarDays },
  { label: "Voluntários", path: "/admin/voluntarios", icon: Users },
  { label: "Produtos", path: "/admin/produtos", icon: ShoppingCart },
  { label: "Diretores & Líderes", path: "/admin/lideres", icon: UsersRound, superAdminOnly: true },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const { logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const links = sidebarLinks.filter((item) => !item.superAdminOnly || isSuperAdmin);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* overlay p/ fechar menu no mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        w-[85vw] max-w-[300px] md:w-[240px] md:max-w-none h-[100dvh] bg-gradient-to-b from-[#FF6D2C] to-[#E85A1B] flex flex-col shadow-xl fixed left-0 top-0 z-50 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* logo e botão fechar */}
        <div className="px-6 pt-6 pb-2 flex justify-between items-center">
          <img src={logoSvg} alt="IDB Jovem & Teen" className="h-10 w-auto" />
          <button onClick={onClose} className="md:hidden text-white/90 hover:text-white p-1">
            <X size={24} />
          </button>
        </div>

        {/* título */}
        <div className="px-6 pb-4">
          <span
            className="text-white font-bold tracking-wide"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.75rem" }}
          >
            Dashboard
          </span>
        </div>

        {/* links do menu */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 group
              ${isActive
                  ? "bg-white/25 text-white shadow-md"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={20}
                      className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"
                        }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  <svg
                    width="8"
                    height="14"
                    viewBox="0 0 8 14"
                    fill="none"
                    className={`transition-transform duration-200 ${isActive ? "translate-x-0.5" : ""
                      }`}
                  >
                    <path
                      d="M1 1L7 7L1 13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* botão de sair */}
        <div className="px-3 pb-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
          >
            <LogOut
              size={20}
              className="group-hover:scale-105 transition-transform duration-200"
            />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
