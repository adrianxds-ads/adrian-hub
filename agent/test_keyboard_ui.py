import argparse,json,subprocess,traceback
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument("--root",required=True);a=p.parse_args()
root=Path(a.root)
r=subprocess.run(["node","--check",str(root/"app.js")],capture_output=True,text=True)
assert r.returncode==0,r.stderr
with sync_playwright() as pw:
    b=pw.chromium.launch(channel="chrome",headless=True)
    for width,height in [(360,740),(390,844),(412,915),(1280,900)]:
        c=b.new_context(viewport={"width":width,"height":height},service_workers="block")
        page=c.new_page();errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
        def route(req):
            path=urlparse(req.request.url).path
            prefix="/adaptive-keyword-speaking/"
            if not path.startswith(prefix):req.abort();return
            rel=path[len(prefix):] or "index.html"
            f=(root/rel).resolve()
            if not f.is_relative_to(root.resolve()) or not f.is_file():req.abort();return
            req.fulfill(body=f.read_bytes(),content_type={".js":"application/javascript",".html":"text/html",".json":"application/json",".css":"text/css"}.get(f.suffix,"application/octet-stream"))
        page.route("**/*",route)
        page.goto("https://adrianxds-ads.github.io/adaptive-keyword-speaking/",wait_until="load")
        page.locator('[data-sec="0"]').click();page.locator("#startBtn").click()
        assert page.evaluate("QUESTIONS.length")>15
        full=page.evaluate("[current().secondBefore,expectedVariants(current())[0],current().secondAfter].join(' ')")
        page.locator("#answer").fill(full)
        page.locator("#answer").dispatch_event("compositionstart")
        page.locator("#answer").dispatch_event("compositionend")
        assert page.locator("#answer").input_value()==full,"IME completion rewrote text"
        page.locator("#answer").dispatch_event("compositionstart")
        page.locator("#answer").dispatch_event("keydown",{"key":"Enter","isComposing":True,"keyCode":229})
        assert page.evaluate("session.results.length")==0,"Enter during composition submitted answer"
        page.locator("#answer").dispatch_event("compositionend")
        assert page.locator("#answer").input_value()==full
        page.locator("#checkBtn").click()
        assert page.evaluate("session.results[0].points")==2
        page.locator("#nextBtn").click()
        assert page.evaluate("window.scrollY")<100,"Next question left page scrolled down"
        assert page.locator("#answer").evaluate("(e)=>e.tagName")=="TEXTAREA","Single-line answer clips full sentences"
        # Simulate small usable viewport. This is not a real Gboard test.
        if width<600:
            page.set_viewport_size({"width":width,"height":420})
            page.locator("#answer").click();page.wait_for_timeout(350)
            rect=page.locator("#answer").bounding_box()
            assert rect and rect["y"]>=0 and rect["y"]+rect["height"]<=422,("Answer obscured",rect)
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth+1")
            page.screenshot(path=str(root.parent/("keyboard-opus-"+str(width)+"-typing.png")))
            page.set_viewport_size({"width":width,"height":height})
        # All canonical gap answers and full sentences remain correctly extracted.
        bad=page.evaluate("""()=>QUESTIONS.flatMap(q=>expectedVariants(q).flatMap(v=>{
          const f=[q.secondBefore,v,q.secondAfter].join(' '),x=parseFullSentence(f,q);
          return scoreTransformation(v,q).points!==2||!x.full||scoreTransformation(x.gap,q).points!==2?[q._qid]:[];
        }))""")
        assert not bad,("Bank regression",bad[:10])
        # Complete remaining 14 questions, save once and survive reload.
        for i in range(14):
            value=page.evaluate("expectedVariants(current())[0]")
            page.locator("#answer").fill(value);page.locator("#checkBtn").click();page.locator("#nextBtn").click()
        saved=page.evaluate("JSON.parse(localStorage.getItem(STATS_KEY))")
        assert len(saved["sessions"])==1 and saved["sessions"][0]["correct"]==30
        page.reload(wait_until="load")
        assert page.evaluate("JSON.parse(localStorage.getItem(STATS_KEY)).sessions.length")==1
        assert not errors,errors
        print("PASS",width,"composition/Enter, reduced viewport, bank, 15 transitions, persistence, console",flush=True)
        c.close()
    b.close()
print("ALL PASS")
