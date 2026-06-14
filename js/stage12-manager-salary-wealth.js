/* Stage 12A: Manager Salary and Market Value.
   Personal manager earnings, yearly salary reviews and market-value job offers.
   No ownership mechanics yet. */
(function(){
  if(window.__stage12AManagerSalaryMarketValue) return;
  window.__stage12AManagerSalaryMarketValue = true;

  const VERSION = 'Version 12A · Beta';

  function el(id){ return document.getElementById(id); }
  function esc(s){
    if(typeof escapeHtml === 'function') return escapeHtml(s);
    return String(s==null?'':s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function clampLocal(n,a,b){ return Math.max(a, Math.min(b, Number(n||0))); }
  function fmtMoney(n){ return typeof money === 'function' ? money(n) : '£'+Number(n||0).toFixed(1)+'m'; }
  function rounded(n){ return Math.max(0, Math.round(Number(n||0)*10)/10); }
  function clone(x){ try{ return JSON.parse(JSON.stringify(x)); }catch(e){ return x; } }
  function currentSeasonNumber(){ return Number(state?.seasonNumber || 1); }
  function profile(){ try{ return managerProfile(); }catch(e){ return {rating:45, history:[]}; } }
  function bandName(){ try{ return managerBand().name; }catch(e){ return 'Non-League'; } }
  function stageDivisionForClub(club){
    try{ if(typeof stage9ClubDivision === 'function') return stage9ClubDivision(club); }catch(e){}
    try{ const info = typeof stage9ClubInfo === 'function' ? stage9ClubInfo(club) : null; if(info?.division) return info.division; }catch(e){}
    return (state?.currentDivision || 'top');
  }
  function expected(club){ try{ return Number(expectedFinish(club) || 20); }catch(e){ return 20; } }
  function currentTablePosition(club){
    try{ if(state?.season){ const t=leagueTable(); const idx=t.findIndex(r=>r.club===club); if(idx>=0) return idx+1; } }catch(e){}
    return null;
  }
  function clubInfo(club){ try{ return typeof stage9ClubInfo === 'function' ? stage9ClubInfo(club) : null; }catch(e){ return null; } }
  function basePull(club){
    try{ if(typeof baseClubPullRatingLimit === 'function') return Number(baseClubPullRatingLimit(club) || 70); }catch(e){}
    const info=clubInfo(club);
    if(info?.division==='second'){
      if(club==='Wrexham') return 88;
      if(info.sourceLevel==='Championship') return 76;
      if(info.sourceLevel==='League One') return 70;
      if(info.sourceLevel==='League Two') return 63;
      if(info.sourceLevel==='National League') return 58;
      return 68;
    }
    const exp=expected(club);
    if(exp<=3) return 99; if(exp<=6) return 92; if(exp<=10) return 88; if(exp<=14) return 84; if(exp<=17) return 78; return 70;
  }
  function originalClubPayCeiling(club){
    const pull=basePull(club);
    const info=clubInfo(club);
    let cap;
    if(pull>=97) cap=20;
    else if(pull>=94) cap=17;
    else if(pull>=90) cap=13;
    else if(pull>=86) cap=8.5;
    else if(pull>=81) cap=5.5;
    else if(pull>=76) cap=3.2;
    else if(pull>=70) cap=2.2;
    else if(pull>=63) cap=1.2;
    else cap=0.65;
    if(info?.division==='second'){
      const mb=Number(info.manualTransferBudget || 0);
      if(club==='Wrexham') cap=Math.max(cap, 4.5);
      else if(mb>=35) cap=Math.max(cap, 2.4);
      else if(mb>=20) cap=Math.max(cap, 1.7);
      else if(mb>=10) cap=Math.max(cap, 1.0);
      else if(mb>=4) cap=Math.max(cap, 0.65);
      else cap=Math.max(cap, 0.45);
    }
    return rounded(cap);
  }
  function clubGrowthBoost(club){
    let boost=0;
    try{
      if(typeof clubTier === 'function'){
        const t=Number(clubTier(club) || 6);
        if(t===1) boost+=2.5;
        else if(t===2) boost+=2.0;
        else if(t===3) boost+=1.3;
        else if(t===4) boost+=0.7;
        else if(t===5) boost+=0.25;
      }
    }catch(e){}
    const div=stageDivisionForClub(club);
    if(div==='top') boost+=0.45;
    return rounded(boost);
  }
  function clubPayCeiling(club){
    const original=originalClubPayCeiling(club);
    const boost=clubGrowthBoost(club);
    const info=clubInfo(club);
    const grown=original + boost;
    // Small clubs can grow, but their wage ceiling stays emotionally lower than an elite giant.
    if(info?.division==='second' && original<2) return rounded(Math.min(4.0, grown));
    if(info?.division==='second' && original<3) return rounded(Math.min(5.0, grown));
    return rounded(Math.min(original + 3.0, grown));
  }
  function clubPayBandLabel(club){
    const cap=clubPayCeiling(club);
    if(cap>=16) return 'superclub wage power';
    if(cap>=10) return 'elite wage power';
    if(cap>=6) return 'big-club wage power';
    if(cap>=3) return 'strong but limited wage power';
    if(cap>=1.3) return 'modest wage power';
    return 'small-club wage power';
  }
  function careerClimbBank(){
    const mp=profile();
    const scores=mp.clubCareerClimbScores && typeof mp.clubCareerClimbScores==='object' ? mp.clubCareerClimbScores : {};
    return Object.values(scores).reduce((a,b)=>a+Math.max(0,Number(b||0)),0);
  }
  function recentOverperformance(){
    const hist=Array.isArray(state?.careerHistory) ? state.careerHistory.slice(-5) : [];
    return hist.reduce((sum,h)=>sum + Math.max(0, Number(h.expected||20) - Number(h.position||20)), 0);
  }
  function lowerClubMiracleCount(){
    const mp=profile();
    const baselines=mp.clubCareerBaselines && typeof mp.clubCareerBaselines==='object' ? mp.clubCareerBaselines : {};
    const best=mp.clubBestCareerClimbs && typeof mp.clubBestCareerClimbs==='object' ? mp.clubBestCareerClimbs : {};
    return Object.keys(best).filter(club => Number(baselines[club]||0)>20 && Number(best[club]||0)>=10).length;
  }
  function managerLeverage(){
    const rating=Number(profile().rating || 45);
    const climb=careerClimbBank();
    const recent=recentOverperformance();
    const lowerMiracles=lowerClubMiracleCount();
    const climbPremium=Math.min(26, climb*0.65);
    const recentPremium=Math.min(14, recent*1.15);
    const lowerPremium=Math.min(10, lowerMiracles*3.5);
    const score=clampLocal(rating + climbPremium + recentPremium + lowerPremium - 45, 0, 100);
    const label = score>=82 ? 'world-class leverage' : score>=65 ? 'elite leverage' : score>=45 ? 'strong leverage' : score>=24 ? 'growing leverage' : 'limited leverage';
    return {score:rounded(score), rating, climb, recent, lowerMiracles, label};
  }
  function managerMarketSalary(){
    const rating=Number(profile().rating || 45);
    let base;
    if(rating>=98) base=7.0;
    else if(rating>=90) base=5.5;
    else if(rating>=80) base=3.8;
    else if(rating>=70) base=2.4;
    else if(rating>=60) base=1.35;
    else if(rating>=50) base=0.75;
    else base=0.35;
    const lev=managerLeverage();
    const miraclePremium=Math.min(11.0, (lev.climb*0.12) + (lev.recent*0.18) + (lev.lowerMiracles*1.2));
    return rounded(base + miraclePremium);
  }
  function currentClubFloorFraction(){
    const rating=Number(profile().rating || 45);
    if(rating>=98) return 0.66;
    if(rating>=90) return 0.56;
    if(rating>=80) return 0.45;
    if(rating>=70) return 0.36;
    if(rating>=60) return 0.30;
    if(rating>=50) return 0.25;
    return 0.22;
  }
  function salaryOfferForClub(club, options={}){
    const outside=!!options.outside;
    const cap=clubPayCeiling(club);
    const market=managerMarketSalary();
    const lev=managerLeverage();
    const currentClub=state?.humanClub;
    const elitePoach = outside && cap>=10 && lev.score>=55;
    const disruptPremium = elitePoach ? Math.min(5.5, lev.score*0.07) : 0;
    const poachPremium = outside ? Math.min(3.0, lev.score*0.035) : 0;
    let salary;
    if(outside){
      const floor = cap * (cap>=10 ? 0.42 : cap>=6 ? 0.36 : 0.28);
      salary = Math.max(floor, market*1.12 + poachPremium + disruptPremium);
    } else {
      const floor = cap * currentClubFloorFraction();
      salary = Math.max(floor, market*0.66);
      // Loyalty clubs stretch a little after sustained climb, but cannot match superclub money.
      if(currentClub && currentClub===club && lev.climb>=12) salary += Math.min(0.8, lev.climb*0.015);
    }
    salary = rounded(Math.min(cap, salary));
    const gap = outside && state?.humanClub ? rounded(Math.max(0, salary - currentSalaryAmount())) : 0;
    let kind = outside ? 'outside offer' : 'yearly review';
    if(outside && gap>=5) kind = 'sell-out money';
    else if(outside && elitePoach) kind = 'elite poach offer';
    else if(!outside && cap<=4 && lev.score>=65) kind = 'loyalty ceiling';
    return {club, salary, cap, market, leverage:lev, gap, kind, outside, payBand:clubPayBandLabel(club)};
  }
  function blankWealth(){
    return {
      personalWealth:0,
      careerEarnings:0,
      careerBonuses:0,
      settlements:[],
      salaryHistory:[],
      currentSalaryDeal:null,
      lastSettlement:null,
      lastSalaryReview:null,
      acceptedJobOffer:null,
      // compatibility with Stage 12 draft saves
      contracts:[],
      currentContract:null
    };
  }
  function normaliseWealth(source){
    const w={...blankWealth(), ...(source || {})};
    w.personalWealth=rounded(w.personalWealth);
    w.careerEarnings=rounded(w.careerEarnings);
    w.careerBonuses=rounded(w.careerBonuses);
    w.settlements=Array.isArray(w.settlements)?w.settlements:[];
    w.salaryHistory=Array.isArray(w.salaryHistory)?w.salaryHistory:(Array.isArray(w.contracts)?w.contracts:[]);
    if(!w.currentSalaryDeal && w.currentContract){
      w.currentSalaryDeal={
        club:w.currentContract.club || state?.humanClub || 'Unknown club',
        season:Number(w.currentContract.signedSeason || currentSeasonNumber()),
        salary:rounded(w.currentContract.salary || 0),
        band:w.currentContract.band || bandName(),
        reason:'Imported old salary deal',
        marketValue:rounded(w.currentContract.salary || 0),
        payCeiling:rounded(w.currentContract.salary || 0),
        leverageScore:0,
        kind:'yearly review'
      };
    }
    if(w.currentSalaryDeal){
      w.currentSalaryDeal={
        club:w.currentSalaryDeal.club || state?.humanClub || 'Unknown club',
        season:Number(w.currentSalaryDeal.season || currentSeasonNumber()),
        salary:rounded(w.currentSalaryDeal.salary || 0),
        band:w.currentSalaryDeal.band || bandName(),
        reason:w.currentSalaryDeal.reason || 'Yearly salary review',
        marketValue:rounded(w.currentSalaryDeal.marketValue || 0),
        payCeiling:rounded(w.currentSalaryDeal.payCeiling || 0),
        leverageScore:rounded(w.currentSalaryDeal.leverageScore || 0),
        kind:w.currentSalaryDeal.kind || 'yearly review',
        payBand:w.currentSalaryDeal.payBand || ''
      };
    }
    w.lastSettlement=w.lastSettlement || null;
    w.lastSalaryReview=w.lastSalaryReview || null;
    w.acceptedJobOffer=w.acceptedJobOffer || null;
    return w;
  }
  function wealth(){
    if(!state) return blankWealth();
    state.managerWealth=normaliseWealth(state.managerWealth);
    return state.managerWealth;
  }
  function currentSalaryAmount(){
    const w=wealth();
    return rounded(Number(w.currentSalaryDeal?.salary || 0));
  }
  function makeSalaryDeal(club, reason, offer=null){
    const analysis = offer || salaryOfferForClub(club, {outside:false});
    return {
      club,
      season:currentSeasonNumber(),
      salary:rounded(analysis.salary),
      band:bandName(),
      reason:reason || 'Yearly salary review',
      marketValue:rounded(analysis.market),
      payCeiling:rounded(analysis.cap),
      leverageScore:rounded(analysis.leverage?.score || 0),
      kind:analysis.kind || 'yearly review',
      payBand:analysis.payBand || clubPayBandLabel(club)
    };
  }
  function ensureSalaryDeal(reason='Current yearly salary'){
    if(!state?.started || !state?.humanClub) return null;
    const w=wealth();
    if(!w.currentSalaryDeal || w.currentSalaryDeal.club!==state.humanClub){
      const deal=makeSalaryDeal(state.humanClub, reason);
      w.currentSalaryDeal=deal;
      w.salaryHistory.push({...deal});
      w.lastSalaryReview=deal;
      return deal;
    }
    return w.currentSalaryDeal;
  }
  function reviewSalary(reason='Yearly salary review', force=false, acceptedOffer=null){
    if(!state?.started || !state?.humanClub) return null;
    const w=wealth();
    const old=w.currentSalaryDeal;
    let deal;
    if(acceptedOffer && acceptedOffer.club===state.humanClub){
      deal=makeSalaryDeal(state.humanClub, reason || 'New job salary agreed', acceptedOffer);
    } else {
      deal=makeSalaryDeal(state.humanClub, reason || 'Yearly salary review');
    }
    const bandChanged = old && old.band!==deal.band;
    const clubChanged = !old || old.club!==deal.club;
    const raise = !old ? deal.salary : rounded(deal.salary - Number(old.salary || 0));
    const meaningfulRaise = raise>=0.2 || (old && deal.salary>Number(old.salary||0)*1.08);
    if(force || clubChanged || bandChanged || meaningfulRaise){
      w.currentSalaryDeal=deal;
      w.salaryHistory.push({...deal, oldSalary:old?rounded(old.salary):0, raise:old?raise:deal.salary});
      w.lastSalaryReview={...deal, oldSalary:old?rounded(old.salary):0, raise:old?raise:deal.salary};
      return deal;
    }
    return old;
  }
  function settledForSeason(season){ return (wealth().settlements || []).find(s => Number(s.season)===Number(season)); }
  function finalTableContext(){
    if(!state?.season || Number(state.season.roundIndex || 0)<38) return null;
    try{
      const table=leagueTable();
      const pos=table.findIndex(r=>r.club===state.humanClub)+1;
      const row=table[pos-1] || null;
      return {table,pos,row,exp:expected(state.humanClub)};
    }catch(e){ return null; }
  }
  function difficultyMultiplier(ctx){
    const over=Math.max(0, Number(ctx.exp||20)-Number(ctx.pos||20));
    const mp=profile();
    const baselines=mp.clubCareerBaselines && typeof mp.clubCareerBaselines==='object' ? mp.clubCareerBaselines : {};
    const baseline=Number(baselines[state.humanClub] || 0);
    let mult=1 + Math.min(1.5, over*0.10);
    if(baseline>30) mult+=0.55;
    else if(baseline>20) mult+=0.30;
    if(stageDivisionForClub(state.humanClub)==='second' && ctx.pos<=3) mult+=0.25;
    return rounded(Math.min(3.0, mult));
  }
  function settlementBonusLines(ctx, deal){
    const lines=[];
    let bonus=0;
    const salary=Number(deal?.salary || 0);
    const pos=Number(ctx.pos||20), exp=Number(ctx.exp||10);
    const over=Math.max(0, exp-pos);
    const diff=difficultyMultiplier(ctx);
    const div=state?.currentDivision || stageDivisionForClub(state.humanClub);
    if(over>0){
      const amount=Math.min(9.0, (0.18*over*diff) + Math.min(2.5, salary*0.08*over));
      bonus+=amount; lines.push(`Overperformance bonus: ${fmtMoney(amount)} for finishing ${over} place${over===1?'':'s'} above the brief.`);
    }
    if(div==='second' && pos<=3){
      const amount = pos===1 ? 4.0*diff : pos===2 ? 3.0*diff : 2.4*diff;
      bonus+=amount; lines.push(`Promotion bonus: ${fmtMoney(amount)} for taking the club up.`);
    }
    if(div!=='second' && pos===1){
      const expectedTitle=exp<=3;
      const amount = expectedTitle ? Math.max(1.2, salary*0.32) : Math.min(15, salary*0.9 + over*0.55*diff);
      bonus+=amount; lines.push(`${expectedTitle?'Title bonus':'Miracle title bonus'}: ${fmtMoney(amount)} for winning the league${expectedTitle?' when trophies were expected':' from outside the normal title picture'}.`);
    } else if(div!=='second' && pos<=4 && exp>4){
      const amount=Math.min(8.0, 1.5*diff + over*0.35);
      bonus+=amount; lines.push(`Breakthrough finish bonus: ${fmtMoney(amount)} for forcing the club into the top four conversation.`);
    }
    if(div!=='second' && exp>=15 && pos<=17){
      const amount=Math.min(4.0, 0.9*diff + salary*0.15);
      bonus+=amount; lines.push(`Survival bonus: ${fmtMoney(amount)} for keeping a vulnerable club up.`);
    }
    if(over>=8){
      const amount=Math.min(6.0, 1.5 + over*0.22*diff);
      bonus+=amount; lines.push(`Miracle-worker bonus: ${fmtMoney(amount)} because the season changed your market value, not just the league table.`);
    }
    if(ctx.row && Number(ctx.row.points||0)>=78 && pos<=6){
      const amount=Math.min(4.0, 0.75 + salary*0.12);
      bonus+=amount; lines.push(`High-points bonus: ${fmtMoney(amount)} for a season that travelled beyond the minimum brief.`);
    }
    return {bonus:rounded(bonus), lines};
  }
  function settleSeasonEarnings(){
    const ctx=finalTableContext();
    if(!ctx) return null;
    const season=currentSeasonNumber();
    const already=settledForSeason(season);
    if(already){ wealth().lastSettlement=already; return already; }
    const w=wealth();
    const deal=ensureSalaryDeal('Current yearly salary');
    const salary=rounded(Number(deal?.salary || 0));
    const calc=settlementBonusLines(ctx, deal);
    const bonus=rounded(calc.bonus);
    const total=rounded(salary + bonus);
    const settlement={
      season,
      club:state.humanClub,
      position:ctx.pos,
      expected:ctx.exp,
      salary,
      bonus,
      total,
      wealthBefore:rounded(w.personalWealth),
      wealthAfter:rounded(Number(w.personalWealth||0)+total),
      lines:calc.lines,
      salaryDeal:clone(deal),
      leverage:managerLeverage()
    };
    w.personalWealth=settlement.wealthAfter;
    w.careerEarnings=rounded(Number(w.careerEarnings||0)+total);
    w.careerBonuses=rounded(Number(w.careerBonuses||0)+bonus);
    w.settlements.push(settlement);
    w.lastSettlement=settlement;
    try{ addLog(`<b>Manager earnings:</b> Season ${season} paid ${fmtMoney(salary)} salary${bonus?` plus ${fmtMoney(bonus)} bonus`:''}. Personal wealth is now ${fmtMoney(w.personalWealth)}.`); }catch(e){}
    return settlement;
  }
  function salaryReviewLine(){
    const deal=ensureSalaryDeal('Current yearly salary');
    if(!deal) return 'No active salary yet.';
    const lev=managerLeverage();
    const loyaltyCap = deal.kind==='loyalty ceiling' || (deal.payCeiling<=4 && lev.score>=65);
    if(loyaltyCap) return `${state.humanClub} value you highly, but their ${deal.payBand} limits the yearly salary they can offer.`;
    return `Yearly review: ${deal.payBand}; your market status is ${lev.label}.`;
  }
  function wealthPanelHtml(){
    if(!state?.started) return '';
    const w=wealth();
    const deal=ensureSalaryDeal('Current yearly salary');
    const lev=managerLeverage();
    const last=w.lastSettlement;
    const lastLine = last ? `Last paid: ${fmtMoney(last.salary)} salary${last.bonus?` + ${fmtMoney(last.bonus)} bonus`:''}.` : 'First payday arrives at the end of the season.';
    return `<div class="stage12-wealth-card">
      <div class="stage12-wealth-head"><b>Manager salary</b><span>${esc(bandName())}</span></div>
      <div class="stage12-wealth-grid">
        <div><span>Yearly salary</span><strong>${esc(fmtMoney(deal?.salary || 0))}</strong></div>
        <div><span>Personal wealth</span><strong>${esc(fmtMoney(w.personalWealth))}</strong></div>
        <div><span>Career earnings</span><strong>${esc(fmtMoney(w.careerEarnings))}</strong></div>
        <div><span>Bonuses</span><strong>${esc(fmtMoney(w.careerBonuses))}</strong></div>
      </div>
      <div class="stage12-contract-line"><b>Market value:</b> ${esc(lev.label)} · climb bank ${esc(lev.climb)} · recent overperformance ${esc(lev.recent)}.</div>
      <div class="stage12-contract-line">${esc(salaryReviewLine())}</div>
      <div class="stage12-contract-line">${esc(lastLine)} Personal wealth does not affect the transfer budget.</div>
    </div>`;
  }
  function settlementHtml(){
    const s=settleSeasonEarnings();
    if(!s) return '';
    const lineHtml = s.lines && s.lines.length ? `<div class="stage12-pay-lines">${s.lines.map(x=>`<div>${esc(x)}</div>`).join('')}</div>` : '<div class="muted">No performance bonus this season. Salary still paid.</div>';
    return `<div class="manager-rep-detail stage12-end-pay"><b>Manager pay review</b>
      <div class="manager-rep-grid">
        <div class="manager-rep-stat"><span>Salary</span><strong>${esc(fmtMoney(s.salary))}</strong></div>
        <div class="manager-rep-stat"><span>Bonus</span><strong>${esc(fmtMoney(s.bonus))}</strong></div>
        <div class="manager-rep-stat"><span>Paid</span><strong>${esc(fmtMoney(s.total))}</strong></div>
        <div class="manager-rep-stat"><span>Wealth</span><strong>${esc(fmtMoney(s.wealthAfter))}</strong></div>
      </div>
      ${lineHtml}
      <div class="muted" style="margin-top:6px">Bonuses are weighted toward hard jobs, promotions, survival jobs and serious overperformance. Expected success at an elite club pays less.</div>
    </div>`;
  }
  function injectWealthIntoManagerPanel(){
    const box=el('managerCareerPanel');
    if(!box || !state?.started) return;
    const old=box.querySelector('.stage12-wealth-card');
    if(old) old.remove();
    const holder=document.createElement('div');
    holder.innerHTML=wealthPanelHtml();
    if(holder.firstElementChild) box.appendChild(holder.firstElementChild);
  }
  function injectSettlementIntoSummary(){
    const box=el('seasonSummary');
    if(!box || !state?.season || Number(state.season.roundIndex||0)<38) return;
    const existing=box.querySelector('.stage12-end-pay');
    if(existing) existing.remove();
    const html=settlementHtml();
    if(!html) return;
    const managerDetail=box.querySelector('.manager-rep-detail');
    if(managerDetail) managerDetail.insertAdjacentHTML('afterend', html);
    else box.insertAdjacentHTML('beforeend', html);
  }
  function addWealthToClubBadges(){
    const badges=el('clubInfoBadges');
    if(!badges || !state?.started) return;
    const existing=badges.querySelector('.stage12-wealth-badge');
    if(existing) existing.remove();
    const w=wealth(); const deal=ensureSalaryDeal('Current yearly salary');
    badges.insertAdjacentHTML('beforeend', `<span class="club-info-badge stage12-wealth-badge">Salary: ${esc(fmtMoney(deal?.salary || 0))} · Wealth: ${esc(fmtMoney(w.personalWealth))}</span>`);
  }
  function offerReason(job, offer){
    const lev=offer.leverage || managerLeverage();
    const current=state?.humanClub || '';
    const currentCap=current ? clubPayCeiling(current) : 0;
    if(offer.salary >= currentSalaryAmount()+5 && offer.cap>=10) return `${job.club} are offering sell-out money because your climb work has made you expensive to prise away.`;
    if(offer.cap>=10 && lev.score>=65) return `${job.club} see you as a rare poach target, not just another available manager.`;
    if(current && currentCap<offer.cap && lev.score>=45) return `This is a bigger wage platform than your current club can realistically match.`;
    if(offer.cap<3 && lev.score>=45) return `The wage is modest, but the job offers a platform for another reputation-building climb.`;
    return `The offer reflects your current reputation and their ${offer.payBand}.`;
  }
  function bonusPotentialText(job){
    const exp=expected(job.club);
    const cap=clubPayCeiling(job.club);
    if(cap>=10 && exp<=3) return 'Huge salary, but bonuses mainly require titles and dominance.';
    if(exp>=14) return 'Strong bonus route through survival and overperformance.';
    if(exp>=8) return 'Good bonus route if you move the club above its level.';
    return 'Bonuses depend on beating a demanding brief.';
  }
  function jobOfferHtml(job, compact=false){
    const offer=salaryOfferForClub(job.club, {outside:true, job});
    const current=state?.humanClub ? currentSalaryAmount() : 0;
    const gap=rounded(offer.salary-current);
    const gapLine=gap>0.2 ? ` · ${fmtMoney(gap)} above current salary` : gap<-0.2 ? ` · ${fmtMoney(Math.abs(gap))} below current salary` : ' · similar to current salary';
    return `<div class="stage12-job-offer ${compact?'compact':''}">
      <span><b>Salary offer:</b> ${esc(fmtMoney(offer.salary))} per season${esc(gapLine)}</span>
      <span><b>Bonus route:</b> ${esc(bonusPotentialText(job))}</span>
      <span>${esc(offerReason(job, offer))}</span>
    </div>`;
  }
  function findJob(jobId){
    try{
      state.jobMarket=normaliseJobMarket(state.jobMarket);
      const all=[...(state.jobMarket.adverts||[]), ...(state.jobMarket.endSeasonJobs||[])];
      return all.find(j=>j.id===jobId) || null;
    }catch(e){ return null; }
  }
  function storeAcceptedJobOffer(job){
    if(!job) return null;
    const offer=salaryOfferForClub(job.club, {outside:true, job});
    const w=wealth();
    w.acceptedJobOffer={...clone(offer), jobId:job.id, club:job.club, acceptedSeason:currentSeasonNumber(), source:job.source || 'job'};
    return w.acceptedJobOffer;
  }
  function injectStyles(){
    if(document.getElementById('stage12a-manager-salary-style')) return;
    const st=document.createElement('style');
    st.id='stage12a-manager-salary-style';
    st.textContent=`
      .stage12-wealth-card{margin-top:8px;border:1px solid rgba(236,201,75,.34);background:linear-gradient(135deg,rgba(236,201,75,.13),rgba(11,35,26,.62));border-radius:12px;padding:9px;box-shadow:0 10px 24px rgba(0,0,0,.18)}
      .stage12-wealth-head{display:flex;justify-content:space-between;gap:8px;align-items:center;color:#fff;font-size:10px;margin-bottom:7px}.stage12-wealth-head span{color:#ecd96e;font-weight:900;text-transform:uppercase;font-size:8px;letter-spacing:.08em}
      .stage12-wealth-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.stage12-wealth-grid div{border:1px solid rgba(255,255,255,.10);border-radius:9px;padding:6px;background:rgba(0,0,0,.18)}
      .stage12-wealth-grid span{display:block;color:#9fb2c7;font-size:7px;text-transform:uppercase;letter-spacing:.06em}.stage12-wealth-grid strong{display:block;color:#fff;font-size:11px;margin-top:2px}.stage12-contract-line{font-size:8px;color:#dce7f7;margin-top:6px;line-height:1.35}
      .stage12-end-pay{border-color:rgba(236,201,75,.38)!important}.stage12-pay-lines{margin-top:7px;display:grid;gap:4px}.stage12-pay-lines div{font-size:9px;color:#e8f1ff;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.10);border-radius:8px;padding:5px}
      .stage12-job-offer{margin-top:6px;display:grid;gap:3px;font-size:8.5px;line-height:1.35;color:#dfeaff;background:rgba(236,201,75,.08);border:1px solid rgba(236,201,75,.20);border-radius:9px;padding:6px}.stage12-job-offer b{color:#fff}.stage12-job-offer.compact{font-size:8px;padding:5px}
      @media(max-width:700px){.stage12-wealth-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.stage12-wealth-grid strong{font-size:10px}.stage12-contract-line{font-size:8px}}
    `;
    document.head.appendChild(st);
  }
  function refreshVersion(){ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; }); }
  function afterAnyRender(){
    try{ if(state?.started){ wealth(); ensureSalaryDeal('Current yearly salary'); injectWealthIntoManagerPanel(); addWealthToClubBadges(); injectSettlementIntoSummary(); } }catch(e){}
    refreshVersion();
  }

  const originalStartWindow = typeof startWindow === 'function' ? startWindow : null;
  if(originalStartWindow && !window.__stage12aStartWindowPatched){
    window.__stage12aStartWindowPatched=true;
    startWindow=function(){
      const out=originalStartWindow.apply(this, arguments);
      try{
        state.managerWealth=normaliseWealth(null);
        const deal=reviewSalary('First yearly salary agreed', true);
        addLog(`<b>Manager salary:</b> ${esc(state.humanClub)} will pay ${fmtMoney(deal.salary)} this season. Pay is reviewed yearly; bonuses are where the serious money is.`);
        if(typeof render==='function') render();
      }catch(e){}
      return out;
    };
    window.startWindow=startWindow;
  }

  const previousJobAdvertCopy = typeof jobAdvertCopy === 'function' ? jobAdvertCopy : null;
  if(previousJobAdvertCopy && !window.__stage12aJobCopyPatched){
    window.__stage12aJobCopyPatched=true;
    jobAdvertCopy=function(job){
      const base=previousJobAdvertCopy.apply(this, arguments);
      return `${base}${jobOfferHtml(job,false)}`;
    };
    window.jobAdvertCopy=jobAdvertCopy;
  }

  const previousEndSeasonJobsHtml = typeof endSeasonJobsHtml === 'function' ? endSeasonJobsHtml : null;
  if(previousEndSeasonJobsHtml && !window.__stage12aEndJobsPatched){
    window.__stage12aEndJobsPatched=true;
    endSeasonJobsHtml=function(){
      if(state.pendingJobAppointment && state.pendingJobAppointment.to){
        const offer=wealth().acceptedJobOffer;
        const salaryLine=offer && offer.club===state.pendingJobAppointment.to ? `<div class="stage12-job-offer"><span><b>Agreed salary:</b> ${esc(fmtMoney(offer.salary))} per season.</span><span>${esc(offerReason({club:offer.club}, offer))}</span></div>` : '';
        return `<div class="job-board"><h3>End-of-season job accepted</h3><div class="job-cta-copy">You have agreed to take over <b>${esc(state.pendingJobAppointment.to)}</b> next season. Your budget will be based on their finishing place, not your current club's cash.</div>${salaryLine}</div>`;
      }
      const jobs=generateEndSeasonJobs();
      if(!jobs.length) return '';
      const cards=jobs.map(job=>{
        const eligible=managerEligibleForJob(job);
        const unlocked=!!(state.jobMarket && state.jobMarket.safetyByJob && state.jobMarket.safetyByJob[job.id]);
        return `<div class="job-card"><b>${esc(job.club)}</b><span>${esc(job.type)} · finished ${job.position?ordinal(job.position):'—'}</span><span>Needs reputation ${job.minRep}/100. You: ${managerProfile().rating}/100.</span>${jobOfferHtml(job,true)}<div class="job-card-actions"><button class="secondary tiny" onclick="toggleJobSafety('${esc(job.id)}')">${unlocked?'Safety unlocked':'Safety on'}</button><button class="${eligible?'good':'secondary'} tiny" onclick="acceptJobAdvert('${esc(job.id)}','end-season')" ${(!eligible || !unlocked)?'disabled':''}>Take job</button></div>${eligible?'':'<span class="job-locked-line">Reputation too low.</span>'}</div>`;
      }).join('');
      return `<div class="job-board"><h3>End-of-season jobs</h3><div class="muted" style="margin-bottom:6px">Three clubs are advertising. Salary now reflects both club wage power and your manager market value.</div><div class="job-grid">${cards}</div></div>`;
    };
    window.endSeasonJobsHtml=endSeasonJobsHtml;
  }

  const originalAcceptJobAdvert = typeof acceptJobAdvert === 'function' ? acceptJobAdvert : null;
  if(originalAcceptJobAdvert && !window.__stage12aAcceptJobPatched){
    window.__stage12aAcceptJobPatched=true;
    acceptJobAdvert=function(jobId, source){
      const oldClub=state?.humanClub;
      const job=findJob(jobId);
      const stored=job ? storeAcceptedJobOffer(job) : null;
      const out=originalAcceptJobAdvert.apply(this, arguments);
      try{
        if(job && state?.humanClub && oldClub && state.humanClub!==oldClub){
          const deal=reviewSalary('New job salary agreed', true, stored);
          addLog(`<b>Manager salary:</b> ${esc(state.humanClub)} are paying ${fmtMoney(deal.salary)} per season. ${esc(offerReason(job, stored || salaryOfferForClub(state.humanClub,{outside:true,job})))}`);
          if(typeof render==='function') render();
        }
      }catch(e){}
      return out;
    };
    window.acceptJobAdvert=acceptJobAdvert;
  }

  const originalLoadSavedGame = typeof loadSavedGame === 'function' ? loadSavedGame : null;
  if(originalLoadSavedGame && !window.__stage12aLoadPatched){
    window.__stage12aLoadPatched=true;
    loadSavedGame=function(){
      const out=originalLoadSavedGame.apply(this, arguments);
      try{ wealth(); ensureSalaryDeal('Loaded career salary'); if(typeof render==='function') render(); }catch(e){}
      return out;
    };
    window.loadSavedGame=loadSavedGame;
  }

  const originalRenderManagerCareerPanel = typeof renderManagerCareerPanel === 'function' ? renderManagerCareerPanel : null;
  if(originalRenderManagerCareerPanel && !window.__stage12aManagerPanelPatched){
    window.__stage12aManagerPanelPatched=true;
    renderManagerCareerPanel=function(){ const out=originalRenderManagerCareerPanel.apply(this, arguments); injectWealthIntoManagerPanel(); return out; };
    window.renderManagerCareerPanel=renderManagerCareerPanel;
  }

  const originalRenderClubInfoBottom = typeof renderClubInfoBottom === 'function' ? renderClubInfoBottom : null;
  if(originalRenderClubInfoBottom && !window.__stage12aClubInfoPatched){
    window.__stage12aClubInfoPatched=true;
    renderClubInfoBottom=function(){ const out=originalRenderClubInfoBottom.apply(this, arguments); addWealthToClubBadges(); return out; };
    window.renderClubInfoBottom=renderClubInfoBottom;
  }

  const originalRenderSeasonSummary = typeof renderSeasonSummary === 'function' ? renderSeasonSummary : null;
  if(originalRenderSeasonSummary && !window.__stage12aSeasonSummaryPatched){
    window.__stage12aSeasonSummaryPatched=true;
    renderSeasonSummary=function(){ try{ settleSeasonEarnings(); }catch(e){} const out=originalRenderSeasonSummary.apply(this, arguments); try{ injectSettlementIntoSummary(); }catch(e){} return out; };
    window.renderSeasonSummary=renderSeasonSummary;
  }

  const originalRecordCareerSeasonFinish = typeof recordCareerSeasonFinish === 'function' ? recordCareerSeasonFinish : null;
  if(originalRecordCareerSeasonFinish && !window.__stage12aCareerFinishPatched){
    window.__stage12aCareerFinishPatched=true;
    recordCareerSeasonFinish=function(){ const out=originalRecordCareerSeasonFinish.apply(this, arguments); try{ settleSeasonEarnings(); }catch(e){} return out; };
    window.recordCareerSeasonFinish=recordCareerSeasonFinish;
  }

  const originalStartNextSeason = typeof startNextSeasonWithCurrentSquad === 'function' ? startNextSeasonWithCurrentSquad : null;
  if(originalStartNextSeason && !window.__stage12aNextSeasonPatched){
    window.__stage12aNextSeasonPatched=true;
    startNextSeasonWithCurrentSquad=function(){
      try{ settleSeasonEarnings(); }catch(e){}
      const savedWealth=clone(wealth());
      const oldClub=state?.humanClub;
      const acceptedOffer=savedWealth.acceptedJobOffer || null;
      const out=originalStartNextSeason.apply(this, arguments);
      try{
        state.managerWealth=normaliseWealth(savedWealth);
        const moved=oldClub && state.humanClub && oldClub!==state.humanClub;
        const offerForNewClub=(moved && acceptedOffer && acceptedOffer.club===state.humanClub) ? acceptedOffer : null;
        const deal=reviewSalary(moved?'New job salary agreed':'Yearly salary review', true, offerForNewClub);
        if(moved) addLog(`<b>Manager salary:</b> New job, new wage. ${esc(state.humanClub)} will pay ${fmtMoney(deal.salary)} per season.`);
        else if(wealth().lastSalaryReview && Number(wealth().lastSalaryReview.raise||0)>0.15) addLog(`<b>Manager salary review:</b> ${esc(state.humanClub)} increased your yearly salary to ${fmtMoney(deal.salary)}.`);
        if(typeof render==='function') render();
      }catch(e){}
      return out;
    };
    window.startNextSeasonWithCurrentSquad=startNextSeasonWithCurrentSquad;
  }

  const originalRender = typeof render === 'function' ? render : null;
  if(originalRender && !window.__stage12aRenderPatched){
    window.__stage12aRenderPatched=true;
    render=function(){ const out=originalRender.apply(this, arguments); afterAnyRender(); return out; };
    window.render=render;
  }

  window.stage12SettleSeasonEarnings=settleSeasonEarnings;
  window.stage12ManagerWealthPanelHtml=wealthPanelHtml;
  window.stage12SalaryOfferForClub=salaryOfferForClub;
  window.stage12ManagerLeverage=managerLeverage;

  function boot(){ injectStyles(); refreshVersion(); afterAnyRender(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot,0);
  setInterval(()=>{ try{ refreshVersion(); if(state?.started) afterAnyRender(); }catch(e){} }, 1800);
})();
