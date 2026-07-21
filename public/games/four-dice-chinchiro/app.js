const dice = [...document.querySelectorAll("[data-die]")];
const cards = dice.map(die => die.closest(".die-card"));
const backs = [...document.querySelectorAll("[data-back]")];
const rollButton = document.querySelector("#rollButton");
const startButton = document.querySelector("#startButton");
const nextGameButton = document.querySelector("#nextGameButton");
const rateDiceButton = document.querySelector("#rateDiceButton");
const rateDiceCount = document.querySelector("#rateDiceCount");
const playerCount = document.querySelector("#playerCount");
const quadMode = document.querySelector("#quadMode");
const quadHelp = document.querySelector("#quadHelp");
const effectGuide = document.querySelector("#effectGuide");
const rerollChoice = document.querySelector("#rerollChoice");
const rerollPrompt = document.querySelector("#rerollPrompt");
const acceptReroll = document.querySelector("#acceptReroll");
const keepRoll = document.querySelector("#keepRoll");
const message = document.querySelector("#message");
const resultName = document.querySelector("#resultName");
const resultDetail = document.querySelector("#resultDetail");
const multiplier = document.querySelector("#multiplier");
const phaseBadge = document.querySelector("#phaseBadge");
const totalRateDisplay = document.querySelector("#totalRate");
const rateFormula = document.querySelector("#rateFormula");
const baseRateText = document.querySelector("#baseRateText");
const rateDie = baseRateText;
const additionalRateText = document.querySelector("#additionalRateText");
const playersBox = document.querySelector("#players");
const playerNameInputs = document.querySelector("#playerNameInputs");
const nameModal = document.querySelector("#nameModal");
const openNamesButton = document.querySelector("#openNamesButton");
const closeNamesButton = document.querySelector("#closeNamesButton");
const saveNamesButton = document.querySelector("#saveNamesButton");
const roundStatus = document.querySelector("#roundStatus");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let busy = false, ready = false, selectingDiscard = false;
let rateEnabled = true, goldEnabled = false, flipEnabled = true, rateDiceEnabled = false;
let baseRate = 1, currentRate = 1, rateRolls = [1];
let currentPlayer = 0, rollAttempt = 0, turnIndex = 0, suddenDeathLevel = 0;
let suddenDeath = false, finalLoser = -1;
let playerRates = [], playerOutcomes = [], playerNames = [], turnOrder = [];
let pendingFront = null;

const cubeRotations = {1:"rotateX(0deg) rotateY(0deg)",2:"rotateX(-90deg) rotateY(0deg)",3:"rotateX(0deg) rotateY(-90deg)",4:"rotateX(0deg) rotateY(90deg)",5:"rotateX(90deg) rotateY(0deg)",6:"rotateX(0deg) rotateY(180deg)"};
function pipMarkup(value){return `<span class="pips value-${value}">${"<i></i>".repeat(value)}</span>`;}
function miniDieMarkup(value){return `<span class="mini-rate-die" aria-label="${value}の目">${pipMarkup(value)}</span>`;}
function rateDiceMarkup(values){const markup=values.map(miniDieMarkup).join("");return values.length>1?`<span class="rate-dice-group">${markup}</span><small class="rate-sum">合計 ${values.reduce((a,b)=>a+b,0)}</small>`:markup;}
function createCube(die){die.innerHTML=`<span class="die-cube"><b class="cube-face face-front">${pipMarkup(1)}</b><b class="cube-face face-back">${pipMarkup(6)}</b><b class="cube-face face-right">${pipMarkup(3)}</b><b class="cube-face face-left">${pipMarkup(4)}</b><b class="cube-face face-top">${pipMarkup(2)}</b><b class="cube-face face-bottom">${pipMarkup(5)}</b></span>`;setDieValue(die,1);}
function setDieValue(die,value){die.querySelector(".die-cube").style.transform=cubeRotations[value];die.setAttribute("aria-label",`サイコロの目は${value}`);}
dice.forEach(createCube);

