/* Stage 9A division selector patch. Extracted unchanged. */

(function(){
  if(window.__stage9aDivisionSelectorPatch) return;
  window.__stage9aDivisionSelectorPatch = true;
  window.XVII_STAGE9_LANDING_DIVISION = 'top';
  function ensurePicker(){
    const list = window.el ? el('clubChoiceList') : document.getElementById('clubChoiceList');
    if(!list || document.getElementById('stage9DivisionPicker')) return;
    const picker=document.createElement('div');
    picker.id='stage9DivisionPicker';
    picker.className='stage9-division-picker';
    picker.innerHTML='<button type="button" data-div="top">Top Division</button><button type="button" data-div="second">Second Division</button>';
    list.parentNode.insertBefore(picker, list);
    picker.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
      if(window.state && state.started) return;
      window.XVII_STAGE9_LANDING_DIVISION = btn.getAttribute('data-div') || 'top';
      const clubs = XVII_STAGE9_ALL_PLAYABLE_CLUBS.filter(c=>c.division===window.XVII_STAGE9_LANDING_DIVISION).sort((a,b)=>Number(b.budget||0)-Number(a.budget||0)||a.club.localeCompare(b.club));
      const select = el('clubSelect');
      if(select && clubs[0]) select.value = clubs[0].club;
      renderClubChoiceList();
    }));
  }
  function syncPicker(){
    const picker=document.getElementById('stage9DivisionPicker');
    if(!picker) return;
    picker.querySelectorAll('button').forEach(btn=>{
      const active = btn.getAttribute('data-div') === window.XVII_STAGE9_LANDING_DIVISION;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active?'true':'false');
    });
  }
  const style=document.createElement('style');
  style.textContent='.stage9-division-picker{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0 6px}.stage9-division-picker button{min-height:34px;background:rgba(255,255,255,.08);color:var(--text);border:1px solid var(--line)}.stage9-division-picker button.active{background:var(--good);color:#06140f;border-color:transparent}@media(max-width:700px){.stage9-division-picker{grid-template-columns:1fr}.stage9-division-picker button{min-height:38px}}';
  document.head.appendChild(style);
  window.renderClubChoiceList = function(){
    const list=el('clubChoiceList'), select=el('clubSelect');
    if(!list || !select) return;
    ensurePicker();
    const clubs=[...XVII_STAGE9_ALL_PLAYABLE_CLUBS].filter(c=>c.division===window.XVII_STAGE9_LANDING_DIVISION).sort((a,b)=>Number(b.budget||0)-Number(a.budget||0) || a.club.localeCompare(b.club));
    const current=select.value || clubs[0]?.club || '';
    select.innerHTML=clubs.map(c=>`<option value="${escapeHtml(c.club)}">${escapeHtml(c.club)} · ${escapeHtml(c.division==='second'?'Second Division':'Top Division')}</option>`).join('');
    if(clubs.some(c=>c.club===current)) select.value=current; else if(clubs[0]) select.value=clubs[0].club;
    syncPicker();
    const selected=select.value;
    const topMap=stage9AllExpectationMapFor(XVII_STAGE9_TOP_DIVISION_CLUBS);
    const secondMap=stage9AllExpectationMapFor(XVII_STAGE9_SECOND_DIVISION_CLUBS);
    list.innerHTML=clubs.map(c=>{
      const active=c.club===selected;
      const div=c.division==='second'?'Second Division':'Top Division';
      const map=c.division==='second'?secondMap:topMap;
      const source=c.sourceLevel || (c.division==='top'?'Top Division':'');
      return `<button type="button" class="club-choice-card ${active?'active':''}" role="option" aria-selected="${active?'true':'false'}" data-club="${escapeHtml(c.club)}"><div><div class="club-choice-name">${escapeHtml(c.club)}</div><div class="club-choice-meta">${escapeHtml(div)}${source?' · '+escapeHtml(source):''} · Predicted finish: ${ordinal(map[c.club] || 20)}</div></div><div class="club-choice-budget">${money(stage9PreviewBudgetForClub(c.club))}<span>Starting budget</span></div></button>`;
    }).join('');
    const spot=el('selectedClubSpot');
    const c=clubs.find(x=>x.club===selected);
    if(spot && c){
      const map=c.division==='second'?secondMap:topMap;
      spot.classList.add('active');
      spot.innerHTML=`<div><b>${escapeHtml(c.club)}</b><span>${escapeHtml(c.division==='second'?'Second Division':'Top Division')} career · ${escapeHtml(c.role||'')}</span></div><div class="selected-club-pill"><strong>${money(stage9PreviewBudgetForClub(c.club))}</strong><small>Starting budget</small></div><div class="selected-club-pill"><strong>${ordinal(map[c.club] || 20)}</strong><small>Predicted finish</small></div>`;
    }
    list.querySelectorAll('.club-choice-card').forEach(btn=>{ btn.addEventListener('click', function(){ if(state && state.started) return; select.value=this.getAttribute('data-club') || select.value; renderClubChoiceList(); }); });
  };
  if(document.body.classList.contains('not-started')) renderClubChoiceList();
})();
