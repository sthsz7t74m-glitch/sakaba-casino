"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { findAnswerWords } from "./word-data";

type Screen = "lobby" | "chinchiro" | "classicChinchiro" | "dosukoi" | "ngword" | "majority" | "bomb" | "gesture" | "fiveSeconds" | "matchAll" | "wordWolf" | "firstImpression";

const diceGlyphs = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const kana = ["あ","い","う","え","お","か","き","く","け","こ","さ","し","す","せ","そ","た","ち","つ","て","と","な","に","ぬ","ね","の","は","ひ","ふ","へ","ほ","ま","み","む","め","も","や","ゆ","よ","ら","り","る","れ","ろ","わ"];
const voicedKana = ["が","ぎ","ぐ","げ","ご","ざ","じ","ず","ぜ","ぞ","だ","で","ど","ば","び","ぶ","べ","ぼ","ぱ","ぴ","ぷ","ぺ","ぽ"];
const ngWords = ["乾杯","かわいい","マジで","仕事","スマホ","眠い","おいしい","やばい","写真","明日","旅行","推し","ビール","ゲーム","ごめん","なるほど","たしかに","でも","最高","酔った","もう一杯","SNS","カラオケ","恋愛"];
const majorityQuestions = [
  { q:"一生食べるなら？", a:"お米", b:"パン" },
  { q:"旅行するなら？", a:"海", b:"山" },
  { q:"欲しい能力は？", a:"空を飛ぶ", b:"透明になる" },
  { q:"休日の朝は？", a:"早起き", b:"昼まで寝る" },
  { q:"住むなら？", a:"都会", b:"田舎" },
  { q:"見るなら？", a:"映画", b:"ドラマ" },
  { q:"夏と冬なら？", a:"夏", b:"冬" },
  { q:"タイムマシンなら？", a:"過去へ", b:"未来へ" },
  { q:"食べるなら？", a:"甘いもの", b:"しょっぱいもの" },
  { q:"ペットにするなら？", a:"犬", b:"猫" },
  { q:"飲み会の締めは？", a:"ラーメン", b:"デザート" },
  { q:"生まれ変わるなら？", a:"また自分", b:"別の人" },
];
const bombCategories = ["食べ物","動物","地名","有名人","身近にある物","3文字以上の言葉"];
const gestureWords = ["ゴリラ","歯みがき","寝坊","野球","ラーメン","ジェットコースター","カラオケ","猫","忍者","サーフィン","スマホ","宇宙人","料理","筋トレ","酔っぱらい","オーケストラ","温泉","釣り","花火","ゾンビ","告白","電車","美容師","相撲"];
const matchPrompts = ["赤いものといえば？","夏の食べ物といえば？","人気の動物といえば？","コンビニで買うものといえば？","日本の観光地といえば？","丸いものといえば？","朝ごはんといえば？","強いスポーツ選手といえば？"];
const wolfPairs = [["うどん","そば"],["犬","猫"],["海","プール"],["映画館","動画配信"],["焼肉","しゃぶしゃぶ"],["東京","大阪"],["コーヒー","紅茶"],["花火","イルミネーション"]];
const impressionPrompts = ["一番早起きが得意そうな人","無人島でも生き残りそうな人","実は一番ロマンチストそうな人","宝くじを当てそうな人","秘密を守るのが上手そうな人","旅行の計画が上手そうな人","突然有名になりそうな人","一番やさしいと思う人"];

function rand(max: number) { return Math.floor(Math.random() * max); }
function rollDie() { return rand(6) + 1; }

function Dice({ value, rolling = false, gold = false }: { value: number; rolling?: boolean; gold?: boolean }) {
  return <span className={`die ${rolling ? "rolling" : ""} ${gold ? "gold-die" : ""}`} aria-label={`サイコロの${value}`}>{diceGlyphs[value - 1]}</span>;
}

