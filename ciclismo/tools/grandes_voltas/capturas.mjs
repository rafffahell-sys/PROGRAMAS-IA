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

async function ir(page, hash, texto) {
  await page.evaluate(async (alvo) => {
    location.hash = "#/reload";
    await new Promise((resolver) => setTimeout(resolver, 30));
    location.hash = alvo;
  }, hash);
  await page.waitForFunction((esperado) => document.body.innerText.toLowerCase().includes(esperado), {}, texto);
}

const desktop = await browser.newPage();
await desktop.setViewport({ width: 1280, height: 900 });
const pedidosDesktop = await preparar(desktop);

await desktop.goto(`${base}/index.html`, { waitUntil: "domcontentloaded" });
await desktop.waitForSelector("#lista article");
await desktop.select("#ano", "2026");
await desktop.waitForFunction(() => document.querySelector("#ano")?.value === "2026" && document.querySelector("#prova-b7"));
await desktop.waitForSelector("#atalho-gv a");
const atalhos = await desktop.$$eval("#atalho-gv a", (els) => els.map((el) => ({
  texto: el.textContent,
  href: el.getAttribute("href")
})));
exigir(atalhos.some((el) => el.href === "grande-volta.html#/giro/2026"), "sem botão do Giro");
exigir(atalhos.some((el) => el.href === "grande-volta.html#/tour/2026"), "sem botão do Tour");
exigir(atalhos.some((el) => el.href === "grande-volta.html#/vuelta/2026"), "sem botão da Vuelta");
exigir(!atalhos.some((el) => el.href.includes("/2027")), "botão apontou para edição sem percurso");
await desktop.screenshot({ path: `${out}/gv-atalhos-desktop.png` });
for (const [slug, titulo] of [["giro", "Giro"], ["tour", "Tour"], ["vuelta", "Vuelta"]]) {
  await desktop.click(`#atalho-gv a[href="grande-volta.html#/${slug}/2026"]`);
  await desktop.waitForSelector("#gv-app h1");
  const nome = await desktop.$eval("#gv-app h1", (el) => el.textContent);
  exigir(nome.toLowerCase().includes(titulo.toLowerCase()) || (slug === "vuelta" && /espanha|vuelta/i.test(nome)), `hub ${slug} não abriu`);
  await desktop.click("nav.gv-irmas a[href='index.html']");
  await desktop.waitForSelector("#atalho-gv");
  await desktop.select("#ano", "2026");
}
await desktop.select("#ano", "2027");
await desktop.waitForFunction(() => document.querySelector("#ano")?.value === "2027");
const atalhos2027 = await desktop.$$eval("#atalho-gv a", (els) => els.map((el) => el.getAttribute("href")));
exigir(atalhos2027.length === 3 && atalhos2027.every((href) => href.includes("/2026")), "2027 ganhou percurso que não existe");
await desktop.select("#ano", "2026");
await desktop.waitForSelector("#prova-b7");
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
const fav = await desktop.$("#favoritos-prelargada");
exigir(fav, "seção de favoritos pré-largada ausente");
await fav.evaluate((el) => el.scrollIntoView({ block: "start" }));
await fav.screenshot({ path: `${out}/gv-giro-favoritos-prelargada-desktop.png` });
const favTexto = await desktop.$eval("#favoritos-prelargada", (el) => el.innerText);
exigir(/pr[eé]-largada/i.test(favTexto), "título pré-largada ausente");
exigir(!/vitória|pódio|venceu|odds/i.test(favTexto), "favoritos com resultado");
const hubHtml = await desktop.$eval("#gv-app", (el) => el.innerHTML);
exigir(hubHtml.includes('aria-hidden="true"'), "ilustração sem aria-hidden");
exigir(hubHtml.includes("#008C45"), "giro sem tricolor");
exigir(hubHtml.includes("img/trofeus/giro-trofeo-senza-fine.jpg"), "hub do Giro sem o troféu");
exigir(hubHtml.includes("CC BY 2.0"), "troféu do Giro sem licença");
const trofeu = await desktop.$(".gv-trofeu");
await trofeu.screenshot({ path: `${out}/gv-giro-trofeu-desktop.png` });
const hub = (await desktop.$eval("#gv-app", (el) => el.innerText)).toLowerCase();
exigir(hub.includes("0 de 21 etapas confirmadas"), "hub sem progresso");
exigir(hub.includes("maglia rosa"), "hub sem camisa do Giro");
exigir(!hub.includes("a confirmar"), "Giro não deveria marcar camisa como a confirmar");

