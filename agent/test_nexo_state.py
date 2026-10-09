import tempfile, unittest
from pathlib import Path
from nexo_state import mission_view,conversation_context,specialist_contracts

class SharedStateTests(unittest.TestCase):
 def test_reports_costs_and_matching_runs(self):
  with tempfile.TemporaryDirectory() as tmp:
   report=Path(tmp)/"audit.md";report.write_text("Complete report",encoding="utf-8")
   repairreport=Path(tmp)/"repair.md";repairreport.write_text("No files changed",encoding="utf-8")
   audit=dict(run_id="a1",mission="Keyboard Speak",status="completed",returncode=0,report=str(report),result={"ok":True,"cost_usd":.189184})
   self.assertEqual(mission_view(audit,{})["phase"],"complete")
   audit["result"]["partial"]=True
   self.assertEqual(mission_view(audit,{})["phase"],"partial")
   audit["result"]["partial"]=False;audit["repair_run_id"]="r1"
   self.assertEqual(mission_view(audit,{"run_id":"wrong"})["phase"],"repair_failed")
   repair=dict(run_id="r1",status="completed",returncode=0,report=str(repairreport),result={"ok":True,"cost_usd":.309188,"last_test":{"exit_code":0}})
   v=mission_view(audit,repair,"");self.assertEqual(v["phase"],"verified")
   self.assertEqual(mission_view(audit,repair,"app.js | 2")["phase"],"repaired")
   exported=conversation_context(v)
   for text in ("a1","r1",".189184",".309188","Complete report","No files changed","Pixel"):
    self.assertIn(text,exported)
   repair["result"]["last_test"]["exit_code"]=1
   self.assertEqual(mission_view(audit,repair)["phase"],"repair_failed")
 def test_empty_and_prepared_roles(self):
  self.assertIsNone(mission_view({},{}))
  roles=specialist_contracts()["roles"]
  self.assertFalse(roles["constructor"]["active"]);self.assertTrue(roles["constructor"]["prepared"])
  self.assertFalse(roles["editor"]["active"])
if __name__=="__main__":unittest.main()