function judgeClassicChinchiro(dice: number[], reverse: boolean) {
  const values = reverse ? dice.map(v => 7 - v) : dice;
  const sorted = [...values].sort((a,b) => a-b);
  if (sorted[0] === sorted[2]) return { label: sorted[0] === 1 ? "ピンゾロ" : `${sorted[0]}のゾロ目`, tone: "win" };
  if (sorted.join("") === "456") return { label: "シゴロ", tone: "win" };
  if (sorted.join("") === "123") return { label: "ヒフミ", tone: "lose" };
  for (const v of [1,2,3,4,5,6]) {
    if (values.filter(x => x === v).length === 2) {
      const point = values.find(x => x !== v) ?? v;
      return { label: `${point}の目`, tone: point >= 4 ? "win" : point <= 2 ? "lose" : "draw" };
    }
  }
  return { label: "目なし", tone: "draw" };
}

function GameHeader({ title, subtitle, icon, onBack }: { title: string; subtitle: string; icon: string; onBack: () => void }) {
  return <header className="game-header">
    <button className="back" onClick={onBack} aria-label="ゲーム一覧へ戻る">‹</button>
    <div><p>{subtitle}</p><h1>{title}</h1></div>
    <span className="mini-logo" aria-hidden="true">{icon}</span>
  </header>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const goLobby = () => setScreen("lobby");

  return <main className="app-shell">
    {screen === "lobby" && <Lobby open={setScreen} />}
    {screen === "chinchiro" && <FourDiceChinchiro back={goLobby} />}
    {screen === "classicChinchiro" && <ClassicChinchiro back={goLobby} />}
    {screen === "dosukoi" && <Dosukoi back={goLobby} />}
    {screen === "ngword" && <NgWord back={goLobby} />}
    {screen === "majority" && <Majority back={goLobby} />}
    {screen === "bomb" && <BombShiritori back={goLobby} />}
    {screen === "gesture" && <Gesture back={goLobby} />}
    {screen === "fiveSeconds" && <FiveSeconds back={goLobby} />}
    {screen === "matchAll" && <MatchAll back={goLobby} />}
    {screen === "wordWolf" && <WordWolf back={goLobby} />}
    {screen === "firstImpression" && <FirstImpression back={goLobby} />}
  </main>;
}

function Lobby({ open }: { open: (screen: Screen) => void }) {
  const games: {id: Screen; icon: string; name: string; en: string; tag: string; color: string; badge?: string}[] = [
    {id:"chinchiro",icon:"🎲",name:"フォーダイスちんちろ",en:"FOUR DICE",tag:"完成版 v1.0.7",color:"coral",badge:"定番"},
    {id:"classicChinchiro",icon:"⚂",name:"ちんちろ",en:"CLASSIC CHINCHIRO",tag:"3個のサイコロで勝負",color:"mint",badge:"定番"},
    {id:"dosukoi",icon:"力",name:"どすこい",en:"DOSUKOI",tag:"言葉・ひらめき",color:"blue",badge:"定番"},
    {id:"ngword",icon:"㊙",name:"NGワード",en:"NG WORD",tag:"会話が盛り上がる",color:"pink",badge:"NEW"},
    {id:"majority",icon:"A/B",name:"究極の二択",en:"MAJORITY",tag:"みんなの本音",color:"yellow",badge:"NEW"},
    {id:"bomb",icon:"💣",name:"爆弾しりとり",en:"TIME BOMB",tag:"焦るほど面白い",color:"mint",badge:"NEW"},
    {id:"gesture",icon:"🙌",name:"ジェスチャー",en:"GESTURE",tag:"声なしで伝えよう",color:"purple",badge:"NEW"},
    {id:"fiveSeconds",icon:"⏱",name:"5秒ぴったり",en:"JUST FIVE",tag:"体内時計で止めよう",color:"coral",badge:"NEW"},
    {id:"matchAll",icon:"◎",name:"全員一致",en:"MATCH ALL",tag:"答えをそろえよう",color:"yellow",badge:"NEW"},
    {id:"wordWolf",icon:"🐺",name:"ワードウルフ",en:"WORD WOLF",tag:"少数派を見つけよう",color:"blue",badge:"NEW"},
    {id:"firstImpression",icon:"👑",name:"第一印象",en:"FIRST IMPRESSION",tag:"せーので指さし",color:"pink",badge:"NEW"},
  ];

  return <div className="lobby">
    <header className="brand-header">
      <span className="brand-mark">宴</span>
      <div><p>ONE PHONE, EVERYONE PLAYS!</p><h1>宴会ゲーム<span>BOX</span></h1></div>
      <span className="party-dot" aria-hidden="true">✦</span>
    </header>

    <section className="welcome-card">
      <div>
        <span className="eyebrow">LET&apos;S PLAY TOGETHER</span>
        <h2>ゲームを選んで、<br />すぐに遊ぼう！</h2>
        <p>ひとつのスマホを囲めば準備OK。</p>
      </div>
      <div className="hero-icons" aria-hidden="true"><span>🎲</span><span>🎉</span><span>💬</span></div>
    </section>

    <div className="section-title"><div><b>ALL GAMES</b><h2>遊べるゲーム</h2></div><span>全11種類</span></div>
    <section className="game-grid">
      {games.map(game => <button className={"game-card " + game.color} key={game.id} onClick={() => open(game.id)}>
        <span className="card-badge">{game.badge}</span>
        <span className="game-icon">{game.icon}</span>
        <span className="game-copy"><small>{game.en}</small><strong>{game.name}</strong><em>{game.tag}</em></span>
        <span className="arrow">›</span>
      </button>)}
    </section>
    <footer><span>ルールは各ゲーム内で確認できます</span><b>v1.2.0</b></footer>
  </div>;
}

