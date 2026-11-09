/** Ilustração decorativa. Não é perfil, mapa nem resultado. */

const FAIXAS = {
  giro: ["#008C45", "#f4f1e6", "#CD212A"],
  tour: ["#0055A4", "#f4f1e6", "#EF4135"],
  vuelta: ["#C60B1E", "#F7C948", "#C60B1E"]
};

const QUADROS = {
  giro: "#f4a4c4",
  tour: "#ffe14a",
  vuelta: "#ff5a52"
};

function roda(cx, cy, quadro) {
  const r = 34;
  const raios = [0, 45, 90, 135].map((grau) => {
    const rad = (grau * Math.PI) / 180;
    const x2 = cx + Math.cos(rad) * (r - 4);
    const y2 = cy + Math.sin(rad) * (r - 4);
    const x3 = cx - Math.cos(rad) * (r - 4);
    const y3 = cy - Math.sin(rad) * (r - 4);
    return `<line x1="${x2.toFixed(1)}" y1="${y2.toFixed(1)}" x2="${x3.toFixed(1)}" y2="${y3.toFixed(1)}"></line>`;
  }).join("");
  return `<g class="gv-roda">${raios}<circle cx="${cx}" cy="${cy}" r="${r}"></circle><circle cx="${cx}" cy="${cy}" r="4.5" fill="${quadro}"></circle></g>`;
}

function bicicleta(quadro) {
  return `<g class="gv-bike" fill="none" stroke="${quadro}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
    ${roda(124, 150, quadro)}
    ${roda(286, 150, quadro)}
    <path d="M124 150 H198 L124 150 M198 150 L198 96 L258 96 L286 122 L198 150 M258 96 L286 122 M286 122 V150"/>
    <path d="M198 96 L186 78 H214"/>
    <path d="M258 96 L292 84 H312 M292 84 L276 98"/>
  </g>`;
}

function montanhas() {
  return `<path class="gv-serra" d="M0 158 L54 96 L96 132 L154 58 L214 128 L268 86 L334 124 L390 72 L440 158 Z"></path>
    <path class="gv-serra gv-serra-frente" d="M0 168 L78 124 L140 150 L210 108 L300 156 L380 118 L440 168 Z"></path>`;
}

function ciprestes() {
  return `<path class="gv-cipreste" d="M46 164 L54 86 L62 164 Z M392 166 L400 98 L408 166 Z"></path>`;
}

function platanos() {
  return `<g class="gv-platano">
    <rect x="54" y="128" width="5" height="40"></rect>
    <circle cx="56" cy="118" r="16"></circle>
    <rect x="384" y="132" width="5" height="36"></rect>
    <circle cx="386" cy="122" r="14"></circle>
  </g>`;
}

function oliveiras() {
  return `<g class="gv-oliveira">
    <rect x="48" y="150" width="4" height="18"></rect>
    <ellipse cx="50" cy="148" rx="18" ry="8"></ellipse>
    <rect x="390" y="152" width="4" height="16"></rect>
    <ellipse cx="392" cy="150" rx="16" ry="7"></ellipse>
  </g>`;
}

export function htmlCena(slug) {
  const faixa = FAIXAS[slug] || FAIXAS.giro;
  const quadro = QUADROS[slug] || QUADROS.giro;
  const extra = slug === "giro" ? ciprestes() : slug === "tour" ? platanos() : slug === "vuelta" ? oliveiras() : "";
  const barras = faixa.map((cor, i) => (
    `<rect x="${i * 146.7}" y="206" width="146.7" height="8" fill="${cor}"></rect>`
  )).join("");
  return `<div class="gv-cena-arte" aria-hidden="true">
    <svg class="gv-cena-svg" viewBox="0 0 440 214" fill="none">
      ${montanhas()}
      ${extra}
      <path class="gv-asfalto" d="M8 176 H432"></path>
      ${bicicleta(quadro)}
      ${barras}
    </svg>
  </div>`;
}
