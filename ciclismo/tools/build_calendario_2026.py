#!/usr/bin/env python3
"""Gera ciclismo/data/2026.json a partir das provas conferidas."""
import json
from pathlib import Path

# id, nome, inicio, fim, pais, codigo, cat, gen, etapas, classe, extras
R = []

def add(id, nome, inicio, fim, pais, codigo, cat, gen, etapas, classe=None, **extra):
    item = {
        "id": id,
        "nome": nome,
        "inicio": inicio,
        "fim": fim,
        "pais": pais,
        "codigo": codigo,
        "cat": cat,
        "gen": gen,
        "etapas": etapas,
        "fixo": True,
    }
    if classe:
        item["classe"] = classe
    item.update(extra)
    R.append(item)

add("b42", "Santos Tour Down Under feminino", "2026-01-17", "2026-01-19", "Austrália", "AU", "Tour", "F", 3, "2.WWT")
add("b1", "Santos Tour Down Under", "2026-01-20", "2026-01-25", "Austrália", "AU", "Tour", "M", 6, "2.UWT")
add("b113", "Santos Women's Tour (um dia)", "2026-01-21", "2026-01-21", "Austrália", "AU", "Clássica", "F", 1, "1.Pro")
add("b114", "Challenge Mallorca feminino", "2026-01-24", "2026-01-26", "Espanha", "ES", "Clássica", "F", 3, "1.1")
add("b115", "AlUla Tour", "2026-01-27", "2026-01-31", "Arábia Saudita", "SA", "Tour", "M", 5, "2.Pro")
add("b116", "Challenge Mallorca", "2026-01-28", "2026-02-01", "Espanha", "ES", "Clássica", "M", 5, "1.1")
add("b117", "Cadel Evans Great Ocean Road Race feminino", "2026-01-31", "2026-01-31", "Austrália", "AU", "Clássica", "F", 1, "1.WWT")
add("b118", "Cadel Evans Great Ocean Road Race", "2026-02-01", "2026-02-01", "Austrália", "AU", "Clássica", "M", 1, "1.UWT")
add("b50", "GP La Marseillaise", "2026-02-01", "2026-02-01", "França", "FR", "Clássica", "M", 1, "1.1")
add("b119", "Volta à Comunidade Valenciana", "2026-02-04", "2026-02-08", "Espanha", "ES", "Tour", "M", 5, "2.Pro")
add("b120", "Estrela de Bessèges", "2026-02-04", "2026-02-08", "França", "FR", "Tour", "M", 5, "2.1")
add("b43", "UAE Tour feminino", "2026-02-05", "2026-02-08", "Emirados Árabes Unidos", "AE", "Tour", "F", 4, "2.WWT")
add("b121", "Volta CV Féminas", "2026-02-08", "2026-02-08", "Espanha", "ES", "Clássica", "F", 1, "1.Pro")
add("b123", "Volta a Múrcia", "2026-02-13", "2026-02-14", "Espanha", "ES", "Tour", "M", 2, "2.1")
add("b122", "Tour de la Provence", "2026-02-13", "2026-02-15", "França", "FR", "Tour", "M", 3, "2.1")
add("b51", "Figueira Champions Classic", "2026-02-14", "2026-02-14", "Portugal", "PT", "Clássica", "M", 1, "1.Pro")
add("b52", "Clássica de Almería", "2026-02-15", "2026-02-15", "Espanha", "ES", "Clássica", "M", 1, "1.Pro")
add("b53", "Clássica Jaén", "2026-02-16", "2026-02-16", "Espanha", "ES", "Clássica", "M", 1, "1.1")
add("b2", "UAE Tour", "2026-02-16", "2026-02-22", "Emirados Árabes Unidos", "AE", "Tour", "M", 7, "2.UWT")
add("b124", "Volta à Andaluzia", "2026-02-18", "2026-02-22", "Espanha", "ES", "Tour", "M", 5, "2.Pro")
add("b125", "Volta ao Algarve", "2026-02-18", "2026-02-22", "Portugal", "PT", "Tour", "M", 5, "2.Pro")
add("b54", "Classic Var", "2026-02-21", "2026-02-21", "França", "FR", "Clássica", "M", 1, "1.1")
add("b126", "Tour des Alpes-Maritimes", "2026-02-22", "2026-02-22", "França", "FR", "Clássica", "M", 1, "1.1")
add("b26", "Omloop Het Nieuwsblad", "2026-02-28", "2026-02-28", "Bélgica", "BE", "Clássica", "M", 1, "1.UWT")
add("b55", "Omloop Het Nieuwsblad feminino", "2026-02-28", "2026-02-28", "Bélgica", "BE", "Clássica", "F", 1, "1.WWT")
add("b127", "Faun-Ardèche Classic", "2026-02-28", "2026-02-28", "França", "FR", "Clássica", "M", 1, "1.Pro")
add("b56", "Kuurne-Bruxelas-Kuurne", "2026-03-01", "2026-03-01", "Bélgica", "BE", "Clássica", "M", 1, "1.Pro")
add("b57", "Faun Drôme Classic", "2026-03-01", "2026-03-01", "França", "FR", "Clássica", "M", 1, "1.Pro")
add("b58", "Le Samyn des Dames", "2026-03-02", "2026-03-02", "Bélgica", "BE", "Clássica", "F", 1, "1.1")
add("b129", "Le Samyn (Ename Samyn Classic)", "2026-03-03", "2026-03-03", "Bélgica", "BE", "Clássica", "M", 1, "1.1")
add("b59", "Trofeo Laigueglia", "2026-03-04", "2026-03-04", "Itália", "IT", "Clássica", "M", 1, "1.Pro")
add("b27", "Strade Bianche", "2026-03-07", "2026-03-07", "Itália", "IT", "Clássica", "M", 1, "1.UWT")
add("b39", "Strade Bianche feminino", "2026-03-07", "2026-03-07", "Itália", "IT", "Clássica", "F", 1, "1.WWT")
add("b3", "Paris-Nice", "2026-03-08", "2026-03-15", "França", "FR", "Tour", "M", 8, "2.UWT")
add("b4", "Tirreno-Adriático", "2026-03-09", "2026-03-15", "Itália", "IT", "Tour", "M", 7, "2.UWT")
add("b60", "Trofeo Alfredo Binda", "2026-03-15", "2026-03-15", "Itália", "IT", "Clássica", "F", 1, "1.WWT")
add("b61", "Nokere Koerse", "2026-03-18", "2026-03-18", "Bélgica", "BE", "Clássica", "M", 1, "1.Pro")
add("b62", "Milão-Turim", "2026-03-18", "2026-03-18", "Itália", "IT", "Clássica", "M", 1, "1.Pro")
add("b63", "GP de Denain", "2026-03-19", "2026-03-19", "França", "FR", "Clássica", "M", 1, "1.Pro")
add("b64", "Bredene Koksijde Classic", "2026-03-20", "2026-03-20", "Bélgica", "BE", "Clássica", "M", 1, "1.Pro")
add("b16", "Milão-Sanremo", "2026-03-21", "2026-03-21", "Itália", "IT", "Monumento", "M", 1, "1.UWT")
add("b21", "Milão-Sanremo feminino", "2026-03-21", "2026-03-21", "Itália", "IT", "Monumento", "F", 1, "1.WWT")
add("b65", "Clássica Terres de l'Ebre", "2026-03-21", "2026-03-21", "Espanha", "ES", "Clássica", "M", 1, "1.1")
add("b5", "Volta à Catalunha", "2026-03-23", "2026-03-29", "Espanha", "ES", "Tour", "M", 7, "2.UWT")
add("b66", "Tour de Bruges", "2026-03-25", "2026-03-25", "Bélgica", "BE", "Clássica", "M", 1, "1.UWT",
    aviso="No calendário UCI de 2026 a prova masculina é de um dia (25 de março). A feminina, também WorldTour, foi no dia 26.")
