import { test, expect } from '@playwright/test';
import {
  PAPEL_DO_SETOR,
  ROTA_DO_SETOR,
  SETOR,
  SETORES,
  administraSetor,
  ehAdmin,
  ehSuperadmin,
  lerPapeisDoToken,
  podeExcluir,
  podeGerenciarAdministradores,
  rotaInicialDoPainel,
  setoresDoUsuario,
  temAcessoParcial,
} from '../../src/utils/permissoes.js';

/* Perfis da matriz de permissão da US03. */
const SUPERADMIN = ['admin', 'superadmin'];
const ADMIN_SEM_SETOR = ['admin'];
const ADMIN_EVENTOS = ['admin', 'admin-eventos'];
const ADMIN_PRODUTOS = ['admin', 'admin-produtos'];
const ADMIN_INSCRICOES = ['admin', 'admin-inscricoes'];
const ADMIN_DOIS_SETORES = ['admin', 'admin-eventos', 'admin-inscricoes'];
const SEM_PAPEL = ['offline_access', 'uma_authorization'];

test.describe('reconhecimento de administrador', () => {
  test('admin e superadmin entram no painel', () => {
    expect(ehAdmin(SUPERADMIN)).toBe(true);
    expect(ehAdmin(ADMIN_EVENTOS)).toBe(true);
  });

  test('quem não tem papel de administrador não entra', () => {
    expect(ehAdmin(SEM_PAPEL)).toBe(false);
    expect(ehAdmin([])).toBe(false);
    expect(ehAdmin(null)).toBe(false);
  });

  test('só superadmin é superadmin', () => {
    expect(ehSuperadmin(SUPERADMIN)).toBe(true);
    expect(ehSuperadmin(ADMIN_EVENTOS)).toBe(false);
    expect(ehSuperadmin(ADMIN_SEM_SETOR)).toBe(false);
  });

  test('entrada estranha não derruba a conta', () => {
    expect(ehAdmin(['admin', null, 42])).toBe(true);
    expect(setoresDoUsuario('admin')).toEqual([]);
  });
});

test.describe('setores por perfil', () => {
  test('superadmin administra todos os setores', () => {
    expect(setoresDoUsuario(SUPERADMIN)).toEqual(SETORES);
  });

  test('administrador de setor administra só o seu', () => {
    expect(setoresDoUsuario(ADMIN_EVENTOS)).toEqual([SETOR.EVENTOS]);
    expect(setoresDoUsuario(ADMIN_PRODUTOS)).toEqual([SETOR.PRODUTOS]);
    expect(setoresDoUsuario(ADMIN_INSCRICOES)).toEqual([SETOR.INSCRICOES]);
  });

  test('uma mesma pessoa pode responder por mais de um setor', () => {
    /* Critério explícito da história. */
    expect(setoresDoUsuario(ADMIN_DOIS_SETORES)).toEqual([SETOR.EVENTOS, SETOR.INSCRICOES]);
  });

  test('admin sem papel de setor mantém acesso a tudo', () => {
    /* Compatibilidade deliberada: enquanto o Keycloak não emitir os papéis
       novos, nenhum administrador atual perde o painel. */
    expect(setoresDoUsuario(ADMIN_SEM_SETOR)).toEqual(SETORES);
  });

  test('quem não é administrador não administra setor nenhum', () => {
    expect(setoresDoUsuario(SEM_PAPEL)).toEqual([]);
    /* Papel de setor sem o papel de admin não abre o painel. */
    expect(setoresDoUsuario(['admin-eventos'])).toEqual([]);
  });

  test('existem exatamente três setores, os que a cliente marcou', () => {
    expect(SETORES).toEqual([SETOR.EVENTOS, SETOR.PRODUTOS, SETOR.INSCRICOES]);
    expect(Object.values(PAPEL_DO_SETOR)).toEqual([
      'admin-eventos',
      'admin-produtos',
      'admin-inscricoes',
    ]);
  });
});

test.describe('administraSetor — a matriz', () => {
  const matriz = [
    { nome: 'superadmin', papeis: SUPERADMIN, eventos: true, produtos: true, inscricoes: true },
    { nome: 'admin sem setor', papeis: ADMIN_SEM_SETOR, eventos: true, produtos: true, inscricoes: true },
    { nome: 'admin de eventos', papeis: ADMIN_EVENTOS, eventos: true, produtos: false, inscricoes: false },
    { nome: 'admin de produtos', papeis: ADMIN_PRODUTOS, eventos: false, produtos: true, inscricoes: false },
    { nome: 'admin de inscrições', papeis: ADMIN_INSCRICOES, eventos: false, produtos: false, inscricoes: true },
    { nome: 'admin de dois setores', papeis: ADMIN_DOIS_SETORES, eventos: true, produtos: false, inscricoes: true },
    { nome: 'sem papel', papeis: SEM_PAPEL, eventos: false, produtos: false, inscricoes: false },
  ];

  for (const perfil of matriz) {
    test(`${perfil.nome}`, () => {
      expect(administraSetor(perfil.papeis, SETOR.EVENTOS)).toBe(perfil.eventos);
      expect(administraSetor(perfil.papeis, SETOR.PRODUTOS)).toBe(perfil.produtos);
      expect(administraSetor(perfil.papeis, SETOR.INSCRICOES)).toBe(perfil.inscricoes);
    });
  }
});

