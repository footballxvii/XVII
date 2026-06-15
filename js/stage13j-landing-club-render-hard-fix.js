/* Stage 13J: hard fix for landing club render after global const/window mismatch. */
(function(){
  if(window.__stage13jLandingClubRenderHardFix) return;
  window.__stage13jLandingClubRenderHardFix = true;

  const VERSION = 'Version 13Q · Beta';
  function byId(id){ return document.getElementById(id); }
  function esc(s){
    if(typeof escapeHtml === 'function') return escapeHtml(s);
    return String(s == null ? '' : s).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c] || c));
  }
  function moneyLocal(v){ try{ if(typeof money === 'function') return money(v); }catch(e){} return '£' + Number(v || 0).toLocaleString(undefined,{maximumFractionDigits:1}) + 'm'; }
  function ordinalLocal(v){ try{ if(typeof ordinal === 'function') return ordinal(v); }catch(e){} return String(v || ''); }
  function previewBudget(club){ try{ if(typeof stage9PreviewBudgetForClub === 'function') return stage9PreviewBudgetForClub(club); }catch(e){} return 0; }
  function personality(club){
    try{ if(typeof stage13eBoardPersonality === 'function') return stage13eBoardPersonality(club); }catch(e){}
    return {label:'Balanced board', summary:'A conventional board with no strong bias.'};
  }
  function topClubs(){ try{ if(typeof XVII_STAGE9_TOP_DIVISION_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_TOP_DIVISION_CLUBS)) return XVII_STAGE9_TOP_DIVISION_CLUBS; }catch(e){} return []; }
  function secondClubs(){ try{ if(typeof XVII_STAGE9_SECOND_DIVISION_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_SECOND_DIVISION_CLUBS)) return XVII_STAGE9_SECOND_DIVISION_CLUBS; }catch(e){} return []; }
  function allPlayable(){
    try{ if(typeof XVII_STAGE9_ALL_PLAYABLE_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_ALL_PLAYABLE_CLUBS)) return XVII_STAGE9_ALL_PLAYABLE_CLUBS; }catch(e){}
    return [...topClubs(), ...secondClubs()];
  }
  function currentDivision(){ return window.XVII_STAGE9_LANDING_DIVISION === 'second' ? 'second' : 'top'; }
  function setDivision(div){ window.XVII_STAGE9_LANDING_DIVISION = div === 'second' ? 'second' : 'top'; }
  function clubsForDivision(div){ return allPlayable().filter(c => c && c.club && c.division === div).slice().sort((a,b)=>String(a.club).localeCompare(String(b.club))); }
  function expectationMap(list){
    try{ if(typeof stage9AllExpectationMapFor === 'function') return stage9AllExpectationMapFor(list); }catch(e){}
    const map = {}; (list || []).forEach((c,i)=>{ if(c && c.club) map[c.club] = i + 1; }); return map;
  }
  function boardHtml(club){
    const p = personality(club);
    return `<div class="stage13j-board-personality compact"><b>${esc(p.label)}</b><span>${esc(p.summary)}</span></div>`;
  }
  function injectStyles(){
    if(byId('stage13j-style')) return;
    const st = document.createElement('style');
    st.id = 'stage13j-style';
    st.textContent = `
      body.not-started .app > .panel:first-child{max-width:1280px!important;width:100%!important;}
      body.not-started .setup{max-width:1280px!important;width:100%!important;}
      body.not-started .setup .club-picker{width:100%!important;max-width:none!important;overflow:visible!important;}
      body.not-started #stage9DivisionPicker.stage9-division-picker{width:100%!important;max-width:none!important;}
      body.not-started #clubChoiceList.club-choice-list{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;max-width:none!important;margin-top:10px!important;overflow:auto!important;}
      body.not-started .club-choice-card{display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(250px,.8fr) minmax(110px,auto)!important;align-items:center!important;gap:8px!important;min-height:44px!important;padding:7px 10px!important;margin:0 0 5px!important;}
      body.not-started .club-choice-card .stage13j-board-personality{justify-self:stretch!important;margin:0!important;padding:5px 7px!important;border-radius:10px!important;border:1px solid rgba(168,85,247,.42)!important;background:linear-gradient(135deg,rgba(88,28,135,.30),rgba(15,23,42,.74))!important;color:#efe7ff!important;line-height:1.12!important;min-width:0!important;}
      body.not-started .club-choice-card .stage13j-board-personality b{display:block!important;font-size:8.5px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;margin:0 0 1px!important;}
      body.not-started .club-choice-card .stage13j-board-personality span{display:block!important;font-size:7.2px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#d8caff!important;}
      body.not-started .selected-club-spot.active{max-width:1280px!important;width:100%!important;}
      @media(min-width:701px){body.not-started #clubChoiceList.club-choice-list{max-height:360px!important;min-height:260px!important;}}
      @media(max-width:700px){
        body.not-started #clubChoiceList.club-choice-list{max-height:292px!important;min-height:210px!important;}
        body.not-started .club-choice-card{grid-template-columns:minmax(0,1fr) minmax(104px,32%) minmax(76px,auto)!important;gap:6px!important;padding:8px 9px!important;}
        body.not-started .club-choice-card .stage13j-board-personality{padding:4px 5px!important;}
        body.not-started .club-choice-card .stage13j-board-personality b{font-size:7.5px!important;}
        body.not-started .club-choice-card .stage13j-board-personality span{font-size:6.8px!important;}
      }
      @media(max-width:370px){body.not-started .club-choice-card{grid-template-columns:minmax(0,1fr) minmax(86px,30%) minmax(68px,auto)!important;} body.not-started .club-choice-card .stage13j-board-personality span{display:none!important;}}
    `;
    document.head.appendChild(st);
  }
  function ensureDivisionPicker(){
    const list = byId('clubChoiceList');
    if(!list || !list.parentNode) return;
    let picker = byId('stage9DivisionPicker');
    if(!picker){
      picker = document.createElement('div');
      picker.id = 'stage9DivisionPicker';
      picker.className = 'stage9-division-picker';
      picker.innerHTML = '<button type="button" data-div="top">Top Division</button><button type="button" data-div="second">Second Division</button>';
      list.parentNode.insertBefore(picker, list);
    }
    picker.querySelectorAll('button[data-div]').forEach(btn=>{
      const div = btn.getAttribute('data-div') === 'second' ? 'second' : 'top';
      btn.onclick = function(){
        if(window.state && state.started) return;
        setDivision(div);
        const clubs = clubsForDivision(div);
        const select = byId('clubSelect');
        if(select && clubs[0]) select.value = clubs[0].club;
        renderLandingClubChoices();
      };
      const active = div === currentDivision();
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  function renderSelected(selected, currentClubs){
    const spot = byId('selectedClubSpot');
    if(!spot) return;
    const c = currentClubs.find(x => x.club === selected) || allPlayable().find(x => x.club === selected);
    if(!c){ spot.classList.remove('active'); spot.innerHTML=''; return; }
    const map = c.division === 'second' ? expectationMap(secondClubs()) : expectationMap(topClubs());
    const p = personality(c.club);
    spot.classList.add('active');
    spot.innerHTML = `<div><b>${esc(c.club)}</b><span>${esc(c.division === 'second' ? 'Second Division' : 'Top Division')} career · ${esc(c.role || c.sourceLevel || '')}</span></div><div class="selected-club-pill"><strong>${moneyLocal(previewBudget(c.club))}</strong><small>Starting budget</small></div><div class="selected-club-pill"><strong>${ordinalLocal(map[c.club] || 20)}</strong><small>Predicted finish</small></div><div class="selected-club-pill stage13f-selected-board"><strong>${esc(p.label)}</strong><small>${esc(p.summary)}</small></div>`;
  }
  function renderLandingClubChoices(){
    const list = byId('clubChoiceList');
    const select = byId('clubSelect');
    if(!list || !select) return;
    ensureDivisionPicker();
    let clubs = clubsForDivision(currentDivision());
    if(!clubs.length){
      list.innerHTML = '<div class="muted" style="padding:12px">Club list could not load. Reload the page and try again.</div>';
      return;
    }
    const previous = select.value;
    select.innerHTML = clubs.map(c => `<option value="${esc(c.club)}">${esc(c.club)} · ${esc(c.division === 'second' ? 'Second Division' : 'Top Division')}</option>`).join('');
    if(clubs.some(c => c.club === previous)) select.value = previous;
    else select.value = clubs[0].club;
    const selected = select.value;
    const topMap = expectationMap(topClubs());
    const secondMap = expectationMap(secondClubs());
    list.innerHTML = clubs.map(c => {
      const map = c.division === 'second' ? secondMap : topMap;
      const divLabel = c.division === 'second' ? 'Second Division' : 'Top Division';
      const source = c.sourceLevel || (c.division === 'top' ? 'Top Division' : '');
      const active = c.club === selected;
      return `<button type="button" class="club-choice-card ${active ? 'active' : ''}" role="option" aria-selected="${active ? 'true' : 'false'}" data-club="${esc(c.club)}"><div><div class="club-choice-name">${esc(c.club)}</div><div class="club-choice-meta">${esc(divLabel)}${source ? ' · ' + esc(source) : ''} · Predicted finish: ${ordinalLocal(map[c.club] || 20)}</div></div>${boardHtml(c.club)}<div class="club-choice-budget">${moneyLocal(previewBudget(c.club))}<span>Starting budget</span></div></button>`;
    }).join('');
    list.querySelectorAll('.club-choice-card').forEach(btn => {
      btn.onclick = function(){
        if(window.state && state.started) return;
        select.value = this.getAttribute('data-club') || select.value;
        renderLandingClubChoices();
      };
    });
    renderSelected(selected, clubs);
  }
  function bindSelect(){
    const select = byId('clubSelect');
    if(!select) return;
    select.onchange = function(){
      if(window.state && state.started){ select.value = state.humanClub || select.value; return; }
      renderLandingClubChoices();
    };
  }
  function updateVersion(){ document.querySelectorAll('.xvii-version-note').forEach(el => { el.textContent = VERSION; }); }
  function boot(){
    injectStyles();
    updateVersion();
    bindSelect();
    if(typeof window.XVII_STAGE9_LANDING_DIVISION === 'undefined') setDivision('top');
    window.renderClubChoiceList = renderLandingClubChoices;
    if(document.body && document.body.classList.contains('not-started')) renderLandingClubChoices();
  }
  const oldRender = typeof render === 'function' ? render : null;
  if(oldRender && !window.__stage13jRenderPatch){
    window.__stage13jRenderPatch = true;
    render = function(){
      const out = oldRender.apply(this, arguments);
      try{ boot(); }catch(e){ console.warn('Stage 13J landing render failed', e); }
      return out;
    };
    window.render = render;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 80);
  setTimeout(boot, 300);
})();
