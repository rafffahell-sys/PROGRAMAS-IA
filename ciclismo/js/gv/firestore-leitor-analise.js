/** Só é importado se a análise pré-etapa daquela N passou no gate. */
globalThis.__GV_ANALISE_CARREGADA__ = true;

export function criarLeitorAnaliseFirestore(config = globalThis.FIREBASE_CONFIG) {
  return async function lerAnalise({ provaId, ano, etapa }) {
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
    const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
    const app = getApps().length ? getApps()[0] : initializeApp(config);
    const db = getFirestore(app);
    const ref = doc(db, "ciclismo_gv_analises", `${ano}_${provaId}`, "pre", String(etapa));
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  };
}
