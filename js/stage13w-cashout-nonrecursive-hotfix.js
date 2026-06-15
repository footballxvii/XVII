/* Stage 13W: cash-out nonrecursive hotfix.
   Removes the 13V recursion risk and applies cash-out persistence without calling stage13aClubOwner inside its own wrapper. */
(function(){
  if(window.__stage13wCashoutNonrecursiveHotfix) return;
  window.__stage13wCashoutNonrecursiveHotfix = true;

  const VERSION='Version 13W · Beta';
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function round1(v){ return Math.round(n(v)*10)/10; }
  function round3(v){ return Math.round(n(v)*1000)/1000; }
  function esc(s){
    try{ if(typeof escapeHtml==='function') return escapeHtml(s); }catch(e){}
    return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  }
  function fmtMoney(v){
    try{ if(typeof money==='function') return money(n(v)); }catch(e){}
    return '£'+n(v).toLocaleString(undefined,{maximumFractionDigits:1})+'m';
  }
  function bridgeState(){
    try{
      Object.defineProperty(window,'state',{configurable:true,enumerable:false,get:function(){ try{ return state; }catch(e){ return undefined; } },set:function(v){ try{ state=v; }catch(e){} }});
    }catch(e){}
  }
  function st(){ bridgeState(); try{ return state; }catch(e){ return window.state || null; } }
  function seasonNo(){ return Math.max(1,n(st()?.seasonNumber||1)); }
  function currentClub(){ return String(st()?.humanClub||''); }
  function ownerState(){
    const s=st(); if(!s) return null;
    s.managerOwner=s.managerOwner||{clubs:{}};
    s.managerOwner.clubs=s.managerOwner.clubs||{};
    s.managerOwner.cashOutLedger=s.managerOwner.cashOutLedger||{};
    return s.managerOwner;
  }
  function directCo(club=currentClub(), create=true){
    const o=ownerState(); club=String(club||currentClub()||'');
    if(!o || !club) return null;
    if(!o.clubs[club] && create) o.clubs[club]={club,stake:0,buyInPaid:0,totalInvested:0,lastPlan:null,shareHistory:[]};
    const co=o.clubs[club];
    if(co) co.shareHistory=Array.isArray(co.shareHistory)?co.shareHistory:[];
    return co||null;
  }
  function wealth(){
    const s=st(); if(!s) return {personalWealth:0,careerEarnings:0};
    s.managerWealth=s.managerWealth||{};
    s.managerWealth.personalWealth=round3(n(s.managerWealth.personalWealth));
    s.managerWealth.careerEarnings=round3(n(s.managerWealth.careerEarnings));
    return s.managerWealth;
  }
  function status(msg,type='good'){ try{ if(typeof setStatus==='function') setStatus(msg,type); }catch(e){} }
  function log(msg){ try{ if(typeof addLog==='function') addLog(msg); }catch(e){} }
  function save(){ try{ if(typeof saveGame==='function') saveGame(); }catch(e){} }
  function setVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; }); }catch(e){} }

  function classifyEvent(ev){
    const t=String(ev?.type||'').toLowerCase();
    const hasTo=Object.prototype.hasOwnProperty.call(ev||{},'to');
    const to=hasTo?n(ev.to):null;
    const from=Object.prototype.hasOwnProperty.call(ev||{},'from')?n(ev.from):null;
    if(t.includes('cash') || t.includes('sale') || t.includes('sold') || t.includes('fire-sale') || (hasTo && to===0 && from>0)) return 'sale';
    if(t.includes('buy') || t.includes('purchase') || t.includes('stake') || (hasTo && to>0)) return 'buy';
    return 'other';
  }
  function eventStamp(ev,index){ return (n(ev?.season)*1000000000) + n(ev?.at||0)/1000 + index; }
  function latestOwnershipEvent(co){
    const hist=Array.isArray(co?.shareHistory)?co.shareHistory:[];
    let latest=null;
    hist.forEach((h,i)=>{
      const kind=classifyEvent(h);
      if(kind==='other') return;
      const score=eventStamp(h,i);
      if(!latest || score>latest.score) latest={event:h,kind,score,index:i};
    });
    return latest;
  }
  function hasLaterBuy(co, ledger){
    const hist=Array.isArray(co?.shareHistory)?co.shareHistory:[];
    const ledgerSeason=n(ledger?.season);
    const ledgerAt=n(ledger?.at);
    return hist.some(h=>{
      if(classifyEvent(h)!=='buy') return false;
      const hs=n(h.season), ha=n(h.at);
      if(hs>ledgerSeason) return true;
      if(hs===ledgerSeason && ledgerAt && ha && ha>ledgerAt) return true;
      return false;
    });
  }
  function cashoutActiveForCo(club,currentCo){
    const o=ownerState(); const co=currentCo||directCo(club,false);
    club=String(club||currentClub()||'');
    if(!o || !co || !club) return false;
    const ledger=o.cashOutLedger?.[club];
    const latest=latestOwnershipEvent(co);
    if(latest && latest.kind==='buy'){
      // A later genuine buy-in should clear the old sale state.
      if(ledger && hasLaterBuy(co,ledger)) return false;
      if(!ledger) return false;
    }
    if(latest && latest.kind==='sale') return true;
    if(ledger && !hasLaterBuy(co,ledger)) return true;
    if((co.cashOutFinal || co.cashOutPermanent || co.cashOutCurrentStakeSold) && !hasLaterBuy(co,ledger||{})) return true;
    return false;
  }
  function applyCashoutDirect(club,currentCo){
    club=String(club||currentClub()||'');
    const co=currentCo||directCo(club,false);
    if(!co || !cashoutActiveForCo(club,co)) return false;
    const wasStake=n(co.stake);
    co.stake=0;
    co.buyInPaid=0;
    co.pendingPlan=null;
    co.lastPlan=null;
    co.decisionLocked=false;
    co.cashOutFinal=true;
    co.cashOutPermanent=true;
    co.cashOutCurrentStakeSold=true;
    const o=ownerState();
    if(o){
      o.pendingPlan=null;
      if(o.pendingBuyIn && o.pendingBuyIn.club===club) o.pendingBuyIn=null;
    }
    return wasStake>0;
  }
  function applyCashoutsAll(){
    const o=ownerState(); if(!o) return false;
    let changed=false;
    Object.keys(o.cashOutLedger||{}).forEach(club=>{ if(applyCashoutDirect(club)) changed=true; });
    Object.keys(o.clubs||{}).forEach(club=>{ if(applyCashoutDirect(club)) changed=true; });
    return changed;
  }
  function currentValue(club){
    let value=0;
    try{ if(typeof window.stage13aClubValue==='function') value=n(window.stage13aClubValue(club)); }catch(e){}
    if(value>0) return value;
    const co=directCo(club,false); const stake=n(co?.stake);
    if(stake>0 && n(co?.buyInPaid)>0) return round1(n(co.buyInPaid)/(stake/100));
    try{ if(typeof team==='function') value=n(team(club)?.budget||0)*5; }catch(e){}
    return value>0?value:100;
  }
  function decisionComplete(club=currentClub(), season=seasonNo()){
    try{ if(typeof window.stage13rOwnerDecisionComplete==='function' && window.stage13rOwnerDecisionComplete(club,season)) return true; }catch(e){}
    try{ if(typeof window.stage13qOwnerDecisionComplete==='function' && window.stage13qOwnerDecisionComplete(club,season)) return true; }catch(e){}
    const co=directCo(club,false); const lp=co?.lastPlan;
    if(lp && (lp.decisionLocked||lp.appliedImmediately||lp.paid) && (n(lp.season)===n(season)||n(lp.appliedSeason)===n(season))) return true;
    const sess=ownerState()?.boardroomSessions?.[String(club)+'::'+season];
    return !!(sess && sess.confirmed);
  }
  function renderAll(){
    setVersion();
    try{ if(typeof renderSeasonSummary==='function' && st()?.season?.roundIndex>=38) renderSeasonSummary(); else if(typeof render==='function') render(); }catch(e){}
    setTimeout(afterRender,30); setTimeout(afterRender,220);
  }

  // Safe replacement cash-out. Does not call stage13aClubOwner inside the persistence clear path.
  window.stage13aCashOutCurrentClub=function(){
    bridgeState(); applyCashoutsAll();
    const club=currentClub();
    if(!club){ status('No current club found for cash out.','bad'); return null; }
    const co=directCo(club,true);
    const stake=round1(n(co?.stake));
    if(stake<=0 || cashoutActiveForCo(club,co)){
      applyCashoutDirect(club,co); save(); afterRender();
      status('You do not currently own a stake in this club.', 'warn');
      return null;
    }
    if(decisionComplete(club,seasonNo())){
      status('Cash out is only available before this season’s owner boardroom decision. Your decision is already locked.','warn');
      afterRender();
      return null;
    }
    const value=currentValue(club);
    const payout=round1(value*(stake/100)*0.80);
    const w=wealth();
    w.personalWealth=round3(n(w.personalWealth)+payout);
    w.careerEarnings=round3(Math.max(n(w.careerEarnings),n(w.personalWealth)));
    co.shareHistory=Array.isArray(co.shareHistory)?co.shareHistory:[];
    const event={season:seasonNo(),club,from:stake,to:0,payout,type:'voluntary-cash-out',value,haircut:'80% voluntary sale value',at:Date.now()};
    co.shareHistory.push(event);
    co.stake=0; co.buyInPaid=0; co.lastPlan=null; co.pendingPlan=null; co.decisionLocked=false;
    co.cashOutFinal=true; co.cashOutPermanent=true; co.cashOutCurrentStakeSold=true; co.cashOutSeason=seasonNo();
    const o=ownerState();
    if(o){
      o.cashOutLedger=o.cashOutLedger||{};
      o.cashOutLedger[club]={club,season:seasonNo(),payout,stakeSold:stake,value,at:event.at,active:true};
      o.pendingPlan=null;
      if(o.pendingBuyIn && o.pendingBuyIn.club===club) o.pendingBuyIn=null;
      o.lastSale={club,payout,stake,method:'voluntary cash out',season:seasonNo(),value};
      o.boardroomSessions=o.boardroomSessions||{};
      const key=club+'::'+seasonNo();
      o.boardroomSessions[key]={key,club,season:seasonNo(),confirmed:true,confirmedAt:Date.now(),plan:{type:'cashout',label:'Voluntary cash out',club,season:seasonNo(),appliedSeason:seasonNo(),decisionLocked:true,appliedImmediately:true,paid:true,payout}};
    }
    status(`Sold your ${stake}% stake in ${club} for ${fmtMoney(payout)}.`, 'good');
    log(`<b>Manager-owner sale:</b> You sold your ${stake}% stake in ${esc(club)} for ${esc(fmtMoney(payout))} at the 80% voluntary cash-out rate.`);
    save(); renderAll();
    return {sold:true,club,stake,payout,value};
  };
  try{ stage13aCashOutCurrentClub=window.stage13aCashOutCurrentClub; }catch(e){}

  function clearLedgerAfterRealBuy(club){
    club=String(club||currentClub()||''); const co=directCo(club,false); const o=ownerState();
    if(!co || !o) return;
    const latest=latestOwnershipEvent(co);
    if(latest && latest.kind==='buy' && n(co.stake)>0){
      if(o.cashOutLedger) delete o.cashOutLedger[club];
      co.cashOutFinal=false; co.cashOutPermanent=false; co.cashOutCurrentStakeSold=false;
    }
  }
  ['stage13aBuyStake','stage13aSelectPendingBuyIn'].forEach(name=>{
    const old=window[name];
    if(typeof old!=='function' || old.__stage13wWrapped) return;
    const wrapped=function(){ const out=old.apply(this,arguments); try{ clearLedgerAfterRealBuy(String(arguments[0]||currentClub()||'')); save(); }catch(e){} return out; };
    wrapped.__stage13wWrapped=true; window[name]=wrapped; try{ eval(name+'=window["'+name+'"]'); }catch(e){}
  });

  // Safe stage13aClubOwner wrapper: never calls clubOwner/stage13aClubOwner inside the clear routine.
  const oldClubOwner=window.stage13aClubOwner;
  if(typeof oldClubOwner==='function' && !oldClubOwner.__stage13wWrapped){
    const wrapped=function(club){
      const co=oldClubOwner.apply(this,arguments);
      try{ applyCashoutDirect(String(club||currentClub()||''),co); }catch(e){}
      return co;
    };
    wrapped.__stage13wWrapped=true;
    window.stage13aClubOwner=wrapped;
    try{ stage13aClubOwner=wrapped; }catch(e){}
  }

  const oldStart=typeof window.startNextSeasonWithCurrentSquad==='function'?window.startNextSeasonWithCurrentSquad:null;
  if(oldStart && !oldStart.__stage13wWrapped){
    const wrappedStart=function(){
      bridgeState();
      try{ applyCashoutsAll(); save(); }catch(e){}
      const out=oldStart.apply(this,arguments);
      try{ applyCashoutsAll(); save(); setTimeout(afterRender,30); setTimeout(afterRender,250); }catch(e){}
      return out;
    };
    wrappedStart.__stage13wWrapped=true; window.startNextSeasonWithCurrentSquad=wrappedStart; try{ startNextSeasonWithCurrentSquad=wrappedStart; }catch(e){}
  }

  function afterRender(){
    bridgeState(); setVersion();
    let changed=false;
    try{ changed=applyCashoutsAll(); if(changed) save(); }catch(e){}
    try{
      const club=currentClub(); const co=directCo(club,false); const stake=n(co?.stake);
      if(stake<=0){
        document.querySelectorAll('#seasonSummary .stage13-development-card').forEach(el=>el.remove());
        document.querySelectorAll('button[onclick*="stage13aCashOutCurrentClub"]').forEach(btn=>{ btn.disabled=true; btn.classList.add('stage13t-cashout-disabled'); btn.title='You do not currently own a stake in this club.'; });
      }
    }catch(e){}
  }
  const oldRender=typeof window.render==='function'?window.render:null;
  if(oldRender && !oldRender.__stage13wWrapped){
    const wr=function(){ const out=oldRender.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    wr.__stage13wWrapped=true; window.render=wr; try{ render=wr; }catch(e){}
  }
  const oldSummary=typeof window.renderSeasonSummary==='function'?window.renderSeasonSummary:null;
  if(oldSummary && !oldSummary.__stage13wWrapped){
    const wr=function(){ const out=oldSummary.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    wr.__stage13wWrapped=true; window.renderSeasonSummary=wr; try{ renderSeasonSummary=wr; }catch(e){}
  }

  function boot(){ bridgeState(); setVersion(); try{ applyCashoutsAll(); }catch(e){} setTimeout(afterRender,100); setTimeout(afterRender,500); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
