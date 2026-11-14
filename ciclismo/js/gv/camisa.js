/** Ícone reutilizável da camisa de cada classificação. Não é resultado. */

const SILHUETA = "M8 7.1 1.6 11.2l1.1 6 6.3-2.1.3 12.1c3.9 2.2 11.8 2.2 15.7 0l.3-12.1 6.3 2.1 1.1-6L24 7.1l-3.4 2.9c-1.7-1.9-3.5-1.9-5.2 0Z";

export const CORES_CAMISA = {
  giro: {
    gc: { fill: "#F4A6C0", stroke: "#6A2A40", padrao: "lisa" },
    pontos: { fill: "#A0307A", stroke: "#F4E8F0", padrao: "lisa" },
    montanha: { fill: "#5BB8E8", stroke: "#163A52", padrao: "lisa" },
    jovem: { fill: "#FFFFFF", stroke: "#1A1A1A", padrao: "lisa" }
  },
  tour: {
    gc: { fill: "#FFE14A", stroke: "#5C4A00", padrao: "lisa" },
    pontos: { fill: "#1F8F4E", stroke: "#E8F6EC", padrao: "lisa" },
    montanha: { fill: "#FFFFFF", stroke: "#1A1A1A", padrao: "bolinhas-vermelhas", bolinha: "#E10600" },
    jovem: { fill: "#FFFFFF", stroke: "#1A1A1A", padrao: "lisa" }
  },
  vuelta: {
    gc: { fill: "#E10600", stroke: "#FFE8E6", padrao: "lisa" },
    pontos: { fill: "#1F8F4E", stroke: "#E8F6EC", padrao: "lisa" },
    montanha: { fill: "#FFFFFF", stroke: "#1A1A1A", padrao: "bolinhas-azuis", bolinha: "#1E4FBF" },
    jovem: { fill: "#FFFFFF", stroke: "#1A1A1A", padrao: "lisa" }
  }
};

function esc(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function corSegura(valor, fallback) {
  const texto = String(valor || "").trim();
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(texto)) return texto;
  return fallback;
}

function idSeguro(valor, fallback) {
  const texto = String(valor || "").replace(/[^\w-]/g, "");
  return texto || fallback;
}

export function estiloCamisa(slug, camisa = {}) {
  const id = camisa.id || "gc";
  const preset = CORES_CAMISA[slug]?.[id];
  if (preset) return { ...preset };
  return {
    fill: corSegura(camisa.cor, "#888888"),
    stroke: "#1A1A1A",
    padrao: "lisa"
  };
}

function padraoBolinhas(id, fundo, bolinha) {
  return `<defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse">
      <rect width="5" height="5" fill="${fundo}"></rect>
      <circle cx="2.5" cy="2.5" r="1.15" fill="${bolinha}"></circle>
    </pattern></defs>`;
}

/** SVG inline de camiseta de ciclismo, com aria-label e title no nome da camisa. */
export function svgIconeCamisa(slug, camisa = {}) {
  const estilo = estiloCamisa(slug, camisa);
  const rotulo = camisa.rotulo || "Camisa";
  const nome = esc(rotulo);
  const pid = `gv-padrao-${idSeguro(slug, "prova")}-${idSeguro(camisa.id, "camisa")}`;
  const usaPadrao = String(estilo.padrao || "").startsWith("bolinhas");
  const fill = usaPadrao ? `url(#${pid})` : estilo.fill;
  const defs = usaPadrao
    ? padraoBolinhas(pid, estilo.fill, corSegura(estilo.bolinha, "#E10600"))
    : "";
  return `<svg class="gv-icone-camisa" viewBox="0 0 32 32" width="28" height="28" role="img" aria-label="${nome}" focusable="false">
    <title>${nome}</title>
    ${defs}
    <path d="${SILHUETA}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" aria-hidden="true"></path>
    <path d="${SILHUETA}" fill="${fill}" stroke="${estilo.stroke}" stroke-width="1.15" stroke-linejoin="round"></path>
    <path d="M16 13.2 V26" fill="none" stroke="${estilo.stroke}" stroke-width="0.55" opacity="0.4" stroke-linecap="round" aria-hidden="true"></path>
  </svg>`;
}