function FourDiceChinchiro({ back }: { back: () => void }) {
  return <div className="game-page iframe-page">
    <GameHeader title="フォーダイスちんちろ" subtitle="FOUR DICE CHINCHIRO" icon="🎲" onBack={back} />
    <div className="source-note"><b>完成版 v1.0.7</b><span>別Workで制作したゲームをそのまま収録</span></div>
    <iframe className="chinchiro-frame" src="games/four-dice-chinchiro/index.html" title="フォーダイスちんちろ v1.0.7" />
  </div>;
}

function ClassicChinchiro({ back }: { back: () => void }) {
  const [dice, setDice] = useState([1,2,3]);
  const [rolling, setRolling] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [gold, setGold] = useState(false);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{label:string;tone:string}|null>(null);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setResult(null);
    window.setTimeout(() => {
      const isGold = rand(36) === 0;
      const next = isGold ? [6,6,6] : [rollDie(), rollDie(), rollDie()];
      setDice(next);
      setGold(isGold);
      setResult(judgeClassicChinchiro(next, reverse));
      setRound(r => r + 1);
      setRolling(false);
    }, 650);
  };

  return <div className="game-page classic-chinchiro-page">
    <GameHeader title="ちんちろ" subtitle="CLASSIC CHINCHIRO" icon="⚂" onBack={back} />
    <section className="classic-rule-strip"><span>ピンゾロ 5倍</span><span>ゾロ目 3倍</span><span>シゴロ 2倍</span><span>ヒフミ 2倍払い</span></section>
    <section className="classic-table-card">
      <div className="classic-table-top"><span>勝負 {round + 1}</span><label>裏目モード <input type="checkbox" checked={reverse} onChange={e => setReverse(e.target.checked)} /></label></div>
      <div className="classic-dice-cup"><div>{dice.map((d,i) => <Dice key={i} value={d} rolling={rolling} gold={gold} />)}</div></div>
      <div className={`classic-result ${result?.tone ?? ""}`}>{result ? (reverse ? `裏目 → ${result.label}` : result.label) : "サイコロを振って勝負！"}</div>
      <p className="classic-note">同じ目が2個なら残り1個が「○の目」。ゴールドダイスは1/36です。</p>
    </section>
    <button className="primary classic-roll-button" onClick={roll} disabled={rolling}>{rolling ? "勝負中…" : "サイコロを振る"}</button>
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
    <GameHeader title="どすこい" subtitle="DOSUKOI" icon="力" onBack={back} />
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
      <div className={"prompt-pair " + (rolling ? "prompt-rolling" : "")}><div><strong>{prompt.letter}</strong><small>から始まる</small></div><b>×</b><div><strong>{prompt.count}</strong><small>文字</small></div></div>
      <p><b>{prompt.letter}</b>から始まる・<b>{prompt.count}</b>文字</p>
    </section>
    <button className="primary dosukoi-next" onClick={next} disabled={rolling}>{rolling ? "はっけよい…" : "どすこい！"}</button>
    <button className="secondary" onClick={() => setShowExamples(v => !v)} disabled={rolling}>{showExamples ? "答えの例を隠す" : "答えの例を見る（最大5個）"}</button>
    {showExamples && <section className="examples"><p>答えの例</p>{examples.length ? examples.map(word => <span key={word.surface + "-" + word.reading}><b>{word.surface}</b>{(/[一-龯々]/.test(word.surface) || word.proper) && <small>{word.reading}</small>}</span>) : <span className="no-example">登録された候補はありません</span>}<small className="judge-note">正解判定はプレイヤー同士で決めてください</small></section>}
    {showHelp && <div className="modal-backdrop" role="presentation" onClick={() => setShowHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="dosukoi-help" onClick={e => e.stopPropagation()}><h2 id="dosukoi-help">遊び方</h2><ol><li>文字数の範囲を決めます。</li><li>「どすこい！」で、文字と文字数を抽選します。</li><li>条件に合う言葉を、画面の外で早い者勝ちで答えます。</li></ol><p>小さい「ゃ・ゅ・ょ・っ」と「ー」も、それぞれ1文字です。「ん」と「を」はお題に出ません。</p><button className="primary" onClick={() => setShowHelp(false)}>わかった</button></section></div>}
  </div>;
}

