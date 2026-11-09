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

- Perfis por etapa: Giro 21/21 em imagem oficial, Tour 21/21 em imagem oficial, Vuelta 21/21. Mapas do percurso: Giro não publica um por etapa, Tour 21/21 em imagem oficial, Vuelta não publica um por etapa. Não há GPX do Tour, então não há mapa interativo. Cada perfil do Giro é a imagem da aba de altimetria (`.js-tab-info-altrimetria`) na página oficial da etapa, copiada em JPEG local e ligada à página e ao arquivo estático de origem. Não há série numérica e o desenho não foi convertido em pontos. O desnível é o valor “Altitude Gain” dessa ficha, não uma medida do gráfico. A distância do card continua a do regulamento de 4 de maio de 2026. A página Roadbook do Giro, em 9 de novembro de 2026, já descreve a edição seguinte e foi deixada de lado. As brochuras de hospitalidade têm a planimetria geral, não o perfil de cada dia.
- Giro: distâncias, tipos, cidades, sprints e subidas categorizadas saem do regulamento de 4 de maio de 2026. A etapa 10 fica em 42 km porque a soma do regulamento fecha em 3.468,0; uma apresentação anterior dizia 40,2 e o eixo do perfil também marca 42,0. A etapa 6 permanece em 141 km (eixo 141,0; a ficha da página diz 142 km). A etapa 7 permanece em 244 km (ficha e eixo dizem 245 km; o arquivo do perfil traz 14 de maio de 2026 no nome). A etapa 8 permanece em 156 km (ficha 156 km; eixo 157,0). A etapa 19 usa Feltre–Alleghe, como a brochura de fevereiro; a tabela de quilometragem veio com as colunas trocadas. O total de 3.459,2 km e 49.150 m das brochuras de hospitalidade não foi aplicado.
- Tour: as 21 etapas têm origem, destino e distância. As três primeiras usam a página do Grand Départ; as outras usam o dossiê de 22 de outubro de 2025, marcado como total antes da homologação. A soma do card dá 3.320 km. O folheto de 24 de junho de 2026 publica 3.320,7 km e 53.950 m no total; o dossiê publica 54.450 m. O desnível só entra no card quando o dossiê o dá para aquela etapa. Perfis e mapas: 21/21, imagens oficiais das páginas `letour.fr/fr/etape-N` guardadas no Internet Archive entre novembro de 2025 e julho de 2026, conferidas pelo título «Tour de France 2026» e pelas cidades. O arquivo continua em `img.aso.fr`. A distância do card não foi trocada pela da página. A etapa 1 tem cabeçalho de 19 km e eixo de 19,6 km. A etapa 8 tem cabeçalho de 182 km e eixo de 180,4 km. A etapa 9 usa a captura de 11 de julho (185,5 km), não a de 20 de julho (154,6 km). A etapa 11 só tinha desenho na captura de 15 de julho, dia da etapa. A etapa 21 usa a captura de 6 de julho (133 km), não a de 26 de julho (88,7 km, mapa de urgência). As páginas ao vivo em 9 de novembro de 2026 já eram 2027 e não foram usadas. Não há GPX. Nenhum desenho foi fabricado. Camisas amarela, verde, bolinhas vermelhas e branca estão no dossiê; o barema numérico e a prioridade entre camisas não.
- Vuelta: a tabela do site continua a fonte da distância do card (soma 3.231,9 km, anúncio de 3.275 km). O regulamento particular da 81.ª edição confirma camisas, pontos, jovem nascido desde 1º de janeiro de 2001 e a soma dos três melhores tempos por equipe. Os 21 perfis são recortes do roadbook de 16 de dezembro de 2025. O eixo desses desenhos não substitui o km do card. As etapas 3, 15 e 21 têm aviso próprio porque as três fontes divergem.
- Troféus: o Giro usa o Trofeo Senza Fine (Commons, CC BY 2.0, 2012, sem pessoa). O Tour usa a foto de estúdio das taças de cristal de 2026 publicada pela Škoda Auto em 2 de julho de 2026, antes da largada, sem pessoa; o rodapé do Storyboard autoriza o uso editorial em imprensa e internet. A Vuelta mostra uma ilustração da peça em V preta, com faixas vermelhas e bordas douradas sobre base preta, fundo vermelho e amarelo com oliveiras, e a legenda «Ilustração inspirada no troféu da Vuelta (não é foto oficial).» Não há crédito nem licença de terceiros nessa figura. A foto de produto da Sustain Awards continua fora, porque o aviso legal proíbe a reprodução pública sem autorização. As fotos de pódio da agência Sprint e do Commons mostram quem subiu ao lugar e ficaram de fora.
- Acompanhamento: a distância do card é o que falta até a chegada. Um campo aceita o número restante da televisão e devolve o que já foi percorrido, só dentro desse total. Se o eixo do desenho, a ficha ou o cabeçalho da página divergem, a conta sai separada e não se mistura. No Tour, a etapa 8 usa 180,4 km no eixo e 182 km no card. Subidas e sprints sem quilómetro na fonte continuam sem número. A imagem do perfil não é invertida nem recebe régua.
- Camisas: no Giro, nomes, ordem de prioridade, idade do jovem (nascidos a partir de 1º de janeiro de 2001) e tabelas de pontos estão no regulamento. No Tour e na Vuelta a página de regras consultada não cravava a edição 2026, então os rótulos clássicos ficam com a marca “a confirmar” e sem pontuação inventada.
- Equipes: o painel fica desligado nas três, mesmo onde o regulamento do Giro descreve a conta.

## Testes

Na pasta `ciclismo`, depois de `npm install`:

```bash
npm test
npm run test:regras
```

`npm test` cobre o modelo, a página (rede e DOM sem snapshot), o percurso e o pipeline. `npm run test:regras` sobe o emulador com `firebase.emulador.json`. Esse arquivo não publica nada: não rode `firebase deploy` a partir dele. Os atletas dos testes chamam-se “Atleta NN” e estão marcados como sintéticos; o site recusa desenhar esse tipo de snapshot.
