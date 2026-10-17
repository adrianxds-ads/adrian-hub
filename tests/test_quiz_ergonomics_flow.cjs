'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
let now=0,next=0;const jobs=new Map(),classes=new Set(),stage={classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}};
const ctx={window:{},console,document:{getElementById:()=>stage},setTimeout:(fn,delay)=>{const id=++next;jobs.set(id,{fn,at:now+delay});return id},clearTimeout:id=>jobs.delete(id),setInterval(){}};
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../adrian-core/components/quiz-ergonomics.js'),'utf8'),ctx);
const Flow=ctx.window.QuizFlowController;
function advance(ms){const end=now+ms;while(true){const found=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!found)break;const [id,j]=found;now=j.at;jobs.delete(id);j.fn();}now=end;}
for(const [correct,delay] of [[true,850],[false,1850]]){
 const flow=new Flow();let count=0;flow.begin();flow.afterAnswer({correct,isCurrent:()=>true,advance:()=>{count++;flow.begin();}});
 advance(delay-1);assert.equal(count,0);advance(1);assert(classes.has('is-transitioning'));advance(149);assert.equal(count,0);advance(1);assert.equal(count,1);assert.equal(flow.pending.size,0);assert(!classes.has('is-transitioning'));advance(5000);assert.equal(count,1);
}
{
 const flow=new Flow();let count=0;flow.begin();flow.afterAnswer({correct:false,isCurrent:()=>true,advance:()=>count++});
 const stale=[...jobs.values()][0].fn;flow.cancel();stale();advance(5000);assert.equal(count,0);assert.equal(flow.pending.size,0);
}
{
 const flow=new Flow();let count=0,attempts=0,valid=true;flow.begin();
 flow.afterAnswer({correct:false,isCurrent:()=>valid,advance:()=>{count++;flow.begin();throw Error('injected');},retry:{isCurrent:()=>valid,render:()=>{attempts++;flow.begin();}}});
 advance(2000);assert.equal(count,1);advance(150);assert.equal(attempts,1);advance(5000);assert.equal(count,1);
}
console.log('PASS flow: 850/1850 ms holds + 150 ms transition, cancelled/stale callbacks, bounded retry and single advance');
