// Leitura e gravação da temporada.
// Hoje: localStorage. Com firebase-config.js preenchido: Firestore + login Google.
// A interface (app.js) só fala com este módulo.

export const CHAVES_ANTIGAS = {
  registros: "ciclismo_registros",
  personalizados: "ciclismo_personalizados",
  canais: "ciclismo_canais",
  canaisSel: "ciclismo_canaisSel",
  anoAtivo: "ciclismo_anoAtivo",
  temaAtivo: "ciclismo_temaAtivo"
};

const CHAVE_V2 = "ciclismo_v2";

export const CANAIS_PADRAO = [
  "Eurosport",
  "GCN+",
  "SporTV",
  "Globoplay",
  "TV Cultura",
  "Disney+",
  "ESPN",
  "Star+",
  "Dazn",
  "SBS",
  "RAI Sports",
  "Youtube (oficial)",
  "Youtube (stream)",
  "FloBikes"
];

// Provas repetidas do esboço. O registro antigo acompanha o id que ficou.
export const FUSAO_IDS = {
  b112: "b1",
  b143: "b8",
  b96: "b37",
  b105: "b39",
  b106: "b40",
  b107: "b41",
  b128: "b58",
  b71: "b30",
  b98: "b92"
};

const TEMAS = {
  "red-dark": "roja",
  "blue-light": "dia",
  "green-dark": "amarela",
  amarela: "amarela",
  rosa: "rosa",
  roja: "roja",
  dia: "dia"
};

export function normalizarTema(tema) {
  return TEMAS[tema] || "amarela";
}

export function firebaseConfigurado(config = globalThis.FIREBASE_CONFIG) {
  const chave = String(config?.apiKey || "").trim();
  if (chave.length < 20) return false;
  const baixa = chave.toLowerCase();
  return !["cole", "your-api", "preencha", "changeme", "todo", "xxx"].some((p) => baixa.includes(p));
}

export function comSbs(canais) {
  const lista = Array.isArray(canais) && canais.length ? [...canais] : [...CANAIS_PADRAO];
  if (!lista.some((c) => String(c).trim().toLowerCase() === "sbs")) lista.push("SBS");
  return lista;
}

function registroVazio(r) {
  if (!r || typeof r !== "object") return true;
  const texto = ["assistida", "canal", "p1", "e1", "p2", "e2", "p3", "e3", "nota"]
    .some((k) => String(r[k] || "").trim());
  return !texto && !Number(r.estrelas);
}

export function fundirRegistros(registros) {
  const origem = registros && typeof registros === "object" ? registros : {};
  const saida = { ...origem };
  for (const [de, para] of Object.entries(FUSAO_IDS)) {
    const sufixo = `_${de}`;
    for (const chave of Object.keys(origem)) {
      if (!chave.endsWith(sufixo)) continue;
      const ano = chave.slice(0, -sufixo.length);
      const destino = `${ano}_${para}`;
      if (registroVazio(saida[destino]) && !registroVazio(origem[chave])) {
        saida[destino] = { ...origem[chave] };
      }
    }
  }
  return saida;
}

function lerJson(chave) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

function estadoVazio() {
  return {
    registros: {},
    personalizados: {},
    canais: [...CANAIS_PADRAO],
    canaisSel: [],
    anoAtivo: "",
    tema: "amarela"
  };
}

function sanitizar(bruto) {
  const base = estadoVazio();
  if (!bruto || typeof bruto !== "object") return base;
  return {
    registros: fundirRegistros(bruto.registros),
    personalizados: bruto.personalizados && typeof bruto.personalizados === "object" ? bruto.personalizados : {},
    canais: comSbs(bruto.canais),
    canaisSel: Array.isArray(bruto.canaisSel) ? bruto.canaisSel : [],
    anoAtivo: bruto.anoAtivo ? String(bruto.anoAtivo) : "",
    tema: normalizarTema(bruto.tema || bruto.temaAtivo)
  };
}

function lerLegado() {
  const registros = lerJson(CHAVES_ANTIGAS.registros);
  const personalizados = lerJson(CHAVES_ANTIGAS.personalizados);
  const canais = lerJson(CHAVES_ANTIGAS.canais);
  const canaisSel = lerJson(CHAVES_ANTIGAS.canaisSel);
  const anoAtivo = localStorage.getItem(CHAVES_ANTIGAS.anoAtivo);
  const temaAtivo = localStorage.getItem(CHAVES_ANTIGAS.temaAtivo);
  const tinha = [registros, personalizados, canais, canaisSel, anoAtivo, temaAtivo].some((v) => v);
  if (!tinha) return null;
  return sanitizar({
    registros: registros || {},
    personalizados: personalizados || {},
    canais: canais || CANAIS_PADRAO,
    canaisSel: canaisSel || [],
    anoAtivo: anoAtivo || "",
    tema: temaAtivo || "amarela"
  });
}

function gravarLegado(estado) {
  localStorage.setItem(CHAVES_ANTIGAS.registros, JSON.stringify(estado.registros));
  localStorage.setItem(CHAVES_ANTIGAS.personalizados, JSON.stringify(estado.personalizados));
  localStorage.setItem(CHAVES_ANTIGAS.canais, JSON.stringify(estado.canais));
  localStorage.setItem(CHAVES_ANTIGAS.canaisSel, JSON.stringify(estado.canaisSel));
  localStorage.setItem(CHAVES_ANTIGAS.anoAtivo, estado.anoAtivo);
  localStorage.setItem(CHAVES_ANTIGAS.temaAtivo, estado.tema);
}

