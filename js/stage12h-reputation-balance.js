/* Stage 12H: reputation balance.
   New managers now start as genuine unknowns, big-club routine success is harder to turn into reputation,
   lower-club overperformance is worth more, and sackings in Risk Career are brutal. */
(function(){
  if(window.__stage12hReputationBalance) return;
  window.__stage12hReputationBalance = true;

  const VERSION='Version 12I · Beta';
  const START_RATING=26;
  const SACKED_RATING=1;

  function clampRating(n){ return Math.max(0, Math.min(100, Math.round(Number(n||0)))); }
  function el(id){ try{return document.getElementById(id);}catch(e){ return null; } }
  function ord(n){ try{ return ordinal(n); }catch(e){ return String(n); } }
  function div(){ return state?.currentDivision || 'top'; }
  function globalExpected(club){
    const exp=Number((typeof expectedFinish==='function' ? expectedFinish(club) : 20) || 20);
    return (div()==='second' ? 20 : 0) + exp;
  }
  function currentGlobal(pos){ return (div()==='second' ? 20 : 0) + Number(pos||20); }
  function previousClubTitles(club){
    const hist=Array.isArray(state?.careerHistory) ? state.careerHistory : [];
    return hist.filter(h=>h && h.club===club && Number(h.position||99)===1 && (Number(h.expected||99)<=3 || h.managerBand)).length;
  }
  function previousExpectedDominance(club){
    const hist=Array.isArray(state?.careerHistory) ? state.careerHistory : [];
    return hist.filter(h=>h && h.club===club && Number(h.position||99)<=Number(h.expected||99) && Number(h.expected||99)<=3).length;
  }
  function difficultyMultiplier(exp, pos){
    const d=div();
    if(d==='second'){
      if(exp>=16) return 2.25;
      if(exp>=11) return 1.85;
      if(exp>=7) return 1.55;
      if(exp>=4) return 1.25;
      return 1.05;
    }
    if(exp<=3) return 0.35;
    if(exp<=6) return 0.50;
    if(exp<=10) return 0.80;
    if(exp<=14) return 1.00;
    if(exp<=17) return 1.20;
    return 1.35;
  }
  function penaltyMultiplier(exp){
    if(div()==='second'){
      if(exp>=16) return 0.90;
      if(exp>=11) return 1.00;
      if(exp>=7) return 1.10;
      return 1.20;
    }
    if(exp<=3) return 1.85;
    if(exp<=6) return 1.55;
    if(exp<=10) return 1.25;
    return 1.00;
  }
  function positiveCap(exp,pos,row){
    const points=Number(row?.points||0);
    const gd=Number(row?.gf||0)-Number(row?.ga||0);
    const exceptional=(points>=94 || gd>=55);
    const d=div();
    if(d==='second'){
      if(exp>=16) return 10;
      if(exp>=11) return 8;
      if(exp>=7) return 6;
      if(exp>=4) return 5;
      return 4;
    }
    if(exp<=3){
      const titles=previousClubTitles(state?.humanClub);
      if(pos===1){
        if(titles<=0) return exceptional ? 4 : 3;
        if(titles===1) return exceptional ? 3 : 2;
        return exceptional ? 2 : 1;
      }
      return 1;
    }
    if(exp<=6) return pos===1 ? 5 : 3;
    if(exp<=10) return pos<=4 ? 6 : 4;
    if(exp<=14) return 6;
    return 7;
  }
  function repeatMultiplier(exp,pos){
    if(div()==='top' && exp<=3 && pos===1){
      const titles=previousClubTitles(state?.humanClub);
      if(titles<=0) return 1;
      if(titles===1) return 0.65;
      if(titles===2) return 0.40;
      return 0.25;
    }
    if(div()==='top' && exp<=3 && pos<=3){
      const prev=previousExpectedDominance(state?.humanClub);
      if(prev>=3) return 0.50;
      if(prev>=1) return 0.75;
    }
    return 1;
  }
  function stageNote(exp,pos,raw,adjusted,row){
    const ge=globalExpected(state?.humanClub);
    const cg=currentGlobal(pos);
    const d=div();
    if(raw>0 && d==='top' && exp<=3){
      if(pos===1){
        const titles=previousClubTitles(state?.humanClub);
        if(titles>0) return `Stage 12H balance: routine title success at an elite club is now discounted. Previous title wins at this club reduce the reputation lift.`;
        return `Stage 12H balance: an elite-club title is respected, but the football world expected this squad to contend.`;
      }
      return `Stage 12H balance: strong elite-club seasons now earn only modest reputation unless they beat expectation clearly.`;
    }
    if(raw>0 && d==='second' && exp>=11){
      return `Stage 12H balance: lower-division overperformance is now worth more. Moving from an original ${ord(ge)}-level baseline to ${ord(cg)} is proper management.`;
    }
    if(raw<0 && d==='top' && exp<=6){
      return `Stage 12H balance: big-club underperformance is punished harder because the job comes with resources and pressure.`;
    }
    return raw===adjusted ? `Stage 12H balance: reputation change kept at ${adjusted}.` : `Stage 12H balance: raw reputation movement ${raw>0?'+':''}${raw} adjusted to ${adjusted>0?'+':''}${adjusted} for club difficulty and expectation.`;
  }

  function ensureLowStart(force){
    if(!window.state) return;
    let mp=state.managerProfile || {};
    const hist=Array.isArray(mp.history) ? mp.history : [];
    const noHistory=hist.length===0;
    if(force || !mp.stage12hRatingModel){
      if(noHistory){
        const current=Number(mp.rating);
        if(force || !Number.isFinite(current) || current===0 || current===45 || current>=40){
          mp.rating=START_RATING;
          mp.lastDelta=0;
          mp.liveDelta=0;
          mp.liveRating=START_RATING;
          mp.committedRating=START_RATING;
          mp.seasonBaseRating=START_RATING;
        }
      }
      mp.stage12hRatingModel='low-start-v1';
      state.managerProfile=mp;
    }
  }

  const previousEmptyManagerProfile = (typeof emptyManagerProfile==='function') ? emptyManagerProfile : null;
  if(previousEmptyManagerProfile){
    emptyManagerProfile=function(){
      const mp=previousEmptyManagerProfile.apply(this, arguments) || {};
      mp.rating=START_RATING;
      mp.committedRating=START_RATING;
      mp.seasonBaseRating=START_RATING;
      mp.stage12hRatingModel='low-start-v1';
      return mp;
    };
    window.emptyManagerProfile=emptyManagerProfile;
  }

  const previousNormaliseManagerProfile = (typeof normaliseManagerProfile==='function') ? normaliseManagerProfile : null;
  if(previousNormaliseManagerProfile){
    normaliseManagerProfile=function(source){
      const mp=previousNormaliseManagerProfile.apply(this, arguments) || {};
      const hist=Array.isArray(mp.history) ? mp.history : [];
      if(!source || source.rating==null){
        mp.rating=START_RATING;
      }else if(hist.length===0 && !mp.stage12hRatingModel && (Number(source.rating)===45 || Number(source.rating)>=40)){
        mp.rating=START_RATING;
      }
      mp.stage12hRatingModel=mp.stage12hRatingModel || 'low-start-v1';
      return mp;
    };
    window.normaliseManagerProfile=normaliseManagerProfile;
  }

  const previousManagerProfile=(typeof managerProfile==='function') ? managerProfile : null;
  if(previousManagerProfile){
    managerProfile=function(){
      const mp=previousManagerProfile.apply(this, arguments);
      ensureLowStart(false);
      return state.managerProfile || mp;
    };
    window.managerProfile=managerProfile;
  }

  const previousManagerReputationDelta = (typeof managerReputationDelta==='function') ? managerReputationDelta : null;
  if(previousManagerReputationDelta){
    managerReputationDelta=function(pos,row){
      const calc=previousManagerReputationDelta.apply(this, arguments) || {delta:0,parts:[]};
      const raw=Math.round(Number(calc.delta||0));
      const exp=Number((typeof expectedFinish==='function' ? expectedFinish(state.humanClub) : 20) || 20);
      const p=Number(pos||20);
      let adjusted=raw;

      if(raw>0){
        const mult=difficultyMultiplier(exp,p) * repeatMultiplier(exp,p);
        adjusted=Math.round(raw*mult);
        const cap=positiveCap(exp,p,row);
        adjusted=Math.min(adjusted,cap);
        if(div()==='top' && exp<=3 && p===1 && adjusted<1) adjusted=1;
        if(div()==='second' && exp>=16 && p<=14 && adjusted<2) adjusted=2;
      }else if(raw<0){
        adjusted=Math.round(raw*penaltyMultiplier(exp));
      }

      calc.rawDeltaBeforeStage12H=raw;
      calc.stage12hAdjusted=true;
      calc.delta=adjusted;
      calc.parts=Array.isArray(calc.parts) ? calc.parts.slice() : [];
      calc.parts.push(stageNote(exp,p,raw,adjusted,row));
      if(div()==='top' && exp<=3 && p===1){
        calc.parts.push('Media mood: winning with this squad helps, but it no longer turns an unknown manager into a superstar overnight.');
      }
      if(div()==='second' && exp>=11 && p<=Math.max(14, exp-4)){
        calc.parts.push('Media mood: clubs higher up the pyramid are starting to notice the lower-division graft.');
      }
      return calc;
    };
    window.managerReputationDelta=managerReputationDelta;
  }

  const previousApplyManagerReputation = (typeof applyManagerReputation==='function') ? applyManagerReputation : null;
  if(previousApplyManagerReputation){
    applyManagerReputation=function(pos,row,sacked){
      ensureLowStart(false);
      if(!sacked) return previousApplyManagerReputation.apply(this, arguments);

      const mp=managerProfile();
      if(!state?.season) return previousApplyManagerReputation.apply(this, arguments);
      if(state.season.managerRepRecorded){
        return Number(mp.lastDelta||0);
      }
      const base=Number.isFinite(Number(state.season.managerRepBaseRating)) ? clampRating(state.season.managerRepBaseRating) : clampRating(mp.rating);
      const calc=managerReputationDelta(pos,row);
      const parts=Array.isArray(calc.parts) ? calc.parts.slice() : [];
      parts.push('Risk Career consequence: sacked managers are reset to reputation 1.');
      mp.sackedCount=(mp.sackedCount||0)+1;
      mp.lastSackedSeason=state.seasonNumber || 1;
      const old=base;
      const next=SACKED_RATING;
      const delta=next-old;
      mp.rating=next;
      mp.committedRating=next;
      mp.seasonBaseRating=next;
      mp.liveDelta=delta;
      mp.liveRating=next;
      mp.provisional=false;
      mp.lastDelta=delta;
      mp.lastBreakdown=parts;
      mp.history=Array.isArray(mp.history)?mp.history:[];
      const entry={season:state.seasonNumber||1, club:state.humanClub, oldRating:old, newRating:next, delta, band:managerBandForRating(next).name, sacked:true, notes:parts};
      mp.history.push(entry);
      state.season.managerRepRecorded=true;
      state.season.managerRepBaseRating=old;
      state.season.managerRepFinal={oldRating:old,newRating:next,delta,parts:parts.slice(),stage12h:true};
      return delta;
    };
    window.applyManagerReputation=applyManagerReputation;
  }

  function addFanPhrases(){
    try{
      const bank=window.XVII_POST_MATCH_REPORT_BANK;
      if(!bank || bank.stage12hRepPhrasesAdded) return;
      bank.stage12hRepPhrasesAdded=true;
      const extra=[
        'Some supporters are still not convinced. Winning with a squad this strong is the minimum, not proof of genius.',
        'The title was celebrated, but the wider football world is still asking whether he can build something rather than inherit it.',
        'A section of the fanbase thinks the club could have done this with almost anyone in charge.',
        'The result helps, but it does not silence the question that followed his appointment: why was an unknown manager trusted with this job?',
        'Lower-league observers were more impressed by the graft than the glamour. This was the kind of job that changes how a manager is spoken about.',
        'The away support know exactly how hard this job is. A finish like that carries more weight than routine wins at richer clubs.'
      ];
      bank.reputationPressure = Array.isArray(bank.reputationPressure) ? bank.reputationPressure.concat(extra) : extra.slice();
    }catch(e){}
  }

  function refreshVersion(){
    document.title='XVII | Build the seventeen. Pick the eleven.';
    document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; });
  }
  function boot(){
    ensureLowStart(false);
    addFanPhrases();
    refreshVersion();
    try{ if(typeof renderManagerCareerPanel==='function') renderManagerCareerPanel(); }catch(e){}
    try{ if(typeof renderClubInfoBottom==='function') renderClubInfoBottom(); }catch(e){}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  const oldRender=(typeof render==='function') ? render : null;
  if(oldRender && !window.__stage12hRenderPatch){
    window.__stage12hRenderPatch=true;
    render=function(){
      const out=oldRender.apply(this, arguments);
      setTimeout(()=>{ ensureLowStart(false); refreshVersion(); },0);
      return out;
    };
    window.render=render;
  }

  setInterval(refreshVersion, 2200);
})();