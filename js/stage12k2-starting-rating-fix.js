/* Stage 12K2: hard fix for fresh career starting manager reputation. */
(function(){
  if(window.__stage12k2StartingRatingFix) return;
  window.__stage12k2StartingRatingFix=true;
  const VERSION='Version 13W · Beta';
  const START_RATING=26;

  function isFreshCareer(){
    try{
      const mp=state?.managerProfile || {};
      const mh=Array.isArray(mp.history) ? mp.history : [];
      const ch=Array.isArray(state?.careerHistory) ? state.careerHistory : [];
      return !!state?.started && Number(state?.seasonNumber||1)===1 && mh.length===0 && ch.length===0;
    }catch(e){ return false; }
  }
  function forceFreshRating(){
    try{
      if(!isFreshCareer()) return false;
      const mp=state.managerProfile || {};
      const old=Number(mp.rating||0);
      if(old!==START_RATING || mp.stage12k2RatingModel!=='unknown-start-v1'){
        mp.rating=START_RATING;
        mp.liveRating=START_RATING;
        mp.committedRating=START_RATING;
        mp.seasonBaseRating=START_RATING;
        mp.liveDelta=0;
        mp.lastDelta=0;
        mp.lastBreakdown=Array.isArray(mp.lastBreakdown)?mp.lastBreakdown:[];
        mp.stage12k2RatingModel='unknown-start-v1';
        state.managerProfile=mp;
        if(state.season && !state.season.managerRepRecorded){
          state.season.managerRepBaseRating=START_RATING;
          state.season.liveManagerRepRating=START_RATING;
          state.season.liveManagerRepDelta=0;
          state.season.liveManagerRepParts=['0 live change: new manager starts unknown at 26/100.'];
        }
        try{ if(typeof saveGame==='function') saveGame(); }catch(e){}
        return true;
      }
    }catch(e){}
    return false;
  }
  function refreshVersion(){
    try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; }); }catch(e){}
  }
  // Override the old stage 9 starter if another script has already attached it.
  try{ window.stage9StartingManagerRep=function(){ return START_RATING; }; stage9StartingManagerRep=window.stage9StartingManagerRep; }catch(e){}

  const oldStartWindow=window.startWindow || (typeof startWindow==='function'?startWindow:null);
  if(oldStartWindow && !window.__stage12k2StartWindowPatch){
    window.__stage12k2StartWindowPatch=true;
    const patched=function(){
      const out=oldStartWindow.apply(this, arguments);
      forceFreshRating();
      try{ setStatus(`Summer window opened. New manager reputation: ${START_RATING}/100.`, 'good'); }catch(e){}
      try{ if(typeof render==='function') render(); }catch(e){}
      return out;
    };
    window.startWindow=patched;
    try{ startWindow=patched; }catch(e){}
  }
  const oldRender=window.render || (typeof render==='function'?render:null);
  if(oldRender && !window.__stage12k2RenderPatch){
    window.__stage12k2RenderPatch=true;
    const patched=function(){ const out=oldRender.apply(this, arguments); setTimeout(()=>{ forceFreshRating(); refreshVersion(); },0); return out; };
    window.render=patched;
    try{ render=patched; }catch(e){}
  }
  const oldLoad=window.loadSavedGame || (typeof loadSavedGame==='function'?loadSavedGame:null);
  if(oldLoad && !window.__stage12k2LoadPatch){
    window.__stage12k2LoadPatch=true;
    const patched=function(){ const out=oldLoad.apply(this, arguments); setTimeout(()=>{ forceFreshRating(); refreshVersion(); },0); return out; };
    window.loadSavedGame=patched;
    try{ loadSavedGame=patched; }catch(e){}
  }
  function boot(){ forceFreshRating(); refreshVersion(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setInterval(()=>{ forceFreshRating(); refreshVersion(); },2200);
})();
