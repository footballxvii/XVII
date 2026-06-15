/* Stage 13R: bridge window.state to the real game state and fix owner season progression after season one.
   Several late owner patches read window.state, but the core game keeps state as a top-level let.
   This bridge makes those patches read the real season number, club and owner data. */
(function(){
  if(window.__stage13rWindowStateBridgeOwnerSeasonFix) return;
  window.__stage13rWindowStateBridgeOwnerSeasonFix = true;

  const VERSION = 'Version 13R · Beta';
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function realState(){ try{ return state; }catch(e){ return window.state || null; } }
  function setRealState(v){ try{ state=v; return true; }catch(e){ try{ window.state=v; return true; }catch(_){ return false; } } }
  function bridgeWindowState(){
    try{
      Object.defineProperty(window,'state',{
        configurable:true,
        enumerable:false,
        get:function(){ try{ return state; }catch(e){ return undefined; } },
        set:function(v){ try{ state=v; }catch(e){} }
      });
    }catch(e){}
  }
  bridgeWindowState();

  function currentSeason(){ const s=realState(); return Math.max(1,n(s?.seasonNumber||1)); }
  function currentClub(){ const s=realState(); return String(s?.humanClub||''); }
  function ownerState(){
    const s=realState();
    if(!s) return {clubs:{}};
    s.managerOwner=s.managerOwner||{clubs:{}};
    s.managerOwner.clubs=s.managerOwner.clubs||{};
    return s.managerOwner;
  }
  function clubOwner(club=currentClub()){
    club=String(club||currentClub()||'');
    try{ if(typeof window.stage13aClubOwner==='function') return window.stage13aClubOwner(club); }catch(e){}
    const o=ownerState();
    if(!o.clubs[club]) o.clubs[club]={club,stake:0,lastPlan:null,shareHistory:[]};
    return o.clubs[club];
  }
  function currentStake(club=currentClub()){ return n(clubOwner(club)?.stake); }
  function keyFor(club=currentClub(), season=currentSeason()){ return String(club||'')+'::'+Math.max(1,n(season||1)); }
  function sessions(){ const o=ownerState(); o.boardroomSessions=o.boardroomSessions||{}; return o.boardroomSessions; }
  function normalisePlan(club, plan, season=currentSeason()){
    if(!club || !plan) return null;
    const key=keyFor(club,season);
    return {
      ...plan,
      club:String(club),
      season:Math.max(1,n(season)),
      appliedSeason:Math.max(1,n(season)),
      decisionKey:key,
      decisionLocked:true,
      appliedImmediately:true,
      paid:true
    };
  }
  function confirmedPlan(club=currentClub(), season=currentSeason()){
    bridgeWindowState();
    club=String(club||currentClub()||'');
    if(!club) return null;
    const key=keyFor(club,season);
    const co=clubOwner(club);
    const lp=co?.lastPlan||null;
    if(lp && (lp.decisionLocked || lp.appliedImmediately || lp.paid) && (n(lp.appliedSeason)===n(season) || n(lp.season)===n(season) || lp.decisionKey===key)){
      const fixed=normalisePlan(club,lp,season);
      co.lastPlan=fixed;
      const map=sessions();
      map[key]={...(map[key]||{}),key,club,season:n(season),confirmed:true,confirmedAt:(map[key]?.confirmedAt||Date.now()),plan:fixed};
      ownerState().pendingPlan=null;
      ownerState().lastAppliedSeason=n(season);
      return fixed;
    }
    const s=sessions()[key];
    if(s && s.confirmed && s.plan){
      const fixed=normalisePlan(club,s.plan,season);
      co.lastPlan=fixed;
      s.plan=fixed;
      ownerState().pendingPlan=null;
      ownerState().lastAppliedSeason=n(season);
      return fixed;
    }
    return null;
  }
  function markConfirmed(club=currentClub(), plan=null){
    club=String(club||currentClub()||'');
    if(!club) return null;
    const season=currentSeason();
    const co=clubOwner(club);
    const candidate=plan || co.lastPlan || sessions()[keyFor(club,season)]?.plan || null;
    if(!candidate) return null;
    const fixed=normalisePlan(club,candidate,season);
    co.lastPlan=fixed;
    const key=keyFor(club,season);
    sessions()[key]={...(sessions()[key]||{}),key,club,season,confirmed:true,confirmedAt:Date.now(),plan:fixed};
    ownerState().pendingPlan=null;
    ownerState().lastAppliedSeason=season;
    return fixed;
  }
  function setVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; }); }catch(e){} }
  function unlockNextButton(club=currentClub()){
    if(!club || currentStake(club)<=0 || !confirmedPlan(club)) return;
    try{ document.getElementById('stage13fOwnerLockWarning')?.remove(); }catch(e){}
    try{
      document.querySelectorAll('#seasonSummary .next-season-main-btn').forEach(btn=>{
        btn.disabled=false;
        btn.classList.remove('secondary');
        btn.classList.add('good');
        btn.title='Owner boardroom decision confirmed. You can start next season.';
      });
    }catch(e){}
  }
  function lockOwnerControls(club=currentClub()){
    const plan=confirmedPlan(club);
    if(!plan) return;
    try{
      document.querySelectorAll('.stage13-development-card,.stage13l-controller-selector').forEach(card=>{
        card.classList.add('stage13r-locked','locked');
        card.querySelectorAll('select,input').forEach(el=>{ el.disabled=true; el.setAttribute('aria-disabled','true'); });
        card.querySelectorAll('button').forEach(btn=>{
          const on=String(btn.getAttribute('onclick')||'');
          if(/stage13aCashOutCurrentClub/.test(on)) return;
          btn.disabled=true; btn.setAttribute('aria-disabled','true');
        });
        const host=card.classList.contains('stage13-development-card')?card:(card.closest('.stage13-development-card')||card);
        if(host && !host.querySelector('.stage13r-lock-note')){
          const note=document.createElement('div');
          note.className='stage13r-lock-note';
          note.innerHTML='<b>Decision confirmed.</b> '+String(plan.label||'Owner boardroom decision')+' is locked for this season. You may now start next season.';
          host.appendChild(note);
        }
      });
    }catch(e){}
  }
  function afterRender(){ bridgeWindowState(); setVersion(); const club=currentClub(); if(club && confirmedPlan(club)){ lockOwnerControls(club); unlockNextButton(club); } }

  // Make the older Stage 13A guard ask the real state, not the stale window.state object.
  window.stage13qLockedBoardroomPlan=function(club, season){ return confirmedPlan(club||currentClub(), season||currentSeason()); };
  window.stage13qOwnerDecisionComplete=function(club, season){ return !!confirmedPlan(club||currentClub(), season||currentSeason()); };
  window.stage13rOwnerDecisionComplete=window.stage13qOwnerDecisionComplete;

  function wrapDecisionFunction(name){
    const old=window[name];
    if(typeof old!=='function' || old.__stage13rWrapped) return;
    const wrapped=function(club){
      bridgeWindowState();
      club=String(club||currentClub()||'');
      if(club && confirmedPlan(club)){
        lockOwnerControls(club); unlockNextButton(club);
        try{ if(typeof setStatus==='function') setStatus('Owner boardroom decision is already confirmed and locked for this season.','warn'); }catch(e){}
        return {alreadyLocked:true,plan:confirmedPlan(club)};
      }
      const beforeSeason=currentSeason();
      const out=old.apply(this,arguments);
      try{
        const co=clubOwner(club);
        const key=keyFor(club,beforeSeason);
        const plan=(out&&out.plan) || co.lastPlan || sessions()[key]?.plan || null;
        if(plan) markConfirmed(club,plan);
        lockOwnerControls(club); unlockNextButton(club);
        setTimeout(()=>{ try{ if(typeof renderSeasonSummary==='function') renderSeasonSummary(); afterRender(); }catch(e){} },0);
      }catch(e){}
      return out;
    };
    wrapped.__stage13rWrapped=true;
    window[name]=wrapped;
    try{ eval(name+'=window["'+name+'"]'); }catch(e){}
  }
  wrapDecisionFunction('stage13lConfirmOwnerDecision');
  wrapDecisionFunction('stage13aVoteDevelopmentPlan');
  wrapDecisionFunction('stage13aSetCustomDevelopmentPlan');

  const oldStart=typeof window.startNextSeasonWithCurrentSquad==='function'?window.startNextSeasonWithCurrentSquad:null;
  if(oldStart && !oldStart.__stage13rWrapped){
    const wrappedStart=function(){
      bridgeWindowState();
      let club=currentClub();
      const seasonBefore=currentSeason();
      try{
        const s=realState();
        if(club && s?.started && s?.season && n(s.season.roundIndex)>=38 && !s?.pendingJobAppointment?.to && currentStake(club)>0){
          const plan=confirmedPlan(club,seasonBefore);
          if(plan){ markConfirmed(club,plan); lockOwnerControls(club); unlockNextButton(club); }
        }
      }catch(e){}
      const out=oldStart.apply(this,arguments);
      try{
        bridgeWindowState();
        const s=realState();
        if(s && n(s.seasonNumber)!==seasonBefore){
          // New season is now open: preserve owner history, but make sure stale pending boardroom state does not masquerade as a fresh decision.
          const o=ownerState();
          o.pendingPlan=null;
          o.currentBoardroomSeason=n(s.seasonNumber);
        }
        afterRender();
      }catch(e){}
      return out;
    };
    wrappedStart.__stage13rWrapped=true;
    window.startNextSeasonWithCurrentSquad=wrappedStart;
    try{ startNextSeasonWithCurrentSquad=wrappedStart; }catch(e){}
  }

  const oldRender=typeof window.render==='function'?window.render:null;
  if(oldRender && !oldRender.__stage13rWrapped){
    const wrappedRender=function(){ bridgeWindowState(); const out=oldRender.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    wrappedRender.__stage13rWrapped=true;
    window.render=wrappedRender;
    try{ render=wrappedRender; }catch(e){}
  }
  const oldSummary=typeof window.renderSeasonSummary==='function'?window.renderSeasonSummary:null;
  if(oldSummary && !oldSummary.__stage13rWrapped){
    const wrappedSummary=function(){ bridgeWindowState(); const out=oldSummary.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    wrappedSummary.__stage13rWrapped=true;
    window.renderSeasonSummary=wrappedSummary;
    try{ renderSeasonSummary=wrappedSummary; }catch(e){}
  }

  function injectStyles(){
    if(document.getElementById('stage13r-style')) return;
    const st=document.createElement('style');
    st.id='stage13r-style';
    st.textContent=`
      .stage13r-locked select,.stage13r-locked input,.stage13r-locked button:not([onclick*="stage13aCashOutCurrentClub"]){pointer-events:none!important;opacity:.55!important;}
      .stage13r-lock-note{margin-top:8px;border:1px solid rgba(51,214,159,.38);background:rgba(51,214,159,.10);color:#d8fff0;border-radius:10px;padding:8px 9px;font-size:9px;line-height:1.35;font-weight:850;}
    `;
    document.head.appendChild(st);
  }
  function boot(){ bridgeWindowState(); injectStyles(); afterRender(); setTimeout(afterRender,80); setTimeout(afterRender,300); setInterval(()=>{ bridgeWindowState(); setVersion(); },1000); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
