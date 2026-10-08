"""Núcleo: autodiagnóstico local, de solo lectura y sin gasto."""
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOME = Path.home()


def item(identifier, label, state, evidence, action=""):
    return {"id": identifier, "name": label, "state": state,
            "evidence": evidence, "next_step": action}


def audit(root=ROOT, home=HOME):
    checks = []
    rules = home / ".codex" / "AGENTS.md"
    if rules.exists() and rules.is_file():
        try:
            text = rules.read_text(encoding="utf-8", errors="replace")[:65536]
            verified = all(phrase in text for phrase in
                           ("Recuperación de contexto", "Cierre y persistencia"))
            checks.append(item("instructions", "Continuidad de Codex",
                               "ok" if verified else "review",
                               "Se localizaron instrucciones locales; " +
                               ("recuperación y cierre presentes." if verified
                                else "revisar recuperación y cierre.")))
        except OSError:
            checks.append(item("instructions", "Continuidad de Codex", "unknown",
                               "No se pudo leer el archivo de instrucciones."))
    else:
        checks.append(item("instructions", "Continuidad de Codex", "review",
                           "No se encontró el archivo de instrucciones globales.",
                           "Revisar las instrucciones existentes antes de crear otras."))
    exists = (root / "AGENTS.md").is_file()
    checks.append(item("project", "Contrato del Hub",
                       "ok" if exists else "review",
                       "AGENTS.md del Hub " + ("presente." if exists else "no encontrado.")))
    training = root / "apps" / "agents" / "training.json"
    try:
        profiles = json.loads(training.read_text(encoding="utf-8")).get("agents", [])
        present = any(x.get("id") == "nucleo" for x in profiles)
        checks.append(item("training", "Formación de Núcleo",
                           "ok" if present else "review",
                           "Perfil formativo " + ("presente." if present else "pendiente.")))
    except (OSError, ValueError):
        checks.append(item("training", "Formación de Núcleo", "unknown",
                           "No se pudo verificar el registro de formación."))
    checks.extend([
        item("memory", "Memoria ChatGPT / Codex", "unknown",
             "Los interruptores de memoria no son consultables desde este diagnóstico.",
             "Comprobar el estado desde Configuración > Personalización."),
        item("models", "Modelos y plan", "unknown",
             "El modelo activo y los derechos de la cuenta requieren consulta autenticada.",
             "Contrastar selector de modelos y plan antes de sugerir cambios."),
        item("spend", "Presupuestos de IA", "unknown",
             "Núcleo no consulta facturación. El Hub dispone del panel OpenRouter.",
             "Consultar los datos del panel de gasto, sin confundir límites con consumo."),
        item("writing", "Voz de Adrián", "unknown",
             "El ajuste de estilo de ChatGPT requiere verificación en la aplicación.",
             "Conservar la hoja canónica y el patrón aprobado."),
    ])
    return {
        "ok": True, "agent": "nucleo", "mode": "read-only",
        "checked_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "cost_usd": 0, "changes_applied": 0,
        "summary": {
            "verified": sum(x["state"] == "ok" for x in checks),
            "to_review": sum(x["state"] == "review" for x in checks),
            "unverifiable": sum(x["state"] == "unknown" for x in checks),
        },
        "checks": checks,
        "limitations": "Inspección de fuentes locales permitidas; sin acceso al interior del modelo."
    }


if __name__ == "__main__":
    print(json.dumps(audit(), ensure_ascii=False))
