"use client";

import { useEffect, useRef, useState } from "react";

const LIMIT_SECONDS = 120;

export default function GlobalTimer() {
  const [remaining, setRemaining] = useState(LIMIT_SECONDS);
  const [running, setRunning] = useState(false);
  const [expired, setExpired] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setRemaining(current => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setExpired(true);
          playAlarm();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

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
    } catch {
      // Sound is optional; the visual alert still works.
    }
  };

  const toggle = () => {
    if (remaining === 0) {
      setRemaining(LIMIT_SECONDS);
      setExpired(false);
      setRunning(true);
      return;
    }
    setExpired(false);
    setRunning(current => !current);
  };

  const reset = () => {
    setRunning(false);
    setRemaining(LIMIT_SECONDS);
    setExpired(false);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <aside className={`global-timer ${running ? "is-running" : ""} ${expired ? "is-expired" : ""}`} aria-live="polite">
      <div className="global-timer-display">
        <small>{expired ? "時間切れ！" : "制限時間"}</small>
        <strong>{minutes}:{seconds}</strong>
      </div>
      <div className="global-timer-actions">
        <button type="button" onClick={toggle}>{running ? "一時停止" : remaining === 0 ? "もう一度" : "スタート"}</button>
        <button type="button" onClick={reset} aria-label="タイマーを2分に戻す">↻</button>
      </div>
      <style>{`
        .global-timer {
          position: fixed;
          z-index: 1000;
          top: max(10px, env(safe-area-inset-top));
          right: max(10px, env(safe-area-inset-right));
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 8px 7px 12px;
          border: 2px solid rgba(255,255,255,.92);
          border-radius: 18px;
          color: #3b2630;
          background: rgba(255,255,255,.96);
          box-shadow: 0 6px 18px rgba(72,28,43,.2);
          font-family: inherit;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .global-timer-display {
          min-width: 61px;
          text-align: center;
          line-height: 1;
        }
        .global-timer-display small {
          display: block;
          margin-bottom: 3px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }
        .global-timer-display strong {
          display: block;
          font-size: 25px;
          font-variant-numeric: tabular-nums;
          letter-spacing: .02em;
        }
        .global-timer-actions {
          display: flex;
          gap: 4px;
        }
        .global-timer-actions button {
          min-height: 34px;
          padding: 0 9px;
          border: 0;
          border-radius: 11px;
          color: white;
          background: #ef5573;
          font: inherit;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          touch-action: manipulation;
        }
        .global-timer-actions button:last-child {
          width: 34px;
          padding: 0;
          font-size: 20px;
          background: #735b66;
        }
        .global-timer.is-running {
          border-color: #ffd166;
        }
        .global-timer.is-expired {
          color: white;
          background: #df304f;
          animation: timer-alert .55s ease-in-out infinite alternate;
        }
        .global-timer.is-expired .global-timer-actions button {
          color: #df304f;
          background: white;
        }
        .global-timer.is-expired .global-timer-actions button:last-child {
          color: white;
          background: #735b66;
        }
        @keyframes timer-alert {
          from { transform: scale(1); }
          to { transform: scale(1.035); }
        }
        @media (max-width: 520px) {
          .global-timer {
            top: max(6px, env(safe-area-inset-top));
            right: max(6px, env(safe-area-inset-right));
            gap: 5px;
            padding: 5px 6px 5px 9px;
            border-radius: 15px;
          }
          .global-timer-display { min-width: 54px; }
          .global-timer-display strong { font-size: 21px; }
          .global-timer-actions button { min-height: 30px; padding: 0 7px; font-size: 10px; }
          .global-timer-actions button:last-child { width: 30px; font-size: 18px; }
        }
      `}</style>
    </aside>
  );
}
