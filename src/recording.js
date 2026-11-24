(() => {
  async function toWav(blob) {
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    const context=new AudioContextClass();
    try {
      const decoded=await context.decodeAudioData(await blob.arrayBuffer());
      const rendered=new OfflineAudioContext(1,Math.ceil(decoded.duration*16000),16000);
      const source=rendered.createBufferSource();
      source.buffer=decoded;
      source.connect(rendered.destination);
      source.start();
      const samples=(await rendered.startRendering()).getChannelData(0);
      const data=new DataView(new ArrayBuffer(44+samples.length*2));
      const label=(offset,value)=>[...value].forEach((c,i)=>data.setUint8(offset+i,c.charCodeAt(0)));
      label(0,'RIFF');data.setUint32(4,data.byteLength-8,true);label(8,'WAVE');
      label(12,'fmt ');data.setUint32(16,16,true);data.setUint16(20,1,true);data.setUint16(22,1,true);
      data.setUint32(24,16000,true);data.setUint32(28,32000,true);data.setUint16(32,2,true);data.setUint16(34,16,true);
      label(36,'data');data.setUint32(40,samples.length*2,true);
      samples.forEach((value,i)=>data.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,value))*32767),true));
      return new Blob([data],{type:'audio/wav'});
    }finally{await context.close();}
  }
  function bind(root,grade,stopPlayback) {
    let active=null,closed=false;
    const recordings=new WeakMap();
    const supported=window.MediaRecorder&&navigator.mediaDevices?.getUserMedia;
    const buttons=root.querySelectorAll('.record-answer');
    for(const button of buttons) {
      const task=button.closest('.practice-task');
      const status=task.querySelector('.record-status');
      const send=task.querySelector('.grade-audio');
      if(!supported){button.disabled=true;status.textContent='此浏览器无法录音。';continue;}
      button.onclick=async()=>{
        if(active?.button===button){
          if(active.recorder?.state==='recording')active.recorder.stop();
          return;
        }
        if(active)return;
        stopPlayback();
        const session={button};
        active=session;
        button.disabled=true;
        status.textContent='等待麦克风权限…';
        try{
          const stream=await navigator.mediaDevices.getUserMedia({audio:true});
          session.stream=stream;
          if(closed){stream.getTracks().forEach(track=>track.stop());return;}
          const mimeType='audio/ogg;codecs=opus';
          const recorder=new MediaRecorder(stream,MediaRecorder.isTypeSupported(mimeType)?{mimeType}:undefined);
          session.recorder=recorder;
          const chunks=[];
          recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
          recorder.onerror=()=>{session.failed=true;status.textContent='录音失败，请重试。';release(session);};
          recorder.onstop=()=>{
            release(session);
            if(closed||session.failed)return;
            const blob=new Blob(chunks,{type:recorder.mimeType});
            if(!blob.size){status.textContent='没有录到声音，请重试。';return;}
            recordings.set(button,blob);
            send.disabled=false;
            status.textContent='已录好。点击评分才会把录音发给 DeepSeek。';
          };
          recorder.start();
          session.timer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},90000);
          button.textContent='结束录音';
          button.disabled=false;
          status.textContent='录音中… 最多 90 秒';
        }catch{release(session);status.textContent='无法使用麦克风，请检查权限。';}
      };
      send.onclick=async()=>{
        const blob=recordings.get(button);
        if(!blob||active)return;
        if(!DeepSeekAI.isConfigured()){status.textContent='请先设置 DeepSeek API Key。';return;}
        send.disabled=true;
        try{
          status.textContent='正在发送录音给 DeepSeek…';
          const audio=blob.type.startsWith('audio/ogg')?blob:await toWav(blob);
          if(!closed)await grade(task,audio);
          status.textContent='';
        }catch(e){status.textContent=e.message||'录音处理失败，请重试。';}
        finally{send.disabled=false;}
      };
    }
    function release(session){
      clearTimeout(session.timer);
      session.stream?.getTracks().forEach(track=>track.stop());
      session.button.disabled=false;
      session.button.textContent='录音';
      if(active===session)active=null;
    }
    return ()=>{
      closed=true;
      if(active){
        if(active.recorder?.state==='recording')active.recorder.stop();
        release(active);
      }
    };
  }
  window.EnglishRecording={bind};
})();
