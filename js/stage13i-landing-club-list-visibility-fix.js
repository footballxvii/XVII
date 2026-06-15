/* Stage 13I: restore visible landing club list after full-width landing patch. */
(function(){
  if(window.__stage13iLandingClubListVisibilityFix) return;
  window.__stage13iLandingClubListVisibilityFix = true;

  const VERSION = 'Version 13S · Beta';
  function byId(id){ return document.getElementById(id); }
  function esc(s){
    if(typeof escapeHtml === 'function') return escapeHtml(s);
    return String(s == null ? '' : s).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c] || c));
  }
  function moneyLocal(v){ try{ if(typeof money === 'function') return money(v); }catch(e){} return '£' + Number(v || 0).toLocaleString(undefined,{maximumFractionDigits:1}) + 'm'; }
  function ordinalLocal(v){ try{ if(typeof ordinal === 'function') return ordinal(v); }catch(e){} return String(v); }
  function previewBudget(club){ try{ if(typeof stage9PreviewBudgetForClub === 'function') return stage9PreviewBudgetForClub(club); }catch(e){} return 0; }
  function personality(club){
    try{ if(typeof stage13eBoardPersonality === 'function') return stage13eBoardPersonality(club); }catch(e){}
    return {label:'Balanced board', summary:'A conventional board with no strong bias.'};
  }
  function currentDivision(){ return window.XVII_STAGE9_LANDING_DIVISION === 'second' ? 'second' : 'top'; }
  function setDivision(div){ window.XVII_STAGE9_LANDING_DIVISION = div === 'second' ? 'second' : 'top'; }
  function allPlayable(){ return Array.isArray(window.XVII_STAGE9_ALL_PLAYABLE_CLUBS) ? window.XVII_STAGE9_ALL_PLAYABLE_CLUBS : []; }
  function clubsForCurrentDivision(){
    return allPlayable()
      .filter(c => c && c.club && (c.division === currentDivision()))
      .sort((a,b) => String(a.club || '').localeCompare(String(b.club || '')));
  }
  function expectationMap(list){
    try{ if(typeof stage9AllExpectationMapFor === 'function') return stage9AllExpectationMapFor(list); }catch(e){}
    const map = {}; (list || []).forEach((c,i) => { if(c && c.club) map[c.club] = i + 1; }); return map;
  }
  function injectStyles(){
    if(byId('stage13i-style')) return;
    const st = document.createElement('style');
    st.id = 'stage13i-style';
    st.textContent = `
      body.not-started .app > .panel:first-child{max-width:1220px!important;width:calc(100% - 0px)!important;}
      body.not-started .setup{max-width:1220px!important;width:100%!important;}
      body.not-started .setup .club-picker{width:100%!important;overflow:visible!important;}
      body.not-started #clubChoiceList.club-choice-list{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;margin-top:10px!important;overflow:auto!important;}
      body.not-started .club-choice-card{display:grid!important;}
      body.not-started .selected-club-spot.active{max-width:1220px!important;width:100%!important;}
      @media(min-width:701px){
        body.not-started #clubChoiceList.club-choice-list{max-height:360px!important;min-height:215px!important;}
        body.not-started .club-choice-card{grid-template-columns:minmax(0,1.1fr) minmax(240px,.75fr) minmax(108px,auto)!important;min-height:42px!important;padding:7px 10px!important;}
        body.not-started .stage9-division-picker{width:100%!important;}
        body.not-started .stage9-division-picker button{min-height:38px!important;}
      }
      @media(max-width:700px){
        body.not-started #clubChoiceList.club-choice-list{max-height:292px!important;min-height:170px!important;}
        body.not-started .club-choice-card{grid-template-columns:minmax(0,1fr) minmax(102px,32%) minmax(74px,auto)!important;}
      }
    `;
    document.head.appendChild(st);
  }
  function ensureDivisionPicker(){
    const list = byId('clubChoiceList');
    if(!list) return null;
    let picker = byId('stage9DivisionPicker');
    if(!picker){
      picker = document.createElement('div');
      picker.id = 'stage9DivisionPicker';
      picker.className = 'stage9-division-picker';
      picker.innerHTML = '<button type="button" data-div="top">Top Division</button><button type="button" data-div="second">Second Division</button>';
      list.parentNode.insertBefore(picker, list);
    }
    picker.querySelectorAll('button[data-div]').forEach(btn => {
      if(btn.getAttribute('data-stage13i-bound') !== '1'){
        btn.setAttribute('data-stage13i-bound','1');
        btn.addEventListener('click', () => {
          if(window.state && state.started) return;
          setDivision(btn.getAttribute('data-div'));
          const clubs = clubsForCurrentDivision();
          const select = byId('clubSelect');
          if(select && clubs[0]) select.value = clubs[0].club;
          renderLandingClubChoices();
        });
      }
      const active = btn.getAttribute('data-div') === currentDivision();
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    return picker;
  }
  function boardBox(club){
    const p = personality(club);
    return `<div class="stage13h-board-personality stage13g-board-personality stage13f-board-personality compact"><b>${esc(p.label)}</b><span>${esc(p.summary)}</span></div>`;
  }
  function renderSelectedClub(selected, clubs, topMap, secondMap){
    const spot = byId('selectedClubSpot');
    if(!spot) return;
    const c = clubs.find(x => x.club === selected);
    if(!c){ spot.classList.remove('active'); spot.innerHTML = ''; return; }
    const map = c.division === 'second' ? secondMap : topMap;
    const p = personality(c.club);
    spot.classList.add('active');
    spot.innerHTML = `<div><b>${esc(c.club)}</b><span>${esc(c.division === 'second' ? 'Second Division' : 'Top Division')} career · ${esc(c.role || '')}</span></div><div class="selected-club-pill"><strong>${moneyLocal(previewBudget(c.club))}</strong><small>Starting budget</small></div><div class="selected-club-pill"><strong>${ordinalLocal(map[c.club] || 20)}</strong><small>Predicted finish</small></div><div class="selected-club-pill stage13f-selected-board"><strong>${esc(p.label)}</strong><small>${esc(p.summary)}</small></div>`;
  }
  function renderLandingClubChoices(){
    const list = byId('clubChoiceList');
    const select = byId('clubSelect');
    if(!list || !select) return;
    ensureDivisionPicker();
    const clubs = clubsForCurrentDivision();
    const oldValue = select.value;
    select.innerHTML = clubs.map(c => `<option value="${esc(c.club)}">${esc(c.club)} · ${esc(c.division === 'second' ? 'Second Division' : 'Top Division')}</option>`).join('');
    if(clubs.some(c => c.club === oldValue)) select.value = oldValue;
    else if(clubs[0]) select.value = clubs[0].club;
    const selected = select.value;
    const topMap = expectationMap(window.XVII_STAGE9_TOP_DIVISION_CLUBS || []);
    const secondMap = expectationMap(window.XVII_STAGE9_SECOND_DIVISION_CLUBS || []);
    list.innerHTML = clubs.map(c => {
      const map = c.division === 'second' ? secondMap : topMap;
      const source = c.sourceLevel || (c.division === 'top' ? 'Top Division' : '');
      const active = c.club === selected;
      return `<button type="button" class="club-choice-card ${active ? 'active' : ''}" role="option" aria-selected="${active ? 'true' : 'false'}" data-club="${esc(c.club)}"><div><div class="club-choice-name">${esc(c.club)}</div><div class="club-choice-meta">${esc(c.division === 'second' ? 'Second Division' : 'Top Division')}${source ? ' · ' + esc(source) : ''} · Predicted finish: ${ordinalLocal(map[c.club] || 20)}</div></div>${boardBox(c.club)}<div class="club-choice-budget">${moneyLocal(previewBudget(c.club))}<span>Starting budget</span></div></button>`;
    }).join('');
    list.querySelectorAll('.club-choice-card').forEach(btn => {
      btn.addEventListener('click', function(){
        if(window.state && state.started) return;
        select.value = this.getAttribute('data-club') || select.value;
        renderLandingClubChoices();
      });
    });
    renderSelectedClub(selected, clubs, topMap, secondMap);
  }
  function patchSelect(){
    const select = byId('clubSelect');
    if(!select || select.getAttribute('data-stage13i-bound') === '1') return;
    select.setAttribute('data-stage13i-bound','1');
    select.addEventListener('change', () => {
      if(window.state && state.started){ select.value = state.humanClub || select.value; return; }
      renderLandingClubChoices();
    });
  }
  function updateVersion(){
    document.querySelectorAll('.xvii-version-note').forEach(el => { el.textContent = VERSION; });
  }
  function boot(){
    injectStyles();
    updateVersion();
    patchSelect();
    if(typeof window.XVII_STAGE9_LANDING_DIVISION === 'undefined') setDivision('top');
    window.renderClubChoiceList = renderLandingClubChoices;
    if(document.body && document.body.classList.contains('not-started')) renderLandingClubChoices();
  }
  const oldRender = typeof render === 'function' ? render : null;
  if(oldRender && !window.__stage13iRenderPatch){
    window.__stage13iRenderPatch = true;
    render = function(){
      const out = oldRender.apply(this, arguments);
      try{ boot(); }catch(e){ console.warn('Stage 13I landing fix failed', e); }
      return out;
    };
    window.render = render;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
