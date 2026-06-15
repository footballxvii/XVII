/* Stage 13H: full-width landing picker and alphabetical club sort. */
(function(){
  if(window.__stage13hLandingWidthAlphaSort) return;
  window.__stage13hLandingWidthAlphaSort=true;

  const VERSION='Version 13U · Beta';
  function byId(id){ return document.getElementById(id); }
  function esc(s){
    if(typeof escapeHtml==='function') return escapeHtml(s);
    return String(s==null?'':s).replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  }
  function moneyLocal(v){ try{ if(typeof money==='function') return money(v); }catch(e){} return '£'+Number(v||0).toLocaleString(undefined,{maximumFractionDigits:1})+'m'; }
  function ordinalLocal(v){ try{ if(typeof ordinal==='function') return ordinal(v); }catch(e){} return String(v); }
  function previewBudget(club){ try{ if(typeof stage9PreviewBudgetForClub==='function') return stage9PreviewBudgetForClub(club); }catch(e){} return 0; }
  function personality(club){
    try{ if(typeof stage13eBoardPersonality==='function') return stage13eBoardPersonality(club); }catch(e){}
    return {label:'Balanced board',summary:'A conventional board with no strong bias.'};
  }
  function personalityHtml(club){
    const p=personality(club);
    return `<div class="stage13h-board-personality stage13g-board-personality stage13f-board-personality compact"><b>${esc(p.label)}</b><span>${esc(p.summary)}</span></div>`;
  }
  function refreshVersion(){
    try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{v.textContent=VERSION;}); }catch(e){}
  }
  function injectStyles(){
    if(byId('stage13h-style')) return;
    const st=document.createElement('style');
    st.id='stage13h-style';
    st.textContent=`
      body.not-started .app > .panel:first-child{max-width:1220px!important;width:100%!important;}
      body.not-started .setup{max-width:none!important;width:100%!important;}
      body.not-started .setup .club-picker{width:100%!important;}
      body.not-started .stage9-division-picker{width:100%!important;}
      body.not-started .club-choice-list{width:100%!important;}
      body.not-started .club-choice-card{grid-template-columns:minmax(0,1.2fr) minmax(250px,.82fr) minmax(112px,auto)!important;}
      body.not-started .club-choice-card .stage13f-board-personality,
      body.not-started .club-choice-card .stage13g-board-personality,
      body.not-started .club-choice-card .stage13h-board-personality{max-width:100%!important;}
      @media(min-width:701px){
        body.not-started .setup{gap:10px!important;}
        body.not-started .setup .club-picker{padding:12px 14px!important;}
        body.not-started .club-choice-list{max-height:230px!important;}
        body.not-started .club-choice-card{min-height:42px!important;padding:7px 10px!important;margin-bottom:4px!important;}
        body.not-started .club-choice-name{font-size:12px!important;}
        body.not-started .club-choice-meta{font-size:8px!important;}
        body.not-started .club-choice-budget{font-size:12px!important;}
        body.not-started .stage9-division-picker button{min-height:38px!important;}
      }
      @media(max-width:700px){
        body.not-started .club-choice-card{grid-template-columns:minmax(0,1fr) minmax(104px,34%) minmax(74px,auto)!important;}
      }
      @media(max-width:420px){
        body.not-started .club-choice-card{grid-template-columns:minmax(0,1fr) minmax(96px,32%) minmax(70px,auto)!important;}
      }
    `;
    document.head.appendChild(st);
  }
  function currentDivision(){
    return window.XVII_STAGE9_LANDING_DIVISION || 'top';
  }
  function setDivision(div){
    window.XVII_STAGE9_LANDING_DIVISION = div==='second' ? 'second' : 'top';
  }
  function allClubsForLanding(){
    const all=Array.isArray(window.XVII_STAGE9_ALL_PLAYABLE_CLUBS) ? window.XVII_STAGE9_ALL_PLAYABLE_CLUBS : [];
    return all.filter(c=>c && c.division===currentDivision()).sort((a,b)=>String(a.club||'').localeCompare(String(b.club||'')));
  }
  function expectationMap(list){
    try{ if(typeof stage9AllExpectationMapFor==='function') return stage9AllExpectationMapFor(list); }catch(e){}
    const map={}; (list||[]).forEach((c,i)=>{ map[c.club]=i+1; }); return map;
  }
  function ensurePicker(){
    const list=byId('clubChoiceList');
    if(!list) return;
    let picker=byId('stage9DivisionPicker');
    if(!picker){
      picker=document.createElement('div');
      picker.id='stage9DivisionPicker';
      picker.className='stage9-division-picker';
      picker.innerHTML='<button type="button" data-div="top">Top Division</button><button type="button" data-div="second">Second Division</button>';
      list.parentNode.insertBefore(picker,list);
    }
    picker.querySelectorAll('button').forEach(btn=>{
      if(btn.getAttribute('data-stage13h-bound')!=='1'){
        btn.setAttribute('data-stage13h-bound','1');
        btn.addEventListener('click',()=>{
          if(window.state && state.started) return;
          setDivision(btn.getAttribute('data-div'));
          const select=byId('clubSelect');
          const clubs=allClubsForLanding();
          if(select && clubs[0]) select.value=clubs[0].club;
          renderClubChoiceList();
        });
      }
      const active=btn.getAttribute('data-div')===currentDivision();
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
  }
  function renderSelectedSpot(selected,clubs,topMap,secondMap){
    const spot=byId('selectedClubSpot');
    const c=clubs.find(x=>x.club===selected);
    if(!spot || !c) return;
    const map=c.division==='second'?secondMap:topMap;
    const p=personality(c.club);
    spot.classList.add('active');
    spot.innerHTML=`<div><b>${esc(c.club)}</b><span>${esc(c.division==='second'?'Second Division':'Top Division')} career · ${esc(c.role||'')}</span></div><div class="selected-club-pill"><strong>${moneyLocal(previewBudget(c.club))}</strong><small>Starting budget</small></div><div class="selected-club-pill"><strong>${ordinalLocal(map[c.club] || 20)}</strong><small>Predicted finish</small></div><div class="selected-club-pill stage13f-selected-board"><strong>${esc(p.label)}</strong><small>${esc(p.summary)}</small></div>`;
  }
  function renderClubChoiceListAlpha(){
    const list=byId('clubChoiceList'), select=byId('clubSelect');
    if(!list || !select) return;
    ensurePicker();
    const clubs=allClubsForLanding();
    const current=select.value || clubs[0]?.club || '';
    select.innerHTML=clubs.map(c=>`<option value="${esc(c.club)}">${esc(c.club)} · ${esc(c.division==='second'?'Second Division':'Top Division')}</option>`).join('');
    if(clubs.some(c=>c.club===current)) select.value=current; else if(clubs[0]) select.value=clubs[0].club;
    ensurePicker();
    const selected=select.value;
    const topMap=expectationMap(window.XVII_STAGE9_TOP_DIVISION_CLUBS || []);
    const secondMap=expectationMap(window.XVII_STAGE9_SECOND_DIVISION_CLUBS || []);
    list.innerHTML=clubs.map(c=>{
      const active=c.club===selected;
      const div=c.division==='second'?'Second Division':'Top Division';
      const map=c.division==='second'?secondMap:topMap;
      const source=c.sourceLevel || (c.division==='top'?'Top Division':'');
      return `<button type="button" class="club-choice-card ${active?'active':''}" role="option" aria-selected="${active?'true':'false'}" data-club="${esc(c.club)}"><div><div class="club-choice-name">${esc(c.club)}</div><div class="club-choice-meta">${esc(div)}${source?' · '+esc(source):''} · Predicted finish: ${ordinalLocal(map[c.club] || 20)}</div></div>${personalityHtml(c.club)}<div class="club-choice-budget">${moneyLocal(previewBudget(c.club))}<span>Starting budget</span></div></button>`;
    }).join('');
    renderSelectedSpot(selected,clubs,topMap,secondMap);
    list.querySelectorAll('.club-choice-card').forEach(btn=>{
      btn.addEventListener('click',function(){
        if(window.state && state.started) return;
        select.value=this.getAttribute('data-club') || select.value;
        renderClubChoiceList();
      });
    });
  }
  function patchSelectChange(){
    const select=byId('clubSelect');
    if(!select || select.getAttribute('data-stage13h-change-bound')==='1') return;
    select.setAttribute('data-stage13h-change-bound','1');
    select.addEventListener('change',()=>{ if(window.state && state.started){ select.value=state.humanClub || select.value; return; } renderClubChoiceList(); });
  }
  function boot(){
    injectStyles();
    refreshVersion();
    patchSelectChange();
    if(typeof window.XVII_STAGE9_LANDING_DIVISION==='undefined') setDivision('top');
    window.renderClubChoiceList=renderClubChoiceListAlpha;
    try{ if(typeof renderClubChoiceList==='function' && document.body.classList.contains('not-started')) renderClubChoiceList(); }catch(e){}
  }
  const oldRender=typeof render==='function'?render:null;
  if(oldRender && !window.__stage13hRenderPatch){
    window.__stage13hRenderPatch=true;
    render=function(){ const out=oldRender.apply(this,arguments); try{ boot(); }catch(e){} return out; };
    window.render=render;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
