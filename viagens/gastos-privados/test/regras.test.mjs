import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { COLECAO_GASTOS, EMAIL_PROPRIETARIO, SUBCOLECAO_LANCAMENTOS } from "../../js/gastos-privados-modelo.js";

const regrasPropostas = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
const [host, porta] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8088").split(":");

const MARCADOR = Object.freeze({ marcador: "sintetico-regra" });
const VIAGEM = "viagem-teste";
const ITEM = "item-a";

function caminhoPrivado(viagem = VIAGEM, item = ITEM) {
  return [COLECAO_GASTOS, viagem, SUBCOLECAO_LANCAMENTOS, item];
}

function ambiente(projectId, rules) {
  return initializeTestEnvironment({
    projectId,
    firestore: { rules, host, port: Number(porta) }
  });
}

async function semear(env) {
  await env.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    await setDoc(doc(banco, ...caminhoPrivado()), { marcador: "privado-sintetico" });
    await setDoc(doc(banco, "ciclismo", "temporada"), { marcador: "ciclismo-preservado" });
    await setDoc(doc(banco, "patrimonio", "rafael"), { marcador: "patrimonio-preservado" });
    await setDoc(doc(banco, "outroApp", "item"), { marcador: "outro-preservado" });
    await setDoc(doc(banco, "outroApp", "item", "nivel", "profundo"), { marcador: "outro-profundo" });
    await setDoc(doc(banco, "viagensPrivadasExtra", "item"), { marcador: "nome-parecido" });
    await setDoc(doc(banco, "ViagensPrivadas", VIAGEM, SUBCOLECAO_LANCAMENTOS, ITEM), MARCADOR);
    await setDoc(doc(banco, "viagensprivadas", "item"), MARCADOR);
  });
}

describe("emulador", { concurrency: 1 }, () => {
test("regras propostas", async (t) => {
  const env = await ambiente("demo-gastos-privados", regrasPropostas);
  t.after(() => env.cleanup());
  await semear(env);

  const anon = env.unauthenticatedContext().firestore();
  const outro = env.authenticatedContext("google-outro", {
    email: "outra-pessoa@gmail.com",
    email_verified: true
  }).firestore();
  const dono = env.authenticatedContext("google-dono", {
    email: EMAIL_PROPRIETARIO,
    email_verified: true
  }).firestore();
  const donoMaiusculo = env.authenticatedContext("google-dono-caixa", {
    email: "Rafffahell@gmail.com",
    email_verified: true
  }).firestore();
  const donoNaoVerificado = env.authenticatedContext("google-dono-sem-verificacao", {
    email: EMAIL_PROPRIETARIO,
    email_verified: false
  }).firestore();

  await t.test("anonimo nao le nem grava o caminho privado", async () => {
    await assertFails(getDoc(doc(anon, ...caminhoPrivado())));
    await assertFails(getDocs(collection(anon, COLECAO_GASTOS, VIAGEM, SUBCOLECAO_LANCAMENTOS)));
    await assertFails(setDoc(doc(anon, ...caminhoPrivado("viagem-teste", "novo")), MARCADOR));
  });

  await t.test("outra conta Google nao le nem grava", async () => {
    await assertFails(getDoc(doc(outro, ...caminhoPrivado())));
    await assertFails(setDoc(doc(outro, ...caminhoPrivado()), MARCADOR));
  });

  await t.test("proprietario le, lista e grava; e-mail sem verificacao nao", async () => {
    const lido = await assertSucceeds(getDoc(doc(dono, ...caminhoPrivado())));
    assert.equal(lido.data().marcador, "privado-sintetico");
    const lista = await assertSucceeds(getDocs(collection(dono, COLECAO_GASTOS, VIAGEM, SUBCOLECAO_LANCAMENTOS)));
    assert.equal(lista.size, 1);
    await assertSucceeds(setDoc(doc(dono, ...caminhoPrivado(VIAGEM, "item-b")), MARCADOR));
    await assertFails(getDoc(doc(donoNaoVerificado, ...caminhoPrivado())));
    await assertSucceeds(getDoc(doc(donoMaiusculo, ...caminhoPrivado())));
  });

  await t.test("nao ha leitura do documento pai nem de variante de maiusculas", async () => {
    await assertFails(getDoc(doc(dono, COLECAO_GASTOS, VIAGEM)));
    await assertFails(getDoc(doc(anon, COLECAO_GASTOS, VIAGEM)));
    await assertFails(getDoc(doc(anon, "ViagensPrivadas", VIAGEM, SUBCOLECAO_LANCAMENTOS, ITEM)));
    await assertFails(getDoc(doc(anon, "viagensprivadas", "item")));
    await assertFails(getDoc(doc(dono, "ViagensPrivadas", VIAGEM, SUBCOLECAO_LANCAMENTOS, ITEM)));
  });

  await t.test("o match amplo exclui a colecao privada e preserva o que ja existe", async () => {
    const ciclismo = await assertSucceeds(getDoc(doc(anon, "ciclismo", "temporada")));
    assert.equal(ciclismo.data().marcador, "ciclismo-preservado");
    await assertFails(setDoc(doc(anon, "ciclismo", "temporada"), MARCADOR));
    await assertSucceeds(setDoc(doc(dono, "ciclismo", "temporada"), { marcador: "ciclismo-preservado" }));

    const patrimonio = await assertSucceeds(getDoc(doc(anon, "patrimonio", "rafael")));
    assert.equal(patrimonio.data().marcador, "patrimonio-preservado");
    await assertSucceeds(setDoc(doc(anon, "patrimonio", "rafael"), { marcador: "patrimonio-preservado" }));
    const patrimonioDepois = await getDoc(doc(anon, "patrimonio", "rafael"));
    assert.equal(patrimonioDepois.data().marcador, "patrimonio-preservado");

    const outroApp = await assertSucceeds(getDoc(doc(anon, "outroApp", "item")));
    assert.equal(outroApp.data().marcador, "outro-preservado");
    const profundo = await assertSucceeds(getDoc(doc(anon, "outroApp", "item", "nivel", "profundo")));
    assert.equal(profundo.data().marcador, "outro-profundo");
    const parecido = await assertSucceeds(getDoc(doc(anon, "viagensPrivadasExtra", "item")));
    assert.equal(parecido.data().marcador, "nome-parecido");

    await assertFails(getDoc(doc(anon, ...caminhoPrivado())));
  });
});

test("match amplo incondicional continua autorizando a colecao privada", async (t) => {
  const regrasAbertas = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
    match /viagensPrivadas/{viagem}/lancamentos/{lancamento} {
      allow read, write: if request.auth != null
        && request.auth.token.email == "${EMAIL_PROPRIETARIO}";
    }
  }
}`;
  const env = await ambiente("demo-gastos-or-aberto", regrasAbertas);
  t.after(() => env.cleanup());
  await env.withSecurityRulesDisabled(async (contexto) => {
    await setDoc(doc(contexto.firestore(), ...caminhoPrivado()), MARCADOR);
  });
  const anon = env.unauthenticatedContext().firestore();
  const lido = await assertSucceeds(getDoc(doc(anon, ...caminhoPrivado())));
  assert.equal(lido.data().marcador, "sintetico-regra");
  await assertSucceeds(setDoc(doc(anon, ...caminhoPrivado()), MARCADOR));
});
});
