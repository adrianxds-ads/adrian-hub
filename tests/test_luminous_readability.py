"""Luminous 1.1 regression: fresh local fixtures, never personal storage."""
from pathlib import Path
from urllib.parse import urlparse,unquote
import mimetypes,json,sys
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
sys.stdout.reconfigure(encoding="utf-8")
repos=["adrian-hub","adaptive-english","adaptive-phrasal-verbs","adaptive-pizarras","b2-multiple-choice-cloze","adaptive-exam","adaptive-keyword-speaking","adaptive-verbs-catala","adaptive-hoti0108"]
audit=r"""() => {
 const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
 const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 const mix=(a,b)=>a.slice(0,3).map((v,i)=>v*(a[3]??1)+b[i]*(1-(a[3]??1)));
 const bg=e=>{if(!e)return [234,240,245];let c=rgb(getComputedStyle(e).backgroundColor);return mix(c,(c[3]??1)===1?c:bg(e.parentElement))};
 let out=[];
 for(let e of document.querySelectorAll('body *')){
  const text=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();
  if(!text||!e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})||e.closest('svg,canvas'))continue;
  const s=getComputedStyle(e),r=e.getBoundingClientRect();if(!r.width||!r.height||s.fontSize==='0px')continue;
  const back=bg(e),fore=mix(rgb(s.color),back),a=lum(fore),b=lum(back);
  const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  // This is a solid-surface diagnostic. Gradient insets/answer buttons are
  // separately inspected visually; do not claim these estimates are WCAG proofs.
  let gradient=false;for(let p=e;p;p=p.parentElement){const ps=getComputedStyle(p);if(ps.backgroundImage!=='none'){gradient=true;break}if((rgb(ps.backgroundColor)[3]??1)===1)break}
  const minimum=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700)?3:4.5;
  if(ratio<minimum||parseFloat(s.fontSize)<16)out.push({id:e.id,cls:typeof e.className==='string'?e.className:'',text:text.slice(0,70),size:parseFloat(s.fontSize),minimum,ratio:+ratio.toFixed(2),gradient});
 }
 return {width:document.documentElement.scrollWidth,viewport:innerWidth,flags:out};
}"""
def serve(route):
 u=urlparse(route.request.url)
 if u.hostname=="adrin.tail8fd071.ts.net":
  route.fulfill(status=200,content_type="application/json",body='{"entries":{},"revision":0,"accepted":0,"acceptedKeys":[]}');return
 if u.hostname!="adrianxds-ads.github.io":route.abort();return
 f=root/unquote(u.path).lstrip("/")
 if f.is_dir():f=f/"index.html"
 route.fulfill(status=200 if f.is_file() else 404,body=f.read_bytes() if f.is_file() else b"missing",content_type=mimetypes.guess_type(str(f))[0] or "application/octet-stream")
reports=[];failures=[]
with sync_playwright() as p:
 b=p.chromium.launch(channel="chrome",headless=True)
 for w,h in [(360,780),(390,844),(412,915),(1280,800)]:
  for repo in repos:
   c=b.new_context(viewport={"width":w,"height":h},service_workers="block")
   c.route("**/*",serve);page=c.new_page();errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
   page.goto("https://adrianxds-ads.github.io/"+repo+"/",wait_until="domcontentloaded");page.wait_for_timeout(400)
   def record(state):
    a=page.evaluate(audit);a.update(repo=repo,state=state,testedWidth=w,errors=list(errors));reports.append(a)
    if a["viewport"]+1<a["width"]:failures.append((repo,w,state,"overflow"))
    if errors:failures.append((repo,w,state,errors[:2]))
    bad=[x for x in a["flags"] if x["ratio"]<x["minimum"] and not x["gradient"]]
    print(repo,w,state,"solid contrast",[(x["id"] or x["cls"] or x["text"][:18],x["ratio"]) for x in bad][:28],flush=True)
    if bad:failures.append((repo,w,state,"solid contrast",bad[:5]))
    if w==390:
     page.screenshot(path=str(root/"adrian-hub/tests"/("luminous11-"+repo+"-"+state+".png")),full_page=False)
   record("home")
   if repo=="adrian-hub":
    page.locator('.app-info').first.click();record("info");page.locator("#appInfoClose").click()
    page.locator(".version-row").first.wait_for();page.locator(".version-row").first.click();record("versions");page.locator("#versionDialogClose").click()
    page.locator("#search").fill("Cambridge");assert page.locator(".app").count()>0
   elif repo in ["adaptive-english","b2-multiple-choice-cloze","adaptive-verbs-catala"]:
    for el in page.locator(".home-details summary").all():
     if el.is_visible():el.click()
    record("details")
    page.evaluate("renderStatsScreen();showScreen('statsScreen')");record("stats")
    page.evaluate("showLevelIntro=async()=>{};readFirstMode=false;startSession(false)")
    page.wait_for_function("current&&!locked");record("game")
    page.evaluate("answer(current.correctPos,false)");record("correction")
   elif repo=="adaptive-phrasal-verbs":
    page.evaluate("renderStats();showScreen('statsScreen')");record("stats")
    page.evaluate("showLevelIntro=async()=>{};readFirstEnabled=()=>false;shouldPrethink=()=>false;showScreen('startScreen')")
    page.locator("#startBtn").click();page.wait_for_function("current&&questionPhase==='answer'&&!locked");record("game")
   elif repo=="adaptive-pizarras":
    page.evaluate("renderStats();show('statsScreen')");record("stats")
    page.evaluate("readFirstMode=false;startQuick()");page.wait_for_function("current&&!locked");record("game")
    page.evaluate("session.index=14;renderQuestion();answer(current.correct,null,false)");page.wait_for_function("state.history.length===1");record("end")
   elif repo=="adaptive-keyword-speaking":
    page.evaluate("renderStats()");record("stats")
    page.evaluate("secondsPerQuestion=0;startSession()");record("game")
   elif repo=="adaptive-hoti0108":
    page.evaluate("renderStatistics()");record("stats")
    page.evaluate("start(bank.slice(0,15).map(q=>q.id))");page.wait_for_function("session&&session.ids.length===15");record("game")
   elif repo=="adaptive-exam":
    page.locator("#partList .part-card").nth(1).click();record("parts")
    page.locator("#exerciseList button").first.click();record("paper")
   c.close()
 b.close()
(root/"adrian-hub/tests/luminous11-report.json").write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding="utf-8")
assert not failures,failures
print("PASS layout/JS checks",len(reports),"screens; contrast flags retained for review",flush=True)
