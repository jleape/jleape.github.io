import { useState, useRef, useEffect } from "react";
import * as d3 from "d3";

// ─── Constants ────────────────────────────────────────────────────────────────

const UNCERTAINTY = ["Low", "Medium", "High"];
const UNCERTAINTY_WEIGHT = { Low: 1, Medium: 2, High: 3 };
const UNCERTAINTY_COLOR = { Low: "#4ade80", Medium: "#fbbf24", High: "#f87171" };
const UNCERTAINTY_DIMS = [
  {
    key: "uncInput",
    label: "Input Requirements",
    short: "Inputs",
    desc: "How precisely are the specifications of what flows into this element defined? Low = well-specified interfaces; High = inputs may change substantially.",
  },
  {
    key: "uncOutput",
    label: "Output Requirements",
    short: "Outputs",
    desc: "How certain are the performance levels and specifications this element must deliver? Low = stable requirements; High = performance targets may shift.",
  },
  {
    key: "uncLife",
    label: "Useful Life",
    short: "Life",
    desc: "How confident are you that this element will remain fit for purpose over the asset's intended horizon? Low = durable technology; High = likely to become obsolete or require replacement.",
  },
];
// Aggregate = most conservative (highest weight) dimension
const aggUnc = (el) => {
  const vals = UNCERTAINTY_DIMS.map(d => UNCERTAINTY_WEIGHT[el[d.key] || "Low"]);
  const maxW = Math.max(...vals);
  return UNCERTAINTY.find(u => UNCERTAINTY_WEIGHT[u] === maxW) || "Low";
};
const aggUncColor = (el) => UNCERTAINTY_COLOR[aggUnc(el)];
const CATEGORIES = ["Power", "Thermal", "Compute", "Network", "Structure", "Security", "Controls", "Other"];
const INTERACTION_TYPES = [
  { key: "S", label: "Spatial",     color: "#a78bfa" },
  { key: "E", label: "Energy",      color: "#fb923c" },
  { key: "I", label: "Information", color: "#38bdf8" },
  { key: "M", label: "Material",    color: "#4ade80" },
];
const DIRECTIONS = [
  { value: "AB", label: "A → B" },
  { value: "BA", label: "A ← B" },
  { value: "both", label: "A ↔ B" },
];
const CLUSTER_COLORS = [
  "#38bdf8", "#a78bfa", "#fb923c", "#4ade80",
  "#f87171", "#fbbf24", "#e879f9", "#67e8f9",
];
const SHAPES = [
  { key: "rect",      label: "Rectangle",  desc: "Cabinets, racks, UPS" },
  { key: "circle",    label: "Circle",     desc: "Tanks, cooling towers" },
  { key: "roundrect", label: "Room",       desc: "Rooms, enclosures" },
  { key: "hexagon",   label: "Hexagon",    desc: "Network / switching" },
  { key: "triangle",  label: "Triangle",   desc: "Pumps, fans" },
  { key: "dashrect",  label: "Zone",       desc: "Logical zones" },
];
const DEFAULT_SHAPE_SIZE = {
  rect: { w: 80, h: 50 }, circle: { w: 52, h: 52 }, roundrect: { w: 80, h: 52 },
  hexagon: { w: 56, h: 56 }, triangle: { w: 60, h: 56 }, dashrect: { w: 100, h: 68 },
};
const CANVAS_W = 820, CANVAS_H = 520, PLAN_GRID = 20;

const emptyCell = () => ({ types: { S: false, E: false, I: false, M: false }, strength: 0, direction: "AB" });

// ─── Helpers ─────────────────────────────────────────────────────────────────

const cellKey = (r, c) => `${r}-${c}`;
const getActiveTypes = (cell) => cell ? INTERACTION_TYPES.filter(t => cell.types[t.key]) : [];

function hasEdge(interactions, r, c) {
  const cell = interactions[cellKey(r, c)];
  if (cell && cell.strength > 0 && (cell.direction === "AB" || cell.direction === "both")) return true;
  const rev = interactions[cellKey(c, r)];
  if (rev && rev.strength > 0 && rev.direction === "BA") return true;
  return false;
}

function classifyPair(interactions, r, c) {
  const fwd = hasEdge(interactions, r, c);
  const bwd = hasEdge(interactions, c, r);
  if (!fwd && !bwd) return "independent";
  if (fwd && bwd) return "coupled";
  return "sequential";
}

function cellRisk(interactions, elements, r, c) {
  const cell = interactions[cellKey(r, c)];
  if (!cell || cell.strength === 0) return 0;
  const uw = (UNCERTAINTY_WEIGHT[aggUnc(elements[r])] + UNCERTAINTY_WEIGHT[aggUnc(elements[c])]) / 2;
  return cell.strength * uw;
}

function elementRiskScore(interactions, elements, idx) {
  return elements.reduce((sum, _, j) => j === idx ? sum :
    sum + cellRisk(interactions, elements, idx, j) + cellRisk(interactions, elements, j, idx), 0);
}

// Total interaction strength between two elements (both directions)
function totalStrength(interactions, a, b) {
  const ab = interactions[cellKey(a, b)];
  const ba = interactions[cellKey(b, a)];
  let s = 0;
  if (ab && ab.strength > 0) s += ab.strength;
  if (ba && ba.strength > 0) s += ba.strength;
  return s;
}

// SA cost: penalise interactions far from diagonal
function computeCost(perm, interactions) {
  const N = perm.length;
  let cost = 0;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const s = totalStrength(interactions, perm[i], perm[j]);
      if (s > 0) cost += s * (j - i) * (j - i);
    }
  }
  return cost;
}

