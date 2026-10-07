"""Scoped repair agent. Credentials remain in Windows Credential Manager."""
import argparse, importlib.util, json, subprocess, time
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("audit_agent",HERE/"agent.py")
base=importlib.util.module_from_spec(spec); spec.loader.exec_module(base)
ALLOWED={"app.js","index.html","styles.css","manifest.webmanifest","service-worker.js","README.md"}
SYSTEM="""You are Claude, the software repair engineer for Adrian Hub.
Work exclusively through these JSON tools in an isolated checkout. No shell/network/credentials/deploy tools.
Return exactly one JSON object:
{"action":"read","path":"app.js","start":1,"end":120}
{"action":"replace","path":"app.js","old":"exact original substring","new":"replacement"}
{"action":"write","path":"styles.css","content":"complete content"}
{"action":"patch","changes":[{"path":"app.js","old":"exact substring","new":"replacement"}]}
{"action":"test"}
{"action":"report","content":"concise Spanish result with limitations"}
Only app.js,index.html,styles.css,manifest.webmanifest,service-worker.js,README.md are writable.
Prefer exact substring replacements. Preserve scoring, question banks, stats/progress keys and existing voice semantics.
The caller supplies trusted regression tests; you cannot alter them. Test before your final report.
Never claim actual Pixel keyboard verification: headless viewport tests are simulations.
Do not inflate test claims. Do not change Cambridge 2-5-word rules or official answer data.
Your report MUST be <=2000 characters. Tool actions can contain up to 10000 output tokens.
"""
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--root",required=True);p.add_argument("--test-script",required=True)
    p.add_argument("--mission-file",required=True);p.add_argument("--model",default="openrouter-claude-opus-5-5")
    p.add_argument("--max-usd",type=float,default=1.65);p.add_argument("--max-turns",type=int,default=14)
    a=p.parse_args();root=Path(a.root).resolve();test=Path(a.test_script).resolve()
    # This agent can edit only a direct isolated workbench child.
    workbench=HERE.parent.parent.resolve()
    if root.parent!=workbench or not root.name.startswith("keyboard-speak-"):raise ValueError("Invalid isolated checkout")
    if not (root/".git").exists():raise ValueError("Git checkout required")
    cfg=base.get_config();mc=cfg["models"][a.model]
    if not base.required_key_present(mc["provider"]):raise RuntimeError("Credential unavailable")
    stamp=time.strftime("%Y%m%d-%H%M%S");runs=HERE/"runs";runs.mkdir(exist_ok=True)
    log=runs/(stamp+"-repair-transcript.jsonl")
    content=Path(a.mission_file).read_text(encoding="utf-8")
    for fn in ("index.html","app.js"):
        content+="\nFILE "+fn+"\n"+(root/fn).read_text(encoding="utf-8")
    messages=[{"role":"user","content":content}];spent=0;last_test=None
    def record(obj):
        with log.open("a",encoding="utf-8") as f:f.write(json.dumps(obj,ensure_ascii=False)+"\n")
    for turn in range(1,a.max_turns+1):
        final=turn==a.max_turns
        tokens=1800 if final else 6500
        if final:messages.append({"role":"user","content":"Final turn: return action=report <=2000 characters."})
        ceiling=base.estimated_call_ceiling(messages,SYSTEM,tokens,mc)
        if spent+ceiling>a.max_usd:
            print(json.dumps({"ok":False,"reason":"budget_guard","spent_usd":spent,"transcript":str(log),"last_test":last_test}),flush=True);return 4
        text,usage=base.call_model(messages,SYSTEM,a.model,tokens,mc)
        spent+=base.token_cost(usage,mc);record({"turn":turn,"usage":usage,"cost_usd":spent,"text":text})
        try:
            act=base.parse_action(text);kind=act.get("action")
            if kind=="report":
                if last_test is None:raise ValueError("Run test before reporting")
                report=runs/(stamp+"-repair-report.md")
                report.write_text("# Claude repair report\n\n"+str(act.get("content",""))+"\n",encoding="utf-8")
                print(json.dumps({"ok":True,"report":str(report),"cost_usd":spent,"last_test":last_test}),flush=True);return 0
            if kind=="patch":
                prepared={}
                for change in act.get("changes",[]):
                    fn=change.get("path","")
                    if fn not in ALLOWED:raise ValueError("File not allowed")
                    raw=root/fn
                    if raw.is_symlink():raise ValueError("Symlink refused")
                    f=raw.resolve()
                    if f.parent!=root:raise ValueError("Unsafe path")
                    original=prepared.get(f,f.read_text(encoding="utf-8"))
                    old=change["old"]
                    if not old or original.count(old)!=1:raise ValueError("Patch substring must match exactly once: "+fn)
                    prepared[f]=original.replace(old,change["new"],1)
                for f,body in prepared.items():f.write_text(body,encoding="utf-8")
                result="Batch applied: "+str(len(act.get("changes",[])))+" changes"
            elif kind=="test":
                r=subprocess.run(["python",str(test),"--root",str(root)],capture_output=True,text=True,encoding="utf-8",errors="replace",timeout=180)
                last_test={"exit_code":r.returncode,"output":(r.stdout+r.stderr)[-16000:]}
                result=json.dumps(last_test,ensure_ascii=False)
            else:
                fn=act.get("path","")
                if fn not in ALLOWED:raise ValueError("File not allowed")
                f=(root/fn).resolve()
                if f.parent!=root or f.is_symlink():raise ValueError("Unsafe path")
                if kind=="read":
                    lines=f.read_text(encoding="utf-8").splitlines()
                    start=max(1,int(act.get("start",1)));end=min(len(lines),int(act.get("end",start+120)),start+399)
                    result="\n".join(str(i)+": "+lines[i-1] for i in range(start,end+1))
                elif kind=="replace":
                    original=f.read_text(encoding="utf-8");old=act["old"];new=act["new"]
                    if not old or original.count(old)!=1:raise ValueError("old substring must match exactly once")
                    f.write_text(original.replace(old,new,1),encoding="utf-8");result="Replacement applied."
                elif kind=="write":
                    f.write_text(act["content"],encoding="utf-8");result="Written."
                else:raise ValueError("Unknown action")
        except Exception as e:result="TOOL ERROR: "+str(e)
        record({"turn":turn,"tool_result":result})
        print(json.dumps({"turn":turn,"action":act.get("action") if "act" in locals() else "format_error","spent_usd":round(spent,5)}),flush=True)
        messages.extend([{"role":"assistant","content":text},{"role":"user","content":"TOOL RESULT:\n"+result}])
    return 5
if __name__=="__main__":raise SystemExit(main())