function NgWord({ back }: { back: () => void }) {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState(["プレイヤー1","プレイヤー2","プレイヤー3","プレイヤー4","プレイヤー5","プレイヤー6","プレイヤー7","プレイヤー8"]);
  const [words, setWords] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"setup"|"pass"|"play"|"result">("setup");
  const [revealed, setRevealed] = useState(false);

  const start = () => {
    const shuffled = [...ngWords].sort(() => Math.random() - .5);
    setWords(shuffled.slice(0,count));
    setIndex(0);
    setRevealed(false);
    setPhase("pass");
  };
  const next = () => {
    if (index + 1 >= count) { setPhase("play"); return; }
    setIndex(i => i + 1);
    setRevealed(false);
  };

  return <div className="game-page">
    <GameHeader title="NGワード" subtitle="NG WORD" icon="㊙" onBack={back} />
    {phase === "setup" && <section className="play-card setup-card">
      <p className="kicker">会話中に言ったらアウト！</p><h2>参加者を設定</h2>
      <label className="select-row">人数<select value={count} onChange={e => setCount(Number(e.target.value))}>{[2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}</select></label>
      <div className="name-list">{names.slice(0,count).map((name,i) => <input key={i} value={name} aria-label={(i+1) + "人目の名前"} onChange={e => setNames(current => current.map((v,j) => j === i ? e.target.value : v))} />)}</div>
      <button className="primary" onClick={start}>NGワードを配る</button>
      <p className="howto">本人以外がその人のNGワードを確認します。全員分を配ったら自由に会話スタート！</p>
    </section>}
    {phase === "pass" && <section className="play-card secret-card">
      <span className="turn-pill">{index + 1} / {count}</span>
      <p><b>{names[index]}</b>さんは<br />画面を見ないでください</p>
      {!revealed ? <button className="reveal-button" onClick={() => setRevealed(true)}>ほかの人が<br />NGワードを見る</button> : <>
        <small>{names[index]}さんのNGワード</small>
        <strong className="secret-word">{words[index]}</strong>
        <button className="primary" onClick={next}>{index + 1 === count ? "配り終わった！" : "隠して次の人へ"}</button>
      </>}
    </section>}
    {phase === "play" && <section className="play-card center-card"><span className="big-emoji">🗣️</span><h2>会話スタート！</h2><p>相手にNGワードを言わせよう。<br />自分のワードを言ったらアウト！</p><button className="primary" onClick={() => setPhase("result")}>答え合わせ</button></section>}
    {phase === "result" && <section className="play-card"><p className="kicker">ANSWER</p><h2>NGワード一覧</h2><div className="answer-list">{words.map((word,i) => <div key={word}><span>{names[i]}</span><b>{word}</b></div>)}</div><button className="primary" onClick={start}>同じメンバーでもう一度</button><button className="secondary" onClick={() => setPhase("setup")}>設定に戻る</button></section>}
  </div>;
}

function Majority({ back }: { back: () => void }) {
  const [players, setPlayers] = useState(4);
  const [question, setQuestion] = useState(() => majorityQuestions[rand(majorityQuestions.length)]);
  const [votes, setVotes] = useState({a:0,b:0});
  const [revealed, setRevealed] = useState(false);
  const total = votes.a + votes.b;
  const vote = (side: "a"|"b") => {
    if (total >= players || revealed) return;
    const next = {...votes, [side]: votes[side] + 1};
    setVotes(next);
    if (next.a + next.b >= players) setRevealed(true);
  };
  const next = () => {
    let candidate = majorityQuestions[rand(majorityQuestions.length)];
    if (majorityQuestions.length > 1) while (candidate.q === question.q) candidate = majorityQuestions[rand(majorityQuestions.length)];
    setQuestion(candidate); setVotes({a:0,b:0}); setRevealed(false);
  };

  return <div className="game-page">
    <GameHeader title="究極の二択" subtitle="MAJORITY GAME" icon="A/B" onBack={back} />
    <section className="play-card majority-card">
      <div className="majority-top"><label>参加人数 <select value={players} onChange={e => {setPlayers(Number(e.target.value));setVotes({a:0,b:0});setRevealed(false);}}>{[2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n}>{n}</option>)}</select></label><span>{total} / {players} 投票</span></div>
      <p className="kicker">究極の質問</p><h2>{question.q}</h2>
      <div className="choice-grid">
        <button className="choice-a" onClick={() => vote("a")} disabled={revealed}><small>A</small><strong>{question.a}</strong>{revealed && <b>{votes.a}票</b>}</button>
        <button className="choice-b" onClick={() => vote("b")} disabled={revealed}><small>B</small><strong>{question.b}</strong>{revealed && <b>{votes.b}票</b>}</button>
      </div>
      {!revealed ? <p className="howto">スマホを順番に回して、どちらかをタップ。全員が投票すると結果発表！</p> : <>
        <div className="majority-result">{votes.a === votes.b ? "ぴったり半分！" : votes.a > votes.b ? "多数派は「" + question.a + "」" : "多数派は「" + question.b + "」"}</div>
        <button className="primary" onClick={next}>次のお題</button>
      </>}
    </section>
  </div>;
}

