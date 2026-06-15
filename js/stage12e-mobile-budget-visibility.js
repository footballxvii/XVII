/* Stage 12E: mobile transfer-budget visibility in the market. */
(function(){
  'use strict';
  const VERSION='Version 13S · Beta';

  function q(sel){ return document.querySelector(sel); }
  function byId(id){ return document.getElementById(id); }
  function fmtBudget(){
    try{
      if(typeof state==='undefined' || !state || !state.started || !state.humanClub || typeof humanTeam!=='function') return '£0m';
      const team=humanTeam();
      if(!team) return '£0m';
      if(typeof money==='function') return money(Number(team.budget||0));
      return '£' + Math.round(Number(team.budget||0)) + 'm';
    }catch(e){ return '£0m'; }
  }

  function injectStyles(){
    if(byId('stage12e-budget-style')) return;
    const style=document.createElement('style');
    style.id='stage12e-budget-style';
    style.textContent=`
      .stage12e-budget-card{display:inline-flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid rgba(246,200,95,.35);border-radius:9px;background:linear-gradient(180deg,rgba(246,200,95,.12),rgba(255,255,255,.035));padding:6px 9px;min-height:30px;color:#fff4c7;font-weight:950;line-height:1.1;white-space:nowrap;}
      .stage12e-budget-card span{font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:#d9c57d;}
      .stage12e-budget-card b{font-size:11px;color:#fff;font-variant-numeric:tabular-nums;}
      @media (max-width:700px){
        .stage10c-market-toggles.stage12e-has-budget{grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(86px,.82fr)!important;align-items:stretch;position:sticky;top:0;z-index:24;backdrop-filter:blur(10px);border-bottom-color:rgba(246,200,95,.18)!important;}
        .stage10c-market-toggles.stage12e-has-budget .stage10c-check{min-width:0;justify-content:center;text-align:center;padding:6px 4px!important;font-size:8px!important;}
        .stage12e-budget-card{width:100%;min-width:0;justify-content:center;flex-direction:column;gap:2px;padding:5px 4px;}
        .stage12e-budget-card span{font-size:7px;letter-spacing:.09em;}
        .stage12e-budget-card b{font-size:12px;}
      }
      @media (max-width:350px){
        .stage10c-market-toggles.stage12e-has-budget{grid-template-columns:1fr 1fr!important;}
        .stage12e-budget-card{grid-column:1 / -1;flex-direction:row;justify-content:center;gap:10px;}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureBudgetCard(){
    injectStyles();
    const toggles=byId('stage10cMarketToggles');
    if(!toggles) return false;
    toggles.classList.add('stage12e-has-budget');
    let card=byId('stage12eMobileBudget');
    if(!card){
      card=document.createElement('div');
      card.id='stage12eMobileBudget';
      card.className='stage12e-budget-card';
      card.setAttribute('aria-live','polite');
      card.innerHTML='<span>Budget</span><b id="stage12eMobileBudgetValue">£0m</b>';
      toggles.appendChild(card);
    }
    updateBudgetCard();
    return true;
  }

  function updateBudgetCard(){
    const v=byId('stage12eMobileBudgetValue');
    if(v) v.textContent=fmtBudget();
    document.querySelectorAll('.xvii-version-note').forEach(n=>{ n.textContent=VERSION; });
  }

  function afterRender(){
    ensureBudgetCard();
    updateBudgetCard();
  }

  const patch=(name, fn)=>{
    try{
      const old=window[name] || (typeof globalThis!=='undefined' ? globalThis[name] : null);
      if(typeof old!=='function' || old.__stage12ePatched) return;
      const wrapped=function(){ const out=old.apply(this, arguments); try{ fn(); }catch(e){} return out; };
      wrapped.__stage12ePatched=true;
      window[name]=wrapped;
      try{ globalThis[name]=wrapped; }catch(e){}
    }catch(e){}
  };

  function boot(){
    injectStyles();
    ensureBudgetCard();
    updateBudgetCard();
    patch('render', afterRender);
    patch('renderPlayers', afterRender);
    patch('renderKpis', afterRender);
    document.addEventListener('click', ()=>setTimeout(updateBudgetCard, 80), true);
    setInterval(afterRender, 1200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
