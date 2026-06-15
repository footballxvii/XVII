/* Stage 13T: owner UX polish.
   Keeps the working 13R/13S owner progression and improves end-season owner clarity, cash-out state, duplicate lock notes and transfer-window finish button state. */
(function(){
  if(window.__stage13tOwnerUxPolish) return;
  window.__stage13tOwnerUxPolish = true;

  const VERSION = 'Version 13W · Beta';
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function esc(s){
    try{ if(typeof escapeHtml==='function') return escapeHtml(s); }catch(e){}
    return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]||c));
  }
  function fmtMoney(v){
    try{ if(typeof money==='function') return money(n(v)); }catch(e){}
    return '£'+n(v).toLocaleString(undefined,{maximumFractionDigits:1})+'m';
  }
  function bridgeWindowState(){
    try{
      const desc=Object.getOwnPropertyDescriptor(window,'state');
      if(!desc || !desc.get){
        Object.defineProperty(window,'state',{
          configurable:true,
          enumerable:false,
          get:function(){ try{ return state; }catch(e){ return undefined; } },
          set:function(v){ try{ state=v; }catch(e){} }
        });
      }
    }catch(e){}
  }
  function s(){ bridgeWindowState(); try{ return state; }catch(e){ return window.state || null; } }
  function currentClub(){ return String(s()?.humanClub||''); }
  function seasonNo(){ return Math.max(1,n(s()?.seasonNumber||1)); }
  function ownerState(){ const st=s(); if(!st) return null; st.managerOwner=st.managerOwner||{clubs:{}}; st.managerOwner.clubs=st.managerOwner.clubs||{}; return st.managerOwner; }
  function clubOwner(club=currentClub()){
    club=String(club||currentClub()||'');
    try{ if(typeof window.stage13aClubOwner==='function') return window.stage13aClubOwner(club); }catch(e){}
    const o=ownerState(); if(!o) return {club,stake:0};
    if(!o.clubs[club]) o.clubs[club]={club,stake:0,buyInPaid:0,lastPlan:null,shareHistory:[]};
    o.clubs[club].shareHistory=Array.isArray(o.clubs[club].shareHistory)?o.clubs[club].shareHistory:[];
    return o.clubs[club];
  }
  function stake(club=currentClub()){ return n(clubOwner(club)?.stake); }
  function decisionComplete(club=currentClub(), season=seasonNo()){
    if(!club) return false;
    try{ if(typeof window.stage13rOwnerDecisionComplete==='function' && window.stage13rOwnerDecisionComplete(club,season)) return true; }catch(e){}
    try{ if(typeof window.stage13qOwnerDecisionComplete==='function' && window.stage13qOwnerDecisionComplete(club,season)) return true; }catch(e){}
    const co=clubOwner(club);
    const lp=co?.lastPlan;
    if(lp && (lp.decisionLocked || lp.appliedImmediately || lp.paid) && (n(lp.season)===season || n(lp.appliedSeason)===season)) return true;
    const sess=ownerState()?.boardroomSessions?.[club+'::'+season];
    return !!(sess && sess.confirmed);
  }
  function status(msg,type='good'){ try{ if(typeof setStatus==='function') setStatus(msg,type); }catch(e){} }
  function save(){ try{ if(typeof saveGame==='function') saveGame(); }catch(e){} }
  function setVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; }); }catch(e){} }

  function injectStyles(){
    if(document.getElementById('stage13t-style')) return;
    const st=document.createElement('style');
    st.id='stage13t-style';
    st.textContent=`
      .stage13t-cashout-note{margin-top:7px;color:#a8b4cf;font-size:8.8px;line-height:1.35;}
      .stage13t-cashout-note b{color:#e5e7eb;}
      .stage13t-cashout-disabled{opacity:.46!important;filter:saturate(.65)!important;cursor:not-allowed!important;}
      .stage13t-window-blocked{opacity:.50!important;filter:saturate(.55)!important;cursor:not-allowed!important;}
      .stage13t-window-help{margin-top:5px;color:#f7d878;font-size:8.5px;font-weight:850;letter-spacing:.02em;}
      .stage13-development-card .stage13n-lock-note:not(:first-of-type),
      .stage13-development-card .stage13p-lock-note:not(:first-of-type),
      .stage13-development-card .stage13q-lock-note:not(:first-of-type),
      .stage13-development-card .stage13r-lock-note:not(:first-of-type){display:none!important;}
    `;
    document.head.appendChild(st);
  }

  function removeDevReviewIfNotOwner(){
    try{
      const club=currentClub();
      if(!club || stake(club)>0) return;
      document.querySelectorAll('#seasonSummary .stage13-development-card').forEach(el=>el.remove());
    }catch(e){}
  }

  function dedupeDecisionNotes(){
    try{
      document.querySelectorAll('.stage13-development-card').forEach(card=>{
        const notes=Array.from(card.querySelectorAll('.stage13n-lock-note,.stage13p-lock-note,.stage13q-lock-note,.stage13r-lock-note'));
        if(notes.length<=1) return;
        const keeper=notes.find(x=>x.classList.contains('stage13p-lock-note')) || notes[0];
        notes.forEach(n=>{ if(n!==keeper) n.remove(); });
      });
    }catch(e){}
  }

  function polishCashoutButtons(){
    try{
      const club=currentClub();
      if(!club) return;
      const hasStake=stake(club)>0;
      const locked=decisionComplete(club);
      document.querySelectorAll('button[onclick*="stage13aCashOutCurrentClub"]').forEach(btn=>{
        const panel=btn.closest('.stage13-buyin-card') || btn.parentElement;
        btn.textContent='Voluntary cash out at 80%';
        btn.classList.remove('secondary');
        btn.classList.add('good','tiny');
        btn.disabled=!hasStake || locked;
        btn.classList.toggle('stage13t-cashout-disabled', !hasStake || locked);
        btn.title=!hasStake ? 'You do not currently own a stake in this club.' : (locked ? 'Cash out is only available before you make this season’s owner boardroom decision.' : 'Sell your stake at 80% of current share value.');
        if(panel && !panel.querySelector('.stage13t-cashout-note')){
          const note=document.createElement('div');
          note.className='stage13t-cashout-note';
          panel.appendChild(note);
        }
        const note=panel?.querySelector('.stage13t-cashout-note');
        if(note){
          if(!hasStake) note.innerHTML='';
          else if(locked) note.innerHTML='<b>Cash out unavailable:</b> you have already made this season\'s owner boardroom decision. Start the next season to continue the save.';
          else note.innerHTML='<b>Available before boardroom action:</b> cashing out sells your current stake and removes owner decisions for this club.';
        }
      });
    }catch(e){}
  }

  function updateFinishWindowButtons(){
    try{
      const st=s();
      const buttons=[document.getElementById('finishBtn'),document.getElementById('finishBtnBottom')].filter(Boolean);
      if(!buttons.length) return;
      if(!st?.started || st.completed){ buttons.forEach(b=>{ b.disabled=false; b.classList.remove('stage13t-window-blocked'); }); return; }
      let legal={ok:true,problems:[]};
      try{ if(typeof squadLegal==='function') legal=squadLegal(st.humanClub); }catch(e){}
      buttons.forEach(b=>{
        b.classList.add('good');
        b.classList.toggle('stage13t-window-blocked', !legal.ok);
        b.disabled=!legal.ok;
        b.title=legal.ok ? 'Finish the transfer window.' : 'You cannot finish the window yet: '+(legal.problems||[]).join(', ');
      });
      const market=document.getElementById('market');
      if(market && !legal.ok){
        let help=document.getElementById('stage13tWindowHelp');
        if(!help){ help=document.createElement('div'); help.id='stage13tWindowHelp'; help.className='stage13t-window-help'; const wrap=document.querySelector('.finish-bottom-wrap') || buttons[0]?.parentElement || market; wrap.appendChild(help); }
        help.textContent='Finish Window is locked until your 17-player squad is complete: '+(legal.problems||[]).join(', ')+'.';
      } else {
        const help=document.getElementById('stage13tWindowHelp'); if(help) help.remove();
      }
    }catch(e){}
  }

  function maybeScrollToEndSeason(){
    try{
      const st=s();
      const box=document.getElementById('seasonSummary');
      if(!st?.started || !st?.season || n(st.season.roundIndex)<38 || !box || box.classList.contains('hidden')) return;
      const key=String(st.humanClub||'')+'::'+seasonNo();
      if(st.__stage13tScrolledEndSeasonKey===key) return;
      st.__stage13tScrolledEndSeasonKey=key;
      setTimeout(()=>{ try{ box.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){ window.scrollTo(0, box.offsetTop||0); } },180);
    }catch(e){}
  }

  const previousCashout=window.stage13aCashOutCurrentClub;
  window.stage13aCashOutCurrentClub=function(){
    bridgeWindowState();
    const club=currentClub();
    const co=clubOwner(club);
    if(!club || stake(club)<=0){ status('You do not currently own a stake in this club.', 'warn'); afterRenderSoon(); return null; }
    if(decisionComplete(club)){
      status('Cash out is only available before this season’s owner boardroom decision. Your decision is already locked.', 'warn');
      afterRenderSoon();
      return null;
    }
    const out=typeof previousCashout==='function' ? previousCashout.apply(this,arguments) : null;
    try{
      co.cashOutFinal=true;
      co.cashOutSeason=seasonNo();
      co.lastPlan=null;
      if(stake(club)<=0){
        const o=ownerState();
        if(o){ o.pendingPlan=null; o.pendingBuyIn=null; }
      }
      save();
    }catch(e){}
    setTimeout(afterRender,40);
    setTimeout(afterRender,250);
    return out;
  };
  try{ stage13aCashOutCurrentClub=window.stage13aCashOutCurrentClub; }catch(e){}

  function afterRender(){
    bridgeWindowState();
    injectStyles();
    setVersion();
    removeDevReviewIfNotOwner();
    dedupeDecisionNotes();
    polishCashoutButtons();
    updateFinishWindowButtons();
  }
  function afterRenderSoon(){ setTimeout(afterRender,0); setTimeout(afterRender,120); }

  const oldRender=typeof window.render==='function' ? window.render : null;
  if(oldRender && !window.__stage13tRenderPatch){
    window.__stage13tRenderPatch=true;
    window.render=function(){ const out=oldRender.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    try{ render=window.render; }catch(e){}
  }
  const oldSummary=typeof window.renderSeasonSummary==='function' ? window.renderSeasonSummary : null;
  if(oldSummary && !window.__stage13tSummaryPatch){
    window.__stage13tSummaryPatch=true;
    window.renderSeasonSummary=function(){ const out=oldSummary.apply(this,arguments); try{ afterRender(); maybeScrollToEndSeason(); }catch(e){} return out; };
    try{ renderSeasonSummary=window.renderSeasonSummary; }catch(e){}
  }
  const oldFinish=typeof window.finishWindow==='function' ? window.finishWindow : null;
  if(oldFinish && !window.__stage13tFinishPatch){
    window.__stage13tFinishPatch=true;
    window.finishWindow=function(){ const out=oldFinish.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    try{ finishWindow=window.finishWindow; }catch(e){}
  }

  function boot(){ afterRender(); setTimeout(afterRender,100); setTimeout(afterRender,500); setInterval(()=>{ setVersion(); updateFinishWindowButtons(); dedupeDecisionNotes(); },1500); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
