import { urlSnapshotEstatico } from "./modelo.js";

/**
 * Lê o snapshot de uma etapa já liberada a partir de um arquivo estático.
 * Só é chamado depois de podeLerSnapshot: etapa bloqueada não gera pedido.
 */
export function criarLeitorEstatico(fetchFn = globalThis.fetch.bind(globalThis)) {
  return async function lerSnapshot({ provaId, ano, etapa }) {
    const url = urlSnapshotEstatico(ano, provaId, etapa);
    if (!url) return null;
    const resposta = await fetchFn(url, { cache: "no-cache" });
    if (!resposta.ok) return null;
    return resposta.json();
  };
}
