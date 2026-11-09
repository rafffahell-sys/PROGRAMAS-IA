#!/usr/bin/env python3
"""Confere percursos neutros e a ausência de resultados."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import percursos_2026 as fontes  # noqa: E402

DADOS = RAIZ / "data" / "grandes-voltas"
CALENDARIO = RAIZ / "data" / "2026.json"
PROIBIDOS = {
    "ciclista", "lider", "quemVeste", "top10", "top5", "gap", "vencedor",
    "snapshot", "autorizacaoTexto", "classificacao", "resumo", "analisePre",
}


def _andar(valor, caminho, achados):
    if isinstance(valor, dict):
        for chave, item in valor.items():
            if chave in PROIBIDOS:
                achados.append(f"{caminho}.{chave}")
            _andar(item, f"{caminho}.{chave}", achados)
    elif isinstance(valor, list):
        for i, item in enumerate(valor):
            _andar(item, f"{caminho}[{i}]", achados)


class Percurso(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.calendario = json.loads(CALENDARIO.read_text(encoding="utf-8"))
        cls.catalogo = json.loads((DADOS / "catalogo.json").read_text(encoding="utf-8"))
        cls.provas = {
            item["slug"]: json.loads((DADOS / item["arquivo"]).read_text(encoding="utf-8"))
            for item in cls.catalogo["provas"]
        }

    def test_calendario_b7_b10_b12(self):
        esperados = {
            "b7": ("Giro d'Italia", "2026-05-08", "2026-05-31", 21, "M"),
            "b10": ("Tour de France", "2026-07-04", "2026-07-26", 21, "M"),
            "b12": ("Volta à Espanha", "2026-08-22", "2026-09-13", 21, "M"),
        }
        por_id = {p["id"]: p for p in self.calendario["provas"]}
        for prova_id, (nome, inicio, fim, etapas, gen) in esperados.items():
            prova = por_id[prova_id]
            self.assertEqual(prova["nome"], nome)
            self.assertEqual(prova["inicio"], inicio)
            self.assertEqual(prova["fim"], fim)
            self.assertEqual(prova["etapas"], etapas)
            self.assertEqual(prova["gen"], gen)

    def test_vinte_e_uma_etapas_sem_perfil_inventado(self):
        for slug, prova in self.provas.items():
            self.assertEqual(len(prova["etapas"]), 21, slug)
            for etapa in prova["etapas"]:
                self.assertEqual(etapa["perfil"]["pontos"], [])
                if slug == "giro":
                    self.assertTrue(etapa["perfilPublicado"])
                    self.assertIsInstance(etapa["desnivelM"], int)
                else:
                    self.assertFalse(etapa["perfilPublicado"])
                    self.assertIsNone(etapa["desnivelM"])
                    self.assertNotIn("imagem", etapa["perfil"])

    def test_giro_tem_imagem_de_perfil_e_as_outras_nao(self):
        giro = self.provas["giro"]
        total = 0
        for etapa in giro["etapas"]:
            imagem = etapa["perfil"]["imagem"]
            arquivo = RAIZ / imagem["arquivo"]
            self.assertTrue(arquivo.is_file(), imagem["arquivo"])
            self.assertGreater(arquivo.stat().st_size, 20_000)
            total += arquivo.stat().st_size
            self.assertTrue(imagem["arquivo"].endswith(f"etapa-{etapa['n']:02d}.jpg"))
            self.assertIn(f"etapa {etapa['n']} ", imagem["alt"])
            self.assertIn(etapa["origem"], imagem["alt"])
            self.assertTrue(imagem["fontePagina"].startswith("https://www.giroditalia.it/en/tappe/stage-"))
            self.assertIn("/wp-content/uploads/2026/04/", imagem["fonteAsset"])
            self.assertNotIn("ciclista", imagem["alt"].lower())
        self.assertLess(total, 4_000_000)
        self.assertTrue(any(obs.startswith("Perfis altimétricos: 21 de 21") for obs in giro["observacoes"]))
        etapa6 = giro["etapas"][5]
        etapa7 = giro["etapas"][6]
        etapa8 = giro["etapas"][7]
        self.assertEqual(etapa6["km"], 141)
        self.assertEqual(etapa6["perfil"]["imagem"]["kmNaFicha"], 142)
        self.assertEqual(etapa6["perfil"]["imagem"]["kmNoEixo"], 141)
        self.assertEqual(etapa7["km"], 244)
        self.assertEqual(etapa7["perfil"]["imagem"]["kmNaFicha"], 245)
        self.assertEqual(etapa7["perfil"]["imagem"]["kmNoEixo"], 245)
        self.assertIn("140526", etapa7["perfil"]["imagem"]["fonteAsset"])
        self.assertTrue(etapa7["perfil"]["imagem"]["fonteAsset"].split("?")[0].endswith(".png"))
        self.assertEqual(etapa8["km"], 156)
        self.assertEqual(etapa8["perfil"]["imagem"]["kmNaFicha"], 156)
        self.assertEqual(etapa8["perfil"]["imagem"]["kmNoEixo"], 157)
        for slug in ("tour", "vuelta"):
            prova = self.provas[slug]
            publicados = [e for e in prova["etapas"] if e["perfilPublicado"] or e["perfil"]["pontos"]]
            self.assertEqual(publicados, [])
            self.assertTrue(any(obs.startswith("Perfis altimétricos: 0 de 21") for obs in prova["observacoes"]))

    def test_giro_fecha_3468(self):
        giro = self.provas["giro"]
        self.assertEqual(sum(e["km"] for e in giro["etapas"]), 3468)
        self.assertTrue(all(c["oficialConfirmado"] for c in giro["camisas"]))
        self.assertEqual(
            [c["rotulo"] for c in giro["camisas"]],
            ["Maglia Rosa", "Maglia Ciclamino", "Maglia Azzurra", "Maglia Bianca"],
        )
        self.assertFalse(giro["classificacaoEquipes"]["habilitada"])

    def test_tour_e_vuelta_nao_confirmam_camisa(self):
        for slug in ("tour", "vuelta"):
            for camisa in self.provas[slug]["camisas"]:
                self.assertFalse(camisa["oficialConfirmado"], f"{slug}:{camisa['id']}")
            self.assertFalse(self.provas[slug]["regulamento"]["oficialConfirmado"])
            self.assertIsNone(self.provas[slug]["regulamento"]["tabelaPontosChegada"])

    def test_vuelta_soma_oficial(self):
        vuelta = self.provas["vuelta"]
        soma = round(sum(e["km"] for e in vuelta["etapas"]), 1)
        self.assertEqual(soma, 3231.9)
        self.assertTrue(any("3.275" in texto and "3.231,9" in texto for texto in vuelta["observacoes"]))
        self.assertEqual(vuelta["etapas"][0]["origem"], "Monaco")
        self.assertEqual(vuelta["etapas"][-1]["destino"], "Granada")

    def test_tour_nao_completa_lacunas(self):
        tour = self.provas["tour"]
        self.assertEqual(tour["etapas"][0]["km"], 19.6)
        self.assertEqual(tour["etapas"][15]["km"], 26)
        self.assertIsNone(tour["etapas"][3]["km"])
        self.assertEqual(tour["etapas"][3]["tipo"], "desconhecido")
        self.assertIn("2025", " ".join(tour["observacoes"]))

    def test_sem_chaves_de_resultado(self):
        achados = []
        for arquivo in [DADOS / "catalogo.json", DADOS / "liberacoes.json", DADOS / "acesso.json"]:
            _andar(json.loads(arquivo.read_text(encoding="utf-8")), arquivo.name, achados)
        for prova in self.provas.values():
            _andar(prova, prova["slug"], achados)
        self.assertEqual(achados, [])

    def test_liberacoes_vazias_e_regras_fechadas(self):
        liberacoes = json.loads((DADOS / "liberacoes.json").read_text(encoding="utf-8"))
        acesso = json.loads((DADOS / "acesso.json").read_text(encoding="utf-8"))
        for chave in ("2026_b7", "2026_b10", "2026_b12"):
            self.assertEqual(liberacoes["provas"][chave]["etapas"], {})
            self.assertFalse(liberacoes["provas"][chave]["provaCompleta"])
        self.assertFalse(acesso["regrasComprovadas"])

    def test_favoritos_prelargada_sem_resultado(self):
        bruto = (DADOS / "2026" / "giro-favoritos-prelargada.json").read_text(encoding="utf-8")
        dados = json.loads(bruto)
        self.assertEqual(dados["ordem"], "alfabetica")
        self.assertEqual(len(dados["itens"]), 10)
        nomes = [item["nome"] for item in dados["itens"]]
        self.assertEqual(nomes, sorted(nomes, key=lambda nome: nome.split()[-1]))
        self.assertNotIn("vitória", bruto.lower())
        self.assertNotIn("pódio", bruto.lower())
        self.assertNotIn("odds", bruto.lower())
        for item in dados["itens"]:
            self.assertNotIn("ordem", item)

    def test_fontes_do_script_batem_com_o_json(self):
        gerado = fontes._giro()
        self.assertEqual(gerado["etapas"][18]["origem"], "Feltre")
        self.assertEqual(self.provas["giro"]["etapas"][9]["km"], 42)
        self.assertEqual(gerado["etapas"][0]["perfil"]["imagem"]["arquivo"], "img/perfis/giro-2026/etapa-01.jpg")
        self.assertEqual(gerado["etapas"][0]["perfil"]["pontos"], [])
        self.assertEqual(gerado["etapas"][6]["km"], 244)


if __name__ == "__main__":
    unittest.main()
