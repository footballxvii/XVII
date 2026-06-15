/* Stage 13S: cash out and beta gold testing fix.
   Keeps the working 13R owner progression, fixes voluntary cash out, and makes the gold test button force 99 reputation. */
(function(){
  if(window.__stage13sCashoutAndBetaGoldFix) return;
  window.__stage13sCashoutAndBetaGoldFix = true;

  const VERSION = 'Version 13X · Beta';
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function round1(v){ return Math.round(n(v)*10)/10; }
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
  function realState(){ bridgeWindowState(); try{ return state; }catch(e){ return window.state || null; } }
  function seasonNo(){ const s=realState(); return Math.max(1,n(s?.seasonNumber||1)); }
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
    o.clubs=o.clubs||{};
    if(!o.clubs[club]) o.clubs[club]={club,stake:0,buyInPaid:0,lastPlan:null,shareHistory:[]};
    o.clubs[club].shareHistory=Array.isArray(o.clubs[club].shareHistory)?o.clubs[club].shareHistory:[];
    return o.clubs[club];
  }
  function wealth(){
    const s=realState();
    if(!s) return {personalWealth:0,careerEarnings:0};
    s.managerWealth=s.managerWealth||{};
    s.managerWealth.personalWealth=round1(n(s.managerWealth.personalWealth));
    s.managerWealth.careerEarnings=round1(n(s.managerWealth.careerEarnings));
    return s.managerWealth;
  }
  function save(){ try{ if(typeof saveGame==='function') saveGame(); }catch(e){} }
  function status(msg,type='good'){ try{ if(typeof setStatus==='function') setStatus(msg,type); }catch(e){} }
  function log(msg){ try{ if(typeof addLog==='function') addLog(msg); }catch(e){} }
  function setVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; }); }catch(e){} }
  function renderAll(){
    setVersion();
    try{ if(typeof renderSeasonSummary==='function' && realState()?.season?.roundIndex>=38) renderSeasonSummary(); else if(typeof render==='function') render(); }catch(e){}
    setTimeout(()=>{ try{ setVersion(); }catch(e){} },30);
  }
  function currentValue(club){
    let value=0;
    try{ if(typeof window.stage13aClubValue==='function') value=n(window.stage13aClubValue(club)); }catch(e){}
    if(value>0) return value;
    const co=clubOwner(club);
    const stake=n(co.stake);
    if(stake>0 && n(co.buyInPaid)>0) return round1(n(co.buyInPaid)/(stake/100));
    try{ if(typeof team==='function') value=n(team(club)?.budget||0)*5; }catch(e){}
    return value>0?value:100;
  }

  window.stage13aCashOutCurrentClub=function(){
    bridgeWindowState();
    const s=realState();
    const club=currentClub();
    if(!s || !club){ status('No current club found for cash out.','bad'); return null; }
    const co=clubOwner(club);
    const stake=round1(n(co.stake));
    if(stake<=0){ status('You do not currently own a stake in this club.','warn'); return null; }

    const value=currentValue(club);
    const gross=round1(value*(stake/100));
    const payout=round1(gross*0.80);
    const w=wealth();
    w.personalWealth=round1(n(w.personalWealth)+payout);
    w.careerEarnings=round1(Math.max(n(w.careerEarnings),n(w.personalWealth)));

    co.shareHistory=Array.isArray(co.shareHistory)?co.shareHistory:[];
    co.shareHistory.push({season:seasonNo(),club,from:stake,to:0,payout,type:'voluntary-cash-out',value,haircut:'80% voluntary sale value'});
    co.stake=0;
    co.buyInPaid=0;
    co.lastPlan=null;
    co.pendingPlan=null;
    co.decisionLocked=false;

    const o=ownerState();
    o.pendingPlan=null;
    o.lastSale={club,payout,stake,method:'voluntary cash out',season:seasonNo(),value};
    if(o.boardroomSessions){
      const key=String(club)+'::'+seasonNo();
      o.boardroomSessions[key]={key,club,season:seasonNo(),confirmed:true,confirmedAt:Date.now(),plan:{type:'cashout',label:'Voluntary cash out',club,season:seasonNo(),decisionLocked:true,appliedImmediately:true,paid:true,payout}};
    }

    status(`Sold your ${stake}% stake in ${club} for ${fmtMoney(payout)}.`, 'good');
    log(`<b>Manager-owner sale:</b> You sold your ${stake}% stake in ${esc(club)} for ${esc(fmtMoney(payout))} at the 80% voluntary cash-out rate.`);
    save();
    renderAll();
    return {sold:true,club,stake,payout,value};
  };
  try{ stage13aCashOutCurrentClub=window.stage13aCashOutCurrentClub; }catch(e){}

  window.stage13aBetaGold=function(){
    bridgeWindowState();
    const s=realState();
    if(!s){ status('No active game state found for beta gold.','bad'); return null; }
    let mp=null;
    try{ if(typeof managerProfile==='function') mp=managerProfile(); }catch(e){}
    if(!mp){ s.managerProfile=s.managerProfile||{}; mp=s.managerProfile; }
    mp.rating=99;
    mp.liveRating=99;
    mp.committedRating=99;
    mp.seasonBaseRating=99;
    mp.provisional=false;
    mp.liveDelta=0;
    mp.stage13aBeta='gold';
    if(s.season){
      s.season.managerRepBaseRating=99;
      s.season.liveManagerRepRating=99;
      if(s.season.managerRepRecorded){
        s.season.managerRepFinal=s.season.managerRepFinal||{};
        s.season.managerRepFinal.newRating=99;
      }
    }
    const w=wealth();
    w.personalWealth=Math.max(n(w.personalWealth),9999);
    w.careerEarnings=Math.max(n(w.careerEarnings),9999);
    const o=ownerState();
    o.unlocked=true;
    o.unlockSeason=seasonNo();
    o.goldSeenSeason=seasonNo();
    o.lastEvent='gold-unlock';
    status('Beta test applied: reputation 99, gold manager-owner unlock and £9,999m personal wealth.', 'good');
    log('<b>Beta test:</b> Manager reputation forced to 99 with gold owner unlock and £9,999m personal wealth.');
    save();
    renderAll();
    return {gold:true,rating:99,wealth:n(w.personalWealth)};
  };
  try{ stage13aBetaGold=window.stage13aBetaGold; }catch(e){}

  function boot(){ bridgeWindowState(); setVersion(); setInterval(setVersion,1000); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
