import {
  listarMateriais,
  buscarMaterial,
  criarMaterial,
  atualizarMaterial,
  deletarMaterial,
} from "./api/materialApi";
import { podeExcluirAgora, ERRO_SEM_PERMISSAO_PARA_EXCLUIR } from "./auth/permissaoAtual";

/* Materiais para download (US11).

   O arquivo continua no Drive: o site guarda o cadastro e o link, e nunca
   recebe upload. O botão "Baixar" é apenas um link para `url_download`, que o
   back-end já entrega pronto — o front não monta URL nenhuma. */

export const TIPOS_MATERIAL = ["foto", "video", "documento"];

export const ROTULO_DO_TIPO = {
  foto: "Foto",
  video: "Vídeo",
  documento: "Documento",
};

/* Arquivo do Drive volta por uma rota de download do próprio back-end, que o
   entrega como anexo. Link externo (um vídeo no YouTube, por exemplo) volta
   como está: aí baixar não faz sentido, e o certo é abrir em outra aba. */
export function ehLinkExterno(material) {
  if (!material?.downloadUrl) return false;
  return !/\/drive\/download\//.test(material.downloadUrl);
}

function toMaterial(api) {
  if (!api) return null;
  return {
    id: api.material_id,
    title: api.titulo,
    description: api.descricao ?? "",
    type: api.tipo,
    link: api.link ?? "",
    /* Pronto pelo back-end; o front só o coloca no href. */
    downloadUrl: api.url_download ?? "",
    createdAt: api.criado_em ?? null,
  };
}

function toMaterialPayload(form) {
  return {
    titulo: String(form.title ?? "").trim(),
    tipo: form.type,
    link: String(form.link ?? "").trim(),
    descricao: String(form.description ?? "").trim() || null,
  };
}

export async function fetchAllMaterials(tipo) {
  const data = await listarMateriais(tipo);
  return data.map(toMaterial);
}

export async function fetchMaterialById(id) {
  return toMaterial(await buscarMaterial(id));
}

/* Mesmas regras do servidor, antecipadas para a pessoa não perder a ida à API
   por um campo em branco. */
function validateMaterial(data) {
  if (!data.title || !data.title.trim()) {
    return "O título do material é obrigatório.";
  }
  if (!TIPOS_MATERIAL.includes(data.type)) {
    return "Selecione o tipo do material: foto, vídeo ou documento.";
  }
  if (!data.link || !data.link.trim()) {
    return "O link do material é obrigatório.";
  }
  if (!/^https?:\/\//i.test(data.link.trim())) {
    return "O link deve começar com https:// ou http://.";
  }
  return null;
}

function resolveError(err, fallback) {
  const status = err?.response?.status;
  if (status === 401) {
    return "Sessão expirada. Faça login novamente.";
  }
  if (status === 403) {
    return "Apenas a superadministradora pode cadastrar, editar ou excluir materiais.";
  }
  if (status === 404) {
    return "Material não encontrado. Ele pode já ter sido excluído.";
  }
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    const msg = detail
      .map((d) => (typeof d === "string" ? d : d?.msg))
      .filter(Boolean)
      .join("; ")
      .replace(/Value error,\s*/g, "");
    if (msg) return msg;
  }
  if (typeof detail === "string" && detail) return detail;
  return fallback;
}

export async function handleCreateMaterial(data) {
  const invalid = validateMaterial(data);
  if (invalid) return { success: false, error: invalid };

  try {
    const material = toMaterial(await criarMaterial(toMaterialPayload(data)));
    return { success: true, material, error: null };
  } catch (err) {
    return { success: false, error: resolveError(err, "Não foi possível cadastrar o material.") };
  }
}

export async function handleUpdateMaterial(id, data) {
  const invalid = validateMaterial(data);
  if (invalid) return { success: false, error: invalid };

  try {
    const material = toMaterial(await atualizarMaterial(id, toMaterialPayload(data)));
    return { success: true, material, error: null };
  } catch (err) {
    return { success: false, error: resolveError(err, "Não foi possível atualizar o material.") };
  }
}

export async function handleDeleteMaterial(id) {
  /* Esconder o botão não é controle de acesso; o servidor é quem protege.
     Isto evita apenas que a tela ofereça por engano o que será recusado. */
  if (!podeExcluirAgora()) {
    return { success: false, error: ERRO_SEM_PERMISSAO_PARA_EXCLUIR };
  }

  try {
    await deletarMaterial(id);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: resolveError(err, "Não foi possível excluir o material.") };
  }
}
