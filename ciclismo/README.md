# Ciclismo

Página para acompanhar as provas de ciclismo profissional que eu assisto na televisão: vencedor, canal, estrelas e o que ficou da transmissão. Fica em [rafffahell.com.br/ciclismo](https://rafffahell.com.br/ciclismo/).

A temporada aberta por padrão é 2027 (`data/2027.json`), porque a de 2026 já terminou. 2026 continua no seletor, como histórico. A ordem de cada arquivo é a data de início. O layout não guarda essa lista: o `manifest.json` diz quais anos existem e qual abre primeiro. Quem já tinha um ano salvo neste navegador continua nele. O registro de cada prova leva o ano na chave (`2027_c1` não mistura com `2026_b1`).

## O que fica salvo

A nuvem é o Firestore, documento `ciclismo/temporada`. Sem login a página só lê. O botão **Entrar com Google** grava apenas com `rafffahell@gmail.com`. **Exportar** e **Importar** continuam como backup JSON. Se o Firebase não responder, a página segue neste navegador e avisa.

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

## Firebase

A config pública do app web já está em `js/firebase-config.js`. A nuvem é o Firestore, com login do Google. Só o e-mail `rafffahell@gmail.com` grava. Qualquer visita consegue ler. O SDK é o modular, carregado do CDN `gstatic`, sem Analytics.

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

A leitura é pública. A escrita só passa com o login dessa conta. O documento usado pela página é `ciclismo/temporada`. As chaves do app web já estão em `js/firebase-config.js`. No site publicado, o botão **Entrar com Google** aparece para quem não está logado. Entre com `rafffahell@gmail.com` para gravar. Na primeira entrada, se `ciclismo/temporada` ainda não existir, o que está neste navegador sobe para a nuvem.

O que sobe para a nuvem: registros, provas criadas por você, canais, o ano aberto e a camisa (amarela, rosa, vermelha ou dia). O backup JSON leva a mesma coisa. Se o Firebase não responder, a página continua neste navegador e avisa.

## Grandes Voltas

Giro, Tour e Vuelta masculinos de 2026 abrem em `grande-volta.html#/giro/2026` (troque o slug por `tour` ou `vuelta`). Cada etapa tem endereço próprio, por exemplo `grande-volta.html#/giro/2026/etapa/1`. O card no calendário continua com canal, estrelas e o registro de assistida; o pódio da prova inteira fica oculto até a prova ser marcada completa.

Nenhuma etapa começa liberada. O percurso está em `data/grandes-voltas/`. Não há resultado nesse JSON. A leitura de um snapshot futuro depende de `data/grandes-voltas/acesso.json` (`regrasComprovadas`) e das regras propostas em `firestore.rules`, que ainda não foram publicadas. O passo a passo, a auditoria das regras e o que falta implantar estão em `docs/grandes-voltas-implantacao.md`.

Para regenerar só o percurso, sem mexer nas liberações:

```bash
python3 tools/grandes_voltas/percursos_2026.py
```

O pipeline de uma etapa autorizada é dry-run por omissão e não usa credencial:

```bash
python3 tools/grandes_voltas/pipeline.py --payload pedido.json
```
