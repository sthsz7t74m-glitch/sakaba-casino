"use client";

import { useEffect } from "react";

const PAGE_SIZE = 30;

export default function DosukoiExamplesEnhancer() {
  useEffect(() => {
    const enhance = () => {
      const page = document.querySelector(".dosukoi-page");
      if (!page) return;

      const toggle = Array.from(page.querySelectorAll("button.secondary")).find(button =>
        button.textContent?.includes("答えの例"),
      );
      if (toggle && toggle.textContent?.includes("最大5個")) {
        toggle.textContent = toggle.textContent.replace("最大5個", "30件ずつ");
      }

      const examples = page.querySelector<HTMLElement>(".examples");
      if (!examples || examples.dataset.enhanced === "true") return;
      examples.dataset.enhanced = "true";

      const items = Array.from(examples.querySelectorAll<HTMLElement>(":scope > span:not(.no-example)"));
      if (items.length <= PAGE_SIZE) return;

      let visible = PAGE_SIZE;
      const render = () => {
        items.forEach((item, index) => { item.hidden = index >= visible; });
        more.textContent = `さらに表示（残り${Math.max(0, items.length - visible)}件）`;
        more.hidden = visible >= items.length;
      };

      const more = document.createElement("button");
      more.type = "button";
      more.className = "secondary dosukoi-more";
      more.addEventListener("click", () => {
        visible += PAGE_SIZE;
        render();
      });
      examples.insertBefore(more, examples.querySelector(".judge-note"));
      render();
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
