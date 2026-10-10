"""Prueba de aceptación Núcleo Editorial Luminous v1 en Chrome aislado.

Emplea fixtures locales y no utiliza la sesión real ni el almacenamiento personal.
"""
from pathlib import Path
from urllib.parse import urlparse, unquote
from playwright.sync_api import sync_playwright
import mimetypes,json

workspace=Path(__file__).resolve().parents[2]
def serve(route):
    u=urlparse(route.request.url)
    if u.hostname!="adrianxds-ads.github.io":
        route.abort()
        return
    f=workspace/unquote(u.path).lstrip("/")
    if f.is_dir():f=f/"index.html"
    if not f.is_file():
        route.fulfill(status=404,body="fixture missing")
        return
    route.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or "application/octet-stream")

with sync_playwright() as p:
    browser=p.chromium.launch(channel="chrome",headless=True)
    for w,h in [(360,780),(390,844),(412,915),(1280,800)]:
        context=browser.new_context(viewport={"width":w,"height":h},service_workers="block")
        context.route("**/*",serve)
        page=context.new_page()
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.goto("https://adrianxds-ads.github.io/adrian-hub/",wait_until="domcontentloaded")
        page.locator(".app").first.wait_for(timeout=14000)
        values=page.evaluate("""() => {
          const cards=[...document.querySelectorAll('.app')];
          const first=cards[0];
          const badge=first.querySelector('.glyph');
          const info=first.querySelector('.app-info');
          const css=getComputedStyle(badge);
          return {
            bodySize:getComputedStyle(document.body).fontSize,
            bodyFamily:getComputedStyle(document.body).fontFamily,
            theme:document.body.classList.contains('hub-editorial'),
            leftBorder:getComputedStyle(first).borderLeftWidth,
            halo:css.boxShadow,
            cardTints:new Set(cards.map(e=>getComputedStyle(e).getPropertyValue('--tile-tint').trim())).size,
            cardCount:cards.length,
            infoWidth:info.getBoundingClientRect().width,
            searchHeight:document.querySelector('#search').getBoundingClientRect().height,
            noOverflow:document.documentElement.scrollWidth<=innerWidth+1,
            garden:!!document.querySelector('#githubGarden'),
            achievements:!!document.querySelector('#hubStarCounter'),
            nexo:!!document.querySelector('#nexoVisualOpenBtn'),
            profile:!!document.querySelector('#nucleoStyleDetails'),
            version:document.querySelector('meta[name="hub-version"]')?.content
          };
        }""")
        assert values["theme"] and values["bodySize"]=="19px" and "Roboto" in values["bodyFamily"],values
        assert values["leftBorder"]=="1px",values
        assert values["halo"]!="none",values
        assert values["cardCount"]==16 and values["cardTints"]>=12,values
        assert values["infoWidth"]>=52 and values["searchHeight"]>=52,values
        assert values["noOverflow"] and values["garden"] and values["achievements"] and values["nexo"] and values["profile"],values
        assert values["version"]==json.loads((workspace/"adrian-hub/versions.json").read_text(encoding="utf-8"))["hub"]["version"],values
        details=page.locator("#nucleoStyleDetails")
        details.locator("summary").click()
        assert details.evaluate("(el)=>el.open")
        assert "19 px" in details.inner_text() and "v1.1" in details.inner_text()
        details.locator("summary").click()
        page.locator('.app[data-id="english"] .app-info').click()
        assert page.locator("#appInfoDialog").evaluate("(el)=>el.open")
        assert "Grammar Quest" in page.locator("#appInfoTitle").inner_text()
        page.locator("#appInfoClose").click()
        page.locator("#search").fill("Cambridge")
        assert page.locator(".app").count()>0
        page.locator("#search").fill("")
        assert page.locator(".app").count()==16
        page.locator(".version-row").first.wait_for(timeout=14000)
        page.locator(".version-row").first.click()
        assert page.locator("#versionDialog").evaluate("(el)=>el.open")
        page.locator("#versionDialogClose").click()
        assert not errors,errors
        if w==390:
            page.screenshot(path=str(workspace/"adrian-hub"/"tests"/"editorial-luminous-mobile-390.png"),full_page=True)
        print(f"PASS Luminous {w}x{h}: {values['cardCount']} tarjetas, halo, estilo, Nexo, dialogos, versiones; sin overflow ni errores")
        context.close()
    browser.close()
