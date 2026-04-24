#!/usr/bin/env python3
"""Repair double-encoded UTF-8 (mojibake) in a text file in place.

The pasted gambiarra.jsx has sequences like "AtenÃ§Ã£o" where the original
"Atenção" was decoded as Latin-1 and re-encoded as UTF-8. We reverse that
only for runs of Latin-1 range chars (U+0080-U+00FF), so legitimate non-ASCII
like "→" (U+2192) is left alone.
"""
import re
import sys

if len(sys.argv) != 2:
    sys.exit("usage: fix-mojibake.py <file>")

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    text = f.read()


def _fix(match):
    s = match.group(0)
    try:
        return s.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s


fixed = re.sub(r"[-ÿ]+", _fix, text)
with open(path, "w", encoding="utf-8") as f:
    f.write(fixed)

print(f"ok: {path}")