add("b28", "E3 Saxo Classic", "2026-03-27", "2026-03-27", "Bélgica", "BE", "Clássica", "M", 1, "1.UWT")
add("b67", "Classic Loire Atlantique", "2026-03-28", "2026-03-28", "França", "FR", "Clássica", "M", 1, "1.2")
add("b68", "Gent-Wevelgem (In Flanders Fields)", "2026-03-29", "2026-03-29", "Bélgica", "BE", "Clássica", "M", 1, "1.UWT")
add("b69", "La Route Tourangelle", "2026-03-29", "2026-03-29", "França", "FR", "Clássica", "M", 1, "1.1")
add("b70", "Paris-Camembert", "2026-03-31", "2026-03-31", "França", "FR", "Clássica", "M", 1, "1.1")
add("b30", "Dwars door Vlaanderen", "2026-04-01", "2026-04-01", "Bélgica", "BE", "Clássica", "M", 1, "1.UWT")
add("b72", "Classic Adélie de Vitré", "2026-04-03", "2026-04-03", "França", "FR", "Clássica", "M", 1, "1.1")
add("b73", "GP Miguel Indurain", "2026-04-04", "2026-04-04", "Espanha", "ES", "Clássica", "M", 1, "1.Pro")
add("b17", "Volta à Flandres", "2026-04-05", "2026-04-05", "Bélgica", "BE", "Monumento", "M", 1, "1.UWT")
add("b22", "Volta à Flandres feminina", "2026-04-05", "2026-04-05", "Bélgica", "BE", "Monumento", "F", 1, "1.WWT")
add("b130", "Itzulia Basque Country", "2026-04-06", "2026-04-11", "Espanha", "ES", "Tour", "M", 6, "2.UWT")
add("b74", "Ronde de Mouscron", "2026-04-06", "2026-04-06", "Bélgica", "BE", "Clássica", "F", 1, "1.1",
    aviso="Em 2026 a Ronde de Mouscron do calendário UCI foi a prova feminina.")
