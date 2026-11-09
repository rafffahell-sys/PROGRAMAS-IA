#!/usr/bin/env python3
"""Recebe um snapshot de uma etapa já autorizada, valida e para.

Por omissão é dry-run: não cria arquivo, não usa credencial e não fala com a rede.
--aplicar grava só na pasta --destino, uma etapa por vez.
Não libera a etapa vizinha nem marca a prova inteira, salvo pedido separado e explícito.
Texto de autorização não é gravado.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DADOS = RAIZ / "data" / "grandes-voltas"
VARIAVEIS_PROIBIDAS = (
    "GOOGLE_APPLICATION_CREDENTIALS",
    "FIREBASE_TOKEN",
    "FIREBASE_AUTH_TOKEN",
    "GCLOUD_AUTH_TOKEN",
)


class Recusa(Exception):
    pass


def _agora() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _canonico(dados) -> str:
    return json.dumps(dados, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _hash(dados) -> str:
    return hashlib.sha256(_canonico(dados).encode("utf-8")).hexdigest()


def carregar_prova(prova_id: str, ano: int) -> dict:
    catalogo = json.loads((DADOS / "catalogo.json").read_text(encoding="utf-8"))
    item = next(
        (p for p in catalogo["provas"] if p["provaId"] == prova_id and int(p["ano"]) == int(ano)),
        None,
    )
    if not item:
        raise Recusa(f"Prova {prova_id} {ano} não está no catálogo.")
    return json.loads((DADOS / item["arquivo"]).read_text(encoding="utf-8"))


def _lista(lista, limite: int, nome: str, erros: list[str]) -> None:
    if not isinstance(lista, list) or not lista or len(lista) > limite:
        erros.append(f"{nome}:tamanho")
        return
    vistos = set()
    for item in lista:
        if not isinstance(item, dict) or not isinstance(item.get("pos"), int):
            erros.append(f"{nome}:item")
            return
        if not isinstance(item.get("ciclista"), str) or not item["ciclista"].strip():
            erros.append(f"{nome}:ciclista")
            return
        if item["pos"] in vistos:
            erros.append(f"{nome}:posicao")
            return
        vistos.add(item["pos"])
    if len(lista) != limite:
        erros.append(f"{nome}:incompleta")


def _texto_limpo(valor, limite: int, minimo: int = 1) -> bool:
    if not isinstance(valor, str):
        return False
    texto = valor.strip()
    if len(texto) < minimo or len(texto) > limite:
        return False
    return "<" not in texto and ">" not in texto


def _menciona_etapa_futura(texto: str, etapa: int) -> bool:
    for achado in re.finditer(r"\betapas?\s+(\d{1,2})\b", texto or "", flags=re.I):
        if int(achado.group(1)) > etapa:
            return True
    return False


def validar_resumo(resumo: dict, snap: dict) -> list[str]:
    erros = []
    n = snap.get("aposEtapa")
    if not isinstance(resumo, dict):
        return ["resumo"]
    if resumo.get("provaId") != snap.get("provaId"):
        erros.append("resumo:provaId")
    if int(resumo.get("ano") or 0) != int(snap.get("ano") or 0):
        erros.append("resumo:ano")
    if resumo.get("ateEtapa") != n:
        erros.append("resumo:ateEtapa")
    if resumo.get("ausente") is True:
        if resumo.get("texto") is not None or resumo.get("momentos") or resumo.get("contextoClassificatorio"):
            erros.append("resumo:ausente_com_texto")
        return erros
    if resumo.get("ausente") is not False:
        erros.append("resumo:ausente")
    if not _texto_limpo(resumo.get("texto"), 1200, 40):
        erros.append("resumo:texto")
    momentos = resumo.get("momentos")
    if not isinstance(momentos, list) or len(momentos) > 5 or any(not _texto_limpo(item, 200, 8) for item in momentos):
        erros.append("resumo:momentos")
    contexto = resumo.get("contextoClassificatorio")
    if contexto is not None and not _texto_limpo(contexto, 500, 8):
        erros.append("resumo:contexto")
    fonte = resumo.get("fonte")
    if not isinstance(fonte, dict) or not _texto_limpo(fonte.get("nome"), 120, 3):
        erros.append("resumo:fonte")
    bloco = " ".join(
        [resumo.get("texto") or "", contexto or ""] + [item for item in (momentos or []) if isinstance(item, str)]
    )
    if isinstance(n, int) and _menciona_etapa_futura(bloco, n):
        erros.append("resumo:etapa_futura")
    return erros


def validar_pontuacao(pontuacao: dict, prova: dict) -> list[str]:
    confirmada = (prova.get("regulamento") or {}).get("oficialConfirmado") is True
    if not isinstance(pontuacao, dict):
        return ["pontuacao"]
    erros = []
    if pontuacao.get("modo") != "copia_oficial":
        erros.append("pontuacao:modo")
    if pontuacao.get("recalculada") is not False:
        erros.append("pontuacao:recalculada")
    if pontuacao.get("regrasDaEdicaoConfirmadas") is not confirmada:
        erros.append("pontuacao:regras")
    return erros


def validar_snapshot(snap: dict, prova: dict) -> list[str]:
    erros = []
    if not isinstance(snap, dict):
        return ["snapshot"]
    if snap.get("provaId") != prova["provaId"]:
        erros.append("provaId")
    if int(snap.get("ano") or 0) != int(prova["ano"]):
        erros.append("ano")
    if snap.get("imutavel") is not True:
        erros.append("imutavel")
    n = snap.get("aposEtapa")
    if not isinstance(n, int) or n < 1 or n > int(prova["totalEtapas"]):
        erros.append("aposEtapa")
    _lista((snap.get("etapa") or {}).get("top10"), 10, "etapa.top10", erros)
    _lista((snap.get("gc") or {}).get("top10"), 10, "gc.top10", erros)
    for camisa in prova.get("camisas") or []:
        bloco = (snap.get("camisas") or {}).get(camisa["id"])
        if not isinstance(bloco, dict):
            erros.append(f"camisa:{camisa['id']}")
            continue
        _lista(bloco.get("top5"), 5, f"camisa:{camisa['id']}", erros)
        if bloco.get("lider") is not None and not isinstance(bloco.get("lider"), str):
            erros.append(f"camisa:{camisa['id']}:lider")
        if bloco.get("quemVeste") is None:
            if bloco.get("fonteNaoDistingue") is not True:
                erros.append(f"camisa:{camisa['id']}:quemVeste")
        elif not isinstance(bloco.get("quemVeste"), str):
            erros.append(f"camisa:{camisa['id']}:quemVeste")
    if snap.get("equipes") is not None and not isinstance(snap.get("equipes"), dict):
        erros.append("equipes")
    erros.extend(validar_resumo(snap.get("resumo"), snap))
    erros.extend(validar_pontuacao(snap.get("pontuacao"), prova))
    if (snap.get("validacao") or {}).get("ok") is not True:
        erros.append("validacao")
    return erros


def credencial_presente() -> str | None:
    for nome in VARIAVEIS_PROIBIDAS:
        if os.environ.get(nome):
            return nome
    return None


def preparar(payload: dict, prova: dict) -> tuple[dict, list[str]]:
    avisos = []
    dados = json.loads(json.dumps(payload))
    if "autorizacaoTexto" in dados:
        dados.pop("autorizacaoTexto")
        avisos.append("texto de autorização removido e não será gravado")
    snap = dados.get("snapshot")
    if isinstance(snap, dict) and "autorizacaoTexto" in snap:
        snap.pop("autorizacaoTexto")
        avisos.append("texto de autorização do snapshot removido")
    if dados.get("tipo") != "grande_volta_etapa":
        raise Recusa("tipo precisa ser grande_volta_etapa")
    if dados.get("acao") != "liberar_e_preencher":
        raise Recusa("acao não reconhecida")
    if isinstance(dados.get("etapas"), list):
        raise Recusa("o pedido traz mais de uma etapa")
    if int(dados.get("ano") or 0) != int(prova["ano"]) or dados.get("provaId") != prova["provaId"]:
        raise Recusa("pedido não bate com a prova")
    etapa = dados.get("etapa")
    if not isinstance(etapa, int):
        raise Recusa("etapa inválida")
    chave = f"{prova['ano']}_{prova['provaId']}_etapa_{etapa}"
    if dados.get("idempotencyKey") != chave:
        raise Recusa("idempotencyKey não corresponde à etapa")
    if not isinstance(snap, dict) or snap.get("aposEtapa") != etapa:
        raise Recusa("snapshot não é desta etapa")
    erros = validar_snapshot(snap, prova)
    if erros:
        raise Recusa("snapshot inválido: " + ", ".join(erros))
    if dados.get("assistidaProvaCompleta") not in (False, None):
        raise Recusa("prova completa não entra neste pedido; use o comando separado")
    return dados, avisos


def checar_confirmacao(confirmacao: dict | None, prova: dict, etapa: int, completa: bool) -> None:
    if not confirmacao:
        raise Recusa("falta a confirmação direta desta etapa")
    if "autorizacaoTexto" in confirmacao:
        raise Recusa("a confirmação não pode trazer texto de autorização para o repositório")
    chave = f"{prova['ano']}_{prova['provaId']}_etapa_{etapa}"
    if confirmacao.get("confirmacaoDireta") is not True:
        raise Recusa("confirmação direta ausente")
    if confirmacao.get("provaId") != prova["provaId"] or int(confirmacao.get("ano") or 0) != int(prova["ano"]):
        raise Recusa("confirmação de outra prova")
    if confirmacao.get("etapa") != etapa or confirmacao.get("idempotencyKey") != chave:
        raise Recusa("confirmação de outra etapa")
    if completa:
        if confirmacao.get("provaCompleta") is not True:
            raise Recusa("prova completa sem confirmação própria")
        if etapa != int(prova["totalEtapas"]):
            raise Recusa("prova completa só pode ser pedida na última etapa")
    elif confirmacao.get("provaCompleta") is True:
        raise Recusa("confirmação de prova completa não libera esta gravação sozinha")


def executar(payload: dict, confirmacao: dict | None, aplicar: bool, destino: Path | None,
             permitir_sintetico: bool, prova_completa: bool) -> dict:
    presenca = credencial_presente()
    if presenca:
        raise Recusa(f"credencial presente ({presenca}); o pipeline não corre com ela")
    prova = carregar_prova(payload.get("provaId"), int(payload.get("ano") or 0))
    dados, avisos = preparar(payload, prova)
    if dados.get("snapshot", {}).get("sintetico") is True and not permitir_sintetico:
        raise Recusa("snapshot sintético recusado")
    if dados.get("snapshot", {}).get("sintetico") is not True and permitir_sintetico:
        avisos.append("pedido real com flag de teste")
    etapa = dados["etapa"]
    if aplicar:
        checar_confirmacao(confirmacao, prova, etapa, prova_completa)
        if destino is None:
            raise Recusa("aplicar exige --destino")
    else:
        if confirmacao:
            checar_confirmacao(confirmacao, prova, etapa, prova_completa)
            avisos.append("confirmação conferida; nada foi gravado")
        else:
            avisos.append("aguardando confirmação direta; nada foi gravado")
    chave = dados["idempotencyKey"]
    plano = {
        "quando": _agora(),
        "modo": "aplicar" if aplicar else "dry-run",
        "chave": chave,
        "etapa": etapa,
        "provaCompleta": bool(prova_completa),
        "etapasLiberadasNestePedido": [etapa],
        "avisos": avisos,
        "hash": _hash(dados["snapshot"]),
    }
    if not aplicar:
        plano["resultado"] = "plano"
        return plano
    pasta = destino / chave
    pasta.mkdir(parents=True, exist_ok=True)
    arquivo = pasta / "snapshot.json"
    if arquivo.exists():
        anterior = json.loads(arquivo.read_text(encoding="utf-8"))
        if _hash(anterior) == plano["hash"]:
            plano["resultado"] = "noop"
            _auditar(destino, plano)
            return plano
        plano["resultado"] = "conflito"
        _auditar(destino, plano)
        raise Recusa("já existe snapshot diferente para esta chave; não foi sobrescrito")
    arquivo.write_text(json.dumps(dados["snapshot"], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifesto = {
        "etapas": {str(etapa): True},
        "provaCompleta": bool(prova_completa),
        "snapshotHash": plano["hash"],
    }
    (pasta / "manifesto.json").write_text(
        json.dumps(manifesto, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    plano["resultado"] = "gravado"
    _auditar(destino, plano)
    return plano


def _auditar(destino: Path, plano: dict) -> None:
    linha = {k: plano[k] for k in ("quando", "modo", "chave", "etapa", "resultado", "provaCompleta", "avisos", "hash")}
    with (destino / "auditoria.jsonl").open("a", encoding="utf-8") as arquivo:
        arquivo.write(json.dumps(linha, ensure_ascii=False) + "\n")


def _ler_json(caminho: str | None) -> dict | None:
    if not caminho:
        return None
    return json.loads(Path(caminho).read_text(encoding="utf-8"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Valida um snapshot de uma etapa. Dry-run por omissão.")
    parser.add_argument("--payload", required=True)
    parser.add_argument("--confirmacao")
    parser.add_argument("--aplicar", action="store_true")
    parser.add_argument("--destino")
    parser.add_argument("--permitir-sintetico", action="store_true")
    parser.add_argument("--prova-completa", action="store_true")
    args = parser.parse_args(argv)
    try:
        plano = executar(
            _ler_json(args.payload),
            _ler_json(args.confirmacao),
            args.aplicar,
            Path(args.destino) if args.destino else None,
            args.permitir_sintetico,
            args.prova_completa,
        )
    except Recusa as erro:
        print(json.dumps({"ok": False, "erro": str(erro)}, ensure_ascii=False))
        return 2
    print(json.dumps({"ok": True, **plano}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
