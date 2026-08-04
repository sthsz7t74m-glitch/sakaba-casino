"use client";

import { useEffect } from "react";
import { getPartyGameContent } from "./party-games/content";
import { createElement, pickDifferent, removeLegacyVersionBadges, vibrate } from "./party-games/runtime";
import { APP_VERSION } from "./version";

const EXCLUDED_TITLES = new Set(["どすこい"]);

function findGamePage(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".game-page");
}

function findGameTitle(page: HTMLElement): string {
  return page.querySelector<HTMLElement>(".game-header h1, .game-header h2")?.textContent?.trim() ?? "";
}

function addVersionBadge(page: HTMLElement): void {
  const header = page.querySelector<HTMLElement>(".game-header");
  if (!header || header.querySelector(".party-version")) return;
  header.appendChild(createElement("span", "party-version", APP_VERSION));
}

function addTip(page: HTMLElement, anchor: HTMLElement, tip?: string): void {
  if (!tip || page.querySelector(".party-tip")) return;
  const box = createElement("aside", "party-tip");
  box.append(createElement("b", undefined, "盛り上がるコツ"), createElement("span", undefined, tip));
  anchor.before(box);
}

function addPromptPanel(page: HTMLElement, anchor: HTMLElement, prompts: readonly string[]): void {
  if (prompts.length === 0 || page.querySelector(".party-extra-panel")) return;

  const panel = createElement("section", "party-extra-panel");
  const heading = createElement("div", "party-extra-heading");
  const headingCopy = createElement("div");
  headingCopy.append(createElement("small", undefined, "EXTRA PACK"), createElement("b", undefined, "追加お題パック"));
  heading.append(headingCopy, createElement("span", undefined, `${prompts.length}問`));

  const display = createElement("div", "party-extra-prompt", "追加お題を引いてみよう");
  display.setAttribute("aria-live", "polite");
  const button = createElement("button", "party-extra-draw", "追加お題を抽選");
  button.type = "button";

  let previous: string | undefined;
  button.addEventListener("click", () => {
    const next = pickDifferent(prompts, previous);
    if (!next) return;
    previous = next;
    display.textContent = next;
    panel.classList.remove("is-pop");
    window.requestAnimationFrame(() => panel.classList.add("is-pop"));
    vibrate();
  });

  panel.append(heading, display, button);
  anchor.after(panel);
}

function enhancePage(page: HTMLElement): void {
  const title = findGameTitle(page);
  if (!title || EXCLUDED_TITLES.has(title) || title.includes("ちんちろ")) return;

  const content = getPartyGameContent(title);
  if (!content) return;

  const anchor = page.querySelector<HTMLElement>(".play-card, section");
  if (!anchor) return;

  addVersionBadge(page);
  addTip(page, anchor, content.tip);
  addPromptPanel(page, anchor, content.prompts);
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
