/* Stage 9G manager reputation and transfer market live fix. Extracted unchanged. */

(function(){
  if(window.__stage9gManagerReputationLiveFix) return;
  window.__stage9gManagerReputationLiveFix = true;

  function stage9gClampRating(n){ return clamp(Math.round(Number(n || 0)),0,100); }
  function stage9gSeasonNo(){ return Number(state?.seasonNumber || 1); }
  function stage9gLatestManagerHistoryForCurrentSeason(){
    const mp = state?.managerProfile || {};
    const hist = Array.isArray(mp.history) ? mp.history : [];
    const seasonNo = stage9gSeasonNo();
    for(let i=hist.length-1;i>=0;i--){
      const h=hist[i];
      if(Number(h.season||0)===seasonNo && (!h.club || h.club===state.humanClub)) return h;
    }
    return null;
  }
  function stage9gRepairRatingFromRecordedHistory(){
    if(!state?.season?.managerRepRecorded) return false;
    const hist=stage9gLatestManagerHistoryForCurrentSeason();
    if(!hist || !Number.isFinite(Number(hist.newRating))) return false;
    const mp=managerProfile();
    const fixed=stage9gClampRating(hist.newRating);
    mp.rating=fixed;
    mp.lastDelta=Number(hist.delta||0);
    mp.lastBreakdown=Array.isArray(hist.notes)?hist.notes.slice():mp.lastBreakdown;
    mp.provisional=false;
    mp.liveDelta=Number(hist.delta||0);
    mp.liveRating=fixed;
    mp.committedRating=fixed;
    state.season.managerRepBaseRating=Number.isFinite(Number(hist.oldRating))?stage9gClampRating(hist.oldRating):stage9gClampRating(fixed-Number(hist.delta||0));
    state.season.managerRepFinal={oldRating:state.season.managerRepBaseRating,newRating:fixed,delta:Number(hist.delta||0),parts:Array.isArray(hist.notes)?hist.notes.slice():[]};
    return true;
  }
  function stage9gEnsureManagerSeasonBase(){
    const mp=managerProfile();
    if(!state?.season) return stage9gClampRating(mp.rating);
    const hist=stage9gLatestManagerHistoryForCurrentSeason();
    if(hist && Number.isFinite(Number(hist.oldRating))){
      state.season.managerRepBaseRating=stage9gClampRating(hist.oldRating);
      mp.seasonBaseRating=state.season.managerRepBaseRating;
      return state.season.managerRepBaseRating;
    }
    if(!Number.isFinite(Number(state.season.managerRepBaseRating))){
      let base=Number(mp.rating || 26);
      if(mp.provisional && Number.isFinite(Number(mp.liveDelta))) base = Number(mp.rating || 26) - Number(mp.liveDelta || 0);
      if(Number.isFinite(Number(mp.seasonBaseRating)) && mp.seasonBaseRating>0 && !mp.provisional) base=Number(mp.seasonBaseRating);
      state.season.managerRepBaseRating=stage9gClampRating(base);
    }
    mp.seasonBaseRating=state.season.managerRepBaseRating;
    return state.season.managerRepBaseRating;
  }
  function stage9gLiveManagerReputationDelta(){
    if(!state?.season) return {delta:0,parts:['Live reputation starts when the league season begins.']};
    const played=Number(state.season.roundIndex || 0);
    if(played<=0) return {delta:0,parts:['0 live change before the first fixture.']};
    const table=leagueTable();
    const pos=table.findIndex(r=>r.club===state.humanClub)+1;
    const exp=expectedFinish(state.humanClub);
    const above=exp-pos, below=pos-exp;
    let delta=0; const parts=[];
    if(above>=4){ delta+=2; parts.push(`Live +2: currently ${above} places above expectation after ${played} game week${played===1?'':'s'}.`); }
    else if(above>=2){ delta+=1; parts.push(`Live +1: currently ${above} places above expectation after ${played} game week${played===1?'':'s'}.`); }
    else if(below>=3){ delta-=2; parts.push(`Live -2: currently ${below} places below expectation after ${played} game week${played===1?'':'s'}.`); }
    else if(below>=2){ delta-=1; parts.push(`Live -1: currently ${below} places below expectation after ${played} game week${played===1?'':'s'}.`); }
    else parts.push(`Live 0: currently close to expectation after ${played} game week${played===1?'':'s'}.`);
    const activeDiv=state?.currentDivision || 'top';
    if(activeDiv==='second' && pos<=3){ delta+=1; parts.push('+1 live promotion track: currently in the Second Division top three.'); }
    if(activeDiv==='top' && pos<=17 && exp>=18){ delta+=1; parts.push('+1 live survival track: currently keeping a survival-level club up.'); }
    const rival=rivalFor(state.humanClub);
    const rivalRows=(state.season?.humanResults||[]).filter(r=>r.home===rival || r.away===rival);
    const baseBand=managerBandForRating(stage9gEnsureManagerSeasonBase());
    for(const rr of rivalRows){
      if(rr.outcome==='win' && baseBand.name!=='Legendary'){ delta+=1; parts.push('+1 live rival result: beat your rival.'); }
      else if(rr.outcome==='draw'){ delta-=1; parts.push('-1 live rival result: drew with your rival.'); }
      else if(rr.outcome==='loss'){ delta-=2; parts.push('-2 live rival result: lost to your rival.'); }
    }
    if(played<38) parts.push('Season challenges, records and sackings are added only when the season is concluded.');
    return {delta,parts,pos,expected:exp,played};
  }
  window.stage9gUpdateLiveManagerReputation = function(){
    if(!state?.started || !state?.season) return false;
    if(state.season.managerRepRecorded){ stage9gRepairRatingFromRecordedHistory(); return false; }
    const base=stage9gEnsureManagerSeasonBase();
    const calc=stage9gLiveManagerReputationDelta();
    const mp=managerProfile();
    const rating=stage9gClampRating(base + Number(calc.delta||0));
    mp.rating=rating;
    mp.liveDelta=Number(calc.delta||0);
    mp.liveRating=rating;
    mp.lastDelta=Number(calc.delta||0);
    mp.lastBreakdown=calc.parts.slice();
    mp.provisional=true;
    state.season.liveManagerRepDelta=Number(calc.delta||0);
    state.season.liveManagerRepRating=rating;
    state.season.liveManagerRepParts=calc.parts.slice();
    return true;
  };

  const stage9gOriginalApplyManagerReputation = applyManagerReputation;
  applyManagerReputation = function(pos,row,sacked){
    const mp=managerProfile();
    if(!state?.season) return stage9gOriginalApplyManagerReputation(pos,row,sacked);
    if(state.season.managerRepRecorded){
      stage9gRepairRatingFromRecordedHistory();
      return Number(managerProfile().lastDelta || 0);
    }
    const base=stage9gEnsureManagerSeasonBase();
    const beforeVisible=mp.rating;
    mp.rating=base;
    const calc=managerReputationDelta(pos,row);
    let delta=Number(calc.delta || 0);
    const parts=calc.parts.slice();
    if(sacked){
      delta-=25;
      parts.push('-25 for getting sacked');
      mp.sackedCount=(mp.sackedCount||0)+1;
      mp.lastSackedSeason=state.seasonNumber || 1;
    }
    const old=stage9gClampRating(base);
    const next=stage9gClampRating(old + delta);
    mp.rating=next;
    mp.committedRating=next;
    mp.seasonBaseRating=next;
    mp.liveDelta=delta;
    mp.liveRating=next;
    mp.provisional=false;
    mp.lastDelta=delta;
    mp.lastBreakdown=parts;
    mp.history=Array.isArray(mp.history)?mp.history:[];
    const entry={season:state.seasonNumber||1, club:state.humanClub, oldRating:old, newRating:next, delta, band:managerBandForRating(next).name, sacked:!!sacked, notes:parts};
    mp.history.push(entry);
    state.season.managerRepRecorded=true;
    state.season.managerRepBaseRating=old;
    state.season.managerRepFinal={oldRating:old,newRating:next,delta,parts:parts.slice(),beforeVisible};
    return delta;
  };

  const stage9gOriginalInitSeason = initSeason;
  initSeason = function(){
    const result=stage9gOriginalInitSeason.apply(this, arguments);
    if(state?.season){
      state.season.managerRepBaseRating=stage9gClampRating(managerProfile().rating);
      state.season.liveManagerRepDelta=0;
      state.season.liveManagerRepRating=state.season.managerRepBaseRating;
      managerProfile().seasonBaseRating=state.season.managerRepBaseRating;
      managerProfile().provisional=false;
      managerProfile().liveDelta=0;
    }
    return result;
  };

  const stage9gOriginalRecordCareerSeasonFinish = recordCareerSeasonFinish;
  recordCareerSeasonFinish = function(){
    if(state?.season && state.season.roundIndex>=38 && !state.season.managerRepRecorded){
      const table=leagueTable();
      const pos=table.findIndex(r=>r.club===state.humanClub)+1;
      const row=table[pos-1];
      if(row){
        const sack=state.season.sacking || endSeasonSackingDecision(pos);
        state.season.sacking=sack;
        applyManagerReputation(pos,row,sack.sacked);
      }
    } else if(state?.season?.managerRepRecorded){
      stage9gRepairRatingFromRecordedHistory();
    }
    return stage9gOriginalRecordCareerSeasonFinish.apply(this, arguments);
  };

  const stage9gOriginalPlayNextRound = playNextRound;
  playNextRound = function(auto){
    const result=stage9gOriginalPlayNextRound.apply(this, arguments);
    if(state?.season){
      if(state.season.roundIndex>=38){
        recordCareerSeasonFinish();
      } else {
        window.stage9gUpdateLiveManagerReputation();
      }
      renderManagerCareerPanel();
      renderClubInfoBottom();
      saveGame();
    }
    return result;
  };

  const stage9gOriginalPlayRestOfSeason = playRestOfSeason;
  playRestOfSeason = function(){
    const result=stage9gOriginalPlayRestOfSeason.apply(this, arguments);
    if(state?.season?.roundIndex>=38){ recordCareerSeasonFinish(); renderSeasonSummary(); saveGame(); }
    return result;
  };

  const stage9gOriginalPlayUntilJanuary = playUntilJanuary;
  playUntilJanuary = function(){
    const result=stage9gOriginalPlayUntilJanuary.apply(this, arguments);
    if(state?.season && state.season.roundIndex<38){ window.stage9gUpdateLiveManagerReputation(); renderManagerCareerPanel(); renderClubInfoBottom(); saveGame(); }
    return result;
  };

  const stage9gOriginalFinishWindow = finishWindow;
  finishWindow = function(){
    const result=stage9gOriginalFinishWindow.apply(this, arguments);
    if(state?.season && !state.season.managerRepRecorded){
      stage9gEnsureManagerSeasonBase();
      window.stage9gUpdateLiveManagerReputation();
      renderManagerCareerPanel();
      renderClubInfoBottom();
      saveGame();
    }
    return result;
  };

  const stage9gOriginalStartNextSeason = startNextSeasonWithCurrentSquad;
  startNextSeasonWithCurrentSquad = function(){
    if(state?.season?.roundIndex>=38){ recordCareerSeasonFinish(); stage9gRepairRatingFromRecordedHistory(); }
    return stage9gOriginalStartNextSeason.apply(this, arguments);
  };

  managerCareerSummaryHtml = function(){
    if(state.season && state.season.roundIndex>=38 && !state.season.managerRepRecorded){
      const table=leagueTable();
      const pos=table.findIndex(r=>r.club===state.humanClub)+1;
      const row=table[pos-1];
      if(row){ const sack=state.season.sacking || endSeasonSackingDecision(pos); state.season.sacking=sack; applyManagerReputation(pos,row,sack.sacked); }
    }
    if(state?.season?.managerRepRecorded) stage9gRepairRatingFromRecordedHistory();
    const mp=managerProfile();
    const hist=stage9gLatestManagerHistoryForCurrentSeason();
    const final=state?.season?.managerRepFinal || null;
    const old=final ? Number(final.oldRating||0) : hist ? Number(hist.oldRating||0) : (state?.season ? stage9gEnsureManagerSeasonBase() : Number(mp.rating||0));
    const delta=final ? Number(final.delta||0) : hist ? Number(hist.delta||0) : Number(state?.season?.liveManagerRepDelta || mp.liveDelta || 0);
    const cur=final ? Number(final.newRating||0) : hist ? Number(hist.newRating||0) : stage9gClampRating(old + delta);
    const oldBand=managerBandForRating(old), newBand=managerBandForRating(cur);
    const nextBand=MANAGER_REPUTATION_BANDS.find(b=>Number(b.min)>cur);
    const toNext=nextBand ? `${nextBand.min-cur} point${nextBand.min-cur===1?'':'s'} to ${escapeHtml(nextBand.name)}` : 'Top reputation band reached';
    const lines=(final?.parts || (hist && Array.isArray(hist.notes)?hist.notes:null) || state?.season?.liveManagerRepParts || mp.lastBreakdown || []).map(x=>`<div class="manager-rep-line">${escapeHtml(x)}</div>`).join('');
    const label=state?.season?.managerRepRecorded ? 'Manager reputation review' : 'Live manager reputation';
    const note=state?.season?.managerRepRecorded ? 'Final season reputation has been committed.' : 'Live number updates after every game week. Season challenges, records and sackings are added at season conclusion.';
    return `<div class="manager-rep-detail"><b>${escapeHtml(label)}</b><div class="manager-rep-grid"><div class="manager-rep-stat"><span>Before</span><strong>${old}/100</strong></div><div class="manager-rep-stat"><span>Change</span><strong>${delta>0?'+':''}${delta}</strong></div><div class="manager-rep-stat"><span>Now</span><strong>${cur}/100</strong></div><div class="manager-rep-stat"><span>Level</span><strong>${escapeHtml(newBand.name)}</strong></div></div><div class="muted" style="margin-top:6px">${escapeHtml(note)} Level movement: ${escapeHtml(oldBand.name)} → ${escapeHtml(newBand.name)}. ${escapeHtml(toNext)}. Transfer pull: ${escapeHtml(managerPullLabel())}.</div>${lines?`<div class="manager-rep-breakdown">${lines}</div>`:''}</div>`;
  };

  const stage9gOriginalRenderManagerCareerPanel = renderManagerCareerPanel;
  renderManagerCareerPanel = function(){
    if(state?.season && state.season.roundIndex<38 && !state.season.managerRepRecorded) window.stage9gUpdateLiveManagerReputation();
    stage9gOriginalRenderManagerCareerPanel.apply(this, arguments);
    const box=el('managerCareerPanel');
    if(!box || box.classList.contains('hidden') || !state?.season || state.season.managerRepRecorded) return;
    const base=stage9gEnsureManagerSeasonBase();
    const live=Number(state.season.liveManagerRepDelta || 0);
    const now=stage9gClampRating(base+live);
    const played=Number(state.season.roundIndex || 0);
    box.insertAdjacentHTML('beforeend', `<div class="manager-career-copy" style="margin-top:6px"><b>Live reputation:</b> ${base}/100 ${live>=0?'+':''}${live} = ${now}/100 after ${played}/38 game weeks. End-season challenge, record and sacking points are only committed when the season concludes.</div>`);
  };

  window.applyManagerReputation=applyManagerReputation;
  window.playNextRound=playNextRound;
  window.playRestOfSeason=playRestOfSeason;
  window.playUntilJanuary=playUntilJanuary;
  window.finishWindow=finishWindow;
  window.startNextSeasonWithCurrentSquad=startNextSeasonWithCurrentSquad;

  try{ if(state?.started && state?.season){ window.stage9gUpdateLiveManagerReputation(); renderManagerCareerPanel(); renderClubInfoBottom(); saveGame(); } }catch(e){}
})();