function judge3(values){
  const s=[...values].sort((a,b)=>a-b);
  if(s.every(v=>v===1))return{name:"ピンゾロ",detail:"最強役！",label:"勝ち ×5",factor:5,score:100,tone:"win"};
  if(s[0]===s[2])return{name:`${s[0]}のぞろ目`,detail:"同じ目が3個",label:"勝ち ×3",factor:3,score:80+s[0],tone:"win"};
  if(s.join("")==="456")return{name:"四五六",detail:"四・五・六の並び",label:"勝ち ×2",factor:2,score:70,tone:"win"};
  if(s.join("")==="123")return{name:"一二三",detail:"一・二・三の並び",label:"負け ×2",factor:2,score:-10,tone:"lose"};
  if(s[0]===s[1])return{name:`出目 ${s[2]}`,detail:`${s[0]}のペア、残りが${s[2]}`,label:"通常 ×1",factor:1,score:10+s[2],tone:"normal"};
  if(s[1]===s[2])return{name:`出目 ${s[0]}`,detail:`${s[1]}のペア、残りが${s[0]}`,label:"通常 ×1",factor:1,score:10+s[0],tone:"normal"};
  return{name:"目なし",detail:"役もペアもありません",label:"倍率 ×1",factor:1,score:0,tone:"none"};
}
function judge4(values){
  const s=[...values].sort((a,b)=>a-b), key=s.join("");
  const counts=[...s.reduce((m,v)=>m.set(v,(m.get(v)||0)+1),new Map()).entries()].sort((a,b)=>b[1]-a[1]);
  if(key==="1111")return{name:"四つピン",detail:"1が4個の最強役",label:"勝ち ×10",factor:10,score:220,tone:"win"};
  if(counts[0][1]===4)return{name:`${counts[0][0]}の四つぞろい`,detail:"同じ目が4個",label:"勝ち ×6",factor:6,score:200+counts[0][0],tone:"win"};
  if(key==="3456")return{name:"三四五六",detail:"最強の4連番",label:"勝ち ×4",factor:4,score:180,tone:"win"};
  if(key==="2345")return{name:"二三四五",detail:"中央の4連番",label:"勝ち ×4",factor:4,score:170,tone:"win"};
  if(key==="1234")return{name:"一二三四",detail:"最弱の4連番",label:"負け ×4",factor:4,score:-20,tone:"lose"};
  if(counts[0][1]===2&&counts[1][1]===2){const high=Math.max(counts[0][0],counts[1][0]);return{name:"二組のペア",detail:`${counts[0][0]}と${counts[1][0]}のペア`,label:"勝ち ×3",factor:3,score:150+high,tone:"win"};}
  if(counts[0][1]===3)return{name:`${counts[0][0]}の三つぞろい`,detail:"同じ目が3個",label:"勝ち ×2",factor:2,score:130+counts[0][0],tone:"win"};
  if(counts[0][1]===2){const others=counts.filter(([,n])=>n===1).map(([v])=>v);return{name:`${counts[0][0]}のペア`,detail:`残りは${others.join("・")}`,label:"通常 ×1",factor:1,score:20+Math.max(...others),tone:"normal"};}
  return{name:"目なし",detail:"4個役がありません",label:"倍率 ×1",factor:1,score:0,tone:"none"};
}
function fourRoleFlip(front){
  const original=judge4(front);
  if(original.tone==="none")return{values:[...front],targets:[],outcome:original};
  const counts=front.reduce((m,v)=>m.set(v,(m.get(v)||0)+1),new Map());
  const repeated=[...counts].filter(([,count])=>count>=2).map(([value])=>value);
  const targets=repeated.length?front.map((value,index)=>repeated.includes(value)?index:-1).filter(index=>index>=0):[0,1,2,3];
  const values=front.map((value,index)=>targets.includes(index)?7-value:value);
  return{values,targets,outcome:judge4(values)};
}
function flipResultOnly(values){
  const counts=values.reduce((m,v)=>m.set(v,(m.get(v)||0)+1),new Map()),sorted=[...values].sort((a,b)=>a-b).join("");let targets=[];
  if(counts.size===1||sorted==="123"||sorted==="456")targets=values.map((_,i)=>i);else{const single=[...counts].find(([,n])=>n===1)?.[0];if(single!==undefined&&[...counts.values()].includes(2))targets=[values.indexOf(single)];}
  return{values:values.map((v,i)=>targets.includes(i)?7-v:v),targets};
}
function escapeHtml(value){return value.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);}
function playerLabel(i){return playerNames[i]||`PLAYER ${i+1}`;}
function renderNameInputs(){const count=Number(playerCount.value),old=[...playerNameInputs.querySelectorAll("input")].map(i=>i.value);playerNameInputs.innerHTML=Array.from({length:count},(_,i)=>`<label><small>P${i+1}</small><input maxlength="12" value="${escapeHtml(old[i]||playerNames[i]||"")}" placeholder="PLAYER ${i+1}"></label>`).join("");}
function openNameModal(){renderNameInputs();nameModal.hidden=false;playerNameInputs.querySelector("input")?.focus();}
function saveNames(){playerNames=[...playerNameInputs.querySelectorAll("input")].map((input,i)=>input.value.trim()||`PLAYER ${i+1}`);nameModal.hidden=true;renderPlayers();}
function renderPlayers(){const count=Number(playerCount.value);if(playerRates.length!==count)playerRates=Array(count).fill(baseRate);playersBox.innerHTML=playerRates.map((_,i)=>{const o=playerOutcomes[i];return `<div class="player ${i===currentPlayer&&ready?"active":""} ${i===finalLoser?"loser":""}"><small>${escapeHtml(playerLabel(i))}</small><strong>${o?.name||(i===currentPlayer&&ready?"手番":"待機")}</strong><span class="personal-rate">${o?`個別倍率 ×${o.factor}`:"個別倍率 ―"}</span><em>${i===finalLoser?"ビリ":""}</em></div>`;}).join("");updateRateEquation();}
function displayNumber(v){return Number.isInteger(v)?String(v):String(Math.round(v*100)/100);}
function updateRateEquation(){rateFormula.classList.toggle("disabled",!rateEnabled);baseRateText.innerHTML=rateEnabled?(rateDiceEnabled?rateDiceMarkup(rateRolls):miniDieMarkup(1)):"OFF";additionalRateText.textContent=rateEnabled?displayNumber(baseRate?currentRate/baseRate:currentRate):"OFF";totalRateDisplay.textContent=rateEnabled?displayNumber(currentRate):"OFF";}

