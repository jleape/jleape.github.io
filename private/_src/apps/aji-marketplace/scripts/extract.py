#!/usr/bin/env python3
"""Extract Aji Exchange (marketplace) prototype into a Vite-friendly project.

Reads marketplace.html (for its inline <style>) and marketplace-app.jsx (the
4800-line app body), produces:
  - src/styles.css  <- inline <style> from marketplace.html
  - src/App.jsx     <- marketplace-app.jsx with CDN rebinds replaced by ES imports,
                       trailing ReactDOM.createRoot(...) replaced by `export default App`
"""
import re
import sys
from pathlib import Path

if len(sys.argv) != 4:
    sys.exit("usage: extract.py <marketplace.html> <marketplace-app.jsx> <project-dir>")

html_src = Path(sys.argv[1])
jsx_src = Path(sys.argv[2])
dst = Path(sys.argv[3])

html = html_src.read_text(encoding="utf-8")
jsx = jsx_src.read_text(encoding="utf-8")

style_match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
if not style_match:
    sys.exit("no <style> block found in marketplace.html")
css = style_match.group(1).strip()

# Replace the CDN "Rebind" block with proper ES imports. The original block is:
#
#   /* Rebind React + libs from CDN globals */
#   const { useState, useEffect, useMemo, useRef, useCallback } = React;
#   const { LineChart, Line, ... } = Recharts;
#   const L = window.lucide || window.LucideReact || {};
#   const { ArrowRight, ... } = L;
#
# We replace from the comment down through the lucide destructure.
rebind_re = re.compile(
    r"/\* Rebind React \+ libs from CDN globals \*/\s*"
    r"const \{(?P<react_hooks>[^}]*)\} = React;\s*"
    r"const \{(?P<recharts>[^}]*)\} = Recharts;\s*"
    r"const L = window\.lucide \|\| window\.LucideReact \|\| \{\};\s*"
    r"const \{(?P<lucide>[^}]*)\} = L;",
    re.DOTALL,
)
match = rebind_re.search(jsx)
if not match:
    sys.exit("could not find CDN rebind block in marketplace-app.jsx")

imports = (
    "/* Extracted from Claude Design prototype — see scripts/extract.py */\n"
    f"import React, {{ {match.group('react_hooks').strip()} }} from \"react\";\n"
    f"import {{ {match.group('recharts').strip()} }} from \"recharts\";\n"
    f"import {{ {match.group('lucide').strip()} }} from \"lucide-react\";\n"
)
jsx = rebind_re.sub("", jsx, count=1)
jsx = imports + jsx.lstrip()

# Replace the trailing render with an export.
jsx = re.sub(
    r"ReactDOM\.createRoot\(document\.getElementById\('root'\)\)\.render\(React\.createElement\(App\)\);?",
    "export default App;",
    jsx,
)

(dst / "src").mkdir(parents=True, exist_ok=True)
(dst / "src" / "styles.css").write_text(css + "\n", encoding="utf-8")
(dst / "src" / "App.jsx").write_text(jsx, encoding="utf-8")

print(f"wrote {dst / 'src' / 'styles.css'} ({len(css)} chars)")
print(f"wrote {dst / 'src' / 'App.jsx'} ({len(jsx)} chars)")
