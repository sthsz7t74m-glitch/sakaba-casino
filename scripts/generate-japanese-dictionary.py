#!/usr/bin/env python3
"""Generate a balanced TypeScript dictionary from EDRDG EDICT2.

The whole source is scanned first, then entries are selected evenly across
(initial kana, reading length) buckets. This prevents later kana such as ら/り/る
from disappearing because of a global early cut-off.
"""
from __future__ import annotations

import gzip
import io
import json
import re
import sys
import urllib.request
from collections import defaultdict, deque
from pathlib import Path

SOURCE_URL = "https://ftp.edrdg.org/pub/Nihongo/edict2.gz"
OUTPUT = Path("app/word-data-jmdict.generated.ts")
MIN_LENGTH = 3
MAX_LENGTH = 20
MAX_ENTRIES = 120000
MIN_EXPECTED_ENTRIES = 50000

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
    return re.sub(r"\([^)]*\)$", "", text).strip()


def valid_reading(reading: str) -> bool:
    return MIN_LENGTH <= len(reading) <= MAX_LENGTH and bool(re.fullmatch(r"[ぁ-ゖー]+", reading))


def parse_line(line: str) -> tuple[str, str] | None:
    # EDICT2 appends an /EntL.../ identifier to normal dictionary entries.
    # Do not filter on EntL: doing so discards the entire dictionary.
    if not line or line.startswith("　") or line.startswith("EDICT2"):
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


def choose_balanced(entries: set[tuple[str, str]]) -> list[tuple[str, str]]:
    buckets: dict[tuple[str, int], deque[tuple[str, str]]] = defaultdict(deque)
    for surface, reading in sorted(entries, key=lambda item: (item[1][0], len(item[1]), item[1], item[0])):
        buckets[(reading[0], len(reading))].append((surface, reading))

    selected: list[tuple[str, str]] = []
    active = deque(sorted(buckets))
    while active and len(selected) < MAX_ENTRIES:
        key = active.popleft()
        bucket = buckets[key]
        if bucket:
            selected.append(bucket.popleft())
        if bucket:
            active.append(key)
    return sorted(selected, key=lambda item: (len(item[1]), item[1], item[0]))


def main() -> int:
    request = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "sakaba-casino-dictionary-builder/3.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        compressed = response.read()

    entries: set[tuple[str, str]] = set()
    with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as archive:
        for raw in archive:
            parsed = parse_line(raw.decode("euc-jp", errors="ignore").strip())
            if parsed is not None:
                entries.add(parsed)

    if len(entries) < MIN_EXPECTED_ENTRIES:
        raise RuntimeError(
            f"Dictionary parsing produced only {len(entries)} entries; expected at least {MIN_EXPECTED_ENTRIES}"
        )

    rows = choose_balanced(entries)
    counts: dict[tuple[str, int], int] = defaultdict(int)
    for _, reading in rows:
        counts[(reading[0], len(reading))] += 1

    required_minimums = {
        ("ら", 4): 10,
        ("ば", 3): 10,
        ("ば", 4): 10,
        ("あ", 4): 10,
        ("か", 5): 10,
    }
    insufficient = [
        f"{kana}:{length}={counts[(kana, length)]}"
        for (kana, length), minimum in required_minimums.items()
        if counts[(kana, length)] < minimum
    ]
    if insufficient:
        raise RuntimeError(f"Dictionary bucket validation failed: {', '.join(insufficient)}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as file:
        file.write("// Auto-generated from EDRDG EDICT2. Do not edit manually.\n")
        file.write("export type JmdictWordTuple = readonly [surface: string, reading: string, proper?: boolean];\n")
        file.write("export const jmdictWordTuples: JmdictWordTuple[] = [\n")
        for surface, reading in rows:
            file.write(f"  [{json.dumps(surface, ensure_ascii=False)},{json.dumps(reading, ensure_ascii=False)}],\n")
        file.write("];\n")

    print(f"Scanned {len(entries)} unique entries; generated {len(rows)} balanced entries")
    for kana, length in required_minimums:
        print(f"bucket {kana}/{length}={counts[(kana, length)]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
