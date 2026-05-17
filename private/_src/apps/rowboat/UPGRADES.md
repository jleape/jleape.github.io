# Upgrade ideas (deferred from MVP)

Ideas evaluated during MVP design that we intentionally deferred. Each entry
names the gap, why it matters, the simplest way to add it later, and any
schema or interface implications.

## Negotiation realism

### Counter-offers from owners
**Gap:** The current sim has owners offer at exactly `landCost` or refuse.
**Reality:** Owners typically counter-offer above the developer's appraisal.
**Approach:** Sample the owner's offer price from a distribution centered on
`landCost` (e.g., `landCost × (1 + Beta(2, 5))`), and let the agent's decision
operate on that sampled price rather than a fixed one.
**Schema:** Add `offerPrice: float` to scenario events.

### Multi-round negotiation
**Gap:** Binary accept / reject after the first offer.
**Reality:** Developer often counter-counter-offers; negotiation iterates.
**Approach:** Model as a loop with per-round cost X1 continuing to accrue.
Owner has a hidden reservation price; developer has a budget; convergence
happens stochastically. Significant complexity.
**Schema:** Per-parcel negotiation history.

### Re-engagement after refusal
**Gap:** A refused owner never returns to the table.
**Reality:** Refused owners sometimes re-engage months later (seeing
neighbors get paid, financial pressure, etc.).
**Approach:** With small probability per day, re-add a refused parcel to a
"reopened" state. Cheap to add but complicates the state machine.

### Owner-side strategic delay (holdout)
**Gap:** Owner response time is uniform on `[X2, X3]` independent of context.
**Reality:** Holdouts wait deliberately to extract premiums, especially late
in the project when developer leverage is low.
**Approach:** Make owner response time conditional on how many parcels are
already acquired (`p(refuse)` rises late). Adds policy depth.

### Neighbor effects
**Gap:** Each parcel's negotiation is independent.
**Reality:** Owners hear what neighbors got paid and re-anchor.
**Approach:** After each accepted offer, update `acquisitionProbability` /
expected price on geographically adjacent parcels.

## Information

### Noisy probability observations
**Gap:** Agent sees the true `acquisitionProbability`.
**Reality:** Agent has only a noisy estimate; learns from outcomes.
**Approach:** Have the developer-facing probability be a noisy version of
the ground-truth probability used to sample outcomes.

### Per-parcel cost rates
**Gap:** `X1` (daily negotiation cost) is global.
**Reality:** Difficult parcels (legal complexity, multiple owners, mortgage
encumbrances) burn cash faster.
**Approach:** Add a per-parcel `negotiationCostMultiplier`.

## Expropriation

### Expropriation success probability
**Gap:** Expropriation always succeeds.
**Reality:** In US public-purpose infra ~always; in some jurisdictions or
for some easement types, expropriation can be denied or limited.
**Approach:** Add a global `expropriationSuccessProbability`; on failure
the parcel becomes a hard reroute requirement.

### Quick-take possession
**Gap:** No "possession before final compensation" mechanism.
**Reality:** US "quick take" lets the developer build while compensation is
litigated, decoupling time-on-court from project schedule.
**Approach:** Add a `quickTake: bool` parameter that lets construction
proceed in parallel with expropriation.

## Geometry

### Partial takings
**Gap:** Parcels are atomic — either fully acquired or not at all.
**Reality:** Only the strip of land along the alignment is taken; the rest
stays with the owner. Compensation reflects the take area.
**Approach:** Compute the intersection of the alignment buffer with each
parcel's polygon; cost scales with intersection area.

### Existing easements
**Gap:** No mechanism to leverage pre-existing right-of-way.
**Reality:** Developers often follow existing pipeline/rail/transmission
corridors because the legal/practical work is already done.
**Approach:** Upload a layer of existing-ROW polygons; parcels under those
have a discounted (or zero) acquisition cost.

## Financial

### Financing-rate carrying cost
**Gap:** Project carrying cost is a flat `$/day`.
**Reality:** Carry is actually interest on the unfunded balance, so the
shape is closer to "outstanding debt × interest rate".
**Approach:** Model cumulative cash outflow and apply an interest rate.

### Continuous long-stop penalty
**Gap:** Long-stop is a step function (cost incurred iff date exceeded).
**Reality:** Many contracts have escalating LDs (liquidated damages) per day
beyond an intermediate milestone, escalating again past the long-stop.
**Approach:** Replace step penalty with a piecewise per-day schedule.

## Policy

### Replace heuristic with learned policy
**Gap:** Engagement / accept / expropriate decisions are hand-coded.
**Reality:** This is exactly what reinforcement learning is for. The model
captures enough dynamics (parallel parcel state, time pressure, cost trade-
offs) to be an interesting policy-learning problem.
**Approach:** Wrap the simulator as a Gymnasium env, train PPO/DQN in
Stable-Baselines3. The MVP already isolates the decision point in
`_simulate_one` so swapping in a learned policy is local.
