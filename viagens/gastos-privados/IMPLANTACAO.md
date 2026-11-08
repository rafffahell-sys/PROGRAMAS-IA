# Gastos privados da viagem — proposta, ainda sem efeito no Firebase

A página do Uruguai consulta, depois do login Google, o caminho abaixo no projeto **programas-ia**. Este diretório **não publica** regras, **não grava** documentos e **não contém** valores, totais ou lançamentos da viagem.

A página não consegue ler as regras que estão no console. Entrar com Google não prova que outra conta esteja bloqueada.

## O que o repositório mostra hoje

- `ciclismo/js/firebase-config.js` define o app web público e `FIREBASE_OWNER_EMAIL = rafffahell@gmail.com`.
- `ciclismo/README.md` traz um exemplo de regras **só** para `ciclismo/{documento}`: leitura pública e escrita desse e-mail. Não há `firestore.rules` no repositório, então não dá para saber se esse texto foi publicado.
- `painel_patrimonial.html` lê e grava `patrimonio/rafael` no mesmo projeto, sem uma regra correspondente no repositório.
- Fora do ciclismo, o histórico conhecido destas regras é aberto. Uma regra nova específica **não fecha** um `allow` amplo: o Firestore junta os `allow` com **OU** e não tem `deny`.

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

## Regras propostas

O arquivo `firestore.rules` é a substituição inteira a revisar, não um trecho para colar por cima do que já está publicado.

1. `viagensPrivadas/{viagem}/lancamentos/{lancamento}`: leitura e escrita só com Google verificado de `rafffahell@gmail.com`.
2. `ciclismo/{documento}`: leitura pública e escrita desse mesmo e-mail, como no README do ciclismo. Fica fora do match amplo para a escrita não voltar a ser pública.
3. `/{colecao}/{caminho=**}`: leitura e escrita para as outras coleções, **exceto** nome igual a `viagensprivadas` ou `ciclismo` sem distinguir maiúsculas. É o que preserva `patrimonio` e apps que hoje dependem de regra aberta.

O teste do emulador cobre: anônimo negado no caminho privado; outra conta Google negada; proprietário permitido; e-mail do proprietário sem `email_verified` negado; documento pai negado; variante de maiúsculas negada; `ciclismo/temporada` continua legível e a escrita anônima nele continua negada; `patrimonio/rafael` e uma coleção sintética `outroApp` continuam legíveis e graváveis; um match `/{document=**} { allow read, write: if true }` junto de uma regra específica ainda deixa o anônimo ler o caminho privado.

Os documentos do teste usam o campo `marcador`. Não são lançamentos.

## Passos manuais, fora deste PR

1. No console do projeto `programas-ia`, em Firestore → Rules, copiar as regras **publicadas**. Este repositório não fez isso.
2. Comparar com `firestore.rules`.
3. Se o que está publicado for **mais fechado** que o curinga deste arquivo, não publicar o arquivo inteiro. Acrescentar só o `match` de `viagensPrivadas` e repetir, uma a uma, as coleções que já funcionam, com o acesso que elas têm hoje. Conferir pelo menos `ciclismo` e `patrimonio`. Publicar o curinga nesse caso reabriria o resto do banco.
4. Se o que está publicado tiver `allow read, write: if true` num match amplo, ou for o modo de teste aberto, substituir o conjunto inteiro por este arquivo. Colar só a regra privada **não protege** os gastos.
5. Publicar no console, manualmente. Não há `firebase deploy` neste trabalho, e não há `.firebaserc` apontando para o projeto real. O `firebase.json` daqui só sobe o emulador local na porta 8088.
6. Se editar as regras, rodar de novo `npm test` nesta pasta.
7. No console, ou com um cliente autenticado, conferir a regra **já publicada**: anônimo não lê `viagensPrivadas/uruguai-2026-rafael-victoria-samar/lancamentos`; outra conta Google não lê; `rafffahell@gmail.com` lê; `ciclismo/temporada` segue legível; `patrimonio/rafael` segue com o acesso de antes. A página do Uruguai não faz essa prova.
8. Em Authentication → Sign-in method, o provedor Google precisa continuar ativo. Em Authorized domains, o domínio da página (`rafffahell.com.br` e, se abrir por ele, o `github.io`) precisa estar autorizado, como no ciclismo.
9. Só depois dos passos 5 e 7, importar os gastos reais direto no Firestore, fora do git, no caminho acima, sem observação e sem dado de cartão.
10. Abrir a página, entrar com a conta do proprietário, conferir, sair e ver a tabela vazia. Trocar de conta também apaga a tabela antes de qualquer leitura nova.

Enquanto o passo 7 não for feito, a caixa de gastos avisa que a leitura aceita nesta sessão não confirma o arquivo publicado.
