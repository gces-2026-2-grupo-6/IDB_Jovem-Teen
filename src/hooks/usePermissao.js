import { useAuth } from "../context/AuthContext";
import { ROTULO_DO_SETOR, ROTA_DO_SETOR, SETOR, SETORES } from "../utils/permissoes";

/* Ponto único de consulta de permissão para as telas do painel.

   Responde três perguntas, e só essas:

     const { administra, podeExcluir, ehSuperadmin } = usePermissao();

     administra(SETOR.PRODUTOS)   // posso ver este setor?
     podeExcluir                  // posso apagar conteúdo?
     ehSuperadmin                 // sou superadministrador?

   Existe para que cada tela não refaça a conta a partir dos papéis do token —
   quando isso se espalha, as telas divergem e uma delas passa a mostrar o que
   não deveria. A regra em si mora em src/utils/permissoes.js. */
export default function usePermissao() {
  const {
    user,
    setores,
    administra,
    podeExcluir,
    podeGerenciarAdministradores,
    rotaInicial,
    isAdmin,
    isSuperAdmin,
  } = useAuth();

  return {
    /* setores que a pessoa administra, na ordem do menu */
    setores,
    administra,
    podeExcluir,
    podeGerenciarAdministradores,
    rotaInicial,
    ehAdmin: isAdmin,
    ehSuperadmin: isSuperAdmin,
    /* o próprio usuário, para telas que precisam se comparar com ele */
    usuario: user,
    /* constantes reexportadas para a tela não importar de dois lugares */
    SETOR,
    SETORES,
    ROTULO_DO_SETOR,
    ROTA_DO_SETOR,
  };
}
