// Bandeiras em SVG (não dependem da fonte de emoji do celular).

function svg(miolo) {
  return `<svg class="bandeira" viewBox="0 0 22 16" aria-hidden="true">${miolo}</svg>`;
}

function faixas(cores, vertical) {
  const n = cores.length;
  if (vertical) {
    const w = 22 / n;
    return cores.map((cor, i) => `<rect x="${i * w}" y="0" width="${w + 0.2}" height="16" fill="${cor}"/>`).join("");
  }
  const h = 16 / n;
  return cores.map((cor, i) => `<rect x="0" y="${i * h}" width="22" height="${h + 0.2}" fill="${cor}"/>`).join("");
}

const ESPECIAIS = {
  PT: () => `<rect width="8.8" height="16" fill="#006600"/><rect x="8.8" width="13.2" height="16" fill="#ff0000"/><circle cx="8.8" cy="8" r="2.6" fill="#ffcc00"/>`,
  CH: () => `<rect width="22" height="16" fill="#d52b1e"/><rect x="9.2" y="3" width="3.6" height="10" fill="#fff"/><rect x="6" y="6.2" width="10" height="3.6" fill="#fff"/>`,
  DK: () => `<rect width="22" height="16" fill="#c60c30"/><rect x="6" y="0" width="2.4" height="16" fill="#fff"/><rect x="0" y="6.8" width="22" height="2.4" fill="#fff"/>`,
  NO: () => `<rect width="22" height="16" fill="#ba0c2f"/><rect x="6" y="0" width="4" height="16" fill="#fff"/><rect x="0" y="6" width="22" height="4" fill="#fff"/><rect x="7" y="0" width="2" height="16" fill="#00205b"/><rect x="0" y="7" width="22" height="2" fill="#00205b"/>`,
  GB: () => `<rect width="22" height="16" fill="#012169"/><path d="M0 0 L22 16 M22 0 L0 16" stroke="#fff" stroke-width="2.4"/><path d="M0 0 L22 16 M22 0 L0 16" stroke="#c8102e" stroke-width="1.1"/><path d="M11 0 V16 M0 8 H22" stroke="#fff" stroke-width="4"/><path d="M11 0 V16 M0 8 H22" stroke="#c8102e" stroke-width="2.2"/>`,
  AU: () => `<rect width="22" height="16" fill="#012169"/><path d="M0 0 L11 8 M11 0 L0 8" stroke="#fff" stroke-width="1.6"/><path d="M0 0 L11 8 M11 0 L0 8" stroke="#c8102e" stroke-width="0.7"/><path d="M5.5 0 V8 M0 4 H11" stroke="#fff" stroke-width="2.4"/><path d="M5.5 0 V8 M0 4 H11" stroke="#c8102e" stroke-width="1.2"/><polygon points="16,10 16.5,11.4 18,11.4 16.8,12.3 17.2,13.7 16,12.8 14.8,13.7 15.2,12.3 14,11.4 15.5,11.4" fill="#fff"/>`,
  CA: () => `${faixas(["#ff0000", "#fff", "#ff0000"], true)}<path d="M11 3.2 L11.7 5.4 H13.8 L12.1 6.6 L12.8 8.8 L11 7.6 L9.2 8.8 L9.9 6.6 L8.2 5.4 H10.3 Z" fill="#ff0000"/>`,
  CN: () => `<rect width="22" height="16" fill="#de2910"/><polygon points="4.2,2.2 4.8,4 6.7,4 5.2,5.1 5.8,6.9 4.2,5.8 2.6,6.9 3.2,5.1 1.7,4 3.6,4" fill="#ffde00"/>`,
  TR: () => `<rect width="22" height="16" fill="#e30a17"/><circle cx="9" cy="8" r="3.3" fill="#fff"/><circle cx="10" cy="8" r="2.6" fill="#e30a17"/><polygon points="13,8 12.2,8.3 12.4,7.5 11.7,7.1 12.6,7 12.8,6.2 13.2,7 14.1,7.1 13.4,7.6 13.7,8.4" fill="#fff"/>`,
  AE: () => `<rect width="22" height="16" fill="#00732f"/><rect y="5.3" width="22" height="5.4" fill="#fff"/><rect y="10.7" width="22" height="5.3" fill="#000"/><rect width="6" height="16" fill="#ff0000"/>`,
  SA: () => `<rect width="22" height="16" fill="#006c35"/><rect x="4" y="7" width="14" height="1.4" fill="#fff"/>`,
  MY: () => `<rect width="22" height="16" fill="#cc0001"/>${[1, 3, 5, 7, 9, 11, 13].map((i) => `<rect y="${i * (16 / 14)}" width="22" height="${16 / 14}" fill="#fff"/>`).join("")}<rect width="11" height="8.2" fill="#010066"/><circle cx="4.6" cy="4" r="1.6" fill="#fc0"/>`,
  CZ: () => `${faixas(["#fff", "#d7141a"])}<polygon points="0,0 11,8 0,16" fill="#11457e"/>`,
  AD: () => faixas(["#0018a8", "#fedf00", "#d0103a"], true) + `<rect x="9.4" y="5" width="3.2" height="5" fill="#c6a664"/>`,
  MC: () => faixas(["#ce1126", "#fff"])
};

export function bandeiraSvg(codigo) {
  const id = String(codigo || "").toUpperCase();
  if (ESPECIAIS[id]) return svg(ESPECIAIS[id]());
  const listras = {
    FR: [["#0055a4", "#fff", "#ef4135"], true],
    IT: [["#009246", "#fff", "#ce2b37"], true],
    BE: [["#000", "#fdda24", "#ef3340"], true],
    DE: [["#000", "#dd0000", "#ffce00"], false],
    ES: [["#aa151b", "#f1bf00", "#aa151b"], false],
    NL: [["#ae1c28", "#fff", "#21468b"], false],
    PL: [["#fff", "#dc143c"], false],
    HU: [["#ce2939", "#fff", "#477050"], false],
    AT: [["#ed2939", "#fff", "#ed2939"], false],
    BG: [["#fff", "#00966e", "#d62612"], false],
    SI: [["#fff", "#003da5", "#ed1c24"], false],
    SK: [["#fff", "#0b4ea2", "#ee1c25"], false],
    HR: [["#ff0000", "#fff", "#171796"], false],
    LU: [["#ed2939", "#fff", "#00a1de"], false],
    RU: [["#fff", "#0039a6", "#d52b1e"], false]
  };
  const spec = listras[id];
  if (!spec) return svg(`<rect width="22" height="16" fill="#d9d3c5"/><text x="11" y="11" text-anchor="middle" font-size="7" font-family="sans-serif" fill="#333">${id.slice(0, 2)}</text>`);
  return svg(faixas(spec[0], spec[1]));
}

export function bandeiraEmoji(codigo) {
  const id = String(codigo || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(id)) return "";
  return String.fromCodePoint(...[...id].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}