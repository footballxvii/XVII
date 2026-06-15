/* Stage 13V: cash out season carryover fix.
   Treats share history and cash-out ledger as the source of truth so a sold stake cannot reappear next season. */
(function(){
  if(window.__stage13vCashoutSeasonCarryoverFix) return;
  window.__stage13vCashoutSeasonCarryoverFix = true;

  const VERSION='Version 13V · Beta';
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function round1(v){ return Math.round(n(v)*10)/10; }
  function esc(s){
    try{ if(typeof escapeHtml==='function') return escapeHtml(s); }catch(e){}
    return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  }
  function fmtMoney(v){
    try{ if(typeof money==='function') return money(n(v)); }catch(e){}
    return '£'+n(v).toLocaleString(undefined,{maximumFractionDigits:1})+'m';
  }
  function bridgeState(){
    try{ Object.defineProperty(window,'state',{configurable:true,enumerable:false,get:function(){ try{ return state; }catch(e){ return undefined; } },set:function(v){ try{ state=v; }catch(e){} }}); }catch(e){}
  }
  function s(){ bridgeState(); try{ return state; }catch(e){ return window.state || null; } }
  function seasonNo(){ return Math.max(1,n(s()?.seasonNumber||1)); }
  function currentClub(){ return String(s()?.humanClub||''); }
  function ownerState(){
    const st=s(); if(!st) return null;
    st.managerOwner=st.managerOwner||{clubs:{}};
    st.managerOwner.clubs=st.managerOwner.clubs||{};
    st.managerOwner.cashOutLedger=st.managerOwner.cashOutLedger||{};
    return st.managerOwner;
  }
  function rawClubOwner(club=currentClub()){
    const o=ownerState(); club=String(club||currentClub()||'');
    if(!o || !club) return null;
    if(!o.clubs[club]) o.clubs[club]={club,stake:0,buyInPaid:0,totalInvested:0,lastPlan:null,shareHistory:[]};
    o.clubs[club].shareHistory=Array.isArray(o.clubs[club].shareHistory)?o.clubs[club].shareHistory:[];
    return o.clubs[club];
  }
  function clubOwner(club=currentClub()){
    let co=null; club=String(club||currentClub()||'');
    try{ if(typeof window.stage13aClubOwner==='function') co=window.stage13aClubOwner(club); }catch(e){}
    if(!co) co=rawClubOwner(club);
    if(co) co.shareHistory=Array.isArray(co.shareHistory)?co.shareHistory:[];
    return co;
  }
  function wealth(){ const st=s(); if(!st) return {personalWealth:0,careerEarnings:0}; st.managerWealth=st.managerWealth||{}; st.managerWealth.personalWealth=round1(n(st.managerWealth.personalWealth)); st.managerWealth.careerEarnings=round1(n(st.managerWealth.careerEarnings)); return st.managerWealth; }
  function status(msg,type='good'){ try{ if(typeof setStatus==='function') setStatus(msg,type); }catch(e){} }
  function log(msg){ try{ if(typeof addLog==='function') addLog(msg); }catch(e){} }
  function save(){ try{ if(typeof saveGame==='function') saveGame(); }catch(e){} }
  function setVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; }); }catch(e){} }
  function decisionComplete(club=currentClub(), season=seasonNo()){
    try{ if(typeof window.stage13rOwnerDecisionComplete==='function' && window.stage13rOwnerDecisionComplete(club,season)) return true; }catch(e){}
    try{ if(typeof window.stage13qOwnerDecisionComplete==='function' && window.stage13qOwnerDecisionComplete(club,season)) return true; }catch(e){}
    const co=clubOwner(club); const lp=co?.lastPlan;
    if(lp && (lp.decisionLocked||lp.appliedImmediately||lp.paid) && (n(lp.season)===n(season)||n(lp.appliedSeason)===n(season))) return true;
    const sess=ownerState()?.boardroomSessions?.[String(club)+'::'+season];
    return !!(sess && sess.confirmed);
  }
  function classifyOwnershipEvent(ev){
    const t=String(ev?.type||'').toLowerCase();
    const hasTo=Object.prototype.hasOwnProperty.call(ev||{},'to');
    const to=hasTo?n(ev.to):null;
    const from=Object.prototype.hasOwnProperty.call(ev||{},'from')?n(ev.from):null;
    if(t.includes('cash') || t.includes('sale') || t.includes('sold') || t.includes('fire-sale') || (hasTo && to===0 && from>0)) return 'sale';
    if((hasTo && to>0) || t.includes('buy') || t.includes('purchase') || t.includes('stake')) return 'buy';
    return 'other';
  }
  function latestOwnershipEvent(co){
    const hist=Array.isArray(co?.shareHistory)?co.shareHistory:[];
    let latest=null;
    hist.forEach((h,i)=>{
      const kind=classifyOwnershipEvent(h);
      if(kind==='other') return;
      const score=(n(h.season)*1000000)+i;
      if(!latest || score>latest.score) latest={event:h,kind,index:i,score};
    });
    return latest;
  }
  function cashoutStillActive(club=currentClub()){
    const o=ownerState(); const co=clubOwner(club);
    if(!o || !co || !club) return false;
    const latest=latestOwnershipEvent(co);
    if(latest){
      if(latest.kind==='sale') return true;
      if(latest.kind==='buy') return false;
    }
    const ledger=o.cashOutLedger?.[club];
    if(ledger && n(ledger.season)>0) return true;
    if(co.cashOutPermanent || co.cashOutFinal || co.cashOutCurrentStakeSold) return true;
    return false;
  }
  function hardClearSoldStake(club=currentClub()){
    club=String(club||currentClub()||'');
    if(!club) return false;
    const o=ownerState(); const co=clubOwner(club);
    if(!o || !co || !cashoutStillActive(club)) return false;
    co.stake=0;
    co.buyInPaid=0;
    co.pendingPlan=null;
    co.lastPlan=null;
    co.decisionLocked=false;
    co.cashOutFinal=true;
    co.cashOutPermanent=true;
    co.cashOutCurrentStakeSold=true;
    o.pendingPlan=null;
    if(o.pendingBuyIn && o.pendingBuyIn.club===club) o.pendingBuyIn=null;
    return true;
  }
  function normaliseAllCashouts(){
    let changed=false;
    const o=ownerState(); if(!o) return false;
    Object.keys(o.cashOutLedger||{}).forEach(club=>{ if(hardClearSoldStake(club)) changed=true; });
    Object.keys(o.clubs||{}).forEach(club=>{ if(hardClearSoldStake(club)) changed=true; });
    return changed;
  }
  function currentValue(club){
    let value=0;
    try{ if(typeof window.stage13aClubValue==='function') value=n(window.stage13aClubValue(club)); }catch(e){}
    if(value>0) return value;
    const co=clubOwner(club); const st=n(co?.stake);
    if(st>0 && n(co?.buyInPaid)>0) return round1(n(co.buyInPaid)/(st/100));
    try{ if(typeof team==='function') value=n(team(club)?.budget||0)*5; }catch(e){}
    return value>0?value:100;
  }
  window.stage13aCashOutCurrentClub=function(){
    bridgeState(); normaliseAllCashouts();
    const club=currentClub();
    if(!club){ status('No current club found for cash out.','bad'); return null; }
    const co=clubOwner(club);
    const stake=round1(n(co?.stake));
    if(stake<=0 || cashoutStillActive(club)){
      hardClearSoldStake(club); save(); afterRender();
      status('You do not currently own a stake in this club.', 'warn');
      return null;
    }
    if(decisionComplete(club,seasonNo())){
      status('Cash out is only available before this season’s owner boardroom decision. Your decision is already locked.','warn');
      afterRender(); return null;
    }
    const value=currentValue(club);
    const payout=round1(value*(stake/100)*0.80);
    const w=wealth();
    w.personalWealth=round1(n(w.personalWealth)+payout);
    w.careerEarnings=round1(Math.max(n(w.careerEarnings),n(w.personalWealth)));
    co.shareHistory=Array.isArray(co.shareHistory)?co.shareHistory:[];
    co.shareHistory.push({season:seasonNo(),club,from:stake,to:0,payout,type:'voluntary-cash-out',value,haircut:'80% voluntary sale value',at:Date.now()});
    co.stake=0; co.buyInPaid=0; co.lastPlan=null; co.pendingPlan=null; co.decisionLocked=false;
    co.cashOutFinal=true; co.cashOutPermanent=true; co.cashOutCurrentStakeSold=true; co.cashOutSeason=seasonNo();
    const o=ownerState();
    if(o){
      o.cashOutLedger=o.cashOutLedger||{};
      o.cashOutLedger[club]={club,season:seasonNo(),payout,stakeSold:stake,value,at:Date.now(),historyLength:co.shareHistory.length,active:true};
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

  function clearCashoutAfterRealBuy(club=currentClub()){
    club=String(club||currentClub()||''); const o=ownerState(); const co=clubOwner(club);
    if(!o || !co) return;
    const latest=latestOwnershipEvent(co);
    if(latest && latest.kind==='buy' && n(co.stake)>0){
      if(o.cashOutLedger) delete o.cashOutLedger[club];
      co.cashOutFinal=false; co.cashOutPermanent=false; co.cashOutCurrentStakeSold=false;
    }
  }
  ['stage13aBuyStake','stage13aSelectPendingBuyIn'].forEach(name=>{
    const old=window[name];
    if(typeof old!=='function' || old.__stage13vWrapped) return;
    const wrapped=function(){ const out=old.apply(this,arguments); try{ clearCashoutAfterRealBuy(String(arguments[0]||currentClub()||'')); save(); }catch(e){} return out; };
    wrapped.__stage13vWrapped=true;
    window[name]=wrapped;
    try{ eval(name+'=window["'+name+'"]'); }catch(e){}
  });
  const oldClubOwner=window.stage13aClubOwner;
  if(typeof oldClubOwner==='function' && !oldClubOwner.__stage13vWrapped){
    const wrapped=function(club){ const co=oldClubOwner.apply(this,arguments); try{ hardClearSoldStake(String(club||currentClub()||'')); }catch(e){} return co; };
    wrapped.__stage13vWrapped=true;
    window.stage13aClubOwner=wrapped;
  }
  const oldStart=typeof window.startNextSeasonWithCurrentSquad==='function'?window.startNextSeasonWithCurrentSquad:null;
  if(oldStart && !oldStart.__stage13vWrapped){
    const wrappedStart=function(){
      bridgeState(); normaliseAllCashouts(); save();
      const out=oldStart.apply(this,arguments);
      try{ normaliseAllCashouts(); save(); setTimeout(afterRender,20); setTimeout(afterRender,200); }catch(e){}
      return out;
    };
    wrappedStart.__stage13vWrapped=true;
    window.startNextSeasonWithCurrentSquad=wrappedStart; try{ startNextSeasonWithCurrentSquad=wrappedStart; }catch(e){}
  }
  function renderAll(){ try{ if(typeof renderSeasonSummary==='function' && s()?.season?.roundIndex>=38) renderSeasonSummary(); else if(typeof render==='function') render(); }catch(e){} setTimeout(afterRender,30); setTimeout(afterRender,220); }
  function afterRender(){
    bridgeState(); setVersion(); const changed=normaliseAllCashouts(); if(changed) save();
    try{
      const club=currentClub(); const st=n(clubOwner(club)?.stake);
      if(st<=0){
        document.querySelectorAll('#seasonSummary .stage13-development-card').forEach(el=>el.remove());
        document.querySelectorAll('button[onclick*="stage13aCashOutCurrentClub"]').forEach(btn=>{ btn.disabled=true; btn.classList.add('stage13t-cashout-disabled'); btn.title='You do not currently own a stake in this club.'; });
      }
    }catch(e){}
  }
  const oldRender=typeof window.render==='function'?window.render:null;
  if(oldRender && !oldRender.__stage13vWrapped){ const wr=function(){ const out=oldRender.apply(this,arguments); try{ afterRender(); }catch(e){} return out; }; wr.__stage13vWrapped=true; window.render=wr; try{ render=wr; }catch(e){} }
  const oldSummary=typeof window.renderSeasonSummary==='function'?window.renderSeasonSummary:null;
  if(oldSummary && !oldSummary.__stage13vWrapped){ const wr=function(){ const out=oldSummary.apply(this,arguments); try{ afterRender(); }catch(e){} return out; }; wr.__stage13vWrapped=true; window.renderSeasonSummary=wr; try{ renderSeasonSummary=wr; }catch(e){} }
  function boot(){ bridgeState(); afterRender(); setTimeout(afterRender,100); setTimeout(afterRender,500); setInterval(()=>{ setVersion(); try{ normaliseAllCashouts(); }catch(e){} },1200); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
