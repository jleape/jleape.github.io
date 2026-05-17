# ROWboat — Feature plan (next iteration)

Three threads, presented as concrete schema + state-machine additions so each can ship independently.

## 1. Negotiation realism: easements, multi-round bargaining, neighbor effects

These three are deeply coupled — they share the same parcel state machine
extensions, so plan them together but ship them in this order:

### A. Easements (request before fee acquisition)

**Why:** Pipeline / transmission / fiber ROW is almost always *easement* in
practice (IRWA Pipeline Easement Valuation, Nov/Dec 2014). The developer
keeps a strip-of-use right but the owner keeps the fee. Easements settle
faster and at a fraction (40–70%) of fee value, materially changing the
project-cost curve.

**Schema additions (per parcel):**
```ts
acquisitionMode: 'fee' | 'easement-then-fee' | 'easement-only';
easementCost:    number;   // typical: 0.4–0.7 × landCost
easementProbability: number; // typically > acquisitionProbability
```

**State machine:**
```
not_engaged ─(engage as easement)─► engaged_easement
                                       ├─offer─► acquired_easement       (cheap, done)
                                       └─refuse─► (try to BUY THE PARCEL or abandon?)
                                                    ├─escalate ─► engaged_fee  (fee = full
                                                    │                           purchase
                                                    │                           of parcel)
                                                    └─abandon  ─► blocked
engaged_fee  ─(same as today's path)─► acquired / expropriated / blocked
```
"Escalate to fee" = on easement refusal, try to **buy the parcel outright**
(full ownership transfer) instead. Different ask, different price (higher),
different conversation. If the full-purchase ask is also refused, fall back
to the existing expropriate-or-reroute decision.

**MVP heuristic:** always request easement first; on refusal, escalate to fee
once before abandoning. Single per-project boolean `preferEasement` lets the
user disable.

**Cost model:** easementCost replaces landCost in path-weighting when the
parcel's mode is easement. Expropriation can take an easement OR fee.

### B. Multi-round negotiation

**Why:** Rubinstein-style bargaining with discounting matches the data better
than single-shot accept/refuse. Most real ROW deals converge in 2–4 rounds.

**Schema additions (per parcel, sampled per scenario):**
```ts
reservationPrice: number;  // hidden; owner's true minimum (Normal(landCost × 1.2, σ))
flexibility:      number;  // [0, 1]; concession per round
```

**Round mechanics (per parcel, on offer arrival):**
```
round = 0
buyerPrice = landCost
while round < maxRounds:
    if buyerPrice >= reservationPrice:  accept at buyerPrice → ACQUIRED
    counter = buyerPrice + (reservationPrice - buyerPrice) × (1 - flexibility × round)
    decision (agent):
        - accept counter        → ACQUIRED at counter
        - counter-counter       → buyerPrice ← (buyerPrice + counter) / 2; pay round-cost; round++
        - walk away             → REFUSED  → (expropriate | block)
```

**Cost per round:** `X1 × roundDays` (default `roundDays = 7`). Project clock
advances by `roundDays` per round.

**MVP agent heuristic:** accept counter iff `counter <= 1.15 × landCost AND
counter < expropriationCost`. Otherwise counter once at midpoint; on second
refusal, walk away.

### C. Neighbor effects (spillover + holdout escalation)

**Why:** Owners learn from neighbors' deals. Anchoring on consented prices,
and the holdout effect when prior parcels are locked in (Menezes & Pitchford
2004; Miceli & Segerson 2007).

**Two mechanisms:**

1. **Spillover** — every settled parcel nudges its neighbors' reservation
   prices toward the settled price:
   ```
   for n in neighbors(closedParcel):
       n.reservationPrice += spilloverCoeff × (closedParcel.settlementPrice − n.priorAnchor)
   ```
   Refused parcels nudge neighbors *up* (signal that holdouts can extract).

2. **Holdout escalation** — global multiplier on `reservationPrice` grows as
   the fraction of corridor already acquired rises:
   ```
   effective_reservation = base_reservation × (1 + escalationCoeff × k/N)
   ```
   where `k` = already-locked parcels, `N` = total path parcels. Sealed-bid
   alternative: bake into per-parcel `acquisitionProbability` decreasing as
   `k/N` rises.

**Schema:**
```ts
// project setting
spilloverCoeff:   number;  // default 0.1
escalationCoeff:  number;  // default 0.2
```

**Why this lands hardest after easement + multi-round:** Neighbor effects
make *order of engagement* strategically meaningful for the first time. A
learned policy would discover sequencing (anchors first, marginal parcels
last) instead of treating engagement order as random.

---

## 2. Literature-grounded realism additions

Four further mechanisms, ranked by ratio of behavioural impact to
implementation cost.

### Partial takings + severance damages (cheap, big effect)

Lee & Plassmann (Columbia Law Review); Plassmann & Tideman (SSRN 1911278).

**Severance damages explained.** ROW typically takes only a *strip* of each
parcel — say a 30 m wide band — not the whole parcel. The owner keeps the
rest. But the leftover land is worth less than before the take: it may now
be divided in two, has access/easement encumbrances, can't be built on the
strip, and loses "highest and best use". The diminution-in-remainder-value
is **severance damages**, paid to the same owner alongside the strip price.

Total compensation per parcel = `stripCost` + `severanceDamage`. This is one
transaction with one owner, not two parcels. Severance is what makes urban
residential ROW catastrophically expensive vs rural ag — a strip through a
residential lot can damage 5–10× the strip's own value.

