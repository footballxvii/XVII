/* Stage 10E: collapse button hotfix.
   Fixes double-bound minimise buttons from Stage 10C/10D so panels can open/close on both desktop and mobile. */
(function(){
  'use strict';

  const STAGE10E = {
    name: 'Stage 10E',
    collapsedKey: 'xvii_stage10e_collapsed_panels_v1'
  };

  function safeEl(id){ return (typeof el === 'function') ? el(id) : document.getElementById(id); }
  function readMap(key){ try{ return JSON.parse(localStorage.getItem(key)||'{}') || {}; }catch(e){ return {}; } }
  function writeMap(key, map){ try{ localStorage.setItem(key, JSON.stringify(map||{})); }catch(e){} }
  function panelKey(panel){
    if(!panel) return 'unknown';
    if(panel.id) return panel.id;
    const title = panel.querySelector(':scope > .xvii-collapse-head .xvii-collapse-title')?.textContent?.trim();
    if(title) return title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'panel';
    return 'panel-' + ([...document.querySelectorAll('.xvii-mobile-collapsible')].indexOf(panel)+1);
  }
  function readCollapsed(){
    const out = readMap(STAGE10E.collapsedKey);
    // Bring forward existing collapsed choices from 10C/10D so the hotfix respects current user state.
    Object.assign(out, readMap('xvii_stage10c_collapsed_panels_v1'));
    Object.assign(out, readMap('xvii_stage10d_collapsed_panels_v1'));
    return out;
  }
  function writeCollapsedValue(key, value){
    const maps = [
      STAGE10E.collapsedKey,
      'xvii_stage10c_collapsed_panels_v1',
      'xvii_stage10d_collapsed_panels_v1'
    ];
    maps.forEach(storageKey=>{
      const map = readMap(storageKey);
      map[key] = !!value;
      writeMap(storageKey, map);
    });
  }

  function injectStyle(){
    if(document.getElementById('stage10e-style')) return;
    const style = document.createElement('style');
    style.id = 'stage10e-style';
    style.textContent = `
      .xvii-mobile-collapsible.xvii-collapsed > .xvii-collapse-body,
      .xvii-mobile-collapsible.xvii-collapsed > .stage10d-collapse-body,
      .xvii-mobile-collapsible.xvii-collapsed > .rules-text,
      #transferRulesPanel.xvii-collapsed > .xvii-collapse-body,
      #transferRulesPanel.xvii-collapsed > .rules-text{display:none!important;}
      .xvii-collapse-toggle{min-width:34px!important;}
      .xvii-collapse-head{cursor:default;}
      .league-table-box.xvii-collapsed .desktop-sim-row,
      .league-table-box.xvii-collapsed .mobile-sim-row{display:grid!important;}
    `;
    document.head.appendChild(style);
  }

  function syncButton(panel, btn){
    if(!panel || !btn) return;
    btn.textContent = panel.classList.contains('xvii-collapsed') ? '+' : '−';
    btn.setAttribute('aria-expanded', panel.classList.contains('xvii-collapsed') ? 'false' : 'true');
  }

  function hardBindCollapseButton(panel){
    if(!panel) return;
    const head = panel.querySelector(':scope > .xvii-collapse-head');
    const oldBtn = head?.querySelector('.xvii-collapse-toggle');
    if(!head || !oldBtn) return;

    const key = panelKey(panel);
    const saved = readCollapsed();
    if(Object.prototype.hasOwnProperty.call(saved, key)){
      panel.classList.toggle('xvii-collapsed', !!saved[key]);
    }

    // Stage 10C and 10D both attached click listeners to some of the same buttons.
    // Replacing the button removes those old listeners and leaves one reliable handler.
    let btn = oldBtn;
    if(btn.dataset.stage10eBound !== '1'){
      const clone = btn.cloneNode(true);
      clone.dataset.stage10eBound = '1';
      clone.removeAttribute('data-stage10c-click');
      clone.removeAttribute('data-stage10d-click');
      btn.replaceWith(clone);
      btn = clone;
      btn.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
        panel.classList.toggle('xvii-collapsed');
        writeCollapsedValue(key, panel.classList.contains('xvii-collapsed'));
        syncButton(panel, btn);
      }, true);
    }
    syncButton(panel, btn);
  }

  function repairAllCollapseButtons(){
    injectStyle();
    document.querySelectorAll('.xvii-mobile-collapsible').forEach(hardBindCollapseButton);
    // Some boxes have the head but missed the shared class after render rewrites.
    document.querySelectorAll('.xvii-collapse-head').forEach(head=>{
      const panel = head.parentElement;
      if(panel){ panel.classList.add('xvii-mobile-collapsible'); hardBindCollapseButton(panel); }
    });
  }

  function fixFooterVersion(){
    document.title = 'XVII | Build the seventeen. Pick the eleven.';
    const version = document.querySelector('.xvii-version-note') || safeEl('xviiVersionNote');
    if(version) version.textContent = 'Version 13T · Beta';
  }

  function runHotfix(){
    repairAllCollapseButtons();
    fixFooterVersion();
  }

  const previousRender = (typeof window.render === 'function') ? window.render : null;
  if(previousRender && !window.__stage10eRenderPatched){
    window.__stage10eRenderPatched = true;
    window.render = function(){
      const out = previousRender.apply(this, arguments);
      setTimeout(runHotfix, 0);
      return out;
    };
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ runHotfix(); setTimeout(runHotfix, 50); });
  }else{
    runHotfix();
    setTimeout(runHotfix, 50);
  }
})();
