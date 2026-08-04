"use client";

import { useEffect } from "react";

const BROKEN_HASHES = new Set(["#five-second", "#five-seconds"]);

function getCleanUrl(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function resetBrokenRoute(): void {
  if (!BROKEN_HASHES.has(window.location.hash.toLowerCase())) return;

  // replaceState only changes the URL and leaves the currently opened game in
  // React state. A full replace resets the app to its lobby initial state.
  window.location.replace(getCleanUrl());
}

export default function HashGuard() {
  useEffect(() => {
    resetBrokenRoute();

    const onHashChange = () => resetBrokenRoute();
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href")?.trim().toLowerCase();
      if (!href || !BROKEN_HASHES.has(href)) return;

      event.preventDefault();
      window.location.replace(getCleanUrl());
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
