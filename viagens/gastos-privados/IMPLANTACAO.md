# Gastos privados da viagem — proposta, ainda sem efeito no Firebase

A página do Uruguai consulta, depois do login Google, o caminho abaixo no projeto **programas-ia**. Este diretório **não publica** regras, **não grava** documentos e **não contém** valores, totais ou lançamentos da viagem.

A página não consegue ler as regras que estão no console. Entrar com Google não prova que outra conta esteja bloqueada.

## O que o repositório mostra hoje

- `ciclismo/js/firebase-config.js` define o app web público e `FIREBASE_OWNER_EMAIL = rafffahell@gmail.com`.
- `ciclismo/README.md` traz um exemplo de regras **só** para `ciclismo/{documento}`: leitura pública e escrita desse e-mail. Não há `firestore.rules` no repositório, então não dá para saber se esse texto foi publicado.
- `painel_patrimonial.html` lê e grava `patrimonio/rafael` no mesmo projeto, sem uma regra correspondente no repositório.
- Fora do ciclismo, o que se sabe é que as regras já foram abertas. Isso não é licença para republicar um curinga. Uma regra nova específica **não fecha** um `allow` amplo: o Firestore junta os `allow` com **OU** e não tem `deny`. Um curinga `allow read: if request.auth != null` continua entregando o caminho privado a outras contas.

## Caminho

```
viagensPrivadas/uruguai-2026-rafael-victoria-samar/lancamentos/{id}
```

- `{id}` é uma string opaca, sem barra e sem dado de cartão.
- Não criar o documento pai `viagensPrivadas/uruguai-2026-rafael-victoria-samar`. A proposta não dá `allow` para ele, então ele não serve de índice.
- A mesma conta pode ler qualquer viagem dentro de `viagensPrivadas/*/lancamentos`. Não há lista separada por pessoa. Não coloque gasto de outra pessoa nesse caminho.
- Não há `firestore.indexes.json`. A página baixa a subcoleção e ordena no navegador.

Variantes de maiúsculas (`ViagensPrivadas`, `viagensprivadas`) ficam de fora do match amplo e não têm allow próprio: ninguém lê nem grava.

## Documento

A página só aceita estes campos. O resto é ignorado e não aparece na tabela.

| Campo | Tipo |
| --- | --- |
| `data` | string `YYYY-MM-DD`, data de calendário |
| `local` | string, 1 a 160 caracteres depois do trim |
| `categoria` | string, 1 a 80 caracteres depois do trim |
| `moedaOriginal` | string, três letras maiúsculas (ISO 4217) |
| `valorOriginalCentavos` | inteiro seguro, unidade mínima com 2 casas; pode ser negativo |
| `valorBrlCentavos` | inteiro seguro, centavos de real; pode ser negativo |

Número com fração ou texto no lugar do inteiro faz a linha inteira ficar de fora. O total é a soma de `valorBrlCentavos` das linhas aceitas, ainda em inteiro, mostrada em pt-BR. Não gravar observação, cartão, final, cvv, parcelas ou comprovante.

## Exemplo de regras, não o padrão de publicação

O caminho seguro é copiar as regras que estão no console e adaptá-las. O arquivo `firestore.rules` **não** é o modelo para colar por cima de um banco que pareça fechado. O histórico de regras abertas fora do ciclismo não autoriza publicar esse curinga.

Ele é um exemplo do legado aberto: outras coleções liberadas, `ciclismo` como no README, e o caminho privado de fora desse curinga. Só cabe publicá-lo se o texto do console for conferido e for idêntico a esse legado. Se diferir, edite as regras efetivas.

No exemplo, o caminho privado exige as duas coisas:

- e-mail verificado `rafffahell@gmail.com`
- `request.auth.token.firebase.sign_in_provider == "google.com"`

A escrita de `ciclismo/{documento}` continua só com o e-mail verificado do proprietário, sem exigir o provedor. A leitura de `ciclismo` continua pública. Isso evita mudar o contrato do ciclismo.

Um `allow` novo no caminho privado não anula outro `allow` que também case com ele. As regras são OU e não há `deny`. Vale em especial para um curinga `allow read: if request.auth != null`: qualquer conta logada, inclusive outro Google, continuaria lendo os gastos. Acrescentar só o match privado em cima de um conjunto "mais fechado" é inseguro enquanto existir match sobreposto.

O teste do emulador, com marcador sintético e sem lançamento, cobre: anônimo negado; outra conta Google negada; proprietário com Google lê no servidor (`getDocsFromServer`, `fromCache == false`); o mesmo e-mail verificado com provedor `password` negado no privado, enquanto a escrita em `ciclismo/temporada` segue permitida; e-mail sem `email_verified` negado; documento pai e variante de maiúsculas negados; `patrimonio/rafael` e `outroApp` seguem acessíveis neste exemplo; `allow read, write: if true` num curinga ainda deixa o anônimo ler; `allow read, write: if request.auth != null` num curinga ainda deixa outra conta Google ler.

## Passos manuais, fora deste PR

1. No console do projeto `programas-ia`, em Firestore → Rules, copiar o texto integral das regras **publicadas**. Este repositório não fez isso.
2. Listar cada `match`. Marcar todo match cujo caminho possa alcançar `viagensPrivadas/{viagem}/lancamentos/{id}` ou a mesma coleção com outra capitalização. Entram `/{document=**}`, `/{colecao}/{caminho=**}` e qualquer raiz equivalente.
3. Em **todos** os matches sobrepostos, excluir ou restringir o caminho privado, mesmo que o conjunto pareça fechado. Não basta acrescentar o match do proprietário. Um curinga `allow read: if request.auth != null` continua expondo os gastos a outras contas.
4. Incluir o match privado com e-mail verificado do proprietário **e** `sign_in_provider == "google.com"`.
5. Preservar as permissões que já existem, sem ampliá-las. O que hoje está negado continua negado. Não usar o curinga aberto deste exemplo como padrão por causa do histórico.
6. Publicar o arquivo `firestore.rules` somente se o console tiver sido conferido e for idêntico a esse legado aberto, e a diferença for a exclusão e o match privado que o arquivo já traz. Em qualquer outro caso, adaptar as regras efetivas e publicar essa adaptação.
7. Publicar no console, à mão. Não há `firebase deploy` neste trabalho, nem `.firebaserc` do projeto real. O `firebase.json` daqui só sobe o emulador local na porta 8088.
8. Se o exemplo for editado, rodar de novo `npm test` nesta pasta.
9. Na regra já publicada, conferir: anônimo negado; outra conta Google negada; o mesmo e-mail verificado com outro provedor negado; o proprietário entrando pelo Google permitido; `ciclismo/temporada` e `patrimonio/rafael` com o mesmo acesso de antes, sem ampliação. A página do Uruguai não faz essa prova.
10. Em Authentication → Sign-in method, o provedor Google precisa continuar ativo. Em Authorized domains, o domínio da página (`rafffahell.com.br` e, se abrir por ele, o `github.io`) precisa estar autorizado, como no ciclismo.
11. Só depois dos passos 6 e 9, importar os gastos reais direto no Firestore, fora do git, no caminho acima, sem observação e sem dado de cartão.
12. Abrir a página, entrar com Google, conferir, sair e ver a tabela vazia. Se o servidor não responder, a tabela fica vazia e a página diz que não mostra cópia guardada no navegador.

Enquanto o passo 9 não for feito, a caixa avisa que a leitura vinda do servidor nesta sessão não confirma o arquivo publicado.