// Simulated annealing clustering
function runSA(N, interactions) {
  if (N <= 1) return Array.from({ length: N }, (_, i) => i);
  let perm = Array.from({ length: N }, (_, i) => i);
  let cost = computeCost(perm, interactions);
  let best = [...perm];
  let bestCost = cost;

  const STEPS = Math.max(8000, N * N * 50);
  const T_START = 4.0;
  const T_END = 0.005;

  for (let step = 0; step < STEPS; step++) {
    const T = T_START * Math.pow(T_END / T_START, step / STEPS);
    const i = Math.floor(Math.random() * N);
    let j = Math.floor(Math.random() * N);
    while (j === i) j = Math.floor(Math.random() * N);

    [perm[i], perm[j]] = [perm[j], perm[i]];
    const newCost = computeCost(perm, interactions);
    const delta = newCost - cost;

    if (delta < 0 || Math.random() < Math.exp(-delta / T)) {
      cost = newCost;
      if (cost < bestCost) { bestCost = cost; best = [...perm]; }
    } else {
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
  }
  return best;
}

// Auto-detect cluster boundaries by finding weakest adjacent bonds
function autoDetectBoundaries(order, interactions, k) {
  const N = order.length;
  if (N <= 1) return [0];
  const gaps = [];
  for (let i = 0; i < N - 1; i++) {
    const s = totalStrength(interactions, order[i], order[i + 1]);
    gaps.push({ pos: i + 1, score: s });
  }
  // Sort ascending by strength (weakest = best boundary)
  gaps.sort((a, b) => a.score - b.score);
  const cuts = new Set(gaps.slice(0, k - 1).map(g => g.pos));
  return [0, ...Array.from(cuts).sort((a, b) => a - b)];
}

// Which cluster does display position p belong to?
function clusterOf(p, boundaries) {
  let k = 0;
  for (let i = 0; i < boundaries.length; i++) {
    if (p >= boundaries[i]) k = i;
  }
  return k;
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ color, label }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}55`,
      borderRadius: 3, padding: "1px 5px", fontSize: 10, fontWeight: 700,
      letterSpacing: "0.05em", fontFamily: "monospace"
    }}>{label}</span>
  );
}

// ─── Cell Editor ──────────────────────────────────────────────────────────────

function CellEditor({ r, c, elements, cell, onChange, onClose }) {
  const [val, setVal] = useState(cell ? { ...cell, types: { ...cell.types } } : emptyCell());
  const update = (patch) => setVal(v => ({ ...v, ...patch }));
  const toggleType = (k) => setVal(v => ({ ...v, types: { ...v.types, [k]: !v.types[k] } }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#16202e", border: "1px solid #2a3a50", borderRadius: 10, padding: 28, width: 390, boxShadow: "0 24px 80px #00000099" }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 4 }}>INTERACTION</div>
          <div style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 600 }}>
            <span style={{ color: UNCERTAINTY_COLOR[aggUnc(elements[r])] }}>{elements[r]?.name}</span>
            <span style={{ color: "#64748b" }}> → </span>
            <span style={{ color: UNCERTAINTY_COLOR[aggUnc(elements[c])] }}>{elements[c]?.name}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <Badge color={aggUncColor(elements[r])} label={aggUnc(elements[r])} />
            <span style={{ color: "#3a4a60", fontSize: 12 }}>→</span>
            <Badge color={aggUncColor(elements[c])} label={aggUnc(elements[c])} />
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>TYPE</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {INTERACTION_TYPES.map(t => (
              <button key={t.key} onClick={() => toggleType(t.key)} style={{
                padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${val.types[t.key] ? t.color : "#2a3a50"}`,
                background: val.types[t.key] ? t.color + "22" : "transparent",
                color: val.types[t.key] ? t.color : "#64748b",
                fontSize: 13, fontWeight: 600, transition: "all 0.15s"
              }}>{t.key} · {t.label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>
            STRENGTH — {["None", "Desired", "Basic", "Strong"][val.strength]}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2, 3].map(s => (
              <button key={s} onClick={() => update({ strength: s })} style={{
                width: 44, height: 36, borderRadius: 6, cursor: "pointer",
                border: `1px solid ${val.strength === s ? "#38bdf8" : "#2a3a50"}`,
                background: val.strength === s ? "#38bdf822" : "transparent",
                color: val.strength === s ? "#38bdf8" : "#64748b",
                fontSize: 15, fontWeight: 700, transition: "all 0.15s"
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>DIRECTION</div>
          <div style={{ display: "flex", gap: 8 }}>
            {DIRECTIONS.map(d => (
              <button key={d.value} onClick={() => update({ direction: d.value })} style={{
                flex: 1, padding: "7px 4px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${val.direction === d.value ? "#a78bfa" : "#2a3a50"}`,
                background: val.direction === d.value ? "#a78bfa22" : "transparent",
                color: val.direction === d.value ? "#a78bfa" : "#64748b",
                fontSize: 13, fontWeight: 600, transition: "all 0.15s"
              }}>{d.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { onChange(val); onClose(); }} style={{ flex: 1, padding: "9px 0", borderRadius: 7, cursor: "pointer", background: "#38bdf8", border: "none", color: "#0a1628", fontWeight: 700, fontSize: 13 }}>Save</button>
          <button onClick={() => { onChange(null); onClose(); }} style={{ padding: "9px 16px", borderRadius: 7, cursor: "pointer", background: "transparent", border: "1px solid #2a3a50", color: "#64748b", fontSize: 13 }}>Clear</button>
          <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: 7, cursor: "pointer", background: "transparent", border: "1px solid #2a3a50", color: "#64748b", fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── ShapeEl — SVG shape renderer ────────────────────────────────────────────

function ShapeEl({ shape, w, h, color, selected, dimmed }) {
  const s = {
    stroke: selected ? "#fff" : color, strokeWidth: selected ? 2.5 : 1.5,
    fill: color + "22", opacity: dimmed ? 0.22 : 1,
  };
  switch (shape) {
    case "circle":    return <circle r={Math.min(w, h) / 2} {...s} />;
    case "roundrect": return <rect x={-w/2} y={-h/2} width={w} height={h} rx={10} {...s} />;
    case "hexagon": {
      const r = Math.min(w, h) / 2;
      const pts = Array.from({length:6},(_,i)=>{const a=(i*60-30)*Math.PI/180;return `${(r*Math.cos(a)).toFixed(1)},${(r*Math.sin(a)).toFixed(1)}`;}).join(" ");
      return <polygon points={pts} {...s} />;
    }
    case "triangle":  return <polygon points={`${-w/2},${h/2} ${w/2},${h/2} 0,${-h/2}`} {...s} />;
    case "dashrect":  return <rect x={-w/2} y={-h/2} width={w} height={h} {...s} strokeDasharray="7 3" />;
    default:          return <rect x={-w/2} y={-h/2} width={w} height={h} {...s} />;
  }
}

// ─── Stage 1 ─────────────────────────────────────────────────────────────────

function Stage1({ elements, setElements }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});

  const startNew = () => { setDraft({ name: "", description: "", uncInput: "Low", uncOutput: "Low", uncLife: "Low", category: "Other", shape: "rect" }); setEditing("new"); };
  const startEdit = (i) => { setDraft({ ...elements[i] }); setEditing(i); };
  const save = () => {
    if (!draft.name.trim()) return;
    if (editing === "new") setElements(els => [...els, { ...draft, id: Date.now() }]);
    else setElements(els => els.map((e, i) => i === editing ? { ...e, ...draft } : e));
    setEditing(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
        <div>
          <div style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Functional Elements</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>Define what the asset <em>does</em>, not what it <em>is</em>. Each element becomes a row and column in the DSM.</div>
        </div>
        <button onClick={startNew} style={{ padding: "9px 18px", borderRadius: 8, cursor: "pointer", background: "#38bdf8", border: "none", color: "#0a1628", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>+ Add Element</button>
      </div>
      {elements.length === 0 ? (
        <div style={{ border: "1px dashed #2a3a50", borderRadius: 10, padding: "48px 24px", textAlign: "center", color: "#3a4a60" }}>
          No elements yet. Add your first functional element to begin.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {elements.map((el, i) => (
            <div key={el.id} style={{ display: "grid", gridTemplateColumns: "28px 1fr 28px auto auto auto", alignItems: "center", gap: 12, background: "#0d1724", border: "1px solid #1e2e42", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ color: "#3a4a60", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{el.name}</div>
                {el.description && <div style={{ color: "#64748b", fontSize: 12 }}>{el.description}</div>}
              </div>
              <svg width={22} height={22} viewBox="-13 -13 26 26">
                <ShapeEl shape={el.shape || "rect"} w={20} h={16} color="#64748b" selected={false} dimmed={false} />
              </svg>
              <Badge color={aggUncColor(el)} label={aggUnc(el)} />
              <Badge color="#64748b" label={el.category} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => startEdit(i)} style={{ padding: "4px 10px", borderRadius: 5, cursor: "pointer", background: "transparent", border: "1px solid #2a3a50", color: "#64748b", fontSize: 12 }}>Edit</button>
                <button onClick={() => setElements(els => els.filter((_, j) => j !== i))} style={{ padding: "4px 10px", borderRadius: 5, cursor: "pointer", background: "transparent", border: "1px solid #3a2222", color: "#f87171", fontSize: 12 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing !== null && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div style={{ background: "#16202e", border: "1px solid #2a3a50", borderRadius: 10, padding: 28, width: 420, boxShadow: "0 24px 80px #00000099" }}>
            <div style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{editing === "new" ? "New Element" : "Edit Element"}</div>
            {[{ key: "name", label: "Name", placeholder: "e.g. Power delivery" }, { key: "description", label: "Description (optional)", placeholder: "e.g. Converts utility power to data center loads" }].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 6 }}>{f.label.toUpperCase()}</div>
                <input value={draft[f.key] || ""} onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ width: "100%", background: "#0d1724", border: "1px solid #2a3a50", borderRadius: 7, padding: "9px 12px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 6 }}>CATEGORY</div>
                <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                  style={{ width: "100%", background: "#0d1724", border: "1px solid #2a3a50", borderRadius: 7, padding: "9px 12px", color: "#e2e8f0", fontSize: 14, outline: "none" }}>
                  {CATEGORIES.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 4 }}>UNCERTAINTY</div>
              <div style={{ color: "#3a4a60", fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>
                Rate each dimension. The aggregate (most conservative) drives risk weighting in the matrix.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {UNCERTAINTY_DIMS.map(dim => (
                  <div key={dim.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                      <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>{dim.label}</span>
                      <span style={{ color: UNCERTAINTY_COLOR[draft[dim.key] || "Low"], fontSize: 10, fontFamily: "monospace" }}>{draft[dim.key] || "Low"}</span>
                    </div>
                    <div style={{ color: "#3a4a60", fontSize: 10, marginBottom: 6, lineHeight: 1.4 }}>{dim.desc}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {UNCERTAINTY.map(u => (
                        <button key={u} onClick={() => setDraft(d => ({ ...d, [dim.key]: u }))} style={{
                          flex: 1, padding: "5px 0", borderRadius: 6, cursor: "pointer",
                          border: `1px solid ${(draft[dim.key] || "Low") === u ? UNCERTAINTY_COLOR[u] : "#2a3a50"}`,
                          background: (draft[dim.key] || "Low") === u ? UNCERTAINTY_COLOR[u] + "22" : "transparent",
                          color: (draft[dim.key] || "Low") === u ? UNCERTAINTY_COLOR[u] : "#64748b",
                          fontSize: 11, fontWeight: 600, transition: "all 0.15s"
                        }}>{u}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>SHAPE (PLAN VIEW)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {SHAPES.map(sh => (
                  <button key={sh.key} onClick={() => setDraft(d => ({ ...d, shape: sh.key }))} style={{
                    padding: "8px 6px", borderRadius: 7, cursor: "pointer",
                    border: `1px solid ${(draft.shape || "rect") === sh.key ? "#38bdf8" : "#2a3a50"}`,
                    background: (draft.shape || "rect") === sh.key ? "#38bdf811" : "transparent",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5
                  }}>
                    <svg width={36} height={26} viewBox="-20 -15 40 30">
                      <ShapeEl shape={sh.key} w={34} h={26} color={(draft.shape || "rect") === sh.key ? "#38bdf8" : "#64748b"} selected={false} dimmed={false} />
                    </svg>
                    <span style={{ color: (draft.shape || "rect") === sh.key ? "#38bdf8" : "#64748b", fontSize: 10, fontFamily: "monospace" }}>{sh.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={save} style={{ flex: 1, padding: "9px 0", borderRadius: 7, cursor: "pointer", background: "#38bdf8", border: "none", color: "#0a1628", fontWeight: 700, fontSize: 13 }}>Save</button>
              <button onClick={() => setEditing(null)} style={{ padding: "9px 16px", borderRadius: 7, cursor: "pointer", background: "transparent", border: "1px solid #2a3a50", color: "#64748b", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stage 2 ─────────────────────────────────────────────────────────────────

const CLS = {
  coupled:     { label: "Coupled",     color: "#f87171", bg: "#f8717114", border: "#f8717155", desc: "Feedback loop — lock-in risk" },
  sequential:  { label: "Sequential",  color: "#38bdf8", bg: "#38bdf811", border: "#38bdf844", desc: "Feed-forward dependency" },
  independent: { label: "Independent", color: "#4ade80", bg: "transparent", border: "#1a2535",  desc: "Isolation candidate" },
};

function Stage2({ elements, interactions, setInteractions }) {
  const [activeCell, setActiveCell] = useState(null);
  const [viewMode, setViewMode] = useState("standard");
  const N = elements.length;

  const setCell = (r, c, val) => setInteractions(prev => {
    const next = { ...prev };
    if (!val || val.strength === 0) delete next[cellKey(r, c)];
    else next[cellKey(r, c)] = val;
    return next;
  });

  const allRisks = elements.map((_, i) => elementRiskScore(interactions, elements, i));
  const maxRisk = Math.max(...allRisks, 1);
  const MAX_CELL_RISK = 9;

  let coupledCount = 0, seqCount = 0;
  for (let r = 0; r < N; r++)
    for (let c = r + 1; c < N; c++) {
      const cls = classifyPair(interactions, r, c);
      if (cls === "coupled") coupledCount++;
      if (cls === "sequential") seqCount++;
    }

  const cellSize = Math.max(34, Math.min(52, Math.floor(560 / Math.max(N, 1))));

  const renderCell = (r, c) => {
    if (r === c) {
      if (viewMode === "risk") {
        const uc = aggUncColor(elements[r]);
        return (
          <div key={c} style={{ width: cellSize, height: cellSize, flexShrink: 0, marginRight: 2, borderRadius: 4, border: `1px solid ${uc}55`, background: uc + "18", display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: uc }} />
          </div>
        );
      }
      return (
        <div key={c} style={{ width: cellSize, height: cellSize, flexShrink: 0, marginRight: 2, borderRadius: 4, border: "1px solid #0d1724", background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}>
          <div style={{ width: cellSize - 8, height: cellSize - 8, background: "repeating-linear-gradient(45deg,#1a2535 0,#1a2535 2px,transparent 2px,transparent 8px)", borderRadius: 2, opacity: 0.5 }} />
        </div>
      );
    }
    // Use hasEdge for display — this handles BA entries stored in the transposed cell
    const hasData = hasEdge(interactions, r, c);
    const classification = classifyPair(interactions, r, c);
    const cls = CLS[classification];
    // Collect types from whichever cell actually carries this direction
    const directCell = interactions[cellKey(r, c)];
    const reverseCell = interactions[cellKey(c, r)];
    const typesFromDirect = directCell && directCell.strength > 0 && (directCell.direction === "AB" || directCell.direction === "both") ? getActiveTypes(directCell) : [];
    const typesFromReverse = reverseCell && reverseCell.strength > 0 && reverseCell.direction === "BA" ? getActiveTypes(reverseCell) : [];
    const allTypeKeys = new Set([...typesFromDirect.map(t => t.key), ...typesFromReverse.map(t => t.key)]);
    const types = INTERACTION_TYPES.filter(t => allTypeKeys.has(t.key));
    const strength = directCell?.strength || reverseCell?.strength || 1;

    let bg = cls.bg, border = cls.border;
    if (viewMode === "risk" && hasData) {
      const risk = cellRisk(interactions, elements, r, c);
      const pct = risk / MAX_CELL_RISK;
      const alpha = Math.round(pct * 180).toString(16).padStart(2, "0");
      bg = `#f87171${alpha}`; border = `#f87171${Math.round(pct * 255).toString(16).padStart(2, "0")}`;
    } else if (viewMode === "risk" && !hasData) { bg = "transparent"; border = "#1a2535"; }

    return (
      <div key={c} onClick={() => {
        // If no direct entry but reverse has a BA mark, edit the canonical (reverse) cell
        const direct = interactions[cellKey(r, c)];
        const reverse = interactions[cellKey(c, r)];
        const directEmpty = !direct || direct.strength === 0;
        const reverseHasBA = reverse && reverse.strength > 0 && reverse.direction === "BA";
        setActiveCell(directEmpty && reverseHasBA ? { r: c, c: r } : { r, c });
      }}
        style={{ width: cellSize, height: cellSize, flexShrink: 0, marginRight: 2, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderRadius: 4, background: bg, border: `1px solid ${border}`, cursor: "pointer", transition: "border-color 0.1s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#38bdf8"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = border; }}
      >
        {hasData && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", alignItems: "center", padding: 3 }}>
            {types.map(t => <div key={t.key} style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, opacity: 0.4 + strength * 0.2 }} />)}
            {classification === "sequential" && (
              <div style={{ position: "absolute", bottom: 2, right: 3, fontSize: 8, color: "#38bdf877", fontWeight: 700 }}>
                {hasEdge(interactions, r, c) ? "▶" : "◀"}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (N === 0) return <div style={{ border: "1px dashed #2a3a50", borderRadius: 10, padding: "48px 24px", textAlign: "center", color: "#3a4a60" }}>Add functional elements in Stage 1 first.</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Design Structure Matrix</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>Click any cell to define the interaction. Toggle Risk Overlay to weight coupling by element uncertainty.</div>
        </div>
        <div style={{ display: "flex", gap: 0, border: "1px solid #2a3a50", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
          {[{ v: "standard", l: "Standard" }, { v: "risk", l: "⚠ Risk Overlay" }].map(m => (
            <button key={m.v} onClick={() => setViewMode(m.v)} style={{ padding: "7px 14px", background: viewMode === m.v ? "#38bdf822" : "transparent", border: "none", cursor: "pointer", color: viewMode === m.v ? "#38bdf8" : "#64748b", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>{m.l}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {Object.entries(CLS).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: v.bg, border: `1px solid ${v.color}88` }} />
            <span style={{ color: v.color, fontSize: 12, fontWeight: 600 }}>{v.label}</span>
            <span style={{ color: "#3a4a60", fontSize: 11 }}>— {v.desc}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {INTERACTION_TYPES.map(t => (
            <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
              <span style={{ color: "#64748b", fontSize: 11 }}>{t.key}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "inline-block" }}>
          <div style={{ display: "flex", marginLeft: cellSize * 2 + 12 }}>
            {elements.map((el, c) => (
              <div key={c} style={{ width: cellSize, flexShrink: 0, marginRight: 2, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6, height: 88 }}>
                <div style={{ transform: "rotate(-55deg)", transformOrigin: "bottom center", color: viewMode === "risk" ? aggUncColor(el) : "#64748b", fontSize: 10, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600, transition: "color 0.2s" }}>
                  {String(c + 1).padStart(2, "0")} {el.name.length > 14 ? el.name.slice(0, 13) + "…" : el.name}
                </div>
              </div>
            ))}
          </div>
          {elements.map((rowEl, r) => (
            <div key={r} style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
              <div style={{ width: cellSize, flexShrink: 0, textAlign: "right", paddingRight: 6 }}>
                <span style={{ color: "#3a4a60", fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>{String(r + 1).padStart(2, "0")}</span>
              </div>
              <div style={{ width: cellSize, flexShrink: 0, paddingRight: 8, overflow: "hidden" }}>
                <span style={{ color: viewMode === "risk" ? aggUncColor(rowEl) : "#94a3b8", fontSize: 10, fontFamily: "monospace", whiteSpace: "nowrap", transition: "color 0.2s" }}>
                  {rowEl.name.length > 9 ? rowEl.name.slice(0, 8) + "…" : rowEl.name}
                </span>
              </div>
              {elements.map((_, c) => renderCell(r, c))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        {[
          { label: "Coupled pairs", val: coupledCount, color: "#f87171", desc: "Feedback loops / lock-in risk" },
          { label: "Sequential", val: seqCount, color: "#38bdf8", desc: "Feed-forward only" },
          { label: "Independent pairs", val: N * (N - 1) / 2 - coupledCount - seqCount, color: "#4ade80", desc: "Isolation candidates" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0d1724", border: "1px solid #1e2e42", borderRadius: 8, padding: "12px 18px", flex: 1, minWidth: 140 }}>
            <div style={{ color: s.color, fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>{s.val}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>{s.label}</div>
            <div style={{ color: "#3a4a60", fontSize: 11, marginTop: 2 }}>{s.desc}</div>
          </div>
        ))}
      </div>
      {viewMode === "risk" && N > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>ELEMENT RISK EXPOSURE — weighted coupling score</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {elements.map((el, i) => ({ el, i, score: allRisks[i] })).sort((a, b) => b.score - a.score).map(({ el, i, score }) => {
              const pct = score / maxRisk;
              const barColor = pct > 0.66 ? "#f87171" : pct > 0.33 ? "#fbbf24" : "#4ade80";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 22, textAlign: "right", color: "#3a4a60", fontFamily: "monospace", fontSize: 11 }}>{String(i + 1).padStart(2, "0")}</div>
                  <div style={{ width: 130, color: "#94a3b8", fontSize: 12, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{el.name}</div>
                  <div style={{ flex: 1, height: 8, background: "#1e2e42", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct * 100}%`, background: barColor, borderRadius: 4, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ width: 32, textAlign: "right", color: barColor, fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>{score.toFixed(0)}</div>
                  <Badge color={aggUncColor(el)} label={aggUnc(el)} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {activeCell && (
        <CellEditor r={activeCell.r} c={activeCell.c} elements={elements}
          cell={interactions[cellKey(activeCell.r, activeCell.c)] || emptyCell()}
          onChange={(val) => setCell(activeCell.r, activeCell.c, val)}
          onClose={() => setActiveCell(null)} />
      )}
    </div>
  );
}

// ─── Stage 3: Clustering ──────────────────────────────────────────────────────

function Stage3({ elements, interactions, clusterState, setClusterState }) {
  const N = elements.length;
  const { order, boundaries, clusterNames } = clusterState;

  const [running, setRunning] = useState(false);
  const [numClusters, setNumClusters] = useState(Math.max(2, Math.ceil(N / 3)));
  const [editingName, setEditingName] = useState(null);
  const [nameDraft, setNameDraft] = useState("");

  const cellSize = Math.max(30, Math.min(46, Math.floor(500 / Math.max(N, 1))));
  const CELL_GAP = 2;
  const HEADER_H = 84;
  const ROW_HDR_W = cellSize * 2 + 10;

  // Run SA
  const runClustering = () => {
    setRunning(true);
    setTimeout(() => {
      const newOrder = runSA(N, interactions);
      const k = Math.min(numClusters, N);
      const newBoundaries = autoDetectBoundaries(newOrder, interactions, k);
      const newNames = newBoundaries.map((_, i) => `Module ${String.fromCharCode(65 + i)}`);
      setClusterState({ order: newOrder, boundaries: newBoundaries, clusterNames: newNames });
      setRunning(false);
    }, 20);
  };

  // Move element up/down in order
  const moveElement = (pos, dir) => {
    const newOrder = [...order];
    const swapPos = pos + dir;
    if (swapPos < 0 || swapPos >= N) return;
    [newOrder[pos], newOrder[swapPos]] = [newOrder[swapPos], newOrder[pos]];
    setClusterState(s => ({ ...s, order: newOrder }));
  };

  // Toggle boundary at position pos (pos = 1..N-1)
  const toggleBoundary = (pos) => {
    setClusterState(s => {
      const hasBoundary = s.boundaries.includes(pos);
      let newBounds, newNames;
      if (hasBoundary) {
        // Remove boundary
        const idx = s.boundaries.indexOf(pos);
        newBounds = s.boundaries.filter(b => b !== pos);
        newNames = s.clusterNames.filter((_, i) => i !== idx);
      } else {
        // Add boundary
        const sorted = [...s.boundaries, pos].sort((a, b) => a - b);
        const insertIdx = sorted.indexOf(pos);
        newBounds = sorted;
        const namesCopy = [...s.clusterNames];
        namesCopy.splice(insertIdx, 0, `Module ${String.fromCharCode(65 + sorted.length - 1)}`);
        newNames = namesCopy;
      }
      return { ...s, boundaries: newBounds, clusterNames: newNames };
    });
  };

  // Rename cluster
  const renameCluster = (k, name) => {
    setClusterState(s => {
      const newNames = [...s.clusterNames];
      newNames[k] = name;
      return { ...s, clusterNames: newNames };
    });
  };

  if (N === 0) return <div style={{ border: "1px dashed #2a3a50", borderRadius: 10, padding: "48px 24px", textAlign: "center", color: "#3a4a60" }}>Add functional elements in Stage 1 first.</div>;
  if (Object.keys(interactions).length === 0) return <div style={{ border: "1px dashed #2a3a50", borderRadius: 10, padding: "48px 24px", textAlign: "center", color: "#3a4a60" }}>Define interactions in Stage 2 first.</div>;

  // Compute cluster for each display position
  const clusterOf_pos = (p) => clusterOf(p, boundaries);

  // Count off-diagonal interactions between clusters
  let offDiagCount = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const ci = clusterOf_pos(i), cj = clusterOf_pos(j);
      if (ci !== cj) {
        const s = totalStrength(interactions, order[i], order[j]);
        if (s > 0) offDiagCount++;
      }
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Cluster Analysis</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>Auto-cluster reorders elements to pull strong interactions near the diagonal. Adjust boundaries manually to define modules.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#64748b", fontSize: 12 }}>k =</span>
            <input type="number" min={1} max={N} value={numClusters}
              onChange={e => setNumClusters(Math.max(1, Math.min(N, parseInt(e.target.value) || 2)))}
              style={{ width: 48, background: "#0d1724", border: "1px solid #2a3a50", borderRadius: 6, padding: "6px 8px", color: "#e2e8f0", fontSize: 13, outline: "none", textAlign: "center" }} />
            <span style={{ color: "#64748b", fontSize: 12 }}>clusters</span>
          </div>
          <button onClick={runClustering} disabled={running} style={{
            padding: "8px 18px", borderRadius: 8, cursor: running ? "wait" : "pointer",
            background: running ? "#1e2e42" : "#38bdf8", border: "none",
            color: running ? "#64748b" : "#0a1628", fontWeight: 700, fontSize: 13,
            display: "flex", alignItems: "center", gap: 6
          }}>
            {running ? "⟳ Running…" : "⚡ Auto-cluster"}
          </button>
        </div>
      </div>

      {order.length === 0 ? (
        <div style={{ border: "1px dashed #2a3a50", borderRadius: 10, padding: "48px 24px", textAlign: "center", color: "#3a4a60" }}>
          Click <strong style={{ color: "#38bdf8" }}>Auto-cluster</strong> to run the clustering algorithm, or reorder elements manually using the list below.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 24 }}>

          {/* Left: Ordered element list */}
          <div style={{ width: 240, flexShrink: 0 }}>
            <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>ELEMENT ORDER</div>
            <div style={{ color: "#3a4a60", fontSize: 11, marginBottom: 12 }}>Drag rows or use arrows. Click ╌ between rows to add/remove boundaries.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {order.map((elIdx, pos) => {
                const el = elements[elIdx];
                const k = clusterOf_pos(pos);
                const cc = CLUSTER_COLORS[k % CLUSTER_COLORS.length];
                const isFirst = boundaries.includes(pos) && pos > 0;
                const canSplit = pos > 0 && !boundaries.includes(pos);

                return (
                  <div key={pos}>
                    {/* Boundary toggle strip */}
                    {pos > 0 && (
                      <div onClick={() => toggleBoundary(pos)}
                        style={{
                          height: 10, display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", marginBottom: 2, opacity: boundaries.includes(pos) ? 1 : 0.3,
                        }}
                        title={boundaries.includes(pos) ? "Remove cluster boundary" : "Add cluster boundary here"}
                        onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = boundaries.includes(pos) ? 1 : 0.3; }}
                      >
                        <div style={{
                          flex: 1, height: 2, borderRadius: 1,
                          background: boundaries.includes(pos) ? cc : "#2a3a50",
                          transition: "background 0.15s"
                        }} />
                        <span style={{ fontSize: 9, color: boundaries.includes(pos) ? cc : "#3a4a60", padding: "0 4px", fontFamily: "monospace" }}>
                          {boundaries.includes(pos) ? "╌" : "+"}
                        </span>
                        <div style={{
                          flex: 1, height: 2, borderRadius: 1,
                          background: boundaries.includes(pos) ? CLUSTER_COLORS[Math.min(k + 1, CLUSTER_COLORS.length - 1)] : "#2a3a50",
                          transition: "background 0.15s"
                        }} />
                      </div>
                    )}
                    {/* Element row */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "#0d1724",
                      border: `1px solid ${cc}44`,
                      borderLeft: `3px solid ${cc}`,
                      borderRadius: 6, padding: "7px 8px",
                    }}>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{el?.name}</div>
                        <div style={{ color: cc, fontSize: 10, fontFamily: "monospace" }}>{clusterNames[k] || `Module ${k}`}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <button onClick={() => moveElement(pos, -1)} disabled={pos === 0}
                          style={{ width: 20, height: 16, background: "transparent", border: "none", color: pos === 0 ? "#2a3a50" : "#64748b", cursor: pos === 0 ? "default" : "pointer", fontSize: 10, padding: 0 }}>▲</button>
                        <button onClick={() => moveElement(pos, 1)} disabled={pos === N - 1}
                          style={{ width: 20, height: 16, background: "transparent", border: "none", color: pos === N - 1 ? "#2a3a50" : "#64748b", cursor: pos === N - 1 ? "default" : "pointer", fontSize: 10, padding: 0 }}>▼</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cluster name editor */}
            <div style={{ marginTop: 20 }}>
              <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>MODULE NAMES</div>
              {boundaries.map((_, k) => {
                const cc = CLUSTER_COLORS[k % CLUSTER_COLORS.length];
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: cc, flexShrink: 0 }} />
                    {editingName === k ? (
                      <input autoFocus value={nameDraft}
                        onChange={e => setNameDraft(e.target.value)}
                        onBlur={() => { renameCluster(k, nameDraft || clusterNames[k]); setEditingName(null); }}
                        onKeyDown={e => { if (e.key === "Enter") { renameCluster(k, nameDraft || clusterNames[k]); setEditingName(null); } }}
                        style={{ flex: 1, background: "#0d1724", border: `1px solid ${cc}88`, borderRadius: 5, padding: "4px 8px", color: "#e2e8f0", fontSize: 12, outline: "none" }} />
                    ) : (
                      <div onClick={() => { setNameDraft(clusterNames[k] || ""); setEditingName(k); }}
                        style={{ flex: 1, color: cc, fontSize: 12, fontWeight: 600, cursor: "text", padding: "4px 0" }}>
                        {clusterNames[k] || `Module ${k}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Reordered matrix with cluster overlay */}
          <div style={{ flex: 1, overflowX: "auto" }}>
            <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>REORDERED MATRIX</div>
            <div style={{ position: "relative", display: "inline-block" }}>

              {/* Column headers */}
              <div style={{ display: "flex", marginLeft: ROW_HDR_W }}>
                {order.map((elIdx, pos) => {
                  const el = elements[elIdx];
                  const cc = CLUSTER_COLORS[clusterOf_pos(pos) % CLUSTER_COLORS.length];
                  return (
                    <div key={pos} style={{ width: cellSize, flexShrink: 0, marginRight: CELL_GAP, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4, height: HEADER_H }}>
                      <div style={{ transform: "rotate(-55deg)", transformOrigin: "bottom center", color: cc, fontSize: 9, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>
                        {el?.name?.length > 14 ? el.name.slice(0, 13) + "…" : el?.name}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Matrix rows */}
              {order.map((elIdx, displayR) => {
                const rowEl = elements[elIdx];
                const rowCluster = clusterOf_pos(displayR);
                const rowCC = CLUSTER_COLORS[rowCluster % CLUSTER_COLORS.length];
                return (
                  <div key={displayR} style={{ display: "flex", alignItems: "center", marginBottom: CELL_GAP }}>
                    <div style={{ width: cellSize, flexShrink: 0, textAlign: "right", paddingRight: 4 }}>
                      <span style={{ color: rowCC, fontFamily: "monospace", fontSize: 10, fontWeight: 700 }}>{String(displayR + 1).padStart(2, "0")}</span>
                    </div>
                    <div style={{ width: cellSize, flexShrink: 0, paddingRight: 6, overflow: "hidden" }}>
                      <span style={{ color: rowCC, fontSize: 9, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {rowEl?.name?.length > 9 ? rowEl.name.slice(0, 8) + "…" : rowEl?.name}
                      </span>
                    </div>
                    {order.map((colIdx, displayC) => {
                      const isDiag = displayR === displayC;
                      const rowCl = clusterOf_pos(displayR);
                      const colCl = clusterOf_pos(displayC);
                      const sameCluster = rowCl === colCl;
                      const cc = CLUSTER_COLORS[rowCl % CLUSTER_COLORS.length];

                      if (isDiag) {
                        return (
                          <div key={displayC} style={{ width: cellSize, height: cellSize, flexShrink: 0, marginRight: CELL_GAP, borderRadius: 3, background: cc + "22", border: `1px solid ${cc}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: cc }} />
                          </div>
                        );
                      }

                      const cell = interactions[cellKey(elIdx, colIdx)];
                      const hasData = cell && cell.strength > 0;
                      const types = getActiveTypes(cell);
                      const classification = classifyPair(interactions, elIdx, colIdx);

                      // Off-diagonal interactions are flagged
                      const offDiag = !sameCluster && hasData;

                      return (
                        <div key={displayC}
                          style={{
                            width: cellSize, height: cellSize, flexShrink: 0, marginRight: CELL_GAP,
                            borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                            background: hasData
                              ? sameCluster ? "#1e3050" : "#f8717114"
                              : "transparent",
                            border: hasData
                              ? sameCluster ? "1px solid #2a4060" : "1px solid #f8717155"
                              : "1px solid #1a2535",
                          }}
                        >
                          {hasData && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", padding: 2 }}>
                              {types.map(t => <div key={t.key} style={{ width: 5, height: 5, borderRadius: "50%", background: offDiag ? "#f87171" : t.color, opacity: 0.6 + cell.strength * 0.1 }} />)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* SVG cluster overlay */}
              <svg style={{ position: "absolute", top: HEADER_H, left: ROW_HDR_W, pointerEvents: "none", overflow: "visible" }}
                width={(cellSize + CELL_GAP) * N} height={(cellSize + CELL_GAP) * N}>
                {boundaries.map((startPos, k) => {
                  const endPos = k < boundaries.length - 1 ? boundaries[k + 1] : N;
                  const size = endPos - startPos;
                  const cc = CLUSTER_COLORS[k % CLUSTER_COLORS.length];
                  const x = startPos * (cellSize + CELL_GAP);
                  const y = startPos * (cellSize + CELL_GAP);
                  const dim = size * (cellSize + CELL_GAP) - CELL_GAP;
                  return (
                    <g key={k}>
                      <rect x={x} y={y} width={dim} height={dim}
                        fill={cc + "08"} stroke={cc} strokeWidth={1.5} rx={4} />
                      <text x={x + 4} y={y + 11} fill={cc} fontSize={9} fontFamily="monospace" fontWeight="600" opacity={0.8}>
                        {clusterNames[k] || `M${k}`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Interface count */}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {[
                { label: "Modules", val: boundaries.length, color: "#38bdf8", desc: "Identified clusters" },
                { label: "Off-diagonal interactions", val: offDiagCount / 2 | 0, color: "#f87171", desc: "Cross-module interfaces" },
              ].map(s => (
                <div key={s.label} style={{ background: "#0d1724", border: "1px solid #1e2e42", borderRadius: 8, padding: "10px 16px", flex: 1 }}>
                  <div style={{ color: s.color, fontSize: 20, fontWeight: 700, fontFamily: "monospace" }}>{s.val}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>{s.label}</div>
                  <div style={{ color: "#3a4a60", fontSize: 11, marginTop: 2 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stage 4: Module Summary ──────────────────────────────────────────────────

function computeModuleData(elements, interactions, order, boundaries, clusterNames) {
  const K = boundaries.length;

  // Get element indices for each module
  const moduleElements = boundaries.map((start, k) => {
    const end = k < K - 1 ? boundaries[k + 1] : order.length;
    return order.slice(start, end);
  });

  // Per-module stats
  const modules = moduleElements.map((elIndices, k) => {
    const n = elIndices.length;
    const color = CLUSTER_COLORS[k % CLUSTER_COLORS.length];
    let internalCoupled = 0, internalSeq = 0, internalTotal = 0;
    let typeStrength = { S: 0, E: 0, I: 0, M: 0 };
    let totalInternalStrength = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = elIndices[i], b = elIndices[j];
        const cls = classifyPair(interactions, a, b);
        const s = totalStrength(interactions, a, b);
        if (cls !== "independent") {
          internalTotal++;
          totalInternalStrength += s;
          if (cls === "coupled") internalCoupled++;
          else internalSeq++;
        }
        // Type breakdown
        const cellAB = interactions[cellKey(a, b)];
        const cellBA = interactions[cellKey(b, a)];
        for (const t of INTERACTION_TYPES) {
          if (cellAB?.types[t.key]) typeStrength[t.key] += cellAB.strength;
          if (cellBA?.types[t.key]) typeStrength[t.key] += cellBA.strength;
        }
      }
    }

    const maxPairs = n * (n - 1) / 2;
    const couplingDensity = maxPairs > 0 ? internalCoupled / maxPairs : 0;
    const totalTypeStrength = Object.values(typeStrength).reduce((a, b) => a + b, 0);
    const spatialDominance = totalTypeStrength > 0 ? typeStrength.S / totalTypeStrength : 0;

    // Cross-module connections
    const allOtherElements = order.filter(i => !elIndices.includes(i));
    let crossTotal = 0, crossCoupled = 0, crossStrength = 0;
    let crossTypeStrength = { S: 0, E: 0, I: 0, M: 0 };
    for (const a of elIndices) {
      for (const b of allOtherElements) {
        const s = totalStrength(interactions, a, b);
        if (s > 0) {
          crossTotal++;
          crossStrength += s;
          if (classifyPair(interactions, a, b) === "coupled") crossCoupled++;
          const cellAB = interactions[cellKey(a, b)];
          const cellBA = interactions[cellKey(b, a)];
          for (const t of INTERACTION_TYPES) {
            if (cellAB?.types[t.key]) crossTypeStrength[t.key] += cellAB.strength;
            if (cellBA?.types[t.key]) crossTypeStrength[t.key] += cellBA.strength;
          }
        }
      }
    }

    const crossRatio = allOtherElements.length > 0 ? crossTotal / (elIndices.length * allOtherElements.length) : 0;

    // Flexibility score 0–100
    const flexScore = Math.max(0, Math.round(100 * (1 - 0.4 * couplingDensity - 0.4 * crossRatio - 0.2 * spatialDominance)));

    // Tag
    let tag, tagColor;
    if (n === 1 && crossTotal === 0) {
      tag = "Isolatable"; tagColor = "#4ade80";
    } else if (couplingDensity > 0.5) {
      tag = "Tightly coupled"; tagColor = "#f87171";
    } else if (crossRatio < 0.15 && couplingDensity < 0.3) {
      tag = "Expansion candidate"; tagColor = "#38bdf8";
    } else if (spatialDominance < 0.25 && crossRatio < 0.35) {
      tag = "Conversion candidate"; tagColor = "#a78bfa";
    } else if (crossCoupled > 0) {
      tag = "Lock-in risk"; tagColor = "#f87171";
    } else {
      tag = "Standard module"; tagColor = "#64748b";
    }

    // Real option mapping
    let optionType;
    if (crossRatio < 0.15 && couplingDensity < 0.3) optionType = "Expansion";
    else if (spatialDominance < 0.25) optionType = "Conversion";
    else optionType = "Monitor";

    return {
      k, name: clusterNames[k] || `Module ${k}`, color, elIndices,
      internalCoupled, internalSeq, internalTotal, couplingDensity,
      typeStrength, crossTypeStrength, totalInternalStrength,
      crossTotal, crossCoupled, crossStrength, crossRatio,
      spatialDominance, flexScore, tag, tagColor, optionType,
    };
  });

  // Cross-module interfaces
  const interfaces = [];
  for (let k1 = 0; k1 < K; k1++) {
    for (let k2 = k1 + 1; k2 < K; k2++) {
      const els1 = moduleElements[k1];
      const els2 = moduleElements[k2];
      let strength = 0, hasCoupled = false, hasSpatial = false;
      const typeSet = { S: false, E: false, I: false, M: false };
      const pairs = [];

      for (const a of els1) {
        for (const b of els2) {
          const s = totalStrength(interactions, a, b);
          if (s > 0) {
            strength += s;
            const cls = classifyPair(interactions, a, b);
            if (cls === "coupled") hasCoupled = true;
            const cellAB = interactions[cellKey(a, b)];
            const cellBA = interactions[cellKey(b, a)];
            for (const t of INTERACTION_TYPES) {
              if (cellAB?.types[t.key] || cellBA?.types[t.key]) {
                typeSet[t.key] = true;
                if (t.key === "S") hasSpatial = true;
              }
            }
            pairs.push({ a, b, cls, strength: s });
          }
        }
      }

      if (strength > 0) {
        let recommendation;
        if (hasCoupled && hasSpatial) recommendation = { text: "Physical decoupling required", color: "#f87171", urgency: 3 };
        else if (hasCoupled) recommendation = { text: "Buffer or decouple interface", color: "#fb923c", urgency: 2 };
        else if (hasSpatial) recommendation = { text: "Monitor spatial adjacency", color: "#fbbf24", urgency: 1 };
        else recommendation = { text: "Standardize interface specification", color: "#4ade80", urgency: 0 };

        interfaces.push({ k1, k2, strength, hasCoupled, hasSpatial, typeSet, pairs, recommendation });
      }
    }
  }
  interfaces.sort((a, b) => b.recommendation.urgency - a.recommendation.urgency || b.strength - a.strength);

  // Lock-in hotspots: coupled cross-module pairs sorted by risk
  const lockIns = [];
  for (const iface of interfaces) {
    for (const p of iface.pairs) {
      if (p.cls === "coupled") {
        const risk = cellRisk(interactions, elements, p.a, p.b) + cellRisk(interactions, elements, p.b, p.a);
        lockIns.push({ a: p.a, b: p.b, k1: iface.k1, k2: iface.k2, risk, strength: p.strength });
      }
    }
  }
  lockIns.sort((a, b) => b.risk - a.risk);

  return { modules, interfaces, lockIns, moduleElements };
}

const OPTION_META = {
  Expansion:  { color: "#38bdf8", icon: "⬆", desc: "Low cross-module coupling — can grow or replicate without cascading constraints" },
  Conversion: { color: "#a78bfa", icon: "⇄", desc: "Spatial coupling is low — function can change without requiring physical restructuring" },
  Monitor:    { color: "#fbbf24", icon: "⚠", desc: "Moderate coupling — monitor for lock-in; prioritize interface standardization" },
};

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.12em", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        {title}
        <div style={{ flex: 1, height: 1, background: "#1e2e42" }} />
      </div>
      {children}
    </div>
  );
}

function Stage4({ elements, interactions, clusterState }) {
  const { order, boundaries, clusterNames } = clusterState;
  const [expandedIface, setExpandedIface] = useState(null);
  const N = elements.length;

  if (N === 0) return <div style={{ border: "1px dashed #2a3a50", borderRadius: 10, padding: "48px 24px", textAlign: "center", color: "#3a4a60" }}>Add functional elements in Stage 1 first.</div>;
  if (boundaries.length === 0 || order.length === 0) return <div style={{ border: "1px dashed #2a3a50", borderRadius: 10, padding: "48px 24px", textAlign: "center", color: "#3a4a60" }}>Run clustering in Stage 3 first.</div>;

  const { modules, interfaces, lockIns, moduleElements } = computeModuleData(elements, interactions, order, boundaries, clusterNames);

  const totalLockIns = lockIns.length;
  const isolatable = modules.filter(m => m.tag === "Isolatable").length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Module Summary</div>
        <div style={{ color: "#64748b", fontSize: 13 }}>Synthesis of clustering results — modules, cross-module interfaces, lock-in risks, and real options mapping.</div>
      </div>

      {/* Top stat row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
        {[
          { val: modules.length,    label: "Modules",              color: "#38bdf8" },
          { val: interfaces.length, label: "Cross-module interfaces", color: "#a78bfa" },
          { val: totalLockIns,      label: "Lock-in risks",        color: "#f87171" },
          { val: isolatable,        label: "Isolatable elements",  color: "#4ade80" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: "#0d1724", border: "1px solid #1e2e42", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ color: s.color, fontSize: 24, fontWeight: 700, fontFamily: "monospace" }}>{s.val}</div>
            <div style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Module cards */}
      <Section title="MODULES">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {modules.map(m => (
            <div key={m.k} style={{ background: "#0d1724", border: `1px solid ${m.color}44`, borderRadius: 10, padding: 18, borderTop: `3px solid ${m.color}` }}>
              {/* Module header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ color: m.color, fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{m.name}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>{m.elIndices.length} element{m.elIndices.length !== 1 ? "s" : ""}</div>
                </div>
                <span style={{ background: m.tagColor + "22", color: m.tagColor, border: `1px solid ${m.tagColor}55`, borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                  {m.tag}
                </span>
              </div>

              {/* Elements */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                {m.elIndices.map(i => (
                  <span key={i} style={{ background: "#16202e", border: "1px solid #2a3a50", borderRadius: 4, padding: "2px 7px", fontSize: 11, color: "#94a3b8" }}>
                    {elements[i]?.name}
                  </span>
                ))}
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                {[
                  { label: "Internal coupling", val: `${Math.round(m.couplingDensity * 100)}%`, color: m.couplingDensity > 0.5 ? "#f87171" : m.couplingDensity > 0.25 ? "#fbbf24" : "#4ade80" },
                  { label: "Cross-module links", val: m.crossTotal, color: m.crossTotal > 3 ? "#f87171" : m.crossTotal > 0 ? "#fbbf24" : "#4ade80" },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1 }}>
                    <div style={{ color: s.color, fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}>{s.val}</div>
                    <div style={{ color: "#3a4a60", fontSize: 10, marginTop: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Interaction type bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: "#3a4a60", fontSize: 10, marginBottom: 5 }}>DOMINANT INTERACTION TYPES</div>
                <div style={{ display: "flex", gap: 3, height: 6, borderRadius: 3, overflow: "hidden" }}>
                  {(() => {
                    const total = Object.values(m.typeStrength).reduce((a, b) => a + b, 0);
                    return INTERACTION_TYPES.map(t => {
                      const pct = total > 0 ? (m.typeStrength[t.key] / total) * 100 : 0;
                      return pct > 0 ? <div key={t.key} style={{ width: `${pct}%`, background: t.color, borderRadius: 2 }} title={`${t.label}: ${Math.round(pct)}%`} /> : null;
                    });
                  })()}
                  {Object.values(m.typeStrength).every(v => v === 0) && <div style={{ flex: 1, background: "#1e2e42", borderRadius: 2 }} />}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {INTERACTION_TYPES.map(t => (
                    <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, opacity: m.typeStrength[t.key] > 0 ? 1 : 0.2 }} />
                      <span style={{ fontSize: 9, color: m.typeStrength[t.key] > 0 ? t.color : "#2a3a50", fontFamily: "monospace" }}>{t.key}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flex score */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#3a4a60", fontSize: 10 }}>FLEXIBILITY SCORE</span>
                  <span style={{ color: m.flexScore > 66 ? "#4ade80" : m.flexScore > 33 ? "#fbbf24" : "#f87171", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>{m.flexScore}</span>
                </div>
                <div style={{ height: 5, background: "#1e2e42", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${m.flexScore}%`, background: m.flexScore > 66 ? "#4ade80" : m.flexScore > 33 ? "#fbbf24" : "#f87171", borderRadius: 3, transition: "width 0.4s" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Interface analysis */}
      <Section title="CROSS-MODULE INTERFACES">
        {interfaces.length === 0 ? (
          <div style={{ color: "#3a4a60", fontSize: 13, padding: "20px 0" }}>No cross-module interactions detected — modules are fully independent.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {interfaces.map((iface, idx) => {
              const m1 = modules[iface.k1], m2 = modules[iface.k2];
              const isExpanded = expandedIface === idx;
              return (
                <div key={idx} style={{ background: "#0d1724", border: `1px solid ${iface.hasCoupled ? "#f8717144" : "#1e2e42"}`, borderRadius: 8, overflow: "hidden" }}>
                  <div onClick={() => setExpandedIface(isExpanded ? null : idx)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}>
                    {/* Module pair */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <span style={{ color: m1.color, fontWeight: 700, fontSize: 13 }}>{m1.name}</span>
                      <span style={{ color: iface.hasCoupled ? "#f87171" : "#64748b", fontSize: 16 }}>{iface.hasCoupled ? "⇄" : "→"}</span>
                      <span style={{ color: m2.color, fontWeight: 700, fontSize: 13 }}>{m2.name}</span>
                    </div>
                    {/* Type chips */}
                    <div style={{ display: "flex", gap: 5 }}>
                      {INTERACTION_TYPES.filter(t => iface.typeSet[t.key]).map(t => (
                        <span key={t.key} style={{ background: t.color + "22", color: t.color, border: `1px solid ${t.color}55`, borderRadius: 3, padding: "1px 5px", fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>{t.key}</span>
                      ))}
                    </div>
                    {/* Coupled warning */}
                    {iface.hasCoupled && <span style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>COUPLED</span>}
                    {/* Strength */}
                    <span style={{ color: "#64748b", fontFamily: "monospace", fontSize: 11, width: 24, textAlign: "right" }}>{iface.strength}</span>
                    {/* Recommendation */}
                    <span style={{ color: iface.recommendation.color, fontSize: 11, width: 220, textAlign: "right" }}>{iface.recommendation.text}</span>
                    {/* Expand */}
                    <span style={{ color: "#3a4a60", fontSize: 12 }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid #1e2e42", padding: "12px 16px" }}>
                      <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.08em", marginBottom: 10 }}>ELEMENT PAIRS</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {iface.pairs.map((p, pi) => (
                          <div key={pi} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "#080f1a", borderRadius: 5 }}>
                            <span style={{ color: m1.color, fontSize: 12 }}>{elements[p.a]?.name}</span>
                            <span style={{ color: p.cls === "coupled" ? "#f87171" : "#38bdf8", fontSize: 13 }}>{p.cls === "coupled" ? "⇄" : "→"}</span>
                            <span style={{ color: m2.color, fontSize: 12 }}>{elements[p.b]?.name}</span>
                            <span style={{ marginLeft: "auto", color: p.cls === "coupled" ? "#f87171" : "#38bdf8", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>{p.cls}</span>
                            <span style={{ color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>str {p.strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Real options map */}
      <Section title="REAL OPTIONS MAPPING">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
          {Object.entries(OPTION_META).map(([opt, meta]) => {
            const mods = modules.filter(m => m.optionType === opt);
            return (
              <div key={opt} style={{ background: "#0d1724", border: `1px solid ${meta.color}33`, borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{meta.icon}</span>
                  <span style={{ color: meta.color, fontSize: 13, fontWeight: 700 }}>{opt}</span>
                </div>
                <div style={{ color: "#64748b", fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>{meta.desc}</div>
                {mods.length === 0 ? (
                  <div style={{ color: "#2a3a50", fontSize: 11, fontStyle: "italic" }}>No modules classified here</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {mods.map(m => (
                      <div key={m.k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", background: m.color + "11", borderRadius: 5, border: `1px solid ${m.color}33` }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color }} />
                        <span style={{ color: m.color, fontSize: 12, fontWeight: 600 }}>{m.name}</span>
                        <span style={{ marginLeft: "auto", color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>flex {m.flexScore}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Lock-in hotspots */}
      {lockIns.length > 0 && (
        <Section title="LOCK-IN HOTSPOTS">
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {lockIns.map((li, idx) => {
              const m1 = modules[li.k1], m2 = modules[li.k2];
              const uw_a = UNCERTAINTY_WEIGHT[elements[li.a]?.uncertainty];
              const uw_b = UNCERTAINTY_WEIGHT[elements[li.b]?.uncertainty];
              return (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", alignItems: "center", gap: 12, padding: "10px 14px", background: "#0d1724", border: "1px solid #f8717133", borderRadius: 7 }}>
                  <div>
                    <div style={{ color: "#f87171", fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                      {elements[li.a]?.name} ⇄ {elements[li.b]?.name}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>
                      <span style={{ color: m1.color }}>{m1.name}</span> ↔ <span style={{ color: m2.color }}>{m2.name}</span>
                    </div>
                  </div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>
                    Bidirectional coupling across module boundary — intervention required before flexibility insertion
                  </div>
                  <Badge color={aggUncColor(elements[li.a])} label={aggUnc(elements[li.a])} />
                  <Badge color={aggUncColor(elements[li.b])} label={aggUnc(elements[li.b])} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#f87171", fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>risk {li.risk.toFixed(1)}</div>
                    <div style={{ color: "#3a4a60", fontSize: 10 }}>str {li.strength}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Stage 5: Network Graph ───────────────────────────────────────────────────

const W = 820, H = 580;

function useForceGraph(nodes, links, deps) {
  const posRef = useRef({});
  const simRef = useRef(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!nodes.length) return;
    if (simRef.current) simRef.current.stop();

    // Seed positions from existing or distribute in circle
    nodes.forEach((n, i) => {
      if (posRef.current[n.id]) {
        n.x = posRef.current[n.id].x;
        n.y = posRef.current[n.id].y;
      } else {
        const angle = (i / nodes.length) * 2 * Math.PI;
        n.x = W / 2 + Math.cos(angle) * 180;
        n.y = H / 2 + Math.sin(angle) * 180;
      }
    });

    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).strength(d => 0.1 + d.strength * 0.12).distance(d => Math.max(60, 150 - d.strength * 25)))
      .force("charge", d3.forceManyBody().strength(d => -200 - (d.r || 14) * 8))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(d => (d.r || 14) + 10))
      .force("x", d3.forceX(W / 2).strength(0.04))
      .force("y", d3.forceY(H / 2).strength(0.04))
      .alphaDecay(0.025)
      .on("tick", () => {
        nodes.forEach(n => {
          n.x = Math.max((n.r || 14) + 4, Math.min(W - (n.r || 14) - 4, n.x));
          n.y = Math.max((n.r || 14) + 4, Math.min(H - (n.r || 14) - 4, n.y));
          posRef.current[n.id] = { x: n.x, y: n.y };
        });
        setTick(t => t + 1);
      });

    simRef.current = sim;
    return () => sim.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { posRef, simRef };
}

function dominantType(cellAB, cellBA) {
  const scores = { S: 0, E: 0, I: 0, M: 0 };
  for (const cell of [cellAB, cellBA]) {
    if (!cell || cell.strength === 0) continue;
    INTERACTION_TYPES.forEach(t => { if (cell.types[t.key]) scores[t.key] += cell.strength; });
  }
  let best = null, bestScore = 0;
  for (const t of INTERACTION_TYPES) { if (scores[t.key] > bestScore) { best = t; bestScore = scores[t.key]; } }
  return best;
}

function convexHull(points) {
  if (points.length < 2) return null;
  if (points.length === 2) {
    const cx = (points[0][0] + points[1][0]) / 2;
    const cy = (points[0][1] + points[1][1]) / 2;
    return { cx, cy, rx: Math.abs(points[0][0] - cx) + 30, ry: Math.abs(points[0][1] - cy) + 30 };
  }
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const rx = (Math.max(...xs) - Math.min(...xs)) / 2 + 34;
  const ry = (Math.max(...ys) - Math.min(...ys)) / 2 + 34;
  return { cx, cy, rx: Math.max(rx, 40), ry: Math.max(ry, 40) };
}

function Stage5({ elements, interactions, clusterState }) {
  const { order, boundaries, clusterNames } = clusterState;
  const N = elements.length;
  const K = boundaries.length;
  const [viewMode, setViewMode] = useState("element");
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  // Cluster membership: element index → cluster index
  const clusterOfEl = (elIdx) => {
    const pos = order.indexOf(elIdx);
    if (pos < 0) return 0;
    return clusterOf(pos, boundaries);
  };

  // ── Element-level graph ──────────────────────────────────
  const elNodes = elements.map((el, i) => {
    let totalS = 0;
    for (let j = 0; j < N; j++) {
      if (j !== i) totalS += totalStrength(interactions, i, j);
    }
    const k = clusterOfEl(i);
    return { id: i, label: el.name, cluster: k, color: CLUSTER_COLORS[k % CLUSTER_COLORS.length], uncertainty: el.uncertainty, r: 12 + Math.min(totalS, 12), totalS };
  });

  const elLinks = [];
  for (let a = 0; a < N; a++) {
    for (let b = a + 1; b < N; b++) {
      const s = totalStrength(interactions, a, b);
      if (s === 0) continue;
      const cellAB = interactions[cellKey(a, b)];
      const cellBA = interactions[cellKey(b, a)];
      const cls = classifyPair(interactions, a, b);
      const domType = dominantType(cellAB, cellBA);
      elLinks.push({ id: `${a}-${b}`, source: a, target: b, strength: s, cls, domType, coupled: cls === "coupled" });
    }
  }

  // ── Module-level graph ───────────────────────────────────
  const modNodes = boundaries.map((_, k) => {
    const end = k < K - 1 ? boundaries[k + 1] : order.length;
    const size = end - boundaries[k];
    return { id: k, label: clusterNames[k] || `Module ${k}`, cluster: k, color: CLUSTER_COLORS[k % CLUSTER_COLORS.length], r: 18 + size * 3, size };
  });

  const modLinks = [];
  for (let k1 = 0; k1 < K; k1++) {
    for (let k2 = k1 + 1; k2 < K; k2++) {
      const end1 = k1 < K - 1 ? boundaries[k1 + 1] : order.length;
      const end2 = k2 < K - 1 ? boundaries[k2 + 1] : order.length;
      const els1 = order.slice(boundaries[k1], end1);
      const els2 = order.slice(boundaries[k2], end2);
      let strength = 0, hasCoupled = false;
      let typeScores = { S: 0, E: 0, I: 0, M: 0 };
      for (const a of els1) {
        for (const b of els2) {
          const s = totalStrength(interactions, a, b);
          if (s > 0) {
            strength += s;
            if (classifyPair(interactions, a, b) === "coupled") hasCoupled = true;
            const ab = interactions[cellKey(a, b)], ba = interactions[cellKey(b, a)];
            INTERACTION_TYPES.forEach(t => {
              if (ab?.types[t.key]) typeScores[t.key] += ab.strength;
              if (ba?.types[t.key]) typeScores[t.key] += ba.strength;
            });
          }
        }
      }
      if (strength === 0) continue;
      let bestT = null, bestS = 0;
      INTERACTION_TYPES.forEach(t => { if (typeScores[t.key] > bestS) { bestT = t; bestS = typeScores[t.key]; } });
      modLinks.push({ id: `m${k1}-${k2}`, source: k1, target: k2, strength, cls: hasCoupled ? "coupled" : "sequential", domType: bestT, coupled: hasCoupled });
    }
  }

  const nodes = viewMode === "element" ? elNodes : modNodes;
  const links = viewMode === "element" ? elLinks : modLinks;

  const { posRef, simRef } = useForceGraph(nodes, links, [viewMode, N, K, JSON.stringify(Object.keys(interactions))]);

  // ── Drag ────────────────────────────────────────────────
  const onMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    if (simRef.current) simRef.current.alphaTarget(0.1).restart();
    node.fx = node.x; node.fy = node.y;
    dragRef.current = { nodeId, node };
    const rect = svgRef.current.getBoundingClientRect();
    const onMove = (ev) => {
      const nx = ev.clientX - rect.left, ny = ev.clientY - rect.top;
      node.fx = Math.max(node.r + 4, Math.min(W - node.r - 4, nx));
      node.fy = Math.max(node.r + 4, Math.min(H - node.r - 4, ny));
      if (simRef.current) simRef.current.alphaTarget(0.1).restart();
    };
    const onUp = () => {
      node.fx = null; node.fy = null;
      if (simRef.current) simRef.current.alphaTarget(0);
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onNodeClick = (e, nodeId) => {
    e.stopPropagation();
    setSelected(s => s === nodeId ? null : nodeId);
  };

  // ── Visibility logic ─────────────────────────────────────
  const isLinkVisible = (link) => {
    if (filterType && (!link.domType || link.domType.key !== filterType)) return false;
    return true;
  };
  const isLinkHighlighted = (link) => {
    if (selected === null) return true;
    const src = typeof link.source === "object" ? link.source.id : link.source;
    const tgt = typeof link.target === "object" ? link.target.id : link.target;
    return src === selected || tgt === selected;
  };

  if (N === 0) return <div style={{ border: "1px dashed #2a3a50", borderRadius: 10, padding: "48px 24px", textAlign: "center", color: "#3a4a60" }}>Add functional elements in Stage 1 first.</div>;

  // Cluster halos for element view
  const clusterHalos = viewMode === "element" ? boundaries.map((_, k) => {
    const members = nodes.filter(n => n.cluster === k);
    const pts = members.map(n => [posRef.current[n.id]?.x ?? n.x ?? W / 2, posRef.current[n.id]?.y ?? n.y ?? H / 2]);
    return { k, color: CLUSTER_COLORS[k % CLUSTER_COLORS.length], hull: convexHull(pts), name: clusterNames[k] || `M${k}` };
  }) : [];

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Network Graph</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>Drag nodes to reposition. Click a node to highlight its connections. Toggle to module view to see collapsed architecture.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: "1px solid #2a3a50", borderRadius: 8, overflow: "hidden" }}>
            {[{ v: "element", l: "Elements" }, { v: "module", l: "Modules" }].map(m => (
              <button key={m.v} onClick={() => { setViewMode(m.v); setSelected(null); }} style={{
                padding: "7px 14px", background: viewMode === m.v ? "#38bdf822" : "transparent", border: "none",
                cursor: "pointer", color: viewMode === m.v ? "#38bdf8" : "#64748b", fontSize: 12, fontWeight: 600
              }}>{m.l}</button>
            ))}
          </div>
          {/* Type filter */}
          <div style={{ display: "flex", border: "1px solid #2a3a50", borderRadius: 8, overflow: "hidden" }}>
            <button onClick={() => setFilterType(null)} style={{ padding: "7px 10px", background: !filterType ? "#38bdf822" : "transparent", border: "none", cursor: "pointer", color: !filterType ? "#38bdf8" : "#64748b", fontSize: 11, fontWeight: 600 }}>All</button>
            {INTERACTION_TYPES.map(t => (
              <button key={t.key} onClick={() => setFilterType(f => f === t.key ? null : t.key)} style={{
                padding: "7px 10px", background: filterType === t.key ? t.color + "22" : "transparent", border: "none",
                cursor: "pointer", color: filterType === t.key ? t.color : "#64748b", fontSize: 11, fontWeight: 700
              }}>{t.key}</button>
            ))}
          </div>
          {/* Re-heat */}
          <button onClick={() => simRef.current && simRef.current.alpha(0.6).restart()} style={{
            padding: "7px 14px", borderRadius: 8, background: "transparent", border: "1px solid #2a3a50",
            cursor: "pointer", color: "#64748b", fontSize: 12, fontWeight: 600
          }}>↺ Reheat</button>
        </div>
      </div>

      {/* Graph SVG */}
      <div style={{ background: "#080f1a", border: "1px solid #1e2e42", borderRadius: 12, overflow: "hidden", position: "relative" }}>
        <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", cursor: "default" }}
          onClick={() => setSelected(null)}>
          <defs>
            {/* Arrow markers */}
            {["#38bdf8", "#a78bfa", "#fb923c", "#4ade80", "#f87171", "#64748b"].map(color => (
              <marker key={color} id={`arrow-${color.slice(1)}`} markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto">
                <path d="M0,0 L0,5 L7,2.5 z" fill={color} opacity="0.7" />
              </marker>
            ))}
          </defs>

          {/* Cluster halos (element view) */}
          {clusterHalos.map(({ k, color, hull, name }) => hull && (
            <g key={k}>
              <ellipse cx={hull.cx} cy={hull.cy} rx={hull.rx} ry={hull.ry}
                fill={color + "0a"} stroke={color} strokeWidth={1.5} strokeDasharray="5 3" opacity={0.7} />
              <text x={hull.cx - hull.rx + 8} y={hull.cy - hull.ry + 14}
                fill={color} fontSize={10} fontFamily="monospace" fontWeight="600" opacity={0.8}>{name}</text>
            </g>
          ))}

          {/* Links */}
          {links.filter(isLinkVisible).map(link => {
            const srcId = typeof link.source === "object" ? link.source.id : link.source;
            const tgtId = typeof link.target === "object" ? link.target.id : link.target;
            const srcPos = posRef.current[srcId] || { x: W / 2, y: H / 2 };
            const tgtPos = posRef.current[tgtId] || { x: W / 2, y: H / 2 };
            const srcNode = nodes.find(n => n.id === srcId);
            const tgtNode = nodes.find(n => n.id === tgtId);
            const color = link.domType ? link.domType.color : "#64748b";
            const highlighted = isLinkHighlighted(link);
            const opacity = selected !== null ? (highlighted ? 0.85 : 0.08) : 0.5;
            const strokeW = 0.5 + link.strength * 0.7;

            // Offset line to edge of node radius
            const dx = tgtPos.x - srcPos.x, dy = tgtPos.y - srcPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const sr = (srcNode?.r || 14), tr = (tgtNode?.r || 14);
            const x1 = srcPos.x + (dx / dist) * sr;
            const y1 = srcPos.y + (dy / dist) * sr;
            const x2 = tgtPos.x - (dx / dist) * (tr + 6);
            const y2 = tgtPos.y - (dy / dist) * (tr + 6);

            return (
              <g key={link.id} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={link.coupled ? "#f87171" : color}
                  strokeWidth={link.coupled ? strokeW + 1 : strokeW}
                  strokeDasharray={link.coupled ? "none" : "none"}
                  markerEnd={`url(#arrow-${(link.coupled ? "#f87171" : color).slice(1)})`}
                />
                {link.coupled && (
                  <line x1={x2} y1={y2} x2={x1} y2={y1}
                    stroke="#f87171" strokeWidth={strokeW}
                    markerEnd={`url(#arrow-f87171)`} opacity={0.6}
                  />
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const pos = posRef.current[node.id] || { x: W / 2, y: H / 2 };
            const isSelected = selected === node.id;
            const isConnected = selected !== null && links.some(l => {
              const s = typeof l.source === "object" ? l.source.id : l.source;
              const t = typeof l.target === "object" ? l.target.id : l.target;
              return (s === selected && t === node.id) || (t === selected && s === node.id);
            });
            const dimmed = selected !== null && !isSelected && !isConnected;
            const uc = aggUncColor(elements[viewMode === "element" ? node.id : order[boundaries[node.id]]] || {});

            return (
              <g key={node.id} transform={`translate(${pos.x},${pos.y})`}
                opacity={dimmed ? 0.15 : 1}
                style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                onMouseDown={e => onMouseDown(e, node.id)}
                onClick={e => onNodeClick(e, node.id)}
              >
                {/* Selection ring */}
                {isSelected && <circle r={node.r + 5} fill="none" stroke={node.color} strokeWidth={2} opacity={0.6} />}
                {/* Uncertainty ring — radius scales with aggregate uncertainty */}
                {(() => {
                  const ringR = node.r + (UNCERTAINTY_WEIGHT[aggUnc(elements[viewMode === "element" ? node.id : order[boundaries[node.id]]] || {})] || 1) * 3;
                  return <circle r={ringR} fill="none" stroke={uc} strokeWidth={1.5} opacity={0.4} strokeDasharray="3 2" />;
                })()}
                {/* Node body */}
                <circle r={node.r} fill={node.color + "22"} stroke={node.color} strokeWidth={isSelected ? 2.5 : 1.5} />
                {/* Label */}
                <text y={node.r + 13} textAnchor="middle" fill={node.color} fontSize={9} fontFamily="monospace" fontWeight="600"
                  style={{ pointerEvents: "none", userSelect: "none" }}>
                  {node.label.length > 14 ? node.label.slice(0, 13) + "…" : node.label}
                </text>
                {/* Module view: show element count */}
                {viewMode === "module" && (
                  <text textAnchor="middle" dy="0.35em" fill={node.color} fontSize={11} fontFamily="monospace" fontWeight="700"
                    style={{ pointerEvents: "none" }}>{node.size}</text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Selected node info panel */}
        {selected !== null && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: "#16202eee", border: `1px solid ${nodes.find(n => n.id === selected)?.color || "#2a3a50"}55`,
            borderRadius: 8, padding: "12px 14px", width: 200, backdropFilter: "blur(8px)"
          }}>
            {(() => {
              const node = nodes.find(n => n.id === selected);
              if (!node) return null;
              const connectedLinks = links.filter(l => {
                const s = typeof l.source === "object" ? l.source.id : l.source;
                const t = typeof l.target === "object" ? l.target.id : l.target;
                return s === selected || t === selected;
              });
              return (
                <>
                  <div style={{ color: node.color, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{node.label}</div>
                  {viewMode === "element" && (() => {
                    const el = elements[node.id];
                    if (!el) return null;
                    return (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                          <Badge color={aggUncColor(el)} label={`${aggUnc(el)} risk`} />
                          <Badge color="#64748b" label={el.category} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {UNCERTAINTY_DIMS.map(dim => (
                            <div key={dim.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ color: "#3a4a60", fontSize: 10 }}>{dim.short}</span>
                              <Badge color={UNCERTAINTY_COLOR[el[dim.key] || "Low"]} label={el[dim.key] || "Low"} />
                            </div>
                          ))}
                        </div>
                        <div style={{ color: "#3a4a60", fontSize: 10, marginTop: 6, lineHeight: 1.4 }}>
                          Dashed ring = aggregate uncertainty. Larger ring = higher risk exposure.
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>{connectedLinks.length} connection{connectedLinks.length !== 1 ? "s" : ""}</div>
                  {connectedLinks.filter(l => l.coupled).length > 0 && (
                    <div style={{ color: "#f87171", fontSize: 11 }}>⚠ {connectedLinks.filter(l => l.coupled).length} coupled (lock-in risk)</div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Legend row */}
      <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="24" height="12"><line x1="0" y1="6" x2="24" y2="6" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#arrow-64748b)" /></svg>
          <span style={{ color: "#64748b", fontSize: 11 }}>Sequential</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="24" height="12">
            <line x1="0" y1="5" x2="24" y2="5" stroke="#f87171" strokeWidth="2" />
            <line x1="24" y1="7" x2="0" y2="7" stroke="#f87171" strokeWidth="1.5" />
          </svg>
          <span style={{ color: "#f87171", fontSize: 11 }}>Coupled (lock-in)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ position: "relative", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "transparent", border: "1.5px dashed #fbbf24", position: "absolute" }} />
            <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#fbbf2422", border: "1px solid #fbbf24" }} />
          </div>
          <div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>Uncertainty ring</div>
            <div style={{ color: "#3a4a60", fontSize: 10 }}>Dashed = aggregate of input, output &amp; life uncertainty. Color: green = Low, amber = Medium, red = High.</div>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          {INTERACTION_TYPES.map(t => (
            <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
              <span style={{ color: t.color, fontSize: 11 }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stage 6: Plan View ───────────────────────────────────────────────────────

const DEFAULT_PLAN_STATE = {
  placements: [],
  boundary: { x: 80, y: 60, w: 640, h: 380 },
  gridOn: true,
};

function Stage6({ elements, interactions, clusterState, planState, setPlanState }) {
  const { placements, boundary, gridOn } = planState;
  const [armed, setArmed] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const snap = v => gridOn ? Math.round(v / PLAN_GRID) * PLAN_GRID : v;

  const getSVGPos = e => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };

  const clusterOfEl = idx => {
    const pos = clusterState.order.indexOf(idx);
    if (pos < 0) return 0;
    return clusterOf(pos, clusterState.boundaries);
  };

  const elColor = idx => {
    if (!clusterState.boundaries.length) return "#64748b";
    return CLUSTER_COLORS[clusterOfEl(idx) % CLUSTER_COLORS.length];
  };

  const placeElement = pos => {
    if (armed === null) return;
    const el = elements[armed];
    if (!el) return;
    const shape = el.shape || "rect";
    const { w, h } = DEFAULT_SHAPE_SIZE[shape] || { w: 80, h: 50 };
    const count = placements.filter(p => p.elementIdx === armed).length;
    setPlanState(s => ({
      ...s,
      placements: [...s.placements, {
        id: `p-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        elementIdx: armed,
        instanceNum: count + 1,
        x: snap(pos.x), y: snap(pos.y), w, h, rotation: 0,
      }],
    }));
    // Keep armed so user can place another instance; press Escape or click sidebar to disarm
  };

  const startDrag = (e, type, data) => {
    e.stopPropagation();
    const startPos = getSVGPos(e);
    const startData = { ...data };
    dragRef.current = { type, startPos, startData, data };

    const onMove = ev => {
      if (!dragRef.current) return;
      const cur = getSVGPos(ev);
      const dx = cur.x - dragRef.current.startPos.x;
      const dy = cur.y - dragRef.current.startPos.y;
      if (type === "element") {
        const { id } = data;
        setPlanState(s => ({ ...s, placements: s.placements.map(p => p.id === id ? { ...p, x: snap(startData.x + dx), y: snap(startData.y + dy) } : p) }));
      } else if (type === "boundary-move") {
        setPlanState(s => ({ ...s, boundary: { ...s.boundary, x: snap(startData.x + dx), y: snap(startData.y + dy) } }));
      } else if (type === "boundary-resize") {
        const { corner, x: bx, y: by, w: bw, h: bh } = startData;
        let nb = { x: bx, y: by, w: bw, h: bh };
        if (corner === "se") { nb.w = Math.max(120, bw + dx); nb.h = Math.max(80, bh + dy); }
        else if (corner === "ne") { nb.w = Math.max(120, bw + dx); nb.y = by + dy; nb.h = Math.max(80, bh - dy); }
        else if (corner === "sw") { nb.x = bx + dx; nb.w = Math.max(120, bw - dx); nb.h = Math.max(80, bh + dy); }
        else if (corner === "nw") { nb.x = bx + dx; nb.y = by + dy; nb.w = Math.max(120, bw - dx); nb.h = Math.max(80, bh - dy); }
        setPlanState(s => ({ ...s, boundary: nb }));
      }
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const rotate = (id, delta) => setPlanState(s => ({ ...s, placements: s.placements.map(p => p.id === id ? { ...p, rotation: ((p.rotation || 0) + delta + 360) % 360 } : p) }));
  const removePlacement = id => { setPlanState(s => ({ ...s, placements: s.placements.filter(p => p.id !== id) })); setSelected(null); };

  // Escape to disarm
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") { setArmed(null); setSelected(null); setSelectedLine(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectedPlacement = placements.find(p => p.id === selected);

  // Relationship lines from selected element
  const relLines = [];
  if (selectedPlacement) {
    const a = selectedPlacement.elementIdx;
    for (const p2 of placements) {
      if (p2.id === selected) continue;
      const s = totalStrength(interactions, a, p2.elementIdx);
      if (!s) continue;
      const cls = classifyPair(interactions, a, p2.elementIdx);
      const dom = dominantType(interactions[cellKey(a, p2.elementIdx)], interactions[cellKey(p2.elementIdx, a)]);
      relLines.push({ from: selectedPlacement, to: p2, a, b: p2.elementIdx, strength: s, cls, domType: dom });
    }
  }

  const connectedIds = new Set(relLines.map(l => l.to.id));
  const isDimmed = p => selected && p.id !== selected && !connectedIds.has(p.id);

  if (!elements.length) return <div style={{ border: "1px dashed #2a3a50", borderRadius: 10, padding: "48px 24px", textAlign: "center", color: "#3a4a60" }}>Add functional elements in Stage 1 first.</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Plan View</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>Place elements on the canvas. Click an element to highlight its relationships. Drag boundary corners to resize the site.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPlanState(s => ({ ...s, gridOn: !s.gridOn }))} style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", background: gridOn ? "#38bdf811" : "transparent", border: "1px solid #2a3a50", color: gridOn ? "#38bdf8" : "#64748b", fontSize: 12, fontWeight: 600 }}>⊞ Grid</button>
          <button onClick={() => { setPlanState(s => ({ ...s, placements: [] })); setSelected(null); setArmed(null); }} style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", background: "transparent", border: "1px solid #3a2222", color: "#f87171", fontSize: 12 }}>Clear canvas</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        {/* Sidebar palette */}
        <div style={{ width: 170, flexShrink: 0 }}>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 8 }}>ELEMENTS</div>
          {armed !== null && (
            <div style={{ background: "#38bdf811", border: "1px solid #38bdf844", borderRadius: 6, padding: "6px 10px", marginBottom: 8, fontSize: 11, color: "#38bdf8" }}>
              Click canvas to place. Press <kbd style={{ background: "#1e2e42", borderRadius: 3, padding: "0 4px", fontSize: 10 }}>Esc</kbd> to cancel.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {elements.map((el, i) => {
              const instances = placements.filter(p => p.elementIdx === i);
              const isArmed = armed === i;
              const cc = elColor(i);
              return (
                <div key={i}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 9px", borderRadius: 6,
                    background: isArmed ? "#38bdf811" : instances.length ? cc + "11" : "#0d1724",
                    border: `1px solid ${isArmed ? "#38bdf8" : instances.length ? cc + "55" : "#1e2e42"}`
                  }}>
                    <svg width={22} height={22} viewBox="-13 -13 26 26" style={{ flexShrink: 0 }}>
                      <ShapeEl shape={el.shape || "rect"} w={20} h={16} color={instances.length ? cc : "#64748b"} selected={false} dimmed={false} />
                    </svg>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ color: instances.length ? cc : "#94a3b8", fontSize: 11, fontWeight: instances.length ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{el.name}</div>
                      <div style={{ color: instances.length ? cc + "88" : "#3a4a60", fontSize: 9, fontFamily: "monospace" }}>
                        {instances.length ? `${instances.length}× placed` : SHAPES.find(s => s.key === (el.shape || "rect"))?.label}
                      </div>
                    </div>
                    <button onClick={() => setArmed(isArmed ? null : i)} title={isArmed ? "Cancel" : "Place instance"} style={{
                      width: 22, height: 22, borderRadius: 5, cursor: "pointer", flexShrink: 0,
                      background: isArmed ? "#38bdf8" : "transparent",
                      border: `1px solid ${isArmed ? "#38bdf8" : "#2a3a50"}`,
                      color: isArmed ? "#0a1628" : "#64748b", fontSize: 14, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", padding: 0
                    }}>{isArmed ? "✕" : "+"}</button>
                  </div>
                  {/* Per-instance chips */}
                  {instances.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 3, paddingLeft: 8 }}>
                      {instances.map(p => (
                        <button key={p.id} onClick={() => { setSelected(p.id); setArmed(null); }} style={{
                          padding: "2px 7px", borderRadius: 4, cursor: "pointer", fontSize: 9, fontFamily: "monospace",
                          background: selected === p.id ? cc + "33" : "transparent",
                          border: `1px solid ${selected === p.id ? cc : cc + "44"}`,
                          color: selected === p.id ? cc : cc + "88"
                        }}>#{p.instanceNum || 1}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Line type legend */}
          <div style={{ marginTop: 20 }}>
            <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 8 }}>LINES</div>
            {INTERACTION_TYPES.map(t => (
              <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <svg width={22} height={6}><line x1="0" y1="3" x2="22" y2="3" stroke={t.color} strokeWidth="2.5" /></svg>
                <span style={{ color: "#64748b", fontSize: 10 }}>{t.label}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
              <svg width={22} height={8}>
                <line x1="0" y1="3" x2="22" y2="3" stroke="#f87171" strokeWidth="2.5" />
                <line x1="0" y1="5.5" x2="22" y2="5.5" stroke="#f87171" strokeWidth="1" opacity="0.5" strokeDasharray="3 2" />
              </svg>
              <span style={{ color: "#f87171", fontSize: 10 }}>Coupled</span>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, background: "#04090f", border: "1px solid #1e2e42", borderRadius: 10, overflow: "hidden", position: "relative" }}>
          <svg ref={svgRef} width="100%" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            style={{ display: "block", cursor: armed !== null ? "crosshair" : "default" }}
            onMouseMove={e => { if (armed !== null && svgRef.current) { const p = getSVGPos(e); setMousePos({ x: snap(p.x), y: snap(p.y) }); } }}
            onMouseLeave={() => setMousePos(null)}
            onClick={e => {
              if (armed !== null && svgRef.current) { placeElement(getSVGPos(e)); }
              else { setSelected(null); setSelectedLine(null); }
            }}
          >
            {/* Grid */}
            {gridOn && (
              <g opacity={0.12}>
                {Array.from({length: Math.ceil(CANVAS_W / PLAN_GRID) + 1}, (_, i) => <line key={`v${i}`} x1={i*PLAN_GRID} y1={0} x2={i*PLAN_GRID} y2={CANVAS_H} stroke="#38bdf8" strokeWidth={0.5} />)}
                {Array.from({length: Math.ceil(CANVAS_H / PLAN_GRID) + 1}, (_, i) => <line key={`h${i}`} x1={0} y1={i*PLAN_GRID} x2={CANVAS_W} y2={i*PLAN_GRID} stroke="#38bdf8" strokeWidth={0.5} />)}
              </g>
            )}

            {/* Boundary */}
            <g>
              <rect x={boundary.x} y={boundary.y} width={boundary.w} height={boundary.h}
                fill="#38bdf806" stroke="#38bdf855" strokeWidth={1.5} strokeDasharray="9 5"
                style={{ cursor: "move" }}
                onMouseDown={e => { e.stopPropagation(); startDrag(e, "boundary-move", { ...boundary }); }} />
              <text x={boundary.x + 8} y={boundary.y + 16} fill="#38bdf855" fontSize={10} fontFamily="monospace" style={{ pointerEvents: "none" }}>site boundary</text>
              {[["nw", boundary.x, boundary.y], ["ne", boundary.x + boundary.w, boundary.y],
                ["sw", boundary.x, boundary.y + boundary.h], ["se", boundary.x + boundary.w, boundary.y + boundary.h]
              ].map(([corner, cx, cy]) => (
                <rect key={corner} x={cx - 5} y={cy - 5} width={10} height={10} rx={2}
                  fill="#38bdf8" stroke="#04090f" strokeWidth={1.5}
                  style={{ cursor: corner === "se" || corner === "nw" ? "nwse-resize" : "nesw-resize" }}
                  onMouseDown={e => { e.stopPropagation(); startDrag(e, "boundary-resize", { ...boundary, corner }); }} />
              ))}
            </g>

            {/* Relationship lines */}
            {relLines.map((line, idx) => {
              const { x: x1, y: y1 } = line.from, { x: x2, y: y2 } = line.to;
              const color = line.domType ? line.domType.color : "#64748b";
              const isSL = selectedLine && selectedLine.a === line.a && selectedLine.b === line.b;
              const sw = isSL ? 1 + line.strength * 0.7 : 0.5 + line.strength * 0.55;
              return (
                <g key={idx}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={14} style={{ cursor: "pointer" }}
                    onClick={e => { e.stopPropagation(); setSelectedLine(isSL ? null : { a: line.a, b: line.b }); }} />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={line.cls === "coupled" ? "#f87171" : color} strokeWidth={sw} opacity={isSL ? 1 : 0.8} style={{ pointerEvents: "none" }} />
                  {line.cls === "coupled" && <line x1={x2} y1={y2} x2={x1} y2={y1} stroke="#f87171" strokeWidth={sw * 0.5} strokeDasharray="4 3" opacity={0.5} style={{ pointerEvents: "none" }} />}
                  {isSL && <text x={(x1+x2)/2} y={(y1+y2)/2 - 7} textAnchor="middle" fill={color} fontSize={9} fontFamily="monospace" fontWeight="700" style={{ pointerEvents: "none" }}>{line.strength} · {line.cls}</text>}
                </g>
              );
            })}

            {/* Placed elements */}
            {placements.map(p => {
              const el = elements[p.elementIdx];
              if (!el) return null;
              const shape = el.shape || "rect";
              const cc = elColor(p.elementIdx);
              const isSel = selected === p.id;
              const dim = isDimmed(p);
              const totalInst = placements.filter(q => q.elementIdx === p.elementIdx).length;
              const instLabel = totalInst > 1 ? ` #${p.instanceNum || 1}` : "";
              const displayName = (el.name + instLabel);
              return (
                <g key={p.id} transform={`translate(${p.x},${p.y}) rotate(${p.rotation || 0})`}
                  style={{ cursor: "move" }}
                  onMouseDown={e => { e.stopPropagation(); startDrag(e, "element", { id: p.id, x: p.x, y: p.y }); }}
                  onClick={e => { e.stopPropagation(); setSelected(isSel ? null : p.id); setSelectedLine(null); setArmed(null); }}
                >
                  {isSel && <ShapeEl shape={shape} w={p.w + 10} h={p.h + 10} color="#38bdf8" selected={false} dimmed={false} />}
                  <ShapeEl shape={shape} w={p.w} h={p.h} color={cc} selected={isSel} dimmed={dim} />
                  <text y={p.h / 2 + 12} textAnchor="middle" fill={dim ? "#3a4a60" : isSel ? "#fff" : cc}
                    fontSize={9} fontFamily="monospace" fontWeight="600" style={{ pointerEvents: "none", userSelect: "none" }}>
                    {displayName.length > 15 ? displayName.slice(0, 14) + "…" : displayName}
                  </text>
                  {isSel && <circle r={3} fill="#38bdf8" style={{ pointerEvents: "none" }} />}
                </g>
              );
            })}

            {/* Ghost (armed element following mouse) */}
            {armed !== null && mousePos && (() => {
              const el = elements[armed];
              if (!el) return null;
              const shape = el.shape || "rect";
              const { w, h } = DEFAULT_SHAPE_SIZE[shape] || { w: 80, h: 50 };
              const cc = elColor(armed);
              return (
                <g transform={`translate(${mousePos.x},${mousePos.y})`} opacity={0.5} style={{ pointerEvents: "none" }}>
                  <ShapeEl shape={shape} w={w} h={h} color={cc} selected={false} dimmed={false} />
                </g>
              );
            })()}
          </svg>

          {/* Selected element toolbar */}
          {selectedPlacement && (() => {
            const el = elements[selectedPlacement.elementIdx];
            if (!el) return null;
            const cc = elColor(selectedPlacement.elementIdx);
            return (
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: "#16202eee", border: `1px solid ${cc}55`, borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(8px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <svg width={18} height={18} viewBox="-11 -11 22 22">
                    <ShapeEl shape={el.shape || "rect"} w={18} h={14} color={cc} selected={false} dimmed={false} />
                  </svg>
                  <span style={{ color: cc, fontSize: 12, fontWeight: 700 }}>
                    {el.name}
                    {(() => {
                      const total = placements.filter(p => p.elementIdx === selectedPlacement.elementIdx).length;
                      return total > 1 ? <span style={{ color: cc + "88", fontWeight: 400 }}> #{selectedPlacement.instanceNum || 1}/{total}</span> : null;
                    })()}
                  </span>
                </div>
                <div style={{ width: 1, height: 18, background: "#2a3a50" }} />
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => rotate(selectedPlacement.id, -45)} style={{ padding: "4px 9px", borderRadius: 5, background: "transparent", border: "1px solid #2a3a50", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>↺ 45°</button>
                  <button onClick={() => rotate(selectedPlacement.id, 45)} style={{ padding: "4px 9px", borderRadius: 5, background: "transparent", border: "1px solid #2a3a50", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>↻ 45°</button>
                </div>
                <div style={{ width: 1, height: 18, background: "#2a3a50" }} />
                <span style={{ color: "#64748b", fontSize: 11 }}>{relLines.length} connection{relLines.length !== 1 ? "s" : ""}</span>
                {relLines.filter(l => l.cls === "coupled").length > 0 && <span style={{ color: "#f87171", fontSize: 11 }}>⚠ {relLines.filter(l => l.cls === "coupled").length} coupled</span>}
                <button onClick={() => removePlacement(selectedPlacement.id)} style={{ padding: "4px 9px", borderRadius: 5, background: "transparent", border: "1px solid #3a2222", color: "#f87171", cursor: "pointer", fontSize: 12 }}>Remove</button>
              </div>
            );
          })()}

          {/* Line detail panel */}
          {selectedLine && (() => {
            const cellAB = interactions[cellKey(selectedLine.a, selectedLine.b)];
            const cellBA = interactions[cellKey(selectedLine.b, selectedLine.a)];
            const types = INTERACTION_TYPES.filter(t => cellAB?.types[t.key] || cellBA?.types[t.key]);
            const cls = classifyPair(interactions, selectedLine.a, selectedLine.b);
            const str = totalStrength(interactions, selectedLine.a, selectedLine.b);
            const clsColor = cls === "coupled" ? "#f87171" : cls === "sequential" ? "#38bdf8" : "#4ade80";
            return (
              <div style={{ position: "absolute", top: 12, right: 12, background: "#16202eee", border: "1px solid #2a3a5099", borderRadius: 8, padding: "12px 14px", width: 210, backdropFilter: "blur(8px)" }}>
                <div style={{ color: "#94a3b8", fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>INTERFACE</div>
                <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                  {elements[selectedLine.a]?.name} <span style={{ color: clsColor }}>↔</span> {elements[selectedLine.b]?.name}
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                  {types.map(t => <Badge key={t.key} color={t.color} label={t.label} />)}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge color={clsColor} label={cls} />
                  <span style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>str {str}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Demo project ─────────────────────────────────────────────────────────────

const DEMO_PROJECT = {
  name: "Modern Data Center — Demo",
  elements: [
    { id: 1000, name: "Utility Grid Connection", description: "HV supply stepped down via site transformers", uncInput: "Low", uncOutput: "Medium", uncLife: "Low", category: "Power", shape: "rect" },
    { id: 1001, name: "Diesel Generators", description: "Emergency backup generation, N+1 redundancy", uncInput: "Low", uncOutput: "Low", uncLife: "Medium", category: "Power", shape: "rect" },
    { id: 1002, name: "UPS Systems", description: "Bridges grid-to-generator gap; conditions power quality", uncInput: "Low", uncOutput: "Low", uncLife: "Low", category: "Power", shape: "rect" },
    { id: 1003, name: "Power Distribution (PDU)", description: "Distributes conditioned power to all loads at rack level", uncInput: "Low", uncOutput: "Low", uncLife: "Low", category: "Power", shape: "rect" },
    { id: 1004, name: "IT Compute (Server Racks)", description: "Primary revenue load; density, mix and wattage evolve rapidly", uncInput: "High", uncOutput: "High", uncLife: "High", category: "Compute", shape: "rect" },
    { id: 1005, name: "Network Switching Fabric", description: "Spine-leaf topology; carries all traffic in and out of the facility", uncInput: "Medium", uncOutput: "Medium", uncLife: "Medium", category: "Network", shape: "hexagon" },
    { id: 1006, name: "CRAC / CRAH Cooling Units", description: "Row- or room-level air cooling; airflow coupled to rack layout", uncInput: "High", uncOutput: "Medium", uncLife: "Medium", category: "Thermal", shape: "rect" },
    { id: 1007, name: "Chilled Water Plant", description: "Chillers, cooling towers and pumps supplying chilled water to CRAHs", uncInput: "Medium", uncOutput: "Low", uncLife: "Low", category: "Thermal", shape: "circle" },
    { id: 1008, name: "Building Structure", description: "Slab, columns, raised floor; load-bearing limits constrain equipment", uncInput: "Low", uncOutput: "Low", uncLife: "Low", category: "Structure", shape: "dashrect" },
    { id: 1009, name: "Physical Security", description: "Perimeter control, CCTV, mantraps and badge access", uncInput: "Low", uncOutput: "Low", uncLife: "Medium", category: "Security", shape: "roundrect" },
    { id: 1010, name: "DCIM / BMS Controls", description: "Monitors and orchestrates power, cooling and compute; primary PUE lever", uncInput: "Medium", uncOutput: "Medium", uncLife: "High", category: "Controls", shape: "hexagon" },
    { id: 1011, name: "Fire Suppression", description: "Pre-action or clean-agent system; zones aligned with server rows", uncInput: "Low", uncOutput: "Low", uncLife: "Low", category: "Security", shape: "dashrect" },
  ],
  interactions: {
    // Power chain (sequential, feed-forward)
    "0-2": { types: { S:false, E:true,  I:false, M:false }, strength: 3, direction: "AB" },   // Grid → UPS
    "1-2": { types: { S:false, E:true,  I:false, M:false }, strength: 2, direction: "AB" },   // Generators → UPS (failover)
    "2-3": { types: { S:false, E:true,  I:false, M:false }, strength: 3, direction: "AB" },   // UPS → PDU
    "3-4": { types: { S:false, E:true,  I:false, M:false }, strength: 3, direction: "AB" },   // PDU → Compute
    "3-5": { types: { S:false, E:true,  I:false, M:false }, strength: 2, direction: "AB" },   // PDU → Network
    "3-6": { types: { S:false, E:true,  I:false, M:false }, strength: 3, direction: "AB" },   // PDU → Cooling
    "3-7": { types: { S:false, E:true,  I:false, M:false }, strength: 2, direction: "AB" },   // PDU → Chilled Water Plant
    // IT core — bidirectional / coupled
    "4-5": { types: { S:false, E:false, I:true,  M:false }, strength: 3, direction: "both" }, // Compute ↔ Network
    "4-6": { types: { S:true,  E:true,  I:false, M:false }, strength: 3, direction: "both" }, // Compute ↔ Cooling ← PRIMARY LOCK-IN
    "4-8": { types: { S:true,  E:false, I:false, M:false }, strength: 2, direction: "AB" },   // Compute → Structure (floor loading)
    "4-11":{ types: { S:true,  E:false, I:false, M:false }, strength: 1, direction: "AB" },   // Compute → Fire Suppression (zone)
    // Thermal loop
    "6-7": { types: { S:false, E:false, I:false, M:true  }, strength: 3, direction: "both" }, // Cooling ↔ Chilled Water
    "6-8": { types: { S:true,  E:false, I:false, M:false }, strength: 2, direction: "both" }, // Cooling ↔ Structure
    // Structure as spatial anchor
    "0-8": { types: { S:true,  E:false, I:false, M:false }, strength: 1, direction: "AB" },   // Grid → Structure (transformer yard)
    "1-8": { types: { S:true,  E:false, I:false, M:false }, strength: 1, direction: "AB" },   // Generators → Structure
    "5-8": { types: { S:true,  E:false, I:false, M:false }, strength: 1, direction: "AB" },   // Network → Structure
    "7-8": { types: { S:true,  E:false, I:false, M:false }, strength: 2, direction: "AB" },   // Chilled Water → Structure
    "8-9": { types: { S:true,  E:false, I:false, M:false }, strength: 2, direction: "AB" },   // Structure → Security
    "8-11":{ types: { S:true,  E:false, I:false, M:false }, strength: 2, direction: "AB" },   // Structure → Fire Suppression
    // DCIM monitoring (bidirectional information flows)
    "10-2":{ types: { S:false, E:false, I:true,  M:false }, strength: 2, direction: "both" }, // DCIM ↔ UPS
    "10-3":{ types: { S:false, E:false, I:true,  M:false }, strength: 2, direction: "both" }, // DCIM ↔ PDU
    "10-4":{ types: { S:false, E:false, I:true,  M:false }, strength: 2, direction: "both" }, // DCIM ↔ Compute
    "10-6":{ types: { S:false, E:false, I:true,  M:false }, strength: 3, direction: "both" }, // DCIM ↔ Cooling (primary control loop)
    "10-7":{ types: { S:false, E:false, I:true,  M:false }, strength: 1, direction: "both" }, // DCIM ↔ Chilled Water
    "9-10":{ types: { S:false, E:false, I:true,  M:false }, strength: 1, direction: "both" }, // Security ↔ DCIM
    // Fire suppression
    "11-4":{ types: { S:true,  E:false, I:false, M:true  }, strength: 2, direction: "AB" },   // Fire Suppression → Compute (agent discharge zone)
  },
  clusterState: {
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    boundaries: [0, 4, 6, 8],
    clusterNames: ["Power Chain", "IT & Network", "Thermal", "Facility & Controls"],
  },
  planState: {
    gridOn: true,
    boundary: { x: 80, y: 60, w: 660, h: 400 },
    placements: [
      // Grid connection — outside boundary, left
      { id:"d-0",  elementIdx: 0,  instanceNum: 1, x: 40,  y: 220, w: 80, h: 50, rotation: 0 },
      // Generators — bottom-left inside
      { id:"d-1",  elementIdx: 1,  instanceNum: 1, x: 140, y: 400, w: 80, h: 50, rotation: 0 },
      // UPS — left spine
      { id:"d-2",  elementIdx: 2,  instanceNum: 1, x: 160, y: 220, w: 80, h: 50, rotation: 0 },
      // PDU — central left
      { id:"d-3",  elementIdx: 3,  instanceNum: 1, x: 280, y: 220, w: 80, h: 50, rotation: 0 },
      // Compute rows (×3)
      { id:"d-4a", elementIdx: 4,  instanceNum: 1, x: 420, y: 160, w: 80, h: 50, rotation: 0 },
      { id:"d-4b", elementIdx: 4,  instanceNum: 2, x: 420, y: 240, w: 80, h: 50, rotation: 0 },
      { id:"d-4c", elementIdx: 4,  instanceNum: 3, x: 420, y: 320, w: 80, h: 50, rotation: 0 },
      // Network — upper right
      { id:"d-5",  elementIdx: 5,  instanceNum: 1, x: 580, y: 140, w: 56, h: 56, rotation: 0 },
      // Cooling — flanking compute (top + bottom)
      { id:"d-6a", elementIdx: 6,  instanceNum: 1, x: 420, y: 100, w: 80, h: 44, rotation: 0 },
      { id:"d-6b", elementIdx: 6,  instanceNum: 2, x: 420, y: 400, w: 80, h: 44, rotation: 0 },
      // Chilled water plant — far right
      { id:"d-7",  elementIdx: 7,  instanceNum: 1, x: 660, y: 380, w: 52, h: 52, rotation: 0 },
      // Security — entrance top-left
      { id:"d-9",  elementIdx: 9,  instanceNum: 1, x: 120, y: 100, w: 80, h: 52, rotation: 0 },
      // DCIM — right-center
      { id:"d-10", elementIdx: 10, instanceNum: 1, x: 580, y: 280, w: 56, h: 56, rotation: 0 },
      // Fire suppression zone — over compute
      { id:"d-11", elementIdx: 11, instanceNum: 1, x: 420, y: 80,  w: 100, h: 40, rotation: 0 },
    ],
  },
  savedAt: null,
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const DEFAULT_CLUSTER_STATE = { order: [], boundaries: [], clusterNames: [] };

function ProjectManager({ current, onSave, onLoad, onNew, onClose }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.list("dsm:");
        const items = await Promise.all(
          (res?.keys || []).map(async k => {
            try {
              const r = await window.storage.get(k);
              const d = JSON.parse(r?.value || "{}");
              return { key: k, name: d.name || k, savedAt: d.savedAt };
            } catch { return null; }
          })
        );
        setProjects(items.filter(Boolean).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)));
      } catch (e) { setError("Storage unavailable"); }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const key = `dsm:${current.name.trim().replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`;
      await window.storage.set(key, JSON.stringify({ ...current, savedAt: Date.now() }));
      onSave(key);
      onClose();
    } catch { setError("Save failed — try again"); setSaving(false); }
  };

  const handleLoad = async (key) => {
    try {
      const r = await window.storage.get(key);
      const d = JSON.parse(r?.value || "{}");
      onLoad(d);
      onClose();
    } catch { setError("Load failed"); }
  };

  const handleDelete = async (key) => {
    setDeleting(key);
    try {
      await window.storage.delete(key);
      setProjects(ps => ps.filter(p => p.key !== key));
    } catch { setError("Delete failed"); }
    setDeleting(null);
  };

  const fmt = ts => ts ? new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000099", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#10192a", border: "1px solid #2a3a50", borderRadius: 12, width: 520, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 100px #000000bb" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1e2e42", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700 }}>Projects</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Save current */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #1e2e42" }}>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>SAVE CURRENT PROJECT</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, background: "#0d1724", border: "1px solid #2a3a50", borderRadius: 7, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
              {current.name || <span style={{ color: "#3a4a60" }}>Untitled project</span>}
            </div>
            <div style={{ color: "#3a4a60", fontSize: 11 }}>
              {current.elements.length} el · {Object.keys(current.interactions).length} int
            </div>
            <button onClick={handleSave} disabled={saving || !current.name.trim()} style={{
              padding: "8px 18px", borderRadius: 7, cursor: saving || !current.name.trim() ? "not-allowed" : "pointer",
              background: saving || !current.name.trim() ? "#1e2e42" : "#38bdf8",
              border: "none", color: saving || !current.name.trim() ? "#3a4a60" : "#0a1628",
              fontWeight: 700, fontSize: 13, whiteSpace: "nowrap"
            }}>{saving ? "Saving…" : "Save"}</button>
          </div>
          {!current.name.trim() && <div style={{ color: "#fbbf24", fontSize: 11, marginTop: 6 }}>Name the project in the header before saving.</div>}
          {error && <div style={{ color: "#f87171", fontSize: 11, marginTop: 6 }}>{error}</div>}
        </div>

        {/* Saved projects list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {/* Demo project — always shown */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>DEMO PROJECT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#0a1628", border: "1px solid #38bdf833", borderRadius: 8, borderLeft: "3px solid #38bdf8" }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#38bdf8", fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Modern Data Center</div>
                <div style={{ color: "#64748b", fontSize: 11, lineHeight: 1.5 }}>
                  12 functional elements · 4 modules · Utility grid, UPS, compute racks, cooling, DCIM and more.
                  Illustrates the compute–cooling lock-in, the power feed-forward chain, and DCIM's broad information coupling.
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["Power Chain", "IT & Network", "Thermal", "Facility & Controls"].map((m, i) => (
                    <span key={i} style={{
                      background: CLUSTER_COLORS[i] + "22", color: CLUSTER_COLORS[i],
                      border: `1px solid ${CLUSTER_COLORS[i]}44`, borderRadius: 4,
                      padding: "1px 7px", fontSize: 10, fontFamily: "monospace", fontWeight: 700
                    }}>{m}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => { onLoad(DEMO_PROJECT); onClose(); }} style={{
                padding: "7px 16px", borderRadius: 7, cursor: "pointer", flexShrink: 0,
                background: "#38bdf8", border: "none", color: "#0a1628", fontWeight: 700, fontSize: 13
              }}>Load Demo</button>
            </div>
          </div>

          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>SAVED PROJECTS</div>
          {loading ? (
            <div style={{ color: "#3a4a60", fontSize: 13, textAlign: "center", padding: "24px 0" }}>Loading…</div>
          ) : projects.length === 0 ? (
            <div style={{ color: "#3a4a60", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No saved projects yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {projects.map(p => (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#0d1724", border: "1px solid #1e2e42", borderRadius: 8 }}>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ color: "#3a4a60", fontSize: 11, fontFamily: "monospace", marginTop: 2 }}>{fmt(p.savedAt)}</div>
                  </div>
                  <button onClick={() => handleLoad(p.key)} style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", background: "#38bdf811", border: "1px solid #38bdf844", color: "#38bdf8", fontSize: 12, fontWeight: 600 }}>Load</button>
                  <button onClick={() => handleDelete(p.key)} disabled={deleting === p.key} style={{ padding: "5px 10px", borderRadius: 6, cursor: "pointer", background: "transparent", border: "1px solid #3a2222", color: "#f87171", fontSize: 12 }}>
                    {deleting === p.key ? "…" : "×"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New project */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #1e2e42" }}>
          <button onClick={() => { onNew(); onClose(); }} style={{ width: "100%", padding: "9px 0", borderRadius: 7, cursor: "pointer", background: "transparent", border: "1px solid #2a3a50", color: "#64748b", fontSize: 13, fontWeight: 600 }}>
            + New project (clears current)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DSMApp() {
  const [stage, setStage] = useState(1);
  const [projectName, setProjectName] = useState("Untitled");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [showProjects, setShowProjects] = useState(false);
  const [elements, setElements] = useState([]);
  const [interactions, setInteractions] = useState({});
  const [clusterState, setClusterState] = useState(DEFAULT_CLUSTER_STATE);
  const [planState, setPlanState] = useState(DEFAULT_PLAN_STATE);
  const [saveFlash, setSaveFlash] = useState(false);
  const nameInputRef = useRef(null);

  // Reset cluster order if elements change
  const prevN = useRef(0);
  useEffect(() => {
    if (elements.length !== prevN.current) {
      setClusterState({ order: Array.from({ length: elements.length }, (_, i) => i), boundaries: [0], clusterNames: ["Module A"] });
      prevN.current = elements.length;
    }
  }, [elements.length]);

  useEffect(() => { if (editingName && nameInputRef.current) nameInputRef.current.focus(); }, [editingName]);

  const commitName = () => {
    setProjectName(nameDraft.trim() || projectName);
    setEditingName(false);
  };

  const loadProject = (data) => {
    setProjectName(data.name || "Untitled");
    setElements(data.elements || []);
    setInteractions(data.interactions || {});
    setClusterState(data.clusterState || DEFAULT_CLUSTER_STATE);
    setPlanState(data.planState || DEFAULT_PLAN_STATE);
    prevN.current = (data.elements || []).length;
  };

  const newProject = () => {
    setProjectName("Untitled");
    setElements([]);
    setInteractions({});
    setClusterState(DEFAULT_CLUSTER_STATE);
    setPlanState(DEFAULT_PLAN_STATE);
    prevN.current = 0;
    setStage(1);
  };

  const onSaved = () => {
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1800);
  };

  const currentProject = { name: projectName, elements, interactions, clusterState, planState };

  const STAGES = [
    { n: 1, label: "Elements" },
    { n: 2, label: "Matrix" },
    { n: 3, label: "Cluster" },
    { n: 4, label: "Modules" },
    { n: 5, label: "Graph" },
    { n: 6, label: "Plan View" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080f1a", fontFamily: "'DM Sans','Helvetica Neue',sans-serif", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        select option { background: #16202e; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d1724; }
        ::-webkit-scrollbar-thumb { background: #2a3a50; border-radius: 3px; }
        @keyframes flashSave { 0%,100% { opacity:0; transform:translateY(4px); } 20%,80% { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e2e42", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, gap: 16 }}>
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexShrink: 0 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 500, fontSize: 15, color: "#38bdf8", letterSpacing: "0.08em" }}>DSM</span>
          <span style={{ color: "#2a3a50" }}>|</span>
        </div>

        {/* Project name — inline editable */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {editingName ? (
            <input ref={nameInputRef} value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if (e.key === "Enter") commitName(); if (e.key === "Escape") setEditingName(false); }}
              style={{ flex: 1, maxWidth: 320, background: "#0d1724", border: "1px solid #38bdf8", borderRadius: 6, padding: "5px 10px", color: "#e2e8f0", fontSize: 14, fontWeight: 600, outline: "none" }}
            />
          ) : (
            <button onClick={() => { setNameDraft(projectName); setEditingName(true); }}
              title="Click to rename project"
              style={{ background: "none", border: "none", cursor: "text", padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 7, maxWidth: 320 }}>
              <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{projectName}</span>
              <span style={{ color: "#2a3a50", fontSize: 11 }}>✎</span>
            </button>
          )}
          {/* Save flash */}
          {saveFlash && (
            <span style={{ color: "#4ade80", fontSize: 11, animation: "flashSave 1.8s ease forwards", whiteSpace: "nowrap" }}>✓ Saved</span>
          )}
        </div>

        {/* Stats */}
        <div style={{ color: "#3a4a60", fontSize: 11, fontFamily: "monospace", flexShrink: 0, whiteSpace: "nowrap" }}>
          {elements.length} el · {Object.keys(interactions).length} int · {clusterState.boundaries.length} mod
        </div>

        {/* Project button */}
        <button onClick={() => setShowProjects(true)} style={{
          padding: "6px 14px", borderRadius: 7, cursor: "pointer", flexShrink: 0,
          background: "#38bdf811", border: "1px solid #38bdf844",
          color: "#38bdf8", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6
        }}>
          <span style={{ fontSize: 14 }}>⊟</span> Projects
        </button>
      </div>

      {/* Stage tabs */}
      <div style={{ borderBottom: "1px solid #1e2e42", padding: "0 24px", display: "flex" }}>
        {STAGES.map(s => (
          <button key={s.n} onClick={() => !s.disabled && setStage(s.n)} disabled={s.disabled} style={{
            padding: "14px 18px", background: "transparent", border: "none",
            cursor: s.disabled ? "not-allowed" : "pointer",
            color: stage === s.n ? "#38bdf8" : s.disabled ? "#2a3a50" : "#64748b",
            fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
            borderBottom: stage === s.n ? "2px solid #38bdf8" : "2px solid transparent",
            marginBottom: -1, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 7
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: "50%",
              background: stage === s.n ? "#38bdf822" : "transparent",
              border: `1px solid ${stage === s.n ? "#38bdf8" : s.disabled ? "#2a3a50" : "#3a4a60"}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontFamily: "monospace",
              color: stage === s.n ? "#38bdf8" : s.disabled ? "#2a3a50" : "#3a4a60"
            }}>{s.n}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 32px" }}>
        {stage === 1 && <Stage1 elements={elements} setElements={setElements} />}
        {stage === 2 && <Stage2 elements={elements} interactions={interactions} setInteractions={setInteractions} />}
        {stage === 3 && <Stage3 elements={elements} interactions={interactions} clusterState={clusterState} setClusterState={setClusterState} />}
        {stage === 4 && <Stage4 elements={elements} interactions={interactions} clusterState={clusterState} />}
        {stage === 5 && <Stage5 elements={elements} interactions={interactions} clusterState={clusterState} />}
        {stage === 6 && <Stage6 elements={elements} interactions={interactions} clusterState={clusterState} planState={planState} setPlanState={setPlanState} />}
      </div>

      {/* Project manager modal */}
      {showProjects && (
        <ProjectManager
          current={currentProject}
          onSave={onSaved}
          onLoad={loadProject}
          onNew={newProject}
          onClose={() => setShowProjects(false)}
        />
      )}
    </div>
  );
}

