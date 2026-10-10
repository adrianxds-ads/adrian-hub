"""Visual regression for Barcelona garden's current WMO code vs hourly rain accumulation.
Run: python tests/test_garden_weather.py (Playwright + local Chrome installed).
Read-only: mocks weather; never writes personal progress or awards.
"""
import json
import pathlib
import threading
import urllib.parse
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

HOME=pathlib.Path(__file__).resolve().parents[2]
HUB=HOME/'adrian-hub'
CASES=[
    ('mainly clear despite 0.10 mm prior rainfall',1,28,.10,'clear',0,'☾'),
    ('partly cloudy',2,42,0,'partly',0,'☾'),
    ('cloudy',3,90,0,'clouds',0,'☁'),
    ('actual rain',61,90,.5,'rain',17,'☂'),
    ('actual snow',71,90,0,'snow',18,'❄'),
    ('actual thunderstorm',95,90,1,'storm',17,'⚡'),
]
class Silent(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

server=ThreadingHTTPServer(('127.0.0.1',0),partial(Silent,directory=str(HOME)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/adrian-hub/'
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--disable-web-security','--no-sandbox'])
        for label,code,cloud,rain,expected,flakes,icon in CASES:
            page=browser.new_page(viewport={'width':390,'height':844},service_workers='block')
            errors=[]
            page.on('pageerror',lambda error: errors.append(str(error)))
            def core(route):
                f=HOME/'adrian-core'/urllib.parse.urlparse(route.request.url).path.removeprefix('/adrian-core/')
                route.fulfill(path=str(f)) if f.is_file() else route.fulfill(status=404)
            page.route('**/adrian-core/**',core)
            weather={'current':{'time':'2026-10-10T22:00','temperature_2m':20.2,'cloud_cover':cloud,
                'weather_code':code,'precipitation':0 if code==1 else rain,
                'rain':rain,'snowfall':0,'is_day':0}}
            page.route('https://api.open-meteo.com/**',lambda route:route.fulfill(
                status=200,content_type='application/json',body=json.dumps(weather),
                headers={'access-control-allow-origin':'*'}))
            page.goto(base,wait_until='domcontentloaded',timeout=25000)
            page.wait_for_function("""state => document.querySelector('#githubGarden')?.dataset.nlWeather === state && document.querySelector('#githubGarden .nl-weather-chip')?.title.includes('22:00')""",arg=expected,timeout=22000)
            state=page.evaluate("""() => ({
                kind:document.querySelector('#githubGarden').dataset.nlWeather,
                drops:document.querySelectorAll('#githubGarden .nl-particles i').length,
                icon:document.querySelector('#githubGarden .nl-weather-chip').textContent,
                detail:document.querySelector('#githubGarden .nl-weather-chip').title,
                overflow:document.documentElement.scrollWidth>innerWidth,
                dinosaur:!!document.querySelector('#githubGarden .nl-dino')
            })""")
            assert state['kind']==expected,(label,state)
            assert state['drops']==flakes,(label,state)
            assert state['icon'].startswith(icon),(label,state)
            assert '22:00' in state['detail'],(label,state)
            assert state['dinosaur'] and not state['overflow'] and not errors,(label,state,errors)
            print('PASS',label,expected)
            page.close()
        browser.close()
finally:
    server.shutdown()
