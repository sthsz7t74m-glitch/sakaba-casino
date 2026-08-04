"use client";

import { useEffect } from "react";

const PAGE_SIZE = 30;
const APP_VERSION = "v1.6.0";
const TIMER_STORAGE_KEY = "dosukoi-timer-minutes";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

export default function DosukoiExamplesEnhancer() {
  useEffect(() => {
    let timerId: number | null = null;
    let retryId: number | null = null;
    let remaining = 120;
    let running = false;

    const stopTimer = () => {
      if (timerId !== null) window.clearInterval(timerId);
      timerId = null;
      running = false;
    };

    const enhanceExamples = (page: HTMLElement) => {
      const examples = page.querySelector<HTMLElement>(".examples");
      if (!examples || examples.dataset.enhanced === "true") return;
      examples.dataset.enhanced = "true";

      const items = Array.from(examples.querySelectorAll<HTMLElement>(":scope > span:not(.no-example)"));
      if (items.length <= PAGE_SIZE) return;

      let visible = PAGE_SIZE;
      const more = document.createElement("button");
      const render = () => {
        items.forEach((item, index) => {
          item.hidden = index >= visible;
        });
        more.textContent = `さらに表示（残り${Math.max(0, items.length - visible)}件）`;
        more.hidden = visible >= items.length;
      };

      more.type = "button";
      more.className = "secondary dosukoi-more";
      more.addEventListener("click", () => {
        visible += PAGE_SIZE;
        render();
      });
      examples.insertBefore(more, examples.querySelector(".judge-note"));
      render();
    };

    const enhanceStaticPage = () => {
      const page = document.querySelector<HTMLElement>(".dosukoi-page");
      if (!page) return false;

      const logo = page.querySelector<HTMLElement>(".game-header .mini-logo");
      if (logo && logo.dataset.versionBadge !== "true") {
        logo.dataset.versionBadge = "true";
        logo.classList.add("dosukoi-version-badge");
        logo.textContent = APP_VERSION;
        logo.setAttribute("aria-label", `アプリバージョン ${APP_VERSION}`);
        logo.removeAttribute("aria-hidden");
      }

      const toggle = Array.from(page.querySelectorAll<HTMLButtonElement>("button.secondary")).find(button =>
        button.textContent?.includes("答えの例"),
      );
      if (toggle && toggle.textContent?.includes("最大5個")) {
        toggle.textContent = toggle.textContent.replace("最大5個", "30件ずつ");
      }

      const startButton = page.querySelector<HTMLButtonElement>(".dosukoi-next");
      if (startButton && !page.querySelector(".dosukoi-timer-card")) {
        const savedMinutes = Math.min(10, Math.max(1, Number(localStorage.getItem(TIMER_STORAGE_KEY)) || 2));
        remaining = savedMinutes * 60;

        const timerCard = document.createElement("section");
        timerCard.className = "dosukoi-timer-card";
        timerCard.setAttribute("aria-label", "制限時間");
        timerCard.innerHTML = `
          <div class="timer-ring" role="timer" aria-live="polite">
            <div class="timer-ring-inner">
              <span>残り時間</span>
              <strong>${formatTime(remaining)}</strong>
            </div>
          </div>
          <div class="timer-controls">
            <label>
              <span>制限時間</span>
              <select class="dosukoi-duration" aria-label="制限時間">
                ${[1, 2, 3, 4, 5, 10].map(value => `<option value="${value}"${value === savedMinutes ? " selected" : ""}>${value}分</option>`).join("")}
              </select>
            </label>
            <div class="timer-actions">
              <button type="button" class="timer-pause">▶ 再開</button>
              <button type="button" class="timer-reset">↻ リセット</button>
            </div>
          </div>`;
        startButton.before(timerCard);

        const ring = timerCard.querySelector<HTMLElement>(".timer-ring");
        const timeText = timerCard.querySelector<HTMLElement>(".timer-ring strong");
        const duration = timerCard.querySelector<HTMLSelectElement>(".dosukoi-duration");
        const pause = timerCard.querySelector<HTMLButtonElement>(".timer-pause");
        const reset = timerCard.querySelector<HTMLButtonElement>(".timer-reset");

        const updateTimer = () => {
          if (!timeText || !ring || !duration || !pause) return;
          const total = Number(duration.value) * 60;
          const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
          timeText.textContent = formatTime(remaining);
          ring.style.setProperty("--timer-progress", `${progress * 360}deg`);
          ring.classList.toggle("is-low", remaining > 0 && remaining <= 15);
          ring.classList.toggle("is-finished", remaining === 0);
          pause.textContent = running ? "Ⅱ 一時停止" : "▶ 再開";
          pause.disabled = remaining === 0;
        };

        const beginTimer = () => {
          stopTimer();
          running = true;
          timerId = window.setInterval(() => {
            remaining = Math.max(0, remaining - 1);
            if (remaining === 0) {
              stopTimer();
              try {
                navigator.vibrate?.([160, 80, 260]);
              } catch {
                // Vibration is optional.
              }
            }
            updateTimer();
          }, 1000);
          updateTimer();
        };

        duration?.addEventListener("change", () => {
          stopTimer();
          const minutes = Number(duration.value);
          localStorage.setItem(TIMER_STORAGE_KEY, String(minutes));
          remaining = minutes * 60;
          updateTimer();
        });
        pause?.addEventListener("click", () => {
          if (running) stopTimer();
          else beginTimer();
          updateTimer();
        });
        reset?.addEventListener("click", () => {
          stopTimer();
          remaining = Number(duration?.value || 2) * 60;
          updateTimer();
        });
        startButton.addEventListener("click", () => {
          remaining = Number(duration?.value || 2) * 60;
          window.setTimeout(beginTimer, 1000);
          updateTimer();
        });
        updateTimer();
      }

      enhanceExamples(page);
      return true;
    };

    const scheduleEnhance = () => {
      window.requestAnimationFrame(() => {
        enhanceStaticPage();
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".dosukoi-page")) return;
      scheduleEnhance();
      window.setTimeout(scheduleEnhance, 30);
    };

    const retryUntilReady = () => {
      if (enhanceStaticPage()) return;
      retryId = window.setTimeout(retryUntilReady, 100);
    };

    document.addEventListener("click", handleClick, true);
    retryUntilReady();

    return () => {
      stopTimer();
      if (retryId !== null) window.clearTimeout(retryId);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
