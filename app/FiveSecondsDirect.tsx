"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

type Phase = "setup" | "turn" | "running" | "result" | "round" | "final";
type TimeMode = 3 | 5 | 7 | 10 | "random";
type Attempt = { playerIndex: number; round: number; target: number; elapsed: number; error: number };

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;
const ROUND_OPTIONS = [1, 3, 5, 10] as const;
const TIME_OPTIONS: readonly TimeMode[] = [3, 5, 7, 10, "random"];

function rankFor(error: number): string {
  if (error <= 0.03) return "S+";
  if (error <= 0.08) return "S";
  if (error <= 0.15) return "A";
  if (error <= 0.3) return "B";
  if (error <= 0.6) return "C";
  return "D";
}

function makeRoundTargets(rounds: number, mode: TimeMode): number[] {
  return Array.from({ length: rounds }, () => mode === "random" ? Math.floor(Math.random() * 9) + 3 : mode);
}

function FiveSecondsGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerCount, setPlayerCount] = useState(4);
  const [roundCount, setRoundCount] = useState(3);
  const [timeMode, setTimeMode] = useState<TimeMode>(5);
  const [names, setNames] = useState(["プレイヤー1", "プレイヤー2", "プレイヤー3", "プレイヤー4", "プレイヤー5", "プレイヤー6", "プレイヤー7", "プレイヤー8"]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [roundTargets, setRoundTargets] = useState<number[]>([5, 5, 5]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [latest, setLatest] = useState<Attempt | null>(null);
  const startedAt = useRef(0);

  const activeNames = names.slice(0, playerCount).map((name, index) => name.trim() || `プレイヤー${index + 1}`);
  const target = roundTargets[roundIndex] ?? 5;
  const standings = useMemo(() => activeNames.map((name, index) => {
    const records = attempts.filter((attempt) => attempt.playerIndex === index);
    return { index, name, records, totalError: records.reduce((sum, attempt) => sum + attempt.error, 0) };
  }).sort((a, b) => a.totalError - b.totalError || a.index - b.index), [activeNames, attempts]);

  const startGame = () => {
    setRoundTargets(makeRoundTargets(roundCount, timeMode));
    setRoundIndex(0); setPlayerIndex(0); setAttempts([]); setLatest(null); setPhase("turn");
  };
  const startAttempt = () => { startedAt.current = performance.now(); setPhase("running"); };
  const stopAttempt = () => {
    const elapsed = (performance.now() - startedAt.current) / 1000;
    const attempt = { playerIndex, round: roundIndex, target, elapsed, error: Math.abs(elapsed - target) };
    setAttempts((current) => [...current, attempt]); setLatest(attempt); setPhase("result");
  };
  const continueGame = () => {
    if (playerIndex + 1 < playerCount) { setPlayerIndex((current) => current + 1); setPhase("turn"); return; }
    setPhase("round");
  };
  const nextRound = () => {
    if (roundIndex + 1 >= roundCount) { setPhase("final"); return; }
    setRoundIndex((current) => current + 1); setPlayerIndex(0); setLatest(null); setPhase("turn");
  };
  const resetToSetup = () => { setPhase("setup"); setAttempts([]); setLatest(null); };

  return <section className="five-v2-shell" aria-live="polite">
    {phase === "setup" && <div className="five-v2-card five-v2-setup">
      <div className="five-v2-intro"><span>⏱️</span><div><p>みんなで体内時計バトル</p><h2>ゲーム設定</h2></div></div>
      <div className="five-v2-options">
        <label><span>参加人数</span><select value={playerCount} onChange={(event) => setPlayerCount(Number(event.target.value))}>{PLAYER_OPTIONS.map((value) => <option key={value} value={value}>{value}人</option>)}</select></label>
        <label><span>ラウンド</span><select value={roundCount} onChange={(event) => setRoundCount(Number(event.target.value))}>{ROUND_OPTIONS.map((value) => <option key={value} value={value}>{value}R</option>)}</select></label>
      </div>
      <fieldset className="five-v2-mode"><legend>目標時間</legend><div>{TIME_OPTIONS.map((value) => <button key={value} type="button" className={timeMode === value ? "is-active" : ""} onClick={() => setTimeMode(value)}>{value === "random" ? "ランダム" : `${value}秒`}</button>)}</div></fieldset>
      <div className="five-v2-names"><p>プレイヤー名</p>{activeNames.map((name, index) => <label key={index}><span>{index + 1}</span><input value={name} maxLength={12} aria-label={`${index + 1}人目の名前`} onChange={(event) => setNames((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>)}</div>
      <div className="five-v2-summary"><span>{playerCount}人</span><span>{roundCount}ラウンド</span><span>{timeMode === "random" ? "3〜11秒" : `${timeMode}秒`}</span></div>
      <button className="primary five-v2-main" type="button" onClick={startGame}>ゲーム開始</button>
    </div>}
    {phase === "turn" && <div className="five-v2-card five-v2-turn">
      <div className="five-v2-progress"><span>ROUND {roundIndex + 1} / {roundCount}</span><span>{playerIndex + 1} / {playerCount}</span></div>
      <p className="five-v2-label">次はこの人</p><h2>{activeNames[playerIndex]}さん</h2>
      <div className="five-v2-target"><small>目標</small><strong>{target}</strong><span>秒</span></div>
      <p>準備ができたらスタート。時間は表示されません。</p>
      <button className="primary five-v2-main" type="button" onClick={startAttempt}>スタート</button>
    </div>}
    {phase === "running" && <button className="five-v2-stop" type="button" onClick={stopAttempt} aria-label="計測を止める"><span>ROUND {roundIndex + 1}</span><small>{activeNames[playerIndex]}さん</small><strong>STOP</strong><p>{target}秒だと思ったらタップ！</p></button>}
    {phase === "result" && latest && <div className="five-v2-card five-v2-result">
      <p className="five-v2-label">{activeNames[playerIndex]}さんの記録</p><div className="five-v2-rank">{rankFor(latest.error)}</div>
      <strong className="five-v2-time">{latest.elapsed.toFixed(2)}<small>秒</small></strong>
      <div className="five-v2-error"><span>目標 {latest.target.toFixed(0)}秒</span><b>誤差 {latest.error.toFixed(2)}秒</b></div>
      <button className="primary five-v2-main" type="button" onClick={continueGame}>{playerIndex + 1 < playerCount ? `次は ${activeNames[playerIndex + 1]}さん` : "ラウンド結果を見る"}</button>
    </div>}
    {phase === "round" && <div className="five-v2-card"><p className="five-v2-label">ROUND {roundIndex + 1} 終了</p><h2>現在順位</h2>
      <div className="five-v2-ranking">{standings.map((player, index) => <div key={player.index} className={index === 0 ? "is-leader" : ""}><b>{index + 1}</b><span>{player.name}<small>{player.records.length}回終了</small></span><strong>{player.totalError.toFixed(2)}秒</strong></div>)}</div>
      <button className="primary five-v2-main" type="button" onClick={nextRound}>{roundIndex + 1 >= roundCount ? "最終結果へ" : `ROUND ${roundIndex + 2}へ`}</button>
    </div>}
    {phase === "final" && <div className="five-v2-card five-v2-final"><p className="five-v2-label">FINAL RESULT</p><div className="five-v2-trophy">🏆</div><h2>{standings[0]?.name}</h2><p>優勝！ 合計誤差 <b>{standings[0]?.totalError.toFixed(2)}秒</b></p>
      <div className="five-v2-podium">{standings.slice(0, 3).map((player, index) => <div key={player.index}><b>{["🥇", "🥈", "🥉"][index]}</b><span>{player.name}</span><small>{player.totalError.toFixed(2)}秒</small></div>)}</div>
      <div className="five-v2-history">{standings.map((player) => <details key={player.index}><summary><span>{player.name}</span><b>{player.totalError.toFixed(2)}秒</b></summary>{player.records.map((record) => <p key={record.round}>R{record.round + 1}：{record.elapsed.toFixed(2)}秒 <small>（誤差 {record.error.toFixed(2)}）</small></p>)}</details>)}</div>
      <button className="primary five-v2-main" type="button" onClick={startGame}>同じ設定でもう一度</button><button className="secondary" type="button" onClick={resetToSetup}>設定を変更</button>
    </div>}
  </section>;
}

function findFiveSecondsPage(): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>(".game-page")).find((page) => page.querySelector(".game-header h1, .game-header h2")?.textContent?.trim() === "5秒ぴったり") ?? null;
}

export default function FiveSecondsDirect() {
  useEffect(() => {
    let root: Root | null = null;
    let page: HTMLElement | null = null;

    const unmount = () => {
      root?.unmount(); root = null;
      page?.querySelector<HTMLElement>("[data-five-seconds-direct]")?.remove();
      page?.querySelectorAll<HTMLElement>(":scope > .play-card").forEach((card) => { card.hidden = false; });
      page = null;
    };

    const mount = () => {
      const target = findFiveSecondsPage();
      if (!target || target === page) return;
      unmount(); page = target;
      target.querySelectorAll<HTMLElement>(":scope > .play-card").forEach((card) => { card.hidden = true; });
      const host = document.createElement("div"); host.dataset.fiveSecondsDirect = "true"; target.append(host);
      root = createRoot(host); root.render(<FiveSecondsGame />);
    };

    const scheduleMount = () => { window.setTimeout(mount, 0); window.setTimeout(mount, 80); };
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest<HTMLButtonElement>(".game-card");
      if (card?.textContent?.includes("5秒ぴったり")) { scheduleMount(); return; }
      if (target?.closest(".game-header .back")) window.setTimeout(unmount, 0);
    };

    document.addEventListener("click", onClick, true);
    mount();
    return () => { document.removeEventListener("click", onClick, true); unmount(); };
  }, []);
  return null;
}