function BombShiritori({ back }: { back: () => void }) {
  const makeSeconds = () => 20 + rand(26);
  const [remaining, setRemaining] = useState(makeSeconds);
  const [running, setRunning] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [turn, setTurn] = useState(1);
  const [category, setCategory] = useState(() => bombCategories[rand(bombCategories.length)]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining(value => {
        if (value <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setExploded(true);
          try { navigator.vibrate?.([150,80,300]); } catch {}
          return 0;
        }
        return value - 1;
      });
    },1000);
    return () => window.clearInterval(timer);
  },[running]);
  const reset = () => {
    setRemaining(makeSeconds()); setRunning(false); setExploded(false); setTurn(1);
    setCategory(bombCategories[rand(bombCategories.length)]);
  };

  return <div className="game-page">
    <GameHeader title="爆弾しりとり" subtitle="TIME BOMB" icon="💣" onBack={back} />
    <section className={"play-card bomb-card " + (running ? "is-ticking " : "") + (exploded ? "is-exploded" : "")}>
      <span className="turn-pill">第 {turn} ターン</span>
      <p className="kicker">お題：{category}</p>
      <div className="bomb-visual"><span>{exploded ? "💥" : "💣"}</span><b>{remaining}</b><small>SEC</small></div>
      <h2>{exploded ? "ドカーン！" : running ? "しりとり中！" : "爆弾をスタート"}</h2>
      {!exploded && <button className="primary" onClick={() => setRunning(v => !v)}>{running ? "一時停止" : "スタート！"}</button>}
      {running && <button className="next-person" onClick={() => setTurn(t => t + 1)}>答えた！ 次の人へ →</button>}
      {exploded && <button className="primary" onClick={reset}>もう一度</button>}
      {!running && !exploded && <button className="secondary" onClick={reset}>お題と時間を変える</button>}
      <p className="howto">答えたら次の人にスマホを渡します。爆発したときに持っていた人が負け！</p>
    </section>
  </div>;
}

