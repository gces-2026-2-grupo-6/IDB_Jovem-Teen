import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* Porta de entrada do painel: exige sessão e papel de administrador.

   A distinção importa — quem não está autenticado precisa fazer login, mas
   quem já está e não é administrador não ganha nada voltando ao login. */
export default function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
