/* Stage 12I: final long-service balance and pricing overrides. */
(function(){
  if(window.__stage12iLongServiceBalance) return;
  window.__stage12iLongServiceBalance = true;
  const VERSION='Version 12I · Beta';
  const VALUE_MULT=0.5;
  const NO_RETURN_SEASONS=6;

  function el(id){ try{return document.getElementById(id);}catch(e){return null;} }
  function esc(x){ try{ if(typeof escapeHtml==='function') return escapeHtml(String(x??'')); }catch(e){} return String(x??''); }
  function seasonNo(){ return Math.max(1, Number(window.state?.seasonNumber || 1)); }
  function marketNo(){ return Math.max(1, Number(window.state?.marketNo || 1)); }
  function cash(n){ try{return money(n);}catch(e){return '£'+Number(n||0).toLocaleString()+'m';} }
  function round(n){ try{return roundMoney(n);}catch(e){return Math.max(1, Math.round(Number(n||0)));} }
  function ply(id){ try{return player(id);}catch(e){ return (state?.players||[]).find(p=>Number(p.id)===Number(id)); } }
  function human(){ try{return humanTeam();}catch(e){ return state?.teams?.[state?.humanClub]; } }
  function removeFromSquad(club,id){
    try{
      const t=(typeof team==='function') ? team(club) : state?.teams?.[club];
      if(t && Array.isArray(t.squadIds)) t.squadIds=t.squadIds.filter(x=>Number(x)!==Number(id));
    }catch(e){}
  }
  function longDeclared(p){ return !!(p && p.longServiceDeparturePending && p.longServiceDepartureWarned); }
  function longFee(p){
    if(!p) return 0;
    const base=Number(p.longServiceOriginalMarketValue || p.marketValue || p.baseCost || 0);
    return round(base*VALUE_MULT);
  }
  function makeAwayDuration(reason){
    if(reason==='Retirement') return 5 + Math.floor(Math.random()*5);
    if(reason==='Family reasons' || reason==='Personal reasons') return 2 + Math.floor(Math.random()*3);
    return 1 + Math.floor(Math.random()*2);
  }
  function clearPending(p){
    if(!p) return;
    p.longServiceDeparturePending=false;
    p.longServicePendingClub=null;
    p.longServiceDueSeason=null;
    p.longServiceDueMarketNo=null;
    p.longServiceDepartureReason='';
    p.longServiceDepartureWarned=false;
    p.longServiceValueDamaged=false;
    p.longServiceExternalExitHandled=true;
  }
  function makeLongServiceDisappear(p, oldClub, context){
    if(!p) return null;
    const reason=p.longServiceDepartureReason || 'New challenge';
    const duration=makeAwayDuration(reason);
    const currentOwner=p.owner;
    removeFromSquad(oldClub, p.id);
    if(currentOwner && currentOwner!==oldClub) removeFromSquad(currentOwner, p.id);
    p.owner=null;
    p.outsideOwner=false;
    p.lastOwner=null;
    p.clubTenure=0;
    p.transferListed=false;
    p.humanTransferListed=false;
    p.transferRequest=false;
    p.transferRequestReason='';
    p.releasedByHuman=false;
    p.releaseMarketNo=null;
    p.releaseFee=null;
    p.longServiceNoReturnClub=oldClub || p.longServicePendingClub || null;
    p.longServiceNoReturnUntilSeason=seasonNo()+NO_RETURN_SEASONS;
    p.longServiceAbsentUntilSeason=seasonNo()+duration;
    p.longServiceAbsentReason=reason;
    p.longServiceLastDepartureSeason=seasonNo();
    p.longServiceLastDepartureReason=reason;
    p.longServiceLastDepartureClub=oldClub || p.longServicePendingClub || '';
    clearPending(p);
    if(state){
      state.longServiceDepartures=state.longServiceDepartures || {history:[],warnings:[],returns:[],checked:{}};
      state.longServiceDepartures.history=Array.isArray(state.longServiceDepartures.history) ? state.longServiceDepartures.history : [];
      state.longServiceDepartures.history.push({season:seasonNo(),marketNo:marketNo(),club:oldClub||'',playerId:p.id,player:p.name,rating:p.rating,reason,duration,context:context||'offloaded long-service player left active market',offloadedFrom:currentOwner||null});
    }
    return {reason,duration,currentOwner};
  }

  const oldBuyPrice = (typeof buyPrice==='function') ? buyPrice : null;
  if(oldBuyPrice){
    buyPrice=function(p){
      if(longDeclared(p) && p.owner!==state?.humanClub) return longFee(p);
      return oldBuyPrice.apply(this, arguments);
    };
    window.buyPrice=buyPrice;
  }

  const oldInstantPoolSaleFee = (typeof instantPoolSaleFee==='function') ? instantPoolSaleFee : null;
  if(oldInstantPoolSaleFee){
    instantPoolSaleFee=function(p){
      if(longDeclared(p) && p.owner===state?.humanClub) return longFee(p);
      return oldInstantPoolSaleFee.apply(this, arguments);
    };
    window.instantPoolSaleFee=instantPoolSaleFee;
  }

  const oldSellPlayerToPool = (typeof sellPlayerToPool==='function') ? sellPlayerToPool : null;
  if(oldSellPlayerToPool){
    sellPlayerToPool=function(id){
      const p=ply(id);
      if(!p || !state?.started || state?.completed || p.owner!==state.humanClub || !longDeclared(p)) return oldSellPlayerToPool.apply(this, arguments);
      const fee=longFee(p);
      const oldClub=state.humanClub;
      const t=human();
      if(t){
        t.squadIds=(t.squadIds||[]).filter(x=>Number(x)!==Number(id));
        t.budget=Number(t.budget||0)+fee;
        t.income=Number(t.income||0)+fee;
      }
      state.transferHistory=state.transferHistory || {in:[],out:[]};
      state.transferHistory.out=Array.isArray(state.transferHistory.out) ? state.transferHistory.out : [];
      state.transferHistory.out.push({id:p.id,name:p.name,position:p.position,rating:p.rating,fee,round:state.season?state.season.roundIndex:0,market:state.marketNo,season:state.seasonNumber||1,longServiceDiscounted:true,instantPoolSale:true});
      const gone=makeLongServiceDisappear(p, oldClub, 'sold early after long-service warning');
      if(typeof addLog==='function') addLog(`<b>Long-service sale:</b><br>${esc(p.name)} was sold for ${cash(fee)} after declaring a long-service issue. His value was halved because the market knew this was an end-of-cycle problem. He has now left the active market for ${gone?.duration || 1} season${(gone?.duration||1)===1?'':'s'}.`);
      if(typeof setStatus==='function') setStatus(`${esc(p.name)} sold for ${cash(fee)} and removed from the active market. You now have an open ${p.position} slot.`, 'warn');
      try{ if(typeof render==='function') render(); if(typeof saveGame==='function') saveGame(); }catch(e){}
    };
    window.sellPlayerToPool=sellPlayerToPool;
  }

  const oldAvailabilityLine = (typeof availabilityLine==='function') ? availabilityLine : null;
  if(oldAvailabilityLine){
    availabilityLine=function(p){
      if(longDeclared(p)) return `Long-service issue: value halved, due to leave active market next window`;
      return oldAvailabilityLine.apply(this, arguments);
    };
    window.availabilityLine=availabilityLine;
  }

  const oldStatusBadgesHtml = (typeof statusBadgesHtml==='function') ? statusBadgesHtml : null;
  if(oldStatusBadgesHtml){
    statusBadgesHtml=function(p){
      const base=oldStatusBadgesHtml.apply(this, arguments) || '';
      if(longDeclared(p)) return base + `<span class="status-badge request" title="Long-service issue: value halved and due to leave">LS</span>`;
      return base;
    };
    window.statusBadgesHtml=statusBadgesHtml;
  }

  function refreshVersion(){
    document.title='XVII | Build the seventeen. Pick the eleven.';
    document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; });
  }
  function boot(){ refreshVersion(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  const oldRender=(typeof render==='function') ? render : null;
  if(oldRender && !window.__stage12iRenderPatch){
    window.__stage12iRenderPatch=true;
    render=function(){ const out=oldRender.apply(this, arguments); setTimeout(refreshVersion,0); return out; };
    window.render=render;
  }
  setInterval(refreshVersion, 2200);
})();
