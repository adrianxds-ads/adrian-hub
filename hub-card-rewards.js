/* Adrián Hub — card medals and individual PWA update actions.
 * Presentation reads the EXISTING ledger/history; no new scores or reward storage.
 * Only known public PWAs have an individual update button. */
(() => {
  'use strict';
  const GAMES = new Set(['english','phrasal-verbs','pizarras','b2-cloze','cambridge','keyword-speaking','hoti0108']);
  const SCORE_LEVELS=[
    {id:'blue',symbol:'13',name:'Azul',target:'13/15'},
    {id:'violet',symbol:'14',name:'Violeta',target:'14/15'},
    {id:'gold',symbol:'15',name:'Oro',target:'15/15'}
  ];
  const root=document.getElementById('groups');
  if(!root)return;
  const statuses=new Map();
  let isUpdating=false,bulkUpdating=false;
  function sourceFor(id){
    const data={
      english:{key:'adaptive_english_campaign1_v1',pick:x=>(x.sessionHistory||[]).filter(r=>!r.mode||r.mode==='training')},
      'b2-cloze':{key:'adaptive_b2_cloze_campaign1_v1',pick:x=>(x.sessionHistory||[]).filter(r=>!r.mode||r.mode==='training')},
      'phrasal-verbs':{key:'adaptive_phrasal_verbs_v1',pick:x=>x.history||[]},
      pizarras:{key:'pizarras_state_v1',pick:x=>(x.history||[]).filter(r=>r.type==='quick'&&Number(r.questions)===15).map(r=>({correct:r.correct,total:15}))},
      hoti0108:{key:'adaptive_hoti0108_v1',pick:x=>(x.studyGame?.roundHistory||[]).filter(r=>Number(r.total)===15)},
      'keyword-speaking':{key:'keywordSpeakingStatsV1',pick:x=>x.sessions||[]}
    }[id];
    if(id==='cambridge'){
      const scores=window.AdrianAchievements?.cambridgeMedalCounts?.();
      return scores?{scores,known:true}:{scores:{blue:0,violet:0,gold:0},known:false};
    }
    if(!data)return{scores:{blue:0,violet:0,gold:0},known:false};
    const raw=localStorage.getItem(data.key);
    if(!raw)return{scores:{blue:0,violet:0,gold:0},known:false};
    try{
      const history=data.pick(JSON.parse(raw)||{});
      if(!Array.isArray(history))throw Error('Invalid history');
      return{scores:window.AdrianAchievements.countsFromHistory(history),known:true};
    }catch{
      return{scores:{blue:0,violet:0,gold:0},known:false};
    }
  }
  function createMedals(id,name){
    const host=document.createElement('div');
    host.className='hub-card-medals';
    host.dataset.medals=id;
    host.setAttribute('aria-label','Recompensas de '+name);
    return host;
  }
  function createUpdate(id,name){
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='hub-card-update';
    btn.dataset.updateApp=id;
    btn.setAttribute('aria-label','Comprobar y preparar actualización de '+name);
    btn.title='Comprobar y preparar la aplicación sin borrar progreso';
    const glyph=document.createElement('span');glyph.className='hub-card-update-icon';glyph.setAttribute('aria-hidden','true');glyph.textContent='↻';
    const label=document.createElement('span');label.className='hub-card-update-label';label.textContent='Actualizar';
    btn.append(glyph,label);
    return btn;
  }
  function ledger(){
    try{return window.AdrianAchievements?.starState?.()||{apps:{}};}catch{return{apps:{}};}
  }
  function refreshMedals(){
    const stars=ledger();
    for(const host of root.querySelectorAll('.hub-card-medals')){
      const id=host.dataset.medals,source=sourceFor(id),scores=source.scores;
      const ledgerGold=Math.max(0,Math.floor(Number(stars.apps?.[id])||0));
      const gold=Math.max(ledgerGold,Math.floor(Number(scores.gold)||0));
      const starCount=Math.floor(gold/5);
      const row=[];
      for(const level of SCORE_LEVELS){
        const known=level.id==='gold'||source.known;
        const value=level.id==='gold'?gold:Math.max(0,Math.floor(Number(scores[level.id])||0));
        const earned=value>0;
        const badge=document.createElement('span');
        badge.className='hub-medal hub-medal-'+level.id+(earned?' earned':' locked');
        badge.dataset.medal=level.id;
        badge.dataset.count=known?String(value):'unknown';
        badge.title=level.name+' ('+level.target+'): '+(known?value+' conseguidas':'historial no disponible en este navegador');
        badge.setAttribute('aria-label',badge.title);
        const emblem=document.createElement('span');emblem.className='hub-medal-emblem';emblem.setAttribute('aria-hidden','true');emblem.textContent=level.symbol;
        const count=document.createElement('span');count.className='hub-medal-count';count.textContent=known?String(value):'—';
        badge.append(emblem,count);row.push(badge);
      }
      const star=document.createElement('span');star.className='hub-medal hub-medal-star'+(starCount?' earned':' locked');
      star.dataset.medal='star';star.dataset.count=String(starCount);
      star.title=starCount+' estrellas: una por cada cinco oros de esta aplicación';
      star.setAttribute('aria-label',star.title);
      const emblem=document.createElement('span');emblem.className='hub-medal-emblem';emblem.setAttribute('aria-hidden','true');emblem.textContent='★';
      const count=document.createElement('span');count.className='hub-medal-count';count.textContent=String(starCount);
      star.append(emblem,count);row.push(star);
      host.replaceChildren(...row);
    }
  }
  function setStatus(id,label,state){
    statuses.set(id,{label,state});
    const btn=[...root.querySelectorAll('[data-update-app]')].find(b=>b.dataset.updateApp===id);
    if(!btn)return;
    btn.dataset.state=state;
    btn.querySelector('.hub-card-update-label').textContent=label;
    btn.title=state==='pending'?'Caché anterior detectada; pulsa para preparar la actualización':state==='prepared'?'Actualización preparada. Termina la sesión y reabre la app para activarla.':state==='unknown'?'No se ha podido verificar; puedes intentarlo de nuevo.':'Comprobar y preparar actualización sin borrar progreso';
    btn.setAttribute('aria-label',label+' · '+(registry.find(a=>a.id===id)?.name||id));
  }
  function verifiedStatus(id){
    const audit=typeof versionAudit==='object'?versionAudit[id]:null;
    if(!audit)return statuses.get(id)||null;
    // Keep the "prepared" result of an explicit tap until a new audited status.
    const cached=statuses.get(id);
    if(cached?.state==='prepared'&&audit.pending)return cached;
    if(audit.pending)return{label:'Pendiente',state:'pending'};
    if(!audit.ok)return{label:'Sin comprobar',state:'unknown'};
    if(audit.installed==='fresh')return{label:'Al día',state:'current'};
    return{label:'Actualizar',state:'idle'};
  }
  function installCards(){
    for(const card of root.querySelectorAll('.app[data-id]')){
      if(card.querySelector('.hub-card-foot'))continue;
      const id=card.dataset.id,app=registry.find(x=>x.id===id),entry=typeof versionFor==='function'?versionFor(id):null;
      if(!app||(!GAMES.has(id)&&entry?.kind!=='public'))continue;
      const foot=document.createElement('div');foot.className='hub-card-foot';
      if(GAMES.has(id))foot.appendChild(createMedals(id,app.name));
      if(entry?.kind==='public')foot.appendChild(createUpdate(id,app.name));
      card.appendChild(foot);
      if(entry?.kind==='public'){
        const st=verifiedStatus(id);
        if(st)setStatus(id,st.label,st.state);
      }
    }
    refreshMedals();
  }
  async function updateIndividual(id){
    if(isUpdating||bulkUpdating)return;
    const entry=typeof versionFor==='function'?versionFor(id):null;
    const btn=[...root.querySelectorAll('[data-update-app]')].find(b=>b.dataset.updateApp===id);
    if(!entry||entry.kind!=='public'||!btn||!window.AdrianVersionVerifier)return;
    isUpdating=true;btn.disabled=true;
    const bulk=document.getElementById('updateAllVersionsBtn'),check=document.getElementById('verifyVersionsBtn');
    if(bulk)bulk.disabled=true;
    if(check)check.disabled=true;
    setStatus(id,'Comprobando…','checking');
    try{
      const result=await window.AdrianVersionVerifier.verify(entry,{version:HUB_VERSION,build:HUB_BUILD});
      if(!result.ok){setStatus(id,'Sin comprobar','unknown');return;}
      setStatus(id,'Preparando…','checking');
      await updateOneApp(entry,String(Date.now()));
      setStatus(id,'Preparada','prepared');
      const detail=document.getElementById('versionStatus-'+id);
      if(detail){detail.textContent='ACTUALIZACIÓN PREPARADA';detail.className='version-status pending';}
    }catch(err){
      console.error('Hub individual update failed',id,err);
      setStatus(id,navigator.onLine?'Error':'Sin conexión','error');
    }finally{
      isUpdating=false;btn.disabled=false;
      if(bulk)bulk.disabled=false;
      if(check)check.disabled=false;
    }
  }
  window.addEventListener('hub:bulk-update-start',()=>{bulkUpdating=true;root.querySelectorAll('.hub-card-update').forEach(b=>b.disabled=true);});
  window.addEventListener('hub:bulk-update-finish',()=>{bulkUpdating=false;root.querySelectorAll('.hub-card-update').forEach(b=>b.disabled=false);});
  root.addEventListener('click',event=>{
    const btn=event.target.closest('[data-update-app]');
    if(!btn)return;
    event.preventDefault();event.stopPropagation();
    updateIndividual(btn.dataset.updateApp);
  });
  // Only direct children change when Hub render() replaces the catalog; this
  // deliberately ignores the badges we draw lower down (no observer loop).
  new MutationObserver(()=>installCards()).observe(root,{childList:true});
  window.addEventListener('hub:reward-summary-updated',refreshMedals);
  window.addEventListener('hub:version-audit',event=>{
    const id=event.detail?.id;
    if(id){const st=verifiedStatus(id);if(st)setStatus(id,st.label,st.state);}
  });
  window.addEventListener('hub:star-progress',refreshMedals);
  window.addEventListener('adrian-sync-updated',refreshMedals);
  window.addEventListener('pageshow',()=>{installCards();refreshMedals();});
  window.addEventListener('storage',event=>{
    if(['adrian_hub_stars_v1','adaptive_english_campaign1_v1','adaptive_phrasal_verbs_v1',
      'pizarras_state_v1','adaptive_b2_cloze_campaign1_v1','cambridgeB2ExerciseStatsV3',
      'keywordSpeakingStatsV1','adaptive_hoti0108_v1'].includes(event.key))refreshMedals();
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshMedals();});
  installCards();
})();
