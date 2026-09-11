/* Permissões do painel — módulo puro, sem dependência de API, de navegador ou
   de React, para que a regra de acesso possa ser testada isoladamente.

   O acesso vem dos papéis do JWT do Keycloak (`realm_access.roles`):

   · `superadmin`        — administra todos os setores e é o único que exclui
                           conteúdo e que cria ou remove administradores
   · `admin`             — acesso ao painel; os setores vêm dos papéis abaixo
   · `admin-eventos`     — setor Agenda/Eventos
   · `admin-produtos`    — setor Loja/Produtos
   · `admin-inscricoes`  — setor Inscrições

   Uma mesma pessoa pode ter mais de um papel de setor.

   Compatibilidade: um `admin` cujo token não traz nenhum papel de setor
   administra todos eles. É deliberado — enquanto o Keycloak não emitir os
   papéis novos, nenhum administrador atual perde o painel. O dia em que os
   papéis existirem, a restrição passa a valer sozinha.

   Aviso importante: esconder um botão não é controle de acesso. Isto protege a
   interface de oferecer o que a pessoa não pode fazer; a barreira que vale é a
   do servidor. */

export const SETOR = {
  EVENTOS: "eventos",
  PRODUTOS: "produtos",
  INSCRICOES: "inscricoes",
};

/* Setores que têm administrador próprio, na ordem em que aparecem no menu.
   Galeria, Líderes e Voluntários não têm — a cliente marcou apenas estes três. */
export const SETORES = [SETOR.EVENTOS, SETOR.PRODUTOS, SETOR.INSCRICOES];

export const PAPEL_ADMIN = "admin";
export const PAPEL_SUPERADMIN = "superadmin";

/* Papel do Keycloak que concede cada setor. */
export const PAPEL_DO_SETOR = {
  [SETOR.EVENTOS]: "admin-eventos",
  [SETOR.PRODUTOS]: "admin-produtos",
  [SETOR.INSCRICOES]: "admin-inscricoes",
};

export const ROTULO_DO_SETOR = {
  [SETOR.EVENTOS]: "Agenda e Eventos",
  [SETOR.PRODUTOS]: "Loja e Produtos",
  [SETOR.INSCRICOES]: "Inscrições",
};

/* Primeira tela de cada setor, usada para levar a pessoa a algum lugar útil. */
export const ROTA_DO_SETOR = {
  [SETOR.EVENTOS]: "/admin/eventos",
  [SETOR.PRODUTOS]: "/admin/produtos",
  [SETOR.INSCRICOES]: "/admin/voluntarios",
};

function listaDePapeis(roles) {
  return Array.isArray(roles) ? roles.filter((r) => typeof r === "string") : [];
}

/* Decodifica o payload de um JWT sem dependência externa e sem verificar
   assinatura — a verificação é do servidor. Devolve null se o token não for
   legível. */
export function lerPayloadDoToken(token) {
  try {
    const payload = String(token).split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/* Papéis declarados no token. Lista vazia quando o token falta, está ilegível
   ou já expirou — token expirado não concede nada. */
export function lerPapeisDoToken(token) {
  const claims = lerPayloadDoToken(token);
  if (!claims) return [];
  if (claims.exp && claims.exp * 1000 <= Date.now()) return [];
  return listaDePapeis(claims.realm_access?.roles);
}

export function ehSuperadmin(roles) {
  return listaDePapeis(roles).includes(PAPEL_SUPERADMIN);
}

export function ehAdmin(roles) {
  const papeis = listaDePapeis(roles);
  return papeis.includes(PAPEL_ADMIN) || papeis.includes(PAPEL_SUPERADMIN);
}

/* Setores que a pessoa administra.

   Superadmin administra todos. Admin com papéis de setor administra só os seus.
   Admin sem nenhum papel de setor administra todos, pela compatibilidade
   descrita no topo. Quem não é admin não administra nada. */
export function setoresDoUsuario(roles) {
  const papeis = listaDePapeis(roles);
  if (!ehAdmin(papeis)) return [];
  if (ehSuperadmin(papeis)) return [...SETORES];

  const proprios = SETORES.filter((setor) => papeis.includes(PAPEL_DO_SETOR[setor]));
  return proprios.length > 0 ? proprios : [...SETORES];
}

export function administraSetor(roles, setor) {
  if (!setor) return ehAdmin(roles);
  return setoresDoUsuario(roles).includes(setor);
}

/* Verdadeiro quando a pessoa administra apenas parte dos setores — usado para
   dizer na tela de acesso negado o que ela pode acessar. */
export function temAcessoParcial(roles) {
  const setores = setoresDoUsuario(roles);
  return setores.length > 0 && setores.length < SETORES.length;
}

/* Excluir conteúdo é restrito ao superadministrador. Critério explícito da
   história: o administrador de setor cria e edita, mas não apaga. */
export function podeExcluir(roles) {
  return ehSuperadmin(roles);
}

/* Criar e remover administradores é restrito ao superadministrador. */
export function podeGerenciarAdministradores(roles) {
  return ehSuperadmin(roles);
}

/* Para onde mandar a pessoa ao entrar no painel. O painel inicial serve a quem
   administra eventos ou produtos, porque é o que ele resume; quem só cuida de
   inscrições vai direto para a sua tela, em vez de encarar um painel vazio. */
export function rotaInicialDoPainel(roles) {
  const setores = setoresDoUsuario(roles);
  if (setores.length === 0) return "/unauthorized";
  if (setores.includes(SETOR.EVENTOS) || setores.includes(SETOR.PRODUTOS)) return "/admin";
  return ROTA_DO_SETOR[setores[0]];
}
