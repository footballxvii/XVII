/* Stage 13B: Owner Legacy Board and exact 51% owner development controls. */
(function(){
  if(window.__stage13bOwnerLegacyBoard) return;
  window.__stage13bOwnerLegacyBoard=true;

  const VERSION='Version 13S · Beta';
  const CLUB_COLOURS={
    'Manchester City':'#6CABDD', 'Arsenal':'#EF0107', 'Liverpool':'#C8102E', 'Manchester United':'#DA291C',
    'Aston Villa':'#7A003C', 'Chelsea':'#034694', 'Brighton & Hove Albion':'#0057B8', 'Newcastle United':'#111111',
    'AFC Bournemouth':'#DA291C', 'Tottenham Hotspur':'#132257', 'Brentford':'#D20000', 'Fulham':'#F5F5F5',
    'Nottingham Forest':'#DD0000', 'Crystal Palace':'#1B458F', 'Everton':'#003399', 'Sunderland':'#E30613',
    'West Ham United':'#7A263A', 'Leeds United':'#F6F6F6', 'Wolverhampton Wanderers':'#FDB913', 'Burnley':'#6C1D45',
    'Southampton':'#D71920', 'Middlesbrough':'#D71920', 'Norwich City':'#FFF200', 'West Bromwich Albion':'#122F67',
    'Wrexham':'#DD0000', 'Leicester City':'#003090', 'Huddersfield Town':'#0057B8', 'Luton Town':'#F78F1E',
    'Reading':'#004494', 'Bradford City':'#7A263A', 'Chesterfield':'#005BAC', 'Oldham Athletic':'#005BBB',
    'Swindon Town':'#D71920', 'Tranmere Rovers':'#FFFFFF', 'Walsall':'#EE1C25', 'Southend United':'#0033A0',
    'Forest Green Rovers':'#00A650', 'Hartlepool United':'#0057B8', 'Scunthorpe United':'#7A263A', 'Yeovil Town':'#00843D'
  };
  const LIGHT_CLUBS=new Set(['Fulham','Leeds United','Norwich City','Wolverhampton Wanderers','Tranmere Rovers']);

  function el(id){ return document.getElementById(id); }
  function esc(s){
    if(typeof escapeHtml==='function') return escapeHtml(s);
    return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function save(){ try{ if(typeof saveGame==='function') saveGame(); }catch(e){} }
  function refreshVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; }); }catch(e){} }
  function moneyLocal(v){
    try{ if(typeof money==='function') return money(v); }catch(e){}
    const x=n(v);
    if(Math.abs(x)>0 && Math.abs(x)<1) return '£'+Math.round(x*1000).toLocaleString()+'k';
    return '£'+x.toLocaleString(undefined,{maximumFractionDigits:1})+'m';
  }
  function totalUnitsFrom(units){
    if(typeof stage13aTotalUnits==='function') return stage13aTotalUnits(units||{});
    const keys=['training','stadium','commercial','youth','global'];
    return keys.reduce((sum,k)=>sum+Math.max(0,Math.min(10,Math.round(n((units||{})[k])))),0);
  }
  function ownerState(){
    if(typeof stage13aOwnerState==='function'){
      try{ return stage13aOwnerState(); }catch(e){}
    }
    state.managerOwner=state.managerOwner || {clubs:{}};
    state.managerOwner.clubs=state.managerOwner.clubs || {};
    return state.managerOwner;
  }
  function legacy(){
    const o=ownerState();
    o.legacyBoard=o.legacyBoard || {version:'13f',clubs:{},lastCompletedClub:null,completionMessageSeen:{}};
    const b=o.legacyBoard;
    b.version='13f';
    b.clubs=(b.clubs && typeof b.clubs==='object')?b.clubs:{};
    b.completionMessageSeen=(b.completionMessageSeen && typeof b.completionMessageSeen==='object')?b.completionMessageSeen:{};
    b.lastCompletedClub=b.lastCompletedClub || null;
    playableClubs().forEach(club=>{ b.clubs[club]=normaliseRecord(b.clubs[club]); });
    return b;
  }
  function normaliseRecord(rec){
    return {maxed:false,title:false,completed:false,maxedSeason:null,titleSeason:null,completedSeason:null,...(rec||{})};
  }
  function playableClubs(){
    let arr=[];
    try{ if(typeof XVII_STAGE9_ALL_PLAYABLE_CLUBS!=='undefined') arr=XVII_STAGE9_ALL_PLAYABLE_CLUBS; }catch(e){}
    if(!arr || !arr.length){ try{ if(typeof CLUBS!=='undefined') arr=CLUBS; }catch(e){} }
    const names=[];
    (arr||[]).forEach(c=>{ const club=typeof c==='string'?c:c?.club; if(club && !names.includes(club)) names.push(club); });
    return names.slice(0,40);
  }
  function rawClubOwner(club){
    const o=(state && state.managerOwner && state.managerOwner.clubs) ? state.managerOwner.clubs : {};
    return o[club] || null;
  }
  function clubUnits(club){
    const co=rawClubOwner(club);
    return co ? totalUnitsFrom(co.units||{}) : 20;
  }
  function currentTopDivision(){
    try{ if(state && state.currentDivision) return state.currentDivision==='top'; }catch(e){}
    try{ return stage9ClubDivision(state.humanClub)==='top'; }catch(e){}
    return true;
  }
  function wonCurrentTopTitle(){
    try{
      if(!state?.started || !state?.humanClub || !state?.season || n(state.season.roundIndex)<38) return false;
      if(!currentTopDivision()) return false;
      const table=leagueTable();
      return !!(table && table[0] && table[0].club===state.humanClub);
    }catch(e){ return false; }
  }
  function updateLegacyAchievements(){
    if(!state || !state.started) return;
    const b=legacy();
    const season=n(state.seasonNumber||1);
    let changed=false;
    playableClubs().forEach(club=>{
      const rec=b.clubs[club]=normaliseRecord(b.clubs[club]);
      const co=rawClubOwner(club);
      if(co && totalUnitsFrom(co.units||{})>=50 && !rec.maxed){
        rec.maxed=true; rec.maxedSeason=season; changed=true;
      }
    });
    const club=state.humanClub;
    if(club && wonCurrentTopTitle()){
      const rec=b.clubs[club]=normaliseRecord(b.clubs[club]);
      if(!rec.title){ rec.title=true; rec.titleSeason=season; changed=true; }
    }
    playableClubs().forEach(club=>{
      const rec=b.clubs[club]=normaliseRecord(b.clubs[club]);
      if(rec.maxed && rec.title && !rec.completed){
        rec.completed=true; rec.completedSeason=season; b.lastCompletedClub=club; changed=true;
        try{ addLog(`<b>Owner legacy:</b> ${esc(club)} is now fully completed: 50/50 club units and a Top Division title.`); }catch(e){}
      }
    });
    if(changed) save();
  }
  function clubShort(club){
    const map={
      'Manchester City':'Man City','Manchester United':'Man Utd','Tottenham Hotspur':'Spurs','Newcastle United':'Newcastle',
      'Brighton & Hove Albion':'Brighton','Wolverhampton Wanderers':'Wolves','Nottingham Forest':'Forest',
      'West Bromwich Albion':'West Brom','Huddersfield Town':'Huddersfield','Forest Green Rovers':'Forest Green'
    };
    const s=map[club] || club;
    if(s.length<=13) return s;
    return s.split(/\s+/).map(x=>x[0]).join('').slice(0,4).toUpperCase();
  }
  function legacyBoardHtml(){
    if(!state || !state.started) return '';
    const b=legacy();
    const clubs=playableClubs();
    const maxed=clubs.filter(c=>b.clubs[c]?.maxed).length;
    const completed=clubs.filter(c=>b.clubs[c]?.completed).length;
    const medals=clubs.map((club,idx)=>{
      const rec=normaliseRecord(b.clubs[club]);
      const colour=CLUB_COLOURS[club] || '#7E3FF2';
      const cls=['stage13b-legacy-medal', rec.maxed?'maxed':'', rec.completed?'completed':''].filter(Boolean).join(' ');
      const title=`${idx+1}. ${club} — ${rec.completed?'completed':rec.maxed?'50/50 units maxed':rec.title?'Top Division title banked':'locked'}${rec.maxed?` · units ${clubUnits(club)}/50`:''}`;
      const light=LIGHT_CLUBS.has(club) ? ' light' : '';
      return `<div class="${cls}${light}" style="--club-colour:${esc(colour)}" title="${esc(title)}"><div class="legacy-num">${idx+1}</div><div class="legacy-club">${esc(clubShort(club))}</div></div>`;
    }).join('');
    return `<div class="stage13b-owner-legacy-board">
      <div class="stage13b-legacy-head"><b>Manager Owner Legacy Board</b><span>${maxed}/40 clubs maxed · ${completed}/40 fully completed</span></div>
      <div class="stage13b-legacy-grid">${medals}</div>
      <div class="stage13b-legacy-note">Dark purple medals are untouched. Club-colour medals mean 50/50 units. A thick gold ring means that club is fully completed with 50/50 units and a Top Division title.</div>
    </div>`;
  }
  function injectOwnerLegacyBoard(){
    const box=el('badgeBoardBottom');
    if(!box || !state?.started) return;
    const old=box.querySelector('.stage13b-owner-legacy-board');
    if(old) old.remove();
    const html=legacyBoardHtml();
    if(!html) return;
    const actions=box.querySelector('.modal-actions');
    if(actions) actions.insertAdjacentHTML('beforebegin', html);
    else box.insertAdjacentHTML('beforeend', html);
  }
  function completionGraphic(){
    return `<div class="stage13b-trophy-scene" aria-hidden="true">
      <span class="confetti c1"></span><span class="confetti c2"></span><span class="confetti c3"></span><span class="confetti c4"></span><span class="confetti c5"></span><span class="confetti c6"></span>
      <div class="stage13b-css-trophy"><div class="cup"><span>XVII</span></div><div class="stem"></div><div class="base"></div></div>
    </div>`;
  }
  function showCompletionIfNeeded(){
    if(!state?.started) return;
    const b=legacy();
    const club=b.lastCompletedClub;
    if(!club || b.completionMessageSeen[club]) return;
    if(el('stage13bCompletionOverlay')) return;
    b.completionMessageSeen[club]=true;
    save();
    const overlay=document.createElement('div');
    overlay.id='stage13bCompletionOverlay';
    overlay.className='stage13b-completion-overlay';
    overlay.innerHTML=`<div class="stage13b-completion-card">
      ${completionGraphic()}
      <div class="stage13b-completion-kicker">CONGRATULATIONS</div>
      <h2>You completed XVII with ${esc(club)}.</h2>
      <p>You have maxed the club to 50 out of 50 development units and won the Top Division.</p>
      <p>Keep playing to build a dynasty, or take on a new club and try to complete them all.</p>
      <button class="gold" onclick="stage13bDismissCompletion()">Continue career</button>
    </div>`;
    document.body.appendChild(overlay);
  }
  window.stage13bDismissCompletion=function(){
    const overlay=el('stage13bCompletionOverlay');
    if(overlay) overlay.remove();
  };

  const oldBadge=typeof renderBadgeBoardBottom==='function'?renderBadgeBoardBottom:null;
  if(oldBadge && !window.__stage13bBadgeBoardPatch){
    window.__stage13bBadgeBoardPatch=true;
    renderBadgeBoardBottom=function(){
      const out=oldBadge.apply(this,arguments);
      try{ updateLegacyAchievements(); injectOwnerLegacyBoard(); showCompletionIfNeeded(); }catch(e){}
      return out;
    };
    window.renderBadgeBoardBottom=renderBadgeBoardBottom;
  }
  const oldSummary=typeof renderSeasonSummary==='function'?renderSeasonSummary:null;
  if(oldSummary && !window.__stage13bSeasonSummaryPatch){
    window.__stage13bSeasonSummaryPatch=true;
    renderSeasonSummary=function(){
      const out=oldSummary.apply(this,arguments);
      try{ updateLegacyAchievements(); injectOwnerLegacyBoard(); showCompletionIfNeeded(); }catch(e){}
      return out;
    };
    window.renderSeasonSummary=renderSeasonSummary;
  }
  const oldRender=typeof render==='function'?render:null;
  if(oldRender && !window.__stage13bRenderPatch){
    window.__stage13bRenderPatch=true;
    render=function(){
      const out=oldRender.apply(this,arguments);
      try{ refreshVersion(); updateLegacyAchievements(); injectOwnerLegacyBoard(); showCompletionIfNeeded(); }catch(e){}
      return out;
    };
    window.render=render;
  }
  const oldLoad=typeof loadSavedGame==='function'?loadSavedGame:null;
  if(oldLoad && !window.__stage13bLoadPatch){
    window.__stage13bLoadPatch=true;
    loadSavedGame=function(){
      const out=oldLoad.apply(this,arguments);
      try{ legacy(); refreshVersion(); updateLegacyAchievements(); injectOwnerLegacyBoard(); }catch(e){}
      return out;
    };
    window.loadSavedGame=loadSavedGame;
  }
  function legacySummaryText(){
    try{
      const b=legacy();
      const clubs=playableClubs();
      const maxed=clubs.filter(c=>b.clubs[c]?.maxed).length;
      const completed=clubs.filter(c=>b.clubs[c]?.completed).length;
      return `Manager Owner Legacy Board: ${maxed}/40 clubs maxed, ${completed}/40 fully completed.`;
    }catch(e){ return ''; }
  }
  window.stage13bLegacyBoardHtml=legacyBoardHtml;
  window.stage13bLegacySummaryText=legacySummaryText;
  function boot(){ try{ legacy(); refreshVersion(); updateLegacyAchievements(); injectOwnerLegacyBoard(); showCompletionIfNeeded(); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
