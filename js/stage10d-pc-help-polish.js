/* Stage 10D: desktop/mobile collapse polish, guide placement, transfer-rules repair and footer restart safety. */
(function(){
  'use strict';

  const STAGE10D = {
    name: 'Stage 10D',
    collapsedKey: 'xvii_stage10d_collapsed_panels_v1'
  };

  function safeEl(id){ return (typeof el === 'function') ? el(id) : document.getElementById(id); }
  function esc(x){ return (typeof escapeHtml === 'function') ? escapeHtml(String(x ?? '')) : String(x ?? '').replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function readCollapsed(){ try{ return JSON.parse(localStorage.getItem(STAGE10D.collapsedKey)||'{}') || {}; }catch(e){ return {}; } }
  function writeCollapsed(map){ try{ localStorage.setItem(STAGE10D.collapsedKey, JSON.stringify(map||{})); }catch(e){} }

  function injectStyle(){
    if(document.getElementById('stage10d-style')) return;
    const style=document.createElement('style');
    style.id='stage10d-style';
    style.textContent = `
      /* Desktop can now use the same minimise controls as mobile. */
      @media (min-width:701px){
        .xvii-collapse-head{display:flex!important;align-items:center;justify-content:space-between;gap:8px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:rgba(255,255,255,.045);padding:7px 8px;margin-bottom:6px;}
        .xvii-mobile-collapsible.xvii-collapsed > .xvii-collapse-body,
        .xvii-mobile-collapsible.xvii-collapsed > .stage10d-collapse-body{display:none!important;}
        .xvii-mobile-collapsible.xvii-collapsed{padding-bottom:7px!important;}
      }
      @media (max-width:700px){
        .xvii-mobile-collapsible.xvii-collapsed > .xvii-collapse-body,
        .xvii-mobile-collapsible.xvii-collapsed > .stage10d-collapse-body{display:none!important;}
        .xvii-mobile-collapsible.xvii-collapsed{padding-bottom:7px!important;}
        .challenge-panel.xvii-collapsed,.league-table-box.xvii-collapsed{padding-bottom:7px!important;}
      }
      .xvii-mobile-collapsible.xvii-collapsed > .rules-text,
      #transferRulesPanel.xvii-collapsed > .rules-text{display:none!important;}
      #transferRulesPanel.xvii-collapsed > .xvii-collapse-body{display:none!important;}
      .xvii-collapse-title{min-width:0;}
      .league-table-box.xvii-collapsed .desktop-sim-row,
      .league-table-box.xvii-collapsed .mobile-sim-row{display:grid!important;}
      .league-table-box .stage10d-league-tools{display:grid;gap:5px;margin-bottom:6px;}
      .league-table-box .stage10d-collapse-body{min-width:0;}
      #simJanuarySafetyBtnDesktop,#simJanuaryBtnDesktop{min-height:34px!important;height:34px!important;font-size:10px!important;display:flex;align-items:center;justify-content:center;}
      #simJanuarySafetyBtn,#simJanuaryBtnMobile{min-height:40px!important;height:40px!important;font-size:10px!important;display:flex;align-items:center;justify-content:center;}
      .desktop-sim-row.sim-january-row{align-items:stretch!important;}
      .restart-footer-inner.stage10d-footer-safe{grid-template-columns:minmax(0,1fr) auto auto;}
      #restartSafetyBtnFooter{min-height:38px;}
      @media (max-width:700px){
        .restart-footer-inner.stage10d-footer-safe{display:grid;grid-template-columns:1fr 1fr!important;text-align:left;}
        .restart-footer-inner.stage10d-footer-safe > div:first-child{grid-column:1 / -1;}
        #restartSafetyBtnFooter,#rerollBtnFooter{width:100%;min-height:38px;}
      }

      /* Desktop guide is part of the page, above copyright. Mobile keeps the useful fixed guide. */
      @media (min-width:701px){
        .xvii-help-widget{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;z-index:auto!important;pointer-events:auto!important;display:flex!important;justify-content:center!important;max-width:1900px!important;margin:8px auto 0!important;padding:0 8px!important;}
        .xvii-help-card{width:100%!important;max-width:1180px!important;max-height:none!important;box-shadow:0 12px 34px rgba(0,0,0,.26)!important;}
        .xvii-help-body{max-height:520px!important;}
        .stage10d-jump-fixture{display:none!important;}
      }
      @media (max-width:700px){
        .stage10d-jump-fixture{display:inline-flex!important;align-items:center;justify-content:center;min-height:30px!important;padding:0 8px!important;font-size:9px!important;white-space:nowrap;}
        .xvii-help-head{gap:6px!important;}
        .xvii-help-head > div{min-width:0;}
      }
    `;
    document.head.appendChild(style);
  }

  function setPublicVersionText(){
    document.title = 'XVII | Build the seventeen. Pick the eleven.';
    document.querySelectorAll('.brand-db').forEach(n=>{ n.textContent='25/26 League Database + European Pool + Second Division'; });
    const legal=safeEl('xviiLegalFooter');
    if(legal && !document.getElementById('xviiVersionNote')){
      const note=document.createElement('div');
      note.id='xviiVersionNote';
      note.className='xvii-version-note';
      note.textContent='Version 13U · Beta';
      const inner=legal.querySelector('div') || legal;
      inner.appendChild(note);
    }else{
      const note=document.getElementById('xviiVersionNote');
      if(note) note.textContent='Version 13U · Beta';
    }
  }

  function ensureHelpPlacementAndJump(){
    injectStyle();
    const widget=safeEl('xviiHelpWidget');
    const legal=safeEl('xviiLegalFooter');
    const main=document.querySelector('main.app');
    if(widget && legal && main && widget.parentNode!==main){
      main.insertBefore(widget, legal);
    }else if(widget && legal && widget.nextElementSibling!==legal){
      main?.insertBefore(widget, legal);
    }
    if(widget && !safeEl('stage10dJumpFixture')){
      const btn=document.createElement('button');
      btn.id='stage10dJumpFixture';
      btn.type='button';
      btn.className='secondary stage10d-jump-fixture';
      btn.textContent='Jump to fixture';
      btn.addEventListener('click', function(ev){
        ev.preventDefault(); ev.stopPropagation();
        const target=safeEl('playRoundBtnMobile') || safeEl('playRoundBtn') || safeEl('nextFixture') || document.querySelector('.team-selection-box');
        if(target) target.scrollIntoView({behavior:'smooth', block:'center'});
      });
      const toggle=widget.querySelector('.xvii-help-toggle');
      if(toggle) toggle.insertAdjacentElement('beforebegin', btn);
    }
  }

  function makePanelCollapsible(node, key, title){
    if(!node) return;
    injectStyle();
    node.classList.add('xvii-mobile-collapsible');
    const saved=readCollapsed();
    if(saved[key]) node.classList.add('xvii-collapsed');
    let head=node.querySelector(':scope > .xvii-collapse-head');
    if(!head){
      head=document.createElement('div');
      head.className='xvii-collapse-head';
      head.innerHTML=`<div class="xvii-collapse-title">${esc(title)}</div><button class="secondary xvii-collapse-toggle" type="button" aria-label="Toggle ${esc(title)}">${node.classList.contains('xvii-collapsed')?'+':'−'}</button>`;
      node.insertBefore(head, node.firstChild);
    }
    const btn=head.querySelector('.xvii-collapse-toggle');
    if(btn && !btn.dataset.stage10dClick){
      btn.dataset.stage10dClick='1';
      btn.addEventListener('click', function(ev){
        ev.preventDefault(); ev.stopPropagation();
        node.classList.toggle('xvii-collapsed');
        const now=readCollapsed();
        now[key]=node.classList.contains('xvii-collapsed');
        writeCollapsed(now);
        this.textContent=node.classList.contains('xvii-collapsed')?'+':'−';
      });
    }
    if(btn) btn.textContent=node.classList.contains('xvii-collapsed')?'+':'−';
  }

  function repairGenericBody(node){
    if(!node) return;
    const head=node.querySelector(':scope > .xvii-collapse-head');
    if(!head) return;
    let body=node.querySelector(':scope > .xvii-collapse-body');
    if(!body){
      body=document.createElement('div');
      body.className='xvii-collapse-body';
      const children=[...node.childNodes].filter(ch=>ch!==head);
      children.forEach(ch=>body.appendChild(ch));
      node.appendChild(body);
    }
  }

  function repairTransferRules(){
    const rules=document.querySelector('.rules') || safeEl('transferRulesPanel');
    if(!rules) return;
    rules.id='transferRulesPanel';
    makePanelCollapsible(rules, 'transferRulesPanel', 'Transfer rules');
    const head=rules.querySelector(':scope > .xvii-collapse-head');
    let body=rules.querySelector(':scope > .xvii-collapse-body');
    if(!body){
      body=document.createElement('div');
      body.className='xvii-collapse-body';
      const children=[...rules.childNodes].filter(ch=>ch!==head);
      children.forEach(ch=>body.appendChild(ch));
      rules.appendChild(body);
    }else{
      const loose=[...rules.childNodes].filter(ch=>ch!==head && ch!==body);
      loose.forEach(ch=>body.appendChild(ch));
    }
  }

  function repairLeagueTableCollapse(){
    const tableBox=safeEl('tableRows')?.closest('.league-table-box');
    if(!tableBox) return;
    makePanelCollapsible(tableBox, 'leagueTablePanel', 'League table');
    const head=tableBox.querySelector(':scope > .xvii-collapse-head');
    if(!head) return;
    const simRows=[safeEl('desktopSimRow'),safeEl('desktopSimJanuaryRow'),safeEl('mobileSimRow'),safeEl('mobileSimJanuaryRow')].filter(Boolean);
    let body=tableBox.querySelector(':scope > .stage10d-collapse-body');
    if(!body){
      body=document.createElement('div');
      body.className='stage10d-collapse-body';
      tableBox.appendChild(body);
    }
    // Pull sim controls out of any old collapse body so they stay visible when the table is minimised.
    simRows.forEach(row=>{
      if(row.parentNode!==tableBox) tableBox.insertBefore(row, body);
    });
    const children=[...tableBox.childNodes].filter(ch=>ch!==head && ch!==body && !simRows.includes(ch));
    children.forEach(ch=>body.appendChild(ch));
    // Desktop controls should sit under the minimise head; mobile controls keep their CSS placement.
    const desktopJan=safeEl('desktopSimJanuaryRow');
    const desktopSim=safeEl('desktopSimRow');
    if(desktopSim && desktopSim.parentNode===tableBox) tableBox.insertBefore(desktopSim, body);
    if(desktopJan && desktopJan.parentNode===tableBox) tableBox.insertBefore(desktopJan, body);
    const mobileSim=safeEl('mobileSimRow');
    const mobileJan=safeEl('mobileSimJanuaryRow');
    if(mobileSim && mobileSim.parentNode===tableBox) tableBox.insertBefore(mobileSim, body);
    if(mobileJan && mobileJan.parentNode===tableBox) tableBox.insertBefore(mobileJan, body);
  }

  function applyExtraCollapsibles(){
    const panels=[
      [safeEl('trainingPanel'), 'trainingPanel', 'Training'],
      [safeEl('backroomPanel'), 'backroomPanel', 'Backroom staff'],
      [safeEl('managerNotesPanel'), 'managerNotesPanel', 'Manager notes'],
      [safeEl('boardFanPanel'), 'boardFanPanel', 'Board and fans'],
      [safeEl('managerCareerPanel'), 'managerCareerPanel', 'Manager career'],
      [safeEl('mentalityPanel'), 'mentalityPanel', 'Mentality'],
      [safeEl('challengePanel'), 'challengePanel', 'Season challenges'],
      [safeEl('windowActivity')?.closest('.market-activity-panel'), 'windowActivityPanel', 'Transfer activity'],
      [safeEl('log')?.closest('.transaction-log'), 'transactionLogPanel', 'Transaction log'],
      [safeEl('squadNews')?.closest('.squad-news-box'), 'squadNewsPanel', 'Squad news'],
      [safeEl('matchSquadNews')?.closest('.match-squad-news-box'), 'matchSquadNewsPanel', 'Match squad news'],
      [safeEl('clubInfoBottom'), 'clubInfoBottom', 'Club info'],
      [safeEl('badgeBoardBottom'), 'badgeBoardBottom', 'Badge board'],
      [safeEl('preSeasonArchive'), 'preSeasonArchive', 'Pre-season archive'],
      [safeEl('analyticsDepartment'), 'analyticsDepartment', 'Analytics Department']
    ];
    panels.forEach(([node,key,title])=>{
      if(!node) return;
      makePanelCollapsible(node,key,title);
      // Keep league table and transfer rules on their custom wrappers; generic panels can use the normal body wrapper.
      if(node.id!=='transferRulesPanel' && !node.classList.contains('league-table-box')) repairGenericBody(node);
    });
    repairTransferRules();
    repairLeagueTableCollapse();
  }

  function addFooterRestartSafety(){
    const footer=safeEl('mobileRestartFooter');
    const inner=footer?.querySelector('.restart-footer-inner');
    const restart=safeEl('rerollBtnFooter');
    if(!inner || !restart) return;
    inner.classList.add('stage10d-footer-safe');
    let safety=safeEl('restartSafetyBtnFooter');
    if(!safety){
      safety=document.createElement('button');
      safety.id='restartSafetyBtnFooter';
      safety.type='button';
      safety.className='secondary';
      safety.textContent='Safety on';
      restart.insertAdjacentElement('beforebegin', safety);
      safety.addEventListener('click', function(ev){
        ev.preventDefault();
        if(typeof window.toggleRestartSafety === 'function') window.toggleRestartSafety();
        if(typeof window.updateRestartSafety === 'function') window.updateRestartSafety();
        updateFooterRestartSafety();
      });
    }
    updateFooterRestartSafety();
  }

  function updateFooterRestartSafety(){
    const safety=safeEl('restartSafetyBtnFooter');
    const restart=safeEl('rerollBtnFooter');
    if(!safety || !restart) return;
    const started=!!(window.state && window.state.started);
    const armed=restart.classList.contains('armed') || (started && !restart.disabled);
    safety.disabled=!started;
    safety.textContent=armed ? 'Restart unlocked' : 'Safety on';
    safety.classList.toggle('danger', armed);
    safety.classList.toggle('secondary', !armed);
  }

  function bridgeRestartSafetyUpdate(){
    if(window.__stage10dRestartBridge) return;
    window.__stage10dRestartBridge=true;
    const oldUpdate=window.updateRestartSafety;
    if(typeof oldUpdate === 'function'){
      window.updateRestartSafety=function(){
        const out=oldUpdate.apply(this, arguments);
        updateFooterRestartSafety();
        return out;
      };
    }
  }

  function runPolish(){
    injectStyle();
    setPublicVersionText();
    ensureHelpPlacementAndJump();
    applyExtraCollapsibles();
    addFooterRestartSafety();
    bridgeRestartSafetyUpdate();
    updateFooterRestartSafety();
  }

  const previousRender=(typeof window.render === 'function') ? window.render : null;
  if(previousRender && !window.__stage10dRenderPatched){
    window.__stage10dRenderPatched=true;
    window.render=function(){
      const out=previousRender.apply(this, arguments);
      runPolish();
      return out;
    };
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>{ runPolish(); if(typeof window.render==='function') window.render(); });
  else { runPolish(); if(typeof window.render==='function') window.render(); }
})();
