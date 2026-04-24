/* Extracted from Claude Design prototype — see scripts/extract.py */
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart, CartesianGrid, } from "recharts";
import { ArrowRight, ArrowLeft, Search, Filter, TrendingUp, TrendingDown, Clock,
  MapPin, Zap, FileText, ChevronDown, X, Check, Info, Activity, Layers,
  Plus, Minus, Heart, Users, } from "lucide-react";
// ============================================================
// DESIGN TOKENS
// ============================================================
const C = {
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  ink: "#1A1410",
  ink2: "#3D342B",
  muted: "#7A6D5F",
  line: "#E8DFD1",
  line2: "#F0E9DC",
  accent: "#8B1E2D",
  accentDim: "#B54A5A",
  accentSoft: "#F5E8EA",
  pos: "#2D5F3E",
  posSoft: "#E6EFE8",
  neg: "#8B1E2D",
  warn: "#A86B1E",
};

const FONT = {
  display: { fontFamily: "'Red Rose', Georgia, serif" },
  editorial: { fontFamily: "'Newsreader', Georgia, serif" },
  body: { fontFamily: "'IBM Plex Sans', system-ui, sans-serif" },
  mono: { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" },
};

// ============================================================
// RESPONSIVE HOOK
// ============================================================
function useViewport() {
  const getState = () => {
    if (typeof window === "undefined") return { w: 1200, isMobile: false, isNarrow: false };
    const w = window.innerWidth;
    return { w, isMobile: w < 768, isNarrow: w < 1024 };
  };
  const [v, setV] = useState(getState);
  useEffect(() => {
    const on = () => setV(getState());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return v;
}

// ============================================================
// MOCK DATA
// ============================================================

const BUYER_CLASSES = [
  {
    id: "506c",
    label: "Reg D 506(c) Accredited Investor",
    desc: "Individual or entity meeting US accredited investor criteria. Documentation required.",
    access: "All single-contract deals and baskets",
  },
  {
    id: "qib",
    label: "Qualified Institutional Buyer / Purchaser",
    desc: "Institutions meeting 144A QIB or 3(c)(7) qualified purchaser thresholds.",
    access: "All products incl. large-size block orders",
  },
  {
    id: "regs",
    label: "Reg S — Non-US Investor",
    desc: "Offshore investor outside the United States. KYC required.",
    access: "Pooled baskets; single contracts subject to review",
  },
  {
    id: "regap",
    label: "Reg A+ Retail (coming soon)",
    desc: "Qualified retail access to pooled baskets only. Pending filing.",
    access: "Pooled baskets only (Q3 2026)",
    disabled: true,
  },
];

const INVESTMENTS = [
  {
    id: "elara-va",
    name: "Elara DC",
    codename: "ELR-VA-28",
    type: "single",
    sector: "Data Center",
    drivers: ["AI inference demand", "Hyperscaler concentration"],
    triggerType: "parametric",
    triggerName: "AI Compute Demand Index (ACDI) ≥ 1,450",
    location: "Ashburn, VA",
    locationCoord: "Northern Virginia",
    maturity: "Dec 2028",
    daysToMaturity: 983,
    contractSize: 42.5,
    optionPrice: 0.34,
    priceChange24h: 2.1,
    itmProbability: 28,
    expectedPayoff: 4.2,
    spread: 0.02,
    volume24h: 186000,
    liquidity: "active",
    tokenized: true,
    narrative:
      "A 48MW hyperscaler-leased data center in the Ashburn corridor. The anchor tenant holds a 12-year lease with two 5-year extension options. Aji's contract funded a 30% modular expansion capability and pre-positioned power upgrade rights. If sustained AI inference demand pushes compute density beyond current envelope, the expansion option becomes exercisable and the asset's residual value premium materializes. Current lease economics do not reflect this embedded flexibility.",
    mechanics:
      "Parametric trigger. Aji's claim matures when the AI Compute Demand Index (published monthly by a third-party industry panel) closes above 1,450 for three consecutive months before Dec 2028. On trigger, an independent appraiser values the asset with and without the expansion rights. Aji collects 58% of the residual value premium, capped at 4.5× the option price.",
    indexHistory: [
      { t: "Jan", v: 1180 },
      { t: "Feb", v: 1205 },
      { t: "Mar", v: 1241 },
      { t: "Apr", v: 1268 },
      { t: "May", v: 1294 },
      { t: "Jun", v: 1312 },
      { t: "Jul", v: 1331 },
      { t: "Aug", v: 1348 },
      { t: "Sep", v: 1362 },
      { t: "Oct", v: 1371 },
      { t: "Nov", v: 1384 },
      { t: "Dec", v: 1398 },
    ],
    indexThreshold: 1450,
    priceHistory: genPriceHistory(0.21, 0.34, 120),
    scenarios: [
      { label: "Base", prob: 42, payoff: 0 },
      { label: "Above trigger, modest", prob: 21, payoff: 1.9 },
      { label: "Strong outcome", prob: 18, payoff: 3.4 },
      { label: "Cap scenario", prob: 10, payoff: 4.5 },
      { label: "Tail (extended cap)", prob: 9, payoff: 4.5 },
    ],
  },
  {
    id: "tarkin-dub",
    name: "Tarkin DC",
    codename: "TRK-IE-29",
    type: "single",
    sector: "Data Center",
    drivers: ["EU data sovereignty", "Grid connection scarcity"],
    triggerType: "appraisal",
    triggerName: "Lease non-renewal → conversion appraisal",
    location: "Dublin, IE",
    locationCoord: "Dublin, Ireland",
    maturity: "Jun 2029",
    daysToMaturity: 1134,
    contractSize: 28.2,
    optionPrice: 0.58,
    priceChange24h: -0.4,
    itmProbability: 52,
    expectedPayoff: 2.1,
    spread: 0.03,
    volume24h: 94000,
    liquidity: "moderate",
    tokenized: false,
    narrative:
      "A 24MW colocation facility serving EU financial-sector clients. Aji's contract funded a latent power-expansion right and a floor conversion option to AI-suitable footprint. Ireland's grid moratorium makes new capacity exceptionally scarce; in the event of lease turnover, the next-highest-value use is substantially different from current configuration. Aji is positioned to capture the spread.",
    mechanics:
      "Appraisal trigger. At any lease non-renewal event (next possible: Jun 2029), an independent valuation is performed on the asset in its current state and in the next-highest-value-use state permitted by Aji's prepositioned rights. Aji collects 50% of the residual value premium. Hybrid settlement: on-chain ownership registry, off-chain settlement via transfer agent.",
    indexHistory: null,
    priceHistory: genPriceHistory(0.42, 0.58, 120),
    scenarios: [
      { label: "Lease renewed, no trigger", prob: 48, payoff: 0 },
      { label: "Turnover, modest spread", prob: 22, payoff: 1.4 },
      { label: "Turnover, strong spread", prob: 21, payoff: 2.8 },
      { label: "Full conversion", prob: 9, payoff: 3.9 },
    ],
  },
  {
    id: "nemea-rtm",
    name: "Nemea Port Terminal",
    codename: "NEM-NL-31",
    type: "single",
    sector: "Transportation",
    drivers: ["Cargo type shift", "EU industrial policy"],
    triggerType: "appraisal",
    triggerName: "10-year refurbishment window",
    location: "Rotterdam, NL",
    locationCoord: "Rotterdam, Netherlands",
    maturity: "Mar 2031",
    daysToMaturity: 1791,
    contractSize: 18.6,
    optionPrice: 0.41,
    priceChange24h: 0.8,
    itmProbability: 44,
    expectedPayoff: 2.7,
    spread: 0.05,
    volume24h: 22000,
    liquidity: "thin",
    tokenized: false,
    narrative:
      "A 340-meter multi-purpose terminal currently configured for containerized cargo. Aji's contract funded foundational and berth-depth flexibility enabling reconfiguration to bulk/breakbulk or project-cargo handling. EU reshoring trends and changing trade patterns have begun to shift the marginal value of the terminal's capability mix. Trigger is a scheduled refurbishment window in 2031.",
    mechanics:
      "Appraisal trigger at scheduled refurbishment (Mar 2031). Three valuation scenarios appraised by independent engineering firm. Aji collects 45% of the premium over the baseline-use valuation. Hybrid settlement.",
    indexHistory: null,
    priceHistory: genPriceHistory(0.33, 0.41, 120),
    scenarios: [
      { label: "No reconfiguration", prob: 56, payoff: 0 },
      { label: "Partial reconfig", prob: 24, payoff: 2.0 },
      { label: "Full mode shift", prob: 15, payoff: 4.1 },
      { label: "Tail: policy windfall", prob: 5, payoff: 5.2 },
    ],
  },
  {
    id: "corvus-ercot",
    name: "Corvus Grid Node",
    codename: "CRV-TX-27",
    type: "single",
    sector: "Energy",
    drivers: ["Wind intermittency", "ERCOT congestion"],
    triggerType: "parametric",
    triggerName: "Transmission congestion rent index ≥ 82",
    location: "West Texas, USA",
    locationCoord: "ERCOT West zone",
    maturity: "Sep 2027",
    daysToMaturity: 525,
    contractSize: 12.1,
    optionPrice: 0.71,
    priceChange24h: 3.2,
    itmProbability: 71,
    expectedPayoff: 1.6,
    spread: 0.01,
    volume24h: 312000,
    liquidity: "very active",
    tokenized: true,
    narrative:
      "A 180MW flexible substation with battery-ready land rights adjacent to a high-congestion transmission node. Aji funded modular BESS foundation, switchyard pre-wiring, and interconnection queue position upgrade. As wind generation outpaces transmission buildout, congestion rent at this node has compounded. Trigger threshold is within 12% of the most recent rolling 12-month print.",
    mechanics:
      "Parametric trigger on the ERCOT West congestion rent index (published monthly by ERCOT). On threshold breach for two consecutive quarters, the BESS option activates and the residual value premium is appraised. Aji's share: 62% of premium. Fully tokenized settlement (Polygon).",
    indexHistory: [
      { t: "Jan", v: 54 },
      { t: "Feb", v: 58 },
      { t: "Mar", v: 61 },
      { t: "Apr", v: 63 },
      { t: "May", v: 67 },
      { t: "Jun", v: 69 },
      { t: "Jul", v: 71 },
      { t: "Aug", v: 73 },
      { t: "Sep", v: 72 },
      { t: "Oct", v: 74 },
      { t: "Nov", v: 76 },
      { t: "Dec", v: 78 },
    ],
    indexThreshold: 82,
    priceHistory: genPriceHistory(0.48, 0.71, 120),
    scenarios: [
      { label: "Below trigger", prob: 29, payoff: 0 },
      { label: "Trigger, modest", prob: 34, payoff: 1.3 },
      { label: "Trigger, strong", prob: 28, payoff: 2.0 },
      { label: "Cap scenario", prob: 9, payoff: 2.6 },
    ],
  },
  {
    id: "helia-esp",
    name: "Helia Solar+Storage",
    codename: "HLA-ES-30",
    type: "single",
    sector: "Energy",
    drivers: ["Dispatch price volatility", "Battery cycling revenue"],
    triggerType: "appraisal",
    triggerName: "Capacity threshold reached",
    location: "Extremadura, ES",
    locationCoord: "Extremadura, Spain",
    maturity: "Nov 2030",
    daysToMaturity: 1650,
    contractSize: 22.0,
    optionPrice: 0.46,
    priceChange24h: -1.1,
    itmProbability: 41,
    expectedPayoff: 2.9,
    spread: 0.04,
    volume24h: 58000,
    liquidity: "moderate",
    tokenized: true,
    narrative:
      "A 220MW solar farm co-located with early-stage battery storage. Aji funded oversized interconnection, foundation capacity for a 3× storage expansion, and permitting optionality. Iberian dispatch price volatility has grown with solar penetration; storage arbitrage economics have strengthened. Trigger is a capacity-utilization threshold triggering a formal appraisal.",
    mechanics:
      "Appraisal trigger when battery dispatch exceeds defined utilization threshold for 6 months. Independent valuation of asset with current vs. expanded storage configuration. Aji collects 55% of premium.",
    indexHistory: null,
    priceHistory: genPriceHistory(0.52, 0.46, 120),
    scenarios: [
      { label: "No expansion", prob: 59, payoff: 0 },
      { label: "Partial expansion", prob: 22, payoff: 2.1 },
      { label: "Full expansion", prob: 14, payoff: 4.3 },
      { label: "Tail: grid services", prob: 5, payoff: 5.8 },
    ],
  },
  {
    id: "lumen-mw",
    name: "Lumen Block",
    codename: "LUM-US-29",
    type: "single",
    sector: "Real Estate",
    drivers: ["Remote work persistence", "Urban housing shortage"],
    triggerType: "appraisal",
    triggerName: "Vacancy threshold triggers conversion appraisal",
    location: "Midwest US",
    locationCoord: "Midwest US metro",
    maturity: "Aug 2029",
    daysToMaturity: 1231,
    contractSize: 35.8,
    optionPrice: 0.29,
    priceChange24h: 1.4,
    itmProbability: 33,
    expectedPayoff: 3.6,
    spread: 0.06,
    volume24h: 14000,
    liquidity: "thin",
    tokenized: false,
    narrative:
      "A 1980s-era office building with Aji-funded structural pre-positioning for residential conversion — reinforced plumbing risers, window operability permits, and updated zoning accommodation. If sustained vacancy triggers owner repositioning, conversion economics are favorable relative to comparable unconverted stock.",
    mechanics:
      "Appraisal trigger when building vacancy exceeds 35% for 24 consecutive months. Independent valuation compares current-use vs. converted-residential state. Aji share: 48% of premium. Hybrid settlement.",
    indexHistory: null,
    priceHistory: genPriceHistory(0.21, 0.29, 120),
    scenarios: [
      { label: "No trigger", prob: 67, payoff: 0 },
      { label: "Partial conversion", prob: 18, payoff: 2.4 },
      { label: "Full conversion", prob: 11, payoff: 5.1 },
      { label: "Tail: area rezoning", prob: 4, payoff: 7.0 },
    ],
  },
  {
    id: "basket-ai",
    name: "AI Compute Flexibility Basket",
    codename: "BKT-AICF-01",
    type: "pooled",
    sector: "Basket • Data Center",
    drivers: ["AI compute demand (aggregated)", "Grid capacity (aggregated)"],
    triggerType: "mixed",
    triggerName: "Pooled exposure across 6 contracts (3 parametric, 3 appraisal)",
    location: "Global",
    locationCoord: "US, EU, Asia-Pacific",
    maturity: "Weighted Q2 2029",
    daysToMaturity: 1120,
    contractSize: 187.4,
    optionPrice: 0.38,
    priceChange24h: 1.8,
    itmProbability: 48,
    expectedPayoff: 2.4,
    spread: 0.015,
    volume24h: 842000,
    liquidity: "most active",
    tokenized: true,
    narrative:
      "A pooled basket combining six single-contract positions across the AI data center flexibility thesis. Diversified across geographies (US, EU, APAC), trigger types (parametric compute indices and appraisal events), and maturities (2027–2031). Constructed to reduce idiosyncratic risk while preserving sector exposure. Rebalanced semi-annually as positions mature and new ones come online.",
    mechanics:
      "Each unit represents a pro-rata claim on the pooled cash flows of the six underlying contracts. Distributions occur at each individual contract resolution. Basket NAV is republished monthly by third-party administrator. Fully tokenized settlement.",
    indexHistory: null,
    priceHistory: genPriceHistory(0.31, 0.38, 120),
    scenarios: [
      { label: "Below-base resolution", prob: 18, payoff: 0.4 },
      { label: "Base case", prob: 42, payoff: 1.8 },
      { label: "Above base", prob: 28, payoff: 2.9 },
      { label: "Strong tail", prob: 12, payoff: 4.1 },
    ],
    holdings: [
      { name: "Elara DC", weight: 22 },
      { name: "Tarkin DC", weight: 15 },
      { name: "Shizuku DC (Osaka)", weight: 18 },
      { name: "Vesper DC (Frankfurt)", weight: 17 },
      { name: "Perseus DC (Phoenix)", weight: 14 },
      { name: "Orion DC (Singapore)", weight: 14 },
    ],
  },
  {
    id: "basket-clim",
    name: "Climate Conversion Basket",
    codename: "BKT-CLIM-01",
    type: "pooled",
    sector: "Basket • Mixed",
    drivers: ["Climate parametric triggers", "Adaptation conversion value"],
    triggerType: "mixed",
    triggerName: "Pooled exposure (mostly parametric climate indices)",
    location: "Global",
    locationCoord: "US, EU, APAC, LatAm",
    maturity: "Weighted Q3 2030",
    daysToMaturity: 1495,
    contractSize: 142.3,
    optionPrice: 0.52,
    priceChange24h: 0.3,
    itmProbability: 56,
    expectedPayoff: 2.0,
    spread: 0.02,
    volume24h: 268000,
    liquidity: "active",
    tokenized: true,
    narrative:
      "A pooled basket of real-asset flexibility contracts where the triggering events are climate-related: temperature thresholds, precipitation anomalies, storm indices, and drought-stress metrics. Eight underlying contracts across coastal infrastructure, agricultural assets, and urban water systems. The basket's correlation structure benefits from geographic and trigger-type diversification.",
    mechanics:
      "Each unit is a pro-rata claim on pooled cash flows of eight underlying contracts. Most triggers are parametric against publicly observable climate indices; a minority are appraisal-based. Monthly NAV. Fully tokenized settlement.",
    indexHistory: null,
    priceHistory: genPriceHistory(0.48, 0.52, 120),
    scenarios: [
      { label: "Mild year(s), no triggers", prob: 22, payoff: 0.3 },
      { label: "Partial triggering", prob: 44, payoff: 1.5 },
      { label: "Broad triggering", prob: 24, payoff: 2.5 },
      { label: "Severe climate tail", prob: 10, payoff: 3.8 },
    ],
    holdings: [
      { name: "Coastal Infra (FL)", weight: 16 },
      { name: "Port Expansion (Bangladesh)", weight: 12 },
      { name: "Ag Storage (Iberia)", weight: 14 },
      { name: "Urban Water (AZ)", weight: 13 },
      { name: "Hydro Flex (Chile)", weight: 12 },
      { name: "Coastal Infra (NL)", weight: 11 },
      { name: "Ag Storage (AU)", weight: 12 },
      { name: "Heat-Resilient Power (IN)", weight: 10 },
    ],
  },
];

// Utility for generating mock price history
function genPriceHistory(start, end, n) {
  const out = [];
  let v = start;
  const drift = (end - start) / n;
  for (let i = 0; i < n; i++) {
    v += drift + (Math.sin(i * 0.4) + Math.cos(i * 0.17)) * 0.008 + (Math.random() - 0.5) * 0.006;
    out.push({ t: i, v: +v.toFixed(4) });
  }
  out[n - 1].v = end;
  return out;
}

const ORDER_BOOK = {
  bids: [
    { price: 0.335, size: 12500 },
    { price: 0.334, size: 8200 },
    { price: 0.332, size: 22000 },
    { price: 0.330, size: 44000 },
    { price: 0.327, size: 18000 },
  ],
  asks: [
    { price: 0.342, size: 9400 },
    { price: 0.344, size: 14000 },
    { price: 0.347, size: 21500 },
    { price: 0.350, size: 32000 },
    { price: 0.354, size: 11000 },
  ],
};

const DOCS = [
  { name: "Investment Teaser", type: "PDF", size: "1.2 MB" },
  { name: "ISDA Master Agreement — Schedule", type: "PDF", size: "840 KB" },
  { name: "Payoff Formula Technical Specification", type: "PDF", size: "410 KB" },
  { name: "Appraisal Methodology Note", type: "PDF", size: "320 KB" },
  { name: "Underlying Asset Summary", type: "PDF", size: "2.1 MB" },
  { name: "Risk Factors", type: "PDF", size: "680 KB" },
];

const COMMUNITY_REQUESTS = [
  {
    id: "req_001",
    title: "Nordic cheap-power AI training capacity",
    sector: "Data Center",
    driver: "AI compute demand · Nordic power pricing",
    triggerType: "Parametric",
    maturityWindow: "2028–2031",
    sizeWindow: "$30M–$60M",
    description:
      "Looking for exposure to sub-$40/MWh training capacity in Sweden, Norway, and Finland. Core bet: hyperscalers shift training workloads to regions with cheap clean power as inference continues to eat coastal capacity. Want flexibility to expand cooling and cable at existing sites as demand firms up.",
    submitterClass: "Infrastructure Debt Fund",
    submitterLocation: "Stockholm",
    submittedDaysAgo: 12,
    likes: 47,
    commitCount: 3,
    totalCommitted: 12_000_000,
    status: "reviewing",
    liveMarketId: null,
  },
  {
    id: "req_002",
    title: "SMR siting optionality — US and UK",
    sector: "Nuclear",
    driver: "Reactor approval timeline · Interconnect queue position",
    triggerType: "Appraisal",
    maturityWindow: "2030–2035",
    sizeWindow: "$50M–$120M",
    description:
      "Small modular reactor development sites with permit optionality. Thesis: most SMR projects will fail to clear licensing, but winners compound enormously. Want a long-dated call on the flexibility to convert from permitted-only to construction-ready status.",
    submitterClass: "Family Office",
    submitterLocation: "London",
    submittedDaysAgo: 23,
    likes: 89,
    commitCount: 2,
    totalCommitted: 2_500_000,
    status: "queued",
    liveMarketId: null,
  },
  {
    id: "req_003",
    title: "Rotterdam port cargo-mode flexibility",
    sector: "Port",
    driver: "Container-to-bulk conversion · EU tariff shifts",
    triggerType: "Mixed",
    maturityWindow: "2027–2030",
    sizeWindow: "$15M–$40M",
    description:
      "Berth conversion optionality at major EU ports as trade-flow composition shifts. Hedge against a sharp decline in Asia-EU container volume coupled with a rise in dry-bulk needs for critical minerals imports.",
    submitterClass: "Commodity Trading House",
    submitterLocation: "Geneva",
    submittedDaysAgo: 94,
    likes: 62,
    commitCount: 8,
    totalCommitted: 28_000_000,
    status: "live",
    liveMarketId: "nemea-port-003",
  },
  {
    id: "req_004",
    title: "ERCOT transmission constraint exposure through 2032",
    sector: "Grid / Transmission",
    driver: "Locational marginal price spreads · Panhandle congestion",
    triggerType: "Parametric",
    maturityWindow: "2029–2032",
    sizeWindow: "$10M–$25M",
    description:
      "Long exposure to persistent West-to-Houston LMP spreads. Existing transmission projects are slipping by 18–30 months. Want a position that pays off if CREZ expansion remains constrained while load grows.",
    submitterClass: "Energy Hedge Fund",
    submitterLocation: "Houston",
    submittedDaysAgo: 6,
    likes: 23,
    commitCount: 1,
    totalCommitted: 4_000_000,
    status: "queued",
    liveMarketId: null,
  },
  {
    id: "req_005",
    title: "US cold-chain warehouse repositioning",
    sector: "Logistics",
    driver: "GLP-1 vial demand · Vaccine cold storage",
    triggerType: "Appraisal",
    maturityWindow: "2027–2029",
    sizeWindow: "$20M–$45M",
    description:
      "Conversion optionality for ambient-temperature warehouses to pharmaceutical-grade cold-chain facilities. Thesis: GLP-1 manufacturing scale-up will create regional cold storage shortages by 2027; operators with conversion-ready sites will capture significant rent premiums.",
    submitterClass: "REIT / Private Credit",
    submitterLocation: "New York",
    submittedDaysAgo: 18,
    likes: 31,
    commitCount: 4,
    totalCommitted: 8_500_000,
    status: "reviewing",
    liveMarketId: null,
  },
  {
    id: "req_006",
    title: "Iberian green hydrogen offtake optionality",
    sector: "Energy",
    driver: "Electrolyzer capacity factor · EU RED III quotas",
    triggerType: "Parametric",
    maturityWindow: "2030–2034",
    sizeWindow: "$25M–$60M",
    description:
      "Hedge for a large steel producer: we need the right but not the obligation to offtake green hydrogen at Iberian project sites. Pays off if electrolyzer capacity factors exceed 55% and EU mandate quotas firm up.",
    submitterClass: "Industrial Corporate",
    submitterLocation: "Madrid",
    submittedDaysAgo: 31,
    likes: 15,
    commitCount: 0,
    totalCommitted: 0,
    status: "queued",
    liveMarketId: null,
  },
  {
    id: "req_007",
    title: "Kansai semiconductor fab water-access rights",
    sector: "Utilities / Semiconductors",
    driver: "Prefecture allocation rulings · Fab water intensity",
    triggerType: "Appraisal",
    maturityWindow: "2028–2031",
    sizeWindow: "$15M–$35M",
    description:
      "Water allocation flexibility for semiconductor fabs in Kansai region. Currently facing tight prefecture caps; thesis is that rulings will liberalize selectively, creating large residual value for sites with pre-negotiated rights.",
    submitterClass: "Sovereign Fund",
    submitterLocation: "Singapore",
    submittedDaysAgo: 40,
    likes: 19,
    commitCount: 2,
    totalCommitted: 5_000_000,
    status: "reviewing",
    liveMarketId: null,
  },
  {
    id: "req_008",
    title: "Canadian battery mineral processing flexibility",
    sector: "Metals / Processing",
    driver: "IRA eligibility · Refining spread",
    triggerType: "Mixed",
    maturityWindow: "2029–2033",
    sizeWindow: "$40M–$80M",
    description:
      "Processing-line conversion rights between lithium carbonate and hydroxide at Quebec facilities. Bet on cathode chemistry mix evolving faster than current capex decisions assume.",
    submitterClass: "Mining Royalty",
    submitterLocation: "Toronto",
    submittedDaysAgo: 67,
    likes: 8,
    commitCount: 0,
    totalCommitted: 0,
    status: "passed",
    liveMarketId: null,
  },
];

// ============================================================
// SMALL UI PIECES
// ============================================================

function Tag({ children, tone = "default", small = false }) {
  const tones = {
    default: { bg: C.line2, fg: C.ink2 },
    accent: { bg: C.accentSoft, fg: C.accent },
    pos: { bg: C.posSoft, fg: C.pos },
    muted: { bg: "transparent", fg: C.muted },
    outline: { bg: "transparent", fg: C.ink2, border: `1px solid ${C.line}` },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        ...FONT.body,
        backgroundColor: t.bg,
        color: t.fg,
        border: t.border || "none",
        fontSize: small ? 10 : 11,
        padding: small ? "2px 6px" : "3px 8px",
        borderRadius: 2,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        fontWeight: 500,
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Divider({ vertical = false, mx = 0, my = 0 }) {
  if (vertical) {
    return (
      <div
        style={{
          width: 1,
          alignSelf: "stretch",
          backgroundColor: C.line,
          marginLeft: mx,
          marginRight: mx,
        }}
      />
    );
  }
  return (
    <div
      style={{
        height: 1,
        width: "100%",
        backgroundColor: C.line,
        marginTop: my,
        marginBottom: my,
      }}
    />
  );
}

function DataRow({ label, value, mono = false, valueColor, extra }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "10px 0",
        borderBottom: `1px solid ${C.line2}`,
      }}
    >
      <span style={{ ...FONT.body, fontSize: 12, color: C.muted, letterSpacing: 0.2 }}>{label}</span>
      <span
        style={{
          ...(mono ? FONT.mono : FONT.body),
          fontSize: 13,
          color: valueColor || C.ink,
          fontWeight: 500,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        {value}
        {extra && <span style={{ ...FONT.body, fontSize: 11, color: C.muted }}>{extra}</span>}
      </span>
    </div>
  );
}

function Button({ children, onClick, primary = false, disabled = false, small = false, icon: Icon }) {
  const base = {
    ...FONT.body,
    fontSize: small ? 12 : 13,
    fontWeight: 500,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    padding: small ? "8px 14px" : "12px 22px",
    borderRadius: 2,
    cursor: disabled ? "not-allowed" : "pointer",
    border: primary ? "none" : `1px solid ${C.line}`,
    backgroundColor: primary ? C.accent : "transparent",
    color: primary ? "#FFFFFF" : C.ink,
    opacity: disabled ? 0.4 : 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: "all 150ms ease",
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={base}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (primary) {
          e.currentTarget.style.backgroundColor = "#6B1622";
        } else {
          e.currentTarget.style.backgroundColor = C.line2;
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.backgroundColor = primary ? C.accent : "transparent";
      }}
    >
      {children}
      {Icon && <Icon size={small ? 14 : 16} />}
    </button>
  );
}

// ============================================================
// TOP NAV
// ============================================================

function TopNav({ buyerClass, onChangeClass, currentPage, onNav, holdingsCount }) {
  const { isMobile } = useViewport();
  const shortClass = {
    "506c": "506(c) Accredited",
    qib: "Qualified Institutional",
    regs: "Reg S • Offshore",
    regap: "Reg A+ Retail",
  }[buyerClass] || "Not classified";

  const navItems = [
    { id: "markets", label: "Markets" },
    { id: "portfolio", label: `Portfolio${holdingsCount > 0 ? ` (${holdingsCount})` : ""}` },
    { id: "request", label: isMobile ? "Request" : "Request a Market" },
  ];

  const isActive = (id) =>
    currentPage === id ||
    (currentPage === "detail" && id === "markets") ||
    (currentPage === "buy" && id === "markets");

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backgroundColor: C.bg,
        borderBottom: `1px solid ${C.line}`,
        padding: isMobile ? "0 16px" : "0 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between",
          gap: isMobile ? 0 : 0,
        }}
      >
        {/* Top row on mobile: brand + classification chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: isMobile ? 56 : 68,
            gap: 16,
            width: isMobile ? "100%" : "auto",
          }}
        >
          <div
            onClick={() => onNav("markets")}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                ...FONT.display,
                fontSize: isMobile ? 22 : 26,
                color: C.ink,
                fontWeight: 500,
                letterSpacing: -0.5,
                lineHeight: 1,
              }}
            >
              Aji
            </span>
            <span
              style={{
                ...FONT.body,
                fontSize: isMobile ? 9 : 10,
                color: C.muted,
                letterSpacing: 2,
                textTransform: "uppercase",
                paddingLeft: 10,
                borderLeft: `1px solid ${C.line}`,
              }}
            >
              Exchange
            </span>
          </div>
          <div
            onClick={onChangeClass}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: isMobile ? "5px 10px" : "6px 12px",
              borderRadius: 2,
              border: `1px solid ${C.line}`,
              backgroundColor: C.surface,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: buyerClass ? C.pos : C.warn,
                flexShrink: 0,
              }}
            />
            {!isMobile && (
              <span style={{ ...FONT.body, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Classification
              </span>
            )}
            <span style={{ ...FONT.body, fontSize: isMobile ? 11 : 12, color: C.ink, fontWeight: 500 }}>
              {shortClass}
            </span>
            <ChevronDown size={12} color={C.muted} />
          </div>
        </div>

        {/* Nav items: horizontal scroll on mobile */}
        <div
          style={{
            display: "flex",
            gap: 4,
            overflowX: isMobile ? "auto" : "visible",
            WebkitOverflowScrolling: "touch",
            borderTop: isMobile ? `1px solid ${C.line2}` : "none",
            paddingBottom: isMobile ? 4 : 0,
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onNav(item.id)}
                style={{
                  ...FONT.body,
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 500,
                  color: active ? C.ink : C.muted,
                  border: "none",
                  background: "transparent",
                  padding: isMobile ? "10px 12px" : "8px 14px",
                  cursor: "pointer",
                  borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent",
                  letterSpacing: 0.2,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// ONBOARDING (BUYER CLASS)
// ============================================================

function OnboardingModal({ onSelect, onDismiss, currentClass }) {
  const [selected, setSelected] = useState(currentClass || null);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(26, 20, 16, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          backgroundColor: C.surface,
          maxWidth: 620,
          width: "100%",
          maxHeight: "calc(100vh - 32px)",
          padding: "28px 28px 24px 28px",
          borderRadius: 2,
          border: `1px solid ${C.line}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ ...FONT.body, fontSize: 10, color: C.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
                Investor Classification
              </div>
              <h2 style={{ ...FONT.display, fontSize: 26, color: C.ink, margin: 0, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.2 }}>
                Select your investor class
              </h2>
            </div>
            {currentClass && (
              <button
                onClick={onDismiss}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: C.muted, padding: 4 }}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <p style={{ ...FONT.body, fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 12, marginBottom: 18 }}>
            Product availability and documentation requirements depend on your classification. You can change this later. Final verification completed during order entry.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: 1, minHeight: 0, paddingRight: 4, marginRight: -4 }}>
          {BUYER_CLASSES.map((cls) => {
            const isSelected = selected === cls.id;
            return (
              <button
                key={cls.id}
                disabled={cls.disabled}
                onClick={() => setSelected(cls.id)}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  border: `1px solid ${isSelected ? C.accent : C.line}`,
                  borderLeft: `3px solid ${isSelected ? C.accent : C.line}`,
                  backgroundColor: isSelected ? C.accentSoft : cls.disabled ? C.line2 : C.surface,
                  cursor: cls.disabled ? "not-allowed" : "pointer",
                  opacity: cls.disabled ? 0.5 : 1,
                  borderRadius: 2,
                  transition: "all 150ms ease",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...FONT.body, fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 4, lineHeight: 1.3 }}>
                      {cls.label}
                    </div>
                    <div style={{ ...FONT.body, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                      {cls.desc}
                    </div>
                    <div style={{ ...FONT.body, fontSize: 10.5, color: C.accent, marginTop: 6, letterSpacing: 0.3, textTransform: "uppercase", fontWeight: 500, lineHeight: 1.4 }}>
                      Access: {cls.access}
                    </div>
                  </div>
                  {isSelected && <Check size={18} color={C.accent} style={{ marginTop: 2, flexShrink: 0 }} />}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.line2}`, flexShrink: 0 }}>
          <Button primary disabled={!selected} onClick={() => onSelect(selected)} icon={ArrowRight}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MARKETS PAGE
// ============================================================

function formatPct(n, signed = false) {
  return (signed && n > 0 ? "+" : "") + n.toFixed(1) + "%";
}
function formatUSD(n) {
  if (n >= 1) return "$" + n.toFixed(1) + "M";
  return "$" + (n * 1000).toFixed(0) + "K";
}

function InvestmentCard({ inv, onClick }) {
  const posChange = inv.priceChange24h >= 0;
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.line}`,
        padding: "20px 22px 18px 22px",
        cursor: "pointer",
        borderRadius: 2,
        transition: "all 150ms ease",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.ink2;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.line;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Tag tone={inv.type === "pooled" ? "accent" : "default"} small>
              {inv.type === "pooled" ? "Pooled Basket" : inv.sector}
            </Tag>
            {inv.tokenized && <Tag tone="muted" small>Tokenized</Tag>}
          </div>
          <div style={{ ...FONT.editorial, fontSize: 19, color: C.ink, fontWeight: 500, lineHeight: 1.2 }}>
            {inv.name}
          </div>
          <div style={{ ...FONT.mono, fontSize: 10, color: C.muted, marginTop: 2, letterSpacing: 0.5 }}>
            {inv.codename}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...FONT.mono, fontSize: 20, color: C.ink, fontWeight: 500, lineHeight: 1 }}>
            ${inv.optionPrice.toFixed(2)}
          </div>
          <div
            style={{
              ...FONT.mono,
              fontSize: 11,
              color: posChange ? C.pos : C.neg,
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 3,
              justifyContent: "flex-end",
            }}
          >
            {posChange ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {formatPct(inv.priceChange24h, true)}
          </div>
        </div>
      </div>

      {/* Drivers */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {inv.drivers.map((d, i) => (
          <Tag key={i} tone="outline" small>
            {d}
          </Tag>
        ))}
      </div>

      {/* Trigger */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", backgroundColor: C.line2, borderRadius: 2 }}>
        <Zap size={13} color={C.muted} style={{ marginTop: 1, flexShrink: 0 }} />
        <div style={{ ...FONT.body, fontSize: 11.5, color: C.ink2, lineHeight: 1.4 }}>
          <span style={{ color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}>
            {inv.triggerType === "parametric" ? "Parametric" : inv.triggerType === "appraisal" ? "Appraisal" : "Mixed"}
          </span>
          <br />
          {inv.triggerName}
        </div>
      </div>

      {/* Aji ROV Output */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "12px 14px",
          backgroundColor: C.accentSoft,
          borderLeft: `2px solid ${C.accent}`,
          borderRadius: 2,
        }}
      >
        <div>
          <div style={{ ...FONT.body, fontSize: 9, color: C.accent, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
            Aji Projected ITM
          </div>
          <div style={{ ...FONT.mono, fontSize: 18, color: C.ink, fontWeight: 500, marginTop: 2 }}>
            {inv.itmProbability}%
          </div>
        </div>
        <div>
          <div style={{ ...FONT.body, fontSize: 9, color: C.accent, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
            Aji Projected Payoff
          </div>
          <div style={{ ...FONT.mono, fontSize: 18, color: C.ink, fontWeight: 500, marginTop: 2 }}>
            {inv.expectedPayoff.toFixed(1)}×
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 10,
          borderTop: `1px solid ${C.line2}`,
          ...FONT.body,
          fontSize: 11,
          color: C.muted,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} />
          {inv.location}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={11} />
          {inv.maturity}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Activity size={11} />
          {inv.liquidity}
        </span>
      </div>
    </div>
  );
}

function MarketsPage({ onSelect }) {
  const { isMobile } = useViewport();
  const [tab, setTab] = useState("all");
  const [sector, setSector] = useState("all");
  const [sortBy, setSortBy] = useState("activity");
  const [search, setSearch] = useState("");

  // New filters
  const [parametricOnly, setParametricOnly] = useState(false);
  const [tokenizedOnly, setTokenizedOnly] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Derive filter options from data
  const allDrivers = useMemo(
    () => Array.from(new Set(INVESTMENTS.flatMap((i) => i.drivers))).sort(),
    []
  );
  const allLocations = useMemo(
    () => Array.from(new Set(INVESTMENTS.map((i) => i.locationCoord))).sort(),
    []
  );
  const priceBounds = useMemo(() => {
    const prices = INVESTMENTS.map((i) => i.optionPrice);
    return { min: Math.floor(Math.min(...prices) * 100) / 100, max: Math.ceil(Math.max(...prices) * 100) / 100 };
  }, []);

  function toggleInArray(arr, setArr, val) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function resetFilters() {
    setSector("all");
    setParametricOnly(false);
    setTokenizedOnly(false);
    setSelectedDrivers([]);
    setSelectedLocations([]);
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
  }

  // Initialize price range from data on mount
  useEffect(() => {
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
  }, [priceBounds.min, priceBounds.max]);

  const filtered = useMemo(() => {
    let out = [...INVESTMENTS];
    if (tab === "single") out = out.filter((i) => i.type === "single");
    if (tab === "pooled") out = out.filter((i) => i.type === "pooled");
    if (tab === "closing") out = out.filter((i) => i.daysToMaturity < 900);
    if (sector !== "all") out = out.filter((i) => i.sector.includes(sector));
    if (parametricOnly) out = out.filter((i) => i.triggerType === "parametric");
    if (tokenizedOnly) out = out.filter((i) => i.tokenized);
    if (selectedDrivers.length > 0) {
      out = out.filter((i) => i.drivers.some((d) => selectedDrivers.includes(d)));
    }
    if (selectedLocations.length > 0) {
      out = out.filter((i) => selectedLocations.includes(i.locationCoord));
    }
    out = out.filter((i) => i.optionPrice >= priceMin && i.optionPrice <= priceMax);
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sector.toLowerCase().includes(q) ||
          i.codename.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.drivers.some((d) => d.toLowerCase().includes(q))
      );
    }
    if (sortBy === "activity") out.sort((a, b) => b.volume24h - a.volume24h);
    if (sortBy === "itm") out.sort((a, b) => b.itmProbability - a.itmProbability);
    if (sortBy === "payoff") out.sort((a, b) => b.expectedPayoff - a.expectedPayoff);
    if (sortBy === "maturity") out.sort((a, b) => a.daysToMaturity - b.daysToMaturity);
    if (sortBy === "price") out.sort((a, b) => a.optionPrice - b.optionPrice);
    return out;
  }, [tab, sector, sortBy, search, parametricOnly, tokenizedOnly, selectedDrivers, selectedLocations, priceMin, priceMax]);

  const sectors = ["all", ...Array.from(new Set(INVESTMENTS.filter((i) => i.type === "single").map((i) => i.sector)))];

  const priceNotDefault = priceMin > priceBounds.min || priceMax < priceBounds.max;
  const activeFilterCount =
    (sector !== "all" ? 1 : 0) +
    (parametricOnly ? 1 : 0) +
    (tokenizedOnly ? 1 : 0) +
    selectedDrivers.length +
    selectedLocations.length +
    (priceNotDefault ? 1 : 0);

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: isMobile ? "20px 16px 60px 16px" : "32px 32px 80px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 20 : 32 }}>
        <div style={{ ...FONT.body, fontSize: isMobile ? 10 : 11, color: C.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
          Live Markets
        </div>
        <h1 style={{ ...FONT.display, fontSize: isMobile ? 28 : 44, color: C.ink, margin: 0, fontWeight: 400, letterSpacing: -1, lineHeight: 1.1 }}>
          Real-asset flexibility, securitized.
        </h1>
        <p style={{ ...FONT.editorial, fontSize: isMobile ? 14 : 17, color: C.ink2, maxWidth: 680, lineHeight: 1.5, marginTop: 12, marginBottom: 0, fontStyle: "italic" }}>
          Each security is a transferable claim on an Aji real-options contract. Buy single-contract exposure or pooled thematic baskets.
        </p>
      </div>

      {/* Market summary strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 0,
          marginBottom: isMobile ? 20 : 32,
          border: `1px solid ${C.line}`,
          backgroundColor: C.surface,
        }}
      >
        {[
          { label: "Active contracts", value: INVESTMENTS.length, sub: "6 single, 2 baskets" },
          { label: "Total notional", value: "$509M", sub: "Across all products" },
          { label: "24h volume", value: "$1.82M", sub: "+12.3% vs 7d avg" },
          { label: "Aji weighted ITM prob.", value: "45%", sub: "Portfolio-level projection" },
        ].map((s, i) => {
          const borderR = isMobile ? (i % 2 === 0 ? `1px solid ${C.line}` : "none") : (i < 3 ? `1px solid ${C.line}` : "none");
          const borderB = isMobile && i < 2 ? `1px solid ${C.line}` : "none";
          return (
            <div
              key={i}
              style={{
                padding: isMobile ? "14px 16px" : "18px 22px",
                borderRight: borderR,
                borderBottom: borderB,
              }}
            >
              <div style={{ ...FONT.body, fontSize: isMobile ? 9 : 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontWeight: 500 }}>
                {s.label}
              </div>
              <div style={{ ...FONT.mono, fontSize: isMobile ? 18 : 22, color: C.ink, marginTop: 4, fontWeight: 500 }}>
                {s.value}
              </div>
              <div style={{ ...FONT.body, fontSize: isMobile ? 10 : 11, color: C.muted, marginTop: 2 }}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, backgroundColor: C.line2, padding: 3, borderRadius: 2, overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: 12 }}>
        {[
          { id: "all", label: "All" },
          { id: "single", label: isMobile ? "Single" : "Single Contracts" },
          { id: "pooled", label: "Baskets" },
          { id: "closing", label: isMobile ? "Closing" : "Closing Soon" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...FONT.body,
              fontSize: isMobile ? 11 : 12,
              fontWeight: 500,
              padding: isMobile ? "7px 12px" : "8px 16px",
              border: "none",
              backgroundColor: tab === t.id ? C.surface : "transparent",
              color: tab === t.id ? C.ink : C.muted,
              cursor: "pointer",
              borderRadius: 2,
              letterSpacing: 0.2,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Controls row: Search + Filters button + Sort */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${C.line}`,
            padding: "7px 12px",
            borderRadius: 2,
            backgroundColor: C.surface,
            flex: 1,
            minWidth: isMobile ? 0 : 240,
          }}
        >
          <Search size={13} color={C.muted} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isMobile ? "Search" : "Search markets, drivers, locations"}
            style={{
              ...FONT.body,
              fontSize: 12,
              border: "none",
              outline: "none",
              background: "transparent",
              flex: 1,
              color: C.ink,
              minWidth: 0,
              width: "100%",
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          style={{
            ...FONT.body,
            fontSize: 12,
            fontWeight: 500,
            padding: "8px 12px",
            border: `1px solid ${activeFilterCount > 0 ? C.accent : C.line}`,
            backgroundColor: activeFilterCount > 0 ? C.accentSoft : C.surface,
            color: activeFilterCount > 0 ? C.accent : C.ink,
            borderRadius: 2,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            letterSpacing: 0.2,
            whiteSpace: "nowrap",
          }}
        >
          <Filter size={12} />
          Filters
          {activeFilterCount > 0 && (
            <span
              style={{
                ...FONT.mono,
                fontSize: 10,
                fontWeight: 600,
                backgroundColor: C.accent,
                color: "#FFFFFF",
                padding: "1px 6px",
                borderRadius: 8,
                marginLeft: 2,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            ...FONT.body,
            fontSize: 12,
            padding: "8px 12px",
            border: `1px solid ${C.line}`,
            backgroundColor: C.surface,
            color: C.ink,
            borderRadius: 2,
            cursor: "pointer",
          }}
        >
          <option value="activity">Most active</option>
          <option value="itm">Highest Aji projected ITM</option>
          <option value="payoff">Highest Aji projected payoff</option>
          <option value="maturity">Nearest maturity</option>
          <option value="price">Lowest price</option>
        </select>
      </div>

      {/* Active filter chips row */}
      {activeFilterCount > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, alignItems: "center" }}>
          {sector !== "all" && (
            <FilterChip label={`Sector: ${sector}`} onRemove={() => setSector("all")} />
          )}
          {parametricOnly && <FilterChip label="Parametric only" onRemove={() => setParametricOnly(false)} />}
          {tokenizedOnly && <FilterChip label="Tokenized only" onRemove={() => setTokenizedOnly(false)} />}
          {selectedDrivers.map((d) => (
            <FilterChip key={d} label={d} onRemove={() => toggleInArray(selectedDrivers, setSelectedDrivers, d)} />
          ))}
          {selectedLocations.map((l) => (
            <FilterChip key={l} label={l} onRemove={() => toggleInArray(selectedLocations, setSelectedLocations, l)} />
          ))}
          {priceNotDefault && (
            <FilterChip
              label={`$${priceMin.toFixed(2)}–$${priceMax.toFixed(2)}`}
              onRemove={() => {
                setPriceMin(priceBounds.min);
                setPriceMax(priceBounds.max);
              }}
            />
          )}
          <button
            onClick={resetFilters}
            style={{
              ...FONT.body,
              fontSize: 11,
              fontWeight: 500,
              color: C.muted,
              background: "transparent",
              border: "none",
              padding: "4px 8px",
              cursor: "pointer",
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <FilterPanel
          sector={sector}
          setSector={setSector}
          sectors={sectors}
          parametricOnly={parametricOnly}
          setParametricOnly={setParametricOnly}
          tokenizedOnly={tokenizedOnly}
          setTokenizedOnly={setTokenizedOnly}
          allDrivers={allDrivers}
          selectedDrivers={selectedDrivers}
          toggleDriver={(d) => toggleInArray(selectedDrivers, setSelectedDrivers, d)}
          allLocations={allLocations}
          selectedLocations={selectedLocations}
          toggleLocation={(l) => toggleInArray(selectedLocations, setSelectedLocations, l)}
          priceMin={priceMin}
          priceMax={priceMax}
          setPriceMin={setPriceMin}
          setPriceMax={setPriceMax}
          priceBounds={priceBounds}
          onReset={resetFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Results header */}
      <div style={{ ...FONT.body, fontSize: 12, color: C.muted, marginBottom: 14 }}>
        {filtered.length} {filtered.length === 1 ? "market" : "markets"}
        {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active`}
      </div>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))",
          gap: isMobile ? 12 : 16,
        }}
      >
        {filtered.map((inv) => (
          <InvestmentCard key={inv.id} inv={inv} onClick={() => onSelect(inv.id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 60, textAlign: "center", color: C.muted, ...FONT.body, fontSize: 13 }}>
          No markets match the current filters.{" "}
          <button
            onClick={resetFilters}
            style={{
              ...FONT.body,
              fontSize: 13,
              color: C.accent,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span
      style={{
        ...FONT.body,
        fontSize: 11,
        color: C.accent,
        backgroundColor: C.accentSoft,
        padding: "4px 4px 4px 10px",
        borderRadius: 2,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        letterSpacing: 0.2,
        fontWeight: 500,
      }}
    >
      {label}
      <button
        onClick={onRemove}
        style={{
          background: "transparent",
          border: "none",
          padding: "2px 4px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          color: C.accent,
        }}
      >
        <X size={11} />
      </button>
    </span>
  );
}

function FilterPanel({
  sector, setSector, sectors,
  parametricOnly, setParametricOnly,
  tokenizedOnly, setTokenizedOnly,
  allDrivers, selectedDrivers, toggleDriver,
  allLocations, selectedLocations, toggleLocation,
  priceMin, priceMax, setPriceMin, setPriceMax, priceBounds,
  onReset, onClose,
}) {
  const { isMobile } = useViewport();
  return (
    <div
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.line}`,
        padding: isMobile ? 16 : 22,
        marginBottom: 16,
        borderRadius: 2,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ ...FONT.body, fontSize: 11, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>
          Filters
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onReset}
            style={{
              ...FONT.body,
              fontSize: 11,
              color: C.muted,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              letterSpacing: 0.3,
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            Reset
          </button>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: C.muted }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 18 : 24 }}>
        {/* Left column */}
        <div>
          {/* Toggles */}
          <FilterLabel>Trigger & Settlement</FilterLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            <ToggleChip active={parametricOnly} onClick={() => setParametricOnly((v) => !v)}>
              Parametric only
            </ToggleChip>
            <ToggleChip active={tokenizedOnly} onClick={() => setTokenizedOnly((v) => !v)}>
              Tokenized settlement
            </ToggleChip>
          </div>

          {/* Sector */}
          <FilterLabel>Sector</FilterLabel>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            style={{
              ...FONT.body,
              fontSize: 12,
              padding: "9px 12px",
              border: `1px solid ${C.line}`,
              backgroundColor: C.bg,
              color: C.ink,
              borderRadius: 2,
              cursor: "pointer",
              width: "100%",
              marginBottom: 20,
            }}
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All sectors" : s}
              </option>
            ))}
          </select>

          {/* Price range */}
          <FilterLabel>Option Price Range (USD)</FilterLabel>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...FONT.body, fontSize: 10, color: C.muted, marginBottom: 4 }}>Min</div>
              <input
                type="number"
                step={0.01}
                min={priceBounds.min}
                max={priceMax}
                value={priceMin}
                onChange={(e) => setPriceMin(Math.max(priceBounds.min, Math.min(priceMax, +e.target.value || 0)))}
                style={{
                  ...FONT.mono,
                  fontSize: 13,
                  padding: "8px 10px",
                  border: `1px solid ${C.line}`,
                  backgroundColor: C.bg,
                  color: C.ink,
                  borderRadius: 2,
                  width: "100%",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...FONT.body, fontSize: 10, color: C.muted, marginBottom: 4 }}>Max</div>
              <input
                type="number"
                step={0.01}
                min={priceMin}
                max={priceBounds.max}
                value={priceMax}
                onChange={(e) => setPriceMax(Math.min(priceBounds.max, Math.max(priceMin, +e.target.value || 0)))}
                style={{
                  ...FONT.mono,
                  fontSize: 13,
                  padding: "8px 10px",
                  border: `1px solid ${C.line}`,
                  backgroundColor: C.bg,
                  color: C.ink,
                  borderRadius: 2,
                  width: "100%",
                  outline: "none",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              step={0.01}
              value={priceMin}
              onChange={(e) => setPriceMin(Math.min(+e.target.value, priceMax))}
              style={{ flex: 1, accentColor: C.accent }}
            />
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              step={0.01}
              value={priceMax}
              onChange={(e) => setPriceMax(Math.max(+e.target.value, priceMin))}
              style={{ flex: 1, accentColor: C.accent }}
            />
          </div>
          <div style={{ ...FONT.body, fontSize: 10, color: C.muted, marginTop: 4 }}>
            Data range: ${priceBounds.min.toFixed(2)} – ${priceBounds.max.toFixed(2)}
          </div>
        </div>

        {/* Right column */}
        <div>
          <FilterLabel>
            Drivers {selectedDrivers.length > 0 && <span style={{ color: C.accent }}>({selectedDrivers.length})</span>}
          </FilterLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
            {allDrivers.map((d) => (
              <ToggleChip key={d} active={selectedDrivers.includes(d)} onClick={() => toggleDriver(d)}>
                {d}
              </ToggleChip>
            ))}
          </div>

          <FilterLabel>
            Locations {selectedLocations.length > 0 && <span style={{ color: C.accent }}>({selectedLocations.length})</span>}
          </FilterLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allLocations.map((l) => (
              <ToggleChip key={l} active={selectedLocations.includes(l)} onClick={() => toggleLocation(l)}>
                <MapPin size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                {l}
              </ToggleChip>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterLabel({ children }) {
  return (
    <div
      style={{
        ...FONT.body,
        fontSize: 10,
        color: C.muted,
        letterSpacing: 1,
        textTransform: "uppercase",
        fontWeight: 600,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function ToggleChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...FONT.body,
        fontSize: 11,
        fontWeight: 500,
        padding: "6px 10px",
        border: `1px solid ${active ? C.accent : C.line}`,
        backgroundColor: active ? C.accentSoft : "transparent",
        color: active ? C.accent : C.ink2,
        borderRadius: 2,
        cursor: "pointer",
        letterSpacing: 0.2,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      {active && <Check size={11} />}
      {children}
    </button>
  );
}

// ============================================================
// DETAIL PAGE
// ============================================================

function DetailPage({ inv, onBack, onBuy }) {
  const { isMobile } = useViewport();
  const posChange = inv.priceChange24h >= 0;
  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: isMobile ? "16px 16px 60px 16px" : "24px 32px 80px 32px" }}>
      {/* Breadcrumb */}
      <div
        onClick={onBack}
        style={{
          ...FONT.body,
          fontSize: 12,
          color: C.muted,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          marginBottom: 16,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        <ArrowLeft size={12} /> Back to Markets
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "flex-start",
          paddingBottom: isMobile ? 20 : 24,
          borderBottom: `1px solid ${C.line}`,
          marginBottom: isMobile ? 24 : 32,
          gap: isMobile ? 16 : 24,
        }}
      >
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <Tag tone={inv.type === "pooled" ? "accent" : "default"}>
              {inv.type === "pooled" ? "Pooled Basket" : inv.sector}
            </Tag>
            <Tag tone="muted">{inv.triggerType === "mixed" ? "Mixed triggers" : inv.triggerType === "parametric" ? "Parametric" : "Appraisal"}</Tag>
            {inv.tokenized ? <Tag tone="pos">Tokenized</Tag> : <Tag>Hybrid</Tag>}
          </div>
          <h1 style={{ ...FONT.display, fontSize: isMobile ? 30 : 44, color: C.ink, margin: 0, fontWeight: 500, letterSpacing: -1, lineHeight: 1.1 }}>
            {inv.name}
          </h1>
          <div style={{ ...FONT.mono, fontSize: isMobile ? 11 : 12, color: C.muted, marginTop: 6, letterSpacing: 0.5 }}>
            {inv.codename} · {inv.locationCoord} · Matures {inv.maturity}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: isMobile ? "center" : "flex-start", justifyContent: isMobile ? "space-between" : "flex-end", gap: isMobile ? 12 : 24, flexWrap: "wrap" }}>
          <div style={{ textAlign: isMobile ? "left" : "right" }}>
            <div style={{ ...FONT.body, fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Last Trade
            </div>
            <div style={{ ...FONT.mono, fontSize: isMobile ? 30 : 36, color: C.ink, fontWeight: 500, lineHeight: 1 }}>
              ${inv.optionPrice.toFixed(3)}
            </div>
            <div
              style={{
                ...FONT.mono,
                fontSize: 13,
                color: posChange ? C.pos : C.neg,
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
                justifyContent: isMobile ? "flex-start" : "flex-end",
              }}
            >
              {posChange ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {formatPct(inv.priceChange24h, true)} · 24h
            </div>
          </div>
          <Button primary onClick={onBuy} icon={ArrowRight}>
            Buy Securities
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: isMobile ? 0 : 32 }}>
        {/* LEFT COLUMN */}
        <div>
          {/* Narrative */}
          <Section title="Investment Thesis">
            <p style={{ ...FONT.editorial, fontSize: isMobile ? 15 : 16, color: C.ink, lineHeight: 1.7, margin: 0 }}>
              {inv.narrative}
            </p>
          </Section>

          {/* Price chart */}
          <Section title="Price History (120 sessions)">
            <div style={{ height: isMobile ? 180 : 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={inv.priceHistory} margin={{ left: -20, top: 10, right: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pg" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={C.accent} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="t"
                    tick={{ fontSize: 10, fill: C.muted, fontFamily: "IBM Plex Mono" }}
                    axisLine={{ stroke: C.line }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: C.muted, fontFamily: "IBM Plex Mono" }}
                    axisLine={{ stroke: C.line }}
                    tickLine={false}
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => "$" + v.toFixed(2)}
                  />
                  <CartesianGrid vertical={false} stroke={C.line2} />
                  <Tooltip
                    contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, fontFamily: "IBM Plex Sans", fontSize: 12, borderRadius: 2 }}
                    formatter={(v) => "$" + v.toFixed(3)}
                    labelFormatter={(l) => "Session " + l}
                  />
                  <Area type="monotone" dataKey="v" stroke={C.accent} fill="url(#pg)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* Payoff Mechanics */}
          <Section title="Payoff Mechanics">
            <p style={{ ...FONT.body, fontSize: 13, color: C.ink2, lineHeight: 1.7, margin: 0 }}>
              {inv.mechanics}
            </p>
          </Section>

          {/* Trigger dashboard (if parametric) */}
          {inv.indexHistory && (
            <Section title="Live Trigger Dashboard">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 16,
                  padding: isMobile ? "12px 14px" : "14px 18px",
                  backgroundColor: C.line2,
                  borderRadius: 2,
                }}
              >
                <div>
                  <div style={{ ...FONT.body, fontSize: isMobile ? 9 : 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>
                    Current Index Value
                  </div>
                  <div style={{ ...FONT.mono, fontSize: isMobile ? 20 : 24, color: C.ink, fontWeight: 500, marginTop: 4 }}>
                    {inv.indexHistory[inv.indexHistory.length - 1].v.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ ...FONT.body, fontSize: isMobile ? 9 : 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>
                    Trigger Threshold
                  </div>
                  <div style={{ ...FONT.mono, fontSize: isMobile ? 20 : 24, color: C.accent, fontWeight: 500, marginTop: 4 }}>
                    {inv.indexThreshold.toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ height: isMobile ? 180 : 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inv.indexHistory} margin={{ left: -20, top: 10, right: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={C.line2} />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: C.muted, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: C.line }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: C.muted, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: C.line }} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, fontFamily: "IBM Plex Sans", fontSize: 12, borderRadius: 2 }} />
                    <ReferenceLine y={inv.indexThreshold} stroke={C.accent} strokeDasharray="4 4" label={{ value: "Trigger", fill: C.accent, fontSize: 10, position: "right", fontFamily: "IBM Plex Mono" }} />
                    <Line type="monotone" dataKey="v" stroke={C.ink} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          {/* Basket holdings */}
          {inv.holdings && (
            <Section title="Basket Composition">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {inv.holdings.map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ ...FONT.body, fontSize: 12, color: C.ink, minWidth: isMobile ? 140 : 200, flexShrink: 0 }}>{h.name}</div>
                    <div style={{ flex: 1, height: 8, backgroundColor: C.line2, borderRadius: 2, position: "relative" }}>
                      <div style={{ height: "100%", width: `${h.weight * 3.5}%`, backgroundColor: C.accent, borderRadius: 2 }} />
                    </div>
                    <div style={{ ...FONT.mono, fontSize: 12, color: C.muted, minWidth: 40, textAlign: "right" }}>
                      {h.weight}%
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Aji Scenarios */}
          <Section title="Aji Outcome Scenarios">
            <div style={{ ...FONT.body, fontSize: 11, color: C.muted, marginBottom: 14, fontStyle: "italic" }}>
              Probability-weighted outcomes from Aji's proprietary ROV analysis. Underlying model is not disclosed.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {inv.scenarios.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 60px 60px",
                    gap: 10,
                    alignItems: "center",
                    padding: isMobile ? "9px 12px" : "10px 14px",
                    backgroundColor: i === 0 ? "transparent" : C.line2,
                    border: `1px solid ${C.line2}`,
                    borderRadius: 2,
                  }}
                >
                  <div style={{ ...FONT.body, fontSize: isMobile ? 12 : 13, color: C.ink }}>{s.label}</div>
                  <div style={{ ...FONT.mono, fontSize: 12, color: C.muted, textAlign: "right" }}>
                    {s.prob}%
                  </div>
                  <div style={{ ...FONT.mono, fontSize: 13, color: s.payoff > 0 ? C.pos : C.muted, textAlign: "right", fontWeight: 500 }}>
                    {s.payoff.toFixed(1)}×
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Documents */}
          <Section title="Documents">
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {DOCS.map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: isMobile ? "10px 12px" : "12px 14px",
                    borderBottom: i < DOCS.length - 1 ? `1px solid ${C.line2}` : "none",
                    cursor: "pointer",
                    gap: 10,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.line2)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <FileText size={14} color={C.muted} style={{ flexShrink: 0 }} />
                    <span style={{ ...FONT.body, fontSize: isMobile ? 12 : 13, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, ...FONT.mono, fontSize: 10, color: C.muted, letterSpacing: 0.5, flexShrink: 0 }}>
                    <span>{d.type}</span>
                    <span>·</span>
                    <span>{d.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Mobile Buy CTA - repeat at bottom for convenience */}
          {isMobile && (
            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <button
                onClick={onBuy}
                style={{
                  ...FONT.body,
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                  padding: "14px 22px",
                  borderRadius: 2,
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: C.accent,
                  color: "#FFFFFF",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                Buy Securities <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (stacks below on mobile) */}
        <div>
          {/* Key Metrics */}
          <SidebarCard title="Key Metrics">
            <DataRow label="Aji projected ITM prob." value={inv.itmProbability + "%"} mono valueColor={C.accent} />
            <DataRow label="Aji projected payoff" value={inv.expectedPayoff.toFixed(1) + "×"} mono valueColor={C.accent} />
            <DataRow label="Contract notional" value={"$" + inv.contractSize + "M"} mono />
            <DataRow label="Current price" value={"$" + inv.optionPrice.toFixed(3)} mono />
            <DataRow label="Bid-ask spread" value={"$" + inv.spread.toFixed(3)} mono />
            <DataRow label="24h volume" value={formatUSD(inv.volume24h / 1e6)} mono />
            <DataRow label="Days to maturity" value={inv.daysToMaturity.toLocaleString()} mono />
            <DataRow label="Liquidity" value={inv.liquidity} />
          </SidebarCard>

          {/* Order Book */}
          <SidebarCard title="Order Book">
            <div style={{ display: "flex", justifyContent: "space-between", ...FONT.body, fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              <span>Price</span>
              <span>Size</span>
            </div>
            {ORDER_BOOK.asks.slice().reverse().map((a, i) => (
              <div
                key={"a" + i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  position: "relative",
                  ...FONT.mono,
                  fontSize: 12,
                }}
              >
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: (a.size / 35000) * 100 + "%", backgroundColor: C.neg, opacity: 0.06 }} />
                <span style={{ color: C.neg, position: "relative" }}>${a.price.toFixed(3)}</span>
                <span style={{ color: C.ink2, position: "relative" }}>{(a.size / 1000).toFixed(1)}K</span>
              </div>
            ))}
            <div
              style={{
                padding: "10px 0",
                margin: "8px 0",
                borderTop: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                textAlign: "center",
                ...FONT.mono,
                fontSize: 13,
                color: C.ink,
                fontWeight: 600,
                backgroundColor: C.line2,
              }}
            >
              ${inv.optionPrice.toFixed(3)} · LAST
            </div>
            {ORDER_BOOK.bids.map((b, i) => (
              <div
                key={"b" + i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  position: "relative",
                  ...FONT.mono,
                  fontSize: 12,
                }}
              >
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: (b.size / 50000) * 100 + "%", backgroundColor: C.pos, opacity: 0.06 }} />
                <span style={{ color: C.pos, position: "relative" }}>${b.price.toFixed(3)}</span>
                <span style={{ color: C.ink2, position: "relative" }}>{(b.size / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </SidebarCard>

          {/* Holder composition */}
          <SidebarCard title="Holder Composition">
            {[
              { label: "Institutional", pct: 62 },
              { label: "Accredited (506c)", pct: 28 },
              { label: "Reg S", pct: 10 },
            ].map((h, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", ...FONT.body, fontSize: 12, color: C.ink2, marginBottom: 4 }}>
                  <span>{h.label}</span>
                  <span style={{ ...FONT.mono }}>{h.pct}%</span>
                </div>
                <div style={{ height: 4, backgroundColor: C.line2, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: h.pct + "%", backgroundColor: C.accent, borderRadius: 2 }} />
                </div>
              </div>
            ))}
            <div style={{ ...FONT.body, fontSize: 10, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>
              Top-10 concentration: 34%. Aggregate only; no individual holder disclosure.
            </div>
          </SidebarCard>

          {/* Settlement */}
          <SidebarCard title="Settlement">
            <div style={{ ...FONT.body, fontSize: 12, color: C.ink2, lineHeight: 1.6 }}>
              {inv.tokenized ? (
                <>
                  <strong>Fully tokenized.</strong> Ownership and transfer recorded on-chain (Polygon). Instant settlement at trade execution.
                </>
              ) : (
                <>
                  <strong>Hybrid.</strong> Ownership registered on-chain; underlying settlement of appraisal-triggered payoff handled off-chain by transfer agent (T+2 at resolution).
                </>
              )}
            </div>
          </SidebarCard>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h3
        style={{
          ...FONT.body,
          fontSize: 11,
          color: C.accent,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontWeight: 600,
          margin: 0,
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function SidebarCard({ title, children }) {
  return (
    <div
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.line}`,
        padding: 20,
        marginBottom: 16,
        borderRadius: 2,
      }}
    >
      <div
        style={{
          ...FONT.body,
          fontSize: 10,
          color: C.muted,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ============================================================
// BUY PAGE
// ============================================================

function BuyPage({ inv, onBack, onConfirm }) {
  const { isMobile } = useViewport();
  const [qty, setQty] = useState(1000);
  const [driverShift, setDriverShift] = useState(0);

  const totalCost = qty * inv.optionPrice;
  const fees = totalCost * 0.003;
  const totalWithFees = totalCost + fees;

  // Generate payoff function vs. hypothetical outcome
  const payoffPoints = useMemo(() => {
    const out = [];
    for (let i = -50; i <= 50; i += 2) {
      const outcomePct = i; // percent change in underlying driver
      let multiple = 0;
      if (outcomePct < -20) multiple = 0;
      else if (outcomePct < 0) multiple = 0.3 * (1 + outcomePct / 20);
      else if (outcomePct < 30) multiple = 0.5 + (outcomePct / 30) * 2.2;
      else multiple = Math.min(2.7 + (outcomePct - 30) * 0.06, inv.expectedPayoff * 1.3);
      const pnl = qty * inv.optionPrice * (multiple - 1);
      out.push({ x: outcomePct, multiple: +multiple.toFixed(2), pnl: Math.round(pnl) });
    }
    return out;
  }, [qty, inv]);

  // Distribution of outcomes (ROV output summarized)
  const distribution = useMemo(() => {
    return inv.scenarios.map((s) => ({
      label: s.label.length > 16 ? s.label.slice(0, 14) + "…" : s.label,
      prob: s.prob,
      pnl: Math.round(qty * inv.optionPrice * (s.payoff - 1)),
    }));
  }, [qty, inv]);

  const breakevenMultiple = 1.003; // cost + fees
  const expectedPnL = Math.round(qty * inv.optionPrice * (inv.expectedPayoff - 1));

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: isMobile ? "16px 16px 60px 16px" : "24px 32px 80px 32px" }}>
      <div
        onClick={onBack}
        style={{
          ...FONT.body,
          fontSize: 12,
          color: C.muted,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          marginBottom: 16,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        <ArrowLeft size={12} /> Back to {inv.name}
      </div>

      <div style={{ marginBottom: isMobile ? 20 : 28 }}>
        <div style={{ ...FONT.body, fontSize: 11, color: C.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
          Order Entry — {inv.codename}
        </div>
        <h1 style={{ ...FONT.display, fontSize: isMobile ? 26 : 36, color: C.ink, margin: 0, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.15 }}>
          Buy {inv.name}
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: isMobile ? 0 : 32 }}>
        {/* On mobile, order ticket comes FIRST (quantity input is the primary action) */}
        {isMobile && (
          <div style={{ marginBottom: 28 }}>
            <OrderTicket
              inv={inv}
              qty={qty}
              setQty={setQty}
              totalCost={totalCost}
              fees={fees}
              totalWithFees={totalWithFees}
              breakevenMultiple={breakevenMultiple}
              expectedPnL={expectedPnL}
              onConfirm={onConfirm}
              isMobile
            />
          </div>
        )}

        {/* Analytics */}
        <div>
          <Section title="Payoff Function">
            <p style={{ ...FONT.body, fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
              P&L as a function of the realized change in the primary underlying driver. Break-even line at ${(inv.optionPrice * breakevenMultiple).toFixed(3)}.
            </p>
            <div style={{ height: isMobile ? 240 : 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payoffPoints} margin={{ left: isMobile ? -10 : 10, top: 10, right: 10, bottom: 10 }}>
                  <CartesianGrid stroke={C.line2} />
                  <XAxis
                    dataKey="x"
                    tick={{ fontSize: 10, fill: C.muted, fontFamily: "IBM Plex Mono" }}
                    axisLine={{ stroke: C.line }}
                    tickLine={false}
                    label={{ value: "Δ in underlying driver (%)", position: "bottom", offset: -5, fill: C.muted, fontSize: 10, fontFamily: "IBM Plex Sans" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: C.muted, fontFamily: "IBM Plex Mono" }}
                    axisLine={{ stroke: C.line }}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 0 ? "+" : "") + (v / 1000).toFixed(0) + "K"}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, fontFamily: "IBM Plex Sans", fontSize: 12, borderRadius: 2 }}
                    formatter={(v, n) => {
                      if (n === "pnl") return ["$" + v.toLocaleString(), "P&L"];
                      return [v, n];
                    }}
                    labelFormatter={(l) => "Driver Δ: " + (l > 0 ? "+" : "") + l + "%"}
                  />
                  <ReferenceLine y={0} stroke={C.muted} strokeWidth={1} />
                  <ReferenceLine x={0} stroke={C.line} strokeDasharray="2 2" />
                  <Line type="monotone" dataKey="pnl" stroke={C.accent} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section title="Aji Outcome Distribution">
            <p style={{ ...FONT.body, fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
              Probability-weighted P&L across Aji's ROV scenarios for your chosen size.
            </p>
            <div style={{ height: isMobile ? 200 : 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ left: isMobile ? -20 : -10, top: 10, right: 10, bottom: 10 }}>
                  <CartesianGrid vertical={false} stroke={C.line2} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: isMobile ? 9 : 10, fill: C.muted, fontFamily: "IBM Plex Sans" }}
                    axisLine={{ stroke: C.line }}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: C.muted, fontFamily: "IBM Plex Mono" }}
                    axisLine={{ stroke: C.line }}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 0 ? "+" : "") + (v / 1000).toFixed(0) + "K"}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, fontFamily: "IBM Plex Sans", fontSize: 12, borderRadius: 2 }}
                    formatter={(v, n) => (n === "pnl" ? ["$" + v.toLocaleString(), "P&L"] : [v + "%", "Probability"])}
                  />
                  <ReferenceLine y={0} stroke={C.muted} strokeWidth={1} />
                  <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                    {distribution.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? C.pos : C.neg} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 0, marginTop: 16, border: `1px solid ${C.line}` }}>
              {distribution.map((d, i) => {
                const borderR = isMobile ? (i % 2 === 0 ? `1px solid ${C.line}` : "none") : (i < distribution.length - 1 ? `1px solid ${C.line}` : "none");
                const borderB = isMobile && i < distribution.length - 2 ? `1px solid ${C.line}` : "none";
                return (
                  <div key={i} style={{ padding: "10px 12px", borderRight: borderR, borderBottom: borderB }}>
                    <div style={{ ...FONT.body, fontSize: 10, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>
                      {d.prob}% probability
                    </div>
                    <div style={{ ...FONT.mono, fontSize: 14, color: d.pnl >= 0 ? C.pos : C.neg, fontWeight: 500, marginTop: 4 }}>
                      {d.pnl >= 0 ? "+" : ""}${d.pnl.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Sensitivity">
            <p style={{ ...FONT.body, fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
              Shift the primary driver to see how expected payoff and break-even probability change.
            </p>
            <div
              style={{
                padding: isMobile ? 16 : 20,
                backgroundColor: C.surface,
                border: `1px solid ${C.line}`,
                borderRadius: 2,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ ...FONT.body, fontSize: 12, color: C.ink2 }}>
                  Driver shift: <strong style={{ ...FONT.mono, color: C.ink }}>{driverShift > 0 ? "+" : ""}{driverShift}%</strong>
                </span>
              </div>
              <input
                type="range"
                min={-40}
                max={40}
                step={5}
                value={driverShift}
                onChange={(e) => setDriverShift(+e.target.value)}
                style={{ width: "100%", accentColor: C.accent }}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: 0,
                  marginTop: 16,
                  border: `1px solid ${C.line}`,
                }}
              >
                {[
                  { label: "Adj. Aji ITM prob.", value: Math.max(0, Math.min(100, inv.itmProbability + driverShift * 1.4)).toFixed(0) + "%" },
                  { label: "Adj. Aji projected payoff", value: Math.max(0, inv.expectedPayoff * (1 + driverShift / 100)).toFixed(2) + "×" },
                  { label: "Adj. Aji expected P&L", value: "$" + Math.round(qty * inv.optionPrice * (inv.expectedPayoff * (1 + driverShift / 100) - 1)).toLocaleString() },
                ].map((m, i) => (
                  <div key={i} style={{ padding: "12px 16px", borderRight: !isMobile && i < 2 ? `1px solid ${C.line}` : "none", borderBottom: isMobile && i < 2 ? `1px solid ${C.line}` : "none", backgroundColor: C.line2 }}>
                    <div style={{ ...FONT.body, fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{m.label}</div>
                    <div style={{ ...FONT.mono, fontSize: 18, color: C.ink, marginTop: 4, fontWeight: 500 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* Desktop-only: order ticket on right */}
        {!isMobile && (
          <div>
            <OrderTicket
              inv={inv}
              qty={qty}
              setQty={setQty}
              totalCost={totalCost}
              fees={fees}
              totalWithFees={totalWithFees}
              breakevenMultiple={breakevenMultiple}
              expectedPnL={expectedPnL}
              onConfirm={onConfirm}
            />
          </div>
        )}

        {/* Mobile: repeat order ticket at bottom for convenience after analytics review */}
        {isMobile && (
          <div style={{ marginTop: 12 }}>
            <OrderTicket
              inv={inv}
              qty={qty}
              setQty={setQty}
              totalCost={totalCost}
              fees={fees}
              totalWithFees={totalWithFees}
              breakevenMultiple={breakevenMultiple}
              expectedPnL={expectedPnL}
              onConfirm={onConfirm}
              isMobile
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}

function OrderTicket({ inv, qty, setQty, totalCost, fees, totalWithFees, breakevenMultiple, expectedPnL, onConfirm, isMobile = false, compact = false }) {
  return (
    <div
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.line}`,
        padding: isMobile ? 22 : 28,
        position: isMobile ? "static" : "sticky",
        top: isMobile ? "auto" : 96,
        borderRadius: 2,
      }}
    >
      <div style={{ ...FONT.body, fontSize: 10, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
        {compact ? "Confirm Order" : "Order Ticket"}
      </div>
      <div style={{ ...FONT.display, fontSize: isMobile ? 20 : 22, color: C.ink, fontWeight: 500, marginBottom: 18 }}>
        {inv.name}
      </div>

      <div style={{ ...FONT.body, fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
        Quantity (units)
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setQty(Math.max(100, qty - 100))}
          style={{ border: `1px solid ${C.line}`, backgroundColor: C.surface, padding: 10, cursor: "pointer", borderRadius: 2, flexShrink: 0 }}
        >
          <Minus size={14} />
        </button>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Math.max(0, +e.target.value || 0))}
          style={{
            ...FONT.mono,
            fontSize: 22,
            textAlign: "center",
            border: `1px solid ${C.line}`,
            padding: "10px 12px",
            flex: 1,
            minWidth: 0,
            outline: "none",
            color: C.ink,
            borderRadius: 2,
            fontWeight: 500,
          }}
        />
        <button
          onClick={() => setQty(qty + 100)}
          style={{ border: `1px solid ${C.line}`, backgroundColor: C.surface, padding: 10, cursor: "pointer", borderRadius: 2, flexShrink: 0 }}
        >
          <Plus size={14} />
        </button>
      </div>
      <input
        type="range"
        min={100}
        max={50000}
        step={100}
        value={qty}
        onChange={(e) => setQty(+e.target.value)}
        style={{ width: "100%", accentColor: C.accent, marginBottom: 18 }}
      />

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {[500, 1000, 5000, 10000].map((q) => (
          <button
            key={q}
            onClick={() => setQty(q)}
            style={{
              ...FONT.body,
              fontSize: 11,
              padding: "6px 10px",
              border: `1px solid ${C.line}`,
              background: qty === q ? C.accent : "transparent",
              color: qty === q ? "#FFFFFF" : C.ink2,
              cursor: "pointer",
              flex: 1,
              minWidth: 60,
              borderRadius: 2,
              fontWeight: 500,
            }}
          >
            {q.toLocaleString()}
          </button>
        ))}
      </div>

      <DataRow label="Unit price" value={"$" + inv.optionPrice.toFixed(3)} mono />
      <DataRow label="Gross cost" value={"$" + totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mono />
      <DataRow label="Platform fee (0.30%)" value={"$" + fees.toFixed(2)} mono />
      <DataRow label="Total cost" value={"$" + totalWithFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mono valueColor={C.ink} />
      <Divider my={12} />
      <DataRow label="Break-even multiple" value={breakevenMultiple.toFixed(3) + "×"} mono />
      <DataRow label="Aji expected P&L" value={"$" + expectedPnL.toLocaleString()} mono valueColor={expectedPnL >= 0 ? C.pos : C.neg} />
      <DataRow label="Max gain (cap)" value={"$" + Math.round(qty * inv.optionPrice * (inv.expectedPayoff * 1.2 - 1)).toLocaleString()} mono valueColor={C.pos} />
      <DataRow label="Max loss" value={"-$" + totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} mono valueColor={C.neg} />

      <div style={{ marginTop: 18 }}>
        <button
          onClick={() => onConfirm(qty)}
          style={{
            ...FONT.body,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            padding: "14px 22px",
            borderRadius: 2,
            cursor: "pointer",
            border: "none",
            backgroundColor: C.accent,
            color: "#FFFFFF",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          Review & Confirm <ArrowRight size={16} />
        </button>
      </div>

      <div
        style={{
          ...FONT.body,
          fontSize: 10,
          color: C.muted,
          lineHeight: 1.6,
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px solid ${C.line2}`,
        }}
      >
        <Info size={10} style={{ display: "inline", marginRight: 4 }} />
        Order executes against Aji's posted two-sided quote. Aji acts as principal market maker.
      </div>
    </div>
  );
}

// ============================================================
// CONFIRM MODAL
// ============================================================

function ConfirmModal({ inv, qty, onClose, onConfirmed }) {
  const { isMobile } = useViewport();
  const totalCost = qty * inv.optionPrice * 1.003;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(26, 20, 16, 0.55)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 24,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          backgroundColor: C.surface,
          maxWidth: 520,
          width: "100%",
          maxHeight: isMobile ? "92vh" : "calc(100vh - 48px)",
          padding: isMobile ? "24px 20px" : 36,
          borderRadius: 2,
          border: `1px solid ${C.line}`,
          overflowY: "auto",
        }}
      >
        <div style={{ ...FONT.body, fontSize: 10, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
          Confirm Order
        </div>
        <h2 style={{ ...FONT.display, fontSize: isMobile ? 22 : 28, color: C.ink, margin: 0, fontWeight: 500, letterSpacing: -0.5, marginBottom: 18, lineHeight: 1.2 }}>
          {qty.toLocaleString()} units of {inv.name}
        </h2>
        <div style={{ marginBottom: 20 }}>
          <DataRow label="Unit price" value={"$" + inv.optionPrice.toFixed(3)} mono />
          <DataRow label="Total cost" value={"$" + totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mono />
          <DataRow label="Settlement" value={inv.tokenized ? "On-chain (Polygon)" : "Hybrid (T+2)"} />
          <DataRow label="Maturity" value={inv.maturity} />
        </div>
        <div
          style={{
            padding: "12px 14px",
            backgroundColor: C.accentSoft,
            borderLeft: `2px solid ${C.accent}`,
            ...FONT.body,
            fontSize: 11,
            color: C.ink2,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          By confirming, you acknowledge receipt of the subscription documents and risk factors. Aji is the issuer and principal market maker. You may resell at any time subject to applicable transfer restrictions.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: isMobile ? "stretch" : "flex-end", flexDirection: isMobile ? "column-reverse" : "row" }}>
          <button
            onClick={onClose}
            style={{
              ...FONT.body,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              padding: "12px 22px",
              borderRadius: 2,
              cursor: "pointer",
              border: `1px solid ${C.line}`,
              backgroundColor: "transparent",
              color: C.ink,
              width: isMobile ? "100%" : "auto",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirmed}
            style={{
              ...FONT.body,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              padding: "12px 22px",
              borderRadius: 2,
              cursor: "pointer",
              border: "none",
              backgroundColor: C.accent,
              color: "#FFFFFF",
              width: isMobile ? "100%" : "auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            Confirm Purchase <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PORTFOLIO PAGE
// ============================================================

function PortfolioPage({ holdings, onSelect }) {
  const { isMobile } = useViewport();
  const totalCost = holdings.reduce((s, h) => s + h.qty * h.entryPrice, 0);
  const totalMV = holdings.reduce((s, h) => {
    const inv = INVESTMENTS.find((i) => i.id === h.id);
    return s + h.qty * inv.optionPrice;
  }, 0);
  const totalPnL = totalMV - totalCost;
  const totalExpPayoff = holdings.reduce((s, h) => {
    const inv = INVESTMENTS.find((i) => i.id === h.id);
    return s + h.qty * h.entryPrice * inv.expectedPayoff;
  }, 0);

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: isMobile ? "20px 16px 60px 16px" : "32px 32px 80px 32px" }}>
      <div style={{ marginBottom: isMobile ? 20 : 32 }}>
        <div style={{ ...FONT.body, fontSize: isMobile ? 10 : 11, color: C.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
          Your Positions
        </div>
        <h1 style={{ ...FONT.display, fontSize: isMobile ? 30 : 44, color: C.ink, margin: 0, fontWeight: 400, letterSpacing: -1 }}>
          Portfolio
        </h1>
      </div>

      {holdings.length === 0 ? (
        <div
          style={{
            padding: isMobile ? "60px 24px" : "80px 40px",
            backgroundColor: C.surface,
            border: `1px solid ${C.line}`,
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <Layers size={36} color={C.muted} style={{ marginBottom: 14 }} />
          <div style={{ ...FONT.editorial, fontSize: isMobile ? 18 : 20, color: C.ink, marginBottom: 8 }}>
            No positions yet
          </div>
          <div style={{ ...FONT.body, fontSize: 13, color: C.muted, maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
            Browse the markets and buy your first securities to see holdings, mark-to-market P&L, and maturity ladder here.
          </div>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: 0,
              marginBottom: isMobile ? 20 : 32,
              border: `1px solid ${C.line}`,
              backgroundColor: C.surface,
            }}
          >
            {[
              { label: "Positions", value: holdings.length, sub: `${holdings.filter((h) => INVESTMENTS.find((i) => i.id === h.id).type === "pooled").length} baskets` },
              { label: "Cost basis", value: "$" + totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
              { label: "Market value", value: "$" + totalMV.toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: (totalPnL >= 0 ? "+" : "") + "$" + totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 }), subColor: totalPnL >= 0 ? C.pos : C.neg },
              { label: "Aji projected", value: "$" + totalExpPayoff.toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: "At resolution" },
            ].map((s, i) => {
              const borderR = isMobile ? (i % 2 === 0 ? `1px solid ${C.line}` : "none") : (i < 3 ? `1px solid ${C.line}` : "none");
              const borderB = isMobile && i < 2 ? `1px solid ${C.line}` : "none";
              return (
                <div key={i} style={{ padding: isMobile ? "14px 16px" : "18px 22px", borderRight: borderR, borderBottom: borderB }}>
                  <div style={{ ...FONT.body, fontSize: isMobile ? 9 : 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontWeight: 500 }}>{s.label}</div>
                  <div style={{ ...FONT.mono, fontSize: isMobile ? 18 : 22, color: C.ink, marginTop: 4, fontWeight: 500 }}>{s.value}</div>
                  {s.sub && (
                    <div style={{ ...FONT.body, ...FONT.mono, fontSize: isMobile ? 10 : 11, color: s.subColor || C.muted, marginTop: 2 }}>
                      {s.sub}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Payoff projection over time */}
          <PayoffProjectionChart holdings={holdings} />

          {/* Mark-to-market trajectory */}
          <MTMTrajectoryChart holdings={holdings} />

          {/* Desktop: table. Mobile: stacked cards. */}
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {holdings.map((h, i) => {
                const inv = INVESTMENTS.find((x) => x.id === h.id);
                const mv = h.qty * inv.optionPrice;
                const cost = h.qty * h.entryPrice;
                const pnl = mv - cost;
                const expPayoff = h.qty * h.entryPrice * inv.expectedPayoff;
                return (
                  <div
                    key={i}
                    onClick={() => onSelect(inv.id)}
                    style={{
                      backgroundColor: C.surface,
                      border: `1px solid ${C.line}`,
                      padding: 16,
                      cursor: "pointer",
                      borderRadius: 2,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ ...FONT.editorial, fontSize: 16, color: C.ink, fontWeight: 500, lineHeight: 1.2 }}>{inv.name}</div>
                        <div style={{ ...FONT.mono, fontSize: 10, color: C.muted, marginTop: 2, letterSpacing: 0.5 }}>
                          {inv.codename} · {inv.sector}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ ...FONT.mono, fontSize: 16, color: C.ink, fontWeight: 500 }}>
                          ${mv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ ...FONT.mono, fontSize: 11, color: pnl >= 0 ? C.pos : C.neg, fontWeight: 500, marginTop: 2 }}>
                          {pnl >= 0 ? "+" : ""}${pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, paddingTop: 10, borderTop: `1px solid ${C.line2}` }}>
                      <div>
                        <div style={{ ...FONT.body, fontSize: 9, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>Qty</div>
                        <div style={{ ...FONT.mono, fontSize: 12, color: C.ink, marginTop: 2 }}>{h.qty.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ ...FONT.body, fontSize: 9, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>Entry / Last</div>
                        <div style={{ ...FONT.mono, fontSize: 12, color: C.ink, marginTop: 2 }}>
                          ${h.entryPrice.toFixed(2)} → ${inv.optionPrice.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div style={{ ...FONT.body, fontSize: 9, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>Aji Proj.</div>
                        <div style={{ ...FONT.mono, fontSize: 12, color: C.accent, marginTop: 2, fontWeight: 500 }}>
                          ${expPayoff.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                    <div style={{ ...FONT.body, fontSize: 10, color: C.muted, marginTop: 10, letterSpacing: 0.3 }}>
                      Matures {inv.maturity}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ backgroundColor: C.surface, border: `1px solid ${C.line}` }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 0.8fr",
                  padding: "14px 22px",
                  borderBottom: `1px solid ${C.line}`,
                  ...FONT.body,
                  fontSize: 10,
                  color: C.muted,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                <div>Security</div>
                <div style={{ textAlign: "right" }}>Qty</div>
                <div style={{ textAlign: "right" }}>Entry</div>
                <div style={{ textAlign: "right" }}>Last</div>
                <div style={{ textAlign: "right" }}>MV</div>
                <div style={{ textAlign: "right" }}>Unrealized</div>
                <div style={{ textAlign: "right" }}>Aji Proj.</div>
                <div style={{ textAlign: "right" }}>Maturity</div>
              </div>
              {holdings.map((h, i) => {
                const inv = INVESTMENTS.find((x) => x.id === h.id);
                const mv = h.qty * inv.optionPrice;
                const cost = h.qty * h.entryPrice;
                const pnl = mv - cost;
                const expPayoff = h.qty * h.entryPrice * inv.expectedPayoff;
                return (
                  <div
                    key={i}
                    onClick={() => onSelect(inv.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.6fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 0.8fr",
                      padding: "16px 22px",
                      borderBottom: i < holdings.length - 1 ? `1px solid ${C.line2}` : "none",
                      cursor: "pointer",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.line2)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div>
                      <div style={{ ...FONT.editorial, fontSize: 15, color: C.ink, fontWeight: 500 }}>{inv.name}</div>
                      <div style={{ ...FONT.mono, fontSize: 10, color: C.muted, marginTop: 2, letterSpacing: 0.5 }}>
                        {inv.codename} · {inv.sector}
                      </div>
                    </div>
                    <div style={{ ...FONT.mono, fontSize: 13, color: C.ink, textAlign: "right" }}>{h.qty.toLocaleString()}</div>
                    <div style={{ ...FONT.mono, fontSize: 13, color: C.muted, textAlign: "right" }}>${h.entryPrice.toFixed(3)}</div>
                    <div style={{ ...FONT.mono, fontSize: 13, color: C.ink, textAlign: "right" }}>${inv.optionPrice.toFixed(3)}</div>
                    <div style={{ ...FONT.mono, fontSize: 13, color: C.ink, textAlign: "right", fontWeight: 500 }}>${mv.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div style={{ ...FONT.mono, fontSize: 13, color: pnl >= 0 ? C.pos : C.neg, textAlign: "right", fontWeight: 500 }}>
                      {pnl >= 0 ? "+" : ""}${pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ ...FONT.mono, fontSize: 13, color: C.accent, textAlign: "right", fontWeight: 500 }}>${expPayoff.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div style={{ ...FONT.body, fontSize: 12, color: C.muted, textAlign: "right" }}>{inv.maturity}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PayoffProjectionChart({ holdings }) {
  const { isMobile } = useViewport();

  const { chartData, totalCost, nextMaturity, latestMaturity, projectedTotal, worstTotal, bestTotal } = useMemo(() => {
    // Enrich holdings with scenario extremes
    const events = holdings
      .map((h) => {
        const inv = INVESTMENTS.find((i) => i.id === h.id);
        const base = h.qty * h.entryPrice;
        const payoffMultiples = inv.scenarios.map((s) => s.payoff);
        const worstMultiple = Math.min(...payoffMultiples);
        const bestMultiple = Math.max(...payoffMultiples);
        return {
          daysToMaturity: inv.daysToMaturity,
          maturity: inv.maturity,
          name: inv.name,
          codename: inv.codename,
          projectedPayoff: base * inv.expectedPayoff,
          worstPayoff: base * worstMultiple,
          bestPayoff: base * bestMultiple,
        };
      })
      .sort((a, b) => a.daysToMaturity - b.daysToMaturity);

    const totalCost = holdings.reduce((s, h) => s + h.qty * h.entryPrice, 0);

    // Step points: start at today (t=0, all cumulative = 0)
    const points = [
      {
        label: "Today",
        t: 0,
        projected: 0,
        worst: 0,
        best: 0,
        band: 0,
        event: null,
      },
    ];

    let cumProj = 0;
    let cumWorst = 0;
    let cumBest = 0;

    events.forEach((e) => {
      cumProj += e.projectedPayoff;
      cumWorst += e.worstPayoff;
      cumBest += e.bestPayoff;
      points.push({
        label: e.maturity,
        t: e.daysToMaturity,
        projected: Math.round(cumProj),
        worst: Math.round(cumWorst),
        best: Math.round(cumBest),
        band: Math.round(cumBest - cumWorst),
        event: e.name,
      });
    });

    return {
      chartData: points,
      totalCost,
      nextMaturity: events[0] || null,
      latestMaturity: events[events.length - 1] || null,
      projectedTotal: cumProj,
      worstTotal: cumWorst,
      bestTotal: cumBest,
    };
  }, [holdings]);

  if (holdings.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.line}`,
        padding: isMobile ? 16 : 22,
        marginBottom: isMobile ? 20 : 28,
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ ...FONT.body, fontSize: 10, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Aji Projected Payoffs Over Time
          </div>
          <div style={{ ...FONT.editorial, fontSize: isMobile ? 16 : 18, color: C.ink, fontWeight: 500, letterSpacing: -0.3 }}>
            Cumulative payoff as positions mature
          </div>
        </div>
      </div>
      <p style={{ ...FONT.body, fontSize: 12, color: C.muted, lineHeight: 1.6, margin: 0, marginBottom: 16, maxWidth: 620 }}>
        Stepped curve: each position's projected payoff realizes at its maturity date. Shaded band shows the range from Aji's worst-case to best-case scenarios. Dashed reference line is cost basis.
      </p>

      {/* Chart */}
      <div style={{ height: isMobile ? 240 : 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: isMobile ? -10 : 10, top: 10, right: 20, bottom: 10 }}>
            <defs>
              <linearGradient id="bandGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={C.accent} stopOpacity={0.2} />
                <stop offset="100%" stopColor={C.accent} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={C.line2} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: isMobile ? 9 : 10, fill: C.muted, fontFamily: "IBM Plex Mono" }}
              axisLine={{ stroke: C.line }}
              tickLine={false}
              interval={0}
              angle={isMobile ? -25 : 0}
              textAnchor={isMobile ? "end" : "middle"}
              height={isMobile ? 50 : 30}
            />
            <YAxis
              tick={{ fontSize: 10, fill: C.muted, fontFamily: "IBM Plex Mono" }}
              axisLine={{ stroke: C.line }}
              tickLine={false}
              tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "K"}
            />
            <Tooltip
              contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, fontFamily: "IBM Plex Sans", fontSize: 12, borderRadius: 2 }}
              formatter={(v, n) => {
                const labels = { projected: "Aji projected", worst: "Worst case", best: "Best case", band: null };
                if (labels[n] === null) return [null, null];
                return ["$" + Number(v).toLocaleString(), labels[n] || n];
              }}
              labelFormatter={(l, payload) => {
                const p = payload && payload[0] && payload[0].payload;
                return p && p.event ? `${l} · ${p.event}` : l;
              }}
            />
            {/* Stacked area trick: invisible worst as base, band on top for the fill */}
            <Area
              type="stepAfter"
              dataKey="worst"
              stackId="band"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />
            <Area
              type="stepAfter"
              dataKey="band"
              stackId="band"
              stroke="none"
              fill="url(#bandGradient)"
              isAnimationActive={false}
            />
            {/* Cost basis reference */}
            <ReferenceLine
              y={totalCost}
              stroke={C.muted}
              strokeDasharray="4 4"
              label={{
                value: "Cost basis",
                fill: C.muted,
                fontSize: 10,
                fontFamily: "IBM Plex Sans",
                position: "insideTopRight",
              }}
            />
            {/* Worst-case line */}
            <Line
              type="stepAfter"
              dataKey="worst"
              stroke={C.muted}
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />
            {/* Best-case line */}
            <Line
              type="stepAfter"
              dataKey="best"
              stroke={C.pos}
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />
            {/* Aji projected line - primary */}
            <Line
              type="stepAfter"
              dataKey="projected"
              stroke={C.accent}
              strokeWidth={2.5}
              dot={{ r: 3, fill: C.accent, stroke: C.surface, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: C.accent, stroke: C.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 10 : 16, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line2}` }}>
        <LegendSwatch color={C.accent} label="Aji projected" solid />
        <LegendSwatch color={C.pos} label="Best case" dashed />
        <LegendSwatch color={C.muted} label="Worst case" dashed />
        <LegendSwatch color={C.muted} label="Cost basis" dashed />
      </div>

      {/* Summary tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 0,
          marginTop: 16,
          border: `1px solid ${C.line}`,
        }}
      >
        {[
          {
            label: "Next maturity",
            value: nextMaturity ? nextMaturity.maturity : "—",
            sub: nextMaturity ? `${nextMaturity.codename} · $${Math.round(nextMaturity.projectedPayoff).toLocaleString()}` : null,
          },
          {
            label: "Final maturity",
            value: latestMaturity ? latestMaturity.maturity : "—",
            sub: latestMaturity ? `${latestMaturity.codename}` : null,
          },
          {
            label: "Aji projected total",
            value: "$" + Math.round(projectedTotal).toLocaleString(),
            sub: `vs. $${Math.round(totalCost).toLocaleString()} cost`,
            color: C.accent,
          },
          {
            label: "Worst → Best",
            value: "$" + Math.round(worstTotal / 1000) + "K → $" + Math.round(bestTotal / 1000) + "K",
            sub: null,
          },
        ].map((s, i) => {
          const borderR = isMobile ? (i % 2 === 0 ? `1px solid ${C.line}` : "none") : (i < 3 ? `1px solid ${C.line}` : "none");
          const borderB = isMobile && i < 2 ? `1px solid ${C.line}` : "none";
          return (
            <div key={i} style={{ padding: isMobile ? "10px 12px" : "12px 14px", borderRight: borderR, borderBottom: borderB }}>
              <div style={{ ...FONT.body, fontSize: isMobile ? 9 : 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontWeight: 500 }}>
                {s.label}
              </div>
              <div style={{ ...FONT.mono, fontSize: isMobile ? 13 : 15, color: s.color || C.ink, marginTop: 4, fontWeight: 500, lineHeight: 1.2 }}>
                {s.value}
              </div>
              {s.sub && (
                <div style={{ ...FONT.body, fontSize: isMobile ? 9 : 10, color: C.muted, marginTop: 2 }}>{s.sub}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LegendSwatch({ color, label, solid, dashed }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <svg width={22} height={8}>
        <line
          x1={0}
          y1={4}
          x2={22}
          y2={4}
          stroke={color}
          strokeWidth={solid ? 2.5 : 1.5}
          strokeDasharray={dashed ? "3 3" : ""}
        />
      </svg>
      <span style={{ ...FONT.body, fontSize: 11, color: C.ink2 }}>{label}</span>
    </div>
  );
}

function formatRelDays(days) {
  if (days === 0) return "Today";
  const months = Math.round(days / 30);
  if (months < 12) return `+${months}mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `+${years}y`;
  return `+${years}y ${rem}mo`;
}

function MTMTrajectoryChart({ holdings }) {
  const { isMobile } = useViewport();

  const {
    chartData,
    totalCost,
    currentMV,
    projectedTotal,
    minTotal,
    maxTotal,
    maturityEvents,
  } = useMemo(() => {
    if (holdings.length === 0) return { chartData: [] };

    const enriched = holdings.map((h) => {
      const inv = INVESTMENTS.find((i) => i.id === h.id);
      const currMV = h.qty * inv.optionPrice;
      const base = h.qty * h.entryPrice;
      const payoffMultiples = inv.scenarios.map((s) => s.payoff);
      return {
        id: inv.id,
        name: inv.name,
        codename: inv.codename,
        currentMV: currMV,
        projectedPayoff: base * inv.expectedPayoff,
        worstPayoff: base * Math.min(...payoffMultiples),
        bestPayoff: base * Math.max(...payoffMultiples),
        daysToMaturity: inv.daysToMaturity,
        maturity: inv.maturity,
      };
    });

    const maxDays = Math.max(...enriched.map((e) => e.daysToMaturity));

    // Information events occur every INFO_INTERVAL days (quarterly) for each holding,
    // plus at maturity. Between events, MV is flat. At each event, MV steps toward
    // projected based on time-elapsed fraction.
    const INFO_INTERVAL = 90;

    // Collect every event day (today + each holding's quarterly events + each maturity)
    const sampleSet = new Set([0]);
    enriched.forEach((e) => {
      for (let d = INFO_INTERVAL; d < e.daysToMaturity; d += INFO_INTERVAL) {
        sampleSet.add(d);
      }
      sampleSet.add(e.daysToMaturity);
    });
    const sortedDays = Array.from(sampleSet).sort((a, b) => a - b);

    const points = sortedDays.map((t) => {
      let projected = 0;
      let worstBand = 0;
      let bestBand = 0;

      enriched.forEach((e) => {
        if (t >= e.daysToMaturity) {
          // Matured: locked at projected payoff (realized value)
          projected += e.projectedPayoff;
          worstBand += e.projectedPayoff;
          bestBand += e.projectedPayoff;
          return;
        }
        // Find the most recent info event day <= t for THIS holding
        const lastEventDay = Math.floor(t / INFO_INTERVAL) * INFO_INTERVAL;
        const effectiveDay = Math.min(lastEventDay, e.daysToMaturity);
        const prog = effectiveDay / e.daysToMaturity;
        const start = e.currentMV;
        // At each event, MV reflects information revealed up to that event —
        // a fraction of the way toward the projected endpoint.
        const expected = start + prog * (e.projectedPayoff - start);
        const worst = start + prog * (e.worstPayoff - start);
        const best = start + prog * (e.bestPayoff - start);
        projected += expected;
        worstBand += worst;
        bestBand += best;
      });

      const maturedHere = enriched.find((e) => e.daysToMaturity === t);
      return {
        t,
        projected: Math.round(projected),
        worst: Math.round(worstBand),
        best: Math.round(bestBand),
        band: Math.round(bestBand - worstBand),
        label: maturedHere ? maturedHere.maturity : formatRelDays(t),
        event: maturedHere ? maturedHere.name : null,
        isMaturity: !!maturedHere,
      };
    });

    const totalCost = holdings.reduce((s, h) => s + h.qty * h.entryPrice, 0);
    const currentMV = enriched.reduce((s, e) => s + e.currentMV, 0);
    const projectedTotal = enriched.reduce((s, e) => s + e.projectedPayoff, 0);
    const minTotal = enriched.reduce((s, e) => s + e.worstPayoff, 0);
    const maxTotal = enriched.reduce((s, e) => s + e.bestPayoff, 0);

    return {
      chartData: points,
      totalCost,
      currentMV,
      projectedTotal,
      minTotal,
      maxTotal,
      maturityEvents: enriched.map((e) => ({ day: e.daysToMaturity, name: e.name, maturity: e.maturity })),
    };
  }, [holdings]);

  if (holdings.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.line}`,
        padding: isMobile ? 16 : 22,
        marginBottom: isMobile ? 20 : 28,
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ ...FONT.body, fontSize: 10, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Mark-to-Market Trajectory
          </div>
          <div style={{ ...FONT.editorial, fontSize: isMobile ? 16 : 18, color: C.ink, fontWeight: 500, letterSpacing: -0.3 }}>
            Expected portfolio value path
          </div>
        </div>
      </div>
      <p style={{ ...FONT.body, fontSize: 12, color: C.muted, lineHeight: 1.6, margin: 0, marginBottom: 16, maxWidth: 640 }}>
        Step function: MV stays flat between information events and jumps at each event. Information events for these contracts are quarterly index publications, appraisal windows, trigger checks, and maturity resolutions. The cone shows the worst-case / best-case range and resolves at each maturity (burgundy dots).
      </p>

      {/* Chart */}
      <div style={{ height: isMobile ? 240 : 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: isMobile ? -10 : 10, top: 10, right: 20, bottom: 10 }}>
            <defs>
              <linearGradient id="mtmConeGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={C.accent} stopOpacity={0.18} />
                <stop offset="100%" stopColor={C.accent} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={C.line2} />
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, "dataMax"]}
              tick={{ fontSize: isMobile ? 9 : 10, fill: C.muted, fontFamily: "IBM Plex Mono" }}
              axisLine={{ stroke: C.line }}
              tickLine={false}
              tickFormatter={(v) => formatRelDays(v)}
              ticks={(() => {
                // Pick reasonable tick spacing
                const maxT = Math.max(...chartData.map((p) => p.t));
                const step = maxT > 365 * 2 ? 365 : maxT > 365 ? 180 : 90;
                const ticks = [0];
                for (let d = step; d <= maxT; d += step) ticks.push(d);
                return ticks;
              })()}
            />
            <YAxis
              tick={{ fontSize: 10, fill: C.muted, fontFamily: "IBM Plex Mono" }}
              axisLine={{ stroke: C.line }}
              tickLine={false}
              tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "K"}
            />
            <Tooltip
              contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, fontFamily: "IBM Plex Sans", fontSize: 12, borderRadius: 2 }}
              formatter={(v, n) => {
                const labels = { projected: "Projected MV", worst: "Lower bound", best: "Upper bound", band: null };
                if (labels[n] === null) return [null, null];
                return ["$" + Number(v).toLocaleString(), labels[n] || n];
              }}
              labelFormatter={(l, payload) => {
                const p = payload && payload[0] && payload[0].payload;
                if (!p) return formatRelDays(l);
                return p.event ? `${p.label} · ${p.event}` : p.label;
              }}
            />

            {/* Maturity vertical markers */}
            {maturityEvents.map((m) => (
              <ReferenceLine
                key={m.day}
                x={m.day}
                stroke={C.accent}
                strokeDasharray="2 3"
                strokeOpacity={0.5}
              />
            ))}

            {/* Cone (band between worst and best) - steps at each info event */}
            <Area
              type="stepAfter"
              dataKey="worst"
              stackId="cone"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />
            <Area
              type="stepAfter"
              dataKey="band"
              stackId="cone"
              stroke="none"
              fill="url(#mtmConeGradient)"
              isAnimationActive={false}
            />

            {/* Cost basis reference */}
            <ReferenceLine
              y={totalCost}
              stroke={C.muted}
              strokeDasharray="4 4"
              label={{
                value: "Cost basis",
                fill: C.muted,
                fontSize: 10,
                fontFamily: "IBM Plex Sans",
                position: "insideTopRight",
              }}
            />

            {/* Upper / lower bound lines - stepped */}
            <Line
              type="stepAfter"
              dataKey="worst"
              stroke={C.muted}
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="best"
              stroke={C.pos}
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />

            {/* Main expected MV line - stepped */}
            <Line
              type="stepAfter"
              dataKey="projected"
              stroke={C.accent}
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!payload.isMaturity) return null;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={C.accent}
                    stroke={C.surface}
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 5, fill: C.accent, stroke: C.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 10 : 16, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line2}` }}>
        <LegendSwatch color={C.accent} label="Projected MV (step)" solid />
        <LegendSwatch color={C.pos} label="Upper bound" dashed />
        <LegendSwatch color={C.muted} label="Lower bound" dashed />
        <LegendSwatch color={C.muted} label="Cost basis" dashed />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 2, height: 10, background: `repeating-linear-gradient(${C.accent}, ${C.accent} 2px, transparent 2px, transparent 4px)`, opacity: 0.6 }} />
          <span style={{ ...FONT.body, fontSize: 11, color: C.ink2 }}>Maturity event</span>
        </div>
      </div>

      {/* Summary tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 0,
          marginTop: 16,
          border: `1px solid ${C.line}`,
        }}
      >
        {[
          {
            label: "Current MV",
            value: "$" + Math.round(currentMV).toLocaleString(),
            sub: currentMV >= totalCost ? `+$${Math.round(currentMV - totalCost).toLocaleString()} vs cost` : `-$${Math.round(totalCost - currentMV).toLocaleString()} vs cost`,
            subColor: currentMV >= totalCost ? C.pos : C.neg,
          },
          {
            label: "Projected at maturity",
            value: "$" + Math.round(projectedTotal).toLocaleString(),
            sub: `${(projectedTotal / Math.max(currentMV, 1)).toFixed(2)}× current MV`,
            color: C.accent,
          },
          {
            label: "Upside scenario",
            value: "$" + Math.round(maxTotal).toLocaleString(),
            sub: `${(maxTotal / Math.max(totalCost, 1)).toFixed(2)}× cost`,
            color: C.pos,
          },
          {
            label: "Downside scenario",
            value: "$" + Math.round(minTotal).toLocaleString(),
            sub: `${(minTotal / Math.max(totalCost, 1)).toFixed(2)}× cost`,
            color: minTotal < totalCost ? C.neg : C.ink,
          },
        ].map((s, i) => {
          const borderR = isMobile ? (i % 2 === 0 ? `1px solid ${C.line}` : "none") : (i < 3 ? `1px solid ${C.line}` : "none");
          const borderB = isMobile && i < 2 ? `1px solid ${C.line}` : "none";
          return (
            <div key={i} style={{ padding: isMobile ? "10px 12px" : "12px 14px", borderRight: borderR, borderBottom: borderB }}>
              <div style={{ ...FONT.body, fontSize: isMobile ? 9 : 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontWeight: 500 }}>
                {s.label}
              </div>
              <div style={{ ...FONT.mono, fontSize: isMobile ? 13 : 15, color: s.color || C.ink, marginTop: 4, fontWeight: 500, lineHeight: 1.2 }}>
                {s.value}
              </div>
              {s.sub && (
                <div style={{ ...FONT.body, ...FONT.mono, fontSize: isMobile ? 9 : 10, color: s.subColor || C.muted, marginTop: 2 }}>
                  {s.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Caveat */}
      <div
        style={{
          ...FONT.body,
          fontSize: 11,
          color: C.muted,
          lineHeight: 1.6,
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${C.line2}`,
          fontStyle: "italic",
        }}
      >
        <Info size={10} style={{ display: "inline", marginRight: 4 }} />
        Illustrative projection assuming quarterly information events. Actual event cadence varies by contract — parametric triggers publish monthly, appraisal events occur at designated windows. Realized MV path will depend on trigger outcomes, appraisal timing, and secondary-market liquidity.
      </div>
    </div>
  );
}

// ============================================================
// REQUEST A MARKET
// ============================================================

function RequestMarketPage({ requests, likedIds, userCommits, onToggleLike, onCommit, onSubmitRequest, onSelectMarket }) {
  const { isMobile } = useViewport();
  const [tab, setTab] = useState("queue");
  const [commitTarget, setCommitTarget] = useState(null);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "20px 16px 60px 16px" : "32px 32px 80px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 18 : 24 }}>
        <div style={{ ...FONT.body, fontSize: isMobile ? 10 : 11, color: C.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
          Origination Queue
        </div>
        <h1 style={{ ...FONT.display, fontSize: isMobile ? 30 : 44, color: C.ink, margin: 0, fontWeight: 400, letterSpacing: -1, lineHeight: 1.1 }}>
          Request a market
        </h1>
        <p style={{ ...FONT.editorial, fontSize: isMobile ? 14 : 16, color: C.ink2, maxWidth: 680, lineHeight: 1.6, marginTop: 12, fontStyle: "italic" }}>
          Browse exposures other investors want to see listed. Like to signal interest; commit to indicate you'd buy if a market becomes available. Aji's origination team uses these signals to prioritize contract sourcing.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.line}`, marginBottom: isMobile ? 18 : 24 }}>
        {[
          { id: "queue", label: `Community Queue${requests.length ? ` (${requests.length})` : ""}` },
          { id: "submit", label: "Submit New Request" },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                ...FONT.body,
                fontSize: isMobile ? 12 : 13,
                fontWeight: 500,
                color: active ? C.ink : C.muted,
                border: "none",
                background: "transparent",
                padding: isMobile ? "11px 14px" : "12px 18px",
                cursor: "pointer",
                borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent",
                marginBottom: -1,
                letterSpacing: 0.2,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "queue" && (
        <CommunityQueue
          requests={requests}
          likedIds={likedIds}
          userCommits={userCommits}
          onToggleLike={onToggleLike}
          onCommit={(r) => setCommitTarget(r)}
          onSelectMarket={onSelectMarket}
        />
      )}

      {tab === "submit" && (
        <SubmitForm
          onSubmit={(payload) => {
            onSubmitRequest(payload);
            setTab("queue");
            window.scrollTo(0, 0);
          }}
        />
      )}

      {commitTarget && (
        <CommitModal
          request={commitTarget}
          existingCommit={userCommits[commitTarget.id] || 0}
          onClose={() => setCommitTarget(null)}
          onConfirm={(size) => {
            onCommit(commitTarget.id, size);
            setCommitTarget(null);
          }}
        />
      )}
    </div>
  );
}

function CommunityQueue({ requests, likedIds, userCommits, onToggleLike, onCommit, onSelectMarket }) {
  const { isMobile } = useViewport();
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("committed");

  const filtered = useMemo(() => {
    let out = [...requests];
    if (statusFilter !== "all") out = out.filter((r) => r.status === statusFilter);
    if (sortBy === "committed") out.sort((a, b) => b.totalCommitted - a.totalCommitted);
    if (sortBy === "likes") out.sort((a, b) => b.likes - a.likes);
    if (sortBy === "newest") out.sort((a, b) => a.submittedDaysAgo - b.submittedDaysAgo);
    if (sortBy === "status") {
      const rank = { live: 0, reviewing: 1, queued: 2, passed: 3 };
      out.sort((a, b) => rank[a.status] - rank[b.status]);
    }
    return out;
  }, [requests, statusFilter, sortBy]);

  const totalCommitted = requests.reduce((s, r) => s + r.totalCommitted, 0);
  const liveCount = requests.filter((r) => r.status === "live").length;

  return (
    <div>
      {/* Summary strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 0,
          marginBottom: isMobile ? 16 : 20,
          border: `1px solid ${C.line}`,
          backgroundColor: C.surface,
        }}
      >
        {[
          { label: "Open requests", value: requests.length },
          { label: "In review", value: requests.filter((r) => r.status === "reviewing").length },
          { label: "Listed", value: liveCount },
          { label: "Total committed", value: "$" + (totalCommitted / 1_000_000).toFixed(1) + "M" },
        ].map((s, i) => {
          const borderR = isMobile ? (i % 2 === 0 ? `1px solid ${C.line}` : "none") : (i < 3 ? `1px solid ${C.line}` : "none");
          const borderB = isMobile && i < 2 ? `1px solid ${C.line}` : "none";
          return (
            <div key={i} style={{ padding: isMobile ? "12px 14px" : "14px 18px", borderRight: borderR, borderBottom: borderB }}>
              <div style={{ ...FONT.body, fontSize: isMobile ? 9 : 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontWeight: 500 }}>
                {s.label}
              </div>
              <div style={{ ...FONT.mono, fontSize: isMobile ? 18 : 20, color: C.ink, marginTop: 4, fontWeight: 500 }}>
                {s.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 2, backgroundColor: C.line2, padding: 3, borderRadius: 2, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {[
            { id: "all", label: "All" },
            { id: "queued", label: "Queued" },
            { id: "reviewing", label: "In review" },
            { id: "live", label: "Listed" },
            { id: "passed", label: "Passed" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              style={{
                ...FONT.body,
                fontSize: isMobile ? 11 : 12,
                fontWeight: 500,
                padding: isMobile ? "7px 12px" : "7px 14px",
                border: "none",
                backgroundColor: statusFilter === t.id ? C.surface : "transparent",
                color: statusFilter === t.id ? C.ink : C.muted,
                cursor: "pointer",
                borderRadius: 2,
                letterSpacing: 0.2,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            ...FONT.body,
            fontSize: 12,
            padding: "8px 12px",
            border: `1px solid ${C.line}`,
            backgroundColor: C.surface,
            color: C.ink,
            borderRadius: 2,
            cursor: "pointer",
          }}
        >
          <option value="committed">Most committed capital</option>
          <option value="likes">Most liked</option>
          <option value="newest">Newest first</option>
          <option value="status">By status</option>
        </select>
      </div>

      {/* Request cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 12 }}>
        {filtered.map((r) => (
          <RequestCard
            key={r.id}
            request={r}
            liked={likedIds.has(r.id)}
            userCommit={userCommits[r.id] || 0}
            onToggleLike={() => onToggleLike(r.id)}
            onCommit={() => onCommit(r)}
            onSelectMarket={onSelectMarket}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 60, textAlign: "center", color: C.muted, ...FONT.body, fontSize: 13 }}>
          No requests match this filter.
        </div>
      )}
    </div>
  );
}

function RequestCard({ request, liked, userCommit, onToggleLike, onCommit, onSelectMarket }) {
  const { isMobile } = useViewport();
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    queued: { label: "Queued", color: C.muted, bg: C.line2, dot: C.muted },
    reviewing: { label: "In review", color: C.accent, bg: C.accentSoft, dot: C.accent },
    live: { label: "Listed", color: C.pos, bg: C.posSoft, dot: C.pos },
    passed: { label: "Passed", color: C.muted, bg: C.line2, dot: C.muted },
  };
  const s = statusConfig[request.status];
  const isPassed = request.status === "passed";
  const isLive = request.status === "live";

  const timeAgo = request.submittedDaysAgo === 0 ? "just now" : request.submittedDaysAgo + "d ago";

  return (
    <div
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${s.dot}`,
        padding: isMobile ? 16 : 20,
        opacity: isPassed ? 0.55 : 1,
        borderRadius: 2,
      }}
    >
      {/* Top row: status + tags + time */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <span
          style={{
            ...FONT.body,
            fontSize: 10,
            color: s.color,
            backgroundColor: s.bg,
            padding: "3px 8px",
            borderRadius: 2,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: s.dot }} />
          {s.label}
        </span>
        <Tag tone="default" small>{request.sector}</Tag>
        <Tag tone="muted" small>{request.triggerType}</Tag>
        {request.isOwn && <Tag tone="accent" small>Your submission</Tag>}
        <div style={{ flex: 1 }} />
        <span style={{ ...FONT.mono, fontSize: 10, color: C.muted, letterSpacing: 0.5 }}>{timeAgo}</span>
      </div>

      {/* Title */}
      <div style={{ ...FONT.editorial, fontSize: isMobile ? 17 : 19, color: C.ink, fontWeight: 500, lineHeight: 1.25, marginBottom: 6 }}>
        {request.title}
      </div>

      {/* Drivers */}
      <div style={{ ...FONT.body, fontSize: 12, color: C.muted, marginBottom: 10, letterSpacing: 0.2 }}>
        {request.driver}
      </div>

      {/* Description (expandable) */}
      <div
        style={{
          ...FONT.body,
          fontSize: 13,
          color: C.ink2,
          lineHeight: 1.6,
          marginBottom: 12,
          maxHeight: expanded ? "none" : isMobile ? 54 : 48,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {request.description}
      </div>
      {request.description.length > 120 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            ...FONT.body,
            fontSize: 11,
            color: C.accent,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontWeight: 500,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          {expanded ? "Show less ↑" : "Show more ↓"}
        </button>
      )}

      {/* Meta row */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          gap: isMobile ? 6 : 12,
          padding: "10px 0",
          borderTop: `1px solid ${C.line2}`,
          borderBottom: `1px solid ${C.line2}`,
          marginBottom: 12,
        }}
      >
        <div style={{ ...FONT.body, fontSize: 11, color: C.muted }}>
          <span style={{ color: C.ink2, fontWeight: 500 }}>{request.submitterClass}</span>
          {" · "}{request.submitterLocation}
        </div>
        <div style={{ ...FONT.mono, fontSize: 11, color: C.ink2, letterSpacing: 0.3 }}>
          {request.sizeWindow} · Matures {request.maturityWindow}
        </div>
      </div>

      {/* Actions row */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button
            onClick={onToggleLike}
            disabled={isPassed}
            style={{
              ...FONT.body,
              fontSize: 12,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              border: `1px solid ${liked ? C.accent : C.line}`,
              backgroundColor: liked ? C.accentSoft : "transparent",
              color: liked ? C.accent : C.ink2,
              borderRadius: 2,
              cursor: isPassed ? "not-allowed" : "pointer",
              letterSpacing: 0.2,
            }}
          >
            <Heart size={13} fill={liked ? C.accent : "none"} color={liked ? C.accent : C.ink2} />
            {request.likes}
          </button>
          <div style={{ ...FONT.body, fontSize: 11, color: C.muted, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Users size={12} />
            {request.commitCount} {request.commitCount === 1 ? "investor" : "investors"} committed
            <span style={{ ...FONT.mono, color: C.ink2, marginLeft: 4 }}>
              ${(request.totalCommitted / 1_000_000).toFixed(1)}M
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {isLive && request.liveMarketId && (
            <button
              onClick={() => onSelectMarket(request.liveMarketId)}
              style={{
                ...FONT.body,
                fontSize: 12,
                fontWeight: 500,
                padding: "8px 14px",
                border: "none",
                backgroundColor: C.accent,
                color: "#FFFFFF",
                borderRadius: 2,
                cursor: "pointer",
                letterSpacing: 0.3,
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                width: isMobile ? "100%" : "auto",
                justifyContent: "center",
              }}
            >
              View Market <ArrowRight size={13} />
            </button>
          )}
          {!isLive && !isPassed && (
            <button
              onClick={onCommit}
              style={{
                ...FONT.body,
                fontSize: 12,
                fontWeight: 500,
                padding: "8px 14px",
                border: userCommit > 0 ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
                backgroundColor: userCommit > 0 ? C.accentSoft : "transparent",
                color: userCommit > 0 ? C.accent : C.ink,
                borderRadius: 2,
                cursor: "pointer",
                letterSpacing: 0.3,
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                width: isMobile ? "100%" : "auto",
                justifyContent: "center",
              }}
            >
              {userCommit > 0 ? (
                <>
                  <Check size={13} /> You committed ${(userCommit / 1_000_000).toFixed(1)}M
                </>
              ) : (
                <>
                  Commit to Buy <ArrowRight size={13} />
                </>
              )}
            </button>
          )}
          {isPassed && (
            <span
              style={{
                ...FONT.body,
                fontSize: 11,
                color: C.muted,
                fontStyle: "italic",
                padding: "8px 14px",
                textAlign: isMobile ? "center" : "right",
              }}
            >
              Aji passed on this request
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CommitModal({ request, existingCommit, onClose, onConfirm }) {
  const { isMobile } = useViewport();
  const [size, setSize] = useState(existingCommit || 1_000_000);
  const [step, setStep] = useState(1_000_000);

  const presets = [500_000, 1_000_000, 5_000_000, 10_000_000];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(26, 20, 16, 0.55)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 24,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          backgroundColor: C.surface,
          maxWidth: 540,
          width: "100%",
          maxHeight: isMobile ? "92vh" : "calc(100vh - 48px)",
          padding: isMobile ? "24px 20px" : 32,
          borderRadius: 2,
          border: `1px solid ${C.line}`,
          overflowY: "auto",
        }}
      >
        <div style={{ ...FONT.body, fontSize: 10, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
          Commit to Buy
        </div>
        <h2 style={{ ...FONT.display, fontSize: isMobile ? 20 : 24, color: C.ink, margin: 0, fontWeight: 500, letterSpacing: -0.5, marginBottom: 8, lineHeight: 1.25 }}>
          {request.title}
        </h2>
        <div style={{ ...FONT.body, fontSize: 12, color: C.muted, marginBottom: 20 }}>
          {request.sector} · {request.sizeWindow} · Matures {request.maturityWindow}
        </div>

        <div
          style={{
            padding: "12px 14px",
            backgroundColor: C.accentSoft,
            borderLeft: `2px solid ${C.accent}`,
            ...FONT.body,
            fontSize: 12,
            color: C.ink2,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          Indicate the size you'd buy at listing. This is a non-binding signal that gives you priority allocation and early notification when Aji originates this market. You can adjust or withdraw it at any time.
        </div>

        <div style={{ ...FONT.body, fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
          Commit size (USD)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setSize(Math.max(0, size - step))}
            style={{ border: `1px solid ${C.line}`, backgroundColor: C.surface, padding: 10, cursor: "pointer", borderRadius: 2, flexShrink: 0 }}
          >
            <Minus size={14} />
          </button>
          <div
            style={{
              ...FONT.mono,
              fontSize: 20,
              textAlign: "center",
              border: `1px solid ${C.line}`,
              padding: "10px 12px",
              flex: 1,
              color: C.ink,
              borderRadius: 2,
              fontWeight: 500,
              backgroundColor: C.bg,
            }}
          >
            ${size.toLocaleString()}
          </div>
          <button
            onClick={() => setSize(size + step)}
            style={{ border: `1px solid ${C.line}`, backgroundColor: C.surface, padding: 10, cursor: "pointer", borderRadius: 2, flexShrink: 0 }}
          >
            <Plus size={14} />
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={50_000_000}
          step={500_000}
          value={size}
          onChange={(e) => setSize(+e.target.value)}
          style={{ width: "100%", accentColor: C.accent, marginBottom: 14 }}
        />
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setSize(p)}
              style={{
                ...FONT.body,
                fontSize: 11,
                padding: "6px 10px",
                border: `1px solid ${C.line}`,
                background: size === p ? C.accent : "transparent",
                color: size === p ? "#FFFFFF" : C.ink2,
                cursor: "pointer",
                flex: 1,
                minWidth: 70,
                borderRadius: 2,
                fontWeight: 500,
              }}
            >
              ${(p / 1_000_000).toFixed(p < 1_000_000 ? 1 : 0)}M
            </button>
          ))}
        </div>

        <div
          style={{
            ...FONT.body,
            fontSize: 11,
            color: C.muted,
            lineHeight: 1.6,
            marginBottom: 20,
            paddingTop: 14,
            borderTop: `1px solid ${C.line2}`,
          }}
        >
          <Info size={10} style={{ display: "inline", marginRight: 4 }} />
          Non-binding. If the market lists, Aji will contact you with final terms and you can confirm or decline at that point.
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: isMobile ? "stretch" : "flex-end", flexDirection: isMobile ? "column-reverse" : "row" }}>
          {existingCommit > 0 && (
            <button
              onClick={() => onConfirm(0)}
              style={{
                ...FONT.body,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                padding: "12px 18px",
                borderRadius: 2,
                cursor: "pointer",
                border: `1px solid ${C.line}`,
                backgroundColor: "transparent",
                color: C.neg,
                width: isMobile ? "100%" : "auto",
              }}
            >
              Withdraw Commitment
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              ...FONT.body,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              padding: "12px 22px",
              borderRadius: 2,
              cursor: "pointer",
              border: `1px solid ${C.line}`,
              backgroundColor: "transparent",
              color: C.ink,
              width: isMobile ? "100%" : "auto",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(size)}
            disabled={size === 0 || size === existingCommit}
            style={{
              ...FONT.body,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              padding: "12px 22px",
              borderRadius: 2,
              cursor: size === 0 || size === existingCommit ? "not-allowed" : "pointer",
              border: "none",
              backgroundColor: C.accent,
              color: "#FFFFFF",
              opacity: size === 0 || size === existingCommit ? 0.4 : 1,
              width: isMobile ? "100%" : "auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {existingCommit > 0 ? "Update Commit" : "Confirm Commit"} <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmitForm({ onSubmit }) {
  const { isMobile } = useViewport();
  const [title, setTitle] = useState("");
  const [sector, setSector] = useState("");
  const [driver, setDriver] = useState("");
  const [trigger, setTrigger] = useState("");
  const [maturity, setMaturity] = useState("");
  const [size, setSize] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = sector && driver && notes;

  return (
    <div style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, padding: isMobile ? 22 : 32 }}>
      <p style={{ ...FONT.body, fontSize: 13, color: C.ink2, lineHeight: 1.6, margin: 0, marginBottom: 20 }}>
        Your submission will be posted to the Community Queue and visible to other investors. Aji's origination team reviews new requests weekly. Details you provide help us prioritize and source counterparties.
      </p>
      <FormField label="Request title (optional)">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Nordic cheap-power AI training capacity"
          style={inputStyle}
        />
      </FormField>
      <FormField label="Sector">
        <input
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          placeholder="e.g. Data Center, Transmission, Port"
          style={inputStyle}
        />
      </FormField>
      <FormField label="Primary driver(s)">
        <input
          value={driver}
          onChange={(e) => setDriver(e.target.value)}
          placeholder="e.g. AI compute demand, grid congestion"
          style={inputStyle}
        />
      </FormField>
      <FormField label="Preferred trigger type">
        <select value={trigger} onChange={(e) => setTrigger(e.target.value)} style={inputStyle}>
          <option value="">Select...</option>
          <option>Parametric</option>
          <option>Appraisal</option>
          <option>Mixed</option>
        </select>
      </FormField>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 0 : 20 }}>
        <FormField label="Maturity window">
          <input
            value={maturity}
            onChange={(e) => setMaturity(e.target.value)}
            placeholder="e.g. 2028–2030"
            style={inputStyle}
          />
        </FormField>
        <FormField label="Target size (USD)">
          <input
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="e.g. $5M–$20M"
            style={inputStyle}
          />
        </FormField>
      </div>
      <FormField label="What exposure are you trying to create or hedge?">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe the bet or hedge. E.g., 'Long exposure to ERCOT transmission constraints through 2030' or 'Hedge against a collapse in Irish data-center demand.'"
          rows={5}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        />
      </FormField>
      <div style={{ display: "flex", justifyContent: isMobile ? "stretch" : "flex-end", marginTop: 16 }}>
        <div style={{ width: isMobile ? "100%" : "auto" }}>
          <button
            onClick={() =>
              onSubmit({ title, sector, driver, trigger, maturity, size, notes })
            }
            disabled={!canSubmit}
            style={{
              ...FONT.body,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              padding: "12px 22px",
              borderRadius: 2,
              cursor: !canSubmit ? "not-allowed" : "pointer",
              border: "none",
              backgroundColor: C.accent,
              color: "#FFFFFF",
              opacity: !canSubmit ? 0.4 : 1,
              width: isMobile ? "100%" : "auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            Post to Community Queue <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <div
        style={{
          ...FONT.body,
          fontSize: 11,
          color: C.muted,
          lineHeight: 1.5,
          marginTop: 16,
          paddingTop: 14,
          borderTop: `1px solid ${C.line2}`,
        }}
      >
        <Info size={10} style={{ display: "inline", marginRight: 4 }} />
        Submitter class and location are shown anonymized (e.g., "Infrastructure Debt Fund · Geneva"). Your name and firm are not disclosed.
      </div>
    </div>
  );
}

const inputStyle = {
  ...FONT.body,
  fontSize: 13,
  padding: "10px 12px",
  border: `1px solid ${C.line}`,
  width: "100%",
  outline: "none",
  color: C.ink,
  backgroundColor: C.surface,
  borderRadius: 2,
  boxSizing: "border-box",
};

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ ...FONT.body, fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontWeight: 500, display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ============================================================
// TOAST
// ============================================================

function Toast({ message, onAction, actionLabel, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 60,
        backgroundColor: C.ink,
        color: C.bg,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderRadius: 2,
        boxShadow: "0 4px 24px rgba(26, 20, 16, 0.2)",
      }}
    >
      <Check size={16} color={C.pos} />
      <span style={{ ...FONT.body, fontSize: 13 }}>{message}</span>
      {onAction && (
        <button
          onClick={onAction}
          style={{
            ...FONT.body,
            fontSize: 11,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            fontWeight: 600,
            color: C.accentDim,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

function App() {
  const [buyerClass, setBuyerClass] = useState("qib");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [page, setPage] = useState("markets");
  const [currentId, setCurrentId] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingQty, setPendingQty] = useState(0);
  const [toast, setToast] = useState(null);

  // Community requests state
  const [requests, setRequests] = useState(COMMUNITY_REQUESTS);
  const [likedIds, setLikedIds] = useState(new Set());
  const [userCommits, setUserCommits] = useState({}); // { [requestId]: size }

  // Inject Google Fonts once
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Red+Rose:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    document.body.style.backgroundColor = C.bg;
    document.body.style.margin = "0";
    return () => {
      try {
        document.head.removeChild(link);
      } catch (e) {}
    };
  }, []);

  const currentInv = INVESTMENTS.find((i) => i.id === currentId);

  function handleSelect(id) {
    setCurrentId(id);
    setPage("detail");
    window.scrollTo(0, 0);
  }

  function handleBuy() {
    setPage("buy");
    window.scrollTo(0, 0);
  }

  function handleConfirm(qty) {
    setPendingQty(qty);
    setShowConfirm(true);
  }

  function handleFinalize() {
    setHoldings((prev) => {
      const existing = prev.find((h) => h.id === currentId);
      if (existing) {
        return prev.map((h) =>
          h.id === currentId
            ? { ...h, qty: h.qty + pendingQty, entryPrice: (h.entryPrice * h.qty + currentInv.optionPrice * pendingQty) / (h.qty + pendingQty) }
            : h
        );
      }
      return [...prev, { id: currentId, qty: pendingQty, entryPrice: currentInv.optionPrice }];
    });
    setShowConfirm(false);
    setToast({
      message: `Purchased ${pendingQty.toLocaleString()} units of ${currentInv.name}.`,
      action: () => {
        setPage("portfolio");
        setToast(null);
      },
      label: "View Portfolio",
    });
    setPage("detail");
    window.scrollTo(0, 0);
  }

  function handleNav(p) {
    setPage(p);
    window.scrollTo(0, 0);
  }

  function handleToggleLike(reqId) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      const wasLiked = next.has(reqId);
      if (wasLiked) next.delete(reqId);
      else next.add(reqId);
      // update the request's like count
      setRequests((rs) =>
        rs.map((r) => (r.id === reqId ? { ...r, likes: r.likes + (wasLiked ? -1 : 1) } : r))
      );
      return next;
    });
  }

  function handleCommit(reqId, size) {
    const existing = userCommits[reqId] || 0;
    const delta = size - existing;
    setUserCommits((prev) => ({ ...prev, [reqId]: size }));
    setRequests((rs) =>
      rs.map((r) => {
        if (r.id !== reqId) return r;
        const wasCommitted = existing > 0;
        const isCommitted = size > 0;
        let commitCount = r.commitCount;
        if (!wasCommitted && isCommitted) commitCount += 1;
        if (wasCommitted && !isCommitted) commitCount -= 1;
        return { ...r, commitCount, totalCommitted: Math.max(0, r.totalCommitted + delta) };
      })
    );
    if (size > 0) {
      setToast({
        message: `Committed $${size.toLocaleString()} — you'll be notified if this market lists.`,
        onDismiss: () => setToast(null),
      });
    }
  }

  function handleSubmitRequest(payload) {
    const newReq = {
      id: "req_user_" + Date.now(),
      title: payload.title || payload.sector + " · " + payload.driver.slice(0, 40),
      sector: payload.sector,
      driver: payload.driver,
      triggerType: payload.trigger || "Mixed",
      maturityWindow: payload.maturity || "TBD",
      sizeWindow: payload.size || "TBD",
      description: payload.notes || "No description provided.",
      submitterClass: "You",
      submitterLocation: "Your submission",
      submittedDaysAgo: 0,
      likes: 0,
      commitCount: 0,
      totalCommitted: 0,
      status: "queued",
      liveMarketId: null,
      isOwn: true,
    };
    setRequests((rs) => [newReq, ...rs]);
    setToast({
      message: "Request submitted. Aji's origination team reviews weekly.",
      onDismiss: () => setToast(null),
    });
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, ...FONT.body, color: C.ink }}>
      {showOnboarding && (
        <OnboardingModal
          currentClass={buyerClass}
          onSelect={(cls) => {
            setBuyerClass(cls);
            setShowOnboarding(false);
          }}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}
      <TopNav
        buyerClass={buyerClass}
        currentPage={page}
        onNav={handleNav}
        onChangeClass={() => setShowOnboarding(true)}
        holdingsCount={holdings.length}
      />

      {page === "markets" && <MarketsPage onSelect={handleSelect} />}
      {page === "detail" && currentInv && (
        <DetailPage inv={currentInv} onBack={() => setPage("markets")} onBuy={handleBuy} />
      )}
      {page === "buy" && currentInv && (
        <BuyPage inv={currentInv} onBack={() => setPage("detail")} onConfirm={handleConfirm} />
      )}
      {page === "portfolio" && <PortfolioPage holdings={holdings} onSelect={handleSelect} />}
      {page === "request" && (
        <RequestMarketPage
          requests={requests}
          likedIds={likedIds}
          userCommits={userCommits}
          onToggleLike={handleToggleLike}
          onCommit={handleCommit}
          onSubmitRequest={handleSubmitRequest}
          onSelectMarket={handleSelect}
        />
      )}

      {showConfirm && currentInv && (
        <ConfirmModal
          inv={currentInv}
          qty={pendingQty}
          onClose={() => setShowConfirm(false)}
          onConfirmed={handleFinalize}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          onAction={toast.action}
          actionLabel={toast.label}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

function Footer() {
  const { isMobile } = useViewport();
  return (
    <div
      style={{
        maxWidth: 1440,
        margin: "0 auto",
        padding: isMobile ? "24px 16px 36px 16px" : "32px 32px 48px 32px",
        borderTop: `1px solid ${C.line}`,
        marginTop: isMobile ? 40 : 60,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? 14 : 0,
        ...FONT.body,
        fontSize: 11,
        color: C.muted,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ ...FONT.display, fontSize: 14, color: C.ink, fontWeight: 500, letterSpacing: -0.3 }}>Aji</span>
        <span>Exchange · Prototype · Not a solicitation</span>
      </div>
      <div style={{ display: "flex", gap: isMobile ? 16 : 24 }}>
        <span style={{ cursor: "pointer" }}>Disclosures</span>
        <span style={{ cursor: "pointer" }}>Risk Factors</span>
        <span style={{ cursor: "pointer" }}>Contact</span>
      </div>
    </div>
  );
}

export default App;
