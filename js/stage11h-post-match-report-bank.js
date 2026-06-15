/* Stage 11H: Post-match Report Rework and Phrase Bank.
   Turns hidden match facts into short football story language. No engine/roll/modifier language. */
(function(){
  if(window.__stage11hPostMatchReportBank) return;
  window.__stage11hPostMatchReportBank = true;

  const VERSION='Version 13C · Beta';
  const RECENT_LIMIT=18;

  function el(id){ return document.getElementById(id); }
  function esc(s){
    if(typeof escapeHtml==='function') return escapeHtml(s);
    return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function clamp(n,a,b){ return Math.max(a,Math.min(b,n)); }
  function pctDiff(a,b){ return (Number(a||0)-Number(b||0))/Math.max(1,Number(b||0)); }
  function rawChoice(){
    const mobile=el('formationSelectMobile'), desktop=el('formationSelect');
    try{ if(typeof isMobileLayout==='function' && isMobileLayout() && mobile) return mobile.value; }catch(e){}
    return desktop ? desktop.value : (mobile ? mobile.value : '4-4-2');
  }
  function hasCustomActive(mapped){
    const raw=rawChoice();
    if(raw==='Custom Tactic') return true;
    const t=state && state.customTactic;
    return !!(t && t.saved && t.mappedFormation===mapped && raw==='Custom Tactic');
  }
  function tagsForTactic(){
    const t=state && state.customTactic;
    const tags=Array.isArray(t?.tags) ? t.tags.slice() : [];
    return new Set(tags);
  }
  function tokenStats(){
    const t=state && state.customTactic;
    const tokens=Array.isArray(t?.tokens) ? t.tokens : [];
    const stats={forward:0,backward:0,wide:0,inside:0,deepMid:0,wideDeepMid:0,highDef:0};
    for(const tok of tokens){
      if(tok.role==='Goalkeeper') continue;
      if(tok.arrow==='forward') stats.forward++;
      if(tok.arrow==='backward') stats.backward++;
      if(tok.arrow==='wide') stats.wide++;
      if(tok.arrow==='inside') stats.inside++;
      const x=Number(tok.x||50), y=Number(tok.y||50);
      if(tok.role==='Midfielder' && (y>=58 || tok.arrow==='backward')) stats.deepMid++;
      if(tok.role==='Midfielder' && (x<22 || x>78) && (y>=50 || tok.arrow==='backward')) stats.wideDeepMid++;
      if(tok.role==='Defender' && y<76) stats.highDef++;
    }
    return stats;
  }
  function humanCtx(r){
    const home=r.home===state.humanClub;
    const gf=home?r.hg:r.ag, ga=home?r.ag:r.hg;
    const humanForm=home?r.homeForm:r.awayForm;
    const oppForm=home?r.awayForm:r.homeForm;
    const opp=home?r.away:r.home;
    const hs=home?r.hs:r.as, os=home?r.as:r.hs;
    const ctx={
      home,gf,ga,opp,humanForm,oppForm,
      outcome:gf>ga?'win':gf<ga?'loss':'draw',
      margin:gf-ga,
      strength:pctDiff(hs?.strength,os?.strength),
      attack:pctDiff(hs?.attack,os?.attack),
      defence:pctDiff(hs?.defence,os?.defence),
      threat:pctDiff(home?r.homeThreat:r.awayThreat,home?r.awayThreat:r.homeThreat),
      gkDiff:Number(hs?.gk||0)-Number(os?.gk||0),
      tired:home?r.homeTired:r.awayTired,
      exhausted:home?r.homeExhausted:r.awayExhausted,
      oppTired:home?r.awayTired:r.homeTired,
      oppExhausted:home?r.awayExhausted:r.homeExhausted,
      winChance:home?r.homeWinChance:r.awayWinChance,
      lossChance:home?r.awayWinChance:r.homeWinChance,
      drawChance:r.drawChance,
      redCard:r.humanRedCard||null,
      custom:hasCustomActive(humanForm),
      tags:tagsForTactic(),
      tokens:tokenStats(),
      rivalry:false,
      expectedEdge:0,
      swings:[]
    };
    try{ ctx.rivalry=typeof isRivalOpponentName==='function' && isRivalOpponentName(opp); }catch(e){}
    try{ ctx.expectedEdge=expectedFinish(opp)-expectedFinish(state.humanClub); }catch(e){ ctx.expectedEdge=0; }
    try{ if(typeof swingSummaryForResult==='function') ctx.swings=swingSummaryForResult(r,state.humanClub,2) || []; }catch(e){ ctx.swings=[]; }
    ctx.shapeName=ctx.custom ? 'your custom shape' : `your ${humanForm}`;
    ctx.shapeShort=ctx.custom ? 'the shape' : `the ${humanForm}`;
    ctx.resultText=ctx.outcome==='win'?'won':ctx.outcome==='loss'?'lost':'drew';
    return ctx;
  }

  const BANK={
    feel:[
      {id:'feel-tight-01',t:'This was a tight, awkward game that never fully settled.',when:c=>Math.abs(c.margin)<=1},
      {id:'feel-tight-02',t:'For long spells, it felt like a match of details rather than dominance.',when:c=>Math.abs(c.strength)<0.08},
      {id:'feel-tight-03',t:'Neither side completely took hold of the afternoon, which made every loose moment feel important.',when:c=>Math.abs(c.margin)<=1},
      {id:'feel-tight-04',t:'The game had a restless rhythm, with control moving from one side to the other.',when:c=>Math.abs(c.attack)<0.10},
      {id:'feel-tight-05',t:'This never became a clean contest; it was decided through pressure building in small moments.',when:c=>true},
      {id:'feel-win-01',t:'The match opened up nicely once your side found a foothold.',when:c=>c.outcome==='win'},
      {id:'feel-win-02',t:'This felt like a professional day once the first big moments went your way.',when:c=>c.outcome==='win' && c.margin>=1},
      {id:'feel-win-03',t:'Your side looked increasingly comfortable as the match wore on.',when:c=>c.outcome==='win' && c.defence>=-0.08},
      {id:'feel-win-04',t:'It was not all smooth, but the important spells belonged to you.',when:c=>c.outcome==='win'},
      {id:'feel-win-05',t:'The crowd could sense the result building before the scoreline finally confirmed it.',when:c=>c.outcome==='win' && c.home},
      {id:'feel-loss-01',t:'This became a difficult watch once the game started to stretch.',when:c=>c.outcome==='loss'},
      {id:'feel-loss-02',t:'The defeat came from a series of small problems rather than one obvious collapse.',when:c=>c.outcome==='loss' && Math.abs(c.margin)<=2},
      {id:'feel-loss-03',t:'The match kept pulling your side into uncomfortable areas.',when:c=>c.outcome==='loss'},
      {id:'feel-loss-04',t:'There were spells where the plan looked clear, but the game punished the weaker details.',when:c=>c.outcome==='loss'},
      {id:'feel-loss-05',t:'The result felt harsh in places, but the warning signs were there as the match wore on.',when:c=>c.outcome==='loss' && c.winChance>c.lossChance},
      {id:'feel-draw-01',t:'This was a tense draw, short on comfort and full of half-moments.',when:c=>c.outcome==='draw'},
      {id:'feel-draw-02',t:'The game threatened to break open several times but never fully did.',when:c=>c.outcome==='draw'},
      {id:'feel-draw-03',t:'A point felt about right by the end, even if both benches will see chances to regret.',when:c=>c.outcome==='draw'},
      {id:'feel-draw-04',t:'It was a balanced match, with both sides having enough to worry the other but not enough to finish the job.',when:c=>c.outcome==='draw'},
      {id:'feel-bigwin-01',t:'Once the match turned your way, it became a statement rather than just a result.',when:c=>c.outcome==='win' && c.margin>=3},
      {id:'feel-heavy-loss-01',t:'By the end, the scoreline made the performance feel worse than the opening stages suggested.',when:c=>c.outcome==='loss' && c.margin<=-3},
      {id:'feel-rival-01',t:'The edge around the fixture was obvious, and every challenge felt a little louder.',when:c=>c.rivalry},
      {id:'feel-away-01',t:'Away from home, the game demanded patience and concentration more than flair.',when:c=>!c.home},
      {id:'feel-home-01',t:'At home, the crowd expected the team to impose itself earlier than it did.',when:c=>c.home && c.outcome!=='win'},
      {id:'feel-fine-01',t:'This was one of those fixtures where the story changed with each spell of pressure.',when:c=>true},
      {id:'feel-fine-02',t:'The scoreline tells the simple version; the performance was more complicated than that.',when:c=>true},
      {id:'feel-fine-03',t:'The match had enough uncertainty that the final result will shape how the setup is remembered.',when:c=>true},
      {id:'feel-fine-04',t:'It never felt completely safe, even when the structure looked sensible.',when:c=>true},
      {id:'feel-fine-05',t:'This was a game where momentum mattered as much as the team sheet.',when:c=>true},
      {id:'feel-fine-06',t:'The big moments arrived in bursts, which made the result feel fragile until the end.',when:c=>true}
    ],
    tactic:[
      {id:'tac-custom-01',t:'Your custom shape gave the side a clear identity, which is exactly what supporters want to feel when there is no match to watch.',when:c=>c.custom},
      {id:'tac-custom-02',t:'The shape looked designed rather than accidental, and that gave the post-match reaction something real to attach to.',when:c=>c.custom},
      {id:'tac-custom-03',t:'The drawing board showed on the pitch: the team had a recognisable plan, even if the execution was not always clean.',when:c=>c.custom},
      {id:'tac-balanced-01',t:'The setup was balanced enough that the result will matter more to fans than the formation debate.',when:c=>!c.tags.has('Attacking')&&!c.tags.has('Very attacking')&&!c.tags.has('Cautious')},
      {id:'tac-balanced-02',t:'There was nothing reckless in the shape, but it still needed the players to win their individual battles.',when:c=>!c.tags.has('Very attacking')&&!c.tags.has('Risky in transition')},
      {id:'tac-att-01',t:'The attacking intent was obvious, especially when players were asked to step forward early.',when:c=>c.tags.has('Attacking')||c.tags.has('Very attacking')||c.tokens.forward>=3},
      {id:'tac-att-02',t:'The plan tried to put the opposition under pressure rather than waiting for mistakes.',when:c=>c.tags.has('Attacking')||c.tags.has('Very attacking')},
      {id:'tac-att-03',t:'There was ambition in the setup, but ambition is judged very differently after a win than after a defeat.',when:c=>c.tags.has('Attacking')||c.tags.has('Very attacking')},
      {id:'tac-att-04',t:'The side looked front-footed, which gave the crowd something to get behind.',when:c=>(c.tags.has('Attacking')||c.tags.has('Very attacking'))&&c.outcome==='win'},
      {id:'tac-att-05',t:'The same bravery that looked exciting before kick-off felt easier to question once spaces appeared.',when:c=>(c.tags.has('Attacking')||c.tags.has('Very attacking'))&&c.outcome==='loss'},
      {id:'tac-risk-01',t:'When the game opened up, the space behind the more adventurous players became harder to ignore.',when:c=>c.tags.has('Risky in transition')||c.tokens.highDef>=2},
      {id:'tac-risk-02',t:'The plan asked a lot of the recovery runners, and that became the main tactical talking point.',when:c=>c.tags.has('Risky in transition')||c.tokens.forward>=4},
      {id:'tac-risk-03',t:'It looked brave on the board, but brave shapes need clean possession to avoid becoming stretched.',when:c=>c.tags.has('Risky in transition')||c.tags.has('Very attacking')},
      {id:'tac-caut-01',t:'The recovery instructions gave the side a more protective look.',when:c=>c.tags.has('Cautious')||c.tokens.backward>=3},
      {id:'tac-caut-02',t:'The setup gave you structure, though some supporters will always want more risk when points are available.',when:c=>c.tags.has('Cautious')||c.tokens.backward>=3},
      {id:'tac-caut-03',t:'It was a sensible idea on paper, but cautious football is praised only when the result backs it up.',when:c=>(c.tags.has('Cautious')||c.tokens.backward>=3)&&c.outcome!=='win'},
      {id:'tac-caut-04',t:'The team looked harder to pull apart, which helped the result feel more controlled.',when:c=>(c.tags.has('Cautious')||c.tokens.backward>=3)&&c.outcome==='win'},
      {id:'tac-wide-01',t:'The wide instructions gave the team more width and helped stretch the pitch.',when:c=>c.tags.has('Wide')||c.tokens.wide>=2},
      {id:'tac-wide-02',t:'Your wide players gave the opposition something to think about, but the middle still had to be protected.',when:c=>c.tags.has('Wide')||c.tokens.wide>=2},
      {id:'tac-wide-03',t:'The plan clearly tried to create space outside, which made the team look more expansive.',when:c=>c.tags.has('Wide')||c.tokens.wide>=2},
      {id:'tac-wide-04',t:'Width gave you territory, but territory only counts if the final action is sharp enough.',when:c=>c.tags.has('Wide')||c.tokens.wide>=2},
      {id:'tac-narrow-01',t:'The inside movements gave the side bodies around the ball, although attacks sometimes felt crowded.',when:c=>c.tags.has('Narrow rotations')||c.tokens.inside>=2},
      {id:'tac-narrow-02',t:'The narrow rotations made the plan feel intricate rather than direct.',when:c=>c.tags.has('Narrow rotations')||c.tokens.inside>=2},
      {id:'tac-narrow-03',t:'You tried to control the middle of the pitch, but the opposition were sometimes happy to force you sideways.',when:c=>c.tags.has('Narrow rotations')||c.tokens.inside>=2},
      {id:'tac-back5-01',t:'The wide midfielders dropped into a more protective line, giving the setup a back-five feel without naming it that way.',when:c=>c.tags.has('Back-five feel')||c.tokens.wideDeepMid>=2},
      {id:'tac-back5-02',t:'That deeper wide-midfield look will be called mature after a result and negative after a bad one.',when:c=>c.tags.has('Back-five feel')||c.tokens.wideDeepMid>=2},
      {id:'tac-back5-03',t:'The flanks had extra cover, but the trade-off was always going to be how quickly the team could break out.',when:c=>c.tags.has('Back-five feel')||c.tokens.wideDeepMid>=2},
      {id:'tac-442-01',t:'The two-forward shape gave the team a natural outlet and kept the centre-backs occupied.',when:c=>!c.custom && c.humanForm==='4-4-2'},
      {id:'tac-433-01',t:'The front three made the side look aggressive and stretched the opposition line.',when:c=>!c.custom && c.humanForm==='4-3-3'},
      {id:'tac-451-01',t:'The extra midfielder gave the side a steadier base, though it asked the front player to carry a lot alone.',when:c=>!c.custom && c.humanForm==='4-5-1'},
      {id:'tac-352-01',t:'The midfield numbers helped the side compete centrally while still leaving two forwards as an outlet.',when:c=>!c.custom && c.humanForm==='3-5-2'},
      {id:'tac-343-01',t:'The shape carried obvious attacking intent, but it needed discipline behind the ball.',when:c=>!c.custom && c.humanForm==='3-4-3'},
      {id:'tac-generic-01',t:'The plan was clear enough; the question was whether the players could make the best moments count.',when:c=>true},
      {id:'tac-generic-02',t:'The setup gave you a route into the match, but not every route became a chance.',when:c=>true},
      {id:'tac-generic-03',t:'There was a tactical story here, but the result will decide whether people call it clever or cautious.',when:c=>true},
      {id:'tac-generic-04',t:'The board will care about control; the fans will remember whether the shape felt brave enough.',when:c=>true},
      {id:'tac-generic-05',t:'The approach made sense in phases, but the match did not always follow the script.',when:c=>true}
    ],
    reason:[
      {id:'why-strength-plus-01',t:'Your overall quality showed in the key moments, even when the game was not completely comfortable.',when:c=>c.strength>=0.08&&c.outcome==='win'},
      {id:'why-strength-plus-02',t:'The stronger XI gave you enough margin for small mistakes not to ruin the day.',when:c=>c.strength>=0.08&&c.outcome==='win'},
      {id:'why-strength-minus-01',t:'The opposition had more quality in the areas that mattered, and that made the result feel less random.',when:c=>c.strength<=-0.08&&c.outcome==='loss'},
      {id:'why-strength-minus-02',t:'This was not just bad luck; they had enough quality to keep asking harder questions.',when:c=>c.strength<=-0.08&&c.outcome==='loss'},
      {id:'why-fine-loss-01',t:'You were close enough to get something, but the important details fell the other way.',when:c=>c.outcome==='loss'&&Math.abs(c.strength)<0.08},
      {id:'why-fine-win-01',t:'Fine margins went your way, and that is often the difference between a good plan and a questioned one.',when:c=>c.outcome==='win'&&Math.abs(c.strength)<0.08},
      {id:'why-attack-plus-01',t:'Your attacking players carried the cleaner threat and gave the result a foundation.',when:c=>c.attack>=0.08&&c.outcome==='win'},
      {id:'why-attack-plus-02',t:'The front line had enough sharpness to turn promising positions into proper pressure.',when:c=>c.attack>=0.08},
      {id:'why-attack-minus-01',t:'You struggled to turn approach play into clean chances, which left the result vulnerable.',when:c=>c.attack<=-0.08&&c.outcome!=='win'},
      {id:'why-attack-minus-02',t:'The final third lacked the bite needed to make the setup look convincing.',when:c=>c.attack<=-0.08},
      {id:'why-def-plus-01',t:'The defensive structure held up well enough to stop the match becoming frantic.',when:c=>c.defence>=0.08&&c.outcome!=='loss'},
      {id:'why-def-plus-02',t:'Your back line and keeper gave the rest of the side a platform.',when:c=>c.defence>=0.08},
      {id:'why-def-minus-01',t:'They found cleaner routes into dangerous areas than you would want.',when:c=>c.defence<=-0.08&&c.outcome!=='win'},
      {id:'why-def-minus-02',t:'The protection around your box was not always convincing, especially as the match opened up.',when:c=>c.defence<=-0.08},
      {id:'why-threat-plus-01',t:'The match-up suited your forwards more often than theirs, which helped tilt the better chances your way.',when:c=>c.threat>=0.08&&c.outcome==='win'},
      {id:'why-threat-plus-02',t:'When the game reached the final third, your side looked more likely to produce the decisive action.',when:c=>c.threat>=0.08},
      {id:'why-threat-minus-01',t:'The cleaner threat came at the other end, and that is why the result cannot be dismissed as a fluke.',when:c=>c.threat<=-0.08&&c.outcome==='loss'},
      {id:'why-threat-minus-02',t:'They carried the more convincing danger when attacks reached the decisive area.',when:c=>c.threat<=-0.08},
      {id:'why-gk-plus-01',t:'Your goalkeeper helped keep the match under control during the spell when pressure built.',when:c=>c.gkDiff>=5&&c.outcome!=='loss'},
      {id:'why-gk-plus-02',t:'The keeper gave you a quiet but important edge.',when:c=>c.gkDiff>=5},
      {id:'why-gk-minus-01',t:'Their keeper made your best moments feel less valuable than they looked.',when:c=>c.gkDiff<=-5&&c.outcome!=='win'},
      {id:'why-gk-minus-02',t:'You met a goalkeeper who had enough about him to turn pressure into frustration.',when:c=>c.gkDiff<=-5},
      {id:'why-fatigue-01',t:'Fatigue mattered: too many starters were carrying heavy legs by the time the match needed energy.',when:c=>c.exhausted>0||c.tired>=3},
      {id:'why-fatigue-02',t:'The squad looked stretched, and the late-game sharpness suffered for it.',when:c=>c.exhausted>0||c.tired>=3},
      {id:'why-fatigue-03',t:'Rotation will be part of the post-match conversation after that performance.',when:c=>c.exhausted>0||c.tired>=4},
      {id:'why-opp-fatigue-01',t:'The opposition were carrying tired bodies too, which made the game scrappier than expected.',when:c=>c.oppExhausted>0||c.oppTired>=3},
      {id:'why-red-01',t:'The disciplinary incident after the match adds to the frustration and creates a selection problem now.',when:c=>!!c.redCard},
      {id:'why-red-02',t:'The red card narrative will dominate the reaction, even if it was not the only reason the match got away.',when:c=>!!c.redCard&&c.outcome==='loss'},
      {id:'why-swing-01',t:'One or two individual performances moved the mood of the game more than the team shape did.',when:c=>c.swings.length>0},
      {id:'why-swing-02',t:'The match turned on individual details as much as the broader plan.',when:c=>c.swings.length>0},
      {id:'why-upset-win-01',t:'This had the feel of a result earned through nerve and timing rather than comfort.',when:c=>c.outcome==='win'&&c.winChance<c.lossChance-0.08},
      {id:'why-unlucky-loss-01',t:'You had enough of the match to feel aggrieved, but the decisive moments did not go your way.',when:c=>c.outcome==='loss'&&c.winChance>c.lossChance+0.08},
      {id:'why-draw-01',t:'The draw reflected a match where neither side quite turned pressure into authority.',when:c=>c.outcome==='draw'},
      {id:'why-draw-02',t:'You had enough structure to avoid being overrun, but not enough cutting edge to make the point feel like more.',when:c=>c.outcome==='draw'},
      {id:'why-draw-03',t:'It was a fair point, but not a performance that ends the debate.',when:c=>c.outcome==='draw'},
      {id:'why-better-opp-01',t:'Against a side expected to finish higher, the result will be judged with some realism.',when:c=>c.expectedEdge<0&&c.outcome!=='loss'},
      {id:'why-worse-opp-01',t:'Against a side expected to finish below you, the missed opportunity will annoy people.',when:c=>c.expectedEdge>3&&c.outcome!=='win'},
      {id:'why-control-01',t:'The result came down to control in the middle third and sharpness at either end.',when:c=>true},
      {id:'why-control-02',t:'The pattern was understandable, but the cleaner chances decided the story.',when:c=>true},
      {id:'why-control-03',t:'There were enough promising spells to learn from, and enough weak spells to worry about.',when:c=>true},
      {id:'why-control-04',t:'The team sheet gave you a chance; the decisive actions wrote the result.',when:c=>true},
      {id:'why-control-05',t:'The match did not hinge on one single thing, which makes the review more useful than the scoreline alone.',when:c=>true}
    ],
    reaction:[
      {id:'react-win-01',t:'Supporters will enjoy the result first and debate the details later.',when:c=>c.outcome==='win'},
      {id:'react-win-02',t:'The fans saw enough intent to leave happy, and the board will like the sense of control.',when:c=>c.outcome==='win'&&c.defence>=-0.08},
      {id:'react-win-03',t:'The board will call it a strong day because the result matched the responsibility of the job.',when:c=>c.outcome==='win'},
      {id:'react-win-04',t:'The dressing room should take confidence from a plan that survived the difficult spells.',when:c=>c.outcome==='win'},
      {id:'react-win-att-01',t:'Fans will call the attacking approach brave because the result protected it.',when:c=>c.outcome==='win'&&(c.tags.has('Attacking')||c.tags.has('Very attacking'))},
      {id:'react-win-caut-01',t:'Cautious elements will be described as maturity rather than fear because the result came with them.',when:c=>c.outcome==='win'&&(c.tags.has('Cautious')||c.tokens.backward>=3)},
      {id:'react-loss-01',t:'Supporters are frustrated rather than confused; they can see where the match slipped.',when:c=>c.outcome==='loss'},
      {id:'react-loss-02',t:'The board will treat this as a warning sign, not a crisis, unless it becomes a pattern.',when:c=>c.outcome==='loss'&&c.margin>=-2},
      {id:'react-loss-03',t:'The fans will question the plan because defeat always makes the same choices look louder.',when:c=>c.outcome==='loss'},
      {id:'react-loss-04',t:'The dressing room needs a clean next selection, because the mood after that could drag.',when:c=>c.outcome==='loss'},
      {id:'react-loss-att-01',t:'The attacking shape is being called naive now, even though the same setup would have been praised with a win.',when:c=>c.outcome==='loss'&&(c.tags.has('Attacking')||c.tags.has('Very attacking'))},
      {id:'react-loss-caut-01',t:'The cautious look will be criticised because losing cautiously rarely satisfies supporters.',when:c=>c.outcome==='loss'&&(c.tags.has('Cautious')||c.tokens.backward>=3)},
      {id:'react-draw-01',t:'The point will be accepted, but it will not stop people asking whether the team could have been braver.',when:c=>c.outcome==='draw'},
      {id:'react-draw-02',t:'The board will see the draw as stability; fans may see it as a missed chance.',when:c=>c.outcome==='draw'},
      {id:'react-draw-03',t:'This is the sort of draw that keeps a season moving without fully satisfying anyone.',when:c=>c.outcome==='draw'},
      {id:'react-rival-win-01',t:'Because it came against a rival, the supporters will remember the result long after the tactical debate fades.',when:c=>c.rivalry&&c.outcome==='win'},
      {id:'react-rival-loss-01',t:'Losing this fixture will hurt more than the table alone can show.',when:c=>c.rivalry&&c.outcome==='loss'},
      {id:'react-rival-draw-01',t:'A rival draw leaves the argument alive until the return game.',when:c=>c.rivalry&&c.outcome==='draw'},
      {id:'react-underdog-win-01',t:'Beating a side expected to finish above you will buy goodwill quickly.',when:c=>c.expectedEdge<0&&c.outcome==='win'},
      {id:'react-favourite-loss-01',t:'Dropping points here will sting because the expectation was to look stronger than that.',when:c=>c.expectedEdge>3&&c.outcome!=='win'},
      {id:'react-home-loss-01',t:'At home, the reaction will be sharper because the crowd expected more authority.',when:c=>c.home&&c.outcome==='loss'},
      {id:'react-away-point-01',t:'Away from home, the point will be easier to defend in the review.',when:c=>!c.home&&c.outcome==='draw'},
      {id:'react-heavy-win-01',t:'A scoreline like that changes the mood around the club for the week.',when:c=>c.outcome==='win'&&c.margin>=3},
      {id:'react-heavy-loss-01',t:'The size of the defeat will make calm explanations harder to sell.',when:c=>c.outcome==='loss'&&c.margin<=-3},
      {id:'react-generic-01',t:'The reaction will follow the result, but the report gives you clues for the next selection.',when:c=>true},
      {id:'react-generic-02',t:'There is enough here to adjust, not enough to panic.',when:c=>c.outcome!=='loss'},
      {id:'react-generic-03',t:'The next team sheet now matters because it tells everyone what you learned.',when:c=>true},
      {id:'react-generic-04',t:'The board and fans will not read this in the same way, which is exactly why the next result matters.',when:c=>true},
      {id:'react-generic-05',t:'This is the sort of performance that needs a response more than an explanation.',when:c=>c.outcome==='loss'},
      {id:'react-generic-06',t:'The post-match mood is manageable, but only if the next round feels sharper.',when:c=>true}
    ],
    headline:[
      {id:'head-win-01',t:'Job done: the plan survived the pressure and delivered the result.',when:c=>c.outcome==='win'},
      {id:'head-win-02',t:'A good day: the XI found enough quality when the match asked for it.',when:c=>c.outcome==='win'},
      {id:'head-win-03',t:'The result gives the tactic breathing room.',when:c=>c.outcome==='win'&&c.custom},
      {id:'head-loss-01',t:'A difficult result, but the report points to where the match turned.',when:c=>c.outcome==='loss'},
      {id:'head-loss-02',t:'Defeat leaves questions over selection, shape and tired legs.',when:c=>c.outcome==='loss'},
      {id:'head-loss-03',t:'The plan had moments, but the result exposed the weak points.',when:c=>c.outcome==='loss'},
      {id:'head-draw-01',t:'Fine margins: the point keeps things moving, but the review still matters.',when:c=>c.outcome==='draw'},
      {id:'head-draw-02',t:'A balanced result from a match that never fully settled.',when:c=>c.outcome==='draw'},
      {id:'head-rival-win-01',t:'Derby day delivered: the result will carry weight with supporters.',when:c=>c.rivalry&&c.outcome==='win'},
      {id:'head-rival-loss-01',t:'Rival pain: this one will make the week feel longer.',when:c=>c.rivalry&&c.outcome==='loss'},
      {id:'head-upset-win-01',t:'Statement result: the side found a way when the fixture looked awkward.',when:c=>c.outcome==='win'&&c.expectedEdge<0},
      {id:'head-heavy-loss-01',t:'A heavy one: the scoreline will dominate the reaction.',when:c=>c.outcome==='loss'&&c.margin<=-3}
    ]
  };

  function recentSet(){
    if(!state || !state.season) return new Set();
    const list=Array.isArray(state.season.recentPostMatchPhraseIds) ? state.season.recentPostMatchPhraseIds : [];
    return new Set(list);
  }
  function remember(ids){
    if(!state || !state.season) return;
    const list=Array.isArray(state.season.recentPostMatchPhraseIds) ? state.season.recentPostMatchPhraseIds.slice() : [];
    ids.forEach(id=>{ const i=list.indexOf(id); if(i>=0) list.splice(i,1); list.push(id); });
    state.season.recentPostMatchPhraseIds=list.slice(-RECENT_LIMIT);
  }
  function pick(bankName,ctx){
    const bank=BANK[bankName] || [];
    const usable=bank.filter(x=>!x.when || x.when(ctx));
    if(!usable.length) return {id:`${bankName}-fallback`,t:''};
    const recent=recentSet();
    const fresh=usable.filter(x=>!recent.has(x.id));
    const pool=fresh.length ? fresh : usable;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function extraLine(ctx){
    const lines=[];
    if(ctx.redCard){
      const name=ctx.redCard.name || 'one of your players';
      lines.push(`${name}'s red card now creates a selection problem as well as a talking point.`);
    }
    if(ctx.swings && ctx.swings.length){
      lines.push(`Individual detail: ${ctx.swings.join('; ')}.`);
    }
    if(state?.season?.humanLossStreak>=5){
      if(state.season.humanLossStreak===5) lines.push('Five straight defeats means the crowd are starting to turn.');
      else if(state.season.humanLossStreak===6) lines.push('Six losses in a row will bring board pressure into every selection call.');
      else lines.push('The pressure is now brutal, and every team sheet will be judged before kick-off.');
    }
    return lines.join(' ');
  }
  function buildReport(ctx){
    const feel=pick('feel',ctx), tactic=pick('tactic',ctx), reason=pick('reason',ctx), reaction=pick('reaction',ctx);
    remember([feel.id,tactic.id,reason.id,reaction.id]);
    const p1=`${feel.t} ${ctx.home?'At home':'Away from home'}, you ${ctx.resultText} ${ctx.gf}-${ctx.ga}.`;
    const p2=`${tactic.t} ${reason.t}`;
    const p3=`${reaction.t}${extraLine(ctx)?' '+extraLine(ctx):''}`;
    return [p1,p2,p3].join('\n\n');
  }

  const originalMakeHumanCommentary = typeof makeHumanCommentary==='function' ? makeHumanCommentary : null;
  makeHumanCommentary=function(r){
    try{ return buildReport(humanCtx(r)); }
    catch(e){ return originalMakeHumanCommentary ? originalMakeHumanCommentary(r) : 'Post-match report unavailable.'; }
  };
  window.makeHumanCommentary=makeHumanCommentary;

  const originalPostMatchHeadline = typeof postMatchHeadline==='function' ? postMatchHeadline : null;
  postMatchHeadline=function(r){
    try{ const ctx=humanCtx(r); const h=pick('headline',ctx); remember([h.id]); return h.t; }
    catch(e){ return originalPostMatchHeadline ? originalPostMatchHeadline(r) : 'Post-match report'; }
  };
  window.postMatchHeadline=postMatchHeadline;

  function disablePlayUntilReady(){
    const available=!!(state && state.started && state.completed && state.season && state.season.roundIndex<38);
    const ready=available && typeof lineupComplete==='function' && lineupComplete();
    [el('playRoundBtn'),el('playRoundBtnMobile')].forEach(btn=>{
      if(!btn) return;
      btn.disabled=!ready;
      btn.title=ready?'Play the selected fixture.':'Pick a full starting XI before playing the fixture.';
    });
  }
  const originalRenderLeague = typeof renderLeague==='function' ? renderLeague : null;
  if(originalRenderLeague && !window.__stage11hRenderLeaguePatched){
    window.__stage11hRenderLeaguePatched=true;
    renderLeague=function(){
      const out=originalRenderLeague.apply(this,arguments);
      try{ disablePlayUntilReady(); tidyPostMatchBox(); }catch(e){}
      return out;
    };
    window.renderLeague=renderLeague;
  }
  const originalRenderTeamSelection = typeof renderTeamSelection==='function' ? renderTeamSelection : null;
  if(originalRenderTeamSelection && !window.__stage11hRenderTeamPatched){
    window.__stage11hRenderTeamPatched=true;
    renderTeamSelection=function(){
      const out=originalRenderTeamSelection.apply(this,arguments);
      try{ disablePlayUntilReady(); }catch(e){}
      return out;
    };
    window.renderTeamSelection=renderTeamSelection;
  }
  const originalPlayNextRound = typeof playNextRound==='function' ? playNextRound : null;
  if(originalPlayNextRound && !window.__stage11hPlayPatched){
    window.__stage11hPlayPatched=true;
    playNextRound=function(auto){
      const before=state?.season ? Number(state.season.roundIndex||0) : -1;
      const out=originalPlayNextRound.apply(this,arguments);
      const after=state?.season ? Number(state.season.roundIndex||0) : -1;
      if(!auto && after>before && state?.season && after<38){
        try{ if(typeof resetSelection==='function') resetSelection(); }catch(e){}
        try{ if(typeof renderLeague==='function') renderLeague(); }catch(e){}
        try{ if(typeof scrollToPostMatch==='function') scrollToPostMatch(); }catch(e){}
      }
      try{ disablePlayUntilReady(); tidyPostMatchBox(); }catch(e){}
      return out;
    };
    window.playNextRound=playNextRound;
  }

  function tidyPostMatchBox(){
    const box=el('lastHumanResult');
    if(!box) return;
    box.innerHTML=box.innerHTML.replace(/<b>Post-match notes<\/b>/g,'<b>Post-match report</b>');
    box.querySelectorAll('.commentary-box').forEach((c,i)=>{ if(i===0) c.classList.add('stage11h-report-box'); });
  }
  function injectStyles(){
    if(document.getElementById('stage11h-report-style')) return;
    const st=document.createElement('style'); st.id='stage11h-report-style';
    st.textContent=`
      #lastHumanResult .stage11h-report-box{white-space:pre-line;font-size:9px;line-height:1.45;color:#dfe9ff;}
      #lastHumanResult .stage11h-report-box b{color:#fff;}
      #playRoundBtn:disabled,#playRoundBtnMobile:disabled{opacity:.48;cursor:not-allowed;}
    `;
    document.head.appendChild(st);
  }
  function boot(){
    injectStyles();
    document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; });
    if(document.title) document.title='XVII | Build the seventeen. Pick the eleven.';
    tidyPostMatchBox(); disablePlayUntilReady();
    setInterval(()=>{try{tidyPostMatchBox(); disablePlayUntilReady(); document.querySelectorAll('.xvii-version-note').forEach(v=>{ v.textContent=VERSION; });}catch(e){}},1200);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else setTimeout(boot,0);
})();