function updateModeVisual(){const effect=quadMode.value==="effect";cards[3].classList.toggle("effect-die",effect);effectGuide.hidden=!effect;if(effect){cards[3].querySelector("small").textContent="効果用";backs[3].textContent="1〜6で効果発動";}}
function resetVisual(){rerollChoice.hidden=true;cards.forEach(c=>c.classList.remove("all-six","flip-target","discarded","discard-choice","selected","effect-die"));cards.forEach((c,i)=>{c.querySelector("small").textContent="表";backs[i].textContent="裏：6";});updateModeVisual();}
function resetSetup(){ready=false;selectingDiscard=false;currentPlayer=0;rollAttempt=0;turnOrder=[];turnIndex=0;suddenDeathLevel=0;suddenDeath=false;playerOutcomes=[];finalLoser=-1;playerRates=[];currentRate=1;rollButton.disabled=true;nextGameButton.hidden=true;rollButton.textContent="🎲 先に開始設定を決める";startButton.textContent=rateEnabled?"レートを決める":"この設定で開始";roundStatus.textContent="通常ラウンド：全員が1回ずつ勝負";resetVisual();renderPlayers();}
function toggleFeature(feature){if(feature==="rate")rateEnabled=!rateEnabled;else if(feature==="gold")goldEnabled=!goldEnabled;else flipEnabled=!flipEnabled;document.querySelectorAll("[data-feature]").forEach(button=>{const on=button.dataset.feature==="rate"?rateEnabled:button.dataset.feature==="gold"?goldEnabled:flipEnabled;button.classList.toggle("active",on);button.setAttribute("aria-pressed",on);button.querySelector("b").textContent=on?"ON":"OFF";});rateDiceButton.disabled=!rateEnabled;rateDiceCount.disabled=!rateEnabled||!rateDiceEnabled;rateDie.hidden=!rateEnabled;resetSetup();}
function toggleRateDice(){if(!rateEnabled)return;rateDiceEnabled=!rateDiceEnabled;rateDiceButton.classList.toggle("active",rateDiceEnabled);rateDiceButton.setAttribute("aria-pressed",rateDiceEnabled);rateDiceButton.querySelector("b").textContent=rateDiceEnabled?"ON":"OFF";rateDiceCount.disabled=!rateDiceEnabled;resetSetup();}
const modeHelp={manual:"4個から捨てる1個を自分で選び、残り3個を通常判定します。",auto:"4通りの3個組を比較し、最も強い結果を自動採用します。",four:"4個すべてを使い、確率に合わせた専用役で判定します。",effect:"最初の3個を通常判定し、4個目で倍率を変化させます。"};

