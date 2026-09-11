import { Link } from "react-router-dom";
import usePermissao from "../../hooks/usePermissao";
import { useAuth } from "../../context/AuthContext";

/* Acesso negado.

   A tela precisa dizer coisas diferentes para situações diferentes. Antes ela
   pedia login mesmo para quem já estava logado — inútil para o administrador de
   setor que caiu numa área que não é dele, porque autenticar de novo não muda
   nada. Agora ela mostra o que a pessoa de fato administra e leva até lá. */
export default function Unauthorized() {
  const { isAuthenticated } = useAuth();
  const { setores, ehAdmin, ROTULO_DO_SETOR, ROTA_DO_SETOR } = usePermissao();

  const temSetores = isAuthenticated && ehAdmin && setores.length > 0;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-[#FDF3EA]">
      <h1 className="text-6xl md:text-8xl font-black text-[#D5650D] mb-4">401</h1>
      <h2 className="text-2xl md:text-3xl font-bold text-[#1E1E1E] mb-6 text-center">
        Acesso Negado
      </h2>

      {!isAuthenticated ? (
        <>
          <p className="text-neutral-600 mb-8 text-center max-w-md">
            Você não tem permissão para acessar esta página. Faça login com uma conta
            de administrador.
          </p>
          <Link
            to="/login"
            className="bg-[#FF6D2C] hover:bg-[#e65c18] text-white px-8 py-3 rounded-full font-bold transition-colors shadow-md hover:scale-105"
          >
            Ir para Login
          </Link>
        </>
      ) : temSetores ? (
        <>
          <p className="text-neutral-600 mb-6 text-center max-w-md">
            Esta área pertence a outro setor. Você administra
            {setores.length > 1 ? " os setores abaixo:" : " o setor abaixo:"}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {setores.map((setor) => (
              <Link
                key={setor}
                to={ROTA_DO_SETOR[setor]}
                className="bg-[#FF6D2C] hover:bg-[#e65c18] text-white px-6 py-3 rounded-full font-bold transition-colors shadow-md hover:scale-105"
              >
                {ROTULO_DO_SETOR[setor]}
              </Link>
            ))}
          </div>
          <p className="text-neutral-500 text-sm text-center max-w-md">
            Se você precisa de acesso a esta área, peça à superadministradora.
          </p>
        </>
      ) : (
        <>
          <p className="text-neutral-600 mb-8 text-center max-w-md">
            Sua conta não administra nenhum setor do painel. Peça acesso à
            superadministradora.
          </p>
          <Link
            to="/"
            className="bg-[#FF6D2C] hover:bg-[#e65c18] text-white px-8 py-3 rounded-full font-bold transition-colors shadow-md hover:scale-105"
          >
            Voltar ao site
          </Link>
        </>
      )}
    </div>
  );
}
