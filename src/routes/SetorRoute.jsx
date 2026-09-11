import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* Guarda de rota por setor.

   Recebe o setor exigido e deixa passar quem o administra. Sem `setor`, exige
   apenas ser administrador. Quem não está logado vai para o login; quem está
   logado mas não administra o setor vai para a tela de acesso negado — e não
   de volta ao login, que mandaria a pessoa autenticar de novo sem motivo. */
export default function SetorRoute({ setor }) {
  const { isAuthenticated, isAdmin, administra } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  if (setor && !administra(setor)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
