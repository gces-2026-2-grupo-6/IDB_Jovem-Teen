import {
  listarLideres,
  buscarLider,
  criarLider,
  atualizarLider,
  deletarLider,
} from "./api/liderApi";
import { toDriveImageUrl } from "../utils/driveImage";

export const REGIAO_NACIONAL = "Nacional";
export const REGIOES = [
  REGIAO_NACIONAL,
  "Região Central",
  "Região Centro-Oeste",
  "Região Nordeste",
  "Região Norte",
  "Região Sudeste",
  "Região Sul",
];

// A API guarda as redes como objeto {"rede": "link"}; o painel edita como texto
// livre separado por vírgula ("@perfil, youtube.com/canal").
const REDES_CONHECIDAS = [
  ["instagram", /instagram\.com|^@/i],
  ["youtube", /youtube\.com|youtu\.be/i],
  ["tiktok", /tiktok\.com/i],
  ["facebook", /facebook\.com|fb\.com/i],
  ["x", /twitter\.com|x\.com/i],
  ["linkedin", /linkedin\.com/i],
];

export function socialTextToObject(text) {
  const redes = {};
  String(text || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((link) => {
      const base = REDES_CONHECIDAS.find(([, padrao]) => padrao.test(link))?.[0] ?? "site";
      let chave = base;
      for (let n = 2; chave in redes; n++) chave = `${base}_${n}`;
      redes[chave] = link;
    });
  return Object.keys(redes).length > 0 ? redes : null;
}

export function socialObjectToText(redes) {
  if (!redes) return "";
  if (typeof redes === "string") return redes;
  return Object.values(redes).filter(Boolean).join(", ");
}

function toLeader(api) {
  if (!api) return null;
  const regiao = api.regiao ?? "";
  return {
    id: api.lider_id,
    name: api.nome,
    role: api.cargo ?? "",
    // image = URL renderável (p/ exibir); imageRaw = link cru do Drive (p/ o form)
    image: toDriveImageUrl(api.imagem_url),
    imageRaw: api.imagem_url ?? "",
    region: regiao,
    bio: api.mini_biografia ?? "",
    socialLinks: socialObjectToText(api.redes_sociais),
    term: api.gestao ?? "",
    isPast: !!api.is_antigo,
    order: Number(api.ordem ?? 0),
  };
}

function toLiderPayload(form) {
  return {
    nome: form.name.trim(),
    cargo: form.role.trim(),
    imagem_url: form.image?.trim() || "",
    is_antigo: !!form.isPast,
    ordem: Number(form.order) || 0,
    regiao: form.region || "",
    mini_biografia: form.bio?.trim() || "",
    redes_sociais: socialTextToObject(form.socialLinks),
    gestao: form.isPast ? form.term?.trim() || "" : "",
  };
}

// sem `regiao` persistida no back-end, cai no texto do cargo (ex.: "Diretor Nacional ...")
export function isNationalLeader(leader) {
  if (!leader) return false;
  if (leader.region) return leader.region === REGIAO_NACIONAL;
  return /nacional/i.test(leader.role || "");
}

function byOrder(a, b) {
  return a.order - b.order || a.name.localeCompare(b.name, "pt-BR");
}

// a galeria de anteriores contempla apenas o cargo nacional; nos atuais, os nacionais vêm primeiro
export function splitLeaders(leaders) {
  const current = leaders
    .filter((l) => !l.isPast)
    .sort((a, b) => Number(isNationalLeader(b)) - Number(isNationalLeader(a)) || byOrder(a, b));
  const past = leaders
    .filter((l) => l.isPast && isNationalLeader(l))
    .sort(byOrder);
  return { current, past };
}

export async function getAllLeaders() {
  const data = await listarLideres();
  return data.map(toLeader);
}

export async function getLeaderById(id) {
  const data = await buscarLider(id);
  return toLeader(data);
}

export async function createLeader(leaderData) {
  const data = await criarLider(toLiderPayload(leaderData));
  return toLeader(data);
}

export async function updateLeader(id, updates) {
  const data = await atualizarLider(id, toLiderPayload(updates));
  return toLeader(data);
}

export async function deleteLeader(id) {
  await deletarLider(id);
  return true;
}

export async function fetchAllLeaders() {
  return getAllLeaders();
}

export async function fetchLeaderById(id) {
  return getLeaderById(id);
}

function validateLeader(data) {
  if (!data.name || !data.name.trim()) {
    return "Nome do diretor/líder é obrigatório.";
  }
  if (!data.role || !data.role.trim()) {
    return "Cargo é obrigatório.";
  }
  return null;
}

export async function handleCreateLeader(data) {
  const invalid = validateLeader(data);
  if (invalid) return { success: false, error: invalid };

  try {
    const leader = await createLeader(data);
    return { success: true, leader };
  } catch (err) {
    return { success: false, error: resolveError(err, "Não foi possível cadastrar o diretor/líder.") };
  }
}

export async function handleUpdateLeader(id, data) {
  const invalid = validateLeader(data);
  if (invalid) return { success: false, error: invalid };

  try {
    const leader = await updateLeader(id, data);
    return { success: true, leader };
  } catch (err) {
    return { success: false, error: resolveError(err, "Não foi possível atualizar o diretor/líder.") };
  }
}

export async function handleDeleteLeader(id) {
  try {
    await deleteLeader(id);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: resolveError(err, "Não foi possível excluir o diretor/líder.") };
  }
}

function resolveError(err, fallback) {
  const status = err?.response?.status;
  if (status === 401 || status === 403) {
    return "Sessão expirada ou sem permissão. Faça login novamente.";
  }
  return err?.response?.data?.detail || fallback;
}
