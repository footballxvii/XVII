/* Stage 12K1: compressed background, no dark overlay, and hard new-manager rating fix. */
(function(){
  if(window.__stage12k1CompressedBackgroundRatingFix) return;
  window.__stage12k1CompressedBackgroundRatingFix=true;
  const VERSION='Version 13Q · Beta';
  const START_RATING=26;

  function newCareerLike(){
    try{
      const mp=state?.managerProfile || {};
      const hist=Array.isArray(mp.history)?mp.history:[];
      const career=Array.isArray(state?.careerHistory)?state.careerHistory:[];
      return Number(state?.seasonNumber||1)===1 && hist.length===0 && career.length===0;
    }catch(e){ return false; }
  }
  function forceNewManagerRating(){
    try{
      if(!window.state || !state.started) return false;
      if(!newCareerLike()) return false;
      const mp=state.managerProfile || {};
      const current=Number(mp.rating||0);
      if(current!==START_RATING || mp.stage12kRatingModel!=='low-start-v2'){
        mp.rating=START_RATING;
        mp.committedRating=START_RATING;
        mp.seasonBaseRating=START_RATING;
        mp.liveRating=START_RATING;
        mp.liveDelta=0;
        mp.lastDelta=0;
        mp.lastBreakdown=Array.isArray(mp.lastBreakdown)?mp.lastBreakdown:[];
        mp.stage12kRatingModel='low-start-v2';
        state.managerProfile=mp;
        if(state.season && !state.season.managerRepRecorded){
          state.season.managerRepBaseRating=START_RATING;
          state.season.liveManagerRepRating=START_RATING;
          state.season.liveManagerRepDelta=0;
        }
        try{ if(typeof saveGame==='function') saveGame(); }catch(e){}
        return true;
      }
    }catch(e){}
    return false;
  }
  const oldEmpty = (typeof emptyManagerProfile==='function') ? emptyManagerProfile : null;
  if(oldEmpty && !window.__stage12kEmptyProfilePatch){
    window.__stage12kEmptyProfilePatch=true;
    emptyManagerProfile=function(){
      const mp=oldEmpty.apply(this, arguments) || {};
      mp.rating=START_RATING;
      mp.committedRating=START_RATING;
      mp.seasonBaseRating=START_RATING;
      mp.stage12kRatingModel='low-start-v2';
      return mp;
    };
    window.emptyManagerProfile=emptyManagerProfile;
  }

  const oldRequestStart = window.requestStartNewGame || (typeof requestStartNewGame==='function'?requestStartNewGame:null);
  if(oldRequestStart && !window.__stage12kRequestStartPatch){
    window.__stage12kRequestStartPatch=true;
    const patched=function(){
      const out=oldRequestStart.apply(this, arguments);
      setTimeout(()=>{ forceNewManagerRating(); try{ if(typeof render==='function') render(); }catch(e){} },0);
      return out;
    };
    window.requestStartNewGame=patched;
    try{ requestStartNewGame=patched; }catch(e){}
  }

  const oldInitSeason=window.initSeason || (typeof initSeason==='function'?initSeason:null);
  if(oldInitSeason && !window.__stage12kInitSeasonPatch){
    window.__stage12kInitSeasonPatch=true;
    const patched=function(){
      forceNewManagerRating();
      const out=oldInitSeason.apply(this, arguments);
      forceNewManagerRating();
      return out;
    };
    window.initSeason=patched;
    try{ initSeason=patched; }catch(e){}
  }

  function refreshVersion(){
    try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; }); }catch(e){}
  }
  function boot(){ forceNewManagerRating(); refreshVersion(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  const oldRender=window.render || (typeof render==='function'?render:null);
  if(oldRender && !window.__stage12kRenderPatch){
    window.__stage12kRenderPatch=true;
    const patched=function(){ const out=oldRender.apply(this, arguments); setTimeout(()=>{ forceNewManagerRating(); refreshVersion(); },0); return out; };
    window.render=patched;
    try{ render=patched; }catch(e){}
  }
  setInterval(()=>{ forceNewManagerRating(); refreshVersion(); },2200);
})();