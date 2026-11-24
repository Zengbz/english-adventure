(() => {
  function build({profile,lesson,week,history=[],settings={},userMessage=''}){
    const progress=EnglishProgress.state;
    const includeProfile=settings.profile!==false;
    const includeProgress=settings.progress!==false;
    const includeHistory=settings.history!==false;
    const context={
      app:{name:'English Adventure',curriculum:'CEFR A2 to B1',dailyMinutes:30},
      student:includeProfile?(profile||{nativeLanguage:'Chinese',currentLevel:'A2',targetLevel:'B1',goals:['travel','daily communication','international social interaction']}):undefined,
      currentLesson:lesson?{week,title:lesson.title,subtitle:lesson.subtitle,grammar:lesson.grammar,vocabulary:lesson.vocabulary.map(v=>v.word)}:undefined,
      learningProgress:includeProgress?{xp:progress.xp,completedLessons:Object.entries(progress.days).filter(([,v])=>v.completed).map(([k])=>k),recentWeaknesses:Object.entries(progress.days).flatMap(([lessonId,d])=>Object.entries(d.answers||{}).filter(([,a])=>a.correct===false).map(([questionId])=>({lessonId,questionId}))).slice(-12)}:undefined,
      recentConversation:includeHistory?history.slice(-8):undefined,
      customContext:settings.customContext||undefined,
      learnerMessage:userMessage
    };
    return Object.fromEntries(Object.entries(context).filter(([,v])=>v!==undefined));
  }
  window.EnglishContext={build};
})();
