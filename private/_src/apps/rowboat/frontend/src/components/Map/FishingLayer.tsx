import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Marker, Polyline } from 'react-leaflet';
import * as turf from '@turf/turf';
import { useBoatPlacement } from './BoatLayer';
import { useParcelsStore } from '@/state/parcelsStore';
import { usePolicyStore } from '@/state/policyStore';
import { scenarioStateAt } from '@/state/scenarioView';
import type { ScenarioEvent } from '@/types';

type LngLat = [number, number];

/** Kinds of catch the animation can display. */
type CatchKind = 'big' | 'small' | 'net';

interface ActiveFish {
  id: string;          // unique per spawn
  parcelId: string;    // the parcel that was acquired
  from: LngLat;        // parcel centroid where the catch starts
  startedAt: number;   // epoch ms
  durationMs: number;
  kind: CatchKind;
}

interface ActiveSplash {
  id: string;
  pos: LngLat;
  startedAt: number;
  durationMs: number;
}

const FISH_DURATION_MS = 750;
const SPLASH_DURATION_MS = 550;

/**
 * Compute an arc of N+1 points between `from` and `to`, deflected perpendicular
 * to the chord by `archFrac × chordLength`. Sampled along a quadratic bezier.
 * The arc consistently bows in the same rotational direction so concurrent
 * fishing lines splay outward visually rather than all overlapping.
 */
function arcPoints(from: LngLat, to: LngLat, archFrac = 0.22, samples = 14): LngLat[] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return [from, to];
  // Perpendicular to the chord (rotated 90° CCW in lng/lat space).
  const perpX = -dy / len;
  const perpY = dx / len;
  const offset = len * archFrac;
  const cpx = (from[0] + to[0]) / 2 + perpX * offset;
  const cpy = (from[1] + to[1]) / 2 + perpY * offset;
  const pts: LngLat[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const u = 1 - t;
    const x = u * u * from[0] + 2 * u * t * cpx + t * t * to[0];
    const y = u * u * from[1] + 2 * u * t * cpy + t * t * to[1];
    pts.push([x, y]);
  }
  return pts;
}

/**
 * Decide which kind of fish to spawn from a scenario event. `acquire` →
 * big fish (consensual purchase); `easement` → small fish (perpetual
 * right-of-use, smaller payout); `expropriate` → big fish wrapped in a net
 * (forced acquisition). `parcelStatusById` covers the case where a parcel
 * was pre-marked by the user as already-eased before the rollout started.
 */
function kindForEvent(
  ev: ScenarioEvent,
  parcelStatusById: Map<string, string>
): CatchKind | null {
  if (ev.action === 'acquire') {
    return parcelStatusById.get(ev.parcelId) === 'easement' ? 'small' : 'big';
  }
  if (ev.action === 'easement') return 'small';
  if (ev.action === 'expropriate') return 'net';
  return null;
}

