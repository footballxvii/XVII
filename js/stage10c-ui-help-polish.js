/* Stage 10C: public polish, mobile layout fixes, transfer filter checkboxes and in-game help.
   Patch layer over Stage 10B. Gameplay engine unchanged except display/filter handling. */
(function(){
  'use strict';

  const STAGE10C = {
    name: 'Stage 10C',
    collapsedKey: 'xvii_stage10c_collapsed_panels_v1',
    helpKey: 'xvii_stage10c_help_open_v1'
  };

  function safeEl(id){ return (typeof el === 'function') ? el(id) : document.getElementById(id); }
  function boolRead(key, fallback){ try{ const v=localStorage.getItem(key); return v===null ? fallback : v==='true'; }catch(e){ return fallback; } }
  function boolWrite(key, val){ try{ localStorage.setItem(key, val ? 'true' : 'false'); }catch(e){} }
  function readCollapsed(){ try{ return JSON.parse(localStorage.getItem(STAGE10C.collapsedKey)||'{}') || {}; }catch(e){ return {}; } }
  function writeCollapsed(map){ try{ localStorage.setItem(STAGE10C.collapsedKey, JSON.stringify(map||{})); }catch(e){} }
  function esc(x){ return (typeof escapeHtml === 'function') ? escapeHtml(String(x ?? '')) : String(x ?? '').replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  function injectStyle(){
    if(document.getElementById('stage10c-style')) return;
    const style=document.createElement('style');
    style.id='stage10c-style';
    style.textContent = `
      .stage10c-market-toggles{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:0 6px 6px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.025);}
      .stage10c-check{display:inline-flex;align-items:center;gap:5px;color:#dfe9ff;font-size:8.5px;font-weight:900;line-height:1.2;white-space:nowrap;}
      .stage10c-check input{width:14px!important;height:14px!important;min-height:14px!important;margin:0;accent-color:#78a6ff;}
      .human-transfer-actions.stage10c-horizontal{display:flex!important;grid-template-columns:none!important;gap:3px!important;align-items:center!important;justify-content:flex-end!important;min-width:96px!important;}
      .human-transfer-actions.stage10c-horizontal .tiny{min-height:22px!important;height:22px!important;padding:2px 5px!important;font-size:7.5px!important;white-space:nowrap!important;}
      .xvii-collapse-body{min-width:0;}
      .xvii-mobile-collapsible.xvii-collapsed > .xvii-collapse-body{display:none!important;}
      .stage10c-analytics-shell{max-width:1900px;margin:0 auto;}
      .stage10c-empty-extra{display:none!important;}
      .xvii-version-note{margin-top:5px;color:#65718d;font-size:7.5px;}
      .xvii-help-widget{position:fixed;left:10px;right:10px;bottom:10px;z-index:1000;pointer-events:none;display:flex;justify-content:center;}
      .xvii-help-card{width:min(760px,100%);max-height:78vh;pointer-events:auto;border:1px solid rgba(120,166,255,.42);border-radius:14px;background:linear-gradient(180deg,#151f36,#0b1020);box-shadow:0 18px 60px rgba(0,0,0,.55);overflow:hidden;color:#eef5ff;}
      .xvii-help-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;background:rgba(120,166,255,.12);border-bottom:1px solid rgba(255,255,255,.10);}
      .xvii-help-head b{font-size:11px;letter-spacing:.05em;text-transform:uppercase;}
      .xvii-help-head span{color:var(--muted);font-size:8.5px;}
      .xvii-help-toggle{min-height:30px!important;min-width:42px!important;padding:0 10px!important;font-size:14px!important;}
      .xvii-help-body{display:none;max-height:calc(78vh - 50px);overflow:auto;padding:10px;}
      .xvii-help-card.open .xvii-help-body{display:block;}
      .xvii-help-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
      .xvii-help-section{border:1px solid rgba(255,255,255,.11);border-radius:10px;background:rgba(255,255,255,.045);padding:8px;min-width:0;}
      .xvii-help-section h3{margin:0 0 5px;font-size:10.5px;color:#fff;letter-spacing:-.01em;}
      .xvii-help-section p{margin:0 0 5px;color:#b7c2de;font-size:8.5px;line-height:1.38;}
      .xvii-help-section ul{margin:0 0 0 15px;padding:0;color:#b7c2de;font-size:8.5px;line-height:1.38;}
      .xvii-help-section li{margin:2px 0;}
      @media (max-width:700px){
        .stage10c-market-toggles{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:6px;}
        .stage10c-check{font-size:9px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.045);padding:7px;}
        .training-panel,.backroom-panel,.manager-notes-panel,.board-fan-panel,.manager-career-panel,.mentality-panel,.challenge-panel,.market-activity-panel,.transaction-log,.squad-news-box,.match-squad-news-box,.club-info-bottom,.badge-board-bottom,.pre-season-archive,.stage10c-analytics-shell{width:100%!important;max-width:100%!important;margin-left:0!important;margin-right:0!important;}
        .xvii-mobile-collapsible.xvii-collapsed{width:100%!important;max-width:100%!important;margin-left:0!important;margin-right:0!important;}
        .xvii-mobile-collapsible.xvii-collapsed > .xvii-collapse-head{margin:0!important;width:100%!important;}
        .market-card{align-items:center!important;grid-template-columns:minmax(0,1fr) auto auto!important;padding:4px 5px!important;min-height:48px!important;}
        .market-card-main{justify-content:center!important;}
        .market-card-action,.market-card-rating{align-self:center!important;display:flex!important;align-items:center!important;justify-content:center!important;}
        .market-card-action button{height:30px!important;min-height:30px!important;min-width:54px!important;padding:0 6px!important;}
        .market-card-rating{height:30px!important;min-height:30px!important;font-size:14px!important;}
        .market-card-name{font-size:9px!important;}
        .market-card-meta,.market-card-money{font-size:7.6px!important;}
        .market-card .human-transfer-actions.stage10c-horizontal{min-width:102px!important;}
        .market-card .human-transfer-actions.stage10c-horizontal .tiny{height:28px!important;min-height:28px!important;font-size:7px!important;padding:2px 5px!important;}
        .squad-row{grid-template-columns:minmax(0,1fr) auto auto!important;gap:4px!important;padding:3px 4px!important;min-height:31px!important;}
        .squad-row b{max-width:none!important;font-size:8.5px!important;}
        .squad-row span{font-size:7.2px!important;}
        .squad-row .human-transfer-actions.stage10c-horizontal{min-width:96px!important;}
        .squad-row .human-transfer-actions.stage10c-horizontal .tiny{font-size:7px!important;padding:1px 4px!important;}
        .league-grid{grid-template-columns:minmax(0,1fr)!important;grid-template-areas:"fixture" "news" "team" "table"!important;}
        .league-right-stack{display:contents!important;}
        .match-squad-news-box{grid-area:news!important;grid-column:1 / -1!important;width:100%!important;justify-self:stretch!important;}
        .league-table-box{grid-area:table!important;width:100%!important;}
        body:not(.phase-season) #analyticsDepartment > .xvii-collapse-head{display:none!important;}
        .xvii-help-widget{left:8px;right:8px;bottom:8px;}
        .xvii-help-grid{grid-template-columns:1fr;}
        .xvii-help-head b{font-size:10px;}
        .xvii-help-head span{display:none;}
        .xvii-help-body{padding:8px;}
      }
    `;
    document.head.appendChild(style);
  }

  function addMarketToggles(){
    injectStyle();
    if(document.getElementById('stage10cMarketToggles')) return;
    const filters=document.querySelector('.filters');
    if(!filters) return;
    const box=document.createElement('div');
    box.id='stage10cMarketToggles';
    box.className='stage10c-market-toggles';
    box.innerHTML = `
      <label class="stage10c-check"><input id="stage10cListedOnly" type="checkbox"> Transfer listed only</label>
      <label class="stage10c-check"><input id="stage10cIncludeMine" type="checkbox" checked> Include my players</label>
    `;
    filters.insertAdjacentElement('afterend', box);
    box.querySelectorAll('input').forEach(input=>input.addEventListener('change', ()=>{ if(typeof renderPlayers==='function') renderPlayers(); }));
  }

  function isListedForFilter(p){
    if(!p) return false;
    if(p.transferRequest) return true;
    if(p.owner===state.humanClub) return !!p.humanTransferListed;
    if(p.owner) return !!p.transferListed;
    return !!(typeof activePoolOffer==='function' && activePoolOffer(p));
  }

  function localTag(label, cls){ return `<span class="market-tag ${cls||''}">${esc(label)}</span>`; }
  function localMarketTags(p){
    const tags=[];
    const isMine=p?.owner===state.humanClub;
    const price=(typeof buyPrice==='function') ? buyPrice(p) : Number(p?.marketValue||0);
    const market=Number(p?.marketValue||0);
    if(isMine) tags.push(['My Squad','mine']);
    if(!p.owner) tags.push(['Pool','pool']);
    if(p.transferRequest) tags.push(['Transfer Request','request']);
    if(p.humanTransferListed && isMine) tags.push(['Transfer Listed','listed']);
    if(p.transferListed && p.owner && !isMine) tags.push(['Transfer Listed','listed']);
    if(!p.owner && typeof activePoolOffer==='function' && activePoolOffer(p)) tags.push(['Pool Deal','pool']);
    if(!isMine && market>0 && price>0 && price<market) tags.push(['Discount','discount']);
    if(!isMine && typeof canPlayerAcceptClub==='function'){
      const join=canPlayerAcceptClub(p,state.humanClub);
      tags.push(join.ok ? ['Would Join','join'] : ['Too Ambitious','ambitious']);
    }
    return tags;
  }
  function localTagsHtml(p){ const tags=localMarketTags(p); return tags.length ? `<div class="market-tag-row">${tags.map(t=>localTag(t[0],t[1])).join('')}</div>` : '<span class="muted">—</span>'; }
  function localTagsText(p){ return localMarketTags(p).map(t=>t[0]).join(' '); }
  function listedInfoHtml(p){
    if(p.transferRequest && p.owner && p.owner!==state.humanClub) return `<div class="listed-tag">TRANSFER REQUEST: ${esc(p.transferRequestReason || 'wants a move')}</div>`;
    if(p.humanTransferListed && p.owner===state.humanClub) return '<div class="listed-tag">TRANSFER LISTED BY YOU: director sale attempted next window</div>';
    if(p.transferListed && p.owner!==state.humanClub){
      const expires=Number(p.transferListExpiresMarketNo||0);
      const expiry=expires ? ` · expires after market ${expires}` : '';
      return `<div class="listed-tag">TRANSFER LISTED: asking price ${money(buyPrice(p))}${esc(expiry)}</div>`;
    }
    if(typeof isReturnableRelease==='function' && isReturnableRelease(p)) return '<div class="listed-tag">RELEASED THIS WINDOW: return at release value</div>';
    if(typeof activePoolOffer==='function' && activePoolOffer(p)) return `<div class="listed-tag">TRANSFER POOL OPPORTUNITY: temporary asking price ${money(poolOfferPrice(p))}</div>`;
    return '';
  }

  const previousHumanPlayerActionButtons = (typeof humanPlayerActionButtons==='function') ? humanPlayerActionButtons : null;
  humanPlayerActionButtons = function(p){
    if(!p || p.owner!==state.humanClub) return '';
    const disabled=state.completed?'disabled':'';
    const sellFee=(typeof instantPoolSaleFee==='function') ? instantPoolSaleFee(p) : Number(p.marketValue||0);
    const listText=(typeof humanTransferListButtonText==='function') ? humanTransferListButtonText(p) : (p.humanTransferListed?'Unlist':'List');
    const listed=(typeof humanTransferListed==='function') ? humanTransferListed(p) : !!p.humanTransferListed;
    const listTitle=listed ? 'Remove this player from your transfer list.' : 'Transfer-list this player. He stays in your squad while the director of football tries for a bigger future fee.';
    return `<div class="human-transfer-actions stage10c-horizontal"><button class="danger tiny" onclick="sellPlayerToPool(${p.id})" ${disabled} title="Immediate sale to the transfer pool for current market value">Sell ${money(sellFee)}</button><button class="secondary tiny" onclick="sellPlayer(${p.id})" ${disabled} title="${esc(listTitle)}">${esc(listText)}</button></div>`;
  };
  window.humanPlayerActionButtons=humanPlayerActionButtons;

  renderPlayerCards = function(players, totalCount){
    const box=safeEl('playerCards');
    if(!box) return;
    if(!state.started){ box.innerHTML='<div class="status">Start a transfer window.</div>'; return; }
    if(!players || !players.length){ box.innerHTML='<div class="status">No players match those filters.</div>'; return; }
    const html=players.map(p=>{
      const can=canBuy(p), isMine=p.owner===state.humanClub;
      const action=isMine ? `${humanPlayerActionButtons(p)}` : `<button class="tiny" onclick="buyPlayer(${p.id})" title="${esc(canPlayerAcceptClub(p,state.humanClub).reason || can.reason)}" ${can.ok?'':'disabled'}>${esc(can.reason)}</button>`;
      const s=playerStatus(p);
      const avail=availabilityLine(p);
      const ownerLine=`${shortPos(p.position)} · ${esc(p.originalClub)} · ${esc(s.label)}`;
      const priceText=isMine ? `Sell now ${money(instantPoolSaleFee(p))}${p.humanTransferListed?' · Listed':''}` : `Price ${money(buyPrice(p))}`;
      return `<div class="market-card"><div class="market-card-main"><div class="market-card-name" title="${esc(p.name)}">${esc(p.name)}${statusBadgesHtml(p)}</div><div class="market-card-meta">${ownerLine}</div><div class="market-card-money">Market ${money(p.marketValue)} · ${priceText}${avail?` · ${esc(avail)}`:''}</div>${localTagsHtml(p)}</div><div class="market-card-action">${action}</div><div class="market-card-rating">${ratingMovementHtml(p)}</div></div>`;
    }).join('');
    const countLine=`${totalCount} player${totalCount===1?'':'s'} found. Use the tick boxes to focus on listed players or hide your own squad.`;
    box.innerHTML=`<div class="market-card-count">${esc(countLine)}</div><div class="market-card-scroll">${html}</div>`;
  };
  window.renderPlayerCards=renderPlayerCards;

  renderPlayers = function(){
    const body=safeEl('playerRows');
    if(!body) return;
    if(!state.started){ body.innerHTML='<tr><td colspan="7" class="muted">Start a transfer window.</td></tr>'; renderPlayerCards([],0); return; }
    addMarketToggles();
    const q=(safeEl('searchInput')?.value || '').trim().toLowerCase();
    const pos=safeEl('posFilter')?.value || 'All';
    const interestF=safeEl('interestFilter')?.value || 'All';
    const listedOnly=!!safeEl('stage10cListedOnly')?.checked;
    const includeMine=safeEl('stage10cIncludeMine') ? !!safeEl('stage10cIncludeMine').checked : true;
    const maxPrice=Number(safeEl('maxPrice')?.value || Infinity);
    const minRating=Number(safeEl('minRating')?.value || 0);
    const sort=safeEl('sortBy')?.value || 'ratingDesc';
    let rows=state.players.slice();
    if(q) rows=rows.filter(p=>`${p.name} ${p.originalClub} ${p.owner || 'transfer pool'} ${p.position} ${p.transferRequestReason||''} ${localTagsText(p)}`.toLowerCase().includes(q));
    if(pos!=='All') rows=rows.filter(p=>p.position===pos);
    if(interestF==='Join') rows=rows.filter(p=>p.owner!==state.humanClub && canPlayerAcceptClub(p,state.humanClub).ok);
    if(listedOnly) rows=rows.filter(isListedForFilter);
    if(!includeMine) rows=rows.filter(p=>p.owner!==state.humanClub);
    rows=rows.filter(p=>Number(p.rating||0)>=minRating);
    rows=rows.filter(p=>p.owner===state.humanClub || buyPrice(p)<=maxPrice);
    rows.sort((a,b)=>{
      if(sort==='ratingDesc') return b.rating-a.rating || buyPrice(a)-buyPrice(b);
      if(sort==='buyAsc') return buyPrice(a)-buyPrice(b) || b.rating-a.rating;
      if(sort==='buyDesc') return buyPrice(b)-buyPrice(a) || b.rating-a.rating;
      if(sort==='marketAsc') return a.marketValue-b.marketValue || b.rating-a.rating;
      if(sort==='pos') return a.positionOrder-b.positionOrder || b.rating-a.rating;
      if(sort==='owner') return localTagsText(a).localeCompare(localTagsText(b)) || b.rating-a.rating;
      return a.name.localeCompare(b.name);
    });
    const visible=rows.slice(0,260);
    body.innerHTML=visible.map(p=>{
      const can=canBuy(p), isMine=p.owner===state.humanClub;
      const price=isMine ? (p.humanTransferListed?`Listed · Sell ${money(instantPoolSaleFee(p))}`:`Sell ${money(instantPoolSaleFee(p))}`) : money(buyPrice(p));
      const rowAction=isMine ? `${humanPlayerActionButtons(p)}` : `<button class="tiny" onclick="buyPlayer(${p.id})" title="${esc((canPlayerAcceptClub(p,state.humanClub).reason) || can.reason)}" ${can.ok?'':'disabled'}>${esc(can.reason)}</button>`;
      const avail=availabilityLine(p);
      const offer=(typeof saleOfferTagHtml==='function'?saleOfferTagHtml(p):'') + (typeof poolOfferTagHtml==='function'?poolOfferTagHtml(p):'');
      const listed=listedInfoHtml(p);
      return `<tr><td><span class="player-name">${esc(p.name)}${statusBadgesHtml(p)}</span><div class="muted">${esc(p.originalClub)}${avail?` · ${esc(avail)}`:''}</div>${offer}${listed}</td><td><span class="pill ${posClass(p.position)}">${shortPos(p.position)}</span></td><td class="num">${ratingMovementHtml(p)}</td><td>${localTagsHtml(p)}</td><td class="num">${money(p.marketValue)}</td><td class="num"><b>${price}</b></td><td class="num">${rowAction}</td></tr>`;
    }).join('') + (rows.length>visible.length?`<tr><td colspan="7" class="muted">Showing first ${visible.length} of ${rows.length}. Narrow the search to see more.</td></tr>`:'');
    renderPlayerCards(rows, rows.length);
  };
  window.renderPlayers=renderPlayers;

  function addCollapseHead(node, key, title){
    if(!node) return;
    injectStyle();
    node.classList.add('xvii-mobile-collapsible');
    node.dataset.stage10cCollapseReady='1';
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
    if(btn && !btn.dataset.stage10cClick){
      btn.dataset.stage10cClick='1';
      btn.addEventListener('click', function(ev){
        ev.preventDefault(); ev.stopPropagation();
        node.classList.toggle('xvii-collapsed');
        const now=readCollapsed(); now[key]=node.classList.contains('xvii-collapsed'); writeCollapsed(now);
        this.textContent=node.classList.contains('xvii-collapsed')?'+':'−';
      });
    }
    if(btn) btn.textContent=node.classList.contains('xvii-collapsed')?'+':'−';
    wrapCollapseBody(node);
  }

  function wrapCollapseBody(node){
    if(!node) return;
    let head=node.querySelector(':scope > .xvii-collapse-head');
    if(!head) return;
    let body=node.querySelector(':scope > .xvii-collapse-body');
    const direct=[...node.childNodes].filter(ch=>ch!==head && !(ch.nodeType===1 && ch.classList.contains('xvii-collapse-body')));
    if(!body){ body=document.createElement('div'); body.className='xvii-collapse-body'; node.appendChild(body); }
    direct.forEach(ch=>body.appendChild(ch));
  }

  function wrapAnalytics(){
    const kpis=document.querySelector('.kpis');
    if(!kpis || document.getElementById('analyticsDepartment')) return;
    const shell=document.createElement('div');
    shell.id='analyticsDepartment';
    shell.className='stage10c-analytics-shell';
    kpis.parentNode.insertBefore(shell,kpis);
    shell.appendChild(kpis);
  }

  function cleanEmptySeasonExtras(){
    const box=safeEl('mobileBottomExtras');
    if(!box) return;
    const clone=box.cloneNode(true);
    clone.querySelectorAll('.xvii-collapse-head').forEach(n=>n.remove());
    const meaningful=(clone.textContent||'').trim().length>0 || clone.querySelector('.challenge-panel,.trophy-board,.status,.panel,.fixture-box');
    box.classList.toggle('stage10c-empty-extra', !meaningful);
  }

  function applyStage10CCollapsibles(){
    injectStyle();
    wrapAnalytics();
    addCollapseHead(document.getElementById('analyticsDepartment'), 'analyticsDepartment', 'Analytics Department');
    addCollapseHead(safeEl('squadList'), 'yourSquadList', 'Your squad');
    addCollapseHead(safeEl('log')?.closest('.transaction-log'), 'transactionLogPanel', 'Transaction log');
    addCollapseHead(safeEl('tableRows')?.closest('.league-table-box'), 'leagueTablePanel', 'League table');
    addCollapseHead(document.querySelector('.rules'), 'transferRulesPanel', 'Transfer rules');
    document.querySelectorAll('.xvii-mobile-collapsible').forEach(wrapCollapseBody);
    cleanEmptySeasonExtras();
  }

  function setupHelpWidget(){
    injectStyle();
    if(document.getElementById('xviiHelpWidget')) return;
    const open=boolRead(STAGE10C.helpKey, false);
    const wrap=document.createElement('div');
    wrap.id='xviiHelpWidget';
    wrap.className='xvii-help-widget';
    wrap.innerHTML=`
      <div class="xvii-help-card ${open?'open':''}">
        <div class="xvii-help-head"><div><b>Help and game guide</b><span>Quick guide to transfers, staff, tactics and career progress</span></div><button class="secondary xvii-help-toggle" type="button">${open?'−':'+'}</button></div>
        <div class="xvii-help-body">
          <div class="xvii-help-grid">
            <div class="xvii-help-section"><h3>The core loop</h3><p>Choose a club, build a 17-player squad, pick an XI each game week and try to beat the board's expected finish. You are judged more against expectation than raw league position.</p><ul><li>Squad target: 2 goalkeepers, 5 defenders, 5 midfielders, 5 forwards.</li><li>Cash left after a window carries into your wider career budget calculations.</li><li>Promotion, relegation and job offers can change the shape of a long save.</li></ul></div>
            <div class="xvii-help-section"><h3>Buying players</h3><p>The transfer pool is made of unattached players and released players. Pool players are usually easier to buy but normally cost above market value. Transfer-listed players are special opportunities: they can be at market value or discounted.</p><ul><li>Use <b>Would Join</b> and <b>Too Ambitious</b> tags to see who is realistic.</li><li>Use the <b>Transfer listed only</b> tick box when hunting deals.</li><li>Turn off <b>Include my players</b> when you only want to see targets.</li></ul></div>
            <div class="xvii-help-section"><h3>Selling and listing</h3><p><b>Sell</b> releases a player to the pool immediately for his current market value. <b>List</b> keeps him in your squad while the director of football tests the market in a future window.</p><ul><li>Listing can create a better sale story, but it is not instant.</li><li>Transfer requests mean the player is pushing for a move.</li><li>Released players can sometimes be restored during the same window.</li></ul></div>
            <div class="xvii-help-section"><h3>Backroom staff</h3><p>Assistant manager packages improve team-picking advice, formation guidance and squad reports. Scouting packages improve market information and opposition reports.</p><ul><li>Cheap staff can make poor reads.</li><li>Better assistants are more reliable with XI, formation and mentality advice.</li><li>Better scouts give clearer market and opponent information, but football still has surprises.</li></ul></div>
            <div class="xvii-help-section"><h3>Training</h3><p>Training investment protects the squad over a long season and shapes player development. Stronger facilities give your players a better platform to improve, hold form and manage fatigue.</p><ul><li>No investment is risky across a long career.</li><li>Basic training keeps the club functional.</li><li>Elite training gives the best chance of squad-wide progress.</li></ul></div>
            <div class="xvii-help-section"><h3>Formations and mentality</h3><p>Formations change how the team approaches matches. Defensive shapes protect results, attacking shapes chase wins, and balanced shapes reduce extremes. Mentality adds another match-plan layer and affects how the result feels to fans and board.</p><ul><li>4-5-1: controlled and cautious.</li><li>4-4-2: balanced and direct.</li><li>4-3-3: front-foot attacking.</li><li>3-5-2: midfield overload.</li><li>3-4-3: aggressive and risky.</li></ul></div>
            <div class="xvii-help-section"><h3>Fatigue, cards and injuries</h3><p>Players have starts remaining. Forwards burn out fastest, then midfielders, defenders and goalkeepers. Injuries and suspensions make squad depth matter.</p><ul><li>Burnt-out players need rest.</li><li>Yellow cards can build into suspensions.</li><li>Red cards and injuries can explain difficult results and selection problems.</li></ul></div>
            <div class="xvii-help-section"><h3>Board, fans and narrative</h3><p>The board mainly cares about expectations, records, survival, promotions and reputation. Fans care about rivals, style, bravery, big wins and embarrassing moments.</p><ul><li>Fans can be fickle.</li><li>Board patience depends on career mode and manager reputation.</li><li>Narrative reports help tell the story of the save.</li></ul></div>
            <div class="xvii-help-section"><h3>Manager reputation</h3><p>You start as an inexperienced manager. Reputation grows through strong seasons, promotions, survival jobs, records, challenges and long-term club progress.</p><ul><li>Higher reputation improves player pull.</li><li>Better reputation unlocks bigger jobs.</li><li>Risk Career can bring sackings if you badly miss expectation.</li></ul></div>
            <div class="xvii-help-section"><h3>Badges and challenges</h3><p>Season challenges give each save extra targets beyond the league table. Badges reward memorable achievements and give your career extra identity.</p><ul><li>Some are board-driven.</li><li>Some are fan-driven.</li><li>The Decimator is the long-term ultimate challenge.</li></ul></div>
            <div class="xvii-help-section"><h3>Budgets and prize money</h3><p>Your budget is shaped by club level, cash carried over, prize money, promotions, relegations and board decisions. Smaller clubs can grow, but careless windows can leave you short.</p><ul><li>Spending on staff helps management but reduces player budget.</li><li>Relegated clubs can still rebuild.</li><li>Promotion can create a major step up in expectations.</li></ul></div>
            <div class="xvii-help-section"><h3>Long careers</h3><p>Long saves are meant to create stories. Players may request moves, decline, return to the pool, or eventually leave for new challenges as the project evolves. Future career systems will add even more ownership, longevity and club-growth decisions.</p><ul><li>Do not rely on one super squad forever.</li><li>Keep refreshing the team.</li><li>Use staff and scouting to prepare for rebuilds.</li></ul></div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const card=wrap.querySelector('.xvii-help-card');
    const btn=wrap.querySelector('.xvii-help-toggle');
    btn.addEventListener('click', function(){
      card.classList.toggle('open');
      const isOpen=card.classList.contains('open');
      this.textContent=isOpen?'−':'+';
      boolWrite(STAGE10C.helpKey, isOpen);
    });
  }

  function polishPublicVersionText(){
    document.title = 'XVII | Build the seventeen. Pick the eleven.';
    document.querySelectorAll('.brand-db').forEach(n=>{ n.textContent='25/26 League Database + European Pool + Second Division'; });
  }

  const previousRender = (typeof render==='function') ? render : null;
  render = function(){
    const out=previousRender ? previousRender.apply(this, arguments) : undefined;
    addMarketToggles();
    applyStage10CCollapsibles();
    setupHelpWidget();
    polishPublicVersionText();
    return out;
  };
  window.render=render;

  function bootStage10C(){
    injectStyle();
    polishPublicVersionText();
    addMarketToggles();
    applyStage10CCollapsibles();
    setupHelpWidget();
    if(typeof render==='function') render();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bootStage10C); else bootStage10C();
})();
