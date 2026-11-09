#!/usr/bin/env python3
"""Materializa percursos neutros das Grandes Voltas masculinas de 2026.

Só metadados de rota e regulamento. Não grava resultado, liberação nem snapshot.
Rodar de novo reescreve os JSON de percurso e o catálogo; não mexe em liberacoes.json.
"""

from __future__ import annotations

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DESTINO = RAIZ / "data" / "grandes-voltas"
CONSULTADO = "2026-11-09"

FONTE_GIRO = {
    "nome": "Regulamento do 109º Giro d'Italia (4 de maio de 2026)",
    "url": "https://www.giroditalia.it/wp-content/uploads/2026/05/ZVzAI74R7A7gM9wuyqTu_040526-014251.pdf",
    "consultadoEm": CONSULTADO,
    "observacao": (
        "Tabela de etapas, categorias de dificuldade, sprints e subidas categorizadas. "
        "A brochura de percurso de fevereiro de 2026 confirma Feltre–Alleghe na etapa 19. "
        "Não foram usadas páginas de classificação."
    ),
}
FONTE_GIRO_DIRECAO_19 = {
    "nome": "Brochura de percurso e hospitalidade do Giro d'Italia 2026 (fevereiro de 2026)",
    "url": "https://www.giroditalia.it/wp-content/uploads/2026/02/t14YXHcwwDHMg5HfLDg9_260226-053022.pdf",
    "consultadoEm": CONSULTADO,
}
FONTE_TOUR_LARGADA = {
    "nome": "Grand Départ Barcelona 2026",
    "url": "https://www.letour.fr/en/the-race/grands-departs/grand-depart-2026",
    "consultadoEm": CONSULTADO,
}
FONTE_TOUR_RESUMO = {
    "nome": "2026 Route (parcours)",
    "url": "https://www.letour.fr/en/parcours-webview",
    "consultadoEm": CONSULTADO,
    "observacao": (
        "O índice stage-0N do site oficial, consultado na mesma data, já descrevia a edição seguinte. "
        "Essas fichas não foram usadas. Onde o resumo de 2026 não traz cidade, km ou tipo, o campo fica vazio."
    ),
}
FONTE_VUELTA = {
    "nome": "Official route of La Vuelta 2026",
    "url": "https://www.lavuelta.es/en/overall-route",
    "consultadoEm": CONSULTADO,
    "observacao": "Tabela de etapas, tipo, data, origem, destino e distância. Sem perfil numérico nessa página.",
}

AVISO_PERFIL = "Série altimétrica numérica não publicada na fonte de percurso consultada."
AVISO_TOUR_LACUNA = (
    "Cidade, distância ou tipo não constam das páginas de percurso de 2026 ainda identificadas como esta edição. "
    "As fichas stage-0N atuais do site oficial já mostram outra edição e foram ignoradas."
)


def _perfil(sprints=None, montanhas=None):
    return {
        "pontos": [],
        "sprints": sprints or [],
        "montanhas": montanhas or [],
    }


def _marcador(nome, categoria=None):
    item = {"nome": nome, "xKm": None}
    if categoria:
        item["categoria"] = categoria
    return item


def _etapa(**dados):
    base = {
        "n": None,
        "data": None,
        "km": None,
        "desnivelM": None,
        "tipo": "desconhecido",
        "tipoOficial": None,
        "origem": None,
        "destino": None,
        "detalhe": None,
        "perfil": _perfil(),
        "perfilPublicado": False,
        "avisos": [AVISO_PERFIL],
    }
    perfil = dados.pop("perfil", None)
    if perfil is not None:
        base["perfil"] = perfil
    base.update(dados)
    if base["n"] is None:
        raise ValueError("etapa sem número")
    return base


GIRO_SPRINTS = {
    1: "Sozopol",
    2: "Sliven",
    3: "Dolna Banja",
    4: "San Lucido",
    5: "Francavilla in Sinni",
    6: "Brusciano",
    7: "Venafro",
    8: "Cupra Marittima",
    9: "Marzabotto",
    11: "Luni",
    12: "Stella",
    13: "Stresa",
    14: "Roisan",
    15: "Pavia",
    16: "Ludiano",
    17: "Roncone",
    18: "Guia",
    19: "Palafavera",
    20: "Forgaria nel Friuli",
    21: "Fontana dello Zodiaco",
}

