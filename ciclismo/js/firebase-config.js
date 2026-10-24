// Chaves públicas do app web (podem ficar no repositório).
// A escrita no Firestore segue as regras do banco: só rafffahell@gmail.com.
// Sem measurementId: a página não carrega o Analytics.
// Se estas chaves faltarem ou o Firebase não responder, a página usa só este navegador.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBX96KFoYDjsJwQmc6ADiMHkSpowidGOjc",
  authDomain: "programas-ia.firebaseapp.com",
  projectId: "programas-ia",
  storageBucket: "programas-ia.firebasestorage.app",
  messagingSenderId: "313873101712",
  appId: "1:313873101712:web:bbb55c7923f1c57fbb7915"
};

// Única conta que pode gravar. Visitantes autenticados com outro e-mail só leem.
window.FIREBASE_OWNER_EMAIL = "rafffahell@gmail.com";
