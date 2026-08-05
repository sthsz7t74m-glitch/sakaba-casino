import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Home from "./app/page";
import DosukoiExamplesEnhancer from "./app/DosukoiExamplesEnhancer";
import FiveSecondsGame from "./app/FiveSecondsGame";
import FiveSecondsVersionBadge from "./app/FiveSecondsVersionBadge";
import HomeVersionBadge from "./app/HomeVersionBadge";
import PartyGameEnhancer from "./app/PartyGameEnhancer";
import "./app/globals.css";
import "./app/dosukoi-enhancements.css";
import "./app/party-game-enhancements.css";
import "./app/five-seconds-v2.css";
import "./app/five-seconds-compact.css";

const root = document.getElementById("root");
if (!root) throw new Error("App root was not found");

const BASE_PATH = "/sakaba-casino/";
const SCREEN_SLUGS = [
  "chinchiro",
  "classic-chinchiro",
  "dosukoi",
  "ng-word",
  "majority",
  "bomb",
  "gesture",
  "five-seconds",
  "match-all",
  "word-wolf",
  "first-impression",
  "forbidden-kana",
  "no-katakana",
  "ranking-guess",
  "drawing-sync",
  "three-quick",
  "three-hints",
  "common-point",
] as const;

type ScreenSlug = (typeof SCREEN_SLUGS)[number];

function isScreenSlug(value: string): value is ScreenSlug {
  return SCREEN_SLUGS.includes(value as ScreenSlug);
}

function getPathSlug(): ScreenSlug | null {
  const relativePath = window.location.pathname
    .replace(/^\/sakaba-casino\/?/, "")
    .replace(/^\/+|\/+$/g, "");
  return isScreenSlug(relativePath) ? relativePath : null;
}

function gamePath(slug: ScreenSlug): string {
  return `${BASE_PATH}${slug}/`;
}

function getGameCards(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button.game-card"));
}

function openScreen(slug: ScreenSlug): boolean {
  const card = getGameCards()[SCREEN_SLUGS.indexOf(slug)];
  if (!card) return false;
  card.click();
  return true;
}

function openScreenWhenReady(slug: ScreenSlug, signal: AbortSignal) {
  const startedAt = performance.now();
  const attempt = () => {
    if (signal.aborted || openScreen(slug)) return;
    if (performance.now() - startedAt < 5000) window.requestAnimationFrame(attempt);
  };
  attempt();
}

function App() {
  useEffect(() => {
    const controller = new AbortController();
    let restoring = false;

    const restore = (slug: ScreenSlug | null) => {
      if (!slug) return;
      restoring = true;
      openScreenWhenReady(slug, controller.signal);
      window.setTimeout(() => { restoring = false; }, 300);
    };

    const oldHash = window.location.hash.replace(/^#/, "");
    if (isScreenSlug(oldHash)) {
      history.replaceState(null, "", gamePath(oldHash));
    }
    restore(getPathSlug());

    const handleClick = (event: MouseEvent) => {
      if (restoring) return;
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button");
      if (!button) return;

      if (button.classList.contains("back")) {
        if (window.location.pathname !== BASE_PATH) history.pushState(null, "", BASE_PATH);
        return;
      }

      if (!button.classList.contains("game-card")) return;
      const slug = SCREEN_SLUGS[getGameCards().indexOf(button)];
      if (slug && window.location.pathname !== gamePath(slug)) {
        history.pushState(null, "", gamePath(slug));
      }
    };

    const handlePopState = () => {
      const slug = getPathSlug();
      if (slug) {
        restore(slug);
        return;
      }
      const backButton = document.querySelector<HTMLButtonElement>(".game-page .game-header .back, .five-v2-header .back");
      backButton?.click();
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      controller.abort();
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <>
      <Home />
      <HomeVersionBadge />
      <DosukoiExamplesEnhancer />
      <PartyGameEnhancer />
      <FiveSecondsGame />
      <FiveSecondsVersionBadge />
    </>
  );
}

createRoot(root).render(<App />);
