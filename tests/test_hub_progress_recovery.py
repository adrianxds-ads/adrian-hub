"""Recovery regression: synthetic browser storage, no user state or real sync calls."""
import json,re
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
sync=(root/'adrian-core/components/adrian-sync.js').read_text(encoding='utf-8')
compress=(root/'adrian-hub/progress-storage.js').read_text(encoding='utf-8')
BASE='https://adrianxds-ads.github.io'
END='https://adrin.tail8fd071.ts.net/hub-sync'
large='A'*3000000
english=json.dumps(dict(level=501,sessions=445,totalAttempts=3350,sessionHistory=[{'total':15,'correct':15}]*3,padding=large),separators=(',',':'))
cloze=json.dumps(dict(level=135,sessions=110,totalAttempts=1659,sessionHistory=[{'total':15,'correct':15}]*2,padding='B'*1800000),separators=(',',':'))
remote={
'adaptive_english_campaign1_v1':english,
'adaptive_b2_cloze_campaign1_v1':cloze,
'adaptive_phrasal_verbs_v1':json.dumps(dict(level=54,sessions=53,answers=550,history=[{'score':15,'total':15}],padding='C'*750000)),
'pizarras_state_v1':json.dumps(dict(level=20,sessions=19,answers=492,history=[{'type':'quick'}])),
'adaptive_verbs_catala_campaign1_v1':json.dumps(dict(level=19,sessions=12,totalAttempts=180,sessionHistory=[])),
'adrian_hub_stars_v1':json.dumps(dict(version=3,apps={'english':4},stars=0,totalGold=4)),
'adaptive_english_global_level_v1':'501',
'b2_mcc_state_v1':json.dumps(dict(sessions=9,level=9,history=list(range(9)))),
'adrian_language_game_v1':json.dumps(dict(sessions=100,history=list(range(100)))),
}
entries={k:{'value':v,'deleted':False,'updatedAt':1791767172200,'revision':1087} for k,v in remote.items()}
assert len(english)>3000000 and len(cloze)>1800000
html='<html><head><script src="/test-progress-storage.js"></script><script src="/test-sync.js"></script></head><body><button id="recover">Recuperar</button><script>document.getElementById("recover").onclick=async()=>{window.result=await AdrianSync.recover()};</script></body></html>'
def run_test(browser,scenario):
    context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
    seen=[];post=[]
    seed="""(arg)=>{if(location.pathname!=='/test-restore')return;sessionStorage.setItem('adrian_sync_reload_v2','1');localStorage.setItem('adrian_sync_reconciled_102','1');localStorage.setItem('adrian_sync_baselines_107','1');localStorage.setItem('adrian_sync_meta_v1',JSON.stringify({revision:1087,times:{},baseRevisions:{adaptive_english_campaign1_v1:1055,adaptive_b2_cloze_campaign1_v1:1055},deviceId:'synthetic-qa'}));for(const [k,v]of Object.entries(arg))localStorage.setItem(k,v);}"""
    local={'adaptive_english_campaign1_v1':json.dumps({'level':42,'sessions':0,'totalAttempts':0}),
           'adaptive_b2_cloze_campaign1_v1':json.dumps({'level':0,'sessions':0,'totalAttempts':0}),
           'adaptive_phrasal_verbs_v1':json.dumps({'level':0,'sessions':0,'answers':0}),
           'pizarras_state_v1':json.dumps({'level':0,'sessions':0,'answers':0}),
           'adrian_hub_stars_v1':json.dumps({'version':3,'stars':0,'totalGold':0,'apps':{}}),
           'adaptive_english_global_level_v1':'42',
           'b2_mcc_state_v1':json.dumps({'sessions':0,'level':0,'history':[]}),
           'adrian_language_game_v1':json.dumps({'sessions':0,'history':[]}),
           'unrelated_private_setting':'ORIGINAL'}
    if scenario=='higher_local':local['adaptive_phrasal_verbs_v1']=json.dumps({'level':65,'sessions':66,'answers':650})
    context.add_init_script('('+seed+')('+json.dumps(local)+')')
    def router(route):
        url=route.request.url
        if url==BASE+'/test-restore':return route.fulfill(status=200,content_type='text/html',body=html)
        if url==BASE+'/test-progress-storage.js':return route.fulfill(status=200,content_type='application/javascript',body=compress)
        if url==BASE+'/test-sync.js':return route.fulfill(status=200,content_type='application/javascript',body=sync)
        if url.startswith(END+'/changes?'):
            since=int(parse_qs(urlparse(url).query)['since'][0]);seen.append(since)
            return route.fulfill(status=200,content_type='application/json',body=json.dumps({'revision':1087,'entries':entries if since==0 else {}},ensure_ascii=False))
        if url.startswith(END+'/sync'):
            post.append('UNEXPECTED POST')
            return route.fulfill(status=500,body='Unexpected post')
        return route.abort()
    context.route('**/*',router)
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'/test-restore',wait_until='load')
    page.wait_for_function('!!window.AdrianSync')
    page.wait_for_timeout(450)
    assert '1.0.9'==page.evaluate('AdrianSync.version')
    page.locator('#recover').click()
    page.wait_for_function('window.result !== undefined',timeout=20000)
    result=page.evaluate("""()=>{
      const read=k=>JSON.parse(localStorage.getItem(k));
      return { result:window.result,english:read('adaptive_english_campaign1_v1').level,
        cloze:read('adaptive_b2_cloze_campaign1_v1').level,
        catala:read('adaptive_verbs_catala_campaign1_v1').level,
        phrasal:read('adaptive_phrasal_verbs_v1').level,
        pizarras:read('pizarras_state_v1').level,
        gold:read('adrian_hub_stars_v1').totalGold,
        globalLevel:localStorage.getItem('adaptive_english_global_level_v1'),
        oldSessions:read('b2_mcc_state_v1').sessions,
        langSessions:read('adrian_language_game_v1').sessions,
        setting:localStorage.getItem('unrelated_private_setting'),
        recoveryKeys:Object.keys(localStorage).filter(k=>k.includes('_recovery_')).length,
        meta:JSON.parse(localStorage.getItem('adrian_sync_meta_v1')).revision
      }
    }""")
    assert result['english']==501 and result['cloze']==135 and result['catala']==19,result
    assert result['phrasal']==(65 if scenario=='higher_local' else 54) and result['pizarras']==20,result
    assert result['gold']==4 and result['globalLevel']=='501',result
    assert result['oldSessions']==9 and result['langSessions']==100,result
    assert result['setting']=='ORIGINAL' and result['meta']==1087 and seen[-1]==0,result
    assert not post and not errors,(post,errors)
    print('RECOVERY_QA',scenario,json.dumps({'summary':{k:v for k,v in result.items() if k not in ('setting',)},'sinceRequests':seen,'posts':len(post),'jsErrors':errors}),flush=True)
    context.close()
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    run_test(browser,'reset_local')
    run_test(browser,'higher_local')
    browser.close()
