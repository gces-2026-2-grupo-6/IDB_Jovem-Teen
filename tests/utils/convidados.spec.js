import { test, expect } from '@playwright/test';
import {
  FUNCAO,
  FUNCOES,
  LIMITE_MINI_BIO,
  agruparPorFuncao,
  comProtocolo,
  ehBanda,
  filtrarConvidados,
  normalizarFuncao,
  normalizarRedes,
  urlValida,
  validarConvidado,
} from '../../src/utils/convidados.js';

test.describe('normalizarFuncao', () => {
  test('reconhece as três funções da história', () => {
    expect(normalizarFuncao('Banda')).toBe(FUNCAO.BANDA);
    expect(normalizarFuncao('Pregador')).toBe(FUNCAO.PREGADOR);
    expect(normalizarFuncao('Convidado')).toBe(FUNCAO.CONVIDADO);
  });

  test('ignora acento e caixa', () => {
    expect(normalizarFuncao('BANDA')).toBe(FUNCAO.BANDA);
    expect(normalizarFuncao('pregador')).toBe(FUNCAO.PREGADOR);
  });

  test('classifica os valores antigos já gravados', () => {
    /* A API guarda `profissao` como texto livre e o cadastro atual tem de tudo. */
    expect(normalizarFuncao('Pastor')).toBe(FUNCAO.PREGADOR);
    expect(normalizarFuncao('Palestrante')).toBe(FUNCAO.PREGADOR);
    expect(normalizarFuncao('Banda de louvor')).toBe(FUNCAO.BANDA);
  });

  test('valor desconhecido vira Convidado, o rótulo mais neutro', () => {
    expect(normalizarFuncao('Líder')).toBe(FUNCAO.CONVIDADO);
    expect(normalizarFuncao('qualquer coisa')).toBe(FUNCAO.CONVIDADO);
  });

  test('vazio ou ausente também vira Convidado', () => {
    expect(normalizarFuncao('')).toBe(FUNCAO.CONVIDADO);
    expect(normalizarFuncao(null)).toBe(FUNCAO.CONVIDADO);
    expect(normalizarFuncao(undefined)).toBe(FUNCAO.CONVIDADO);
  });

  test('ehBanda responde pelo campo role ou funcao', () => {
    expect(ehBanda({ role: 'Banda' })).toBe(true);
    expect(ehBanda({ funcao: FUNCAO.BANDA })).toBe(true);
    expect(ehBanda({ role: 'Pastor' })).toBe(false);
  });
});

test.describe('agruparPorFuncao', () => {
  const convidados = [
    { id: 1, name: 'Pr. Samuel', role: 'Pastor' },
    { id: 2, name: 'Adoração Viva', role: 'Banda' },
    { id: 3, name: 'Pra. Raquel', role: 'Pregador' },
    { id: 4, name: 'Convidado X', role: 'Líder' },
  ];

  test('agrupa na ordem das funções', () => {
    const grupos = agruparPorFuncao(convidados);
    expect(grupos.map((g) => g.funcao)).toEqual([
      FUNCAO.PREGADOR,
      FUNCAO.BANDA,
      FUNCAO.CONVIDADO,
    ]);
  });

  test('cada grupo leva só os seus', () => {
    const grupos = agruparPorFuncao(convidados);
    const porFuncao = Object.fromEntries(grupos.map((g) => [g.funcao, g.convidados]));
    expect(porFuncao[FUNCAO.PREGADOR].map((c) => c.id)).toEqual([1, 3]);
    expect(porFuncao[FUNCAO.BANDA].map((c) => c.id)).toEqual([2]);
    expect(porFuncao[FUNCAO.CONVIDADO].map((c) => c.id)).toEqual([4]);
  });

  test('grupo vazio não aparece — a página não mostra título sem ninguém', () => {
    const grupos = agruparPorFuncao([{ id: 1, name: 'Banda A', role: 'Banda' }]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].titulo).toBe('Bandas');
  });

  test('o grupo de pregadores mantém o título que o site já usa', () => {
    /* A história pede separar banda de pregador, não renomear "Palestrantes". */
    const grupos = agruparPorFuncao([{ id: 1, name: 'Pr. Samuel', role: 'Pregador' }]);
    expect(grupos[0].titulo).toBe('Palestrantes');
  });

  test('lista vazia não gera grupo nenhum', () => {
    expect(agruparPorFuncao([])).toEqual([]);
    expect(agruparPorFuncao()).toEqual([]);
  });
});