async function startGame(){if(busy)return;busy=true;startButton.disabled=true;nextGameButton.hidden=true;playerNames=[...playerNameInputs.querySelectorAll("input")].map((input,i)=>input.value.trim()||`PLAYER ${i+1}`);if(rateEnabled&&rateDiceEnabled){rateDie.classList.add("rolling");const n=Number(rateDiceCount.value);for(let i=0;i<10;i++){rateRolls=Array.from({length:n},()=>Math.floor(Math.random()*6)+1);rateDie.innerHTML=rateDiceMarkup(rateRolls);await sleep(65);}rateRolls=Array.from({length:n},()=>Math.floor(Math.random()*6)+1);baseRate=rateRolls.reduce((a,b)=>a+b,0);rateDie.classList.remove("rolling");}else{baseRate=1;rateRolls=[1];}rateDie.innerHTML=rateDiceEnabled?rateDiceMarkup(rateRolls):miniDieMarkup(1);currentRate=baseRate;playerRates=Array(Number(playerCount.value)).fill(baseRate);currentPlayer=0;rollAttempt=0;turnOrder=playerRates.map((_,i)=>i);turnIndex=0;suddenDeathLevel=0;suddenDeath=false;playerOutcomes=Array(playerRates.length).fill(null);finalLoser=-1;ready=true;roundStatus.textContent=`${quadMode.options[quadMode.selectedIndex].text} ／ ${flipEnabled?"裏":"表"}判定 ／ レート${rateEnabled?`×${baseRate}`:"OFF"}`;updateRateEquation();rollButton.disabled=false;rollButton.textContent=`🎲 ${playerLabel(0)} が4個振る`;startButton.textContent="レートを決めなおす";startButton.disabled=false;renderPlayers();busy=false;}

function finishTurn(outcome){playerOutcomes[currentPlayer]=outcome;turnIndex++;rollAttempt=0;if(turnIndex<turnOrder.length){currentPlayer=turnOrder[turnIndex];renderPlayers();rollButton.textContent=`🎲 ${playerLabel(currentPlayer)} が4個振る`;rollButton.disabled=false;return;}const low=Math.min(...turnOrder.map(i=>playerOutcomes[i].score)),tied=turnOrder.filter(i=>playerOutcomes[i].score===low);if(tied.length===1){finalLoser=tied[0];ready=false;roundStatus.textContent=`結果確定：ビリは ${playerLabel(finalLoser)} ／ 最終レート×${currentRate}`;message.textContent=`ビリ確定！ ${playerLabel(finalLoser)}（${playerOutcomes[finalLoser].name}）`;rollButton.textContent="勝負終了";rollButton.disabled=true;nextGameButton.hidden=false;renderPlayers();return;}suddenDeath=true;suddenDeathLevel++;if(rateEnabled)currentRate++;turnOrder=tied;turnIndex=0;currentPlayer=tied[0];playerOutcomes=playerOutcomes.map((o,i)=>tied.includes(i)?null:o);roundStatus.textContent=`サドンデス${suddenDeathLevel}：${tied.map(playerLabel).join("・")} ／ 共通レート+1 ／ 1人1振り`;updateRateEquation();renderPlayers();rollButton.textContent=`🔥 ${playerLabel(currentPlayer)} の1振り`;rollButton.disabled=false;}

