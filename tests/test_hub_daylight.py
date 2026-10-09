"""Aceptación aislada del tema claro del Hub. No toca almacenamiento del usuario."""
from pathlib import Path
from urllib.parse import urlparse, unquote
from playwright.sync_api import sync_playwright
import mimetypes
root=Path(__file__).resolve().parents[2]
def serve(route):
    u=urlparse(route.request.url)
    if u.hostname != "adrianxds-ads.github.io":
        route.abort()
        return
    file=root / unquote(u.path).lstrip("/")
    if file.is_dir(): file=file/"index.html"
    if not file.is_file():
        route.fulfill(status=404,body="fixture not found")
        return
    route.fulfill(status=200,body=file.read_bytes(),content_type=mimetypes.guess_type(str(file))[0] or "application/octet-stream")

with sync_playwright() as p:
    browser=p.chromium.launch(channel="chrome",headless=True)
    for width,height in [(360,780),(390,844),(412,915),(1280,800)]:
        ctx=browser.new_context(viewport={"width":width,"height":height},service_workers="block")
        ctx.route("**/*",serve)
        page=ctx.new_page()
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.goto("https://adrianxds-ads.github.io/adrian-hub/",wait_until="domcontentloaded")
        page.locator(".app").first.wait_for(timeout=12000)
        visible=page.evaluate("""() => ({
          background:getComputedStyle(document.body).backgroundColor,
          color:getComputedStyle(document.body).color,
          family:getComputedStyle(document.body).fontFamily,
          fontsize:getComputedStyle(document.body).fontSize,
          secondary:getComputedStyle(document.querySelector('.app-copy small')).fontSize,
          cards:[...document.querySelectorAll('.app')].map(e=>({
            id:e.dataset.id, tint:getComputedStyle(e).getPropertyValue('--tile-tint').trim(),
            name:getComputedStyle(e.querySelector('strong')).color,
            height:e.getBoundingClientRect().height
          })),
          pageWidth:document.documentElement.scrollWidth, viewport:innerWidth,
          garden:!!document.querySelector('#githubGarden'),
          medals:!!document.querySelector('#hubStarCounter')
        })""")
        assert visible['color']=="rgb(37, 40, 44)",visible
        assert visible['fontsize']=="19px",visible
        assert "Roboto" in visible['family'],visible
        assert visible['secondary']=="16px",visible
        assert len(visible["cards"])>=15,visible
        assert len(set(c['tint'] for c in visible['cards']))>=12,visible
        assert all(c['height']>=90 for c in visible["cards"]),visible
        assert visible['pageWidth']<=width+1,visible
        assert visible['garden'] and visible['medals'],visible
        page.locator('.app[data-id="english"] .app-info').click()
        assert page.locator("#appInfoDialog").evaluate("(x)=>x.open")
        assert "Grammar Quest" in page.locator("#appInfoTitle").inner_text()
        assert page.locator("#appInfoDialog").evaluate("(x)=>getComputedStyle(x).backgroundColor")=="rgb(234, 240, 245)"
        page.locator("#appInfoClose").click()
        page.locator("#search").fill("Cambridge")
        assert page.locator(".app").count()>=1
        page.locator("#search").fill("")
        assert page.locator(".app").count()>=15
        page.locator(".version-row").first.wait_for(timeout=12000)
        page.locator(".version-row").first.click()
        assert page.locator("#versionDialog").evaluate("(x)=>x.open")
        page.locator("#versionDialogClose").click()
        assert not errors,errors
        if width==390: page.screenshot(path=str(root / "_hub_daylight_preview_390.png"),full_page=True)
        ctx.close()
        print(f"PASS Daylight {width}x{height}: bright, 19px, {len(visible['cards'])} cards, search/dialog/version/garden/medals; zero JS errors")
    browser.close()
