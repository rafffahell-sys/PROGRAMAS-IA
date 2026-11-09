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
const { htmlCena } = await import("./cena.js");

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
  assert.match(raizDom.innerHTML, /img\/perfis\/giro-2026\/etapa-01\.jpg/);
  assert.match(raizDom.innerHTML, /Nessebar–Burgas/);
  assert.match(raizDom.innerHTML, /Ampliar/);
  assert.equal(raizDom.innerHTML.includes("<polyline"), false);
  assert.equal(raizDom.innerHTML.includes("Perfil altimétrico a publicar"), false);
  assert.match(raizDom.innerHTML, /data-resultados="ocultos"/);
  assert.equal(raizDom.innerHTML.includes("Atleta"), false);
  assert.equal(pedidos.some((url) => /snapshot|firestore|googleapis/i.test(url)), false);
});

test("acesso falso e liberação malformada não pedem snapshot", async () => {
  const pedidos = [];
  globalThis.__GV_LEITOR_CARREGADO__ = false;
  location.hash = "#/giro/2026/etapa/1";
  const raizDom = document.getElementById("gv-app");
  const fetchFn = async (url) => {
    const alvo = String(url);
    pedidos.push(alvo);
    if (/snapshot|firestore|googleapis|firebase/i.test(alvo)) {
      throw new Error(`pedido bloqueado: ${alvo}`);
    }
    if (alvo.endsWith("acesso.json")) {
      return { ok: false, async json() { throw new Error("ausente"); } };
    }
    if (alvo.endsWith("liberacoes.json")) {
      return {
        ok: true,
        async json() {
          return { provas: { "2026_b7": { etapas: [true, true], provaCompleta: true } } };
        }
      };
    }
    const arquivo = path.join(raiz, alvo.replace(/^\//, ""));
    const texto = fs.readFileSync(arquivo, "utf8");
    return { ok: true, async json() { return JSON.parse(texto); } };
  };
  await iniciarPagina(raizDom, { fetchFn });
  assert.match(raizDom.innerHTML, /data-resultados="ocultos"/);
  assert.match(raizDom.innerHTML, /img\/perfis\/giro-2026\/etapa-01\.jpg/);
  assert.equal(raizDom.innerHTML.includes("<polyline"), false);
  assert.equal(raizDom.innerHTML.includes("Atleta"), false);
  assert.equal(pedidos.some((url) => /snapshot|firestore|googleapis|firebase/i.test(url)), false);
  assert.equal(globalThis.__GV_LEITOR_CARREGADO__, false);
  assert.match(raizDom.textContent, /0/);
});

test("tour com percurso não inventa perfil e não pede snapshot", async () => {
  const pedidos = [];
  location.hash = "#/tour/2026/etapa/4";
  const raizDom = document.getElementById("gv-app");
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  assert.match(raizDom.innerHTML, /182 km/);
  assert.match(raizDom.innerHTML, /Carcassonne/);
  assert.match(raizDom.innerHTML, /img\/perfis\/tour-2026\/etapa-04.jpg/);
  assert.match(raizDom.innerHTML, /img\/mapas\/tour-2026\/etapa-04.jpg/);
  assert.match(raizDom.innerHTML, /Ampliar mapa/);
  assert.equal(raizDom.innerHTML.includes("Perfil altimétrico a publicar"), false);
  assert.equal(raizDom.innerHTML.includes("img/trofeus/"), false);
  assert.equal(raizDom.innerHTML.includes("<polyline"), false);
  assert.match(raizDom.innerHTML, /data-resultados="ocultos"/);
  assert.equal(pedidos.some((url) => /snapshot|firestore|analise/i.test(url)), false);
});

test("cena do giro é italiana e a do tour não", () => {
  const giro = htmlCena("giro");
  const tour = htmlCena("tour");
  const vuelta = htmlCena("vuelta");
  assert.match(giro, /aria-hidden="true"/);
  assert.match(giro, /#008C45/);
  assert.match(giro, /#f4a4c4/);
  assert.equal(tour.includes("#008C45"), false);
  assert.match(tour, /#0055A4/);
  assert.match(tour, /gv-platano/);
  assert.equal(tour.includes("gv-cipreste"), false);
  assert.match(vuelta, /#C60B1E/);
  assert.match(vuelta, /gv-oliveira/);
  assert.equal(vuelta.includes("gv-cipreste"), false);
  assert.equal(giro.includes("Atleta"), false);
  assert.equal(giro.includes("ciclista"), false);
  const css = fs.readFileSync(path.join(raiz, "css/grande-volta.css"), "utf8");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.gv-roda \{\s*animation:\s*none/);
});

test("giro real filtra imagem de perfil e mantém o km do regulamento", () => {
  const prova = JSON.parse(fs.readFileSync(path.join(raiz, "data/grandes-voltas/2026/giro.json"), "utf8"));
  const hub = htmlHub(prova, { etapas: {}, provaCompleta: false }, { somenteComPerfil: true });
  assert.equal((hub.match(/class="gv-card"/g) || []).length, 21);
  assert.match(hub, /com perfil/);
  const etapa = prova.etapas.find((item) => item.n === 7);
  const html = htmlEtapa(prova, etapa, { etapas: {}, provaCompleta: false }, null, null);
  assert.match(html, /244 km/);
  assert.match(html, /245 km/);
  assert.match(html, /etapa-07\.jpg/);
  assert.match(html, /data-resultados="ocultos"/);
  assert.equal(html.includes("<polyline"), false);
  assert.equal(html.includes("firestore"), false);
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
  assert.equal(html.includes("Comparação com a etapa 4"), false);
  assert.match(html, /data-analise="bloqueada"/);
  assert.match(html, /data-resultados="visiveis"/);
  const bloqueado = htmlEtapa(prova, etapa, { etapas: {}, provaCompleta: false }, snap, null, { permitirSintetico: true });
  assert.match(bloqueado, /data-resultados="ocultos"/);
  assert.equal(bloqueado.includes("Atleta"), false);
  assert.equal(bloqueado.includes("data-resumo"), false);
});

test("favoritos pré-largada ficam no hub do giro e fora da etapa", async () => {
  const pedidos = [];
  location.hash = "#/giro/2026";
  const raizDom = document.getElementById("gv-app");
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  assert.match(raizDom.innerHTML, /Trofeo Senza Fine/);
  assert.match(raizDom.innerHTML, /CC BY 2.0/);
  assert.match(raizDom.innerHTML, /img\/trofeus\/giro-trofeo-senza-fine.jpg/);
  assert.match(raizDom.innerHTML, /Favoritos pré-largada/);
  assert.match(raizDom.innerHTML, /Seleção editorial baseada em análises anteriores à largada/);
  assert.equal(raizDom.innerHTML.includes("vitória"), false);
  assert.equal(raizDom.innerHTML.includes("pódio"), false);
  assert.equal((raizDom.querySelectorAll("#favoritos-prelargada .gv-pos")).length, 0);
  location.hash = "#/giro/2026/etapa/3";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  assert.equal(raizDom.innerHTML.includes("Favoritos pré-largada"), false);
  assert.equal(raizDom.innerHTML.includes("Jonas Vingegaard"), false);
  assert.match(raizDom.innerHTML, /data-analise="bloqueada"/);
  location.hash = "#/tour/2026";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  assert.match(raizDom.innerHTML, /Troféus de cristal 2026/);
  assert.match(raizDom.innerHTML, /img\/trofeus\/tour-2026-cristal.jpg/);
  assert.match(raizDom.innerHTML, /Škoda Storyboard/);
  assert.equal(raizDom.innerHTML.includes("giro-trofeo-senza-fine"), false);
  assert.equal(raizDom.innerHTML.includes("Imagem ainda não disponível"), false);
  location.hash = "#/vuelta/2026";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  assert.match(raizDom.innerHTML, /Ilustração inspirada no troféu da Vuelta \(não é foto oficial\)/);
  assert.match(raizDom.innerHTML, /img\/trofeus\/vuelta-ilustracao.jpg/);
  assert.equal(raizDom.innerHTML.includes("Imagem ainda não disponível"), false);
  assert.equal(raizDom.innerHTML.includes("giro-trofeo-senza-fine"), false);
  assert.equal(raizDom.innerHTML.includes("tour-2026-cristal"), false);
  assert.equal(pedidos.some((url) => /snapshot|firestore|ciclismo_gv_analises/i.test(url)), false);
  assert.notEqual(globalThis.__GV_ANALISE_CARREGADA__, true);
});

test("resumo sintético só na etapa liberada e sem html livre", () => {
  const prova = {
    slug: "giro", ano: 2026, nome: "Giro d'Italia", provaId: "b7", totalEtapas: 21,
    calendario: { inicio: "2026-05-08", fim: "2026-05-31" }, fontes: [], camisas: [],
    regulamento: { notaPrioridade: "" }, observacoes: [], etapas: []
  };
  const etapa = { n: 5, km: 10, tipo: "plana", data: "2026-05-13", origem: "C", destino: "D", perfil: { pontos: [], sprints: [], montanhas: [] }, avisos: [], detalhe: null, tipoOficial: null, desnivelM: null };
  const frase = "Relato sintético com <b>marca</b> que precisa aparecer só como texto.";
  const snap = {
    sintetico: true,
    resumo: { ausente: false, texto: frase, momentos: ["Lance sintético."], contextoClassificatorio: null, fonte: { nome: "fixture sintetica" } },
    etapa: { top10: [] }, gc: { top10: [] }, camisas: {}
  };
  const bloqueado = htmlEtapa(prova, etapa, { etapas: {}, provaCompleta: false }, snap, null, { permitirSintetico: true });
  assert.equal(bloqueado.includes("Relato sintético"), false);
  assert.equal(bloqueado.includes("data-resumo"), false);
  const liberado = htmlEtapa(prova, etapa, { etapas: { 5: true }, provaCompleta: false }, snap, null, { permitirSintetico: true });
  assert.match(liberado, /data-resumo="presente"/);
  assert.match(liberado, /&lt;b&gt;marca&lt;\/b&gt;/);
  assert.equal(liberado.includes("<b>marca</b>"), false);
});
