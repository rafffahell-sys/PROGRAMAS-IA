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
FONTE_TOUR_DOSSIER = {
    "nome": "Dossiê de imprensa do percurso do Tour de France 2026",
    "url": "https://storage-aso.lequipe.fr/ASO/cycling_tdf/tdf2026-dossier-de-presse.pdf",
    "consultadoEm": CONSULTADO,
    "observacao": "Quadro de etapas de 22 de outubro de 2025, marcado como total antes da homologação, e descrição das camisas.",
}
FONTE_TOUR_CHIFFRES = {
    "nome": "Cifras-chave do Tour de France 2026",
    "url": "https://storage-aso.lequipe.fr/ASO/cycling_tdf/tdf26-chiffres-cles-fr.pdf",
    "consultadoEm": CONSULTADO,
    "observacao": "Folheto de 24 de junho de 2026, antes da largada. Traz o total de 3.320,7 km e 53.950 m, sem a distância de cada etapa.",
}
FONTE_VUELTA_REGULAMENTO = {
    "nome": "Regulamento particular da 81.ª Vuelta a España",
    "url": "https://storage-aso.lequipe.fr/ASO/cycling_vue/reglamento-espanol.pdf",
    "consultadoEm": CONSULTADO,
    "observacao": "Camisas, pontos, jovem e equipes da edição de 22 de agosto a 13 de setembro de 2026. O total de quilómetros vem marcado como aproximado.",
}
FONTE_VUELTA_ROADBOOK = {
    "nome": "Roadbook interativo da Vuelta 2026",
    "url": "https://storage-aso.lequipe.fr/ASO/cycling_vue/interactive-roadbook.pdf",
    "consultadoEm": CONSULTADO,
    "observacao": "Documento de 16 de dezembro de 2025. Perfis de altimetria por etapa e distâncias arredondadas, antes da homologação.",
}
FONTE_VUELTA = {
    "nome": "Official route of La Vuelta 2026",
    "url": "https://www.lavuelta.es/en/overall-route",
    "consultadoEm": CONSULTADO,
    "observacao": "Tabela de etapas, tipo, data, origem, destino e distância. Sem perfil numérico nessa página.",
}

AVISO_PERFIL = "Série altimétrica numérica não publicada na fonte de percurso consultada."
AVISO_PERFIL_IMAGEM = (
    "O perfil publicado é a imagem oficial de altimetria. "
    "Não há série numérica; o desenho não foi convertido em pontos."
)
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


def _aplicar_perfis_imagem(prova):
    """Junta imagens oficiais de altimetria sem inventar pontos nem trocar o km do card."""
    caminho = DESTINO / "2026" / f"{prova.get('slug')}-perfis.json"
    if not caminho.exists():
        return prova
    catalogo = json.loads(caminho.read_text(encoding="utf-8"))
    por_n = {int(chave): item for chave, item in catalogo["etapas"].items()}
    for etapa in prova["etapas"]:
        item = por_n.get(etapa["n"])
        if not item:
            continue
        imagem = {
            "arquivo": item["arquivo"],
            "fontePagina": item["fontePagina"],
            "fonteAsset": item["fonteAsset"],
            "alt": item["alt"],
            "kmNaFicha": item["kmNaFicha"],
        }
        if item.get("desnivelM") is not None:
            imagem["desnivelMNaFicha"] = item["desnivelM"]
        if item.get("kmNoEixo") is not None:
            imagem["kmNoEixo"] = item["kmNoEixo"]
        etapa["perfil"]["imagem"] = imagem
        etapa["perfil"]["pontos"] = []
        etapa["perfilPublicado"] = True
        if item.get("desnivelM") is not None:
            etapa["desnivelM"] = item["desnivelM"]
        avisos = [texto for texto in etapa.get("avisos") or [] if texto != AVISO_PERFIL]
        if AVISO_PERFIL_IMAGEM not in avisos:
            avisos.insert(0, AVISO_PERFIL_IMAGEM)
        for extra in item.get("avisos") or []:
            if extra not in avisos:
                avisos.append(extra)
        etapa["avisos"] = avisos
    texto = catalogo.get("observacao")
    if texto:
        prova["observacoes"] = [
            texto if linha.startswith("Perfis altimétricos:") else linha
            for linha in prova["observacoes"]
        ]
    return prova


