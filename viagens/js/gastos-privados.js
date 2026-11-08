import {
  PROJETO_FIREBASE,
  ehProprietario,
  falhaDeRede,
  formatarCentavos,
  formatarDataIso,
  interpretarLista,
  leituraVeioDoServidor,
  segmentosLancamentos,
  sessaoEhGoogle,
  somarBrlCentavos
} from "./gastos-privados-modelo.js";

const SDK = "https://www.gstatic.com/firebasejs/10.14.1";

const abrir = document.getElementById("abrir-gastos");
const dialog = document.getElementById("gastos-dialog");
const status = document.getElementById("gastos-status");
const entrar = document.getElementById("gastos-entrar");
const sair = document.getElementById("gastos-sair");
const fechar = document.getElementById("gastos-fechar");
const scroll = document.getElementById("gastos-scroll");
const corpo = document.getElementById("gastos-corpo");
const totalLinha = document.getElementById("gastos-total-linha");
const totalEl = document.getElementById("gastos-total");
const ignoradosEl = document.getElementById("gastos-ignorados");

const TEXTO_DESCONECTADO = "Nenhuma conta conectada. Os gastos não ficam salvos nesta página. Entre com a conta Google do proprietário para consultar.";
const TEXTO_CONTA_ERRADA = "Erro: esta conta Google não pode ver os gastos. Saia e entre com a conta do proprietário. Esconder a tabela não bloqueia o banco.";
const TEXTO_PROVEDOR = "Erro: esta sessão não entrou com o Google. A leitura dos gastos não foi feita e a tabela foi apagada.";
const TEXTO_OFFLINE = "Erro: não foi possível ler os gastos no servidor. A tabela foi apagada. Esta página não mostra cópia guardada no navegador.";
const TEXTO_AVISO_LEITURA = "A leitura veio do servidor nesta sessão. Esta página não confirma qual arquivo de regras está publicado.";

let app = null;
let auth = null;
let db = null;
let usuario = null;
let ouvindo = false;
let ticket = 0;
let cacheGeracao = 0;
let operacaoCache = Promise.resolve();
let lancamentos = [];

function emailEsperado() {
  const valor = window.FIREBASE_OWNER_EMAIL;
  return typeof valor === "string" ? valor.trim() : "";
}

function configPublica() {
  const config = window.FIREBASE_CONFIG;
  if (!config || typeof config !== "object") return null;
  if (config.projectId !== PROJETO_FIREBASE || !config.apiKey) return null;
  return config;
}

function mostrarStatus(texto, tipo) {
  status.textContent = texto;
  status.dataset.tipo = tipo || "info";
  if (tipo === "erro") status.setAttribute("role", "alert");
  else status.setAttribute("role", "status");
}

function limparDom() {
  corpo.replaceChildren();
  totalEl.textContent = "";
  totalLinha.hidden = true;
  scroll.hidden = true;
  ignoradosEl.hidden = true;
  ignoradosEl.textContent = "";
  dialog.removeAttribute("aria-busy");
}

function limparMemoria() {
  ticket += 1;
  lancamentos = [];
  limparDom();
  return ticket;
}

function soltarCache() {
  cacheGeracao += 1;
  const atual = db;
  db = null;
  operacaoCache = operacaoCache.then(async () => {
    if (!atual) return;
    const { terminate } = await import(`${SDK}/firebase-firestore.js`);
    await terminate(atual);
  });
  return operacaoCache;
}

function atualizarBotoes() {
  const logado = Boolean(usuario);
  entrar.hidden = logado;
  sair.hidden = !logado;
}

function desenhar(lista, ignorados) {
  corpo.replaceChildren();
  for (const item of lista) {
    const linha = document.createElement("tr");
    const celulas = [
      [formatarDataIso(item.data), false],
      [item.local, false],
      [item.categoria, false],
      [item.moedaOriginal, false],
      [formatarCentavos(item.valorOriginalCentavos, item.moedaOriginal), true],
      [formatarCentavos(item.valorBrlCentavos, "BRL"), true]
    ];
    for (const [texto, numero] of celulas) {
      const td = document.createElement("td");
      if (numero) td.className = "num";
      td.textContent = texto;
      linha.append(td);
    }
    corpo.append(linha);
  }
  scroll.hidden = lista.length === 0;
  if (lista.length > 0) {
    totalEl.textContent = formatarCentavos(somarBrlCentavos(lista), "BRL");
    totalLinha.hidden = false;
  }
  if (ignorados > 0) {
    ignoradosEl.textContent = ignorados === 1
      ? "1 lançamento ficou de fora porque não segue o formato. Observações e dados de cartão não são mostrados."
      : `${ignorados} lançamentos ficaram de fora porque não seguem o formato. Observações e dados de cartão não são mostrados.`;
    ignoradosEl.hidden = false;
  }
}

function mensagemErro(erro) {
  const codigo = String(erro?.code || "");
  if (codigo === "permission-denied") {
    return "Erro: o Firestore recusou a leitura. Se esta é a conta do proprietário, o caminho privado ainda não está autorizado no banco. Esta página não verifica as regras publicadas.";
  }
  if (falhaDeRede(codigo)) return TEXTO_OFFLINE;
  if (codigo === "auth/popup-closed-by-user" || codigo === "auth/cancelled-popup-request") {
    return "Erro: o login foi cancelado. Nenhum gasto foi consultado.";
  }
  if (codigo === "auth/popup-blocked") {
    return "Erro: o navegador bloqueou a janela de login do Google.";
  }
  if (codigo === "auth/unauthorized-domain") {
    return "Erro: este domínio não está autorizado no login Google do Firebase.";
  }
  if (codigo === "config-ausente") {
    return "Erro: a configuração do Firebase desta página não é a do projeto programas-ia. Nada foi consultado.";
  }
  return "Erro: não foi possível carregar os gastos. Nada foi gravado neste navegador.";
}

