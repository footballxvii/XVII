/* Stage 12F: mobile backroom collapse fix.
   Keeps the Backroom staff panel available after selecting a training package while the panel is minimised on mobile. */
(function(){
  const VERSION='Version 12F · Beta';
  const COLLAPSE_KEYS=[
    'xvii_stage12f_collapsed_panels_v1',
    'xvii_stage10e_collapsed_panels_v1',
    'xvii_stage10d_collapsed_panels_v1',
    'xvii_stage10c_collapsed_panels_v1'
  ];

  function el(id){ try{return document.getElementById(id);}catch(e){return null;} }
  function esc(s){
    try{ if(typeof escapeHtml==='function') return escapeHtml(s); }catch(e){}
    return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function readMap(key){ try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){return {};} }
  function writeMap(key,map){ try{localStorage.setItem(key, JSON.stringify(map||{}));}catch(e){} }
  function collapsedValue(id){
    for(const k of COLLAPSE_KEYS){
      const m=readMap(k);
      if(Object.prototype.hasOwnProperty.call(m,id)) return !!m[id];
    }
    return false;
  }
  function setCollapsedValue(id,value){
    COLLAPSE_KEYS.forEach(k=>{
      const m=readMap(k);
      m[id]=!!value;
      writeMap(k,m);
    });
  }

  function ensureStyles(){
    if(el('stage12f-style')) return;
    const style=document.createElement('style');
    style.id='stage12f-style';
    style.textContent=`
      #backroomPanel.stage12f-protected{display:block!important;visibility:visible!important;opacity:1!important;}
      #backroomPanel.stage12f-protected > .xvii-collapse-head{display:flex!important;}
      #backroomPanel.stage12f-protected.xvii-collapsed > .xvii-collapse-body{display:none!important;}
      #backroomPanel.stage12f-protected .xvii-collapse-toggle{min-width:34px!important;}
      @media (max-width:700px){
        #backroomPanel.stage12f-protected{margin-left:6px!important;margin-right:6px!important;width:auto!important;max-width:none!important;}
        #backroomPanel.stage12f-protected > .xvii-collapse-head{position:relative!important;z-index:2!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function syncButton(panel,btn){
    if(!panel || !btn) return;
    const collapsed=panel.classList.contains('xvii-collapsed');
    btn.textContent=collapsed?'+':'−';
    btn.setAttribute('aria-expanded', collapsed?'false':'true');
  }

  function repairCollapsiblePanel(id,title){
    ensureStyles();
    const panel=el(id);
    if(!panel) return null;

    panel.classList.add('xvii-mobile-collapsible');
    if(id==='backroomPanel') panel.classList.add('stage12f-protected');

    let head=panel.querySelector(':scope > .xvii-collapse-head');
    let body=panel.querySelector(':scope > .xvii-collapse-body');

    if(!head){
      head=document.createElement('div');
      head.className='xvii-collapse-head';
      head.innerHTML=`<div class="xvii-collapse-title">${esc(title)}</div><button class="secondary xvii-collapse-toggle" type="button" aria-label="Toggle ${esc(title)}">−</button>`;
      panel.insertBefore(head, panel.firstChild);
    }

    if(!body){
      body=document.createElement('div');
      body.className='xvii-collapse-body';
      const children=[...panel.childNodes].filter(ch=>ch!==head);
      children.forEach(ch=>body.appendChild(ch));
      panel.appendChild(body);
    }else{
      const loose=[...panel.childNodes].filter(ch=>ch!==head && ch!==body);
      loose.forEach(ch=>body.appendChild(ch));
    }

    // If a render left the body empty, rebuild the panel content from the core renderer, then wrap it again.
    if(id==='backroomPanel' && !body.textContent.trim() && typeof window.renderBackroomPanel==='function'){
      try{ window.renderBackroomPanel(); }catch(e){}
      return repairCollapsiblePanel(id,title);
    }

    const shouldCollapse=collapsedValue(id);
    panel.classList.toggle('xvii-collapsed', shouldCollapse);

    let btn=head.querySelector('.xvii-collapse-toggle');
    if(btn && btn.dataset.stage12fBound!=='1'){
      const clone=btn.cloneNode(true);
      clone.dataset.stage12fBound='1';
      btn.replaceWith(clone);
      btn=clone;
      btn.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof ev.stopImmediatePropagation==='function') ev.stopImmediatePropagation();
        panel.classList.toggle('xvii-collapsed');
        setCollapsedValue(id, panel.classList.contains('xvii-collapsed'));
        syncButton(panel, btn);
      }, true);
    }
    syncButton(panel,btn);
    return panel;
  }

  function repairBackroomAndTraining(){
    repairCollapsiblePanel('trainingPanel','Training');
    repairCollapsiblePanel('backroomPanel','Backroom staff');
    document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; });
  }

  function openBackroomIfStillEmpty(){
    const panel=repairCollapsiblePanel('backroomPanel','Backroom staff');
    if(!panel || !window.state || state.season || state.completed) return;
    const assistant=Number(state.assistantTier||0);
    const scout=Number(state.scoutingTier||0);
    if(assistant===0 && scout===0){
      // Training choices trigger a render. If backroom had been minimised, reopen it so mobile users are not accidentally forced into the season without staff.
      panel.classList.remove('xvii-collapsed');
      setCollapsedValue('backroomPanel', false);
      const btn=panel.querySelector(':scope > .xvii-collapse-head .xvii-collapse-toggle');
      syncButton(panel,btn);
    }
  }

  const oldSetTraining = window.setTrainingTier;
  if(typeof oldSetTraining==='function' && !window.__stage12fTrainingPatch){
    window.__stage12fTrainingPatch=true;
    window.setTrainingTier=function(){
      const out=oldSetTraining.apply(this, arguments);
      setTimeout(()=>{ repairBackroomAndTraining(); openBackroomIfStillEmpty(); },0);
      setTimeout(()=>{ repairBackroomAndTraining(); openBackroomIfStillEmpty(); },80);
      return out;
    };
  }

  const oldRender = window.render;
  if(typeof oldRender==='function' && !window.__stage12fRenderPatch){
    window.__stage12fRenderPatch=true;
    window.render=function(){
      const out=oldRender.apply(this, arguments);
      setTimeout(repairBackroomAndTraining,0);
      return out;
    };
  }

  function boot(){
    repairBackroomAndTraining();
    setTimeout(repairBackroomAndTraining,60);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setInterval(repairBackroomAndTraining, 2200);
})();