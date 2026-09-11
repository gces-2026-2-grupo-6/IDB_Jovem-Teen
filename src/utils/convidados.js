/* Convidados de evento — bandas e palestrantes. Módulo puro, sem dependência de
   API ou de React, para que a regra possa ser testada isoladamente.

   Sobre a função do convidado: a API guarda `profissao` como texto livre, e os
   cadastros antigos trazem valores variados ("Pastor", "Líder", ""). A história
   pede três funções — banda, pregador e convidado. Em vez de migrar dado alheio
   ou recusar o que já existe, a função é *derivada*: valores conhecidos caem na
   sua função, e qualquer outro texto é tratado como "Convidado" mas continua
   sendo exibido como veio. Assim a tela agrupa certo sem apagar o que a cliente
   já cadastrou. */

export const FUNCAO = {
  BANDA: "Banda",
  PREGADOR: "Pregador",
  CONVIDADO: "Convidado",
};

/* Ordem em que as funções aparecem no formulário e na página pública. */
export const FUNCOES = [FUNCAO.PREGADOR, FUNCAO.BANDA, FUNCAO.CONVIDADO];

/* Título de cada grupo na página pública. O grupo dos pregadores mantém
   "Palestrantes", que é a palavra que o site e a cliente já usam — a história
   pede separar banda de pregador, não renomear o que já existe. */
export const ROTULO_PLURAL = {
  [FUNCAO.PREGADOR]: "Palestrantes",
  [FUNCAO.BANDA]: "Bandas",
  [FUNCAO.CONVIDADO]: "Convidados",
};

function semAcento(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/* Deriva a função a partir do texto gravado em `profissao`. Texto vazio ou
   desconhecido vira "Convidado", que é o rótulo mais neutro dos três. */
export function normalizarFuncao(valor) {
  const texto = semAcento(valor);
  if (!texto) return FUNCAO.CONVIDADO;
  if (texto === "banda" || texto.includes("banda")) return FUNCAO.BANDA;
  if (
    texto === "pregador" ||
    texto.includes("pregador") ||
    texto.includes("palestrante") ||
    texto.includes("pastor") ||
    texto.startsWith("pr.") ||
    texto.startsWith("pra.")
  ) {
    return FUNCAO.PREGADOR;
  }
  return FUNCAO.CONVIDADO;
}

export function ehBanda(convidado) {
  return normalizarFuncao(convidado?.role ?? convidado?.funcao) === FUNCAO.BANDA;
}

/* Agrupa convidados por função, preservando a ordem de FUNCOES e omitindo
   grupos vazios — a página pública não deve mostrar um título sem ninguém. */
export function agruparPorFuncao(convidados = []) {
  const grupos = FUNCOES.map((funcao) => ({
    funcao,
    titulo: ROTULO_PLURAL[funcao],
    convidados: convidados.filter(
      (c) => normalizarFuncao(c?.funcao ?? c?.role) === funcao
    ),
  }));
  return grupos.filter((grupo) => grupo.convidados.length > 0);
}

/* Redes sociais chegam em formatos diferentes conforme a origem (formulário,
   API, dado antigo). Normaliza para uma lista de { rede, url } sem entradas
   vazias e sem repetição de rede. */
export function normalizarRedes(valor) {
  const bruto = Array.isArray(valor)
    ? valor
    : valor && typeof valor === "object"
      ? Object.entries(valor).map(([rede, url]) => ({ rede, url }))
      : [];

  const vistas = new Set();
  const redes = [];
  for (const item of bruto) {
    const rede = String(item?.rede ?? item?.nome ?? "").trim();
    const url = String(item?.url ?? item?.link ?? "").trim();
    if (!rede || !url) continue;
    const chave = semAcento(rede);
    if (vistas.has(chave)) continue;
    vistas.add(chave);
    redes.push({ rede, url });
  }
  return redes;
}

/* Uma URL utilizável — aceita endereço sem protocolo, como a pessoa costuma
   colar, e recusa o que claramente não é link. */
export function urlValida(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    return Boolean(url.hostname) && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export function comProtocolo(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  return /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;
}

export const LIMITE_MINI_BIO = 280;

/* Valida o cadastro de um convidado. Devolve a mensagem de erro ou null.
   O nome é o único campo obrigatório: a cliente costuma cadastrar o convidado
   antes de ter foto e biografia. */
export function validarConvidado(form) {
  if (!form?.nome?.trim()) {
    return "O nome do convidado é obrigatório.";
  }
  if (form.miniBio && form.miniBio.length > LIMITE_MINI_BIO) {
    return `A mini-biografia deve ter no máximo ${LIMITE_MINI_BIO} caracteres.`;
  }
  const redes = normalizarRedes(form.redes);
  const invalida = redes.find((r) => !urlValida(r.url));
  if (invalida) {
    return `O endereço de ${invalida.rede} não parece um link válido.`;
  }
  return null;
}

/* Filtro da listagem: casa nome e função, ignorando acento e caixa. */
export function filtrarConvidados(convidados = [], termo = "") {
  const busca = semAcento(termo);
  if (!busca) return convidados;
  return convidados.filter((c) => {
    const nome = semAcento(c?.name ?? c?.nome);
    const funcao = semAcento(c?.role ?? c?.funcao);
    return nome.includes(busca) || funcao.includes(busca);
  });
}
