import test from "node:test";
import assert from "node:assert/strict";
import {
  compararTops,
  etapaAnteriorLiberada,
  estadoChip,
  filtrarEtapas,
  lerRota,
  liberacaoDaProva,
  normalizarAcesso,
  numerosLiberados,
  podioRevelado,
  podeLerSnapshot,
  validarSnapshot
} from "./modelo.js";
import { carregarSnapshot } from "./snapshots.js";
import { carregarAnalisePre } from "./analises.js";
import {
  podeLerAnalisePre,
  validarAnalisePre,
  parseKm,
  referenciasDistancia,
  situarPonto,
  situarRestante,
  totalDoPonto
} from "./modelo.js";
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
    pontuacao: { modo: "copia_oficial", recalculada: false, regrasDaEdicaoConfirmadas: false },
    resumo: {
      provaId: "b7",
      ano: 2026,
      ateEtapa: etapa,
      ausente: false,
      texto: "Relato sintético desta etapa de teste, sem ligação com uma corrida disputada.",
      momentos: ["Um lance sintético no fim da etapa."],
      contextoClassificatorio: "Contexto sintético só até esta etapa.",
      fonte: { nome: "fixture sintetica", url: null, coletadoEm: "2026-11-09" }
    },
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
    { n: 2, tipo: "montanha", perfil: { pontos: [{ xKm: 0, elevM: 1 }, { xKm: 1, elevM: 2 }] } },
    { n: 3, tipo: "plana", perfil: { pontos: [], imagem: { arquivo: "img/perfis/giro-2026/etapa-03.jpg" } } }
  ];
  const comPerfil = filtrarEtapas(etapas, { etapas: {} }, { somenteComPerfil: true });
  assert.deepEqual(comPerfil.map((etapa) => etapa.n), [2, 3]);
  assert.equal(filtrarEtapas(etapas, { etapas: { 2: true } }, { somenteAssistidas: true })[0].n, 2);
});

test("liberação ausente ou malformada não abre etapa nem pódio", () => {
  assert.deepEqual(liberacaoDaProva(null, 2026, "b7"), { etapas: {}, provaCompleta: false });
  assert.deepEqual(liberacaoDaProva({ provas: [] }, 2026, "b7").etapas, {});
  const lista = liberacaoDaProva({
    provas: { "2026_b7": { etapas: [true, true], provaCompleta: true } }
  }, 2026, "b7");
  assert.deepEqual(lista, { etapas: {}, provaCompleta: false });
  const texto = liberacaoDaProva({
    provas: { "2026_b7": { etapas: { 1: "true", 5: 1, 9: true }, provaCompleta: true } }
  }, 2026, "b7");
  assert.deepEqual(numerosLiberados(texto), [9]);
  assert.equal(podioRevelado(texto, 21), false);
  const completa = liberacaoDaProva({
    provas: { "2026_b7": { etapas: { 21: true }, provaCompleta: true } }
  }, 2026, "b7");
  assert.equal(podioRevelado(completa, 21), true);
  assert.equal(normalizarAcesso(null).regrasComprovadas, false);
  assert.equal(normalizarAcesso({ regrasComprovadas: "true" }).regrasComprovadas, false);
  assert.equal(normalizarAcesso({ regrasComprovadas: false }).regrasComprovadas, false);
});

