// Preencha com o app web do Firebase para ligar a nuvem.
// Enquanto apiKey estiver vazio, a página usa só este navegador
// (localStorage) e os botões Exportar / Importar.
// O passo a passo está em ciclismo/README.md.
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Única conta que pode gravar. Visitantes autenticados com outro e-mail só leem.
window.FIREBASE_OWNER_EMAIL = "rafffahell@gmail.com";