add("b75", "Cholet Agglo Tour", "2026-04-06", "2026-04-06", "França", "FR", "Clássica", "M", 1, "1.1")
add("b76", "Scheldeprijs", "2026-04-08", "2026-04-08", "Bélgica", "BE", "Clássica", "M", 1, "1.Pro")
add("b131", "O Gran Camiño", "2026-04-14", "2026-04-18", "Espanha", "ES", "Tour", "M", 5, "2.1")
add("b132", "Ronde van Limburg", "2026-04-15", "2026-04-15", "Bélgica", "BE", "Clássica", "M", 1, "1.1",
    aviso="Hasselt–Tongeren. Não é a prova neerlandesa de Sittard-Geleen, cancelada em março.")
add("b18", "Paris-Roubaix", "2026-04-12", "2026-04-12", "França", "FR", "Monumento", "M", 1, "1.UWT")
add("b23", "Paris-Roubaix feminina", "2026-04-12", "2026-04-12", "França", "FR", "Monumento", "F", 1, "1.WWT",
    aviso="As duas Paris-Roubaix de 2026 foram no domingo 12 de abril.")
add("b77", "Flecha do Brabante", "2026-04-17", "2026-04-17", "Bélgica", "BE", "Clássica", "M", 1, "1.Pro")
add("b78", "Classic Grand Besançon", "2026-04-17", "2026-04-17", "França", "FR", "Clássica", "M", 1, "1.1")
add("b134", "Tour du Jura", "2026-04-18", "2026-04-18", "França", "FR", "Clássica", "M", 1, "1.1")
add("b31", "Amstel Gold Race", "2026-04-19", "2026-04-19", "Holanda", "NL", "Clássica", "M", 1, "1.UWT")
add("b40", "Amstel Gold Race feminina", "2026-04-19", "2026-04-19", "Holanda", "NL", "Clássica", "F", 1, "1.WWT")
add("b133", "Tour dos Alpes", "2026-04-20", "2026-04-24", "Itália", "IT", "Tour", "M", 5, "2.Pro")
add("b32", "Flecha Valona", "2026-04-22", "2026-04-22", "Bélgica", "BE", "Clássica", "M", 1, "1.UWT")
add("b41", "Flecha Valona feminina", "2026-04-22", "2026-04-22", "Bélgica", "BE", "Clássica", "F", 1, "1.WWT")
add("b44", "Volta à Turquia", "2026-04-26", "2026-05-03", "Turquia", "TR", "Tour", "M", 8, "2.Pro")
add("b19", "Liège-Bastogne-Liège", "2026-04-26", "2026-04-26", "Bélgica", "BE", "Monumento", "M", 1, "1.UWT")
add("b24", "Liège-Bastogne-Liège feminina", "2026-04-26", "2026-04-26", "Bélgica", "BE", "Monumento", "F", 1, "1.WWT")
add("b6", "Tour de Romandie", "2026-04-28", "2026-05-03", "Suíça", "CH", "Tour", "M", 6, "2.UWT")
add("b33", "Eschborn-Frankfurt", "2026-05-01", "2026-05-01", "Alemanha", "DE", "Clássica", "M", 1, "1.UWT")
add("b135", "Famenne Ardenne Classic", "2026-05-03", "2026-05-03", "Bélgica", "BE", "Clássica", "M", 1, "1.1")
add("b15", "Volta à Espanha feminina", "2026-05-03", "2026-05-10", "Espanha", "ES", "Tour", "F", 8, "2.WWT")
add("b7", "Giro d'Italia", "2026-05-08", "2026-05-31", "Itália", "IT", "Tour", "M", 21, "2.UWT",
    largada={"cidade": "Nessebar", "pais": "Bulgária", "codigo": "BG"},
    aviso="Grande Partida na Bulgária (Nessebar–Burgas). A etapa 16 entra na Suíça (Bellinzona–Carì).")
