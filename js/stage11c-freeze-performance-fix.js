/* Stage 11C: freeze/performance hotfix.
   Fixes custom tactic Quick 4-4-2 auto-trigger issue in Stage 11 and avoids rendering the hidden transfer market during season views. */
(function(){
  if(window.__stage11cFreezePerformanceFix) return;
  window.__stage11cFreezePerformanceFix = true;

  function safeEl(id){ try{ return document.getElementById(id); }catch(e){ return null; } }
  function marketHidden(){
    const area=safeEl('marketArea');
    if(!area) return false;
    return area.classList.contains('hidden') || (window.getComputedStyle && getComputedStyle(area).display==='none');
  }
  function inSeasonView(){
    try{
      if(typeof currentPhase==='function') return currentPhase()==='season';
    }catch(e){}
    try{ return !!(window.state && state.started && state.completed && state.season); }catch(e){ return false; }
  }
  function clearMarketRender(){
    const body=safeEl('playerRows');
    if(body) body.innerHTML='';
    const cards=safeEl('playerCards');
    if(cards) cards.innerHTML='';
  }

  const previousRenderPlayers = (typeof renderPlayers === 'function') ? renderPlayers : null;
  if(previousRenderPlayers){
    renderPlayers = function(){
      if(inSeasonView() || marketHidden()){
        clearMarketRender();
        return;
      }
      return previousRenderPlayers.apply(this, arguments);
    };
    window.renderPlayers = renderPlayers;
  }

  // Guard mobile cards against accidentally rendering the entire database if a previous patch passes full rows.
  const previousRenderPlayerCards = (typeof renderPlayerCards === 'function') ? renderPlayerCards : null;
  if(previousRenderPlayerCards){
    renderPlayerCards = function(players, totalCount){
      if(inSeasonView() || marketHidden()){
        clearMarketRender();
        return;
      }
      const limited = Array.isArray(players) ? players.slice(0,260) : players;
      return previousRenderPlayerCards.call(this, limited, Number(totalCount ?? (Array.isArray(players)?players.length:0)));
    };
    window.renderPlayerCards = renderPlayerCards;
  }

  function updateVersion(){
    document.title='XVII | Build the seventeen. Pick the eleven.';
    const v=document.querySelector('.xvii-version-note');
    if(v) v.textContent='Version 12K3 · Beta';
  }

  const previousRender = (typeof render === 'function') ? render : null;
  if(previousRender && !window.__stage11cRenderPatched){
    window.__stage11cRenderPatched = true;
    render = function(){
      const out = previousRender.apply(this, arguments);
      updateVersion();
      return out;
    };
    window.render = render;
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', updateVersion);
  else updateVersion();
})();