/** SVG markup for each catch type. Sized 28×28 like the boat. */
function catchSvg(kind: CatchKind, t: number): string {
  // `t` is 0..1 — used for a tiny bobbing animation while in transit.
  const bob = Math.sin(t * Math.PI * 4) * 1.5;
  const tilt = Math.sin(t * Math.PI * 6) * 8; // gentle wiggle
  if (kind === 'small') {
    return `
      <svg viewBox="0 0 28 28" width="22" height="22" xmlns="http://www.w3.org/2000/svg" style="transform: translateY(${bob}px) rotate(${tilt}deg);">
        <ellipse cx="13" cy="14" rx="7" ry="3.5" fill="#22d3ee" stroke="rgba(0,0,0,0.55)" stroke-width="0.8" />
        <polygon points="20,14 25,10 25,18" fill="#0e7490" />
        <circle cx="9" cy="13" r="0.9" fill="#0e1a24" />
      </svg>
    `;
  }
  if (kind === 'big') {
    return `
      <svg viewBox="0 0 28 28" width="28" height="28" xmlns="http://www.w3.org/2000/svg" style="transform: translateY(${bob}px) rotate(${tilt}deg);">
        <ellipse cx="13" cy="14" rx="10" ry="5" fill="#34d399" stroke="rgba(0,0,0,0.55)" stroke-width="1" />
        <polygon points="22,14 27,9 27,19" fill="#0f766e" />
        <path d="M5 14 Q9 11 9 14 Q9 17 5 14 Z" fill="#0f766e" opacity="0.55" />
        <circle cx="9" cy="13" r="1.2" fill="#0e1a24" />
      </svg>
    `;
  }
  // 'net' — bigger fish wrapped in a hatched net pattern.
  return `
    <svg viewBox="0 0 28 28" width="28" height="28" xmlns="http://www.w3.org/2000/svg" style="transform: translateY(${bob}px) rotate(${tilt}deg);">
      <defs>
        <pattern id="netHatch" patternUnits="userSpaceOnUse" width="3.5" height="3.5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3.5" stroke="rgba(255,255,255,0.9)" stroke-width="0.7" />
        </pattern>
      </defs>
      <ellipse cx="13" cy="14" rx="10" ry="5" fill="#f87171" stroke="rgba(0,0,0,0.55)" stroke-width="1" />
      <polygon points="22,14 27,9 27,19" fill="#7f1d1d" />
      <circle cx="9" cy="13" r="1.2" fill="#0e1a24" />
      <!-- net overlay -->
      <ellipse cx="13" cy="14.5" rx="11.5" ry="6.5" fill="url(#netHatch)" stroke="rgba(255,255,255,0.85)" stroke-width="0.8" />
    </svg>
  `;
}

