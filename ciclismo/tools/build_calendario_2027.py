#!/usr/bin/env python3
"""Gera ciclismo/data/2027.json só com datas já publicadas.

WorldTour e Women's WorldTour: comunicados da UCI (junho de 2026 e
acertos do comitê de setembro). Mundiais: comunicado da UCI sobre
Haute-Savoie. As demais provas são as que já estavam em 2026 e têm
início e fim no calendário internacional publicado em 29 de setembro
de 2026 (conferidas na velowire e no SpazioCiclismo quando a prova é
ProSeries). Prova sem data fechada não entra neste arquivo.
"""

from __future__ import annotations

import json
from pathlib import Path

# nome, inicio, fim, pais, codigo, cat, gen, classe, extras
PROVAS = [
    # --- WorldTour masculino (UCI, com Eschborn em 1º de maio) ---
    ("Santos Tour Down Under", "2027-01-19", "2027-01-24", "Austrália", "AU", "Tour", "M", "2.UWT", {}),
    ("Cadel Evans Great Ocean Road Race", "2027-01-31", "2027-01-31", "Austrália", "AU", "Clássica", "M", "1.UWT", {}),
    ("UAE Tour", "2027-02-15", "2027-02-21", "Emirados Árabes Unidos", "AE", "Tour", "M", "2.UWT", {}),
    ("Omloop Het Nieuwsblad", "2027-02-27", "2027-02-27", "Bélgica", "BE", "Clássica", "M", "1.UWT", {}),
    ("Strade Bianche", "2027-03-06", "2027-03-06", "Itália", "IT", "Clássica", "M", "1.UWT", {}),
    ("Paris-Nice", "2027-03-07", "2027-03-14", "França", "FR", "Tour", "M", "2.UWT", {}),
    ("Tirreno-Adriático", "2027-03-08", "2027-03-14", "Itália", "IT", "Tour", "M", "2.UWT", {}),
    ("Milão-Sanremo", "2027-03-20", "2027-03-20", "Itália", "IT", "Monumento", "M", "1.UWT", {}),
    ("Volta à Catalunha", "2027-03-22", "2027-03-28", "Espanha", "ES", "Tour", "M", "2.UWT", {}),
    ("Tour de Bruges", "2027-03-24", "2027-03-24", "Bélgica", "BE", "Clássica", "M", "1.UWT", {}),
    ("E3 Saxo Classic", "2027-03-26", "2027-03-26", "Bélgica", "BE", "Clássica", "M", "1.UWT", {}),
    ("Gent-Wevelgem (In Flanders Fields)", "2027-03-28", "2027-03-28", "Bélgica", "BE", "Clássica", "M", "1.UWT", {}),
    ("Dwars door Vlaanderen", "2027-03-31", "2027-03-31", "Bélgica", "BE", "Clássica", "M", "1.UWT", {}),
    ("Volta à Flandres", "2027-04-04", "2027-04-04", "Bélgica", "BE", "Monumento", "M", "1.UWT", {}),
    ("Itzulia Basque Country", "2027-04-05", "2027-04-10", "Espanha", "ES", "Tour", "M", "2.UWT", {}),
    ("Paris-Roubaix", "2027-04-11", "2027-04-11", "França", "FR", "Monumento", "M", "1.UWT", {}),
    ("Amstel Gold Race", "2027-04-18", "2027-04-18", "Holanda", "NL", "Clássica", "M", "1.UWT", {}),
    ("Flecha Valona", "2027-04-21", "2027-04-21", "Bélgica", "BE", "Clássica", "M", "1.UWT", {}),
    ("Liège-Bastogne-Liège", "2027-04-25", "2027-04-25", "Bélgica", "BE", "Monumento", "M", "1.UWT", {}),
    ("Tour de Romandie", "2027-04-27", "2027-05-02", "Suíça", "CH", "Tour", "M", "2.UWT", {}),
    ("Eschborn-Frankfurt", "2027-05-01", "2027-05-01", "Alemanha", "DE", "Clássica", "M", "1.UWT", {}),
    ("Giro d'Italia", "2027-05-08", "2027-05-30", "Itália", "IT", "Tour", "M", "2.UWT", {}),
    ("Tour Auvergne-Rhône-Alpes", "2027-06-06", "2027-06-13", "França", "FR", "Tour", "M", "2.UWT", {}),
    ("Copenhagen Sprint", "2027-06-13", "2027-06-13", "Dinamarca", "DK", "Clássica", "M", "1.UWT", {}),
    ("Tour de Suisse", "2027-06-16", "2027-06-20", "Suíça", "CH", "Tour", "M", "2.UWT", {}),
    ("Tour de France", "2027-07-02", "2027-07-25", "França", "FR", "Tour", "M", "2.UWT", {}),
    ("Clássica de San Sebastián", "2027-07-31", "2027-07-31", "Espanha", "ES", "Clássica", "M", "1.UWT", {}),
    ("Volta à Polônia", "2027-08-02", "2027-08-08", "Polônia", "PL", "Tour", "M", "2.UWT", {}),
    ("Cyclassics Hamburgo", "2027-08-15", "2027-08-15", "Alemanha", "DE", "Clássica", "M", "1.UWT", {}),
    ("Renewi Tour", "2027-08-18", "2027-08-22", "Bélgica", "BE", "Tour", "M", "2.UWT", {
        "bandeiras": ["BE", "NL"],
        "aviso": "Ex-Tour do Benelux. Cruza a Bélgica e os Países Baixos.",
    }),
    ("Bretagne Classic", "2027-08-22", "2027-08-22", "França", "FR", "Clássica", "M", "1.UWT", {}),
    ("Volta à Espanha", "2027-09-04", "2027-09-26", "Espanha", "ES", "Tour", "M", "2.UWT", {}),
    ("GP de Québec", "2027-09-10", "2027-09-10", "Canadá", "CA", "Clássica", "M", "1.UWT", {}),
    ("GP de Montreal", "2027-09-12", "2027-09-12", "Canadá", "CA", "Clássica", "M", "1.UWT", {}),
    ("Il Lombardia", "2027-10-09", "2027-10-09", "Itália", "IT", "Monumento", "M", "1.UWT", {}),
    ("Tour de Guangxi", "2027-10-12", "2027-10-17", "China", "CN", "Tour", "M", "2.UWT", {}),
    # --- Women's WorldTour (UCI; Burgos e Vuelta feminina no acerto de setembro) ---
    ("Santos Tour Down Under feminino", "2027-01-22", "2027-01-24", "Austrália", "AU", "Tour", "F", "2.WWT", {}),
    ("Cadel Evans Great Ocean Road Race feminino", "2027-01-30", "2027-01-30", "Austrália", "AU", "Clássica", "F", "1.WWT", {}),
    ("UAE Tour feminino", "2027-02-03", "2027-02-06", "Emirados Árabes Unidos", "AE", "Tour", "F", "2.WWT", {}),
    ("Omloop Het Nieuwsblad feminino", "2027-02-27", "2027-02-27", "Bélgica", "BE", "Clássica", "F", "1.WWT", {}),
    ("Strade Bianche feminino", "2027-03-06", "2027-03-06", "Itália", "IT", "Clássica", "F", "1.WWT", {}),
    ("Trofeo Alfredo Binda", "2027-03-14", "2027-03-14", "Itália", "IT", "Clássica", "F", "1.WWT", {}),
    ("Milão-Sanremo feminino", "2027-03-20", "2027-03-20", "Itália", "IT", "Monumento", "F", "1.WWT", {}),
    ("Tour de Bruges feminino", "2027-03-25", "2027-03-25", "Bélgica", "BE", "Clássica", "F", "1.WWT", {}),
    ("Gent-Wevelgem feminino (In Flanders Fields)", "2027-03-28", "2027-03-28", "Bélgica", "BE", "Clássica", "F", "1.WWT", {}),
    ("Dwars door Vlaanderen feminino", "2027-03-31", "2027-03-31", "Bélgica", "BE", "Clássica", "F", "1.WWT", {}),
    ("Volta à Flandres feminina", "2027-04-04", "2027-04-04", "Bélgica", "BE", "Monumento", "F", "1.WWT", {}),
    ("Paris-Roubaix feminina", "2027-04-11", "2027-04-11", "França", "FR", "Monumento", "F", "1.WWT", {}),
    ("Amstel Gold Race feminina", "2027-04-18", "2027-04-18", "Holanda", "NL", "Clássica", "F", "1.WWT", {}),
    ("Flecha Valona feminina", "2027-04-21", "2027-04-21", "Bélgica", "BE", "Clássica", "F", "1.WWT", {}),
    ("Liège-Bastogne-Liège feminina", "2027-04-25", "2027-04-25", "Bélgica", "BE", "Monumento", "F", "1.WWT", {}),
    ("Volta a Burgos feminina", "2027-05-06", "2027-05-10", "Espanha", "ES", "Tour", "F", "2.WWT", {}),
    ("Itzulia Women", "2027-05-14", "2027-05-16", "Espanha", "ES", "Tour", "F", "2.WWT", {}),
    ("Giro d'Italia feminino", "2027-05-29", "2027-06-06", "Itália", "IT", "Tour", "F", "2.WWT", {}),
    ("Copenhagen Sprint feminino", "2027-06-12", "2027-06-12", "Dinamarca", "DK", "Clássica", "F", "1.WWT", {}),
    ("Tour de Suisse feminino", "2027-06-16", "2027-06-20", "Suíça", "CH", "Tour", "F", "2.WWT", {}),
    ("Tour de France feminino", "2027-07-30", "2027-08-07", "França", "FR", "Tour", "F", "2.WWT", {}),
    ("Volta à Grã-Bretanha feminina", "2027-08-11", "2027-08-15", "Reino Unido", "GB", "Tour", "F", "2.WWT", {}),
    ("Classic Lorient Agglomération", "2027-08-21", "2027-08-21", "França", "FR", "Clássica", "F", "1.WWT", {}),
    ("Tour de Romandie feminino", "2027-09-10", "2027-09-12", "Suíça", "CH", "Tour", "F", "2.WWT", {
        "aviso": "Edição adiada de 2026. A UCI marcou 10 a 12 de setembro de 2027.",
    }),
    ("Volta à Espanha feminina", "2027-10-03", "2027-10-10", "Espanha", "ES", "Tour", "F", "2.WWT", {}),
    ("Tour de Chongming feminino", "2027-10-12", "2027-10-14", "China", "CN", "Tour", "F", "2.WWT", {}),
    # --- Mundiais (comunicado UCI, Haute-Savoie) ---
    ("Mundial de estrada UCI", "2027-08-24", "2027-09-05", "França", "FR", "Mundial", "A", "WC", {
        "aviso": "Haute-Savoie Mont-Blanc, de 24 de agosto a 5 de setembro. Estrada elite masculina em 29 de agosto (Sallanches–Domancy); contrarrelógio elite em 1º de setembro (lago de Annecy); estrada elite feminina em 5 de setembro.",
    }),
    ("Mundial de gravel UCI", "2027-08-26", "2027-08-27", "França", "FR", "Mundial", "A", "WC", {
        "aviso": "Gravel dos Super Mundiais, em Châtel–Portes du Soleil, nos dias 26 e 27 de agosto.",
    }),
    # --- Outras provas de 2026 com data fechada em 2027 ---
    ("Challenge Mallorca — Trofeo Calvià", "2027-01-27", "2027-01-27", "Espanha", "ES", "Clássica", "M", "1.1", {}),
    ("Challenge Mallorca — Trofeo Ses Salines", "2027-01-28", "2027-01-28", "Espanha", "ES", "Clássica", "M", "1.1", {}),
    ("Challenge Mallorca — Trofeo Serra de Tramuntana", "2027-01-29", "2027-01-29", "Espanha", "ES", "Clássica", "M", "1.1", {}),
    ("Challenge Mallorca — Trofeo Pollença-Andratx", "2027-01-30", "2027-01-30", "Espanha", "ES", "Clássica", "M", "1.1", {}),
    ("Challenge Mallorca — Trofeo Palma", "2027-01-31", "2027-01-31", "Espanha", "ES", "Clássica", "M", "1.1", {}),
    ("AlUla Tour", "2027-01-25", "2027-01-29", "Arábia Saudita", "SA", "Tour", "M", "2.Pro", {}),
    ("GP La Marseillaise", "2027-01-31", "2027-01-31", "França", "FR", "Clássica", "M", "1.1", {}),
    ("Estrela de Bessèges", "2027-02-03", "2027-02-07", "França", "FR", "Tour", "M", "2.1", {}),
    ("Volta a Múrcia", "2027-02-12", "2027-02-13", "Espanha", "ES", "Tour", "M", "2.1", {}),
    ("Figueira Champions Classic", "2027-02-13", "2027-02-13", "Portugal", "PT", "Clássica", "M", "1.Pro", {
        "aviso": "A organização passou a prova para 13 de fevereiro, um dia antes da Clássica de Almería.",
    }),
    ("Clássica de Almería", "2027-02-14", "2027-02-14", "Espanha", "ES", "Clássica", "M", "1.Pro", {}),
    ("Clássica Jaén", "2027-02-15", "2027-02-15", "Espanha", "ES", "Clássica", "M", "1.1", {}),
    ("Volta à Andaluzia", "2027-02-17", "2027-02-21", "Espanha", "ES", "Tour", "M", "2.Pro", {}),
    ("Classic Var", "2027-02-20", "2027-02-20", "França", "FR", "Clássica", "M", "1.1", {}),
    ("Tour des Alpes-Maritimes", "2027-02-21", "2027-02-21", "França", "FR", "Clássica", "M", "1.1", {}),
    ("Faun-Ardèche Classic", "2027-02-27", "2027-02-27", "França", "FR", "Clássica", "M", "1.Pro", {}),
    ("Faun Drôme Classic", "2027-02-28", "2027-02-28", "França", "FR", "Clássica", "M", "1.Pro", {}),
    ("Kuurne-Bruxelas-Kuurne", "2027-02-28", "2027-02-28", "Bélgica", "BE", "Clássica", "M", "1.Pro", {}),
    ("Le Samyn (Ename Samyn Classic)", "2027-03-02", "2027-03-02", "Bélgica", "BE", "Clássica", "M", "1.1", {}),
    ("Milão-Turim", "2027-03-17", "2027-03-17", "Itália", "IT", "Clássica", "M", "1.Pro", {}),
    ("Nokere Koerse", "2027-03-17", "2027-03-17", "Bélgica", "BE", "Clássica", "M", "1.Pro", {}),
    ("GP de Denain", "2027-03-18", "2027-03-18", "França", "FR", "Clássica", "M", "1.Pro", {}),
    ("Bredene Koksijde Classic", "2027-03-19", "2027-03-19", "Bélgica", "BE", "Clássica", "M", "1.Pro", {}),
    ("Cholet Agglo Tour", "2027-03-21", "2027-03-21", "França", "FR", "Clássica", "M", "1.1", {}),
    ("Classic Loire Atlantique", "2027-03-27", "2027-03-27", "França", "FR", "Clássica", "M", "1.1", {}),
    ("La Route Tourangelle", "2027-03-28", "2027-03-28", "França", "FR", "Clássica", "M", "1.1", {}),
    ("Paris-Camembert", "2027-03-30", "2027-03-30", "França", "FR", "Clássica", "M", "1.1", {}),
    ("Classic Adélie de Vitré", "2027-04-02", "2027-04-02", "França", "FR", "Clássica", "M", "1.1", {}),
    ("GP Miguel Indurain", "2027-04-03", "2027-04-03", "Espanha", "ES", "Clássica", "M", "1.Pro", {}),
    ("Scheldeprijs", "2027-04-07", "2027-04-07", "Bélgica", "BE", "Clássica", "M", "1.Pro", {}),
    ("Classic Grand Besançon", "2027-04-16", "2027-04-16", "França", "FR", "Clássica", "M", "1.1", {}),
    ("Flecha do Brabante", "2027-04-16", "2027-04-16", "Bélgica", "BE", "Clássica", "M", "1.Pro", {}),
    ("Tour du Jura", "2027-04-17", "2027-04-17", "França", "FR", "Clássica", "M", "1.1", {}),
    ("Tour dos Alpes", "2027-04-19", "2027-04-23", "Itália", "IT", "Tour", "M", "2.Pro", {}),
    ("Volta à Turquia", "2027-04-25", "2027-05-02", "Turquia", "TR", "Tour", "M", "2.Pro", {}),
    ("GP do Morbihan", "2027-05-08", "2027-05-08", "França", "FR", "Clássica", "M", "1.Pro", {}),
    ("Tro Bro Léon", "2027-05-09", "2027-05-09", "França", "FR", "Clássica", "M", "1.Pro", {}),
    ("Volta à Hungria", "2027-05-12", "2027-05-16", "Hungria", "HU", "Tour", "M", "2.Pro", {}),
    ("Clássica de Dunquerque", "2027-05-18", "2027-05-18", "França", "FR", "Clássica", "M", "1.Pro", {}),
    ("Quatro Dias de Dunquerque", "2027-05-19", "2027-05-23", "França", "FR", "Tour", "M", "2.Pro", {}),
    ("Boucles de la Mayenne", "2027-05-27", "2027-05-30", "França", "FR", "Tour", "M", "2.Pro", {}),
    ("Famenne Ardenne Classic", "2027-05-30", "2027-05-30", "Bélgica", "BE", "Clássica", "M", "1.1", {}),
    ("Mercan'Tour Classic", "2027-06-02", "2027-06-02", "França", "FR", "Clássica", "M", "1.1", {}),
    ("Brussels Cycling Classic", "2027-06-06", "2027-06-06", "Bélgica", "BE", "Clássica", "M", "1.Pro", {}),
    ("GP Gippingen", "2027-06-13", "2027-06-13", "Suíça", "CH", "Clássica", "M", "1.1", {}),
    ("Rota da Occitânia", "2027-06-17", "2027-06-19", "França", "FR", "Tour", "M", "2.1", {}),
    ("Volta à Eslovênia", "2027-06-17", "2027-06-20", "Eslovênia", "SI", "Tour", "M", "2.Pro", {}),
    ("Nacionais de estrada — Espanha, França e Itália", "2027-06-23", "2027-06-27", "Espanha, França e Itália", "ES", "Nacional", "A", "NC", {
        "bandeiras": ["ES", "FR", "IT"],
        "aviso": "Janela publicada no calendário UCI: Espanha e Itália de 23 a 27 de junho; França de 24 a 27. O dia da prova de estrada elite ainda não está destacado.",
    }),
    ("Volta à Áustria", "2027-07-07", "2027-07-11", "Áustria", "AT", "Tour", "M", "2.1", {}),
    ("Clássica de Ordizia", "2027-07-25", "2027-07-25", "Espanha", "ES", "Clássica", "M", "1.1", {}),
    ("Tour de l'Ain", "2027-07-27", "2027-07-29", "França", "FR", "Tour", "M", "2.1", {}),
    ("Volta à Dinamarca", "2027-07-28", "2027-08-01", "Dinamarca", "DK", "Tour", "M", "2.Pro", {}),
    ("Vuelta a Burgos", "2027-08-03", "2027-08-07", "Espanha", "ES", "Tour", "M", "2.Pro", {}),
    ("Arctic Race of Norway", "2027-08-12", "2027-08-15", "Noruega", "NO", "Tour", "M", "2.Pro", {}),
    ("Czech Tour", "2027-08-12", "2027-08-15", "Tchéquia", "CZ", "Tour", "M", "2.Pro", {}),
    ("Volta à Alemanha", "2027-08-18", "2027-08-22", "Alemanha", "DE", "Tour", "M", "2.Pro", {}),
    ("Giro d'Abruzzo", "2027-09-14", "2027-09-17", "Itália", "IT", "Tour", "M", "2.1", {}),
    ("Volta a Luxemburgo", "2027-09-15", "2027-09-19", "Luxemburgo", "LU", "Tour", "M", "2.Pro", {}),
    ("Volta à Eslováquia", "2027-09-15", "2027-09-19", "Eslováquia", "SK", "Tour", "M", "2.1", {}),
    ("Campeonato de Flandres", "2027-09-17", "2027-09-17", "Bélgica", "BE", "Clássica", "M", "1.1", {}),
    ("Flandrien Classic", "2027-09-18", "2027-09-18", "Bélgica", "BE", "Clássica", "M", "1.Pro", {
        "aviso": "No calendário de 2026 esta prova aparecia como Super 8 Classic.",
    }),
    ("CRO Race", "2027-09-22", "2027-09-26", "Croácia", "HR", "Tour", "M", "2.Pro", {}),
    ("GP Larciano (Industria & Artigianato)", "2027-09-26", "2027-09-26", "Itália", "IT", "Clássica", "M", "1.Pro", {}),
    ("Giro dell'Emilia", "2027-10-02", "2027-10-02", "Itália", "IT", "Clássica", "M", "1.Pro", {}),
    ("Tour de Langkawi", "2027-10-03", "2027-10-10", "Malásia", "MY", "Tour", "M", "2.Pro", {}),
    ("Binche-Chimay-Binche", "2027-10-05", "2027-10-05", "Bélgica", "BE", "Clássica", "M", "1.1", {}),
    ("Tre Valli Varesine", "2027-10-05", "2027-10-05", "Itália", "IT", "Clássica", "M", "1.Pro", {}),
    ("Gran Piemonte", "2027-10-07", "2027-10-07", "Itália", "IT", "Clássica", "M", "1.Pro", {}),
    ("Paris-Tours", "2027-10-10", "2027-10-10", "França", "FR", "Clássica", "M", "1.Pro", {}),
    ("Giro del Veneto", "2027-10-13", "2027-10-13", "Itália", "IT", "Clássica", "M", "1.Pro", {}),
    ("Veneto Classic", "2027-10-17", "2027-10-17", "Itália", "IT", "Clássica", "M", "1.Pro", {}),
]


