/* Stage 10B: mobile collapse panels, transfer market tag cleanup, job safety bridge and listed-player expiry.
   This is a patch layer over the Stage 10 stability split build. It deliberately keeps the match engine and career systems unchanged. */
(function(){
  'use strict';

  const STAGE10B = { name:'Stage 10B', collapsedKey:'xvii_stage10b_collapsed_panels_v1' };

  function safeEl(id){ return (typeof el==='function') ? el(id) : document.getElementById(id); }
  function readCollapsed(){ try{ return JSON.parse(localStorage.getItem(STAGE10B.collapsedKey)||'{}') || {}; }catch(e){ return {}; } }
  function writeCollapsed(map){ try{ localStorage.setItem(STAGE10B.collapsedKey, JSON.stringify(map||{})); }catch(e){} }
  function injectStyle(){
    if(document.getElementById('stage10b-style')) return;
    const style=document.createElement('style');
    style.id='stage10b-style';
    style.textContent = `
      .stage10b-hidden-filter{display:none!important;}
      .market-tag-row{display:flex;gap:3px;flex-wrap:wrap;margin-top:3px;align-items:center;}
      .market-tag{display:inline-flex;align-items:center;border-radius:999px;padding:1px 5px;font-size:7px;font-weight:950;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.07);color:#d9e3ff;white-space:nowrap;}
      .market-tag.listed{color:#ffe8aa;border-color:rgba(246,200,95,.45);background:rgba(246,200,95,.12);}
      .market-tag.pool{color:#bdf9dd;border-color:rgba(51,214,159,.42);background:rgba(51,214,159,.10);}
      .market-tag.join{color:#bdf9dd;border-color:rgba(51,214,159,.42);background:rgba(51,214,159,.10);}
      .market-tag.discount{color:#fff4c7;border-color:rgba(246,200,95,.45);background:rgba(246,200,95,.12);}
      .market-tag.ambitious{color:#ffd1d1;border-color:rgba(255,107,107,.42);background:rgba(255,107,107,.12);}
      .market-tag.mine{color:#dfe9ff;border-color:rgba(120,166,255,.42);background:rgba(120,166,255,.12);}
      .market-tag.request{color:#ffe8aa;border-color:rgba(246,200,95,.45);background:rgba(246,200,95,.12);}
      .stage10b-market-help{font-size:8px;color:var(--muted);line-height:1.3;margin-top:4px;}
      @media (max-width:700px){
        .xvii-collapse-head{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:rgba(255,255,255,.045);padding:7px 8px;margin-bottom:6px;}
        .xvii-collapse-title{font-size:10px;font-weight:950;color:#eef5ff;letter-spacing:.04em;text-transform:uppercase;min-width:0;}
        .xvii-collapse-toggle{min-height:28px!important;min-width:34px!important;padding:0 8px!important;font-size:14px!important;line-height:1!important;border-radius:7px!important;}
        .xvii-mobile-collapsible.xvii-collapsed > :not(.xvii-collapse-head){display:none!important;}
        .xvii-mobile-collapsible.xvii-collapsed{padding-bottom:0!important;}
        .market-tag{font-size:7px;padding:1px 4px;}
      }
      @media (min-width:701px){.xvii-collapse-head{display:none!important;}}
    `;
    document.head.appendChild(style);
  }

  function stage10bSetupMarketChrome(){
    injectStyle();
    const owner=safeEl('ownerFilter');
    if(owner){
      owner.value='All';
      const wrap=owner.closest('div');
      if(wrap) wrap.classList.add('stage10b-hidden-filter');
    }
    const rows=document.querySelectorAll('.market-search-head span');
    rows.forEach(span=>{ if(span && /Filter the market/.test(span.textContent||'')) span.textContent='Search the full market. Tags show status, value and whether they would join.'; });
    const rules=document.querySelector('.rules');
    if(rules){
      rules.id = rules.id || 'transferRulesPanel';
      rules.innerHTML = 'All players now stay in one market list. Tags show whether a player is in the pool, transfer-listed, discounted, willing to join, too ambitious, or already in your squad. Transfer-listed players are never above market value and may be discounted by up to 15%. Listings last for the current window and the next window only.';
    }
    const tableHead=[...document.querySelectorAll('.market-table-wrap th')].find(th=>(th.textContent||'').trim()==='Owner');
    if(tableHead) tableHead.textContent='Tags';
    const ownerSort=safeEl('sortBy')?.querySelector('option[value="owner"]');
    if(ownerSort) ownerSort.textContent='Tags/status';
  }

  const collapsibles=[
    ['trainingPanel','Training'],
    ['backroomPanel','Backroom staff'],
    ['managerNotesPanel','Manager notes'],
    ['boardFanPanel','Board and fans'],
    ['managerCareerPanel','Manager career'],
    ['mentalityPanel','Mentality'],
    ['challengePanel','Season challenges'],
    ['transferRulesPanel','Transfer rules'],
    ['preSeasonArchive','Pre-season archive'],
    ['mobileBottomExtras','Season extras'],
    ['clubInfoBottom','Club info'],
    ['badgeBoardBottom','Badge board']
  ];
  function applyOneCollapsible(node, key, title){
    if(!node) return;
    node.dataset.stage10bCollapseReady='1';
    node.classList.add('xvii-mobile-collapsible');
    const saved=readCollapsed();
    if(saved[key]) node.classList.add('xvii-collapsed');
    if(node.querySelector(':scope > .xvii-collapse-head')) return;
    const head=document.createElement('div');
    head.className='xvii-collapse-head';
    head.innerHTML=`<div class="xvii-collapse-title">${title}</div><button class="secondary xvii-collapse-toggle" type="button" aria-label="Toggle ${title}">${node.classList.contains('xvii-collapsed')?'+':'−'}</button>`;
    head.querySelector('button').addEventListener('click', function(ev){
      ev.preventDefault(); ev.stopPropagation();
      node.classList.toggle('xvii-collapsed');
      const now=readCollapsed(); now[key]=node.classList.contains('xvii-collapsed'); writeCollapsed(now);
      this.textContent=node.classList.contains('xvii-collapsed')?'+':'−';
    });
    node.insertBefore(head, node.firstChild);
  }
  function applyMobileCollapsibles(){
    injectStyle();
    const rules=document.querySelector('.rules'); if(rules && !rules.id) rules.id='transferRulesPanel';
    collapsibles.forEach(([id,title])=>applyOneCollapsible(safeEl(id), id, title));
    const activity=safeEl('windowActivity')?.closest('.market-activity-panel');
    applyOneCollapsible(activity, 'windowActivityPanel', 'Transfer activity');
    const news=safeEl('squadNews')?.closest('.squad-news-box');
    applyOneCollapsible(news, 'squadNewsPanel', 'Squad news');
    const matchNews=safeEl('matchSquadNews')?.closest('.match-squad-news-box');
    applyOneCollapsible(matchNews, 'matchSquadNewsPanel', 'Match squad news');
    document.querySelectorAll('.xvii-mobile-collapsible').forEach(node=>{
      const btn=node.querySelector(':scope > .xvii-collapse-head .xvii-collapse-toggle');
      if(btn) btn.textContent=node.classList.contains('xvii-collapsed')?'+':'−';
    });
  }

  function stage10bRatingTrend(p){
    const change=Number(p?.ratingChange || 0);
    if(change<0) return 'down';
    if(change>0) return 'up';
    if(Number.isFinite(Number(p?.lastSeasonRating))){
      if(Number(p.rating)>Number(p.lastSeasonRating)) return 'up';
      if(Number(p.rating)<Number(p.lastSeasonRating)) return 'down';
    }
    return 'flat';
  }
  function stage10bListingChance(p, isPool=false){
    const r=Number(p?.rating || 0);
    let chance;
    if(r>=90) chance=0.004;
    else if(r>=87) chance=0.012;
    else if(r>=84) chance=0.028;
    else if(r>=80) chance=0.052;
    else if(r>=75) chance=0.076;
    else chance=0.095;
    const trend=stage10bRatingTrend(p);
    if(trend==='down') chance*=2.15;
    if(trend==='up') chance*=0.48;
    if(isPool) chance*=0.65;
    if(p?.transferRequest) chance=1;
    return Math.max(0.001, Math.min(0.28, chance));
  }
  function stage10bListedMultiplier(p){
    if(p?.transferRequest) return 1;
    const r=Number(p?.rating||0);
    const discountChance=r>=90?0.10:r>=87?0.16:0.30;
    if(Math.random()>discountChance) return 1;
    return roundTo(0.85 + Math.random()*0.14, 2);
  }
  function stage10bClearComputerListing(p){
    if(!p) return;
    p.transferListed=false;
    p.transferListMultiplier=1;
    p.transferListMarketNo=null;
    p.transferListExpiresMarketNo=null;
    p.transferListStage='';
  }
  function stage10bNormaliseExistingListings(){
    if(!state?.players) return {expired:0, kept:0};
    const current=Number(state.marketNo || 1);
    let expired=0, kept=0;
    for(const p of state.players){
      if(p.owner===state.humanClub) continue;
      if(p.transferRequest){
        p.transferListed=true;
        p.transferListMultiplier=1;
        p.transferListMarketNo=p.transferListMarketNo || current;
        p.transferListExpiresMarketNo=current+1;
        kept++;
        continue;
      }
      if(p.transferListed){
        const expires=Number(p.transferListExpiresMarketNo || 0);
        if(expires && current<=expires){
          p.transferListMultiplier=Math.min(1, Math.max(0.85, Number(p.transferListMultiplier || 1)));
          kept++;
        } else {
          stage10bClearComputerListing(p);
          expired++;
        }
      }
    }
    return {expired, kept};
  }
  function stage10bMarketClubNamesForListing(){
    if(typeof window.stage9gEnsureBackgroundMarketClubs==='function') window.stage9gEnsureBackgroundMarketClubs();
    return Object.keys(state?.teams || {}).filter(club=>club && club!==state.humanClub && typeof teamPlayers==='function' && teamPlayers(club).length>0);
  }
  function stage10bPickClubListings(club){
    const candidates=teamPlayers(club).filter(p=>p && p.owner===club && p.owner!==state.humanClub && !p.transferListed);
    const picked=[];
    for(const p of shuffle(candidates.slice())){
      if(picked.length>=4) break;
      if(Math.random()<stage10bListingChance(p,false)) picked.push(p);
    }
    // Soft safety: if a club is selected and nothing triggered, fringe players sometimes still become available.
    if(!picked.length && candidates.length && Math.random()<0.34){
      const fringe=candidates.slice().sort((a,b)=>Number(a.rating||0)-Number(b.rating||0) || Number(a.marketValue||0)-Number(b.marketValue||0)).slice(0,7);
      const p=fringe[Math.floor(Math.random()*fringe.length)];
      if(p) picked.push(p);
    }
    return picked;
  }

  const previousGenerateTransferList = (typeof generateTransferList==='function') ? generateTransferList : null;
  generateTransferList = function(){
    if(!state?.players || !state.players.length){ if(previousGenerateTransferList) return previousGenerateTransferList.apply(this, arguments); return; }
    if(typeof window.stage9gEnsureBackgroundMarketClubs==='function') window.stage9gEnsureBackgroundMarketClubs();
    const current=Number(state.marketNo || 1);
    const normalised=stage10bNormaliseExistingListings();
    const aiClubs=stage10bMarketClubNamesForListing();
    const chosenClubs=shuffle(aiClubs.slice()).filter(()=>Math.random()<0.62);
    let listedCount=0, discountCount=0, eliteListed=0;
    for(const club of chosenClubs){
      const picked=stage10bPickClubListings(club);
      for(const p of picked){
        p.transferListed=true;
        p.transferListMarketNo=current;
        p.transferListExpiresMarketNo=current+1;
        p.transferListStage='stage10b';
        p.transferListMultiplier=stage10bListedMultiplier(p);
        if(Number(p.transferListMultiplier||1)<1) discountCount++;
        if(Number(p.rating||0)>=87) eliteListed++;
        listedCount++;
      }
    }
    const poolMoves = (typeof applyPoolMarketOpportunities==='function') ? applyPoolMarketOpportunities() : [];
    let poolListed=0, poolDiscounts=0;
    const pool=shuffle(poolPlayers().filter(p=>p && !isReturnableRelease(p) && !activePoolOffer(p)));
    for(const p of pool){
      if(poolListed>=34) break;
      if(Math.random()<stage10bListingChance(p,true)){
        const mult=stage10bListedMultiplier(p);
        p.poolOfferMarketNo=current;
        p.poolOfferMultiplier=mult;
        p.poolOfferType='listed';
        poolListed++;
        if(mult<1) poolDiscounts++;
      }
    }
    const expiredText=normalised.expired?` ${normalised.expired} old listing${normalised.expired===1?' has':'s have'} expired.`:'';
    if(listedCount || poolMoves.length || poolListed || expiredText){
      addLog(`${listedCount} club-owned player${listedCount===1?' has':'s have'} been transfer-listed across the active and background divisions. ${eliteListed} elite/high-end player${eliteListed===1?' was':'s were'} listed. ${discountCount+poolDiscounts} listed player${discountCount+poolDiscounts===1?' is':'s are'} discounted below market. ${poolListed} transfer-pool player${poolListed===1?' is':'s are'} also tagged as pool/listed opportunities. Listings last this window and next only.${expiredText}`);
    }
  };
  window.generateTransferList=generateTransferList;

  const previousBuyPrice = (typeof buyPrice==='function') ? buyPrice : null;
  buyPrice = function(p){
    if(!state.started) return 0;
    if(typeof isReturnableRelease==='function' && isReturnableRelease(p)) return roundMoney(p.releaseFee || p.marketValue || 0);
    if(!p.owner) return (typeof poolOfferPrice==='function') ? poolOfferPrice(p) : roundMoney((p?.marketValue||0)*1.2);
    if(p.owner===state.humanClub) return 0;
    if(p.transferListed){
      const raw=Number(p.transferListMultiplier || 1);
      const mult=(Number.isFinite(raw) && raw>0) ? Math.min(1, Math.max(0.85, raw)) : 1;
      p.transferListMultiplier=mult;
      return roundMoney(Number(p.marketValue || 0)*mult);
    }
    return previousBuyPrice ? previousBuyPrice(p) : roundMoney(Number(p.marketValue||0)*1.5);
  };
  window.buyPrice=buyPrice;

  function stage10bTag(label, cls){ return `<span class="market-tag ${cls||''}">${escapeHtml(label)}</span>`; }
  function stage10bMarketTags(p){
    const tags=[];
    const isMine=p?.owner===state.humanClub;
    const price=buyPrice(p);
    const market=Number(p?.marketValue || 0);
    if(isMine) tags.push(['My Squad','mine']);
    if(!p.owner) tags.push(['Pool','pool']);
    if(p.transferRequest) tags.push(['Transfer Request','request']);
    if(p.humanTransferListed && isMine) tags.push(['Transfer Listed','listed']);
    if(p.transferListed && p.owner && !isMine) tags.push(['Transfer Listed','listed']);
    if(!p.owner && typeof activePoolOffer==='function' && activePoolOffer(p)) tags.push(['Pool Deal','pool']);
    if(!isMine && market>0 && price>0 && price<market) tags.push(['Discount','discount']);
    if(!isMine){
      const join=canPlayerAcceptClub(p,state.humanClub);
      if(join.ok) tags.push(['Would Join','join']); else tags.push(['Too Ambitious','ambitious']);
    }
    return tags;
  }
  function stage10bTagsHtml(p){
    const tags=stage10bMarketTags(p);
    if(!tags.length) return '<span class="muted">—</span>';
    return `<div class="market-tag-row">${tags.map(t=>stage10bTag(t[0],t[1])).join('')}</div>`;
  }
  function stage10bTagsText(p){ return stage10bMarketTags(p).map(t=>t[0]).join(' '); }
  function stage10bListedInfoHtml(p){
    if(p.transferRequest && p.owner && p.owner!==state.humanClub) return `<div class="listed-tag">TRANSFER REQUEST: ${escapeHtml(p.transferRequestReason || 'wants a move')}</div>`;
    if(p.humanTransferListed && p.owner===state.humanClub) return '<div class="listed-tag">TRANSFER LISTED BY YOU: director sale attempted next window</div>';
    if(p.transferListed && p.owner!==state.humanClub){
      const expires=Number(p.transferListExpiresMarketNo||0);
      const expiry=expires ? ` · expires after market ${expires}` : '';
      return `<div class="listed-tag">TRANSFER LISTED: asking price ${money(buyPrice(p))}${escapeHtml(expiry)}</div>`;
    }
    if(typeof isReturnableRelease==='function' && isReturnableRelease(p)) return '<div class="listed-tag">RELEASED THIS WINDOW: return at release value</div>';
    if(typeof activePoolOffer==='function' && activePoolOffer(p)) return `<div class="listed-tag">TRANSFER POOL OPPORTUNITY: temporary asking price ${money(poolOfferPrice(p))}</div>`;
    return '';
  }

  renderPlayerCards = function(players, totalCount){
    const box=safeEl('playerCards');
    if(!box) return;
    if(!state.started){ box.innerHTML='<div class="status">Start a transfer window.</div>'; return; }
    if(!players || !players.length){ box.innerHTML='<div class="status">No players match those filters.</div>'; return; }
    const html=players.map(p=>{
      const can=canBuy(p), isMine=p.owner===state.humanClub;
      const action=isMine ? `${humanPlayerActionButtons(p)}` : `<button class="tiny" onclick="buyPlayer(${p.id})" title="${escapeHtml(canPlayerAcceptClub(p,state.humanClub).reason || can.reason)}" ${can.ok?'':'disabled'}>${can.reason}</button>`;
      const s=playerStatus(p);
      const avail=availabilityLine(p);
      const ownerLine=`${shortPos(p.position)} · ${escapeHtml(p.originalClub)} · ${escapeHtml(s.label)}`;
      const priceText=isMine ? `Sell now ${money(instantPoolSaleFee(p))}${p.humanTransferListed?' · Listed':''}` : `Price ${money(buyPrice(p))}`;
      return `<div class="market-card"><div class="market-card-main"><div class="market-card-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}${statusBadgesHtml(p)}</div><div class="market-card-meta">${ownerLine}</div><div class="market-card-money">Market ${money(p.marketValue)} · ${priceText}${avail?` · ${escapeHtml(avail)}`:''}</div>${stage10bTagsHtml(p)}</div><div class="market-card-action">${action}</div><div class="market-card-rating">${ratingMovementHtml(p)}</div></div>`;
    }).join('');
    const countLine=`${totalCount} player${totalCount===1?'':'s'} found. Tags show pool, listed, discount, would join and too ambitious.`;
    box.innerHTML=`<div class="market-card-count">${escapeHtml(countLine)}</div><div class="market-card-scroll">${html}</div>`;
  };
  window.renderPlayerCards=renderPlayerCards;

  renderPlayers = function(){
    const body=safeEl('playerRows');
    if(!body) return;
    if(!state.started){ body.innerHTML='<tr><td colspan="7" class="muted">Start a transfer window.</td></tr>'; renderPlayerCards([],0); return; }
    const q=(safeEl('searchInput')?.value || '').trim().toLowerCase();
    const pos=safeEl('posFilter')?.value || 'All';
    const interestF=safeEl('interestFilter')?.value || 'All';
    const maxPrice=Number(safeEl('maxPrice')?.value || Infinity);
    const minRating=Number(safeEl('minRating')?.value || 0);
    const sort=safeEl('sortBy')?.value || 'ratingDesc';
    let rows=state.players.slice();
    if(q) rows=rows.filter(p=>`${p.name} ${p.originalClub} ${p.owner || 'transfer pool'} ${p.position} ${p.transferRequestReason||''} ${stage10bTagsText(p)}`.toLowerCase().includes(q));
    if(pos!=='All') rows=rows.filter(p=>p.position===pos);
    if(interestF==='Join') rows=rows.filter(p=>p.owner!==state.humanClub && canPlayerAcceptClub(p,state.humanClub).ok);
    rows=rows.filter(p=>Number(p.rating||0)>=minRating);
    rows=rows.filter(p=>p.owner===state.humanClub || buyPrice(p)<=maxPrice);
    rows.sort((a,b)=>{
      if(sort==='ratingDesc') return b.rating-a.rating || buyPrice(a)-buyPrice(b);
      if(sort==='buyAsc') return buyPrice(a)-buyPrice(b) || b.rating-a.rating;
      if(sort==='buyDesc') return buyPrice(b)-buyPrice(a) || b.rating-a.rating;
      if(sort==='marketAsc') return a.marketValue-b.marketValue || b.rating-a.rating;
      if(sort==='pos') return a.positionOrder-b.positionOrder || b.rating-a.rating;
      if(sort==='owner') return stage10bTagsText(a).localeCompare(stage10bTagsText(b)) || b.rating-a.rating;
      return a.name.localeCompare(b.name);
    });
    const visible=rows.slice(0,260);
    body.innerHTML=visible.map(p=>{
      const can=canBuy(p), isMine=p.owner===state.humanClub;
      const price=isMine ? (p.humanTransferListed?`Listed · Sell ${money(instantPoolSaleFee(p))}`:`Sell ${money(instantPoolSaleFee(p))}`) : money(buyPrice(p));
      const rowAction=isMine ? `${humanPlayerActionButtons(p)}` : `<button class="tiny" onclick="buyPlayer(${p.id})" title="${escapeHtml((canPlayerAcceptClub(p,state.humanClub).reason) || can.reason)}" ${can.ok?'':'disabled'}>${can.reason}</button>`;
      const avail=availabilityLine(p);
      const offer=(typeof saleOfferTagHtml==='function'?saleOfferTagHtml(p):'') + (typeof poolOfferTagHtml==='function'?poolOfferTagHtml(p):'');
      const listed=stage10bListedInfoHtml(p);
      return `<tr><td><span class="player-name">${escapeHtml(p.name)}${statusBadgesHtml(p)}</span><div class="muted">${escapeHtml(p.originalClub)}${avail?` · ${escapeHtml(avail)}`:''}</div>${offer}${listed}</td><td><span class="pill ${posClass(p.position)}">${shortPos(p.position)}</span></td><td class="num">${ratingMovementHtml(p)}</td><td>${stage10bTagsHtml(p)}</td><td class="num">${money(p.marketValue)}</td><td class="num"><b>${price}</b></td><td class="num">${rowAction}</td></tr>`;
    }).join('') + (rows.length>visible.length?`<tr><td colspan="7" class="muted">Showing first ${visible.length} of ${rows.length}. Narrow the search to see more.</td></tr>`:'');
    renderPlayerCards(rows, rows.length);
  };
  window.renderPlayers=renderPlayers;

  // End-of-season job safety bridge. Keeps Stage 9D's per-job safety, but satisfies older global safety checks.
  const previousAcceptJobAdvert = (typeof acceptJobAdvert==='function') ? acceptJobAdvert : null;
  acceptJobAdvert = function(jobId, source='season'){
    if(!previousAcceptJobAdvert) return;
    if(typeof normaliseJobMarket==='function') state.jobMarket = normaliseJobMarket(state.jobMarket);
    else state.jobMarket = state.jobMarket || {};
    const allJobs=[...((state.jobMarket && state.jobMarket.adverts) || []), ...((state.jobMarket && state.jobMarket.endSeasonJobs) || [])];
    const job=allJobs.find(j=>j && j.id===jobId);
    if(!job) return (typeof setStatus==='function') ? setStatus('That job is no longer available.', 'bad') : previousAcceptJobAdvert(jobId, source);
    if(typeof managerEligibleForJob==='function' && !managerEligibleForJob(job)) return setStatus(`Your reputation is not high enough for ${escapeHtml(job.club)} yet. Needed ${job.minRep}/100, current ${managerProfile().rating}/100.`, 'bad');
    state.jobMarket.safetyByJob = state.jobMarket.safetyByJob && typeof state.jobMarket.safetyByJob==='object' ? state.jobMarket.safetyByJob : {};
    const perJobUnlocked=!!state.jobMarket.safetyByJob[jobId];
    const globalUnlocked=!!state.jobMarket.safetyUnlocked;
    if(!perJobUnlocked && !globalUnlocked) return setStatus('Job move safety is still on for this club. Unlock this specific job first if you want to take it.', 'warn');
    state.jobMarket.safetyUnlocked=true;
    state.jobMarket.safetyByJob[jobId]=true;
    return previousAcceptJobAdvert(jobId, source);
  };
  window.acceptJobAdvert=acceptJobAdvert;

  const previousRender = (typeof render==='function') ? render : null;
  render = function(){
    const out=previousRender ? previousRender.apply(this, arguments) : undefined;
    stage10bSetupMarketChrome();
    applyMobileCollapsibles();
    return out;
  };
  window.render=render;

  function bootStage10B(){
    stage10bSetupMarketChrome();
    applyMobileCollapsibles();
    if(typeof render==='function') render();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bootStage10B); else bootStage10B();
})();
