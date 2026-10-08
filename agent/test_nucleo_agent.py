"""Pruebas locales de Núcleo: evidencia, límites y ausencia de efectos."""
import json
import tempfile
from pathlib import Path
from nucleo_agent import audit


def main():
    with tempfile.TemporaryDirectory() as tmp:
        home=Path(tmp)/"home"
        repo=Path(tmp)/"hub"
        (home/".codex").mkdir(parents=True)
        (repo/"apps"/"agents").mkdir(parents=True)
        report=audit(repo,home)
        assert report["summary"]["verified"]==0, report
        assert report["changes_applied"]==0
        assert all(c["state"]=="unknown" for c in report["checks"] if c["id"] in ("memory","models","spend","writing"))
        (home/".codex"/"AGENTS.md").write_text("# Recuperación de contexto\n## Cierre y persistencia",encoding="utf-8")
        (repo/"AGENTS.md").write_text("contract",encoding="utf-8")
        (repo/"apps"/"agents"/"training.json").write_text(json.dumps({"agents":[{"id":"nucleo"}]}),encoding="utf-8")
        before={str(p):p.read_bytes() for p in repo.rglob("*") if p.is_file()}
        after=audit(repo,home)
        assert after["summary"]["verified"]==3,after
        assert after["cost_usd"]==0 and after["changes_applied"]==0
        assert before=={str(p):p.read_bytes() for p in repo.rglob("*") if p.is_file()}
        print("PASS 7 casos: contrato, continuidad, formación, privacidad, cero gasto, cero escrituras, datos desconocidos")


if __name__=="__main__":
    main()
