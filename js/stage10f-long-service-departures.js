/* Stage 10F: long-service departures and retirement absences. */
(function(){
  if(window.__stage10fLongServiceDepartures) return;
  window.__stage10fLongServiceDepartures = true;

  const CONFIG = {
    // Stage 12I: this is now a club-event system, not a roll for every old player.
    // The chance below is the chance of ONE long-service issue at a club, not a chance for each player.
    baseChance:[
      {min:1,max:7,chance:0,label:'No long-service departure risk'},
      {min:8,max:9,chance:0.14,label:'Low watch risk'},
      {min:10,max:12,chance:0.24,label:'Possible single issue'},
      {min:13,max:15,chance:0.34,label:'Likely single issue'},
      {min:16,max:18,chance:0.42,label:'High senior-player watch'},
      {min:19,max:999,chance:0.50,label:'End-of-cycle watch'}
    ],
    ratingMultiplier:[
      {min:0,max:79,mult:1.0},
      {min:80,max:85,mult:1.05},
      {min:86,max:89,mult:1.10},
      {min:90,max:999,mult:1.15}
    ],
    cap:0.62,
    maxPerClubSeason:2,
    valueDamageMultiplier:0.5,
    newChallengeAwayMin:1,
    newChallengeAwayMax:2,
    noReturnSeasons:6,
    personalMin:2,
    personalMax:4,
    familyMin:2,
    familyMax:4,
    retirementMin:5,
    retirementMax:9
  };

  const oldPoolPlayers = typeof poolPlayers === 'function' ? poolPlayers : null;
  const oldMarketCandidateBase = typeof marketCandidateBase === 'function' ? marketCandidateBase : null;
  const oldCanPlayerAcceptClub = typeof canPlayerAcceptClub === 'function' ? canPlayerAcceptClub : null;
  const oldStartNextSeason = typeof startNextSeasonWithCurrentSquad === 'function' ? startNextSeasonWithCurrentSquad : null;
  const oldOpenMidseasonMarket = typeof openMidseasonMarket === 'function' ? openMidseasonMarket : null;
  const oldLoadSavedGame = typeof loadSavedGame === 'function' ? loadSavedGame : null;
  const oldRender = typeof render === 'function' ? render : null;
  const oldRenderPlayers = typeof renderPlayers === 'function' ? renderPlayers : null;
  const oldCloneCareerPlayerForNewSeason = typeof cloneCareerPlayerForNewSeason === 'function' ? cloneCareerPlayerForNewSeason : null;
  const oldInstantPoolSaleFee = typeof instantPoolSaleFee === 'function' ? instantPoolSaleFee : null;
  const oldHumanTransferListFeeMultiplier = typeof humanTransferListFeeMultiplier === 'function' ? humanTransferListFeeMultiplier : null;
  const oldHumanTransferListSaleChance = typeof humanTransferListSaleChance === 'function' ? humanTransferListSaleChance : null;

  function esc(x){ return typeof escapeHtml==='function' ? escapeHtml(String(x ?? '')) : String(x ?? ''); }
  function seasonNo(){ return Math.max(1, Number(state?.seasonNumber || 1)); }
  function marketNo(){ return Math.max(1, Number(state?.marketNo || 1)); }
  function clamp01(n){ return Math.max(0, Math.min(1, Number(n || 0))); }
  function randInt(min,max){ min=Math.ceil(min); max=Math.floor(max); return min + Math.floor(Math.random()*(max-min+1)); }
  function percent(n){ return `${Math.round(clamp01(n)*100)}%`; }

  function ensureLongServiceState(){
    if(!state) return null;
    const ls = state.longServiceDepartures = (state.longServiceDepartures && typeof state.longServiceDepartures==='object') ? state.longServiceDepartures : {};
    ls.history = Array.isArray(ls.history) ? ls.history : [];
    ls.warnings = Array.isArray(ls.warnings) ? ls.warnings : [];
    ls.returns = Array.isArray(ls.returns) ? ls.returns : [];
    return ls;
  }
  function normalisePlayerLongService(p){
    if(!p) return p;
    p.longServiceDeparturePending = !!p.longServiceDeparturePending;
    p.longServicePendingClub = p.longServicePendingClub || null;
    p.longServiceDueSeason = p.longServiceDueSeason ? Number(p.longServiceDueSeason) : null;
    p.longServiceDueMarketNo = p.longServiceDueMarketNo ? Number(p.longServiceDueMarketNo) : null;
    p.longServiceDepartureReason = p.longServiceDepartureReason || '';
    p.longServiceDepartureWarned = !!p.longServiceDepartureWarned;
    p.longServiceAbsentUntilSeason = p.longServiceAbsentUntilSeason ? Number(p.longServiceAbsentUntilSeason) : null;
    p.longServiceAbsentReason = p.longServiceAbsentReason || '';
    p.longServiceNoReturnClub = p.longServiceNoReturnClub || null;
    p.longServiceNoReturnUntilSeason = p.longServiceNoReturnUntilSeason ? Number(p.longServiceNoReturnUntilSeason) : null;
    p.longServiceValueDamaged = !!p.longServiceValueDamaged;
    p.longServiceOriginalMarketValue = p.longServiceOriginalMarketValue ? Number(p.longServiceOriginalMarketValue) : null;
    p.longServiceExternalExitDueSeason = p.longServiceExternalExitDueSeason ? Number(p.longServiceExternalExitDueSeason) : null;
    p.longServiceExternalExitHandled = !!p.longServiceExternalExitHandled;
    if(p.longServiceDeparturePending && p.longServiceValueDamaged && Number(p.longServiceOriginalMarketValue||0)>0){
      const capped = Math.max(1, Math.round(Number(p.longServiceOriginalMarketValue||0) * CONFIG.valueDamageMultiplier));
      if(Number(p.marketValue||0) > capped) p.marketValue = capped;
      p.saleOfferMarketNo = marketNo();
      p.saleOfferMultiplier = CONFIG.valueDamageMultiplier;
      p.saleOfferType = 'longService';
      p.transferListMultiplier = CONFIG.valueDamageMultiplier;
    }
    return p;
  }
  function normaliseAllPlayers(){
    ensureLongServiceState();
    if(Array.isArray(state?.players)) state.players.forEach(normalisePlayerLongService);
  }

  const LONG_SERVICE_PLAYER_FIELDS = [
    'longServiceDeparturePending','longServicePendingClub','longServiceDueSeason','longServiceDueMarketNo',
    'longServiceDepartureReason','longServiceDepartureWarned','longServiceAbsentUntilSeason','longServiceAbsentReason',
    'longServiceNoReturnClub','longServiceNoReturnUntilSeason','longServiceLastDepartureSeason',
    'longServiceLastDepartureReason','longServiceLastDepartureClub'
  ];
  function copyLongServiceFields(from, to){
    if(!from || !to) return to;
    LONG_SERVICE_PLAYER_FIELDS.forEach(k=>{ if(from[k] !== undefined) to[k]=from[k]; });
    return normalisePlayerLongService(to);
  }
  function cloneLongServiceState(source){
    try { return JSON.parse(JSON.stringify(source || {history:[],warnings:[],returns:[],checked:{}})); }
    catch(e){ return {history:[],warnings:[],returns:[],checked:{}}; }
  }
  function isAbsent(p){
    if(!p) return false;
    const until=Number(p.longServiceAbsentUntilSeason || 0);
    return until && until>seasonNo();
  }
  function isBlockedFromClub(p, club){
    if(!p || !club) return false;
    const until=Number(p.longServiceNoReturnUntilSeason || 0);
    return !!(p.longServiceNoReturnClub && p.longServiceNoReturnClub===club && until && until>seasonNo());
  }
  function clearPending(p){
    if(!p) return;
    p.longServiceDeparturePending=false;
    p.longServicePendingClub=null;
    p.longServiceDueSeason=null;
    p.longServiceDueMarketNo=null;
    p.longServiceDepartureReason='';
    p.longServiceDepartureWarned=false;
  }
  function clearDiscontentForLongService(p){
    if(!p) return;
    p.transferRequest=false;
    p.transferRequestReason='';
    p.transferRequestRound=null;
    p.transferRequestSeason=null;
    p.unhappySeasons=0;
    p.transferListed=false;
    p.humanTransferListed=false;
  }
  function isLongServiceDeclared(p){
    return !!(p && p.longServiceDeparturePending && p.longServiceDepartureWarned);
  }
  function damagedLongServiceValue(p){
    if(!p) return 0;
    const base=Number(p.longServiceOriginalMarketValue || p.marketValue || p.baseCost || 0);
    return Math.max(1, Math.round(base * CONFIG.valueDamageMultiplier));
  }
  function damageLongServiceValue(p){
    if(!p) return;
    p.longServiceValueDamaged=true;
    if(!Number(p.longServiceOriginalMarketValue||0)) p.longServiceOriginalMarketValue=Number(p.marketValue || p.baseCost || 1);
    p.marketValue=damagedLongServiceValue(p);
    p.saleOfferMarketNo=marketNo();
    p.saleOfferMultiplier=CONFIG.valueDamageMultiplier;
    p.saleOfferType='longService';
    p.transferListMultiplier=CONFIG.valueDamageMultiplier;
  }
  function longServiceSaleFee(p){
    return isLongServiceDeclared(p) ? damagedLongServiceValue(p) : null;
  }
  function currentSeasonClubIssueCount(club){
    const ls=ensureLongServiceState();
    const s=seasonNo();
    const h=(ls.history||[]).filter(x=>x && x.club===club && Number(x.season||0)===s).length;
    const w=(ls.warnings||[]).filter(x=>x && x.club===club && Number(x.season||0)===s).length;
    return h+w;
  }
  function weightedCandidatePick(candidates, used){
    const pool=candidates.filter(p=>!used.has(Number(p.id)));
    if(!pool.length) return null;
    const entries=pool.map(p=>{
      let w=Math.max(1, Number(p.clubTenure||0)-6);
      if(Number(p.rating||0)>=90) w*=1.20;
      else if(Number(p.rating||0)>=86) w*=1.12;
      if(p.transferRequest) w*=1.35;
      if(p.humanTransferListed) w*=1.20;
      return [p,w];
    });
    const total=entries.reduce((s,x)=>s+x[1],0);
    let r=Math.random()*total;
    for(const [p,w] of entries){ r-=w; if(r<=0) return p; }
    return entries[0][0];
  }
  function clubEventChanceForCandidates(candidates, club){
    if(!candidates.length) return 0;
    const maxTenure=Math.max(...candidates.map(p=>Number(p.clubTenure||0)));
    const band=tenureBand(maxTenure);
    let chance=Number(band.chance||0);
    if(candidates.length>=4) chance+=0.04;
    if(candidates.length>=7) chance+=0.04;
    const elite=candidates.filter(p=>Number(p.rating||0)>=86).length;
    chance+=Math.min(0.08, elite*0.015);
    // Success can explain the story, but it should not create a squad collapse.
    const sm=successMultiplier(club);
    if(sm>1) chance+=0.03;
    return Math.min(CONFIG.cap, chance);
  }
  function possibleSecondIssue(candidates, club){
    const maxTenure=candidates.length ? Math.max(...candidates.map(p=>Number(p.clubTenure||0))) : 0;
    if(maxTenure<12 || candidates.length<5) return false;
    let chance=0.08;
    if(maxTenure>=16) chance=0.14;
    if(candidates.length>=8) chance+=0.04;
    if(club===state.humanClub && Number(state.assistantTier||0)>=3) chance-=0.03;
    return Math.random()<Math.max(0.02, chance);
  }
  function removeFromTeamSquad(club, id){
    const t = typeof team==='function' ? team(club) : state?.teams?.[club];
    if(t && Array.isArray(t.squadIds)) t.squadIds = t.squadIds.filter(x=>Number(x)!==Number(id));
  }

  function tenureBand(tenure){
    const t=Number(tenure || 0);
    return CONFIG.baseChance.find(b=>t>=b.min && t<=b.max) || CONFIG.baseChance[0];
  }
  function ratingMultiplier(rating){
    const r=Number(rating || 0);
    const row=CONFIG.ratingMultiplier.find(x=>r>=x.min && r<=x.max);
    return row ? row.mult : 1;
  }
  function successMultiplier(club){
    const hist=(Array.isArray(state?.careerHistory)?state.careerHistory:[]).filter(h=>h && h.club===club);
    const last=hist[hist.length-1];
    const recent=hist.slice(-5);
    const titles=recent.filter(h=>Number(h.position||99)===1).length;
    if(titles>=3) return 1.06;
    if(last && Number(last.position||99)===1) return 1.04;
    if(last && Number(last.position||99)<=2) return 1.03;
    if(last && Number(last.position||99)<=4) return 1.02;
    return 1.0;
  }
  function departureChance(p, club){
    const base=tenureBand(p.clubTenure).chance;
    if(base<=0) return 0;
    const raw = base * ratingMultiplier(p.rating) * successMultiplier(club);
    return Math.min(CONFIG.cap, raw);
  }
  function chanceBreakdown(p, club){
    const base=tenureBand(p.clubTenure);
    const rm=ratingMultiplier(p.rating);
    const sm=successMultiplier(club);
    const final=departureChance(p, club);
    return {base:base.chance, baseLabel:base.label, ratingMult:rm, successMult:sm, final};
  }
  function assistantWarningReliability(){
    const tier=Number(state?.assistantTier || 0);
    if(tier>=4) return 0.96;
    if(tier>=3) return 0.90;
    if(tier>=2) return 0.76;
    if(tier>=1) return 0.55;
    return 0.22;
  }
  function weightedReason(p){
    const tenure=Number(p.clubTenure || 0);
    const rating=Number(p.rating || 0);
    const rows=[
      {reason:'New challenge', weight: rating>=86 ? 46 : 34},
      {reason:'Personal reasons', weight: 24},
      {reason:'Family reasons', weight: 18},
      {reason:'Retirement', weight: tenure>=19 ? 36 : tenure>=16 ? 26 : tenure>=13 ? 18 : 10}
    ];
    const total=rows.reduce((s,x)=>s+x.weight,0);
    let r=Math.random()*total;
    for(const row of rows){ r-=row.weight; if(r<=0) return row.reason; }
    return rows[0].reason;
  }
  function absenceDuration(reason){
    if(reason==='Personal reasons') return randInt(CONFIG.personalMin, CONFIG.personalMax);
    if(reason==='Family reasons') return randInt(CONFIG.familyMin, CONFIG.familyMax);
    if(reason==='Retirement') return randInt(CONFIG.retirementMin, CONFIG.retirementMax);
    if(reason==='New challenge') return randInt(CONFIG.newChallengeAwayMin, CONFIG.newChallengeAwayMax);
    return 0;
  }
  function dueNow(p){
    if(!p?.longServiceDeparturePending) return false;
    const dueSeason=Number(p.longServiceDueSeason || 0);
    const dueMarket=Number(p.longServiceDueMarketNo || 1);
    const s=seasonNo(), m=marketNo();
    return dueSeason && (s>dueSeason || (s===dueSeason && m>=dueMarket));
  }
  function reasonOutcomeText(reason, duration){
    if(reason==='New challenge') return `leaves the active market for ${duration} season${duration===1?'':'s'} before choosing his next club, and will not rejoin the same club for ${CONFIG.noReturnSeasons} seasons`;
    if(reason==='Retirement') return `retires from the active market for ${duration} seasons before a possible return`;
    if(reason==='Family reasons') return `steps away for ${duration} seasons for family reasons`;
    return `steps away for ${duration} seasons for personal reasons`;
  }

  function returnAbsentPlayers(){
    normaliseAllPlayers();
    const ls=ensureLongServiceState();
    const returns=[];
    for(const p of state.players || []){
      if(!p.longServiceAbsentUntilSeason) continue;
      if(Number(p.longServiceAbsentUntilSeason) <= seasonNo()){
        const reason=p.longServiceAbsentReason || 'time away';
        p.longServiceAbsentUntilSeason=null;
        p.longServiceAbsentReason='';
        p.owner=null;
        p.transferListed=false;
        p.humanTransferListed=false;
        p.transferRequest=false;
        p.lastOwner=null;
        p.clubTenure=0;
        p.startsRemaining=typeof maxStarts==='function' ? maxStarts(p.position) : p.startsRemaining;
        returns.push({id:p.id,name:p.name,reason,season:seasonNo()});
      }
    }
    if(returns.length){
      ls.returns.push(...returns);
      const lines=returns.slice(0,8).map(x=>`${esc(x.name)} has returned to the transfer pool after ${esc(x.reason.toLowerCase())}.`).join('<br>');
      if(typeof addWindowActivity==='function') addWindowActivity(`<b>Returning players:</b><br>${lines}`);
      if(typeof addLog==='function') addLog(`<b>Familiar names return:</b><br>${lines}`);
    }
    return returns;
  }

  function executeDeparture(p, reason, oldClub, context){
    if(!p || !oldClub) return null;
    const duration=absenceDuration(reason);
    const oldTenure=Number(p.clubTenure||0);
    const currentOwner=p.owner;
    removeFromTeamSquad(oldClub, p.id);
    if(currentOwner && currentOwner!==oldClub) removeFromTeamSquad(currentOwner, p.id);
    p.owner=null;
    p.outsideOwner=false;
    p.lastOwner=null;
    p.clubTenure=0;
    p.startsRemaining=typeof maxStarts==='function' ? maxStarts(p.position) : p.startsRemaining;
    clearPending(p);
    clearDiscontentForLongService(p);
    p.longServiceLastDepartureSeason=seasonNo();
    p.longServiceLastDepartureReason=reason;
    p.longServiceLastDepartureClub=oldClub;
    if(reason==='New challenge'){
      p.longServiceNoReturnClub=oldClub;
      p.longServiceNoReturnUntilSeason=seasonNo()+CONFIG.noReturnSeasons;
      p.longServiceAbsentUntilSeason=seasonNo()+duration;
      p.longServiceAbsentReason=reason;
    } else {
      p.longServiceAbsentUntilSeason=seasonNo()+duration;
      p.longServiceAbsentReason=reason;
    }
    p.longServiceValueDamaged=false;
    p.longServiceOriginalMarketValue=null;
    p.longServiceExternalExitHandled=true;
    const entry={season:seasonNo(), marketNo:marketNo(), club:oldClub, playerId:p.id, player:p.name, rating:p.rating, tenure:oldTenure, reason, duration, context, offloadedFrom: currentOwner && currentOwner!==oldClub ? currentOwner : null};
    ensureLongServiceState().history.push(entry);
    const detail=reasonOutcomeText(reason, duration);
    const line=`${esc(p.name)} has left ${esc(oldClub)}. Reason: ${esc(reason)}. He ${esc(detail)}.`;
    if(oldClub===state.humanClub){
      if(typeof addSquadNews==='function') addSquadNews(`<b>Long-service departure:</b> ${line}`);
      if(typeof addLog==='function') addLog(`<b>Long-service departure:</b><br>${line}<br><span class="muted">The club receives £0. You now need to rebuild that squad place.</span>`);
    } else if(typeof addWindowActivity==='function'){
      addWindowActivity(`${line}`);
    }
    return entry;
  }

  function resolveDueDepartures(context){
    normaliseAllPlayers();
    const departed=[];
    for(const p of state.players || []){
      if(!p.longServiceDeparturePending) continue;
      const pendingClub=p.longServicePendingClub;
      if(!pendingClub){ clearPending(p); continue; }
      if(!dueNow(p)) continue;
      const reason=p.longServiceDepartureReason || weightedReason(p);
      if(p.owner!==pendingClub){
        const entry=executeDeparture(p, reason, pendingClub, context || 'offloaded long-service issue still leaves active market');
        if(entry) departed.push(entry);
        continue;
      }
      const entry=executeDeparture(p, reason, pendingClub, context || 'due departure');
      if(entry) departed.push(entry);
    }
    const byClub={};
    departed.forEach(x=>{ byClub[x.club]=(byClub[x.club]||0)+1; });
    Object.keys(byClub).forEach(club=>{ if(club!==state.humanClub && typeof repairClubFromPool==='function') repairClubFromPool(club, false); });
    return departed;
  }

  function createDepartureWarning(p, club, reason, chanceInfo){
    p.longServiceDeparturePending=true;
    p.longServicePendingClub=club;
    p.longServiceDueSeason=seasonNo();
    p.longServiceDueMarketNo=marketNo()+1;
    p.longServiceDepartureReason=reason;
    p.longServiceDepartureWarned=true;
    p.transferRequest=true;
    p.transferRequestReason=`is considering ${reason==='Retirement'?'retirement':reason.toLowerCase()} after years at the club`;
    p.transferRequestSeason=seasonNo();
    p.transferRequestRound=state?.season ? Number(state.season.roundIndex || 0)+1 : 0;
    p.transferListed=true;
    p.unhappySeasons=Math.max(1, Number(p.unhappySeasons || 0));
    damageLongServiceValue(p);
    const warning={season:seasonNo(), marketNo:marketNo(), club, playerId:p.id, player:p.name, rating:p.rating, tenure:Number(p.clubTenure||0), reason, chance:chanceInfo.final, damagedValue:p.marketValue};
    ensureLongServiceState().warnings.push(warning);
    const line=`${esc(p.name)} has given signals that he may leave next window. Reason: ${esc(reason)}. His market value has been cut to ${percent(CONFIG.valueDamageMultiplier)} because buyers know this is an end-of-cycle issue. A good backroom team gives you this warning early enough to sell or replace him, but if he is still active next window he will leave the game world anyway.`;
    if(club===state.humanClub){
      if(typeof addSquadNews==='function') addSquadNews(`<b>Long-service warning:</b> ${line}`);
      if(typeof addLog==='function') addLog(`<b>Long-service warning:</b><br>${line}`);
    } else if(typeof addWindowActivity==='function' && Math.random()<0.2){
      addWindowActivity(`${esc(p.name)} at ${esc(club)} may seek ${esc(reason.toLowerCase())} next window.`);
    }
  }

  function rollNewDepartureRisks(context){
    if(!state?.started || !state?.players || !state?.teams) return {warnings:0,sudden:0};
    normaliseAllPlayers();
    const checkedKey=`${seasonNo()}-${marketNo()}-${context || 'summer'}`;
    const ls=ensureLongServiceState();
    ls.checked=ls.checked || {};
    if(ls.checked[checkedKey]) return {warnings:0,sudden:0};
    ls.checked[checkedKey]=true;

    let warnings=0, sudden=0;
    const clubs = Object.keys(state.teams || {});
    for(const club of clubs){
      const already=currentSeasonClubIssueCount(club);
      if(already>=CONFIG.maxPerClubSeason) continue;
      const squad=(typeof teamPlayers==='function' ? teamPlayers(club) : []).filter(p=>p && !isAbsent(p) && !p.longServiceDeparturePending && !p.transferRequest);
      const candidates=squad.filter(p=>Number(p.clubTenure||0)>=8 && tenureBand(p.clubTenure).chance>0);
      if(!candidates.length) continue;
      const clubChance=clubEventChanceForCandidates(candidates, club);
      if(clubChance<=0 || Math.random()>=clubChance) continue;

      let eventCount=1;
      if((already+eventCount)<CONFIG.maxPerClubSeason && possibleSecondIssue(candidates, club)) eventCount=2;
      eventCount=Math.min(eventCount, CONFIG.maxPerClubSeason-already);
      const used=new Set();
      for(let i=0;i<eventCount;i++){
        const p=weightedCandidatePick(candidates, used);
        if(!p) break;
        used.add(Number(p.id));
        const maxTenure=Math.max(...candidates.map(x=>Number(x.clubTenure||0)));
        const baseBand=tenureBand(maxTenure);
        const info={base:baseBand.chance, baseLabel:baseBand.label, ratingMult:ratingMultiplier(p.rating), successMult:successMultiplier(club), final:clubChance};
        const reason=weightedReason(p);
        const warned=Math.random()<assistantWarningReliability();
        if(warned){ createDepartureWarning(p, club, reason, info); warnings++; }
        else { const entry=executeDeparture(p, reason, club, context || 'sudden long-service departure'); if(entry) sudden++; }
      }
    }
    const byClub={};
    (state.longServiceDepartures?.history || []).filter(x=>x.season===seasonNo() && x.marketNo===marketNo()).forEach(x=>{ byClub[x.club]=(byClub[x.club]||0)+1; });
    Object.keys(byClub).forEach(club=>{ if(club!==state.humanClub && typeof repairClubFromPool==='function') repairClubFromPool(club, false); });
    if((warnings || sudden) && typeof setStatus==='function'){
      const bits=[];
      if(warnings) bits.push(`${warnings} long-service warning${warnings===1?'':'s'}`);
      if(sudden) bits.push(`${sudden} sudden long-service departure${sudden===1?'':'s'}`);
      setStatus(`Long-service squad movement: ${bits.join(', ')}. The system is now capped at two issues per club per season. Check Squad News and Transfer Window Activity.`, sudden?'warn':'good');
    }
    return {warnings,sudden};
  }

  function processLongServiceWindow(context){
    if(!state?.started) return;
    normaliseAllPlayers();
    returnAbsentPlayers();
    resolveDueDepartures(context || 'transfer window');
    if(context==='summer') rollNewDepartureRisks('summer');
    if(typeof render === 'function') render();
    if(typeof saveGame === 'function') saveGame();
  }


  if(oldInstantPoolSaleFee){
    instantPoolSaleFee = function(p){
      const fee=longServiceSaleFee(p);
      if(fee!=null) return fee;
      return oldInstantPoolSaleFee.apply(this, arguments);
    };
    window.instantPoolSaleFee=instantPoolSaleFee;
  }
  if(oldHumanTransferListFeeMultiplier){
    humanTransferListFeeMultiplier = function(p){
      if(isLongServiceDeclared(p)) return CONFIG.valueDamageMultiplier;
      return oldHumanTransferListFeeMultiplier.apply(this, arguments);
    };
    window.humanTransferListFeeMultiplier=humanTransferListFeeMultiplier;
  }
  if(oldHumanTransferListSaleChance){
    humanTransferListSaleChance = function(p){
      if(isLongServiceDeclared(p)) return Math.max(0.78, Math.min(0.94, oldHumanTransferListSaleChance.apply(this, arguments)+0.18));
      return oldHumanTransferListSaleChance.apply(this, arguments);
    };
    window.humanTransferListSaleChance=humanTransferListSaleChance;
  }

  if(oldCloneCareerPlayerForNewSeason){
    cloneCareerPlayerForNewSeason = function(p){
      const cloned = oldCloneCareerPlayerForNewSeason.apply(this, arguments);
      return copyLongServiceFields(p, cloned);
    };
    window.cloneCareerPlayerForNewSeason=cloneCareerPlayerForNewSeason;
  }

  poolPlayers = function(){
    const list = oldPoolPlayers ? oldPoolPlayers() : (state?.players || []).filter(p=>!p.owner);
    return list.filter(p=>!isAbsent(p));
  };
  window.poolPlayers=poolPlayers;

  if(oldMarketCandidateBase){
    marketCandidateBase = function(){ return oldMarketCandidateBase.apply(this, arguments).filter(p=>!isAbsent(p)); };
    window.marketCandidateBase=marketCandidateBase;
  }

  if(oldCanPlayerAcceptClub){
    canPlayerAcceptClub = function(p, club){
      normalisePlayerLongService(p);
      if(isAbsent(p)) return {ok:false, reason:'This player is away from the active market.'};
      if(isBlockedFromClub(p, club)) return {ok:false, reason:`Long-service departure: ${p.name} will not return to ${club} until Season ${p.longServiceNoReturnUntilSeason}.`};
      return oldCanPlayerAcceptClub.apply(this, arguments);
    };
    window.canPlayerAcceptClub=canPlayerAcceptClub;
  }

  function withAvailablePlayersOnly(fn){
    if(!state?.players || !Array.isArray(state.players)) return fn();
    const original=state.players;
    state.players=original.filter(p=>!isAbsent(p));
    try { return fn(); }
    finally { state.players=original; }
  }
  if(oldRenderPlayers){
    renderPlayers = function(){ return withAvailablePlayersOnly(()=>oldRenderPlayers.apply(this, arguments)); };
    window.renderPlayers=renderPlayers;
  }

  if(oldStartNextSeason){
    startNextSeasonWithCurrentSquad = function(){
      const carriedLongService = cloneLongServiceState(state?.longServiceDepartures);
      const result=oldStartNextSeason.apply(this, arguments);
      if(state?.started){
        state.longServiceDepartures = Object.assign({history:[],warnings:[],returns:[],checked:{}}, carriedLongService, state.longServiceDepartures || {});
        normaliseAllPlayers();
      }
      if(state?.started && !state?.season && !state.completed){
        processLongServiceWindow('summer');
        if(typeof captureWindowSnapshot==='function') captureWindowSnapshot();
      }
      return result;
    };
    window.startNextSeasonWithCurrentSquad=startNextSeasonWithCurrentSquad;
  }

  if(oldOpenMidseasonMarket){
    openMidseasonMarket = function(){
      const beforeSeason=seasonNo();
      const beforeMarket=marketNo();
      const result=oldOpenMidseasonMarket.apply(this, arguments);
      if(state?.started && seasonNo()>=beforeSeason && marketNo()!==beforeMarket){
        processLongServiceWindow('January');
        if(typeof captureWindowSnapshot==='function') captureWindowSnapshot();
      }
      return result;
    };
    window.openMidseasonMarket=openMidseasonMarket;
  }

  if(oldLoadSavedGame){
    loadSavedGame = function(){
      const result=oldLoadSavedGame.apply(this, arguments);
      normaliseAllPlayers();
      return result;
    };
    window.loadSavedGame=loadSavedGame;
  }

  function updateHelpText(){
    const widget=document.getElementById('xviiHelpWidget');
    if(!widget) return;
    const heads=Array.from(widget.querySelectorAll('.xvii-help-section h3'));
    const head=heads.find(h=>(h.textContent||'').trim().toLowerCase()==='long careers');
    if(!head || !head.parentElement || head.parentElement.getAttribute('data-stage10f-help')) return;
    head.parentElement.setAttribute('data-stage10f-help','1');
    head.parentElement.innerHTML=`<h3>Long careers and departures</h3><p>Long saves are meant to force rebuilds, not squad collapse. Long-service movement is now a club event, not a roll for every old player.</p><ul><li>Years 1-7: no long-service departure risk.</li><li>Years 8-9: low club-event risk.</li><li>Years 10-12: possible single senior-player issue.</li><li>Years 13+: higher risk, but still capped.</li><li>Maximum two long-service issues per club per season, and often none.</li><li>Better assistant managers are much more likely to warn you early.</li><li>Once a player declares a long-service issue, his value is halved because buyers know it is an end-of-cycle situation.</li><li>You can sell warned players if you act quickly, but once the long-service issue matures, the player leaves the active game world even if he was offloaded.</li></ul>`;
  }

  if(oldRender){
    render = function(){
      normaliseAllPlayers();
      const result=oldRender.apply(this, arguments);
      updateHelpText();
      return result;
    };
    window.render=render;
  }

  document.addEventListener('DOMContentLoaded', function(){
    try{
      normaliseAllPlayers();
      updateHelpText();
      const footer=document.querySelector('.xvii-version-note');
      if(footer) footer.textContent='Version 13N · Beta';
      document.title='XVII | Build the seventeen. Pick the eleven.';
    }catch(e){ console.warn('Stage 10F setup skipped', e); }
  });

  try{ normaliseAllPlayers(); updateHelpText(); }catch(e){}
})();