test.describe('normalizarRedes', () => {
  test('aceita lista de objetos', () => {
    expect(
      normalizarRedes([
        { rede: 'Instagram', url: 'instagram.com/idb' },
        { rede: 'YouTube', url: 'youtube.com/idb' },
      ])
    ).toEqual([
      { rede: 'Instagram', url: 'instagram.com/idb' },
      { rede: 'YouTube', url: 'youtube.com/idb' },
    ]);
  });

  test('aceita objeto simples, caso a API devolva assim', () => {
    expect(normalizarRedes({ Instagram: 'instagram.com/idb' })).toEqual([
      { rede: 'Instagram', url: 'instagram.com/idb' },
    ]);
  });

  test('descarta entradas incompletas', () => {
    expect(
      normalizarRedes([
        { rede: 'Instagram', url: '' },
        { rede: '', url: 'algum.com' },
        { rede: 'Site', url: 'idbjovem.org' },
      ])
    ).toEqual([{ rede: 'Site', url: 'idbjovem.org' }]);
  });

  test('não repete a mesma rede', () => {
    const redes = normalizarRedes([
      { rede: 'Instagram', url: 'instagram.com/a' },
      { rede: 'instagram', url: 'instagram.com/b' },
    ]);
    expect(redes).toHaveLength(1);
    expect(redes[0].url).toBe('instagram.com/a');
  });

  test('entrada inválida vira lista vazia', () => {
    expect(normalizarRedes(null)).toEqual([]);
    expect(normalizarRedes('instagram.com')).toEqual([]);
  });
});

test.describe('urlValida e comProtocolo', () => {
  test('aceita endereço colado sem protocolo', () => {
    expect(urlValida('instagram.com/idbjovem')).toBe(true);
    expect(comProtocolo('instagram.com/idbjovem')).toBe('https://instagram.com/idbjovem');
  });

  test('preserva o protocolo quando já existe', () => {
    expect(comProtocolo('http://idbjovem.org')).toBe('http://idbjovem.org');
  });

  test('recusa o que não é endereço', () => {
    expect(urlValida('')).toBe(false);
    expect(urlValida('meu perfil')).toBe(false);
    expect(urlValida('sem-ponto')).toBe(false);
  });
});

test.describe('validarConvidado', () => {
  test('o nome é o único campo obrigatório', () => {
    /* A cliente costuma cadastrar o convidado antes de ter foto e biografia. */
    expect(validarConvidado({ nome: 'Pr. Samuel' })).toBeNull();
    expect(validarConvidado({ nome: '   ' })).toContain('nome');
    expect(validarConvidado({})).toContain('nome');
  });

  test('recusa mini-biografia acima do limite', () => {
    const longa = 'a'.repeat(LIMITE_MINI_BIO + 1);
    expect(validarConvidado({ nome: 'Banda', miniBio: longa })).toContain('280');
    expect(validarConvidado({ nome: 'Banda', miniBio: 'a'.repeat(LIMITE_MINI_BIO) })).toBeNull();
  });

  test('recusa rede social com endereço inválido, dizendo qual', () => {
    const erro = validarConvidado({
      nome: 'Banda',
      redes: [{ rede: 'Instagram', url: 'meu perfil' }],
    });
    expect(erro).toContain('Instagram');
  });

  test('aceita rede social com endereço sem protocolo', () => {
    expect(
      validarConvidado({ nome: 'Banda', redes: [{ rede: 'Site', url: 'idbjovem.org' }] })
    ).toBeNull();
  });
});

test.describe('filtrarConvidados', () => {
  const lista = [
    { id: 1, name: 'Pr. Samuel Tavares', role: 'Pregador' },
    { id: 2, name: 'Adoração Viva', role: 'Banda' },
    { id: 3, name: 'Pra. Raquel Gomes', role: 'Pregador' },
  ];

  test('busca por nome, ignorando acento e caixa', () => {
    expect(filtrarConvidados(lista, 'adoracao').map((c) => c.id)).toEqual([2]);
    expect(filtrarConvidados(lista, 'SAMUEL').map((c) => c.id)).toEqual([1]);
  });

  test('busca também por função', () => {
    expect(filtrarConvidados(lista, 'pregador').map((c) => c.id)).toEqual([1, 3]);
  });

  test('termo vazio devolve a lista inteira', () => {
    expect(filtrarConvidados(lista, '')).toHaveLength(3);
    expect(filtrarConvidados(lista)).toHaveLength(3);
  });

  test('sem correspondência devolve lista vazia', () => {
    expect(filtrarConvidados(lista, 'zzz')).toEqual([]);
  });
});

test.describe('constantes', () => {
  test('as três funções da história, na ordem de exibição', () => {
    expect(FUNCOES).toEqual([FUNCAO.PREGADOR, FUNCAO.BANDA, FUNCAO.CONVIDADO]);
  });
});
