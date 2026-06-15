/* Stage 12J: background identity and manager salary carryover hard fix. */
(function(){
  if(window.__stage12jVisualSalaryFix) return;
  window.__stage12jVisualSalaryFix=true;
  const VERSION='Version 13P · Beta';
  const STASH_KEY='xvii_stage12j_manager_wealth_stash_v1';

  function clone(x){ try{return JSON.parse(JSON.stringify(x));}catch(e){return x;} }
  function n(v){ const x=Number(v||0); return Math.round(x*1000)/1000; }
  function hasMeaningful(w){ return !!w && (n(w.personalWealth)>0 || n(w.careerEarnings)>0 || n(w.careerBonuses)>0 || (Array.isArray(w.settlements)&&w.settlements.length>0)); }
  function normalise(w){
    const out={personalWealth:0,careerEarnings:0,careerBonuses:0,settlements:[],salaryHistory:[],currentSalaryDeal:null,lastSettlement:null,lastSalaryReview:null,acceptedJobOffer:null,contracts:[],currentContract:null,...(w||{})};
    out.personalWealth=n(out.personalWealth);
    out.careerEarnings=n(out.careerEarnings);
    out.careerBonuses=n(out.careerBonuses);
    out.settlements=Array.isArray(out.settlements)?out.settlements:[];
    out.salaryHistory=Array.isArray(out.salaryHistory)?out.salaryHistory:[];
    if(out.settlements.length){
      const sorted=out.settlements.slice().sort((a,b)=>Number(a.season||0)-Number(b.season||0));
      const sumTotal=n(sorted.reduce((a,s)=>a+Number(s.total||0),0));
      const sumBonus=n(sorted.reduce((a,s)=>a+Number(s.bonus||0),0));
      const last=sorted[sorted.length-1];
      const wealthAfter=n(last?.wealthAfter||0);
      if(out.personalWealth<=0 && (wealthAfter>0 || sumTotal>0)) out.personalWealth=Math.max(wealthAfter,sumTotal);
      if(out.careerEarnings<=0 && sumTotal>0) out.careerEarnings=sumTotal;
      if(out.careerBonuses<=0 && sumBonus>0) out.careerBonuses=sumBonus;
      if(!out.lastSettlement && last) out.lastSettlement=last;
    }
    return out;
  }
  function mergeWealth(before, after){
    before=normalise(before); after=normalise(after);
    const merged={...after};
    merged.personalWealth=Math.max(n(before.personalWealth), n(after.personalWealth));
    merged.careerEarnings=Math.max(n(before.careerEarnings), n(after.careerEarnings));
    merged.careerBonuses=Math.max(n(before.careerBonuses), n(after.careerBonuses));
    const bySeason={};
    [...(before.settlements||[]), ...(after.settlements||[])].forEach(s=>{ if(s && s.season!=null) bySeason[String(s.season)]=s; });
    merged.settlements=Object.values(bySeason).sort((a,b)=>Number(a.season||0)-Number(b.season||0));
    if((before.salaryHistory||[]).length>(after.salaryHistory||[]).length) merged.salaryHistory=before.salaryHistory;
    if(after.currentSalaryDeal) merged.currentSalaryDeal=after.currentSalaryDeal; else if(before.currentSalaryDeal) merged.currentSalaryDeal=before.currentSalaryDeal;
    if(after.lastSalaryReview) merged.lastSalaryReview=after.lastSalaryReview; else if(before.lastSalaryReview) merged.lastSalaryReview=before.lastSalaryReview;
    merged.lastSettlement=after.lastSettlement || before.lastSettlement || (merged.settlements.length?merged.settlements[merged.settlements.length-1]:null);
    merged.acceptedJobOffer=after.acceptedJobOffer || null;
    return normalise(merged);
  }
  function saveStash(w){
    try{
      if(!hasMeaningful(w) || !window.state) return;
      localStorage.setItem(STASH_KEY, JSON.stringify({savedAt:new Date().toISOString(), seasonNumber:Number(state.seasonNumber||1), club:state.humanClub||'', careerHistoryLength:Array.isArray(state.careerHistory)?state.careerHistory.length:0, wealth:normalise(w)}));
    }catch(e){}
  }
  function readStash(){ try{return JSON.parse(localStorage.getItem(STASH_KEY)||'null');}catch(e){return null;} }
  function restoreIfNeeded(){
    try{
      if(!window.state || !state.started) return false;
      let current=normalise(state.managerWealth||null);
      let changed=false;
      if(current.settlements.length && (current.personalWealth<=0 || current.careerEarnings<=0)){
        state.managerWealth=current; changed=true;
      }
      const stash=readStash();
      const stashWealth=normalise(stash?.wealth||null);
      const established=(Number(state.seasonNumber||1)>1) || (Array.isArray(state.careerHistory)&&state.careerHistory.length>0) || current.settlements.length>0;
      if(established && hasMeaningful(stashWealth) && (!hasMeaningful(current) || n(current.personalWealth)<n(stashWealth.personalWealth) || n(current.careerEarnings)<n(stashWealth.careerEarnings))){
        state.managerWealth=mergeWealth(stashWealth,current);
        current=state.managerWealth;
        changed=true;
      }
      if(hasMeaningful(current)) saveStash(current);
      return changed;
    }catch(e){ return false; }
  }
  function settle(){ try{ if(typeof window.stage12SettleSeasonEarnings==='function') return window.stage12SettleSeasonEarnings(); }catch(e){} return null; }
  function save(){ try{ if(typeof saveGame==='function') saveGame(); }catch(e){} }
  function refreshVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{v.textContent=VERSION;}); }catch(e){} }
  function afterMoneyChange(){ const changed=restoreIfNeeded(); refreshVersion(); if(changed) save(); }

  const oldSettle=window.stage12SettleSeasonEarnings;
  if(typeof oldSettle==='function' && !window.__stage12jSettlePatch){
    window.__stage12jSettlePatch=true;
    window.stage12SettleSeasonEarnings=function(){
      const out=oldSettle.apply(this, arguments);
      try{ state.managerWealth=normalise(state.managerWealth||null); saveStash(state.managerWealth); }catch(e){}
      return out;
    };
  }

  const oldStartNext=window.startNextSeasonWithCurrentSquad || (typeof startNextSeasonWithCurrentSquad==='function'?startNextSeasonWithCurrentSquad:null);
  if(oldStartNext && !window.__stage12jStartNextPatch){
    window.__stage12jStartNextPatch=true;
    const patched=function(){
      settle();
      restoreIfNeeded();
      const before=normalise(clone(state?.managerWealth||null));
      saveStash(before);
      const out=oldStartNext.apply(this, arguments);
      try{
        const after=normalise(clone(state?.managerWealth||null));
        const merged=mergeWealth(before,after);
        if(hasMeaningful(merged)){
          state.managerWealth=merged;
          saveStash(merged);
          save();
          if(typeof render==='function') setTimeout(()=>{ try{ render(); }catch(e){} },0);
        }
      }catch(e){}
      refreshVersion();
      return out;
    };
    window.startNextSeasonWithCurrentSquad=patched;
    try{ startNextSeasonWithCurrentSquad=patched; }catch(e){}
  }

  const oldRender=window.render || (typeof render==='function'?render:null);
  if(oldRender && !window.__stage12jRenderPatch){
    window.__stage12jRenderPatch=true;
    const patchedRender=function(){ const out=oldRender.apply(this, arguments); setTimeout(afterMoneyChange,0); return out; };
    window.render=patchedRender;
    try{ render=patchedRender; }catch(e){}
  }

  const oldLoad=window.loadSavedGame || (typeof loadSavedGame==='function'?loadSavedGame:null);
  if(oldLoad && !window.__stage12jLoadPatch){
    window.__stage12jLoadPatch=true;
    const patchedLoad=function(){ const out=oldLoad.apply(this, arguments); setTimeout(()=>{ if(restoreIfNeeded()){ save(); if(typeof render==='function') render(); } refreshVersion(); },0); return out; };
    window.loadSavedGame=patchedLoad;
    try{ loadSavedGame=patchedLoad; }catch(e){}
  }

  function boot(){ restoreIfNeeded(); refreshVersion(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setInterval(()=>{ restoreIfNeeded(); refreshVersion(); }, 2200);
  window.stage12jRecoverManagerWealth=restoreIfNeeded;
})();