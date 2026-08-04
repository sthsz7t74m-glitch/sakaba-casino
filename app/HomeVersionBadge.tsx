"use client";

import { useEffect } from "react";
import { APP_VERSION } from "./version";

function applyHomeVersion(): void {
  const header = document.querySelector<HTMLElement>(".lobby .brand-header");
  if (header && !header.querySelector("[data-home-version]")) {
    const badge = document.createElement("span");
    badge.dataset.homeVersion = "true";
    badge.className = "home-version-badge";
    badge.textContent = APP_VERSION;
    badge.setAttribute("aria-label", `アプリバージョン ${APP_VERSION}`);
    header.append(badge);
  }

  const footerVersion = document.querySelector<HTMLElement>(".lobby footer b");
  if (footerVersion) footerVersion.textContent = APP_VERSION;
}

export default function HomeVersionBadge() {
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyHomeVersion);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".game-card, .game-header .back")) schedule();
    };

    schedule();
    document.addEventListener("click", onClick, true);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return <style>{`
    .brand-header { position: relative; }
    .home-version-badge {
      position: absolute;
      top: 12px;
      right: 14px;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 28px;
      padding: 4px 12px;
      border: 2px solid rgba(119, 96, 206, .18);
      border-radius: 999px;
      color: #715fc4;
      background: rgba(255, 255, 255, .94);
      box-shadow: 0 5px 14px rgba(74, 57, 128, .12);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .04em;
      line-height: 1;
      white-space: nowrap;
    }
    @media (max-width: 520px) {
      .home-version-badge {
        top: 10px;
        right: 10px;
        min-height: 25px;
        padding: 3px 9px;
        font-size: 11px;
      }
      .brand-header > div { padding-right: 58px; }
    }
  `}</style>;
}