# (etapa, nome, categoria) — regulamento, art. 20. Sem km de passagem.
GIRO_MONTANHAS = [
    (1, "Cape Agalina", "4"),
    (1, "Cape Agalina (2ª passagem)", "4"),
    (2, "Byala Pass", "3"),
    (2, "Vratnik Pass", "3"),
    (2, "Lyaskovets Monastery Pass", "3"),
    (3, "Borovets Pass", "2"),
    (4, "Cozzo Tunno", "2"),
    (5, "Montagna Grande di Viggiano", "2"),
    (5, "Prestieri", "3"),
    (6, "Cava de' Tirreni", "4"),
    (7, "Roccaraso", "2"),
    (7, "Blockhaus", "1"),
    (8, "Montefiore d'Aso", "3"),
    (8, "Monterubbiano", "4"),
    (8, "Capodarco", "4"),
    (8, "Fermo", "4"),
    (9, "Querciola", "2"),
    (9, "Corno alle Scale", "1"),
    (11, "Passo del Termine", "3"),
    (11, "Colla dei Scioli", "3"),
    (11, "Colle di Guaitarola", "2"),
    (12, "Colle Giovo", "3"),
    (12, "Bric Berton", "3"),
    (13, "Ungiasca", "3"),
    (13, "Bieno", "4"),
    (14, "Doues", "3"),
    (14, "Verrogne", "2"),
    (14, "Saint-Barthélémy", "1"),
    (14, "Lin Noir", "1"),
    (14, "Pila", "1"),
    (16, "Torre", "3"),
    (16, "Torre (2ª passagem)", "3"),
    (16, "Leontica", "2"),
    (16, "Leontica (2ª passagem)", "2"),
    (16, "Carì", "1"),
    (17, "Passo dei Tre Termini", "3"),
    (17, "Cocca di Lodrino", "3"),
    (17, "Andalo-Lever", "3"),
    (18, "Fastro", "3"),
    (18, "Muro di Ca' del Poggio", "4"),
    (19, "Passo Duran", "1"),
    (19, "Coi", "2"),
    (19, "Forcella Staulanza", "2"),
    (19, "Passo Falzarego", "2"),
    (19, "Passo Giau", "cima_coppi"),
    (19, "Piani di Pezzè", "2"),
    (20, "Clauzetto", "3"),
    (20, "Piancavallo", "1"),
    (20, "Piancavallo (chegada)", "1"),
]


def _giro_perfil(n):
    sprints = []
    if n in GIRO_SPRINTS:
        sprints.append(_marcador(GIRO_SPRINTS[n], "intermediario"))
    montanhas = [_marcador(nome, cat) for etapa, nome, cat in GIRO_MONTANHAS if etapa == n]
    return _perfil(sprints, montanhas)


