"""Prueba local de ocho quizzes Núcleo · perfiles limpios, sin datos personales."""
from pathlib import Path
from urllib.parse import urlparse,unquote
import mimetypes
from playwright.sync_api import sync_playwright
root=Path("C:/Users/adria")
repolist=[
 ("adaptive-english","english","#startBtn"),
 ("adaptive-phrasal-verbs","phrasal","#startBtn"),
 ("adaptive-pizarras","pizarras","#startClassBtn"),
 ("b2-multiple-choice-cloze","cloze","#startBtn"),
 ("adaptive-exam","cambridge",""),
 ("adaptive-keyword-speaking","keyword","#startBtn"),
 ("adaptive-verbs-catala","catala","#startBtn"),
 ("adaptive-hoti0108","hoti",""),
]
def serve(route):
 u=urlparse(route.request.url)
 if u.hostname=="adrin.tail8fd071.ts.net":
  route.fulfill(status=200,content_type="application/json",body='{"entries":{},"revision":0,"accepted":0,"acceptedKeys":[]}');return
 if u.hostname!="adrianxds-ads.github.io":
  route.abort();return
 file=root/unquote(u.path).lstrip("/")
 if file.is_dir():file=file/"index.html"
 if not file.is_file():route.fulfill(status=404,body="not found");return
 route.fulfill(status=200,body=file.read_bytes(),content_type=mimetypes.guess_type(str(file))[0] or "application/octet-stream")
with sync_playwright() as p:
 b=p.chromium.launch(channel="chrome",headless=True)
 for w,h in [(360,780),(390,844),(412,915),(1280,800)]:
  for repo,alias,startbtn in repolist:
   ctx=b.new_context(viewport={"width":w,"height":h},service_workers="block")
   ctx.route("**/*",serve)
   page=ctx.new_page()
   errors=[]
   page.on("pageerror",lambda e:errors.append(str(e)))
   page.goto("https://adrianxds-ads.github.io/"+repo+"/",wait_until="domcontentloaded",timeout=20000)
   page.wait_for_timeout(500)
   info=page.evaluate("""() => {
     let e=document.querySelector('.panel,.paper,.mode-card,.mode,main');
     return {bodyFont:getComputedStyle(document.body).fontFamily,
       bodyColor:getComputedStyle(document.body).color,
       rootBg:getComputedStyle(document.documentElement).backgroundColor,
       panel:e?getComputedStyle(e).backgroundColor:null,
       profile:document.body.dataset.nucleoGame||'',
       loaded:[...document.styleSheets].some(x=>x.href?.includes('nucleo-game-theme')),
       width:document.documentElement.scrollWidth,viewport:innerWidth,
       count:document.querySelectorAll('.answer,.option').length}
   }""")
   assert info["profile"]==alias,(repo,info)
   assert info["loaded"],(repo,info)
   assert "Roboto" in info["bodyFont"],(repo,info)
   assert info["bodyColor"]=="rgb(37, 40, 44)",(repo,info)
   if alias!="hoti":
    assert info["panel"]=="rgb(255, 255, 255)",(repo,info)
   assert info["width"]<=w+1,(repo,info)
   if startbtn and page.locator(startbtn).count() and page.locator(startbtn).first.is_visible():
    page.locator(startbtn).first.click(timeout=5000)
    page.wait_for_timeout(170)
    if alias in ("english","phrasal","pizarras","cloze","catala"):
     colors=page.locator("#gameScreen .answer").evaluate_all("(els)=>els.map(x=>getComputedStyle(x).backgroundColor)")
     if colors:
      assert len(colors)>=4 and len(set(colors))==4,(repo,colors)
     else:
      print("READ-FIRST awaiting question/options",repo,flush=True)
   if w==390:
    page.screenshot(path=str(root/("nucleo-game-"+repo+"-390.png")),full_page=False)
   # Errors collected for diagnostics; hosting integrations may be unavailable in local fixture
   print("VISUAL",repo,w,info,"js_errors",errors[:3],flush=True)
   ctx.close()
 for extra in ["cambridge-quiz.html","keyword-quiz.html"]:
  ctx=b.new_context(viewport={"width":390,"height":844},service_workers="block")
  ctx.route("**/*",serve)
  page=ctx.new_page()
  page.goto("https://adrianxds-ads.github.io/adaptive-exam/"+extra,wait_until="domcontentloaded")
  page.wait_for_timeout(350)
  info=page.evaluate("""() => ({
      profile:document.body.dataset.nucleoGame,
      width:document.documentElement.scrollWidth,
      bg:getComputedStyle(document.body).backgroundColor,
      font:getComputedStyle(document.body).fontFamily
  })""")
  assert info["profile"]=="cambridge" and info["width"]<=391 and "Roboto" in info["font"],info
  print("VISUAL EXTRA",extra,info,flush=True)
  ctx.close()
 b.close()
print("DONE ALL VISUAL FIXTURES",flush=True)
