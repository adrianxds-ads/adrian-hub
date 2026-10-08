"""No-cost handoff and final-test regression tests."""
import contextlib, io, json, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
import nexo_repair as nexo
import repair_agent as repair

class HandoffTests(unittest.TestCase):
 def test_guards_and_deduplication(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);report=root/"audit.md";report.write_text("Reproduce a layout failure",encoding="utf-8")
   audit=dict(run_id="audit-1",mission="Audita Keyboard Speak",status="completed",running=False,returncode=0,dry_run=False,result={"ok":True},report=str(report))
   state={"run_id":"repair-1","running":True};calls=[]
   def start(m,d,c):calls.append(m);return state
   ledger=root/"ledger.json"
   for change in ({"result":{"ok":True,"partial":True}},{"running":True},{"returncode":2},{"dry_run":True},{"mission":"Cambridge"}):
    with self.assertRaises(RuntimeError):nexo.handoff({**audit,**change},start,lambda:state,ledger,True)
   with self.assertRaises(PermissionError):nexo.handoff(audit,start,lambda:state,ledger,False)
   report.write_text("INFORME PARCIAL",encoding="utf-8")
   with self.assertRaises(RuntimeError):nexo.handoff(audit,start,lambda:state,ledger,True)
   report.write_text("Full diagnostic",encoding="utf-8")
   self.assertEqual(nexo.handoff(audit,start,lambda:state,ledger,True),state)
   self.assertEqual(nexo.handoff(audit,start,lambda:state,ledger,True),state)
   self.assertEqual(len(calls),1);self.assertIn("Full diagnostic",calls[0])
   with self.assertRaises(RuntimeError):nexo.handoff(audit,start,lambda:{"run_id":"other"},ledger,True)
   self.assertEqual(len(calls),1)

 def run_actions(self,actions,test_code):
  with tempfile.TemporaryDirectory() as tmp:
   work=Path(tmp);here=work/"hub/agent";here.mkdir(parents=True)
   root=work/"keyboard-speak-test";root.mkdir();(root/".git").mkdir()
   for name in ("index.html","app.js"):(root/name).write_text("original",encoding="utf-8")
   mission=work/"mission.txt";mission.write_text("repair",encoding="utf-8")
   responses=iter(actions)
   cfg={"models":{"mock":{"provider":"mock"}}}
   fake_test=type("Result",(),{"returncode":test_code,"stdout":"regression","stderr":""})()
   argv=["repair","--root",str(root),"--test-script",str(work/"test.py"),"--mission-file",str(mission),"--model","mock","--max-turns",str(len(actions))]
   with patch.object(repair,"HERE",here),patch("sys.argv",argv),patch.object(repair.base,"get_config",return_value=cfg),patch.object(repair.base,"required_key_present",return_value=True),patch.object(repair.base,"estimated_call_ceiling",return_value=0),patch.object(repair.base,"call_model",side_effect=lambda *a:(json.dumps(next(responses)),{})),patch.object(repair.base,"token_cost",return_value=0),patch.object(repair.subprocess,"run",return_value=fake_test),contextlib.redirect_stdout(io.StringIO()):
    return repair.main()

 def test_report_requires_final_passing_tests(self):
  report={"action":"report","content":"done"}
  test={"action":"test"}
  edit={"action":"replace","path":"app.js","old":"original","new":"fixed"}
  self.assertEqual(self.run_actions([test,report],1),5)
  self.assertEqual(self.run_actions([test,edit,report],0),5)
  self.assertEqual(self.run_actions([edit,test,report],0),0)

if __name__=="__main__":unittest.main()
