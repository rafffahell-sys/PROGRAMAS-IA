import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "../..");

globalThis.__GV_TESTE__ = true;
globalThis.__GV_LEITOR_CARREGADO__ = false;

const { JSDOM } = await import("jsdom");
const dom = new JSDOM("<!doctype html><html><body><main id=\"gv-app\"></main></body></html>", {
  url: "http://127.0.0.1/ciclismo/grande-volta.html#/giro/2026"
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.location = dom.window.location;

const { iniciarPagina, htmlEtapa, htmlHub } = await import("./pagina.js");

function fetchLocal(pedidos) {
  return async (url) => {
    const alvo = String(url);
    pedidos.push(alvo);
    const arquivo = path.join(raiz, alvo.replace(/^\//, ""));
    const texto = fs.readFileSync(arquivo, "utf8");
    return { ok: true, async json() { return JSON.parse(texto); } };
  };
}

function atleta(pos) {
  return { pos, ciclista: `Atleta ${String(pos).padStart(2, "0")}`, equipe: `Equipe ${pos}`, tempo: "1:00:00", gap: "0:00" };
}

test("página real não pede snapshot nem desenha resultado", async () => {
  const pedidos = [];
  const raizDom = document.getElementById("gv-app");
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  const html = raizDom.innerHTML;
  assert.match(html, /0/);
  assert.match(html, /de 21 etapas confirmadas/);
  assert.match(html, /147 km|147/);
  assert.equal(html.includes("firestore"), false);
  assert.equal(html.includes("Atleta"), false);
  assert.equal(pedidos.some((url) => /snapshot|firestore|googleapis/i.test(url)), false);
  assert.equal(globalThis.__GV_LEITOR_CARREGADO__, false);

  location.hash = "#/giro/2026/etapa/1";
  raizDom.innerHTML = "";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  assert.match(raizDom.innerHTML, /Etapa 1/);
  assert.match(raizDom.innerHTML, /147 km/);
  assert.match(raizDom.innerHTML, /Perfil altimétrico a publicar/);
  assert.match(raizDom.innerHTML, /data-resultados="ocultos"/);
  assert.equal(raizDom.innerHTML.includes("Atleta"), false);
  assert.equal(pedidos.some((url) => /snapshot|firestore|googleapis/i.test(url)), false);
});

test("tour sem distância não inventa perfil", async () => {
  const pedidos = [];
  location.hash = "#/tour/2026/etapa/4";
  const raizDom = document.getElementById("gv-app");
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  assert.match(raizDom.innerHTML, /distância a publicar/);
  assert.match(raizDom.innerHTML, /Perfil altimétrico a publicar/);
  assert.match(raizDom.innerHTML, /data-resultados="ocultos"/);
});

test("filtro de perfil vazio e comparação não contígua sintética", () => {
  const prova = {
    slug: "giro",
    ano: 2026,
    nome: "Giro d'Italia",
    provaId: "b7",
    totalEtapas: 21,
    calendario: { inicio: "2026-05-08", fim: "2026-05-31" },
    fontes: [],
    camisas: [{ id: "gc", rotulo: "Maglia Rosa", unidade: "tempo", oficialConfirmado: true, cor: "#fff" }],
    regulamento: { notaPrioridade: "" },
    observacoes: [],
    etapas: [{ n: 1, km: 1, tipo: "plana", data: "2026-05-08", origem: "A", destino: "B", perfil: { pontos: [], sprints: [], montanhas: [] }, avisos: [] }]
  };
  const vazio = htmlHub(prova, { etapas: {}, provaCompleta: false }, { somenteComPerfil: true });
  assert.match(vazio, /Nenhuma etapa com esse filtro/);

  const liberacao = { etapas: { 1: true, 5: true }, provaCompleta: false };
  const etapa = { n: 5, km: 10, tipo: "plana", data: "2026-05-13", origem: "C", destino: "D", perfil: { pontos: [], sprints: [], montanhas: [] }, avisos: [], detalhe: null, tipoOficial: null, desnivelM: null };
  const snap = {
    sintetico: true,
    etapa: { top10: [atleta(1)] },
    gc: { top10: [atleta(1)] },
    camisas: { gc: { top5: [atleta(1)], lider: "Atleta 01", quemVeste: "Atleta 01", fonteNaoDistingue: false } }
  };
  const anterior = {
    sintetico: true,
    gc: { top10: [{ ...atleta(2), ciclista: "Atleta 01" }] },
    camisas: { gc: { top5: [] } }
  };
  const html = htmlEtapa({ ...prova, etapas: [etapa] }, etapa, liberacao, snap, anterior, { permitirSintetico: true });
  assert.match(html, /Comparação com a etapa 1/);
  assert.equal(html.includes("etapa 4"), false);
  assert.match(html, /data-resultados="visiveis"/);
  const bloqueado = htmlEtapa(prova, etapa, { etapas: {}, provaCompleta: false }, snap, null, { permitirSintetico: true });
  assert.match(bloqueado, /data-resultados="ocultos"/);
  assert.equal(bloqueado.includes("Atleta"), false);
});
