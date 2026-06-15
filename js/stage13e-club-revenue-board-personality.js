/* Stage 13E: Club revenue balance, board personalities, category effects and achievement cards. */
(function(){
  if(window.__stage13eClubRevenueBoardPersonality) return;
  window.__stage13eClubRevenueBoardPersonality=true;

  const VERSION='Version 13V · Beta';
  function el(id){ return document.getElementById(id); }
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,n(v))); }
  function round1(v){ return Math.round(n(v)*10)/10; }
  function esc(s){
    if(typeof escapeHtml==='function') return escapeHtml(s);
    return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function m(v){ try{ return typeof money==='function'?money(v):'£'+round1(v).toLocaleString()+'m'; }catch(e){ return '£'+round1(v).toLocaleString()+'m'; } }
  function save(){ try{ if(typeof saveGame==='function') saveGame(); }catch(e){} }
  function refreshVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{v.textContent=VERSION;}); }catch(e){} }
  function club(){ return state?.humanClub || ''; }
  function bonuses(c=club()){
    try{ if(typeof stage13eCategoryBonuses==='function') return stage13eCategoryBonuses(c); }catch(e){}
    return {trainingDiscount:0,assistantDiscount:0,scoutingDiscount:0,revenueMultiplier:1,globalPullBonus:0,training:0,stadium:0,commercial:0,youth:0,global:0};
  }
  function personality(c){
    try{ if(typeof stage13eBoardPersonality==='function') return stage13eBoardPersonality(c); }catch(e){}
    return {label:'Balanced board',summary:'A conventional board with no strong bias.'};
  }
  function baseTrainingPrice(tier){
    tier=Number(tier||0);
    return (state?.currentDivision||'top')==='second' ? ({0:0,5:2,10:4,15:7}[tier] ?? tier) : tier;
  }
  function baseBackroomPrice(kind,tier){
    tier=Number(tier||0);
    if((state?.currentDivision||'top')!=='second') return tier;
    const table=kind==='assistant' ? {0:0,1:0.5,2:1,3:1.5,4:2} : {0:0,1:0.5,2:1,3:1.5,4:2,6:4};
    return table[tier] ?? tier;
  }
  function trainingPrice(tier){ return round1(baseTrainingPrice(tier)*(1-n(bonuses().trainingDiscount))); }
  function backroomPrice(kind,tier){
    const b=bonuses();
    const disc=kind==='assistant' ? n(b.assistantDiscount) : n(b.scoutingDiscount);
    return round1(baseBackroomPrice(kind,tier)*(1-disc));
  }
  function setStatusSafe(msg,type){ try{ setStatus(msg,type); }catch(e){} }
  function renderSafe(){ try{ if(typeof render==='function') render(); }catch(e){} }

  function injectStyles(){
    if(el('stage13e-style')) return;
    const st=document.createElement('style');
    st.id='stage13e-style';
    st.textContent=`
      .stage13e-board-personality{margin:7px 0;padding:7px 8px;border:1px solid rgba(168,85,247,.35);border-radius:11px;background:linear-gradient(135deg,rgba(88,28,135,.32),rgba(21,26,46,.72));color:#e9ddff;font-size:8.5px;line-height:1.35}.stage13e-board-personality b{display:block;color:#fff;font-size:9px;margin-bottom:2px}.stage13e-board-personality.compact{font-size:8px;margin-top:6px;padding:6px}.stage13e-unit-grid .stage13-unit-row em{display:block;font-style:normal;color:#b9c7db;font-size:7px;margin-top:2px}.stage13e-economy-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.stage13e-controller-selector label+select{margin-top:4px}.stage13e-discount-note{margin-top:6px;color:#b8c6dc;font-size:8px;line-height:1.35}.stage13e-discount-note b{color:#fff}.stage13e-achievement-overlay{position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(3,7,18,.72);backdrop-filter:blur(4px);padding:18px}.stage13e-achievement-card{width:min(420px,94vw);border-radius:22px;border:1px solid rgba(255,255,255,.20);box-shadow:0 30px 90px rgba(0,0,0,.45);padding:18px;text-align:center;color:#fff;position:relative;overflow:hidden}.stage13e-achievement-card:before{content:'';position:absolute;inset:-40%;background:radial-gradient(circle at 20% 20%,rgba(255,255,255,.18),transparent 30%),radial-gradient(circle at 80% 10%,rgba(255,255,255,.14),transparent 28%);pointer-events:none}.stage13e-achievement-card.promotion{background:linear-gradient(135deg,#14532d,#312e81)}.stage13e-achievement-card.second-title{background:linear-gradient(135deg,#334155,#581c87)}.stage13e-achievement-card.top-title{background:linear-gradient(135deg,#92400e,#581c87)}.stage13e-achievement-mark{position:relative;margin:0 auto 10px;width:116px;height:102px;display:flex;align-items:center;justify-content:center}.stage13e-ribbon{width:96px;height:96px;border-radius:28px 28px 18px 18px;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.34);display:flex;align-items:center;justify-content:center;font-weight:1000;font-size:24px;letter-spacing:.06em;box-shadow:inset 0 0 25px rgba(255,255,255,.10)}.stage13e-ribbon:after{content:'XVII';position:absolute;bottom:8px;font-size:11px;letter-spacing:.18em;color:rgba(255,255,255,.78)}.stage13e-card-kicker{position:relative;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#fde68a;font-weight:1000}.stage13e-achievement-card h2{position:relative;margin:6px 0 6px;font-size:22px;line-height:1.05}.stage13e-achievement-card p{position:relative;margin:6px 0;color:#eef2ff;font-size:12px;line-height:1.45}.stage13e-achievement-card button{position:relative;margin-top:10px}.stage13e-spark{position:absolute;width:8px;height:18px;border-radius:99px;background:rgba(255,255,255,.65);transform:rotate(25deg)}.stage13e-spark.s1{left:42px;top:20px}.stage13e-spark.s2{right:45px;top:24px;transform:rotate(-22deg)}.stage13e-spark.s3{left:68px;bottom:8px;transform:rotate(70deg)}@media(max-width:700px){.stage13e-economy-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.stage13e-achievement-card{padding:15px}.stage13e-achievement-card h2{font-size:20px}}
    `;
    document.head.appendChild(st);
  }

  window.stage13eTrainingPrice=trainingPrice;
  window.stage13eBackroomPrice=backroomPrice;

  if(typeof setTrainingTier==='function' && !window.__stage13eTrainingPatch){
    window.__stage13eTrainingPatch=true;
    setTrainingTier=function(cost){
      if(!state.started) return setStatusSafe('Start a career before choosing training investment.','bad');
      if(state.season) return setStatusSafe('Training investment is locked once the season starts. Choose again next summer.','bad');
      if(state.completed) return setStatusSafe('The window is closed. Training is locked for this season.','bad');
      const next=Number(cost||0), current=Number(state.trainingTier||0);
      if(!TRAINING_TIERS[next]) return;
      const diff=round1(trainingPrice(next)-trainingPrice(current));
      const ht=humanTeam();
      if(diff>0 && ht.budget<diff) return setStatusSafe(`Not enough budget to upgrade training to ${esc(TRAINING_TIERS[next].name)}. You need ${m(diff)} more.`, 'bad');
      ht.budget=round1(n(ht.budget)-Math.max(0,diff));
      state.trainingTier=next;
      const disc=Math.round(n(bonuses().trainingDiscount)*100);
      addLog(`Training investment set to ${esc(TRAINING_TIERS[next].name)}. Extra spend: ${m(Math.max(0,diff))}. Training ground discount: ${disc}%.`);
      setStatusSafe(`Training investment selected: ${esc(TRAINING_TIERS[next].name)}. Training ground discount applied: ${disc}%.`, next===0?'warn':'good');
      renderSafe();
    };
    window.setTrainingTier=setTrainingTier;
  }

  if(typeof renderTrainingPanel==='function' && !window.__stage13eTrainingRenderPatch){
    window.__stage13eTrainingRenderPatch=true;
    renderTrainingPanel=function(){
      const box=el('trainingPanel'); if(!box) return;
      if(!state.started){ box.innerHTML='<div class="training-note">Start a career to choose training investment.</div>'; return; }
      const locked=!!state.season || !!state.completed;
      const current=Number(state.trainingTier||0);
      const info=(typeof trainingTierInfo==='function'?trainingTierInfo():(TRAINING_TIERS[current]||TRAINING_TIERS[0]));
      const buttons=[0,5,10,15].map(tier=>{ const t=TRAINING_TIERS[tier]; const active=current===tier; const price=trainingPrice(tier); return `<button type="button" class="training-option ${active?'active':''}" onclick="setTrainingTier(${tier})" ${locked?'disabled':''}><b>${m(price)} · ${esc(t.short)}</b><span>${esc(t.dev)} ${esc(t.fatigue)}</span></button>`; }).join('');
      const b=bonuses();
      box.innerHTML=`<div class="training-head"><b>Training investment</b><span class="muted">${locked?'Locked':'Choose before season'}</span></div><div class="training-options">${buttons}</div><div class="training-note"><b>Selected:</b> ${esc(info.name)}. ${locked?'This applies to this season.':'You can change this before finishing the summer window.'}<div class="stage13e-discount-note"><b>Training ground:</b> ${b.training}/10 units gives ${Math.round(b.trainingDiscount*100)}% off training packages.</div><div class="save-note">Browser save is automatic on this device.</div></div>`;
    };
    window.renderTrainingPanel=renderTrainingPanel;
  }

  if(typeof setBackroomTier==='function' && !window.__stage13eBackroomPatch){
    window.__stage13eBackroomPatch=true;
    setBackroomTier=function(kind,cost){
      if(!state.started) return setStatusSafe('Start a career before hiring backroom staff.','bad');
      if(state.season || state.completed) return setStatusSafe('Backroom staff packages are locked once the season starts. Choose again next transfer window.','bad');
      const defs=kind==='assistant'?BACKROOM_ASSISTANT_TIERS:BACKROOM_SCOUT_TIERS;
      const key=kind==='assistant'?'assistantTier':'scoutingTier';
      const next=Number(cost||0), current=Number(state[key]||0);
      if(!defs[next]) return;
      if(next===current) return setStatusSafe(`${kind==='assistant'?'Assistant manager':'Scouting department'} is already set to ${esc(defs[current].name)}.`, current?'good':'warn');
      if(next<current) return setStatusSafe(`${kind==='assistant'?'Assistant manager':'Scouting department'} spend is locked for this season. You can upgrade, but you cannot downgrade.`, 'bad');
      const diff=round1(backroomPrice(kind,next)-backroomPrice(kind,current));
      if(diff>0 && humanTeam().budget<diff) return setStatusSafe(`Not enough budget to upgrade ${kind==='assistant'?'assistant manager':'scouting department'} to ${esc(defs[next].name)}. You need ${m(diff)} more.`, 'bad');
      humanTeam().budget=round1(n(humanTeam().budget)-Math.max(0,diff));
      state[key]=next;
      const b=bonuses();
      const disc=kind==='assistant'?Math.round(b.assistantDiscount*100):Math.round(b.scoutingDiscount*100);
      addLog(`${kind==='assistant'?'Assistant manager':'Scouting department'} upgraded to ${esc(defs[next].name)}. Extra spend: ${m(Math.max(0,diff))}. ${kind==='assistant'?'Stadium and matchday':'Youth and recruitment'} discount: ${disc}%.`);
      setStatusSafe(`${kind==='assistant'?'Assistant manager':'Scouting department'} upgraded to ${esc(defs[next].name)}. Spend is locked in for this season.`, 'good');
      renderSafe();
    };
    window.setBackroomTier=setBackroomTier;
  }

  if(typeof renderBackroomPanel==='function' && !window.__stage13eBackroomRenderPatch){
    window.__stage13eBackroomRenderPatch=true;
    renderBackroomPanel=function(){
      const box=el('backroomPanel'); if(!box) return;
      if(!state.started){ box.innerHTML='<div class="backroom-note">Start a career to hire backroom staff.</div>'; return; }
      const locked=!!state.season || state.completed;
      const staffButtons=(kind)=>{ const defs=kind==='assistant'?BACKROOM_ASSISTANT_TIERS:BACKROOM_SCOUT_TIERS, key=kind==='assistant'?'assistantTier':'scoutingTier', current=Number(state[key]||0); return Object.keys(defs).map(k=>{ const tier=Number(k), d=defs[k], active=current===tier, lower=tier<current; const disabled=locked || lower; const diff=round1(backroomPrice(kind,tier)-backroomPrice(kind,current)); const label=lower?'Locked spend':(tier>current?`Upgrade +${m(Math.max(0,diff))}`:'Selected'); return `<button type="button" class="backroom-option ${active?'active':''}" onclick="setBackroomTier('${kind}',${tier})" ${disabled?'disabled':''} title="${esc(label)}"><b>${m(backroomPrice(kind,tier))} · ${esc(d.short)}</b><span>${esc(d.desc)}</span></button>`; }).join(''); };
      const assistant=BACKROOM_ASSISTANT_TIERS[Number(state.assistantTier||0)] || BACKROOM_ASSISTANT_TIERS[0];
      const scout=BACKROOM_SCOUT_TIERS[Number(state.scoutingTier||0)] || BACKROOM_SCOUT_TIERS[0];
      const b=bonuses();
      box.innerHTML=`<div class="backroom-head"><b>Backroom staff</b><span class="muted">${locked?'Locked for season':'Optional information spend'}</span></div><div class="backroom-grid"><div class="backroom-card"><h3>Assistant Manager</h3><div class="muted">Selected: ${esc(assistant.name)}</div><div class="backroom-options">${staffButtons('assistant')}</div>${typeof assistantReportHtml==='function'?assistantReportHtml():''}<div class="stage13e-discount-note"><b>Stadium and matchday:</b> ${b.stadium}/10 units gives ${Math.round(b.assistantDiscount*100)}% off assistant packages and helps revenue.</div></div><div class="backroom-card"><h3>Scouting Department</h3><div class="muted">Selected: ${esc(scout.name)}</div><div class="backroom-options">${staffButtons('scouting')}</div>${typeof scoutReportHtml==='function'?scoutReportHtml():''}<div class="stage13e-discount-note"><b>Youth and recruitment:</b> ${b.youth}/10 units gives ${Math.round(b.scoutingDiscount*100)}% off scouting packages.</div></div></div><div class="backroom-note">Backroom spend comes out of your transfer budget and is locked for the season. Owner development categories can now reduce package prices.</div>`;
    };
    window.renderBackroomPanel=renderBackroomPanel;
  }

  if(typeof clubPullRatingLimit==='function' && !window.__stage13ePullPatch){
    window.__stage13ePullPatch=true;
    const previousLimit=clubPullRatingLimit;
    clubPullRatingLimit=function(c){
      const base=previousLimit.apply(this,arguments);
      const boost=(c===state?.humanClub)?n(bonuses(c).globalPullBonus):0;
      return clamp(Math.round(n(base)+boost),50,99);
    };
    window.clubPullRatingLimit=clubPullRatingLimit;
    if(typeof clubPullRatingLabel==='function'){
      const previousLabel=clubPullRatingLabel;
      clubPullRatingLabel=function(c){
        const label=previousLabel.apply(this,arguments);
        const boost=(c===state?.humanClub)?n(bonuses(c).globalPullBonus):0;
        return boost>0 ? `${label} · global promotion +${boost}` : label;
      };
      window.clubPullRatingLabel=clubPullRatingLabel;
    }
  }

  function personalityHtml(c,compact=false){
    if(!c) return '';
    const p=personality(c);
    return `<div class="stage13e-board-personality ${compact?'compact':''}"><b>${esc(p.label)}</b><span>${esc(p.summary)}</span></div>`;
  }
  if(typeof jobAdvertCopy==='function' && !window.__stage13eJobCopyPatch){
    window.__stage13eJobCopyPatch=true;
    const previousJobAdvertCopy=jobAdvertCopy;
    jobAdvertCopy=function(job){
      const base=previousJobAdvertCopy.apply(this,arguments);
      const c=job?.club;
      if(!c || String(base).includes('stage13e-board-personality')) return base;
      return `${base}${personalityHtml(c,false)}`;
    };
    window.jobAdvertCopy=jobAdvertCopy;
  }
  function injectJobCardPersonalities(){
    try{
      document.querySelectorAll('.job-card').forEach(card=>{
        if(card.querySelector('.stage13e-board-personality')) return;
        const b=card.querySelector('b');
        const c=b?b.textContent.trim():'';
        if(!c) return;
        const actions=card.querySelector('.job-card-actions');
        if(actions) actions.insertAdjacentHTML('beforebegin', personalityHtml(c,true));
        else card.insertAdjacentHTML('beforeend', personalityHtml(c,true));
      });
    }catch(e){}
  }

  function achievementStore(){
    if(!state) return {seen:{}};
    state.stage13eAchievementCards=state.stage13eAchievementCards && typeof state.stage13eAchievementCards==='object' ? state.stage13eAchievementCards : {seen:{}};
    state.stage13eAchievementCards.seen=state.stage13eAchievementCards.seen && typeof state.stage13eAchievementCards.seen==='object' ? state.stage13eAchievementCards.seen : {};
    return state.stage13eAchievementCards;
  }
  function division(){ return state?.currentDivision || (typeof stage9ClubDivision==='function'?stage9ClubDivision(state.humanClub):'top'); }
  function finalPosition(){
    try{ const t=leagueTable(); const idx=t.findIndex(r=>r.club===state.humanClub); return idx>=0?idx+1:0; }catch(e){ return 0; }
  }
  function pickAchievement(){
    if(!state?.started || !state?.humanClub || !state?.season || n(state.season.roundIndex)<38) return null;
    const pos=finalPosition(); if(!pos) return null;
    const div=division();
    if(div==='top' && pos===1) return {type:'top-title',key:`${state.seasonNumber}|${state.humanClub}|top-title`,kicker:'CHAMPIONS',title:`Top Division won with ${state.humanClub}.`,body:'You have conquered the top division. Now build the legacy that proves it was more than one great season.',mark:'★'};
    if(div==='second' && pos===1) return {type:'second-title',key:`${state.seasonNumber}|${state.humanClub}|second-title`,kicker:'CHAMPIONS',title:`Second Division won with ${state.humanClub}.`,body:'You finished top of the division and lifted the club into the next stage of its story.',mark:'◆'};
    if(div==='second' && pos<=3) return {type:'promotion',key:`${state.seasonNumber}|${state.humanClub}|promotion`,kicker:'PROMOTED',title:`Promoted with ${state.humanClub}.`,body:'The club is going up. The board, players and supporters believe something bigger may be starting.',mark:'↑'};
    return null;
  }
  function showAchievementIfNeeded(){
    try{
      if(el('stage13bCompletionOverlay') || el('stage13eAchievementOverlay')) return;
      const ach=pickAchievement(); if(!ach) return;
      const store=achievementStore();
      if(store.seen[ach.key]) return;
      store.seen[ach.key]=true; save();
      const overlay=document.createElement('div');
      overlay.id='stage13eAchievementOverlay';
      overlay.className='stage13e-achievement-overlay';
      overlay.innerHTML=`<div class="stage13e-achievement-card ${esc(ach.type)}">
        <div class="stage13e-achievement-mark"><span class="stage13e-spark s1"></span><span class="stage13e-spark s2"></span><span class="stage13e-spark s3"></span><div class="stage13e-ribbon">${esc(ach.mark)}</div></div>
        <div class="stage13e-card-kicker">${esc(ach.kicker)}</div>
        <h2>${esc(ach.title)}</h2>
        <p>${esc(ach.body)}</p>
        <button class="gold" onclick="stage13eDismissAchievement()">Continue career</button>
      </div>`;
      document.body.appendChild(overlay);
    }catch(e){}
  }
  window.stage13eDismissAchievement=function(){ const o=el('stage13eAchievementOverlay'); if(o) o.remove(); };

  function afterRender(){ injectStyles(); refreshVersion(); injectJobCardPersonalities(); showAchievementIfNeeded(); }
  const oldRender=typeof render==='function'?render:null;
  if(oldRender && !window.__stage13eRenderPatch){
    window.__stage13eRenderPatch=true;
    render=function(){ const out=oldRender.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    window.render=render;
  }
  const oldSeasonSummary=typeof renderSeasonSummary==='function'?renderSeasonSummary:null;
  if(oldSeasonSummary && !window.__stage13eSummaryPatch){
    window.__stage13eSummaryPatch=true;
    renderSeasonSummary=function(){ const out=oldSeasonSummary.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    window.renderSeasonSummary=renderSeasonSummary;
  }
  const oldLoad=typeof loadSavedGame==='function'?loadSavedGame:null;
  if(oldLoad && !window.__stage13eLoadPatch){
    window.__stage13eLoadPatch=true;
    loadSavedGame=function(){ const out=oldLoad.apply(this,arguments); try{ achievementStore(); afterRender(); }catch(e){} return out; };
    window.loadSavedGame=loadSavedGame;
  }
  function boot(){ try{ achievementStore(); afterRender(); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
