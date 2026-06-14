/* Stage 9H career climb reputation patch. Extracted unchanged. */

/* Stage 9H: career-climb reputation, longevity reputation and board patience. */
(function(){
  if(window.__stage9hCareerClimbReputation) return;
  window.__stage9hCareerClimbReputation = true;

  function st9hSafeObj(x){ return (x && typeof x==='object' && !Array.isArray(x)) ? x : {}; }
  function st9hClampRating(n){ return clamp(Math.round(Number(n || 0)),0,100); }
  function st9hOriginalDivisionForClub(club){
    try{
      const info=typeof stage9ClubInfo==='function' ? stage9ClubInfo(club) : null;
      if(info && info.division==='second') return 'second';
      if(info && info.division==='top') return 'top';
    }catch(e){}
    return (state?.currentDivision || 'top')==='second' ? 'second' : 'top';
  }
  function st9hStaticExpectedRank(club){
    try{
      const div=st9hOriginalDivisionForClub(club);
      if(div==='second' && Array.isArray(XVII_STAGE9_SECOND_DIVISION_CLUBS)){
        const map=stage9AllExpectationMapFor(XVII_STAGE9_SECOND_DIVISION_CLUBS);
        return 20 + Number(map[club] || 20);
      }
      if(Array.isArray(XVII_STAGE9_TOP_DIVISION_CLUBS)){
        const map=stage9AllExpectationMapFor(XVII_STAGE9_TOP_DIVISION_CLUBS);
        return Number(map[club] || 20);
      }
    }catch(e){}
    const exp=typeof expectedFinish==='function' ? Number(expectedFinish(club) || 20) : 20;
    return (state?.currentDivision || 'top')==='second' ? 20 + exp : exp;
  }
  function st9hCurrentGlobalRank(pos){
    const div=state?.currentDivision || 'top';
    return (div==='second' ? 20 : 0) + Number(pos || 20);
  }
  function st9hWeightedClimbScore(places){
    const n=Math.max(0, Math.floor(Number(places || 0)));
    const band1=Math.min(n,5);
    const band2=Math.max(0, Math.min(n,9)-5);
    const band3=Math.max(0, Math.min(n,12)-9);
    const band4=Math.max(0, n-12);
    return band1 + (band2*2) + (band3*3) + (band4*4);
  }
  function st9hNormaliseManagerExtras(mp){
    mp=mp || {};
    mp.clubCareerBaselines=st9hSafeObj(mp.clubCareerBaselines);
    mp.clubBestCareerClimbs=st9hSafeObj(mp.clubBestCareerClimbs);
    mp.clubCareerClimbScores=st9hSafeObj(mp.clubCareerClimbScores);
    return mp;
  }

  const st9hPreviousNormaliseManagerProfile = normaliseManagerProfile;
  normaliseManagerProfile = function(source){
    const mp=st9hPreviousNormaliseManagerProfile(source);
    return st9hNormaliseManagerExtras(mp);
  };
  window.normaliseManagerProfile=normaliseManagerProfile;

  function st9hProfile(){
    const mp=managerProfile();
    return st9hNormaliseManagerExtras(mp);
  }
  function st9hEnsureClubBaseline(club){
    const mp=st9hProfile();
    const key=club || state?.humanClub || 'Club';
    const stored=Number(mp.clubCareerBaselines[key]);
    if(Number.isFinite(stored) && stored>0) return stored;
    const baseline=st9hStaticExpectedRank(key);
    mp.clubCareerBaselines[key]=baseline;
    return baseline;
  }
  function st9hCompletedSeasonsAtCurrentClub(includeCurrent){
    const club=state?.humanClub;
    if(!club) return includeCurrent ? 1 : 0;
    const hist=Array.isArray(state?.careerHistory) ? state.careerHistory : [];
    let count=0;
    for(let i=hist.length-1;i>=0;i--){
      if(hist[i] && hist[i].club===club) count++;
      else break;
    }
    return count + (includeCurrent ? 1 : 0);
  }
  function st9hLongevityRepBonus(){
    const clubSeason=st9hCompletedSeasonsAtCurrentClub(true);
    if(clubSeason<=1) return {points:0, season:clubSeason, text:'0 club longevity bonus in your first completed season at this club'};
    if(clubSeason<=4) return {points:1, season:clubSeason, text:`+1 club longevity bonus for completing season ${clubSeason} at this club without being sacked`};
    return {points:2, season:clubSeason, text:`+2 club longevity bonus for completing season ${clubSeason} at this club without being sacked`};
  }
  function st9hSackingToleranceBonus(){
    const clubSeason=st9hCompletedSeasonsAtCurrentClub(true);
    return clamp(clubSeason-3,0,10);
  }
  function st9hCareerClimbAward(pos){
    const club=state?.humanClub;
    const mp=st9hProfile();
    const baseline=st9hEnsureClubBaseline(club);
    const globalRank=st9hCurrentGlobalRank(pos);
    const climb=Math.max(0, baseline - globalRank);
    const previousBest=Math.max(0, Number(mp.clubBestCareerClimbs[club] || 0));
    if(climb<=previousBest){
      return {award:0, baseline, globalRank, climb, previousBest, totalScore:st9hWeightedClimbScore(previousBest), newScore:0};
    }
    const previousScore=st9hWeightedClimbScore(previousBest);
    const totalScore=st9hWeightedClimbScore(climb);
    const award=totalScore-previousScore;
    mp.clubBestCareerClimbs[club]=climb;
    mp.clubCareerClimbScores[club]=totalScore;
    return {award, baseline, globalRank, climb, previousBest, totalScore, newScore:award};
  }
  function st9hClimbAwardText(climb){
    if(!climb || !climb.award) return '';
    const bandText = climb.climb>=13 ? '13+ place band now paying 4 points per new place' : climb.climb>=10 ? '10-12 place band now paying 3 points per new place' : climb.climb>=6 ? '6-9 place band now paying 2 points per new place' : 'first 5 places paying 1 point per new place';
    return `+${climb.award} career climb: best global finish improved from ${climb.previousBest} to ${climb.climb} place${climb.climb===1?'':'s'} above the original ${ordinal(climb.baseline)} baseline. Total climb bank is now +${climb.totalScore}. ${bandText}.`;
  }

  const st9hPreviousManagerReputationDelta = managerReputationDelta;
  managerReputationDelta = function(pos,row){
    const calc=st9hPreviousManagerReputationDelta(pos,row) || {delta:0,parts:[]};
    let delta=Number(calc.delta || 0);
    const parts=Array.isArray(calc.parts) ? calc.parts.slice() : [];

    const climb=st9hCareerClimbAward(pos);
    if(climb.award>0){
      delta+=climb.award;
      parts.push(st9hClimbAwardText(climb));
    } else {
      const baseline=climb.baseline || st9hEnsureClubBaseline(state?.humanClub);
      const current=climb.globalRank || st9hCurrentGlobalRank(pos);
      const best=climb.previousBest || 0;
      parts.push(`0 career climb: current global finish ${ordinal(current)} did not beat the saved best climb of ${best} place${best===1?'':'s'} above the original ${ordinal(baseline)} baseline.`);
    }

    if(!state?.season?.sacking?.sacked){
      const legacy=st9hLongevityRepBonus();
      if(legacy.points>0){ delta+=legacy.points; parts.push(legacy.text); }
      else parts.push(legacy.text);
    }

    calc.delta=delta;
    calc.parts=parts;
    calc.careerClimb=climb;
    return calc;
  };
  window.managerReputationDelta=managerReputationDelta;

  const st9hPreviousSackingThreshold = sackingThreshold;
  sackingThreshold = function(){
    const base=Number(st9hPreviousSackingThreshold.apply(this, arguments) || 5);
    return base + st9hSackingToleranceBonus();
  };
  window.sackingThreshold=sackingThreshold;

  endSeasonSackingDecision = function(pos){
    if(state.careerMode!=='risk') return {sacked:false,reason:'Safe Career: no sackings.'};
    const exp=expectedFinish(state.humanClub);
    const miss=Number(pos || 20)-exp;
    const base=Number(st9hPreviousSackingThreshold() || 5);
    const extra=st9hSackingToleranceBonus();
    const threshold=base+extra;
    const crash=squadStrengthCrashForSacking(state.humanClub);
    if(crash.crashed) return {sacked:true,reason:`Squad strength crashed by ${crash.drop.toFixed(1)} from the locked pre-window level (${crash.start.toFixed(1)} to ${crash.current.toFixed(1)}). The board liked the money discipline, but judged the squad build a disaster.`};
    if(miss>=threshold) return {sacked:true,reason:`Finished ${miss} places below expectation in Risk Career. Board patience for a ${managerBand().name} manager is ${base} places, with ${extra} extra place${extra===1?'':'s'} of club-legacy tolerance, so the final tolerance was ${threshold} places.`};
    return {sacked:false,reason:`Risk Career survived. Board patience threshold was ${threshold} places below expectation (${base} base${extra?` + ${extra} club-legacy tolerance`:''}).`};
  };
  window.endSeasonSackingDecision=endSeasonSackingDecision;

  const st9hPreviousManagerCareerSummaryHtml = managerCareerSummaryHtml;
  managerCareerSummaryHtml = function(){
    const html=st9hPreviousManagerCareerSummaryHtml.apply(this, arguments);
    if(!state?.started || !state?.humanClub) return html;
    const mp=st9hProfile();
    const club=state.humanClub;
    const baseline=st9hEnsureClubBaseline(club);
    const best=Number(mp.clubBestCareerClimbs[club] || 0);
    const bank=Number(mp.clubCareerClimbScores[club] || st9hWeightedClimbScore(best));
    const seasonNo=st9hCompletedSeasonsAtCurrentClub(!!state?.season && !state.season.managerRepRecorded);
    const patience=st9hSackingToleranceBonus();
    const extra=`<div class="manager-career-copy" style="margin-top:6px"><b>Career climb:</b> original baseline ${ordinal(baseline)} globally. Best saved climb: ${best} place${best===1?'':'s'} higher, worth +${bank} one-time reputation point${bank===1?'':'s'} banked so far. <b>Club longevity:</b> current spell season ${seasonNo || 1}; sacking tolerance bonus ${patience} extra place${patience===1?'':'s'} below expectation, capped at 10.</div>`;
    return html + extra;
  };
  window.managerCareerSummaryHtml=managerCareerSummaryHtml;

  try{
    if(state?.started && state?.humanClub){
      st9hEnsureClubBaseline(state.humanClub);
      if(state?.season && state.season.roundIndex<38 && !state.season.managerRepRecorded && typeof window.stage9gUpdateLiveManagerReputation==='function') window.stage9gUpdateLiveManagerReputation();
      renderManagerCareerPanel();
      renderClubInfoBottom();
      saveGame();
    }
  }catch(e){ console.warn('Stage 9H career climb reputation repair skipped', e); }
})();
