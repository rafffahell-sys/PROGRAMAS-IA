import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const regrasUrl = new URL("../../firestore.rules", import.meta.url);
const regras = readFileSync(regrasUrl, "utf8");

test("auditoria de todos os allow: sem curinga e sem alargar /ciclismo", () => {
  const matches = [...regras.matchAll(/^\s*match\s+(\S+)/gm)].map((m) => m[1]);
  assert.deepEqual(matches, [
    "/databases/{database}/documents",
    "/ciclismo/{documento}",
    "/ciclismo_gv/{provaAno}",
    "/ciclismo_gv_snapshots/{provaAno}/apos/{etapa}",
    "/ciclismo_gv_auditoria/{id}"
  ]);
  const allows = [...regras.matchAll(/^\s*allow\s+([^:]+):/gm)].map((m) => m[1].trim());
  assert.deepEqual(allows, [
    "read",
    "write",
    "get, list",
    "create, update",
    "delete",
    "get",
    "list",
    "create",
    "update, delete",
    "read, write"
  ]);
  assert.equal(regras.includes("**"), false);
  assert.equal([...regras.matchAll(/allow read: if true;/g)].length, 1);
  assert.match(regras, /match \/ciclismo\/\{documento\} \{\s*allow read: if true;\s*allow write: if dono\(\);/s);
});

test("emulador: snapshot só da etapa liberada, mesmo com a leitura ampla de /ciclismo", async () => {
  const { initializeTestEnvironment, assertFails, assertSucceeds } = await import("@firebase/rules-unit-testing");
  const { doc, getDoc, setDoc, collection, getDocs } = await import("firebase/firestore");
  const ambiente = await initializeTestEnvironment({
    projectId: "demo-grandes-voltas",
    firestore: { rules: regras }
  });
  try {
    await ambiente.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "ciclismo", "temporada"), { registros: { "2026_b1": { p1: "registro legado" } } });
      await setDoc(doc(db, "ciclismo_gv", "2026_b7"), {
        etapas: { 1: true, 5: true },
        provaCompleta: false,
        atualizadoEm: "2026-11-09T00:00:00Z"
      });
      const corpo = { imutavel: true, aposEtapa: 5, provaId: "b7", ano: 2026 };
      await setDoc(doc(db, "ciclismo_gv_snapshots", "2026_b7", "apos", "5"), corpo);
      await setDoc(doc(db, "ciclismo_gv_snapshots", "2026_b7", "apos", "4"), {
        ...corpo,
        aposEtapa: 4
      });
      await setDoc(doc(db, "ciclismo_gv", "ruim"), {
        etapas: { 4: "sim" },
        provaCompleta: false,
        atualizadoEm: "t",
        campoExtra: 1
      });
      await setDoc(doc(db, "ciclismo_gv_snapshots", "ruim", "apos", "4"), {
        imutavel: true,
        aposEtapa: 4,
        provaId: "b7",
        ano: 2026
      });
      await setDoc(doc(db, "ciclismo_gv_snapshots", "2026_b7"), { solto: 1 });
      await setDoc(doc(db, "ciclismo_gv_auditoria", "nota"), { texto: "sem resultado" });
    });

    const anon = ambiente.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(anon, "ciclismo", "temporada")));
    await assertSucceeds(getDoc(doc(anon, "ciclismo_gv_snapshots", "2026_b7", "apos", "5")));
    await assertFails(getDoc(doc(anon, "ciclismo_gv_snapshots", "2026_b7", "apos", "4")));
    await assertFails(getDoc(doc(anon, "ciclismo_gv_snapshots", "2026_b7", "apos", "2")));
    await assertFails(getDocs(collection(anon, "ciclismo_gv_snapshots", "2026_b7", "apos")));
    await assertSucceeds(getDoc(doc(anon, "ciclismo_gv", "2026_b7")));
    await assertFails(getDoc(doc(anon, "ciclismo_gv", "ruim")));
    await assertFails(getDoc(doc(anon, "ciclismo_gv_snapshots", "ruim", "apos", "4")));
    await assertFails(getDoc(doc(anon, "ciclismo_gv_snapshots", "2026_b7")));
    await assertFails(getDoc(doc(anon, "ciclismo_gv_auditoria", "nota")));

    const dono = ambiente.authenticatedContext("dono", { email: "rafffahell@gmail.com" }).firestore();
    await assertFails(setDoc(doc(dono, "ciclismo_gv_snapshots", "2026_b7", "apos", "5"), {
      imutavel: true, aposEtapa: 5, provaId: "b7", ano: 2026
    }));
    await assertSucceeds(setDoc(doc(dono, "ciclismo_gv_snapshots", "2026_b7", "apos", "3"), {
      imutavel: true, aposEtapa: 3, provaId: "b7", ano: 2026
    }));
    await assertFails(getDoc(doc(dono, "ciclismo_gv_snapshots", "2026_b7", "apos", "3")));
    await assertFails(setDoc(doc(dono, "ciclismo_gv", "2026_b7"), {
      etapas: { 5: true },
      provaCompleta: false,
      atualizadoEm: "t",
      autorizacaoTexto: "nao"
    }));
    await assertFails(setDoc(doc(dono, "ciclismo_gv", "2026_b7"), {
      etapas: { 1: true, 5: true },
      provaCompleta: true,
      atualizadoEm: "t"
    }));
    await assertSucceeds(setDoc(doc(dono, "ciclismo_gv", "2026_b7"), {
      etapas: { 1: true, 5: true, 21: true },
      provaCompleta: true,
      atualizadoEm: "t"
    }));
    await assertFails(getDoc(doc(anon, "ciclismo_gv_snapshots", "2026_b7", "apos", "4")));

    const outro = ambiente.authenticatedContext("outro", { email: "outra-pessoa@example.com" }).firestore();
    await assertFails(setDoc(doc(outro, "ciclismo_gv", "2026_b10"), {
      etapas: { 1: true },
      provaCompleta: false,
      atualizadoEm: "t"
    }));
  } finally {
    await ambiente.cleanup();
  }
});
