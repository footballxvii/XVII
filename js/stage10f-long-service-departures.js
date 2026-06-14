/* Stage 10F: long-service departures and retirement absences. */
(function(){
  if(window.__stage10fLongServiceDepartures) return;
  window.__stage10fLongServiceDepartures = true;

  const CONFIG = {
    baseChance:[
      {min:1,max:4,chance:0,label:'No long-service departure risk'},
      {min:5,max:8,chance:0.15,label:'Very unlikely'},
      {min:9,max:12,chance:0.40,label:'Possible'},
      {min:13,max:15,chance:0.60,label:'Likely enough to worry about'},
      {min:16,max:18,chance:0.80,label:'Very likely'},
      {min:19,max:999,chance:0.95,label:'Effectively near the end'}
    ],
    ratingMultiplier:[
      {min:0,max:79,mult:1.0},
      {min:80,max:85,mult:1.25},
      {min:86,max:89,mult:1.35},
      {min:90,max:999,mult:1.75}
    ],
    cap:0.95,
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
    if(titles>=3) return 1.25;
    if(last && Number(last.position||99)===1) return 1.15;
    if(last && Number(last.position||99)<=2) return 1.10;
    if(last && Number(last.position||99)<=4) return 1.05;
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
    if(tier>=4) return 0.90;
    if(tier>=3) return 0.75;
    if(tier>=2) return 0.60;
    if(tier>=1) return 0.35;
    return 0.08;
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
    if(reason==='New challenge') return `returns to the transfer pool but will not rejoin the same club for ${CONFIG.noReturnSeasons} seasons`;
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
    removeFromTeamSquad(oldClub, p.id);
    p.owner=null;
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
      p.longServiceAbsentUntilSeason=null;
      p.longServiceAbsentReason='';
    } else {
      p.longServiceAbsentUntilSeason=seasonNo()+duration;
      p.longServiceAbsentReason=reason;
    }
    const entry={season:seasonNo(), marketNo:marketNo(), club:oldClub, playerId:p.id, player:p.name, rating:p.rating, tenure:Number(p.clubTenure||0), reason, duration, context};
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
      if(!pendingClub || p.owner!==pendingClub){ clearPending(p); continue; }
      if(!dueNow(p)) continue;
      const reason=p.longServiceDepartureReason || weightedReason(p);
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
    const warning={season:seasonNo(), marketNo:marketNo(), club, playerId:p.id, player:p.name, rating:p.rating, tenure:Number(p.clubTenure||0), reason, chance:chanceInfo.final};
    ensureLongServiceState().warnings.push(warning);
    const line=`${esc(p.name)} has given signals that he may leave next window. Reason: ${esc(reason)}. Long-service risk this summer was ${percent(chanceInfo.final)} (${percent(chanceInfo.base)} base × ${chanceInfo.ratingMult.toFixed(2)} rating × ${chanceInfo.successMult.toFixed(2)} success). Sell or replace him now if you want to stay ahead of it.`;
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
      const squad=(typeof teamPlayers==='function' ? teamPlayers(club) : []).filter(p=>p && !isAbsent(p) && !p.longServiceDeparturePending && !p.transferRequest);
      const candidates=squad.filter(p=>Number(p.clubTenure||0)>=5 && tenureBand(p.clubTenure).chance>0);
      for(const p of candidates){
        const info=chanceBreakdown(p, club);
        if(info.final<=0 || Math.random()>=info.final) continue;
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
      setStatus(`Long-service squad movement: ${bits.join(', ')}. Check Squad News and Transfer Window Activity.`, sudden?'warn':'good');
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
    head.parentElement.innerHTML=`<h3>Long careers and departures</h3><p>Long saves are meant to force rebuilds. Players who stay for many seasons can ask for a new challenge, step away for personal or family reasons, or retire from the active market for several seasons.</p><ul><li>Years 1-4: no long-service departure risk.</li><li>Years 5-8: 15% base risk before player-quality modifiers.</li><li>Years 9-12: 40% base risk.</li><li>Years 13-15: 60% base risk.</li><li>Years 16-18: 80% base risk.</li><li>Years 19+: 95% base risk.</li><li>80-85 rated players are more likely to leave, 86-89 more again, and 90+ players are major flight risks.</li><li>Better assistant managers are more likely to warn you before a player goes.</li><li>Retired players disappear for 5-9 seasons. Personal and family absences last 2-4 seasons. New-challenge players can return to the pool but will not rejoin the old club for 6 seasons.</li></ul>`;
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
      if(footer) footer.textContent='Version 12F · Beta';
      document.title='XVII | Build the seventeen. Pick the eleven.';
    }catch(e){ console.warn('Stage 10F setup skipped', e); }
  });

  try{ normaliseAllPlayers(); updateHelpText(); }catch(e){}
})();