def _giro_etapas():
    # Categorias do art. 17: a sem dificuldade, b baixa, c média, d alta, e crono.
    bruto = [
        (1, "2026-05-08", 147, "plana", "a", "Nessebar", "Burgas", None),
        (2, "2026-05-09", 221, "mista", "c", "Burgas", "Veliko Tarnovo", None),
        (3, "2026-05-10", 175, "ondulada", "b", "Plovdiv", "Sofia", None),
        (4, "2026-05-12", 138, "ondulada", "b", "Catanzaro", "Cosenza", None),
        (5, "2026-05-13", 203, "mista", "c", "Praia a Mare", "Potenza", None),
        (6, "2026-05-14", 141, "plana", "a", "Paestum", "Napoli", None),
        (7, "2026-05-15", 244, "montanha", "d", "Formia", "Blockhaus", None),
        (8, "2026-05-16", 156, "mista", "c", "Chieti", "Fermo", None),
        (9, "2026-05-17", 184, "montanha", "d", "Cervia", "Corno alle Scale", None),
        (10, "2026-05-19", 42, "crono", "e", "Viareggio", "Massa", "Contra-relógio individual."),
        (11, "2026-05-20", 195, "mista", "c", "Porcari (Paper District)", "Chiavari", None),
        (12, "2026-05-21", 175, "ondulada", "b", "Imperia", "Novi Ligure", None),
        (13, "2026-05-22", 189, "mista", "c", "Alessandria", "Verbania", None),
        (14, "2026-05-23", 133, "montanha", "d", "Aosta", "Pila (Gressan)", None),
        (15, "2026-05-24", 157, "plana", "a", "Voghera", "Milano", None),
        (16, "2026-05-26", 113, "montanha", "d", "Bellinzona", "Carì", None),
        (17, "2026-05-27", 202, "mista", "c", "Cassano d'Adda", "Andalo", None),
        (18, "2026-05-28", 171, "ondulada", "b", "Fai della Paganella", "Pieve di Soligo", None),
        (19, "2026-05-29", 151, "montanha", "d", "Feltre", "Alleghe (Piani di Pezzè)", None),
        (20, "2026-05-30", 200, "montanha", "d", "Gemona del Friuli", "Piancavallo", None),
        (21, "2026-05-31", 131, "plana", "a", "Roma", "Roma", None),
    ]
    etapas = []
    for n, data, km, tipo, cat, origem, destino, detalhe in bruto:
        avisos = [AVISO_PERFIL]
        if n == 2:
            avisos.append(
                "A célula de dia da tabela de quilometragem veio inconsistente com a etapa 3. "
                "A data segue a tabela de sprints do mesmo regulamento (9 de maio) e a sequência sexta–domingo."
            )
        if n == 10:
            avisos.append(
                "Apresentações anteriores citaram 40,2 km. O regulamento de 4 de maio de 2026 lista 42 km, "
                "e a soma das 21 etapas fecha nos 3.468,0 km publicados nesse documento."
            )
        if n == 19:
            avisos.append(
                "Na extração da tabela de quilometragem as colunas de origem e destino vieram invertidas. "
                "A brochura de percurso de fevereiro de 2026 traz Feltre–Alleghe (Piani di Pezzè)."
            )
        etapas.append(
            _etapa(
                n=n,
                data=data,
                km=km,
                tipo=tipo,
                tipoOficial=f"categoria {cat} do art. 17",
                origem=origem,
                destino=destino,
                detalhe=detalhe,
                perfil=_giro_perfil(n),
                avisos=avisos,
            )
        )
    return etapas


def _camisas_giro():
    return [
        {
            "id": "gc",
            "nomeClasse": "geral",
            "unidade": "tempo",
            "cor": "#f4a4c4",
            "rotulo": "Maglia Rosa",
            "oficialConfirmado": True,
            "prioridade": 1,
            "nota": "Líder da classificação geral por tempo. Prioridade máxima se o mesmo corredor liderar outra camisa.",
        },
        {
            "id": "pontos",
            "nomeClasse": "pontos",
            "unidade": "pontos",
            "cor": "#c71585",
            "rotulo": "Maglia Ciclamino",
            "oficialConfirmado": True,
            "prioridade": 2,
            "nota": "Classificação por pontos. Escala no regulamento, distinta para categorias a/b, c e d/e.",
        },
        {
            "id": "montanha",
            "nomeClasse": "montanha",
            "unidade": "pontos",
            "cor": "#1e90ff",
            "rotulo": "Maglia Azzurra",
            "oficialConfirmado": True,
            "prioridade": 3,
            "nota": "Melhor escalador. Cima Coppi no Passo Giau, etapa 19.",
        },
        {
            "id": "jovem",
            "nomeClasse": "jovem",
            "unidade": "tempo",
            "cor": "#f4f1e6",
            "rotulo": "Maglia Bianca",
            "oficialConfirmado": True,
            "prioridade": 4,
            "nota": "Melhor colocado na geral entre nascidos a partir de 1º de janeiro de 2001.",
        },
    ]


