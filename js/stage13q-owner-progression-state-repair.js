/* Stage 13Q: Owner progression state repair.
   Makes the older Stage 13A next-season guard recognise the newer boardroom sessions,
   and keeps confirmed 5%, 25% and 51% owner decisions locked for the current season only. */
(function(){
  if(window.__stage13qOwnerProgressionStateRepair) return;
  window.__stage13qOwnerProgressionStateRepair = true;

  const VERSION = 'Version 13V · Beta';
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function currentSeason(){ return n(window.state?.seasonNumber || 1); }
  function currentClub(){ return String(window.state?.humanClub || ''); }
  function keyFor(club, season=currentSeason()){ return String(club||'')+'::'+n(season); }
  function ownerState(){
    try{ if(typeof window.stage13aOwnerState==='function') return window.stage13aOwnerState(); }catch(e){}
    window.state = window.state || {};
    state.managerOwner = state.managerOwner || {clubs:{}};
    state.managerOwner.clubs = state.managerOwner.clubs || {};
    return state.managerOwner;
  }
  function clubOwner(club=currentClub()){
    club = String(club || currentClub() || '');
    try{ if(typeof window.stage13aClubOwner==='function') return window.stage13aClubOwner(club); }catch(e){}
    const o=ownerState();
    o.clubs=o.clubs||{};
    if(!o.clubs[club]) o.clubs[club]={club,stake:0,lastPlan:null,shareHistory:[]};
    return o.clubs[club];
  }
  function stake(club=currentClub()){ return n(clubOwner(club)?.stake); }
  function sessions(){ const o=ownerState(); o.boardroomSessions=o.boardroomSessions||{}; return o.boardroomSessions; }
  function currentSession(club=currentClub(), season=currentSeason()){ return sessions()[keyFor(club,season)] || null; }
  function normalisePlan(club, plan, season=currentSeason()){
    if(!club || !plan) return null;
    const key=keyFor(club,season);
    return {
      ...plan,
      club:String(club),
      season:n(season),
      appliedSeason:n(season),
      decisionKey:key,
      decisionLocked:true,
      appliedImmediately:true,
      paid:true
    };
  }
  function oldCompatibleLockedPlan(club=currentClub(), season=currentSeason()){
    club=String(club||currentClub()||'');
    if(!club) return null;
    const co=clubOwner(club);
    const lp=co?.lastPlan || null;
    const key=keyFor(club,season);
    if(lp && (lp.decisionLocked || lp.appliedImmediately) && (n(lp.appliedSeason)===n(season) || n(lp.season)===n(season) || lp.decisionKey===key)){
      const fixed=normalisePlan(club,lp,season);
      co.lastPlan=fixed;
      const s=currentSession(club,season) || (sessions()[key]={key,club,season:n(season),createdAt:Date.now()});
      s.confirmed=true;
      s.confirmedAt=s.confirmedAt || Date.now();
      s.plan=fixed;
      ownerState().pendingPlan=null;
      ownerState().lastAppliedSeason=n(season);
      return fixed;
    }
    const s=currentSession(club,season);
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

  window.stage13qLockedBoardroomPlan=function(club, season){
    return oldCompatibleLockedPlan(club, season || currentSeason());
  };
  window.stage13qOwnerDecisionComplete=function(club, season){ return !!oldCompatibleLockedPlan(club||currentClub(), season||currentSeason()); };

  function setLatestVersion(){
    try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; }); }catch(e){}
  }
  function lockOwnerDom(club=currentClub()){
    if(!club || !oldCompatibleLockedPlan(club)) return;
    const plan=oldCompatibleLockedPlan(club);
    try{
      document.querySelectorAll('.stage13-development-card,.stage13l-controller-selector').forEach(card=>{
        card.classList.add('locked','stage13q-locked');
        card.querySelectorAll('select,input').forEach(el=>{ el.disabled=true; el.setAttribute('aria-disabled','true'); });
        card.querySelectorAll('button').forEach(btn=>{
          const onclick=String(btn.getAttribute('onclick')||'');
          if(/stage13aCashOutCurrentClub/.test(onclick)) return;
          btn.disabled=true;
          btn.setAttribute('aria-disabled','true');
        });
        const host=card.classList.contains('stage13-development-card') ? card : (card.closest('.stage13-development-card') || card);
        if(host && !host.querySelector('.stage13q-lock-note')){
          const note=document.createElement('div');
          note.className='stage13q-lock-note';
          note.innerHTML=`<b>Decision confirmed.</b> ${(plan?.label || 'Owner boardroom decision')} is locked for this season. You may now start next season.`;
          host.appendChild(note);
        }
      });
    }catch(e){}
  }
  function unlockNextButton(club=currentClub()){
    if(!club || stake(club)<=0 || !oldCompatibleLockedPlan(club)) return;
    try{
      const warn=document.getElementById('stage13fOwnerLockWarning');
      if(warn) warn.remove();
      document.querySelectorAll('#seasonSummary .next-season-main-btn').forEach(btn=>{
        btn.disabled=false;
        btn.classList.remove('secondary');
        btn.classList.add('good');
        btn.title='Owner boardroom decision confirmed. You can start next season.';
      });
    }catch(e){}
  }
  function afterRender(){ setLatestVersion(); const club=currentClub(); if(club && oldCompatibleLockedPlan(club)){ lockOwnerDom(club); unlockNextButton(club); } }

  function wrapDecisionFunction(name){
    const fn=window[name];
    if(typeof fn!=='function' || fn.__stage13qWrapped) return;
    const wrapped=function(club){
      club=String(club||currentClub()||'');
      if(club && oldCompatibleLockedPlan(club)){
        const plan=oldCompatibleLockedPlan(club);
        lockOwnerDom(club); unlockNextButton(club);
        try{ if(typeof setStatus==='function') setStatus('Owner boardroom decision is already confirmed and locked for this season.','warn'); }catch(e){}
        return {alreadyLocked:true,plan};
      }
      const out=fn.apply(this,arguments);
      try{
        const plan=(out && out.plan) || clubOwner(club)?.lastPlan || currentSession(club)?.plan || null;
        if(plan){
          const fixed=normalisePlan(club,plan,currentSeason());
          clubOwner(club).lastPlan=fixed;
          const s=currentSession(club) || (sessions()[keyFor(club)]={key:keyFor(club),club,season:currentSeason(),createdAt:Date.now()});
          s.confirmed=true; s.confirmedAt=s.confirmedAt || Date.now(); s.plan=fixed;
          ownerState().pendingPlan=null; ownerState().lastAppliedSeason=currentSeason();
        }
        lockOwnerDom(club); unlockNextButton(club);
        setTimeout(()=>{ try{ if(typeof renderSeasonSummary==='function') renderSeasonSummary(); afterRender(); }catch(e){} },0);
      }catch(e){}
      return out;
    };
    wrapped.__stage13qWrapped=true;
    window[name]=wrapped;
    try{ eval(name+'=window["'+name+'"]'); }catch(e){}
  }

  wrapDecisionFunction('stage13aVoteDevelopmentPlan');
  wrapDecisionFunction('stage13lConfirmOwnerDecision');
  wrapDecisionFunction('stage13aSetCustomDevelopmentPlan');

  const oldStart=typeof window.startNextSeasonWithCurrentSquad==='function' ? window.startNextSeasonWithCurrentSquad : null;
  if(oldStart && !oldStart.__stage13qWrapped){
    const wrappedStart=function(){
      try{
        const club=currentClub();
        if(club && window.state?.started && window.state?.season && n(window.state.season.roundIndex)>=38 && !window.state?.pendingJobAppointment?.to && stake(club)>0){
          const plan=oldCompatibleLockedPlan(club);
          if(plan){ lockOwnerDom(club); unlockNextButton(club); }
        }
      }catch(e){}
      return oldStart.apply(this,arguments);
    };
    wrappedStart.__stage13qWrapped=true;
    window.startNextSeasonWithCurrentSquad=wrappedStart;
    try{ startNextSeasonWithCurrentSquad=wrappedStart; }catch(e){}
  }

  const oldRender=typeof window.render==='function' ? window.render : null;
  if(oldRender && !oldRender.__stage13qWrapped){
    const wrappedRender=function(){ const out=oldRender.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    wrappedRender.__stage13qWrapped=true;
    window.render=wrappedRender;
    try{ render=wrappedRender; }catch(e){}
  }
  const oldSummary=typeof window.renderSeasonSummary==='function' ? window.renderSeasonSummary : null;
  if(oldSummary && !oldSummary.__stage13qWrapped){
    const wrappedSummary=function(){ const out=oldSummary.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    wrappedSummary.__stage13qWrapped=true;
    window.renderSeasonSummary=wrappedSummary;
    try{ renderSeasonSummary=wrappedSummary; }catch(e){}
  }

  function injectStyles(){
    if(document.getElementById('stage13q-style')) return;
    const st=document.createElement('style');
    st.id='stage13q-style';
    st.textContent=`
      .stage13-development-card.stage13q-locked select,
      .stage13-development-card.stage13q-locked input,
      .stage13-development-card.stage13q-locked button:not([onclick*="stage13aCashOutCurrentClub"]),
      .stage13l-controller-selector.stage13q-locked select,
      .stage13l-controller-selector.stage13q-locked input,
      .stage13l-controller-selector.stage13q-locked button{pointer-events:none!important;opacity:.55!important;}
      .stage13q-lock-note{margin-top:8px;border:1px solid rgba(51,214,159,.38);background:rgba(51,214,159,.10);color:#d8fff0;border-radius:10px;padding:8px 9px;font-size:9px;line-height:1.35;font-weight:850;}
    `;
    document.head.appendChild(st);
  }
  function boot(){ injectStyles(); afterRender(); setTimeout(afterRender,80); setTimeout(afterRender,300); setInterval(setLatestVersion,1000); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
