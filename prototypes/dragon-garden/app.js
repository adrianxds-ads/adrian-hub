/* Dragoncillo del Jardín · prototipo aislado 0.1.0.
   Solo interacción visual: nunca accede a localStorage, IndexedDB,
   al árbol de progreso, a las medallas, a la sincronización ni al Service Worker. */
(() => {
  'use strict';
  const scene = document.querySelector('#scene');
  const dragon = document.querySelector('#dragon');
  const egg = document.querySelector('#egg');
  const stageSelect = document.querySelector('#stageSelect');
  const bubble = document.querySelector('#bubble');
  const anchor = document.querySelector('#petAnchor');
  const weatherLabel = document.querySelector('#weatherLabel');
  const motionOk = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stages = ['Huevo', 'Recién nacido', 'Explorador', 'Aprendiz de vuelo', 'Guardián del bosque'];
  const scenes = {day:'Día tranquilo',night:'Noche en Barcelona',rain:'Lluvia imaginaria',wind:'Viento de prueba'};
  const phrases = {
    day:['¡Mira qué bonito está el bosque!','He visto crecer una hoja. No pienso decir cuál.','¿Damos un paseo?','Barcelona queda preciosa desde aquí.'],
    night:['Shhh… el bosque está descansando.','Estoy contando estrellas. Voy por cuatro.','Mi cueva tiene la mejor almohada del mundo.'],
    rain:['¿Has visto? ¡El agua hace cosquillas en las alas!','La cueva está calentita, por si acaso.','Aquí solo llueve porque estamos haciendo una prueba.'],
    wind:['¡Mis alas quieren salir de paseo!','Hay viento… ¡parezco una cometa!','Este flequillo se mueve solo.']
  };
  let taps = 0, bubbleTimer = null, currentMotion = null, actionTimer = null;
  let sleeping = false;

  function speech(message) {
    bubble.textContent = message;
    bubble.hidden = false;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { bubble.hidden = true; }, 3600);
  }
  function stopMove() {
    clearTimeout(actionTimer);
    if (currentMotion) { currentMotion.cancel(); currentMotion = null; }
    dragon.classList.remove('walking','winging','flying','happy');
  }
  function setSleep(value) {
    sleeping = value;
    dragon.classList.toggle('sleeping', sleeping);
    dragon.setAttribute('aria-label', sleeping ? 'Dragoncillo dormido. Toca para despertarlo.' : 'Tocar al dragoncillo para conversar');
  }
  function setStage(value) {
    const level = Math.max(0, Math.min(4, Number(value) || 0));
    stopMove(); setSleep(false);
    scene.dataset.stage = String(level);
    stageSelect.value = String(level);
    egg.hidden = level !== 0;
    dragon.hidden = level === 0;
    if (level === 0) {
      speech('Crac… Aquí dentro se está preparando un pequeño dragón.');
    } else {
      speech(level === 1 ? '¡Hola! Soy nuevo por aquí.' : level === 3 ? '¡Creo que pronto podré volar!' : level === 4 ? 'Vigilo nuestro bosque. Y a veces echo una siesta.' : '¡Ya puedo explorar un poco más!');
    }
  }
  function setWeather(kind) {
    if (!(kind in scenes)) return;
    scene.dataset.weather = kind;
    weatherLabel.textContent = 'Escena ilustrada · ' + scenes[kind];
    document.querySelectorAll('#weatherOptions [data-weather]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.weather === kind)));
    if (kind === 'night') { setSleep(true); speech('Buenas noches, Barcelona.'); }
    else if (sleeping) { setSleep(false); speech('¡Ya es hora de explorar!'); }
  }
  function animateFrames(frames,duration,done) {
    if (!motionOk || !dragon.animate) { actionTimer = setTimeout(done,450); return; }
    currentMotion = dragon.animate(frames,{duration,easing:'ease-in-out',fill:'none'});
    currentMotion.onfinish = () => { currentMotion = null; done(); };
  }
  function action(name) {
    const stage = Number(scene.dataset.stage);
    if (stage === 0 && name !== 'fly') { speech('Estoy dentro del huevo. ¡Todavía me falta un poquito!'); return; }
    if (name === 'fly' && stage < 3) {
      setStage(3); speech('¡Probemos cómo volaré cuando crezca!');
    }
    if (name === 'greet') {
      stopMove();
      if (sleeping) { setSleep(false); speech('¡Eh! No estaba dormido. Estaba pensando con los ojos cerrados.'); return; }
      const list = phrases[scene.dataset.weather] || phrases.day;
      speech(list[taps++ % list.length]);
      dragon.classList.add('happy');
      actionTimer = setTimeout(() => dragon.classList.remove('happy'),1000);
      return;
    }
    stopMove();
    if (name === 'sleep') {
      setSleep(true); speech('Voy a mi rincón favorito. Zzz…'); return;
    }
    setSleep(false);
    if (name === 'walk') {
      dragon.classList.add('walking');
      speech('Voy a inspeccionar ese rincón del bosque.');
      const d = Math.min(100, scene.clientWidth * .18);
      animateFrames([{transform:'translateX(0)'},{transform:'translateX('+d+'px) translateY(-6px)'},{transform:'translateX('+d+'px)'},{transform:'translateX(0)'}],4500,()=>dragon.classList.remove('walking'));
      return;
    }
    if (name === 'wing') {
      dragon.classList.add('winging');
      speech('¡Mira mis alitas! Estoy practicando.');
      actionTimer = setTimeout(() => dragon.classList.remove('winging'),2600);
      return;
    }
    if (name === 'fly') {
      dragon.classList.add('flying','happy');
      speech('¡Estoy volando! Pero luego vuelvo a casa.');
      animateFrames([{transform:'translateY(0) rotate(0deg)'},{transform:'translateY(-48px) rotate(-4deg)'},{transform:'translateY(-92px) translateX(30px) rotate(5deg)'},{transform:'translateY(-57px) translateX(-17px) rotate(-3deg)'},{transform:'translateY(0) rotate(0deg)'}],3900,()=>dragon.classList.remove('flying','happy'));
    }
  }
  document.querySelector('#actions').addEventListener('click',e => {
    const btn=e.target.closest('button[data-action]');
    if (btn) action(btn.dataset.action);
  });
  document.querySelector('#weatherOptions').addEventListener('click',e => {
    const btn=e.target.closest('button[data-weather]');
    if (btn) setWeather(btn.dataset.weather);
  });
  stageSelect.addEventListener('change',e => setStage(e.target.value));
  dragon.addEventListener('click',() => action('greet'));
  setInterval(() => {
    if (!sleeping && !dragon.hidden && !document.hidden && motionOk) {
      dragon.classList.add('blink');
      setTimeout(()=>dragon.classList.remove('blink'),150);
    }
  },5700);
  fetch('./dragon.svg?v=0.1.0',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('SVG '+r.status);return r.text();})
    .then(svg=>{
      const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
      if(doc.querySelector('parsererror') || !doc.querySelector('svg')) throw Error('Arte SVG no válido');
      dragon.replaceChildren(document.importNode(doc.documentElement,true));
      window.__dragonPrototypeReady = true;
    })
    .catch(err=>{
      console.error('No se pudo cargar el dragón:',err);
      dragon.textContent='🐉';
      dragon.classList.add('fallback');
      window.__dragonPrototypeReady = true;
    });
})();