test.describe('exclusão e gestão de administradores', () => {
  test('só o superadministrador exclui conteúdo', () => {
    expect(podeExcluir(SUPERADMIN)).toBe(true);
    expect(podeExcluir(ADMIN_EVENTOS)).toBe(false);
    expect(podeExcluir(ADMIN_SEM_SETOR)).toBe(false);
    expect(podeExcluir(SEM_PAPEL)).toBe(false);
  });

  test('só o superadministrador cria e remove administradores', () => {
    expect(podeGerenciarAdministradores(SUPERADMIN)).toBe(true);
    expect(podeGerenciarAdministradores(ADMIN_PRODUTOS)).toBe(false);
    expect(podeGerenciarAdministradores(ADMIN_SEM_SETOR)).toBe(false);
  });

  test('administrar um setor não dá direito de excluir', () => {
    /* A distinção da história: quem cuida do setor cria e edita, mas não apaga. */
    expect(administraSetor(ADMIN_PRODUTOS, SETOR.PRODUTOS)).toBe(true);
    expect(podeExcluir(ADMIN_PRODUTOS)).toBe(false);
  });
});

test.describe('acesso parcial', () => {
  test('quem administra parte dos setores tem acesso parcial', () => {
    expect(temAcessoParcial(ADMIN_EVENTOS)).toBe(true);
    expect(temAcessoParcial(ADMIN_DOIS_SETORES)).toBe(true);
  });

  test('quem administra tudo ou nada não tem acesso parcial', () => {
    expect(temAcessoParcial(SUPERADMIN)).toBe(false);
    expect(temAcessoParcial(ADMIN_SEM_SETOR)).toBe(false);
    expect(temAcessoParcial(SEM_PAPEL)).toBe(false);
  });
});

test.describe('rota inicial do painel', () => {
  test('quem administra eventos ou produtos começa no painel', () => {
    expect(rotaInicialDoPainel(SUPERADMIN)).toBe('/admin');
    expect(rotaInicialDoPainel(ADMIN_EVENTOS)).toBe('/admin');
    expect(rotaInicialDoPainel(ADMIN_PRODUTOS)).toBe('/admin');
  });

  test('quem só cuida de inscrições vai direto para a sua tela', () => {
    /* O painel resume eventos e produtos; para essa pessoa ele estaria vazio. */
    expect(rotaInicialDoPainel(ADMIN_INSCRICOES)).toBe(ROTA_DO_SETOR[SETOR.INSCRICOES]);
  });

  test('quem não administra nada vai para acesso negado', () => {
    expect(rotaInicialDoPainel(SEM_PAPEL)).toBe('/unauthorized');
  });
});

test.describe('leitura de papéis do token', () => {
  const base64url = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  const montarToken = (payload) =>
    `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.assinatura`;

  const daquiAUmaHora = () => Math.floor(Date.now() / 1000) + 3600;
  const umaHoraAtras = () => Math.floor(Date.now() / 1000) - 3600;

  test('lê os papéis de realm_access, onde a API os procura', () => {
    const token = montarToken({
      exp: daquiAUmaHora(),
      realm_access: { roles: ['admin', 'admin-eventos'] },
    });
    expect(lerPapeisDoToken(token)).toEqual(['admin', 'admin-eventos']);
  });

  test('token expirado não concede papel nenhum', () => {
    const token = montarToken({
      exp: umaHoraAtras(),
      realm_access: { roles: ['admin', 'superadmin'] },
    });
    expect(lerPapeisDoToken(token)).toEqual([]);
    expect(podeExcluir(lerPapeisDoToken(token))).toBe(false);
  });

  test('token ausente ou ilegível não concede papel nenhum', () => {
    expect(lerPapeisDoToken(null)).toEqual([]);
    expect(lerPapeisDoToken('')).toEqual([]);
    expect(lerPapeisDoToken('nao-e-um-jwt')).toEqual([]);
    expect(lerPapeisDoToken('a.b.c')).toEqual([]);
  });

  test('token sem realm_access não concede papel nenhum', () => {
    const token = montarToken({ exp: daquiAUmaHora() });
    expect(lerPapeisDoToken(token)).toEqual([]);
  });
});
