"use client";

import { useEffect } from "react";
import { ensureGameHeaderVersion } from "./components/GameHeaderVersion";
import { getPartyGameContent } from "./party-games/content";
import { createElement, removeLegacyVersionBadges } from "./party-games/runtime";
import { APP_VERSION } from "./version";

const EXCLUDED_TITLES = new Set(["どすこい"]);

function findGamePage(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".game-page");
}

function findGameTitle(page: HTMLElement): string {
  return page.querySelector<HTMLElement>(".game-header h1, .game-header h2")?.textContent?.trim() ?? "";
}

function addTip(page: HTMLElement, anchor: HTMLElement, tip?: string): void {
  if (!tip || page.querySelector(".party-tip")) return;
  const box = createElement("aside", "party-tip");
  box.append(createElement("b", undefined, "盛り上がるコツ"), createElement("span", undefined, tip));
  anchor.before(box);
}

function enhancePage(page: HTMLElement): void {
  const title = findGameTitle(page);
  if (!title || EXCLUDED_TITLES.has(title) || title.includes("ちんちろ")) return;

  const content = getPartyGameContent(title);
  if (!content) return;

  const anchor = page.querySelector<HTMLElement>(".play-card, section");
  if (!anchor) return;

  ensureGameHeaderVersion(page);
  addTip(page, anchor, content.tip);
  page.dataset.partyEnhanced = APP_VERSION;
}

export default function PartyGameEnhancer() {
  useEffect(() => {
    let currentPage: HTMLElement | null = null;

    const enhance = () => {
      removeLegacyVersionBadges();
      const page = findGamePage();
      if (!page || page === currentPage) return;
      currentPage = page;
      enhancePage(page);
    };

    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    enhance();

    return () => observer.disconnect();
  }, []);

  return null;
}
