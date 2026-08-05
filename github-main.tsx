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

function App() {
  useEffect(() => {
    let openingDirectRoute = false;

    const oldHash = window.location.hash.replace(/^#/, "");
    if (isScreenSlug(oldHash)) {
      window.location.replace(gamePath(oldHash));
      return;
    }

    const initialSlug = getPathSlug();
    const openTimer = initialSlug
      ? window.setTimeout(() => {
          const card = getGameCards()[SCREEN_SLUGS.indexOf(initialSlug)];
          if (!card) {
            window.location.replace(BASE_PATH);
            return;
          }
          openingDirectRoute = true;
          card.click();
          window.setTimeout(() => {
            openingDirectRoute = false;
          }, 0);
        }, 500)
      : null;

    const navigate = (event: MouseEvent) => {
      if (openingDirectRoute) return;
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button");
      if (!button) return;

      if (button.classList.contains("back")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        window.location.assign(BASE_PATH);
        return;
      }

      if (!button.classList.contains("game-card")) return;
      const slug = SCREEN_SLUGS[getGameCards().indexOf(button)];
      if (!slug) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.location.assign(gamePath(slug));
    };

    document.addEventListener("click", navigate, true);
    return () => {
      if (openTimer !== null) window.clearTimeout(openTimer);
      document.removeEventListener("click", navigate, true);
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
