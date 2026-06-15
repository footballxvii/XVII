/* Stage 13P: Owner boardroom state fix.
   Freezes board proposals per club/season, prevents repeat-click unit gains,
   makes 51% confirmations exact, unlocks next season properly, and fixes voluntary cash out. */
(function(){
  if(window.__stage13pOwnerBoardroomStateFix) return;
  window.__stage13pOwnerBoardroomStateFix = true;

  const VERSION = 'Version 13W · Beta';
  const CATEGORIES = ['training','stadium','commercial','youth','global'];
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
  function safeId(s){ return String(s==null?'':s).replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'') || 'club'; }
  function seasonNo(){ return n(window.state?.seasonNumber || 1); }
  function currentClub(){ return window.state?.humanClub || ''; }
  function ownerState(){
    try{ if(typeof window.stage13aOwnerState==='function') return window.stage13aOwnerState(); }catch(e){}
    window.state = window.state || {};
    state.managerOwner = state.managerOwner || {clubs:{}};
    state.managerOwner.clubs = state.managerOwner.clubs || {};
    return state.managerOwner;
  }
  function clubOwner(club){
    club = String(club || currentClub() || '');
    try{ if(typeof window.stage13aClubOwner==='function') return window.stage13aClubOwner(club); }catch(e){}
    const o=ownerState();
    o.clubs = o.clubs || {};
    if(!o.clubs[club]) o.clubs[club] = {club,stake:0,units:{training:4,stadium:4,commercial:4,youth:4,global:4},lastPlan:null,shareHistory:[]};
    return o.clubs[club];
  }
  function currentStake(club=currentClub()){ return n(clubOwner(club)?.stake); }
  function wealth(){
    window.state = window.state || {};
    state.managerWealth = state.managerWealth || {};
    state.managerWealth.personalWealth = round1(n(state.managerWealth.personalWealth));
    state.managerWealth.careerEarnings = round1(n(state.managerWealth.careerEarnings));
    return state.managerWealth;
  }
  function humanTeam(club){
    club = String(club || currentClub() || '');
    try{ if(typeof team==='function') return team(club); }catch(e){}
    try{ return state.teams?.[club] || null; }catch(e){ return null; }
  }
  function save(){ try{ if(typeof saveGame==='function') saveGame(); }catch(e){} }
  function status(msg,type='good'){ try{ if(typeof setStatus==='function') setStatus(msg,type); }catch(e){} }
  function log(msg){ try{ if(typeof addLog==='function') addLog(msg); }catch(e){} }
  function decisionKey(club=currentClub()){ return String(club||'')+'::'+seasonNo(); }
  function sessions(){ const o=ownerState(); o.boardroomSessions = o.boardroomSessions || {}; return o.boardroomSessions; }
  function session(club=currentClub()){
    const key=decisionKey(club);
    const map=sessions();
    if(!map[key]) map[key]={key,club:String(club||''),season:seasonNo(),createdAt:Date.now(),confirmed:false};
    return map[key];
  }
  function isCurrentDecisionComplete(club=currentClub()){
    const key=decisionKey(club);
    const s=sessions()[key];
    const lp=clubOwner(club)?.lastPlan;
    return !!((s && s.confirmed) || (lp && lp.decisionKey===key && lp.decisionLocked && n(lp.appliedSeason)===seasonNo()));
  }
  function freezePlans(club=currentClub()){
    const s=session(club);
    if(s.plans && s.boardType) return s;
    let opts={};
    try{ if(typeof window.stage13cBoardroomPlanOptions==='function') opts=window.stage13cBoardroomPlanOptions(club) || {}; }catch(e){}
    let boardPlan=null;
    try{ if(typeof window.stage13cBoardRecommendedPlan==='function') boardPlan=window.stage13cBoardRecommendedPlan(club); }catch(e){}
    const boardType=boardPlan?.type || 'maintenance';
    s.plans={
      improve:opts.improve || boardPlan || {type:'maintenance',label:'Reinvest and maintain',ownerShare:0,buyUnits:0,unitDecay:0,transferBudgetBonus:0},
      maintenance:opts.maintenance || {type:'maintenance',label:'Reinvest and maintain',ownerShare:0,buyUnits:0,unitDecay:0,transferBudgetBonus:0},
      transfer:opts.transfer || {type:'transfer',label:'Move money to transfer budget',ownerShare:0,buyUnits:0,unitDecay:5,transferBudgetBonus:0},
      balanced:opts.balanced || {type:'balanced',label:'Maintenance plus transfer funds',ownerShare:0,buyUnits:0,unitDecay:0,transferBudgetBonus:0}
    };
    s.boardType=boardType;
    s.boardPlan=s.plans[boardType] || boardPlan || s.plans.maintenance;
    return s;
  }
  function forcedContributionLimit(){
    const personal=n(wealth().personalWealth);
    if(personal<=2) return 0;
    return round1(Math.max(0, Math.min(personal*0.18, personal-2)));
  }
  function planSafe(plan, stake=currentStake()){
    const share=n(plan?.ownerShare);
    if(share<=0) return true;
    const personal=n(wealth().personalWealth);
    if(stake>=51) return personal+0.0001>=share;
    return personal+0.0001>=share && share<=forcedContributionLimit();
  }
  function maintenancePlan(club){
    let opts={};
    try{ if(typeof window.stage13cBoardroomPlanOptions==='function') opts=window.stage13cBoardroomPlanOptions(club) || {}; }catch(e){}
    return opts.maintenance || {type:'maintenance',label:'Reinvest and maintain',ownerShare:0,boardShare:0,buyUnits:0,unitDecay:0,transferBudgetBonus:0,focusCategory:null,focusLabel:'Maintenance'};
  }
  function ensureAffordablePlan(club, plan, stake=currentStake(club)){
    if(planSafe(plan, stake)) return {...plan};
    const m={...maintenancePlan(club)};
    m.label='Maintenance only';
    m.downgradedFrom=plan?.label || 'larger proposal';
    m.voteResult=plan?.voteResult || 'Affordability protection';
    m.summary='The larger proposal was unaffordable, so the club defaulted to essential maintenance.';
    return m;
  }
  function removeUnits(club, count){
    count=Math.max(0,Math.round(n(count)));
    if(count<=0) return 0;
    const co=clubOwner(club);
    co.units = co.units || {training:4,stadium:4,commercial:4,youth:4,global:4};
    let lost=0;
    while(count>0){
      let best=null;
      for(const k of CATEGORIES){
        const val=n(co.units[k]);
        if(val>0 && (!best || val>n(co.units[best]))) best=k;
      }
      if(!best) break;
      co.units[best]=Math.max(0,Math.round(n(co.units[best]))-1);
      lost++; count--;
    }
    return lost;
  }
  function addUnits(club, count, focus){
    count=Math.max(0,Math.round(n(count)));
    if(count<=0) return 0;
    const before=unitTotal(club);
    try{ if(typeof window.stage13aAddUnitsToClub==='function') window.stage13aAddUnitsToClub(club,count,focus||null); }
    catch(e){
      const co=clubOwner(club);
      co.units = co.units || {training:4,stadium:4,commercial:4,youth:4,global:4};
      const order=[focus].concat(CATEGORIES).filter(Boolean);
      let remaining=count;
      for(const k of order){
        if(!CATEGORIES.includes(k)) continue;
        while(remaining>0 && n(co.units[k])<10){ co.units[k]=Math.round(n(co.units[k]))+1; remaining--; }
      }
    }
    return Math.max(0,unitTotal(club)-before);
  }
  function unitTotal(club){
    try{ if(typeof window.stage13aUnitEconomy==='function') return n(window.stage13aUnitEconomy(club)?.units); }catch(e){}
    const u=clubOwner(club).units || {};
    return CATEGORIES.reduce((s,k)=>s+Math.max(0,Math.min(10,Math.round(n(u[k])))),0);
  }
  function stampComplete(club, plan){
    const o=ownerState();
    const co=clubOwner(club);
    const s=session(club);
    const key=decisionKey(club);
    const lp={...plan,club,season:seasonNo(),appliedSeason:seasonNo(),decisionKey:key,decisionLocked:true,appliedImmediately:true,paid:true};
    co.lastPlan=lp;
    o.pendingPlan=null;
    o.lastAppliedSeason=seasonNo();
    s.confirmed=true;
    s.confirmedAt=Date.now();
    s.plan=lp;
    return lp;
  }
  function applyPlanOnce(club, rawPlan, reason='Owner boardroom decision'){
    club=String(club||currentClub()||'');
    if(!club) return null;
    if(isCurrentDecisionComplete(club)){
      const lp=clubOwner(club).lastPlan || session(club).plan || {};
      status('Owner boardroom decision is already confirmed and locked for this season.','warn');
      lockOwnerDom(club, lp);
      unlockNextSeasonVisual(club);
      return {alreadyLocked:true,plan:lp};
    }
    const stake=currentStake(club);
    let plan=ensureAffordablePlan(club,{...(rawPlan||maintenancePlan(club)),reason},stake);
    let downgraded=!!plan.downgradedFrom;
    const w=wealth();
    const share=round1(n(plan.ownerShare));
    if(share>0){
      if(n(w.personalWealth)+0.0001<share){
        plan={...maintenancePlan(club),label:'Maintenance only',downgradedFrom:plan.label,voteResult:'Affordability protection'};
        downgraded=true;
      }else{
        w.personalWealth=round1(n(w.personalWealth)-share);
      }
    }
    const lost=removeUnits(club,n(plan.unitDecay));
    const added=addUnits(club,n(plan.buyUnits),plan.focusCategory);
    const budgetAdded=round1(n(plan.transferBudgetBonus));
    if(budgetAdded>0){
      const t=humanTeam(club);
      if(t) t.budget=round1(n(t.budget)+budgetAdded);
    }
    const co=clubOwner(club);
    co.totalInvested=round1(n(co.totalInvested)+share);
    co.lastTransferRevenue=budgetAdded;
    const finalPlan=stampComplete(club,{...plan,ownerShare:share,unitsLost:lost,budgetAdded,addedUnits:added,downgraded,decisionLocked:true,appliedImmediately:true,reason});
    log(`<b>Owner boardroom decision:</b> ${esc(club)} confirmed ${esc(finalPlan.label || 'owner decision')}. ${share>0?`You paid ${esc(fmtMoney(share))}. `:''}${budgetAdded>0?`${esc(fmtMoney(budgetAdded))} moved into the transfer budget. `:''}${added>0?`Club development rose by ${added} unit${added===1?'':'s'}. `:''}${lost>0?`Club development lost ${lost} unit${lost===1?'':'s'}.`:''}`);
    status(`${finalPlan.label || 'Owner decision'} confirmed and locked. You may now start next season.`, downgraded?'warn':'good');
    save();
    lockOwnerDom(club, finalPlan);
    unlockNextSeasonVisual(club);
    setTimeout(()=>{ try{ if(typeof renderSeasonSummary==='function') renderSeasonSummary(); lockOwnerDom(club, finalPlan); unlockNextSeasonVisual(club); }catch(e){} },0);
    return {paid:true,plan:finalPlan,lost,budgetAdded,added,downgraded};
  }
  function readControllerSelection(club){
    const prefix='stage13l_'+safeId(club);
    const decision=document.getElementById(prefix+'_decision')?.value || 'maintenance';
    const focus=document.getElementById(prefix+'_focus')?.value || null;
    let units=Math.round(n(document.getElementById(prefix+'_units')?.value));
    let inject=n(document.getElementById(prefix+'_inject')?.value);
    const maxAff=typeof window.stage13lAffordableImprovementMax==='function' ? n(window.stage13lAffordableImprovementMax(club,focus)) : units;
    units=Math.max(0,Math.min(units,maxAff));
    inject=Math.max(0,Math.min(inject,n(wealth().personalWealth)));
    return {decision,focus,units,inject};
  }
  function planFromController(club, sel){
    try{ if(typeof window.stage13lControllerPlanFromSelection==='function') return window.stage13lControllerPlanFromSelection(club,sel.decision,sel.units,sel.focus,sel.inject); }catch(e){}
    if(sel.decision==='improve' && typeof window.stage13aPlanCostCustom==='function') return window.stage13aPlanCostCustom(club,sel.units,null,'improve',sel.focus);
    const opts=typeof window.stage13cBoardroomPlanOptions==='function' ? window.stage13cBoardroomPlanOptions(club) : {};
    return opts?.[sel.decision] || opts?.maintenance || maintenancePlan(club);
  }
  window.stage13lConfirmOwnerDecision=function(club){
    club=String(club||currentClub()||'');
    if(!club) return null;
    if(isCurrentDecisionComplete(club)) return applyPlanOnce(club, clubOwner(club).lastPlan, 'Already locked');
    const sel=readControllerSelection(club);
    const plan=planFromController(club,sel);
    return applyPlanOnce(club,{...plan,preferredType:sel.decision,boardType:'controller',voteResult:'Controlling owner decision'},'Controlling owner decision');
  };
  try{ stage13lConfirmOwnerDecision=window.stage13lConfirmOwnerDecision; }catch(e){}

  window.stage13aVoteDevelopmentPlan=function(club,preferredType){
    club=String(club||currentClub()||'');
    if(!club) return null;
    if(isCurrentDecisionComplete(club)) return applyPlanOnce(club, clubOwner(club).lastPlan, 'Already locked');
    const stake=currentStake(club);
    const s=freezePlans(club);
    const boardType=s.boardType || 'maintenance';
    const plans=s.plans || {};
    let finalType=boardType;
    let voteResult='Board recommendation accepted';
    preferredType=String(preferredType||boardType);
    if(stake>=51){ finalType=preferredType; voteResult='Controlling owner decision'; }
    else if(stake>0){
      if(preferredType===boardType){ finalType=boardType; voteResult='You supported the board recommendation'; }
      else{
        const won=(Math.random()*100)<stake;
        finalType=won ? preferredType : boardType;
        voteResult=won ? `Your ${stake}% owner vote swung the board` : `Board vote went against your ${stake}% stake`;
      }
    }
    const raw={...(plans[finalType] || plans.maintenance || maintenancePlan(club)), boardType, preferredType, voteResult};
    return applyPlanOnce(club, raw, voteResult);
  };
  try{ stage13aVoteDevelopmentPlan=window.stage13aVoteDevelopmentPlan; }catch(e){}

  window.stage13aSetCustomDevelopmentPlan=function(club,buyUnits,focusCategory){
    club=String(club||currentClub()||'');
    let units=Math.round(n(buyUnits));
    const maxAff=typeof window.stage13lAffordableImprovementMax==='function' ? n(window.stage13lAffordableImprovementMax(club,focusCategory)) : units;
    units=Math.max(0,Math.min(units,maxAff));
    let plan=null;
    try{ if(typeof window.stage13aPlanCostCustom==='function') plan=window.stage13aPlanCostCustom(club,units,null,'improve',focusCategory||null); }catch(e){}
    return applyPlanOnce(club,{...(plan||maintenancePlan(club)),preferredType:'improve',boardType:'controller',voteResult:'Controlling owner decision'},'Controlling owner decision');
  };
  try{ stage13aSetCustomDevelopmentPlan=window.stage13aSetCustomDevelopmentPlan; }catch(e){}

  window.stage13aCashOutCurrentClub=function(){
    const club=currentClub();
    if(!club) return null;
    const co=clubOwner(club);
    const stake=n(co.stake);
    if(stake<=0){ status('You do not currently own a stake in this club.','warn'); return null; }
    let value=0;
    try{ if(typeof window.stage13aClubValue==='function') value=n(window.stage13aClubValue(club)); }catch(e){}
    if(value<=0) value=100;
    const payout=round1(value*(stake/100)*0.80);
    const w=wealth();
    w.personalWealth=round1(n(w.personalWealth)+payout);
    w.careerEarnings=Math.max(n(w.careerEarnings),n(w.personalWealth));
    co.shareHistory=Array.isArray(co.shareHistory)?co.shareHistory:[];
    co.shareHistory.push({season:seasonNo(),club,from:stake,to:0,payout,type:'voluntary-sale',value});
    co.stake=0;
    co.buyInPaid=0;
    co.lastPlan=null;
    const o=ownerState();
    o.lastSale={club,payout,method:'voluntary cash out',season:seasonNo()};
    o.pendingPlan=null;
    status(`Sold your ${stake}% stake in ${club} for ${fmtMoney(payout)}.`,'good');
    log(`<b>Manager-owner sale:</b> You sold your ${stake}% stake in ${esc(club)} for ${esc(fmtMoney(payout))}.`);
    save();
    unlockNextSeasonVisual(club);
    setTimeout(()=>{ try{ if(typeof renderSeasonSummary==='function') renderSeasonSummary(); else if(typeof render==='function') render(); }catch(e){} },0);
    return {sold:true,payout,stake};
  };
  try{ stage13aCashOutCurrentClub=window.stage13aCashOutCurrentClub; }catch(e){}

  function lockOwnerDom(club=currentClub(), plan=null){
    if(!isCurrentDecisionComplete(club)) return;
    const p=plan || clubOwner(club).lastPlan || session(club).plan || {};
    try{
      document.querySelectorAll('.stage13-development-card').forEach(card=>{
        card.classList.add('locked','stage13p-locked');
        card.querySelectorAll('select,input').forEach(el=>{ el.disabled=true; el.setAttribute('aria-disabled','true'); });
        card.querySelectorAll('button').forEach(btn=>{
          const attr=String(btn.getAttribute('onclick')||'');
          if(/stage13aCashOutCurrentClub/.test(attr)) return;
          btn.disabled=true; btn.setAttribute('aria-disabled','true');
        });
        let note=card.querySelector('.stage13p-lock-note');
        if(!note){ note=document.createElement('div'); note.className='stage13p-lock-note'; card.appendChild(note); }
        note.innerHTML=`<b>Decision confirmed.</b> ${esc(p.label||'Owner boardroom decision')} is locked for this season. You may now start next season.`;
      });
    }catch(e){}
  }
  function unlockNextSeasonVisual(club=currentClub()){
    try{
      if(currentStake(club)>0 && !isCurrentDecisionComplete(club)) return;
      const warn=document.getElementById('stage13fOwnerLockWarning');
      if(warn) warn.remove();
      document.querySelectorAll('#seasonSummary .next-season-main-btn').forEach(btn=>{
        btn.disabled=false;
        btn.classList.remove('secondary');
        btn.classList.add('good');
        btn.title=currentStake(club)>0?'Owner boardroom decision confirmed. You can start next season.':'You can start next season.';
      });
    }catch(e){}
  }
  function injectStyles(){
    if(document.getElementById('stage13p-style')) return;
    const st=document.createElement('style');
    st.id='stage13p-style';
    st.textContent=`
      .stage13-development-card.stage13p-locked select,
      .stage13-development-card.stage13p-locked input,
      .stage13-development-card.stage13p-locked button:not([onclick*="stage13aCashOutCurrentClub"]){pointer-events:none!important;opacity:.55!important;}
      .stage13p-lock-note{margin-top:8px;border:1px solid rgba(51,214,159,.38);background:rgba(51,214,159,.10);color:#d8fff0;border-radius:10px;padding:8px 9px;font-size:9px;line-height:1.35;font-weight:850;}
    `;
    document.head.appendChild(st);
  }
  function setLatestVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{v.textContent=VERSION;}); }catch(e){} }
  function afterRender(){
    injectStyles();
    setLatestVersion();
    const club=currentClub();
    if(club && isCurrentDecisionComplete(club)){ lockOwnerDom(club); unlockNextSeasonVisual(club); }
  }

  const oldStart=typeof window.startNextSeasonWithCurrentSquad==='function' ? window.startNextSeasonWithCurrentSquad : null;
  if(oldStart && !window.__stage13pStartPatch){
    window.__stage13pStartPatch=true;
    window.startNextSeasonWithCurrentSquad=function(){
      try{
        const club=currentClub();
        if(club && state?.started && state?.season && n(state.season.roundIndex)>=38 && !state?.pendingJobAppointment?.to && currentStake(club)>0){
          if(!isCurrentDecisionComplete(club)){
            status('Confirm an owner boardroom decision before starting next season.','bad');
            try{ if(typeof renderSeasonSummary==='function') renderSeasonSummary(); }catch(e){}
            return;
          }
          const lp=stampComplete(club,clubOwner(club).lastPlan || session(club).plan || maintenancePlan(club));
          lockOwnerDom(club,lp);
          unlockNextSeasonVisual(club);
        }
      }catch(e){}
      return oldStart.apply(this,arguments);
    };
    try{ startNextSeasonWithCurrentSquad=window.startNextSeasonWithCurrentSquad; }catch(e){}
  }
  const oldRender=typeof window.render==='function' ? window.render : null;
  if(oldRender && !window.__stage13pRenderPatch){
    window.__stage13pRenderPatch=true;
    window.render=function(){ const out=oldRender.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    try{ render=window.render; }catch(e){}
  }
  const oldSummary=typeof window.renderSeasonSummary==='function' ? window.renderSeasonSummary : null;
  if(oldSummary && !window.__stage13pSummaryPatch){
    window.__stage13pSummaryPatch=true;
    window.renderSeasonSummary=function(){ const out=oldSummary.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    try{ renderSeasonSummary=window.renderSeasonSummary; }catch(e){}
  }
  function boot(){ afterRender(); setTimeout(afterRender,80); setTimeout(afterRender,300); setInterval(setLatestVersion,1000); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
