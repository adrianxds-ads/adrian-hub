/* Hub Immersive v1 · original app origin, caches and progress are left untouched. */
(() => {
  'use strict';
  const layer=document.getElementById('immersiveLayer');
  const frame=document.getElementById('immersiveFrame');
  const returnButton=document.getElementById('immersiveReturn');
  const errorBox=document.getElementById('immersiveError');
  const externalLink=document.getElementById('immersiveExternal');
  const shell=document.querySelector('main.shell');
  if(!layer||!frame||!returnButton||!errorBox||!externalLink||!shell)return;

  const allowedKinds=new Set(['pwa-study','pwa-exam']);
  let active=null, lastTrigger=null, historyToken=null, loaded=false;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches ||
    matchMedia('(display-mode: fullscreen)').matches || navigator.standalone===true;
  const eligible=app=>{
    if(!app||!allowedKinds.has(app.kind))return false;
    try{
      const url=new URL(app.url,location.href);
      return url.origin===location.origin && url.protocol==='https:';
    }catch{return false;}
  };
  const hideError=()=>{errorBox.hidden=true;layer.classList.remove('keyboard-active');};
  const close=()=>{
    if(!active)return;
    active=null;
    layer.hidden=true;
    shell.inert=false;
    document.body.classList.remove('immersive-active');
    frame.src='about:blank';
    hideError();
    const focusTarget=lastTrigger;lastTrigger=null;historyToken=null;
    if(focusTarget?.isConnected)focusTarget.focus({preventScroll:true});
  };
  function open(app,source){
    if(!standalone()||!eligible(app))return false;
    if(active)close();
    const url=launchUrl(app);
    document.querySelector('#appInfoDialog')?.close();
    active=app.id;lastTrigger=source;loaded=false;
    externalLink.href=url;
    errorBox.hidden=true;
    layer.classList.remove('keyboard-active');
    frame.title=app.name+' · Hub';
    layer.hidden=false;
    shell.inert=true;
    document.body.classList.add('immersive-active');
    historyToken=Date.now()+'-'+app.id;
    history.pushState({hubImmersive:historyToken},'',location.href);
    frame.src=url;
    returnButton.focus({preventScroll:true});
    const token=historyToken;
    setTimeout(()=>{if(active===app.id&&historyToken===token&&!loaded)errorBox.hidden=false;},14000);
    return true;
  }
  returnButton.addEventListener('click',()=>{
    if(!active)return;
    const token=historyToken;
    close(); // Always exit immediately, even after navigation inside the iframe.
    if(history.state?.hubImmersive===token)history.back();
  });
  window.addEventListener('popstate',()=>{if(active)close();});
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const anchor=event.target.closest?.('a.app-launch, a#appInfoOpen');
    if(!anchor||anchor.target==='_blank'||anchor.hasAttribute('download'))return;
    const id=anchor.closest('[data-id]')?.dataset.id ||
      (anchor.id==='appInfoOpen'?registry.find(a=>launchUrl(a)===anchor.href)?.id:null);
    const app=registry.find(a=>a.id===id);
    if(!app||!standalone()||!eligible(app))return;
    event.preventDefault();
    open(app,anchor);
  },true);
  frame.addEventListener('load',()=>{
    if(!active)return;
    loaded=true;
    try{
      const doc=frame.contentDocument;
      if(!doc||doc.title?.includes('404')||doc.location.protocol==='chrome-error:'){
        errorBox.hidden=false;return;
      }
      errorBox.hidden=true;
      const updateFocus=()=>{
        const el=doc.activeElement;
        layer.classList.toggle('keyboard-active',!!el?.matches?.('input, textarea, [contenteditable="true"]'));
      };
      doc.addEventListener('focusin',updateFocus);
      doc.addEventListener('focusout',()=>setTimeout(updateFocus,70));
      updateFocus();
    }catch{errorBox.hidden=false;}
  });
  window.HubImmersive={isOpen:()=>!!active,close};
})();
