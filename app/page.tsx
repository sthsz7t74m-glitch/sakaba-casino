"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { findAnswerWords } from "./word-data";

type Screen = "lobby" | "chinchiro" | "dosukoi" | "highlow" | "seven" | "roulette" | "coin";
type Bet = 10 | 20 | 50;

const diceGlyphs = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const bets: Bet[] = [10, 20, 50];
const kana = ["あ","い","う","え","お","か","き","く","け","こ","さ","し","す","せ","そ","た","ち","つ","て","と","な","に","ぬ","ね","の","は","ひ","ふ","へ","ほ","ま","み","む","め","も","や","ゆ","よ","ら","り","る","れ","ろ","わ"];
const voicedKana = ["が","ぎ","ぐ","げ","ご","ざ","じ","ず","ぜ","ぞ","だ","で","ど","ば","び","ぶ","べ","ぼ","ぱ","ぴ","ぷ","ぺ","ぽ"];

function rand(max: number) { return Math.floor(Math.random() * max); }
function rollDie() { return rand(6) + 1; }

function Dice({ value, rolling = false, gold = false }: { value: number; rolling?: boolean; gold?: boolean }) {
  return <span className={`die ${rolling ? "rolling" : ""} ${gold ? "gold-die" : ""}`} aria-label={`サイコロの${value}`}>{diceGlyphs[value - 1]}</span>;
}

function BetBar({ bet, setBet, chips }: { bet: Bet; setBet: (bet: Bet) => void; chips: number }) {
  return <div className="bet-bar" aria-label="ベット額">
    {bets.map(b => <button key={b} className={bet === b ? "selected" : ""} onClick={() => setBet(b)} disabled={chips < b}>{b}</button>)}
  </div>;
}

