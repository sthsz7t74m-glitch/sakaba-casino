import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Home from "./app/page";
import DosukoiExamplesEnhancer from "./app/DosukoiExamplesEnhancer";
import PartyGameEnhancer from "./app/PartyGameEnhancer";
import "./app/globals.css";
import "./app/dosukoi-enhancements.css";
import "./app/party-game-enhancements.css";

const root = document.getElementById("root");
if (!root) throw new Error("App root was not found");

const APP_VERSION = "v1.7.1";
const SCREEN_KEY = "sakaba-current-screen";
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

function getHashSlug(): ScreenSlug | null {
  const value = window.location.hash.replace(/^#/, "");
  return isScreenSlug(value) ? value : null;
}

function getSavedSlug(): ScreenSlug | null {
  const value = localStorage.getItem(SCREEN_KEY) ?? "";
  return isScreenSlug(value) ? value : null;
}

function getGameCards(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button.game-card"));
}

function openScreen(slug: ScreenSlug): boolean {
  const index = SCREEN_SLUGS.indexOf(slug);
  const card = getGameCards()[index];
  if (!card) return false;
  card.click();
  return true;
}

function restoreScreenOnce(slug: ScreenSlug, signal: AbortSignal) {
  const startedAt = performance.now();

  const attempt = () => {
    if (signal.aborted) return;
    if (openScreen(slug)) return;
    if (performance.now() - startedAt >= 5000) return;
    window.requestAnimationFrame(attempt);
  };

  attempt();
}

function VersionBadge() {
  return (
    <>
      <div className="app-version" aria-label={`アプリバージョン ${APP_VERSION}`}>
        {APP_VERSION}
      </div>
      <style>{`
        .app-version {
          position: fixed;
          z-index: 1200;
          right: max(10px, env(safe-area-inset-right));
          bottom: max(10px, env(safe-area-inset-bottom));
          padding: 5px 9px;
          border: 1px solid rgba(41, 50, 77, .12);
          border-radius: 999px;
          color: #6f7893;
          background: rgba(255, 255, 255, .9);
          box-shadow: 0 3px 10px rgba(41, 50, 77, .1);
          font-size: 10px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: .04em;
          pointer-events: none;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        body:has(.dosukoi-page) .app-version { display: none; }
      `}</style>
    </>
  );
}

function App() {
  useEffect(() => {
    const controller = new AbortController();
    let restoring = false;

    const restore = (slug: ScreenSlug | null) => {
      if (!slug) return;
      restoring = true;
      restoreScreenOnce(slug, controller.signal);
      window.setTimeout(() => {
        restoring = false;
      }, 250);
    };

    const initialSlug = getHashSlug() ?? getSavedSlug();
    if (initialSlug) {
      if (!window.location.hash) history.replaceState(null, "", `#${initialSlug}`);
      restore(initialSlug);
    }

    const rememberScreen = (event: MouseEvent) => {
      if (restoring) return;
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button");
      if (!button) return;

      if (button.classList.contains("back")) {
        localStorage.removeItem(SCREEN_KEY);
        history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }

      if (!button.classList.contains("game-card")) return;
      const index = getGameCards().indexOf(button);
      const slug = SCREEN_SLUGS[index];
      if (!slug) return;
      localStorage.setItem(SCREEN_KEY, slug);
      history.replaceState(null, "", `#${slug}`);
    };

    const handleHashChange = () => {
      const slug = getHashSlug();
      if (!slug) return;
      localStorage.setItem(SCREEN_KEY, slug);
      restore(slug);
    };

    document.addEventListener("click", rememberScreen, true);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      controller.abort();
      document.removeEventListener("click", rememberScreen, true);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <>
      <Home />
      <DosukoiExamplesEnhancer />
      <PartyGameEnhancer />
      <VersionBadge />
    </>
  );
}

createRoot(root).render(<App />);
