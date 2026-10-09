from pathlib import Path
from urllib.parse import urlparse, unquote
from playwright.sync_api import sync_playwright
import mimetypes
workspace=Path(r"C:\Users\adria")
preview=workspace/"hub-editorial-preview-20261009"
def serve(route):
 u=urlparse(route.request.url)
 if u.hostname!="adrianxds-ads.github.io":
  route.abort();return
 path=unquote(u.path)
 if path.startswith("/adrian-hub/"):
  file=preview/path[len("/adrian-hub/"):]
 else:
  file=workspace/path.lstrip("/")
 if file.is_dir():file=file/"index.html"
 if not file.is_file():
  route.fulfill(status=404,body="not found "+str(file));return
 route.fulfill(status=200,body=file.read_bytes(),content_type=mimetypes.guess_type(str(file))[0] or "application/octet-stream")
with sync_playwright() as p:
 browser=p.chromium.launch(channel="chrome",headless=True)
 for w,h in [(360,780),(390,844),(412,915),(1280,800)]:
  context=browser.new_context(viewport={"width":w,"height":h},service_workers="block")
  context.route("**/*",serve)
  page=context.new_page()
  errors=[]
  page.on("pageerror",lambda e:errors.append(str(e)))
  page.goto("https://adrianxds-ads.github.io/adrian-hub/",wait_until="domcontentloaded")
  page.locator(".app").first.wait_for(timeout=12000)
  state=page.evaluate("""() => ({
   cards:document.querySelectorAll('.app').length,
   bodyFont:getComputedStyle(document.body).fontSize,
   cardBorderLeft:getComputedStyle(document.querySelector('.app')).borderLeftWidth,
   cardVersion:getComputedStyle(document.querySelector('.app-version-chip')).fontSize,
   cardColors:new Set([...document.querySelectorAll('.app')].map(e=>getComputedStyle(e).backgroundImage)).size,
   noOverflow:document.documentElement.scrollWidth<=innerWidth+1,
   garden:!!document.querySelector('#githubGarden'),
   stars:!!document.querySelector('#hubStarCounter'),
   nexo:!!document.querySelector('#nexoVisualOpenBtn')
  })""")
  assert state["cards"]>=15,state
  assert state["bodyFont"]=="19px",state
  assert state["cardBorderLeft"]=="1px",state
  assert state["cardVersion"]=="16px",state
  assert state["cardColors"]>=12,state
  assert state["noOverflow"],state
  assert state["garden"] and state["stars"] and state["nexo"],state
  page.locator(".app[data-id='english'] .app-info").click()
  assert page.locator("#appInfoDialog").evaluate("(x)=>x.open")
  page.locator("#appInfoClose").click()
  page.locator("#search").fill("Cambridge")
  assert page.locator(".app").count()>=1
  page.locator("#search").fill("")
  assert page.locator(".app").count()>=15
  assert not errors,errors
  if w in [390,1280]:page.screenshot(path=str(preview/f"_editorial-{w}.png"),full_page=True)
  print("PASS editorial",w,h,state,flush=True)
  context.close()
 browser.close()
