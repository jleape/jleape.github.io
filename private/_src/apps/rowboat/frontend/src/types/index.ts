import type { Feature, FeatureCollection, Point, Polygon, LineString } from 'geojson';

export type ParcelStatus =
  | 'planned'
  | 'negotiating'
  | 'acquired'
  | 'easement'       // ROW obtained via easement (strip of use, not full ownership)
  | 'abandoned';     // "Blocked" — refused, rerouted around

export interface ParcelProperties {
  id: string;
  unitConstructionCost: number;  // $/m of alignment through the parcel
  landCost: number;              // total $ for a consented sale. $/ha is derived.
  expropriationCost: number;     // total $ to force acquisition. Should be > landCost.
  acquisitionProbability: number;
  status: ParcelStatus;
  areaHectares: number;
}

export type ParcelFeature = Feature<Polygon, ParcelProperties>;
export type ParcelCollection = FeatureCollection<Polygon, ParcelProperties>;

export interface DestinationProperties {
  id: string;
  order: number;
  label?: string;
}
export type DestinationFeature = Feature<Point, DestinationProperties>;

export interface AlignmentProperties {
  source: 'auto' | 'manual';
  totalLengthMeters: number;
  expectedCost: number;
}
export type AlignmentFeature = Feature<LineString, AlignmentProperties>;

export type ChoroplethMode =
  | 'none'
  | 'status'
  | 'constructionCost'
  | 'landUnitPrice'
  | 'acquisitionProbability';

export type ScenarioActionType =
  | 'engage'
  | 'offer'
  | 'refuse'
  | 'acquire'
  | 'easement'
  | 'expropriate-start'
  | 'expropriate'
  | 'abandon';

export interface ScenarioEvent {
  parcelId: string;
  action: ScenarioActionType;
  day: number;             // simulation day when this event occurred
  /** Running ROW-acquisition cost up to and including this event:
   *  engagement + negotiation + landCost (consensual) + expropriationCost
   *  (forced) + project-carry × day. Construction cost is excluded. */
  costToDate: number;
  pathAfter: string[];     // path the agent plans to follow next (parcels-in-order)
}

export interface ProjectMetadata {
  name: string;
  description: string;
  source: string;          // free text — where the parcel/alignment data came from
  createdAt: string;       // ISO timestamp
}

export interface ProjectSettings {
  engagementCost: number;             // X0: one-time cost to start engagement per parcel ($)
  negotiationCostPerDay: number;      // X1: daily cost while a parcel is in negotiation ($/day)
  responseMinDays: number;            // X2: min days from engage to owner response
  responseMaxDays: number;            // X3: max days from engage to owner response
  decisionWindowDays: number;         // X4: days the developer has to accept after offer
  expropriationDays: number;          // X5: days to complete expropriation after refusal
  projectCarryCostPerDay: number;     // project-level $/day from t=0 to t=project_done
  longStopDays: number;               // contractual long-stop date in days from t=0
  longStopPenalty: number;            // one-time $ penalty if project completes after long-stop
  maxConcurrentEngagements: number;   // hard budget on parallel negotiations (resource cap, not a heuristic ordering)
  /**
   * Minimum allowable radius of curvature for the alignment, in metres. The
   * planner rejects any centroid-to-centroid transition whose corner radius
   * (circumscribed-circle radius of the triangle prev-curr-next) is below
   * this value, forcing gentler curves at the cost of longer paths.
   * Typical values: high-speed rail 4000 m, pipelines 200–400 m, transmission
   * 100–200 m, surface roads 30–200 m. 0 disables the constraint.
   */
  minRadiusOfCurvatureM: number;
  /**
   * Probability that an owner who refused a purchase will instead accept an
   * easement (perpetual right-of-use without title transfer). Rolled on the
   * same response event; only applies if the purchase roll fails. Realistic
   * values: 0.3–0.6 — many owners object to losing title but tolerate a
   * permanent strip easement at a discount.
   */
  easementOfferProbability: number;
  /**
   * Payment for an easement, as a fraction of the parcel's full landCost.
   * Typical valuation models discount easements to ~30–60% of fee value
   * since the owner retains residual rights (farming, grazing, etc.).
   */
  easementCostFraction: number;
}

export interface PolicyRolloutScenario {
  scenarioId: string;
  acquired: string[];       // final set of consensually acquired parcels (in order)
  easement: string[];       // parcels secured via easement instead of fee acquisition
  expropriated: string[];   // final set of parcels acquired by expropriation
  abandoned: string[];      // parcels we tried, refused, and rerouted around
  events: ScenarioEvent[];  // step-by-step decisions
  finalAlignment: LineString | null;
  totalCost: number;
  totalTimeSteps: number;
}

export interface PolicyResult {
  policyId: string;
  firstActions: { parcelId: string; action: 'acquire' | 'negotiate' | 'wait'; score: number }[];
  costDistribution: number[];
  timeDistribution: number[];
  scenarios: PolicyRolloutScenario[];
}
