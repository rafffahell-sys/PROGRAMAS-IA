import test from "node:test";
import assert from "node:assert/strict";
import {
  compararTops,
  etapaAnteriorLiberada,
  estadoChip,
  filtrarEtapas,
  lerRota,
  numerosLiberados,
  podeLerSnapshot,
  validarSnapshot
} from "./modelo.js";
import { carregarSnapshot } from "./snapshots.js";
import { pontosValidos, svgPerfil } from "./perfil.js";

const config = {
  provaId: "b7",
  ano: 2026,
  totalEtapas: 21,
  camisas: [{ id: "gc" }, { id: "pontos" }]
};

function linha(pos, pontos = false) {
  const item = { pos, ciclista: `Atleta ${String(pos).padStart(2, "0")}`, equipe: `Equipe ${String(pos).padStart(2, "0")}` };
  if (pontos) {
    item.pontos = 10 - pos;
    item.diff = pos - 1;
  } else {
    item.tempo = "1:00:00";
    item.gap = "0:00";
  }
  return item;
}

function snapshot(etapa) {
  const top10 = Array.from({ length: 10 }, (_, i) => linha(i + 1));
  const top5 = top10.slice(0, 5);
  const camisa = (lista, distingue) => ({
    top5: lista,
    lider: lista[0].ciclista,
    quemVeste: distingue ? lista[0].ciclista : null,
    fonteNaoDistingue: !distingue
  });
  return {
    sintetico: true,
    rotulo: "DADO SINTETICO — NAO E RESULTADO DE PROVA",
    provaId: "b7",
    ano: 2026,
    aposEtapa: etapa,
    imutavel: true,
    etapa: { top10 },
    gc: { top10 },
    camisas: { gc: camisa(top5, true), pontos: camisa(top5.map((item) => linha(item.pos, true)), false) },
    equipes: null,
    validacao: { ok: true, checagens: [], avisos: [] }
  };
}

test("liberação não contígua compara com a anterior confirmada, não com n-1", () => {
  const liberacao = { etapas: { 1: true, 2: true, 5: true }, provaCompleta: false };
  assert.deepEqual(numerosLiberados(liberacao), [1, 2, 5]);
  assert.equal(etapaAnteriorLiberada(liberacao, 5), 2);
  assert.equal(etapaAnteriorLiberada(liberacao, 2), 1);
  assert.equal(etapaAnteriorLiberada(liberacao, 1), null);
  assert.equal(etapaAnteriorLiberada({ etapas: { 1: true, 5: true } }, 5), 1);
});

test("comparação de posições usa só as duas listas recebidas", () => {
  const atual = [linha(1), { ...linha(2), ciclista: "Atleta 03" }];
  const anterior = [{ ...linha(1), ciclista: "Atleta 03" }, linha(2)];
  const diff = compararTops(atual, anterior);
  assert.equal(diff[0].delta, null);
  assert.equal(diff[1].posAnterior, 1);
  assert.equal(diff[1].delta, -1);
});

test("rota estável e chip de percurso", () => {
  assert.deepEqual(lerRota("#/giro/2026/etapa/3"), { ok: true, slug: "giro", ano: 2026, etapa: 3 });
  assert.equal(lerRota("#/giro/2026").etapa, null);
  assert.equal(estadoChip({ km: 10, perfil: { pontos: [] } }, false), "percurso_ok");
  assert.equal(estadoChip({ km: null, origem: null, destino: null, perfil: { pontos: [] } }, false), "bloqueada");
  assert.equal(estadoChip({ km: null, perfil: { pontos: [] } }, true), "assistida");
  const etapas = [
    { n: 1, tipo: "plana", perfil: { pontos: [] } },
    { n: 2, tipo: "montanha", perfil: { pontos: [{ xKm: 0, elevM: 1 }, { xKm: 1, elevM: 2 }] } }
  ];
  assert.equal(filtrarEtapas(etapas, { etapas: {} }, { somenteComPerfil: true }).length, 1);
  assert.equal(filtrarEtapas(etapas, { etapas: { 2: true } }, { somenteAssistidas: true })[0].n, 2);
});

test("snapshot sintético inválido e leitura fechada", async () => {
  const ruim = snapshot(3);
  ruim.camisas.pontos.quemVeste = null;
  ruim.camisas.pontos.fonteNaoDistingue = false;
  assert.equal(validarSnapshot(ruim, config).ok, false);
  assert.equal(validarSnapshot(snapshot(3), config).ok, true);
  let chamadas = 0;
  const leitor = async () => {
    chamadas += 1;
    return snapshot(5);
  };
  const bloqueado = await carregarSnapshot({
    prova: config,
    etapa: 5,
    liberacao: { etapas: { 5: true }, provaCompleta: false },
    acesso: { regrasComprovadas: false },
    leitor
  });
  assert.equal(bloqueado.motivo, "regras_nao_comprovadas");
  assert.equal(chamadas, 0);
  assert.deepEqual(podeLerSnapshot({
    liberacao: { etapas: {} },
    etapa: 1,
    acesso: { regrasComprovadas: true }
  }), { ok: false, motivo: "bloqueada" });
});

test("perfil sem pontos não desenha linha", () => {
  assert.equal(pontosValidos([]), false);
  assert.equal(svgPerfil([{ xKm: 0, elevM: 10 }]), "");
  const svg = svgPerfil([{ xKm: 0, elevM: 10 }, { xKm: 5, elevM: 40 }], [{ xKm: null }, { xKm: 2 }]);
  assert.match(svg, /polyline/);
  assert.equal(svg.split("<line").length - 1, 1);
});