def _giro():
    return {
        "provaId": "b7",
        "slug": "giro",
        "ano": 2026,
        "nome": "Giro d'Italia",
        "genero": "M",
        "totalEtapas": 21,
        "calendario": {
            "id": "b7",
            "inicio": "2026-05-08",
            "fim": "2026-05-31",
            "confirmadoNoSite": True,
        },
        "fontes": [FONTE_GIRO, FONTE_GIRO_DIRECAO_19],
        "camisas": _camisas_giro(),
        "regulamento": {
            "oficialConfirmado": True,
            "fonte": FONTE_GIRO["url"],
            "prioridadeVestimenta": ["gc", "pontos", "montanha", "jovem"],
            "prioridadeConfirmada": True,
            "notaPrioridade": (
                "Se um corredor lidera mais de uma classificação, veste a camisa de maior prioridade. "
                "A camisa restante passa, em título honorífico, ao seguinte dessa classificação que não lidere outra."
            ),
            "jovem": {"nascidoAPartirDe": "2001-01-01", "confirmado": True},
            "tabelaPontosChegada": {
                "a_b": [50, 35, 25, 18, 14, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1],
                "c": [25, 18, 12, 8, 6, 5, 4, 3, 2, 1],
                "d_e": [15, 12, 9, 7, 6, 5, 4, 3, 2, 1],
            },
            "sprintIntermediarioPontos": [12, 8, 5, 3, 1],
            "montanhaPontos": {
                "cima_coppi": [50, 30, 20, 14, 10, 6, 4, 2, 1],
                "1_chegada": [50, 24, 16, 9, 6, 4, 2, 1],
                "1_passagem": [40, 18, 12, 9, 6, 4, 2, 1],
                "2": [18, 8, 6, 4, 2, 1],
                "3": [9, 4, 2, 1],
                "4": [3, 2, 1],
            },
        },
        "classificacaoEquipes": {
            "habilitada": False,
            "previstaNoRegulamento": True,
            "oficialConfirmado": True,
            "nota": (
                "O regulamento soma os três melhores tempos de cada equipe. "
                "O painel fica desligado até um snapshot autorizado trazer esses dados."
            ),
        },
        "observacoes": [
            "Nenhuma etapa está liberada.",
            "Não há série altimétrica: o gráfico fica ausente de propósito.",
        ],
        "etapas": _giro_etapas(),
    }


def _tour_etapas():
    lacuna = [AVISO_PERFIL, AVISO_TOUR_LACUNA]
    etapas = []
    for n in range(1, 22):
        etapas.append(_etapa(n=n, avisos=list(lacuna)))
    etapas[0].update(
        {
            "data": "2026-07-04",
            "km": 19.6,
            "tipo": "crono",
            "tipoOficial": "team time-trial",
            "origem": "Barcelona",
            "destino": "Barcelona",
            "detalhe": "Contra-relógio por equipes. O resumo do percurso arredonda para 19 km; o mesmo texto de apresentação também cita 19,7 km.",
            "avisos": [
                AVISO_PERFIL,
                "Distância adotada: 19,6 km, no título da etapa na página Grand Départ Barcelona 2026. "
                "O parágrafo inicial dessa página cita 19,7 km e o resumo do percurso cita 19 km.",
            ],
        }
    )
    etapas[1].update(
        {
            "data": "2026-07-05",
            "km": 168.5,
            "tipo": "ondulada",
            "tipoOficial": None,
            "origem": "Tarragona",
            "destino": "Barcelona",
            "detalhe": "A página de percurso descreve o final como muito ondulado, com chegada em subida em Montjuïc. Não há um rótulo formal flat/hilly nessa ficha.",
            "avisos": [
                AVISO_PERFIL,
                "Distância adotada: 168,5 km na página Grand Départ Barcelona 2026. "
                "O parágrafo inicial dessa mesma página ainda cita 178 km, de uma versão anterior.",
            ],
        }
    )
    etapas[2].update(
        {
            "data": "2026-07-06",
            "km": 195.9,
            "tipo": "desconhecido",
            "origem": "Granollers",
            "destino": "Les Angles",
            "detalhe": "A página confirma origem, destino e distância, sem classificar o tipo.",
            "avisos": [AVISO_PERFIL],
        }
    )
    # Menções explícitas no resumo do percurso 2026, sem quilometragem.
    etapas[5].update(
        {
            "destino": "Gavarnie-Gèdre",
            "tipo": "montanha",
            "tipoOficial": "summit finish",
            "detalhe": "Chegada no alto citada no resumo do percurso 2026. Origem e distância não vieram nessa página.",
            "avisos": [AVISO_PERFIL, "Origem e distância ausentes na página de percurso de 2026 consultada."],
        }
    )
    etapas[6].update(
        {
            "origem": "Hagetmau",
            "avisos": [AVISO_PERFIL, "Destino, distância e tipo ausentes na página de percurso de 2026 consultada."],
        }
    )
    etapas[8].update(
        {
            "origem": "Malemort",
            "destino": "Ussel",
            "avisos": [AVISO_PERFIL, "Distância e tipo ausentes na página de percurso de 2026 consultada."],
        }
    )
    etapas[11].update(
        {
            "origem": "Circuit Nevers Magny-Cours",
            "avisos": [AVISO_PERFIL, "Destino, distância e tipo ausentes na página de percurso de 2026 consultada."],
        }
    )
    etapas[13].update(
        {
            "detalhe": "O resumo do percurso cita Col du Page e Col du Haag nesta etapa, sem origem, destino, distância ou tipo formal.",
            "perfil": _perfil(
                montanhas=[_marcador("Col du Page"), _marcador("Col du Haag")]
            ),
        }
    )
    etapas[14].update(
        {
            "destino": "Plateau de Solaison",
            "tipo": "montanha",
            "tipoOficial": "summit finish",
            "detalhe": "Chegada no alto citada no resumo do percurso 2026.",
            "avisos": [AVISO_PERFIL, "Origem e distância ausentes na página de percurso de 2026 consultada."],
        }
    )
    etapas[15].update(
        {
            "km": 26,
            "tipo": "crono",
            "tipoOficial": "individual time trial",
            "origem": "Évian-les-Bains",
            "destino": "Thonon-les-Bains",
            "detalhe": "Contra-relógio individual de 26 km, segundo o resumo do percurso 2026. A data do dia não veio nessa página.",
            "avisos": [AVISO_PERFIL],
        }
    )
    etapas[19].update(
        {
            "detalhe": "O resumo do percurso cita o Col de Sarenne pelo flanco sudeste nesta etapa. Alpe d'Huez aparece como chegada no alto em dois dias, sem número de etapa nesse resumo — por isso não foi atribuído aqui.",
            "perfil": _perfil(montanhas=[_marcador("Col de Sarenne")]),
        }
    )
    etapas[20].update(
        {
            "origem": "Thoiry",
            "destino": "Paris",
            "detalhe": "O resumo do percurso indica Thoiry na largada da última etapa e Paris na chegada final, sem distância nem tipo.",
            "avisos": [AVISO_PERFIL, "Distância e tipo ausentes na página de percurso de 2026 consultada."],
        }
    )
    return etapas