function makeFishIcon(kind: CatchKind, t: number): L.DivIcon {
  return L.divIcon({
    html: `<div class="fish-anchor">${catchSvg(kind, t)}</div>`,
    className: 'fish-icon-wrapper',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/**
 * FishingLayer
 *
 * Two visual elements, both anchored to the boat:
 *  - Persistent fine white lines from the boat to every parcel currently in
 *    negotiation (engaged) or mid-expropriation. They drop when the parcel
 *    is resolved (acquired/expropriated/abandoned).
 *  - Transient fish flying from a parcel back to the boat whenever an
 *    `acquire` or `expropriate` event fires in the scenario step stream.
 *    Big fish = consensual sale, small fish = easement, big fish in a net =
 *    forced expropriation.
 */
export function FishingLayer() {
  const placement = useBoatPlacement();
  const parcels = useParcelsStore((s) => s.parcels);
  const scenario = usePolicyStore((s) =>
    s.currentScenarioIndex != null && s.result
      ? s.result.scenarios[s.currentScenarioIndex]
      : null
  );
  const stepIndex = usePolicyStore((s) => s.currentStepIndex);

  // Map of parcelId → centroid LngLat. Recomputed only when parcels change.
  const centroidById = useMemo(() => {
    const m = new Map<string, LngLat>();
    for (const f of parcels.features) {
      const c = turf.centroid(f).geometry.coordinates as number[];
      m.set(f.properties.id, [c[0], c[1]] as LngLat);
    }
    return m;
  }, [parcels]);

  const statusById = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of parcels.features) m.set(f.properties.id, f.properties.status);
    return m;
  }, [parcels]);

  // Currently-engaged parcels (active fishing lines).
  const engagedSet = useMemo<Set<string>>(() => {
    if (!scenario || stepIndex == null) return new Set();
    const view = scenarioStateAt(scenario, stepIndex);
    // Both `engaged` (negotiation in progress) and `expropriating` (court
    // proceedings) keep the line cast — only acquire/expropriate/abandon
    // releases it.
    return new Set<string>([...view.engaged, ...view.expropriating]);
  }, [scenario, stepIndex]);

  // ----- Animation state -----
  const [activeFish, setActiveFish] = useState<ActiveFish[]>([]);
  const [activeSplashes, setActiveSplashes] = useState<ActiveSplash[]>([]);
  /** Track which parcels we've already spawned a splash for, so each cast
   *  splashes only once even as the engaged set persists across many steps. */
  const splashedParcelsRef = useRef<Set<string>>(new Set());
  const prevStepRef = useRef<number | null>(null);

  // Spawn fish for any newly-revealed acquire/expropriate events between the
  // previously-displayed step and the current step. Walking the in-between
  // events means autoplay (rapid stepIndex changes) still triggers an
  // animation for every catch.
  useEffect(() => {
    if (!scenario) {
      prevStepRef.current = stepIndex ?? null;
      return;
    }
    const prev = prevStepRef.current;
    const curr = stepIndex;
    prevStepRef.current = curr ?? null;
    if (curr == null || prev == null) return;
    if (curr <= prev) return; // only react to forward motion
    const events = scenario.events ?? [];
    const newFish: ActiveFish[] = [];
    const now = performance.now();
    for (let i = prev + 1; i <= curr; i++) {
      const ev = events[i];
      if (!ev) continue;
      const kind = kindForEvent(ev, statusById);
      if (!kind) continue;
      const from = centroidById.get(ev.parcelId);
      if (!from) continue;
      newFish.push({
        id: `${i}-${ev.parcelId}-${now}`,
        parcelId: ev.parcelId,
        from,
        startedAt: now + (i - prev) * 35, // tiny stagger when several land at once
        durationMs: FISH_DURATION_MS,
        kind,
      });
    }
    if (newFish.length > 0) {
      setActiveFish((prevFish) => [...prevFish, ...newFish]);
    }
  }, [scenario, stepIndex, centroidById, statusById]);

  // Spawn a splash at every newly-engaged parcel. The engaged set itself is
  // already derived from the step view, so we just diff against the prior
  // "already splashed" record to detect first-cast moments.
  useEffect(() => {
    const splashed = splashedParcelsRef.current;
    const newSplashes: ActiveSplash[] = [];
    const now = performance.now();
    let i = 0;
    for (const pid of engagedSet) {
      if (splashed.has(pid)) continue;
      const pos = centroidById.get(pid);
      if (!pos) continue;
      splashed.add(pid);
      newSplashes.push({
        id: `splash-${pid}-${now}`,
        pos,
        startedAt: now + i * 30, // tiny stagger if many cast in the same step
        durationMs: SPLASH_DURATION_MS,
      });
      i++;
    }
    if (newSplashes.length > 0) {
      setActiveSplashes((prev) => [...prev, ...newSplashes]);
    }
    // If a parcel left the engaged set (resolved), drop it from the splashed
    // memo so a future re-engagement (after autoplay loops to a later scenario
    // and back) splashes again.
    for (const pid of Array.from(splashed)) {
      if (!engagedSet.has(pid)) splashed.delete(pid);
    }
  }, [engagedSet, centroidById]);

  // rAF tick: advance fish + splash animations and prune expired ones. Runs
  // only when there is at least one active animation to keep idle CPU at zero.
  const [, setTick] = useState(0);
  const animating = activeFish.length > 0 || activeSplashes.length > 0;
  useEffect(() => {
    if (!animating) return;
    let raf = 0;
    const loop = () => {
      const now = performance.now();
      setActiveFish((prev) => {
        const next = prev.filter((f) => now - f.startedAt < f.durationMs);
        return next.length === prev.length ? prev : next;
      });
      setActiveSplashes((prev) => {
        const next = prev.filter((s) => now - s.startedAt < s.durationMs);
        return next.length === prev.length ? prev : next;
      });
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animating]);

  // Clear any leftover transient state when scenario changes.
  useEffect(() => {
    setActiveFish([]);
    setActiveSplashes([]);
    splashedParcelsRef.current = new Set();
    prevStepRef.current = stepIndex ?? null;
    // Intentionally only on scenario change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.scenarioId]);

  if (!placement) return null;
  const boat = placement.position;
  const now = performance.now();

  // Fishing lines — arced polylines from boat to engaged parcels. Sampled
  // along a quadratic bezier so the chord bows perpendicular to the boat-
  // parcel line; concurrent lines splay outward instead of overlapping.
  const lines = Array.from(engagedSet).map((pid) => {
    const c = centroidById.get(pid);
    if (!c) return null;
    const pts = arcPoints(boat, c);
    return (
      <Polyline
        key={`line-${pid}`}
        positions={pts.map(([lng, lat]) => [lat, lng] as [number, number])}
        pane="alignmentPane"
        pathOptions={{
          color: '#ffffff',
          weight: 1,
          opacity: 0.5,
          dashArray: '3 4',
          interactive: false,
        }}
      />
    );
  });

  // Splash rings — expanding white rings at each just-cast parcel centroid.
  const splashElements: React.ReactNode[] = [];
  for (const s of activeSplashes) {
    const t = Math.min(1, Math.max(0, (now - s.startedAt) / s.durationMs));
    if (t < 0) continue;
    splashElements.push(
      <Marker
        key={`splash-${s.id}`}
        position={[s.pos[1], s.pos[0]]}
        icon={makeSplashIcon(t)}
        pane="destinationsPane"
        interactive={false}
        keyboard={false}
      />
    );
  }

  // Fish markers — reel back toward the boat along an arc, with a thinning
  // line trailing them so it looks like the line is being wound in.
  const fishElements: React.ReactNode[] = [];
  for (const fish of activeFish) {
    const t = Math.min(1, Math.max(0, (now - fish.startedAt) / fish.durationMs));
    // Reverse arc: from parcel back to boat, sampled at t along the same arc
    // we'd use for casting.
    const arc = arcPoints(boat, fish.from);
    const idx = Math.min(arc.length - 1, Math.floor((1 - t) * (arc.length - 1)));
    const pos = arc[idx];
    // Trailing line: a few points from the current position back to the boat.
    const trail = arc.slice(0, idx + 1);
    fishElements.push(
      <Polyline
        key={`reel-${fish.id}`}
        positions={trail.map(([lng, lat]) => [lat, lng] as [number, number])}
        pane="alignmentPane"
        pathOptions={{
          color: '#ffffff',
          weight: 1,
          opacity: 0.5 * (1 - t * 0.6),
          interactive: false,
        }}
      />
    );
    fishElements.push(
      <Marker
        key={`fish-${fish.id}`}
        position={[pos[1], pos[0]]}
        icon={makeFishIcon(fish.kind, t)}
        pane="destinationsPane"
        interactive={false}
        keyboard={false}
      />
    );
  }

  return (
    <>
      {lines}
      {splashElements}
      {fishElements}
    </>
  );
}

/** SVG ring burst used for the splash on first cast and the reel-in moment.
 *  `t` is 0..1 over the animation lifetime. Renders two concentric expanding
 *  rings plus a few droplet ticks. */
function makeSplashIcon(t: number): L.DivIcon {
  const r1 = 3 + t * 14;
  const r2 = 1.5 + t * 8;
  const alpha1 = 0.85 * (1 - t);
  const alpha2 = 0.6 * (1 - t);
  const droplet = (angleDeg: number) => {
    const ang = (angleDeg * Math.PI) / 180;
    const dist = 4 + t * 12;
    const x = 20 + Math.cos(ang) * dist;
    const y = 20 + Math.sin(ang) * dist;
    const r = 1.4 * (1 - t);
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="rgba(255,255,255,${alpha1.toFixed(3)})"/>`;
  };
  const html = `
    <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="${r1.toFixed(2)}" fill="none"
              stroke="rgba(255,255,255,${alpha1.toFixed(3)})" stroke-width="${(1.6 * (1 - t)).toFixed(2)}" />
      <circle cx="20" cy="20" r="${r2.toFixed(2)}" fill="none"
              stroke="rgba(255,255,255,${alpha2.toFixed(3)})" stroke-width="${(1.1 * (1 - t)).toFixed(2)}" />
      ${droplet(45)}
      ${droplet(135)}
      ${droplet(225)}
      ${droplet(315)}
    </svg>
  `;
  return L.divIcon({
    html,
    className: 'splash-icon-wrapper',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}
