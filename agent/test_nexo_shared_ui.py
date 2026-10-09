"""Real private shared-mission API, two empty browser profiles; all execution POSTs blocked."""
import argparse,importlib.util,json,threading,sys,urllib.request
from urllib.parse import urlparse
from http.server import ThreadingHTTPServer
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8")
p=argparse.ArgumentParser();p.add_argument("--bridge",required=True);p.add_argument("--base-url");a=p.parse_args()
spec=importlib.util.spec_from_file_location("bridge",a.bridge);b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
base=(a.base_url or "http://127.0.0.1:18879").rstrip("/")
server=None
if not a.base_url:
 server=ThreadingHTTPServer(("127.0.0.1",18879),b.Handler)
 threading.Thread(target=server.serve_forever,daemon=True).start()
shared=json.load(urllib.request.urlopen(base+"/dc-inbox/agents/nexo/mission"))
expected=shared["mission"];assert expected and expected["runId"]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel="chrome",headless=True)
  for width,height in ((390,844),(1280,800)):
   c=browser.new_context(viewport={"width":width,"height":height},service_workers="block")
   c.add_init_script("navigator.clipboard.writeText=async(text)=>{window.__exportedNexo=text;};")
   def intercept(r):
    path=urlparse(r.request.url).path
    if r.request.method=="POST":raise AssertionError("Unexpected execution POST")
    if "/ui/" in path or "/nexo/" in path:r.continue_();return
    if path.endswith("/status") and "/repair/" not in path:out={"agent":b._agent_snapshot()}
    elif path.endswith("/repair/status"):out={"repair":b._repair_snapshot()}
    else:out={}
    r.fulfill(json={"ok":True,**out})
   c.route("**/dc-inbox/agents/**",intercept)
   page=c.new_page();errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
   page.goto(base+"/dc-inbox/agents/ui/",wait_until="networkidle")
   page.wait_for_function("JSON.parse(localStorage.getItem('nexo-mission-v1')||'{}').source==='pc-service'")
   saved=page.evaluate("JSON.parse(localStorage.getItem('nexo-mission-v1'))")
   assert saved["runId"]==expected["runId"] and saved["phase"]==expected["phase"]
   page.locator("#nexoMissionContext").click()
   page.wait_for_function("!!window.__exportedNexo")
   exported=page.evaluate("window.__exportedNexo")
   assert expected["runId"] in exported and expected["request"] in exported
   if expected.get("repairRunId"):assert expected["repairRunId"] in exported
   page.reload(wait_until="networkidle")
   assert page.evaluate("JSON.parse(localStorage.getItem('nexo-mission-v1')).runId")==expected["runId"]
   assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
   assert not errors,errors
   from pathlib import Path
   page.locator(".nexo-mission").screenshot(path=str(Path(__file__).parent/"runs"/("nexo-shared-"+str(width)+".png")))
   print("PASS",width,"empty profile recovers same server mission, complete clipboard result, reload, no POST/model calls")
   c.close()
  browser.close()
finally:
 if server:server.shutdown();server.server_close()