function Gesture({ back }: { back: () => void }) {
  const [time, setTime] = useState(60);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [word, setWord] = useState(() => gestureWords[rand(gestureWords.length)]);
  const [finished, setFinished] = useState(false);
  const nextWord = () => {
    let next = gestureWords[rand(gestureWords.length)];
    if (gestureWords.length > 1) while (next === word) next = gestureWords[rand(gestureWords.length)];
    setWord(next);
  };
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setTime(value => {
      if (value <= 1) { window.clearInterval(timer); setRunning(false); setFinished(true); return 0; }
      return value - 1;
    }),1000);
    return () => window.clearInterval(timer);
  },[running]);
  const start = () => { setTime(60); setScore(0); setFinished(false); nextWord(); setRunning(true); };

  return <div className="game-page">
    <GameHeader title="ジェスチャー" subtitle="GESTURE GAME" icon="🙌" onBack={back} />
    <section className="play-card gesture-card">
      <div className="score-row"><span>残り <b>{time}</b> 秒</span><span>正解 <b>{score}</b> 問</span></div>
      {!running && !finished && <><span className="big-emoji">🙌</span><h2>声を出さずに伝えよう！</h2><p>演じる人だけがお題を見て、ジェスチャーで仲間に伝えます。</p><button className="primary" onClick={start}>60秒スタート</button></>}
      {running && <><p className="kicker">お題</p><strong className="gesture-word">{word}</strong><p className="gesture-note">声・文字・口パクは禁止！</p><div className="gesture-actions"><button onClick={nextWord}>スキップ</button><button onClick={() => {setScore(s => s + 1);nextWord();}}>正解！</button></div></>}
      {finished && <><span className="big-emoji">🎊</span><h2>タイムアップ！</h2><div className="final-score"><b>{score}</b><span>問正解</span></div><button className="primary" onClick={start}>もう一度</button></>}
    </section>
  </div>;
}

function FiveSeconds({ back }: { back: () => void }) {
  const [phase,setPhase] = useState<"ready"|"running"|"result">("ready");
  const [started,setStarted] = useState(0);
  const [elapsed,setElapsed] = useState(0);
  const start = () => { setStarted(performance.now()); setElapsed(0); setPhase("running"); };
  const stop = () => { setElapsed((performance.now()-started)/1000); setPhase("result"); };
  return <div className="game-page"><GameHeader title="5秒ぴったり" subtitle="JUST FIVE" icon="⏱" onBack={back}/><section className="play-card center-card">
    <span className="big-emoji">⏱️</span><h2>{phase==="ready"?"5秒を感覚で当てよう！":phase==="running"?"5秒だと思ったら止めて！":`${elapsed.toFixed(2)} 秒`}</h2>
    {phase==="result" && <div className="timing-result">誤差 <b>{Math.abs(elapsed-5).toFixed(2)}</b> 秒</div>}
    <button className="primary" onClick={phase==="running"?stop:start}>{phase==="running"?"ストップ！":phase==="result"?"もう一度":"スタート"}</button>
    <p className="howto">スタート後は時間を表示しません。全員で挑戦して、5秒に一番近い人が勝ち！</p>
  </section></div>;
}