/* Stage 9G transfer-market repair: cross-division listed players and variable list prices. */
(function(){
  function st9gMarketActiveClubNames(){
    return new Set((CLUBS || []).map(c=>c.club));
  }
  function st9gAllPlayableClubInfo(){
    const list=[];
    try{ if(Array.isArray(XVII_STAGE9_TOP_DIVISION_CLUBS)) list.push(...XVII_STAGE9_TOP_DIVISION_CLUBS); }catch(e){}
    try{ if(Array.isArray(XVII_STAGE9_SECOND_DIVISION_CLUBS)) list.push(...XVII_STAGE9_SECOND_DIVISION_CLUBS); }catch(e){}
    if(!list.length && Array.isArray(CLUBS)) list.push(...CLUBS);
    const seen=new Set();
    return list.filter(c=>c && c.club && !seen.has(c.club) && seen.add(c.club));
  }
  function st9gInactiveMarketClubInfo(){
    const active=st9gMarketActiveClubNames();
    return st9gAllPlayableClubInfo().filter(c=>!active.has(c.club) && c.club!==state?.humanClub);
  }
  function st9gDefaultMarketBudgetForClub(info){
    const base=Number(info?.budget || 0);
    const fallback=roundMoney(base * BUDGET_PERCENT);
    return Math.min(AI_BUDGET_CAP, Math.max(0, fallback || 0));
  }
  window.stage9gEnsureBackgroundMarketClubs = function(){
    if(!state || !state.started || !Array.isArray(state.players) || !state.players.length) return {clubs:0,players:0};
    if(!state.teams) state.teams={};
    const active=st9gMarketActiveClubNames();
    const background=st9gInactiveMarketClubInfo();
    let clubCount=0, playerCount=0;
    for(const info of background){
      const club=info.club;
      if(!club || club===state.humanClub) continue;
      if(!state.teams[club]){
        const budget=st9gDefaultMarketBudgetForClub(info);
        state.teams[club]={club, budget, squadIds:[], startBudget:budget, income:0, spent:0, season:null, backgroundMarket:true};
        clubCount++;
      } else {
        state.teams[club].backgroundMarket=true;
        if(!Array.isArray(state.teams[club].squadIds)) state.teams[club].squadIds=[];
      }
      const t=state.teams[club];
      const existing=new Set(t.squadIds.map(Number));
      const ownOriginal=state.players
        .filter(p=>p && !p.owner && p.originalClub===club)
        .sort((a,b)=>(POS_ORDER[a.position]||9)-(POS_ORDER[b.position]||9) || Number(b.rating||0)-Number(a.rating||0) || Number(b.baseCost||0)-Number(a.baseCost||0));
      for(const p of ownOriginal){
        if(existing.has(Number(p.id))) continue;
        p.owner=club;
        p.outsideOwner=false;
        p.transferListed=!!p.transferRequest;
        p.transferListMultiplier=Number(p.transferListMultiplier || 1);
        p.startsRemaining=maxStarts(p.position);
        p.burnout=0;
        t.squadIds.push(p.id);
        existing.add(Number(p.id));
        playerCount++;
      }
      // If a background team was restored from a save, remove duplicate/broken squad ids.
      t.squadIds=[...new Set(t.squadIds.map(Number).filter(id=>{
        const p=player(id);
        return p && p.owner===club;
      }))];
    }
    return {clubs:clubCount,players:playerCount};
  };
  function st9gListedMultiplierForPickedPlayer(p){
    if(!p) return 1;
    // Computer transfer-listed players should be a club trying to move a player on,
    // not an excuse to charge over the odds. Most stay at market value; a minority
    // are discounted by up to 15%.
    if(p.transferRequest) return 1;
    const roll=Math.random();
    if(roll<0.72) return 1;
    return roundTo(0.85 + Math.random()*0.14, 2);
  }
  function st9gMarketClubNamesForListing(){
    if(typeof window.stage9gEnsureBackgroundMarketClubs==='function') window.stage9gEnsureBackgroundMarketClubs();
    return Object.keys(state?.teams || {})
      .filter(club=>club && club!==state.humanClub)
      .filter(club=>teamPlayers(club).length>0);
  }
  const st9gPrevGenerateTransferList = generateTransferList;
  generateTransferList = function(){
    if(!state?.players || !state.players.length) return;
    if(typeof window.stage9gEnsureBackgroundMarketClubs==='function') window.stage9gEnsureBackgroundMarketClubs();
    for(const p of state.players){
      p.transferListed=!!p.transferRequest;
      if(!p.transferRequest) p.transferListMultiplier=1;
    }
    const aiClubs=st9gMarketClubNamesForListing();
    const pct=0.70 + Math.random()*0.10;
    const listedClubCount=Math.max(1, Math.round(aiClubs.length*pct));
    const chosenClubs=shuffle(aiClubs.slice()).slice(0, listedClubCount);
    let listedCount=0, discountCount=0;
    for(const club of chosenClubs){
      const candidates=teamPlayers(club).filter(p=>p.owner===club && p.owner!==state.humanClub).sort((a,b)=>a.rating-b.rating || a.marketValue-b.marketValue);
      const weighted=[];
      candidates.forEach((p,i)=>{ const copies=i<8?3:i<13?2:1; for(let n=0;n<copies;n++) weighted.push(p); });
      const picked=[];
      while(picked.length<4 && weighted.length){
        const p=weighted.splice(Math.floor(Math.random()*weighted.length),1)[0];
        if(!picked.some(x=>x.id===p.id)) picked.push(p);
        for(let i=weighted.length-1;i>=0;i--) if(weighted[i].id===p.id) weighted.splice(i,1);
      }
      for(const p of picked){
        p.transferListed=true;
        p.transferListMultiplier=st9gListedMultiplierForPickedPlayer(p);
        if(Number(p.transferListMultiplier||1)<1) discountCount++;
        listedCount++;
      }
    }
    const poolMoves=applyPoolMarketOpportunities();
    if(listedCount || poolMoves.length){
      addLog(`${listedCount} players have been transfer-listed by ${chosenClubs.length} clubs across the active and background divisions. Listed players are never above market value: most are exact price and ${discountCount} are currently discounted below market. ${poolMoves.length} transfer-pool player${poolMoves.length===1?' has':'s have'} temporary asking-price movement.`);
    }
  };
  window.generateTransferList=generateTransferList;

  const st9gPrevBuyPrice = buyPrice;
  buyPrice = function(p){
    if(!state.started) return 0;
    if(isReturnableRelease(p)) return roundMoney(p.releaseFee || p.marketValue || 0);
    if(!p.owner) return poolOfferPrice(p);
    if(p.owner===state.humanClub) return 0;
    if(p.transferListed){
      const rawMult=Number(p.transferListMultiplier || 1);
      const mult=(Number.isFinite(rawMult) && rawMult>0) ? Math.min(1, Math.max(0.85, rawMult)) : 1;
      p.transferListMultiplier=mult;
      return roundMoney(Number(p.marketValue || 0) * mult);
    }
    return roundMoney(p.marketValue*1.5);
  };
  window.buyPrice=buyPrice;

  const st9gPrevPlayerStatus = playerStatus;
  playerStatus = function(p){
    const status=st9gPrevPlayerStatus(p);
    if(p && p.owner && p.owner!==state.humanClub && p.transferListed && Number(p.transferListMultiplier||1)<1){
      return {label:`Discount listed by ${p.owner}`, cls:'listed'};
    }
    return status;
  };
  window.playerStatus=playerStatus;

  const st9gPrevRender = render;
  render = function(){
    if(state?.started && !state.completed && typeof window.stage9gEnsureBackgroundMarketClubs==='function') window.stage9gEnsureBackgroundMarketClubs();
    return st9gPrevRender.apply(this, arguments);
  };
  window.render=render;

  // Existing saves opened mid-window may have been created before background market clubs were attached.
  try{
    if(state?.started && !state.completed){
      const beforeListed=state.players.filter(p=>p.owner && p.owner!==state.humanClub && p.transferListed).length;
      window.stage9gEnsureBackgroundMarketClubs();
      const backgroundListed=state.players.filter(p=>p.owner && p.owner!==state.humanClub && p.transferListed && !st9gMarketActiveClubNames().has(p.owner)).length;
      if(beforeListed===0 || backgroundListed===0) generateTransferList();
      saveGame();
    }
  }catch(e){ console.warn('Stage 9G background market repair skipped', e); }
})();