await desktop.click('input[name="perfil"]');
await desktop.waitForSelector(".gv-grade a");
const filtroDesktop = await desktop.$$eval(".gv-grade a", (cards) => cards.length);
exigir(filtroDesktop === 21, `filtro de perfil no Giro mostrou ${filtroDesktop}`);
const filtroTexto = await desktop.$eval("#gv-app", (el) => el.innerText);
exigir(filtroTexto.includes("com perfil"), "card filtrado sem marca de perfil");
exigir(!(await desktop.$(".gv-vazio")), "filtro esvaziou etapas que têm imagem");
await desktop.screenshot({ path: `${out}/gv-giro-filtro-perfil-desktop.png`, fullPage: true });
await desktop.click(".gv-grade a");
await desktop.waitForSelector("[data-resultados=\"ocultos\"]");
await desktop.waitForSelector(".gv-perfil-imagem img");
const etapa = await desktop.$eval("#gv-app", (el) => el.innerText);
exigir(etapa.includes("147 km"), "etapa 1 sem distância");
exigir(etapa.includes("Ampliar"), "etapa 1 sem opção de ampliar o perfil");
exigir(!etapa.includes("Perfil altimétrico a publicar"), "etapa 1 ainda trata o perfil como ausente");
const etapaHtml = await desktop.$eval("#gv-app", (el) => el.innerHTML);
exigir(etapaHtml.includes("img/perfis/giro-2026/etapa-01.jpg"), "etapa 1 sem arquivo do perfil");
exigir(etapaHtml.includes("Nessebar–Burgas"), "texto alternativo da etapa 1 sem o percurso");
exigir(etapaHtml.includes('aria-hidden="true"'), "etapa sem decoração acessível");
exigir(!etapaHtml.includes("<polyline"), "a etapa converteu o perfil em pontos");
await desktop.screenshot({ path: `${out}/gv-giro-etapa1-perfil-desktop.png`, fullPage: true });
exigir(etapa.includes("Bloqueados"), "aviso de bloqueio ausente");
exigir(!etapa.includes("Resumo da etapa"), "etapa bloqueada mostrou resumo");
exigir(!etapa.includes("Relato sintético"), "etapa bloqueada mostrou relato");
exigir(!etapa.includes("Atleta"), "etapa mostrou nome de teste");
await desktop.screenshot({ path: `${out}/gv-giro-etapa-desktop.png`, fullPage: true });

const folha = await browser.newPage();
await folha.setViewport({ width: 1280, height: 900 });
const pedidosFolha = await preparar(folha);
await folha.goto(`${base}/grande-volta.html#/tour/2026`, { waitUntil: "domcontentloaded" });
await folha.waitForFunction(() => document.body.innerText.toLowerCase().includes("carcassonne"));
await folha.waitForSelector("#favoritos-prelargada");
const tour = (await folha.$eval("#gv-app", (el) => el.innerText)).toLowerCase();
exigir(tour.includes("amarela"), "Tour sem camisa amarela");
exigir(tour.includes("carcassonne"), "Tour sem a etapa 4");
exigir(tour.includes("favoritos pré-largada"), "Tour sem favoritos pré-largada");
exigir(!/vitória|pódio|venceu/.test(tour), "Tour com resultado no hub");
exigir(tour.includes("ainda não há foto isolada"), "Tour mostrou troféu sem fonte");
await (await folha.$(".gv-trofeu")).screenshot({ path: `${out}/gv-tour-trofeu-desktop.png` });
await folha.screenshot({ path: `${out}/gv-tour-hub-desktop.png`, fullPage: true });
const favTour = await folha.$("#favoritos-prelargada");
await favTour.evaluate((el) => el.scrollIntoView({ block: "start" }));
await favTour.screenshot({ path: `${out}/gv-tour-favoritos-desktop.png` });
await folha.click('input[name="perfil"]');
await folha.waitForSelector(".gv-vazio");
await folha.screenshot({ path: `${out}/gv-tour-filtro-perfil-desktop.png` });
await folha.goto(`${base}/grande-volta.html#/tour/2026/etapa/6`, { waitUntil: "domcontentloaded" });
await folha.waitForFunction(() => document.body.innerText.includes("Gavarnie"));
const tourEtapa = await folha.$eval("#gv-app", (el) => el.innerText);
const tourEtapaHtml = await folha.$eval("#gv-app", (el) => el.innerHTML);
exigir(tourEtapa.includes("Gavarnie"), "etapa 6 do Tour sem destino");
exigir(tourEtapa.includes("186 km"), "etapa 6 do Tour sem distância");
exigir(tourEtapa.includes("Perfil altimétrico a publicar"), "Tour ganhou perfil que não foi verificado");
exigir(!tourEtapaHtml.includes("<polyline"), "Tour desenhou perfil");
exigir(tourEtapa.includes("Bloqueados"), "etapa do Tour mostrou resultado");
await folha.screenshot({ path: `${out}/gv-tour-etapa-desktop.png`, fullPage: true });

