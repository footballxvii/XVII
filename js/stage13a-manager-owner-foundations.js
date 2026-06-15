/* Stage 13A: Manager-Owner Foundations.
   Personal wealth can buy a stake in the current club or a job-offer club.
   Club development is intentionally simple under the hood: five visible categories, one hidden 0-50 health score. */
(function(){
  if(window.__stage13aManagerOwnerFoundations) return;
  window.__stage13aManagerOwnerFoundations=true;

  const VERSION='Version 13F · Beta';
  const OWNER_UNLOCK_RATING=90;
  const SILVER_RATING=80;
  const TARGET_STAKES=[5,25,51];
  const CATEGORIES=[
    ['training','Training ground'],
    ['stadium','Stadium and matchday'],
    ['commercial','Commercial department'],
    ['youth','Youth and recruitment'],
    ['global','Global promotion']
  ];

  function el(id){ return document.getElementById(id); }
  function esc(s){
    if(typeof escapeHtml==='function') return escapeHtml(s);
    return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function jsArg(s){ return "'"+String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'"; }
  function safeId(s){ return String(s==null?'':s).replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'') || 'club'; }
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function round1(v){ return Math.round(n(v)*10)/10; }
  function round3(v){ return Math.round(n(v)*1000)/1000; }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, n(v))); }
  function fmtMoney(v){
    const x=n(v);
    if(Math.abs(x)>0 && Math.abs(x)<1) return '£'+Math.round(x*1000).toLocaleString()+'k';
    return '£'+x.toLocaleString(undefined,{maximumFractionDigits:1})+'m';
  }
  function m(v){ try{ return typeof money==='function'?money(v):fmtMoney(v); }catch(e){ return fmtMoney(v); } }
  function profile(){
    try{ return managerProfile(); }catch(e){
      state.managerProfile=state.managerProfile || {rating:26,history:[]};
      return state.managerProfile;
    }
  }
  function managerRating(){ return Math.round(n(profile().rating||0)); }
  function wealth(){
    state.managerWealth=state.managerWealth || {};
    const w=state.managerWealth;
    w.personalWealth=round3(w.personalWealth);
    w.careerEarnings=round3(w.careerEarnings);
    w.careerBonuses=round3(w.careerBonuses);
    w.settlements=Array.isArray(w.settlements)?w.settlements:[];
    w.salaryHistory=Array.isArray(w.salaryHistory)?w.salaryHistory:[];
    return w;
  }
  function addWealth(amount){
    const w=wealth();
    w.personalWealth=round3(n(w.personalWealth)+n(amount));
    w.careerEarnings=round3(Math.max(n(w.careerEarnings), n(w.personalWealth)));
    return w.personalWealth;
  }
  function spendWealth(amount){
    const w=wealth();
    amount=round3(amount);
    if(n(w.personalWealth)+0.0001<amount) return false;
    w.personalWealth=round3(n(w.personalWealth)-amount);
    return true;
  }
  function clubInfo(club){
    try{ if(typeof stage9ClubInfo==='function') return stage9ClubInfo(club); }catch(e){}
    try{ return CLUBS.find(c=>c.club===club) || null; }catch(e){}
    return null;
  }
  function clubDivision(club){
    try{ if(typeof stage9ClubDivision==='function') return stage9ClubDivision(club); }catch(e){}
    const info=clubInfo(club);
    return info?.division || state?.currentDivision || 'top';
  }
  function clubByName(club){
    try{ return CLUBS.find(c=>c.club===club) || clubInfo(club); }catch(e){ return clubInfo(club); }
  }
  function startingTransferBudget(club){
    const info=clubInfo(club);
    if(info && n(info.manualTransferBudget)>0) return n(info.manualTransferBudget);
    const c=clubByName(club);
    const raw=n(c?.budget);
    const bp=(typeof BUDGET_PERCENT!=='undefined')?n(BUDGET_PERCENT):0.15;
    return Math.max(1, raw*bp);
  }
  function baseUnitCost(club){
    return round1(clamp(startingTransferBudget(club)*0.04, 0.5, 8));
  }
  function blankUnits(){
    return {training:4, stadium:4, commercial:4, youth:4, global:4};
  }
  function totalUnits(u){
    u=u||blankUnits();
    return CATEGORIES.reduce((s,[k])=>s+clamp(Math.round(n(u[k])),0,10),0);
  }
  function normaliseUnits(u){
    const out={...blankUnits(), ...(u||{})};
    CATEGORIES.forEach(([k])=>out[k]=clamp(Math.round(n(out[k])),0,10));
    return out;
  }
  function unitValue(units,key){
    const u=normaliseUnits(units||{});
    return clamp(Math.round(n(u[key])),0,10);
  }
  function categoryBonusesFromUnits(units){
    const u=normaliseUnits(units||{});
    const training=unitValue(u,'training');
    const stadium=unitValue(u,'stadium');
    const commercial=unitValue(u,'commercial');
    const youth=unitValue(u,'youth');
    const global=unitValue(u,'global');
    const revenueMultiplier=round3(Math.max(0.65, 1 + ((commercial-4)*0.025) + ((stadium-4)*0.010)));
    return {
      trainingDiscount:round3(Math.min(0.25, training*0.025)),
      assistantDiscount:round3(Math.min(0.20, stadium*0.020)),
      scoutingDiscount:round3(Math.min(0.25, youth*0.025)),
      revenueMultiplier,
      globalPullBonus:Math.max(0,Math.min(3,Math.floor(Math.max(0,global-4)/2))),
      training,stadium,commercial,youth,global
    };
  }
  function categoryBonuses(club){ return categoryBonusesFromUnits(clubOwner(club).units); }
  function seededHash(str){
    str=String(str||''); let h=2166136261;
    for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
    return (h>>>0);
  }
  function seededUnit(str){ return (seededHash(str)%1000000)/1000000; }
  function seededInt(str,min,max){ min=Math.round(n(min)); max=Math.round(n(max)); if(max<=min) return min; return min + (seededHash(str)%(max-min+1)); }
  function boardPersonality(club){
    const exact={
      'Wrexham':'ambitious','Swindon Town':'ambitious','Manchester City':'ambitious','Arsenal':'ambitious','Liverpool':'ambitious','Chelsea':'ambitious','Manchester United':'ambitious','Newcastle United':'ambitious',
      'Brighton & Hove Albion':'development','Brentford':'development','Forest Green Rovers':'development','Leicester City':'ambitious','Southampton':'ambitious','Middlesbrough':'ambitious','Norwich City':'ambitious','West Bromwich Albion':'ambitious',
      'Yeovil Town':'cautious','Scunthorpe United':'cautious','Hartlepool United':'cautious','Southend United':'cautious','Walsall':'conservative','Tranmere Rovers':'conservative','Oldham Athletic':'conservative','Chesterfield':'development',
      'Tottenham Hotspur':'transfer','West Ham United':'transfer','Aston Villa':'ambitious','Crystal Palace':'conservative','Everton':'conservative','Burnley':'cautious','Leeds United':'ambitious','Sunderland':'ambitious','Wolverhampton Wanderers':'conservative','Fulham':'conservative','AFC Bournemouth':'development','Nottingham Forest':'ambitious','Huddersfield Town':'ambitious','Luton Town':'cautious','Reading':'conservative','Bradford City':'ambitious'
    };
    const id=exact[club] || (startingTransferBudget(club)>=80?'ambitious':startingTransferBudget(club)<=5?'cautious':seededUnit('personality|'+club)<0.35?'conservative':'development');
    const map={
      ambitious:{id:'ambitious',label:'Ambitious board',summary:'Likely to push growth, bigger improvement plans and occasional extra transfer money.',weights:{improve:45,transfer:25,balanced:20,maintenance:10},focus:['global','commercial','stadium','training']},
      conservative:{id:'conservative',label:'Conservative board',summary:'Prefers protecting the club first, with careful reinvestment rather than risky spending.',weights:{improve:15,transfer:5,balanced:35,maintenance:45},focus:['stadium','training','youth','commercial']},
      development:{id:'development',label:'Development-first board',summary:'More likely to build facilities, recruitment and long-term club infrastructure.',weights:{improve:55,transfer:5,balanced:25,maintenance:15},focus:['training','youth','commercial','stadium']},
      transfer:{id:'transfer',label:'Transfer-hungry board',summary:'Likes giving the manager more player money, even if it risks underinvestment.',weights:{improve:20,transfer:40,balanced:25,maintenance:15},focus:['global','commercial','stadium','youth']},
      cautious:{id:'cautious',label:'Cautious survival board',summary:'Avoids big bills unless the club is safe and the money is clearly there.',weights:{improve:10,transfer:5,balanced:30,maintenance:55},focus:['stadium','commercial','training','youth']}
    };
    return map[id] || map.development;
  }
  function categoryLabel(key){ const f=CATEGORIES.find(([k])=>k===key); return f?f[1]:'Balanced development'; }
  function boardFocusCategory(club){
    const p=boardPersonality(club);
    const arr=p.focus || CATEGORIES.map(([k])=>k);
    return arr[seededHash('focus|'+club+'|'+n(state?.seasonNumber||1))%arr.length] || 'commercial';
  }
  function proposedImproveUnits(club,maxBuy){
    maxBuy=Math.max(0,Math.round(n(maxBuy)));
    if(maxBuy<=0) return 0;
    const p=boardPersonality(club);
    let r=seededUnit('improveUnits|'+club+'|'+n(state?.seasonNumber||1));
    let amount;
    if(p.id==='ambitious'){
      if(r<0.50) amount=seededInt('iu-a|'+club,3,5); else if(r<0.68) amount=seededInt('iu-b|'+club,1,2); else if(r<0.82) amount=6; else if(r<0.96) amount=seededInt('iu-c|'+club,7,9); else amount=10;
    } else if(p.id==='cautious' || p.id==='conservative'){
      if(r<0.42) amount=seededInt('iu-d|'+club,1,2); else if(r<0.78) amount=seededInt('iu-e|'+club,3,5); else if(r<0.91) amount=6; else if(r<0.99) amount=seededInt('iu-f|'+club,7,9); else amount=10;
    } else {
      if(r<0.45) amount=seededInt('iu-g|'+club,3,5); else if(r<0.70) amount=seededInt('iu-h|'+club,1,2); else if(r<0.85) amount=6; else if(r<0.97) amount=seededInt('iu-i|'+club,7,9); else amount=10;
    }
    return Math.min(maxBuy,Math.max(0,Math.round(amount)));
  }
  function blankClub(club){
    return {club, stake:0, buyInPaid:0, totalInvested:0, units:blankUnits(), lastValuation:0, lastTransferRevenue:0, lastPlan:null, shareHistory:[]};
  }
  function blankOwner(){
    return {version:'13f', unlocked:false, unlockSeason:null, silverSeenSeason:null, goldSeenSeason:null, betaToolsUnlocked:false, clubs:{}, pendingPlan:null, pendingBuyIn:null, lastEvent:null, lastSale:null, lastAppliedSeason:null};
  }
  function owner(){
    state.managerOwner={...blankOwner(), ...(state.managerOwner||{})};
    const o=state.managerOwner;
    o.clubs=(o.clubs && typeof o.clubs==='object')?o.clubs:{};
    Object.keys(o.clubs).forEach(c=>{
      o.clubs[c]={...blankClub(c), ...(o.clubs[c]||{})};
      o.clubs[c].units=normaliseUnits(o.clubs[c].units);
      o.clubs[c].stake=clamp(o.clubs[c].stake,0,51);
      o.clubs[c].buyInPaid=round3(o.clubs[c].buyInPaid);
      o.clubs[c].totalInvested=round3(o.clubs[c].totalInvested);
      o.clubs[c].shareHistory=Array.isArray(o.clubs[c].shareHistory)?o.clubs[c].shareHistory:[];
    });
    return o;
  }
  function clubOwner(club){
    const o=owner();
    if(!o.clubs[club]) o.clubs[club]=blankClub(club);
    o.clubs[club].units=normaliseUnits(o.clubs[club].units);
    return o.clubs[club];
  }
  function currentStake(club=state?.humanClub){ return n(clubOwner(club).stake); }
  function developmentMultiplier(units){
    const t=totalUnits(units);
    if(t<=10) return 0.50;
    if(t<=19) return 0.75;
    if(t<=20) return 1.00;
    if(t<=30) return 1.20;
    if(t<=40) return 1.50;
    return 2.00;
  }
  function repMultiplier(club){
    try{
      const tier=n(clubTier(club));
      if(tier<=1) return 1.35;
      if(tier===2) return 1.25;
      if(tier===3) return 1.15;
      if(tier===4) return 1.05;
      if(tier===5) return 0.95;
      return 0.90;
    }catch(e){ return 1; }
  }
  function tablePosition(club){
    try{
      if(state?.season){
        const t=leagueTable();
        const idx=t.findIndex(r=>r.club===club);
        if(idx>=0) return idx+1;
      }
    }catch(e){}
    try{ return expectedFinish(club); }catch(e){ return 20; }
  }
  function statusMultiplier(club){
    const div=clubDivision(club);
    const pos=tablePosition(club);
    if(div==='second'){
      if(pos<=3) return 1.08;
      if(pos<=6) return 0.98;
      if(pos<=12) return 0.86;
      return 0.72;
    }
    if(pos<=1) return 3.50;
    if(pos<=4) return 2.60;
    if(pos<=10) return 1.75;
    if(pos<=17) return 1.35;
    return 1.10;
  }
  function clubValue(club){
    const co=clubOwner(club);
    // Stage 13C softens elite valuations. Top clubs are still huge, but a 51% buy-in is now testable and not absurd.
    const val=round1(baseUnitCost(club)*40*statusMultiplier(club)*developmentMultiplier(co.units)*repMultiplier(club));
    co.lastValuation=val;
    return val;
  }
  function stakeValue(club, stake=currentStake(club)){ return round1(clubValue(club)*(n(stake)/100)); }
  function buyCostToStake(club,targetStake){
    const co=clubOwner(club);
    targetStake=n(targetStake);
    const extra=Math.max(0, targetStake-n(co.stake));
    return round1(clubValue(club)*(extra/100));
  }
  function nextUnitCost(club, extraIndex=0){
    const co=clubOwner(club);
    const t=totalUnits(co.units)+n(extraIndex);
    let mult=1;
    if(t>=40) mult=6;
    else if(t>=30) mult=3.5;
    else if(t>=20) mult=2;
    return round1(baseUnitCost(club)*mult);
  }
  function addUnitsToClub(club,count,focusCategory=null){
    const co=clubOwner(club);
    count=Math.max(0, Math.round(n(count)));
    const focus=focusCategory && CATEGORIES.some(([k])=>k===focusCategory) ? focusCategory : null;
    for(let i=0;i<count;i++){
      let chosen=null;
      if(focus && n(co.units[focus])<10) chosen=focus;
      if(!chosen){
        const slots=CATEGORIES.map(([k])=>[k,n(co.units[k])]).filter(x=>x[1]<10).sort((a,b)=>a[1]-b[1]);
        if(!slots.length) break;
        chosen=slots[0][0];
      }
      co.units[chosen]=n(co.units[chosen])+1;
    }
    co.units=normaliseUnits(co.units);
  }
  function removeUnitsFromClub(club,count){
    const co=clubOwner(club);
    count=Math.max(0, Math.round(n(count)));
    for(let i=0;i<count;i++){
      const slots=CATEGORIES.map(([k])=>[k,n(co.units[k])]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
      if(!slots.length) break;
      co.units[slots[0][0]]=n(co.units[slots[0][0]])-1;
    }
    co.units=normaliseUnits(co.units);
  }
  function unitEconomy(club){
    const co=clubOwner(club);
    const base=baseUnitCost(club);
    const units=totalUnits(co.units);
    const bonuses=categoryBonusesFromUnits(co.units);
    const annualWear=Math.min(5,units);
    const income=round1(units*base*0.25*bonuses.revenueMultiplier);
    const maintenance=round1(annualWear*base);
    const gap=round1(Math.max(0, maintenance-income));
    const surplus=round1(Math.max(0, income-maintenance));
    const transferRevenue=surplus;
    const maintenanceUnitsFunded=Math.min(annualWear, Math.floor((income+0.0001)/Math.max(0.1,base)));
    const decayIfMaintained=Math.max(0, annualWear-maintenanceUnitsFunded);
    const decayIfUnfunded=annualWear;
    return {club, base, units, income, maintenance, gap, surplus, transferRevenue, annualWear, maintenanceUnitsFunded, decayIfMaintained, decayIfUnfunded, revenueMultiplier:bonuses.revenueMultiplier, categoryBonuses:bonuses};
  }
  function unitCostForUnits(club,buyUnits){
    let unitCost=0;
    for(let i=0;i<Math.max(0,Math.round(n(buyUnits)));i++) unitCost += nextUnitCost(club,i);
    return round1(unitCost);
  }
  function forcedContributionLimit(savedWealth=null){
    const personal=n((savedWealth||wealth()).personalWealth);
    if(personal<=2) return 0;
    return round1(Math.max(0, Math.min(personal*0.18, personal-2)));
  }
  function forcedPlanIsSafe(plan,savedWealth=null){
    const personal=n((savedWealth||wealth()).personalWealth);
    const share=n(plan?.ownerShare);
    if(share<=0) return true;
    return personal+0.0001>=share && share<=forcedContributionLimit(savedWealth);
  }
  function maintenancePlan(club,label='Reinvest and maintain'){
    const econ=unitEconomy(club);
    const decay=econ.decayIfMaintained;
    return {...econ,type:'maintenance',label,buyUnits:0,unitCost:0,totalCost:0,ownerShare:0,boardShare:0,stake:currentStake(club),transferBudgetBonus:0,unitDecay:decay,focusCategory:null,focusLabel:'Maintenance',requiresOwnerMoney:false,summary:`Use club development income to repair the normal ${econ.annualWear}-unit yearly wear. No new units and no transfer boost.`};
  }
  function boardroomPlanOptions(club,customImproveUnits=null,customFocusCategory=null){
    const econ=unitEconomy(club);
    const stake=currentStake(club);
    const shortfall=Math.max(0,n(econ.maintenance)-n(econ.income));
    const surplus=round1(Math.max(0,n(econ.income)-n(econ.maintenance)));
    const maxBuy=Math.max(0,50-n(econ.units));
    const focusCategory=customFocusCategory && CATEGORIES.some(([k])=>k===customFocusCategory) ? customFocusCategory : boardFocusCategory(club);
    const improveUnits=customImproveUnits==null ? proposedImproveUnits(club,maxBuy) : clamp(Math.round(n(customImproveUnits)),0,maxBuy);
    function make(type,label,buyUnits,unitCost,totalCost,transferBudgetBonus,unitDecay,summary,focus=null,extra={}){
      totalCost=round1(Math.max(0,n(totalCost)));
      const ownerShare=round1(totalCost*(stake/100));
      const boardShare=round1(Math.max(0,totalCost-ownerShare));
      return {...econ,type,label,buyUnits:Math.max(0,Math.round(n(buyUnits))),unitCost:round1(unitCost),totalCost,ownerShare,boardShare,stake,transferBudgetBonus:round1(Math.max(0,n(transferBudgetBonus))),unitDecay:Math.max(0,Math.round(n(unitDecay))),focusCategory:focus,focusLabel:focus?categoryLabel(focus):'',requiresOwnerMoney:ownerShare>0,summary,...extra};
    }
    const improveUnitCost=unitCostForUnits(club,improveUnits);
    const improveTopUp=round1(shortfall + Math.max(0,improveUnitCost-surplus));
    const maintenanceTopUp=round1(n(econ.maintenance));
    return {
      improve: make('improve','Improve club',improveUnits,improveUnitCost,improveTopUp,0,0,`Repair the normal yearly wear, then add ${improveUnits} new development unit${improveUnits===1?'':'s'}${focusCategory?' focused on '+categoryLabel(focusCategory):''}. Club surplus helps before shareholders top up.`,focusCategory,{surplusUsed:Math.min(surplus,improveUnitCost),maintenanceFunded:true}),
      maintenance: maintenancePlan(club),
      transfer: make('transfer','Move money to transfer budget',0,0,0,n(econ.income),econ.decayIfUnfunded,'Move all development income into the transfer budget. Owners pay nothing, but maintenance is not funded and the club takes the standard yearly wear hit.',null,{maintenanceFunded:false}),
      balanced: make('balanced','Maintenance plus transfer funds',0,0,maintenanceTopUp,n(econ.income),0,'Owners fund the normal yearly maintenance bill, so club development is protected. The club development income is then moved into next season transfer funds.',null,{maintenanceFunded:true})
    };
  }
  function weightedBoardType(club,opts){
    const p=boardPersonality(club);
    const weights={...(p.weights||{})};
    if(unitEconomy(club).units<16){ weights.maintenance=(weights.maintenance||0)+45; weights.transfer=Math.max(0,(weights.transfer||0)-20); }
    const types=['improve','maintenance','transfer','balanced'];
    const safeTypes=types.filter(t=>opts[t] && (t==='maintenance' || forcedPlanIsSafe(opts[t])) && !(t==='improve' && opts[t].buyUnits<=0));
    if(!safeTypes.length) return 'maintenance';
    let total=0; safeTypes.forEach(t=>{ total += Math.max(0,n(weights[t])); });
    if(total<=0) return safeTypes[0];
    let r=seededUnit('boardPick|'+club+'|'+n(state?.seasonNumber||1)+'|'+unitEconomy(club).units)*total;
    for(const t of safeTypes){ r-=Math.max(0,n(weights[t])); if(r<=0) return t; }
    return safeTypes[safeTypes.length-1];
  }
  function boardRecommendedType(club){
    const opts=boardroomPlanOptions(club);
    return weightedBoardType(club,opts);
  }
  function boardRecommendedPlan(club){
    const opts=boardroomPlanOptions(club);
    return opts[boardRecommendedType(club)] || opts.maintenance;
  }
  function safeForcedPlanOrMaintenance(club,plan,savedWealth=null){
    if(!plan) return maintenancePlan(club);
    if(forcedPlanIsSafe(plan,savedWealth)) return plan;
    return {...maintenancePlan(club,'Maintenance only'), downgradedFrom:plan.label, voteResult:'Affordability protection', summary:'The larger proposal was unaffordable for shareholders, so the club defaulted to essential maintenance.'};
  }
  function currentDecisionSeason(){ return n(state?.seasonNumber||1); }
  function lockedBoardroomPlan(club){
    const co=clubOwner(club);
    const lp=co.lastPlan;
    const season=currentDecisionSeason();
    if(lp && (lp.decisionLocked || lp.appliedImmediately) && (n(lp.appliedSeason)===season || n(lp.season)===season || n(owner().lastAppliedSeason)===season)) return lp;
    return null;
  }
  function budgetTeam(club){
    try{ return typeof team==='function' ? team(club) : null; }catch(e){ return null; }
  }
  function applyBoardroomDecisionNow(club,plan,reason='Boardroom decision'){
    club=String(club||state?.humanClub||'');
    if(!club) return null;
    const existing=lockedBoardroomPlan(club);
    if(existing){
      try{ setStatus(`Boardroom decision already confirmed for ${club}. It is locked for this season.`, 'warn'); }catch(e){}
      renderSoon();
      return {alreadyLocked:true, plan:existing};
    }
    const o=owner();
    const co=clubOwner(club);
    const stake=n(co.stake);
    let p={...(plan || boardRecommendedPlan(club) || maintenancePlan(club))};
    let downgraded=false;
    let downgradedFrom='';
    if(stake<51){
      const safe=safeForcedPlanOrMaintenance(club,p);
      if(safe.downgradedFrom){ downgraded=true; downgradedFrom=safe.downgradedFrom; }
      p=safe;
    }
    if(n(p.ownerShare)>0 && n(wealth().personalWealth)+0.0001<n(p.ownerShare)){
      downgraded=true; downgradedFrom=p.label;
      p={...maintenancePlan(club,'Maintenance only'), downgradedFrom:downgradedFrom, voteResult:p.voteResult || 'Affordability protection', summary:'The larger proposal was unaffordable, so the club defaulted to essential maintenance.'};
    }
    let paid=false;
    if(n(p.ownerShare)>0){
      paid=spendWealth(n(p.ownerShare));
      if(!paid){
        downgraded=true; downgradedFrom=p.label;
        p={...maintenancePlan(club,'Maintenance only'), downgradedFrom:downgradedFrom, voteResult:p.voteResult || 'Affordability protection', summary:'The larger proposal was unaffordable, so the club defaulted to essential maintenance.'};
      }
    }
    let lost=0;
    if(n(p.unitDecay)>0){ lost=n(p.unitDecay); removeUnitsFromClub(club,lost); }
    if(n(p.buyUnits)>0) addUnitsToClub(club,n(p.buyUnits),p.focusCategory);
    const revenue=round1(n(p.transferBudgetBonus));
    if(revenue>0){
      const t=budgetTeam(club);
      if(t) t.budget=round1(n(t.budget)+revenue);
    }
    co.totalInvested=round3(n(co.totalInvested)+n(p.ownerShare));
    co.lastTransferRevenue=revenue;
    co.lastPlan={...p, paid:true, downgraded, downgradedFrom:downgradedFrom || p.downgradedFrom || '', unitsLost:lost, budgetAdded:revenue, decisionLocked:true, appliedImmediately:true, appliedSeason:currentDecisionSeason(), reason};
    o.pendingPlan=null;
    o.lastAppliedSeason=currentDecisionSeason();
    o.lastEvent='boardroom-decision-applied';
    try{
      const bits=[];
      if(n(p.ownerShare)>0) bits.push(`you paid ${fmtMoney(p.ownerShare)}`);
      if(revenue>0) bits.push(`${fmtMoney(revenue)} added to transfer budget`);
      if(n(p.buyUnits)>0) bits.push(`+${p.buyUnits} unit${p.buyUnits===1?'':'s'}`);
      if(lost>0) bits.push(`-${lost} unit${lost===1?'':'s'}`);
      addLog(`<b>Club development decision locked:</b> ${esc(club)} confirmed ${esc(p.label)}${bits.length?' — '+bits.map(esc).join(', '):''}.`);
    }catch(e){}
    try{
      const txt=`${p.label} confirmed and locked. Your contribution: ${fmtMoney(p.ownerShare)}. Transfer budget added: ${fmtMoney(revenue)}. Club development: ${unitEconomy(club).units}/50.`;
      setStatus(txt, downgraded?'warn':'good');
    }catch(e){}
    renderSoon();
    return {paid:true,lost,revenue,plan:co.lastPlan,downgraded};
  }
  function planCost(club,type='board'){
    if(type==='board') return boardRecommendedPlan(club);
    const opts=boardroomPlanOptions(club);
    if(opts[type]) return opts[type];
    if(type==='hold') return opts.maintenance;
    if(type==='steady') return boardroomPlanOptions(club,1).improve;
    if(type==='growth') return boardroomPlanOptions(club,3).improve;
    return opts.maintenance;
  }
  function planCostCustom(club,buyUnits,label=null,type='custom',focusCategory=null){
    const maxBuy=Math.max(0,50-n(unitEconomy(club).units));
    buyUnits=clamp(Math.round(n(buyUnits)),0,maxBuy);
    const p=boardroomPlanOptions(club,buyUnits,focusCategory).improve;
    if(label==null){
      if(buyUnits<=0) label='Maintenance only';
      else if(buyUnits>=maxBuy && maxBuy>0) label='Max out club';
      else label=`Buy ${buyUnits} development unit${buyUnits===1?'':'s'}`;
    }
    return {...p,type,label};
  }

  function affordableImprovementMax(club,focusCategory=null){
    const maxBuy=Math.max(0,50-n(unitEconomy(club).units));
    const personal=n(wealth().personalWealth);
    let best=0;
    for(let i=1;i<=maxBuy;i++){
      const p=planCostCustom(club,i,null,'custom',focusCategory || boardFocusCategory(club));
      if(n(p.ownerShare)<=personal+0.0001) best=i;
      else break;
    }
    return best;
  }
  function surplusTransferPlan(club){
    const econ=unitEconomy(club);
    const m=maintenancePlan(club,'Maintain and move surplus to transfers');
    return {...m,type:'surplus',label:'Maintain and move surplus to transfers',transferBudgetBonus:round1(Math.max(0,n(econ.income)-n(econ.maintenance))),summary:'The club funds normal maintenance from development income, then moves any true surplus into next season transfer budget. Owners pay nothing.'};
  }
  function ownerTransferInjectionPlan(club,amount){
    const econ=unitEconomy(club);
    const injection=round1(Math.max(0,Math.min(n(amount),n(wealth().personalWealth))));
    const m=maintenancePlan(club,'Personal transfer injection');
    return {...m,type:'owner-transfer',label:'Personal transfer injection',totalCost:injection,ownerShare:injection,boardShare:0,transferBudgetBonus:round1(n(m.transferBudgetBonus)+injection),requiresOwnerMoney:injection>0,summary:`You personally add ${fmtMoney(injection)} to next season's transfer budget while the club uses its own income for normal maintenance.`,injection};
  }
  function controllerPlanFromSelection(club,decisionType,buyUnits=0,focusCategory=null,injection=0){
    const opts=boardroomPlanOptions(club);
    const type=String(decisionType||'maintenance');
    if(type==='improve') return planCostCustom(club,buyUnits,null,'improve',focusCategory || boardFocusCategory(club));
    if(type==='transfer') return opts.transfer;
    if(type==='balanced') return opts.balanced;
    if(type==='surplus') return surplusTransferPlan(club);
    if(type==='owner-transfer') return ownerTransferInjectionPlan(club,injection);
    return opts.maintenance;
  }
  function canUseOwnerUnlock(){ return !!owner().unlocked || managerRating()>=OWNER_UNLOCK_RATING; }
  function updateMilestone(){
    const o=owner();
    const r=managerRating();
    const season=n(state?.seasonNumber||1);
    if(r>=OWNER_UNLOCK_RATING && !o.unlocked){
      o.unlocked=true; o.unlockSeason=season; o.goldSeenSeason=season; o.lastEvent='gold-unlock';
    } else if(r>=SILVER_RATING && r<OWNER_UNLOCK_RATING && !o.silverSeenSeason){
      o.silverSeenSeason=season; o.lastEvent='silver-warning';
    }
  }
  function milestoneHtml(){
    const r=managerRating();
    const o=owner();
    if(r>=OWNER_UNLOCK_RATING){
      const fresh=o.lastEvent==='gold-unlock' || n(o.goldSeenSeason)===n(state?.seasonNumber||1);
      return `<div class="stage13-owner-milestone gold"><b>${fresh?'Manager-owner route unlocked':'Manager-owner tier'}</b><span>You are now a top-table manager. From this summer, your current club and job-offer clubs can include 5%, 25% or 51% buy-in options.</span></div>`;
    }
    if(r>=SILVER_RATING){
      return `<div class="stage13-owner-milestone silver"><b>Almost at the top table</b><span>Reach 90+ manager reputation and elite clubs will begin offering ownership buy-in opportunities alongside jobs.</span></div>`;
    }
    return '';
  }
  function unitBarsHtml(club){
    const co=clubOwner(club);
    const b=categoryBonusesFromUnits(co.units);
    const effect={
      training:`Training cost -${Math.round(b.trainingDiscount*100)}%`,
      stadium:`Assistant cost -${Math.round(b.assistantDiscount*100)}% · revenue ${Math.round((b.revenueMultiplier-1)*100)}%`,
      commercial:`Revenue ${Math.round((b.revenueMultiplier-1)*100)}%`,
      youth:`Scouting cost -${Math.round(b.scoutingDiscount*100)}%`,
      global:`Player pull +${b.globalPullBonus}`
    };
    return `<div class="stage13-unit-grid stage13e-unit-grid">`+CATEGORIES.map(([k,label])=>{
      const val=n(co.units[k]);
      return `<div class="stage13-unit-row"><span>${esc(label)}</span><b>${val}/10</b><div class="stage13-unit-bar"><i style="width:${(val/10)*100}%"></i></div><em>${esc(effect[k]||'')}</em></div>`;
    }).join('')+`</div>`;
  }
  function buyInCardsHtml(club, mode='current'){
    const enabled=canUseOwnerUnlock();
    const co=clubOwner(club);
    const w=wealth();
    const value=clubValue(club);
    if(!enabled) return `<div class="muted">Ownership buy-in unlocks at 90+ manager reputation.</div>`;
    const cards=TARGET_STAKES.map(target=>{
      const already=n(co.stake)>=target;
      const cost=buyCostToStake(club,target);
      const afford=n(w.personalWealth)>=cost;
      const onclick=mode==='pending' ? `stage13aSelectPendingBuyIn(${jsArg(club)},${target})` : `stage13aBuyStake(${jsArg(club)},${target})`;
      return `<div class="stage13-buy-card ${already?'owned':''}">
        <b>${target}% stake</b>
        <span>${already?'Already owned':`Buy extra ${Math.max(0,target-n(co.stake))}%`}</span>
        <strong>${already?'Owned':esc(fmtMoney(cost))}</strong>
        <button class="${afford&&!already?'gold':'secondary'} tiny" onclick="${onclick}" ${already||!afford?'disabled':''}>${already?'Owned':afford?'Buy in':'Too expensive'}</button>
      </div>`;
    }).join('');
    return `<div class="stage13-buy-grid">${cards}</div><div class="muted">Live club value: ${esc(fmtMoney(value))}. You only pay for the extra percentage you are buying.</div>`;
  }
  function currentOwnerPanelHtml(){
    if(!state?.started || !state?.humanClub) return '';
    updateMilestone();
    const club=state.humanClub;
    const co=clubOwner(club);
    const econ=unitEconomy(club);
    const val=clubValue(club);
    const stake=n(co.stake);
    return `<div class="stage13-owner-card">
      <div class="stage13-owner-head"><b>Manager-owner route</b><span>${stake?`${stake}% stake`:'Manager only'}</span></div>
      ${milestoneHtml()}
      <div class="stage13-owner-grid">
        <div><span>Club value</span><strong>${esc(fmtMoney(val))}</strong></div>
        <div><span>Your stake</span><strong>${stake}%</strong></div>
        <div><span>Share value</span><strong>${esc(fmtMoney(stakeValue(club)))}</strong></div>
        <div><span>Club units</span><strong>${econ.units}/50</strong></div>
      </div>
      <div class="stage13-owner-copy">Personal wealth buys influence. Club units generate income, repair yearly wear and can create transfer surplus. Categories now shape training, scouting, assistant costs, revenue and player pull.</div>
      <div class="stage13-beta-tools"><b>BETA TEST TOOLS</b><span>Visible for testing Stage 13 quickly.</span><button class="secondary tiny" onclick="stage13aBetaSilver()">Silver tier + money</button><button class="gold tiny" onclick="stage13aBetaGold()">Gold unlock + money</button></div>
    </div>`;
  }
  function ownerFanReviewHtml(club){
    if(!state?.started || !club) return '';
    const co=clubOwner(club);
    const stake=n(co.stake);
    if(stake<=0) return '';
    const econ=unitEconomy(club);
    const lp=co.lastPlan || null;
    let mood='Steady';
    let text='Supporters see you as part of the ownership story now. They will judge whether your money and influence are making the club stronger, not just whether the first team has had a good season.';
    if(econ.units>=50){ mood='Loved'; text='Fans can see the club has been transformed off the pitch. The ownership story now feels like a genuine legacy project.'; }
    else if(econ.units>=35){ mood='Positive'; text='Fans can see serious progress behind the scenes. The club looks better run, better funded and more ambitious than when you arrived.'; }
    else if(econ.units<15){ mood='Worried'; text='Supporters are concerned the club is being allowed to drift. They want visible reinvestment before the long-term damage shows on the pitch.'; }
    if(lp){
      if(lp.type==='improve' && n(lp.buyUnits)>0){ mood=econ.units>=40?'Excited':'Encouraged'; text=`Fans welcomed the ${lp.buyUnits}-unit development push. The ownership feels active rather than symbolic.`; }
      else if(lp.type==='transfer'){ mood='Divided'; text='Fans enjoyed the extra transfer funds, but some are worried the club is borrowing from its future by skipping maintenance.'; }
      else if(lp.type==='balanced'){ mood='Practical'; text='Fans see the maintenance-plus-transfer decision as sensible: protect the club, then give the manager what is left to improve the squad.'; }
      else if(lp.type==='maintenance'){ mood='Patient'; text='Fans understand the club protected its foundations this year. It is not glamorous, but it keeps the project stable.'; }
    }
    return `<div class="stage13f-owner-fan-review"><div class="stage13-owner-head"><b>Fan review of you as an owner</b><span>${esc(mood)}</span></div><p>${esc(text)}</p><div class="muted">Current owner stake: ${stake}% · club development: ${econ.units}/50 · latest owner decision: ${esc(lp?.label || 'none yet')}</div></div>`;
  }
  function planDetailHtml(plan,isBoard=false){
    const bits=[];
    if(plan.buyUnits>0) bits.push(`+${plan.buyUnits} unit${plan.buyUnits===1?'':'s'}`);
    if(plan.focusLabel) bits.push(`focus: ${plan.focusLabel}`);
    if(plan.unitDecay>0) bits.push(`-${plan.unitDecay} unit${plan.unitDecay===1?'':'s'}`);
    if(plan.transferBudgetBonus>0) bits.push(`${fmtMoney(plan.transferBudgetBonus)} to transfers`);
    if(plan.ownerShare>0) bits.push(`your share ${fmtMoney(plan.ownerShare)}`);
    if(!bits.length) bits.push('no transfer boost');
    return `<div class="stage13c-plan-detail">${isBoard?'<b>Board proposal</b> ':''}${esc(plan.summary||'')} <span>${esc(bits.join(' · '))}</span></div>`;
  }
  function developmentReviewHtml(club, compact=false){
    const co=clubOwner(club);
    const econ=unitEconomy(club);
    const stake=n(co.stake);
    const personality=boardPersonality(club);
    const opts=boardroomPlanOptions(club);
    const boardType=boardRecommendedType(club);
    const board=opts[boardType] || opts.maintenance;
    const locked=lockedBoardroomPlan(club);
    const selected=locked || (owner().pendingPlan && owner().pendingPlan.club===club ? owner().pendingPlan : null);
    const isLocked=!!locked;
    const surplus=round1(n(econ.income)-n(econ.maintenance));
    const surplusText=surplus>=0 ? `Surplus ${fmtMoney(surplus)}` : `Shortfall ${fmtMoney(Math.abs(surplus))}`;
    const selectedLine=selected ? (isLocked ? `<div class="stage13-selected-plan locked"><b>Decision confirmed and locked:</b> ${esc(selected.label)}. ${selected.voteResult?esc(selected.voteResult)+'. ':''}${selected.downgradedFrom?`The unaffordable ${esc(selected.downgradedFrom)} proposal was downgraded to maintenance. `:''}Units added: ${selected.buyUnits||0}${selected.focusLabel?` (${esc(selected.focusLabel)})`:''}. Units lost: ${selected.unitsLost||0}. Transfer budget added: ${esc(fmtMoney(selected.budgetAdded||selected.transferBudgetBonus||0))}. Your contribution: ${esc(fmtMoney(selected.ownerShare))}. Other shareholders: ${esc(fmtMoney(selected.boardShare||0))}.</div>` : `<div class="stage13-selected-plan">Selected for next summer: <b>${esc(selected.label)}</b>. ${selected.voteResult?esc(selected.voteResult)+'. ':''}${selected.downgradedFrom?`The unaffordable ${esc(selected.downgradedFrom)} proposal was downgraded to maintenance. `:''}Units to add: ${selected.buyUnits}. Transfer budget impact: ${esc(fmtMoney(selected.transferBudgetBonus||0))}. Your share: ${esc(fmtMoney(selected.ownerShare))}. Other shareholders: ${esc(fmtMoney(selected.boardShare||0))}.</div>`) : '';
    function optionCard(type,plan){
      const recommended=type===boardType;
      const unsafe=stake>0 && stake<51 && plan.ownerShare>0 && !forcedPlanIsSafe(plan);
      const buttonLabel=isLocked ? 'Decision confirmed' : (stake>=51 ? (type==='improve'?'Choose selected improvement':'Choose this plan') : (recommended?'Support board':'Vote for this'));
      const disabled=stake<=0 || unsafe || isLocked || (type==='improve' && plan.buyUnits<=0);
      const focusGet=`document.getElementById('stage13eFocus_${safeId(club)}')?document.getElementById('stage13eFocus_${safeId(club)}').value:null`;
      const click=stake>=51 && type==='improve' ? `stage13aSetCustomDevelopmentPlan(${jsArg(club)},document.getElementById('stage13cUnits_${safeId(club)}')?document.getElementById('stage13cUnits_${safeId(club)}').value:${plan.buyUnits},${focusGet})` : `stage13aVoteDevelopmentPlan(${jsArg(club)},'${type}')`;
      return `<div class="stage13c-option ${recommended?'recommended':''} ${unsafe?'unsafe':''}">
        <div class="stage13c-option-head"><b>${esc(plan.label)}</b>${recommended?'<span>Board pick</span>':''}</div>
        ${planDetailHtml(plan,false)}
        <div class="stage13c-option-money"><span>Shareholder top-up: <b>${esc(fmtMoney(plan.totalCost))}</b></span><span>Your share: <b>${esc(fmtMoney(plan.ownerShare))}</b></span></div>
        ${unsafe?`<div class="stage13c-safety">Too much for your current personal wealth. The board would default to maintenance.</div>`:''}
        ${stake>0?`<button class="${recommended?'gold':'secondary'} tiny" onclick="${click}" ${disabled?'disabled':''}>${buttonLabel}</button>`:''}
      </div>`;
    }
    let controllerTools='';
    if(stake>=51){
      const maxNeed=Math.max(0,50-n(econ.units));
      const selectedFocus=selected?.focusCategory || boardFocusCategory(club);
      const affordableMax=affordableImprovementMax(club,selectedFocus);
      const selectedUnits=selected ? clamp(Math.round(n(selected.buyUnits)),0,affordableMax) : Math.min(affordableMax,Math.max(1,Math.min(maxNeed,5)));
      const prefix='stage13l_'+safeId(club);
      const decisionId=prefix+'_decision';
      const selectId=prefix+'_units';
      const focusId=prefix+'_focus';
      const injectId=prefix+'_inject';
      const previewId=prefix+'_preview';
      const selectedDecision=selected?.type==='transfer'?'transfer':selected?.type==='balanced'?'balanced':selected?.type==='surplus'?'surplus':selected?.type==='owner-transfer'?'owner-transfer':selected?.type==='improve'?'improve':'maintenance';
      const decisionOptions=[
        ['maintenance','Reinvest and maintain (do nothing)'],
        ['surplus','Maintain, then move surplus to transfers'],
        ['transfer','Move all development income to transfers'],
        ['balanced','Owner-funded maintenance plus transfer funds'],
        ['improve',`Improve club development${affordableMax<=0?' (none affordable)':''}`,affordableMax<=0],
        ['owner-transfer','Personal transfer injection']
      ].map(([v,label,disabled])=>`<option value="${esc(v)}" ${v===selectedDecision?'selected':''} ${disabled?'disabled':''}>${esc(label)}</option>`).join('');
      const unitOptions=(affordableMax>0?Array.from({length:affordableMax},(_,idx)=>idx+1):[0]).map(i=>{
        if(i<=0) return `<option value="0">No affordable units</option>`;
        const p=planCostCustom(club,i,null,'custom',selectedFocus);
        const txt=`${i} unit${i===1?'':'s'} · your 51% ${fmtMoney(p.ownerShare)} · total top-up ${fmtMoney(p.totalCost)}`;
        return `<option value="${i}" ${i===selectedUnits?'selected':''}>${esc(txt)}</option>`;
      }).join('');
      const focusOptions=CATEGORIES.map(([k,label])=>`<option value="${esc(k)}" ${k===selectedFocus?'selected':''}>${esc(label)}</option>`).join('');
      const injectDefault=Math.max(0,Math.min(25,Math.floor(n(wealth().personalWealth))));
      const planPreview=controllerPlanFromSelection(club,selectedDecision,selectedUnits,selectedFocus,injectDefault);
      const improveVisible=selectedDecision==='improve'?'':'style="display:none"';
      const injectVisible=selectedDecision==='owner-transfer'?'':'style="display:none"';
      controllerTools=`<div class="stage13b-owner-selector stage13c-controller-selector stage13e-controller-selector stage13f-controller-selector stage13l-controller-selector" data-stage13l-club="${esc(club)}">
        <label for="${esc(decisionId)}"><b>51% owner decision</b><span>You control the boardroom. Pick the route first; upgrade controls only appear if you choose to improve club development.</span></label>
        <select id="${esc(decisionId)}" data-stage13l-role="decision" onchange="stage13lOwnerDecisionChanged(${jsArg(club)})" ${isLocked?'disabled':''}>${decisionOptions}</select>
        <div id="${esc(prefix)}_improve" data-stage13l-section="improve" ${improveVisible}>
          <label for="${esc(selectId)}"><b>Development units to buy</b><span>Max required to reach 50/50: ${maxNeed}. Max affordable from your current personal wealth: ${affordableMax}.</span></label>
          <select id="${esc(selectId)}" data-stage13l-role="units" onchange="stage13lOwnerDecisionChanged(${jsArg(club)})" ${isLocked||affordableMax<=0?'disabled':''}>${unitOptions}</select>
          <label for="${esc(focusId)}"><b>Development focus</b><span>New units go into this category first, then spread if it is full.</span></label>
          <select id="${esc(focusId)}" data-stage13l-role="focus" onchange="stage13lOwnerDecisionChanged(${jsArg(club)})" ${isLocked?'disabled':''}>${focusOptions}</select>
        </div>
        <div id="${esc(prefix)}_inject" data-stage13l-section="inject" ${injectVisible}>
          <label for="${esc(injectId)}"><b>Personal transfer injection</b><span>This comes from manager wealth and goes straight into next season transfer budget. It cannot exceed your current personal wealth.</span></label>
          <input id="${esc(injectId)}" data-stage13l-role="inject" type="number" min="0" max="${Math.floor(n(wealth().personalWealth))}" step="1" value="${injectDefault}" oninput="stage13lOwnerDecisionChanged(${jsArg(club)})" ${isLocked?'disabled':''}>
        </div>
        <div id="${esc(previewId)}" class="stage13b-owner-cost-preview stage13l-preview"><b>Current choice:</b> ${esc(planPreview.label)} · transfer budget ${esc(fmtMoney(planPreview.transferBudgetBonus||0))} · your cost ${esc(fmtMoney(planPreview.ownerShare||0))} · units +${planPreview.buyUnits||0} / -${planPreview.unitDecay||0}</div>
        <div class="stage13-plan-actions"><button class="gold tiny" onclick="stage13lConfirmOwnerDecision(${jsArg(club)})" ${isLocked?'disabled':''}>Confirm owner decision</button></div>
        <div class="stage13c-boardroom-explainer">Once confirmed, the decision applies immediately, locks the dropdowns and unlocks next season.</div>
      </div>`;
    }
    let explainer='';
    if(stake<=0) explainer='You do not own shares, so the board decision will apply automatically when the next season starts.';
    else if(stake<51) explainer=`You own ${stake}%. You can vote against the board, but only your ownership stake can swing the vote. If the vote goes against you, you must pay your share, but the board cannot force you into financial collapse.`;
    else explainer='You own 51%, so you control the decision. Bigger improvement plans still require your personal wealth to cover your 51% share.';
    return `<div class="stage13-development-card ${compact?'compact':''} ${isLocked?'locked':''}">
      <div class="stage13-owner-head"><b>Club development review</b><span>${econ.units}/50 units</span></div>
      <div class="stage13e-board-personality"><b>${esc(personality.label)}</b><span>${esc(personality.summary)}</span></div>
      <div class="stage13-owner-grid stage13e-economy-grid">
        <div><span>Annual wear</span><strong>-${econ.annualWear} units</strong></div>
        <div><span>Development income</span><strong>${esc(fmtMoney(econ.income))}</strong></div>
        <div><span>Maintenance needed</span><strong>${esc(fmtMoney(econ.maintenance))}</strong></div>
        <div><span>Surplus / shortfall</span><strong>${esc(surplusText)}</strong></div>
        <div><span>Maintenance funded</span><strong>${econ.maintenanceUnitsFunded}/${econ.annualWear} units</strong></div>
        <div><span>Revenue strength</span><strong>${Math.round((econ.revenueMultiplier||1)*100)}%</strong></div>
        <div><span>Next new unit</span><strong>${esc(fmtMoney(nextUnitCost(club,0)))}</strong></div>
        <div><span>Player pull bonus</span><strong>+${econ.categoryBonuses.globalPullBonus}</strong></div>
      </div>
      ${unitBarsHtml(club)}
      <div class="stage13-board-plan"><b>Board recommendation: ${esc(board.label)}.</b> ${esc(board.summary||'')} ${board.ownerShare>0?`Your expected share would be ${esc(fmtMoney(board.ownerShare))}.`:''}</div>
      <div class="stage13c-boardroom-explainer">${esc(explainer)}</div>
      ${selectedLine}
      ${controllerTools}
      ${stake>=51?'':`<div class="stage13c-option-grid">
        ${optionCard('improve',opts.improve)}
        ${optionCard('maintenance',opts.maintenance)}
        ${optionCard('transfer',opts.transfer)}
        ${optionCard('balanced',opts.balanced)}
      </div>`}
    </div>`;
  }
  function currentBuyInHtml(){
    if(!state?.started || !state?.humanClub) return '';
    const club=state.humanClub;
    const stake=currentStake(club);
    return `<div class="stage13-buyin-card">
      <div class="stage13-owner-head"><b>Current club buy-in</b><span>${esc(club)}</span></div>
      ${buyInCardsHtml(club,'current')}
      ${stake>0?`<div class="stage13-plan-actions"><button class="secondary tiny" onclick="stage13aCashOutCurrentClub()">Voluntary cash out at 80%</button></div>`:''}
    </div>`;
  }
  function pendingJobBuyInHtml(){
    const pending=state?.pendingJobAppointment?.to;
    const o=owner();
    if(!pending || !canUseOwnerUnlock()) return '';
    const pb=o.pendingBuyIn && o.pendingBuyIn.club===pending ? o.pendingBuyIn : null;
    return `<div class="stage13-buyin-card">
      <div class="stage13-owner-head"><b>New job buy-in option</b><span>${esc(pending)}</span></div>
      <div class="stage13-owner-copy">You have accepted this job for next season. Choose an optional buy-in before pressing start next season. If you own your current club, that stake is sold first at the normal voluntary move rate.</div>
      ${buyInCardsHtml(pending,'pending')}
      ${pb?`<div class="stage13-selected-plan">Selected: buy to <b>${pb.targetStake}%</b> at ${esc(pending)}. Estimated cost: ${esc(fmtMoney(pb.cost))}.</div>`:''}
    </div>`;
  }
  function endSeasonOwnerHtml(){
    if(!state?.started || !state?.season || n(state.season.roundIndex)<38) return '';
    updateMilestone();
    return `<div class="stage13-end-owner">
      ${currentOwnerPanelHtml()}
      ${ownerFanReviewHtml(state.humanClub)}
      ${currentBuyInHtml()}
      ${pendingJobBuyInHtml()}
      ${developmentReviewHtml(state.humanClub,true)}
    </div>`;
  }
  function injectManagerOwnerPanel(){
    const box=el('managerCareerPanel');
    if(!box || !state?.started) return;
    const old=box.querySelector('.stage13-owner-card');
    if(old) old.remove();
    const holder=document.createElement('div');
    holder.innerHTML=currentOwnerPanelHtml();
    if(holder.firstElementChild) box.appendChild(holder.firstElementChild);
  }
  function injectEndSeasonOwnerSummary(){
    const box=el('seasonSummary');
    if(!box || !state?.started || !state?.season || n(state.season.roundIndex)<38) return;
    const old=box.querySelector('.stage13-end-owner');
    if(old) old.remove();
    const html=endSeasonOwnerHtml();
    const jobs=box.querySelector('.job-board');
    if(jobs) jobs.insertAdjacentHTML('beforebegin', html);
    else {
      const pay=box.querySelector('.stage12-end-pay');
      if(pay) pay.insertAdjacentHTML('afterend', html);
      else box.insertAdjacentHTML('beforeend', html);
    }
  }
  function refreshVersion(){
    try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{v.textContent=VERSION;}); }catch(e){}
  }
  function save(){
    try{ if(typeof saveGame==='function') saveGame(); }catch(e){}
  }
  function renderSoon(){
    refreshVersion(); save();
    try{ if(typeof render==='function') setTimeout(()=>render(),0); }catch(e){}
  }

  window.stage13aBetaSilver=function(){
    const mp=profile();
    mp.rating=89; mp.liveRating=89; mp.committedRating=89; mp.stage13aBeta='silver';
    const w=wealth(); w.personalWealth=Math.max(n(w.personalWealth),9999); w.careerEarnings=Math.max(n(w.careerEarnings),9999);
    const o=owner(); o.unlocked=false; o.lastEvent='silver-warning'; o.silverSeenSeason=n(state?.seasonNumber||1);
    try{ addLog('<b>Beta test:</b> Manager set to silver tier reputation 89 with £9,999m personal wealth.'); }catch(e){}
    try{ setStatus('Beta test applied: silver tier and £9,999m personal wealth.', 'warn'); }catch(e){}
    renderSoon();
  };
  window.stage13aBetaGold=function(){
    const mp=profile();
    mp.rating=99; mp.liveRating=99; mp.committedRating=99; mp.stage13aBeta='gold';
    const w=wealth(); w.personalWealth=Math.max(n(w.personalWealth),9999); w.careerEarnings=Math.max(n(w.careerEarnings),9999);
    const o=owner(); o.unlocked=true; o.unlockSeason=n(state?.seasonNumber||1); o.goldSeenSeason=n(state?.seasonNumber||1); o.lastEvent='gold-unlock';
    try{ addLog('<b>Beta test:</b> Manager-owner gold tier unlocked with £9,999m personal wealth.'); }catch(e){}
    try{ setStatus('Beta test applied: gold manager-owner unlock and £9,999m personal wealth.', 'good'); }catch(e){}
    renderSoon();
  };
  window.stage13aBuyStake=function(club,targetStake){
    club=String(club||state?.humanClub||'');
    if(!club) return;
    const cost=buyCostToStake(club,targetStake);
    const co=clubOwner(club);
    if(n(co.stake)>=n(targetStake)) return;
    if(!spendWealth(cost)){
      try{ setStatus(`You need ${fmtMoney(cost)} personal wealth to buy that stake.`, 'bad'); }catch(e){}
      return;
    }
    const old=n(co.stake);
    co.stake=n(targetStake);
    co.buyInPaid=round3(n(co.buyInPaid)+cost);
    co.totalInvested=round3(n(co.totalInvested)+cost);
    co.shareHistory.push({season:n(state?.seasonNumber||1), club, from:old, to:n(targetStake), cost, value:clubValue(club), type:'buy'});
    owner().lastEvent='buy-in';
    try{ addLog(`<b>Manager-owner:</b> You bought up to ${targetStake}% of ${esc(club)} for ${fmtMoney(cost)}.`); }catch(e){}
    try{ setStatus(`Bought ${targetStake}% of ${club}. Personal wealth reduced by ${fmtMoney(cost)}.`, 'good'); }catch(e){}
    renderSoon();
  };
  window.stage13aSelectPendingBuyIn=function(club,targetStake){
    club=String(club||'');
    const cost=buyCostToStake(club,targetStake);
    owner().pendingBuyIn={club,targetStake:n(targetStake),cost,season:n(state?.seasonNumber||1)};
    try{ setStatus(`Selected ${targetStake}% buy-in at ${club}. It will be processed when next season starts.`, 'good'); }catch(e){}
    renderSoon();
  };
  window.stage13aVoteDevelopmentPlan=function(club,preferredType){
    club=String(club||state?.humanClub||'');
    if(!club) return;
    if(lockedBoardroomPlan(club)) return applyBoardroomDecisionNow(club,null,'Already locked');
    const stake=currentStake(club);
    const opts=boardroomPlanOptions(club);
    const boardType=boardRecommendedType(club);
    let finalType=boardType;
    let voteResult='Board recommendation accepted';
    if(stake>=51){
      finalType=preferredType;
      voteResult='Controlling owner decision';
    } else if(stake>0){
      if(preferredType===boardType){
        finalType=boardType;
        voteResult='You supported the board recommendation';
      } else {
        const won=(Math.random()*100)<stake;
        finalType=won ? preferredType : boardType;
        voteResult=won ? `Your ${stake}% owner vote swung the board` : `Board vote went against your ${stake}% stake`;
      }
    }
    let p={...(opts[finalType] || opts.maintenance), season:n(state?.seasonNumber||1), club, boardType, preferredType, voteResult};
    if(stake<51) p=safeForcedPlanOrMaintenance(club,p);
    return applyBoardroomDecisionNow(club,p,voteResult);
  };
  window.stage13aSetDevelopmentPlan=function(club,type){
    if(type==='board') return window.stage13aVoteDevelopmentPlan(club,boardRecommendedType(club));
    return window.stage13aVoteDevelopmentPlan(club,type);
  };
  function confirmControllerPlan(club,plan,preferredType='controller'){
    club=String(club||state?.humanClub||'');
    if(!club) return;
    if(lockedBoardroomPlan(club)) return applyBoardroomDecisionNow(club,null,'Already locked');
    const personal=n(wealth().personalWealth);
    if(n(plan.ownerShare)>personal+0.0001){
      try{ setStatus(`That decision costs ${fmtMoney(plan.ownerShare)} from your personal wealth. You currently have ${fmtMoney(personal)}.`, 'bad'); }catch(e){}
      return;
    }
    return applyBoardroomDecisionNow(club,{...plan, season:n(state?.seasonNumber||1), club, boardType:'controller', preferredType, voteResult:'Controlling owner decision'},'Controlling owner decision');
  }
  window.stage13aSetCustomDevelopmentPlan=function(club,buyUnits,focusCategory=null){
    club=String(club||state?.humanClub||'');
    const maxAffordable=affordableImprovementMax(club,focusCategory);
    const units=clamp(Math.round(n(buyUnits)),0,maxAffordable);
    const p=planCostCustom(club,units,null,'improve',focusCategory);
    return confirmControllerPlan(club,p,'improve');
  };
  function stage13lReadControllerSelection(club){
    const prefix='stage13l_'+safeId(club);
    const decision=document.getElementById(prefix+'_decision')?.value || 'maintenance';
    const units=document.getElementById(prefix+'_units')?.value || 0;
    const focus=document.getElementById(prefix+'_focus')?.value || boardFocusCategory(club);
    const inject=document.getElementById(prefix+'_inject')?.value || 0;
    const affordable=affordableImprovementMax(club,focus);
    return {decision,units:clamp(Math.round(n(units)),0,affordable),focus,inject:Math.max(0,Math.min(n(inject),n(wealth().personalWealth)))};
  }
  window.stage13lPreviewOwnerDecision=function(club){
    club=String(club||state?.humanClub||'');
    const sel=stage13lReadControllerSelection(club);
    return controllerPlanFromSelection(club,sel.decision,sel.units,sel.focus,sel.inject);
  };
  window.stage13lOwnerDecisionChanged=function(club){
    try{
      club=String(club||state?.humanClub||'');
      const prefix='stage13l_'+safeId(club);
      const sel=stage13lReadControllerSelection(club);
      const improve=document.getElementById(prefix+'_improve');
      const inject=document.getElementById(prefix+'_inject');
      if(improve) improve.style.display=sel.decision==='improve'?'':'none';
      if(inject) inject.style.display=sel.decision==='owner-transfer'?'':'none';
      const p=controllerPlanFromSelection(club,sel.decision,sel.units,sel.focus,sel.inject);
      const prev=document.getElementById(prefix+'_preview');
      if(prev) prev.innerHTML=`<b>Current choice:</b> ${esc(p.label)} · transfer budget ${esc(fmtMoney(p.transferBudgetBonus||0))} · your cost ${esc(fmtMoney(p.ownerShare||0))} · units +${p.buyUnits||0} / -${p.unitDecay||0}`;
    }catch(e){}
  };
  window.stage13lConfirmOwnerDecision=function(club){
    club=String(club||state?.humanClub||'');
    if(!club) return;
    const sel=stage13lReadControllerSelection(club);
    const p=controllerPlanFromSelection(club,sel.decision,sel.units,sel.focus,sel.inject);
    return confirmControllerPlan(club,p,sel.decision);
  };
  window.stage13aClearDevelopmentPlan=function(club){
    const o=owner();
    if(o.pendingPlan && o.pendingPlan.club===club) o.pendingPlan=null;
    try{ setStatus('No owner vote selected. The board recommendation will apply when next season starts.', 'warn'); }catch(e){}
    renderSoon();
  };
  window.stage13aCashOutCurrentClub=function(){
    const club=state?.humanClub;
    if(!club) return;
    const co=clubOwner(club);
    if(n(co.stake)<=0) return;
    const payout=round1(stakeValue(club)*0.80);
    addWealth(payout);
    const oldStake=n(co.stake);
    co.shareHistory.push({season:n(state?.seasonNumber||1), club, from:oldStake, to:0, payout, type:'voluntary-sale', value:clubValue(club)});
    co.stake=0; co.buyInPaid=0;
    owner().lastSale={club,payout,method:'voluntary cash out',season:n(state?.seasonNumber||1)};
    try{ addLog(`<b>Manager-owner sale:</b> You sold your ${oldStake}% stake in ${esc(club)} for ${fmtMoney(payout)} after the 80% voluntary-sale haircut.`); }catch(e){}
    renderSoon();
  };

  function sellStakeForMove(savedOwner, savedWealth, club, sacked){
    const co=savedOwner.clubs[club];
    if(!co || n(co.stake)<=0) return {payout:0, stake:0};
    const value=stakeValue(club,n(co.stake));
    const payout=sacked ? round1(n(co.buyInPaid)*0.10) : round1(value*0.80);
    savedWealth.personalWealth=round3(n(savedWealth.personalWealth)+payout);
    const stake=n(co.stake);
    co.shareHistory=Array.isArray(co.shareHistory)?co.shareHistory:[];
    co.shareHistory.push({season:n(state?.seasonNumber||1), club, from:stake, to:0, payout, type:sacked?'sacked-fire-sale':'job-move-sale', value:clubValue(club)});
    co.stake=0; co.buyInPaid=0;
    savedOwner.lastSale={club,payout,method:sacked?'sacked fire sale':'voluntary job move sale',season:n(state?.seasonNumber||1)};
    return {payout, stake};
  }
  function applyPlanToClub(savedOwner, savedWealth, club){
    const liveOwner=state.managerOwner;
    state.managerOwner=savedOwner;
    const already=lockedBoardroomPlan(club);
    if(already){
      state.managerOwner=liveOwner;
      return {paid:true,lost:n(already.unitsLost),revenue:0,plan:already,downgraded:!!already.downgraded,alreadyApplied:true};
    }
    let p=savedOwner.pendingPlan && savedOwner.pendingPlan.club===club ? savedOwner.pendingPlan : boardRecommendedPlan(club);
    const co=clubOwner(club);
    const stake=n(co.stake);
    let paid=true, lost=0, downgraded=false;
    if(p && n(p.ownerShare)>0){
      const controller = stake>=51 || p.voteResult==='Controlling owner decision';
      const safe = controller ? (n(savedWealth.personalWealth)+0.0001>=n(p.ownerShare)) : forcedPlanIsSafe(p,savedWealth);
      if(!safe){
        p={...maintenancePlan(club,'Maintenance only'), downgradedFrom:p.label, voteResult:'Affordability protection'};
        downgraded=true;
      }
    }
    if(p && n(p.ownerShare)>0){
      if(n(savedWealth.personalWealth)+0.0001>=n(p.ownerShare)){
        savedWealth.personalWealth=round3(n(savedWealth.personalWealth)-n(p.ownerShare));
        paid=true;
      } else {
        p={...maintenancePlan(club,'Maintenance only'), downgradedFrom:p.label, voteResult:'Affordability protection'};
        downgraded=true;
        paid=true;
      }
    }
    if(paid){
      if(n(p.unitDecay)>0){
        lost=n(p.unitDecay);
        removeUnitsFromClub(club,lost);
      }
      if(n(p.buyUnits)>0) addUnitsToClub(club,n(p.buyUnits),p.focusCategory);
      co.totalInvested=round3(n(co.totalInvested)+n(p.ownerShare));
      co.lastPlan={...p, paid:true, downgraded, unitsLost:lost, appliedSeason:n(state?.seasonNumber||1)};
    }
    const revenue=round1(n(p.transferBudgetBonus));
    co.lastTransferRevenue=revenue;
    savedOwner.pendingPlan=null;
    state.managerOwner=liveOwner;
    return {paid,lost,revenue,plan:p,downgraded};
  }
  function applyPendingBuyIn(savedOwner, savedWealth, club){
    const pb=savedOwner.pendingBuyIn;
    if(!pb || pb.club!==club) return null;
    const liveOwner=state.managerOwner;
    state.managerOwner=savedOwner;
    const cost=buyCostToStake(club,pb.targetStake);
    const co=clubOwner(club);
    let ok=false;
    if(n(savedWealth.personalWealth)+0.0001>=cost && n(co.stake)<n(pb.targetStake)){
      savedWealth.personalWealth=round3(n(savedWealth.personalWealth)-cost);
      const old=n(co.stake);
      co.stake=n(pb.targetStake);
      co.buyInPaid=round3(n(co.buyInPaid)+cost);
      co.totalInvested=round3(n(co.totalInvested)+cost);
      co.shareHistory.push({season:n(state?.seasonNumber||1), club, from:old, to:n(pb.targetStake), cost, value:clubValue(club), type:'new-job-buy'});
      ok=true;
    }
    savedOwner.pendingBuyIn=null;
    state.managerOwner=liveOwner;
    return {ok,cost,target:pb.targetStake,club};
  }
  function checkFinancialCollapse(savedOwner, savedWealth, club){
    const liveOwner=state.managerOwner;
    state.managerOwner=savedOwner;
    const econ=unitEconomy(club);
    if(econ.units>0){ state.managerOwner=liveOwner; return false; }
    const rescue=round1(baseUnitCost(club)*5);
    if(n(savedWealth.personalWealth)>=rescue){
      savedWealth.personalWealth=round3(n(savedWealth.personalWealth)-rescue);
      addUnitsToClub(club,5);
      state.managerOwner=liveOwner;
      return false;
    }
    savedWealth.personalWealth=0;
    const mp=profile(); mp.rating=1; mp.lastDelta=-99; mp.lastBreakdown=['Financial collapse under manager-owner control'];
    const co=clubOwner(club); co.stake=0; co.buyInPaid=0;
    savedOwner.lastEvent='financial-collapse';
    state.managerOwner=liveOwner;
    return true;
  }

  const oldSackingDecision=typeof endSeasonSackingDecision==='function'?endSeasonSackingDecision:null;
  if(oldSackingDecision && !window.__stage13aSackingPatch){
    window.__stage13aSackingPatch=true;
    endSeasonSackingDecision=function(pos){
      const res=oldSackingDecision.apply(this,arguments);
      try{
        if(!res || !res.sacked) return res;
        if(String(res.reason||'').toLowerCase().includes('squad strength crashed')) return res;
        const stake=currentStake(state.humanClub);
        const patience=stake>=51?6:stake>=25?3:stake>=5?1:0;
        if(patience<=0) return res;
        const exp=expectedFinish(state.humanClub);
        const miss=n(pos)-n(exp);
        const base=typeof sackingThreshold==='function'?sackingThreshold():3;
        if(miss < base+patience){
          return {sacked:false, reason:`Manager-owner patience: your ${stake}% stake added ${patience} place${patience===1?'':'s'} of board tolerance.`};
        }
      }catch(e){}
      return res;
    };
    window.endSeasonSackingDecision=endSeasonSackingDecision;
  }

  const oldRenderManager=typeof renderManagerCareerPanel==='function'?renderManagerCareerPanel:null;
  if(oldRenderManager && !window.__stage13aManagerPanelPatch){
    window.__stage13aManagerPanelPatch=true;
    renderManagerCareerPanel=function(){ const out=oldRenderManager.apply(this,arguments); try{ injectManagerOwnerPanel(); }catch(e){} return out; };
    window.renderManagerCareerPanel=renderManagerCareerPanel;
  }
  const oldSeasonSummary=typeof renderSeasonSummary==='function'?renderSeasonSummary:null;
  if(oldSeasonSummary && !window.__stage13aSeasonSummaryPatch){
    window.__stage13aSeasonSummaryPatch=true;
    renderSeasonSummary=function(){ const out=oldSeasonSummary.apply(this,arguments); try{ injectEndSeasonOwnerSummary(); }catch(e){} return out; };
    window.renderSeasonSummary=renderSeasonSummary;
  }
  const oldAcceptJob=typeof acceptJobAdvert==='function'?acceptJobAdvert:null;
  if(oldAcceptJob && !window.__stage13aAcceptJobPatch){
    window.__stage13aAcceptJobPatch=true;
    acceptJobAdvert=function(jobId,source){
      const out=oldAcceptJob.apply(this,arguments);
      try{
        const pending=state?.pendingJobAppointment?.to;
        const o=owner();
        if(o.pendingBuyIn && o.pendingBuyIn.club!==pending) o.pendingBuyIn=null;
        if(typeof render==='function') render();
      }catch(e){}
      return out;
    };
    window.acceptJobAdvert=acceptJobAdvert;
  }
  const oldStartNext=typeof startNextSeasonWithCurrentSquad==='function'?startNextSeasonWithCurrentSquad:null;
  if(oldStartNext && !window.__stage13aNextSeasonPatch){
    window.__stage13aNextSeasonPatch=true;
    startNextSeasonWithCurrentSquad=function(){
      let savedOwner, savedWealth, oldClub, pendingClub, wasSacked=false, sale=null, planResult=null;
      try{
        updateMilestone();
        savedOwner=JSON.parse(JSON.stringify(owner()));
        savedWealth=JSON.parse(JSON.stringify(wealth()));
        oldClub=state?.humanClub;
        pendingClub=state?.pendingJobAppointment?.to || null;
        const pos=state?.season ? (leagueTable().findIndex(r=>r.club===oldClub)+1) : 0;
        const sack=state?.season?.sacking || (typeof endSeasonSackingDecision==='function'?endSeasonSackingDecision(pos):null);
        wasSacked=!!sack?.sacked;
        if(oldClub && !pendingClub && !wasSacked && currentStake(oldClub)>0 && !lockedBoardroomPlan(oldClub)){
          try{ setStatus('Confirm an owner boardroom decision before starting next season.', 'bad'); }catch(e){}
          try{ renderSeasonSummary(); }catch(e){}
          return;
        }
        if(oldClub && (pendingClub || wasSacked)) sale=sellStakeForMove(savedOwner,savedWealth,oldClub,wasSacked);
        else if(oldClub) planResult=applyPlanToClub(savedOwner,savedWealth,oldClub);
      }catch(e){}
      const out=oldStartNext.apply(this,arguments);
      try{
        if(savedOwner){
          state.managerOwner=savedOwner;
          state.managerWealth=savedWealth || wealth();
          const newClub=state?.humanClub;
          const moved=oldClub && newClub && newClub!==oldClub;
          if(moved){
            const buy=applyPendingBuyIn(state.managerOwner,state.managerWealth,newClub);
            if(sale && sale.payout>0) addLog(`<b>Manager-owner sale:</b> Your ${sale.stake}% stake in ${esc(oldClub)} was sold for ${fmtMoney(sale.payout)}.`);
            if(buy){
              if(buy.ok) addLog(`<b>Manager-owner buy-in:</b> You bought ${buy.target}% of ${esc(newClub)} for ${fmtMoney(buy.cost)} as part of the job move.`);
              else addLog(`<b>Manager-owner buy-in failed:</b> You selected ${buy.target}% of ${esc(newClub)}, but did not have enough personal wealth after the move.`);
            }
          } else if(planResult && newClub && !planResult.alreadyApplied){
            const t=team(newClub);
            if(t && planResult.revenue>0){
              t.budget=round1(n(t.budget)+n(planResult.revenue));
              addLog(`<b>Club development decision:</b> ${esc(newClub)} moved ${fmtMoney(planResult.revenue)} into this summer's transfer budget.`);
            }
            if(planResult.plan){
              const unitBits=[];
              if(n(planResult.plan.buyUnits)>0) unitBits.push(`added ${planResult.plan.buyUnits} unit${planResult.plan.buyUnits===1?'':'s'}`);
              if(n(planResult.lost)>0) unitBits.push(`lost ${planResult.lost} unit${planResult.lost===1?'':'s'}`);
              const unitText=unitBits.length ? ` and ${unitBits.join(', ')}` : '';
              if(planResult.downgraded) addLog(`<b>Club development protection:</b> A larger ${esc(planResult.plan.downgradedFrom||'board')} plan was unaffordable, so ${esc(newClub)} used maintenance only.`);
              else addLog(`<b>Club development:</b> ${esc(planResult.plan.label)} applied${unitText}. Your shareholder contribution was ${fmtMoney(planResult.plan.ownerShare)}.`);
            }
          }
          if(newClub && checkFinancialCollapse(state.managerOwner,state.managerWealth,newClub)){
            addLog(`<b>Financial collapse:</b> Club units hit zero and you could not fund the rescue. Your owner stake was wiped and manager reputation has fallen to 1.`);
          }
          refreshVersion(); save();
          if(typeof render==='function') setTimeout(()=>render(),0);
        }
      }catch(e){}
      return out;
    };
    window.startNextSeasonWithCurrentSquad=startNextSeasonWithCurrentSquad;
  }
  const oldLoad=typeof loadSavedGame==='function'?loadSavedGame:null;
  if(oldLoad && !window.__stage13aLoadPatch){
    window.__stage13aLoadPatch=true;
    loadSavedGame=function(){ const out=oldLoad.apply(this,arguments); try{ owner(); refreshVersion(); }catch(e){} return out; };
    window.loadSavedGame=loadSavedGame;
  }
  const oldRender=typeof render==='function'?render:null;
  if(oldRender && !window.__stage13aRenderPatch){
    window.__stage13aRenderPatch=true;
    render=function(){ const out=oldRender.apply(this,arguments); try{ owner(); refreshVersion(); }catch(e){} return out; };
    window.render=render;
  }

  function boot(){ try{ owner(); refreshVersion(); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.stage13aClubValue=clubValue;
  window.stage13aUnitEconomy=unitEconomy;
  window.stage13aPlanCost=planCost;
  window.stage13aPlanCostCustom=planCostCustom;
  window.stage13aNextUnitCost=nextUnitCost;
  window.stage13aClubOwner=clubOwner;
  window.stage13aOwnerState=owner;
  window.stage13aTotalUnits=totalUnits;
  window.stage13aAddUnitsToClub=addUnitsToClub;
  window.stage13cBoardroomPlanOptions=boardroomPlanOptions;
  window.stage13cBoardRecommendedPlan=boardRecommendedPlan;
  window.stage13lControllerPlanFromSelection=controllerPlanFromSelection;
  window.stage13lAffordableImprovementMax=affordableImprovementMax;
  window.stage13eBoardPersonality=boardPersonality;
  window.stage13eCategoryBonuses=categoryBonuses;
  window.stage13eCategoryBonusesFromUnits=categoryBonusesFromUnits;
})();
