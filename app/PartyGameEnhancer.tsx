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

function enhancePage(page: HTMLElement): void {
  const title = findGameTitle(page);
  if (!title || EXCLUDED_TITLES.has(title) || title.includes("ちんちろ")) return;

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
    const enhance = () => {
      removeLegacyVersionBadges();
      const page = findGamePage();
      if (page) enhancePage(page);
    };

    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    enhance();

    return () => observer.disconnect();
  }, []);

  return null;
}
