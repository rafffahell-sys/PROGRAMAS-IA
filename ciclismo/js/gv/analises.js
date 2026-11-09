import { podeLerAnalisePre, validarAnalisePre } from "./modelo.js";

/** Não chama o leitor se a etapa imediatamente anterior não estiver confirmada. */
export async function carregarAnalisePre({ prova, etapa, liberacao, acesso, leitor }) {
  const gate = podeLerAnalisePre({ liberacao, etapa, acesso });
  if (!gate.ok) return { ok: false, motivo: gate.motivo, analise: null };
  if (typeof leitor !== "function") return { ok: false, motivo: "sem_leitor", analise: null };
  const bruto = await leitor({ provaId: prova.provaId, ano: prova.ano, etapa: Number(etapa) });
  if (!bruto) return { ok: false, motivo: "ausente", analise: null };
  if (bruto.sintetico === true) return { ok: false, motivo: "sintetico_recusado", analise: null };
  const erros = validarAnalisePre(bruto, prova);
  if (erros.length) return { ok: false, motivo: "invalida", analise: null, erros };
  return { ok: true, motivo: "liberada", analise: bruto };
}
