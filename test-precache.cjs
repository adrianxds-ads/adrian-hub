'use strict';const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const w=path.dirname(__dirname);for(const n of ['adrian-hub','adaptive-english','adaptive-exam','adaptive-hoti0108','adaptive-phrasal-verbs','adaptive-pizarras','adaptive-verbs-catala','b2-multiple-choice-cloze']){
 const src=fs.readFileSync(path.join(w,n,'service-worker.js'),'utf8'),ctx={self:{AdrianRelease:{build:'test'},addEventListener(){}},importScripts(){}};vm.createContext(ctx);vm.runInContext(src,ctx);
 const list=vm.runInContext("typeof ASSETS!=='undefined'?ASSETS:SHELL",ctx);const missing=list.filter(u=>{const clean=u.split('?')[0],p=clean.startsWith('/')?path.join(w,clean):path.join(w,n,clean);return !fs.existsSync(p);});
 console.log(n+': '+list.length+' assets; missing='+JSON.stringify(missing));
}