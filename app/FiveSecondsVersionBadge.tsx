"use client";

import { useEffect } from "react";
import { APP_VERSION } from "./version";

function applyVersionBadge(): void {
  const header = document.querySelector<HTMLElement>(".five-v2-header");
  if (!header) return;

  let badge = header.querySelector<HTMLElement>("[data-five-version]");
  if (!badge) {
    badge = document.createElement("span");
    badge.dataset.fiveVersion = "true";
    badge.className = "five-version-badge";
    badge.setAttribute("aria-label", `アプリバージョン ${APP_VERSION}`);
    header.append(badge);
  }
  badge.textContent = APP_VERSION;
}

export default function FiveSecondsVersionBadge() {
  useEffect(() => {
    const observer = new MutationObserver(applyVersionBadge);
    observer.observe(document.body, { childList: true, subtree: true });
    applyVersionBadge();
    return () => observer.disconnect();
  }, []);

  return <style>{`
    .five-v2-header { position: relative; }
    .five-version-badge {
      position: absolute;
      top: 12px;
      right: 66px;
      z-index: 3;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 28px;
      padding: 4px 11px;
      border: 2px solid rgba(119, 96, 206, .18);
      border-radius: 999px;
      color: #715fc4;
      background: rgba(255, 255, 255, .95);
      box-shadow: 0 5px 14px rgba(74, 57, 128, .12);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .04em;
      line-height: 1;
      white-space: nowrap;
    }
    @media (max-width: 520px) {
      .five-version-badge {
        top: 10px;
        right: 58px;
        min-height: 25px;
        padding: 3px 9px;
        font-size: 11px;
      }
    }
  `}</style>;
}