async function garantirFirebase() {
  const config = configPublica();
  if (!config || !emailEsperado()) {
    const erro = new Error("config");
    erro.code = "config-ausente";
    throw erro;
  }
  await operacaoCache;
  const geracao = cacheGeracao;
  if (!app) {
    const { initializeApp } = await import(`${SDK}/firebase-app.js`);
    const { getAuth, onAuthStateChanged } = await import(`${SDK}/firebase-auth.js`);
    if (geracao !== cacheGeracao) return null;
    app = initializeApp(config);
    auth = getAuth(app);
    if (!ouvindo) {
      ouvindo = true;
      onAuthStateChanged(auth, (user) => aoMudarUsuario(user));
    }
  }
  if (db) return db;
  // memoryLocalCache não impede getDocs de devolver memória. A leitura usa getDocsFromServer.
  const { initializeFirestore, memoryLocalCache } = await import(`${SDK}/firebase-firestore.js`);
  const novo = initializeFirestore(app, { localCache: memoryLocalCache() });
  if (geracao !== cacheGeracao) {
    operacaoCache = operacaoCache.then(async () => {
      const { terminate } = await import(`${SDK}/firebase-firestore.js`);
      await terminate(novo);
    });
    await operacaoCache;
    return null;
  }
  db = novo;
  return db;
}

async function carregar() {
  const meu = limparMemoria();
  if (!ehProprietario(usuario?.email, emailEsperado())) {
    mostrarStatus(usuario ? TEXTO_CONTA_ERRADA : TEXTO_DESCONECTADO, usuario ? "erro" : "info");
    return;
  }
  mostrarStatus("Carregando gastos no servidor…");
  dialog.setAttribute("aria-busy", "true");
  try {
    const token = await usuario.getIdTokenResult();
    if (meu !== ticket) return;
    if (!sessaoEhGoogle(token?.signInProvider)) {
      lancamentos = [];
      limparDom();
      mostrarStatus(TEXTO_PROVEDOR, "erro");
      return;
    }
    const banco = await garantirFirebase();
    if (!banco || meu !== ticket) return;
    const { collection, getDocsFromServer } = await import(`${SDK}/firebase-firestore.js`);
    const snap = await getDocsFromServer(collection(banco, ...segmentosLancamentos()));
    if (meu !== ticket) return;
    if (!leituraVeioDoServidor(snap.metadata)) {
      const erro = new Error("cache");
      erro.code = "offline-cache";
      throw erro;
    }
    const { aceitos, ignorados } = interpretarLista(snap.docs.map((item) => [item.id, item.data()]));
    if (meu !== ticket) return;
    lancamentos = aceitos;
    desenhar(aceitos, ignorados);
    mostrarStatus(aceitos.length === 0
      ? `Nenhum gasto lançado para esta viagem. ${TEXTO_AVISO_LEITURA}`
      : `Gastos carregados nesta sessão. ${TEXTO_AVISO_LEITURA}`);
  } catch (erro) {
    if (meu !== ticket) return;
    lancamentos = [];
    limparDom();
    console.warn("gastos", erro?.code || "erro");
    mostrarStatus(mensagemErro(erro), "erro");
  } finally {
    if (meu === ticket) dialog.removeAttribute("aria-busy");
  }
}

function aoMudarUsuario(user) {
  usuario = user || null;
  atualizarBotoes();
  if (!dialog.open) {
    limparMemoria();
    void soltarCache();
    return;
  }
  if (!user || !ehProprietario(user.email, emailEsperado())) {
    limparMemoria();
    void soltarCache();
    mostrarStatus(user ? TEXTO_CONTA_ERRADA : TEXTO_DESCONECTADO, user ? "erro" : "info");
    return;
  }
  void carregar();
}

async function entrarGoogle() {
  mostrarStatus("Abrindo o login do Google…");
  try {
    await garantirFirebase();
    if (!auth) return;
    const { GoogleAuthProvider, signInWithPopup } = await import(`${SDK}/firebase-auth.js`);
    const provedor = new GoogleAuthProvider();
    provedor.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provedor);
  } catch (erro) {
    limparMemoria();
    console.warn("gastos", erro?.code || "erro");
    mostrarStatus(mensagemErro(erro), "erro");
  }
}

async function sairConta() {
  limparMemoria();
  await soltarCache();
  if (auth) {
    const { signOut } = await import(`${SDK}/firebase-auth.js`);
    await signOut(auth);
  }
  usuario = auth?.currentUser || null;
  atualizarBotoes();
  if (dialog.open) mostrarStatus(TEXTO_DESCONECTADO);
}

if (abrir && dialog && status && entrar && sair && fechar && scroll && corpo && totalLinha && totalEl && ignoradosEl) {
  abrir.addEventListener("click", () => {
    if (!dialog.open) dialog.showModal();
    void (async () => {
      try {
        await garantirFirebase();
        aoMudarUsuario(auth?.currentUser || null);
      } catch (erro) {
        limparMemoria();
        mostrarStatus(mensagemErro(erro), "erro");
      }
    })();
  });
  fechar.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    limparMemoria();
    void soltarCache();
  });
  entrar.addEventListener("click", () => void entrarGoogle());
  sair.addEventListener("click", () => void sairConta());
}
