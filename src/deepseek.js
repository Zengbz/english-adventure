(() => {
  // Deliberately memory-only. Never write this key to any browser storage.
  let sessionKey='';
  let model='deepseek-flash';
  const endpoint='https://api.deepseek.com/chat/completions';
  function configure(key,nextModel){sessionKey=String(key||'').trim();model=nextModel||'deepseek-flash';}
  function clear(){sessionKey='';}
  function isConfigured(){return Boolean(sessionKey);}
  async function request(kind,payload,{signal}={}){
    if(!sessionKey)throw new Error('请先在设置中输入 DeepSeek API Key。');
    const requestId='ea-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
    const prompt=await EnglishAIContracts.buildPrompt(kind,requestId);
    const messages=[{role:'system',content:prompt},{role:'user',content:JSON.stringify({request_id:requestId,...payload})}];
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${sessionKey}`},body:JSON.stringify({model,messages,response_format:{type:'json_object'},thinking:{type:'disabled'},stream:false,max_tokens:1800,temperature:0.3}),signal});
    if(!response.ok){let detail='';try{const e=await response.json();detail=e?.error?.message||'';}catch(_){}if(response.status===401)throw new Error('API Key无效或已失效。');if(response.status===402)throw new Error('DeepSeek账户余额不足或未开通服务。');if(response.status===429)throw new Error('请求过于频繁，请稍后再试。');throw new Error(`DeepSeek请求失败（HTTP ${response.status}）。${detail ? '请检查API账户状态和请求配置。' : ''}`);}
    const data=await response.json();const content=data?.choices?.[0]?.message?.content;if(!content||!content.trim())throw new Error('模型返回空内容，请重试。');let parsed;try{parsed=JSON.parse(content);}catch(_){throw new Error('模型返回的JSON无法解析。');}
    return {data:EnglishAIContracts.validate(kind,parsed,requestId),usage:data.usage||null,model:data.model||model,requestId};
  }
  async function test(key,nextModel){const previous=sessionKey,previousModel=model;configure(key,nextModel);try{await request('tutor',{learnerMessage:'Return a short A2 tutor greeting and one simple practice question.'});return true;}finally{sessionKey=previous;model=previousModel;}}
  window.DeepSeekAI={configure,clear,isConfigured,request,test,get model(){return model;}};
})();
