#!/usr/bin/env python3
"""Extract Aji prototype (HTML/CSS + Babel-in-browser JSX) into a Vite-friendly project.

Reads the source index.html (the Claude Design prototype), pulls out:
  - inline <style> → src/styles.css
  - inline <script type="text/babel"> → src/App.jsx (rewired for Vite)

Rewiring:
  - drops the tweaks-panel.jsx block entirely (user opted out of dev tweaks)
  - drops the AjiTweaks component + its <AjiTweaks/> usage in <App/>
  - replaces `ReactDOM.createRoot(...).render(<App/>)` with `export default App`
  - prepends `import React from "react"` so React.useState & friends resolve
"""
import re
import sys
from pathlib import Path

if len(sys.argv) != 3:
    sys.exit("usage: extract.py <source-index.html> <project-dir>")

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
html = src.read_text(encoding="utf-8")

# --- CSS ----------------------------------------------------------------
style_match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
if not style_match:
    sys.exit("no <style> block found")
css = style_match.group(1).strip()

# --- JSX ----------------------------------------------------------------
script_match = re.search(
    r'<script type="text/babel">(.*?)</script>', html, re.DOTALL
)
if not script_match:
    sys.exit("no <script type=\"text/babel\"> block found")
jsx = script_match.group(1)

# Drop the entire tweaks-panel.jsx section: from its marker up to (but not
# including) the next "// === <file>.jsx ===" marker.
jsx = re.sub(
    r"// === tweaks-panel\.jsx ===.*?(?=^// === [^=]+ ===)",
    "",
    jsx,
    count=1,
    flags=re.DOTALL | re.MULTILINE,
)

# Drop the AjiTweaks component definition in app.jsx.
jsx = re.sub(
    r"/\* Mini tweaks panel \*/\s*const AjiTweaks = \(\) => \{.*?\n\};\n",
    "",
    jsx,
    count=1,
    flags=re.DOTALL,
)

# Drop the <AjiTweaks/> render inside <App/>.
jsx = re.sub(r"^\s*<AjiTweaks/>\s*\n", "", jsx, flags=re.MULTILINE)

# Replace the ReactDOM mount with an export for main.jsx to render.
jsx = re.sub(
    r"ReactDOM\.createRoot\(document\.getElementById\('root'\)\)\.render\(<App\s*/>\);?",
    "export default App;",
    jsx,
)

header = (
    '/* Extracted from Claude Design prototype — see scripts/extract.py */\n'
    'import React from "react";\n'
    '\n'
)
jsx = header + jsx.lstrip()

# --- Write --------------------------------------------------------------
(dst / "src").mkdir(parents=True, exist_ok=True)
(dst / "src" / "styles.css").write_text(css + "\n", encoding="utf-8")
(dst / "src" / "App.jsx").write_text(jsx, encoding="utf-8")

print(f"wrote {dst / 'src' / 'styles.css'} ({len(css)} chars)")
print(f"wrote {dst / 'src' / 'App.jsx'} ({len(jsx)} chars)")
