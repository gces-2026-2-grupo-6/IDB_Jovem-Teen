import { api } from "../api";

/**
 * Materiais para download (US11).
 *
 * A leitura é pública e não exige login — "todas as pessoas podem baixar, sem
 * login". A escrita é exclusiva da superadministradora, e o servidor recusa
 * com 403 qualquer outro papel.
 */

/**
 * @typedef {Object} Material
 * @property {number} material_id
 * @property {string} titulo
 * @property {string|null} descricao
 * @property {"foto"|"video"|"documento"} tipo
 * @property {string} link - link de compartilhar do Drive, ou link externo
 * @property {string} url_download - destino do botão "Baixar", pronto pelo back-end
 * @property {string|null} criado_em
 */

/**
 * @typedef {Object} MaterialInput
 * @property {string} titulo
 * @property {string} tipo
 * @property {string} link
 * @property {string} [descricao]
 */

/**
 * GET /material/ (publico)
 * @param {"foto"|"video"|"documento"} [tipo] - filtro opcional
 * @returns {Promise<Material[]>}
 */
export async function listarMateriais(tipo) {
  const { data } = await api.get("/material/", { params: tipo ? { tipo } : {} });
  return data;
}

/**
 * GET /material/{id} (publico)
 * @param {number} id
 * @returns {Promise<Material>}
 */
export async function buscarMaterial(id) {
  const { data } = await api.get(`/material/${id}`);
  return data;
}

/**
 * POST /material/ (superadmin)
 * @param {MaterialInput} body
 * @returns {Promise<Material>}
 */
export async function criarMaterial(body) {
  const { data } = await api.post("/material/", body);
  return data;
}

/**
 * PUT /material/{id} (superadmin)
 * @param {number} id
 * @param {MaterialInput} body
 * @returns {Promise<Material>}
 */
export async function atualizarMaterial(id, body) {
  const { data } = await api.put(`/material/${id}`, body);
  return data;
}

/**
 * DELETE /material/{id} (superadmin)
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deletarMaterial(id) {
  await api.delete(`/material/${id}`);
}
