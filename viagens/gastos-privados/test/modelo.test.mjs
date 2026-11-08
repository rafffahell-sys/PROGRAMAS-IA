import assert from "node:assert/strict";
import test from "node:test";
import {
  EMAIL_PROPRIETARIO,
  ehProprietario,
  formatarCentavos,
  formatarDataIso,
  interpretarLancamento,
  interpretarLista,
  somarBrlCentavos
} from "../../js/gastos-privados-modelo.js";

function lancamento(extra = {}) {
  return {
    data: "2026-11-01",
    local: "Exemplo",
    categoria: "teste",
    moedaOriginal: "BRL",
    valorOriginalCentavos: 0,
    valorBrlCentavos: 0,
    ...extra
  };
}

test("so a conta esperada passa, e e-mail vazio nao libera ninguem", () => {
  assert.equal(ehProprietario(EMAIL_PROPRIETARIO, EMAIL_PROPRIETARIO), true);
  assert.equal(ehProprietario("Rafffahell@gmail.com", EMAIL_PROPRIETARIO), true);
  assert.equal(ehProprietario("outra-pessoa@gmail.com", EMAIL_PROPRIETARIO), false);
  assert.equal(ehProprietario(EMAIL_PROPRIETARIO, ""), false);
  assert.equal(ehProprietario("", ""), false);
});

test("interpreta o contrato e descarta campos que nao podem aparecer", () => {
  const lido = interpretarLancamento("abc", lancamento({
    valorOriginalCentavos: 1,
    valorBrlCentavos: -1,
    observacao: "nao mostrar",
    cartao: "nao mostrar",
    finalCartao: "9999",
    cvv: "000"
  }));
  assert.equal(lido.ok, true);
  assert.deepEqual(Object.keys(lido.lancamento).sort(), [
    "categoria",
    "data",
    "id",
    "local",
    "moedaOriginal",
    "valorBrlCentavos",
    "valorOriginalCentavos"
  ]);
  assert.equal(lido.lancamento.valorOriginalCentavos, 1);
  assert.equal(lido.lancamento.valorBrlCentavos, -1);
  assert.equal("observacao" in lido.lancamento, false);
  assert.equal("cartao" in lido.lancamento, false);
});

test("rejeita tipo inexato, data impossivel e texto vazio", () => {
  assert.equal(interpretarLancamento("abc", lancamento({ valorBrlCentavos: 1.5 })).ok, false);
  assert.equal(interpretarLancamento("abc", lancamento({ valorOriginalCentavos: "1" })).ok, false);
  assert.equal(interpretarLancamento("abc", lancamento({ data: "2026-02-31" })).ok, false);
  assert.equal(interpretarLancamento("abc", lancamento({ local: "  " })).ok, false);
  assert.equal(interpretarLancamento("abc", lancamento({ moedaOriginal: "brl" })).ok, false);
  assert.equal(interpretarLancamento("a/b", lancamento()).ok, false);
  assert.equal(interpretarLancamento("abc", []).ok, false);
});

test("ordena por data e soma so inteiros exatos", () => {
  const lista = interpretarLista([
    ["b", lancamento({ data: "2026-11-03", valorBrlCentavos: 50 })],
    ["a", lancamento({ data: "2026-11-02", valorBrlCentavos: 25 })],
    ["c", lancamento({ data: "2026-11-02", valorBrlCentavos: 25 })],
    ["ruim", lancamento({ categoria: "" })]
  ]);
  assert.equal(lista.ignorados, 1);
  assert.deepEqual(lista.aceitos.map((item) => item.id), ["a", "c", "b"]);
  assert.equal(somarBrlCentavos(lista.aceitos), 100);
  assert.throws(() => somarBrlCentavos([
    { valorBrlCentavos: Number.MAX_SAFE_INTEGER },
    { valorBrlCentavos: Number.MAX_SAFE_INTEGER }
  ]), RangeError);
});

test("formata centavos em pt-BR sem depender de ponto flutuante", () => {
  assert.equal(formatarCentavos(0, "BRL"), "R$\u00a00,00");
  assert.equal(formatarCentavos(1, "BRL"), "R$\u00a00,01");
  assert.equal(formatarCentavos(100, "USD"), "US$\u00a01,00");
  assert.equal(formatarCentavos(-1, "BRL"), "-R$\u00a00,01");
  assert.equal(formatarCentavos(100000, "BRL"), "R$\u00a01.000,00");
  assert.equal(formatarDataIso("2026-11-01"), "01/11/2026");
  assert.equal(formatarDataIso("2026-02-31"), "");
});
