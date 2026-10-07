import json,subprocess,tempfile,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
py=sys.executable;agent=str(HERE/"advisor_agent.py")
with tempfile.TemporaryDirectory() as td:
 db=str(Path(td)/"a.sqlite3")
 def run(*args):
  x=subprocess.check_output([py,agent,"--db",db,*args],text=True,encoding="utf-8")
  return json.loads(x)
 e1={"source":"gmail","external_id":"m1","sender":"recruiter@example.com","title":"Entrevista proceso de selección","body":"Cita 10/10/2026 a las 11:30"}
 r=run("ingest","--json",json.dumps(e1,ensure_ascii=False));assert set(r["findings"])=={"job","calendar_candidate"},r
 d=run("ingest","--json",json.dumps(e1,ensure_ascii=False));assert d["duplicate"]
 for i in range(4):
  e={"source":"gmail","external_id":"s"+str(i),"sender":"news@substack.com","title":"Newsletter Substack","body":"unsubscribe"}
  run("ingest","--json",json.dumps(e))
 t=run("tick");assert t["ai_cost_usd"]==0 and t["created"]==1,t
 st=run("status");assert st["counts"]["job"]==1 and st["counts"]["calendar_candidate"]==1 and st["counts"]["cleanup_candidate"]==1,st
 assert all(not s["connected"] for s in st["sources"])
 p={"source":"plaud","external_id":"p1","title":"Nota clase","body":"Tengo que enviar el writing. Cita 11/10/2026 17:30"}
 rr=run("ingest","--json",json.dumps(p,ensure_ascii=False));assert "action_candidate" in rr["findings"],rr
 print("PASS advisor local engine")