add("b79", "GP do Morbihan", "2026-05-09", "2026-05-09", "França", "FR", "Clássica", "M", 1, "1.Pro")
add("b80", "Tro Bro Léon", "2026-05-10", "2026-05-10", "França", "FR", "Clássica", "M", 1, "1.Pro")
add("b136", "Volta à Hungria", "2026-05-13", "2026-05-17", "Hungria", "HU", "Tour", "M", 5, "2.Pro")
add("b137", "Itzulia Women", "2026-05-15", "2026-05-17", "Espanha", "ES", "Tour", "F", 3, "2.WWT")
add("b81", "Boucles de l'Aulne", "2026-05-17", "2026-05-17", "França", "FR", "Clássica", "M", 1, "1.1")
add("b82", "Clássica de Dunquerque", "2026-05-19", "2026-05-19", "França", "FR", "Clássica", "M", 1, "1.Pro")
add("b138", "Quatro Dias de Dunquerque", "2026-05-20", "2026-05-24", "França", "FR", "Tour", "M", 5, "2.Pro")
add("b139", "Volta a Burgos feminina", "2026-05-21", "2026-05-24", "Espanha", "ES", "Tour", "F", 4, "2.WWT")
add("b83", "Antwerp Port Epic", "2026-05-25", "2026-05-25", "Bélgica", "BE", "Clássica", "M", 1, "1.1")
add("b140", "Boucles de la Mayenne", "2026-05-28", "2026-05-31", "França", "FR", "Tour", "M", 4, "2.Pro")
add("b14", "Giro d'Italia feminino", "2026-05-30", "2026-06-07", "Itália", "IT", "Tour", "F", 9, "2.WWT")
add("b141", "Volta à Valônia", "2026-06-01", "2026-06-05", "Bélgica", "BE", "Tour", "M", 5, "2.Pro")
add("b142", "Mercan'Tour Classic", "2026-06-03", "2026-06-03", "França", "FR", "Clássica", "M", 1, "1.1")
add("b84", "Brussels Cycling Classic", "2026-06-07", "2026-06-07", "Bélgica", "BE", "Clássica", "M", 1, "1.Pro")
add("b8", "Tour Auvergne-Rhône-Alpes", "2026-06-07", "2026-06-14", "França", "FR", "Tour", "M", 8, "2.UWT",
    aviso="Nome oficial em 2026 da prova que era o Critérium du Dauphiné.")