function MatchAll({ back }: { back: () => void }) {
  const [prompt,setPrompt] = useState(()=>matchPrompts[rand(matchPrompts.length)]);
  const [show,setShow] = useState(false);
  const next=()=>{let n=matchPrompts[rand(matchPrompts.length)]; while(n===prompt)n=matchPrompts[rand(matchPrompts.length)];setPrompt(n);setShow(false)};
  return <div className="game-page"><GameHeader title="全員一致" subtitle="MATCH ALL" icon="◎" onBack={back}/><section className="play-card center-card">
    <p className="kicker">みんなの答えをそろえよう</p><strong className="party-prompt">{show?prompt:"お題はまだ秘密"}</strong>
    {!show?<button className="primary" onClick={()=>setShow(true)}>お題を表示</button>:<button className="primary" onClick={next}>次のお題</button>}
    <p className="howto">お題を見たら相談せず、せーので答えます。全員同じ答えなら成功！</p>
  </section></div>;
}

function WordWolf({ back }: { back: () => void }) {
  const [count,setCount]=useState(4); const [phase,setPhase]=useState<"setup"|"pass"|"talk"|"answer">("setup");
  const [index,setIndex]=useState(0); const [revealed,setRevealed]=useState(false); const [words,setWords]=useState<string[]>([]); const [pair,setPair]=useState<string[]>([]);
  const start=()=>{const p=wolfPairs[rand(wolfPairs.length)];const wolf=rand(count);setPair(p);setWords(Array.from({length:count},(_,i)=>i===wolf?p[1]:p[0]));setIndex(0);setRevealed(false);setPhase("pass")};
  const next=()=>{if(index+1===count){setPhase("talk");return}setIndex(i=>i+1);setRevealed(false)};
  return <div className="game-page"><GameHeader title="ワードウルフ" subtitle="WORD WOLF" icon="🐺" onBack={back}/><section className="play-card center-card">
    {phase==="setup"&&<><span className="big-emoji">🐺</span><h2>少数派を見つけよう</h2><label className="select-row">参加人数<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[3,4,5,6,7,8,9,10].map(n=><option key={n}>{n}</option>)}</select></label><button className="primary" onClick={start}>ゲーム開始</button></>}
    {phase==="pass"&&<><span className="turn-pill">{index+1} / {count}</span><h2>{index+1}人目だけ見てください</h2>{revealed?<><strong className="party-prompt">{words[index]}</strong><button className="primary" onClick={next}>隠して次の人へ</button></>:<button className="reveal-button" onClick={()=>setRevealed(true)}>自分のワードを見る</button>}</>}
    {phase==="talk"&&<><span className="big-emoji">🗣️</span><h2>話し合いスタート！</h2><p>自分のワードを直接言わずに会話し、少数派を予想します。</p><button className="primary" onClick={()=>setPhase("answer")}>答え合わせ</button></>}
    {phase==="answer"&&<><p className="kicker">ANSWER</p><h2>多数派「{pair[0]}」<br/>少数派「{pair[1]}」</h2><div className="answer-list">{words.map((w,i)=><div key={i}><span>{i+1}人目</span><b>{w}</b></div>)}</div><button className="primary" onClick={start}>もう一度</button></>}
  </section></div>;
}

function FirstImpression({ back }: { back: () => void }) {
  const [prompt,setPrompt]=useState(()=>impressionPrompts[rand(impressionPrompts.length)]); const [shown,setShown]=useState(false);
  const next=()=>{let n=impressionPrompts[rand(impressionPrompts.length)];while(n===prompt)n=impressionPrompts[rand(impressionPrompts.length)];setPrompt(n);setShown(false)};
  return <div className="game-page"><GameHeader title="第一印象" subtitle="FIRST IMPRESSION" icon="👑" onBack={back}/><section className="play-card center-card">
    <span className="big-emoji">👉</span><p className="kicker">お題</p><strong className="party-prompt">{prompt}</strong>
    {!shown?<button className="primary" onClick={()=>setShown(true)}>せーので指さす！</button>:<><div className="timing-result">一番多く指された人はだれ？</div><button className="primary" onClick={next}>次のお題</button></>}
    <p className="howto">3・2・1で、お題に一番当てはまる人を全員同時に指さします。</p>
  </section></div>;
}
