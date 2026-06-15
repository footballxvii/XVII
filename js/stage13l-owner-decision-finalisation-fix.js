/* Stage 13L: finalise 51% owner decision flow, affordable unit caps and next-season unlock polish. */
(function(){
  if(window.__stage13lOwnerDecisionFinalisationFix) return;
  window.__stage13lOwnerDecisionFinalisationFix = true;

  const VERSION = 'Version 13S · Beta';
  function byId(id){ return document.getElementById(id); }
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function seasonNo(){ return n(window.state?.seasonNumber || 1); }
  function currentClub(){ return window.state?.humanClub || ''; }
  function ownerRecord(club){
    try{ if(typeof window.stage13aClubOwner === 'function') return window.stage13aClubOwner(club); }catch(e){}
    return window.state?.managerOwner?.clubs?.[club] || null;
  }
  function currentStake(club=currentClub()){ return n(ownerRecord(club)?.stake); }
  function decisionLocked(club=currentClub()){
    const o = window.state?.managerOwner || {};
    const lp = ownerRecord(club)?.lastPlan;
    return !!(lp && (lp.decisionLocked || lp.appliedImmediately) && (n(lp.appliedSeason)===seasonNo() || n(lp.season)===seasonNo()));
  }
  function refreshVersion(){
    try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent = VERSION; }); }catch(e){}
  }
  function injectStyles(){
    if(byId('stage13l-style')) return;
    const st=document.createElement('style');
    st.id='stage13l-style';
    st.textContent=`
      .stage13l-controller-selector{border:1px solid rgba(51,214,159,.34)!important;background:linear-gradient(135deg,rgba(6,78,59,.22),rgba(15,23,42,.74))!important;border-radius:14px!important;padding:10px!important;margin-top:10px!important;}
      .stage13l-controller-selector label{display:block!important;margin:8px 0 4px!important;color:#e8fff7!important;font-size:10px!important;line-height:1.25!important;}
      .stage13l-controller-selector label b{display:block!important;color:#fff!important;font-size:10.5px!important;margin-bottom:2px!important;}
      .stage13l-controller-selector label span{display:block!important;color:#a8c2d8!important;font-size:8.5px!important;}
      .stage13l-controller-selector select,.stage13l-controller-selector input{width:100%!important;margin:0 0 6px!important;border-radius:10px!important;border:1px solid rgba(148,163,184,.35)!important;background:rgba(2,6,23,.64)!important;color:#fff!important;padding:8px!important;font-weight:800!important;}
      .stage13l-preview{margin-top:8px!important;border-color:rgba(51,214,159,.28)!important;background:rgba(51,214,159,.10)!important;}
      .stage13-development-card.locked .stage13l-controller-selector{opacity:.88!important;}
      .stage13-development-card.locked .stage13l-controller-selector select,.stage13-development-card.locked .stage13l-controller-selector input,.stage13-development-card.locked .stage13l-controller-selector button{pointer-events:none!important;opacity:.58!important;}
    `;
    document.head.appendChild(st);
  }
  function unlockNextSeasonVisualIfReady(){
    try{
      const club=currentClub();
      const btn=document.querySelector('#seasonSummary .next-season-main-btn');
      if(!btn || !club || !window.state?.season || n(window.state.season.roundIndex)<38) return;
      if(currentStake(club)>0 && decisionLocked(club)){
        const warn=byId('stage13fOwnerLockWarning');
        if(warn) warn.remove();
        btn.classList.remove('secondary');
        btn.classList.add('good');
        btn.title='Owner boardroom decision confirmed. You can start next season.';
      }
    }catch(e){}
  }
  function primeControllerPreviews(){
    try{
      document.querySelectorAll('.stage13l-controller-selector').forEach(panel=>{
        const club=panel.getAttribute('data-stage13l-club') || currentClub();
        if(typeof window.stage13lOwnerDecisionChanged === 'function') window.stage13lOwnerDecisionChanged(club);
      });
    }catch(e){}
  }
  function afterRender(){
    injectStyles();
    refreshVersion();
    unlockNextSeasonVisualIfReady();
    primeControllerPreviews();
  }

  const oldRender=typeof window.render==='function' ? window.render : null;
  if(oldRender && !window.__stage13lRenderPatch){
    window.__stage13lRenderPatch=true;
    window.render=function(){ const out=oldRender.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    try{ render=window.render; }catch(e){}
  }
  const oldSummary=typeof window.renderSeasonSummary==='function' ? window.renderSeasonSummary : null;
  if(oldSummary && !window.__stage13lSummaryPatch){
    window.__stage13lSummaryPatch=true;
    window.renderSeasonSummary=function(){ const out=oldSummary.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    try{ renderSeasonSummary=window.renderSeasonSummary; }catch(e){}
  }
  const oldStart=typeof window.startNextSeasonWithCurrentSquad==='function' ? window.startNextSeasonWithCurrentSquad : null;
  if(oldStart && !window.__stage13lStartNextPatch){
    window.__stage13lStartNextPatch=true;
    window.startNextSeasonWithCurrentSquad=function(){
      try{
        const club=currentClub();
        if(club && currentStake(club)>0 && decisionLocked(club)){
          window.state.managerOwner = window.state.managerOwner || {};
          window.state.managerOwner.lastAppliedSeason = seasonNo();
        }
      }catch(e){}
      return oldStart.apply(this,arguments);
    };
    try{ startNextSeasonWithCurrentSquad=window.startNextSeasonWithCurrentSquad; }catch(e){}
  }
  function boot(){ try{ afterRender(); setTimeout(afterRender,80); setTimeout(afterRender,300); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