def _giro():
    return _aplicar_perfis_imagem({
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
            "Perfis altimétricos: 0 de 21. O regulamento de 4 de maio de 2026 remete os desenhos à Guida Tecnica, mas o PDF público obtido é o regulamento, sem perfil de etapa.",
            "A página Roadbook do site oficial, consultada em 9 de novembro de 2026, já mostra a edição seguinte e não foi usada.",
            "As brochuras de hospitalidade de fevereiro e março de 2026 trazem a planimetria geral (3.459,2 km e 49.150 m no total), não o perfil de cada etapa. Esses totais não substituem os 3.468 km do regulamento de maio e não foram distribuídos entre as etapas.",
        ],
        "etapas": _giro_etapas(),
    })


def _tour_etapas():
    aviso_dossier = (
        "Distância do dossiê de imprensa do percurso 2026, de 22 de outubro de 2025, "
        "no quadro marcado como total antes da homologação."
    )
    aviso_perfil = AVISO_PERFIL
    # km, tipo, tipoOficial, origem, destino, desnivel, detalhe, montanhas, avisos
    linhas = [
        (1, "2026-07-04", 19.6, "crono", "team time-trial", "Barcelona", "Barcelona", None,
         "Contra-relógio por equipes.", [],
         [aviso_perfil,
          "Distância adotada: 19,6 km, no título da etapa na página Grand Départ Barcelona 2026. "
          "O parágrafo inicial dessa página cita 19,7 km, o resumo do percurso cita 19 km "
          "e o dossiê de 22 de outubro de 2025 também arredonda para 19 km."]),
        (2, "2026-07-05", 168.5, "ondulada", None, "Tarragona", "Barcelona", None,
         "A página do Grand Départ descreve o final como muito ondulado, com chegada em subida em Montjuïc.",
         ["Côte de Begues"],
         [aviso_perfil,
          "Distância adotada: 168,5 km na página Grand Départ Barcelona 2026. "
          "O parágrafo inicial dessa mesma página ainda cita 178 km. "
          "O dossiê de 22 de outubro de 2025 lista 182 km, antes da homologação."]),
        (3, "2026-07-06", 195.9, "desconhecido", None, "Granollers", "Les Angles", 3950,
         "O dossiê de imprensa atribui 3.950 m de desnível a esta etapa. O tipo formal não veio nomeado.",
         [],
         [aviso_perfil,
          "Distância adotada: 195,9 km na página Grand Départ Barcelona 2026. "
          "O dossiê de 22 de outubro de 2025 arredonda para 196 km."]),
        (4, "2026-07-07", 182, "desconhecido", None, "Carcassonne", "Foix", None, None, [], [aviso_perfil, aviso_dossier]),
        (5, "2026-07-08", 158, "desconhecido", None, "Lannemezan", "Pau", None, None, [], [aviso_perfil, aviso_dossier]),
        (6, "2026-07-09", 186, "montanha", "summit finish", "Pau", "Gavarnie-Gèdre", None,
         "Chegada no alto nomeada no resumo oficial entre as cinco da edição.",
         ["Montée de Gavarnie-Gèdre"], [aviso_perfil, aviso_dossier]),
        (7, "2026-07-10", 175, "desconhecido", None, "Hagetmau", "Bordeaux", None, None, [], [aviso_perfil, aviso_dossier]),
        (8, "2026-07-11", 182, "desconhecido", None, "Périgueux", "Bergerac", 1150,
         "O dossiê de imprensa limita o desnível desta etapa a 1.150 m.",
         [], [aviso_perfil, aviso_dossier]),
        (9, "2026-07-12", 185, "desconhecido", None, "Malemort", "Ussel", 3300,
         "O dossiê de imprensa atribui 3.300 m de desnível a esta etapa. O tipo formal não veio nomeado.",
         [], [aviso_perfil, aviso_dossier]),
        (10, "2026-07-14", 167, "montanha", "étape de montagne", "Aurillac", "Le Lioran", None,
         "O dossiê chama esta chegada de etapa de montanha. Não está na lista das cinco chegadas no alto.",
         ["Col de la Griffoul"], [aviso_perfil, aviso_dossier]),
        (11, "2026-07-15", 161, "desconhecido", None, "Vichy", "Nevers", None, None, [], [aviso_perfil, aviso_dossier]),
        (12, "2026-07-16", 181, "desconhecido", None, "Circuit Nevers Magny-Cours", "Chalon-sur-Saône", None,
         None, [], [aviso_perfil, aviso_dossier]),
        (13, "2026-07-17", 205, "desconhecido", None, "Dole", "Belfort", None,
         "Única etapa acima de 200 km no quadro do dossiê. O tipo formal não veio nomeado.",
         [], [aviso_perfil, aviso_dossier]),
        (14, "2026-07-18", 155, "desconhecido", None, "Mulhouse", "Le Markstein Fellering", None,
         None, ["Col du Page", "Col du Haag"], [aviso_perfil, aviso_dossier]),
        (15, "2026-07-19", 184, "montanha", "summit finish", "Champagnole", "Plateau de Solaison", None,
         "Chegada no alto nomeada no resumo oficial.",
         ["Plateau de Solaison"], [aviso_perfil, aviso_dossier]),
        (16, "2026-07-21", 26, "crono", "individual time trial", "Évian-les-Bains", "Thonon-les-Bains", None,
         "Contra-relógio individual. O dossiê e o resumo do percurso concordam em 26 km.",
         [], [aviso_perfil]),
        (17, "2026-07-22", 175, "desconhecido", None, "Chambéry", "Voiron", None, None, [], [aviso_perfil, aviso_dossier]),
        (18, "2026-07-23", 185, "montanha", "summit finish", "Voiron", "Orcières-Merlette", None,
         "Chegada no alto nomeada no resumo oficial.",
         [], [aviso_perfil, aviso_dossier]),
        (19, "2026-07-24", 128, "montanha", "summit finish", "Gap", "Alpe d'Huez", None,
         "Chegada no alto nomeada no resumo oficial.",
         [], [aviso_perfil, aviso_dossier]),
        (20, "2026-07-25", 171, "montanha", "summit finish", "Le Bourg d'Oisans", "Alpe d'Huez", 5600,
         "O dossiê atribui 5.600 m de desnível a esta etapa e cita os cols de la Croix de Fer, du Télégraphe, du Galibier e de Sarenne.",
         ["Col de la Croix de Fer", "Col du Télégraphe", "Col du Galibier", "Col de Sarenne"],
         [aviso_perfil, aviso_dossier]),
        (21, "2026-07-26", 130, "desconhecido", None, "Thoiry", "Paris", None,
         "Chegada nos Champs-Élysées, segundo o dossiê. O tipo formal não veio nomeado.",
         [], [aviso_perfil, aviso_dossier]),
    ]
    etapas = []
    for n, data, km, tipo, oficial, origem, destino, desnivel, detalhe, montanhas, avisos in linhas:
        etapas.append(_etapa(
            n=n, data=data, km=km, desnivelM=desnivel, tipo=tipo, tipoOficial=oficial,
            origem=origem, destino=destino, detalhe=detalhe,
            perfil=_perfil(montanhas=[_marcador(nome) for nome in montanhas]),
            avisos=avisos,
        ))
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
    return _aplicar_perfis_imagem({
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
        "fontes": [FONTE_TOUR_LARGADA, FONTE_TOUR_RESUMO, FONTE_TOUR_DOSSIER, FONTE_TOUR_CHIFFRES],
        "camisas": [
            {
                "id": "gc",
                "nomeClasse": "geral",
                "unidade": "tempo",
                "cor": "#ffe14a",
                "rotulo": "Amarela",
                "oficialConfirmado": True,
                "prioridade": None,
                "nota": "Maillot jaune, classificação geral individual ao tempo. Dossiê de imprensa de 22 de outubro de 2025, patrocínio LCL.",
            },
            {
                "id": "pontos",
                "nomeClasse": "pontos",
                "unidade": "pontos",
                "cor": "#1f8f4e",
                "rotulo": "Verde",
                "oficialConfirmado": True,
                "prioridade": None,
                "nota": "Maillot vert. Pontos na chegada e num sprint intermédio das etapas em linha. A tabela numérica não está nesse dossiê.",
            },
            {
                "id": "montanha",
                "nomeClasse": "montanha",
                "unidade": "pontos",
                "cor": "#e10600",
                "rotulo": "Bolinhas vermelhas",
                "oficialConfirmado": True,
                "prioridade": None,
                "nota": "Maillot blanc à pois rouges. Pontos no topo de cada subida e nas chegadas em altitude. A tabela numérica não está nesse dossiê.",
            },
            {
                "id": "jovem",
                "nomeClasse": "jovem",
                "unidade": "tempo",
                "cor": "#f4f1e6",
                "rotulo": "Branca",
                "oficialConfirmado": True,
                "prioridade": None,
                "nota": "Maillot blanc. Corredores com 25 anos no máximo durante o ano de 2026.",
            },
        ],
        "regulamento": {
            "oficialConfirmado": False,
            "fonte": FONTE_TOUR_DOSSIER["url"],
            "prioridadeVestimenta": None,
            "prioridadeConfirmada": False,
            "notaPrioridade": "O dossiê de 2026 nomeia as quatro camisas e não fixa a prioridade de quem lidera duas ao mesmo tempo. Não foi encontrado o regulamento particular com o barema numérico.",
            "jovem": {"nascidoAPartirDe": "2001-01-01", "confirmado": True,
                      "nota": "O dossiê diz «25 ans au plus dans l'année en cours» para 2026, o que corresponde a nascidos a partir de 1º de janeiro de 2001."},
            "tabelaPontosChegada": None,
        },
        "classificacaoEquipes": {
            "habilitada": False,
            "previstaNoRegulamento": True,
            "oficialConfirmado": False,
            "nota": "O dossiê de 2026 prevê um prémio de classificação por equipes, patrocinado pela Basic-Fit, sem publicar a fórmula. O painel fica desligado.",
        },
        "observacoes": [
            "Nenhuma etapa está liberada.",
            "Perfis altimétricos: 0 de 21. O mapa oficial de 6 de outubro de 2025 é a planimetria geral, não o perfil de cada etapa. O dossiê de 22 de outubro de 2025 não traz uma imagem de altimetria por etapa. Em 9 de novembro de 2026 a ficha stage-15 do site já era a edição seguinte (Rodez–Albi) e não foi usada.",
            "O resumo oficial conta 7 planas, 4 onduladas, 8 de montanha, 1 contra-relógio por equipes e 1 individual. Só foram marcadas as etapas que o dossiê ou o resumo identificam: as cinco chegadas no alto, a etapa de montanha de Le Lioran, a etapa 2 descrita como muito ondulada e os dois contra-relógios.",
            "O dossiê de outubro de 2025 atribui 54.450 m de desnível ao Tour 2026. O folheto de cifras de 24 de junho de 2026, ainda antes da largada, publica 53.950 m e 3.320,7 km no total. Nenhum dos dois reparte o desnível por todas as etapas. Onde o dossiê dá o número de uma etapa, ele fica no card.",
            "A soma das distâncias do card mistura a página do Grand Départ, nas três primeiras, com o quadro anterior à homologação do dossiê, nas restantes. Não foi ajustada ao total de 3.320,7 km do folheto de junho.",
        ],
        "etapas": _tour_etapas(),
    })


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
    return _aplicar_perfis_imagem({
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
        "fontes": [FONTE_VUELTA, FONTE_VUELTA_REGULAMENTO, FONTE_VUELTA_ROADBOOK],
        "camisas": [
            {
                "id": "gc",
                "nomeClasse": "geral",
                "unidade": "tempo",
                "cor": "#e10600",
                "rotulo": "Vermelha",
                "oficialConfirmado": True,
                "prioridade": 1,
                "nota": "Líder da geral por tempos. Regulamento particular da 81.ª edição.",
            },
            {
                "id": "pontos",
                "nomeClasse": "pontos",
                "unidade": "pontos",
                "cor": "#1f8f4e",
                "rotulo": "Verde",
                "oficialConfirmado": True,
                "prioridade": 2,
                "nota": "Líder da classificação por pontos. Regulamento particular da 81.ª edição.",
            },
            {
                "id": "montanha",
                "nomeClasse": "montanha",
                "unidade": "pontos",
                "cor": "#1e4fbf",
                "rotulo": "Bolinhas azuis",
                "oficialConfirmado": True,
                "prioridade": 3,
                "nota": "Camisola branca com bolinhas azuis, prémio da montanha. Regulamento particular da 81.ª edição.",
            },
            {
                "id": "jovem",
                "nomeClasse": "jovem",
                "unidade": "tempo",
                "cor": "#f4f1e6",
                "rotulo": "Branca",
                "oficialConfirmado": True,
                "prioridade": 4,
                "nota": "Melhor jovem na geral. Nascidos a partir de 1º de janeiro de 2001.",
            },
        ],
        "regulamento": {
            "oficialConfirmado": True,
            "fonte": FONTE_VUELTA_REGULAMENTO["url"],
            "prioridadeVestimenta": ["gc", "pontos", "montanha", "jovem"],
            "prioridadeConfirmada": True,
            "notaPrioridade": (
                "O regulamento numera as camisolas nessa ordem. Quem lidera duas usa a de maior prioridade "
                "e a outra passa ao seguinte dessa classificação que não lidere outra. "
                "O mesmo artigo remete também aos artigos 1.3.071 e 2.6.018 da UCI."
            ),
            "jovem": {"nascidoAPartirDe": "2001-01-01", "confirmado": True},
            "tabelaPontosChegada": {
                "grupo1_etapas_11_17": [50, 30, 20, 18, 16, 14, 12, 10, 8, 7, 6, 5, 4, 3, 2],
                "grupo2_3_etapas_2_3_5_8_10_13_15_16_21": [30, 25, 22, 19, 17, 15, 13, 11, 9, 7, 6, 5, 4, 3, 2],
                "grupo4_5_e_cronos": [20, 17, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
            },
            "sprintIntermediarioPontos": [20, 17, 15, 13, 10],
            "montanhaPontos": {
                "cima_alberto_fernandez": [20, 15, 10, 6, 4, 2],
                "especial": [15, 10, 6, 4, 2, 1],
                "1": [10, 6, 4, 2, 1],
                "2": [5, 3, 1],
                "3": [3, 2, 1],
            },
        },
        "classificacaoEquipes": {
            "habilitada": False,
            "previstaNoRegulamento": True,
            "oficialConfirmado": True,
            "nota": (
                "O regulamento soma os três melhores tempos de cada equipe na etapa e na geral. "
                "O painel fica desligado até um snapshot autorizado."
            ),
        },
        "observacoes": [
            "Nenhuma etapa está liberada.",
            "Perfis altimétricos: 0 de 21. A tabela oficial de percurso não traz série nem imagem de perfil por etapa.",
            "A página de percurso anuncia 3.275 km no total. A soma da coluna de distância das 21 etapas, com os números publicados na mesma tabela em 9 de novembro de 2026, dá 3.231,9 km. A diferença não foi ajustada.",
            "O regulamento particular marca o total como aproximado, cerca de 3.308 km, e diverge da tabela do site em várias etapas. O roadbook de dezembro de 2025 usa distâncias arredondadas e soma 3.275 km antes da homologação. O card mantém a tabela do site.",
            "A mesma página conta 4 onduladas, 1 ondulada com chegada em subida, 4 planas, 4 de média montanha, 6 de montanha, 2 contra-relógios e 2 dias de descanso.",
        ],
        "etapas": _vuelta_etapas(),
    })


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
