#!/usr/bin/env python3
"""Extract the Rally prototype into a Vite-friendly project.

Reads the source rally.html (a Babel-in-browser prototype with CDN Tailwind)
and emits:
  - src/styles.css  <- inline <style> block, prepended with `@import "tailwindcss";`
                      so Tailwind v4 scans the JSX for classes
  - src/App.jsx     <- the <script type="text/babel"> body, with:
                         * `const { useState, ... } = React;`  ->  ES imports
                         * trailing ReactDOM.createRoot(...)   ->  export default App
                         * `import React from "react";` prepended so React.X still works
"""
import re
import sys
from pathlib import Path

if len(sys.argv) != 3:
    sys.exit("usage: extract.py <rally.html> <project-dir>")

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
html = src.read_text(encoding="utf-8")

style_match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
if not style_match:
    sys.exit("no <style> block found")
css = style_match.group(1).strip()

script_match = re.search(
    r'<script type="text/babel"[^>]*>(.*?)</script>', html, re.DOTALL
)
if not script_match:
    sys.exit("no <script type=\"text/babel\"> block found")
jsx = script_match.group(1)

# Convert the CDN rebind into real ES imports.
jsx, n_rebind = re.subn(
    r"const \{\s*(?P<hooks>[^}]*?)\s*\} = React;\s*",
    lambda m: f'import React, {{ {m.group("hooks").strip()} }} from "react";\n',
    jsx,
    count=1,
)
if n_rebind == 0:
    sys.exit("could not find `const { ... } = React;` rebind block")

# Replace the trailing render call with an export.
jsx, n_render = re.subn(
    r"ReactDOM\.createRoot\(document\.getElementById\('root'\)\)\.render\(<App\s*/>\);?",
    "export default App;",
    jsx,
)
if n_render == 0:
    sys.exit("could not find trailing ReactDOM.createRoot render call")

jsx = (
    "/* Extracted from Claude Design prototype — see scripts/extract.py */\n"
    + jsx.lstrip()
)

(dst / "src").mkdir(parents=True, exist_ok=True)
(dst / "src" / "styles.css").write_text(
    '@import "tailwindcss";\n\n' + css + "\n", encoding="utf-8"
)
(dst / "src" / "App.jsx").write_text(jsx, encoding="utf-8")

print(f"wrote {dst / 'src' / 'styles.css'} ({len(css)} chars + tailwind import)")
print(f"wrote {dst / 'src' / 'App.jsx'} ({len(jsx)} chars)")
