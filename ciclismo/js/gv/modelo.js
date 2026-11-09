/** Funções puras das Grandes Voltas. Sem DOM, sem Firebase, sem resultados embutidos. */

export const TIPOS = ["plana", "ondulada", "montanha", "crono", "mista", "desconhecido"];

/** Conferidos em ciclismo/data/2026.json. O teste quebra se o calendário divergir. */
export const PROVAS_ETAPAS_CONFIRMADAS = [
  { ano: 2026, provaId: "b7", slug: "giro", nome: "Giro d'Italia", totalEtapas: 21, inicio: "2026-05-08", fim: "2026-05-31" },
  { ano: 2026, provaId: "b10", slug: "tour", nome: "Tour de France", totalEtapas: 21, inicio: "2026-07-04", fim: "2026-07-26" },
  { ano: 2026, provaId: "b12", slug: "vuelta", nome: "Volta à Espanha", totalEtapas: 21, inicio: "2026-08-22", fim: "2026-09-13" }
];

export function chaveProva(ano, provaId) {
  return `${ano}_${provaId}`;
}

export function provaConfirmada(ano, provaId) {
  return PROVAS_ETAPAS_CONFIRMADAS.find(
    (p) => String(p.ano) === String(ano) && p.provaId === provaId
  ) || null;
}

function mapaPlano(valor) {
  return Boolean(valor) && typeof valor === "object" && !Array.isArray(valor);
}

/** Só booleanos true. Lista, texto ou campo ausente não liberam nada. */
export function liberacaoDaProva(liberacoes, ano, provaId) {
  const fechada = { etapas: {}, provaCompleta: false };
  if (!mapaPlano(liberacoes) || !mapaPlano(liberacoes.provas)) return fechada;
  const bruto = liberacoes.provas[chaveProva(ano, provaId)];
  if (!mapaPlano(bruto) || !mapaPlano(bruto.etapas)) return fechada;
  const etapas = {};
  for (const [chave, valor] of Object.entries(bruto.etapas)) {
    if (valor === true && /^[1-9][0-9]?$/.test(chave)) etapas[chave] = true;
  }
  const completa = bruto.provaCompleta === true;
  return { etapas, provaCompleta: completa };
}

export function normalizarAcesso(bruto) {
  if (!mapaPlano(bruto)) return { regrasComprovadas: false };
  return { regrasComprovadas: bruto.regrasComprovadas === true };
}

export function etapaLiberada(liberacao, n) {
  return liberacao?.etapas?.[String(n)] === true;
}

export function numerosLiberados(liberacao) {
  return Object.keys(liberacao?.etapas || {})
    .filter((k) => liberacao.etapas[k] === true)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);
}

/** Maior etapa confirmada estritamente antes de n. Não é n-1. */
export function etapaAnteriorLiberada(liberacao, n) {
  const alvo = Number(n);
  const anteriores = numerosLiberados(liberacao).filter((x) => x < alvo);
  return anteriores.length ? anteriores[anteriores.length - 1] : null;
}

export function temPercurso(etapa) {
  if (!etapa) return false;
  if (typeof etapa.km === "number") return true;
  if (etapa.origem && etapa.destino) return true;
  return Array.isArray(etapa.perfil?.pontos) && etapa.perfil.pontos.length >= 2;
}

export function estadoChip(etapa, liberada) {
  if (liberada) return "assistida";
  if (temPercurso(etapa)) return "percurso_ok";
  return "bloqueada";
}

/** Pódio global só com a última etapa em true e a prova marcada completa. */
export function podioRevelado(liberacao, totalEtapas = 21) {
  return liberacao?.provaCompleta === true && etapaLiberada(liberacao, totalEtapas);
}

export function filtrarEtapas(etapas, liberacao, filtro = {}) {
  return (etapas || []).filter((etapa) => {
    const liberada = etapaLiberada(liberacao, etapa.n);
    if (filtro.somenteAssistidas && !liberada) return false;
    if (filtro.somenteComPerfil && (etapa.perfil?.pontos || []).length < 2) return false;
    if (filtro.tipo && etapa.tipo !== filtro.tipo) return false;
    return true;
  });
}

export function somaKm(etapas) {
  let soma = 0;
  let faltam = 0;
  (etapas || []).forEach((etapa) => {
    if (typeof etapa.km === "number") soma += etapa.km;
    else faltam += 1;
  });
  return {
    soma: Math.round(soma * 10) / 10,
    faltam,
    completa: faltam === 0 && (etapas || []).length > 0
  };
}

