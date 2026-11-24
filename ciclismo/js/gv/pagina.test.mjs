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

const { iniciarPagina, htmlEtapa, htmlHub, formatarPontosClassificacao, lerPontos } = await import("./pagina.js");
const { htmlCena } = await import("./cena.js");

function fetchLocal(pedidos) {
  return async (url, _opcoes) => {
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

test("página real no hub não pede snapshot e etapa não liberada permanece oculta", async () => {
  const pedidos = [];
  const raizDom = document.getElementById("gv-app");
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  const html = raizDom.innerHTML;
  assert.match(html, /<strong>8<\/strong> de 21 etapas confirmadas/);
  assert.match(html, /147 km|147/);
  assert.equal(html.includes("firestore"), false);
  assert.equal(html.includes("Atleta"), false);
  assert.equal(pedidos.some((url) => /snapshot|firestore|googleapis/i.test(url)), false);
  assert.equal(globalThis.__GV_LEITOR_CARREGADO__, false);

  location.hash = "#/giro/2026/etapa/9";
  raizDom.innerHTML = "";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  assert.match(raizDom.innerHTML, /Etapa 9/);
  assert.match(raizDom.innerHTML, /184 km/);
  assert.match(raizDom.innerHTML, /img\/perfis\/giro-2026\/etapa-09\.jpg/);
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
  const fetchFn = async (url, _opcoes) => {
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
  assert.match(raizDom.innerHTML, /img\/perfis\/tour-2026\/etapa-04.png/);
  assert.match(raizDom.innerHTML, /img\/mapas\/tour-2026\/etapa-04.jpg/);
  assert.match(raizDom.innerHTML, /Ampliar mapa/);
  assert.match(raizDom.innerHTML, /Quilómetros que faltam/);
  assert.match(raizDom.innerHTML, /não foi invertido/);
  assert.match(raizDom.innerHTML, /Perfil redesenhado no formato Giro a partir do perfil oficial \(ASO\/letour\.fr\)/);
  assert.equal(raizDom.innerHTML.includes("A imagem não foi invertida nem convertida em pontos."), false);
  assert.match(raizDom.innerHTML, /Até a chegada/);
  assert.equal(raizDom.innerHTML.includes("Perfil altimétrico a publicar"), false);
  assert.equal(raizDom.innerHTML.includes("img/trofeus/"), false);
  assert.equal(raizDom.innerHTML.includes("<polyline"), false);
  assert.match(raizDom.innerHTML, /data-resultados="ocultos"/);
  assert.equal(pedidos.some((url) => /snapshot|firestore|analise/i.test(url)), false);
});

test("vuelta com percurso mostra o perfil redesenhado e não pede snapshot", async () => {
  const pedidos = [];
  location.hash = "#/vuelta/2026/etapa/1";
  const raizDom = document.getElementById("gv-app");
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  assert.match(raizDom.innerHTML, /img\/perfis\/vuelta-2026\/etapa-01.png/);
  assert.match(raizDom.innerHTML, /Perfil redesenhado no formato Giro a partir do perfil oficial \(livro de rota oficial\)/);
  assert.equal(raizDom.innerHTML.includes("A imagem não foi invertida nem convertida em pontos."), false);
  assert.equal(raizDom.innerHTML.includes("img/mapas/"), false);
  assert.equal(raizDom.innerHTML.includes("Perfil altimétrico a publicar"), false);
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
  assert.match(html, /244 km até a chegada/);
  assert.match(html, /245 km até a chegada/);
  assert.match(html, /eixo do desenho/);
  assert.match(html, /não foi invertido/);
  assert.match(html, /A imagem não foi invertida nem convertida em pontos/);
  assert.equal(html.includes("scaleX"), false);
  assert.match(html, /etapa-07\.jpg/);
  assert.equal(html.includes("ASO/letour.fr"), false);
  assert.equal(html.includes("livro de rota oficial"), false);
  assert.match(html, /distância até a chegada não informada/);
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
  location.hash = "#/giro/2026/etapa/9";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  assert.equal(raizDom.innerHTML.includes("Favoritos pré-largada"), false);
  assert.equal(raizDom.innerHTML.includes("Jonas Vingegaard"), false);
  assert.match(raizDom.innerHTML, /data-analise="indisponivel"/);
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

test("giro real: etapas 1, 2, 3, 4, 5, 6, 7 e 8 liberadas pedem o próprio snapshot estático", async () => {
  const raizDom = document.getElementById("gv-app");
  const pedidos = [];
  location.hash = "#/giro/2026/etapa/1";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  const snapshots1 = pedidos.filter((url) => /snapshots\//.test(url));
  assert.deepEqual(snapshots1, ["data/grandes-voltas/snapshots/2026_b7/apos-1.json"]);
  assert.match(raizDom.innerHTML, /data-resultados="visiveis"/);
  assert.match(raizDom.innerHTML, /Depois da etapa 1/);
  assert.match(raizDom.innerHTML, /Maglia Azzurra/);
  assert.match(raizDom.innerHTML, /data-analise="neutra"/);
  assert.equal(raizDom.querySelectorAll(".gv-resultados .gv-bloco").length >= 6, true);
  assert.equal(pedidos.some((url) => /firestore|googleapis|firebase/i.test(url)), false);
  assert.equal(globalThis.__GV_LEITOR_CARREGADO__, false);

  const antes2 = pedidos.length;
  location.hash = "#/giro/2026/etapa/2";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  const snapshots2 = pedidos.slice(antes2).filter((url) => /snapshots\//.test(url));
  assert.deepEqual(snapshots2, ["data/grandes-voltas/snapshots/2026_b7/apos-2.json", "data/grandes-voltas/snapshots/2026_b7/apos-1.json"]);
  assert.match(raizDom.innerHTML, /data-resultados="visiveis"/);
  assert.match(raizDom.innerHTML, /Depois da etapa 2/);
  assert.match(raizDom.innerHTML, /Maglia Azzurra/);
  assert.match(raizDom.innerHTML, /data-analise="indisponivel"/);
  assert.equal(raizDom.querySelectorAll(".gv-resultados .gv-bloco").length >= 6, true);
  assert.equal(pedidos.slice(antes2).some((url) => /firestore|googleapis|firebase/i.test(url)), false);
  assert.equal(globalThis.__GV_LEITOR_CARREGADO__, false);

  const antes3 = pedidos.length;
  location.hash = "#/giro/2026/etapa/3";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  const snapshots3 = pedidos.slice(antes3).filter((url) => /snapshots\//.test(url));
  assert.deepEqual(snapshots3, ["data/grandes-voltas/snapshots/2026_b7/apos-3.json", "data/grandes-voltas/snapshots/2026_b7/apos-2.json"]);
  assert.match(raizDom.innerHTML, /data-resultados="visiveis"/);
  assert.match(raizDom.innerHTML, /Depois da etapa 3/);
  assert.match(raizDom.innerHTML, /Maglia Azzurra/);
  assert.equal(raizDom.querySelectorAll(".gv-resultados .gv-bloco").length >= 6, true);
  assert.equal(pedidos.slice(antes3).some((url) => /firestore|googleapis|firebase/i.test(url)), false);
  assert.equal(globalThis.__GV_LEITOR_CARREGADO__, false);

  const antes4 = pedidos.length;
  location.hash = "#/giro/2026/etapa/4";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  const snapshots4 = pedidos.slice(antes4).filter((url) => /snapshots\//.test(url));
  assert.deepEqual(snapshots4, ["data/grandes-voltas/snapshots/2026_b7/apos-4.json", "data/grandes-voltas/snapshots/2026_b7/apos-3.json"]);
  assert.match(raizDom.innerHTML, /data-resultados="visiveis"/);
  assert.match(raizDom.innerHTML, /Depois da etapa 4/);
  assert.match(raizDom.innerHTML, /Maglia Azzurra/);
  assert.equal(raizDom.querySelectorAll(".gv-resultados .gv-bloco").length >= 6, true);
  assert.equal(pedidos.slice(antes4).some((url) => /firestore|googleapis|firebase/i.test(url)), false);
  assert.equal(globalThis.__GV_LEITOR_CARREGADO__, false);

  const antes5 = pedidos.length;
  location.hash = "#/giro/2026/etapa/5";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  const snapshots5 = pedidos.slice(antes5).filter((url) => /snapshots\//.test(url));
  assert.deepEqual(snapshots5, ["data/grandes-voltas/snapshots/2026_b7/apos-5.json", "data/grandes-voltas/snapshots/2026_b7/apos-4.json"]);
  assert.match(raizDom.innerHTML, /data-resultados="visiveis"/);
  assert.match(raizDom.innerHTML, /Depois da etapa 5/);
  assert.match(raizDom.innerHTML, /Maglia Azzurra/);
  assert.equal(raizDom.querySelectorAll(".gv-resultados .gv-bloco").length >= 6, true);
  assert.equal(pedidos.slice(antes5).some((url) => /firestore|googleapis|firebase/i.test(url)), false);
  assert.equal(globalThis.__GV_LEITOR_CARREGADO__, false);

  const antes6 = pedidos.length;
  location.hash = "#/giro/2026/etapa/6";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  const snapshots6 = pedidos.slice(antes6).filter((url) => /snapshots\//.test(url));
  assert.deepEqual(snapshots6, ["data/grandes-voltas/snapshots/2026_b7/apos-6.json", "data/grandes-voltas/snapshots/2026_b7/apos-5.json"]);
  assert.match(raizDom.innerHTML, /data-resultados="visiveis"/);
  assert.match(raizDom.innerHTML, /Depois da etapa 6/);
  assert.match(raizDom.innerHTML, /Maglia Azzurra/);
  assert.equal(raizDom.querySelectorAll(".gv-resultados .gv-bloco").length >= 6, true);
  assert.equal(pedidos.slice(antes6).some((url) => /firestore|googleapis|firebase/i.test(url)), false);
  assert.equal(globalThis.__GV_LEITOR_CARREGADO__, false);

  const antes7 = pedidos.length;
  location.hash = "#/giro/2026/etapa/7";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  const snapshots7 = pedidos.slice(antes7).filter((url) => /snapshots\//.test(url));
  assert.deepEqual(snapshots7, ["data/grandes-voltas/snapshots/2026_b7/apos-7.json", "data/grandes-voltas/snapshots/2026_b7/apos-6.json"]);
  assert.match(raizDom.innerHTML, /data-resultados="visiveis"/);
  assert.match(raizDom.innerHTML, /Depois da etapa 7/);
  assert.match(raizDom.innerHTML, /Maglia Azzurra/);
  assert.equal(raizDom.querySelectorAll(".gv-resultados .gv-bloco").length >= 6, true);
  assert.equal(pedidos.slice(antes7).some((url) => /firestore|googleapis|firebase/i.test(url)), false);
  assert.equal(globalThis.__GV_LEITOR_CARREGADO__, false);

  const antes8 = pedidos.length;
  location.hash = "#/giro/2026/etapa/8";
  await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
  const snapshots8 = pedidos.slice(antes8).filter((url) => /snapshots\//.test(url));
  assert.deepEqual(snapshots8, ["data/grandes-voltas/snapshots/2026_b7/apos-8.json", "data/grandes-voltas/snapshots/2026_b7/apos-7.json"]);
  assert.match(raizDom.innerHTML, /data-resultados="visiveis"/);
  assert.match(raizDom.innerHTML, /Depois da etapa 8/);
  assert.match(raizDom.innerHTML, /Maglia Azzurra/);
  assert.equal(raizDom.querySelectorAll(".gv-resultados .gv-bloco").length >= 6, true);
  assert.equal(pedidos.slice(antes8).some((url) => /firestore|googleapis|firebase/i.test(url)), false);
  assert.equal(globalThis.__GV_LEITOR_CARREGADO__, false);

  for (let n = 9; n <= 21; n += 1) {
    const antes = pedidos.length;
    location.hash = `#/giro/2026/etapa/${n}`;
    await iniciarPagina(raizDom, { fetchFn: fetchLocal(pedidos) });
    const novos = pedidos.slice(antes);
    assert.equal(novos.some((url) => /snapshot|firestore|googleapis|analise/i.test(url)), false, `etapa ${n}`);
    assert.match(raizDom.innerHTML, /data-resultados="ocultos"/, `etapa ${n}`);
  }
});

test("liberacoes.json, acesso.json e snapshots liberados são pedidos com cache no-store", async () => {
  const pedidos = [];
  location.hash = "#/giro/2026/etapa/1";
  const raizDom = document.getElementById("gv-app");
  const fetchFn = async (url, opcoes) => {
    const alvo = String(url);
    pedidos.push({ url: alvo, opcoes: opcoes || {} });
    const arquivo = path.join(raiz, alvo.replace(/^\//, ""));
    const texto = fs.readFileSync(arquivo, "utf8");
    return { ok: true, async json() { return JSON.parse(texto); } };
  };
  await iniciarPagina(raizDom, { fetchFn });
  const liberacoes = pedidos.find((item) => item.url.endsWith("liberacoes.json"));
  assert.ok(liberacoes);
  assert.equal(liberacoes.opcoes.cache, "no-store");
  const acesso = pedidos.find((item) => item.url.endsWith("acesso.json"));
  assert.ok(acesso);
  assert.equal(acesso.opcoes.cache, "no-store");
  const snapshots = pedidos.filter((item) => /snapshots\//.test(item.url));
  assert.deepEqual(snapshots.map((item) => item.url), [
    "data/grandes-voltas/snapshots/2026_b7/apos-1.json"
  ]);
  assert.equal(snapshots.every((item) => item.opcoes.cache === "no-store"), true);
  assert.equal(pedidos.some((item) => /apos-9\.json|firestore|googleapis/i.test(item.url)), false);
});

test("só existe arquivo de snapshot para etapa liberada", () => {
  const liberacoes = JSON.parse(fs.readFileSync(path.join(raiz, "data/grandes-voltas/liberacoes.json"), "utf8"));
  const pasta = path.join(raiz, "data/grandes-voltas/snapshots");
  const achados = [];
  for (const prova of fs.readdirSync(pasta)) {
    for (const arquivo of fs.readdirSync(path.join(pasta, prova))) {
      const m = arquivo.match(/^apos-(\d{1,2})\.json$/);
      assert.ok(m, arquivo);
      assert.equal(liberacoes.provas[prova]?.etapas?.[m[1]], true, `${prova}/${arquivo}`);
      achados.push(`${prova}/${m[1]}`);
    }
  }
  assert.deepEqual(achados, ["2026_b7/1", "2026_b7/2", "2026_b7/3", "2026_b7/4", "2026_b7/5", "2026_b7/6", "2026_b7/7", "2026_b7/8"]);
});


test("ícone de camisa aparece no hub e no título da classificação", () => {
  const prova = {
    slug: "tour",
    ano: 2026,
    nome: "Tour de France",
    provaId: "b10",
    totalEtapas: 21,
    calendario: { inicio: "2026-07-04", fim: "2026-07-26" },
    fontes: [],
    camisas: [
      { id: "gc", rotulo: "Amarela", unidade: "tempo", oficialConfirmado: true, cor: "#ffe14a" },
      { id: "montanha", rotulo: "Bolinhas vermelhas", unidade: "pontos", oficialConfirmado: true, cor: "#e10600" }
    ],
    regulamento: { notaPrioridade: "" },
    observacoes: [],
    etapas: []
  };
  const hub = htmlHub(prova, { etapas: {}, provaCompleta: false });
  assert.match(hub, /class="gv-icone-camisa"/);
  assert.match(hub, /aria-label="Amarela"/);
  assert.match(hub, /aria-label="Bolinhas vermelhas"/);
  assert.match(hub, /<pattern /);
  const etapa = { n: 1, km: 10, tipo: "plana", data: "2026-07-04", origem: "A", destino: "B", perfil: { pontos: [], sprints: [], montanhas: [] }, avisos: [], detalhe: null, tipoOficial: null, desnivelM: null };
  const snap = {
    sintetico: true,
    resumo: "Relato sintético desta etapa de teste. Nada disto é resultado de uma prova real.",
    resumoFontes: ["https://www.example.com/cronica", "https://stats.exemplo.org/etapa-1"],
    etapa: { top10: [] },
    gc: { top10: [] },
    camisas: {
      gc: { top5: [atleta(1)], lider: "Atleta 01", quemVeste: "Atleta 01", fonteNaoDistingue: false },
      montanha: { top5: [atleta(1)], lider: "Atleta 01", quemVeste: "Atleta 01", fonteNaoDistingue: false }
    }
  };
  const html = htmlEtapa({ ...prova, etapas: [etapa] }, etapa, { etapas: { 1: true }, provaCompleta: false }, snap, null, { permitirSintetico: true });
  assert.match(html, /class="gv-titulo-camisa"/);
  assert.equal((html.match(/class="gv-icone-camisa"/g) || []).length >= 2, true);
  assert.match(html, /data-camisa="gc"/);
  assert.match(html, /data-resumo="presente"/);
  assert.match(html, /Relato sintético desta etapa de teste/);
  assert.match(html, /href="https:\/\/www\.example\.com\/cronica"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, />example\.com</);
  assert.match(html, />stats\.exemplo\.org</);
  const vazio = htmlEtapa({ ...prova, etapas: [etapa] }, etapa, { etapas: { 1: true }, provaCompleta: false }, { sintetico: true, etapa: { top10: [] }, gc: { top10: [] }, camisas: {} }, null, { permitirSintetico: true });
  assert.match(vazio, /data-resumo="ausente"/);
  assert.match(vazio, /O resumo ainda não foi adicionado/);
});

test("resumo em string escapa html e ignora fonte que não é http", () => {
  const prova = {
    slug: "giro", ano: 2026, nome: "Giro d'Italia", provaId: "b7", totalEtapas: 21,
    calendario: { inicio: "2026-05-08", fim: "2026-05-31" }, fontes: [], camisas: [],
    regulamento: { notaPrioridade: "" }, observacoes: [], etapas: []
  };
  const etapa = { n: 5, km: 10, tipo: "plana", data: "2026-05-13", origem: "C", destino: "D", perfil: { pontos: [], sprints: [], montanhas: [] }, avisos: [], detalhe: null, tipoOficial: null, desnivelM: null };
  const snap = {
    sintetico: true,
    resumo: "Relato sintético com <b>marca</b> que precisa aparecer só como texto.",
    resumoFontes: ["https://fonte.example/ok", "javascript:alert(1)", "ftp://nao.vale"],
    etapa: { top10: [] }, gc: { top10: [] }, camisas: {}
  };
  const html = htmlEtapa(prova, etapa, { etapas: { 5: true }, provaCompleta: false }, snap, null, { permitirSintetico: true });
  assert.match(html, /data-resumo="presente"/);
  assert.match(html, /&lt;b&gt;marca&lt;\/b&gt;/);
  assert.equal(html.includes("<b>marca</b>"), false);
  assert.match(html, /href="https:\/\/fonte\.example\/ok"/);
  assert.equal(html.includes("javascript:"), false);
  assert.equal(html.includes("ftp://"), false);
});


test("classificação por pontos mostra pts e menos tipográfico; o tempo não muda", () => {
  assert.equal(formatarPontosClassificacao({ pontos: 50, diff: 0 }), "50 pts");
  assert.equal(formatarPontosClassificacao({ pontos: 35, diff: 15 }), "35 pts \u221215");
  assert.equal(formatarPontosClassificacao({ pontos: 6, diff: 0 }), "6 pts");
  assert.equal(formatarPontosClassificacao({ pontos: 4, diff: 2 }), "4 pts \u22122");
  assert.equal(formatarPontosClassificacao({ pontos: 1, diff: 5 }), "1 pts \u22125");
  assert.equal(formatarPontosClassificacao({ pts: "23", diferenca: "27" }), "23 pts \u221227");
  assert.equal(formatarPontosClassificacao({ pontos: 50, diff: "0" }), "50 pts");
  assert.equal(formatarPontosClassificacao({}), "");
  assert.equal(lerPontos({ pontos: 6 }), 6);

  const prova = {
    slug: "giro", ano: 2026, nome: "Giro d'Italia", provaId: "b7", totalEtapas: 21,
    calendario: { inicio: "2026-05-08", fim: "2026-05-31" }, fontes: [],
    camisas: [
      { id: "gc", rotulo: "Maglia Rosa", unidade: "tempo", oficialConfirmado: true, cor: "#f4a4c4" },
      { id: "pontos", rotulo: "Maglia Ciclamino", unidade: "pontos", oficialConfirmado: true, cor: "#a0307a" },
      { id: "montanha", rotulo: "Maglia Azzurra", unidade: "pontos", oficialConfirmado: true, cor: "#5bb8e8" },
      { id: "jovem", rotulo: "Maglia Bianca", unidade: "tempo", oficialConfirmado: true, cor: "#fff" }
    ],
    regulamento: { notaPrioridade: "" }, observacoes: [], etapas: []
  };
  const etapa = { n: 1, km: 10, tipo: "plana", data: "2026-05-08", origem: "A", destino: "B", perfil: { pontos: [], sprints: [], montanhas: [] }, avisos: [], detalhe: null, tipoOficial: null, desnivelM: null };
  const linhaTempo = (pos, tempo, gap) => ({ pos, ciclista: `Atleta ${String(pos).padStart(2, "0")}`, equipe: `Equipe ${pos}`, tempo, gap });
  const linhaPts = (pos, pontos, diff) => ({ pos, ciclista: `Atleta ${String(pos).padStart(2, "0")}`, equipe: `Equipe ${pos}`, pontos, diff });
  const snap = {
    sintetico: true,
    etapa: { top10: [linhaTempo(1, "3:21:08", "+0:00")] },
    gc: { top10: [linhaTempo(1, "3:20:58", "+0:00"), linhaTempo(2, "3:21:02", "+0:04")] },
    camisas: {
      gc: { top5: [linhaTempo(1, "3:20:58", "+0:00")], lider: "Atleta 01", quemVeste: "Atleta 01", fonteNaoDistingue: false, unidade: "tempo" },
      pontos: { top5: [linhaPts(1, 50, 0), linhaPts(2, 35, 15), linhaPts(3, 25, 25)], lider: "Atleta 01", quemVeste: null, fonteNaoDistingue: true, unidade: "pontos" },
      montanha: { top5: [linhaPts(1, 6, 0), linhaPts(2, 4, 2), linhaPts(3, 1, 5), linhaPts(4, 1, 5)], lider: "Atleta 04", quemVeste: "Atleta 04", fonteNaoDistingue: false, unidade: "pontos", totalClassificados: 4 },
      jovem: { top5: [linhaTempo(1, "3:20:58", "+0:00")], lider: "Atleta 01", quemVeste: null, fonteNaoDistingue: true, unidade: "tempo" }
    }
  };
  const html = htmlEtapa({ ...prova, etapas: [etapa] }, etapa, { etapas: { 1: true }, provaCompleta: false }, snap, null, { permitirSintetico: true });
  const ciclamino = html.match(/data-camisa="pontos"[\s\S]*?<\/section>/)[0];
  const azzurra = html.match(/data-camisa="montanha"[\s\S]*?<\/section>/)[0];
  const rosa = html.match(/data-camisa="gc"[\s\S]*?<\/section>/)[0];
  const bianca = html.match(/data-camisa="jovem"[\s\S]*?<\/section>/)[0];
  assert.match(ciclamino, /class="gv-tempo gv-pts">50 pts</);
  assert.match(ciclamino, /35 pts \u221215/);
  assert.match(ciclamino, /25 pts \u221225/);
  assert.equal(ciclamino.includes("50 0"), false);
  assert.equal(ciclamino.includes("50 pts 0"), false);
  assert.equal(ciclamino.includes(">0<") || /gv-pts">0/.test(ciclamino), false);
  assert.match(azzurra, /class="gv-tempo gv-pts">6 pts</);
  assert.match(azzurra, /4 pts \u22122/);
  assert.match(azzurra, /1 pts \u22125/);
  assert.equal(azzurra.includes("6 0"), false);
  assert.match(rosa, /class="gv-tempo">3:20:58 \+0:00</);
  assert.equal(rosa.includes("pts"), false);
  assert.match(bianca, /3:20:58 \+0:00/);
  assert.equal(bianca.includes("pts"), false);
  assert.match(html, /3:21:08 \+0:00/);
});

test("Azzurra lê pontos mesmo se a unidade vier só do snapshot", () => {
  const prova = {
    slug: "giro", ano: 2026, nome: "Giro d'Italia", provaId: "b7", totalEtapas: 21,
    calendario: { inicio: "2026-05-08", fim: "2026-05-31" }, fontes: [],
    camisas: [{ id: "montanha", rotulo: "Maglia Azzurra", oficialConfirmado: true, cor: "#5bb8e8" }],
    regulamento: { notaPrioridade: "" }, observacoes: [], etapas: []
  };
  const etapa = { n: 1, km: 10, tipo: "plana", data: "2026-05-08", origem: "A", destino: "B", perfil: { pontos: [], sprints: [], montanhas: [] }, avisos: [], detalhe: null, tipoOficial: null, desnivelM: null };
  const snap = {
    sintetico: true,
    etapa: { top10: [] }, gc: { top10: [] },
    camisas: {
      montanha: {
        top5: [{ pos: 1, ciclista: "Atleta 04", equipe: "Equipe 4", pontos: 6, diff: 0 }],
        lider: "Atleta 04", quemVeste: "Atleta 04", fonteNaoDistingue: false, unidade: "pontos"
      }
    }
  };
  const html = htmlEtapa({ ...prova, etapas: [etapa] }, etapa, { etapas: { 1: true }, provaCompleta: false }, snap, null, { permitirSintetico: true });
  assert.match(html, /data-camisa="montanha"/);
  assert.match(html, /6 pts/);
  assert.equal(html.includes("6 0"), false);
});
