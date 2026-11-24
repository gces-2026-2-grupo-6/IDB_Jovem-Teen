import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import { Search, XCircle, MapPin, Menu, X, User, ExternalLink } from "lucide-react";
import { NAV_LINKS } from "./header.constants";
import { fetchAllEvents } from "../../../services/eventService";
import { fetchLinkCadastroLideres } from "../../../services/painelService";
const logoSvg = "/logo.svg";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function SearchSuggestions({ items, onSelect }) {
  if (items.length === 0) return null;
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[10px] border border-[#E0E0E0] shadow-lg overflow-hidden z-50 max-h-[320px] overflow-y-auto">
      {items.map((event) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onSelect(event)}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FDF3EA] transition-colors text-left"
        >
          <img
            src={event.image}
            alt=""
            className="w-10 h-10 rounded-md object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1E1E1E] truncate">{event.title}</p>
            {event.location && (
              <p className="text-xs text-[#A0A0A0] truncate">{event.location}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export default function Header() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  /* US10: formulário externo onde os pastores das regionais se cadastram
     sozinhos. Vazio enquanto a superadministradora não fixa o link — e aí o
     botão não aparece, em vez de aparecer levando a lugar nenhum. */
  const [linkCadastro, setLinkCadastro] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    let active = true;
    fetchAllEvents()
      .then((events) => active && setAllEvents(events))
      .catch(() => { });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetchLinkCadastroLideres()
      .then((url) => active && setLinkCadastro(url))
      .catch(() => active && setLinkCadastro(""));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const insideDesktop = searchRef.current?.contains(e.target);
      const insideMobile = mobileSearchRef.current?.contains(e.target);
      if (!insideDesktop && !insideMobile) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const termo = normalizeText(searchTerm);
    if (termo.length < 1) return [];
    return allEvents
      .filter((event) =>
        normalizeText(
          [event.title, event.location, event.description, event.category].join(" ")
        ).includes(termo)
      )
      .slice(0, 6);
  }, [searchTerm, allEvents]);

  const handleSelectEvent = (event) => {
    navigate(`/eventos/${event.slug}`);
    setSearchTerm("");
    setShowSuggestions(false);
    setMobileMenuOpen(false);
  };

  const handleSearch = () => {
    if (suggestions.length > 0) handleSelectEvent(suggestions[0]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setSearchTerm("");
    setShowSuggestions(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleNavClick = (e, item) => {
    if (item.path.startsWith("/#")) {
      e.preventDefault();
      const sectionId = item.path.replace("/#", "");
      setMobileMenuOpen(false);

      if (location.pathname === "/") {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/");
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div className="w-full min-h-[70px] md:min-h-[82px] bg-white flex items-center justify-between px-4 sm:px-6 md:px-12 py-3 shadow-md">
        {/* Logo */}
        <Link to="/" className="shrink-0 transition-all duration-300 hover:scale-105">
          <img src={logoSvg} alt="IDB Jovem & Teen" className="h-[40px] w-auto md:h-[55px]" />
        </Link>

        {/* Desktop: Search + Eventos Próximos + Nav */}
        <div className="hidden lg:flex items-center gap-4 flex-1 max-w-[650px] mx-6">
          {/* Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-[395px]">
            <div className="h-[45px] rounded-[10px] border border-[#E0E0E0] bg-[#F2F2F2]/95 shadow-search flex items-center px-4 gap-3">
              <Search size={20} className="text-[#FF6D2C] cursor-pointer shrink-0" onClick={handleSearch} />
              <input
                type="text"
                aria-label="Pesquisar eventos"
                placeholder="Pesquisar eventos..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-[#A0A0A0] min-w-0"
              />
              {searchTerm && (
                <XCircle size={22} onClick={handleClear} className="lucide-x-circle text-[#FF6D2C] cursor-pointer hover:scale-110 transition-all shrink-0" />
              )}
            </div>
            {showSuggestions && (
              <SearchSuggestions items={suggestions} onSelect={handleSelectEvent} />
            )}
          </div>

          {/* Eventos Próximos */}
          <button
            onClick={() => navigate("/eventos-proximos")}
            className="h-[45px] rounded-[10px] border border-[#E0E0E0] bg-[#F2F2F2]/95 shadow-search flex items-center justify-center gap-2 px-4 hover:bg-[#FF6D2C] group transition-all duration-300 shrink-0"
          >
            <span className="text-[#FF6D2C] text-[14px] font-bold group-hover:text-white transition-all whitespace-nowrap">
              Eventos próximos
            </span>
            <MapPin size={21} className="text-[#FF6D2C] group-hover:text-white transition-all" />
          </button>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-2 shrink-0">
          {NAV_LINKS.map((item) => {
            const isHashLink = item.path.startsWith("/#");
            return (
              <NavLink
                key={item.path}
                to={isHashLink ? "/" : item.path}
                onClick={(e) => handleNavClick(e, item)}
                end={isHashLink}
              >
                {({ isActive }) => (
                  <div
                    className={`h-[45px] rounded-[10px] px-3 xl:px-4 flex items-center justify-center group transition-all duration-300 ${!isHashLink && isActive ? "bg-[#FF6D2C]/10" : "hover:bg-[#FF6D2C]"
                      }`}
                  >
                    <span
                      className={`text-[14px] xl:text-[15px] font-medium whitespace-nowrap transition-all duration-300 ${!isHashLink && isActive ? "text-[#FF6D2C]" : "text-black group-hover:text-white"
                        }`}
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
              className="h-[40px] rounded-[10px] px-3 xl:px-4 bg-[#FF6D2C] hover:bg-[#e65c18] text-white text-[13px] xl:text-[14px] font-bold whitespace-nowrap inline-flex items-center gap-1.5 shadow-sm hover:scale-[1.03] transition-all duration-300"
            >
              <span>Cadastro de líderes</span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}

          <NavLink to="/login">
            <button className="w-[35px] h-[35px] rounded-full bg-[#FF6D2C] flex items-center justify-center hover:scale-110 transition-all duration-300">
              <User size={20} className="text-white" />
            </button>
          </NavLink>
        </nav>

        {/* Mobile: Login + Hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          <NavLink to="/login">
            <button className="w-[35px] h-[35px] rounded-full bg-[#FF6D2C] flex items-center justify-center">
              <User size={18} className="text-white" />
            </button>
          </NavLink>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-[42px] h-[42px] rounded-xl bg-[#FF6D2C] flex items-center justify-center text-white"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-[70px] bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-[70px] right-0 w-[80%] max-w-[320px] h-[calc(100dvh-70px)] bg-white shadow-2xl z-50 lg:hidden transition-transform duration-300 ease-in-out flex flex-col ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Mobile Search */}
        <div className="p-4 border-b border-gray-100">
          <div ref={mobileSearchRef} className="relative">
            <div className="h-[45px] rounded-[10px] border border-[#E0E0E0] bg-[#F2F2F2]/95 flex items-center px-4 gap-3">
              <Search size={18} className="text-[#FF6D2C] cursor-pointer shrink-0" onClick={handleSearch} />
              <input
                type="text"
                aria-label="Pesquisar eventos"
                placeholder="Pesquisar eventos..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-[#A0A0A0] min-w-0"
              />
              {searchTerm && (
                <XCircle size={20} onClick={handleClear} className="lucide-x-circle text-[#FF6D2C] cursor-pointer shrink-0" />
              )}
            </div>
            {showSuggestions && (
              <SearchSuggestions items={suggestions} onSelect={handleSelectEvent} />
            )}
          </div>
        </div>

        {/* Mobile Nav Links */}
        <nav className="flex-1 flex flex-col p-4 gap-1 overflow-y-auto">
          {NAV_LINKS.map((item) => {
            const isHashLink = item.path.startsWith("/#");
            return (
              <NavLink
                key={item.path}
                to={isHashLink ? "/" : item.path}
                onClick={(e) => handleNavClick(e, item)}
                end={isHashLink}
              >
                {({ isActive }) => (
                  <div
                    className={`h-[50px] rounded-xl px-4 flex items-center transition-all duration-200 ${!isHashLink && isActive
                      ? "bg-[#FF6D2C]/10 text-[#FF6D2C]"
                      : "text-[#1E1E1E] hover:bg-[#FDF3EA]"
                      }`}
                  >
                    <span className="text-[16px] font-semibold">{item.label}</span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Mobile: cadastro de líderes e Eventos Próximos */}
        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
          {linkCadastro && (
            <a
              href={linkCadastro}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-cadastro-lideres-publico-mobile"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-[50px] rounded-xl border-2 border-[#FF6D2C] text-[#FF6D2C] font-bold flex items-center justify-center gap-2 hover:bg-[#FDF3EA] transition-colors"
            >
              Cadastro de líderes
              <ExternalLink size={18} aria-hidden="true" />
            </a>
          )}
          <button
            onClick={() => {
              navigate("/eventos-proximos");
              setMobileMenuOpen(false);
            }}
            className="w-full h-[50px] rounded-xl bg-[#FF6D2C] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#e65c18] transition-colors"
          >
            <MapPin size={20} />
            Eventos próximos
          </button>
        </div>
      </div>
    </header>
  );
}