export function lerRota(hash) {
  const texto = String(hash || "").replace(/^#/, "").replace(/^\/+/, "");
  const m = texto.match(/^([a-z0-9]+)\/(\d{4})(?:\/etapa\/(\d{1,2}))?$/);
  if (!m) return { ok: false, slug: null, ano: null, etapa: null };
  const etapa = m[3] ? Number(m[3]) : null;
  return { ok: true, slug: m[1], ano: Number(m[2]), etapa };
}

export function hrefHub(slug, ano) {
  return `grande-volta.html#/${slug}/${ano}`;
}

export function hrefEtapa(slug, ano, n) {
  return `grande-volta.html#/${slug}/${ano}/etapa/${n}`;
}

function listaPosicoes(lista, limite) {
  if (!Array.isArray(lista)) return { ok: false, erro: "lista ausente" };
  if (lista.length < 1 || lista.length > limite) return { ok: false, erro: "tamanho" };
  const vistos = new Set();
  for (const item of lista) {
    if (!item || typeof item.pos !== "number" || typeof item.ciclista !== "string" || !item.ciclista.trim()) {
      return { ok: false, erro: "item" };
    }
    if (vistos.has(item.pos)) return { ok: false, erro: "posicao repetida" };
    vistos.add(item.pos);
  }
  return { ok: true, incompleta: lista.length !== limite };
}

/**
 * Valida o formato. Não completa campos em falta.
 * Publicar exige listas cheias (10 e 5) e validacao.ok.
 * Fixture sintética incompleta não passa.
 */
export function validarSnapshot(snap, config) {
  const erros = [];
  const avisos = [];
  if (!snap || typeof snap !== "object") {
    return { ok: false, erros: ["snapshot ausente"], avisos };
  }
  if (snap.sintetico === true) avisos.push("sintetico");
  if (snap.provaId !== config?.provaId) erros.push("provaId");
  if (Number(snap.ano) !== Number(config?.ano)) erros.push("ano");
  if (snap.imutavel !== true) erros.push("imutavel");
  const n = Number(snap.aposEtapa);
  if (!Number.isInteger(n) || n < 1 || n > Number(config?.totalEtapas || 0)) erros.push("aposEtapa");
  const etapa = listaPosicoes(snap.etapa?.top10, 10);
  if (!etapa.ok) erros.push(`etapa.top10:${etapa.erro}`);
  else if (etapa.incompleta) erros.push("etapa.top10:incompleta");
  const gc = listaPosicoes(snap.gc?.top10, 10);
  if (!gc.ok) erros.push(`gc.top10:${gc.erro}`);
  else if (gc.incompleta) erros.push("gc.top10:incompleta");
  const camisas = config?.camisas || [];
  camisas.forEach((camisa) => {
    const bloco = snap.camisas?.[camisa.id];
    if (!bloco) {
      erros.push(`camisa:${camisa.id}`);
      return;
    }
    const top = listaPosicoes(bloco.top5, 5);
    if (!top.ok) erros.push(`camisa:${camisa.id}:top5`);
    else if (top.incompleta) erros.push(`camisa:${camisa.id}:incompleta`);
    const lider = bloco.lider;
    if (lider != null && typeof lider !== "string") erros.push(`camisa:${camisa.id}:lider`);
    if (bloco.quemVeste == null) {
      if (bloco.fonteNaoDistingue !== true) erros.push(`camisa:${camisa.id}:quemVeste`);
    } else if (typeof bloco.quemVeste !== "string") {
      erros.push(`camisa:${camisa.id}:quemVeste`);
    }
  });
  if (snap.equipes != null && typeof snap.equipes !== "object") erros.push("equipes");
  if (snap.validacao?.ok !== true) erros.push("validacao");
  return { ok: erros.length === 0, erros, avisos };
}

export function compararTops(atual, anterior) {
  const mapa = new Map();
  (anterior || []).forEach((item) => {
    if (item && typeof item.ciclista === "string") mapa.set(item.ciclista, item.pos);
  });
  return (atual || []).map((item) => {
    const posAnterior = mapa.has(item.ciclista) ? mapa.get(item.ciclista) : null;
    const delta = posAnterior == null ? null : posAnterior - item.pos;
    return { ...item, posAnterior, delta };
  });
}

export function podeLerSnapshot({ liberacao, etapa, acesso }) {
  if (!etapaLiberada(liberacao, etapa)) return { ok: false, motivo: "bloqueada" };
  if (acesso?.regrasComprovadas !== true) return { ok: false, motivo: "regras_nao_comprovadas" };
  return { ok: true, motivo: "liberada" };
}
