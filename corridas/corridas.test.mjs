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
  assert.equal(sesc.status, "previsto");
  assert.equal(sesc.registered, true);
  assert.equal(sesc.distance, "5 km");
  assert.match(sesc.description, /Inscrições de Rafael e Victoria confirmadas/);
});

test("totais não incluem provas não concluídas nas medalhas, concluídas, previstos nem na agenda", () => {
  const seed = extrairSeed(html);
  const calendario = seed.filter(agenda);
  const km = calendario.reduce((soma, e) => soma + parseKm(e.distance), 0);
  assert.deepEqual(calendario.map((e) => e.id), ["sesc-2026", "marinheiro-2026", "belem-2027", "nb-2027"]);
  assert.equal(calendario.length, 4);
  assert.equal(km, 16);
  assert.equal(calendario.some((e) => e.id === "aero-2026" || e.id === "montevideo"), false);
  assert.equal(seed.filter((e) => e.status === "concluido").length, 3);
  assert.equal(seed.filter(earned).length, 3);
  assert.equal(seed.filter(futuras).length, 6);
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
  assert.equal(doc.getElementById("done").textContent, "03");
  assert.equal(doc.getElementById("future").textContent, "06");
  assert.equal(doc.getElementById("medals").textContent, "03");
  assert.equal(doc.getElementById("calendar-summary").textContent, "4 provas · 16 km · inscrições confirmadas");
  const agendaHtml = doc.getElementById("calendar-list").textContent;
  assert.equal(agendaHtml.includes("Aero Run"), false);
  assert.equal(agendaHtml.includes("Passos pela Rambla"), false);
  assert.equal(agendaHtml.includes("Corrida do Sesc"), true);
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
  assert.equal(sesc.querySelector(".badge")?.textContent, "Inscrições confirmadas");
  assert.equal(rambla.querySelector(".event-visual")?.classList.contains("unearned-art"), true);
  dom.window.close();
});
