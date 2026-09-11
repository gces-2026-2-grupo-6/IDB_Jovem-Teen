import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { TOKEN_KEY } from "../services/api";
import {
  administraSetor,
  ehAdmin,
  ehSuperadmin,
  lerPayloadDoToken,
  podeExcluir,
  podeGerenciarAdministradores,
  rotaInicialDoPainel,
  setoresDoUsuario,
} from "../utils/permissoes";

const AuthContext = createContext(null);

/* Tempo máximo de inatividade antes de encerrar a sessão do admin (10 minutos) */
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

/* Eventos que contam como "atividade" do usuário e reiniciam a contagem */
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

/* Monta o usuário a partir das claims do JWT; retorna null se expirado/inválido.
   Os papéis vêm de `realm_access.roles`, que é exatamente onde a API os procura,
   e a leitura de setor fica em src/utils/permissoes.js. */
function userFromToken(token) {
  const claims = lerPayloadDoToken(token);
  if (!claims) return null;
  if (claims.exp && claims.exp * 1000 <= Date.now()) return null;
  const roles = claims.realm_access?.roles || [];
  return {
    id: claims.sub || "",
    nome: claims.name || claims.preferred_username || "",
    email: claims.email || "",
    roles,
    isAdmin: ehAdmin(roles),
    isSuperAdmin: ehSuperadmin(roles),
    setores: setoresDoUsuario(roles),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const u = userFromToken(token);
    if (!u) localStorage.removeItem(TOKEN_KEY);
    return u;
  });

  /* Login via Keycloak (Resource Owner Password Credentials) */
  const login = async (usuario, senha) => {
    try {
      const body = new URLSearchParams({
        username: usuario,
        password: senha,
        client_id: CLIENT_ID,
        grant_type: "password",
      });
      const { data } = await axios.post(
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
        body,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const token = data.access_token;
      const u = userFromToken(token);
      if (!u) {
        return { success: false, error: "Não foi possível validar a sessão." };
      }
      if (!u.isAdmin) {
        return { success: false, error: "Usuário sem permissão de administrador." };
      }

      localStorage.setItem(TOKEN_KEY, token);
      setUser(u);
      return { success: true };
    } catch (error) {
      const desc = error?.response?.data?.error_description;
      const msg =
        desc === "Invalid user credentials"
          ? "Usuário ou senha inválidos"
          : desc || "Erro ao fazer login. Tente novamente.";
      return { success: false, error: msg };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  /* Sessão por inatividade: enquanto houver usuário logado, qualquer atividade
     reinicia uma contagem de 10 min. Esgotado o tempo sem interação, desloga. */
  useEffect(() => {
    if (!user) return;

    let timerId;
    let lastActivity = 0;

    const resetTimer = () => {
      clearTimeout(timerId);
      timerId = setTimeout(logout, IDLE_TIMEOUT_MS);
    };

    /* Throttle: evita reiniciar o timer a cada pixel de mousemove */
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity < 1000) return;
      lastActivity = now;
      resetTimer();
    };

    resetTimer(); // começa a contar a partir do login
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, handleActivity, { passive: true })
    );

    return () => {
      clearTimeout(timerId);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [user, logout]);

  const isAuthenticated = !!user;
  const isAdmin = !!user?.isAdmin;
  const isSuperAdmin = !!user?.isSuperAdmin;

  /* Permissões derivadas dos papéis, expostas prontas para as telas não
     refazerem a conta cada uma do seu jeito. */
  const papeis = user?.roles || [];
  const permissoes = {
    setores: user?.setores || [],
    administra: (setor) => administraSetor(papeis, setor),
    podeExcluir: podeExcluir(papeis),
    podeGerenciarAdministradores: podeGerenciarAdministradores(papeis),
    rotaInicial: rotaInicialDoPainel(papeis),
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated, isAdmin, isSuperAdmin, ...permissoes }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
