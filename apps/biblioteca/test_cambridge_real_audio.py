"""One-shot genuine HTMLAudioElement probe with private Cambridge MP3 loaded into IndexedDB.
No fake media playback methods; verifies actual browser codec and metadata via blob URL.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
file=Path.home()/'My Drive'/'Inglés B2'/'B2 Inglés · Exámenes'/'00 · ÍNDICE'/'Audiolibro Cambridge B2'/'01_EXAMEN01_PARTES1-4_CONTINUO_FOLA.mp3'
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 context=browser.new_context()
 page=context.new_page()
 errors=[]
 page.on('pageerror',lambda err:errors.append(str(err)))
 page.goto('http://127.0.0.1:19543/apps/biblioteca/?lang=en')
 page.locator('#episodes .episode').first.wait_for(timeout=20000)
 page.locator('#cambridgeFiles').set_input_files(str(file))
 page.wait_for_function("!document.querySelector('[data-play=\"1\"]').disabled",timeout=30000)
 result=page.evaluate("""async()=>{
   const audio=document.getElementById('audio');
   audio.preload='metadata';
   audio.src=document.querySelector('[data-play="1"]').closest('article')?window.CambridgeAudio && (()=>{
     document.querySelector('[data-play="1"]').click();
     return audio.src;
   })():null;
   if(audio.readyState<1)await new Promise((resolve,reject)=>{
      audio.addEventListener('loadedmetadata',resolve,{once:true});
      audio.addEventListener('error',()=>reject(new Error('HTML5 decoder error '+audio.error?.code)),{once:true});
      setTimeout(()=>reject(new Error('Metadata timeout')),20000);
   });
   return {duration:audio.duration,readyState:audio.readyState,source:audio.currentSrc,codec:audio.canPlayType('audio/mpeg')};
}""")
 print('REAL_AUDIO_DECODE',result,flush=True)
 assert result['source'].startswith('blob:'),result
 assert 1180<result['duration']<1260,result
 assert result['readyState']>=1,result
 assert not errors,errors
 print('REAL_MP3_HTML5_DECODER_PASSED',flush=True)
 context.close();browser.close()
