/**
 * Monta a mensagem de erro que o administrador vê na tela.
 *
 * O back-end já diz o que deu errado: as rotas de formulário respondem 502 com
 * um `detail` escrito em português — "Falha ao buscar formulario no Google
 * Forms", "Use o link completo do Forms para extrair o formulario_id", "Falha
 * automatica ao renovar credenciais do Google para o Forms". São justamente as
 * três causas possíveis de uma listagem vazia.
 *
 * Até aqui um `catch` sem parâmetro descartava isso e a tela mostrava uma lista
 * vazia com um texto genérico. Na reunião de validação de 23/11/2026 a cliente
 * preencheu um formulário ao vivo, a inscrição não apareceu, e não havia nada
 * na tela que dissesse por quê — o motivo estava no corpo da resposta, que
 * ninguém mostrava.
 *
 * @param {unknown} erro      o erro capturado (tipicamente do axios)
 * @param {string}  generica  o que dizer quando não há causa legível
 * @returns {string}
 */
export function mensagemDeErro(erro, generica) {
  const detail = erro?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return `${generica} Motivo: ${detail.trim()}`;
  }

  return generica;
}