const folhaVuelta = await browser.newPage();
await folhaVuelta.setViewport({ width: 1280, height: 900 });
const pedidosVuelta = await preparar(folhaVuelta);
await folhaVuelta.goto(`${base}/grande-volta.html#/vuelta/2026`, { waitUntil: "domcontentloaded" });
await folhaVuelta.waitForFunction(() => document.body.innerText.toLowerCase().includes("monaco"));
await folhaVuelta.waitForSelector("#favoritos-prelargada");
const vueltaHub = (await folhaVuelta.$eval("#gv-app", (el) => el.innerText)).toLowerCase();
exigir(vueltaHub.includes("vermelha"), "Vuelta sem camisa vermelha");
exigir(vueltaHub.includes("favoritos pré-largada"), "Vuelta sem favoritos");
exigir(!/vitória|pódio|venceu/.test(vueltaHub), "Vuelta com resultado no hub");
exigir(vueltaHub.includes("ainda não há foto isolada"), "Vuelta mostrou troféu sem fonte");
await (await folhaVuelta.$(".gv-trofeu")).screenshot({ path: `${out}/gv-vuelta-trofeu-desktop.png` });
await folhaVuelta.screenshot({ path: `${out}/gv-vuelta-hub-desktop.png`, fullPage: true });
const favVuelta = await folhaVuelta.$("#favoritos-prelargada");
await favVuelta.evaluate((el) => el.scrollIntoView({ block: "start" }));
await favVuelta.screenshot({ path: `${out}/gv-vuelta-favoritos-desktop.png` });
await folhaVuelta.click('input[name="perfil"]');
await folhaVuelta.waitForSelector(".gv-grade a");
const filtroVuelta = await folhaVuelta.$$eval(".gv-grade a", (cards) => cards.length);
exigir(filtroVuelta === 21, `filtro da Vuelta mostrou ${filtroVuelta}`);
await folhaVuelta.screenshot({ path: `${out}/gv-vuelta-filtro-perfil-desktop.png`, fullPage: true });

await folhaVuelta.goto(`${base}/grande-volta.html#/vuelta/2026/etapa/1`, { waitUntil: "domcontentloaded" });
await folhaVuelta.waitForFunction(() => document.body.innerText.includes("9,4 km"));
await folhaVuelta.waitForSelector(".gv-perfil-imagem img");
const vuelta = await folhaVuelta.$eval("#gv-app", (el) => el.innerText);
const vueltaHtml = await folhaVuelta.$eval("#gv-app", (el) => el.innerHTML);
exigir(vuelta.includes("9,4 km"), "Vuelta etapa 1 sem 9,4 km");
exigir(vuelta.includes("Monaco"), "Vuelta etapa 1 sem origem");
exigir(vuelta.includes("Ampliar"), "Vuelta etapa 1 sem ampliar");
exigir(vueltaHtml.includes("img/perfis/vuelta-2026/etapa-01.jpg"), "Vuelta etapa 1 sem arquivo");
exigir(!vueltaHtml.includes("<polyline"), "Vuelta converteu o perfil em pontos");
exigir(vuelta.includes("Bloqueados"), "Vuelta etapa 1 mostrou resultado");
await folhaVuelta.screenshot({ path: `${out}/gv-vuelta-etapa-desktop.png`, fullPage: true });

const mobileCal = await browser.newPage();
await mobileCal.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const pedidosCal = await preparar(mobileCal);
await mobileCal.goto(`${base}/index.html`, { waitUntil: "domcontentloaded" });
await mobileCal.waitForSelector("#lista article");
await mobileCal.select("#ano", "2026");
await mobileCal.waitForSelector("#atalho-gv a");
await mobileCal.screenshot({ path: `${out}/gv-atalhos-mobile.png` });
await mobileCal.click("#atalho-gv a[href='grande-volta.html#/vuelta/2026']");
await mobileCal.waitForSelector("#gv-app h1");
await mobileCal.click("nav.gv-irmas a[href='index.html']");
await mobileCal.waitForSelector("#atalho-gv");