def _camisas_classicas(itens):
    saida = []
    for item in itens:
        saida.append(
            {
                "id": item["id"],
                "nomeClasse": item["nomeClasse"],
                "unidade": item["unidade"],
                "cor": item["cor"],
                "rotulo": item["rotulo"],
                "oficialConfirmado": False,
                "prioridade": None,
                "nota": item["nota"],
            }
        )
    return saida


def _tour():
    return {
        "provaId": "b10",
        "slug": "tour",
        "ano": 2026,
        "nome": "Tour de France",
        "genero": "M",
        "totalEtapas": 21,
        "calendario": {
            "id": "b10",
            "inicio": "2026-07-04",
            "fim": "2026-07-26",
            "confirmadoNoSite": True,
        },
        "fontes": [FONTE_TOUR_LARGADA, FONTE_TOUR_RESUMO],
        "camisas": _camisas_classicas(
            [
                {
                    "id": "gc",
                    "nomeClasse": "geral",
                    "unidade": "tempo",
                    "cor": "#ffe14a",
                    "rotulo": "Amarela",
                    "nota": "Rótulo clássico, a confirmar no regulamento desta edição. A página de regras do site não identificava o ano 2026 na consulta.",
                },
                {
                    "id": "pontos",
                    "nomeClasse": "pontos",
                    "unidade": "pontos",
                    "cor": "#1f8f4e",
                    "rotulo": "Verde",
                    "nota": "Rótulo clássico, a confirmar. Tabela de pontos não copiada.",
                },
                {
                    "id": "montanha",
                    "nomeClasse": "montanha",
                    "unidade": "pontos",
                    "cor": "#e10600",
                    "rotulo": "Bolinhas",
                    "nota": "Rótulo clássico, a confirmar. Tabela de pontos não copiada.",
                },
                {
                    "id": "jovem",
                    "nomeClasse": "jovem",
                    "unidade": "tempo",
                    "cor": "#f4f1e6",
                    "rotulo": "Branca",
                    "nota": "Rótulo clássico, a confirmar. Idade-limite desta edição não foi fechada numa página de regulamento de 2026.",
                },
            ]
        ),
        "regulamento": {
            "oficialConfirmado": False,
            "fonte": None,
            "prioridadeVestimenta": None,
            "prioridadeConfirmada": False,
            "notaPrioridade": "Prioridade entre camisas não confirmada para 2026.",
            "jovem": {"nascidoAPartirDe": None, "confirmado": False},
            "tabelaPontosChegada": None,
        },
        "classificacaoEquipes": {
            "habilitada": False,
            "previstaNoRegulamento": False,
            "oficialConfirmado": False,
            "nota": "Não confirmada para esta edição. O painel permanece desligado.",
        },
        "observacoes": [
            "Nenhuma etapa está liberada.",
            "O resumo oficial de 2026 fala em 7 etapas planas, 4 onduladas, 8 de montanha, 1 contra-relógio por equipes e 1 individual, com dois dias de descanso. Essa conta não foi desdobrada etapa a etapa onde a página não numera o tipo.",
            "O mesmo resumo cita 54.450 m de desnível associados ao ano de 2025. Esse número não foi usado para 2026.",
            "Chegadas no alto nomeadas sem número de etapa no resumo: Orcières-Merlette e Alpe d'Huez (duas vezes). Não foram atribuídas a uma etapa.",
        ],
        "etapas": _tour_etapas(),
    }