add("b144", "Tour feminino dos Pireneus", "2026-06-12", "2026-06-14", "França", "FR", "Tour", "F", 3, "2.Pro")
add("b145", "Copenhagen Sprint", "2026-06-14", "2026-06-14", "Dinamarca", "DK", "Clássica", "M", 1, "1.UWT")
add("b146", "GP Gippingen", "2026-06-14", "2026-06-14", "Suíça", "CH", "Clássica", "M", 1, "1.1",
    aviso="Leuggern, cantão de Argóvia. Também chamado GP do Cantão de Argóvia.")
add("b147", "Giro Next Gen (sub-23)", "2026-06-14", "2026-06-21", "Itália", "IT", "Tour", "M", 8, "2.2U")
add("b9", "Tour de Suisse", "2026-06-17", "2026-06-21", "Suíça", "CH", "Tour", "M", 5, "2.UWT")
add("b148", "Volta à Eslovênia", "2026-06-17", "2026-06-21", "Eslovênia", "SI", "Tour", "M", 5, "2.Pro")
add("b149", "Volta à Bélgica (Baloise)", "2026-06-17", "2026-06-21", "Bélgica", "BE", "Tour", "M", 5, "2.Pro")
add("b150", "Rota da Occitânia", "2026-06-18", "2026-06-20", "França", "FR", "Tour", "M", 3, "2.1")
add("b151", "Volta à Catalunha feminina", "2026-06-19", "2026-06-21", "Espanha", "ES", "Tour", "F", 3, "2.WWT")
add("b152", "Andorra MoraBanc Clàssica", "2026-06-21", "2026-06-21", "Andorra", "AD", "Clássica", "M", 1, "1.1")
add("b153", "Nacionais de estrada — Espanha, França e Itália", "2026-06-27", "2026-06-28", "Espanha, França e Itália", "ES", "Nacional", "A", None, "NC",
    bandeiras=["ES", "FR", "IT"],
    aviso="Fim de semana dos elites. França e Espanha: feminina no dia 27 e masculina no dia 28. Itália: masculina no dia 27 e feminina no dia 28.")
add("b10", "Tour de France", "2026-07-04", "2026-07-26", "França", "FR", "Tour", "M", 21, "2.UWT",
    largada={"cidade": "Barcelona", "pais": "Espanha", "codigo": "ES"})
add("b154", "Volta à Áustria", "2026-07-08", "2026-07-12", "Áustria", "AT", "Tour", "M", 5, "2.1")
add("b155", "Baloise Ladies Tour", "2026-07-15", "2026-07-19", "Bélgica", "BE", "Tour", "F", 5, "2.1")
add("b156", "Volta à Polônia feminina", "2026-07-24", "2026-07-26", "Polônia", "PL", "Tour", "F", 3, "2.Pro")
add("b85", "Clássica de Ordizia", "2026-07-25", "2026-07-25", "Espanha", "ES", "Clássica", "M", 1, "1.1")
add("b157", "Tour de l'Ain", "2026-07-28", "2026-07-30", "França", "FR", "Tour", "M", 3, "2.1")
add("b158", "Volta à Dinamarca", "2026-07-29", "2026-08-02", "Dinamarca", "DK", "Tour", "M", 5, "2.Pro")
add("b34", "Clássica de San Sebastián", "2026-08-01", "2026-08-01", "Espanha", "ES", "Clássica", "M", 1, "1.UWT")
add("b13", "Tour de France feminino", "2026-08-01", "2026-08-09", "França", "FR", "Tour", "F", 9, "2.WWT",
    largada={"cidade": "Lausana", "pais": "Suíça", "codigo": "CH"})
add("b11", "Volta à Polônia", "2026-08-03", "2026-08-09", "Polônia", "PL", "Tour", "M", 7, "2.UWT")
add("b159", "Czech Tour", "2026-08-13", "2026-08-16", "Tchéquia", "CZ", "Tour", "M", 4, "2.Pro")
add("b160", "Arctic Race of Norway", "2026-08-13", "2026-08-16", "Noruega", "NO", "Tour", "M", 4, "2.Pro")
add("b86", "Cyclassics Hamburgo", "2026-08-16", "2026-08-16", "Alemanha", "DE", "Clássica", "M", 1, "1.UWT")
add("b87", "Polynormande", "2026-08-16", "2026-08-16", "França", "FR", "Clássica", "M", 1, "1.1")
add("b161", "Tour du Limousin", "2026-08-18", "2026-08-21", "França", "FR", "Tour", "M", 4, "2.1")
add("b163", "Volta à Alemanha", "2026-08-19", "2026-08-23", "Alemanha", "DE", "Tour", "M", 4, "2.Pro")
add("b164", "Renewi Tour", "2026-08-19", "2026-08-23", "Bélgica", "BE", "Tour", "M", 5, "2.UWT",
    bandeiras=["BE", "NL"],
    aviso="Ex-Tour do Benelux. Cruza a Bélgica e os Países Baixos.")
