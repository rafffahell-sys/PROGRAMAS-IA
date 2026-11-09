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

No repositório, os `allow` que existem são só os deste arquivo: a leitura pública de `ciclismo/{documento}` (a do README) e os quatro matches novos. O emulador carrega o arquivo inteiro, não um recorte. Um documento de liberação com campo a mais, ou com valor que não é `true`, não é lido. O snapshot da etapa correspondente também não. Não há `match /{document=**}` neste arquivo.

O que não está no repositório continua fora do teste: o texto que já está publicado no console. O painel patrimonial grava `patrimonio/rafael`, mas a regra dessa coleção não aparece no código. Um `allow read: if true` recursivo, se existir só no console, anula o `get` restrito, porque no Firestore basta um match permitir. Por isso `acesso.json` segue com `regrasComprovadas: false` e a página não pede snapshot. Substituir o arquivo inteiro do console por `firestore.rules` apagaria regras que não estão aqui. Na hora de publicar, o caminho é acrescentar os matches novos ao texto do console, sem remover os outros, e só então mudar o flag.

Até essa conferência, o cliente não pede snapshot. Não há botão na página para liberar etapa.

## Pipeline

O comando padrão só valida e imprime o plano:

```bash
python3 tools/grandes_voltas/pipeline.py --payload pedido.json
```

`--aplicar` exige `--destino`, um JSON de confirmação direta da mesma etapa (`confirmacaoDireta: true`, mesma `idempotencyKey`) e não grava no Firebase. A mesma chave, com o mesmo conteúdo, vira no-op. Conteúdo diferente não sobrescreve. O pedido não pode listar várias etapas. Prova completa é outro passo (`--prova-completa` mais `provaCompleta: true` na confirmação) e só na etapa 21; não marca as outras. Se `autorizacaoTexto` vier no pedido, é descartado e não entra no arquivo nem na auditoria. Se alguma variável de credencial estiver definida, o script para.

Não há agendamento. O fluxo, quando Rafael confirmar uma etapa, é este: o ESPORTE pode entregar o snapshot e o resumo já pesquisados e conferidos na fonte oficial daquela etapa. O SITE só valida o formato e grava essa etapa. Não recalcula tempo, ponto nem posição. Copia a classificação oficial. As tabelas do Giro estão no config porque o regulamento de 4 de maio de 2026 as confirma; servem de referência da edição, não de conta automática. Tour e Vuelta seguem com `oficialConfirmado: false`. Um snapshot dessas provas que marque as regras como confirmadas é recusado.

O resumo mora dentro do snapshot: prova, ano, número da etapa, texto em português, momentos e o contexto da classificação só até o fim dessa etapa. Se a coleta não trouxe resumo, o campo fica `ausente: true` e a tela da etapa liberada diz que nada foi escrito no lugar. Etapa bloqueada não recebe esse texto. A mesma chave com outro resumo não sobrescreve.

A gravação no banco continua manual, depois da confirmação, e fora deste repositório enquanto `regrasComprovadas` for false. Com o flag falso, ter o contrato pronto não significa que o preenchimento real já funcione.

A análise pré-etapa é outro documento, `ciclismo_gv_analises/{ano}_{provaId}/pre/{n}`. Para N maior que 1, a leitura no emulador só passa se a etapa N−1 da mesma prova e do mesmo ano estiver em `true`. Liberar 1 e 5 não abre a análise da 3 nem da 5. A comparação de classificação continua usando a última etapa liberada, que pode não ser a imediatamente anterior. A etapa 1 não tem documento: a página mostra só uma introdução sem resultado. Não há análise real gravada.

Os favoritos pré-largada do Giro são uma lista estática pedida à parte, em `data/grandes-voltas/2026/giro-favoritos-prelargada.json`. Não são snapshot, não autorizam etapa e não valem para Tour nem Vuelta.

## Limites conhecidos do percurso

- Perfis por etapa: Giro 0/21, Tour 0/21, Vuelta 0/21. Não há série numérica nem imagem oficial de altimetria de etapa no material público que ainda identifica 2026. A página Roadbook do Giro, em 9 de novembro de 2026, já descreve a edição seguinte e foi deixada de lado. O regulamento só remete à Guida Tecnica; o PDF obtido é o texto do regulamento. As brochuras de hospitalidade têm a planimetria geral, não o perfil de cada dia. Não foi desenhada linha a partir da categoria da etapa.
- Giro: distâncias, tipos, cidades, sprints e subidas categorizadas saem do regulamento de 4 de maio de 2026. Não há série de altitude. A etapa 10 fica em 42 km porque a soma do regulamento fecha em 3.468,0; uma apresentação anterior dizia 40,2. A etapa 19 usa Feltre–Alleghe, como a brochura de fevereiro; a tabela de quilometragem veio com as colunas trocadas. O total de 3.459,2 km e 49.150 m das brochuras de hospitalidade não foi aplicado.
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
