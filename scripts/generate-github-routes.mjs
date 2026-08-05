import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const routes = [
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
];

const docsDir = "docs";
const sourceIndex = join(docsDir, "index.html");
const html = await readFile(sourceIndex, "utf8");

for (const route of routes) {
  const routeDir = join(docsDir, route);
  await mkdir(routeDir, { recursive: true });
  await writeFile(join(routeDir, "index.html"), html, "utf8");
}

await copyFile(sourceIndex, join(docsDir, "404.html"));
console.log(`Generated ${routes.length} GitHub Pages routes.`);
