(() => {
  const $=id=>document.getElementById(id),app=$('app');let catalog,roadmap,weeks={},activeLesson=null,history=[];let contextSettings={profile:true,progress:true,history:true,customContext:''};
  const profile={nativeLanguage:'Chinese',currentLevel:'A2',targetLevel:'B1',goals:['travel','daily communication','international social interaction'],dailyMinutes:30,teachingStyle:'balanced'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function toast(s){$('toast').textContent=s;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),3500);}
  async function init(){try{catalog=await EnglishCore.loadCatalog();const rr=await fetch('./courses/roadmap.json',{cache:'no-store'});roadmap=rr.ok?await rr.json():{plannedWeeks:[]};renderHome();}catch(e){app.innerHTML=`<div class="panel"><h2>课程暂时无法加载</h2><p>${esc(e.message)}</p><button class="button secondary" onclick="location.reload()">Retry</button></div>`;}updateAIStatus();}
  function progressFor(week){const lessons=catalog.weeks.find(w=>w.week===week)?.lessons||[];const done=lessons.filter(l=>EnglishProgress.day(l.id).completed).length;return {done,total:lessons.length};}
  function renderHome(){ $('streak').textContent=`🔥 ${EnglishProgress.streak()} days`;const total=catalog.weeks.reduce((n,w)=>n+w.lessons.length,0);const done=Object.values(EnglishProgress.state.days).filter(d=>d.completed).length;const available=new Map(catalog.weeks.map(w=>[w.week,w]));const plan=(roadmap?.plannedWeeks||[]).map(p=>({...p,available:available.has(p.week),entry:available.get(p.week)}));for(const w of catalog.weeks)if(!plan.some(p=>p.week===w.week))plan.push({week:w.week,title:w.title,summary:w.summary,level:w.level,available:true,entry:w});plan.sort((a,b)=>a.week-b.week);app.innerHTML=`<section class="hero"><div><p class="eyebrow">YOUR ENGLISH JOURNEY</p><h1>Small steps.<br>Real conversations.</h1><p>每天30分钟，从A2走向B1。通过旅行、日常交流和国际社交，真正把英语用起来。</p><button class="button primary" id="continue">${done?'Continue learning':'Start learning'} ↗</button><span class="hero-note">12周课程框架 · 每周独立扩展 · AI教师可选</span></div><div class="hero-art"><div class="globe">🌍</div><div><strong>Speak to the world.</strong><br><small>Travel · People · Stories</small></div></div></section><section class="stats"><div class="stat"><b>${done}/${total}</b><span>Lessons completed</span></div><div class="stat"><b>${EnglishProgress.state.xp}</b><span>Total XP</span></div><div class="stat"><b>${EnglishProgress.streak()}</b><span>Day streak</span></div></section><div class="section-heading"><div><h2>Your learning path</h2><p>课程按周加载。添加新的 weekN-course.json 即可扩展。</p></div><span class="pill">A2 → B1</span></div><section id="week-grid" class="week-grid">${plan.map(w=>{const p=progressFor(w.week);return `<article class="week-card"><div class="week-meta"><span>WEEK ${String(w.week).padStart(2,'0')}</span><span class="pill ${w.available&&p.total&&p.done===p.total?'green':''}">${w.available?`${p.done}/${p.total} days`:'Planned'}</span></div><h3>${esc(w.title)}</h3><p>${esc(w.summary)}</p><div class="progress"><i style="width:${p.total?p.done/p.total*100:0}%"></i></div>${w.available?`<button class="button secondary open-week" data-week="${w.week}">Open week →</button>`:`<button class="button secondary" disabled>Coming soon</button>`}</article>`;}).join('')}</section>`;
    $('continue').onclick=async()=>{
      const entry=catalog.weeks.find(w=>w.lessons.some(l=>!EnglishProgress.day(l.id).completed))||catalog.weeks[0];
      try{
        const pack=await EnglishCore.loadWeek(entry);
        openLesson(pack.lessons.find(l=>!EnglishProgress.day(l.id).completed)||pack.lessons[0],pack.level);
      }catch(e){toast(e.message);}
    };document.querySelectorAll('.open-week').forEach(b=>b.onclick=()=>openWeek(Number(b.dataset.week)));}
  async function openWeek(n){try{const entry=catalog.weeks.find(w=>w.week===n);if(!entry)throw new Error('Week not found.');weeks[n]=await EnglishCore.loadWeek(entry);const pack=weeks[n];app.innerHTML=`<div class="lesson-head"><button class="back" id="home-back">← Learning path</button><span class="pill">${pack.level} · 7 lessons</span></div><section class="lesson-card"><p class="eyebrow">WEEK ${String(n).padStart(2,'0')}</p><h1>${esc(pack.title)}</h1><p>${esc(pack.summary)}</p><div class="week-grid">${pack.lessons.map(l=>{const d=EnglishProgress.day(l.id);return `<article class="week-card"><div class="week-meta"><span>DAY ${l.day}</span><span class="pill ${d.completed?'green':''}">${d.completed?'Completed':'30 min'}</span></div><h3>${esc(l.title)}</h3><p>${esc(l.subtitle)}</p><button class="button secondary open-day" data-day="${l.id}">${d.completed?'Review lesson':'Start lesson'} →</button></article>`;}).join('')}</div></section>`;$('home-back').onclick=renderHome;document.querySelectorAll('.open-day').forEach(b=>b.onclick=()=>openLesson(pack.lessons.find(l=>l.id===b.dataset.day),pack.level));}catch(e){toast(e.message);}}
  const speakerIcon='<svg class="speaker-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z"/><path class="speaker-wave" d="M15 9a4 4 0 0 1 0 6"/><path class="speaker-wave" d="M18 6a8 8 0 0 1 0 12"/></svg>';
  function practiceTasks(kind,base){
    const tasks=[base,...(base.practice||[])];
    return tasks.map((task,i)=>`<div class="task practice-task" data-index="${i}">
      <h3>${i+1}. ${esc(task.prompt)}</h3>
      ${task.sample?`<details><summary>Show sample answer</summary><p>${esc(task.sample)}</p></details>`:''}
      ${task.checklist?`<ul>${task.checklist.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:''}
      ${kind==='oral'?'<div class="button-row"><button type="button" class="button secondary record-answer">录音</button><button type="button" class="button secondary grade-audio" disabled>发送录音并评分</button></div><p class="record-status" role="status"></p>':
        `<textarea rows="3" aria-label="Writing answer ${i+1}" placeholder="Write your answer in English…"></textarea><button type="button" class="button secondary grade-writing">Ask AI to review writing</button>`}
      <div class="practice-feedback" aria-live="polite"></div>
    </div>`).join('');
  }
  function followUpQuestions(section,prefix){
    return section.questions.map((q,i)=>questionHTML(q,`${prefix}-extra-${i}`)).join('');
  }
  function openLesson(l,level){activeLesson=l;const d=EnglishProgress.day(l.id);const words=l.vocabulary.map(v=>`<div class="word"><button type="button" class="button secondary audio-button word-audio" data-audio="${esc(v.word)}" aria-label="Play ${esc(v.word)}">${speakerIcon}<b>${esc(v.word)}</b></button><span>${v.ipa?esc(v.ipa)+' · ':''}${esc(v.zh)}</span>${v.example?`<span><i>${esc(v.example)}</i></span>`:''}</div>`).join('');app.innerHTML=`<div class="lesson-head"><button class="back" id="week-back">← Back to week</button><span class="pill">DAY ${l.day} · ${l.minutes} MIN</span></div><section class="lesson-card"><p class="eyebrow">DAILY LESSON · ${esc(level)}</p><h1>${esc(l.title)}</h1><p>${esc(l.subtitle)}</p><h2>1. Vocabulary</h2><div class="word-grid">${words}</div><h2>2. Grammar focus</h2><ul>${l.grammar.map(g=>`<li>${esc(g)}</li>`).join('')}</ul><h2>3. Listening</h2><div class="task"><b>${esc(l.listening.title)}</b><button type="button" data-audio="${esc(l.listening.transcript)}" class="button secondary audio-button">${speakerIcon}<span>Play listening</span></button><details class="listening-transcript"><summary>Show transcript</summary><p>${esc(l.listening.transcript)}</p></details>${l.listening.questions.map((q,i)=>questionHTML(q,`listen-${i}`)).join('')}</div>${l.listening.followUp?`<div class="task"><b>${esc(l.listening.followUp.title)}</b><button type="button" data-audio="${esc(l.listening.followUp.transcript)}" class="button secondary audio-button">${speakerIcon}<span>Play announcement</span></button><details class="listening-transcript"><summary>Show transcript</summary><p>${esc(l.listening.followUp.transcript)}</p></details>${followUpQuestions(l.listening.followUp,'listen')}</div>`:''}<h2>4. Speaking</h2><p>录音只在点击评分后发送给 DeepSeek。评分依据转写内容。</p><section id="oral-practice">${practiceTasks('oral',l.speaking)}</section><details class="task"><summary>Practise a conversation with AI</summary><textarea id="conversation-answer" aria-label="Conversation reply" rows="2"></textarea><button type="button" id="conversation-send" class="button secondary">Send reply</button><div id="conversation-feedback" aria-live="polite"></div></details><h2>5. Reading</h2><div class="task"><b>${esc(l.reading.title)}</b><p>${esc(l.reading.text)}</p>${l.reading.questions.map((q,i)=>questionHTML(q,`read-${i}`)).join('')}</div>${l.reading.followUp?`<div class="task"><b>${esc(l.reading.followUp.title)}</b><p>${esc(l.reading.followUp.text)}</p>${followUpQuestions(l.reading.followUp,'read')}</div>`:''}<h2>6. Writing</h2><section id="writing-practice">${practiceTasks('writing',l.writing)}</section><h2>7. Daily quiz</h2>${l.quiz.map((q,i)=>questionHTML(q,q.id)).join('')}<div class="lesson-actions"><button class="button primary" id="finish-day">Complete lesson</button><button class="button secondary" id="ask-ai">Ask AI teacher</button></div><div class="ai-box"><h3>AI English Teacher</h3><p>可根据当前课程、学生档案和学习记录提供解释。需要先在设置中配置自己的 DeepSeek API Key。</p><textarea id="ai-question" rows="2" placeholder="Ask about a word, grammar point, or real-life situation…"></textarea><button id="send-ai" class="button secondary">Send to DeepSeek</button><div id="ai-answer"></div></div></section>`;
    const speech=window.speechSynthesis;
    let playback=null;
    function stopPlayback(){
      if(!playback)return;
      playback.button.classList.remove('is-playing');
      playback=null;
      speech.cancel();
    }
    for(const button of app.querySelectorAll('[data-audio]')){
      if(!speech||typeof SpeechSynthesisUtterance!=='function'){button.disabled=true;continue;}
      button.onclick=()=>{
        stopPlayback();
        const audio=new SpeechSynthesisUtterance(button.dataset.audio);
        const current={audio,button};
        playback=current;
        audio.lang='en-GB';
        audio.rate=level==='B1'?0.95:0.85;
        audio.onstart=()=>{
          if(playback===current)button.classList.add('is-playing');
        };
        audio.onend=()=>{
          if(playback!==current)return;
          playback=null;
          button.classList.remove('is-playing');
        };
        audio.onerror=event=>{
          if(playback!==current)return;
          audio.onend();
          if(!['interrupted','canceled'].includes(event.error))toast('Audio unavailable.');
        };
        speech.speak(audio);
      };
    }
    if(!speech||typeof SpeechSynthesisUtterance!=='function'){
      app.querySelectorAll('.listening-transcript').forEach(details=>details.open=true);
    }
    const oralTasks=[l.speaking,...(l.speaking.practice||[])];
    const stopRecording=EnglishRecording.bind($('oral-practice'),async(card,audio)=>{
      const transcript=await DeepSeekAI.transcribe(audio);
      if(!card.isConnected)return;
      const task=oralTasks[Number(card.dataset.index)];
      const out=card.querySelector('.practice-feedback');
      out.innerHTML=`<p><b>DeepSeek 转写</b> ${esc(transcript)}</p>`;
      const result=await DeepSeekAI.request('oral',{
        prompt:task.prompt,checklist:task.checklist||[],transcript,level
      });
      const d=result.data;
      out.insertAdjacentHTML('beforeend',`<div class="feedback"><b>完成度 ${d.completion}% · ${d.score}/100</b><p>${esc(d.feedback_zh)}</p><p>${esc(d.improved_en)}</p></div>`);
    },stopPlayback);
    $('conversation-send').onclick=()=>sendAI('speaking',{
      learnerMessage:$('conversation-answer').value.trim()||'Start a short practice conversation related to this lesson.',
      lesson:l
    },$('conversation-feedback'));
    const writingTasks=[l.writing,...(l.writing.practice||[])];
    for(const button of app.querySelectorAll('.grade-writing')){
      button.onclick=async()=>{
        const card=button.closest('.practice-task');
        const text=card.querySelector('textarea').value.trim();
        if(!text){toast('Please write your answer first.');return;}
        const task=writingTasks[Number(card.dataset.index)];
        button.disabled=true;
        try{await sendAI('writing',{text,prompt:task.prompt,checklist:task.checklist,lesson:l},card.querySelector('.practice-feedback'));}
        finally{button.disabled=false;}
      };
    }
    function leaveLesson(){
      stopPlayback();
      stopRecording();
    }
    $('week-back').onclick=()=>{
      leaveLesson();
      openWeek(Math.ceil(l.day/7));
    };
    document.querySelectorAll('.answer-option').forEach(b=>b.onclick=()=>chooseAnswer(l,b));$('finish-day').onclick=()=>{const required=[...l.quiz.map(q=>q.id),...l.listening.questions.map((q,i)=>`listen-${i}`),...l.reading.questions.map((q,i)=>`read-${i}`),...(l.listening.followUp?.questions||[]).map((q,i)=>`listen-extra-${i}`),...(l.reading.followUp?.questions||[]).map((q,i)=>`read-extra-${i}`)];const done=required.filter(id=>id in EnglishProgress.day(l.id).answers).length;if(done<required.length){toast(`Please answer all ${required.length} listening, reading and quiz questions first (${done}/${required.length}).`);return;}const score=EnglishProgress.complete(l.id,required.length);leaveLesson();toast(`Lesson completed · ${score}% · +XP`);renderHome();};$('ask-ai').onclick=()=>$('ai-question').focus();$('send-ai').onclick=()=>sendAI('tutor',{learnerMessage:$('ai-question').value,lesson:l});}
  function questionHTML(q,id){return `<div class="task"><label>${esc(q.prompt??q.q)}</label><div class="options">${q.options.map(o=>`<button class="option answer-option" data-qid="${esc(id)}" data-answer="${esc(o)}" data-correct="${esc(q.answer)}" data-explanation="${esc(q.explanation||'Review the correct answer.')}">${esc(o)}</button>`).join('')}</div><div class="answer-feedback" id="fb-${esc(id)}"></div></div>`;}
  function chooseAnswer(l,b){const qid=b.dataset.qid,correct=b.dataset.answer===b.dataset.correct;EnglishProgress.answer(l.id,qid,correct);b.parentElement.querySelectorAll('button').forEach(x=>{x.disabled=true;if(x.dataset.answer===b.dataset.correct)x.classList.add('selected');});$(`fb-${qid}`).innerHTML=`<div class="feedback">${correct?'Correct!':'Not quite.'} ${b.dataset.explanation}</div>`;}
  async function sendAI(kind,payload,out=$('ai-answer')){if(!DeepSeekAI.isConfigured()){out.innerHTML='<div class="feedback">请先打开设置，输入自己的 DeepSeek API Key。</div>';return;}out.innerHTML='<p class="small">AI teacher is thinking…</p>';contextSettings={profile:$('context-profile').checked,progress:$('context-progress').checked,history:$('context-history').checked,customContext:$('custom-context').value};const ctx=EnglishContext.build({profile,lesson:payload.lesson||activeLesson,week:Math.ceil((payload.lesson||activeLesson).day/7),history,settings:contextSettings,userMessage:payload.learnerMessage||payload.text||''});try{const r=await DeepSeekAI.request(kind,{context:ctx,task:payload});history.push({role:'user',content:payload.learnerMessage||payload.text||''},{role:'assistant',content:JSON.stringify(r.data)});renderAIResult(kind,r.data,out);}catch(e){out.innerHTML=`<div class="feedback">${esc(e.message)}</div>`;}}
  function renderAIResult(kind,d,out){if(kind==='writing'){out.innerHTML=`<div class="feedback"><b>Score: ${d.score}/100</b><p>${esc(d.corrected)}</p>${d.corrections.map(c=>`<p>${esc(c.original)} → <b>${esc(c.suggestion)}</b><br>${esc(c.reason_zh)}</p>`).join('')}<p>${esc(d.next_step)}</p></div>`;}else if(kind==='speaking'){out.innerHTML=`<div class="feedback"><b>${esc(d.conversation_reply)}</b><p>${esc(d.translation_zh)}</p><p>${esc(d.next_question)}</p></div>`;}else{out.innerHTML=`<div class="feedback"><b>${esc(d.reply_en)}</b><p>${esc(d.explanation_zh)}</p><p>${esc(d.example)}</p><p>Practice: ${esc(d.practice_question)}</p></div>`;}}
  function updateAIStatus(){const s=$('ai-status');s.textContent=DeepSeekAI.isConfigured()?'Enabled':'Not configured';s.className='pill '+(DeepSeekAI.isConfigured()?'green':'');}
  $('settings-open').onclick=()=>{
    $('ai-model').value=DeepSeekAI.model;
    updateAIStatus();
    $('settings').showModal();
  };
  $('test-ai').onclick=async()=>{
    const msg=$('ai-message');
    msg.textContent='Testing connection…';
    try{
      await DeepSeekAI.test($('api-key').value,$('ai-model').value);
      msg.textContent='Connection successful.';
    }catch(e){msg.textContent=e.message;}
  };
  $('save-ai').onclick=()=>{
    if(!$('api-key').value.trim()&&!DeepSeekAI.isConfigured()){
      toast('Please enter an API Key.');
      return;
    }
    try{
      DeepSeekAI.configure($('api-key').value,$('ai-model').value);
      $('api-key').value='';
      $('ai-message').textContent='Saved in this browser.';
      updateAIStatus();
    }catch{
      $('ai-message').textContent='Browser storage is unavailable. Settings were not saved.';
    }
  };
  $('clear-ai').onclick=()=>{
    try{
      DeepSeekAI.clear();
      $('api-key').value='';
      $('ai-model').value=DeepSeekAI.model;
      $('ai-message').textContent='API Key removed from this browser.';
      updateAIStatus();
    }catch{
      $('ai-message').textContent='Could not clear the saved API Key. Clear this site’s browser data.';
    }
  };
  window.addEventListener('storage',updateAIStatus);
  $('preview-context').onclick=()=>{contextSettings={profile:$('context-profile').checked,progress:$('context-progress').checked,history:$('context-history').checked,customContext:$('custom-context').value};const ctx=EnglishContext.build({profile,lesson:activeLesson,week:activeLesson?Math.ceil(activeLesson.day/7):null,history,settings:contextSettings,userMessage:'Preview only'});$('context-preview').textContent=JSON.stringify(ctx,null,2);$('context-preview').hidden=false;};$('export-progress').onclick=()=>{const blob=new Blob([EnglishProgress.exportData()],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='english-adventure-progress.json';a.click();URL.revokeObjectURL(a.href);};init();
})();
