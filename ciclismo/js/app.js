import { abrirArmazenamento, CANAIS_PADRAO, exportarBackup, importarBackup } from "./storage.js";
import { bandeiraSvg } from "./bandeiras.js";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MES_IDX = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
const ORDEM_CAT = ["Monumento", "Tour", "Clássica", "Nacional", "Mundial", "Personalizado"];
const NOMES_PAISES = [
  "Andorra", "Alemanha", "Arábia Saudita", "Austrália", "Áustria", "Bélgica", "Bulgária",
  "Canadá", "China", "Croácia", "Dinamarca", "Emirados Árabes Unidos", "Eslováquia",
  "Eslovênia", "Espanha", "França", "Holanda", "Hungria", "Itália", "Luxemburgo",
  "Malásia", "Mônaco", "Noruega", "Polônia", "Portugal", "Reino Unido", "Suíça",
  "Tchéquia", "Turquia"
];
const PAISES = {
  andorra: "AD", alemanha: "DE", "arabia saudita": "SA", australia: "AU", austria: "AT",
  belgica: "BE", bulgaria: "BG", canada: "CA", china: "CN", croacia: "HR", dinamarca: "DK",
  emirados: "AE", "emirados arabes unidos": "AE", eslovaquia: "SK", eslovenia: "SI",
  espanha: "ES", franca: "FR", holanda: "NL", "paises baixos": "NL", hungria: "HU",
  italia: "IT", luxemburgo: "LU", malasia: "MY", monaco: "MC", noruega: "NO",
  polonia: "PL", portugal: "PT", "reino unido": "GB", suica: "CH", tchequia: "CZ",
  "republica tcheca": "CZ", "rep. tcheca": "CZ", turquia: "TR"
};
const CLASSE_NOME = {
  "1.UWT": "WorldTour", "2.UWT": "WorldTour", "1.WWT": "Women's WorldTour", "2.WWT": "Women's WorldTour",
  "1.Pro": "ProSeries", "2.Pro": "ProSeries", "1.1": "Classe 1.1", "2.1": "Classe 2.1",
  "1.2": "Classe 1.2", "2.2U": "Sub-23"
};

let loja;
let memoria;
let manifest;
let calendarios = {};
let anoAtivo = "2027";
let eco = false;
let visto = "";
let emailVisto = "";
let podeVisto = true;
let salvoAs = "";
let timer = 0;

function esc(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function norm(valor) {
  return String(valor ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function hojeISO() {
  const d = new Date();
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

function partes(iso) {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  return { y, m, d };
}

function isoData(ano, mes, dia) {
  const z = (n) => String(Number(n)).padStart(2, "0");
  return `${ano}-${z(mes + 1)}-${z(dia)}`;
}

function mesDe(token) {
  const k = norm(token).slice(0, 3);
  return Object.prototype.hasOwnProperty.call(MES_IDX, k) ? MES_IDX[k] : null;
}

export function parseDataAntiga(texto, ano) {
  if (!texto) return null;
  const limpo = String(texto).replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  let m = limpo.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ]{3,})\s*-\s*(\d{1,2})\s+([A-Za-zÀ-ÿ]{3,})$/);
  if (m && mesDe(m[2]) != null && mesDe(m[4]) != null) {
    const mes1 = mesDe(m[2]);
    const mes2 = mesDe(m[4]);
    const y2 = mes2 < mes1 ? Number(ano) + 1 : Number(ano);
    return { inicio: isoData(ano, mes1, m[1]), fim: isoData(y2, mes2, m[3]) };
  }
  m = limpo.match(/^(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-zÀ-ÿ]{3,})$/);
  if (m && mesDe(m[3]) != null) {
    const mes = mesDe(m[3]);
    return { inicio: isoData(ano, mes, m[1]), fim: isoData(ano, mes, m[2]) };
  }
  m = limpo.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ]{3,})$/);
  if (m && mesDe(m[2]) != null) {
    const dia = isoData(ano, mesDe(m[2]), m[1]);
    return { inicio: dia, fim: dia };
  }
  m = limpo.match(/^([A-Za-zÀ-ÿ]{3,})$/);
  if (m && mesDe(m[1]) != null) {
    const dia = isoData(ano, mesDe(m[1]), 1);
    return { inicio: dia, fim: dia };
  }
  return null;
}

