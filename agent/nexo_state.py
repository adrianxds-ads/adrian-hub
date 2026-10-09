"""Shared read-only mission view using existing service snapshots and reports."""
import json
from pathlib import Path
from datetime import datetime, timezone

CAPABILITIES = {
 "auditor":{"active":True,"mode":"read-only","max_usd":0.35},
 "reparador":{"active":True,"mode":"isolated-patch","max_usd":1.65,"targets":["adaptive-keyword-speaking"]},
 "tester":{"active":True,"mode":"trusted-regression-inside-repair","independent":False},
 "constructor":{"active":False,"mode":"planned","reason":"Needs scoped files, trusted tests and an isolated executor"},
 "editor":{"active":False,"mode":"planned","reason":"Needs document targets and a reviewable diff"},
 "targets":{"adaptive-keyword-speaking":"audit-repair-test","adaptive-exam":"audit-only"},
}

def read_report(state):
 path=state.get("report")
 if not path:return ""
 try:return Path(path).read_text(encoding="utf-8")[:12000]
 except OSError:return ""

def mission_view(audit, repair, diff_stat=None):
 if not audit.get("run_id"):return None
 result=audit.get("result") or {}
 report=read_report(audit)
 phase="running" if audit.get("running") else "complete"
 note=""
 if not audit.get("running"):
  if audit.get("dry_run"):phase="preflight"
  elif audit.get("status")!="completed" or audit.get("returncode")!=0 or not result.get("ok") or not report:phase="failed"
  elif result.get("partial") or "INFORME PARCIAL" in report.upper():phase="partial"
 if phase=="partial":note="El informe está incompleto; la reparación queda bloqueada."
 if audit.get("auto_repair_error"):note="Derivación detenida: "+str(audit["auto_repair_error"])
 view=dict(schema=1,runId=audit["run_id"],request=audit.get("mission",""),phase=phase,
           cost=result.get("cost_usd",result.get("spent_usd")),report=report,note=note,
           source="pc-service",updatedAt=datetime.now(timezone.utc).isoformat())
 linked=audit.get("repair_run_id")
 if linked:
  view["repairRunId"]=linked
  if repair.get("run_id")!=linked:
   view.update(phase="repair_failed",note="El servicio tiene otra reparación; no se repite esta misión.")
  else:
   rr=repair.get("result") or {}
   view["repairCost"]=rr.get("cost_usd",rr.get("spent_usd"))
   if repair.get("running"):view.update(phase="repairing",note="Reparación aislada en curso; continúa sin el panel.")
   elif repair.get("status")=="completed" and repair.get("returncode")==0 and rr.get("ok") and (rr.get("last_test") or {}).get("exit_code")==0 and read_report(repair):
    view.update(phase="verified" if diff_stat is not None and not diff_stat.strip() else "repaired",repairReport=read_report(repair),note="Pruebas finales aprobadas. Parche aislado pendiente de revisión.",checkout=repair.get("checkout",""))
   else:view.update(phase="repair_failed",note=repair.get("error") or "La reparación no terminó con pruebas finales aprobadas.")
 if view["phase"]=="verified":view["note"]="Sin cambios en archivos; regresión aprobada. No se ha reproducido un fallo."
 if diff_stat is not None:view["diffStat"]=diff_stat
 return view

def conversation_context(view):
 if not view:return "Nexo: todavía no hay una misión ejecutada en el servicio."
 lines=["CONTINUIDAD DE NEXO","Petición: "+view["request"],"Auditor: "+view["runId"],"Estado: "+view["phase"],
        "Coste auditor: "+str(view.get("cost"))+" USD","Resultado: "+view.get("note","")]
 if view.get("repairRunId"):lines.extend(["Reparador: "+view["repairRunId"],"Coste reparación: "+str(view.get("repairCost"))+" USD"])
 if view.get("checkout"):lines.append("Copia aislada: "+view["checkout"])
 if view.get("report"):lines.extend(["Informe del Auditor:",view["report"]])
 if view.get("repairReport"):lines.extend(["Informe del Reparador:",view["repairReport"]])
 lines.extend(["No se ha publicado el parche. Las pruebas de navegador no prueban el teclado o micrófono físicos del Pixel.",
               "Continuemos desde este estado verificado. No repitas ejecuciones con coste; distingue evidencia, hipótesis y trabajo pendiente."])
 return "\n\n".join(lines)

def specialist_contracts():
 return json.loads((Path(__file__).parent/"specialist_contracts.json").read_text(encoding="utf-8"))
