import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Home from "./app/page";
import GlobalTimer from "./app/GlobalTimer";
import "./app/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("App root was not found");

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
      <GlobalTimer />
    </>
  );
}

createRoot(root).render(<App />);