export function formatarIntervalo(inicio, fim, semData) {
  if (semData || !inicio || String(inicio).startsWith("9999")) return "sem data";
  const a = partes(inicio);
  const b = partes(fim || inicio);
  if (!a.m || !b.m) return "sem data";
  if (inicio === (fim || inicio)) return `${a.d} ${MESES[a.m - 1]}`;
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MESES[a.m - 1]}`;
  if (a.y === b.y) return `${a.d} ${MESES[a.m - 1]} – ${b.d} ${MESES[b.m - 1]}`;
  return `${a.d} ${MESES[a.m - 1]} ${a.y} – ${b.d} ${MESES[b.m - 1]} ${b.y}`;
}

function limparPais(texto) {
  return String(texto || "").replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "").replace(/\s+/g, " ").trim();
}

export function codigoDoPais(texto) {
  const chave = norm(limparPais(texto));
  return PAISES[chave] || "";
}

function compararProvas(a, b) {
  if (a.inicio !== b.inicio) return a.inicio < b.inicio ? -1 : 1;
  if (a.fim !== b.fim) return a.fim < b.fim ? -1 : 1;
  return a.nome.localeCompare(b.nome, "pt");
}

function normalizarProva(bruta, ano) {
  const anoNum = Number(bruta.ano || ano);
  let inicio = bruta.inicio || "";
  let fim = bruta.fim || "";
  let semData = false;
  if (!inicio && bruta.data) {
    const parsed = parseDataAntiga(bruta.data, anoNum);
    if (parsed) {
      inicio = parsed.inicio;
      fim = parsed.fim;
    }
  }
  if (!inicio) {
    semData = true;
    inicio = "9999-12-31";
    fim = "9999-12-31";
  }
  if (!fim) fim = inicio;
  const pais = limparPais(bruta.pais);
  const codigo = /^[A-Za-z]{2}$/.test(bruta.codigo || "") ? String(bruta.codigo).toUpperCase() : codigoDoPais(pais);
  const bandeiras = Array.isArray(bruta.bandeiras)
    ? bruta.bandeiras.filter((c) => /^[A-Za-z]{2}$/.test(c)).map((c) => c.toUpperCase())
    : null;
  return {
    id: bruta.id,
    nome: bruta.nome || "Prova sem nome",
    inicio,
    fim,
    semData,
    pais,
    codigo,
    bandeiras,
    cat: bruta.cat || "Personalizado",
    gen: bruta.gen || "M",
    etapas: bruta.etapas == null || bruta.etapas === "" ? null : Number(bruta.etapas),
    classe: bruta.classe || "",
    fixo: bruta.fixo !== false,
    aviso: bruta.aviso || "",
    status: bruta.status || "",
    largada: bruta.largada || null,
    ano: String(anoNum)
  };
}

function anosDisponiveis() {
  const set = new Set((manifest?.anos || []).map((a) => String(a.ano)));
  Object.entries(memoria?.personalizados || {}).forEach(([ano, lista]) => {
    if (Array.isArray(lista) && lista.length) set.add(String(ano));
  });
  if (anoAtivo) set.add(String(anoAtivo));
  return [...set].sort();
}

async function carregarAno(ano) {
  if (calendarios[ano]) return calendarios[ano];
  const item = (manifest.anos || []).find((a) => String(a.ano) === String(ano));
  if (!item) {
    calendarios[ano] = {
      ano: Number(ano),
      titulo: String(ano),
      nota: "Ainda não há arquivo de calendário para este ano. Dá para anotar uma prova sua.",
      provas: []
    };
    return calendarios[ano];
  }
  const resposta = await fetch(`data/${item.arquivo}`);
  if (!resposta.ok) throw new Error(item.arquivo);
  const json = await resposta.json();
  json.provas = [...(json.provas || [])].sort(compararProvas);
  calendarios[ano] = json;
  return json;
}

function provasDoAno(ano) {
  const base = (calendarios[ano]?.provas || []).map((p) => normalizarProva(p, ano));
  const extras = (memoria.personalizados?.[ano] || []).map((p) => normalizarProva({ ...p, fixo: false }, ano));
  return [...base, ...extras].sort(compararProvas);
}

function registroDe(ano, id) {
  const r = memoria.registros?.[`${ano}_${id}`] || {};
  return {
    assistida: r.assistida || "",
    canal: r.canal || "",
    p1: r.p1 || "", e1: r.e1 || "",
    p2: r.p2 || "", e2: r.e2 || "",
    p3: r.p3 || "", e3: r.e3 || "",
    nota: r.nota || "",
    estrelas: Number(r.estrelas) || 0
  };
}

function podeEditar() {
  return Boolean(loja && (loja.modo !== "firebase" || loja.podeEscrever));
}

function assinatura(estado) {
  return JSON.stringify({
    registros: estado.registros,
    personalizados: estado.personalizados,
    canais: estado.canais,
    canaisSel: estado.canaisSel,
    anoAtivo: estado.anoAtivo,
    tema: estado.tema
  });
}

function textoConta() {
  if (!loja) return "";
  if (loja.modo === "firebase") {
    if (!loja.email) return "Entre com o Google para gravar na nuvem. Quem visita só lê.";
    if (loja.podeEscrever) return `Nuvem ligada · ${loja.email}`;
    return `Só leitura · ${loja.email}`;
  }
  return "Os registros ficam neste navegador. A nuvem entra quando o Firebase for preenchido.";
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("mostra");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("mostra"), 2400);
}

function agendarSalvar() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    timer = 0;
    persistir();
  }, 200);
}

async function persistir() {
  if (!loja || !memoria) return;
  eco = true;
  try {
    const novo = await loja.salvar({
      registros: memoria.registros,
      personalizados: memoria.personalizados,
      canais: memoria.canais,
      canaisSel: memoria.canaisSel,
      anoAtivo,
      tema: document.body.dataset.tema || "amarela"
    });
    if (novo) memoria = novo;
    visto = assinatura(memoria);
    emailVisto = loja.email || "";
    podeVisto = Boolean(loja.podeEscrever);
    salvoAs = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    renderConta();
  } catch (erro) {
    console.error(erro);
    toast("Não consegui salvar.");
  } finally {
    eco = false;
  }
}

function hash(texto) {
  let n = 2166136261;
  for (const c of String(texto)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}

function perfilSvg(prova) {
  const w = 86;
  const h = 28;
  const passos = prova.cat === "Monumento" ? 13 : prova.cat === "Tour" ? 8 : 6;
  const pts = [];
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const ruido = (hash(`${prova.id}:${i}`) % 100) / 100;
    let y;
    if (prova.cat === "Monumento") y = h * (0.28 + (i % 2) * 0.48);
    else if (prova.cat === "Tour") y = h * (0.78 - Math.sin(t * Math.PI) * (0.42 + ruido * 0.2));
    else y = h * (0.58 + Math.sin(t * Math.PI * (1 + (hash(prova.id) % 3)) + ruido) * 0.2);
    y = Math.max(3, Math.min(h - 2, y));
    pts.push(`${(t * w).toFixed(1)},${y.toFixed(1)}`);
  }
  const linha = pts.join(" ");
  return `<svg class="perfil" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,${h} ${linha} ${w},${h}" fill="currentColor" opacity="0.18"></polygon><polyline points="${linha}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline></svg>`;
}

function htmlBandeiras(codigos) {
  return (codigos || []).filter((c) => /^[A-Z]{2}$/.test(c)).map((c) => bandeiraSvg(c)).join("");
}

function htmlPaises(prova) {
  const codigos = prova.bandeiras?.length ? prova.bandeiras : (prova.codigo ? [prova.codigo] : []);
  return `<span class="paises">${htmlBandeiras(codigos)}<span>${esc(prova.pais || "—")}</span></span>`;
}

function htmlLargada(prova) {
  const l = prova.largada;
  if (!l || (!l.cidade && !l.pais)) return "";
  const bandeira = /^[A-Z]{2}$/.test(l.codigo || "") ? bandeiraSvg(l.codigo) : "";
  const lugar = [l.cidade, l.pais].filter(Boolean).join(", ");
  return `<p class="aviso largada">Largada em ${bandeira} ${esc(lugar)}.</p>`;
}

function classeSelo(cat) {
  return {
    Monumento: "monumento",
    Tour: "tour",
    "Clássica": "classica",
    Mundial: "mundial",
    Nacional: "nacional",
    Personalizado: "personalizado"
  }[cat] || "classica";
}

function textoGen(gen) {
  if (gen === "F") return "Fem";
  if (gen === "A") return "Ambos";
  return "Masc";
}

function textoEtapas(n) {
  if (n == null || Number.isNaN(Number(n))) return "";
  if (Number(n) === 1) return "1 dia";
  return `${n} etapas`;
}

function htmlEstrelas(id, valor, travado) {
  const botoes = [1, 2, 3].map((n) => (
    `<button type="button" class="estrela${n <= valor ? " ativa" : ""}" data-id="${esc(id)}" data-valor="${n}" aria-label="${n} ${n > 1 ? "estrelas" : "estrela"}" aria-pressed="${n <= valor}"${travado}>★</button>`
  )).join("");
  return `<div class="estrelas" role="group" aria-label="Avaliação de ${esc(id)}">${botoes}</div>`;
}

function campoTexto(id, campo, valor, placeholder, travado) {
  return `<input class="mini" data-id="${esc(id)}" data-campo="${campo}" value="${esc(valor)}" placeholder="${placeholder}" maxlength="80" autocomplete="off"${travado}>`;
}

function renderLista() {
  if (!memoria) return;
  const lista = document.getElementById("lista");
  const todas = provasDoAno(anoAtivo);
  const busca = norm(document.getElementById("busca").value.trim());
  const filtroAss = document.getElementById("filtroAssistida").value;
  const filtroCat = document.getElementById("filtroCat").value;
  const filtroGen = document.getElementById("filtroGen").value;
  const filtroEst = document.getElementById("filtroEstrelas").value;
  const hoje = hojeISO();
  const travado = podeEditar() ? "" : " disabled";
  const posicao = new Map(todas.map((p, i) => [p.id, i + 1]));
  const filtradas = todas.filter((prova) => {
    const r = registroDe(anoAtivo, prova.id);
    if (busca) {
      const bloco = norm([prova.nome, prova.pais, prova.classe, r.p1, r.e1, r.p2, r.p3, r.canal].join(" "));
      if (!bloco.includes(busca)) return false;
    }
    if (filtroAss === "SIM" && r.assistida !== "SIM") return false;
    if (filtroAss === "NAO" && r.assistida !== "NAO") return false;
    if (filtroAss === "SEM" && r.assistida) return false;
    if (filtroCat && prova.cat !== filtroCat) return false;
    if (filtroGen && prova.gen !== filtroGen) return false;
    if (filtroEst !== "" && (Number(r.estrelas) || 0) !== Number(filtroEst)) return false;
    return true;
  });

  document.getElementById("contagem").textContent = filtradas.length === todas.length
    ? `${todas.length} provas, da largada à última chegada`
    : `Mostrando ${filtradas.length} de ${todas.length}`;

  if (!filtradas.length) {
    lista.innerHTML = `<p class="vazio">Nenhuma prova com esse filtro.</p>`;
    return;
  }

  let mesAberto = "";
  const html = [];
  filtradas.forEach((prova) => {
    const mes = prova.semData
      ? "Sem data"
      : (String(partes(prova.inicio).y) === String(anoAtivo)
        ? MESES_LONGO[partes(prova.inicio).m - 1]
        : `${MESES_LONGO[partes(prova.inicio).m - 1]} ${partes(prova.inicio).y}`);
    if (mes !== mesAberto) {
      mesAberto = mes;
      html.push(`<h2 class="mes-titulo">${esc(mes)}</h2>`);
    }
    const r = registroDe(anoAtivo, prova.id);
    const agora = !prova.semData && prova.inicio <= hoje && prova.fim >= hoje;
    const passada = !prova.semData && prova.fim < hoje;
    const classes = ["prova"];
    if (r.estrelas === 3) classes.push("tres");
    if (agora) classes.push("agora");
    if (passada) classes.push("passada");
    if (!podeEditar()) classes.push("leitura");
    const status = prova.status === "adiada"
      ? `<span class="selo adiada">Adiada</span>`
      : prova.status === "incerta"
        ? `<span class="selo incerta">Incerta</span>`
        : "";
    const etapas = textoEtapas(prova.etapas);
    const classe = prova.classe && !["WC", "NC", "CC"].includes(prova.classe)
      ? `<span class="pill" title="${esc(CLASSE_NOME[prova.classe] || prova.classe)}">${esc(prova.classe)}</span>`
      : "";
    const genCls = prova.gen === "F" ? "f" : prova.gen === "A" ? "a" : "m";
    const canais = [...(memoria.canais || [])];
    if (r.canal && !canais.includes(r.canal)) canais.unshift(r.canal);
    const aberto = r.p2 || r.e2 || r.p3 || r.e3 || r.nota ? " open" : "";
    const apagar = prova.fixo || !podeEditar()
      ? ""
      : `<button type="button" class="btn perigo apagar" data-apagar="${esc(prova.id)}">Remover</button>`;
    html.push(`
      <article class="${classes.join(" ")}" id="prova-${esc(prova.id)}">
        <div class="lado">
          <span class="indice">${String(posicao.get(prova.id)).padStart(3, "0")}</span>
          <div class="quando">${esc(formatarIntervalo(prova.inicio, prova.fim, prova.semData))}</div>
          ${perfilSvg(prova)}
        </div>
        <div>
          <div class="cabeca">
            <div>
              <h3 class="nome">${esc(prova.nome)}</h3>
              <div class="meta">
                ${htmlPaises(prova)}
                <span class="selo ${classeSelo(prova.cat)}">${esc(prova.cat)}</span>
                ${status}
                <span class="pill gen-${genCls}">${textoGen(prova.gen)}</span>
                ${etapas ? `<span>${esc(etapas)}</span>` : ""}
                ${classe}
              </div>
            </div>
            ${htmlEstrelas(prova.id, r.estrelas, travado)}
          </div>
          ${htmlLargada(prova)}
          ${prova.aviso ? `<p class="aviso">${esc(prova.aviso)}</p>` : ""}
          <div class="registro">
            <label>Assistida
              <select class="mini" data-id="${esc(prova.id)}" data-campo="assistida"${travado}>
                <option value=""${!r.assistida ? " selected" : ""}>—</option>
                <option value="SIM"${r.assistida === "SIM" ? " selected" : ""}>Assistida</option>
                <option value="NAO"${r.assistida === "NAO" ? " selected" : ""}>Não assistida</option>
              </select>
            </label>
            <label>Canal
              <select class="mini" data-id="${esc(prova.id)}" data-campo="canal"${travado}>
                <option value="">Canal</option>
                ${canais.map((c) => `<option value="${esc(c)}"${r.canal === c ? " selected" : ""}>${esc(c)}</option>`).join("")}
              </select>
            </label>
            <label>Vencedor ${campoTexto(prova.id, "p1", r.p1, "Ciclista", travado)}</label>
            <label>Equipe ${campoTexto(prova.id, "e1", r.e1, "Equipe", travado)}</label>
          </div>
          <details class="mais"${aberto}>
            <summary>${r.p1 ? `Pódio · ${esc(r.p1)}` : "Pódio, equipes e notas"}</summary>
            <div class="grade-mais">
              <label>2º lugar ${campoTexto(prova.id, "p2", r.p2, "Ciclista", travado)}</label>
              <label>Equipe ${campoTexto(prova.id, "e2", r.e2, "Equipe", travado)}</label>
              <label>3º lugar ${campoTexto(prova.id, "p3", r.p3, "Ciclista", travado)}</label>
              <label>Equipe ${campoTexto(prova.id, "e3", r.e3, "Equipe", travado)}</label>
              <label class="nota">Notas
                <textarea class="mini" data-id="${esc(prova.id)}" data-campo="nota" maxlength="400" placeholder="O que ficou da transmissão"${travado}>${esc(r.nota)}</textarea>
              </label>
            </div>
            ${apagar}
          </details>
        </div>
      </article>`);
  });
  lista.innerHTML = html.join("");
}

function pintarNumeros() {
  if (!memoria) return;
  const provas = provasDoAno(anoAtivo);
  let sim = 0;
  let nao = 0;
  let mon = 0;
  let tour = 0;
  let tres = 0;
  provas.forEach((prova) => {
    const r = registroDe(anoAtivo, prova.id);
    if (r.assistida === "SIM") {
      sim += 1;
      if (prova.cat === "Monumento") mon += 1;
      if (prova.cat === "Tour") tour += 1;
    }
    if (r.assistida === "NAO") nao += 1;
    if (r.estrelas === 3) tres += 1;
  });
  const pct = provas.length ? Math.round((sim / provas.length) * 100) : 0;
  document.getElementById("n-total").textContent = String(provas.length);
  document.getElementById("n-sim").textContent = String(sim);
  document.getElementById("n-nao").textContent = String(nao);
  document.getElementById("n-pct").textContent = `${pct}%`;
  document.getElementById("n-mon").textContent = String(mon);
  document.getElementById("n-tour").textContent = String(tour);
  document.getElementById("n-estrelas").textContent = String(tres);
  document.getElementById("rotuloAssistidas").textContent = `${sim} de ${provas.length} assistidas`;

  const comData = provas.filter((p) => !p.semData);
  let progresso = 0;
  let rotulo = "Temporada";
  if (comData.length) {
    const ini = comData[0].inicio;
    const fim = comData.reduce((m, p) => (p.fim > m ? p.fim : m), comData[0].fim);
    const hoje = hojeISO();
    if (hoje < ini) {
      progresso = 0;
      rotulo = "Temporada ainda não começou";
    } else if (hoje > fim) {
      progresso = 100;
      rotulo = "Temporada encerrada";
    } else {
      const t0 = Date.parse(ini);
      const t1 = Date.parse(fim);
      const th = Date.parse(hoje);
      progresso = t1 > t0 ? Math.round(((th - t0) / (t1 - t0)) * 100) : 100;
      rotulo = "Temporada em curso";
    }
  }
  document.getElementById("rotuloTemporada").textContent = rotulo;
  document.getElementById("barraTemporada").style.width = `${progresso}%`;
  const trilha = document.getElementById("trilha");
  trilha.setAttribute("aria-valuenow", String(progresso));
  trilha.setAttribute("aria-valuetext", rotulo);
}

function renderAnoTema() {
  const sel = document.getElementById("ano");
  sel.innerHTML = anosDisponiveis().map((ano) => {
    const item = (manifest.anos || []).find((a) => String(a.ano) === ano);
    return `<option value="${esc(ano)}">${esc(item?.rotulo || ano)}</option>`;
  }).join("");
  sel.value = anoAtivo;
  const tema = document.body.dataset.tema || memoria.tema || "amarela";
  document.getElementById("tema").value = ["amarela", "rosa", "roja", "dia"].includes(tema) ? tema : "amarela";
  const cal = calendarios[anoAtivo];
  document.getElementById("subtitulo").textContent = cal?.titulo
    ? `Vencedor, canal e estrelas. ${cal.titulo}.`
    : `Vencedor, canal e estrelas. ${anoAtivo}.`;
  document.getElementById("notaTemporada").textContent = cal?.nota || "";
}

function renderFiltroCat() {
  const sel = document.getElementById("filtroCat");
  const atual = sel.value;
  const cats = new Set(ORDEM_CAT);
  provasDoAno(anoAtivo).forEach((p) => cats.add(p.cat));
  const lista = [...cats].sort((a, b) => {
    const ia = ORDEM_CAT.indexOf(a);
    const ib = ORDEM_CAT.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  sel.innerHTML = `<option value="">Todas as categorias</option>${lista.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}`;
  if ([...sel.options].some((o) => o.value === atual)) sel.value = atual;
}

function renderConta() {
  const entrar = document.getElementById("btnEntrar");
  const sair = document.getElementById("btnSair");
  const firebase = loja?.modo === "firebase";
  entrar.hidden = !firebase || Boolean(loja.email);
  sair.hidden = !firebase || !loja.email;
  document.getElementById("btnEvento").disabled = !podeEditar();
  document.getElementById("btnCanal").disabled = !podeEditar();
  document.getElementById("novoCanal").disabled = !podeEditar();
  const extra = salvoAs ? ` Salvo às ${salvoAs}.` : "";
  document.getElementById("avisoSalvar").textContent = `${textoConta()}${extra}`;
}

function abrirAba(nome) {
  document.querySelectorAll(".aba").forEach((b) => {
    const on = b.dataset.aba === nome;
    b.classList.toggle("ativa", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll(".painel").forEach((p) => {
    p.classList.toggle("ativo", p.id === `painel-${nome}`);
  });
  if (nome === "favoritas") renderFavoritas();
  if (nome === "canais") renderCanais();
  if (nome === "estatisticas") renderEstatisticas();
}

function renderTudo() {
  renderAnoTema();
  renderFiltroCat();
  renderLista();
  pintarNumeros();
  renderConta();
  const aba = document.querySelector(".aba.ativa")?.dataset.aba;
  if (aba === "favoritas") renderFavoritas();
  if (aba === "canais") renderCanais();
  if (aba === "estatisticas") renderEstatisticas();
}

function linhaPodio(medalha, nome, equipe) {
  if (!nome) return "";
  return `<p>${medalha} <strong>${esc(nome)}</strong>${equipe ? ` — ${esc(equipe)}` : ""}</p>`;
}

function renderFavoritas() {
  const box = document.getElementById("favoritas");
  const provas = provasDoAno(anoAtivo);
  const grupos = [
    [3, "As que mais gostei"],
    [2, "Muito boas"],
    [1, "Boas"]
  ];
  const html = grupos.map(([n, titulo]) => {
    const lista = provas.filter((p) => registroDe(anoAtivo, p.id).estrelas === n);
    if (!lista.length) return "";
    const cards = lista.map((prova) => {
      const r = registroDe(anoAtivo, prova.id);
      return `<article class="card-fav">
        <h3 class="nome">${esc(prova.nome)}</h3>
        <p class="aviso">${esc(formatarIntervalo(prova.inicio, prova.fim, prova.semData))} · ${htmlPaises(prova)}</p>
        ${linhaPodio("1º", r.p1, r.e1)}
        ${linhaPodio("2º", r.p2, r.e2)}
        ${linhaPodio("3º", r.p3, r.e3)}
        ${r.nota ? `<p class="aviso">“${esc(r.nota)}”</p>` : ""}
        ${r.canal ? `<p class="aviso">${esc(r.canal)}${r.assistida === "SIM" ? " · assistida" : ""}</p>` : ""}
      </article>`;
    }).join("");
    return `<section class="grupo"><h2 class="grupo-titulo">${"★".repeat(n)} ${esc(titulo)} · ${lista.length}</h2><div class="cards">${cards}</div></section>`;
  }).join("");
  box.innerHTML = html || `<p class="vazio">Nenhuma prova avaliada. As estrelas ficam em cada card do calendário.</p>`;
}

function renderCanaisTags() {
  const box = document.getElementById("listaCanais");
  const pode = podeEditar();
  box.innerHTML = (memoria.canais || []).map((c) => {
    const ligado = (memoria.canaisSel || []).includes(c);
    const padrao = CANAIS_PADRAO.some((p) => p.toLowerCase() === c.toLowerCase());
    const sair = !padrao && pode
      ? `<button type="button" class="canal-tag sair" data-remover-canal="${esc(c)}" aria-label="Remover ${esc(c)}">×</button>`
      : "";
    return `<span class="canal-par"><button type="button" class="canal-tag${ligado ? " ligado" : ""}" data-canal="${esc(c)}" aria-pressed="${ligado}"${pode ? "" : " disabled"}>${esc(c)}</button>${sair}</span>`;
  }).join("");
}

function renderHistorico() {
  const div = document.getElementById("historicoCanais");
  const mapa = new Map();
  provasDoAno(anoAtivo).forEach((prova) => {
    const r = registroDe(anoAtivo, prova.id);
    if (!r.canal) return;
    if (!mapa.has(r.canal)) mapa.set(r.canal, []);
    mapa.get(r.canal).push(prova);
  });
  if (!mapa.size) {
    div.innerHTML = `<p class="vazio">Nenhum canal anotado ainda.</p>`;
    return;
  }
  div.innerHTML = [...mapa.entries()].map(([canal, provas]) => `
    <div>
      <p class="rotulo-caixa">${esc(canal)} · ${provas.length}</p>
      <div class="chips">${provas.map((p) => {
        const r = registroDe(anoAtivo, p.id);
        return `<span class="chip${r.assistida === "SIM" ? " sim" : ""}">${esc(p.nome)}</span>`;
      }).join("")}</div>
    </div>`).join("");
}

function renderCanais() {
  renderCanaisTags();
  renderHistorico();
}

function barra(rotulo, valor, total) {
  const pct = total ? Math.round((valor / total) * 100) : 0;
  return `<div>
    <div class="item-rank"><span>${esc(rotulo)}</span><strong>${valor}${total ? `/${total}` : ""}</strong></div>
    <div class="barra" aria-hidden="true"><span style="width:${pct}%"></span></div>
  </div>`;
}

function caixaRanking(titulo, pares, sufixo) {
  if (!pares.length) {
    return `<article class="caixa"><h3 class="rotulo-caixa">${esc(titulo)}</h3><p class="vazio">Nenhum dado ainda.</p></article>`;
  }
  const itens = pares.slice(0, 5).map(([nome, n], i) => (
    `<div class="item-rank"><span>${i + 1}. ${esc(nome)}</span><strong>${n} ${sufixo}</strong></div>`
  )).join("");
  return `<article class="caixa"><h3 class="rotulo-caixa">${esc(titulo)}</h3>${itens}</article>`;
}

function renderEstatisticas() {
  document.getElementById("tituloEstat").textContent = `Resumo ${anoAtivo}`;
  const provas = provasDoAno(anoAtivo);
  const vencedores = {};
  const equipes = {};
  const canais = {};
  const cats = {};
  const gens = { M: { t: 0, a: 0 }, F: { t: 0, a: 0 }, A: { t: 0, a: 0 } };
  const estrelas = { 1: 0, 2: 0, 3: 0 };
  provas.forEach((prova) => {
    const r = registroDe(anoAtivo, prova.id);
    if (r.p1) vencedores[r.p1] = (vencedores[r.p1] || 0) + 1;
    if (r.e1) equipes[r.e1] = (equipes[r.e1] || 0) + 1;
    if (r.canal && r.assistida === "SIM") canais[r.canal] = (canais[r.canal] || 0) + 1;
    if (!cats[prova.cat]) cats[prova.cat] = { t: 0, a: 0 };
    cats[prova.cat].t += 1;
    if (r.assistida === "SIM") cats[prova.cat].a += 1;
    if (gens[prova.gen]) {
      gens[prova.gen].t += 1;
      if (r.assistida === "SIM") gens[prova.gen].a += 1;
    }
    if (r.estrelas >= 1 && r.estrelas <= 3) estrelas[r.estrelas] += 1;
  });
  const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  const estrelasHtml = [3, 2, 1].map((n) => barra(`${"★".repeat(n)} ${n} ${n > 1 ? "estrelas" : "estrela"}`, estrelas[n], provas.length)).join("");
  const catHtml = Object.entries(cats).map(([cat, v]) => barra(cat, v.a, v.t)).join("")
    || `<p class="vazio">Nenhuma prova.</p>`;
  const genHtml = [
    ["M", "Masculino"],
    ["F", "Feminino"],
    ["A", "Ambos"]
  ].filter(([g]) => gens[g].t).map(([g, rotulo]) => barra(rotulo, gens[g].a, gens[g].t)).join("");
  document.getElementById("estatisticas").innerHTML = [
    caixaRanking("Mais vitórias", top(vencedores), "vit."),
    caixaRanking("Equipes", top(equipes), "vit."),
    caixaRanking("Canais assistidos", top(canais), "provas"),
    `<article class="caixa"><h3 class="rotulo-caixa">Avaliações</h3>${estrelasHtml}</article>`,
    `<article class="caixa"><h3 class="rotulo-caixa">Por categoria</h3>${catHtml}</article>`,
    `<article class="caixa"><h3 class="rotulo-caixa">Por gênero</h3>${genHtml || `<p class="vazio">Nenhuma prova.</p>`}</article>`
  ].join("");
}

function gravarRegistro(id, parcial) {
  const k = `${anoAtivo}_${id}`;
  memoria.registros = { ...memoria.registros, [k]: { ...registroDe(anoAtivo, id), ...parcial } };
  agendarSalvar();
  pintarNumeros();
  const aba = document.querySelector(".aba.ativa")?.dataset.aba;
  if (aba === "favoritas") renderFavoritas();
  if (aba === "estatisticas") renderEstatisticas();
  if (aba === "canais") renderHistorico();
}

function pintarEstrelas(id, valor) {
  document.querySelectorAll(`.estrela[data-id="${CSS.escape(id)}"]`).forEach((btn) => {
    const n = Number(btn.dataset.valor);
    btn.classList.toggle("ativa", n <= valor);
    btn.setAttribute("aria-pressed", n <= valor ? "true" : "false");
  });
  document.getElementById(`prova-${CSS.escape(id)}`)?.classList.toggle("tres", valor === 3);
}

function adicionarEvento(ev) {
  ev.preventDefault();
  if (!podeEditar()) return;
  const nome = document.getElementById("m-nome").value.trim();
  const inicio = document.getElementById("m-inicio").value;
  let fim = document.getElementById("m-fim").value || inicio;
  const pais = limparPais(document.getElementById("m-pais").value);
  const cat = document.getElementById("m-cat").value;
  const gen = document.getElementById("m-gen").value;
  const etapasBruto = document.getElementById("m-etapas").value;
  const etapas = etapasBruto === "" ? null : Math.max(1, Number(etapasBruto) || 1);
  if (!nome) {
    toast("Dê um nome à prova.");
    return;
  }
  if (!inicio) {
    toast("Escolha a data de início.");
    return;
  }
  if (fim < inicio) fim = inicio;
  const lista = [...(memoria.personalizados[anoAtivo] || []), {
    id: `p_${Date.now()}`,
    nome,
    inicio,
    fim,
    pais,
    codigo: codigoDoPais(pais),
    cat,
    gen,
    etapas,
    fixo: false
  }];
  memoria.personalizados = { ...memoria.personalizados, [anoAtivo]: lista };
  fecharModal();
  agendarSalvar();
  renderLista();
  pintarNumeros();
  toast("Prova adicionada.");
}

function excluirEvento(id) {
  if (!podeEditar()) return;
  const prova = provasDoAno(anoAtivo).find((p) => p.id === id);
  if (!prova || prova.fixo) return;
  if (!confirm(`Remover ${prova.nome}?`)) return;
  const lista = (memoria.personalizados[anoAtivo] || []).filter((p) => p.id !== id);
  memoria.personalizados = { ...memoria.personalizados, [anoAtivo]: lista };
  const registros = { ...memoria.registros };
  delete registros[`${anoAtivo}_${id}`];
  memoria.registros = registros;
  agendarSalvar();
  renderLista();
  pintarNumeros();
  toast("Prova removida.");
}

function abrirModal() {
  if (!podeEditar()) {
    toast("Esta conta só pode ler.");
    return;
  }
  document.getElementById("modal").classList.add("aberto");
  document.getElementById("m-nome").focus();
}

function fecharModal() {
  document.getElementById("modal").classList.remove("aberto");
  document.getElementById("form-prova").reset();
}

function adicionarCanal() {
  if (!podeEditar()) return;
  const input = document.getElementById("novoCanal");
  const val = input.value.trim();
  if (!val) return;
  if ((memoria.canais || []).some((c) => c.toLowerCase() === val.toLowerCase())) {
    toast("Esse canal já está na lista.");
    return;
  }
  memoria.canais = [...memoria.canais, val];
  input.value = "";
  agendarSalvar();
  renderCanaisTags();
  renderLista();
  toast("Canal adicionado.");
}

function removerCanal(nome) {
  if (!podeEditar()) return;
  if (CANAIS_PADRAO.some((c) => c.toLowerCase() === nome.toLowerCase())) return;
  memoria.canais = memoria.canais.filter((c) => c !== nome);
  memoria.canaisSel = (memoria.canaisSel || []).filter((c) => c !== nome);
  agendarSalvar();
  renderCanaisTags();
  renderLista();
}

function alternarCanal(nome) {
  if (!podeEditar()) return;
  const sel = memoria.canaisSel || [];
  memoria.canaisSel = sel.includes(nome) ? sel.filter((c) => c !== nome) : [...sel, nome];
  agendarSalvar();
  renderCanaisTags();
}

function exportar() {
  clearTimeout(timer);
  timer = 0;
  persistir().then(() => {
    const blob = new Blob([JSON.stringify(exportarBackup(memoria), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const dia = new Date().toISOString().slice(0, 10);
    a.href = URL.createObjectURL(blob);
    a.download = `ciclismo-backup-${dia}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Backup baixado.");
  });
}

