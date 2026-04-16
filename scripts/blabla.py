#!/usr/bin/env python3
"""Simple processor mock.

Usage:
  python scripts/blabla.py <csv-file-name>

Behavior:
- Exits with error if the CSV filename contains the word "error".
- Otherwise writes three placeholder PNG files into public/results using:
  <base>1-<token>.png, <base>2-<token>.png, <base>3-<token>.png
  where CSV filename format is <base>-<token>.csv
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/blabla.py <csv-file-name>", file=sys.stderr)
        return 1

    csv_name = sys.argv[1]
    if "error" in csv_name.lower():
        print("Simulated processor error for testing", file=sys.stderr)
        return 2

    root = Path(__file__).resolve().parent.parent
    results_dir = root / "public" / "results"
    results_dir.mkdir(parents=True, exist_ok=True)

    stem = Path(csv_name).stem
    match = re.match(r"^(.*)-(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})$", stem)
    if not match:
        print("CSV file name does not contain expected token", file=sys.stderr)
        return 3

    base = match.group(1)
    token = match.group(2)

    # Minimal valid PNG payload (1x1 transparent pixel).
    png_bytes = (
        b"\x89PNG\r\n\x1a\n"
        b"\x00\x00\x00\rIHDR"
        b"\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
        b"\x00\x00\x00\x0bIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
        b"\x0d\x0a\x2d\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    for index in (1, 2, 3):
        file_name = f"{base}{index}-{token}.png"
        (results_dir / file_name).write_bytes(png_bytes)

    print("Processing completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
