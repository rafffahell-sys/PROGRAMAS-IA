# FONTES — perfis Tour 2026 e Vuelta 2026 no formato Giro

Gerado em 22/11/2026 (horário de Brasília). Só dados de percurso (km, altitudes, nomes, categorias); nenhum resultado.

## Tour de France 2026 — perfis oficiais ASO (JPG 960×576 publicados em letour.fr, os mesmos do site em img/perfis/tour-2026/)

Método: nomes/km/altitudes/categorias transcritos à mão de cada imagem (`tour2026/especificacao.py`; OCR só como rascunho, tudo conferido no zoom).
Linha: digitalização por coluna de pixel do amarelo (`digitalizar_tour.py`); X por reta (traços rotulados quando ≥ 8 casam, senão bordas do quadro); Y por reta nas altitudes oficiais, e a linha corrigida entre âncoras para passar exatamente nos valores rotulados. Largada/chegada com as altitudes oficiais.

| Etapa | Fonte (asset ASO) | m/px | traços X casados | maior resíduo de âncora antes da correção (m) |
|---|---|---|---|---|
| 1 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/tdf26-profils-web-fr-e-tape-1/71083/0:0,1004:602-960-0-90/f71aa | 2.84 | 2 | 20 |
| 2 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/2-tdf26-profils-web-fr/70964/0:0,1004:602-960-0-90/cf268 | 8.64 | 21 | 24 |
| 3 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/3-tdf26-profils-web-fr/70962/0:0,1004:602-960-0-90/55d8b | 25.63 | 1 | 36 |
| 4 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/4-tdf26-profils-web-fr/70960/0:0,1004:602-960-0-90/6aaac | 11.46 | 1 | 23 |
| 5 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/5-tdf26-profils-web-fr/70961/0:0,1004:602-960-0-90/9c154 | 8.6 | 0 | 18 |
| 6 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/6-tdf26-profils-web-fr/70968/0:0,1004:602-960-0-90/c69fa | 25.94 | 4 | 14 |
| 7 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/7-tdf26-profils-web-fr/70963/0:0,1004:602-960-0-90/5d682 | 6.01 | 13 | 12 |
| 8 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/8-tdf26-profils-web-fr/70970/0:0,1004:602-960-0-90/11298 | 9.66 | 13 | 21 |
| 9 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/9-tdf26-profils-web-fr/74045/0:0,1005:604-960-0-90/2e6f0 | 8.68 | 0 | 17 |
| 10 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/10-tdf26-profils-web-fr/70969/0:0,1004:602-960-0-90/afe2a | 17.75 | 0 | 39 |
| 11 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/11-tdf26-profils-web-fr/74053/0:0,1005:603-960-0-90/6b4e7 | 9.56 | 0 | 8 |
| 12 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/12-tdf26-profils-web-fr/70971/0:0,1004:602-960-0-90/413dc | 9.09 | 0 | 25 |
| 13 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/13-tdf26-profils-web-fr/70973/0:0,1004:602-960-0-90/bf2e6 | 8.68 | 0 | 25 |
| 14 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/14-tdf26-profils-web-fr/70972/0:0,1004:602-960-0-90/2c309 | 16.87 | 2 | 34 |
| 15 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/15-tdf26-profils-web-fr/70976/0:0,1004:602-960-0-90/7345e | 17.68 | 0 | 44 |
| 16 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/16-tdf26-profils-web-fr/70974/0:0,1004:602-960-0-90/e8ad8 | 8.34 | 0 | 13 |
| 17 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/17-tdf26-profils-web-fr/70979/0:0,1004:602-960-0-90/e7e70 | 16.84 | 6 | 21 |
| 18 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/18-tdf26-profils-web-fr/70977/0:0,1004:602-960-0-90/970be | 25.84 | 8 | 45 |
| 19 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/19-tdf26-profils-web-fr/70975/0:0,1004:602-960-0-90/5575d | 26.63 | 0 | 59 |
| 20 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/20-tdf26-profils-web-fr/70978/0:0,1004:602-960-0-90/a780c | 26.92 | 0 | 50 |
| 21 | https://img.aso.fr/core_app/img-cycling-tdf-jpg/tdf26-profils-web-fr-e-tape-21/71082/0:0,1004:602-960-0-90/f1fe2 | 6.05 | 11 | 18 |

