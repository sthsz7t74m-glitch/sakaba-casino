import fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const versionSource = fs.readFileSync("app/version.ts", "utf8");
const githubEntry = fs.readFileSync("github-main.tsx", "utf8");
const partyEnhancer = fs.readFileSync("app/PartyGameEnhancer.tsx", "utf8");

const expected = `v${packageJson.version}`;

if (!versionSource.includes(`APP_VERSION = "${expected}"`)) {
  throw new Error(`app/version.ts must export ${expected}`);
}

for (const [fileName, source] of [
  ["github-main.tsx", githubEntry],
  ["app/PartyGameEnhancer.tsx", partyEnhancer],
]) {
  if (/const\s+APP_VERSION\s*=\s*["']v\d+\.\d+\.\d+["']/.test(source)) {
    throw new Error(`${fileName} contains a hard-coded app version`);
  }
}

if (!partyEnhancer.includes('from "./version"') || !partyEnhancer.includes("APP_VERSION")) {
  throw new Error("app/PartyGameEnhancer.tsx must use the shared APP_VERSION export");
}

console.log(`Version consistency verified: ${expected}`);
