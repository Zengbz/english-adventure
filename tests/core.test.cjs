const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
test('week 1 package contains seven unique lessons and valid quiz IDs',()=>{const p=JSON.parse(fs.readFileSync(path.join(__dirname,'../courses/week1-course.json'),'utf8'));assert.equal(p.schemaVersion,1);assert.equal(p.lessons.length,7);const days=new Set(p.lessons.map(x=>x.id));assert.equal(days.size,7);const ids=p.lessons.flatMap(x=>x.quiz.map(q=>q.id));assert.equal(new Set(ids).size,ids.length);for(const l of p.lessons){assert.ok(l.listening.transcript);assert.ok(l.speaking.prompt);assert.ok(l.reading.text);assert.ok(l.writing.prompt);}});
test('every choice question answer exists in options',()=>{const p=JSON.parse(fs.readFileSync(path.join(__dirname,'../courses/week1-course.json'),'utf8'));for(const l of p.lessons)for(const q of [...l.quiz,...l.listening.questions,...l.reading.questions])assert.ok(q.options.includes(q.answer),q.id||q.q);});
test('AI settings survive reload, connection tests do not save keys, and clear removes settings',async()=>{
  const vm=require('node:vm');
  const src=fs.readFileSync(path.join(__dirname,'../src/deepseek.js'),'utf8');
  const storage=new Map();
  const sent=[];
  function load(){
    const ctx={
      window:{addEventListener(){}},
      localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
      EnglishAIContracts:{buildPrompt:async()=>'',validate:()=>({})},
      fetch:async(url,options)=>{
        sent.push(options.headers.Authorization);
        return {ok:true,json:async()=>({choices:[{message:{content:'{}'}}]})};
      }
    };
    vm.runInNewContext(src,ctx);
    return ctx.window.DeepSeekAI;
  }
  const ai=load();
  assert.equal(ai.isConfigured(),false);
  ai.configure('saved-key','deepseek-v4-pro');
  const reloaded=load();
  assert.equal(reloaded.model,'deepseek-v4-pro');
  await reloaded.test('temporary-key','deepseek-flash');
  await load().test('','deepseek-v4-pro');
  assert.deepEqual(sent,['Bearer temporary-key','Bearer saved-key']);
  reloaded.clear();
  assert.equal(reloaded.isConfigured(),false);
  assert.equal(load().isConfigured(),false);
});
test('roadmap defines the planned 12-week progression',()=>{const r=JSON.parse(fs.readFileSync(path.join(__dirname,'../courses/roadmap.json'),'utf8'));assert.equal(r.plannedWeeks.length,12);assert.equal(r.plannedWeeks[0].week,1);assert.equal(r.plannedWeeks[11].week,12);});
test('AI contract rejects missing and unexpected envelope fields',async()=>{const vm=require('node:vm');const src=fs.readFileSync(path.join(__dirname,'../src/ai-contracts.js'),'utf8');const ctx={window:{},fetch:async()=>({ok:false})};vm.runInNewContext(src,ctx);const api=ctx.window.EnglishAIContracts;const good={schema_version:'1.0',request_id:'r1',module:'tutor',status:'success',data:{reply_en:'Hello.',explanation_zh:'你好。',example:'How are you?',practice_question:'Say hello.',difficulty:'A2'},error:null};assert.equal(api.validate('tutor',good,'r1').difficulty,'A2');assert.throws(()=>api.validate('tutor',{...good,extra:'no'},'r1'));assert.throws(()=>api.validate('tutor',{...good,request_id:'wrong'},'r1'));});