async function importarArquivo(file) {
  let json;
  try {
    json = JSON.parse(await file.text());
  } catch {
    toast("Esse arquivo não é JSON.");
    return;
  }
  if (Object.keys(memoria.registros || {}).length || Object.keys(memoria.personalizados || {}).length) {
    if (!confirm("Substituir os registros deste navegador pelo backup?")) return;
  }
  try {
    const limpo = importarBackup(json);
    eco = true;
    const novo = await loja.salvar(limpo);
    memoria = novo || limpo;
    eco = false;
    visto = assinatura(memoria);
    anoAtivo = String(memoria.anoAtivo || anoAtivo);
    document.body.dataset.tema = memoria.tema || "amarela";
    await carregarAno(anoAtivo);
    renderTudo();
    toast("Backup importado.");
  } catch (erro) {
    eco = false;
    toast(erro.message || "Não consegui ler o backup.");
  }
}

function campoFocado() {
  const el = document.activeElement;
  if (!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return false;
  return Boolean(el.closest("#lista, #modal, #novoCanal"));
}

async function aoMudar() {
  const dados = assinatura(memoria);
  const email = loja.email || "";
  const pode = Boolean(loja.podeEscrever);
  const mudouDados = dados !== visto;
  const mudouConta = email !== emailVisto || pode !== podeVisto;
  if (!mudouDados && !mudouConta) return;
  visto = dados;
  emailVisto = email;
  podeVisto = pode;
  if (!mudouDados) {
    renderConta();
    renderLista();
    return;
  }
  if (memoria.tema) document.body.dataset.tema = memoria.tema;
  const ano = String(memoria.anoAtivo || anoAtivo);
  if (ano !== anoAtivo) {
    anoAtivo = ano;
    await carregarAno(anoAtivo);
  }
  if (campoFocado()) {
    pintarNumeros();
    renderConta();
    return;
  }
  const y = window.scrollY;
  renderTudo();
  window.scrollTo(0, y);
}

function ligarEventos() {
  document.querySelectorAll(".aba").forEach((botao) => {
    botao.addEventListener("click", () => abrirAba(botao.dataset.aba));
  });
  ["busca", "filtroAssistida", "filtroCat", "filtroGen", "filtroEstrelas"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderLista);
  });
  document.getElementById("ano").addEventListener("change", async () => {
    anoAtivo = document.getElementById("ano").value;
    await carregarAno(anoAtivo);
    agendarSalvar();
    renderTudo();
  });
  document.getElementById("tema").addEventListener("change", () => {
    document.body.dataset.tema = document.getElementById("tema").value;
    agendarSalvar();
  });
  document.getElementById("btnEvento").addEventListener("click", abrirModal);
  document.getElementById("btnCancelar").addEventListener("click", fecharModal);
  document.getElementById("form-prova").addEventListener("submit", adicionarEvento);
  document.getElementById("modal").addEventListener("click", (ev) => {
    if (ev.target.id === "modal") fecharModal();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") fecharModal();
  });
  document.getElementById("lista").addEventListener("click", (ev) => {
    const estrela = ev.target.closest(".estrela");
    if (estrela) {
      if (!podeEditar()) return;
      const id = estrela.dataset.id;
      const valor = Number(estrela.dataset.valor);
      const atual = registroDe(anoAtivo, id).estrelas;
      const novo = atual === valor ? 0 : valor;
      gravarRegistro(id, { estrelas: novo });
      pintarEstrelas(id, novo);
      return;
    }
    const apagar = ev.target.closest("[data-apagar]");
    if (apagar) excluirEvento(apagar.dataset.apagar);
  });
  document.getElementById("lista").addEventListener("input", (ev) => {
    const campo = ev.target.closest("[data-campo]");
    if (!campo || !podeEditar()) return;
    gravarRegistro(campo.dataset.id, { [campo.dataset.campo]: campo.value });
  });
  document.getElementById("listaCanais").addEventListener("click", (ev) => {
    const rem = ev.target.closest("[data-remover-canal]");
    if (rem) {
      removerCanal(rem.dataset.removerCanal);
      return;
    }
    const tag = ev.target.closest("[data-canal]");
    if (tag) alternarCanal(tag.dataset.canal);
  });
  document.getElementById("btnCanal").addEventListener("click", adicionarCanal);
  document.getElementById("novoCanal").addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      adicionarCanal();
    }
  });
  document.getElementById("btnSalvar").addEventListener("click", async () => {
    clearTimeout(timer);
    timer = 0;
    await persistir();
    toast("Tudo salvo.");
  });
  document.getElementById("btnExportar").addEventListener("click", exportar);
  document.getElementById("btnImportar").addEventListener("click", () => {
    document.getElementById("arquivo").click();
  });
  document.getElementById("arquivo").addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (file) await importarArquivo(file);
  });
  document.getElementById("btnEntrar").addEventListener("click", async () => {
    try {
      const r = await loja.entrar();
      if (!r.ok) toast(r.motivo || "Não foi possível entrar.");
      else if (!r.podeEscrever) toast("Conta conectada só para leitura.");
      else toast("Nuvem ligada.");
      renderTudo();
    } catch (erro) {
      console.error(erro);
      toast("Não foi possível entrar com o Google.");
    }
  });
  document.getElementById("btnSair").addEventListener("click", async () => {
    await loja.sair();
    renderTudo();
  });
  window.addEventListener("pagehide", () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = 0;
    persistir();
  });
}