def _vuelta_etapas():
    linhas = [
        (1, "2026-08-22", "crono", "Individual time-trial", 9.4, "Monaco", "Monaco", "Contra-relógio individual."),
        (2, "2026-08-23", "ondulada", "Hilly", 214.3, "Monaco", "Manosque", None),
        (3, "2026-08-24", "mista", "Medium Mountains", 174, "Gruissan - Aude", "Font Romeu", None),
        (4, "2026-08-25", "montanha", "Mountain", 104.8, "Andorra la Vella", "Andorra la Vella", None),
        (5, "2026-08-26", "ondulada", "Hilly", 173.3, "Falset . Costa Daurada", "Roquetes. Terres de l'Ebre", None),
        (6, "2026-08-27", "mista", "Medium Mountains", 177.5, "Alcossebre", "Castelló", None),
        (7, "2026-08-28", "montanha", "Mountain", 149.8, "vall d'Alba", "Aramón Valdelinares", None),
        (8, "2026-08-29", "plana", "Flat", 171, "Puçol", "Xeraco", None),
        (9, "2026-08-30", "montanha", "Mountain", 187.4, "La Vila Joiosa/ Villajoyosa", "Alto de Aitana.Costa Blanca", None),
        (10, "2026-09-01", "ondulada", "Hilly", 184.7, "Alcaraz", "Elche de la Sierra", None),
        (11, "2026-09-02", "plana", "Flat", 153.8, "Cartagena", "Lorca", None),
        (12, "2026-09-03", "montanha", "Mountain", 166.6, "Vera", "Calar Alto", None),
        (13, "2026-09-04", "mista", "Medium Mountains", 192.8, "Almuñécar", "Loja", None),
        (14, "2026-09-05", "montanha", "Mountain", 154.5, "Jaén", "Sierra de La Pandera", None),
        (15, "2026-09-06", "mista", "Medium Mountains", 110.2, "Palma del Río", "Córdoba", None),
        (16, "2026-09-08", "ondulada", "Hilly", 181.1, "Cortegana", "La Rábida. Palos de la Frontera", None),
        (17, "2026-09-09", "plana", "Flat", 185, "Dos Hermanas", "Sevilla", None),
        (18, "2026-09-10", "crono", "Individual time-trial", 32.1, "El Puerto de Santa María", "Jerez de la Frontera", "Contra-relógio individual."),
        (19, "2026-09-11", "ondulada", "Hilly. Uphill arrival", 210.8, "Vélez-Málaga", "Peñas Blancas. Estepona", "Chegada em subida, segundo o rótulo oficial."),
        (20, "2026-09-12", "montanha", "Mountain", 186.8, "La Calahorra", "Collado del Alguacil", None),
        (21, "2026-09-13", "plana", "Flat", 112, "Carrefour Granada", "Granada", None),
    ]
    etapas = []
    for n, data, tipo, oficial, km, origem, destino, detalhe in linhas:
        etapas.append(
            _etapa(
                n=n,
                data=data,
                km=km,
                tipo=tipo,
                tipoOficial=oficial,
                origem=origem,
                destino=destino,
                detalhe=detalhe,
                avisos=[AVISO_PERFIL],
            )
        )
    return etapas


