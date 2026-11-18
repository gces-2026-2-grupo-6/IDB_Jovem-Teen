import {
  listarPedidos,
  atualizarStatusPedido,
  sincronizarPedidosDoProduto,
} from "./api/pedidoApi";
import { listarProdutos } from "./api/produtoApi";

/* Situações do pedido (US21 CA2), no mesmo ciclo do voluntário mas com os
   nomes próprios do pedido. A ordem é a do avanço natural do atendimento. */
export const STATUS_PEDIDO = ["pendente", "em_andamento", "concluido", "cancelado"];

export const ROTULO_STATUS_PEDIDO = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

function toPedido(api) {
  if (!api) return null;
  return {
    id: api.pedido_id,
    produtoId: api.produto_id,
    produto: api.nome_produto,
    solicitante: api.nome_solicitante,
    contato: api.contato_solicitante,
    status: api.status,
    respostaId: api.resposta_id ?? null,
    criadoEm: api.criado_em,
  };
}

// Leitura

export async function fetchAllPedidos() {
  const data = await listarPedidos();
  return data.map(toPedido);
}

export function computePedidoStats(list = []) {
  return {
    total: list.length,
    pendentes: list.filter((p) => p.status === "pendente").length,
    emAndamento: list.filter((p) => p.status === "em_andamento").length,
    concluidos: list.filter((p) => p.status === "concluido").length,
  };
}

// Escrita

export async function handleUpdatePedidoStatus(pedidoId, status) {
  if (!STATUS_PEDIDO.includes(status)) {
    return { success: false, error: "Situação inválida." };
  }
  try {
    const pedido = toPedido(await atualizarStatusPedido(pedidoId, status));
    return { success: true, pedido };
  } catch (err) {
    return {
      success: false,
      error: resolveError(err, "Não foi possível atualizar a situação do pedido."),
    };
  }
}

/* Sincroniza todos os produtos que têm formulário de pedido configurado e
   devolve a lista de pedidos já atualizada.

   Cada produto é sincronizado isoladamente: se um formulário falhar (502 do
   Google, por exemplo), os demais ainda entram, e o erro é devolvido junto
   para a tela avisar sem esconder o que deu certo. */
export async function sincronizarTodosOsPedidos() {
  let produtos;
  try {
    produtos = await listarProdutos();
  } catch (err) {
    return {
      success: false,
      pedidos: null,
      error: resolveError(err, "Não foi possível carregar os produtos para sincronizar."),
    };
  }

  const comFormulario = produtos.filter((p) => p.formulario_pedido_link);
  const falhas = [];
  for (const produto of comFormulario) {
    try {
      await sincronizarPedidosDoProduto(produto.produto_id);
    } catch {
      falhas.push(produto.nome);
    }
  }

  let pedidos;
  try {
    pedidos = await fetchAllPedidos();
  } catch (err) {
    return {
      success: false,
      pedidos: null,
      error: resolveError(err, "Pedidos sincronizados, mas não foi possível recarregar a lista."),
    };
  }

  if (falhas.length > 0) {
    return {
      success: false,
      pedidos,
      error: `Não foi possível sincronizar: ${falhas.join(", ")}.`,
    };
  }
  return { success: true, pedidos, error: null };
}

function resolveError(err, fallback) {
  const status = err?.response?.status;
  if (status === 401 || status === 403) {
    return "Sessão expirada ou sem permissão. Faça login novamente.";
  }
  return err?.response?.data?.detail || fallback;
}
