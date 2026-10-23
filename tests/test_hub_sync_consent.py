"""Opt-in private sync UX; isolated browser, no real service or user progress."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[2]
class SilentHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

handler = partial(SilentHandler, directory=str(root))
server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
host = f"http://127.0.0.1:{server.server_port}"
endpoint = "https://adrin.tail8fd071.ts.net/hub-sync"
results = []

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        for width in (390, 1280):
            context = browser.new_context(
                viewport={"width": width, "height": 844},
                is_mobile=width == 390,
                has_touch=width == 390,
                service_workers="block",
            )
            health_calls = []
            def intercept(route):
                url = route.request.url
                if url.startswith(endpoint):
                    if url.startswith(endpoint + "/health"):
                        health_calls.append(url)
                        route.fulfill(
                            status=200,
                            content_type="application/json",
                            headers={"Access-Control-Allow-Origin": "*"},
                            body=json.dumps({"ok": True, "service": "adrian-hub-sync", "version": "1.0.8"}),
                        )
                    elif "/changes?" in url:
                        route.fulfill(
                            status=200,
                            content_type="application/json",
                            headers={"Access-Control-Allow-Origin": "*"},
                            body=json.dumps({"ok": True, "revision": 1087, "entries": {}}),
                        )
                    elif url.endswith("/sync"):
                        route.fulfill(status=200, content_type="application/json",
                            headers={"Access-Control-Allow-Origin": "*"},
                            body=json.dumps({"ok": True, "revision": 1087,
                                "acceptedKeys": [], "mergedKeys": [], "conflictKeys": []}))
                    else:
                        route.abort()
                elif not url.startswith(host):
                    route.abort()
                else:
                    route.continue_()
            context.route("**/*", intercept)
            page = context.new_page()
            exceptions = []
            page.on("pageerror", lambda err: exceptions.append(str(err)))
            response = page.goto(host + "/adrian-hub/", wait_until="domcontentloaded", timeout=15000)
            assert response.status == 200
            page.locator("#hubSettingsOpen").click()
            button = page.locator("#hubSyncConnect")
            assert button.is_visible() and button.is_enabled()
            assert not health_calls, "Health probe must never run before explicit click"
            button.click()
            page.wait_for_function("""() => document.querySelector('#hubSyncAccessStatus')?.textContent.includes('conectada')""", timeout=12000)
            assert len(health_calls) == 1, health_calls
            assert button.is_enabled()
            assert not exceptions, exceptions
            results.append(f"PASS {width}px: opt-in click, mocked health, protected sync status, no JS exceptions")
            context.close()
        # Rejected access remains a visible, recoverable state (no automatic grant).
        context = browser.new_context(service_workers="block", viewport={"width": 390, "height": 844})
        def deny_private(route):
            if route.request.url.startswith(endpoint):
                route.abort()
            elif route.request.url.startswith(host):
                route.continue_()
            else:
                route.abort()
        context.route("**/*", deny_private)
        page = context.new_page()
        page.goto(host + "/adrian-hub/", wait_until="domcontentloaded", timeout=15000)
        page.locator("#hubSettingsOpen").click()
        page.locator("#hubSyncConnect").click()
        page.wait_for_function("""() => {
            const t = document.querySelector('#hubSyncAccessStatus')?.textContent || '';
            return t.includes('No se pudo conectar') || t.includes('Acceso bloqueado');
        }""", timeout=12000)
        assert page.locator("#hubSyncConnect").is_enabled()
        results.append("PASS 390px: permission/network rejection keeps control usable")
        context.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
print("\n".join(results))
