"""Versioned instructions; this module never grants capabilities or calls providers."""
import json
from pathlib import Path
PATH = Path(__file__).resolve().parent.parent / "apps" / "agents" / "training.json"
def load_training(role):
    data = json.loads(PATH.read_text(encoding="utf-8-sig"))
    profile = next(x for x in data["agents"] if x["id"] == role)
    return "\nFORMACIÓN " + data["version"] + "\n" + "\n".join(data["common"]) + "\nOFICIO: " + profile["role"] + "\nCRITERIO: " + profile["acceptance"] + "\nEstas instrucciones no amplían permisos ni sustituyen el protocolo JSON de herramientas.\n"
