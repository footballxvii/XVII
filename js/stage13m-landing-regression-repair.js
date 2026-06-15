/* Stage 13M: repair landing regression, restore club story/info, remove duplicate board boxes and keep latest version visible. */
(function(){
  if(window.__stage13mLandingRegressionRepair) return;
  window.__stage13mLandingRegressionRepair = true;

  const VERSION = 'Version 13W · Beta';
  function byId(id){ return document.getElementById(id); }
  function esc(s){
    if(typeof escapeHtml === 'function') return escapeHtml(s);
    return String(s == null ? '' : s).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c] || c));
  }
  function n(v){ const x = Number(v || 0); return Number.isFinite(x) ? x : 0; }
  function moneyLocal(v){ try{ if(typeof money === 'function') return money(v); }catch(e){} return '£' + n(v).toLocaleString(undefined,{maximumFractionDigits:1}) + 'm'; }
  function ordinalLocal(v){ try{ if(typeof ordinal === 'function') return ordinal(v); }catch(e){} return String(v || ''); }
  function fmtSalary(v){
    const num = n(v);
    if(Math.abs(num) > 0 && Math.abs(num) < 1) return '£' + Math.round(num * 1000).toLocaleString() + 'k';
    return '£' + num.toLocaleString(undefined,{maximumFractionDigits:1}) + 'm';
  }
  function topClubs(){ try{ if(typeof XVII_STAGE9_TOP_DIVISION_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_TOP_DIVISION_CLUBS)) return XVII_STAGE9_TOP_DIVISION_CLUBS; }catch(e){} return []; }
  function secondClubs(){ try{ if(typeof XVII_STAGE9_SECOND_DIVISION_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_SECOND_DIVISION_CLUBS)) return XVII_STAGE9_SECOND_DIVISION_CLUBS; }catch(e){} return []; }
  function allPlayable(){ try{ if(typeof XVII_STAGE9_ALL_PLAYABLE_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_ALL_PLAYABLE_CLUBS)) return XVII_STAGE9_ALL_PLAYABLE_CLUBS; }catch(e){} return topClubs().concat(secondClubs()); }
  function clubInfo(club){ try{ if(typeof stage9ClubInfo === 'function') return stage9ClubInfo(club); }catch(e){} return allPlayable().find(c=>c && c.club===club) || null; }
  function previewBudget(club){ try{ if(typeof stage9PreviewBudgetForClub === 'function') return stage9PreviewBudgetForClub(club); }catch(e){} const c=clubInfo(club); return n(c?.budget); }
  function currentDivision(){ return window.XVII_STAGE9_LANDING_DIVISION === 'second' ? 'second' : 'top'; }
  function setDivision(div){ window.XVII_STAGE9_LANDING_DIVISION = div === 'second' ? 'second' : 'top'; }
  function clubsForDivision(div){ return allPlayable().filter(c => c && c.club && c.division === div).slice().sort((a,b)=>String(a.club).localeCompare(String(b.club))); }
  function expectationMap(list){
    try{ if(typeof stage9AllExpectationMapFor === 'function') return stage9AllExpectationMapFor(list); }catch(e){}
    const ranked = (list || []).slice().sort((a,b)=>n(b.budget)-n(a.budget)||String(a.club).localeCompare(String(b.club)));
    const map = {}; ranked.forEach((c,i)=>{ if(c && c.club) map[c.club] = i + 1; }); return map;
  }
  function expectedForClub(club){
    const info = clubInfo(club) || {};
    const list = info.division === 'second' ? secondClubs() : topClubs();
    const map = expectationMap(list);
    return n(map[club] || 20);
  }
  function salaryForClub(club){
    try{ if(typeof window.stage12StartingSalaryForClub === 'function') return window.stage12StartingSalaryForClub(club); }catch(e){}
    return 0.012;
  }
  function careerProfile(input){
    const club = typeof input === 'string' ? input : input.club;
    const info = typeof input === 'object' ? input : clubInfo(club) || {};
    const div = info.division === 'second' ? 'second' : 'top';
    const exp = expectedForClub(club);
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
    return {salary:salaryForClub(club), pressure, bonus, upside, expected:exp, div};
  }
  function personality(club){
    try{ if(typeof window.stage13eBoardPersonality === 'function') return window.stage13eBoardPersonality(club); }catch(e){}
    return {label:'Balanced board', summary:'A conventional board with no strong bias.'};
  }
  function divisionLabel(c){ return c?.division === 'second' ? 'Second Division' : 'Top Division'; }
  function sourceText(c){ return c?.sourceLevel || (c?.division === 'second' ? 'Second Division' : 'Top Division'); }
  function pill(label, value, cls=''){
    return `<div class="stage13m-pill ${cls}"><strong>${esc(value)}</strong><small>${esc(label)}</small></div>`;
  }
  function boardPill(club){
    const p = personality(club);
    return `<div class="stage13m-board-pill"><strong>${esc(p.label)}</strong><small>${esc(p.summary)}</small></div>`;
  }
  function cardHtml(c, selected){
    const p = careerProfile(c);
    const meta = `${divisionLabel(c)} · ${sourceText(c)} · Predicted finish: ${ordinalLocal(p.expected)}`;
    return `<button type="button" class="club-choice-card stage13m-club-choice-card ${selected ? 'active' : ''}" role="option" aria-selected="${selected ? 'true' : 'false'}" data-club="${esc(c.club)}">
      <div class="stage13m-card-main club-choice-main">
        <div class="club-choice-name">${esc(c.club)}</div>
        <div class="club-choice-meta">${esc(meta)}</div>
        <div class="stage13m-story">${esc(p.upside)}</div>
      </div>
      <div class="stage13m-card-strip">
        ${pill('Salary', fmtSalary(p.salary))}
        ${pill('Bonus', p.bonus)}
        ${pill('Pressure', p.pressure)}
      </div>
      ${boardPill(c.club)}
      <div class="club-choice-budget stage13m-budget"><strong>${moneyLocal(previewBudget(c.club))}</strong><span>Starting budget</span></div>
    </button>`;
  }
  function selectedHtml(club, clubs){
    const c = (clubs || allPlayable()).find(x => x && x.club === club) || clubInfo(club) || {club, division:currentDivision()};
    const p = careerProfile(c);
    const meta = `${divisionLabel(c)} career · ${sourceText(c)} · Predicted finish: ${ordinalLocal(p.expected)}`;
    return `<div class="stage13m-selected-main">
      <b>${esc(c.club)}</b>
      <span>${esc(meta)}</span>
      <em>${esc(p.upside)}</em>
    </div>
    ${pill('Starting budget', moneyLocal(previewBudget(c.club)), 'wide')}
    ${pill('Predicted finish', ordinalLocal(p.expected))}
    ${pill('Starting salary', fmtSalary(p.salary))}
    ${pill('Bonus route', p.bonus, 'wide')}
    ${pill('Pressure', p.pressure)}
    ${boardPill(c.club)}`;
  }
  function ensureDivisionPicker(){
    const list = byId('clubChoiceList');
    if(!list || !list.parentNode) return;
    let picker = byId('stage9DivisionPicker');
    if(!picker){
      picker = document.createElement('div');
      picker.id = 'stage9DivisionPicker';
      picker.className = 'stage9-division-picker stage13m-division-picker';
      picker.innerHTML = '<button type="button" data-div="top">Top Division</button><button type="button" data-div="second">Second Division</button>';
      list.parentNode.insertBefore(picker, list);
    }
    picker.classList.add('stage13m-division-picker');
    picker.querySelectorAll('button[data-div]').forEach(btn=>{
      const div = btn.getAttribute('data-div') === 'second' ? 'second' : 'top';
      btn.onclick = function(){
        if(window.state && state.started) return;
        setDivision(div);
        const select = byId('clubSelect');
        const clubs = clubsForDivision(div);
        if(select && clubs[0]) select.value = clubs[0].club;
        renderLandingClubChoices();
      };
      const active = div === currentDivision();
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  function renderSelected(club, clubs){
    const spot = byId('selectedClubSpot');
    if(!spot) return;
    spot.classList.add('active','stage13m-selected-club');
    spot.innerHTML = selectedHtml(club, clubs);
  }
  function renderLandingClubChoices(){
    if(window.state && state.started) return;
    const list = byId('clubChoiceList');
    const select = byId('clubSelect');
    if(!list || !select) return;
    ensureDivisionPicker();
    const clubs = clubsForDivision(currentDivision());
    if(!clubs.length){ list.innerHTML = '<div class="muted" style="padding:12px">Club list could not load. Reload the page and try again.</div>'; return; }
    const previous = select.value;
    select.innerHTML = clubs.map(c => `<option value="${esc(c.club)}">${esc(c.club)} · ${divisionLabel(c)}</option>`).join('');
    select.value = clubs.some(c => c.club === previous) ? previous : clubs[0].club;
    const selected = select.value;
    list.innerHTML = clubs.map(c => cardHtml(c, c.club === selected)).join('');
    list.querySelectorAll('.stage13m-club-choice-card').forEach(btn=>{
      btn.onclick = function(){
        if(window.state && state.started) return;
        select.value = this.getAttribute('data-club') || select.value;
        renderLandingClubChoices();
      };
    });
    renderSelected(selected, clubs);
    setVersion();
  }
  function bindSelect(){
    const select = byId('clubSelect');
    if(!select || select.getAttribute('data-stage13m-bound') === '1') return;
    select.setAttribute('data-stage13m-bound','1');
    select.addEventListener('change', function(){
      if(window.state && state.started){ select.value = state.humanClub || select.value; return; }
      renderLandingClubChoices();
    });
  }
  function setVersion(){
    try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ if(v.textContent !== VERSION) v.textContent = VERSION; }); }catch(e){}
  }
  function injectStyles(){
    if(byId('stage13m-style')) return;
    const st = document.createElement('style');
    st.id = 'stage13m-style';
    st.textContent = `
      body.not-started .app > .panel:first-child{background:transparent!important;box-shadow:none!important;border-color:transparent!important;overflow:visible!important;}
      body.not-started .app > .panel:first-child .panel-inner{background:transparent!important;}
      body.not-started .setup{max-width:1600px!important;width:100%!important;margin:0 auto!important;}
      body.not-started .setup .club-picker{max-width:1600px!important;width:100%!important;background:rgba(120,166,255,.055)!important;}
      body.not-started #clubChoiceList.club-choice-list{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;max-width:none!important;min-height:220px!important;max-height:370px!important;overflow:auto!important;margin-top:10px!important;padding-right:6px!important;}
      body.not-started .club-choice-card.stage13m-club-choice-card{display:grid!important;grid-template-columns:minmax(330px,1.35fr) minmax(360px,1.1fr) minmax(320px,.9fr) minmax(116px,auto)!important;align-items:center!important;gap:8px!important;min-height:56px!important;padding:8px 12px!important;margin:0 0 6px!important;border-radius:11px!important;text-align:left!important;}
      body.not-started .stage13m-card-main{min-width:0!important;}
      body.not-started .stage13m-card-main .club-choice-name{font-size:13px!important;line-height:1.05!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13m-card-main .club-choice-meta{font-size:8px!important;line-height:1.18!important;margin-top:2px!important;color:#aebbd1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13m-story{margin-top:2px!important;color:#ecd96e!important;font-size:8.4px!important;line-height:1.18!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13m-card-strip{display:flex!important;gap:6px!important;flex-wrap:nowrap!important;min-width:0!important;align-items:center!important;}
      body.not-started .stage13m-pill{border:1px solid rgba(236,201,75,.28)!important;background:rgba(236,201,75,.07)!important;border-radius:999px!important;padding:5px 8px!important;min-width:0!important;color:#dce7f7!important;line-height:1!important;text-align:center!important;}
      body.not-started .stage13m-pill strong{display:block!important;color:#fff!important;font-size:9px!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13m-pill small{display:block!important;margin-top:2px!important;color:#9fb0cc!important;font-size:6.8px!important;font-weight:850!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13m-card-strip .stage13m-pill{flex:1 1 0!important;}
      body.not-started .stage13m-board-pill{justify-self:stretch!important;align-self:center!important;border:1px solid rgba(168,85,247,.42)!important;background:linear-gradient(135deg,rgba(88,28,135,.26),rgba(15,23,42,.68))!important;border-radius:11px!important;padding:6px 8px!important;color:#efe7ff!important;line-height:1.1!important;min-width:0!important;text-align:left!important;}
      body.not-started .stage13m-board-pill strong{display:block!important;font-size:9px!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13m-board-pill small{display:block!important;margin-top:2px!important;font-size:7px!important;color:#d8caff!important;font-weight:850!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13m-budget{align-self:center!important;justify-self:end!important;text-align:right!important;font-size:12px!important;min-width:92px!important;}
      body.not-started .stage13m-budget strong{display:block!important;font-size:13px!important;line-height:1!important;}
      body.not-started .stage13m-budget span{display:block!important;font-size:7px!important;color:#aebbd1!important;line-height:1!important;margin-top:2px!important;}
      body.not-started .club-choice-card .stage12c-club-career-strip,
      body.not-started .club-choice-card .stage13f-board-personality,
      body.not-started .club-choice-card .stage13g-board-personality,
      body.not-started .club-choice-card .stage13e-board-personality,
      body.not-started .club-choice-card .stage13j-board-personality,
      body.not-started .club-choice-card .stage13k-board-personality{display:none!important;}
      body.not-started .selected-club-spot.stage13m-selected-club.active{display:grid!important;max-width:1600px!important;width:100%!important;margin:10px auto 0!important;grid-template-columns:minmax(300px,1.25fr) minmax(112px,.5fr) minmax(94px,.42fr) minmax(96px,.42fr) minmax(180px,.7fr) minmax(110px,.46fr) minmax(290px,.95fr)!important;gap:8px!important;align-items:center!important;padding:10px 12px!important;}
      body.not-started .stage13m-selected-main{min-width:0!important;}
      body.not-started .stage13m-selected-main b{display:block!important;color:#fff!important;font-size:13px!important;line-height:1.05!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13m-selected-main span{display:block!important;margin-top:2px!important;color:#aebbd1!important;font-size:8px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13m-selected-main em{display:block!important;margin-top:2px!important;color:#ecd96e!important;font-size:8.4px!important;font-style:normal!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      @media(max-width:1100px){
        body.not-started .club-choice-card.stage13m-club-choice-card{grid-template-columns:minmax(0,1fr) minmax(220px,.72fr) minmax(210px,.66fr) minmax(96px,auto)!important;}
        body.not-started .selected-club-spot.stage13m-selected-club.active{grid-template-columns:minmax(0,1fr) repeat(3,minmax(88px,auto))!important;}
        body.not-started .selected-club-spot.stage13m-selected-club.active .stage13m-board-pill{grid-column:1/-1!important;}
      }
      @media(max-width:760px){
        body.not-started .club-choice-card.stage13m-club-choice-card{grid-template-columns:minmax(0,1fr) minmax(94px,auto)!important;grid-template-areas:'main budget' 'story story' 'strip strip' 'board board'!important;min-height:0!important;padding:9px!important;}
        body.not-started .stage13m-card-main{grid-area:main!important;}
        body.not-started .stage13m-card-strip{grid-area:strip!important;flex-wrap:wrap!important;}
        body.not-started .stage13m-board-pill{grid-area:board!important;}
        body.not-started .stage13m-budget{grid-area:budget!important;}
        body.not-started .stage13m-card-main .club-choice-meta{white-space:normal!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;}
        body.not-started .stage13m-story{grid-area:story!important;white-space:normal!important;}
        body.not-started .selected-club-spot.stage13m-selected-club.active{grid-template-columns:1fr!important;}
      }
    `;
    document.head.appendChild(st);
  }
  function boot(){
    injectStyles();
    setVersion();
    bindSelect();
    if(typeof window.XVII_STAGE9_LANDING_DIVISION === 'undefined') setDivision('top');
    try{ window.renderClubChoiceList = renderLandingClubChoices; renderClubChoiceList = renderLandingClubChoices; }catch(e){}
    try{ if(document.body && document.body.classList.contains('not-started')) renderLandingClubChoices(); }catch(e){ console.warn('Stage 13M landing repair failed', e); }
    setTimeout(()=>{ try{ renderLandingClubChoices(); setVersion(); }catch(e){} }, 80);
    setTimeout(()=>{ try{ renderLandingClubChoices(); setVersion(); }catch(e){} }, 350);
    setTimeout(setVersion, 1000);
  }

  const oldRender = typeof window.render === 'function' ? window.render : null;
  if(oldRender && !window.__stage13mRenderPatch){
    window.__stage13mRenderPatch = true;
    window.render = function(){ const out = oldRender.apply(this, arguments); try{ boot(); }catch(e){} return out; };
    try{ render = window.render; }catch(e){}
  }
  const oldSummary = typeof window.renderSeasonSummary === 'function' ? window.renderSeasonSummary : null;
  if(oldSummary && !window.__stage13mSummaryPatch){
    window.__stage13mSummaryPatch = true;
    window.renderSeasonSummary = function(){ const out = oldSummary.apply(this, arguments); try{ setVersion(); }catch(e){} return out; };
    try{ renderSeasonSummary = window.renderSeasonSummary; }catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
