/**
 * Leitor do snapshot no Firestore. A página só importa este arquivo
 * se a etapa estiver liberada e acesso.regrasComprovadas for true.
 * Nesta entrega as duas condições falham, então o módulo não é carregado.
 */
globalThis.__GV_LEITOR_CARREGADO__ = true;
export function criarLeitorFirestore(config = globalThis.FIREBASE_CONFIG) {
  return async function lerSnapshot({ provaId, ano, etapa }) {
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
    const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
    const app = getApps().length ? getApps()[0] : initializeApp(config);
    const db = getFirestore(app);
    const ref = doc(db, "ciclismo_gv_snapshots", `${ano}_${provaId}`, "apos", String(etapa));
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  };
}
