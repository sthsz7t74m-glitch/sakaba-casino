"use client";

import { useEffect } from "react";
import {
  ensureCardSurfaces,
  ensureFormControls,
  ensureGameHeaderVersion,
  ensureModalDialogs,
  ensurePartyTip,
  ensurePrimaryActions,
  ensureSecondaryActions,
} from "./components";
import { getPartyGameContent } from "./party-games/content";
import { removeLegacyVersionBadges } from "./party-games/runtime";
import { APP_VERSION } from "./version";

const EXCLUDED_TITLES = new Set(["どすこい"]);

function findGamePage(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".game-page");
}

function findGameTitle(page: HTMLElement): string {
  return page.querySelector<HTMLElement>(".game-header h1, .game-header h2")?.textContent?.trim() ?? "";
}

function syncHomeVersion(): void {
  const version = document.querySelector<HTMLElement>(".lobby footer b");
  if (version) {
    version.textContent = `v${APP_VERSION}`;
    version.dataset.appVersion = APP_VERSION;
  }
}

function clearLegacyHash(): void {
  if (!window.location.hash) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

function enhancePage(page: HTMLElement): void {
  const title = findGameTitle(page);
  if (!title || EXCLUDED_TITLES.has(title) || title.includes("ちんちろ")) return;
  if (page.dataset.partyEnhanced === APP_VERSION) return;

  const content = getPartyGameContent(title);
  if (!content) return;

  const anchor = page.querySelector<HTMLElement>(".play-card, section");
  if (!anchor) return;

  ensureGameHeaderVersion(page);
  ensurePartyTip(page, anchor, content.tip);
  ensurePrimaryActions(page);
  ensureSecondaryActions(page);
  ensureFormControls(page);
  ensureModalDialogs(page);
  ensureCardSurfaces(page);
  page.dataset.partyEnhanced = APP_VERSION;
}

export default function PartyGameEnhancer() {
  useEffect(() => {
    let frame = 0;

    const enhance = () => {
      frame = 0;
      clearLegacyHash();
      removeLegacyVersionBadges();
      syncHomeVersion();
      const page = findGamePage();
      if (page) enhancePage(page);
    };

    const scheduleEnhance = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(enhance);
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".game-card, .back")) scheduleEnhance();
    };

    document.addEventListener("click", onClick, true);
    scheduleEnhance();

    return () => {
      document.removeEventListener("click", onClick, true);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
