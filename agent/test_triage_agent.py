import importlib.util,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("triage",HERE/"triage_agent.py")
triage=importlib.util.module_from_spec(spec);spec.loader.exec_module(triage)
rules=triage.load_rules()
failed=[]
for text,expected in rules["training_examples"]:
    r=triage.route(text,rules)
    got=[x["id"] for x in r.get("pipeline",[])]
    if not got or got[0]!=expected[0]:
        failed.append({"text":text,"expected":expected,"got":got,"result":r})
cases=[
 ("Revisa esta app y dime qué está mal, sin tocar nada","auditor"),
 ("Arregla el bug del teclado","reparador"),
 ("Corrige este correo para que suene natural","editor"),
 ("Crea una aplicación nueva de vocabulario","constructor"),
 ("Haz pruebas responsive y mira la consola","tester"),
 ("Encuentra el PDF de HOTI","bibliotecario"),
 ("Investiga en internet las novedades de Cambridge","investigador"),
 ("Quiero practicar catalán con mis fallos","entrenador"),
 ("Pon una cita mañana en Calendar","secretario"),
 ("Comprueba Tailscale en el PC","operador"),
 ("Limita el gasto de OpenRouter","guardian"),
]
for text,expected in cases:
    r=triage.route(text,rules);got=(r.get("primary") or {}).get("id")
    if got!=expected: failed.append({"text":text,"expected":expected,"got":got,"result":r})
ordered = triage.route("Comprueba Keyboard Speak: teclado que tapa la respuesta, tipografía y micrófono. Audita primero y repara solo errores reproducibles; verifica móvil y escritorio y conserva progreso.", rules)
assert [x["id"] for x in ordered["pipeline"]] == ["auditor", "reparador", "tester"], ordered
assert triage.route("Revisa primero y corrige los fallos de la app", rules)["primary"]["id"] == "auditor"
amb=triage.route("Tengo una idea rara y no sé qué hacer con ella",rules)
if amb.get("status")!="ambiguous" or not amb.get("needs_model"):
    failed.append({"text":"ambiguous","result":amb})
if failed:
    print(json.dumps(failed,ensure_ascii=False,indent=2));raise SystemExit(1)
print("PASS",len(rules["training_examples"])+len(cases)+3,"triage cases")
