// Contrato dos gastos privados. Não persiste nada e não conhece o Firebase.
// Valores são inteiros na unidade mínima com 2 casas (centavos). A página só lê
// os campos abaixo; observação, cartão e qualquer outro campo ficam de fora.

export const COLECAO_GASTOS = "viagensPrivadas";
export const SUBCOLECAO_LANCAMENTOS = "lancamentos";
export const VIAGEM_ID = "uruguai-2026-rafael-victoria-samar";
export const PROJETO_FIREBASE = "programas-ia";
export const PROVEDOR_GOOGLE = "google.com";

// Mesmo e-mail de ciclismo/js/firebase-config.js. A página usa o global
// FIREBASE_OWNER_EMAIL; este constante existe para o teste não divergir.
export const EMAIL_PROPRIETARIO = "rafffahell@gmail.com";

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const MOEDA = /^[A-Z]{3}$/;
const LIMITE_LOCAL = 160;
const LIMITE_CATEGORIA = 80;

export function segmentosLancamentos(viagemId = VIAGEM_ID) {
  return [COLECAO_GASTOS, viagemId, SUBCOLECAO_LANCAMENTOS];
}

export function ehProprietario(email, esperado) {
  const conta = String(email || "").trim().toLowerCase();
  const dono = String(esperado || "").trim().toLowerCase();
  return dono.length > 0 && conta === dono;
}

export function sessaoEhGoogle(signInProvider) {
  return signInProvider === PROVEDOR_GOOGLE;
}

export function leituraVeioDoServidor(metadata) {
  return Boolean(metadata) && metadata.fromCache === false;
}

export function falhaDeRede(codigo) {
  return codigo === "unavailable"
    || codigo === "deadline-exceeded"
    || codigo === "offline-cache"
    || codigo === "auth/network-request-failed";
}

export function dataIsoValida(iso) {
  const match = DATA_ISO.exec(iso);
  if (!match) return false;
  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

export function formatarDataIso(iso) {
  const match = DATA_ISO.exec(iso);
  if (!match || !dataIsoValida(iso)) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function textoCurto(valor, limite) {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  if (!limpo || limpo.length > limite) return null;
  return limpo;
}

function centavos(valor) {
  return Number.isSafeInteger(valor) ? valor : null;
}

export function interpretarLancamento(id, bruto) {
  if (typeof id !== "string" || id.length === 0 || id.includes("/")) {
    return { ok: false, motivo: "id" };
  }
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) {
    return { ok: false, motivo: "tipo" };
  }
  if (!dataIsoValida(bruto.data)) return { ok: false, motivo: "data" };
  const local = textoCurto(bruto.local, LIMITE_LOCAL);
  if (!local) return { ok: false, motivo: "local" };
  const categoria = textoCurto(bruto.categoria, LIMITE_CATEGORIA);
  if (!categoria) return { ok: false, motivo: "categoria" };
  if (typeof bruto.moedaOriginal !== "string" || !MOEDA.test(bruto.moedaOriginal)) {
    return { ok: false, motivo: "moeda" };
  }
  const valorOriginalCentavos = centavos(bruto.valorOriginalCentavos);
  if (valorOriginalCentavos === null) return { ok: false, motivo: "valor-original" };
  const valorBrlCentavos = centavos(bruto.valorBrlCentavos);
  if (valorBrlCentavos === null) return { ok: false, motivo: "valor-brl" };
  return {
    ok: true,
    lancamento: Object.freeze({
      id,
      data: bruto.data,
      local,
      categoria,
      moedaOriginal: bruto.moedaOriginal,
      valorOriginalCentavos,
      valorBrlCentavos
    })
  };
}

export function ordenarLancamentos(lista) {
  return [...lista].sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
}

export function interpretarLista(pares) {
  const aceitos = [];
  let ignorados = 0;
  for (const par of pares) {
    const lido = interpretarLancamento(par[0], par[1]);
    if (!lido.ok) ignorados += 1;
    else aceitos.push(lido.lancamento);
  }
  return { aceitos: ordenarLancamentos(aceitos), ignorados };
}

export function somarBrlCentavos(lista) {
  let total = 0;
  for (const item of lista) {
    if (!Number.isSafeInteger(item.valorBrlCentavos)) {
      throw new TypeError("valor-brl");
    }
    total += item.valorBrlCentavos;
    if (!Number.isSafeInteger(total)) {
      throw new RangeError("soma");
    }
  }
  return total;
}

function simboloMoeda(moeda) {
  try {
    const partes = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: moeda,
      currencyDisplay: "symbol"
    }).formatToParts(0);
    return partes.find((parte) => parte.type === "currency")?.value || moeda;
  } catch {
    return moeda;
  }
}

export function formatarCentavos(centavosValor, moeda) {
  if (!Number.isSafeInteger(centavosValor)) {
    throw new TypeError("centavos");
  }
  if (typeof moeda !== "string" || !MOEDA.test(moeda)) {
    throw new TypeError("moeda");
  }
  const negativo = centavosValor < 0;
  const absoluto = Math.abs(centavosValor);
  const inteiro = Math.trunc(absoluto / 100);
  const fracao = String(absoluto % 100).padStart(2, "0");
  const corpo = `${new Intl.NumberFormat("pt-BR").format(inteiro)},${fracao}`;
  return `${negativo ? "-" : ""}${simboloMoeda(moeda)}\u00a0${corpo}`;
}
