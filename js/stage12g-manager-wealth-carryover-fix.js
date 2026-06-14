/* Stage 12G: manager wealth carryover fix.
   Ensures personal wealth and career earnings survive the end-of-season reset into the next season. */
(function(){
  const VERSION='Version 12I · Beta';

  function clone(x){ try{return JSON.parse(JSON.stringify(x));}catch(e){return x;} }
  function n(v){ const x=Number(v||0); return Math.round(x*100)/100; }
  function hasWealth(w){ return !!w && (Number(w.personalWealth||0)>0 || Number(w.careerEarnings||0)>0 || (Array.isArray(w.settlements)&&w.settlements.length)); }
  function normaliseLight(w){
    const out={
      personalWealth:0,
      careerEarnings:0,
      careerBonuses:0,
      settlements:[],
      salaryHistory:[],
      currentSalaryDeal:null,
      lastSettlement:null,
      lastSalaryReview:null,
      acceptedJobOffer:null,
      contracts:[],
      currentContract:null,
      ...(w||{})
    };
    out.personalWealth=n(out.personalWealth);
    out.careerEarnings=n(out.careerEarnings);
    out.careerBonuses=n(out.careerBonuses);
    out.settlements=Array.isArray(out.settlements)?out.settlements:[];
    out.salaryHistory=Array.isArray(out.salaryHistory)?out.salaryHistory:[];
    return out;
  }
  function mergeWealth(before, after){
    before=normaliseLight(before);
    after=normaliseLight(after);
    const merged={...before};
    // Keep the earned money from the completed career to date.
    merged.personalWealth=Math.max(n(before.personalWealth), n(after.personalWealth));
    merged.careerEarnings=Math.max(n(before.careerEarnings), n(after.careerEarnings));
    merged.careerBonuses=Math.max(n(before.careerBonuses), n(after.careerBonuses));
    merged.settlements = before.settlements.length>=after.settlements.length ? before.settlements : after.settlements;
    merged.salaryHistory = before.salaryHistory.length>=after.salaryHistory.length ? before.salaryHistory : after.salaryHistory;
    // But keep the latest salary review from the new season if Stage 12 created one.
    if(after.currentSalaryDeal) merged.currentSalaryDeal=after.currentSalaryDeal;
    if(after.lastSalaryReview) merged.lastSalaryReview=after.lastSalaryReview;
    if(after.lastSettlement || before.lastSettlement) merged.lastSettlement=after.lastSettlement || before.lastSettlement;
    // A job offer should normally be consumed once accepted and the next season starts.
    merged.acceptedJobOffer = after.acceptedJobOffer || null;
    return merged;
  }
  function setVersion(){
    try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{v.textContent=VERSION;}); }catch(e){}
  }
  function save(){ try{ if(typeof saveGame==='function') saveGame(); }catch(e){} }
  function settle(){ try{ if(typeof window.stage12SettleSeasonEarnings==='function') window.stage12SettleSeasonEarnings(); }catch(e){} }

  const oldStartNext = window.startNextSeasonWithCurrentSquad || (typeof startNextSeasonWithCurrentSquad==='function' ? startNextSeasonWithCurrentSquad : null);
  if(oldStartNext && !window.__stage12gStartNextPatch){
    window.__stage12gStartNextPatch=true;
    const patched=function(){
      settle();
      const before=clone(window.state && state.managerWealth ? state.managerWealth : null);
      const beforeHadWealth=hasWealth(before);
      const out=oldStartNext.apply(this, arguments);
      try{
        if(window.state && beforeHadWealth){
          const after=clone(state.managerWealth || null);
          const afterMissingOrLower = !hasWealth(after) || Number(after.personalWealth||0) < Number(before.personalWealth||0) || Number(after.careerEarnings||0) < Number(before.careerEarnings||0);
          if(afterMissingOrLower){
            state.managerWealth=mergeWealth(before, after);
            save();
            if(typeof render==='function') render();
          }else{
            save();
          }
        }
      }catch(e){}
      setVersion();
      return out;
    };
    window.startNextSeasonWithCurrentSquad=patched;
    try{ startNextSeasonWithCurrentSquad=patched; }catch(e){}
  }

  const oldRender = window.render || (typeof render==='function' ? render : null);
  if(oldRender && !window.__stage12gRenderPatch){
    window.__stage12gRenderPatch=true;
    const patchedRender=function(){ const out=oldRender.apply(this, arguments); setVersion(); return out; };
    window.render=patchedRender;
    try{ render=patchedRender; }catch(e){}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', setVersion);
  else setVersion();
  setInterval(setVersion, 2000);
})();