const mobile = await browser.newPage();
await mobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const pedidosMobile = await preparar(mobile);
await mobile.goto(`${base}/grande-volta.html#/giro/2026`, { waitUntil: "domcontentloaded" });
await mobile.waitForSelector(".gv-grade");
await mobile.screenshot({ path: `${out}/gv-giro-hub-mobile.png`, fullPage: true });
const favMovel = await mobile.$("#favoritos-prelargada");
await favMovel.evaluate((el) => el.scrollIntoView({ block: "start" }));
await favMovel.screenshot({ path: `${out}/gv-giro-favoritos-prelargada-mobile.png` });
await mobile.click('input[name="perfil"]');
await mobile.waitForSelector(".gv-grade a");
const filtroMobile = await mobile.$$eval(".gv-grade a", (cards) => cards.length);
exigir(filtroMobile === 21, `filtro móvel de perfil mostrou ${filtroMobile}`);
await mobile.screenshot({ path: `${out}/gv-giro-filtro-perfil-mobile.png`, fullPage: true });
await mobile.goto(`${base}/grande-volta.html#/giro/2026/etapa/1`, { waitUntil: "domcontentloaded" });
await mobile.waitForSelector(".gv-perfil-imagem img");
const etapa1 = await mobile.$eval("#gv-app", (el) => el.innerText);
exigir(etapa1.includes("147 km"), "etapa 1 móvel sem distância");
exigir(etapa1.includes("Ampliar"), "etapa 1 móvel sem ampliar");
exigir(etapa1.includes("Bloqueados"), "etapa 1 móvel mostrou resultado");
await mobile.screenshot({ path: `${out}/gv-giro-etapa1-perfil-mobile.png`, fullPage: true });
await mobile.goto(`${base}/grande-volta.html#/giro/2026/etapa/7`, { waitUntil: "domcontentloaded" });
await mobile.waitForSelector("[data-resultados=\"ocultos\"]");
const montanha = await mobile.$eval("#gv-app", (el) => el.innerText);
const montanhaHtml = await mobile.$eval("#gv-app", (el) => el.innerHTML);
exigir(montanha.includes("Blockhaus"), "etapa 7 sem a subida do regulamento");
exigir(montanha.includes("244 km"), "etapa 7 deixou de usar o km do regulamento");
exigir(montanha.includes("245"), "etapa 7 omitiu a divergência de 245 km");
exigir(montanha.includes("km não informado"), "subida ganhou km inventado");
exigir(montanha.includes("Bloqueados"), "mobile mostrou resultado");
exigir(montanhaHtml.includes("etapa-07.jpg"), "etapa 7 sem a imagem do perfil");
exigir(!montanhaHtml.includes("<polyline"), "etapa 7 converteu o perfil em pontos");
await mobile.screenshot({ path: `${out}/gv-giro-etapa-mobile.png`, fullPage: true });

await mobile.goto(`${base}/grande-volta.html#/tour/2026`, { waitUntil: "domcontentloaded" });
await mobile.waitForSelector("#favoritos-prelargada");
await mobile.screenshot({ path: `${out}/gv-tour-hub-mobile.png`, fullPage: true });
const favTourMovel = await mobile.$("#favoritos-prelargada");
await favTourMovel.evaluate((el) => el.scrollIntoView({ block: "start" }));
await favTourMovel.screenshot({ path: `${out}/gv-tour-favoritos-mobile.png` });
await mobile.goto(`${base}/grande-volta.html#/tour/2026/etapa/1`, { waitUntil: "domcontentloaded" });
await mobile.waitForSelector("[data-resultados=\"ocultos\"]");
await mobile.screenshot({ path: `${out}/gv-tour-etapa-mobile.png`, fullPage: true });

await mobile.goto(`${base}/grande-volta.html#/vuelta/2026`, { waitUntil: "domcontentloaded" });
await mobile.waitForSelector("#favoritos-prelargada");
await mobile.click('input[name="perfil"]');
await mobile.waitForSelector(".gv-grade a");
await mobile.screenshot({ path: `${out}/gv-vuelta-filtro-perfil-mobile.png`, fullPage: true });
const favVueltaMovel = await mobile.$("#favoritos-prelargada");
await favVueltaMovel.evaluate((el) => el.scrollIntoView({ block: "start" }));
await favVueltaMovel.screenshot({ path: `${out}/gv-vuelta-favoritos-mobile.png` });
await mobile.goto(`${base}/grande-volta.html#/vuelta/2026/etapa/1`, { waitUntil: "domcontentloaded" });
await mobile.waitForSelector(".gv-perfil-imagem img");
const vueltaMovel = await mobile.$eval("#gv-app", (el) => el.innerText);
exigir(vueltaMovel.includes("9,4 km"), "Vuelta móvel sem distância");
exigir(vueltaMovel.includes("Ampliar"), "Vuelta móvel sem ampliar");
exigir(vueltaMovel.includes("Bloqueados"), "Vuelta móvel mostrou resultado");
await mobile.screenshot({ path: `${out}/gv-vuelta-etapa-mobile.png`, fullPage: true });

const todos = [...pedidosDesktop, ...pedidosFolha, ...pedidosVuelta, ...pedidosCal, ...pedidosMobile];
const vazou = todos.filter((url) => /firestore\.googleapis|ciclismo_gv_snapshots|ciclismo_gv_analises|firebaseio/.test(url));
exigir(vazou.length === 0, `pedido de snapshot: ${vazou.join(" ")}`);

await browser.close();
console.log(JSON.stringify({
  classica: classicaOk.id,
  pedidos: todos.length,
  artefatos: fs.readdirSync(out)
}, null, 2));
