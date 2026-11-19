import { api } from "../api";

/**
 * @typedef {Object} Produto
 * @property {number} produto_id
 * @property {string} nome
 * @property {string} descricao
 * @property {string} link_produto
 * @property {string} link_imagem - link de compartilhar do Drive (cru)
 * @property {string} [formulario_pedido_link] - formulário do Google que recebe os pedidos (US21)
 */

/**
 * @typedef {Object} ProdutoInput
 * @property {string} nome
 * @property {string} [descricao]
 * @property {string} [link_produto]
 * @property {string} [link_imagem]
 */

/**
 * GET /produto/ (publico)
 * @returns {Promise<Produto[]>}
 */
export async function listarProdutos() {
  const { data } = await api.get("/produto/");
  return data;
}

/**
 * GET /produto/{id} (publico)
 * @param {number} id
 * @returns {Promise<Produto>}
 */
export async function buscarProduto(id) {
  const { data } = await api.get(`/produto/${id}`);
  return data;
}

/**
 * POST /produto/ (admin)
 * @param {ProdutoInput} body
 * @returns {Promise<Produto>}
 */
export async function criarProduto(body) {
  const { data } = await api.post("/produto/", body);
  return data;
}

/**
 * PUT /produto/{id} (admin)
 * @param {number} id
 * @param {ProdutoInput} body
 * @returns {Promise<Produto>}
 */
export async function atualizarProduto(id, body) {
  const { data } = await api.put(`/produto/${id}`, body);
  return data;
}

/**
 * DELETE /produto/{id} (admin)
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deletarProduto(id) {
  await api.delete(`/produto/${id}`);
}
