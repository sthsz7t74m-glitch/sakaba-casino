#!/usr/bin/env python3
"""Generate a compact TypeScript dictionary from EDRDG EDICT2.

Source: Electronic Dictionary Research and Development Group (EDRDG)
https://www.edrdg.org/
The generated data is filtered to readings of 3-20 Japanese characters.
"""
from __future__ import annotations

import gzip
import re
import sys
import urllib.request
from pathlib import Path

SOURCE_URL = "https://ftp.edrdg.org/pub/Nihongo/edict2.gz"
OUTPUT = Path("app/word-data-jmdict.generated.ts")
MIN_LENGTH = 3
MAX_LENGTH = 20
MAX_ENTRIES = 80000

KATAKANA_START = ord("ァ")
KATAKANA_END = ord("ヶ")
HIRAGANA_OFFSET = ord("ぁ") - KATAKANA_START


def to_hiragana(text: str) -> str:
    chars: list[str] = []
    for char in text:
        code = ord(char)
        if KATAKANA_START <= code <= KATAKANA_END:
            chars.append(chr(code + HIRAGANA_OFFSET))
        else:
            chars.append(char)
    return "".join(chars)


def clean_surface(text: str) -> str:
    text = re.sub(r"\([^)]*\)$", "", text).strip()
    return text


def valid_reading(reading: str) -> bool:
    if not MIN_LENGTH <= len(reading) <= MAX_LENGTH:
        return False
    return bool(re.fullmatch(r"[ぁ-ゖー]+", reading))


def parse_line(line: str) -> tuple[str, str] | None:
    if line.startswith("　") or "/EntL" in line:
        return None
    head = line.split(" /", 1)[0].strip()
    match = re.match(r"^(.*?)\s+\[([^]]+)\]$", head)
    if match:
        surface_part, reading = match.groups()
        surface = clean_surface(surface_part.split(";")[0])
    else:
        surface = clean_surface(head.split(";")[0])
        reading = surface
    reading = to_hiragana(reading.strip())
    if not surface or not valid_reading(reading):
        return None
    if any(char in surface for char in "[]/{}"):
        return None
    return surface, reading


def main() -> int:
    request = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "sakaba-casino-dictionary-builder/1.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        compressed = response.read()

    entries: dict[tuple[str, str], None] = {}
    with gzip.GzipFile(fileobj=__import__("io").BytesIO(compressed)) as archive:
        for raw in archive:
            line = raw.decode("euc-jp", errors="ignore").strip()
            parsed = parse_line(line)
            if parsed is None:
                continue
            entries.setdefault(parsed, None)
            if len(entries) >= MAX_ENTRIES:
                break

    rows = sorted(entries.keys(), key=lambda item: (len(item[1]), item[1], item[0]))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as file:
        file.write("// Auto-generated from EDRDG EDICT2. Do not edit manually.\n")
        file.write("export type JmdictWordTuple = readonly [surface: string, reading: string, proper?: boolean];\n")
        file.write("export const jmdictWordTuples: JmdictWordTuple[] = [\n")
        for surface, reading in rows:
            surface_json = __import__("json").dumps(surface, ensure_ascii=False)
            reading_json = __import__("json").dumps(reading, ensure_ascii=False)
            file.write(f"  [{surface_json},{reading_json}],\n")
        file.write("];\n")

    print(f"Generated {len(rows)} dictionary entries at {OUTPUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
