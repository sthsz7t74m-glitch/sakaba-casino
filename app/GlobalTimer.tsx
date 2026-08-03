"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DEFAULT_LIMIT_SECONDS = 120;
const LIMIT_OPTIONS = [30, 60, 120, 180, 300] as const;
const STORAGE_KEY = "dosukoi-time-limit";

type SavedTimer = {
  limitSeconds: number;
  remaining: number;
  running: boolean;
  deadline: number | null;
  expired: boolean;
};

function normalizeLimit(value: unknown) {
  const parsed = Number(value);
  return LIMIT_OPTIONS.includes(parsed as (typeof LIMIT_OPTIONS)[number]) ? parsed : DEFAULT_LIMIT_SECONDS;
}

function readSavedTimer(): SavedTimer {
  const fallback: SavedTimer = {
    limitSeconds: DEFAULT_LIMIT_SECONDS,
    remaining: DEFAULT_LIMIT_SECONDS,
    running: false,
    deadline: null,
    expired: false,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const saved = JSON.parse(raw) as Partial<SavedTimer>;
    const limitSeconds = normalizeLimit(saved.limitSeconds);

    if (saved.running && typeof saved.deadline === "number") {
      const remaining = Math.max(0, Math.ceil((saved.deadline - Date.now()) / 1000));
      return {
        limitSeconds,
        remaining,
        running: remaining > 0,
        deadline: remaining > 0 ? saved.deadline : null,
        expired: remaining === 0,
      };
    }

    const remaining = Math.max(0, Math.min(limitSeconds, Number(saved.remaining) || 0));
    return {
      limitSeconds,
      remaining,
      running: false,
      deadline: null,
      expired: remaining === 0 || Boolean(saved.expired),
    };
  } catch {
    return fallback;
  }
}

function formatLimit(seconds: number) {
  return seconds < 60 ? `${seconds}秒` : `${seconds / 60}分`;
}