function gravarLocal(estado) {
  const limpo = sanitizar(estado);
  localStorage.setItem(CHAVE_V2, JSON.stringify(limpo));
  gravarLegado(limpo);
  return limpo;
}

function lerLocal() {
  const atual = lerJson(CHAVE_V2);
  if (atual) return sanitizar(atual);
  const legado = lerLegado();
  if (legado) return gravarLocal(legado);
  return estadoVazio();
}

function fatiaNuvem(estado) {
  return {
    registros: estado.registros,
    personalizados: estado.personalizados,
    canais: estado.canais,
    canaisSel: estado.canaisSel,
    anoAtivo: estado.anoAtivo,
    tema: estado.tema,
    atualizadoEm: new Date().toISOString()
  };
}

function dono(email, esperado) {
  return String(email || "").toLowerCase() === String(esperado || "rafffahell@gmail.com").toLowerCase();
}

function criarLocal() {
  let estado = lerLocal();
  const ouvintes = new Set();
  const avisar = () => ouvintes.forEach((fn) => fn(estado));
  return {
    modo: "local",
    podeEscrever: true,
    email: null,
    estado,
    assinar(fn) {
      ouvintes.add(fn);
      return () => ouvintes.delete(fn);
    },
    async salvar(parcial) {
      estado = gravarLocal({ ...estado, ...parcial });
      avisar();
      return estado;
    },
    async entrar() {
      return { ok: false, motivo: "Firebase ainda não está configurado." };
    },
    async sair() {}
  };
}

async function criarFirebase(local) {
  const config = globalThis.FIREBASE_CONFIG;
  const emailDono = globalThis.FIREBASE_OWNER_EMAIL || "rafffahell@gmail.com";
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
  const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } =
    await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js");
  const { getFirestore, doc, getDoc, setDoc, onSnapshot } =
    await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");

  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const ref = doc(db, "ciclismo", "temporada");

  let estado = local.estado;
  let usuario = auth.currentUser;
  const ouvintes = new Set();
  const avisar = () => ouvintes.forEach((fn) => fn(estado));

  const aplicarNuvem = (dados) => {
    if (!dados) return;
    estado = sanitizar({
      ...estado,
      registros: dados.registros ?? estado.registros,
      personalizados: dados.personalizados ?? estado.personalizados,
      canais: dados.canais ?? estado.canais,
      canaisSel: dados.canaisSel ?? estado.canaisSel,
      anoAtivo: dados.anoAtivo ?? estado.anoAtivo,
      tema: dados.tema ?? estado.tema
    });
    gravarLocal(estado);
  };

  const remoto = await getDoc(ref);
  if (remoto.exists()) {
    aplicarNuvem(remoto.data());
  }

  onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    aplicarNuvem(snap.data());
    avisar();
  }, (erro) => {
    console.warn("Não foi possível acompanhar a nuvem. A cópia deste navegador continua.", erro);
  });

  onAuthStateChanged(auth, async (user) => {
    usuario = user;
    if (user && dono(user.email, emailDono) && !remoto.exists()) {
      const deNovo = await getDoc(ref);
      if (!deNovo.exists()) {
        await setDoc(ref, fatiaNuvem(estado));
      }
    }
    avisar();
  });

  return {
    modo: "firebase",
    get podeEscrever() {
      return dono(usuario?.email, emailDono);
    },
    get email() {
      return usuario?.email || null;
    },
    get estado() {
      return estado;
    },
    assinar(fn) {
      ouvintes.add(fn);
      return () => ouvintes.delete(fn);
    },
    async salvar(parcial) {
      estado = sanitizar({ ...estado, ...parcial });
      gravarLocal(estado);
      if (!dono(usuario?.email, emailDono)) {
        avisar();
        return estado;
      }
      await setDoc(ref, fatiaNuvem(estado), { merge: true });
      avisar();
      return estado;
    },
    async entrar() {
      const provedor = new GoogleAuthProvider();
      provedor.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth, provedor);
      usuario = cred.user;
      if (dono(usuario.email, emailDono)) {
        const snap = await getDoc(ref);
        if (!snap.exists()) await setDoc(ref, fatiaNuvem(estado));
      }
      avisar();
      return { ok: true, email: usuario.email, podeEscrever: dono(usuario.email, emailDono) };
    },
    async sair() {
      await signOut(auth);
      usuario = null;
      avisar();
    }
  };
}

export async function abrirArmazenamento() {
  const local = criarLocal();
  if (!firebaseConfigurado()) return local;
  try {
    return await criarFirebase(local);
  } catch (erro) {
    console.warn("Firebase indisponível, seguindo neste navegador.", erro);
    local.aviso = "Não foi possível conectar ao Firebase. Os dados continuam neste navegador.";
    return local;
  }
}

export function exportarBackup(estado) {
  return {
    versao: 2,
    exportadoEm: new Date().toISOString(),
    registros: estado.registros || {},
    personalizados: estado.personalizados || {},
    canais: comSbs(estado.canais),
    canaisSel: estado.canaisSel || [],
    anoAtivo: estado.anoAtivo || "",
    tema: normalizarTema(estado.tema)
  };
}

export function importarBackup(bruto) {
  if (!bruto || typeof bruto !== "object") {
    throw new Error("O arquivo não é um backup reconhecível.");
  }
  if (!bruto.registros && !bruto.personalizados && !bruto.canais) {
    throw new Error("O JSON não tem registros, provas personalizadas nem canais.");
  }
  return sanitizar(bruto);
}