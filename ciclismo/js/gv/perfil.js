/** Gráfico só com pontos numéricos de percurso. Sem pontos, não desenha linha. */

export function pontosValidos(pontos) {
  if (!Array.isArray(pontos) || pontos.length < 2) return false;
  return pontos.every((p) => p && Number.isFinite(Number(p.xKm)) && Number.isFinite(Number(p.elevM)));
}

export function svgPerfil(pontos, marcadores = []) {
  if (!pontosValidos(pontos)) return "";
  const serie = pontos.map((p) => ({ x: Number(p.xKm), y: Number(p.elevM) }));
  const minX = Math.min(...serie.map((p) => p.x));
  const maxX = Math.max(...serie.map((p) => p.x));
  const minY = Math.min(...serie.map((p) => p.y));
  const maxY = Math.max(...serie.map((p) => p.y));
  const largura = 640;
  const altura = 180;
  const margem = { e: 16, d: 16, c: 16, b: 22 };
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const px = (x) => margem.e + ((x - minX) / spanX) * (largura - margem.e - margem.d);
  const py = (y) => margem.c + (1 - (y - minY) / spanY) * (altura - margem.c - margem.b);
  const linha = serie.map((p) => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(" ");
  const base = altura - margem.b;
  const area = `${margem.e},${base} ${linha} ${(largura - margem.d).toFixed(1)},${base}`;
  const marcas = (marcadores || [])
    .filter((m) => m && m.xKm != null && Number.isFinite(Number(m.xKm)) && Number(m.xKm) >= minX && Number(m.xKm) <= maxX)
    .map((m) => {
      const x = px(Number(m.xKm)).toFixed(1);
      return `<line x1="${x}" y1="${margem.c}" x2="${x}" y2="${base}" stroke="currentColor" stroke-opacity="0.35" stroke-dasharray="3 3"></line>`;
    })
    .join("");
  return `<svg class="gv-perfil-svg" viewBox="0 0 ${largura} ${altura}" role="img" aria-label="Perfil altimétrico do percurso">
    <polygon points="${area}" fill="currentColor" opacity="0.16"></polygon>
    ${marcas}
    <polyline points="${linha}" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"></polyline>
  </svg>`;
}
