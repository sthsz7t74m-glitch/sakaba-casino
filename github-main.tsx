import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Home from "./app/page";
import GlobalTimer from "./app/GlobalTimer";
import "./app/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("App root was not found");

const SCREEN_KEY = "sakaba-current-screen";

function App() {
  useEffect(() => {
    const rememberScreen = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;

      if (button.classList.contains("back")) {
        localStorage.removeItem(SCREEN_KEY);
        history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }

      if (button.classList.contains("game-card") && button.textContent?.includes("どすこい")) {
        localStorage.setItem(SCREEN_KEY, "dosukoi");
        history.replaceState(null, "", "#dosukoi");
      }
    };

    document.addEventListener("click", rememberScreen, true);

    const shouldRestore = window.location.hash === "#dosukoi" || localStorage.getItem(SCREEN_KEY) === "dosukoi";
    let restoreTimer: number | undefined;

    if (shouldRestore) {
      restoreTimer = window.setTimeout(() => {
        const dosukoiButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button.game-card"))
          .find(button => button.textContent?.includes("どすこい"));
        dosukoiButton?.click();
      }, 0);
    }

    return () => {
      document.removeEventListener("click", rememberScreen, true);
      if (restoreTimer !== undefined) window.clearTimeout(restoreTimer);
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
