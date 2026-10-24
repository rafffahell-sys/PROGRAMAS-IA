# Ciclismo

Página para acompanhar as provas de ciclismo profissional que eu assisto na televisão: vencedor, canal, estrelas e o que ficou da transmissão. Fica em [rafffahell.com.br/ciclismo](https://rafffahell.com.br/ciclismo/).

A temporada aberta por padrão é 2027 (`data/2027.json`), porque a de 2026 já terminou. 2026 continua no seletor, como histórico. A ordem de cada arquivo é a data de início. O layout não guarda essa lista: o `manifest.json` diz quais anos existem e qual abre primeiro. Quem já tinha um ano salvo neste navegador continua nele. O registro de cada prova leva o ano na chave (`2027_c1` não mistura com `2026_b1`).

## O que fica salvo

Enquanto `js/firebase-config.js` estiver com a `apiKey` vazia, tudo fica neste navegador (localStorage). Os botões **Exportar** e **Importar** geram e leem um backup em JSON.

Se você já usava o esboço antigo, na primeira visita a página lê sozinha estas chaves:

- `ciclismo_registros`
- `ciclismo_personalizados`
- `ciclismo_canais`
- `ciclismo_canaisSel`
- `ciclismo_anoAtivo`
- `ciclismo_temaAtivo`

Prova repetida do esboço acompanha o registro que ficou (por exemplo o segundo Tour Down Under vai para o id que permaneceu).

## Adicionar outro ano

1. Crie `data/2028.json` no mesmo formato de `data/2027.json`. O campo `provas` precisa estar em ordem de `inicio`. Prova sem data confirmada fica de fora.
2. Inclua o ano em `data/manifest.json` e, se for o caso, troque `padrao`.
3. Recarregue a página. O seletor passa a mostrar o ano novo. Os registros de cada ano continuam separados.

`tools/build_calendario_2026.py` regenera só 2026. `tools/build_calendario_2027.py` regenera só 2027. Não invente data: confira no calendário UCI (ou no site da prova) antes de acrescentar.

## Ligar o Firebase

A nuvem é o Firestore, com login do Google. Só o e-mail `rafffahell@gmail.com` grava. Qualquer visita consegue ler.

1. Abra o [console do Firebase](https://console.firebase.google.com/) e crie um projeto, ou escolha um que já exista.
2. Em **Build → Authentication → Sign-in method**, ative o provedor **Google**.
3. Em **Authentication → Settings → Authorized domains**, inclua `rafffahell.com.br`. Se a página também abrir pelo GitHub, inclua o domínio `github.io` do repositório.
4. Em **Build → Firestore Database**, crie o banco em modo de produção.
5. Em **Firestore → Rules**, troque as regras por estas e publique:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ciclismo/{documento} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email == "rafffahell@gmail.com";
    }
  }
}
```

A leitura é pública. A escrita só passa com o login dessa conta. O documento usado pela página é `ciclismo/temporada`.

6. Em **Project settings → Your apps**, adicione um app Web e copie a configuração.
7. Cole os valores em `js/firebase-config.js`. O e-mail do dono já está no arquivo; não precisa mudar.
8. Publique o site e recarregue `https://rafffahell.com.br/ciclismo/`. O botão **Entrar com Google** aparece. Entre com `rafffahell@gmail.com`.

O que sobe para a nuvem: registros, provas criadas por você, canais, o ano aberto e a camisa (amarela, rosa, vermelha ou dia). O backup JSON leva a mesma coisa. Se o Firebase não responder, a página continua neste navegador e avisa.
