import { api } from "../api";

/**
 * Pedido/interesse de um visitante por um produto (US21).
 *
 * Nasce da sincronização com o formulário do Google ligado ao produto
 * (`Produto.formulario_pedido_link`), pelo mesmo mecanismo das inscrições
 * (US09): um pedido por resposta. Não há rota pública de escrita — quem grava
 * é a sincronização.
 *
 * @typedef {Object} Pedido
 * @property {number} pedido_id
 * @property {number} produto_id
 * @property {string} nome_produto
 * @property {string} nome_solicitante
 * @property {string} contato_solicitante
 * @property {("pendente"|"em_andamento"|"concluido"|"cancelado")} status
 * @property {string|null} resposta_id
 * @property {string} criado_em - ISO 8601 com fuso
 */

/**
 * GET /pedido/ (setor Produtos)
 *
 * US21 CA1: os pedidos com o nome do produto, o solicitante, o contato, a
 * situação e a data, do mais recente para o mais antigo (a ordenação vem do
 * servidor).
 *
 * @returns {Promise<Pedido[]>}
 */
export async function listarPedidos() {
  const { data } = await api.get("/pedido/");
  return data;
}

/**
 * PATCH /pedido/{pedido_id}/status (setor Produtos)
 *
 * US21 CA2: muda a situação do pedido. O status vai no corpo, no mesmo
 * molde de `SolicitacaoStatusPedido` do back-end.
 *
 * @param {number} pedidoId
 * @param {("pendente"|"em_andamento"|"concluido"|"cancelado")} status
 * @returns {Promise<Pedido>}
 */
export async function atualizarStatusPedido(pedidoId, status) {
  const { data } = await api.patch(`/pedido/${pedidoId}/status`, { status });
  return data;
}

/**
 * GET /formulario/produtos/{produto_id}/pedidos (setor Produtos)
 *
 * US21: lê as respostas do formulário do Google ligado ao produto e grava um
 * pedido por resposta (ressincronizar atualiza o nome e o contato da mesma
 * resposta, sem duplicar). Devolve os pedidos já sincronizados do produto.
 *
 * @param {number} produtoId
 * @returns {Promise<Pedido[]>}
 */
export async function sincronizarPedidosDoProduto(produtoId) {
  const { data } = await api.get(`/formulario/produtos/${produtoId}/pedidos`);
  return data;
}
