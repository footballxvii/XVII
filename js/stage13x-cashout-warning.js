/* Stage 13X: Cash Out Warning.
   Adds a short permanent-sale warning beside voluntary cash out without changing mechanics. */
(function(){
  if(window.__stage13xCashoutWarning) return;
  window.__stage13xCashoutWarning = true;
  const VERSION='Version 13X · Beta';
  function setVersion(){
    try{ document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; }); }catch(e){}
  }
  function applyCashoutWarning(){
    setVersion();
    try{
      document.querySelectorAll('button[onclick*="stage13aCashOutCurrentClub"]').forEach(btn=>{
        const panel=btn.closest('.stage13-buyin-card') || btn.parentElement;
        if(!panel) return;
        let note=panel.querySelector('.stage13t-cashout-note') || panel.querySelector('.stage13x-cashout-note');
        if(!note){
          note=document.createElement('div');
          note.className='stage13t-cashout-note stage13x-cashout-note';
          panel.appendChild(note);
        }
        const unavailable=btn.disabled || btn.classList.contains('stage13t-cashout-disabled');
        const title=String(btn.title||'').toLowerCase();
        if(title.includes('do not currently own')){ note.innerHTML=''; return; }
        if(unavailable){
          if(title.includes('boardroom') || title.includes('locked')) note.innerHTML='<b>Cash out unavailable:</b> boardroom decision already made.';
          return;
        }
        note.innerHTML='<b>Permanent:</b> you cannot buy back into this club.';
      });
    }catch(e){}
  }
  const oldRender=typeof window.render==='function'?window.render:null;
  if(oldRender && !oldRender.__stage13xWrapped){
    const wr=function(){ const out=oldRender.apply(this,arguments); try{ setTimeout(applyCashoutWarning,0); }catch(e){} return out; };
    wr.__stage13xWrapped=true; window.render=wr; try{ render=wr; }catch(e){}
  }
  const oldSummary=typeof window.renderSeasonSummary==='function'?window.renderSeasonSummary:null;
  if(oldSummary && !oldSummary.__stage13xWrapped){
    const wr=function(){ const out=oldSummary.apply(this,arguments); try{ setTimeout(applyCashoutWarning,0); }catch(e){} return out; };
    wr.__stage13xWrapped=true; window.renderSeasonSummary=wr; try{ renderSeasonSummary=wr; }catch(e){}
  }
  function boot(){ applyCashoutWarning(); setTimeout(applyCashoutWarning,80); setTimeout(applyCashoutWarning,400); setInterval(setVersion,1500); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