def _vuelta():
    return {
        "provaId": "b12",
        "slug": "vuelta",
        "ano": 2026,
        "nome": "Volta à Espanha",
        "genero": "M",
        "totalEtapas": 21,
        "calendario": {
            "id": "b12",
            "inicio": "2026-08-22",
            "fim": "2026-09-13",
            "confirmadoNoSite": True,
        },
        "fontes": [FONTE_VUELTA],
        "camisas": _camisas_classicas(
            [
                {
                    "id": "gc",
                    "nomeClasse": "geral",
                    "unidade": "tempo",
                    "cor": "#e10600",
                    "rotulo": "Vermelha",
                    "nota": "Rótulo clássico, a confirmar no regulamento. A página de regras em inglês não nomeia a cor.",
                },
                {
                    "id": "pontos",
                    "nomeClasse": "pontos",
                    "unidade": "pontos",
                    "cor": "#1f8f4e",
                    "rotulo": "Verde",
                    "nota": "Rótulo clássico, a confirmar. Tabela de pontos não copiada.",
                },
                {
                    "id": "montanha",
                    "nomeClasse": "montanha",
                    "unidade": "pontos",
                    "cor": "#1e4fbf",
                    "rotulo": "Bolinhas azuis",
                    "nota": "Rótulo a confirmar. A página de regras não nomeia a cor das bolinhas desta edição.",
                },
                {
                    "id": "jovem",
                    "nomeClasse": "jovem",
                    "unidade": "tempo",
                    "cor": "#f4f1e6",
                    "rotulo": "Branca",
                    "nota": "Rótulo clássico, a confirmar. A página de regras consultada não declara o ano da edição na idade-limite.",
                },
            ]
        ),
        "regulamento": {
            "oficialConfirmado": False,
            "fonte": "https://www.lavuelta.es/en/the-race/sporting-stakes",
            "prioridadeVestimenta": None,
            "prioridadeConfirmada": False,
            "notaPrioridade": (
                "A página de regras descreve geral, pontos, montanha, jovem e equipes, "
                "mas o texto extraído não fixa o ano 2026 nem a prioridade de quem veste duas camisas. "
                "Pontuação não foi inventada."
            ),
            "jovem": {"nascidoAPartirDe": None, "confirmado": False},
            "tabelaPontosChegada": None,
        },
        "classificacaoEquipes": {
            "habilitada": False,
            "previstaNoRegulamento": False,
            "oficialConfirmado": False,
            "nota": (
                "A página de regras fala em soma dos três melhores tempos, sem cravar a edição 2026 no trecho lido. "
                "O painel fica desligado até um snapshot autorizado."
            ),
        },
        "observacoes": [
            "Nenhuma etapa está liberada.",
            "A página de percurso anuncia 3.275 km no total. A soma da coluna de distância das 21 etapas, com os números publicados na mesma tabela, dá 3.231,9 km. A diferença não foi ajustada.",
            "A mesma página conta 4 onduladas, 1 ondulada com chegada em subida, 4 planas, 4 de média montanha, 6 de montanha, 2 contra-relógios e 2 dias de descanso.",
        ],
        "etapas": _vuelta_etapas(),
    }


def materializar(destino: Path = DESTINO) -> None:
    provas = [_giro(), _tour(), _vuelta()]
    destino.mkdir(parents=True, exist_ok=True)
    (destino / "2026").mkdir(parents=True, exist_ok=True)
    catalogo = {"versao": 1, "provas": []}
    for prova in provas:
        arquivo = f"2026/{prova['slug']}.json"
        caminho = destino / arquivo
        caminho.write_text(json.dumps(prova, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        catalogo["provas"].append(
            {
                "provaId": prova["provaId"],
                "slug": prova["slug"],
                "ano": prova["ano"],
                "nome": prova["nome"],
                "genero": prova["genero"],
                "totalEtapas": prova["totalEtapas"],
                "arquivo": arquivo,
            }
        )
    (destino / "catalogo.json").write_text(
        json.dumps(catalogo, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    materializar()
    print(f"Percursos escritos em {DESTINO}")
