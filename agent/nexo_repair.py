"""Idempotent Auditor -> isolated Reparador handoff. No model calls here."""
import json, threading
from pathlib import Path
LOCK = threading.Lock()

def handoff(audit, start, snapshot, ledger, confirmed):
    if confirmed is not True:
        raise PermissionError("La reparación requiere confirmar el límite de 1,65 USD")
    run = str(audit.get("run_id") or "")
    request = str(audit.get("mission") or "")
    result = audit.get("result") or {}
    if not run or audit.get("running") or audit.get("status") != "completed" or audit.get("returncode") != 0 or audit.get("dry_run"):
        raise RuntimeError("Se necesita una auditoría completa y terminada")
    if result.get("partial") or not result.get("ok"):
        raise RuntimeError("Un informe parcial o fallido no puede iniciar una reparación")
    if not any(name in request.lower() for name in ("keyboard speak", "adaptive-keyword-speaking")):
        raise RuntimeError("La reparación automática solo admite Keyboard Speak")
    report = Path(audit.get("report") or "")
    if not report.is_file():
        raise RuntimeError("No hay informe vinculado a esta auditoría")
    text = report.read_text(encoding="utf-8")
    if not text.strip() or len(text) > 12000 or "INFORME PARCIAL" in text.upper():
        raise RuntimeError("Informe vacío, parcial o demasiado grande")
    mission = ("Keyboard Speak: reproduce primero los fallos del diagnóstico. "
               "Repara únicamente fallos reproducidos; si no hay evidencia, informa sin modificar. "
               "Conserva progreso. Ejecuta la regresión después del último cambio. "
               "No publiques.\nPetición: " + request + "\nInforme completo del Auditor:\n" + text)
    ledger = Path(ledger)
    with LOCK:
        records = json.loads(ledger.read_text(encoding="utf-8")) if ledger.exists() else {}
        if run in records:
            current = snapshot()
            linked = records[run]
            if linked.get("run_id") == current.get("run_id"):
                return current
            raise RuntimeError("Esta auditoría ya tiene una reparación vinculada; no se repite")
        ledger.parent.mkdir(parents=True, exist_ok=True)
        # Reserve before starting: even a service crash must not duplicate paid work.
        records[run] = {"reserved": True}
        temp = ledger.with_suffix(".tmp")
        temp.write_text(json.dumps(records), encoding="utf-8")
        temp.replace(ledger)
        try:
            state = start(mission, False, True)
        except Exception:
            records.pop(run)
            temp.write_text(json.dumps(records), encoding="utf-8")
            temp.replace(ledger)
            raise
        records[run] = {"run_id": state["run_id"]}
        temp.write_text(json.dumps(records), encoding="utf-8")
        temp.replace(ledger)
        return state
