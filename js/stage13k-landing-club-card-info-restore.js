/* Stage 13K: restore compact landing club card info and remove duplicate board boxes. */
(function(){
  if(window.__stage13kLandingClubCardInfoRestore) return;
  window.__stage13kLandingClubCardInfoRestore = true;

  const VERSION = 'Version 13R · Beta';
  function byId(id){ return document.getElementById(id); }
  function esc(s){
    if(typeof escapeHtml === 'function') return escapeHtml(s);
    return String(s == null ? '' : s).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c] || c));
  }
  function moneyLocal(v){ try{ if(typeof money === 'function') return money(v); }catch(e){} return '£' + Number(v || 0).toLocaleString(undefined,{maximumFractionDigits:1}) + 'm'; }
  function ordinalLocal(v){ try{ if(typeof ordinal === 'function') return ordinal(v); }catch(e){} return String(v || ''); }
  function previewBudget(club){ try{ if(typeof stage9PreviewBudgetForClub === 'function') return stage9PreviewBudgetForClub(club); }catch(e){} return 0; }
  function topClubs(){ try{ if(typeof XVII_STAGE9_TOP_DIVISION_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_TOP_DIVISION_CLUBS)) return XVII_STAGE9_TOP_DIVISION_CLUBS; }catch(e){} return []; }
  function secondClubs(){ try{ if(typeof XVII_STAGE9_SECOND_DIVISION_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_SECOND_DIVISION_CLUBS)) return XVII_STAGE9_SECOND_DIVISION_CLUBS; }catch(e){} return []; }
  function allPlayable(){ try{ if(typeof XVII_STAGE9_ALL_PLAYABLE_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_ALL_PLAYABLE_CLUBS)) return XVII_STAGE9_ALL_PLAYABLE_CLUBS; }catch(e){} return topClubs().concat(secondClubs()); }
  function currentDivision(){ return window.XVII_STAGE9_LANDING_DIVISION === 'second' ? 'second' : 'top'; }
  function setDivision(div){ window.XVII_STAGE9_LANDING_DIVISION = div === 'second' ? 'second' : 'top'; }
  function clubsForDivision(div){ return allPlayable().filter(c => c && c.club && c.division === div).slice().sort((a,b)=>String(a.club).localeCompare(String(b.club))); }
  function expectationMap(list){
    try{ if(typeof stage9AllExpectationMapFor === 'function') return stage9AllExpectationMapFor(list); }catch(e){}
    const ranked = (list || []).slice().sort((a,b)=>Number(b.budget||0)-Number(a.budget||0)||String(a.club).localeCompare(String(b.club)));
    const map = {}; ranked.forEach((c,i)=>{ if(c && c.club) map[c.club] = i + 1; }); return map;
  }
  function fmtSalary(v){
    const num = Number(v || 0);
    if(Math.abs(num) > 0 && Math.abs(num) < 1) return '£' + Math.round(num * 1000).toLocaleString() + 'k';
    return '£' + num.toLocaleString(undefined,{maximumFractionDigits:1}) + 'm';
  }
  function infoForClub(club){
    try{ if(typeof stage9ClubInfo === 'function') return stage9ClubInfo(club) || null; }catch(e){}
    return allPlayable().find(c => c.club === club) || null;
  }
  function careerProfile(c){
    const club = typeof c === 'string' ? c : c.club;
    const info = typeof c === 'object' ? c : infoForClub(club) || {};
    const div = info.division === 'second' ? 'second' : 'top';
    const expMap = div === 'second' ? expectationMap(secondClubs()) : expectationMap(topClubs());
    const exp = Number(expMap[club] || 20);
    let pressure = 'Medium';
    if(div === 'top' && exp <= 4) pressure = 'Extreme';
    else if(div === 'top' && exp <= 8) pressure = 'High';
    else if(div === 'top' && exp >= 16) pressure = 'Survival pressure';
    else if(div === 'second' && exp <= 3) pressure = 'Promotion pressure';
    else if(div === 'second' && exp >= 16) pressure = 'Low patience, huge upside';
    let bonus = 'Balanced';
    if(div === 'second' && (exp >= 14 || info.sourceLevel === 'National League' || info.sourceLevel === 'League Two')) bonus = 'Huge if you overperform';
    else if(div === 'second') bonus = 'Strong climb route';
    else if(exp <= 4) bonus = 'Low unless you dominate';
    else if(exp >= 14) bonus = 'Strong survival route';
    else bonus = 'Good if you beat the brief';
    let upside = 'Standard career';
    if(div === 'top' && exp <= 4) upside = 'Success is expected. Reputation upside is limited early.';
    else if(div === 'second' && exp >= 16) upside = 'Hard mode: mid-table can make your name.';
    else if(div === 'second') upside = 'The climb can make you valuable quickly.';
    else if(exp >= 14) upside = 'Survival and overperformance can travel well.';
    return {salary:0.012, pressure, bonus, upside, expected:exp, div};
  }
  function personality(club){
    try{ if(typeof stage13eBoardPersonality === 'function') return stage13eBoardPersonality(club); }catch(e){}
    return {label:'Balanced board', summary:'A conventional board with no strong bias.'};
  }
  function boardHtml(club){
    const p = personality(club);
    return `<div class="stage13f-board-personality stage13g-board-personality stage13k-board-personality compact" data-stage13k-board="1"><b>${esc(p.label)}</b><span>${esc(p.summary)}</span></div>`;
  }
  function careerStripHtml(c){
    const p = careerProfile(c);
    return `<div class="stage13k-career-strip"><span>Salary: <b>${esc(fmtSalary(p.salary))}</b></span><span>Bonus: <b>${esc(p.bonus)}</b></span><span>Pressure: <b>${esc(p.pressure)}</b></span></div>`;
  }
  function injectStyles(){
    if(byId('stage13k-style')) return;
    const st = document.createElement('style');
    st.id = 'stage13k-style';
    st.textContent = `
      body.not-started .setup{max-width:1600px!important;width:100%!important;}
      body.not-started .club-picker{max-width:none!important;width:100%!important;}
      body.not-started #clubChoiceList.club-choice-list{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;max-width:none!important;margin-top:10px!important;overflow:auto!important;}
      body.not-started .club-choice-card{display:grid!important;grid-template-columns:minmax(235px,1.25fr) minmax(340px,1.15fr) minmax(290px,.85fr) minmax(110px,auto)!important;align-items:center!important;gap:8px!important;min-height:42px!important;padding:8px 10px!important;margin:0 0 6px!important;}
      body.not-started .club-choice-main{min-width:0!important;}
      body.not-started .club-choice-name{font-size:12px!important;line-height:1.05!important;}
      body.not-started .club-choice-meta{font-size:8px!important;line-height:1.2!important;margin-top:2px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage12c-upside{color:#ecd96e!important;font-weight:900!important;}
      body.not-started .club-choice-card .stage12c-club-career-strip{display:none!important;}
      body.not-started .stage13k-career-strip{display:flex!important;gap:6px!important;flex-wrap:nowrap!important;min-width:0!important;align-items:center!important;}
      body.not-started .stage13k-career-strip span{border:1px solid rgba(236,201,75,.28)!important;background:rgba(236,201,75,.07)!important;border-radius:999px!important;padding:4px 7px!important;color:#dce7f7!important;font-size:8px!important;font-weight:850!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13k-career-strip b{color:#fff!important;}
      body.not-started .club-choice-card .stage13f-board-personality:not(.stage13k-board-personality),
      body.not-started .club-choice-card .stage13g-board-personality:not(.stage13k-board-personality),
      body.not-started .club-choice-card .stage13e-board-personality:not(.stage13k-board-personality),
      body.not-started .club-choice-card .stage13j-board-personality{display:none!important;}
      body.not-started .club-choice-card .stage13k-board-personality{justify-self:stretch!important;align-self:center!important;margin:0!important;padding:5px 7px!important;border-radius:10px!important;border:1px solid rgba(168,85,247,.42)!important;background:linear-gradient(135deg,rgba(88,28,135,.30),rgba(15,23,42,.74))!important;color:#efe7ff!important;line-height:1.12!important;min-width:0!important;max-width:none!important;}
      body.not-started .club-choice-card .stage13k-board-personality b{display:block!important;font-size:8.5px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;margin:0 0 1px!important;}
      body.not-started .club-choice-card .stage13k-board-personality span{display:block!important;font-size:7.2px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#d8caff!important;}
      body.not-started .club-choice-budget{font-size:12px!important;align-self:center!important;}
      body.not-started .selected-club-spot.active{max-width:1600px!important;width:100%!important;grid-template-columns:minmax(220px,1fr) repeat(4,minmax(120px,auto)) minmax(260px,1.1fr)!important;align-items:center!important;}
      body.not-started .selected-club-spot .stage13f-selected-board{min-width:0!important;grid-column:auto!important;}
      body.not-started .selected-club-spot .stage13f-selected-board small{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      @media(min-width:701px){body.not-started #clubChoiceList.club-choice-list{max-height:360px!important;min-height:230px!important;}}
      @media(max-width:950px){
        body.not-started .club-choice-card{grid-template-columns:minmax(0,1fr) minmax(145px,.55fr) minmax(86px,auto)!important;grid-template-areas:'main board budget' 'career career career'!important;}
        body.not-started .club-choice-main{grid-area:main!important;}
        body.not-started .stage13k-career-strip{grid-area:career!important;}
        body.not-started .stage13k-board-personality{grid-area:board!important;}
        body.not-started .club-choice-budget{grid-area:budget!important;}
      }
      @media(max-width:700px){
        body.not-started #clubChoiceList.club-choice-list{max-height:292px!important;min-height:210px!important;}
        body.not-started .club-choice-card{grid-template-columns:minmax(0,1fr) minmax(104px,32%) minmax(76px,auto)!important;gap:6px!important;padding:8px 9px!important;}
        body.not-started .stage13k-career-strip{gap:4px!important;flex-wrap:wrap!important;}
        body.not-started .stage13k-career-strip span{font-size:7.4px!important;padding:3px 5px!important;}
        body.not-started .club-choice-card .stage13k-board-personality{padding:4px 5px!important;}
        body.not-started .club-choice-card .stage13k-board-personality b{font-size:7.5px!important;}
        body.not-started .club-choice-card .stage13k-board-personality span{font-size:6.8px!important;}
        body.not-started .selected-club-spot.active{grid-template-columns:1fr!important;}
      }
      @media(max-width:370px){body.not-started .club-choice-card{grid-template-columns:minmax(0,1fr) minmax(86px,30%) minmax(68px,auto)!important;} body.not-started .club-choice-card .stage13k-board-personality span{display:none!important;}}
    `;
    document.head.appendChild(st);
  }
  function refreshVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent = VERSION; }); }catch(e){} }
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
    if(!c){ spot.classList.remove('active'); spot.innerHTML = ''; return; }
    const p = careerProfile(c);
    const divLabel = c.division === 'second' ? 'Second Division' : 'Top Division';
    const role = c.role || c.sourceLevel || (c.division === 'second' ? 'Second Division' : 'Top Division');
    const board = personality(c.club);
    spot.classList.add('active');
    spot.innerHTML = `<div><b>${esc(c.club)}</b><span>${esc(divLabel)} career · ${esc(role)}</span></div><div class="selected-club-pill"><strong>${moneyLocal(previewBudget(c.club))}</strong><small>Starting budget</small></div><div class="selected-club-pill"><strong>${ordinalLocal(p.expected)}</strong><small>Predicted finish</small></div><div class="selected-club-pill stage12c-selected-salary"><strong>${esc(fmtSalary(p.salary))}</strong><small>Starting salary</small></div><div class="selected-club-pill stage12c-selected-salary"><strong>${esc(p.bonus)}</strong><small>Bonus route</small></div><div class="selected-club-pill stage13f-selected-board"><strong>${esc(board.label)}</strong><small>${esc(board.summary)}</small></div>`;
  }
  function removeDuplicateBoardBoxes(root){
    try{
      (root || document).querySelectorAll('.club-choice-card').forEach(card=>{
        const boards = Array.from(card.querySelectorAll('.stage13f-board-personality,.stage13g-board-personality,.stage13e-board-personality,.stage13j-board-personality,.stage13k-board-personality'));
        const keeper = boards.find(b => b.classList.contains('stage13k-board-personality')) || boards[0];
        boards.forEach(b => { if(b !== keeper) b.remove(); });
        if(keeper){ keeper.classList.add('stage13f-board-personality','stage13g-board-personality','stage13k-board-personality','compact'); }
      });
    }catch(e){}
  }
  function renderLandingClubChoices(){
    const list = byId('clubChoiceList');
    const select = byId('clubSelect');
    if(!list || !select) return;
    ensureDivisionPicker();
    const clubs = clubsForDivision(currentDivision());
    if(!clubs.length){ list.innerHTML = '<div class="muted" style="padding:12px">Club list could not load. Reload the page and try again.</div>'; return; }
    const previous = select.value;
    select.innerHTML = clubs.map(c => `<option value="${esc(c.club)}">${esc(c.club)} · ${esc(c.division === 'second' ? 'Second Division' : 'Top Division')}</option>`).join('');
    if(clubs.some(c => c.club === previous)) select.value = previous;
    else select.value = clubs[0].club;
    const selected = select.value;
    list.innerHTML = clubs.map(c => {
      const p = careerProfile(c);
      const divLabel = c.division === 'second' ? 'Second Division' : 'Top Division';
      const source = c.sourceLevel || (c.division === 'top' ? 'Top Division' : '');
      const active = c.club === selected;
      return `<button type="button" class="club-choice-card ${active ? 'active' : ''}" role="option" aria-selected="${active ? 'true' : 'false'}" data-club="${esc(c.club)}"><div class="club-choice-main"><div class="club-choice-name">${esc(c.club)}</div><div class="club-choice-meta">${esc(divLabel)}${source ? ' · ' + esc(source) : ''} · Predicted finish: ${ordinalLocal(p.expected)} <span class="stage12c-upside">· ${esc(p.upside)}</span></div></div>${careerStripHtml(c)}${boardHtml(c.club)}<div class="club-choice-budget">${moneyLocal(previewBudget(c.club))}<span>Starting budget</span></div></button>`;
    }).join('');
    list.querySelectorAll('.club-choice-card').forEach(btn=>{
      btn.onclick = function(){
        if(window.state && state.started) return;
        select.value = this.getAttribute('data-club') || select.value;
        renderLandingClubChoices();
      };
    });
    removeDuplicateBoardBoxes(list);
    renderSelected(selected, clubs);
  }
  function bindSelect(){
    const select = byId('clubSelect');
    if(!select || select.getAttribute('data-stage13k-bound') === '1') return;
    select.setAttribute('data-stage13k-bound','1');
    select.addEventListener('change', function(){ if(window.state && state.started){ select.value = state.humanClub || select.value; return; } renderLandingClubChoices(); });
  }
  function boot(){
    injectStyles();
    refreshVersion();
    bindSelect();
    if(typeof window.XVII_STAGE9_LANDING_DIVISION === 'undefined') setDivision('top');
    window.renderClubChoiceList = renderLandingClubChoices;
    try{ if(document.body && document.body.classList.contains('not-started')) renderLandingClubChoices(); }catch(e){}
    setTimeout(()=>{ try{ removeDuplicateBoardBoxes(); renderLandingClubChoices(); }catch(e){} }, 80);
    setTimeout(()=>{ try{ removeDuplicateBoardBoxes(); }catch(e){} }, 300);
  }
  const oldRender = typeof render === 'function' ? render : null;
  if(oldRender && !window.__stage13kRenderPatch){
    window.__stage13kRenderPatch = true;
    render = function(){ const out = oldRender.apply(this, arguments); try{ boot(); }catch(e){} return out; };
    window.render = render;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
