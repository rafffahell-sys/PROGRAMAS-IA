import puppeteer from "puppeteer-core";
import fs from "node:fs";

const chrome = "/usr/local/bin/google-chrome";
const base = "http://127.0.0.1:8765";
const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"]
});

async function preparar(page) {
  const pedidos = [];
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    pedidos.push(url);
    if (/firebase|firestore|googleapis\.com\/identitytoolkit|securetoken/.test(url)) req.abort();
    else req.continue();
  });
  return pedidos;
}

function exigir(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
}

const desktop = await browser.newPage();
await desktop.setViewport({ width: 1280, height: 900 });
const pedidosDesktop = await preparar(desktop);

await desktop.goto(`${base}/index.html`, { waitUntil: "domcontentloaded" });
await desktop.waitForSelector("#lista article");
await desktop.select("#ano", "2026");
await desktop.waitForFunction(() => document.querySelector("#ano")?.value === "2026" && document.querySelector("#prova-b7"));
const giroCard = await desktop.$eval("#prova-b7", (el) => ({
  texto: el.innerText,
  html: el.innerHTML
}));
exigir(giroCard.texto.includes("Abrir etapas"), "card do Giro sem link de etapas");
exigir(giroCard.texto.includes("0 de 21"), "progresso do Giro não está em zero");
exigir(!giroCard.html.includes('data-campo="p1"'), "card do Giro ainda mostra o pódio");
exigir(!/Atleta|Vencedor/.test(giroCard.texto), "card do Giro vazou nome ou campo de vencedor");

const classicaOk = await desktop.$$eval("article.prova", (cards) => {
  const grandes = new Set(["prova-b7", "prova-b10", "prova-b12"]);
  const card = cards.find((el) => !grandes.has(el.id));
  return card ? { id: card.id, temVencedor: card.innerHTML.includes('data-campo="p1"') } : null;
});
exigir(classicaOk && classicaOk.temVencedor, "clássica perdeu o campo de vencedor");

const cardGiro = await desktop.$("#prova-b7");
await cardGiro.evaluate((el) => el.scrollIntoView({ block: "center" }));
await cardGiro.screenshot({ path: `${out}/gv-giro-card-desktop.png` });
const classica = await desktop.$(`#${classicaOk.id}`);
await classica.evaluate((el) => el.scrollIntoView({ block: "center" }));
await classica.screenshot({ path: `${out}/gv-classica-card-desktop.png` });

await desktop.click("#prova-b7 .nome a");
await desktop.waitForSelector(".gv-grade");
await desktop.screenshot({ path: `${out}/gv-giro-hub-desktop.png`, fullPage: true });
const hubHtml = await desktop.$eval("#gv-app", (el) => el.innerHTML);
exigir(hubHtml.includes('aria-hidden="true"'), "ilustração sem aria-hidden");
exigir(hubHtml.includes("#008C45"), "giro sem tricolor");
const hub = (await desktop.$eval("#gv-app", (el) => el.innerText)).toLowerCase();
exigir(hub.includes("0 de 21 etapas confirmadas"), "hub sem progresso");
exigir(hub.includes("maglia rosa"), "hub sem camisa do Giro");
exigir(!hub.includes("a confirmar"), "Giro não deveria marcar camisa como a confirmar");

await desktop.click('input[name="perfil"]');
await desktop.waitForSelector(".gv-vazio");
await desktop.screenshot({ path: `${out}/gv-giro-filtro-perfil-desktop.png` });
await desktop.click('input[name="perfil"]');
await desktop.waitForSelector(".gv-grade a");
await desktop.click(".gv-grade a");
await desktop.waitForSelector("[data-resultados=\"ocultos\"]");
const etapa = await desktop.$eval("#gv-app", (el) => el.innerText);
exigir(etapa.includes("147 km"), "etapa 1 sem distância");
exigir(etapa.includes("Perfil altimétrico a publicar"), "perfil inventado ou ausente do aviso");
const etapaHtml = await desktop.$eval("#gv-app", (el) => el.innerHTML);
exigir(etapaHtml.includes('aria-hidden="true"'), "etapa sem decoração acessível");
exigir(!etapaHtml.includes("<polyline"), "a etapa desenhou um perfil que não existe");
exigir(etapa.includes("Bloqueados"), "aviso de bloqueio ausente");
exigir(!etapa.includes("Resumo da etapa"), "etapa bloqueada mostrou resumo");
exigir(!etapa.includes("Relato sintético"), "etapa bloqueada mostrou relato");
exigir(!etapa.includes("Atleta"), "etapa mostrou nome de teste");
await desktop.screenshot({ path: `${out}/gv-giro-etapa-desktop.png`, fullPage: true });

await desktop.goto(`${base}/grande-volta.html#/tour/2026`, { waitUntil: "domcontentloaded" });
await desktop.waitForSelector(".gv-grade");
const tour = (await desktop.$eval("#gv-app", (el) => el.innerText)).toLowerCase();
exigir(tour.includes("a confirmar"), "Tour deveria marcar camisa a confirmar");
exigir(tour.includes("distância a publicar") || tour.includes("sem distância"), "Tour preencheu lacuna");
await desktop.screenshot({ path: `${out}/gv-tour-hub-desktop.png`, fullPage: true });

await desktop.goto(`${base}/grande-volta.html#/vuelta/2026/etapa/1`, { waitUntil: "domcontentloaded" });
await desktop.waitForSelector("[data-resultados=\"ocultos\"]");
const vuelta = await desktop.$eval("#gv-app", (el) => el.innerText);
exigir(vuelta.includes("9,4 km"), "Vuelta etapa 1 sem 9,4 km");
exigir(vuelta.includes("Monaco"), "Vuelta etapa 1 sem origem");
await desktop.screenshot({ path: `${out}/gv-vuelta-etapa-desktop.png`, fullPage: true });

const mobile = await browser.newPage();
await mobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const pedidosMobile = await preparar(mobile);
await mobile.goto(`${base}/grande-volta.html#/giro/2026`, { waitUntil: "domcontentloaded" });
await mobile.waitForSelector(".gv-grade");
await mobile.screenshot({ path: `${out}/gv-giro-hub-mobile.png`, fullPage: true });
await mobile.goto(`${base}/grande-volta.html#/giro/2026/etapa/7`, { waitUntil: "domcontentloaded" });
await mobile.waitForSelector("[data-resultados=\"ocultos\"]");
const montanha = await mobile.$eval("#gv-app", (el) => el.innerText);
exigir(montanha.includes("Blockhaus"), "etapa 7 sem a subida do regulamento");
exigir(montanha.includes("km não informado"), "subida ganhou km inventado");
exigir(montanha.includes("Bloqueados"), "mobile mostrou resultado");
await mobile.screenshot({ path: `${out}/gv-giro-etapa-mobile.png`, fullPage: true });

const todos = [...pedidosDesktop, ...pedidosMobile];
const vazou = todos.filter((url) => /firestore\.googleapis|ciclismo_gv_snapshots|firebaseio/.test(url));
exigir(vazou.length === 0, `pedido de snapshot: ${vazou.join(" ")}`);

await browser.close();
console.log(JSON.stringify({
  classica: classicaOk.id,
  pedidos: todos.length,
  artefatos: fs.readdirSync(out)
}, null, 2));
