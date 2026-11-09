# Grandes Voltas — o que falta para publicar

Nada disto foi implantado. O Firebase real não foi autenticado, as regras não foram publicadas e não há snapshot no banco. O site abre só o percurso. `data/grandes-voltas/acesso.json` fica com `regrasComprovadas: false` até alguém com acesso ao console conferir as regras de produção e repetir o teste do emulador contra esse texto completo.

## Calendário confirmado

No `data/2026.json` do site:

| Prova | id | início | fim | etapas |
|---|---|---|---|---|
| Giro d'Italia | `b7` | 2026-05-08 | 2026-05-31 | 21 |
| Tour de France | `b10` | 2026-07-04 | 2026-07-26 | 21 |
| Volta à Espanha | `b12` | 2026-08-22 | 2026-09-13 | 21 |

Os três são masculinos. Feminino e outras edições ficam de fora. Milão–Sanremo não entra neste trabalho.

## Onde cada coisa mora

- Percurso público: `data/grandes-voltas/2026/{giro,tour,vuelta}.json`
- Liberações vazias, só booleanos: `data/grandes-voltas/liberacoes.json`
- Trava do cliente: `data/grandes-voltas/acesso.json`
- Página: `grande-volta.html#/{slug}/{ano}` e `#/{slug}/{ano}/etapa/{n}`
- Regras propostas, não publicadas: `firestore.rules`
- Pipeline local: `tools/grandes_voltas/pipeline.py`

Quando a trava for aberta de propósito, o snapshot fica em `ciclismo_gv_snapshots/{ano}_{provaId}/apos/{n}`. A lista do que está liberado fica em `ciclismo_gv/{ano}_{provaId}` com valores só `true`. O documento `ciclismo/temporada` não muda de formato: canal, estrelas, assistida e pódio legado continuam lá. O pódio da prova inteira só volta a aparecer no card se `provaCompleta` for true.

## Auditoria das regras conhecidas

O repositório não tem o arquivo de regras que está no ar. O que está escrito no README é só isto:

```
match /ciclismo/{documento} {
  allow read: if true;
  allow write: if request.auth.token.email == "rafffahell@gmail.com";
}
```

Esse match cobre documentos da coleção `ciclismo`, não subcoleções e não outra coleção na raiz. Por isso ele não abre `ciclismo_gv_snapshots`. O teste do emulador prova isso com as duas regras no mesmo arquivo: um anônimo lê `ciclismo/temporada` e não lê o snapshot da etapa que não está na lista.

Matches da proposta:

| Match | Leitura | Escrita |
|---|---|---|
| `/ciclismo/{documento}` | pública, como já era | só o dono, como já era |
| `/ciclismo_gv/{provaAno}` | pública; o documento só aceita booleanos | dono; `provaCompleta` exige a chave `21`; apagar é negado |
| `/ciclismo_gv_snapshots/{provaAno}/apos/{etapa}` | `get` só se essa etapa estiver `true`; `list` negado | criar uma vez, se `imutavel` e o número bater; atualizar e apagar negados |
| `/ciclismo_gv_auditoria/{id}` | só o dono | só o dono |

Não há `match /{document=**}`. Não foi acrescentada leitura pública em cima de `ciclismo/temporada`.

O que não deu para auditar: qualquer outra regra que já exista no projeto e não esteja no README. Um `allow read: if true` recursivo, se existir lá, anula o `get` restrito, porque no Firestore basta um match permitir. Também há outras coleções no mesmo projeto (o painel patrimonial grava `patrimonio/rafael`). Substituir o arquivo inteiro do console por `firestore.rules` apagaria essas regras. Na hora de publicar, o caminho é acrescentar os matches novos ao texto que já está no console, sem remover os que não estão neste arquivo.

Até essa conferência, o cliente não pede snapshot. Não há botão na página para liberar etapa.

## Pipeline

O comando padrão só valida e imprime o plano:

```bash
python3 tools/grandes_voltas/pipeline.py --payload pedido.json
```

`--aplicar` exige `--destino`, um JSON de confirmação direta da mesma etapa (`confirmacaoDireta: true`, mesma `idempotencyKey`) e não grava no Firebase. A mesma chave, com o mesmo conteúdo, vira no-op. Conteúdo diferente não sobrescreve. O pedido não pode listar várias etapas. Prova completa é outro passo (`--prova-completa` mais `provaCompleta: true` na confirmação) e só na etapa 21; não marca as outras. Se `autorizacaoTexto` vier no pedido, é descartado e não entra no arquivo nem na auditoria. Se alguma variável de credencial estiver definida, o script para.

Não há agendamento. Quem for preencher uma etapa autorizada manda um snapshot já pesquisado; este script só confere o formato. A gravação no banco continua manual, depois da confirmação, e fora deste repositório enquanto `regrasComprovadas` for false.

## Limites conhecidos do percurso

- Giro: distâncias, tipos, cidades, sprints e subidas categorizadas saem do regulamento de 4 de maio de 2026. Não há série de altitude. A etapa 10 fica em 42 km porque a soma do regulamento fecha em 3.468,0; uma apresentação anterior dizia 40,2. A etapa 19 usa Feltre–Alleghe, como a brochura de fevereiro; a tabela de quilometragem veio com as colunas trocadas.
- Tour: as fichas `stage-0N` do site oficial já descreviam a edição seguinte e foram ignoradas. Km e cidades completos só nas etapas 1 a 3 (página do Grand Départ 2026) e no contra-relógio de Évian (26 km, no resumo do percurso 2026). O resto fica vazio onde essa página não numera. O desnível de 54.450 m citado no resumo está rotulado como 2025 e não foi usado. Orcières-Merlette e as duas chegadas no Alpe d'Huez não têm número de etapa nesse resumo, então não foram atribuídas.
- Vuelta: a tabela oficial traz tipo, data, cidades e km. A soma dessas distâncias é 3.231,9 km; o texto da mesma página anuncia 3.275 km. Não foi feito ajuste. Sem perfil numérico.
- Camisas: no Giro, nomes, ordem de prioridade, idade do jovem (nascidos a partir de 1º de janeiro de 2001) e tabelas de pontos estão no regulamento. No Tour e na Vuelta a página de regras consultada não cravava a edição 2026, então os rótulos clássicos ficam com a marca “a confirmar” e sem pontuação inventada.
- Equipes: o painel fica desligado nas três, mesmo onde o regulamento do Giro descreve a conta.

## Testes

Na pasta `ciclismo`, depois de `npm install`:

```bash
npm test
npm run test:regras
```

`npm test` cobre o modelo, a página (rede e DOM sem snapshot), o percurso e o pipeline. `npm run test:regras` sobe o emulador com `firebase.emulador.json`. Esse arquivo não publica nada: não rode `firebase deploy` a partir dele. Os atletas dos testes chamam-se “Atleta NN” e estão marcados como sintéticos; o site recusa desenhar esse tipo de snapshot.
