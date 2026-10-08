import json,sys,subprocess,tempfile,importlib.util
from pathlib import Path
root=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(root/"agent"))
import triage_agent as triage,advisor_agent as advisor,agent,repair_agent
results={}
cases=[
("Arregla el fallo del teclado y verifica móvil",["reparador","tester"]),
("Audita la app sin tocar nada",["auditor","tester"]),
("Crea una app nueva para vocabulario",["constructor","tester","guardian"]),
("Corrige este texto con mi voz",["editor"]),
("Busca el archivo maestro de HOTI",["bibliotecario"]),
("Vigila mis correos de empleo",["consejero"]),
("Publica la nueva versión si todas las pruebas pasan",["tester","guardian","operador"]),
]
checks=[]
for text,expected in cases:
 r=triage.route(text)
 actual=[a["id"] for a in r["pipeline"]]
 checks.append({"request":text,"expected":expected,"observed":actual,"pass":actual==expected})
checks.append({"request":"Petición sin señales","pass":triage.route("Tengo una idea rara y no sé qué hacer con ella")["status"]=="ambiguous"})
results["triaje"]={"level":"Práctica local","cases":checks,"passed":all(c["pass"] for c in checks)}
with tempfile.TemporaryDirectory() as td:
 c=advisor.db(Path(td)/"exam.sqlite3")
 checks=[]
 event={"source":"gmail","external_id":"training-interview","sender":"example@example.com","title":"Entrevista proceso de selección","body":"Cita 10/10/2026 a las 11:30"}
 r=advisor.ingest(c,event)
 checks.append({"request":"Detectar entrevista y candidato de agenda","pass":set(r["findings"])=={"job","calendar_candidate"}})
 r=advisor.ingest(c,event)
 checks.append({"request":"Repetición del mismo correo","pass":r["duplicate"] and not r["findings"]})
 checks.append({"request":"Fuente pendiente permanece desconectada","pass":not any(x[0] for x in c.execute("select connected from source_state"))})
 checks.append({"request":"Fechas imposibles","pass":advisor.parse_datetime("Cita 31/02/2026 12:30") is None})
 checks.append({"request":"Fecha incompleta requiere revisión","pass":advisor.parse_datetime("Cita mañana 12:30") is None})
 checks.append({"request":"El candidato no crea citas por su cuenta","pass":json.loads(c.execute("select details from findings where kind='calendar_candidate'").fetchone()[0])["auto_create"] is False})
 c.close()
results["consejero"]={"level":"Práctica local con datos ficticios y base temporal","cases":checks,"passed":all(c["pass"] for c in checks)}
cfg=agent.get_config()
blocked=False
try:agent.safe_path("../outside-secrets.txt",cfg)
except ValueError:blocked=True
results["auditor"]={"level":"Comprobación de preparación y límites; auditoría real pendiente","passed":blocked and "FORMACIÓN 1.0.0" in agent.SYSTEM,"cases":[{"request":"Bloqueo de ruta fuera del workbench","pass":blocked},{"request":"Carga de formación","pass":"FORMACIÓN 1.0.0" in agent.SYSTEM}]}
results["reparador"]={"level":"Comprobación de preparación; reparación real pendiente","passed":"FORMACIÓN 1.0.0" in repair_agent.SYSTEM and "training.json" not in repair_agent.ALLOWED,"cases":[{"request":"Carga de formación","pass":"FORMACIÓN 1.0.0" in repair_agent.SYSTEM},{"request":"No puede editar su formación","pass":"training.json" not in repair_agent.ALLOWED}]}
out={"date":"2026-10-08","ai_cost_eur":0,"results":results}
path=root/"agent/runs/training-assessment-20261008.json"
path.write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(out,ensure_ascii=False,indent=2))
raise SystemExit(0 if all(r["passed"] for r in results.values()) else 1)
