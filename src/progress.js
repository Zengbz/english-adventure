(() => {
  const KEY=EnglishCore.DAY_KEY;
  function read(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&v.schema===1&&v.days&&Array.isArray(v.dates))return v;}catch(_){}return {schema:1,days:{},dates:[],xp:0,customContext:''};}
  let state=read();
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  function day(id){return state.days[id]||(state.days[id]={answers:{},completed:false,score:null});}
  function answer(id,qid,correct){const d=day(id);if(!(qid in d.answers)){d.answers[qid]={correct,at:new Date().toISOString()};state.xp+=correct?10:2;}save();}
  function complete(id,total){const d=day(id);const correct=Object.values(d.answers).filter(x=>x.correct).length;d.completed=true;d.score=total?Math.round(correct/total*100):0;const date=new Date().toLocaleDateString('en-CA');if(!state.dates.includes(date))state.dates.push(date);save();return d.score;}
  function streak(){const dates=new Set(state.dates);let cursor=new Date();let key=d=>d.toLocaleDateString('en-CA');if(!dates.has(key(cursor)))cursor.setDate(cursor.getDate()-1);let n=0;while(dates.has(key(cursor))){n++;cursor.setDate(cursor.getDate()-1);}return n;}
  function exportData(){return JSON.stringify(state,null,2);}
  window.EnglishProgress={state,day,answer,complete,streak,save,exportData};
})();
