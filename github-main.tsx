import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Home from "./app/page";
import DosukoiExamplesEnhancer from "./app/DosukoiExamplesEnhancer";
import "./app/globals.css";
import "./app/dosukoi-enhancements.css";

const root = document.getElementById("root");

if (!root) throw new Error("App root was not found");

const APP_VERSION = "v1.4.1";
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

function getGameCards() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button.game-card"));
}

function restoreScreenFromUrl() {
  const slug = window.location.hash.replace(/^#/, "");
  if (!slug) return;
  const index = SCREEN_SLUGS.indexOf(slug as (typeof SCREEN_SLUGS)[number]);
  if (index < 0) return;
  getGameCards()[index]?.click();
}

function VersionBadge() {
  return (
    <>
      <div className="app-version" aria-label={`アプリバージョン ${APP_VERSION}`}>{APP_VERSION}</div>
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
        body:has(.dosukoi-page) .app-version {
          display: none;
        }
      `}</style>
    </>
  );
}

function App() {
  useEffect(() => {
    const rememberScreen = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>("button");
      if (!button) return;

      if (button.classList.contains("back")) {
        localStorage.removeItem(SCREEN_KEY);
        history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }

      if (button.classList.contains("game-card")) {
        const index = getGameCards().indexOf(button);
        const slug = SCREEN_SLUGS[index];
        if (!slug) return;
        localStorage.setItem(SCREEN_KEY, slug);
        history.replaceState(null, "", `#${slug}`);
      }
    };

    const restore = () => {
      const hashSlug = window.location.hash.replace(/^#/, "");
      const savedSlug = localStorage.getItem(SCREEN_KEY) ?? "";
      const slug = SCREEN_SLUGS.includes(hashSlug as (typeof SCREEN_SLUGS)[number]) ? hashSlug : savedSlug;
      if (!SCREEN_SLUGS.includes(slug as (typeof SCREEN_SLUGS)[number])) return;
      if (!window.location.hash) history.replaceState(null, "", `#${slug}`);
      window.setTimeout(restoreScreenFromUrl, 0);
    };

    document.addEventListener("click", rememberScreen, true);
    window.addEventListener("hashchange", restoreScreenFromUrl);
    restore();

    return () => {
      document.removeEventListener("click", rememberScreen, true);
      window.removeEventListener("hashchange", restoreScreenFromUrl);
    };
  }, []);

  return (
    <>
      <Home />
      <DosukoiExamplesEnhancer />
      <VersionBadge />
    </>
  );
}

createRoot(root).render(<App />);