function bestTriple(front){let best=null;for(let discard=0;discard<4;discard++){const indices=[0,1,2,3].filter(i=>i!==discard),raw=indices.map(i=>front[i]),flipped=flipEnabled?flipResultOnly(raw):{values:raw,targets:[]},outcome=judge3(flipped.values);if(!best||outcome.score>best.outcome.score)best={discard,indices,values:flipped.values,targets:flipped.targets.map(i=>indices[i]),outcome};}return best;}
function askReroll(text){rerollPrompt.textContent=text;rerollChoice.hidden=false;return new Promise(resolve=>{const decide=value=>{rerollChoice.hidden=true;acceptReroll.onclick=null;keepRoll.onclick=null;resolve(value);};acceptReroll.onclick=()=>decide(true);keepRoll.onclick=()=>decide(false);});}
function effectOutcome(base,effect,effectLabel){let factor=base.factor,label=effectLabel;if(effect===5&&base.factor>=2){factor+=1;label="成立役の倍率＋1";}else if(effect===6&&base.factor>=2){factor*=2;label="成立役の倍率×2";}else if((effect===5||effect===6)&&base.factor<2)label="元の役が倍率2未満のため不発";return{...base,factor,label:`${base.label} → ×${factor}`,detail:`${base.detail}／効果${effect}：${label}`};}

async function resolveRoll(front,discard=null){busy=true;selectingDiscard=false;cards.forEach(c=>c.classList.remove("discard-choice"));let outcome,finalValues=[...front],targets=[],note="";
  if(quadMode.value==="four"){const choice=flipEnabled?fourRoleFlip(front):{values:[...front],targets:[],outcome:judge4(front)};finalValues=choice.values;targets=choice.targets;outcome=choice.outcome;note=targets.length?`出目の${targets.map(i=>front[i]).join("・")}だけ裏返し`:`目なしのため裏返しなし`;}
  else if(quadMode.value==="effect"){
    const raw=front.slice(0,3),f=flipEnabled?flipResultOnly(raw):{values:raw,targets:[]};let judged=[...f.values],base=judge3(judged);const effect=front[3];let effectLabel="効果なし";
    if(effect===2&&base.tone==="none"){if(await askReroll("効果2：判定ダイス3個を振り直しますか？")){judged=Array.from({length:3},()=>Math.floor(Math.random()*6)+1);effectLabel="3個を振り直し";}else effectLabel="振り直しを辞退";}
    else if(effect===2)effectLabel="目なしではないため不発";
    if(effect===3){if(await askReroll("効果3：一番低い判定ダイスを振り直しますか？")){const low=Math.min(...judged),index=judged.indexOf(low);judged[index]=Math.floor(Math.random()*6)+1;effectLabel="最低目を振り直し";}else effectLabel="振り直しを辞退";}
    if(effect===4){judged=judged.map(v=>7-v);effectLabel="判定ダイスを全裏返し";}
    base=judge3(judged);finalValues=[...judged,effect];targets=[0,1,2].filter(i=>finalValues[i]!==front[i]);outcome=effectOutcome(base,effect,effectLabel);cards[3].classList.add("effect-die");note=`効果ダイス${effect}：${outcome.detail.split("：").pop()}`;
  }
  else{const choice=quadMode.value==="auto"?bestTriple(front):(()=>{const indices=[0,1,2,3].filter(i=>i!==discard),raw=indices.map(i=>front[i]),f=flipEnabled?flipResultOnly(raw):{values:raw,targets:[]};return{discard,indices,values:f.values,targets:f.targets.map(i=>indices[i]),outcome:judge3(f.values)};})();discard=choice.discard;choice.indices.forEach((i,j)=>finalValues[i]=choice.values[j]);targets=choice.targets;outcome=choice.outcome;cards[discard].classList.add("discarded");note=`${discard+1}個目を除外`;}
  if(outcome.tone==="none"){finalValues=[...front];targets=[];note=discard===null?"目なしのため裏返しなし":`${discard+1}個目を除外・目なしのため裏返しなし`;}
  phaseBadge.textContent=outcome.tone==="none"?"目なし・変換なし":flipEnabled?"裏へ変換":"表のまま";targets.forEach(i=>cards[i].classList.add("flip-target"));document.querySelector("#diceStage").classList.add("flipping");await sleep(420);dice.forEach((d,i)=>setDieValue(d,finalValues[i]));backs.forEach((b,i)=>b.textContent=targets.includes(i)?`元：${front[i]}`:(i===discard?"判定から除外":"変更なし"));cards.forEach((c,i)=>c.querySelector("small").textContent=i===discard?"除外":targets.includes(i)?"裏の出目":i===3&&quadMode.value==="effect"?"効果":"採用");await sleep(380);document.querySelector("#diceStage").classList.remove("flipping");
  if(rateEnabled)currentRate*=outcome.factor;phaseBadge.textContent=flipEnabled?"裏で判定":"表で判定";message.textContent=`${front.join("・")} → ${note||finalValues.join("・")}`;resultName.textContent=outcome.name;resultDetail.textContent=outcome.detail;multiplier.textContent=outcome.label;document.querySelector("#result").className=`result ${outcome.tone}`;updateRateEquation();
  if(outcome.tone==="none"&&rollAttempt<3&&!suddenDeath){renderPlayers();rollButton.textContent=`🎲 ${playerLabel(currentPlayer)} がもう一度振る（${rollAttempt+1}/3）`;rollButton.disabled=false;busy=false;return;}finishTurn(outcome);busy=false;}

