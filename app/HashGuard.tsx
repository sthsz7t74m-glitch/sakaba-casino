"use client";

import { useEffect } from "react";

const BROKEN_HASHES = new Set(["#five-second", "#five-seconds"]);

function clearBrokenHash(): void {
  if (!BROKEN_HASHES.has(window.location.hash.toLowerCase())) return;
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
}

export default function HashGuard() {
  useEffect(() => {
    clearBrokenHash();

    const onHashChange = () => clearBrokenHash();
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href")?.trim().toLowerCase();
      if (!href || !BROKEN_HASHES.has(href)) return;

      event.preventDefault();
      clearBrokenHash();
    };

    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
