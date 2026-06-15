/* Stage 11: Formation Creator and Tactical Theatre.
   Visual custom tactic layer. Match engine still receives one of the existing legal formations. */
(function(){
  if(window.__stage11FormationCreator) return;
  window.__stage11FormationCreator = true;

  const STAGE11 = {
    version: 'Version 13W · Beta',
    rawCustom: 'Custom Tactic',
    allowed: ['4-5-1','4-4-2','4-3-3','3-5-2','3-4-3'],
    key: 'xvii_stage11_tactic_panel_collapsed_v1'
  };
  const ROLE_LABEL = {Goalkeeper:'GK', Defender:'DEF', Midfielder:'MID', Forward:'FWD'};
  const ROLE_CLASS = {Goalkeeper:'gk', Defender:'def', Midfielder:'mid', Forward:'fwd'};
  const ARROWS = {
    none: {label:'None', glyph:''},
    forward: {label:'Forward', glyph:'↑'},
    backward: {label:'Backward', glyph:'↓'},
    inside: {label:'Inside', glyph:'↔'},
    wide: {label:'Wide', glyph:'↕'}
  };

  function safeEl(id){ try{ return document.getElementById(id); }catch(e){ return null; } }
  function esc(s){
    if(typeof escapeHtml === 'function') return escapeHtml(s);
    return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function isMobile(){
    try{ return typeof isMobileLayout === 'function' ? isMobileLayout() : window.matchMedia('(max-width:700px)').matches; }
    catch(e){ return window.innerWidth <= 700; }
  }
  function save(){ try{ if(typeof saveGame === 'function') saveGame(); }catch(e){} }
  function refreshLight(){
    try{ if(typeof renderKpis === 'function') renderKpis(); }catch(e){}
    try{ if(typeof renderTrainingPanel === 'function') renderTrainingPanel(); }catch(e){}
    try{ if(typeof renderBackroomPanel === 'function') renderBackroomPanel(); }catch(e){}
    try{ if(typeof renderLog === 'function') renderLog(); }catch(e){}
    try{ if(typeof renderWindowActivity === 'function') renderWindowActivity(); }catch(e){}
    try{ if(typeof renderPlayers === 'function') renderPlayers(); }catch(e){}
    try{ if(typeof renderStage11TacticPanel === 'function') renderStage11TacticPanel(); }catch(e){}
    save();
  }

  function injectStyles(){
    if(document.getElementById('stage11-formation-creator-style')) return;
    const style=document.createElement('style');
    style.id='stage11-formation-creator-style';
    style.textContent=`
      .stage11-tactic-panel{border:1px solid rgba(51,214,159,.32);border-radius:12px;background:linear-gradient(180deg,rgba(51,214,159,.075),rgba(255,255,255,.025));padding:8px;margin:7px 0;min-width:0;}
      .stage11-tactic-panel .xvii-collapse-head{display:flex!important;}
      .stage11-tactic-body{display:grid;grid-template-columns:minmax(320px,.9fr) minmax(280px,1fr);gap:8px;align-items:stretch;}
      .stage11-toolbar{display:grid;grid-template-columns:minmax(140px,220px) auto auto;gap:6px;align-items:end;margin-bottom:7px;}
      .stage11-toolbar button,.stage11-arrow-row button{min-height:31px;}
      .stage11-pitch-wrap{border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:8px;background:rgba(0,0,0,.18);}
      .stage11-pitch{position:relative;width:100%;height:430px;max-height:58vh;min-height:330px;border:2px solid rgba(255,255,255,.58);border-radius:14px;overflow:hidden;background:linear-gradient(180deg,#1f7a42,#166235);box-shadow:inset 0 0 0 1px rgba(0,0,0,.20);touch-action:none;}
      .stage11-pitch:before{content:'';position:absolute;left:0;right:0;top:50%;border-top:1px solid rgba(255,255,255,.48);}
      .stage11-pitch:after{content:'';position:absolute;width:72px;height:72px;border:1px solid rgba(255,255,255,.45);border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%);}
      .stage11-box-top,.stage11-box-bottom{position:absolute;left:26%;width:48%;height:15%;border:1px solid rgba(255,255,255,.44);}
      .stage11-box-top{top:0;border-top:0;border-radius:0 0 8px 8px;}.stage11-box-bottom{bottom:0;border-bottom:0;border-radius:8px 8px 0 0;}
      .stage11-token{position:absolute;width:43px;height:43px;border-radius:999px;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);border:2px solid rgba(255,255,255,.78);box-shadow:0 5px 16px rgba(0,0,0,.35);font-size:9px;font-weight:950;color:#071023;cursor:grab;user-select:none;z-index:5;}
      .stage11-token:active{cursor:grabbing;}
      .stage11-token.gk{background:#33d69f;}.stage11-token.def{background:#78a6ff;}.stage11-token.mid{background:#f6c85f;}.stage11-token.fwd{background:#ff6b6b;color:#220606;}
      .stage11-token.selected{outline:3px solid rgba(255,255,255,.72);box-shadow:0 0 0 4px rgba(0,0,0,.18),0 8px 22px rgba(0,0,0,.40);}
      .stage11-token .stage11-arrow-glyph{position:absolute;right:-7px;top:-10px;min-width:20px;height:20px;border-radius:999px;background:#071023;color:#fff;border:1px solid rgba(255,255,255,.55);font-size:14px;line-height:18px;text-align:center;}
      .stage11-side{display:grid;gap:7px;align-content:start;}
      .stage11-advice,.stage11-summary,.stage11-selected-card{border:1px solid rgba(255,255,255,.13);border-radius:10px;background:rgba(0,0,0,.16);padding:8px;color:#dfe9ff;font-size:9px;line-height:1.38;}
      .stage11-advice b,.stage11-summary b,.stage11-selected-card b{color:#fff;}
      .stage11-tag-row{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px;}
      .stage11-tactic-tag{border:1px solid rgba(255,255,255,.15);border-radius:999px;background:rgba(255,255,255,.07);padding:2px 7px;font-size:8px;font-weight:900;color:#dfe9ff;}
      .stage11-arrow-row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin-top:6px;}
      .stage11-arrow-row button.active{background:var(--good);color:#06140f;}
      .stage11-note{color:var(--muted);font-size:8.5px;line-height:1.35;margin-top:6px;}
      .stage11-disabled-note{border:1px solid rgba(246,200,95,.30);border-radius:10px;background:rgba(246,200,95,.075);padding:8px;color:#ffe8aa;font-size:9px;line-height:1.35;}
      .stage11-counts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin-top:5px;}
      .stage11-counts span{border:1px solid rgba(255,255,255,.12);border-radius:7px;background:rgba(255,255,255,.055);padding:4px;font-weight:900;text-align:center;}
      .stage11-quick-line{display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin-top:6px;}
      .stage11-quick-line button{min-height:30px;}
      @media (min-width:701px){
        .league-table-box > .xvii-collapse-head{display:none!important;}
        .league-table-box.xvii-collapsed{padding-bottom:6px!important;}
        .league-table-box.xvii-collapsed > .xvii-collapse-body,.league-table-box.xvii-collapsed > .stage10d-collapse-body{display:block!important;}
      }
      @media (max-width:700px){
        .stage11-tactic-panel{margin:0 0 7px;width:100%;max-width:100%;}
        .stage11-tactic-body{grid-template-columns:1fr;}
        .stage11-toolbar{grid-template-columns:1fr;}
        .stage11-pitch{height:390px;min-height:340px;max-height:none;}
        .stage11-token{width:38px;height:38px;font-size:8px;}
        .stage11-arrow-row{grid-template-columns:1fr 1fr;}
      }
    `;
    document.head.appendChild(style);
  }

  function countsForFormation(name){
    if(name==='4-5-1') return {Goalkeeper:1,Defender:4,Midfielder:5,Forward:1};
    if(name==='4-3-3') return {Goalkeeper:1,Defender:4,Midfielder:3,Forward:3};
    if(name==='3-5-2') return {Goalkeeper:1,Defender:3,Midfielder:5,Forward:2};
    if(name==='3-4-3') return {Goalkeeper:1,Defender:3,Midfielder:4,Forward:3};
    return {Goalkeeper:1,Defender:4,Midfielder:4,Forward:2};
  }
  function formationFromCounts(c){
    const d=Number(c.Defender||0), m=Number(c.Midfielder||0), f=Number(c.Forward||0);
    if(d===4 && m===5 && f===1) return '4-5-1';
    if(d===4 && m===4 && f===2) return '4-4-2';
    if(d===4 && m===3 && f===3) return '4-3-3';
    if(d===3 && m===5 && f===2) return '3-5-2';
    if(d===3 && m===4 && f===3) return '3-4-3';
    return null;
  }
  function lineXs(count){
    if(count<=1) return [50];
    if(count===2) return [34,66];
    if(count===3) return [24,50,76];
    if(count===4) return [16,39,61,84];
    return [11,30,50,70,89];
  }
  function defaultTokensForFormation(name){
    const c=countsForFormation(name);
    const ys={Goalkeeper:90,Defender:72,Midfielder:47,Forward:21};
    const tokens=[];
    let id=1;
    ['Goalkeeper','Defender','Midfielder','Forward'].forEach(role=>{
      lineXs(c[role]||0).forEach((x,i)=>{
        tokens.push({id:id++, role, x, y:ys[role], arrow:'none', label:`${ROLE_LABEL[role]}${role==='Goalkeeper'?'':i+1}`});
      });
    });
    return tokens;
  }
  function ensureTacticState(){
    if(typeof state === 'undefined' || !state) return null;
    if(!state.customTactic || typeof state.customTactic!=='object'){
      state.customTactic={baseFormation:'4-4-2', mappedFormation:'4-4-2', tokens:defaultTokensForFormation('4-4-2'), selectedId:2, saved:false, tags:[], lastAdvice:''};
    }
    if(!Array.isArray(state.customTactic.tokens) || !state.customTactic.tokens.length){
      state.customTactic.tokens=defaultTokensForFormation(state.customTactic.baseFormation || '4-4-2');
    }
    state.customTactic.baseFormation = STAGE11.allowed.includes(state.customTactic.baseFormation) ? state.customTactic.baseFormation : '4-4-2';
    state.customTactic.mappedFormation = STAGE11.allowed.includes(state.customTactic.mappedFormation) ? state.customTactic.mappedFormation : (mapTactic(state.customTactic).formation || '4-4-2');
    state.customTactic.tokens.forEach((t,i)=>{ t.id=Number(t.id||i+1); t.role=t.role||'Midfielder'; t.x=Number.isFinite(Number(t.x))?Number(t.x):50; t.y=Number.isFinite(Number(t.y))?Number(t.y):50; t.arrow=ARROWS[t.arrow]?t.arrow:'none'; });
    return state.customTactic;
  }
  function roleCounts(tokens){
    const c={Goalkeeper:0,Defender:0,Midfielder:0,Forward:0};
    (tokens||[]).forEach(t=>{ if(c[t.role]!==undefined) c[t.role]++; });
    return c;
  }
  function mapTactic(tactic){
    const tokens=(tactic && Array.isArray(tactic.tokens))?tactic.tokens:[];
    const c=roleCounts(tokens);
    const formation=formationFromCounts(c);
    const tags=[];
    const forward=tokens.filter(t=>t.arrow==='forward').length;
    const backward=tokens.filter(t=>t.arrow==='backward').length;
    const wide=tokens.filter(t=>t.arrow==='wide').length;
    const inside=tokens.filter(t=>t.arrow==='inside').length;
    const defendersHigh=tokens.filter(t=>t.role==='Defender' && Number(t.y)<58).length;
    const midsDeep=tokens.filter(t=>t.role==='Midfielder' && Number(t.y)>60).length;
    const forwardsDeep=tokens.filter(t=>t.role==='Forward' && Number(t.y)>38).length;
    const wideMidsDeep=tokens.filter(t=>t.role==='Midfielder' && (Number(t.x)<23 || Number(t.x)>77) && (Number(t.y)>56 || t.arrow==='backward')).length;
    if(forward>=5 || defendersHigh>=2) tags.push('Very attacking');
    else if(forward>=3 || defendersHigh>=1) tags.push('Attacking');
    if(backward>=4 || midsDeep>=3) tags.push('Cautious');
    if(formation==='3-5-2' && wideMidsDeep>=2) tags.push('Back-five feel');
    if(wide>=3) tags.push('Wide');
    if(inside>=3) tags.push('Narrow rotations');
    if(forwardsDeep>=2) tags.push('False-nine feel');
    if(defendersHigh>=2 && forward>=4) tags.push('Risky in transition');
    return {formation, counts:c, tags, forward, backward, wide, inside, defendersHigh, midsDeep, wideMidsDeep};
  }
  function selectedToken(){
    const t=ensureTacticState();
    if(!t) return null;
    return t.tokens.find(x=>Number(x.id)===Number(t.selectedId)) || t.tokens[0] || null;
  }
  function assistantName(){
    const tier=Number(state?.assistantTier||0);
    if(!tier) return 'First team coach';
    const defs=typeof BACKROOM_ASSISTANT_TIERS!=='undefined' ? BACKROOM_ASSISTANT_TIERS : null;
    return defs && defs[tier] ? defs[tier].name : 'Assistant manager';
  }
  function assistantAccuracy(){
    const tier=Number(state?.assistantTier||0);
    if(tier>=4) return 0.92;
    if(tier>=3) return 0.76;
    if(tier>=2) return 0.56;
    if(tier>=1) return 0.38;
    return 0.18;
  }
  function adviceFor(tactic){
    const m=mapTactic(tactic);
    const name=assistantName();
    const tier=Number(state?.assistantTier||0);
    const accurate=Math.random()<assistantAccuracy();
    if(!m.formation){
      if(m.counts.Defender>=5) return `<b>${esc(name)}:</b> XVII does not allow a true five-defender league shape. Use three centre-backs with deep wide midfielders if you want a back-five feel.`;
      return `<b>${esc(name)}:</b> This does not map to a legal league formation. Build from 4-5-1, 4-4-2, 4-3-3, 3-5-2 or 3-4-3.`;
    }
    if(!tier){
      const bad=[
        `Looks fine. I reckon fans always like more arrows, probably.`,
        `This is basically unbeatable if the lads run about enough.`,
        `Hard to say. It is either brave or defensive. Possibly both.`,
        `I would not worry too much about the shape. The players will sort it out.`
      ];
      const decent=`This maps as a ${m.formation}. I think the fans may notice the shape, but I would not trust my read too much.`;
      return `<b>${esc(name)}:</b> ${esc(accurate?decent:bad[Math.floor(Math.random()*bad.length)])}`;
    }
    let line=`This maps closest to a <b>${esc(m.formation)}</b>. `;
    if(m.tags.includes('Back-five feel')) line+=`The deep wide midfielders make it look like a back five without using a true five-defender engine shape. `;
    if(m.tags.includes('Very attacking')) line+=`The arrows and advanced defenders make it look extremely front foot. Fans may love it if it works, but it will be called reckless if you concede. `;
    else if(m.tags.includes('Attacking')) line+=`The shape looks positive and should play well with supporters if the result follows. `;
    if(m.tags.includes('Cautious')) line+=`There is also a cautious feel because several players are being asked to recover or sit deep. `;
    if(m.tags.includes('Wide')) line+=`The wide instructions should be read as stretching the pitch. `;
    if(m.tags.includes('Narrow rotations')) line+=`The inside arrows give it a narrower, combination-play look. `;
    if(m.tags.includes('Risky in transition')) line+=`I would warn that it looks open in transition and fans could turn if the match gets away from you. `;
    if(!m.tags.length) line+=`It reads as fairly balanced. The reaction will probably depend more on the result than the shape. `;
    if(!accurate && tier<4) line+=`That said, my read on the crowd may be off.`;
    return `<b>${esc(name)}:</b> ${line}`;
  }
  function fanTacticLine(tactic, outcome){
    const m=mapTactic(tactic);
    if(!m.formation) return '';
    if(m.tags.includes('Very attacking') && outcome==='win') return 'Fans loved the ambition of the custom tactic. The arrows made it feel like the team went to impose itself.';
    if(m.tags.includes('Very attacking') && outcome==='loss') return 'Fans questioned the custom tactic after the defeat. The attacking arrows looked brave before kick-off, but reckless once the goals went in.';
    if(m.tags.includes('Back-five feel') && outcome==='win') return 'Supporters accepted the back-five feel because the result made it look professional rather than negative.';
    if(m.tags.includes('Back-five feel') && outcome!=='win') return 'Some fans felt the back-five feel invited pressure. The wide midfielders looked too deep once the match became tense.';
    if(m.tags.includes('Cautious') && outcome==='draw') return 'The cautious custom shape divided opinion: some called it mature, others thought it lacked ambition.';
    if(m.tags.includes('Wide') && outcome==='win') return 'Fans enjoyed the width and felt the tactic gave the side a clear attacking identity.';
    if(m.tags.includes('Narrow rotations') && outcome==='win') return 'The narrow rotations looked clever after the win, with fans praising the sense of a designed plan.';
    return 'The custom tactic gave supporters something to discuss, even if the final judgement still followed the result.';
  }

  const originalGetFormationValue = typeof getFormationValue === 'function' ? getFormationValue : null;
  const originalSyncFormationControls = typeof syncFormationControls === 'function' ? syncFormationControls : null;
  const originalResetSelection = typeof resetSelection === 'function' ? resetSelection : null;
  const originalRenderTeamSelection = typeof renderTeamSelection === 'function' ? renderTeamSelection : null;
  const originalFanReactionForMatch = typeof fanReactionForMatch === 'function' ? fanReactionForMatch : null;
  const originalSetTrainingTier = typeof setTrainingTier === 'function' ? setTrainingTier : null;
  const originalSetBackroomTier = typeof setBackroomTier === 'function' ? setBackroomTier : null;

  function rawFormationChoice(){
    const mobile=safeEl('formationSelectMobile'), desktop=safeEl('formationSelect');
    if(isMobile() && mobile) return mobile.value;
    return desktop ? desktop.value : (mobile ? mobile.value : '4-4-2');
  }
  function setRawFormationChoice(value){
    [safeEl('formationSelect'), safeEl('formationSelectMobile')].forEach(sel=>{
      if(!sel) return;
      ensureCustomOption(sel);
      if([...sel.options].some(o=>o.value===value)) sel.value=value;
    });
  }
  function ensureCustomOption(sel){
    if(!sel || [...sel.options].some(o=>o.value===STAGE11.rawCustom)) return;
    const opt=document.createElement('option');
    opt.value=STAGE11.rawCustom;
    opt.textContent='Custom Tactic';
    sel.appendChild(opt);
  }
  getFormationValue = function(){
    const raw=rawFormationChoice();
    if(raw===STAGE11.rawCustom){
      const t=ensureTacticState();
      const mapped=t?.mappedFormation || mapTactic(t||{}).formation || '4-4-2';
      return STAGE11.allowed.includes(mapped) ? mapped : '4-4-2';
    }
    if(STAGE11.allowed.includes(raw)) return raw;
    return originalGetFormationValue ? originalGetFormationValue() : '4-4-2';
  };
  syncFormationControls = function(value){
    const t=ensureTacticState();
    if(value===STAGE11.rawCustom || (rawFormationChoice()===STAGE11.rawCustom && t && value===t.mappedFormation)){
      setRawFormationChoice(STAGE11.rawCustom);
      return;
    }
    if(originalSyncFormationControls) originalSyncFormationControls(value);
  };
  resetSelection = function(){
    const raw=rawFormationChoice();
    const formation=getFormationValue();
    if(raw===STAGE11.rawCustom) setRawFormationChoice(STAGE11.rawCustom); else syncFormationControls(formation);
    state.selection={formation, slots:formationSlots(formation).map(s=>({...s,playerId:null}))};
  };
  window.getFormationValue=getFormationValue;
  window.syncFormationControls=syncFormationControls;
  window.resetSelection=resetSelection;

  fanReactionForMatch = function(r){
    const fr=originalFanReactionForMatch ? originalFanReactionForMatch(r) : {score:0, reason:'Fans reacted to the result.', label:'Fans react', cls:'fan-meh', emoji:'😐'};
    try{
      if(rawFormationChoice()===STAGE11.rawCustom && state?.customTactic?.saved){
        const line=fanTacticLine(state.customTactic, typeof humanOutcome==='function'?humanOutcome(r):'');
        if(line){ fr.reason = `${fr.reason} ${line}`; fr.tacticLine=line; }
      }
    }catch(e){}
    return fr;
  };
  window.fanReactionForMatch=fanReactionForMatch;

  setTrainingTier = function(cost){
    if(!state.started) return setStatus('Start a career before choosing training investment.', 'bad');
    if(state.season) return setStatus('Training investment is locked once the season starts. Choose again next summer.', 'bad');
    if(state.completed) return setStatus('The window is closed. Training is locked for this season.', 'bad');
    const next=Number(cost || 0), current=Number(state.trainingTier || 0);
    if(!TRAINING_TIERS[next]) return;
    const priceOf=(tier)=> typeof stage9DTrainingPrice==='function' ? stage9DTrainingPrice(tier) : tier;
    const diff=Number(priceOf(next))-Number(priceOf(current));
    const ht=humanTeam();
    if(diff>0 && ht.budget<diff) return setStatus(`Not enough budget to upgrade training to ${esc(TRAINING_TIERS[next].name)}. You need ${money(diff)} more.`, 'bad');
    ht.budget=(typeof roundMoney==='function' ? roundMoney(ht.budget-diff) : ht.budget-diff);
    state.trainingTier=next;
    const info=trainingTierInfo();
    addLog(`Training investment set to ${esc(info.name)} (${money(priceOf(next))}). ${esc(info.dev)} ${esc(info.fatigue)}`);
    setStatus(`Training investment selected: ${esc(info.name)}. ${esc(info.dev)} ${esc(info.fatigue)}`, next===0?'warn':'good');
    refreshLight();
  };
  setBackroomTier = function(kind, cost){
    if(!state.started) return setStatus('Start a career before hiring backroom staff.', 'bad');
    if(state.season || state.completed) return setStatus('Backroom staff packages are locked once the season starts. Choose again next transfer window.', 'bad');
    const defs=staffTierDefs(kind), key=staffTierKey(kind); const next=Number(cost || 0), current=Number(state[key] || 0);
    if(!defs[next]) return;
    if(next===current) return setStatus(`${kind==='assistant'?'Assistant manager':'Scouting department'} is already set to ${esc(defs[current].name)}.`, current?'good':'warn');
    if(next<current) return setStatus(`${kind==='assistant'?'Assistant manager':'Scouting department'} spend is locked for this season. You can upgrade, but you cannot downgrade.`, 'bad');
    const priceOf=(tier)=> typeof stage9DBackroomPrice==='function' ? stage9DBackroomPrice(kind,tier) : tier;
    const diff=(typeof roundMoney==='function'?roundMoney(priceOf(next)-priceOf(current)):priceOf(next)-priceOf(current));
    if(diff>0 && humanTeam().budget<diff) return setStatus(`Not enough budget to upgrade ${kind==='assistant'?'assistant manager':'scouting department'} to ${esc(defs[next].name)}. You need ${money(diff)} more.`, 'bad');
    humanTeam().budget=(typeof roundMoney==='function'?roundMoney(humanTeam().budget-diff):humanTeam().budget-diff); state[key]=next;
    addLog(`${kind==='assistant'?'Assistant manager':'Scouting department'} upgraded to ${esc(defs[next].name)}. Extra spend: ${money(Math.max(0,diff))}. Package price: ${money(priceOf(next))}.`);
    setStatus(`${kind==='assistant'?'Assistant manager':'Scouting department'} upgraded to ${esc(defs[next].name)}. Spend is locked in for this season.`, 'good');
    refreshLight();
  };
  window.setTrainingTier=setTrainingTier;
  window.setBackroomTier=setBackroomTier;

  function renderPitch(tactic){
    const tokens=tactic.tokens||[];
    return `<div class="stage11-pitch" id="stage11Pitch" aria-label="Custom tactic pitch"><div class="stage11-box-top"></div><div class="stage11-box-bottom"></div>${tokens.map(t=>`<div class="stage11-token ${ROLE_CLASS[t.role]||'mid'} ${Number(t.id)===Number(tactic.selectedId)?'selected':''}" data-token-id="${t.id}" style="left:${Math.max(5,Math.min(95,Number(t.x)))}%;top:${Math.max(5,Math.min(95,Number(t.y)))}%;"><span>${esc(t.label || ROLE_LABEL[t.role] || '')}</span>${t.arrow && t.arrow!=='none'?`<span class="stage11-arrow-glyph">${ARROWS[t.arrow]?.glyph||''}</span>`:''}</div>`).join('')}</div>`;
  }
  function renderStage11TacticPanel(){
    injectStyles();
    const panel=safeEl('stage11TacticPanel');
    if(!panel) return;
    const tactic=ensureTacticState();
    if(!state?.started){
      panel.innerHTML=`<div class="stage11-disabled-note"><b>Tactic creator</b><br>Start a career to unlock the tactic creator.</div>`;
      return;
    }
    if(!state?.season){
      panel.innerHTML=`<div class="stage11-disabled-note"><b>Tactic creator</b><br>Finish the transfer window to unlock the match tactic board. You can still use normal formations during the window.</div>`;
      return;
    }
    const mapped=mapTactic(tactic); tactic.mappedFormation=mapped.formation || tactic.mappedFormation || '4-4-2'; tactic.tags=mapped.tags || [];
    const selected=selectedToken();
    const tagHtml=(mapped.tags.length?mapped.tags:['Balanced look']).map(x=>`<span class="stage11-tactic-tag">${esc(x)}</span>`).join('');
    const legal=mapped.formation ? `<span class="pool">Legal · ${esc(mapped.formation)}</span>` : `<span class="listed">Illegal shape</span>`;
    const counts=mapped.counts;
    const body=`<div class="stage11-tactic-body"><div class="stage11-pitch-wrap"><div class="stage11-toolbar"><div><label for="stage11BaseFormation">Base shape</label><select id="stage11BaseFormation">${STAGE11.allowed.map(f=>`<option value="${f}" ${tactic.baseFormation===f?'selected':''}>${f}</option>`).join('')}</select></div><button class="secondary" type="button" id="stage11LoadBaseBtn">Load shape</button><button class="good" type="button" id="stage11SaveUseBtn">Save and use tactic</button></div>${renderPitch(tactic)}<div class="stage11-note">Drag circles to create the look of your system. The match engine still uses the closest legal formation, but the assistant and fans react to the shape and arrows.</div></div><div class="stage11-side"><div class="stage11-summary"><b>Internal shape:</b> ${legal}<div class="stage11-counts"><span>GK ${counts.Goalkeeper||0}</span><span>DEF ${counts.Defender||0}</span><span>MID ${counts.Midfielder||0}</span><span>FWD ${counts.Forward||0}</span></div><div class="stage11-tag-row">${tagHtml}</div><div class="stage11-note">True five-defender formations remain unavailable because they unbalanced the engine. For a back-five feel, use three centre-backs with deep wide midfielders.</div><div class="stage11-quick-line"><button class="secondary tiny" type="button" id="stage11UseCustomBtn">Use Custom Tactic</button><button class="secondary tiny" type="button" id="stage11Use442Btn">Quick 4-4-2</button></div></div><div class="stage11-selected-card"><b>Selected role:</b> ${selected?esc(selected.label || ROLE_LABEL[selected.role]):'None'}<br><span class="muted">${selected?esc(selected.role):'Click a circle on the pitch.'}</span><div class="stage11-arrow-row">${Object.keys(ARROWS).map(k=>`<button type="button" class="secondary tiny ${selected&&selected.arrow===k?'active':''}" data-stage11-arrow="${k}">${esc(ARROWS[k].label)}</button>`).join('')}</div><div class="stage11-note">Arrows affect tactical theatre, assistant chat and fan reaction, not the match engine.</div></div><div class="stage11-advice" id="stage11AdviceBox">${adviceFor(tactic)}</div></div></div>`;
    panel.innerHTML=`<div class="xvii-collapse-head"><div class="xvii-collapse-title">Formation Creator</div><button class="secondary xvii-collapse-toggle" type="button" id="stage11PanelToggle" aria-label="Toggle formation creator">${isPanelCollapsed()?'+':'−'}</button></div><div class="stage11-tactic-body-wrap ${isPanelCollapsed()?'hidden':''}">${body}</div>`;
    wirePanelEvents();
  }
  window.renderStage11TacticPanel=renderStage11TacticPanel;

  function isPanelCollapsed(){ try{return localStorage.getItem(STAGE11.key)==='1';}catch(e){return false;} }
  function setPanelCollapsed(v){ try{localStorage.setItem(STAGE11.key, v?'1':'0');}catch(e){} }
  function wirePanelEvents(){
    const panel=safeEl('stage11TacticPanel'); if(!panel) return;
    const toggle=safeEl('stage11PanelToggle'); if(toggle){ toggle.onclick=function(){ const body=panel.querySelector('.stage11-tactic-body-wrap'); const next=!(body&&body.classList.contains('hidden')); setPanelCollapsed(next); renderStage11TacticPanel(); }; }
    const load=safeEl('stage11LoadBaseBtn'); if(load){ load.onclick=function(){ const f=safeEl('stage11BaseFormation')?.value || '4-4-2'; const t=ensureTacticState(); t.baseFormation=f; t.tokens=defaultTokensForFormation(f); t.selectedId=t.tokens.find(x=>x.role==='Midfielder')?.id || t.tokens[0]?.id || 1; t.mappedFormation=f; t.saved=false; renderStage11TacticPanel(); save(); }; }
    const saveBtn=safeEl('stage11SaveUseBtn'); if(saveBtn){ saveBtn.onclick=function(){ saveAndUseTactic(); }; }
    const useCustom=safeEl('stage11UseCustomBtn'); if(useCustom){ useCustom.onclick=function(){ saveAndUseTactic(); }; }
    const use442=safeEl('stage11Use442Btn'); if(use442){ use442.onclick=function(){ useQuickFormation('4-4-2'); }; } 
    panel.querySelectorAll('[data-stage11-arrow]').forEach(btn=>{ btn.onclick=function(){ const t=ensureTacticState(); const tok=selectedToken(); if(tok){ tok.arrow=this.getAttribute('data-stage11-arrow')||'none'; t.saved=false; renderStage11TacticPanel(); save(); } }; });
    panel.querySelectorAll('.stage11-token').forEach(node=>wireTokenDrag(node));
  }
  function useQuickFormation(f){
    setRawFormationChoice(f);
    if(typeof preserveFormationSelection==='function') preserveFormationSelection(); else if(originalResetSelection) originalResetSelection();
    try{ if(typeof renderLeague==='function') renderLeague(); }catch(e){}
    setStatus(`Quick formation selected: ${esc(f)}. Your saved custom tactic is still available.`, 'good');
    save();
  }
  function saveAndUseTactic(){
    const t=ensureTacticState(); const mapped=mapTactic(t);
    if(!mapped.formation){
      const msg=mapped.counts.Defender>=5?'True five-defender formations are not legal in XVII. Use three centre-backs and deep wide midfielders for a back-five feel.':'This tactic does not map to a legal formation.';
      setStatus(msg, 'bad'); renderStage11TacticPanel(); return;
    }
    t.mappedFormation=mapped.formation; t.tags=mapped.tags; t.saved=true; t.lastAdvice=adviceFor(t);
    setRawFormationChoice(STAGE11.rawCustom);
    if(typeof preserveFormationSelection==='function') preserveFormationSelection(); else resetSelection();
    setStatus(`Custom tactic saved. Internally this will play as ${esc(mapped.formation)}.`, 'good');
    try{ if(typeof renderLeague==='function') renderLeague(); }catch(e){ renderStage11TacticPanel(); }
    save();
  }
  function wireTokenDrag(node){
    const id=Number(node.getAttribute('data-token-id'));
    node.onclick=function(){ const t=ensureTacticState(); t.selectedId=id; renderStage11TacticPanel(); save(); };
    node.onpointerdown=function(ev){
      ev.preventDefault();
      const pitch=safeEl('stage11Pitch'); const t=ensureTacticState(); const tok=t.tokens.find(x=>Number(x.id)===id); if(!pitch||!tok) return;
      t.selectedId=id; node.setPointerCapture?.(ev.pointerId);
      const move=(e)=>{
        const r=pitch.getBoundingClientRect();
        tok.x=Math.max(5,Math.min(95,((e.clientX-r.left)/r.width)*100));
        tok.y=Math.max(5,Math.min(95,((e.clientY-r.top)/r.height)*100));
        node.style.left=tok.x+'%'; node.style.top=tok.y+'%';
      };
      const up=()=>{ document.removeEventListener('pointermove',move); document.removeEventListener('pointerup',up); t.saved=false; renderStage11TacticPanel(); save(); };
      document.addEventListener('pointermove',move); document.addEventListener('pointerup',up);
    };
  }

  function addCustomOptions(){ [safeEl('formationSelect'), safeEl('formationSelectMobile')].forEach(ensureCustomOption); }
  function insertPanel(){
    injectStyles(); addCustomOptions();
    if(safeEl('stage11TacticPanel')) return;
    const teamBox=document.querySelector('.team-selection-box'); if(!teamBox) return;
    const panel=document.createElement('div'); panel.id='stage11TacticPanel'; panel.className='stage11-tactic-panel';
    const grid=teamBox.querySelector('.team-select-grid');
    teamBox.insertBefore(panel, grid || null);
    renderStage11TacticPanel();
  }
  function repairSimDuplicates(){
    ['desktopSimRow','desktopSimJanuaryRow','mobileSimRow','mobileSimJanuaryRow'].forEach(id=>{
      const nodes=[...document.querySelectorAll(`[id="${id}"]`)];
      nodes.slice(1).forEach(n=>n.remove());
    });
    if(!isMobile()){
      const tableBox=safeEl('tableRows')?.closest('.league-table-box');
      if(tableBox){ tableBox.classList.remove('xvii-collapsed'); const h=tableBox.querySelector(':scope > .xvii-collapse-head'); if(h) h.style.display='none'; }
    }
  }
  function updateVersionAndHelp(){
    const version=document.querySelector('.xvii-version-note'); if(version) version.textContent=STAGE11.version;
    const help=document.querySelector('#xviiHelpGuide .xvii-help-text, #xviiHelpGuide .xvii-collapse-body, #xviiHelpGuide');
    if(help && !help.getAttribute('data-stage11-help')){
      help.setAttribute('data-stage11-help','1');
      const add=document.createElement('div');
      add.className='xvii-help-section';
      add.innerHTML=`<b>Formation Creator</b><br>The pitch board lets you create a custom-looking tactic with coloured role circles: green goalkeeper, blue defenders, yellow midfielders and red forwards. XVII still maps the shape to one of the legal engine formations: 4-5-1, 4-4-2, 4-3-3, 3-5-2 or 3-4-3. True five-at-the-back shapes are not allowed, but a 3-5-2 with deep wide midfielders can look and feel like a back five. Arrows affect assistant advice, board/fan narrative and post-match reaction. They do not directly change the match engine.`;
      help.appendChild(add);
    }
  }
  renderTeamSelection = function(){
    if(originalRenderTeamSelection) originalRenderTeamSelection();
    try{
      if(rawFormationChoice()===STAGE11.rawCustom && state?.customTactic?.saved){
        const txt=safeEl('yourFormationText'); if(txt) txt.textContent=`Custom tactic · ${state.customTactic.mappedFormation || state.selection?.formation || '—'}`;
      }
      renderStage11TacticPanel();
    }catch(e){}
  };
  window.renderTeamSelection=renderTeamSelection;

  function bootStage11(){
    insertPanel(); repairSimDuplicates(); updateVersionAndHelp();
    setInterval(()=>{ try{ repairSimDuplicates(); addCustomOptions(); }catch(e){} }, 1200);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bootStage11); else setTimeout(bootStage11,0);
  const prevRender = typeof render === 'function' ? render : null;
  if(prevRender){
    render = function(){ const out=prevRender.apply(this, arguments); try{ insertPanel(); repairSimDuplicates(); updateVersionAndHelp(); }catch(e){} return out; };
    window.render=render;
  }
})();