Observações Tour:
- Resolução da fonte: ~6–27 m por pixel na vertical (etapas de montanha ≈ 25 m/px). Entre os pontos rotulados a forma da linha herda essa precisão.
- Etapas 1 e 16 (contrarrelógios): pontos de cronometragem do perfil oficial marcados com o ícone de cronômetro (1: km 5,1 / 10,5 / 15,9; 16: km 4,8 / 9,7 / 18,1). Na 16 o cronômetro do km 9,7 fica acima do GPM, como no original.
- Etapa 1: subida final de 800 m a 7% sem categoria (ícone de montanha sem número); a Côte de Montjuïc (1,1 km a 5,1%) não tem bandeira de categoria no original e ficou como ponto comum.
- Etapa 21: as três passagens da Côte de la Butte Montmartre trazem (1 km a 6,5%) no original; repetido nas três.
- Etapa 2: a Côte du Château de Montjuïc traz extensão/inclinação só na 1ª passagem (como no original).
- Departamentos/províncias: texto colocado na posição x em que aparece no original, sem traços de divisa (o original não marca o km da divisa).
- Anotações em francês traduzidas (près → perto, 1er passage sur la ligne d'arrivée → 1ª passagem na linha de chegada, entrée → entrada).
- Divergências internas da fonte: nenhuma âncora precisou ser descartada (todas com resíduo ≤ 60 m antes da correção).

## La Vuelta 2026 — livro de rota oficial (PDF vetorial)

Fonte: https://storage-aso.lequipe.fr/ASO/cycling_vue/interactive-roadbook.pdf (57 p.; perfis nas p. 33–53). O PDF tem perfis VETORIAIS: a linha foi extraída do vetor (sem leitura de pixel) por `extrair_vuelta_pdf.py`; config por `montar_config_vuelta.py`. Nomes, km, altitudes, categorias (glifo do ícone GPM), trechos de subida e de terra vêm do próprio PDF.

| Etapa | Página PDF | âncoras usadas | âncoras ignoradas (|dif| > 80 m) | avisos da fonte |
|---|---|---|---|---|
| 1 | 33 | 2 | — | — |
| 2 | 34 | 18 | — | traço do km 166.5 desenhado -1.5 km fora da escala linear do eixo — perfil reprojetado por partes para o km oficial |
| 3 | 35 | 10 | — | — |
| 4 | 36 | 13 | — | traço do km 91.6 desenhado +1.1 km fora da escala linear do eixo — perfil reprojetado por partes para o km oficial; traço do km 100.1 desenhado +1.1 km fora da escala linear do eixo (rótulo com linha de chamada; não usado como âncora); traço do km 104.0 desenhado -2.4 km fora da escala linear do eixo (rótulo com linha de chamada; não usado como âncora) |
| 5 | 37 | 10 | — | — |
| 6 | 38 | 13 | km 93.5 (-95 m) | traço do km 93.5 desenhado -3.3 km fora da escala linear do eixo — perfil reprojetado por partes para o km oficial; traço do km 155.8 desenhado +3.9 km fora da escala linear do eixo (rótulo com linha de chamada; não usado como âncora); traço do km 156.9 desenhado -2.3 km fora da escala linear do eixo (rótulo com linha de chamada; não usado como âncora) |
| 7 | 39 | 11 | — | traço do km 105.4 desenhado +1.3 km fora da escala linear do eixo (rótulo com linha de chamada; não usado como âncora); traço do km 149.0 desenhado -1.6 km fora da escala linear do eixo (rótulo com linha de chamada; não usado como âncora) |
| 8 | 40 | 10 | — | traço do km 145.8 desenhado -4.0 km fora da escala linear do eixo — perfil reprojetado por partes para o km oficial |
| 9 | 41 | 14 | km 3.6 (-124 m) | traço do km 3.6 desenhado -5.4 km fora da escala linear do eixo — perfil reprojetado por partes para o km oficial; traço do km 140.2 desenhado +1.8 km fora da escala linear do eixo (rótulo com linha de chamada; não usado como âncora); traço do km 144.2 desenhado -1.2 km fora da escala linear do eixo (rótulo com linha de chamada; não usado como âncora) |
| 10 | 42 | 9 | — | — |
| 11 | 43 | 8 | — | — |
| 12 | 44 | 11 | — | — |
| 13 | 45 | 13 | — | traço do km 156.0 desenhado +1.1 km fora da escala linear do eixo (rótulo com linha de chamada; não usado como âncora) |
| 14 | 46 | 13 | — | — |
| 15 | 47 | 8 | — | — |
| 16 | 48 | 8 | — | traço do km 186.0 desenhado -1.8 km fora da escala linear do eixo (rótulo com linha de chamada; não usado como âncora) |
| 17 | 49 | 10 | — | — |
| 18 | 50 | 4 | — | — |
| 19 | 51 | 13 | — | — |
| 20 | 52 | 13 | — | — |
| 21 | 53 | 9 | — | — |

Observações Vuelta:
- O desenho do PDF não é linear em X: os traços verticais rotulados não caem na escala linear do eixo em alguns pontos (ex.: etapa 2 km 166,5; 4 km 91,6; 6 km 93,5; 8 km 145,8; 9 km 3,6). Usei interpolação por partes nos traços reais → km oficial.
- Diferenças entre altitude rotulada e a linha desenhada no PDF (registradas; corrigidas quando ≤ 80 m, ignoradas acima): ver tabela e `vuelta2026/dados/etapa-NN-fonte.json`.
- O livro de rota não marca sprints intermediários nos perfis; por isso não há ícone S nas etapas da Vuelta (nada inventado). Ícone 'S' do PDF é o de largada.
- Província/região: a faixa de províncias não foi preenchida nas etapas da Vuelta (só uso o que está no perfil do PDF).

## Arquivos
- `tour2026/etapa-01..21.png`, `vuelta2026/etapa-01..21.png` (1280×852)
- `tour2026/dados/etapa-NN-config.json` e `etapa-NN-fonte.json`; `vuelta2026/dados/etapa-NN-extraido.json`, `-config.json`, `-fonte.json`
- `tour2026-todas.png`, `vuelta2026-todas.png` (folhas de contato)
- Scripts: `render_estilo_giro.py`, `digitalizar_tour.py`, `extrair_vuelta_pdf.py`, `montar_config_vuelta.py`, `folha_contato.py`
