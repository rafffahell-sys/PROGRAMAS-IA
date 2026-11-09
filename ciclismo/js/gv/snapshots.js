import { podeLerSnapshot, validarSnapshot } from "./modelo.js";

/**
 * Falha fechada. O leitor (Firestore) só é chamado com etapa liberada
 * e com regrasComprovadas. Snapshot sintético nunca é entregue ao site.
 */
export async function carregarSnapshot({ prova, etapa, liberacao, acesso, leitor }) {
  const gate = podeLerSnapshot({ liberacao, etapa, acesso });
  if (!gate.ok) return { ok: false, motivo: gate.motivo, snapshot: null };
  if (typeof leitor !== "function") {
    return { ok: false, motivo: "sem_leitor", snapshot: null };
  }
  const bruto = await leitor({
    provaId: prova.provaId,
    ano: prova.ano,
    etapa: Number(etapa)
  });
  if (!bruto) return { ok: false, motivo: "ausente", snapshot: null };
  if (bruto.sintetico === true) return { ok: false, motivo: "sintetico_recusado", snapshot: null };
  const checagem = validarSnapshot(bruto, prova);
  if (!checagem.ok) return { ok: false, motivo: "invalido", snapshot: null, erros: checagem.erros };
  return { ok: true, motivo: "liberada", snapshot: bruto };
}
