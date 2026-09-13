import { api } from "../api";

/**
 * @typedef {Object} Lider
 * @property {number} lider_id
 * @property {string} nome
 * @property {string} cargo
 * @property {string} imagem_url - link de compartilhar do Drive (cru)
 * @property {boolean} is_antigo - marcação manual de "diretor anterior"
 * @property {number} ordem
 * @property {string} [regiao] - ainda não persistido pelo back-end
 * @property {string} [bio] - ainda não persistido pelo back-end
 * @property {string} [redes_sociais] - ainda não persistido pelo back-end
 * @property {string} [gestao] - ainda não persistido pelo back-end
 */

/**
 * @typedef {Object} LiderInput
 * @property {string} nome
 * @property {string} cargo
 * @property {string} [imagem_url]
 * @property {boolean} [is_antigo]
 * @property {number} [ordem]
 * @property {string} [regiao]
 * @property {string} [bio]
 * @property {string} [redes_sociais]
 * @property {string} [gestao]
 */

/**
 * GET /lider/ (publico)
 * @returns {Promise<Lider[]>}
 */
export async function listarLideres() {
  const { data } = await api.get("/lider/");
  return data;
}

/**
 * GET /lider/{id} (publico)
 * @param {number} id
 * @returns {Promise<Lider>}
 */
export async function buscarLider(id) {
  const { data } = await api.get(`/lider/${id}`);
  return data;
}

/**
 * POST /lider/ (admin)
 * @param {LiderInput} body
 * @returns {Promise<Lider>}
 */
export async function criarLider(body) {
  const { data } = await api.post("/lider/", body);
  return data;
}

/**
 * PUT /lider/{id} (admin)
 * @param {number} id
 * @param {LiderInput} body
 * @returns {Promise<Lider>}
 */
export async function atualizarLider(id, body) {
  const { data } = await api.put(`/lider/${id}`, body);
  return data;
}

/**
 * DELETE /lider/{id} (admin)
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deletarLider(id) {
  await api.delete(`/lider/${id}`);
}
