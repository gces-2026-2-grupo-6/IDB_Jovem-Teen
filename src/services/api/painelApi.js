import { api } from "../api";

/**
 * Links fixados na página inicial do painel (US10).
 *
 * As duas rotas são exclusivas da superadministradora — **inclusive a
 * leitura**. A planilha reúne nome, e-mail e WhatsApp de mais de 2500 líderes,
 * e o back-end recusa com 403 qualquer outro papel. Por isso a tela só chama
 * estas funções quando `ehSuperadmin`: para o administrador de setor, o certo
 * é não pedir.
 */

/**
 * @typedef {Object} LinksPainel
 * @property {string|null} link_cadastro_lideres - formulário externo de cadastro
 * @property {string|null} link_planilha_lideres - planilha com as respostas
 */

/**
 * GET /painel/links (superadmin)
 * @returns {Promise<LinksPainel>}
 */
export async function obterLinksPainel() {
  const { data } = await api.get("/painel/links");
  return data;
}

/**
 * PUT /painel/links (superadmin).
 *
 * Atualização parcial: só os campos enviados mudam, então trocar um link não
 * apaga o outro. Enviar "" remove o link fixado.
 *
 * @param {Partial<LinksPainel>} links
 * @returns {Promise<LinksPainel>}
 */
export async function atualizarLinksPainel(links) {
  const { data } = await api.put("/painel/links", links);
  return data;
}