async function roll(){if(busy||!ready||selectingDiscard)return;busy=true;rollAttempt++;rollButton.disabled=true;document.querySelector("#result").className="result";resetVisual();phaseBadge.textContent=`${rollAttempt}/3回目`;message.textContent=`${playerLabel(currentPlayer)} の4個が転がる…`;dice.forEach(d=>d.classList.add("rolling"));const gold=goldEnabled&&Math.floor(Math.random()*36)===0,face=flipEnabled?6:1,effectMode=quadMode.value==="effect";const front=gold?[face,face,face,effectMode?Math.floor(Math.random()*6)+1:face]:Array.from({length:4},()=>Math.floor(Math.random()*6)+1);for(let frame=0;frame<10;frame++){dice.forEach((d,i)=>setDieValue(d,gold&&(!effectMode||i<3)?face:Math.floor(Math.random()*6)+1));await sleep(70);}dice.forEach((d,i)=>{d.classList.remove("rolling");setDieValue(d,front[i]);});if(gold){cards.forEach((c,i)=>c.classList.toggle("all-six",!effectMode||i<3));message.textContent=effectMode?`★ 1/36！ 判定ダイス3個がゴールド／効果は${front[3]}`:`★ 1/36！ 4個すべてゴールド ${front.join("・")}`;}else message.textContent=`表は ${front.join("・")}`;await sleep(450);if(quadMode.value==="manual"){pendingFront=front;selectingDiscard=true;cards.forEach(c=>c.classList.add("discard-choice"));phaseBadge.textContent="1個捨てる";message.textContent="判定から外すサイコロを1個タップしてください";busy=false;return;}await resolveRoll(front);}

cards.forEach((card,index)=>card.addEventListener("click",()=>{if(selectingDiscard&&pendingFront){const front=pendingFront;pendingFront=null;resolveRoll(front,index);}}));
document.querySelectorAll("[data-feature]").forEach(b=>b.addEventListener("click",()=>toggleFeature(b.dataset.feature)));
rateDiceButton.addEventListener("click",toggleRateDice);startButton.addEventListener("click",startGame);nextGameButton.addEventListener("click",startGame);rollButton.addEventListener("click",roll);
playerCount.addEventListener("change",()=>{resetSetup();renderNameInputs();});rateDiceCount.addEventListener("change",resetSetup);quadMode.addEventListener("change",()=>{quadHelp.textContent=modeHelp[quadMode.value];resetSetup();});
openNamesButton.addEventListener("click",openNameModal);closeNamesButton.addEventListener("click",()=>nameModal.hidden=true);saveNamesButton.addEventListener("click",saveNames);nameModal.addEventListener("click",e=>{if(e.target===nameModal)nameModal.hidden=true;});
renderNameInputs();renderPlayers();updateModeVisual();
