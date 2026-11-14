import test from "node:test";
import assert from "node:assert/strict";
import { CORES_CAMISA, estiloCamisa, svgIconeCamisa } from "./camisa.js";

const ESPERADO = {
  giro: {
    gc: { fill: "#F4A6C0", padrao: "lisa" },
    pontos: { fill: "#A0307A", padrao: "lisa" },
    montanha: { fill: "#5BB8E8", padrao: "lisa" },
    jovem: { fill: "#FFFFFF", padrao: "lisa" }
  },
  tour: {
    gc: { fill: "#FFE14A", padrao: "lisa" },
    pontos: { fill: "#1F8F4E", padrao: "lisa" },
    montanha: { fill: "#FFFFFF", padrao: "bolinhas-vermelhas", bolinha: "#E10600" },
    jovem: { fill: "#FFFFFF", padrao: "lisa" }
  },
  vuelta: {
    gc: { fill: "#E10600", padrao: "lisa" },
    pontos: { fill: "#1F8F4E", padrao: "lisa" },
    montanha: { fill: "#FFFFFF", padrao: "bolinhas-azuis", bolinha: "#1E4FBF" },
    jovem: { fill: "#FFFFFF", padrao: "lisa" }
  }
};

const ROTULOS = {
  giro: { gc: "Maglia Rosa", pontos: "Maglia Ciclamino", montanha: "Maglia Azzurra", jovem: "Maglia Bianca" },
  tour: { gc: "Amarela", pontos: "Verde", montanha: "Bolinhas vermelhas", jovem: "Branca" },
  vuelta: { gc: "Vermelha", pontos: "Verde", montanha: "Bolinhas azuis", jovem: "Branca" }
};

test("cada camisa das três provas tem cor e padrão oficiais", () => {
  for (const [slug, camisas] of Object.entries(ESPERADO)) {
    for (const [id, esperado] of Object.entries(camisas)) {
      const estilo = estiloCamisa(slug, { id, rotulo: ROTULOS[slug][id] });
      assert.equal(estilo.fill, esperado.fill, `${slug}/${id} fill`);
      assert.equal(estilo.padrao, esperado.padrao, `${slug}/${id} padrao`);
      if (esperado.bolinha) assert.equal(estilo.bolinha, esperado.bolinha, `${slug}/${id} bolinha`);
    }
  }
  assert.equal(Object.keys(CORES_CAMISA).length, 3);
});

test("o SVG traz silhueta de camisa, title e aria-label escapados", () => {
  const svg = svgIconeCamisa("giro", { id: "gc", rotulo: "Maglia <Rosa>" });
  assert.match(svg, /<svg class="gv-icone-camisa"/);
  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-label="Maglia &lt;Rosa&gt;"/);
  assert.match(svg, /<title>Maglia &lt;Rosa&gt;<\/title>/);
  assert.equal(svg.includes("Maglia <Rosa>"), false);
  assert.match(svg, /#F4A6C0/);
  const bolinhas = svgIconeCamisa("tour", { id: "montanha", rotulo: "Bolinhas vermelhas" });
  assert.match(bolinhas, /<pattern /);
  assert.match(bolinhas, /#E10600/);
  const azuis = svgIconeCamisa("vuelta", { id: "montanha", rotulo: "Bolinhas azuis" });
  assert.match(azuis, /#1E4FBF/);
});
