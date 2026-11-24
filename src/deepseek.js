(() => {
  const storageKey='english-adventure.deepseek';
  const defaultModel='deepseek-flash';
  const endpoint='https://api.deepseek.com/chat/completions';
  let settings={key:'',model:defaultModel};

  function readSettings(){
    try{
      const saved=JSON.parse(localStorage.getItem(storageKey));
      return typeof saved?.key==='string' ? saved : null;
    }catch{return null;}
  }
  settings=readSettings()||settings;

  function configure(key,nextModel){
    const next={key:String(key||'').trim()||settings.key,model:nextModel||defaultModel};
    if(!next.key)throw new Error('Please enter an API Key.');
    localStorage.setItem(storageKey,JSON.stringify(next));
    settings=next;
  }
  function clear(){
    localStorage.removeItem(storageKey);
    settings={key:'',model:defaultModel};
  }
  window.addEventListener('storage',event=>{
    if(event.key!==null&&event.key!==storageKey)return;
    settings=readSettings()||{key:'',model:defaultModel};
  });

  async function request(kind,payload,options){
    return send(kind,payload,options,settings);
  }
  async function send(kind,payload,{signal}={}, {key:sessionKey,model}){
    if(!sessionKey)throw new Error('请先在设置中输入 DeepSeek API Key。');
    const requestId='ea-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
    const prompt=await EnglishAIContracts.buildPrompt(kind,requestId);
    const messages=[{role:'system',content:prompt},{role:'user',content:JSON.stringify({request_id:requestId,...payload})}];
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${sessionKey}`},body:JSON.stringify({model,messages,response_format:{type:'json_object'},thinking:{type:'disabled'},stream:false,max_tokens:1800,temperature:0.3}),signal});
    if(!response.ok){let detail='';try{const e=await response.json();detail=e?.error?.message||'';}catch(_){}if(response.status===401)throw new Error('API Key无效或已失效。');if(response.status===402)throw new Error('DeepSeek账户余额不足或未开通服务。');if(response.status===429)throw new Error('请求过于频繁，请稍后再试。');throw new Error(`DeepSeek请求失败（HTTP ${response.status}）。${detail ? '请检查API账户状态和请求配置。' : ''}`);}
    const data=await response.json();const content=data?.choices?.[0]?.message?.content;if(!content||!content.trim())throw new Error('模型返回空内容，请重试。');let parsed;try{parsed=JSON.parse(content);}catch(_){throw new Error('模型返回的JSON无法解析。');}
    return {data:EnglishAIContracts.validate(kind,parsed,requestId),usage:data.usage||null,model:data.model||model,requestId};
  }
  async function test(key,nextModel){
    await send('tutor',{learnerMessage:'Return a short A2 tutor greeting and one simple practice question.'},undefined,
      {key:String(key||'').trim()||settings.key,model:nextModel||settings.model});
    return true;
  }
  async function transcribe(audio){
    if(!settings.key)throw new Error('请先设置 DeepSeek API Key。');
    const form=new FormData();
    form.append('file',audio,audio.type.startsWith('audio/ogg')?'answer.ogg':'answer.wav');
    const response=await fetch('https://api.deepseek.com/v1/tools/asr',{
      method:'POST',headers:{Authorization:`Bearer ${settings.key}`},body:form
    });
    if(!response.ok)throw new Error(`DeepSeek 语音识别失败（HTTP ${response.status}）。`);
    const {text}=await response.json();
    if(typeof text!=='string'||!text.trim())throw new Error('DeepSeek 没有识别到可评分的内容。');
    return text.trim();
  }
  window.DeepSeekAI={configure,clear,transcribe,isConfigured:()=>Boolean(settings.key),request,test,get model(){return settings.model;}};
})();
