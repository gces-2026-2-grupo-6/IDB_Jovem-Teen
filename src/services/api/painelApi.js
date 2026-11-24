import { api } from "../api";

/**
 * Links fixados na página inicial do painel (US10).
 *
 * GET/PUT /painel/links são exclusivas da superadministradora — inclusive a
 * leitura — porque a planilha reúne nome, e-mail e WhatsApp de mais de 2500
 * líderes. Já GET /painel/link-cadastro-lideres é pública e devolve apenas o
 * endereço do formulário externo exibido na área pública do site.
 */

/**
 * @typedef {Object} LinksPainel
 * @property {string|null} link_cadastro_lideres - formulário externo de cadastro
 * @property {string|null} link_planilha_lideres - planilha com as respostas
 */

/**
 * GET /painel/link-cadastro-lideres (público).
 * Retorna apenas o formulário de cadastro, sem expor a planilha de respostas.
 *
 * @returns {Promise<{ link_cadastro_lideres: string|null }>}
 */
export async function obterLinkCadastroLideres() {
  const { data } = await api.get("/painel/link-cadastro-lideres");
  return data;
}

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