add("b165", "Volta à Grã-Bretanha feminina", "2026-08-19", "2026-08-23", "Reino Unido", "GB", "Tour", "F", 5, "2.WWT")
add("b162", "Tour de l'Avenir", "2026-08-20", "2026-08-26", "França", "FR", "Tour", "M", 7, "2.2U",
    aviso="Sub-23. Largada em Ouistreham (Normandia) e final na Itália, em Ceresole Reale.")
add("b12", "Volta à Espanha", "2026-08-22", "2026-09-13", "Espanha", "ES", "Tour", "M", 21, "2.UWT",
    largada={"cidade": "Mônaco", "pais": "Mônaco", "codigo": "MC"},
    aviso="Depois de Mônaco a corrida atravessa a França e Andorra antes de descer a Espanha até Granada.")
add("b88", "Classic Lorient Agglomération", "2026-08-29", "2026-08-29", "França", "FR", "Clássica", "F", 1, "1.WWT")
add("b89", "Bretagne Classic", "2026-08-30", "2026-08-30", "França", "FR", "Clássica", "M", 1, "1.UWT")
add("b166", "Volta à Grã-Bretanha", "2026-09-02", "2026-09-06", "Reino Unido", "GB", "Tour", "M", 5, "2.Pro")
add("b45", "Tour de Romandie feminino", "2026-09-04", "2026-09-06", "Suíça", "CH", "Tour", "F", 3, "2.WWT",
    status="adiada",
    aviso="A organização adiou a edição de 2026 para 2027 (comunicado de 12 de maio de 2026).")
add("b90", "GP Larciano (Industria & Artigianato)", "2026-09-06", "2026-09-06", "Itália", "IT", "Clássica", "M", 1, "1.Pro")
add("b91", "Giro della Toscana", "2026-09-09", "2026-09-09", "Itália", "IT", "Clássica", "M", 1, "1.1")
add("b92", "Coppa Sabatini", "2026-09-10", "2026-09-10", "Itália", "IT", "Clássica", "M", 1, "1.Pro")
add("b35", "GP de Québec", "2026-09-11", "2026-09-11", "Canadá", "CA", "Clássica", "M", 1, "1.UWT")
add("b36", "GP de Montreal", "2026-09-13", "2026-09-13", "Canadá", "CA", "Clássica", "M", 1, "1.UWT")
add("b93", "GP de Fourmies", "2026-09-13", "2026-09-13", "França", "FR", "Clássica", "M", 1, "1.Pro")
add("b167", "Giro d'Abruzzo", "2026-09-15", "2026-09-18", "Itália", "IT", "Tour", "M", 4, "2.1")
add("b168", "Volta à Eslováquia", "2026-09-16", "2026-09-20", "Eslováquia", "SK", "Tour", "M", 5, "2.1")
add("b169", "Volta a Luxemburgo", "2026-09-16", "2026-09-20", "Luxemburgo", "LU", "Tour", "M", 5, "2.Pro")
add("b94", "Campeonato de Flandres", "2026-09-18", "2026-09-18", "Bélgica", "BE", "Clássica", "M", 1, "1.1")
add("b95", "Super 8 Classic", "2026-09-19", "2026-09-19", "Bélgica", "BE", "Clássica", "M", 1, "1.Pro")
add("b37", "Mundial de estrada UCI", "2026-09-20", "2026-09-27", "Canadá", "CA", "Mundial", "A", None, "WC",
    aviso="Montreal. A elite masculina corre no dia 27 e a feminina no dia 26. Ruanda sediou o Mundial de 2025, não o de 2026.")
