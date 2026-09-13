import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* Restringe rotas que exigem o papel superadmin — criar e remover
   administradores, e qualquer exclusão de conteúdo.

   Antes o administrador comum era jogado na listagem de produtos, o que passou
   a ser errado: administrador de setor pode não ter acesso a produtos. Agora
   segue para a tela de acesso negado, que explica o que ele pode acessar. */
export default function SuperAdminRoute() {
  const { isAuthenticated, isSuperAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
