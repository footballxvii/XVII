/* Stage 11G: Formation Creator Cursor and GK Instruction Fix.
   Keeps the three-column layout, stops global button hover transforms moving pitch tokens, separates GK/SK slots and removes goalkeeper instructions. */
(function(){
  if(window.__stage11dFormationCreatorRework) return;
  window.__stage11dFormationCreatorRework = true;

  const VERSION='Version 12J · Beta';
  const RAW_CUSTOM='Custom Tactic';
  const ALLOWED=['4-5-1','4-4-2','4-3-3','3-5-2','3-4-3'];
  const ROLE_LABEL={Goalkeeper:'GK',Defender:'DEF',Midfielder:'MID',Forward:'FWD'};
  const ROLE_CLASS={Goalkeeper:'gk',Defender:'def',Midfielder:'mid',Forward:'fwd'};
  const ROLE_BANK_LABEL={Goalkeeper:'Goalkeeper',Defender:'Defence',Midfielder:'Midfield',Forward:'Attack'};
  const ARROWS={none:{label:'None',glyph:''},forward:{label:'Forward',glyph:'↑'},backward:{label:'Recover',glyph:'↓'},inside:{label:'Inside',glyph:'↔'},wide:{label:'Wide',glyph:'↕'}};
  const KEY='xvii_stage11_tactic_panel_collapsed_v1';

  function el(id){ try{return document.getElementById(id);}catch(e){return null;} }
  function esc(s){ if(typeof escapeHtml==='function') return escapeHtml(s); return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function mobile(){ try{return typeof isMobileLayout==='function'?isMobileLayout():window.matchMedia('(max-width:700px)').matches;}catch(e){return window.innerWidth<=700;} }
  function save(){ try{ if(typeof saveGame==='function') saveGame(); }catch(e){} }
  function setStatusSafe(msg,type){ try{ if(typeof setStatus==='function') setStatus(msg,type||'good'); }catch(e){} }

  const XS=[12,31,50,69,88];
  const SLOT_ROWS=[
    {role:'Forward', y:20, labels:['LW','LF','ST','RF','RW']},
    {role:'Midfielder', y:38, labels:['AM-L','AM-LC','AM','AM-RC','AM-R']},
    {role:'Midfielder', y:50, labels:['M-L','M-LC','CM','M-RC','M-R']},
    {role:'Midfielder', y:62, labels:['DM-L','DM-LC','DM','DM-RC','DM-R']},
    {role:'Defender', y:68, labels:['WB-L','LCB-H','CB-H','RCB-H','WB-R']},
    {role:'Defender', y:78, labels:['LB','LCB','CB','RCB','RB']},
    {role:'Goalkeeper', y:92, labels:['GK','SK'], xs:[50,50], ys:[95,89]}
  ];
  const SLOTS=[];
  SLOT_ROWS.forEach((row,ri)=>{
    const xs=row.xs||XS;
    const ys=row.ys||row.labels.map(()=>row.y);
    row.labels.forEach((label,i)=>SLOTS.push({id:`${row.role[0]}${ri}_${i}`, role:row.role, x:xs[i], y:ys[i], label}));
  });
  const SLOTS_BY_ID=Object.fromEntries(SLOTS.map(s=>[s.id,s]));
  function roleSlots(role){ return SLOTS.filter(s=>s.role===role); }

  const DEFAULT_SLOT_MAP={
    '4-4-2':{
      Goalkeeper:['G6_0'], Defender:['D5_0','D5_1','D5_3','D5_4'], Midfielder:['M2_0','M2_1','M2_3','M2_4'], Forward:['F0_1','F0_3']
    },
    '4-3-3':{
      Goalkeeper:['G6_0'], Defender:['D5_0','D5_1','D5_3','D5_4'], Midfielder:['M2_1','M2_2','M2_3'], Forward:['F0_0','F0_2','F0_4']
    },
    '4-5-1':{
      Goalkeeper:['G6_0'], Defender:['D5_0','D5_1','D5_3','D5_4'], Midfielder:['M1_0','M2_1','M2_2','M2_3','M1_4'], Forward:['F0_2']
    },
    '3-5-2':{
      Goalkeeper:['G6_0'], Defender:['D5_1','D5_2','D5_3'], Midfielder:['M2_0','M2_1','M2_2','M2_3','M2_4'], Forward:['F0_1','F0_3']
    },
    '3-4-3':{
      Goalkeeper:['G6_0'], Defender:['D5_1','D5_2','D5_3'], Midfielder:['M2_0','M2_1','M2_3','M2_4'], Forward:['F0_0','F0_2','F0_4']
    }
  };

  function countsForFormation(f){
    if(f==='4-5-1') return {Goalkeeper:1,Defender:4,Midfielder:5,Forward:1};
    if(f==='4-3-3') return {Goalkeeper:1,Defender:4,Midfielder:3,Forward:3};
    if(f==='3-5-2') return {Goalkeeper:1,Defender:3,Midfielder:5,Forward:2};
    if(f==='3-4-3') return {Goalkeeper:1,Defender:3,Midfielder:4,Forward:3};
    return {Goalkeeper:1,Defender:4,Midfielder:4,Forward:2};
  }
  function formationFromCounts(c){
    const d=+c.Defender||0,m=+c.Midfielder||0,f=+c.Forward||0;
    if(d===4&&m===5&&f===1) return '4-5-1';
    if(d===4&&m===4&&f===2) return '4-4-2';
    if(d===4&&m===3&&f===3) return '4-3-3';
    if(d===3&&m===5&&f===2) return '3-5-2';
    if(d===3&&m===4&&f===3) return '3-4-3';
    return null;
  }
  function makeTokens(f){
    const map=DEFAULT_SLOT_MAP[f]||DEFAULT_SLOT_MAP['4-4-2'];
    let id=1; const tokens=[];
    ['Goalkeeper','Defender','Midfielder','Forward'].forEach(role=>{
      (map[role]||[]).forEach((slotId,i)=>{
        const slot=SLOTS_BY_ID[slotId] || roleSlots(role)[i] || roleSlots(role)[0];
        tokens.push({id:id++, role, slotId:slot.id, x:slot.x, y:slot.y, arrow:'none', label:`${ROLE_LABEL[role]}${role==='Goalkeeper'?'':i+1}`});
      });
    });
    return tokens;
  }
  function nearestSlot(role,x,y,used){
    let best=null,bd=Infinity;
    roleSlots(role).forEach(s=>{
      if(used && used.has(s.id)) return;
      const d=Math.pow((+x||50)-s.x,2)+Math.pow((+y||50)-s.y,2);
      if(d<bd){bd=d;best=s;}
    });
    return best || roleSlots(role).find(s=>!used || !used.has(s.id)) || roleSlots(role)[0];
  }
  function normaliseTactic(t){
    if(!t || typeof t!=='object') t={};
    const base=ALLOWED.includes(t.baseFormation)?t.baseFormation:'4-4-2';
    let tokens=Array.isArray(t.tokens)?t.tokens:[];
    const counts=roleCounts(tokens);
    const validCount=formationFromCounts(counts);
    if(!tokens.length || !validCount || counts.Goalkeeper!==1 || counts.Defender>4){
      tokens=makeTokens(base);
    } else {
      const used=new Set();
      tokens=tokens.map((tok,i)=>{
        const role=ROLE_LABEL[tok.role]?tok.role:'Midfielder';
        let slot=SLOTS_BY_ID[tok.slotId];
        if(!slot || slot.role!==role || used.has(slot.id)) slot=nearestSlot(role,tok.x,tok.y,used);
        used.add(slot.id);
        return {id:+tok.id||i+1, role, slotId:slot.id, x:slot.x, y:slot.y, arrow:(role==='Goalkeeper'?'none':(ARROWS[tok.arrow]?tok.arrow:'none')), label:tok.label||`${ROLE_LABEL[role]}${role==='Goalkeeper'?'':i+1}`};
      });
    }
    const mapped=formationFromCounts(roleCounts(tokens)) || base;
    return {baseFormation:base, mappedFormation:mapped, tokens, selectedId:+t.selectedId||tokens[1]?.id||tokens[0]?.id||1, saved:!!t.saved, tags:Array.isArray(t.tags)?t.tags:[], lastAdvice:t.lastAdvice||''};
  }
  function ensureTactic(){
    if(typeof state==='undefined' || !state) return null;
    state.customTactic=normaliseTactic(state.customTactic);
    return state.customTactic;
  }
  function roleCounts(tokens){
    const c={Goalkeeper:0,Defender:0,Midfielder:0,Forward:0};
    (tokens||[]).forEach(t=>{ if(c[t.role]!=null) c[t.role]++; });
    return c;
  }
  function selectedToken(){ const t=ensureTactic(); return t?.tokens?.find(x=>+x.id===+t.selectedId) || t?.tokens?.[0] || null; }
  function tokenAtSlot(tactic,slotId){ return (tactic?.tokens||[]).find(t=>t.slotId===slotId); }
  function moveTokenToSlot(tokenId,slotId){
    const tactic=ensureTactic(); if(!tactic) return;
    const tok=tactic.tokens.find(t=>+t.id===+tokenId); const slot=SLOTS_BY_ID[slotId];
    if(!tok || !slot) return;
    if(slot.role!==tok.role){ setStatusSafe(`${ROLE_BANK_LABEL[tok.role]} players can only be placed in ${ROLE_BANK_LABEL[tok.role].toLowerCase()} slots.`, 'warn'); return; }
    const other=tokenAtSlot(tactic,slotId);
    if(other && other.id!==tok.id){
      const oldSlot=SLOTS_BY_ID[tok.slotId];
      other.slotId=oldSlot.id; other.x=oldSlot.x; other.y=oldSlot.y;
    }
    tok.slotId=slot.id; tok.x=slot.x; tok.y=slot.y; tactic.selectedId=tok.id;
    autoUseTactic({resetSelection:false});
    renderStage11TacticPanel();
  }
  function setArrow(kind){ const tok=selectedToken(); if(!tok) return; if(tok.role==='Goalkeeper'){ tok.arrow='none'; autoUseTactic({resetSelection:false}); renderStage11TacticPanel(); return; } tok.arrow=ARROWS[kind]?kind:'none'; autoUseTactic({resetSelection:false}); renderStage11TacticPanel(); }
  function loadShape(f){
    const t=ensureTactic(); if(!t) return;
    f=ALLOWED.includes(f)?f:'4-4-2';
    t.baseFormation=f; t.tokens=makeTokens(f); t.mappedFormation=f; t.selectedId=t.tokens.find(x=>x.role==='Midfielder')?.id||t.tokens[0]?.id||1; t.tags=[];
    autoUseTactic({resetSelection:true});
    renderStage11TacticPanel();
  }
  function mapTactic(tactic){
    const tokens=tactic?.tokens||[]; const counts=roleCounts(tokens); const formation=formationFromCounts(counts);
    const outfield=tokens.filter(t=>t.role!=='Goalkeeper');
    const tags=[];
    const forward=outfield.filter(t=>t.arrow==='forward').length;
    const backward=outfield.filter(t=>t.arrow==='backward').length;
    const wide=outfield.filter(t=>t.arrow==='wide').length;
    const inside=outfield.filter(t=>t.arrow==='inside').length;
    const highDef=tokens.filter(t=>t.role==='Defender' && (SLOTS_BY_ID[t.slotId]?.y||t.y)<76).length;
    const deepMid=tokens.filter(t=>t.role==='Midfielder' && ((SLOTS_BY_ID[t.slotId]?.y||t.y)>=58 || t.arrow==='backward')).length;
    const wideDeepMid=tokens.filter(t=>t.role==='Midfielder' && ((SLOTS_BY_ID[t.slotId]?.x||t.x)<20 || (SLOTS_BY_ID[t.slotId]?.x||t.x)>80) && ((SLOTS_BY_ID[t.slotId]?.y||t.y)>=50 || t.arrow==='backward')).length;
    if(forward>=5 || highDef>=2) tags.push('Very attacking'); else if(forward>=3 || highDef>=1) tags.push('Attacking');
    if(backward>=4 || deepMid>=3) tags.push('Cautious');
    if(formation==='3-5-2' && wideDeepMid>=2) tags.push('Back-five feel');
    if(wide>=3) tags.push('Wide');
    if(inside>=3) tags.push('Narrow rotations');
    if(highDef>=2 && forward>=4) tags.push('Risky in transition');
    return {formation,counts,tags,forward,backward,wide,inside,highDef,deepMid,wideDeepMid};
  }
  function assistantName(){
    const tier=+(state?.assistantTier||0);
    if(!tier) return 'First-team coach';
    try{ if(typeof BACKROOM_ASSISTANT_TIERS!=='undefined' && BACKROOM_ASSISTANT_TIERS[tier]) return BACKROOM_ASSISTANT_TIERS[tier].name; }catch(e){}
    return 'Assistant manager';
  }
  function assistantTone(){
    const tier=+(state?.assistantTier||0);
    if(tier>=4) return 'elite'; if(tier>=3) return 'good'; if(tier>=1) return 'basic'; return 'coach';
  }
  function assistantAdvice(tactic){
    const m=mapTactic(tactic), name=assistantName(), tone=assistantTone();
    if(!m.formation){
      const msg=m.counts.Defender>=5?'This shape uses too many recognised defenders for XVII. If you want a back-five feel, keep three centre-backs and drop the wide midfielders deeper.':'The role balance is not legal for league play. Keep the shape within the recognised XVII systems.';
      return `<b>${esc(name)}:</b> ${esc(msg)}`;
    }
    if(tone==='coach'){
      const lines=[
        'Looks alright to me. Fans like effort, so as long as everyone runs around it should be fine.',
        'I would probably push a few more arrows forward. That usually looks positive, I think.',
        'Hard to read the board on this. They might like it. They might not. Depends if we win.',
        'The shape has some ideas. I would not worry too much about the details.'
      ];
      return `<b>${esc(name)}:</b> ${esc(lines[Math.floor(Math.random()*lines.length)])}<br><span class="muted">Without an assistant manager package, this advice is unreliable.</span>`;
    }
    const bits=[];
    if(m.tags.includes('Back-five feel')) bits.push('The wide midfielders are deep enough that supporters may read this as a back five without the club actually naming five defenders. It will look sensible after a clean sheet and negative after a poor result.');
    if(m.tags.includes('Very attacking')) bits.push('This looks very front-footed. Fans will enjoy the intent, but the board may worry about control if chances are conceded.');
    else if(m.tags.includes('Attacking')) bits.push('There is a positive feel to the shape. It should play well with the crowd if the result supports it.');
    if(m.tags.includes('Cautious')) bits.push('There is a cautious recovery pattern. Useful away from home, but fans may call it passive if you fail to create.');
    if(m.tags.includes('Wide')) bits.push('The width should make the side look expansive and direct.');
    if(m.tags.includes('Narrow rotations')) bits.push('The inside arrows make this look more intricate and possession-led.');
    if(m.tags.includes('Risky in transition')) bits.push('The transition risk looks high. If the opponent breaks quickly, supporters may blame the setup.');
    if(!bits.length) bits.push('This reads as balanced. Board and fan reaction will likely follow the result rather than the drawing board.');
    if(tone==='basic') bits.push('I may not have the crowd reaction exactly right, but that is my read.');
    if(tone==='elite') bits.push('My read: the board will focus on defensive control, while fans will judge whether the shape looks brave or wasteful against the predicted opponent.');
    return `<b>${esc(name)}:</b> ${bits.map(esc).join(' ')}`;
  }

  function ensureCustomOption(sel){
    if(!sel) return;
    if(![...sel.options].some(o=>o.value===RAW_CUSTOM)){ const opt=document.createElement('option'); opt.value=RAW_CUSTOM; opt.textContent='Custom Tactic'; sel.appendChild(opt); }
  }
  function setRawChoice(v){ [el('formationSelect'),el('formationSelectMobile')].forEach(sel=>{ if(!sel) return; ensureCustomOption(sel); if([...sel.options].some(o=>o.value===v)) sel.value=v; }); }
  function autoUseTactic(opts={}){
    const t=ensureTactic(); if(!t) return false;
    const m=mapTactic(t);
    if(!m.formation) return false;
    t.mappedFormation=m.formation;
    t.tags=m.tags || [];
    t.saved=true;
    t.lastAdvice=assistantAdvice(t);
    setRawChoice(RAW_CUSTOM);
    if(opts.resetSelection && state?.season){
      try{ if(typeof preserveFormationSelection==='function') preserveFormationSelection(); else if(typeof resetSelection==='function') resetSelection(); }catch(e){}
      try{ if(typeof renderTeamSelection==='function') renderTeamSelection(); }catch(e){}
    }
    save();
    return true;
  }
  function setTactic(){
    const t=ensureTactic(); const m=mapTactic(t);
    if(!m.formation){ setStatusSafe('This tactic is not legal. XVII allows 4-5-1, 4-4-2, 4-3-3, 3-5-2 and 3-4-3 only. True five-defender systems remain unavailable.', 'bad'); renderStage11TacticPanel(); return; }
    t.mappedFormation=m.formation; t.tags=m.tags; t.saved=true; t.lastAdvice=assistantAdvice(t);
    setRawChoice(RAW_CUSTOM);
    try{ if(typeof preserveFormationSelection==='function') preserveFormationSelection(); else if(typeof resetSelection==='function') resetSelection(); }catch(e){}
    setStatusSafe('Custom tactic set. The dressing room now recognises this as your match shape.', 'good');
    try{ if(typeof renderLeague==='function') renderLeague(); else renderStage11TacticPanel(); }catch(e){ renderStage11TacticPanel(); }
    save();
  }

  function renderSlots(tactic){
    return SLOTS.map(s=>{
      const tok=tokenAtSlot(tactic,s.id); const allowed=selectedToken()?.role===s.role;
      return `<button type="button" class="stage11d-slot ${tok?'occupied':''} ${allowed?'allowed':''}" data-slot-id="${esc(s.id)}" style="left:${s.x}%;top:${s.y}%;" title="${esc(s.label)}"><span>${esc(s.label)}</span></button>`;
    }).join('');
  }
  function renderTokens(tactic){
    return tactic.tokens.map(tok=>{
      const s=SLOTS_BY_ID[tok.slotId]||{x:tok.x,y:tok.y};
      return `<button type="button" class="stage11d-token ${ROLE_CLASS[tok.role]||'mid'} ${+tok.id===+tactic.selectedId?'selected':''}" data-token-id="${tok.id}" style="left:${s.x}%;top:${s.y}%;"><span>${esc(tok.label||ROLE_LABEL[tok.role])}</span>${tok.role!=='Goalkeeper'&&tok.arrow&&tok.arrow!=='none'?`<i>${ARROWS[tok.arrow]?.glyph||''}</i>`:''}</button>`;
    }).join('');
  }
  function renderStage11TacticPanel(){
    injectStyles();
    const panel=el('stage11TacticPanel'); if(!panel) return;
    const collapsed=isCollapsed();
    if(!state?.started){ panel.innerHTML=`<div class="stage11-disabled-note"><b>Tactic creator</b><br>Start a career to unlock the tactic board.</div>`; return; }
    if(!state?.season){ panel.innerHTML=`<div class="stage11-disabled-note"><b>Tactic creator</b><br>You can design tactics once the transfer window closes and match preparation begins.</div>`; return; }
    const tactic=ensureTactic(); const m=mapTactic(tactic); const selected=selectedToken();
    tactic.mappedFormation=m.formation||tactic.mappedFormation||'4-4-2'; tactic.tags=m.tags||[];
    const tags=(m.tags.length?m.tags:['Balanced look']).map(x=>`<span class="stage11-tactic-tag">${esc(x)}</span>`).join('');
    const selectedSlot=selected?SLOTS_BY_ID[selected.slotId]:null;
    panel.innerHTML=`<div class="xvii-collapse-head"><div class="xvii-collapse-title">Formation Creator</div><button class="secondary xvii-collapse-toggle" type="button" id="stage11PanelToggle">${collapsed?'+':'−'}</button></div><div class="stage11d-body ${collapsed?'hidden':''}">
      <div class="stage11d-topbar">
        <div><label for="stage11BaseFormation">Tactic shape</label><select id="stage11BaseFormation">${ALLOWED.map(f=>`<option value="${f}" ${tactic.baseFormation===f?'selected':''}>${f}</option>`).join('')}</select></div>
      </div>
      <div class="stage11d-grid">
        <div class="stage11-pitch-wrap"><div class="stage11-pitch stage11d-pitch" id="stage11Pitch"><div class="stage11-box-top"></div><div class="stage11-box-bottom"></div>${renderSlots(tactic)}${renderTokens(tactic)}</div><div class="stage11-note">Drag a circle onto another tactical slot, or tap a circle then tap a slot. Changes are applied automatically. Arrows shape the story, board view and fan reaction.</div></div>
        <div class="stage11d-side">
          <div class="stage11-advice">${assistantAdvice(tactic)}</div>
          <div class="stage11-selected-card"><b>Position Instructions</b><br><span class="muted">${selected?esc((selected.label||ROLE_LABEL[selected.role]) + ' · ' + ROLE_BANK_LABEL[selected.role] + (selectedSlot?` · ${selectedSlot.label}`:'')):'Choose a circle on the pitch.'}</span>${selected&&selected.role==='Goalkeeper'?`<div class="stage11-gk-note">Goalkeepers have no extra position instructions. Choose the deeper keeper slot or the slightly higher sweeper keeper slot.</div>`:`<div class="stage11-arrow-row">${Object.keys(ARROWS).map(k=>`<button type="button" class="secondary tiny ${selected&&selected.arrow===k?'active':''}" data-stage11d-arrow="${k}">${esc(ARROWS[k].label)}</button>`).join('')}</div>`}</div>
        </div>
      </div>
    </div>`;
    wireEvents();
  }
  window.renderStage11TacticPanel=renderStage11TacticPanel;

  function isCollapsed(){ try{return localStorage.getItem(KEY)==='1';}catch(e){return false;} }
  function setCollapsed(v){ try{localStorage.setItem(KEY,v?'1':'0');}catch(e){} }
  function slotFromPointer(role,ev){
    const pitch=el('stage11Pitch'); if(!pitch) return roleSlots(role)[0];
    const r=pitch.getBoundingClientRect();
    const x=Math.max(3,Math.min(97,((ev.clientX-r.left)/Math.max(1,r.width))*100));
    const y=Math.max(3,Math.min(97,((ev.clientY-r.top)/Math.max(1,r.height))*100));
    return nearestSlot(role,x,y,null);
  }
  function wireTokenDrag(btn){
    if(!btn) return;
    btn.onpointerdown=function(ev){
      ev.preventDefault(); ev.stopPropagation();
      const id=+btn.getAttribute('data-token-id');
      const tactic=ensureTactic();
      const tok=tactic?.tokens?.find(t=>+t.id===id);
      const pitch=el('stage11Pitch');
      if(!tok || !pitch) return;
      tactic.selectedId=id;
      let moved=false, lastEv=ev, startX=ev.clientX, startY=ev.clientY;
      btn.classList.add('dragging');
      try{ btn.setPointerCapture?.(ev.pointerId); }catch(e){}
      const move=(e)=>{
        lastEv=e;
        if(Math.abs(e.clientX-startX)+Math.abs(e.clientY-startY)>4) moved=true;
        // Do not move the visible circle during hover. It prevents the ugly flicker/jumping over slots;
        // the drop still snaps cleanly to the nearest legal role slot on pointer-up.
      };
      const up=(e)=>{
        document.removeEventListener('pointermove',move,true);
        document.removeEventListener('pointerup',up,true);
        document.removeEventListener('pointercancel',up,true);
        btn.classList.remove('dragging');
        const finalEv=e || lastEv;
        if(moved){
          const slot=slotFromPointer(tok.role,finalEv);
          if(slot) moveTokenToSlot(tok.id,slot.id);
        } else {
          tactic.selectedId=id;
          renderStage11TacticPanel();
          save();
        }
      };
      document.addEventListener('pointermove',move,true);
      document.addEventListener('pointerup',up,true);
      document.addEventListener('pointercancel',up,true);
    };
  }
  function wireEvents(){
    const panel=el('stage11TacticPanel'); if(!panel) return;
    const tog=el('stage11PanelToggle'); if(tog) tog.onclick=()=>{setCollapsed(!isCollapsed());renderStage11TacticPanel();};
    const sel=el('stage11BaseFormation'); if(sel) sel.onchange=()=>loadShape(sel.value);
    panel.querySelectorAll('.stage11d-token').forEach(btn=>wireTokenDrag(btn));
    panel.querySelectorAll('.stage11d-slot').forEach(btn=>{ btn.onclick=()=>{const tok=selectedToken(); if(tok) moveTokenToSlot(tok.id, btn.getAttribute('data-slot-id'));}; });
    panel.querySelectorAll('[data-stage11d-arrow]').forEach(btn=>{ btn.onclick=()=>setArrow(btn.getAttribute('data-stage11d-arrow')); });
  }

  function injectStyles(){
    if(document.getElementById('stage11d-rework-style')) return;
    const style=document.createElement('style'); style.id='stage11d-rework-style';
    style.textContent=`
      .stage11-tactic-panel{max-width:100%;overflow:hidden;}
      .stage11d-body{min-width:0;max-width:100%;}
      .stage11d-topbar{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;align-items:end;margin-bottom:7px;max-width:100%;}
      .stage11d-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;align-items:start;max-width:100%;min-width:0;overflow:hidden;}
      .stage11-pitch-wrap{min-width:0;max-width:100%;overflow:hidden;box-sizing:border-box;}
      .stage11d-side{display:grid;grid-template-columns:minmax(0,1fr);gap:7px;min-width:0;max-width:100%;}
      .stage11d-side .stage11-advice,.stage11d-side .stage11-summary,.stage11d-side .stage11-selected-card{max-width:100%;overflow-wrap:anywhere;}
      .stage11d-pitch{height:430px;min-height:360px;max-height:58vh;touch-action:none;width:100%;box-sizing:border-box;}
      .stage11d-slot{position:absolute;width:30px;height:22px;transform:translate(-50%,-50%);border:1px dashed rgba(255,255,255,.35);border-radius:8px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.76);font-size:7px;font-weight:950;padding:0;z-index:2;}
      .stage11d-slot.occupied{background:rgba(0,0,0,.11);border-color:rgba(255,255,255,.18);color:rgba(255,255,255,.34);}
      .stage11d-slot.allowed:not(.occupied){border-color:rgba(255,232,138,.76);color:#fff4c7;background:rgba(246,200,95,.12);}
      .stage11d-token{position:absolute;width:43px;height:43px;border-radius:999px;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%)!important;border:2px solid rgba(255,255,255,.84);box-shadow:0 5px 16px rgba(0,0,0,.35);font-size:9px;font-weight:950;color:#071023;cursor:grab!important;user-select:none;z-index:5;padding:0;touch-action:none;}
      .stage11d-token:hover,.stage11d-token:focus,.stage11d-token:active{transform:translate(-50%,-50%)!important;cursor:grab!important;}
      .stage11d-slot:hover,.stage11d-slot:focus,.stage11d-slot:active{transform:translate(-50%,-50%)!important;}
      .stage11-gk-note{margin-top:5px;font-size:8.5px;line-height:1.25;color:var(--muted);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:7px;background:rgba(255,255,255,.035);}
      .stage11d-token.dragging,.stage11d-token.dragging:hover,.stage11d-token.dragging:focus{cursor:grabbing!important;z-index:20;opacity:.78;transform:translate(-50%,-50%)!important;box-shadow:0 0 0 5px rgba(246,200,95,.20),0 8px 22px rgba(0,0,0,.35);}
      .stage11d-token.gk{background:#33d69f;}.stage11d-token.def{background:#78a6ff;}.stage11d-token.mid{background:#f6c85f;}.stage11d-token.fwd{background:#ff6b6b;color:#220606;}
      .stage11d-token.selected{outline:3px solid rgba(255,255,255,.74);box-shadow:0 0 0 4px rgba(0,0,0,.18),0 8px 22px rgba(0,0,0,.40);}
      .stage11d-token i{position:absolute;right:-7px;top:-10px;min-width:20px;height:20px;border-radius:999px;background:#071023;color:#fff;border:1px solid rgba(255,255,255,.55);font-size:14px;line-height:18px;text-align:center;font-style:normal;}
      .stage11-arrow-row{display:flex;flex-wrap:wrap;gap:4px;align-items:center;justify-content:flex-start;}
      .stage11-arrow-row button{flex:0 0 68px;width:68px;min-width:68px;max-width:68px;padding:4px 5px;font-size:8px;line-height:1.1;white-space:nowrap;text-align:center;}
      .league-fixture-box .match-controls{grid-template-columns:1fr!important;}
      .league-fixture-box .match-controls>div{display:none!important;}
      .league-fixture-box .match-controls #playRoundBtn{width:100%;min-height:36px;}
      @media (min-width:901px){
        .league-grid{grid-template-columns:minmax(300px,.9fr) minmax(500px,1.25fr) minmax(360px,1fr)!important;grid-template-areas:"fixture team right"!important;align-items:start;}
        .league-fixture-box{grid-area:fixture;}
        .team-selection-box{grid-area:team;display:flex!important;flex-direction:column;gap:7px;min-width:0;max-width:100%;overflow:hidden;}
        .league-right-stack{grid-area:right!important;display:grid!important;gap:7px;align-content:start;min-width:0;}
        .league-right-stack .league-table-box,.league-right-stack .match-squad-news-box{grid-area:auto!important;}
        .league-table-box{grid-area:auto;}
        .match-squad-news-box{grid-area:auto;}
        .team-selection-box .assistant-action-row{order:1;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));}
        .team-selection-box #stage11TacticPanel{order:2;}
        .team-selection-box .pick-section{order:3;margin-top:0!important;}
        .team-selection-box .team-select-grid{order:4;}
        .team-selection-box #scoutNote{order:5;}
        .team-selection-box #playRoundBtnMobile{order:6;}
      }
      @media (min-width:701px) and (max-width:900px){
        .league-grid{grid-template-columns:minmax(0,1fr)!important;grid-template-areas:"fixture" "team" "table" "news"!important;}
        .league-right-stack{display:contents!important;}
      }
      @media (max-width:700px){
        .stage11d-topbar{grid-template-columns:1fr;}
        .stage11d-grid{grid-template-columns:1fr;}
        .stage11d-pitch{height:390px;min-height:340px;max-height:none;}
        .stage11d-token{width:38px;height:38px;font-size:8px;}
        .stage11d-slot{width:28px;height:20px;font-size:6.5px;}
        .stage11-arrow-row{display:flex;flex-wrap:wrap;gap:4px;}
        .stage11-arrow-row button{flex:0 0 68px;width:68px;min-width:68px;max-width:68px;}
      }
    `;
    document.head.appendChild(style);
  }

  function applyAssistantFormationRework(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    const tier=+(state?.assistantTier||0);
    if(tier<1) return setStatusSafe('Hire at least the £1m assistant package to use Assistant Formation Pick.', 'bad');
    if(!state?.completed || !state?.season) return setStatusSafe('Assistant Formation Pick can be used during match weeks after the window closes.', 'warn');
    let plan=null; try{ if(typeof bestAssistantPlan==='function') plan=bestAssistantPlan(); }catch(e){}
    const formation=ALLOWED.includes(plan?.formation)?plan.formation:'4-4-2';
    loadShape(formation);
    const t=ensureTactic(); t.lastAdvice=assistantAdvice(t);
    const caveat=tier===1?'Basic assistant advice can be wrong.':tier>=4?'Full assistant read is usually close to the crowd and board mood.':'Assistant advice is useful, but not perfect.';
    setStatusSafe(`Assistant Formation Pick has loaded a recommended shape into the tactic board. It is now active as your custom tactic. ${caveat}`, tier>=3?'good':'warn');
  }
  function wireAssistantButtons(){
    ['assistantFormationBtn','assistantFormationBtnMobile'].forEach(id=>{
      const b=el(id); if(b && !b.getAttribute('data-stage11d-assistant')){ b.setAttribute('data-stage11d-assistant','1'); b.addEventListener('click', applyAssistantFormationRework, true); }
    });
  }
  function layoutRework(){
    injectStyles(); wireAssistantButtons(); [el('formationSelect'),el('formationSelectMobile')].forEach(ensureCustomOption);
    document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; });
    const oldVersion=el('xviiVersionNote');
    const mainVersion=document.querySelector('.xvii-version-note');
    if(oldVersion && oldVersion!==mainVersion) oldVersion.remove();
    document.title='XVII | Build the seventeen. Pick the eleven.';
    const teamBox=document.querySelector('.team-selection-box'); const fixtureBox=document.querySelector('.league-fixture-box'); const assistantRow=document.querySelector('.assistant-action-row');
    if(state?.season && !mobile() && teamBox && assistantRow && assistantRow.parentNode!==teamBox){ const pick=teamBox.querySelector('.pick-section')||el('stage11TacticPanel'); teamBox.insertBefore(assistantRow,pick||teamBox.firstChild); }
    if(state?.season && !mobile() && fixtureBox){
      const mentality=el('mentalityPanel'); const last=el('lastHumanResult');
      if(mentality && mentality.parentNode!==fixtureBox){ const controls=fixtureBox.querySelector('.match-controls'); (controls||fixtureBox.firstChild).insertAdjacentElement('afterend',mentality); }
      let scout=el('stage11dFixtureScout');
      if(!scout){ scout=document.createElement('div'); scout.id='stage11dFixtureScout'; scout.className='commentary-box'; scout.innerHTML='<b>Scouting department</b><br><span class="muted">Opponent scouting and assistant match-read will update as the fixture approaches.</span>'; }
      if(mentality && scout.parentNode!==fixtureBox) mentality.insertAdjacentElement('afterend',scout);
      if(last && scout && last.parentNode!==fixtureBox) scout.insertAdjacentElement('afterend',last);
    }
  }

  function activeRawChoice(){
    const mobileSel=el('formationSelectMobile'), desktopSel=el('formationSelect');
    if(mobile() && mobileSel) return mobileSel.value;
    return desktopSel ? desktopSel.value : (mobileSel ? mobileSel.value : '4-4-2');
  }
  function hideCustomMappingText(){
    const txt=el('yourFormationText');
    if(txt && activeRawChoice()===RAW_CUSTOM) txt.textContent='Custom tactic';
  }
  // Patch render so the new layout wins after older stage patches do their own rearranging.
  const prevRender=typeof render==='function'?render:null;
  if(prevRender && !window.__stage11dRenderPatched){
    window.__stage11dRenderPatched=true;
    render=function(){ const out=prevRender.apply(this,arguments); try{layoutRework(); renderStage11TacticPanel(); hideCustomMappingText();}catch(e){} return out; };
    window.render=render;
  }
  const prevRenderTeam=typeof renderTeamSelection==='function'?renderTeamSelection:null;
  if(prevRenderTeam && !window.__stage11dTeamPatched){
    window.__stage11dTeamPatched=true;
    renderTeamSelection=function(){ const out=prevRenderTeam.apply(this,arguments); try{layoutRework(); renderStage11TacticPanel(); hideCustomMappingText();}catch(e){} return out; };
    window.renderTeamSelection=renderTeamSelection;
  }
  function boot(){ layoutRework(); renderStage11TacticPanel(); hideCustomMappingText(); setInterval(()=>{try{layoutRework(); hideCustomMappingText();}catch(e){}},1500); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else setTimeout(boot,0);
})();
