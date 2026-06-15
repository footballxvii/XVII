/* Stage 13A: Manager-Owner Foundations.
   Personal wealth can buy a stake in the current club or a job-offer club.
   Club development is intentionally simple under the hood: five visible categories, one hidden 0-50 health score. */
(function(){
  if(window.__stage13aManagerOwnerFoundations) return;
  window.__stage13aManagerOwnerFoundations=true;

  const VERSION='Version 13B · Beta';
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
  function blankClub(club){
    return {club, stake:0, buyInPaid:0, totalInvested:0, units:blankUnits(), lastValuation:0, lastTransferRevenue:0, lastPlan:null, shareHistory:[]};
  }
  function blankOwner(){
    return {version:'13b', unlocked:false, unlockSeason:null, silverSeenSeason:null, goldSeenSeason:null, betaToolsUnlocked:false, clubs:{}, pendingPlan:null, pendingBuyIn:null, lastEvent:null, lastSale:null, lastAppliedSeason:null};
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
      if(pos<=3) return 1.15;
      if(pos<=6) return 1.00;
      if(pos<=12) return 0.88;
      return 0.75;
    }
    if(pos<=1) return 4.00;
    if(pos<=4) return 3.00;
    if(pos<=10) return 2.00;
    if(pos<=17) return 1.50;
    return 1.20;
  }
  function clubValue(club){
    const co=clubOwner(club);
    const val=round1(baseUnitCost(club)*80*statusMultiplier(club)*developmentMultiplier(co.units)*repMultiplier(club));
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
  function addUnitsToClub(club,count){
    const co=clubOwner(club);
    count=Math.max(0, Math.round(n(count)));
    for(let i=0;i<count;i++){
      const slots=CATEGORIES.map(([k])=>[k,n(co.units[k])]).filter(x=>x[1]<10).sort((a,b)=>a[1]-b[1]);
      if(!slots.length) break;
      co.units[slots[0][0]]=n(co.units[slots[0][0]])+1;
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
    const income=round1(units*base*0.25);
    const maintenance=round1(5*base);
    const gap=round1(Math.max(0, maintenance-income));
    const transferRevenue=round1(Math.max(0, (units-20)*base*0.25));
    const decayIfUnfunded=Math.min(units, Math.max(0, Math.ceil(gap/base)));
    return {club, base, units, income, maintenance, gap, transferRevenue, decayIfUnfunded};
  }
  function planCost(club,type='board'){
    const econ=unitEconomy(club);
    let buyUnits=0, label='Board plan';
    if(type==='hold'){ buyUnits=0; label='Hold and maintain'; }
    else if(type==='steady'){ buyUnits=1; label='Steady improvement'; }
    else if(type==='growth'){ buyUnits=3; label='Aggressive growth'; }
    else {
      if(econ.units<15){ buyUnits=0; label='Board repair plan'; }
      else if(econ.units<20){ buyUnits=1; label='Board stability plan'; }
      else if(econ.units<30){ buyUnits=1; label='Board improvement plan'; }
      else if(econ.units<40){ buyUnits=2; label='Board growth plan'; }
      else { buyUnits=0; label='Board hold plan'; }
    }
    return planCostCustom(club,buyUnits,label,type);
  }
  function planCostCustom(club,buyUnits,label=null,type='custom'){
    const econ=unitEconomy(club);
    const maxBuy=Math.max(0,50-n(econ.units));
    buyUnits=clamp(Math.round(n(buyUnits)),0,maxBuy);
    if(label==null){
      if(buyUnits<=0) label='Hold and maintain';
      else if(buyUnits>=maxBuy && maxBuy>0) label='Max out club';
      else label=`Buy ${buyUnits} development unit${buyUnits===1?'':'s'}`;
    }
    let unitCost=0;
    for(let i=0;i<buyUnits;i++) unitCost += nextUnitCost(club,i);
    const total=round1(econ.gap+unitCost);
    const stake=currentStake(club);
    const ownerShare=round1(total*(stake/100));
    const boardShare=round1(Math.max(0,total-ownerShare));
    return {...econ,type,label,buyUnits,unitCost:round1(unitCost),totalCost:total,ownerShare,boardShare,stake};
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
    return `<div class="stage13-unit-grid">`+CATEGORIES.map(([k,label])=>{
      const val=n(co.units[k]);
      return `<div class="stage13-unit-row"><span>${esc(label)}</span><b>${val}/10</b><div class="stage13-unit-bar"><i style="width:${(val/10)*100}%"></i></div></div>`;
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
      <div class="stage13-owner-copy">Personal wealth can buy influence. Club units create future money. The board never simply gifts transfer cash: development revenue comes from the club you build.</div>
      <div class="stage13-beta-tools"><b>BETA TEST TOOLS</b><span>Visible for testing Stage 13 quickly.</span><button class="secondary tiny" onclick="stage13aBetaSilver()">Silver tier + money</button><button class="gold tiny" onclick="stage13aBetaGold()">Gold unlock + money</button></div>
    </div>`;
  }
  function developmentReviewHtml(club, compact=false){
    const co=clubOwner(club);
    const econ=unitEconomy(club);
    const stake=n(co.stake);
    const board=planCost(club,'board');
    const selected=owner().pendingPlan && owner().pendingPlan.club===club ? owner().pendingPlan : null;
    const selectedLine=selected ? `<div class="stage13-selected-plan">Selected for next summer: <b>${esc(selected.label)}</b>. Units to add: ${selected.buyUnits}. Total plan: ${esc(fmtMoney(selected.totalCost||0))}. Your share: ${esc(fmtMoney(selected.ownerShare))}. Other shareholders: ${esc(fmtMoney(selected.boardShare||0))}.</div>` : '';
    let actions='';
    if(stake<=0){
      actions=`<div class="muted">The board controls club development because you do not own a stake yet.</div>`;
    } else if(stake<51){
      actions=`<div class="stage13-plan-actions"><button class="gold tiny" onclick="stage13aSetDevelopmentPlan(${jsArg(club)},'board')">Accept board plan</button><button class="secondary tiny" onclick="stage13aClearDevelopmentPlan(${jsArg(club)})">Do not top up</button></div>
      <div class="muted">Below 51%, the board makes the call. If the plan needs shareholder money, your personal contribution is your ${stake}% share.</div>`;
    } else {
      const maxBuy=Math.max(0,50-n(econ.units));
      const selectedUnits=selected ? clamp(Math.round(n(selected.buyUnits)),0,maxBuy) : Math.min(maxBuy,5);
      const selectId='stage13bUnits_'+safeId(club);
      const options=Array.from({length:maxBuy+1},(_,i)=>{
        const p=planCostCustom(club,i);
        const txt=`${i} unit${i===1?'':'s'} · total ${fmtMoney(p.totalCost)} · your 51% ${fmtMoney(p.ownerShare)} · others ${fmtMoney(p.boardShare)}`;
        return `<option value="${i}" ${i===selectedUnits?'selected':''}>${esc(txt)}</option>`;
      }).join('');
      const picked=planCostCustom(club,selectedUnits);
      actions=`<div class="stage13b-owner-selector">
        <label for="${esc(selectId)}"><b>Units to buy</b><span>Choose any amount from 0 to ${maxBuy}. If you can afford it, you can take the club all the way to 50/50.</span></label>
        <select id="${esc(selectId)}">${options}</select>
        <div class="stage13b-owner-cost-preview">Default selection: ${selectedUnits} unit${selectedUnits===1?'':'s'} · total ${esc(fmtMoney(picked.totalCost))} · your share ${esc(fmtMoney(picked.ownerShare))} · other shareholders ${esc(fmtMoney(picked.boardShare))}</div>
        <div class="stage13-plan-actions">
          <button class="gold tiny" onclick="stage13aSetCustomDevelopmentPlan(${jsArg(club)},document.getElementById('${esc(selectId)}')?document.getElementById('${esc(selectId)}').value:${selectedUnits})">Buy selected units</button>
          <button class="danger tiny" onclick="stage13aSetCustomDevelopmentPlan(${jsArg(club)},${maxBuy})" ${maxBuy<=0?'disabled':''}>Max out club</button>
          <button class="secondary tiny" onclick="stage13aClearDevelopmentPlan(${jsArg(club)})">Clear plan</button>
        </div>
      </div>
      <div class="muted">At 51%, you control the decision. You pay 51% of the total shareholder top-up and the other shareholders pay the remaining 49%.</div>`;
    }
    return `<div class="stage13-development-card ${compact?'compact':''}">
      <div class="stage13-owner-head"><b>Club development review</b><span>${econ.units}/50 units</span></div>
      <div class="stage13-owner-grid">
        <div><span>Unit base cost</span><strong>${esc(fmtMoney(econ.base))}</strong></div>
        <div><span>Annual unit income</span><strong>${esc(fmtMoney(econ.income))}</strong></div>
        <div><span>Renewal need</span><strong>${esc(fmtMoney(econ.maintenance))}</strong></div>
        <div><span>Next revenue</span><strong>${esc(fmtMoney(econ.transferRevenue))}</strong></div>
      </div>
      ${unitBarsHtml(club)}
      <div class="stage13-board-plan"><b>${esc(board.label)}:</b> add ${board.buyUnits} unit${board.buyUnits===1?'':'s'}, total plan cost ${esc(fmtMoney(board.totalCost))}. Your share would be ${esc(fmtMoney(board.ownerShare))}.</div>
      ${selectedLine}
      ${actions}
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
    const w=wealth(); w.personalWealth=Math.max(n(w.personalWealth),999); w.careerEarnings=Math.max(n(w.careerEarnings),999);
    const o=owner(); o.unlocked=false; o.lastEvent='silver-warning'; o.silverSeenSeason=n(state?.seasonNumber||1);
    try{ addLog('<b>Beta test:</b> Manager set to silver tier reputation 89 with £999m personal wealth.'); }catch(e){}
    try{ setStatus('Beta test applied: silver tier and £999m personal wealth.', 'warn'); }catch(e){}
    renderSoon();
  };
  window.stage13aBetaGold=function(){
    const mp=profile();
    mp.rating=99; mp.liveRating=99; mp.committedRating=99; mp.stage13aBeta='gold';
    const w=wealth(); w.personalWealth=Math.max(n(w.personalWealth),999); w.careerEarnings=Math.max(n(w.careerEarnings),999);
    const o=owner(); o.unlocked=true; o.unlockSeason=n(state?.seasonNumber||1); o.goldSeenSeason=n(state?.seasonNumber||1); o.lastEvent='gold-unlock';
    try{ addLog('<b>Beta test:</b> Manager-owner gold tier unlocked with £999m personal wealth.'); }catch(e){}
    try{ setStatus('Beta test applied: gold manager-owner unlock and £999m personal wealth.', 'good'); }catch(e){}
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
  window.stage13aSetDevelopmentPlan=function(club,type){
    const p=planCost(club,type);
    owner().pendingPlan={...p, season:n(state?.seasonNumber||1), club};
    try{ setStatus(`${p.label} selected. Your expected shareholder contribution is ${fmtMoney(p.ownerShare)}.`, 'good'); }catch(e){}
    renderSoon();
  };
  window.stage13aSetCustomDevelopmentPlan=function(club,buyUnits){
    const p=planCostCustom(club,buyUnits);
    owner().pendingPlan={...p, season:n(state?.seasonNumber||1), club};
    try{ setStatus(`${p.label} selected. You will pay ${fmtMoney(p.ownerShare)} and other shareholders will pay ${fmtMoney(p.boardShare)}.`, 'good'); }catch(e){}
    renderSoon();
  };
  window.stage13aClearDevelopmentPlan=function(club){
    const o=owner();
    if(o.pendingPlan && o.pendingPlan.club===club) o.pendingPlan=null;
    try{ setStatus('No personal development top-up selected. If club income cannot cover maintenance, units may fall.', 'warn'); }catch(e){}
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
    const p=savedOwner.pendingPlan && savedOwner.pendingPlan.club===club ? savedOwner.pendingPlan : planCost(club,'board');
    const co=clubOwner(club);
    const econ=unitEconomy(club);
    let paid=false, lost=0;
    if(p && n(p.ownerShare)>0){
      if(n(savedWealth.personalWealth)+0.0001>=n(p.ownerShare)){
        savedWealth.personalWealth=round3(n(savedWealth.personalWealth)-n(p.ownerShare));
        paid=true;
      }
    } else paid=true;
    if(paid){
      addUnitsToClub(club,n(p.buyUnits));
      co.totalInvested=round3(n(co.totalInvested)+n(p.ownerShare));
      co.lastPlan={...p, paid:true, appliedSeason:n(state?.seasonNumber||1)};
    } else {
      lost=econ.decayIfUnfunded;
      removeUnitsFromClub(club,lost);
      co.lastPlan={...p, paid:false, unitsLost:lost, appliedSeason:n(state?.seasonNumber||1)};
    }
    const revenue=unitEconomy(club).transferRevenue;
    co.lastTransferRevenue=revenue;
    savedOwner.pendingPlan=null;
    state.managerOwner=liveOwner;
    return {paid,lost,revenue,plan:p};
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
          } else if(planResult && newClub){
            const t=team(newClub);
            if(t && planResult.revenue>0){
              t.budget=round1(n(t.budget)+n(planResult.revenue));
              addLog(`<b>Club development revenue:</b> ${esc(newClub)} generated ${fmtMoney(planResult.revenue)} from units above self-sustaining level. Added to this summer's transfer cash.`);
            }
            if(planResult.plan && n(planResult.plan.ownerShare)>0){
              if(planResult.paid) addLog(`<b>Club development:</b> ${esc(planResult.plan.label)} applied. Your shareholder contribution was ${fmtMoney(planResult.plan.ownerShare)}.`);
              else addLog(`<b>Club development warning:</b> You could not fund your ${fmtMoney(planResult.plan.ownerShare)} shareholder contribution. The club lost ${planResult.lost} unit${planResult.lost===1?'':'s'}.`);
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
})();
