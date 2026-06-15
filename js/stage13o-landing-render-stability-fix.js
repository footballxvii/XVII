/* Stage 13O: landing render stability, club-card fit and narrative blurbs. */
(function(){
  if(window.__stage13oLandingRenderStabilityFix) return;
  window.__stage13oLandingRenderStabilityFix = true;

  const VERSION = 'Version 13X · Beta';
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
  function topClubs(){ try{ if(typeof XVII_STAGE9_TOP_DIVISION_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_TOP_DIVISION_CLUBS)) return XVII_STAGE9_TOP_DIVISION_CLUBS; }catch(e){} try{ if(typeof CLUBS !== 'undefined' && Array.isArray(CLUBS)) return CLUBS.map(c => ({...c, division:'top', sourceLevel:'Top Division', role:'Top Division'})); }catch(e){} return []; }
  function secondClubs(){ try{ if(typeof XVII_STAGE9_SECOND_DIVISION_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_SECOND_DIVISION_CLUBS)) return XVII_STAGE9_SECOND_DIVISION_CLUBS; }catch(e){} return []; }
  function allPlayable(){
    try{ if(typeof XVII_STAGE9_ALL_PLAYABLE_CLUBS !== 'undefined' && Array.isArray(XVII_STAGE9_ALL_PLAYABLE_CLUBS)) return XVII_STAGE9_ALL_PLAYABLE_CLUBS; }catch(e){}
    return topClubs().concat(secondClubs());
  }
  function currentDivision(){ return window.XVII_STAGE9_LANDING_DIVISION === 'second' ? 'second' : 'top'; }
  function setDivision(div){ window.XVII_STAGE9_LANDING_DIVISION = div === 'second' ? 'second' : 'top'; }
  function clubsForDivision(div){
    const source = div === 'second' ? secondClubs() : topClubs();
    const arr = source.length ? source : allPlayable().filter(c => c && c.division === div);
    return arr.filter(c => c && c.club).slice().sort((a,b)=>String(a.club).localeCompare(String(b.club)));
  }
  function clubInfo(club){ return allPlayable().find(c => c && c.club === club) || null; }
  function previewBudget(club){ try{ if(typeof stage9PreviewBudgetForClub === 'function') return stage9PreviewBudgetForClub(club); }catch(e){} const c = clubInfo(club); return n(c?.manualTransferBudget || c?.budget); }
  function expectationMap(list){
    try{ if(typeof stage9AllExpectationMapFor === 'function') return stage9AllExpectationMapFor(list || []); }catch(e){}
    const ranked = (list || []).slice().sort((a,b)=>n(b.budget)-n(a.budget)||String(a.club).localeCompare(String(b.club)));
    const map = {}; ranked.forEach((c,i)=>{ if(c && c.club) map[c.club] = i + 1; }); return map;
  }
  function expectedFor(c){
    const list = c?.division === 'second' ? secondClubs() : topClubs();
    const map = expectationMap(list);
    return n(map[c?.club] || 20);
  }
  function salaryForClub(club){ try{ if(typeof window.stage12StartingSalaryForClub === 'function') return window.stage12StartingSalaryForClub(club); }catch(e){} return 0.012; }
  function careerProfile(c){
    const exp = expectedFor(c);
    const div = c?.division === 'second' ? 'second' : 'top';
    let pressure = 'Medium';
    if(div === 'top' && exp <= 4) pressure = 'Extreme';
    else if(div === 'top' && exp <= 8) pressure = 'High';
    else if(div === 'top' && exp >= 16) pressure = 'Survival pressure';
    else if(div === 'second' && exp <= 3) pressure = 'Promotion pressure';
    else if(div === 'second' && exp >= 16) pressure = 'Low patience, huge upside';

    let bonus = 'Balanced';
    if(div === 'second' && (exp >= 14 || c?.sourceLevel === 'National League' || c?.sourceLevel === 'League Two')) bonus = 'Huge if you overperform';
    else if(div === 'second') bonus = 'Strong climb route';
    else if(exp <= 4) bonus = 'Low unless you dominate';
    else if(exp >= 14) bonus = 'Strong survival route';
    else bonus = 'Good if you beat the brief';
    return {expected:exp, salary:salaryForClub(c?.club), pressure, bonus};
  }
  function personality(club){ try{ if(typeof stage13eBoardPersonality === 'function') return stage13eBoardPersonality(club); }catch(e){} return {label:'Balanced board', summary:'A conventional board with no strong bias.'}; }
  const CLUB_STORIES = {
    'AFC Bournemouth':'A clever coastal job where calm recruitment can keep upsetting bigger rooms.',
    'Arsenal':'A grand stage where style matters, but the room only truly relaxes when medals arrive.',
    'Aston Villa':'A big old club with modern momentum and a crowd ready to believe the climb is real.',
    'Brentford':'A sharp systems club where good decisions matter more than noise or reputation.',
    'Brighton & Hove Albion':'A seaside recruitment machine: sell well, replace well, and the project keeps moving.',
    'Burnley':'A hard northern brief where grit travels further than glamour and survival earns respect.',
    'Chelsea':'Money, politics and expectation in one place; win quickly or the room changes around you.',
    'Crystal Palace':'South London edge, restless energy and a fanbase waiting for pace and nerve.',
    'Everton':'Heavy history and raw nerves; steady the club and the mood can turn fast.',
    'Fulham':'A tidy London job where comfort is the danger and ambition has to be created.',
    'Leeds United':'A loud club with a national pulse; once momentum starts it feels bigger than the table.',
    'Liverpool':'Memory in the walls and pressure in every point. Competing is not enough for long.',
    'Manchester City':'A winning machine where dominance is expected and drift is noticed immediately.',
    'Manchester United':'A giant with noise in every corridor; restore order and the rewards become enormous.',
    'Newcastle United':'A city-club with heavyweight backing; make the project feel real and the crowd carries it.',
    'Nottingham Forest':'European ghosts, fierce pride and modern expectation. A good season can feel historic.',
    'Sunderland':'A huge support waiting to rise again; survival is only chapter one if belief catches.',
    'Tottenham Hotspur':'A big stadium, a big tension and a hunger to make promise permanent at last.',
    'West Ham United':'East London wants swagger with substance. Progress has to feel bold, not polite.',
    'Wolverhampton Wanderers':'A proud old club where a clever rebuild can put bite back into the place.',
    'Southampton':'A development club looking for a clean reset and a manager who can make value grow.',
    'Middlesbrough':'A serious Teesside job: practical, proud and ready to reward proper building work.',
    'Norwich City':'A club used to moving between worlds; stop the bounce and stability becomes power.',
    'West Bromwich Albion':'A traditional promotion brief with little romance for excuses. The division expects you to matter.',
    'Wrexham':'A story already travelling the world; the pressure is to keep the fairytale moving.',
    'Leicester City':'Recent glory still hangs over the rebuild. Promotion feels like the starting point, not the dream.',
    'Huddersfield Town':'A club that remembers impossible climbs; build belief early and the town will feel it.',
    'Luton Town':'Compact, awkward and full of punch-up spirit. Make the ground a weapon and it grows teeth.',
    'Reading':'A bruised rebuild where trust matters. Make the club feel stable and the upside opens.',
    'Bradford City':'A huge lower-league crowd can turn a run into a movement. Waste that support and it bites.',
    'Chesterfield':'A proper football-town challenge where organised growth could become much bigger than expected.',
    'Oldham Athletic':'A fallen name with scars and stubborn support. Even small progress feels like repair work.',
    'Swindon Town':'An ambitious rebuild with edge; the board wants movement and the supporters want a spark.',
    'Tranmere Rovers':'A Wirral job with old-school weight. Build a hard team and the climb feels authentic.',
    'Walsall':'A patient but proud club where smart steps matter and overachievement changes the save.',
    'Southend United':'A wounded seaside club with a big emotional upside. Stability alone would feel like a victory.',
    'Forest Green Rovers':'A distinctive project that needs direction again. Make the identity work and it becomes memorable.',
    'Hartlepool United':'A tough coastal rebuild with loyal noise behind it. Give them fight and they forgive plenty.',
    'Scunthorpe United':'A hard rescue job with little gloss. Every division climbed feels properly earned.',
    'Yeovil Town':'The brutal legacy save: tiny money, huge ceiling, and every good decision feels personal.'
  };
  function clubStory(club){ return CLUB_STORIES[club] || 'A local story with its own pressure, patience and mood.'; }
  function divLabel(c){ return c?.division === 'second' ? 'Second Division' : 'Top Division'; }
  function sourceText(c){ return c?.sourceLevel || (c?.division === 'second' ? 'Second Division' : 'Top Division'); }
  function pill(label, value, extra=''){
    return `<div class="stage13o-pill ${extra}"><strong>${esc(value)}</strong><small>${esc(label)}</small></div>`;
  }
  function boardPill(club){
    const p = personality(club);
    return `<div class="stage13o-board-pill stage13f-board-personality compact"><b>${esc(p.label)}</b><span>${esc(p.summary)}</span></div>`;
  }
  function cardHtml(c, selected){
    const p = careerProfile(c);
    const meta = `${divLabel(c)} · ${sourceText(c)} · Predicted finish: ${ordinalLocal(p.expected)}`;
    return `<button type="button" class="club-choice-card stage13o-club-card ${selected ? 'active' : ''}" role="option" aria-selected="${selected ? 'true' : 'false'}" data-club="${esc(c.club)}">
      <div class="stage13o-main club-choice-main">
        <div class="club-choice-name">${esc(c.club)}</div>
        <div class="club-choice-meta">${esc(meta)}</div>
        <div class="stage13o-story">${esc(clubStory(c.club))}</div>
      </div>
      <div class="stage13o-metrics">
        ${pill('Salary', fmtSalary(p.salary))}
        ${pill('Bonus route', p.bonus, 'wide')}
        ${pill('Pressure', p.pressure)}
      </div>
      ${boardPill(c.club)}
      <div class="club-choice-budget stage13o-budget"><strong>${moneyLocal(previewBudget(c.club))}</strong><span>Starting budget</span></div>
    </button>`;
  }
  function selectedHtml(c){
    const p = careerProfile(c);
    const meta = `${divLabel(c)} career · ${sourceText(c)} · Predicted finish: ${ordinalLocal(p.expected)}`;
    return `<div class="stage13o-selected-main">
      <b>${esc(c.club)}</b>
      <span>${esc(meta)}</span>
      <em>${esc(clubStory(c.club))}</em>
    </div>
    ${pill('Starting budget', moneyLocal(previewBudget(c.club)))}
    ${pill('Predicted finish', ordinalLocal(p.expected))}
    ${pill('Starting salary', fmtSalary(p.salary))}
    ${pill('Bonus route', p.bonus, 'wide')}
    ${pill('Pressure', p.pressure)}
    ${boardPill(c.club)}`;
  }
  function setLatestVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v => { v.textContent = VERSION; }); }catch(e){} }
  function injectStyles(){
    if(byId('stage13o-style')) return;
    const st = document.createElement('style');
    st.id = 'stage13o-style';
    st.textContent = `
      body.not-started .setup{max-width:1600px!important;width:100%!important;margin:0 auto!important;grid-template-columns:1fr!important;gap:10px!important;align-items:stretch!important;}
      body.not-started .setup .club-picker{max-width:1600px!important;width:100%!important;box-sizing:border-box!important;padding:12px 14px!important;border-radius:16px!important;background:rgba(120,166,255,.055)!important;}
      body.not-started #clubChoiceList.club-choice-list{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;max-width:none!important;min-height:220px!important;max-height:370px!important;overflow:auto!important;margin-top:10px!important;padding:0 6px 0 0!important;box-sizing:border-box!important;}
      body.not-started .stage9-division-picker{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin:8px 0 8px!important;}
      body.not-started .stage9-division-picker button{min-height:38px!important;border-radius:10px!important;font-weight:950!important;}
      body.not-started .club-choice-card.stage13o-club-card{display:grid!important;grid-template-columns:minmax(280px,1.45fr) minmax(320px,1.05fr) minmax(260px,.78fr) minmax(92px,.26fr)!important;align-items:center!important;gap:8px!important;min-height:58px!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;padding:8px 12px!important;margin:0 0 7px!important;border-radius:12px!important;text-align:left!important;overflow:hidden!important;}
      body.not-started .stage13o-main{min-width:0!important;overflow:hidden!important;}
      body.not-started .stage13o-main .club-choice-name{font-size:13px!important;line-height:1.05!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13o-main .club-choice-meta{font-size:8px!important;line-height:1.15!important;margin-top:2px!important;color:#aebbd1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13o-story{margin-top:2px!important;color:#ecd96e!important;font-size:8.4px!important;line-height:1.18!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13o-metrics{display:flex!important;gap:6px!important;flex-wrap:nowrap!important;min-width:0!important;align-items:center!important;overflow:hidden!important;}
      body.not-started .stage13o-pill{border:1px solid rgba(236,201,75,.28)!important;background:rgba(236,201,75,.07)!important;border-radius:999px!important;padding:5px 8px!important;min-width:0!important;box-sizing:border-box!important;color:#dce7f7!important;line-height:1!important;text-align:center!important;flex:1 1 0!important;overflow:hidden!important;}
      body.not-started .stage13o-pill.wide{flex:1.25 1 0!important;}
      body.not-started .stage13o-pill strong{display:block!important;color:#fff!important;font-size:9px!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13o-pill small{display:block!important;margin-top:2px!important;color:#9fb0cc!important;font-size:6.8px!important;font-weight:850!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13o-board-pill.stage13f-board-personality{display:block!important;justify-self:stretch!important;align-self:center!important;margin:0!important;border:1px solid rgba(168,85,247,.42)!important;background:linear-gradient(135deg,rgba(88,28,135,.26),rgba(15,23,42,.68))!important;border-radius:11px!important;padding:6px 8px!important;color:#efe7ff!important;line-height:1.1!important;min-width:0!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;text-align:left!important;overflow:hidden!important;grid-column:auto!important;}
      body.not-started .stage13o-board-pill b{display:block!important;font-size:9px!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;margin:0 0 2px!important;color:#fff!important;}
      body.not-started .stage13o-board-pill span{display:block!important;font-size:7px!important;color:#d8caff!important;font-weight:850!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13o-budget{align-self:center!important;justify-self:end!important;text-align:right!important;font-size:12px!important;min-width:0!important;max-width:100%!important;overflow:hidden!important;}
      body.not-started .stage13o-budget strong{display:block!important;font-size:13px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13o-budget span{display:block!important;font-size:7px!important;color:#aebbd1!important;line-height:1!important;margin-top:2px!important;white-space:nowrap!important;}
      body.not-started .club-choice-card .stage12c-club-career-strip,
      body.not-started .club-choice-card .stage13e-board-personality:not(.stage13o-board-pill),
      body.not-started .club-choice-card .stage13g-board-personality:not(.stage13o-board-pill),
      body.not-started .club-choice-card .stage13j-board-personality:not(.stage13o-board-pill),
      body.not-started .club-choice-card .stage13k-board-personality:not(.stage13o-board-pill){display:none!important;}
      body.not-started .selected-club-spot.active{display:grid!important;max-width:1600px!important;width:100%!important;margin:10px auto 0!important;grid-template-columns:minmax(270px,1.35fr) minmax(94px,.42fr) minmax(88px,.38fr) minmax(92px,.38fr) minmax(150px,.58fr) minmax(92px,.38fr) minmax(230px,.78fr)!important;gap:8px!important;align-items:center!important;box-sizing:border-box!important;overflow:hidden!important;padding:10px 12px!important;}
      body.not-started .stage13o-selected-main{min-width:0!important;overflow:hidden!important;}
      body.not-started .stage13o-selected-main b{display:block!important;color:#fff!important;font-size:13px!important;line-height:1.05!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13o-selected-main span{display:block!important;margin-top:2px!important;color:#aebbd1!important;font-size:8px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .stage13o-selected-main em{display:block!important;margin-top:2px!important;color:#ecd96e!important;font-size:8.4px!important;font-style:normal!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body.not-started .selected-club-spot .stage13o-board-pill{min-width:0!important;max-width:100%!important;}
      @media(max-width:1150px){
        body.not-started .club-choice-card.stage13o-club-card{grid-template-columns:minmax(0,1fr) minmax(250px,.9fr) minmax(210px,.7fr) minmax(88px,.28fr)!important;}
        body.not-started .selected-club-spot.active{grid-template-columns:minmax(0,1fr) repeat(3,minmax(82px,auto))!important;}
        body.not-started .selected-club-spot .stage13o-board-pill{grid-column:1/-1!important;}
      }
      @media(max-width:760px){
        body.not-started .setup .club-picker{padding:10px!important;}
        body.not-started .club-choice-card.stage13o-club-card{grid-template-columns:minmax(0,1fr) minmax(88px,auto)!important;grid-template-areas:'main budget' 'metrics metrics' 'board board'!important;min-height:0!important;padding:9px!important;gap:6px!important;}
        body.not-started .stage13o-main{grid-area:main!important;}
        body.not-started .stage13o-metrics{grid-area:metrics!important;flex-wrap:wrap!important;}
        body.not-started .stage13o-board-pill{grid-area:board!important;}
        body.not-started .stage13o-budget{grid-area:budget!important;}
        body.not-started .stage13o-main .club-choice-meta{white-space:normal!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;}
        body.not-started .stage13o-story{white-space:normal!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;}
        body.not-started .selected-club-spot.active{grid-template-columns:1fr!important;}
      }
    `;
    document.head.appendChild(st);
  }
  function ensurePicker(){
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
    picker.querySelectorAll('button[data-div]').forEach(btn => {
      const div = btn.getAttribute('data-div') === 'second' ? 'second' : 'top';
      btn.onclick = function(ev){
        ev.preventDefault();
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
  function renderSelected(club, clubs){
    const spot = byId('selectedClubSpot');
    if(!spot) return;
    const c = (clubs || []).find(x => x.club === club) || clubInfo(club);
    if(!c){ spot.classList.remove('active'); spot.innerHTML = ''; return; }
    spot.className = 'selected-club-spot active stage13o-selected-club';
    spot.innerHTML = selectedHtml(c);
  }
  function renderLandingClubChoices(){
    if(window.state && state.started) return;
    injectStyles();
    setLatestVersion();
    const list = byId('clubChoiceList');
    const select = byId('clubSelect');
    if(!list || !select) return;
    ensurePicker();
    const clubs = clubsForDivision(currentDivision());
    if(!clubs.length){
      list.innerHTML = '<div class="muted" style="padding:12px">Club list could not load. Reload the page and try again.</div>';
      renderSelected('', []);
      return;
    }
    const previous = select.value;
    select.innerHTML = clubs.map(c => `<option value="${esc(c.club)}">${esc(c.club)} · ${esc(divLabel(c))}</option>`).join('');
    select.value = clubs.some(c => c.club === previous) ? previous : clubs[0].club;
    const selected = select.value;
    list.innerHTML = clubs.map(c => cardHtml(c, c.club === selected)).join('');
    list.querySelectorAll('.stage13o-club-card').forEach(btn => {
      btn.onclick = function(ev){
        ev.preventDefault();
        if(window.state && state.started) return;
        const club = this.getAttribute('data-club') || select.value;
        select.value = club;
        renderLandingClubChoices();
      };
    });
    renderSelected(selected, clubs);
    setLatestVersion();
  }
  function bindSelect(){
    const select = byId('clubSelect');
    if(!select || select.getAttribute('data-stage13o-bound') === '1') return;
    select.setAttribute('data-stage13o-bound','1');
    select.addEventListener('change', function(){ if(window.state && state.started){ select.value = state.humanClub || select.value; return; } renderLandingClubChoices(); });
  }
  function boot(){
    injectStyles();
    setLatestVersion();
    bindSelect();
    if(typeof window.XVII_STAGE9_LANDING_DIVISION === 'undefined') setDivision('top');
    try{ window.renderClubChoiceList = renderLandingClubChoices; renderClubChoiceList = renderLandingClubChoices; }catch(e){}
    if(document.body && document.body.classList.contains('not-started')) renderLandingClubChoices();
    setTimeout(()=>{ try{ renderLandingClubChoices(); }catch(e){} }, 60);
    setTimeout(()=>{ try{ renderLandingClubChoices(); }catch(e){} }, 430);
    setTimeout(setLatestVersion, 900);
  }
  const oldRender = typeof window.render === 'function' ? window.render : null;
  if(oldRender && !window.__stage13oRenderPatch){
    window.__stage13oRenderPatch = true;
    window.render = function(){ const out = oldRender.apply(this, arguments); try{ boot(); }catch(e){} return out; };
    try{ render = window.render; }catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