def montar():
    provas = []
    for nome, inicio, fim, pais, codigo, cat, gen, classe, extra in PROVAS:
        item = {
            "nome": nome,
            "inicio": inicio,
            "fim": fim,
            "pais": pais,
            "codigo": codigo,
            "cat": cat,
            "gen": gen,
            "etapas": 1 if inicio == fim else None,
            "fixo": True,
            "classe": classe,
        }
        item.update(extra)
        provas.append(item)
    provas.sort(key=lambda p: (p["inicio"], p["fim"], p["nome"]))
    for i, prova in enumerate(provas, start=1):
        prova["id"] = f"c{i}"
        ordenado = {"id": prova["id"]}
        for chave in ("nome", "inicio", "fim", "pais", "codigo", "cat", "gen", "etapas", "fixo", "classe"):
            ordenado[chave] = prova[chave]
        for chave in ("bandeiras", "aviso", "status", "largada"):
            if chave in prova:
                ordenado[chave] = prova[chave]
        provas[i - 1] = ordenado
    return provas


def validar(provas):
    ids = [p["id"] for p in provas]
    if len(ids) != len(set(ids)):
        raise SystemExit("id repetido")
    chaves = [(p["nome"], p["inicio"], p["gen"]) for p in provas]
    if len(chaves) != len(set(chaves)):
        raise SystemExit("prova repetida")
    anterior = None
    for prova in provas:
        if prova["inicio"] > prova["fim"]:
            raise SystemExit(f"intervalo inválido: {prova['nome']}")
        marca = (prova["inicio"], prova["fim"], prova["nome"])
        if anterior is not None and marca < anterior:
            raise SystemExit(f"fora de ordem: {prova['nome']}")
        anterior = marca
        if not prova["codigo"].isalpha() or len(prova["codigo"]) != 2:
            raise SystemExit(f"código inválido: {prova['nome']}")


def main():
    provas = montar()
    validar(provas)
    destino = Path(__file__).resolve().parents[1] / "data" / "2027.json"
    doc = {
        "ano": 2027,
        "titulo": "Temporada 2027",
        "atualizado": "2026-10-24",
        "nota": (
            "WorldTour, Women's WorldTour e Mundiais conferidos nos comunicados da UCI. "
            "Eschborn-Frankfurt ficou em 1º de maio, a Volta a Burgos feminina em 6–10 de maio "
            "e a Volta à Espanha feminina em 3–10 de outubro, pelos acertos de setembro. "
            "As outras provas são as de 2026 que já têm data fechada. "
            "O número de etapas só entra nas provas de um dia; nas voltas vale o intervalo anunciado."
        ),
        "provas": provas,
    }
    destino.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(provas)} provas → {destino}")


if __name__ == "__main__":
    main()
