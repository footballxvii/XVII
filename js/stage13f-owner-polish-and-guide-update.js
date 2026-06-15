/* Stage 13F: owner mechanics fixes, landing/job board personality, guide update and legacy summary polish. */
(function(){
  if(window.__stage13fOwnerPolishGuideUpdate) return;
  window.__stage13fOwnerPolishGuideUpdate=true;

  const VERSION='Version 13O · Beta';
  function el(id){ return document.getElementById(id); }
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function esc(s){
    if(typeof escapeHtml==='function') return escapeHtml(s);
    return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function moneyLocal(v){ try{ if(typeof money==='function') return money(v); }catch(e){} return '£'+n(v).toLocaleString(undefined,{maximumFractionDigits:1})+'m'; }
  function seasonNo(){ return n(state?.seasonNumber || 1); }
  function ownerClubRecord(club){
    try{ return (typeof stage13aClubOwner==='function') ? stage13aClubOwner(club) : (state?.managerOwner?.clubs?.[club] || null); }catch(e){ return state?.managerOwner?.clubs?.[club] || null; }
  }
  function currentStake(club=state?.humanClub){ return n(ownerClubRecord(club)?.stake); }
  function decisionLocked(club=state?.humanClub){
    const lp=ownerClubRecord(club)?.lastPlan;
    return !!(lp && lp.decisionLocked && n(lp.appliedSeason)===seasonNo());
  }
  function personality(club){
    try{ if(typeof stage13eBoardPersonality==='function') return stage13eBoardPersonality(club); }catch(e){}
    return {label:'Balanced board',summary:'A conventional board with no strong bias.'};
  }
  function personalityHtml(club,compact=true){
    if(!club) return '';
    const p=personality(club);
    return `<div class="stage13f-board-personality ${compact?'compact':''}"><b>${esc(p.label)}</b><span>${esc(p.summary)}</span></div>`;
  }
  function injectStyles(){
    if(el('stage13f-style')) return;
    const st=document.createElement('style');
    st.id='stage13f-style';
    st.textContent=`
      .stage12c-career-choice-card{grid-column:1/-1!important;}
      .stage13f-board-personality{margin-top:6px;padding:6px 7px;border-radius:10px;border:1px solid rgba(168,85,247,.35);background:linear-gradient(135deg,rgba(88,28,135,.28),rgba(15,23,42,.70));color:#e9ddff;font-size:8.5px;line-height:1.32;text-align:left}.stage13f-board-personality b{display:block;color:#fff;font-size:9px;margin-bottom:2px}.stage13f-board-personality.compact{font-size:8px;padding:5px 6px}.club-choice-card .stage13f-board-personality{grid-column:1/-1}.stage13f-selected-board{grid-column:1/-1;min-width:100%;}
      .stage13f-summary-legacy{margin-top:10px}.stage13f-owner-lock-warning{margin:8px 0;padding:8px 10px;border-radius:11px;border:1px solid rgba(248,113,113,.35);background:rgba(127,29,29,.20);color:#fecaca;font-size:10px;line-height:1.35}.stage13f-owner-lock-warning b{color:#fff}.stage13f-owner-fan-review{border:1px solid rgba(168,85,247,.35);background:linear-gradient(135deg,rgba(88,28,135,.20),rgba(2,6,23,.55));border-radius:14px;padding:10px;margin:8px 0;color:#dfeaff}.stage13f-owner-fan-review p{font-size:10px;line-height:1.45;margin:6px 0}.stage13f-controller-selector .stage13-plan-actions{gap:6px;flex-wrap:wrap}.stage13f-controller-selector .stage13c-boardroom-explainer{margin-top:6px}
      .xvii-help-section.stage13f-owner-help{border-color:rgba(168,85,247,.35)!important;background:rgba(88,28,135,.12)!important}
    `;
    document.head.appendChild(st);
  }
  function refreshVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(x=>x.textContent=VERSION); }catch(e){} }

  function updateLandingCopy(){
    try{
      const grid=el('landingInfoGrid');
      const cards=grid ? Array.from(grid.querySelectorAll('.landing-info-card')) : [];
      cards.forEach(card=>{
        const h=(card.querySelector('h2')?.textContent || '').trim().toLowerCase();
        if(h==='how it plays'){
          card.querySelector('p').textContent='Choose a club, build a 17-player squad, pick the XI each week and beat expectation. As the save grows you manage fatigue, training, staff, scouting, job offers, salary, personal wealth, ownership, boardroom votes and club development.';
        } else if(h==='beta roadmap'){
          card.querySelector('p').textContent='The beta now has two divisions, job movement, manager reputation, salaries, personal wealth, owner buy-ins, board personalities and legacy boards. Future aims include login saves, more databases, extra competitions and multiplayer.';
        } else if(h==='career choice matters'){
          card.classList.add('stage12c-career-choice-card');
          card.querySelector('p').textContent='Picking a club is now a career decision, not just a budget choice. Big clubs bring pressure. Small clubs can build your name. Ambitious boards push growth, cautious boards protect stability, and ownership can turn one good job into a long-term legacy.';
        }
      });
    }catch(e){}
  }

  function injectLandingBoardPersonalities(){
    try{
      document.querySelectorAll('.club-choice-card').forEach(card=>{
        if(card.querySelector('.stage13f-board-personality')) return;
        const club=card.getAttribute('data-club') || card.querySelector('.club-choice-name')?.textContent?.trim();
        if(!club) return;
        const budget=card.querySelector('.club-choice-budget');
        if(budget) budget.insertAdjacentHTML('beforebegin', personalityHtml(club,true));
        else card.insertAdjacentHTML('beforeend', personalityHtml(club,true));
      });
      const spot=el('selectedClubSpot');
      const selected=el('clubSelect')?.value || state?.humanClub;
      if(spot && selected && !spot.querySelector('.stage13f-selected-board')){
        spot.insertAdjacentHTML('beforeend', `<div class="selected-club-pill stage13f-selected-board"><strong>${esc(personality(selected).label)}</strong><small>${esc(personality(selected).summary)}</small></div>`);
      }
    }catch(e){}
  }

  function injectJobBoardPersonalities(){
    try{
      document.querySelectorAll('.job-card').forEach(card=>{
        if(card.querySelector('.stage13f-board-personality,.stage13e-board-personality')) return;
        const club=card.querySelector(':scope > b')?.textContent?.trim() || card.querySelector('b')?.textContent?.trim();
        if(!club) return;
        const actions=card.querySelector('.job-card-actions');
        if(actions) actions.insertAdjacentHTML('beforebegin', personalityHtml(club,true));
        else card.insertAdjacentHTML('beforeend', personalityHtml(club,true));
      });
    }catch(e){}
  }

  function updateHelpGuide(){
    try{
      const widget=el('xviiHelpWidget');
      const grid=widget?.querySelector('.xvii-help-grid');
      if(!grid || grid.getAttribute('data-stage13f-help')==='1') return;
      grid.setAttribute('data-stage13f-help','1');
      grid.innerHTML=`
        <div class="xvii-help-section"><h3>The core loop</h3><p>Choose a club, build a 17-player squad, pick an XI each game week and try to beat the board's expected finish. You are judged more against expectation than raw league position.</p><ul><li>Squad target: 2 goalkeepers, 5 defenders, 5 midfielders, 5 forwards.</li><li>Fatigue, cards, injuries, staff advice and formations all shape the season.</li><li>Promotion, relegation, job offers and ownership can change the whole career path.</li></ul></div>
        <div class="xvii-help-section"><h3>Buying players</h3><p>The transfer pool is made of unattached players, released players and transfer-listed opportunities. Club pull decides who is realistic.</p><ul><li><b>Would Join</b> and <b>Too Ambitious</b> tags show realistic targets.</li><li>Global promotion club units can improve player pull.</li><li>Transfer-listed players are easier to attract because they see the move as a stepping stone.</li></ul></div>
        <div class="xvii-help-section"><h3>Selling and listing</h3><p><b>Sell</b> releases a player immediately for his value. <b>List</b> keeps him in the squad while the director of football tests the market.</p><ul><li>Forced board sales can happen in later windows.</li><li>Transfer requests make a sale more likely.</li><li>Long-service issues are rare club events, not constant random rolls.</li></ul></div>
        <div class="xvii-help-section"><h3>Backroom staff and training</h3><p>Training helps player development and fatigue management. Assistant and scouting packages improve advice, team picks, formation reads and market information.</p><ul><li>Training ground units reduce training package prices.</li><li>Stadium and matchday units reduce assistant manager prices.</li><li>Youth and recruitment units reduce scouting package prices.</li></ul></div>
        <div class="xvii-help-section"><h3>Formations and mentality</h3><p>Legal formations are 4-5-1, 4-4-2, 4-3-3, 3-5-2 and 3-4-3. The formation creator lets you build a custom-looking tactic, but it still maps to one of those legal shapes.</p><ul><li>Defensive shapes protect results.</li><li>Attacking shapes chase wins but carry more risk.</li><li>Mentality affects match narrative, fan reaction and the feel of the result.</li></ul></div>
        <div class="xvii-help-section"><h3>Manager career</h3><p>Your reputation grows through overperformance, promotion, survival, records, challenges and difficult jobs. Bigger reputation unlocks stronger player pull, better jobs and eventually the manager-owner route.</p><ul><li>Safe Career has no sackings.</li><li>Risk Career can sack you if you badly miss expectation.</li><li>Salary and personal wealth build over the career and are separate from club transfer budget.</li></ul></div>
        <div class="xvii-help-section stage13f-owner-help"><h3>Owner mode and boardroom votes</h3><p>At 90+ reputation you can buy into clubs. 5% and 25% stakes give influence, while 51% gives control. Non-controlling owners can vote, but the board may still overrule them.</p><ul><li>Buying from 5% to 25% only charges the extra 20%.</li><li>Board decisions can make owners contribute, but never enough to force financial collapse.</li><li>At 51%, you choose development units and category focus directly.</li></ul></div>
        <div class="xvii-help-section stage13f-owner-help"><h3>Club development units</h3><p>Each club has 50 development units across training ground, stadium and matchday, commercial, youth and recruitment, and global promotion. Every year the club suffers up to 5 units of normal wear.</p><ul><li>Reinvestment repairs yearly wear and keeps a well-run club stable.</li><li>Moving money to transfers costs no personal money, but the club skips maintenance and loses units.</li><li>Maintenance plus transfer funds makes owners pay the maintenance bill, then moves club income into transfer budget.</li></ul></div>
        <div class="xvii-help-section"><h3>Badges and legacy boards</h3><p>The green XVII Trophy Board tracks season challenges. The purple Manager Owner Legacy Board tracks long-term club completion.</p><ul><li>Club-colour owner medals mean the club has reached 50/50 development units.</li><li>A gold-ring owner medal means 50/50 units plus a Top Division title.</li><li>The special XVII trophy graphic is reserved for fully completing a club as an owner.</li></ul></div>
        <div class="xvii-help-section"><h3>Budgets and prize money</h3><p>Next season's transfer budget is shaped by cash carried over, prize money, challenge bonus, promotion support and owner boardroom decisions.</p><ul><li>Transfer-budget owner decisions are added through the club's carried-over cash.</li><li>Staff and training spend reduces the same transfer cash used for players.</li><li>Small clubs can grow, but raiding development money too often weakens the club underneath you.</li></ul></div>
      `;
      const sub=widget.querySelector('.xvii-help-head span');
      if(sub) sub.textContent='Guide to transfers, staff, tactics, careers, ownership and club development';
    }catch(e){}
  }

  function injectLegacyBoardIntoSeasonSummary(){
    try{
      const box=el('seasonSummary');
      if(!box || !state?.season || n(state.season.roundIndex)<38) return;
      if(box.querySelector('.stage13f-summary-legacy')) return;
      let html='';
      if(typeof stage13bLegacyBoardHtml==='function') html=stage13bLegacyBoardHtml();
      if(!html) return;
      const wrap=document.createElement('div');
      wrap.className='stage13f-summary-legacy';
      wrap.innerHTML=html;
      const trophy=box.querySelector('.trophy-board');
      if(trophy) trophy.insertAdjacentElement('afterend', wrap);
      else box.querySelector('.end-season-hero')?.appendChild(wrap);
    }catch(e){}
  }

  function patchShareText(){
    if(window.__stage13fShareTextPatch || typeof seasonSummaryText!=='function') return;
    window.__stage13fShareTextPatch=true;
    const previous=seasonSummaryText;
    seasonSummaryText=function(){
      const base=previous.apply(this,arguments);
      let legacy='';
      try{ if(typeof stage13bLegacySummaryText==='function') legacy=stage13bLegacySummaryText(); }catch(e){}
      return legacy ? `${base}\n${legacy}` : base;
    };
    window.seasonSummaryText=seasonSummaryText;
  }

  function lockNextSeasonButtonIfOwnerDecisionMissing(){
    try{
      const btn=document.querySelector('#seasonSummary .next-season-main-btn');
      const club=state?.humanClub;
      if(!btn || !club || !state?.season || n(state.season.roundIndex)<38) return;
      if(state?.pendingJobAppointment?.to) return;
      if(currentStake(club)>0 && !decisionLocked(club)){
        btn.classList.add('secondary');
        btn.classList.remove('good');
        btn.title='Confirm an owner boardroom decision first.';
        if(!el('stage13fOwnerLockWarning')){
          btn.closest('.modal-actions')?.insertAdjacentHTML('beforebegin', `<div id="stage13fOwnerLockWarning" class="stage13f-owner-lock-warning"><b>Owner decision required:</b> confirm a boardroom development decision before starting next season.</div>`);
        }
      }
    }catch(e){}
  }

  function afterRender(){
    injectStyles(); refreshVersion(); updateLandingCopy(); injectLandingBoardPersonalities(); injectJobBoardPersonalities(); updateHelpGuide(); injectLegacyBoardIntoSeasonSummary(); lockNextSeasonButtonIfOwnerDecisionMissing(); patchShareText();
  }

  const oldRenderClubChoiceList=typeof renderClubChoiceList==='function'?renderClubChoiceList:null;
  if(oldRenderClubChoiceList && !window.__stage13fClubChoicePatch){
    window.__stage13fClubChoicePatch=true;
    renderClubChoiceList=function(){ const out=oldRenderClubChoiceList.apply(this,arguments); try{ updateLandingCopy(); injectLandingBoardPersonalities(); }catch(e){} return out; };
    window.renderClubChoiceList=renderClubChoiceList;
  }
  const oldRender=typeof render==='function'?render:null;
  if(oldRender && !window.__stage13fRenderPatch){
    window.__stage13fRenderPatch=true;
    render=function(){ const out=oldRender.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    window.render=render;
  }
  const oldSummary=typeof renderSeasonSummary==='function'?renderSeasonSummary:null;
  if(oldSummary && !window.__stage13fSummaryPatch){
    window.__stage13fSummaryPatch=true;
    renderSeasonSummary=function(){ const out=oldSummary.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    window.renderSeasonSummary=renderSeasonSummary;
  }
  const oldLoad=typeof loadSavedGame==='function'?loadSavedGame:null;
  if(oldLoad && !window.__stage13fLoadPatch){
    window.__stage13fLoadPatch=true;
    loadSavedGame=function(){ const out=oldLoad.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    window.loadSavedGame=loadSavedGame;
  }
  function boot(){ try{ afterRender(); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