test("snapshot sintético inválido e leitura fechada", async () => {
  const ruim = snapshot(3);
  ruim.camisas.pontos.quemVeste = null;
  ruim.camisas.pontos.fonteNaoDistingue = false;
  assert.equal(validarSnapshot(ruim, config).ok, false);
  assert.equal(validarSnapshot(snapshot(3), config).ok, true);
  const futuro = snapshot(3);
  futuro.resumo.texto = "Relato sintético que cita a etapa 4, fora do limite desta coleta de teste.";
  assert.equal(validarSnapshot(futuro, config).ok, false);
  const html = snapshot(3);
  html.resumo.texto = "Relato sintético com marca <b>indevida</b> que o validador deve recusar agora.";
  assert.equal(validarSnapshot(html, config).ok, false);
  const vazio = snapshot(3);
  vazio.resumo = { provaId: "b7", ano: 2026, ateEtapa: 3, ausente: true, texto: null, momentos: [], contextoClassificatorio: null, fonte: null };
  assert.equal(validarSnapshot(vazio, config).ok, true);
  const tour = { ...config, provaId: "b10", regulamento: { oficialConfirmado: false } };
  const inventado = snapshot(3);
  inventado.provaId = "b10";
  inventado.resumo.provaId = "b10";
  inventado.pontuacao = { modo: "copia_oficial", recalculada: false, regrasDaEdicaoConfirmadas: true };
  assert.equal(validarSnapshot(inventado, tour).ok, false);
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

test("análise pré-etapa exige a etapa imediatamente anterior da mesma prova", async () => {
  const liberadas = liberacaoDaProva({
    provas: { "2026_b7": { etapas: { 1: true, 5: true }, provaCompleta: false } }
  }, 2026, "b7");
  const aberto = { regrasComprovadas: true };
  const fechado = { regrasComprovadas: false };
  assert.equal(podeLerAnalisePre({ liberacao: liberadas, etapa: 1, acesso: aberto }).motivo, "introducao_neutra");
  assert.equal(podeLerAnalisePre({ liberacao: liberadas, etapa: 2, acesso: aberto }).ok, true);
  assert.equal(podeLerAnalisePre({ liberacao: liberadas, etapa: 2, acesso: fechado }).motivo, "regras_nao_comprovadas");
  assert.equal(podeLerAnalisePre({ liberacao: liberadas, etapa: 3, acesso: aberto }).motivo, "anterior_imediata_bloqueada");
  assert.equal(podeLerAnalisePre({ liberacao: liberadas, etapa: 5, acesso: aberto }).motivo, "anterior_imediata_bloqueada");
  assert.equal(podeLerAnalisePre({ liberacao: liberadas, etapa: 6, acesso: aberto }).ok, true);
  const outroAno = liberacaoDaProva({
    provas: { "2026_b7": { etapas: { 1: true }, provaCompleta: false } }
  }, 2027, "b7");
  assert.equal(podeLerAnalisePre({ liberacao: outroAno, etapa: 2, acesso: aberto }).ok, false);
  let chamadas = 0;
  const leitor = async () => { chamadas += 1; return null; };
  const bloqueada = await carregarAnalisePre({
    prova: config, etapa: 5, liberacao: liberadas, acesso: aberto, leitor
  });
  assert.equal(bloqueada.motivo, "anterior_imediata_bloqueada");
  assert.equal(chamadas, 0);
  const texto = "Relato sintético só com o que já foi confirmado até a etapa anterior, sem a etapa nova.";
  assert.equal(validarAnalisePre({
    provaId: "b7", ano: 2026, etapa: 5, contextoAteEtapa: 4, ausente: false,
    texto, fonte: { nome: "fixture sintetica" }
  }, config).length, 0);
  assert.ok(validarAnalisePre({
    provaId: "b7", ano: 2026, etapa: 5, contextoAteEtapa: 4, ausente: false,
    texto: "Relato sintético que antecipa a etapa 5 e portanto não pode ser análise prévia.",
    fonte: { nome: "fixture sintetica" }
  }, config).includes("analise:etapa_propria_ou_futura"));
});

test("perfil sem pontos não desenha linha", () => {
  assert.equal(pontosValidos([]), false);
  assert.equal(svgPerfil([{ xKm: 0, elevM: 10 }]), "");
  const svg = svgPerfil([{ xKm: 0, elevM: 10 }, { xKm: 5, elevM: 40 }], [{ xKm: null }, { xKm: 2 }]);
  assert.match(svg, /polyline/);
  assert.equal(svg.split("<line").length - 1, 1);
});

test("quilómetro restante da TV converte só dentro do total da mesma fonte", () => {
  assert.equal(parseKm("128,7"), 128.7);
  assert.equal(parseKm("128.7"), 128.7);
  assert.equal(parseKm(""), null);
  assert.equal(parseKm("128,7 km"), null);
  assert.equal(parseKm("-1"), null);

  const giro = situarRestante(147, "128,7");
  assert.equal(giro.ok, true);
  assert.equal(giro.restante, 128.7);
  assert.equal(giro.percorrido, 18.3);
  assert.equal(giro.chegada, false);

  const chegada = situarRestante(147, "0");
  assert.equal(chegada.chegada, true);
  assert.equal(chegada.percorrido, 147);

  const largada = situarRestante(19.6, "19,6");
  assert.equal(largada.percorrido, 0);
  assert.equal(situarRestante(9.4, "0,1").percorrido, 9.3);

  assert.equal(situarRestante(147, "").motivo, "invalido");
  assert.equal(situarRestante(147, "200").motivo, "fora");
  assert.equal(situarRestante(null, "10").motivo, "sem_distancia");

  const card = situarRestante(244, "100");
  const eixo = situarRestante(245, "100");
  assert.equal(card.percorrido, 144);
  assert.equal(eixo.percorrido, 145);
  assert.notEqual(card.percorrido, eixo.percorrido);
});

test("ponto sem km de fonte não ganha distância e divergência não se mistura", () => {
  const unica = { km: 147, perfil: { imagem: { kmNaFicha: 147 } } };
  assert.equal(referenciasDistancia(unica).length, 1);
  assert.equal(situarPonto(null, 147).motivo, "ausente");
  assert.equal(situarPonto(18.3, 147).restante, 128.7);
  assert.equal(totalDoPonto(unica, { xKm: 18.3 }).id, "card");

  const divergente = { km: 244, perfil: { imagem: { kmNoEixo: 245, kmNaFicha: 245, kmNaPagina: 245 } } };
  assert.deepEqual(referenciasDistancia(divergente).map((ref) => ref.km), [244, 245]);
  assert.equal(totalDoPonto(divergente, { xKm: 10 }), null);
  assert.equal(totalDoPonto(divergente, { xKm: 10, referencia: "eixo" }).km, 245);
  assert.equal(situarPonto(10, 245).restante, 235);

  const tour8 = { km: 182, perfil: { imagem: { kmNaPagina: 182, kmNoEixo: 180.4 } } };
  assert.deepEqual(referenciasDistancia(tour8).map((ref) => [ref.id, ref.km]), [["card", 182], ["eixo", 180.4]]);
  const noEixo = situarRestante(180.4, "10");
  assert.equal(noEixo.ok, true);
  assert.equal(noEixo.percorrido, 170.4);
  assert.equal(situarRestante(180.4, "181").motivo, "fora");
  assert.equal(situarRestante(182, "181").ok, true);
});