export default function GlobalTimer() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [limitSeconds, setLimitSeconds] = useState(DEFAULT_LIMIT_SECONDS);
  const [remaining, setRemaining] = useState(DEFAULT_LIMIT_SECONDS);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const [ready, setReady] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAlarm = () => {
    try {
      const AudioCtor = window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const audio = audioContextRef.current ?? new AudioCtor();
      audioContextRef.current = audio;
      const now = audio.currentTime;
      [0, 0.22, 0.44].forEach(offset => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(760, now + offset);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.16, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + 0.18);
      });
    } catch {}
  };

  const startFresh = () => {
    const nextDeadline = Date.now() + limitSeconds * 1000;
    setRemaining(limitSeconds);
    setDeadline(nextDeadline);
    setExpired(false);
    setRunning(true);
  };

  useEffect(() => {
    const saved = readSavedTimer();
    setLimitSeconds(saved.limitSeconds);
    setRemaining(saved.remaining);
    setRunning(saved.running);
    setDeadline(saved.deadline);
    setExpired(saved.expired);
    setReady(true);
  }, []);

  useEffect(() => {
    const updateMount = () => {
      const button = document.querySelector<HTMLElement>(".dosukoi-page .dosukoi-next");
      if (!button) {
        setMount(null);
        return;
      }
      let host = document.querySelector<HTMLElement>(".dosukoi-timer-mount");
      if (!host) {
        host = document.createElement("div");
        host.className = "dosukoi-timer-mount";
        button.parentElement?.insertBefore(host, button);
      }
      setMount(host);
    };

    updateMount();
    const observer = new MutationObserver(updateMount);
    observer.observe(document.body, { childList: true, subtree: true });

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".dosukoi-page .dosukoi-next")) startFresh();
    };
    document.addEventListener("click", onClick);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick);
    };
  }, [limitSeconds]);

  useEffect(() => {
    if (!running || deadline === null) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        setRunning(false);
        setDeadline(null);
        setExpired(true);
        playAlarm();
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [running, deadline]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ limitSeconds, remaining, running, deadline, expired }),
    );
  }, [limitSeconds, remaining, running, deadline, expired, ready]);

  const changeLimit = (nextLimit: number) => {
    setLimitSeconds(nextLimit);
    setRunning(false);
    setDeadline(null);
    setRemaining(nextLimit);
    setExpired(false);
  };

  const toggle = () => {
    if (remaining === 0) {
      startFresh();
      return;
    }
    if (running) {
      setRunning(false);
      setDeadline(null);
    } else {
      setDeadline(Date.now() + remaining * 1000);
      setExpired(false);
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    setDeadline(null);
    setRemaining(limitSeconds);
    setExpired(false);
  };

  if (!mount) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return createPortal(
    <aside className={`dosukoi-time-limit ${running ? "is-running" : ""} ${expired ? "is-expired" : ""}`} aria-live="polite">
      <label className="dosukoi-time-select">
        <span>制限時間</span>
        <select
          value={limitSeconds}
          onChange={event => changeLimit(Number(event.target.value))}
          disabled={running}
          aria-label="制限時間を選択"
        >
          {LIMIT_OPTIONS.map(option => (
            <option key={option} value={option}>{formatLimit(option)}</option>
          ))}
        </select>
      </label>
      <div className="dosukoi-time-display">
        <small>{expired ? "時間切れ！" : "残り時間"}</small>
        <strong>{minutes}:{seconds}</strong>
      </div>
      <div className="dosukoi-time-actions">
        <button type="button" onClick={toggle}>{running ? "一時停止" : remaining === 0 ? "もう一度" : "スタート"}</button>
        <button type="button" onClick={reset} aria-label={`時間制限を${formatLimit(limitSeconds)}に戻す`}>↻</button>
      </div>
      <style>{`
        .dosukoi-timer-mount { width:100%; margin:12px 0 10px; }
        .dosukoi-time-limit {
          width:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:12px;
          padding:11px 14px;
          border:2px solid rgba(255,255,255,.92);
          border-radius:18px;
          color:#3b2630;
          background:rgba(255,255,255,.96);
          box-shadow:0 6px 18px rgba(72,28,43,.16);
          font-family:inherit;
        }
        .dosukoi-time-select { display:flex; flex-direction:column; gap:4px; }
        .dosukoi-time-select span { font-size:10px; font-weight:900; text-align:center; }
        .dosukoi-time-select select { min-height:38px; border:2px solid #eadce2; border-radius:11px; background:#fff; padding:0 28px 0 10px; font:inherit; font-size:12px; font-weight:900; }
        .dosukoi-time-select select:disabled { opacity:.55; }
        .dosukoi-time-display { min-width:78px; text-align:center; line-height:1; }
        .dosukoi-time-display small { display:block; margin-bottom:4px; font-size:11px; font-weight:900; white-space:nowrap; }
        .dosukoi-time-display strong { display:block; font-size:30px; font-variant-numeric:tabular-nums; letter-spacing:.02em; }
        .dosukoi-time-actions { display:flex; gap:6px; }
        .dosukoi-time-actions button { min-height:38px; padding:0 12px; border:0; border-radius:12px; color:white; background:#ef5573; font:inherit; font-size:12px; font-weight:900; cursor:pointer; touch-action:manipulation; }
        .dosukoi-time-actions button:last-child { width:38px; padding:0; font-size:21px; background:#735b66; }
        .dosukoi-time-limit.is-running { border-color:#ffd166; }
        .dosukoi-time-limit.is-expired { color:white; background:#df304f; animation:dosukoi-timer-alert .55s ease-in-out infinite alternate; }
        .dosukoi-time-limit.is-expired .dosukoi-time-select select { color:#3b2630; }
        .dosukoi-time-limit.is-expired .dosukoi-time-actions button { color:#df304f; background:white; }
        .dosukoi-time-limit.is-expired .dosukoi-time-actions button:last-child { color:white; background:#735b66; }
        @keyframes dosukoi-timer-alert { from { transform:scale(1); } to { transform:scale(1.02); } }
        @media (max-width:520px) {
          .dosukoi-timer-mount { margin:10px 0 8px; }
          .dosukoi-time-limit { gap:7px; padding:9px 8px; border-radius:15px; }
          .dosukoi-time-select select { min-height:34px; padding-left:8px; font-size:11px; }
          .dosukoi-time-display { min-width:62px; }
          .dosukoi-time-display strong { font-size:25px; }
          .dosukoi-time-actions { gap:4px; }
          .dosukoi-time-actions button { min-height:34px; padding:0 8px; font-size:10px; }
          .dosukoi-time-actions button:last-child { width:34px; font-size:19px; }
        }
      `}</style>
    </aside>,
    mount,
  );
}