function GameHeader({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return <header className="game-header">
    <button className="back" onClick={onBack} aria-label="ロビーへ戻る">‹</button>
    <div><p>{subtitle}</p><h1>{title}</h1></div>
    <span className="mini-logo">🎲</span>
  </header>;
}

function judgeChinchiro(dice: number[], reverse: boolean) {
  const values = reverse ? dice.map(v => 7 - v) : dice;
  const sorted = [...values].sort((a,b) => a-b);
  if (sorted[0] === sorted[2]) return { label: sorted[0] === 1 ? "ピンゾロ" : `${sorted[0]}のゾロ目`, mult: sorted[0] === 1 ? 5 : 3, tone: "win" };
  if (sorted.join("") === "456") return { label: "シゴロ", mult: 2, tone: "win" };
  if (sorted.join("") === "123") return { label: "ヒフミ", mult: -2, tone: "lose" };
  for (const v of [1,2,3,4,5,6]) {
    if (values.filter(x => x === v).length === 2) {
      const point = values.find(x => x !== v) ?? v;
      return { label: `${point}の目`, mult: point >= 4 ? 1 : point <= 2 ? -1 : 0, tone: point >= 4 ? "win" : point <= 2 ? "lose" : "draw" };
    }
  }
  return { label: "目なし", mult: 0, tone: "draw" };
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [chips, setChips] = useState(100);
  const [bet, setBet] = useState<Bet>(10);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const saved = Number(localStorage.getItem("sakaba-chips"));
    const timer = window.setTimeout(() => {
      if (Number.isFinite(saved) && saved >= 0) setChips(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { localStorage.setItem("sakaba-chips", String(chips)); }, [chips]);

  const settle = (delta: number, message: string) => {
    setChips(c => Math.max(0, c + delta));
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  const goLobby = () => setScreen("lobby");

  return <main className="app-shell">
    {screen === "lobby" && <Lobby chips={chips} setChips={setChips} open={setScreen} />}
    {screen === "chinchiro" && <Chinchiro chips={chips} bet={bet} setBet={setBet} settle={settle} back={goLobby} />}
    {screen === "dosukoi" && <Dosukoi back={goLobby} />}
    {screen === "highlow" && <HighLow chips={chips} bet={bet} setBet={setBet} settle={settle} back={goLobby} />}
    {screen === "seven" && <LuckySeven chips={chips} bet={bet} setBet={setBet} settle={settle} back={goLobby} />}
    {screen === "roulette" && <Roulette chips={chips} bet={bet} setBet={setBet} settle={settle} back={goLobby} />}
    {screen === "coin" && <Coin chips={chips} bet={bet} setBet={setBet} settle={settle} back={goLobby} />}
    {screen !== "lobby" && screen !== "dosukoi" && <div className="floating-chips"><span>CHIPS</span><strong>{chips}</strong></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}

function Lobby({ chips, setChips, open }: { chips: number; setChips: (n: number) => void; open: (s: Screen) => void }) {
  const games: {id: Screen; icon: string; name: string; en: string; tag: string; color: string}[] = [
    {id:"chinchiro",icon:"🎲",name:"ちんちろ",en:"CHINCHIRO",tag:"定番・運試し",color:"red"},
    {id:"dosukoi",icon:"力",name:"どすこい",en:"DOSUKOI",tag:"言葉・ひらめき",color:"navy"},
    {id:"highlow",icon:"♠",name:"ハイ＆ロー",en:"HIGH & LOW",tag:"一瞬の読み合い",color:"green"},
    {id:"seven",icon:"7",name:"ラッキー7",en:"LUCKY SEVEN",tag:"2ダイス予想",color:"purple"},
    {id:"roulette",icon:"◎",name:"ルーレット",en:"ROULETTE",tag:"赤か黒か",color:"amber"},
    {id:"coin",icon:"¥",name:"コイントス",en:"COIN TOSS",tag:"究極の二択",color:"blue"},
  ];
  return <div className="lobby">
    <header className="brand-header">
      <div className="lantern">酒</div>
      <div><p>今夜の運を、賭けてみる。</p><h1><span>酒場</span>カジノ</h1></div>
      <button className="chip-wallet" onClick={() => { if(confirm("チップを100に戻しますか？")) setChips(100); }}><small>本日のチップ</small><strong>◉ {chips}</strong></button>
    </header>
    <section className="welcome-card">
      <div><span className="eyebrow">TONIGHT&apos;S TABLE</span><h2>遊ぶゲームを選んでください</h2><p>ひとつのスマホを囲んで、すぐに開宴。</p></div>
      <div className="dice-art" aria-hidden="true"><span>⚄</span><span>⚂</span></div>
    </section>
    <section className="game-grid">
      {games.map(game => <button className={`game-card ${game.color}`} key={game.id} onClick={() => open(game.id)}>
        <span className="game-icon">{game.icon}</span><span className="game-copy"><small>{game.en}</small><strong>{game.name}</strong><em>{game.tag}</em></span><span className="arrow">›</span>
      </button>)}
    </section>
    <footer><span>遊び方は各ゲーム内で確認できます</span><b>v0.2.0</b></footer>
  </div>;
}

function Chinchiro({ chips, bet, setBet, settle, back }: GameProps) {
  const [dice, setDice] = useState([1,2,3]);
  const [rolling, setRolling] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [gold, setGold] = useState(false);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{label:string;mult:number;tone:string}|null>(null);
  const roll = () => {
    if (rolling || chips < bet) return;
    setRolling(true); setResult(null);
    window.setTimeout(() => {
      const isGold = rand(36) === 0;
      const next = isGold ? [6,6,6] : [rollDie(), rollDie(), rollDie()];
      const judged = judgeChinchiro(next, reverse);
      setDice(next); setGold(isGold); setResult(judged); setRound(r => r + 1); setRolling(false);
      settle(judged.mult * bet, judged.mult > 0 ? `+${judged.mult * bet} チップ！` : judged.mult < 0 ? `${judged.mult * bet} チップ` : "引き分け");
    }, 650);
  };
  return <div className="game-page chinchiro-page">
    <GameHeader title="ちんちろ" subtitle="CHINCHIRO" onBack={back} />
    <section className="rule-strip"><span>ゾロ目 ×3</span><span>シゴロ ×2</span><span>ピンゾロ ×5</span><span>ヒフミ −2</span></section>
    <section className="table-card">
      <div className="table-top"><span>勝負 {round + 1}</span><label>裏目モード <input type="checkbox" checked={reverse} onChange={e => setReverse(e.target.checked)} /></label></div>
      <div className="dice-cup"><div>{dice.map((d,i) => <Dice key={i} value={d} rolling={rolling} gold={gold} />)}</div></div>
      <div className={`result-badge ${result?.tone ?? ""}`}>{result ? (reverse ? `裏目 → ${result.label}` : result.label) : "サイコロを振って勝負"}</div>
      <p className="micro-copy">ゴールドダイスは1/36。裏目モードでは出目を反対側で判定します。</p>
    </section>
    <section className="action-panel"><p>BET</p><BetBar bet={bet} setBet={setBet} chips={chips} /><button className="primary roll-button" onClick={roll} disabled={rolling || chips < bet}>{rolling ? "勝負中…" : "サイコロを振る"}</button></section>
  </div>;
}

function Dosukoi({ back }: { back: () => void }) {
  const [min, setMin] = useState(4);
  const [max, setMax] = useState(8);
  const [voiced, setVoiced] = useState(false);
  const [sound, setSound] = useState(true);
  const [prompt, setPrompt] = useState({letter:"た", count:5});
  const [showExamples, setShowExamples] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [ready, setReady] = useState(false);
  const shuffleTimer = useRef<number | null>(null);
  const finishTimer = useRef<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("dosukoi-settings");
    const timer = window.setTimeout(() => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          const savedMin = Math.max(1, Math.min(20, Number(saved.min) || 4));
          const savedMax = Math.max(savedMin, Math.min(20, Number(saved.max) || 8));
          setMin(savedMin);
          setMax(savedMax);
          setVoiced(Boolean(saved.voiced));
          setSound(saved.sound !== false);
        } catch {}
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("dosukoi-settings", JSON.stringify({min,max,voiced,sound}));
  }, [min,max,voiced,sound,ready]);

  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const requestLock = async () => {
      try {
        const wakeLock = (navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock;
        if (wakeLock && document.visibilityState === "visible") lock = await wakeLock.request("screen");
      } catch {}
    };
    const onVisibility = () => { if (document.visibilityState === "visible" && !lock) void requestLock(); };
    void requestLock();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (shuffleTimer.current) window.clearInterval(shuffleTimer.current);
      if (finishTimer.current) window.clearTimeout(finishTimer.current);
      if (lock) void lock.release();
    };
  }, []);

  const examples = useMemo(() => findAnswerWords(prompt.letter, prompt.count), [prompt]);
  const randomPrompt = () => {
    const letters = voiced ? [...kana, ...voicedKana] : kana;
    return { letter: letters[rand(letters.length)], count: min + rand(max - min + 1) };
  };
  const playCue = () => {
    if (!sound) return;
    try {
      const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const audio = new AudioCtor();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(220, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(520, audio.currentTime + .16);
      gain.gain.setValueAtTime(.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.18, audio.currentTime + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + .24);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + .25);
      oscillator.addEventListener("ended", () => void audio.close());
    } catch {}
  };
  const next = () => {
    if (rolling) return;
    setRolling(true);
    setShowExamples(false);
    shuffleTimer.current = window.setInterval(() => setPrompt(randomPrompt()), 70);
    finishTimer.current = window.setTimeout(() => {
      if (shuffleTimer.current) window.clearInterval(shuffleTimer.current);
      setPrompt(randomPrompt());
      setRolling(false);
      playCue();
    }, 1000);
  };
  const setMinimum = (value: number) => setMin(Math.max(1, Math.min(value, max, 20)));
  const setMaximum = (value: number) => setMax(Math.max(min, Math.min(value, 20)));
  const reset = () => { setMin(4); setMax(8); setVoiced(false); setSound(true); };

  return <div className="game-page dosukoi-page">
    <GameHeader title="どすこい" subtitle="DOSUKOI" onBack={back} />
    <section className="dosukoi-settings" aria-label="お題設定">
      <div className="count-setting"><span>最小</span><button onClick={() => setMinimum(min - 1)} disabled={min <= 1}>−</button><strong>{min}</strong><button onClick={() => setMinimum(min + 1)} disabled={min >= max}>＋</button></div>
      <div className="count-setting"><span>最大</span><button onClick={() => setMaximum(max - 1)} disabled={max <= min}>−</button><strong>{max}</strong><button onClick={() => setMaximum(max + 1)} disabled={max >= 20}>＋</button></div>
      <div className="dosukoi-toggles">
        <label><input type="checkbox" checked={voiced} onChange={e => setVoiced(e.target.checked)} />濁音・半濁音</label>
        <label><input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} />効果音</label>
      </div>
      <div className="settings-actions"><button onClick={reset}>設定をリセット</button><button onClick={() => setShowHelp(true)}>遊び方</button></div>
    </section>
    <section className="dosukoi-stage">
      <span className="sumo-label">{rolling ? "抽選中" : "お題"}</span>
      <div className={`prompt-pair ${rolling ? "prompt-rolling" : ""}`}><div><strong>{prompt.letter}</strong><small>から始まる</small></div><b>×</b><div><strong>{prompt.count}</strong><small>文字</small></div></div>
      <p><b>{prompt.letter}</b>から始まる・<b>{prompt.count}</b>文字</p>
    </section>
    <button className="primary dosukoi-next" onClick={next} disabled={rolling}>{rolling ? "はっけよい…" : "どすこい！"}</button>
    <button className="secondary" onClick={() => setShowExamples(v => !v)} disabled={rolling}>{showExamples ? "答えの例を隠す" : "答えの例を見る（最大5個）"}</button>
    {showExamples && <section className="examples"><p>答えの例</p>{examples.length ? examples.map(word => <span key={`${word.surface}-${word.reading}`}><b>{word.surface}</b>{(/[一-龯々]/.test(word.surface) || word.proper) && <small>{word.reading}</small>}</span>) : <span className="no-example">登録された候補はありません</span>}<small className="judge-note">正解判定はプレイヤー同士で決めてください</small></section>}
    {showHelp && <div className="modal-backdrop" role="presentation" onClick={() => setShowHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="dosukoi-help" onClick={e => e.stopPropagation()}><h2 id="dosukoi-help">遊び方</h2><ol><li>文字数の範囲を決めます。</li><li>「どすこい！」で、文字と文字数を抽選します。</li><li>条件に合う言葉を、画面の外で早い者勝ちで答えます。</li></ol><p>小さい「ゃ・ゅ・ょ・っ」と「ー」も、それぞれ1文字です。「ん」と「を」はお題に出ません。</p><button className="primary" onClick={() => setShowHelp(false)}>わかった</button></section></div>}
  </div>;
}

type GameProps = { chips: number; bet: Bet; setBet: (b: Bet) => void; settle: (d:number,m:string) => void; back: () => void };

function HighLow({ chips, bet, setBet, settle, back }: GameProps) {
  const [card, setCard] = useState(7); const [next, setNext] = useState<number|null>(null); const [suit, setSuit] = useState("♥");
  const choose = (high:boolean) => { if(chips < bet) return; const n=rand(13)+1; const win=high ? n>card : n<card; const draw=n===card; setNext(n); setSuit(["♥","♦","♣","♠"][rand(4)]); settle(draw ? 0 : win ? bet : -bet, draw ? "同じ数字で引き分け" : win ? `正解！ +${bet}` : `残念… -${bet}`); window.setTimeout(()=>{setCard(n);setNext(null)},1500); };
  return <SimpleGame title="ハイ＆ロー" sub="HIGH & LOW" back={back} chips={chips} bet={bet} setBet={setBet}>
    <div className="playing-card"><span>{suit}</span><strong>{next ?? card}</strong><span>{suit}</span></div><p className="question">次のカードは、{card}より高い？低い？</p>
    <div className="split-actions"><button onClick={()=>choose(false)}>▼ LOW</button><button onClick={()=>choose(true)}>HIGH ▲</button></div>
  </SimpleGame>;
}

function LuckySeven({ chips, bet, setBet, settle, back }: GameProps) {
  const [dice,setDice]=useState([3,4]); const [result,setResult]=useState("合計を予想しよう");
  const choose=(pick:"under"|"seven"|"over")=>{if(chips<bet)return;const d=[rollDie(),rollDie()];const sum=d[0]+d[1];const actual=sum<7?"under":sum===7?"seven":"over";const win=pick===actual;const mult=pick==="seven"?4:1;setDice(d);setResult(`合計 ${sum} — ${win?"的中！":"はずれ"}`);settle(win?bet*mult:-bet,win?`+${bet*mult} チップ！`:`-${bet} チップ`)};
  return <SimpleGame title="ラッキー7" sub="LUCKY SEVEN" back={back} chips={chips} bet={bet} setBet={setBet}><div className="simple-dice"><Dice value={dice[0]}/><Dice value={dice[1]}/></div><p className="question">{result}</p><div className="triple-actions"><button onClick={()=>choose("under")}>UNDER<small>2〜6</small></button><button className="seven" onClick={()=>choose("seven")}>7<small>×4</small></button><button onClick={()=>choose("over")}>OVER<small>8〜12</small></button></div></SimpleGame>;
}

function Roulette({ chips, bet, setBet, settle, back }: GameProps) {
  const [number,setNumber]=useState(0); const [spinning,setSpinning]=useState(false);
  const choose=(red:boolean)=>{if(chips<bet||spinning)return;setSpinning(true);window.setTimeout(()=>{const n=rand(12)+1;const isRed=n%2===1;setNumber(n);setSpinning(false);settle(isRed===red?bet:-bet,isRed===red?`的中！ +${bet}`:`残念… -${bet}`)},800)};
  return <SimpleGame title="ルーレット" sub="ROULETTE" back={back} chips={chips} bet={bet} setBet={setBet}><div className={`roulette-wheel ${spinning?"spinning":""}`}><div><strong>{number||"?"}</strong><span>{number ? (number%2?"RED":"BLACK") : "SPIN"}</span></div></div><p className="question">止まる色を選んでください</p><div className="split-actions"><button className="black" onClick={()=>choose(false)}>BLACK</button><button className="red-button" onClick={()=>choose(true)}>RED</button></div></SimpleGame>;
}

function Coin({ chips, bet, setBet, settle, back }: GameProps) {
  const [face,setFace]=useState<"表"|"裏">("表");const [flipping,setFlipping]=useState(false);
  const choose=(pick:"表"|"裏")=>{if(chips<bet||flipping)return;setFlipping(true);window.setTimeout(()=>{const f=rand(2)?"表":"裏";setFace(f);setFlipping(false);settle(f===pick?bet:-bet,f===pick?`的中！ +${bet}`:`${f}でした… -${bet}`)},700)};
  return <SimpleGame title="コイントス" sub="COIN TOSS" back={back} chips={chips} bet={bet} setBet={setBet}><div className={`coin ${flipping?"flipping":""}`}><strong>{face}</strong><span>酒場</span></div><p className="question">表か裏か、運命の二択。</p><div className="split-actions"><button onClick={()=>choose("表")}>表</button><button onClick={()=>choose("裏")}>裏</button></div></SimpleGame>;
}

function SimpleGame({ title, sub, back, chips, bet, setBet, children }: Omit<GameProps, "settle"> & {title:string;sub:string;children:React.ReactNode}) {
  return <div className="game-page simple-page"><GameHeader title={title} subtitle={sub} onBack={back}/><section className="simple-stage">{children}</section><section className="action-panel"><p>BET</p><BetBar bet={bet} setBet={setBet} chips={chips}/></section></div>;
}
