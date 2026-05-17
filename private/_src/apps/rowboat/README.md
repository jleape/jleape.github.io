# ROWboat — Right-of-Way Planner (demo branch)

Client-only, browser-deployable build of the ROWboat prototype. The full app
lives on `main` (FastAPI backend + React frontend); this branch strips the
backend out and ports the Monte-Carlo simulator to TypeScript so the whole
thing runs in the user's browser.

## What's in the demo

- Bold dark map UI with the synthetic Voronoi parcel corridor pre-loaded.
- Auto-routed alignment respecting a minimum radius of curvature.
- Click-to-place destination markers; the alignment recomputes live.
- `Learn ROW policy` → in-browser Monte-Carlo simulator (50 rollouts in a
  Web Worker so the UI stays responsive). Returns the same cost/time
  distributions + per-event scenario timeline as the backend version.
- Scenario scrubber with autoplay, rowboat that follows the obtained-ROW
  prefix of the alignment, fishing-line + fish-catch animations on engage /
  acquire / expropriate.

## What's stripped vs `main`

- Backend (`backend/`, `docker-compose.yml`, `shared/`) — deleted.
- Project file menu (Open / Save / New / Examples) — deleted.
- Parcel editing dialog — deleted.
- Real-corridor examples (CA HSR, MVP, Phoenix transmission) — deleted.

## Local dev

```bash
cd frontend
npm install
npm run dev   # http://localhost:5273
```

## Production build

```bash
npm run build
```

`vite.config.ts` sets `base: '/ROWboat/'` for production. The bundle expects
to be served from a subdirectory of that name. Copy `dist/` into a `ROWboat/`
folder of your GitHub Pages repo and it should serve at
`<your-pages-host>/ROWboat/`.
