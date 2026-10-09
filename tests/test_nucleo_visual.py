from pathlib import Path
import mimetypes
from urllib.parse import urlparse, unquote
from playwright.sync_api import sync_playwright
workspace = Path(__file__).resolve().parents[2]
def serve(route):
    u = urlparse(route.request.url)
    if u.hostname != "adrianxds-ads.github.io":
        route.abort()
        return
    file = workspace / unquote(u.path).lstrip("/")
    if file.is_dir():
        file = file / "index.html"
    if not file.is_file():
        route.fulfill(status=404, body="not found")
        return
    route.fulfill(status=200, body=file.read_bytes(), content_type=mimetypes.guess_type(str(file))[0] or "application/octet-stream")
with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    for width, height in [(360, 780), (390, 844), (412, 915), (1280, 800)]:
        context = browser.new_context(viewport={"width": width, "height": height}, service_workers="block")
        context.route("**/*", serve)
        page = context.new_page()
        page.goto("https://adrianxds-ads.github.io/adrian-hub/", wait_until="domcontentloaded")
        page.locator(".app-info").first.wait_for(timeout=12000)
        font = page.evaluate("getComputedStyle(document.body).fontSize")
        small = page.locator(".app-copy small").first.evaluate("(x)=>getComputedStyle(x).fontSize")
        overflow = page.evaluate("document.documentElement.scrollWidth>innerWidth+1")
        page.locator(".app-info").first.click()
        bg = page.locator("#appInfoDialog").evaluate("(x)=>getComputedStyle(x).backgroundColor")
        assert (font, small, overflow, bg) == ("19px", "16px", False, "rgb(234, 240, 245)"), (width, font, small, overflow, bg)
        context.close()
        print("PASS Nucleo Visual", width, height)
    browser.close()