add("b170", "CRO Race", "2026-09-22", "2026-09-27", "Croácia", "HR", "Tour", "M", 6, "2.Pro")
add("b46", "Tour de Langkawi", "2026-09-27", "2026-10-04", "Malásia", "MY", "Tour", "M", 8, "2.Pro")
add("b97", "Giro dell'Emilia", "2026-10-03", "2026-10-03", "Itália", "IT", "Clássica", "M", 1, "1.Pro")
add("b171", "Europeu de estrada", "2026-10-02", "2026-10-07", "Eslovênia", "SI", "Mundial", "A", None, "CC",
    aviso="Liubliana e Šenčur, de 2 a 7 de outubro. A prova de estrada da elite masculina foi no dia 4.")
add("b99", "Tour de Vendée", "2026-10-04", "2026-10-04", "França", "FR", "Clássica", "M", 1, "1.1")
add("b100", "Tre Valli Varesine", "2026-10-06", "2026-10-06", "Itália", "IT", "Clássica", "M", 1, "1.Pro")
add("b101", "Binche-Chimay-Binche", "2026-10-06", "2026-10-06", "Bélgica", "BE", "Clássica", "M", 1, "1.1")
add("b102", "Gran Piemonte", "2026-10-08", "2026-10-08", "Itália", "IT", "Clássica", "M", 1, "1.Pro")
add("b20", "Il Lombardia", "2026-10-10", "2026-10-10", "Itália", "IT", "Monumento", "M", 1, "1.UWT")
add("b110", "Mundial de gravel UCI", "2026-10-10", "2026-10-11", "Austrália", "AU", "Mundial", "A", None, "WC",
    aviso="Nannup, Austrália Ocidental. Elite feminina no dia 10 e masculina no dia 11.")
add("b38", "Paris-Tours", "2026-10-11", "2026-10-11", "França", "FR", "Clássica", "M", 1, "1.Pro")
add("b111", "Trofeo Tessile & Moda", "2026-10-11", "2026-10-11", "Itália", "IT", "Clássica", "M", 1, "1.1",
    status="incerta",
    aviso="O Cyclingflash registrou cancelamento. A Lega ainda listava a prova e não há vencedor publicado.")
add("b47", "Tour de Guangxi", "2026-10-13", "2026-10-18", "China", "CN", "Tour", "M", 6, "2.UWT")
add("b49", "Tour de Chongming feminino", "2026-10-13", "2026-10-15", "China", "CN", "Tour", "F", 3, "2.WWT")
add("b172", "Volta aos Países Baixos", "2026-10-13", "2026-10-18", "Holanda", "NL", "Tour", "M", 6, "2.1",
    aviso="NIBC Tour of Holland. O site do organizador anuncia 13–18 de outubro; o Sofascore listou 13–17.")
add("b103", "Giro del Veneto", "2026-10-14", "2026-10-14", "Itália", "IT", "Clássica", "M", 1, "1.Pro")
add("b48", "Tour de Guangxi feminino", "2026-10-18", "2026-10-18", "China", "CN", "Tour", "F", 1, "1.WWT")
add("b104", "Veneto Classic", "2026-10-18", "2026-10-18", "Itália", "IT", "Clássica", "M", 1, "1.Pro")

R.sort(key=lambda p: (p["inicio"], p["fim"], p["nome"]))
ids = [p["id"] for p in R]
assert len(ids) == len(set(ids)), "id repetido"
for p in R:
    assert p["inicio"] <= p["fim"], p["nome"]
    assert len(p["codigo"]) == 2

out = {
    "ano": 2026,
    "titulo": "Temporada 2026",
    "atualizado": "2026-10-23",
    "nota": "Datas e países conferidos no calendário UCI 2026, nos sites oficiais das provas e nos resultados da temporada. A ordem é a data de início.",
    "provas": R,
}
dest = Path(__file__).resolve().parents[1] / "data" / "2026.json"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(len(R), "provas")
print("primeira", R[0]["inicio"], R[0]["nome"])
print("ultima", R[-1]["inicio"], R[-1]["nome"])