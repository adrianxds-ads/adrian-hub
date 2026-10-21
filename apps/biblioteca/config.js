// One implementation, two independent podcast libraries. Catalan keys remain byte-for-byte stable.
(() => {
  'use strict';
  const english=new URLSearchParams(location.search).get('lang')==='en';
  const ca={
    isEnglish:false, lang:'ca', locale:'ca-ES', catalog:'./easy-catalan.json',
    STORE:'adrianLibraryEasyCatalanV1',
    POS:'adrianLibraryEasyCatalanPositionsV1',
    NORMAL_PLAYS:'adrianEasyCatalanNormalPlaysV1',
    TASK_PLAYS:'adrianEasyCatalanTaskSessionsV1',
    TASK_LIVE:'adrianEasyCatalanTaskLiveV1',
    title:'Català Podcasts', subtitle:'EASY CATALAN · BIBLIOTECA', tagline:'Obrir, escoltar, marcar. Res més.'
  };
  const en={
    isEnglish:true, lang:'en', locale:'en-GB', catalog:'./cambridge-exams.json',
    STORE:'adrianLibraryCambridgeAudiobooksV1',
    POS:'adrianLibraryCambridgeAudiobooksPositionsV1',
    NORMAL_PLAYS:'adrianCambridgeNormalPlaysV1',
    TASK_PLAYS:'adrianCambridgeTaskSessionsV1',
    TASK_LIVE:'adrianCambridgeTaskLiveV1',
    title:'Podcasts Inglés', subtitle:'CAMBRIDGE B2 · NUESTROS AUDIOLIBROS', tagline:'Exámenes narrados con Google AI Studio · Escucha y modo tarea.'
  };
  const cfg=Object.freeze(english?en:ca);
  window.PodcastLibraryConfig=cfg;
  if(!english)return; // Original Catalan texts, markup and data are left untouched.
  document.documentElement.lang='en';
  document.title='Podcasts Inglés · Cambridge B2';
  document.addEventListener('DOMContentLoaded',()=>{
    const text=(selector,value)=>{const x=document.querySelector(selector);if(x)x.textContent=value};
    text('.podcast-head .eyebrow',cfg.subtitle);
    text('.podcast-head h1',cfg.title);
    text('.podcast-head .tagline',cfg.tagline);
    const progress=document.querySelector('.progress-line span');
    if(progress?.firstChild)progress.firstChild.textContent=' escuchados de '; // Keep #totalCount mounted.
    text('.task-list-caption','Elige un audiolibro Cambridge B2 para acompañar tus tareas.');
    text('#empty','Todavía no hay exámenes incorporados.');
    text('#taskEmpty','Todavía no hay exámenes incorporados.');
    text('.searchbox span','BUSCAR');
    text('.sort-btn span','ORDEN');
    text('#taskSetupPosition','MODO TAREA · EXAMEN SELECCIONADO');
    text('.task-mode-intro b','Un audiolibro. Una tarea. Hasta la meta.');
    const search=document.getElementById('search');
    if(search)search.placeholder='Examen, voz o número…';
    const art=document.getElementById('artwork');
    if(art)art.alt='Cambridge B2 · Audiolibros de exámenes';
  });
})();
