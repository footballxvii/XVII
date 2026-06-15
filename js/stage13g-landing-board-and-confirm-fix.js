/* Stage 13G: landing card board personality layout and 51% owner confirm button fix. */
(function(){
  if(window.__stage13gLandingBoardConfirmFix) return;
  window.__stage13gLandingBoardConfirmFix=true;

  const VERSION='Version 13V · Beta';
  function el(id){ return document.getElementById(id); }
  function esc(s){
    if(typeof escapeHtml==='function') return escapeHtml(s);
    return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function setStatusSafe(msg,type){ try{ if(typeof setStatus==='function') setStatus(msg,type); }catch(e){} }
  function renderSafe(){ try{ if(typeof render==='function') render(); }catch(e){} }
  function personality(club){
    try{ if(typeof stage13eBoardPersonality==='function') return stage13eBoardPersonality(club); }catch(e){}
    return {label:'Balanced board',summary:'A conventional board with no strong bias.'};
  }
  function personalityHtml(club){
    const p=personality(club);
    return `<div class="stage13g-board-personality stage13f-board-personality compact" data-stage13g-board="1"><b>${esc(p.label)}</b><span>${esc(p.summary)}</span></div>`;
  }
  function injectStyles(){
    if(el('stage13g-style')) return;
    const st=document.createElement('style');
    st.id='stage13g-style';
    st.textContent=`
      .club-choice-card{grid-template-columns:minmax(0,1fr) minmax(118px,34%) auto!important; align-items:center!important; column-gap:7px!important;}
      .club-choice-card .stage13f-board-personality,.club-choice-card .stage13g-board-personality{grid-column:auto!important; justify-self:stretch!important; align-self:center!important; margin:0!important; padding:5px 6px!important; min-width:0!important; max-width:none!important; line-height:1.18!important;}
      .club-choice-card .stage13f-board-personality b,.club-choice-card .stage13g-board-personality b{display:block!important; margin:0 0 1px!important; font-size:8px!important; line-height:1.1!important; white-space:nowrap!important; overflow:hidden!important; text-overflow:ellipsis!important;}
      .club-choice-card .stage13f-board-personality span,.club-choice-card .stage13g-board-personality span{display:block!important; font-size:7.2px!important; line-height:1.15!important; white-space:nowrap!important; overflow:hidden!important; text-overflow:ellipsis!important; color:#d8caff!important;}
      .club-choice-card .club-choice-budget{grid-column:auto!important; align-self:center!important;}
      .stage13g-confirm-note{margin-top:6px;padding:7px 8px;border-radius:10px;border:1px solid rgba(51,214,159,.30);background:rgba(51,214,159,.10);color:#d9fff4;font-size:9px;line-height:1.35;}
      @media(max-width:700px){
        .club-choice-card{grid-template-columns:minmax(0,1fr) minmax(108px,36%) auto!important; gap:6px!important; padding:8px 9px!important;}
        .club-choice-card .stage13f-board-personality,.club-choice-card .stage13g-board-personality{padding:4px 5px!important;border-radius:8px!important;}
        .club-choice-card .stage13f-board-personality b,.club-choice-card .stage13g-board-personality b{font-size:7.5px!important;}
        .club-choice-card .stage13f-board-personality span,.club-choice-card .stage13g-board-personality span{font-size:6.8px!important;}
      }
      @media(max-width:370px){
        .club-choice-card{grid-template-columns:minmax(0,1fr) minmax(88px,31%) auto!important;}
        .club-choice-card .stage13f-board-personality span,.club-choice-card .stage13g-board-personality span{display:none!important;}
      }
    `;
    document.head.appendChild(st);
  }
  function refreshVersion(){ try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{v.textContent=VERSION;}); }catch(e){} }

  function cleanLandingCards(){
    try{
      document.querySelectorAll('.club-choice-card').forEach(card=>{
        const budget=card.querySelector('.club-choice-budget');
        if(!budget) return;
        let person=card.querySelector('.stage13f-board-personality,.stage13e-board-personality,.stage13g-board-personality');
        const club=card.getAttribute('data-club') || card.querySelector('.club-choice-name')?.textContent?.trim();
        if(!person && club){
          budget.insertAdjacentHTML('beforebegin', personalityHtml(club));
          person=card.querySelector('.stage13g-board-personality');
        }
        if(person && person.nextElementSibling!==budget){
          budget.parentNode.insertBefore(person,budget);
        }
        if(person){
          person.classList.add('stage13g-board-personality','compact');
          person.removeAttribute('style');
        }
      });
    }catch(e){}
  }

  function bindControllerConfirmButtons(){
    try{
      document.querySelectorAll('.stage13f-controller-selector,.stage13e-controller-selector,.stage13c-controller-selector').forEach(panel=>{
        if(panel.getAttribute('data-stage13g-bound')==='1') return;
        panel.setAttribute('data-stage13g-bound','1');
        const confirm=Array.from(panel.querySelectorAll('button')).find(b=>/confirm development decision/i.test(b.textContent||''));
        const max=Array.from(panel.querySelectorAll('button')).find(b=>/max out club/i.test(b.textContent||''));
        const club=(typeof state==='object' && state && state.humanClub) ? state.humanClub : '';
        const unitsSel=panel.querySelector('select[id^="stage13cUnits_"]');
        const focusSel=panel.querySelector('select[id^="stage13eFocus_"]');
        function run(useMax){
          try{
            if(!club){ setStatusSafe('No club found for the owner decision.', 'bad'); return; }
            const units=useMax ? 999 : (unitsSel ? unitsSel.value : 0);
            const focus=focusSel ? focusSel.value : null;
            if(typeof stage13aSetCustomDevelopmentPlan!=='function'){
              setStatusSafe('Owner development controls are not ready. Reload the page and try again.', 'bad');
              return;
            }
            const before=JSON.stringify((state.managerOwner&&state.managerOwner.clubs&&state.managerOwner.clubs[club]&&state.managerOwner.clubs[club].lastPlan)||null);
            stage13aSetCustomDevelopmentPlan(club,units,focus);
            const after=(state.managerOwner&&state.managerOwner.clubs&&state.managerOwner.clubs[club]&&state.managerOwner.clubs[club].lastPlan)||null;
            if(after && JSON.stringify(after)!==before){
              setStatusSafe(`Owner decision confirmed: ${after.label || 'development plan'}.`, 'good');
            }
          }catch(err){
            console.error('Stage 13G owner confirm failed',err);
            setStatusSafe('The owner decision could not be confirmed. Please try again after a reload.', 'bad');
          }
        }
        if(confirm){
          confirm.removeAttribute('onclick');
          confirm.addEventListener('click',function(ev){ ev.preventDefault(); ev.stopPropagation(); run(false); });
        }
        if(max){
          max.removeAttribute('onclick');
          max.addEventListener('click',function(ev){ ev.preventDefault(); ev.stopPropagation(); run(true); });
        }
        if(!panel.querySelector('.stage13g-confirm-note')){
          panel.insertAdjacentHTML('beforeend','<div class="stage13g-confirm-note"><b>How this works:</b> choose units and a focus, then press Confirm. The decision applies immediately and locks for this season.</div>');
        }
      });
    }catch(e){}
  }

  function afterRender(){ injectStyles(); refreshVersion(); cleanLandingCards(); bindControllerConfirmButtons(); }
  const oldRender=typeof render==='function'?render:null;
  if(oldRender && !window.__stage13gRenderPatch){
    window.__stage13gRenderPatch=true;
    render=function(){ const out=oldRender.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    window.render=render;
  }
  const oldRenderClubChoiceList=typeof renderClubChoiceList==='function'?renderClubChoiceList:null;
  if(oldRenderClubChoiceList && !window.__stage13gClubChoicePatch){
    window.__stage13gClubChoicePatch=true;
    renderClubChoiceList=function(){ const out=oldRenderClubChoiceList.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    window.renderClubChoiceList=renderClubChoiceList;
  }
  const oldSummary=typeof renderSeasonSummary==='function'?renderSeasonSummary:null;
  if(oldSummary && !window.__stage13gSummaryPatch){
    window.__stage13gSummaryPatch=true;
    renderSeasonSummary=function(){ const out=oldSummary.apply(this,arguments); try{ afterRender(); }catch(e){} return out; };
    window.renderSeasonSummary=renderSeasonSummary;
  }
  function boot(){ try{ afterRender(); setTimeout(afterRender,60); setTimeout(afterRender,250); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
