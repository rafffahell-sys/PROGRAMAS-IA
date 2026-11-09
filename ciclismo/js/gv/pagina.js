import {
  TIPOS,
  etapaAnteriorLiberada,
  podeLerAnalisePre,
  etapaLiberada,
  estadoChip,
  filtrarEtapas,
  hrefEtapa,
  hrefHub,
  lerRota,
  liberacaoDaProva,
  normalizarAcesso,
  numerosLiberados,
  podeLerSnapshot,
  somaKm,
  compararTops
} from "./modelo.js";
import { pontosValidos, svgPerfil } from "./perfil.js";
import { htmlCena } from "./cena.js";
import { carregarSnapshot } from "./snapshots.js";
import { carregarAnalisePre } from "./analises.js";

const ROTULO_CHIP = {
  bloqueada: "bloqueada",
  percurso_ok: "percurso",
  assistida: "confirmada"
};
const ROTULO_TIPO = {
  plana: "Plana",
  ondulada: "Ondulada",
  montanha: "Montanha",
  crono: "Crono",
  mista: "Mista",
  desconhecido: "Tipo a publicar"
};

function esc(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

async function lerJson(fetchFn, url) {
  const resposta = await fetchFn(url);
  if (!resposta.ok) throw new Error(url);
  return resposta.json();
}

function fmtKm(km) {
  if (typeof km !== "number") return "distância a publicar";
  const texto = Number.isInteger(km) ? String(km) : String(km).replace(".", ",");
  return `${texto} km`;
}

function fmtData(iso) {
  if (!iso) return "data a publicar";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function lugar(etapa) {
  if (etapa.origem && etapa.destino) return `${etapa.origem} → ${etapa.destino}`;
  if (etapa.origem) return `${etapa.origem} → destino a publicar`;
  if (etapa.destino) return `origem a publicar → ${etapa.destino}`;
  return "origem e destino a publicar";
}

function snapshotVisivel(snap, permitirSintetico) {
  if (!snap) return null;
  if (snap.sintetico === true && permitirSintetico !== true) return null;
  return snap;
}

function htmlFontes(prova) {
  return (prova.fontes || []).map((fonte) => (
    `<li><a href="${esc(fonte.url)}" rel="noopener noreferrer">${esc(fonte.nome)}</a></li>`
  )).join("");
}

function htmlCamisas(prova) {
  return (prova.camisas || []).map((camisa) => {
    const badge = camisa.oficialConfirmado
      ? `<span class="gv-badge ok">regulamento</span>`
      : `<span class="gv-badge">a confirmar</span>`;
    return `<li class="gv-camisa">
      <span class="gv-cor" style="background:${esc(camisa.cor)}"></span>
      <span><strong>${esc(camisa.rotulo)}</strong> ${badge}</span>
    </li>`;
  }).join("");
}

function htmlMarcadores(titulo, itens) {
  if (!itens?.length) return "";
  const lis = itens.map((item) => {
    const cat = item.categoria ? ` · cat. ${esc(item.categoria)}` : "";
    const km = item.xKm != null && Number.isFinite(Number(item.xKm))
      ? ` · km ${esc(item.xKm)}`
      : " · km não informado";
    return `<li>${esc(item.nome)}${cat}${km}</li>`;
  }).join("");
  return `<div class="gv-marcas"><h3>${esc(titulo)}</h3><ul>${lis}</ul></div>`;
}

function htmlPerfil(etapa) {
  const pontos = etapa.perfil?.pontos || [];
  if (!pontosValidos(pontos)) {
    return `<figure class="gv-perfil gv-perfil-vazio">
      <figcaption>Perfil altimétrico a publicar</figcaption>
      <p>A fonte de percurso consultada não trouxe a série de altitude. Nenhum desenho foi inventado.</p>
    </figure>`;
  }
  const marcas = [...(etapa.perfil?.sprints || []), ...(etapa.perfil?.montanhas || [])];
  return `<figure class="gv-perfil">${svgPerfil(pontos, marcas)}
    <figcaption>Perfil do percurso, sem resultado.</figcaption>
  </figure>`;
}

function htmlLinha(item, unidade) {
  const valor = unidade === "pontos" ? item.pontos : item.tempo;
  const diff = item.gap ?? item.diff ?? "";
  const delta = item.delta == null
    ? ""
    : item.delta === 0
      ? " · mesma posição"
      : item.delta > 0
        ? ` · subiu ${item.delta}`
        : ` · caiu ${Math.abs(item.delta)}`;
  return `<li><span class="gv-pos">${esc(item.pos)}</span> ${esc(item.ciclista)} <span class="gv-eq">${esc(item.equipe || "")}</span> <span class="gv-tempo">${esc(valor ?? "")} ${esc(diff ?? "")}</span>${esc(delta)}</li>`;
}

function htmlClassificacao(titulo, lista, unidade) {
  if (!lista?.length) return "";
  return `<section class="gv-bloco"><h3>${esc(titulo)}</h3><ol class="gv-lista">${lista.map((item) => htmlLinha(item, unidade)).join("")}</ol></section>`;
}

function htmlAnalisePre(etapaN, liberacao, analise, acesso) {
  const n = Number(etapaN);
  if (n === 1) {
    return `<section class="gv-analise" data-analise="neutra"><h2>Antes da largada</h2><p>Nesta primeira etapa só fica o percurso. Não há análise com resultado.</p></section>`;
  }
  const gate = podeLerAnalisePre({ liberacao, etapa: n, acesso });
  if (!gate.ok) {
    return `<section class="gv-analise" data-analise="bloqueada"><h2>Análise pré-etapa</h2><p>Bloqueada até você confirmar a etapa ${n - 1} desta mesma prova e deste mesmo ano.</p></section>`;
  }
  if (!analise || analise.ausente === true || typeof analise.texto !== "string" || !analise.texto.trim()) {
    return `<section class="gv-analise" data-analise="ausente"><h2>Análise pré-etapa</h2><p>A etapa ${n - 1} está confirmada, mas esta coleta não trouxe análise. Nenhum texto foi escrito no lugar.</p></section>`;
  }
  const fonte = analise.fonte?.nome ? `<p class="gv-fonte">Fonte da análise: ${esc(analise.fonte.nome)}</p>` : "";
  return `<section class="gv-analise" data-analise="presente"><h2>Análise pré-etapa</h2><p>${esc(analise.texto)}</p>${fonte}</section>`;
}

function htmlFavoritos(lista) {
  if (!lista || lista.tipo !== "favoritos_prelargada" || !Array.isArray(lista.itens)) return "";
  const cards = lista.itens.map((item) => `<article class="gv-favorito">
      <h3>${esc(item.nome)}</h3>
      <p class="gv-favorito-equipe">${esc(item.equipe)}</p>
      <p>Inscrição: ${esc(item.inscricao)} · dorsal ${esc(item.dorsal)} · ${esc(item.pais)}</p>
      <p>${esc(item.caracteristicas)}</p>
    </article>`).join("");
  const fontes = (lista.fontes || []).map((fonte) => (
    `<li><a href="${esc(fonte.url)}" rel="noopener noreferrer">${esc(fonte.nome)}</a>${fonte.data ? ` · ${esc(fonte.data)}` : ""}${fonte.nota ? ` · ${esc(fonte.nota)}` : ""}</li>`
  )).join("");
  return `<section id="favoritos-prelargada" class="gv-favoritos">
    <h2>Favoritos pré-largada</h2>
    <p class="gv-aviso">${esc(lista.aviso)}</p>
    <p class="gv-nota">Ordem alfabética. Não é posição de favoritismo nem classificação.</p>
    <div class="gv-favoritos-grade">${cards}</div>
    <h3>Fontes da seleção</h3>
    <ul>${fontes}</ul>
  </section>`;
}

function htmlResumo(resumo) {
  if (!resumo || resumo.ausente === true || typeof resumo.texto !== "string" || !resumo.texto.trim()) {
    return `<section class="gv-bloco" data-resumo="ausente"><h3>Resumo da etapa</h3><p>A coleta desta etapa não trouxe resumo. Nenhum texto foi escrito no lugar.</p></section>`;
  }
  const momentos = (resumo.momentos || []).map((item) => `<li>${esc(item)}</li>`).join("");
  const contexto = resumo.contextoClassificatorio
    ? `<p>${esc(resumo.contextoClassificatorio)}</p>`
    : "";
  const fonte = resumo.fonte?.nome ? `<p class="gv-fonte">Fonte do resumo: ${esc(resumo.fonte.nome)}</p>` : "";
  return `<section class="gv-bloco" data-resumo="presente"><h3>Resumo da etapa</h3><p>${esc(resumo.texto)}</p>${momentos ? `<ul class="gv-lista">${momentos}</ul>` : ""}${contexto}${fonte}</section>`;
}

function htmlResultados(prova, etapa, liberacao, snap, snapAnterior, anteriorN) {
  if (!etapaLiberada(liberacao, etapa.n) || !snap) {
    return `<section class="gv-bloqueio" data-resultados="ocultos">
      <h2>Resultados</h2>
      <p>Bloqueados. Esta etapa só mostra o percurso até uma confirmação explícita, com a leitura autorizada no servidor.</p>
    </section>`;
  }
  const comparacao = anteriorN
    ? (snapAnterior
      ? `<p class="gv-compara">Comparação com a etapa ${esc(anteriorN)}, a última confirmada antes desta.</p>`
      : `<p class="gv-compara">A etapa ${esc(anteriorN)} está confirmada, mas o snapshot dela não foi carregado.</p>`)
    : `<p class="gv-compara">Não há etapa confirmada anterior para comparar.</p>`;
  const gcAtual = anteriorN && snapAnterior ? compararTops(snap.gc?.top10, snapAnterior.gc?.top10) : (snap.gc?.top10 || []);
  const etapaAtual = snap.etapa?.top10 || [];
  const camisas = (prova.camisas || []).map((camisa) => {
    const bloco = snap.camisas?.[camisa.id];
    if (!bloco) return "";
    const anterior = snapAnterior?.camisas?.[camisa.id]?.top5;
    const top = anteriorN && snapAnterior ? compararTops(bloco.top5, anterior) : (bloco.top5 || []);
    const veste = bloco.fonteNaoDistingue
      ? "A fonte não separa o líder de quem veste a camisa."
      : `Quem veste: ${bloco.quemVeste || "—"}.`;
    return `<section class="gv-bloco">
      <h3>${esc(camisa.rotulo)}</h3>
      <p>Líder da classificação: ${esc(bloco.lider || "—")}. ${esc(veste)}</p>
      <ol class="gv-lista">${top.map((item) => htmlLinha(item, camisa.unidade)).join("")}</ol>
    </section>`;
  }).join("");
  const equipes = prova.classificacaoEquipes?.habilitada && snap.equipes?.top5
    ? htmlClassificacao("Equipes", snap.equipes.top5, "tempo")
    : "";
  const fonte = snap.fonte
    ? `<p class="gv-fonte">Fonte: ${esc(snap.fonte.nome || "")}${snap.fonte.coletadoEm ? ` · ${esc(snap.fonte.coletadoEm)}` : ""}</p>`
    : "";
  return `<section class="gv-resultados revelar" data-resultados="visiveis">
    <h2>Depois da etapa ${esc(etapa.n)}</h2>
    ${comparacao}
    ${htmlResumo(snap.resumo)}
    ${htmlClassificacao("Etapa", etapaAtual, "tempo")}
    ${htmlClassificacao("Geral", gcAtual, "tempo")}
    ${camisas}
    ${equipes}
    ${fonte}
  </section>`;
}

export function htmlHub(prova, liberacao, filtro = {}, favoritos = null) {
  const liberadas = numerosLiberados(liberacao);
  const etapas = filtrarEtapas(prova.etapas, liberacao, filtro);
  const km = somaKm(prova.etapas);
  const kmTexto = km.completa
    ? `${String(km.soma).replace(".", ",")} km no total`
    : km.soma
      ? `${String(km.soma).replace(".", ",")} km somados · ${km.faltam} etapas sem distância`
      : "distância total a publicar";
  const cards = etapas.map((etapa) => {
    const chip = estadoChip(etapa, etapaLiberada(liberacao, etapa.n));
    return `<a class="gv-card" href="${esc(hrefEtapa(prova.slug, prova.ano, etapa.n))}">
      <span class="gv-num">${esc(etapa.n)}</span>
      <span class="gv-chip ${esc(chip)}">${esc(ROTULO_CHIP[chip])}</span>
      <strong>${esc(lugar(etapa))}</strong>
      <span>${esc(fmtKm(etapa.km))} · ${esc(ROTULO_TIPO[etapa.tipo] || etapa.tipo)}</span>
    </a>`;
  }).join("");
  const tipos = [`<option value="">Todos os tipos</option>`]
    .concat(TIPOS.map((tipo) => `<option value="${tipo}"${filtro.tipo === tipo ? " selected" : ""}>${esc(ROTULO_TIPO[tipo])}</option>`))
    .join("");
  return `<header class="gv-cabeca gv-cena">
      <div class="gv-cena-texto">
        <p class="kicker">Grande Volta · ${esc(prova.ano)}</p>
        <h1>${esc(prova.nome)}</h1>
        <p>Calendário do site: ${esc(fmtData(prova.calendario?.inicio))} – ${esc(fmtData(prova.calendario?.fim))}. Isso não é o seu progresso.</p>
        <p class="gv-progresso" data-progresso="etapas"><strong>${liberadas.length}</strong> de ${esc(prova.totalEtapas)} etapas confirmadas</p>
        <p>${esc(kmTexto)}</p>
      </div>
      ${htmlCena(prova.slug)}
    </header>
    <p class="gv-aviso">Resultados só depois que você confirmar cada etapa. Nenhuma confirmação libera a vizinha nem a prova inteira.</p>
    <section>
      <h2>Camisas</h2>
      <ul class="gv-camisas">${htmlCamisas(prova)}</ul>
      <p class="gv-nota">${esc(prova.regulamento?.notaPrioridade || "")}</p>
    </section>
    <form class="gv-filtros" id="gv-filtros">
      <label>Tipo <select name="tipo">${tipos}</select></label>
      <label><input type="checkbox" name="assistidas"${filtro.somenteAssistidas ? " checked" : ""}> Só confirmadas</label>
      <label><input type="checkbox" name="perfil"${filtro.somenteComPerfil ? " checked" : ""}> Só com perfil</label>
    </form>
    <div class="gv-grade">${cards || `<p class="gv-vazio">Nenhuma etapa com esse filtro.</p>`}</div>
    ${prova.slug === "giro" ? htmlFavoritos(favoritos) : ""}
    <section>
      <h2>Fontes do percurso</h2>
      <ul>${htmlFontes(prova)}</ul>
      ${(prova.observacoes || []).map((texto) => `<p class="gv-nota">${esc(texto)}</p>`).join("")}
    </section>`;
}

export function htmlEtapa(prova, etapa, liberacao, snap, snapAnterior, opcoes = {}) {
  const visivel = snapshotVisivel(snap, opcoes.permitirSintetico);
  const anteriorVisivel = snapshotVisivel(snapAnterior, opcoes.permitirSintetico);
  const anteriorN = etapaAnteriorLiberada(liberacao, etapa.n);
  const chip = estadoChip(etapa, etapaLiberada(liberacao, etapa.n));
  const detalhe = etapa.detalhe ? `<p>${esc(etapa.detalhe)}</p>` : "";
  const avisos = (etapa.avisos || []).map((texto) => `<li>${esc(texto)}</li>`).join("");
  return `<p class="gv-voltar"><a href="${esc(hrefHub(prova.slug, prova.ano))}">Todas as etapas</a></p>
    <header class="gv-cabeca gv-cena">
      <div class="gv-cena-texto">
        <p class="kicker">${esc(prova.nome)} · ${esc(prova.ano)}</p>
        <h1>Etapa ${esc(etapa.n)}</h1>
        <p class="gv-chip ${esc(chip)}">${esc(ROTULO_CHIP[chip])}</p>
        <p class="gv-lugar">${esc(lugar(etapa))}</p>
        <p>${esc(fmtData(etapa.data))} · ${esc(fmtKm(etapa.km))}${etapa.desnivelM == null ? "" : ` · D+ ${esc(etapa.desnivelM)} m`}</p>
        <p>${esc(ROTULO_TIPO[etapa.tipo] || "")}${etapa.tipoOficial ? ` · ${esc(etapa.tipoOficial)}` : ""}</p>
        ${detalhe}
      </div>
      ${htmlCena(prova.slug)}
    </header>
    ${htmlPerfil(etapa)}
    ${htmlAnalisePre(etapa.n, liberacao, opcoes.analise || null, opcoes.acesso || { regrasComprovadas: false })}
    <div class="gv-marcas-grade">
      ${htmlMarcadores("Sprints do percurso", etapa.perfil?.sprints)}
      ${htmlMarcadores("Subidas do percurso", etapa.perfil?.montanhas)}
    </div>
    ${avisos ? `<ul class="gv-avisos">${avisos}</ul>` : ""}
    <p class="gv-fonte">Fonte do percurso: ${(prova.fontes || []).map((f) => esc(f.nome)).join(" · ")}</p>
    ${htmlResultados(prova, etapa, liberacao, visivel, anteriorVisivel, anteriorN)}`;
}

function acharProva(catalogo, slug, ano) {
  return (catalogo?.provas || []).find(
    (item) => item.slug === slug && Number(item.ano) === Number(ano)
  ) || null;
}

function marcarProva(slug) {
  if (typeof document === "undefined" || !document.body) return;
  if (slug) document.body.dataset.prova = slug;
  else delete document.body.dataset.prova;
}

export async function desenhar(estado) {
  const rota = lerRota(globalThis.location.hash);
  const raiz = estado.raiz;
  marcarProva(rota.ok ? rota.slug : "");
  if (!rota.ok) {
    const links = (estado.catalogo?.provas || []).map((item) => (
      `<li><a href="${esc(hrefHub(item.slug, item.ano))}">${esc(item.nome)} ${esc(item.ano)}</a></li>`
    )).join("");
    raiz.innerHTML = `<h1>Grandes Voltas</h1><ul>${links}</ul>`;
    document.title = "Grandes Voltas — percursos";
    return;
  }
  const resumo = acharProva(estado.catalogo, rota.slug, rota.ano);
  if (!resumo) {
    raiz.innerHTML = `<p>Prova não encontrada neste ano.</p>`;
    return;
  }
  if (!estado.provas[resumo.arquivo]) {
    estado.provas[resumo.arquivo] = await lerJson(estado.fetchFn, `data/grandes-voltas/${resumo.arquivo}`);
  }
  const prova = estado.provas[resumo.arquivo];
  const liberacao = liberacaoDaProva(estado.liberacoes, prova.ano, prova.provaId);
  if (!rota.etapa) {
    let favoritos = null;
    if (prova.slug === "giro") {
      if (!estado.favoritos) {
        estado.favoritos = await lerOuFechado(
          estado.fetchFn,
          "data/grandes-voltas/2026/giro-favoritos-prelargada.json",
          null
        );
      }
      favoritos = estado.favoritos;
    }
    raiz.innerHTML = htmlHub(prova, liberacao, estado.filtro || {}, favoritos);
    document.title = `${prova.nome} ${prova.ano} — etapas`;
    ligarFiltros(estado, prova, liberacao);
    return;
  }
  const etapa = (prova.etapas || []).find((item) => item.n === rota.etapa);
  if (!etapa) {
    raiz.innerHTML = `<p>Esta etapa não existe no percurso publicado.</p>`;
    return;
  }
  const gate = podeLerSnapshot({ liberacao, etapa: etapa.n, acesso: estado.acesso });
  const gateAnalise = podeLerAnalisePre({ liberacao, etapa: etapa.n, acesso: estado.acesso });
  let snap = null;
  let snapAnterior = null;
  let analise = null;
  if (gate.ok) {
    const { criarLeitorFirestore } = await import("./firestore-leitor.js");
    const leitor = estado.leitor || criarLeitorFirestore();
    const atual = await carregarSnapshot({
      prova, etapa: etapa.n, liberacao, acesso: estado.acesso, leitor
    });
    snap = atual.snapshot;
    const anteriorN = etapaAnteriorLiberada(liberacao, etapa.n);
    if (anteriorN && atual.ok) {
      const anterior = await carregarSnapshot({
        prova, etapa: anteriorN, liberacao, acesso: estado.acesso, leitor
      });
      snapAnterior = anterior.snapshot;
    }
  }
  if (gateAnalise.ok) {
    const { criarLeitorAnaliseFirestore } = await import("./firestore-leitor-analise.js");
    const leitorAnalise = estado.leitorAnalise || criarLeitorAnaliseFirestore();
    const lida = await carregarAnalisePre({
      prova, etapa: etapa.n, liberacao, acesso: estado.acesso, leitor: leitorAnalise
    });
    analise = lida.analise;
  }
  raiz.innerHTML = htmlEtapa(prova, etapa, liberacao, snap, snapAnterior, {
    permitirSintetico: false,
    acesso: estado.acesso,
    analise
  });
  document.title = `Etapa ${etapa.n} · ${prova.nome} ${prova.ano}`;
}

function ligarFiltros(estado, prova, liberacao) {
  const form = estado.raiz.querySelector("#gv-filtros");
  if (!form) return;
  form.addEventListener("change", () => {
    const dados = new FormData(form);
    estado.filtro = {
      tipo: String(dados.get("tipo") || ""),
      somenteAssistidas: form.querySelector('[name="assistidas"]').checked,
      somenteComPerfil: form.querySelector('[name="perfil"]').checked
    };
    estado.raiz.innerHTML = htmlHub(prova, liberacao, estado.filtro, prova.slug === "giro" ? estado.favoritos : null);
    ligarFiltros(estado, prova, liberacao);
  });
}

async function lerOuFechado(fetchFn, url, fallback) {
  try {
    return await lerJson(fetchFn, url);
  } catch {
    return fallback;
  }
}

export async function iniciarPagina(raiz, deps = {}) {
  const fetchFn = deps.fetchFn || globalThis.fetch.bind(globalThis);
  const catalogo = await lerJson(fetchFn, "data/grandes-voltas/catalogo.json");
  const acesso = normalizarAcesso(await lerOuFechado(
    fetchFn,
    "data/grandes-voltas/acesso.json",
    { regrasComprovadas: false }
  ));
  const liberacoes = await lerOuFechado(
    fetchFn,
    "data/grandes-voltas/liberacoes.json",
    { provas: {} }
  );
  const estado = {
    raiz,
    fetchFn,
    acesso,
    catalogo,
    liberacoes,
    provas: {},
    filtro: {},
    leitor: deps.leitor || null
  };
  const alvo = globalThis.window || globalThis;
  if (typeof alvo.addEventListener === "function") {
    alvo.addEventListener("hashchange", () => {
      desenhar(estado);
    });
  }
  await desenhar(estado);
  return estado;
}

const raizAuto = typeof document !== "undefined" ? document.getElementById("gv-app") : null;
if (raizAuto && !globalThis.__GV_TESTE__) iniciarPagina(raizAuto);
