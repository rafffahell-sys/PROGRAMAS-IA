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

const LIMITE_RESUMO = { texto: 1200, momento: 200, momentos: 5, contexto: 500 };

function textoLimpo(valor, max) {
  if (typeof valor !== "string") return false;
  const texto = valor.trim();
  if (!texto || texto.length > max) return false;
  return !/[<>]/.test(texto);
}

function mencionaEtapaFutura(texto, etapa) {
  const achados = String(texto || "").matchAll(/\betapas?\s+(\d{1,2})\b/gi);
  for (const item of achados) {
    if (Number(item[1]) > etapa) return true;
  }
  return false;
}

/** Resumo factual só da etapa N. Não completa lacuna com texto inventado. */
export function validarResumo(resumo, snap) {
  const erros = [];
  const n = Number(snap?.aposEtapa);
  if (!resumo || typeof resumo !== "object" || Array.isArray(resumo)) {
    return ["resumo"];
  }
  if (resumo.provaId !== snap.provaId) erros.push("resumo:provaId");
  if (Number(resumo.ano) !== Number(snap.ano)) erros.push("resumo:ano");
  if (Number(resumo.ateEtapa) !== n) erros.push("resumo:ateEtapa");
  if (resumo.ausente === true) {
    if (resumo.texto != null || (resumo.momentos || []).length || resumo.contextoClassificatorio) {
      erros.push("resumo:ausente_com_texto");
    }
    return erros;
  }
  if (resumo.ausente !== false) erros.push("resumo:ausente");
  if (!textoLimpo(resumo.texto, LIMITE_RESUMO.texto) || resumo.texto.trim().length < 40) erros.push("resumo:texto");
  if (!Array.isArray(resumo.momentos) || resumo.momentos.length > LIMITE_RESUMO.momentos) erros.push("resumo:momentos");
  else if (resumo.momentos.some((item) => !textoLimpo(item, LIMITE_RESUMO.momento))) erros.push("resumo:momentos");
  if (resumo.contextoClassificatorio != null && !textoLimpo(resumo.contextoClassificatorio, LIMITE_RESUMO.contexto)) {
    erros.push("resumo:contexto");
  }
  const fonte = resumo.fonte;
  if (!fonte || typeof fonte !== "object" || !textoLimpo(fonte.nome, 120)) erros.push("resumo:fonte");
  const bloco = [resumo.texto, ...(resumo.momentos || []), resumo.contextoClassificatorio].filter(Boolean).join(" ");
  if (mencionaEtapaFutura(bloco, n)) erros.push("resumo:etapa_futura");
  return erros;
}

export function validarPontuacao(pontuacao, config) {
  const confirmada = config?.regulamento?.oficialConfirmado === true;
  if (!pontuacao || typeof pontuacao !== "object" || Array.isArray(pontuacao)) return ["pontuacao"];
  const erros = [];
  if (pontuacao.modo !== "copia_oficial") erros.push("pontuacao:modo");
  if (pontuacao.recalculada !== false) erros.push("pontuacao:recalculada");
  if (pontuacao.regrasDaEdicaoConfirmadas !== confirmada) erros.push("pontuacao:regras");
  return erros;
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
  erros.push(...validarResumo(snap.resumo, snap));
  erros.push(...validarPontuacao(snap.pontuacao, config));
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

/** Pré-etapa de N só com a etapa N-1 da mesma prova e do mesmo ano confirmada. */
export function podeLerAnalisePre({ liberacao, etapa, acesso }) {
  const n = Number(etapa);
  if (!Number.isInteger(n) || n < 1) return { ok: false, motivo: "etapa_invalida" };
  if (n === 1) return { ok: false, motivo: "introducao_neutra" };
  if (!etapaLiberada(liberacao, n - 1)) return { ok: false, motivo: "anterior_imediata_bloqueada" };
  if (acesso?.regrasComprovadas !== true) return { ok: false, motivo: "regras_nao_comprovadas" };
  return { ok: true, motivo: "liberada" };
}

const CHAVES_PROIBIDAS_ANALISE = ["top10", "top5", "ciclista", "gap", "lider", "quemVeste", "gc", "camisas", "classificacao"];

export function validarAnalisePre(analise, config) {
  const erros = [];
  if (!analise || typeof analise !== "object" || Array.isArray(analise)) return ["analise"];
  const n = Number(analise.etapa);
  if (!Number.isInteger(n) || n < 2 || n > Number(config?.totalEtapas || 0)) erros.push("analise:etapa");
  if (analise.provaId !== config?.provaId) erros.push("analise:provaId");
  if (Number(analise.ano) !== Number(config?.ano)) erros.push("analise:ano");
  if (Number(analise.contextoAteEtapa) !== n - 1) erros.push("analise:contexto");
  for (const chave of CHAVES_PROIBIDAS_ANALISE) {
    if (Object.prototype.hasOwnProperty.call(analise, chave)) erros.push(`analise:${chave}`);
  }
  if (analise.ausente === true) {
    if (analise.texto != null) erros.push("analise:ausente_com_texto");
    return erros;
  }
  if (analise.ausente !== false) erros.push("analise:ausente");
  if (!textoLimpo(analise.texto, 1200) || analise.texto.trim().length < 40) erros.push("analise:texto");
  if (!analise.fonte || !textoLimpo(analise.fonte.nome, 120)) erros.push("analise:fonte");
  if (mencionaEtapaFutura(analise.texto, n - 1)) erros.push("analise:etapa_propria_ou_futura");
  return erros;
}
