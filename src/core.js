(() => {
  const DAY_KEY='englishAdventure.progress.v1';
  const normalize=s=>String(s??'').trim().replace(/\s+/g,' ').toLocaleLowerCase();
  function validateWeek(pack){
    if(!pack||pack.schemaVersion!==1||!Number.isInteger(pack.week)||pack.week<1||!Array.isArray(pack.lessons)||pack.lessons.length!==7)throw new Error('Invalid weekly course package: expected schemaVersion 1 and 7 lessons.');
    const ids=new Set(),days=new Set();
    for(const lesson of pack.lessons){
      if(!Number.isInteger(lesson.day)||days.has(lesson.day)||!lesson.id||!Array.isArray(lesson.vocabulary)||!Array.isArray(lesson.quiz))throw new Error('Invalid lesson or duplicate day.');
      days.add(lesson.day);
      for(const q of lesson.quiz){if(!q.id||ids.has(q.id)||!Array.isArray(q.options)||!q.options.includes(q.answer))throw new Error(`Invalid or duplicate quiz item: ${q.id}`);ids.add(q.id);}
      if(!lesson.listening?.transcript||!lesson.speaking?.prompt||!lesson.reading?.text||!lesson.writing?.prompt)throw new Error(`Lesson ${lesson.id} is missing a skill section.`);
    }
    return pack;
  }
  async function loadCatalog(){const r=await fetch('./courses/catalog.json',{cache:'no-store'});if(!r.ok)throw new Error('Course catalog is unavailable.');const c=await r.json();if(c.schemaVersion!==1||!Array.isArray(c.weeks))throw new Error('Invalid catalog.');return c;}
  async function loadWeek(entry){const r=await fetch(`./${entry.file}`,{cache:'no-store'});if(!r.ok)throw new Error(`Week ${entry.week} could not be loaded.`);const p=validateWeek(await r.json());if(p.week!==entry.week)throw new Error('Week number does not match catalog.');return p;}
  window.EnglishCore={DAY_KEY,normalize,validateWeek,loadCatalog,loadWeek};
})();