function preencherPaises() {
  document.getElementById("paises").innerHTML = NOMES_PAISES
    .map((nome) => `<option value="${esc(nome)}"></option>`)
    .join("");
}

async function iniciar() {
  ligarEventos();
  preencherPaises();
  try {
    loja = await abrirArmazenamento();
    memoria = loja.estado;
    const resposta = await fetch("data/manifest.json");
    if (!resposta.ok) throw new Error("manifest");
    manifest = await resposta.json();
    anoAtivo = String(memoria.anoAtivo || manifest.padrao || "2027");
    if (!anosDisponiveis().includes(anoAtivo)) anoAtivo = String(manifest.padrao || anosDisponiveis()[0]);
    document.body.dataset.tema = memoria.tema || document.body.dataset.tema || "amarela";
    await carregarAno(anoAtivo);
    loja.assinar((estado) => {
      if (estado) memoria = estado;
      if (eco) return;
      aoMudar();
    });
    visto = assinatura(memoria);
    emailVisto = loja.email || "";
    podeVisto = Boolean(loja.podeEscrever);
    renderTudo();
    if (loja.aviso) toast(loja.aviso);
  } catch (erro) {
    console.error(erro);
    document.getElementById("lista").innerHTML = `<p class="vazio">Não consegui carregar o calendário. Abra a página por um servidor, com a pasta data ao lado do index.</p>`;
    document.getElementById("avisoSalvar").textContent = "Calendário indisponível.";
  }
}

if (typeof document !== "undefined") iniciar();
