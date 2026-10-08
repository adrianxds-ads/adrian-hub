"""Exercise installed private bridge without starting paid workers or its services."""
import argparse, importlib.util, tempfile
from pathlib import Path
from unittest.mock import patch

def main():
 p=argparse.ArgumentParser();p.add_argument("--bridge",required=True);a=p.parse_args()
 spec=importlib.util.spec_from_file_location("bridge",a.bridge);b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
 with tempfile.TemporaryDirectory() as tmp:
  b.ROOT=tmp;report=Path(tmp)/"audit.md";report.write_text("Full diagnostic",encoding="utf-8")
  b.AGENT_STATE.update(run_id="audit-test",running=False,status="completed",returncode=0,dry_run=False,mission="Audita Keyboard Speak",report=str(report),result={"ok":True,"partial":True})
  launches=[]
  def fake_start(m,d,c):
   launches.append(m);b.REPAIR_STATE.update(run_id="repair-test",running=True,status="running");return dict(b.REPAIR_STATE)
  with patch.object(b,"start_repair",side_effect=fake_start):
   b._auto_repair_after_audit("audit-test")
   assert not launches and "auto_repair_error" in b.AGENT_STATE
   b.AGENT_STATE["result"]["partial"]=False
   b._auto_repair_after_audit("audit-test")
   assert len(launches)==1 and b.AGENT_STATE["repair_run_id"]=="repair-test"
   b.start_nexo_repair("audit-test",True)
   assert len(launches)==1
   try:b.start_nexo_repair("wrong-run",True)
   except RuntimeError:pass
   else:raise AssertionError("Wrong audit accepted")
  with patch.object(b,"_repair_preflight",return_value={"ok":True,"issues":[]}):
   try:b.start_repair("preflight",True,False)
   except RuntimeError:pass
   else:raise AssertionError("Preflight overwrote running repair")
   assert b.REPAIR_STATE["running"]
 print("PASS server-side automatic handoff, partial stop, idempotency, identity and active-worker preservation; API cost 0")
if __name__=="__main__":main()
