"""El Triaje: deterministic zero-cost router for Adrian Hub agents."""
import argparse, json, re, unicodedata, sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
RULES_PATH=HERE/"triage_rules.json"
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

def norm(text):
    text=unicodedata.normalize("NFD",str(text or "").casefold())
    text="".join(c for c in text if unicodedata.category(c)!="Mn")
    return re.sub(r"[^a-z0-9]+"," ",text).strip()

def phrase_hit(haystack, phrase):
    p=norm(phrase)
    return bool(p and re.search(r"(?<![a-z0-9])"+re.escape(p)+r"(?![a-z0-9])",haystack))

def load_rules():
    return json.loads(RULES_PATH.read_text(encoding="utf-8"))

def route(text, rules=None):
    rules=rules or load_rules()
    raw=str(text or "").strip()
    n=norm(raw)
    if not n:
        return {"ok":False,"error":"petición vacía"}

    # Explicit workflow order takes precedence over keyword frequency.
    audit_first = re.search(r"\b(?:audita|auditar|revisa|revisar|diagnostica|diagnosticar) primero\b", n)
    repair_requested = any(phrase_hit(n, x) for x in ("repara", "reparar", "arregla", "arreglar", "corrige", "corregir"))
    if audit_first and repair_requested:
        return build_result(raw, n, ["auditor", "reparador", "tester"], rules, "explicit-order", 0.98)

    # Strong learned overrides: all listed signals must be present.
    for rule in rules.get("overrides",[]):
        signals=rule.get("contains",[])
        if signals and all(phrase_hit(n,x) for x in signals):
            return build_result(raw,n,rule["route"],rules,"override",0.98)

    scores={}
    evidence={}
    for key,cfg in rules["agents"].items():
        score=0; hits=[]
        for x in cfg.get("verbs",[]):
            if phrase_hit(n,x): score+=3; hits.append(x)
        for x in cfg.get("nouns",[]):
            if phrase_hit(n,x): score+=2; hits.append(x)
        scores[key]=score;evidence[key]=hits

    # Context disambiguation learned from the Hub's workflows.
    if "sin tocar nada" in n or "solo lectura" in n:
        scores["auditor"]+=6;scores["reparador"]=max(0,scores["reparador"]-5)
    if ("app" in n or "aplicacion" in n or "modulo" in n) and any(x in n.split() for x in ("nueva","nuevo","crear","crea","construir","construye")):
        scores["constructor"]+=7
    if any(x in n for x in ("bug","fallo","funciona mal","roto","rota")) and any(x in n for x in ("arregl","repar","corrig","solucion")):
        scores["reparador"]+=6;scores["tester"]+=2
    if re.match(r"^(arregla|arreglar|repara|reparar|soluciona|solucionar|parchea|parchear)\b",n):
        scores["reparador"]+=2
    if any(x in n for x in ("texto","writing","correo","blog","redaccion","documento")) and any(x in n for x in ("corrig","edit","reescrib","redact","pul")):
        scores["editor"]+=7;scores["reparador"]=max(0,scores["reparador"]-3)
    if any(phrase_hit(n,x) for x in ("prueba","test","regresion","responsive","consola")) and any(phrase_hit(n,x) for x in ("comprueba","prueba","verifica","test")):
        scores["tester"]+=5
    if any(x in n for x in ("publica","publicar","borra","borrar","elimina","eliminar","credencial","presupuesto","gasto")):
        scores["guardian"]+=4
    if any(x in n for x in ("pc","pixel","tailscale","desktop commander","adb","watchdog")):
        scores["operador"]+=4

    ordered=sorted(scores,key=lambda k:(scores[k],k),reverse=True)
    top=ordered[0]; top_score=scores[top]
    if top_score<=0:
        return {"ok":True,"request":raw,"normalized":n,"status":"ambiguous","confidence":0.0,
                "needs_model":True,"cost_strategy":"cheap-fallback","primary":None,"pipeline":[],
                "reason":"No hay señales suficientes para derivar con reglas locales."}

    pipeline=[top]
    # Add closely related secondary roles only when they have meaningful support.
    for k in ordered[1:]:
        if scores[k]>=4 and scores[k]>=top_score-4 and k not in pipeline:
            pipeline.append(k)
        if len(pipeline)>=3:break

    # Workflow enrichments that should happen after the primary specialist.
    if top=="reparador" and ("tester" not in pipeline): pipeline.append("tester")
    if top=="constructor":
        if "tester" not in pipeline:pipeline.append("tester")
        if "guardian" not in pipeline:pipeline.append("guardian")
    if "publica" in n or "publicar" in n:
        if "guardian" not in pipeline:pipeline.append("guardian")
        if "operador" not in pipeline:pipeline.append("operador")
    pipeline=pipeline[:4]

    second=max([scores[k] for k in scores if k!=top],default=0)
    confidence=min(0.97,0.58+0.045*top_score+0.025*max(0,top_score-second))
    return build_result(raw,n,pipeline,rules,"scored",round(confidence,2),scores,evidence)

def build_result(raw,n,pipeline,rules,method,confidence,scores=None,evidence=None):
    agents=rules["agents"]
    details=[]
    cap=0.0
    for key in pipeline:
        cfg=agents[key]
        details.append({"id":key,"name":cfg["name"],"active":bool(cfg["active"]),
                        "tier":cfg["tier"],"max_usd":cfg["max_usd"]})
        if cfg["active"]: cap+=float(cfg["max_usd"] or 0)
    primary=details[0] if details else None
    inactive=any(not x["active"] for x in details)
    if cap==0: strategy="local-zero"
    elif cap<=0.35: strategy="low"
    else: strategy="guarded-premium"
    reason=f"{primary['name']} encaja mejor con la petición" if primary else "Sin ruta"
    if inactive:reason+="; parte de la ruta aún está en formación"
    out={"ok":True,"request":raw,"normalized":n,"status":"routed","method":method,
         "confidence":confidence,"needs_model":False,"primary":primary,"pipeline":details,
         "active_ceiling_usd":round(cap,4),"cost_strategy":strategy,"reason":reason}
    if scores is not None:
        out["scores"]={k:v for k,v in sorted(scores.items(),key=lambda kv:kv[1],reverse=True) if v>0}
    if evidence is not None and primary:
        out["evidence"]=evidence.get(primary["id"],[])
    return out

def main():
    p=argparse.ArgumentParser()
    p.add_argument("text",nargs="*")
    p.add_argument("--json",action="store_true")
    a=p.parse_args()
    text=" ".join(a.text).strip()
    result=route(text)
    print(json.dumps(result,ensure_ascii=False,indent=2 if a.json else None))
    return 0 if result.get("ok") else 2

if __name__=="__main__":
    raise SystemExit(main())
