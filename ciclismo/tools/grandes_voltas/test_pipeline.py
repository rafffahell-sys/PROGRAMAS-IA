#!/usr/bin/env python3
"""Testes do pipeline com dados sintéticos. Não são resultados de prova."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

PASTA = Path(__file__).resolve().parent
sys.path.insert(0, str(PASTA))
import pipeline  # noqa: E402

ROTULO = "DADO SINTETICO — NAO E RESULTADO DE PROVA"


def atleta(pos, pontos=False):
    item = {
        "pos": pos,
        "ciclista": f"Atleta {pos:02d}",
        "equipe": f"Equipe {pos:02d}",
    }
    if pontos:
        item["pontos"] = 50 - pos
        item["diff"] = pos - 1
    else:
        item["tempo"] = f"1:0{pos}:00"
        item["gap"] = "0:00" if pos == 1 else f"0:0{pos}"
    return item


def snapshot(etapa=5):
    top10 = [atleta(i) for i in range(1, 11)]
    top5 = [atleta(i) for i in range(1, 6)]
    pontos = [atleta(i, pontos=True) for i in range(1, 6)]

    def camisa(lista, distingue=True):
        return {
            "top5": lista,
            "lider": lista[0]["ciclista"],
            "quemVeste": lista[0]["ciclista"] if distingue else None,
            "fonteNaoDistingue": not distingue,
        }

    return {
        "rotulo": ROTULO,
        "sintetico": True,
        "provaId": "b7",
        "ano": 2026,
        "aposEtapa": etapa,
        "imutavel": True,
        "fonte": {"nome": "fixture sintetica", "url": None, "coletadoEm": "2026-11-09"},
        "validacao": {"ok": True, "checagens": ["top10_etapa", "gc10", "camisas_top5"], "avisos": []},
        "etapa": {"top10": top10},
        "gc": {"top10": top10},
        "camisas": {
            "gc": camisa(top5, True),
            "pontos": camisa(pontos, False),
            "montanha": camisa(pontos, False),
            "jovem": camisa(top5, True),
        },
        "equipes": None,
    }


def pedido(etapa=5, **extra):
    corpo = {
        "tipo": "grande_volta_etapa",
        "ano": 2026,
        "prova": "Giro d'Italia",
        "provaId": "b7",
        "etapa": etapa,
        "acao": "liberar_e_preencher",
        "idempotencyKey": f"2026_b7_etapa_{etapa}",
        "assistidaProvaCompleta": False,
        "snapshot": snapshot(etapa),
    }
    corpo.update(extra)
    return corpo


def confirmacao(etapa=5, completa=False):
    return {
        "provaId": "b7",
        "ano": 2026,
        "etapa": etapa,
        "idempotencyKey": f"2026_b7_etapa_{etapa}",
        "confirmacaoDireta": True,
        "provaCompleta": completa,
    }


class Pipeline(unittest.TestCase):
    def test_dry_run_nao_grava(self):
        with tempfile.TemporaryDirectory() as tmp:
            destino = Path(tmp)
            plano = pipeline.executar(pedido(), confirmacao(), False, destino, True, False)
            self.assertEqual(plano["modo"], "dry-run")
            self.assertEqual(list(destino.iterdir()), [])
            self.assertEqual(plano["etapasLiberadasNestePedido"], [5])

    def test_idempotente_e_nao_libera_vizinha(self):
        with tempfile.TemporaryDirectory() as tmp:
            destino = Path(tmp)
            primeiro = pipeline.executar(pedido(), confirmacao(), True, destino, True, False)
            segundo = pipeline.executar(pedido(), confirmacao(), True, destino, True, False)
            self.assertEqual(primeiro["resultado"], "gravado")
            self.assertEqual(segundo["resultado"], "noop")
            pastas = [p.name for p in destino.iterdir() if p.is_dir()]
            self.assertEqual(pastas, ["2026_b7_etapa_5"])
            manifesto = json.loads((destino / "2026_b7_etapa_5" / "manifesto.json").read_text())
            self.assertEqual(manifesto["etapas"], {"5": True})
            self.assertFalse(manifesto["provaCompleta"])

    def test_conflito_nao_sobrescreve(self):
        with tempfile.TemporaryDirectory() as tmp:
            destino = Path(tmp)
            pipeline.executar(pedido(), confirmacao(), True, destino, True, False)
            outro = pedido()
            outro["snapshot"]["fonte"]["nome"] = "outra coleta sintetica"
            with self.assertRaises(pipeline.Recusa):
                pipeline.executar(outro, confirmacao(), True, destino, True, False)
            gravado = json.loads((destino / "2026_b7_etapa_5" / "snapshot.json").read_text())
            self.assertEqual(gravado["fonte"]["nome"], "fixture sintetica")

    def test_remove_texto_de_autorizacao(self):
        corpo = pedido()
        corpo["autorizacaoTexto"] = "nao gravar"
        with tempfile.TemporaryDirectory() as tmp:
            destino = Path(tmp)
            plano = pipeline.executar(corpo, confirmacao(), True, destino, True, False)
            texto = (destino / "2026_b7_etapa_5" / "snapshot.json").read_text()
            self.assertNotIn("nao gravar", texto)
            self.assertNotIn("autorizacaoTexto", (destino / "auditoria.jsonl").read_text())
            self.assertTrue(any("removido" in a for a in plano["avisos"]))

    def test_prova_completa_nao_abre_as_outras(self):
        with tempfile.TemporaryDirectory() as tmp:
            destino = Path(tmp)
            plano = pipeline.executar(
                pedido(21, assistidaProvaCompleta=False),
                confirmacao(21, True),
                True,
                destino,
                True,
                True,
            )
            self.assertEqual(plano["etapasLiberadasNestePedido"], [21])
            manifesto = json.loads((destino / "2026_b7_etapa_21" / "manifesto.json").read_text())
            self.assertEqual(list(manifesto["etapas"]), ["21"])
            self.assertTrue(manifesto["provaCompleta"])

    def test_recusa_lote_sintetico_sem_flag_e_credencial(self):
        with self.assertRaises(pipeline.Recusa):
            pipeline.executar(pedido(), confirmacao(), False, None, False, False)
        corpo = pedido()
        corpo["etapas"] = [5, 6]
        with self.assertRaises(pipeline.Recusa):
            pipeline.executar(corpo, confirmacao(), False, None, True, False)
        anterior = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "ausente.json"
        try:
            with self.assertRaises(pipeline.Recusa) as ctx:
                pipeline.executar(pedido(), confirmacao(), False, None, True, False)
            self.assertIn("credencial", str(ctx.exception))
            self.assertNotIn("ausente.json", str(ctx.exception))
        finally:
            if anterior is None:
                os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
            else:
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = anterior

    def test_cli_dry_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            payload = Path(tmp) / "pedido.json"
            payload.write_text(json.dumps(pedido()), encoding="utf-8")
            proc = subprocess.run(
                [sys.executable, str(PASTA / "pipeline.py"), "--payload", str(payload), "--permitir-sintetico"],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
            self.assertIn("dry-run", proc.stdout)
            self.assertEqual(list(Path(tmp).iterdir()), [payload])


if __name__ == "__main__":
    unittest.main()
