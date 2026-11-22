import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(raiz, "index.html"), "utf8");

function extrairSeed(fonte) {
  const inicio = fonte.indexOf("const seed=");
  const abre = fonte.indexOf("[", inicio);
  let nivel = 0;
  for (let i = abre; i < fonte.length; i += 1) {
    if (fonte[i] === "[") nivel += 1;
    else if (fonte[i] === "]") {
      nivel -= 1;
      if (nivel === 0) return JSON.parse(fonte.slice(abre, i + 1));
    }
  }
  throw new Error("seed não encontrado");
}

function toISO(valor) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor || "");
  if (!match) return "";
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const data = new Date(`${iso}T12:00:00Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === iso ? iso : "";
}

function parseKm(distance) {
  return parseFloat(String(distance || "").replace(",", ".")) || 0;
}

const earned = (e) => e.status === "concluido" && e.earned;
const futuras = (e) => e.status === "andamento" || e.status === "previsto";
const agenda = (e) => e.registered && e.status === "previsto" && toISO(e.date);

test("Passos pela Rambla e Aero Run ficam como não concluídas, sem medalha conquistada", () => {
  const seed = extrairSeed(html);
  const rambla = seed.find((e) => e.id === "montevideo");
  const aero = seed.find((e) => e.id === "aero-2026");
  const sesc = seed.find((e) => e.id === "sesc-2026");
  assert.equal(rambla.name, "Passos pela Rambla");
  assert.equal(rambla.status, "naoConcluida");
  assert.equal(rambla.earned, false);
  assert.equal(earned(rambla), false);
  assert.equal(futuras(rambla), false);
  assert.equal(Boolean(agenda(rambla)), false);
  assert.equal(aero.name, "Aero Run");
  assert.equal(aero.status, "naoConcluida");
  assert.equal(aero.earned, false);
  assert.equal(earned(aero), false);
  assert.equal(futuras(aero), false);
  assert.equal(Boolean(agenda(aero)), false);
  assert.equal(sesc.status, "concluido");
  assert.equal(sesc.earned, true);
  assert.equal(earned(sesc), true);
  assert.equal(futuras(sesc), false);
  assert.equal(Boolean(agenda(sesc)), false);
  assert.equal(sesc.registered, true);
  assert.equal(sesc.distance, "5 km");
  assert.equal(sesc.shirt, true);
  assert.equal(sesc.reconstructed, true);
  assert.equal(sesc.medal, "img/sesc-medal.webp");
  assert.equal(sesc.kit, "img/sesc-kit.webp");
  assert.deepEqual(sesc.photos, [
    "img/sesc-corrida-1.jpg",
    "img/sesc-corrida-2.jpg",
    "img/sesc-corrida-3.jpg",
  ]);
  assert.equal(sesc.time, "06:00");
  assert.equal(sesc.location, "Portal da Amazônia");
  assert.equal(sesc.date, "22/11/2026");
  assert.match(sesc.description, /Portal da Amazônia/);
  assert.match(sesc.description, /já na coleção/);
  assert.equal("pace" in sesc || "ritmo" in sesc || "posicao" in sesc || "bib" in sesc, false);
});

test("totais não incluem provas não concluídas nas medalhas, concluídas, previstos nem na agenda", () => {
  const seed = extrairSeed(html);
  const calendario = seed.filter(agenda);
  const km = calendario.reduce((soma, e) => soma + parseKm(e.distance), 0);
  assert.deepEqual(calendario.map((e) => e.id), ["marinheiro-2026", "belem-2027", "nb-2027"]);
  assert.equal(calendario.length, 3);
  assert.equal(km, 11);
  assert.equal(calendario.some((e) => e.id === "aero-2026" || e.id === "montevideo" || e.id === "sesc-2026"), false);
  assert.equal(seed.filter((e) => e.status === "concluido").length, 4);
  assert.equal(seed.filter(earned).length, 4);
  assert.equal(seed.filter(futuras).length, 5);
  assert.equal(seed.length, 11);
  assert.equal(seed.filter((e) => e.status === "naoConcluida").length, 2);
});

test("a página reconhece o status naoConcluida e separa a medalha não conquistada", () => {
  assert.match(html, /statusNames=\{[^}]*naoConcluida:'Não concluída'/);
  assert.match(html, /option value="naoConcluida">Não concluída/);
  assert.match(html, /data-filter="naoConcluida"/);
  assert.match(html, /future:all\.filter\(e=>e\.status==='andamento'\|\|e\.status==='previsto'\)\.length/);
  assert.match(html, /e\.status!=='naoConcluida'/);
  assert.match(html, /group\(all\.filter\(e=>e\.status==='naoConcluida'\),'unearned'\)/);
  assert.match(html, /Não conquistada/);
  assert.match(html, /rafael-victoria-calendar-v4/);
  assert.match(html, /rafael-victoria-calendar-v5/);
  assert.match(html, /rafael-victoria-calendar-v6/);
  assert.equal(html.includes("A imagem não foi invertida nem convertida em pontos."), false);
});

test("buscas dinâmicas, se existirem, usam cache no-store", () => {
  const chamadas = [...html.matchAll(/\bfetch\s*\(/g)];
  for (const chamada of chamadas) {
    const trecho = html.slice(chamada.index, chamada.index + 400);
    assert.match(trecho, /cache:\s*["']no-store["']/);
  }
});

test("a página renderizada mostra os totais e o estado não concluído", async () => {
  const require = createRequire(import.meta.url);
  let JSDOM;
  try {
    JSDOM = require(path.join(raiz, "../ciclismo/node_modules/jsdom")).JSDOM;
  } catch {
    JSDOM = require("jsdom").JSDOM;
  }
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://rafffahell.com.br/corridas/",
    pretendToBeVisual: true,
  });
  const doc = dom.window.document;
  assert.equal(doc.getElementById("total").textContent, "11");
  assert.equal(doc.getElementById("done").textContent, "04");
  assert.equal(doc.getElementById("future").textContent, "05");
  assert.equal(doc.getElementById("medals").textContent, "04");
  assert.equal(doc.getElementById("calendar-summary").textContent, "3 provas · 11 km · inscrições confirmadas");
  const agendaHtml = doc.getElementById("calendar-list").textContent;
  assert.equal(agendaHtml.includes("Aero Run"), false);
  assert.equal(agendaHtml.includes("Passos pela Rambla"), false);
  assert.equal(agendaHtml.includes("Corrida do Sesc"), false);
  assert.equal(agendaHtml.includes("Corrida do Marinheiro"), true);
  const vitrine = doc.getElementById("medal-showcase");
  assert.equal(vitrine.querySelector(".showcase-group.unearned") !== null, true);
  assert.match(vitrine.querySelector(".showcase-group.unearned").textContent, /Passos pela Rambla/);
  assert.match(vitrine.querySelector(".showcase-group.unearned").textContent, /Não conquistada/);
  assert.equal(vitrine.querySelector(".showcase-group.upcoming").textContent.includes("Passos pela Rambla"), false);
  assert.equal(vitrine.querySelector(".showcase-group:not(.upcoming):not(.unearned)").textContent.includes("Passos pela Rambla"), false);
  const cartoes = [...doc.querySelectorAll("#gallery .event")];
  const rambla = cartoes.find((el) => el.querySelector("h3")?.textContent === "Passos pela Rambla");
  const aero = cartoes.find((el) => el.querySelector("h3")?.textContent === "Aero Run");
  const sesc = cartoes.find((el) => el.querySelector("h3")?.textContent === "Corrida do Sesc");
  assert.equal(rambla.querySelector(".badge")?.textContent, "Não concluída");
  assert.equal(aero.querySelector(".badge")?.textContent, "Não concluída");
  assert.equal(aero.textContent.includes("Próxima largada"), false);
  assert.match(aero.textContent, /Não concluída/);
  assert.equal(sesc.querySelector(".badge")?.textContent, "Medalha conquistada");
  assert.equal(sesc.textContent.includes("Camisa em mãos"), true);
  const abas = [...sesc.querySelectorAll(".product-switch button")].map((b) => b.textContent);
  assert.deepEqual(abas, ["Medalha", "Camisa", "Fotos da corrida"]);
  assert.equal(sesc.querySelector("img.medal")?.getAttribute("src")?.startsWith("data:image/webp"), true);
  const conquistadas = vitrine.querySelector(".showcase-group:not(.upcoming):not(.unearned)");
  assert.match(conquistadas.textContent, /Corrida do Sesc/);
  assert.match(conquistadas.textContent, /Conquistada/);
  assert.equal(vitrine.querySelector(".showcase-group.upcoming").textContent.includes("Corrida do Sesc"), false);
  assert.equal(rambla.querySelector(".event-visual")?.classList.contains("unearned-art"), true);
  dom.window.close();
});

test("Corrida do Sesc concluída entra na vitrine e usa as fotos reais nas abas", () => {
  const seed = extrairSeed(html);
  const sesc = seed.find((e) => e.id === "sesc-2026");
  assert.equal(sesc.status, "concluido");
  assert.equal(earned(sesc), true);
  assert.equal(sesc.reconstructed, true);
  const inicio = html.indexOf("const ASSETS=");
  const abre = html.indexOf("{", inicio);
  let nivel = 0;
  let assetsJson;
  for (let i = abre; i < html.length; i += 1) {
    if (html[i] === "{") nivel += 1;
    else if (html[i] === "}") {
      nivel -= 1;
      if (nivel === 0) {
        assetsJson = html.slice(abre, i + 1);
        break;
      }
    }
  }
  const assets = JSON.parse(assetsJson);
  for (const path of [sesc.medal, sesc.kit, ...sesc.photos]) {
    assert.equal(typeof assets[path], "string");
    assert.match(assets[path], /^data:image\/(webp|jpeg);base64,/);
  }
  assert.match(html, /rafael-victoria-calendar-v5/);
  assert.match(html, /rafael-victoria-calendar-v6/);
  assert.match(assets[sesc.medal], /^data:image\/webp;base64,/);
  assert.match(assets[sesc.kit], /^data:image\/webp;base64,/);
  assert.match(html, /overrides\['sesc-2026'\]/);
  assert.match(html, /Medalha e camisa em apresentação de catálogo, reconstruídas a partir das fotos dos kits\./);
  assert.match(html, /e\.reconstructed\?'Medalha e camisa em apresentação de catálogo/);
});