**Schema additions:**
```ts
stripWidthM:       number;   // project-level, e.g., 30m for pipeline, 60m for highway
severanceMultiplier: number; // per-parcel; urban res ~1.5, rural ag ~1.1
```

**Implementation:** decompose `landCost = stripCost + severanceDamage`. Today's
`landCost` becomes `stripCost` (~`stripFraction × parcelArea × $/ha`) plus a
multiplicative severance term on the remainder fraction. Total
compensation roughly preserved at default settings; calibration becomes
much closer to actual project budgets.

### Quick-take vs standard condemnation

The eminent-domain literature is unanimous: in jurisdictions allowing
quick-take, possession is granted in 30–60 days upon deposit; final
compensation is litigated *in parallel* with construction. Today our
`expropriate` action serializes (X5 = 1095 days), which is right for some
states / project types and wrong for others.

**Schema additions:**
```ts
quickTakeAvailable:    boolean;       // per project (jurisdiction-dependent)
quickTakeDeposit:      'landCost' | 'appraised';
quickTakePossessionDays: number;      // ~45
quickTakeFinalAwardDays: number;      // ~540
quickTakeVerdictMultiplier: number;   // verdict draw, ~1.1× of deposit on average
```

**Implementation:** add a third refusal-action `quickTake`. Cash flow split:
deposit at +45 days (unlocks construction), final verdict at +540 days
(may add to total cost stochastically). The agent's decision rule gets a
new candidate cost.

### Holdout escalation (covered above under §1.C)

Same mechanism — listed here for completeness, since it's the
literature-canonical name for the neighbor mechanism.

### Real-options / option-to-delay engagement

Powell's ADP framework. When uncertainty about routing/permits is high, the
optimal policy holds engagement budget in reserve. Today the agent burns
the entire budget at t=0 (within `maxConcurrentEngagements`).

**Implementation:** add a `delay` action — costs zero but yields no progress.
Mostly interesting once we ship a learned policy (the current FIFO
baseline can't exploit it).

---

## 3. Real-world dataset integration

Three concrete starter datasets, all free, with parcel polygons that fit
the schema. Bundle one as an alternative to the synthetic-Voronoi corridor.

### Shortlist (in order of integration ease)

**A. Travis County, TX (TCAD) + HIFLD transmission lines or TxDOT corridor**
- Parcels: https://gis.traviscountytx.gov/server1/rest/services/Boundaries_and_Jurisdictions/TCAD_public/MapServer/0
- Transmission lines: https://hifld-geoplatform.hub.arcgis.com/
- TxDOT corridors / ROW: https://gis-txdot.opendata.arcgis.com/
- Per-parcel: `py_owner_name`, `situs`, `parcel_area`, `appraised_value`.
- Format: ArcGIS REST → `?f=geojson` paged fetch. No auth.
- License: public domain.

**B. Riverside County, CA + California HSR Statewide Alignment**
- Parcels: https://gisopendata-countyofriverside.opendata.arcgis.com/ (also
  bulk via https://gis.rivco.org/pages/data-distribution)
- Alignment: https://gis.data.ca.gov/datasets/california-high-speed-rail-statewide-alignments/about
- Highest profile real "corridor problem"; HSR has acquired ~10k parcels
  publicly documented.
- Riverside parcel fields include APN, owner, assessed value.

**C. OpenAddresses parcel slice + EIA Natural Gas Pipelines**
- Parcels: https://github.com/openaddresses/openaddresses/wiki/Parcel-Sources
  (~58M parcels across 174 sources, geometry + APN, mostly no owner)
- Pipelines: https://atlas.eia.gov/datasets/4a158d2113f145039f71b80d07e2c19c
- Fully open; lightest on attributes (we'd synthesize `acquisitionProbability`
  and `landCost` from geometry + APN proxies).

### Integration design

1. **Sidebar "Load dataset" panel** with three options: synthetic / Travis
   County / Riverside County. Static-bundled for sample size; later, an
   ArcGIS REST URL input lets the user paste any tile.

2. **Adapter layer** — per-county field mapping translates source attributes
   into our `ParcelProperties`. Missing fields synthesized from heuristics:
   - `acquisitionProbability` = sigmoid of (assessed-value / parcel-area) —
     more valuable land in pricier zip codes correlates with higher
     refusal rates in practice (anchoring effect).
   - `landCost` = appraised value (Travis) or assessed × 1.5 (Riverside).
   - `expropriationCost` = `landCost × multiplier(jurisdiction)`.
   - `unitConstructionCost` from project type (fixed default, editable).

3. **Polygon ingest** — bounding-box fetch around the user's two destination
   points, plus a buffer. Streams as a single FeatureCollection into the
   parcels store.

4. **Out-of-scope for now**: real ownership-history APIs (Regrid) — commercial
   tiers required. Note in `UPGRADES.md`.

### Concrete starter dataset for v0.2

Bundle Travis County parcels intersecting the proposed SH-130 toll road
corridor (Austin-area, ~30 km, ~200 parcels with strong rural-suburban mix).
Single zipped GeoJSON, ~3 MB. Backed-up by HIFLD transmission lines so the
linear alignment is real.

---

## Suggested implementation order

1. **Easements** (§1.A) — most user-facing impact, smallest schema delta.
2. **Partial takings** (§2) — cheap calibration win.
3. **Neighbor effects** (§1.C) — unlocks strategic ordering for the learned policy.
4. **Real-world dataset adapter** (§3) — Travis County bundle.
5. **Quick-take action** (§2).
6. **Multi-round negotiation** (§1.B) — most invasive, save for last.
7. **Delay action + RL agent** — first learned policy uses the now-rich env.
