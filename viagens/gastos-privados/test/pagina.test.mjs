import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  COLECAO_GASTOS,
  EMAIL_PROPRIETARIO,
  SUBCOLECAO_LANCAMENTOS,
  VIAGEM_ID
} from "../../js/gastos-privados-modelo.js";

const raiz = new URL("../../../", import.meta.url);
const pagina = readFileSync(new URL("viagens/uruguai-2026-rafael-victoria-samar.html", raiz), "utf8");
const regras = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
const config = readFileSync(new URL("ciclismo/js/firebase-config.js", raiz), "utf8");
const cliente = readFileSync(new URL("../../js/gastos-privados.js", import.meta.url), "utf8");

test("a pagina conserva o roteiro e ganha um acesso discreto", () => {
  assert.match(pagina, /01 — 08 novembro/);
  assert.match(pagina, /Belém → Montevidéu/);
  assert.match(pagina, /Dazzler by Wyndham Montevideo/);
  assert.match(pagina, /44 anos de Little/);
  assert.match(pagina, /id="abrir-gastos"/);
  assert.match(pagina, /id="gastos-dialog"/);
  assert.match(pagina, /Esta página não lê as regras publicadas no Firebase/);
  assert.match(pagina, /src="\.\.\/ciclismo\/js\/firebase-config\.js"/);
  assert.match(pagina, /src="js\/gastos-privados\.js"/);
  assert.doesNotMatch(pagina, /protegido pelo Firestore|proteção verificada|backend verificado/i);
});

test("o cliente nao guarda gastos e nao trata interface como seguranca", () => {
  assert.match(cliente, /memoryLocalCache/);
  assert.match(cliente, /terminate/);
  assert.doesNotMatch(cliente, /localStorage|sessionStorage|indexedDB|persistentLocalCache|innerHTML/);
  assert.match(cliente, /ehProprietario/);
  assert.match(cliente, /Esconder a tabela não bloqueia o banco/);
});

test("as regras citam o mesmo proprietario do ciclismo e excluem o caminho privado", () => {
  assert.match(config, new RegExp(EMAIL_PROPRIETARIO.replace(".", "\\.")));
  assert.match(regras, new RegExp(EMAIL_PROPRIETARIO.replace(".", "\\.")));
  assert.match(regras, new RegExp(`match /${COLECAO_GASTOS}/\\{viagem\\}/${SUBCOLECAO_LANCAMENTOS}/`));
  assert.match(regras, /colecao\.lower\(\) != "viagensprivadas"/);
  assert.match(regras, /colecao\.lower\(\) != "ciclismo"/);
  assert.equal(regras.includes(VIAGEM_ID), false);
  assert.doesNotMatch(regras, /match \/\{document=\*\*\}/);
  assert.doesNotMatch(regras, /allow read, write: if true/);
});
