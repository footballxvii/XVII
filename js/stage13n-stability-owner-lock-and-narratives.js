/* Stage 13N: footer stability, landing wrapper cleanup, owner decision lock and richer club narrative text. */
(function(){
  if(window.__stage13nStabilityOwnerLockNarratives) return;
  window.__stage13nStabilityOwnerLockNarratives = true;

  const VERSION = 'Version 13S · Beta';
  function byId(id){ return document.getElementById(id); }
  function n(v){ const x = Number(v || 0); return Number.isFinite(x) ? x : 0; }
  function seasonNo(){ return n(window.state?.seasonNumber || 1); }
  function currentClub(){ return window.state?.humanClub || ''; }
  function ownerState(){
    try{ if(typeof window.stage13aOwnerState === 'function') return window.stage13aOwnerState(); }catch(e){}
    window.state = window.state || {};
    window.state.managerOwner = window.state.managerOwner || {clubs:{}};
    window.state.managerOwner.clubs = window.state.managerOwner.clubs || {};
    return window.state.managerOwner;
  }
  function ownerRecord(club){
    club = String(club || currentClub() || '');
    try{ if(typeof window.stage13aClubOwner === 'function') return window.stage13aClubOwner(club); }catch(e){}
    const o = ownerState();
    o.clubs = o.clubs || {};
    if(!o.clubs[club]) o.clubs[club] = {stake:0,lastPlan:null};
    return o.clubs[club];
  }
  function currentStake(club=currentClub()){ return n(ownerRecord(club)?.stake); }
  function fmtMoney(v){
    try{ if(typeof money === 'function') return money(n(v)); }catch(e){}
    return '£' + n(v).toLocaleString(undefined,{maximumFractionDigits:1}) + 'm';
  }
  function html(s){
    if(typeof escapeHtml === 'function') return escapeHtml(s);
    return String(s == null ? '' : s).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c] || c));
  }
  function decisionComplete(club=currentClub()){
    const co = ownerRecord(club);
    const o = ownerState();
    const lp = co?.lastPlan;
    const season = seasonNo();
    return !!(lp && (lp.decisionLocked || lp.appliedImmediately || lp.paid) && (
      n(lp.appliedSeason) === season || n(lp.season) === season
    ));
  }
  function stampDecisionComplete(club=currentClub(), plan=null){
    club = String(club || currentClub() || '');
    if(!club) return null;
    const o = ownerState();
    const co = ownerRecord(club);
    const season = seasonNo();
    const lp = co.lastPlan || plan || {};
    co.lastPlan = {
      ...lp,
      club,
      season: n(lp.season) || season,
      appliedSeason: season,
      decisionLocked: true,
      appliedImmediately: true,
      paid: true,
      reason: lp.reason || 'Controlling owner decision'
    };
    o.lastAppliedSeason = season;
    o.pendingPlan = null;
    o.lastEvent = 'boardroom-decision-applied';
    return co.lastPlan;
  }
  function setLatestVersion(){
    try{ document.querySelectorAll('.xvii-version-note').forEach(v => { v.textContent = VERSION; }); }catch(e){}
  }
  function injectStyles(){
    if(byId('stage13n-style')) return;
    const st = document.createElement('style');
    st.id = 'stage13n-style';
    st.textContent = `
      body.not-started .app,
      body.not-started .app > .panel:first-child,
      body.not-started .app > .panel:first-child > .panel-inner{
        background:transparent!important;
        background-color:transparent!important;
        box-shadow:none!important;
      }
      body.not-started .app > .panel:first-child::before,
      body.not-started .app > .panel:first-child::after,
      body.not-started .app > .panel:first-child > .panel-inner::before,
      body.not-started .app > .panel:first-child > .panel-inner::after{
        display:none!important;
        content:none!important;
        background:none!important;
      }
      .stage13l-controller-selector.stage13n-locked select,
      .stage13l-controller-selector.stage13n-locked input,
      .stage13l-controller-selector.stage13n-locked button{
        pointer-events:none!important;
        opacity:.58!important;
      }
      .stage13n-lock-note{
        margin-top:7px;
        border:1px solid rgba(51,214,159,.35);
        background:rgba(51,214,159,.10);
        color:#d8fff0;
        border-radius:10px;
        padding:7px 8px;
        font-size:9px;
        line-height:1.35;
        font-weight:800;
      }
    `;
    document.head.appendChild(st);
  }

  const CLUB_STORIES = {
    'AFC Bournemouth':'A clever coastal job: modest noise, sharp recruitment and a board that rewards calm progress.',
    'Arsenal':'A demanding stage with impatient standards; beauty is admired, but only silverware calms the room.',
    'Aston Villa':'A big old club with modern momentum; Europe feels close and the crowd expects ambition to mean something.',
    'Brentford':'Smart systems, tight margins and little patience for waste. Build cleverly and the model will back you.',
    'Brighton & Hove Albion':'A recruitment machine by the sea; sell well, replace well and the board will let you grow.',
    'Burnley':'A hard northern brief where grit travels further than glamour. Survival earns respect quickly.',
    'Chelsea':'Huge resources, louder politics and no hiding place. Win fast or the project becomes someone else’s.',
    'Crystal Palace':'South London edge and a restless crowd; give them pace, nerve and a reason to believe.',
    'Everton':'Heavy history, raw nerves and a fanbase desperate for lift-off. Stabilise first, then dream bigger.',
    'Fulham':'A tidy London job with quiet expectations; the trick is turning comfort into ambition.',
    'Leeds United':'A loud club with a national pulse. Get it right and momentum feels bigger than the table.',
    'Liverpool':'An elite seat with memory in the walls. Competing is not enough for long.',
    'Manchester City':'The machine is built to win. Anything less than dominance feels like drift.',
    'Manchester United':'A giant with noise in every corridor. Restore order and the rewards become enormous.',
    'Newcastle United':'A city-club with heavyweight backing. The crowd will carry you if the project feels real.',
    'Nottingham Forest':'European ghosts, fierce pride and modern expectation. A good season can feel historic here.',
    'Sunderland':'A massive support base waiting to rise again; survival is only the first chapter if you catch fire.',
    'Tottenham Hotspur':'Big stadium, big tension and a hunger to finally turn promise into something permanent.',
    'West Ham United':'East London wants swagger with substance. A cup run is nice, but league progress changes the mood.',
    'Wolverhampton Wanderers':'A proud old club where smart rebuilding matters. Give the crowd bite and they will back the climb.',
    'Southampton':'A development club that wants a clean reset. Bring through value and promotion becomes believable.',
    'Middlesbrough':'A serious Teesside job: practical, proud and ready to reward a manager who builds properly.',
    'Norwich City':'A club used to movement between worlds. Stability can become a platform if you stop the bounce.',
    'West Bromwich Albion':'A traditional promotion brief with little romance for excuses. The division expects you to matter.',
    'Wrexham':'A story already travelling the world. The money helps, but the pressure is to keep the fairytale moving.',
    'Leicester City':'Recent glory still hangs over the rebuild. Promotion is not the dream here, it is the starting point.',
    'Huddersfield Town':'A club that remembers impossible climbs. Build belief early and the town will feel it.',
    'Luton Town':'A compact, awkward club with a punch-up spirit. Make the ground a weapon and the project grows teeth.',
    'Reading':'A bruised rebuild where trust matters. Make the club feel stable again and the upside opens up.',
    'Bradford City':'A huge lower-league crowd can turn a run into a movement. Waste that support and it bites back.',
    'Chesterfield':'A proper football-town challenge: organised growth could make this much bigger than it first looks.',
    'Oldham Athletic':'A fallen name with scars and stubborn support. Even small progress feels like repair work.',
    'Swindon Town':'An ambitious rebuild with edge; the board wants movement and the supporters want a spark.',
    'Tranmere Rovers':'A Wirral job with old-school weight. Build a hard team and the climb can feel authentic.',
    'Walsall':'A patient but proud club where smart steps matter. Overachieve and the save starts to open up.',
    'Southend United':'A wounded seaside club with a big emotional upside. Stability alone would feel like a victory.',
    'Forest Green Rovers':'A distinctive project that needs direction again. Make the identity work and it becomes memorable.',
    'Hartlepool United':'A tough coastal rebuild with loyal noise behind it. Give them fight and they will forgive plenty.',
    'Scunthorpe United':'A hard rescue job with little gloss. Every division climbed feels earned.',
    'Yeovil Town':'The brutal legacy save. Tiny money, huge ceiling, and every good decision feels personal.'
  };
  function clubStory(club){ return CLUB_STORIES[club] || 'A fresh project with its own pressure, patience and local mood.'; }
  function updateLandingStories(){
    try{
      document.querySelectorAll('body.not-started .club-choice-card[data-club]').forEach(card => {
        const club = card.getAttribute('data-club') || '';
        const story = clubStory(club);
        const line = card.querySelector('.stage13m-story');
        if(line){ line.textContent = story; line.title = story; }
      });
      const select = byId('clubSelect');
      const selectedClub = select?.value || document.querySelector('body.not-started .club-choice-card.active[data-club]')?.getAttribute('data-club') || '';
      const em = document.querySelector('body.not-started .stage13m-selected-main em');
      if(em && selectedClub){ const story = clubStory(selectedClub); em.textContent = story; em.title = story; }
    }catch(e){}
  }
  function lockControlsDom(club=currentClub(), plan=null){
    try{
      document.querySelectorAll('.stage13l-controller-selector').forEach(panel => {
        const panelClub = panel.getAttribute('data-stage13l-club') || club;
        if(String(panelClub) !== String(club)) return;
        panel.classList.add('stage13n-locked','locked');
        panel.querySelectorAll('select,input,button').forEach(el => {
          el.disabled = true;
          el.setAttribute('aria-disabled','true');
        });
        let note = panel.querySelector('.stage13n-lock-note');
        if(!note){ note = document.createElement('div'); note.className = 'stage13n-lock-note'; panel.appendChild(note); }
        const p = plan || ownerRecord(club)?.lastPlan || {};
        note.innerHTML = `<b>Decision confirmed.</b> ${html(p.label || 'Owner boardroom decision')} is locked for this season. You may now start next season.`;
      });
    }catch(e){}
  }
  function unlockNextSeasonVisual(club=currentClub()){
    try{
      if(!club || currentStake(club) <= 0 || !decisionComplete(club)) return;
      const warn = byId('stage13fOwnerLockWarning');
      if(warn) warn.remove();
      document.querySelectorAll('#seasonSummary .next-season-main-btn').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('secondary');
        btn.classList.add('good');
        btn.title = 'Owner boardroom decision confirmed. You can start next season.';
      });
    }catch(e){}
  }
  function afterRender(){
    injectStyles();
    setLatestVersion();
    updateLandingStories();
    const club = currentClub();
    if(club && decisionComplete(club)){
      lockControlsDom(club, ownerRecord(club)?.lastPlan);
      unlockNextSeasonVisual(club);
    }
  }

  const originalConfirm = typeof window.stage13lConfirmOwnerDecision === 'function' ? window.stage13lConfirmOwnerDecision : null;
  if(originalConfirm && !window.__stage13nConfirmPatch){
    window.__stage13nConfirmPatch = true;
    window.stage13lConfirmOwnerDecision = function(club){
      club = String(club || currentClub() || '');
      if(club && decisionComplete(club)){
        const lp = stampDecisionComplete(club, ownerRecord(club)?.lastPlan);
        lockControlsDom(club, lp);
        unlockNextSeasonVisual(club);
        try{ if(typeof setStatus === 'function') setStatus('Owner boardroom decision is already confirmed and locked for this season.', 'warn'); }catch(e){}
        return {alreadyLocked:true, plan:lp};
      }
      const result = originalConfirm.apply(this, arguments);
      const plan = result?.plan || ownerRecord(club)?.lastPlan || (typeof window.stage13lPreviewOwnerDecision === 'function' ? window.stage13lPreviewOwnerDecision(club) : null) || {};
      const lp = stampDecisionComplete(club, plan);
      lockControlsDom(club, lp);
      unlockNextSeasonVisual(club);
      try{ if(typeof setStatus === 'function') setStatus(`${lp.label || 'Owner decision'} confirmed and locked. You may now start next season.`, 'good'); }catch(e){}
      setTimeout(() => { try{ if(typeof renderSeasonSummary === 'function') renderSeasonSummary(); afterRender(); }catch(e){} }, 0);
      setTimeout(afterRender, 80);
      return result || {paid:true, plan:lp};
    };
    try{ stage13lConfirmOwnerDecision = window.stage13lConfirmOwnerDecision; }catch(e){}
  }

  const oldStart = typeof window.startNextSeasonWithCurrentSquad === 'function' ? window.startNextSeasonWithCurrentSquad : null;
  if(oldStart && !window.__stage13nStartPatch){
    window.__stage13nStartPatch = true;
    window.startNextSeasonWithCurrentSquad = function(){
      try{
        const club = currentClub();
        if(club && currentStake(club) > 0 && decisionComplete(club)){
          stampDecisionComplete(club, ownerRecord(club)?.lastPlan);
          unlockNextSeasonVisual(club);
        }
      }catch(e){}
      return oldStart.apply(this, arguments);
    };
    try{ startNextSeasonWithCurrentSquad = window.startNextSeasonWithCurrentSquad; }catch(e){}
  }

  const oldRender = typeof window.render === 'function' ? window.render : null;
  if(oldRender && !window.__stage13nRenderPatch){
    window.__stage13nRenderPatch = true;
    window.render = function(){ const out = oldRender.apply(this, arguments); try{ afterRender(); }catch(e){} return out; };
    try{ render = window.render; }catch(e){}
  }
  const oldSummary = typeof window.renderSeasonSummary === 'function' ? window.renderSeasonSummary : null;
  if(oldSummary && !window.__stage13nSummaryPatch){
    window.__stage13nSummaryPatch = true;
    window.renderSeasonSummary = function(){ const out = oldSummary.apply(this, arguments); try{ afterRender(); }catch(e){} return out; };
    try{ renderSeasonSummary = window.renderSeasonSummary; }catch(e){}
  }
  const oldClubChoice = typeof window.renderClubChoiceList === 'function' ? window.renderClubChoiceList : null;
  if(oldClubChoice && !window.__stage13nClubChoicePatch){
    window.__stage13nClubChoicePatch = true;
    window.renderClubChoiceList = function(){ const out = oldClubChoice.apply(this, arguments); try{ afterRender(); }catch(e){} return out; };
    try{ renderClubChoiceList = window.renderClubChoiceList; }catch(e){}
  }

  function boot(){
    afterRender();
    setTimeout(afterRender, 60);
    setTimeout(afterRender, 300);
    setInterval(setLatestVersion, 800);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
