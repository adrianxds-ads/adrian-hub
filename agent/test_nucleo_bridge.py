"""Prueba de la conexión Núcleo en servidor aislado, sin tocar el servicio activo."""
import importlib.util
import json
import threading
import urllib.request

SOURCE = r"C:\Users\adria\Android-DC\dc_inbox_bridge.py"
spec = importlib.util.spec_from_file_location("bridge_nucleo_test", SOURCE)
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)
srv = bridge.ThreadingHTTPServer(("127.0.0.1", 18877), bridge.Handler)
worker = threading.Thread(target=srv.serve_forever, daemon=True)
worker.start()
base = "http://127.0.0.1:18877/dc-inbox/agents"
try:
    result = json.load(urllib.request.urlopen(base + "/nucleo/status", timeout=10))
    assert result["ok"] and result["agent"] == "nucleo"
    assert result["cost_usd"] == 0 and result["changes_applied"] == 0
    print("PASS Núcleo API: autodiagnóstico HTTP 200, 0 USD")
    training = json.load(urllib.request.urlopen(base + "/ui/training.json", timeout=5))
    assert any(a.get("id") == "nucleo" for a in training["agents"])
    print("PASS Formación API: perfil Núcleo publicado por el servicio aislado")
    html = urllib.request.urlopen(base + "/ui/", timeout=5).read().decode("utf-8")
    assert html.count('id="nucleoRefresh"') == 1
    assert html.count('<h2>Nexo</h2>') == 1 and '<h2>Núcleo</h2>' not in html and '<h2>El Triaje</h2>' not in html
    assert 'id="nexoChat"' in html and 'Agent Center · 1.2.0' in html
    print("PASS Interfaz API: tarjeta y versión Núcleo accesibles")
finally:
    srv.shutdown()
    srv.server_close()
