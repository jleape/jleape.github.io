/* Extracted from Claude Design prototype — see scripts/extract.py */
import React from "react";
import thesisPdf from "./aji_fund_thesis_v34.pdf";


// === goboard.jsx ===
/* Aji — Go board (Move 37) with animated win-probability narrative. 5s steady loop. */

const GoBoard = ({ showOverlay = true }) => {
  const N = 19;
  // phase: 0 = pre (move 36, 51%) · 1 = move 37 placed (58%) · 2 = develops (74%) · 3 = resolves (99%)
  const [phase, setPhase] = React.useState(0);
  const boardRef = React.useRef(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setInView(true);
    }, { threshold: 0.2 });
    if (boardRef.current) obs.observe(boardRef.current);
    return () => obs.disconnect();
  }, []);

  // ~11s loop — slower, more contemplative. Each phase gets ~2.5s dwell.
  React.useEffect(() => {
    if (!inView) return;
    let mounted = true;
    let timers = [];
    const run = () => {
      if (!mounted) return;
      setPhase(0);
      timers.push(setTimeout(() => mounted && setPhase(1), 2000));
      timers.push(setTimeout(() => mounted && setPhase(2), 4800));
      timers.push(setTimeout(() => mounted && setPhase(3), 7800));
      timers.push(setTimeout(() => {
        if (!mounted) return;
        run();
      }, 11000));
    };
    run();
    return () => { mounted = false; timers.forEach(clearTimeout); };
  }, [inView]);

  const moveNum  = [36, 37, 78, 121][phase];
  const winProb  = [51, 58, 74, 88][phase];

  // Approximate Game 2 position at Move 36 (before AlphaGo plays Move 37).
  const blackBase = [
    [3,3],[15,3],[2,13],[9,2],[13,2],[16,5],[16,8],[15,11],
    [3,15],[5,16],[13,15],[11,16],[7,15],[12,12],[5,10],[3,10],[9,9]
  ];
  const whiteBase = [
    [3,5],[5,3],[15,5],[16,3],[13,5],[11,3],[9,16],[11,14],
    [5,14],[2,10],[2,8],[14,15],[15,15],[16,13],[7,13],[10,6]
  ];
  const move37 = [10, 4];

  // Follow-up stones that show the sequel — simplified shape development
  const sequelBlack = [[11,5],[12,4],[13,4],[14,5],[12,7],[13,9]];
  const sequelWhite = [[11,6],[12,5],[13,5],[14,4],[12,6],[13,8]];

  const cell = 100 / (N - 1);

  const showSequel  = phase >= 2;
  const showVictory = phase >= 3;

  const labels = [
    null,
    { eyebrow: 'Move 37 · value unknowable at the time',
      body: 'Commentators called it a mistake. The engine itself gave it barely better than even odds.' },
    { eyebrow: null,
      body: 'Fifty moves later, the position Move 37 seeded is quietly dictating the board.' },
    { eyebrow: 'The option resolves in the money',
      body: 'The victory traces directly back to a move whose value was invisible when it was played.' },
  ];
  const label = labels[phase];

  return (
    <div
      ref={boardRef}
      className="goboard-wrap"
      style={{
        fontFamily: 'var(--mono)',
        position: 'relative',
        // Reserve space ABOVE the board for the readout; caption flows below.
        paddingTop: 68,
      }}
    >
      {/* Top readout — well above the board */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        fontFamily: 'var(--mono)', fontSize: 11,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--paper-dim)',
        gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', marginBottom: 6, letterSpacing: '0.14em' }}>Move</div>
          <div style={{
            fontSize: 28, color: 'var(--paper)',
            fontFamily: 'var(--mono)', letterSpacing: 0,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {moveNum}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--gold)', marginBottom: 6 }}>AlphaGo win probability</div>
          <div style={{
            fontSize: 28, color: 'var(--paper)',
            fontFamily: 'var(--mono)', letterSpacing: 0,
            fontVariantNumeric: 'tabular-nums',
            transition: 'color 0.5s',
          }}>
            {winProb}%
          </div>
        </div>
      </div>

      <svg viewBox="-8 -8 116 120" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id="boardGrad" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#d4b380" />
            <stop offset="100%" stopColor="#a08052" />
          </radialGradient>
          <radialGradient id="blackStone" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#3a3a3a" />
            <stop offset="70%" stopColor="#0a0a0a" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <radialGradient id="whiteStone" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#d8d3c5" />
          </radialGradient>
          <filter id="stoneShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.3"/>
            <feOffset dx="0.3" dy="0.5"/>
            <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="victoryGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b8955a" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#b8955a" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Board wood */}
        <rect x="-6" y="-6" width="112" height="112" rx="1" fill="url(#boardGrad)" />

        {/* Victory glow overlay */}
        {showVictory && (
          <rect key={`glow-${phase}`} x="-6" y="-6" width="112" height="112" fill="url(#victoryGlow)"
                style={{ animation: 'fadeUp 0.8s both' }}/>
        )}

        {/* Grid */}
        <g stroke="#1a1208" strokeWidth="0.18" opacity="0.85">
          {Array.from({ length: N }).map((_, i) => (
            <React.Fragment key={i}>
              <line x1={i*cell} y1="0" x2={i*cell} y2="100" />
              <line x1="0" y1={i*cell} x2="100" y2={i*cell} />
            </React.Fragment>
          ))}
        </g>

        {/* Star points */}
        {[[3,3],[9,3],[15,3],[3,9],[9,9],[15,9],[3,15],[9,15],[15,15]].map(([x,y],i) => (
          <circle key={i} cx={x*cell} cy={y*cell} r="0.6" fill="#1a1208" />
        ))}

        {/* Base stones — placed once, not re-animated per loop */}
        {whiteBase.map(([x,y], i) => (
          <circle key={`w${i}`} cx={x*cell} cy={y*cell} r="2.4"
            fill="url(#whiteStone)" filter="url(#stoneShadow)" />
        ))}
        {blackBase.map(([x,y], i) => (
          <circle key={`b${i}`} cx={x*cell} cy={y*cell} r="2.4"
            fill="url(#blackStone)" filter="url(#stoneShadow)" />
        ))}

        {/* Sequel stones — fade in, fade out on loop */}
        <g style={{ opacity: showSequel ? 1 : 0, transition: 'opacity 0.6s' }}>
          {sequelWhite.map(([x,y], i) => (
            <circle key={`sw${i}`} cx={x*cell} cy={y*cell} r="2.4"
              fill="url(#whiteStone)" filter="url(#stoneShadow)" />
          ))}
          {sequelBlack.map(([x,y], i) => (
            <circle key={`sb${i}`} cx={x*cell} cy={y*cell} r="2.4"
              fill="url(#blackStone)" filter="url(#stoneShadow)" />
          ))}
        </g>

        {/* Move 37 — the star */}
        <g style={{ opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.4s' }}>
          <circle cx={move37[0]*cell} cy={move37[1]*cell} r="5"
            fill="none" stroke="#b8955a" strokeWidth="0.6" opacity="0.6">
            <animate attributeName="r" from="2.8" to="8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={move37[0]*cell} cy={move37[1]*cell} r="2.6"
            fill="url(#blackStone)" filter="url(#stoneShadow)" stroke="#b8955a" strokeWidth="0.3"/>
          <circle cx={move37[0]*cell} cy={move37[1]*cell} r="0.9" fill="#b8955a" />
        </g>

        {/* Column refs */}
        <g fill="#1a1208" fontSize="1.8" opacity="0.5" fontFamily="var(--mono)">
          {['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T'].map((c, i) => (
            <text key={c} x={i*cell} y="104.5" textAnchor="middle">{c}</text>
          ))}
        </g>
      </svg>

      {/* Static caption */}
      <div style={{
        marginTop: 20,
        borderTop: '1px solid var(--rule)',
        paddingTop: 16,
      }}>
        <div style={{
          fontFamily: 'var(--serif)', fontSize: 15,
          color: 'var(--paper)', lineHeight: 1.55,
          fontStyle: 'italic',
          maxWidth: '62ch',
        }}>
          Move 37 seemed like a mistake, until it led to AlphaGo's milestone victory. Move 37 had "aji", a Japanese term used for moves that quietly create future opportunities, just like Aji Fund's investments.
        </div>
      </div>
    </div>
  );
};

const GoGrid = ({ highlightAt = [10,4], size = 120, stones = [] }) => {
  const N = 19;
  const cell = 100 / (N - 1);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ overflow: 'visible' }}>
      <g stroke="var(--rule)" strokeWidth="0.15">
        {Array.from({ length: N }).map((_, i) => (
          <React.Fragment key={i}>
            <line x1={i*cell} y1="0" x2={i*cell} y2="100" />
            <line x1="0" y1={i*cell} x2="100" y2={i*cell} />
          </React.Fragment>
        ))}
      </g>
      {stones.map(([x,y,c], i) => (
        <circle key={i} cx={x*cell} cy={y*cell} r="1.6"
          fill={c === 'w' ? '#d8d3c5' : '#0a0a0a'}/>
      ))}
      {highlightAt && (
        <>
          <circle cx={highlightAt[0]*cell} cy={highlightAt[1]*cell} r="1.8" fill="var(--gold)" />
          <circle cx={highlightAt[0]*cell} cy={highlightAt[1]*cell} r="4"
            fill="none" stroke="var(--gold)" strokeWidth="0.25" opacity="0.5">
            <animate attributeName="r" from="2" to="6" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
};

Object.assign(window, { GoBoard, GoGrid });


// === flexibility.jsx ===
/* Flexibility mechanism animations — five small SVG illustrations, each loops. */

const Mechanism = ({ title, tag, children, caption, idx }) => (
  <div style={{
    borderTop: '1px solid var(--rule)',
    padding: '48px 0',
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr',
    gap: 56,
    alignItems: 'center',
  }} className="mechanism-row">
    <div>
      <div className="eyebrow" style={{ marginBottom: 16 }}>
        <span>0{idx} / {tag}</span>
      </div>
      <h3 style={{ marginBottom: 16, fontSize: 'clamp(26px, 2.4vw, 38px)' }}>{title}</h3>
      <p style={{ color: 'var(--paper-soft)', maxWidth: '52ch', fontSize: 17, lineHeight: 1.6 }}>
        {caption}
      </p>
    </div>
    <div style={{
      aspectRatio: '4 / 3',
      background: 'var(--ink-soft)',
      border: '1px solid var(--rule)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  </div>
);

/* 1. SPATIAL RIGHTS — parcel grows outward with adjacent option-parcels */
const SpatialRights = () => {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    let raf; const loop = () => { setT(p => (p + 0.008) % 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);
  const phase = Math.min(1, t * 2.2);
  return (
    <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
      <defs>
        <pattern id="dots-sr" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="#b8955a" opacity="0.3"/>
        </pattern>
      </defs>
      {/* Background terrain */}
      <rect width="400" height="300" fill="#0e1116"/>
      <rect width="400" height="300" fill="url(#dots-sr)"/>
      {/* Core asset */}
      <rect x="155" y="115" width="90" height="70" fill="#3d4a52" stroke="#f5f1e8" strokeWidth="1"/>
      <text x="200" y="155" fill="#f5f1e8" fontSize="10" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">ASSET</text>
      {/* Adjacent option parcels appearing */}
      {[
        { x: 70, y: 115, w: 75, h: 70, label: 'OPT A', d: 0.2 },
        { x: 255, y: 115, w: 75, h: 70, label: 'OPT B', d: 0.45 },
        { x: 155, y: 40, w: 90, h: 65, label: 'OPT C', d: 0.7 },
      ].map((p, i) => {
        const a = Math.max(0, Math.min(1, (phase - p.d) * 3));
        return (
          <g key={i} opacity={a}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h}
              fill="none" stroke="#b8955a" strokeWidth="1" strokeDasharray="3 2"/>
            <text x={p.x + p.w/2} y={p.y + p.h/2 + 3} fill="#b8955a"
              fontSize="9" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.08em">
              {p.label}
            </text>
          </g>
        );
      })}
      {/* Compass-rose corner marker */}
      <g transform="translate(30 260)" fill="#5a6872" fontFamily="var(--mono)" fontSize="8" letterSpacing="0.1em">
        <text>N ↑ · 40.76, -74.00</text>
      </g>
    </svg>
  );
};

/* 2. MULTI-USE DESIGN — same data center shell, reconfigured across workload types */
const MultiUse = () => {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % 3), 2200);
    return () => clearInterval(t);
  }, []);

  // Shell dimensions: 340 x 210, interior 50-320 x 80-260 usable.
  // Each mode reconfigures the interior with workload-appropriate rack topology.
  const modes = [
    {
      label: 'AI TRAINING',
      tenant: 'HYPERSCALER A',
      color: '#b8955a',
      density: 'ULTRA-HIGH · 80 KW / RACK',
      // Few large GPU pods, tightly packed — high power density.
      items: [
        // 4 pods, each 2x2 racks
        ...[[70,95],[150,95],[230,95],[70,175],[150,175],[230,175]].map(([x,y]) => ({x, y, w: 70, h: 48, gap: 2})),
      ],
      innerStyle: 'pods',
    },
    {
      label: 'AI INFERENCE',
      tenant: 'HYPERSCALER B',
      color: '#6a8cb2',
      density: 'DISTRIBUTED · 30 KW / RACK',
      // Many smaller inference racks, distributed with aisle redundancy.
      items: Array.from({ length: 24 }, (_, k) => ({
        x: 60 + (k % 8) * 32,
        y: 90 + Math.floor(k / 8) * 54,
        w: 26, h: 42,
      })),
      innerStyle: 'distributed',
    },
    {
      label: 'CLOUD / GENERAL',
      tenant: 'HYPERSCALER C',
      color: '#8a9d7f',
      density: 'STANDARD · 15 KW / RACK',
      // Traditional long rack rows (hot aisle / cold aisle).
      items: Array.from({ length: 5 }, (_, k) => ({
        x: 60,
        y: 95 + k * 28,
        w: 260, h: 14,
      })),
      innerStyle: 'rows',
    },
  ];
  const m = modes[i];

  return (
    <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="300" fill="#0e1116"/>

      {/* Fixed shell */}
      <rect x="30" y="30" width="340" height="240" fill="none" stroke="#f5f1e8" strokeWidth="1.2"/>
      {/* Corner tick marks to emphasize fixed shell */}
      {[[30,30],[370,30],[30,270],[370,270]].map(([cx,cy], k) => (
        <g key={k} stroke="#f5f1e8" strokeWidth="1.2">
          <line x1={cx - (cx === 30 ? -8 : 8)} y1={cy} x2={cx} y2={cy}/>
        </g>
      ))}
      <text x="30" y="20" fill="#5a6872" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.1em">
        FIXED SHELL · RECONFIGURABLE INTERIOR
      </text>

      {/* Interior — workload-specific */}
      {m.items.map((it, k) => (
        <g key={`${i}-${k}`} style={{ animation: `stonePlace 0.35s ${k*0.02}s both` }}>
          <rect x={it.x} y={it.y} width={it.w} height={it.h}
            fill={m.color} opacity="0.92"/>
          {/* Inner texture lines suggesting rack units */}
          {m.innerStyle === 'rows' && [0.25, 0.5, 0.75].map(f => (
            <line key={f} x1={it.x} y1={it.y + it.h * f} x2={it.x + it.w} y2={it.y + it.h * f}
              stroke="#0e1116" strokeWidth="0.5" opacity="0.4"/>
          ))}
          {m.innerStyle === 'pods' && (
            <line x1={it.x + it.w/2} y1={it.y} x2={it.x + it.w/2} y2={it.y + it.h}
              stroke="#0e1116" strokeWidth="0.8" opacity="0.5"/>
          )}
          {m.innerStyle === 'distributed' && (
            <circle cx={it.x + it.w/2} cy={it.y + 8} r="1.5" fill="#0e1116" opacity="0.5"/>
          )}
        </g>
      ))}

      {/* Mode callout */}
      <g>
        <rect x="30" y="275" width="200" height="22" fill={m.color}/>
        <text x="40" y="290" fill="#0e1116" fontSize="11" fontFamily="var(--mono)" letterSpacing="0.12em" fontWeight="700">
          {m.label}
        </text>
        <text x="240" y="290" fill="#5a6872" fontSize="8.5" fontFamily="var(--mono)" letterSpacing="0.1em">
          {m.tenant}
        </text>
      </g>
      <text x="30" y="256" fill="#b8955a" fontSize="8.5" fontFamily="var(--mono)" letterSpacing="0.1em">
        {m.density}
      </text>

      {/* Phase dots */}
      <g transform="translate(370 280)">
        {[0,1,2].map(k => (
          <circle key={k} cx={k*8 - 16} cy="0" r="2.3"
            fill={k === i ? '#b8955a' : '#3d4a52'}/>
        ))}
      </g>
    </svg>
  );
};

/* 3. CAPACITY BUFFERS — a pipe/conduit fills to baseline, headroom visibly reserved */
const CapacityBuffers = () => {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    let raf; const loop = () => { setT(p => (p + 0.003) % 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);

  // Pipe cross-section view. Pipe diameter holds 9 cable slots in 3x3 grid,
  // but the base spec only required 3. Over time, more cables are pulled
  // through — visible because the empty slots fill in.
  // Slot positions (3x3 grid inside the pipe).
  const slots = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      slots.push({ r, c, cx: 140 + c*60, cy: 110 + r*60 });
    }
  }
  // Baseline spec = 3 cables (first row). Over time we fill more.
  const activated = Math.min(9, 3 + Math.floor(t * 7));

  return (
    <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="300" fill="#0e1116"/>

      {/* Oversized conduit — outer wall */}
      <rect x="110" y="80" width="200" height="180" rx="6"
        fill="#1a1f26" stroke="#b8955a" strokeWidth="1.2"/>
      <rect x="118" y="88" width="184" height="164" rx="3"
        fill="none" stroke="#3d4a52" strokeWidth="0.6" strokeDasharray="3 2"/>

      {/* Cable slots */}
      {slots.map((s, k) => {
        const active = k < activated;
        const isBaseline = k < 3;
        return (
          <g key={k}>
            {/* Empty slot ring */}
            <circle cx={s.cx} cy={s.cy} r="18"
              fill="none" stroke="#3d4a52" strokeWidth="0.8" strokeDasharray="2 2"/>
            {/* Active cable */}
            {active && (
              <g style={{ animation: `stonePlace 0.5s both` }}>
                <circle cx={s.cx} cy={s.cy} r="18"
                  fill={isBaseline ? '#5a6872' : '#b8955a'} opacity="0.25"/>
                <circle cx={s.cx} cy={s.cy} r="12"
                  fill={isBaseline ? '#8a9d7f' : '#b8955a'}/>
                <circle cx={s.cx} cy={s.cy} r="4" fill="#0e1116"/>
              </g>
            )}
          </g>
        );
      })}

      {/* Labels */}
      <text x="110" y="70" fill="#b8955a" fontSize="10" fontFamily="var(--mono)" letterSpacing="0.1em">
        CONDUIT · SIZED FOR 9 CIRCUITS
      </text>
      <text x="110" y="280" fill="#5a6872" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.1em">
        DAY-ONE SPEC · 3 CIRCUITS
      </text>

      {/* Running counter */}
      <g transform="translate(40 80)">
        <text fill="#5a6872" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.1em">ACTIVE</text>
        <text y="26" fill="#f5f1e8" fontSize="28" fontFamily="var(--mono)">{activated}</text>
        <text y="42" fill="#5a6872" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.1em">of 9</text>
      </g>

      {/* Headroom indicator */}
      <g transform="translate(385 80)">
        <text fill="#b8955a" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.1em" textAnchor="end">HEADROOM</text>
        <text y="26" fill="#b8955a" fontSize="28" fontFamily="var(--mono)" textAnchor="end">{9 - activated}</text>
        <text y="42" fill="#b8955a" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.1em" textAnchor="end" opacity="0.7">PRE-PAID</text>
      </g>

      {/* Time axis */}
      <g transform="translate(40 270)">
        <text fill="#5a6872" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.1em">Y0</text>
        <line x1="15" y1="-3" x2="320" y2="-3" stroke="#3d4a52" strokeWidth="0.5"/>
        <circle cx={15 + t*320} cy="-3" r="3" fill="#b8955a"/>
        <text x="340" fill="#5a6872" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.1em">Y20</text>
      </g>
    </svg>
  );
};

/* 4. STAGED DEVELOPMENT — a branching decision tree that grows over time */
const StagedDev = () => {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    let raf; const loop = () => { setT(p => (p + 0.003) % 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);

  // Two-phase animation:
  //   Phase A (t in [0, 0.5]): build the OPEN tree, P1 → P2 → P3 → P4. All nodes open.
  //   Phase B (t in [0.5, 0.95]): commit one segment + abandon siblings, step by step.
  //   Tail (t > 0.95): hold final state briefly, then loop.
  const phases = [
    { x: 60, reveal: 0.00 },  // P1 nodes
    { x: 145, reveal: 0.10 }, // P2 nodes
    { x: 230, reveal: 0.22 }, // P3 nodes
    { x: 315, reveal: 0.36 }, // P4 nodes
  ];
  // After 0.5, decide one phase commit at a time.
  const commitTicks = [0.50, 0.62, 0.75, 0.88]; // when each segment commits

  // Nodes at each phase
  const tree = [
    [{ y: 150, id: 'p1' }],
    [{ y: 100, id: 'p2a', parent: 'p1' }, { y: 200, id: 'p2b', parent: 'p1' }],
    [
      { y: 70,  id: 'p3a', parent: 'p2a' },
      { y: 130, id: 'p3b', parent: 'p2a' },
      { y: 180, id: 'p3c', parent: 'p2b' },
      { y: 230, id: 'p3d', parent: 'p2b' },
    ],
    [
      { y: 55,  id: 'p4a', parent: 'p3a' },
      { y: 90,  id: 'p4b', parent: 'p3a' },
      { y: 130, id: 'p4c', parent: 'p3b' },
      { y: 165, id: 'p4d', parent: 'p3b' },
      { y: 200, id: 'p4e', parent: 'p3c' },
      { y: 245, id: 'p4f', parent: 'p3d' },
    ],
  ];

  const selectedPath = ['p1', 'p2a', 'p3b', 'p4c'];

  const nodeMap = {};
  tree.forEach((col, ci) => col.forEach(n => { nodeMap[n.id] = { ...n, x: phases[ci].x, phase: ci }; }));

  // Reveal stage during phase A (also valid through B/tail since once revealed, stays).
  const revealedPhase = phases.reduce((acc, p, i) => t > p.reveal ? i : acc, -1);
  // Commit step: -1 before phase B starts, then 0..3 as commits land. Stays at 3 in tail.
  let commitStep = -1;
  for (let i = 0; i < commitTicks.length; i++) {
    if (t >= commitTicks[i]) commitStep = i;
  }

  // Committed: prefix of selectedPath up to commitStep+1.
  const committedSet = new Set(selectedPath.slice(0, commitStep + 1));

  // Pruned: nodes whose parent is on the committed path but they are not, AND committed has reached at least their phase.
  // Plus all descendants of pruned nodes.
  const prunedSet = new Set();
  for (let ci = 1; ci <= 3; ci++) {
    for (const n of tree[ci]) {
      // Already pruned by ancestor?
      if (prunedSet.has(n.parent)) {
        // Only mark pruned once parent's commit step has happened (so we don't pre-prune during phase A).
        if (commitStep >= ci) prunedSet.add(n.id);
        continue;
      }
      // Sibling of committed at this phase: prune at the moment its phase commits.
      if (committedSet.has(n.parent) && !committedSet.has(n.id) && commitStep >= ci) {
        prunedSet.add(n.id);
      }
    }
  }

  // Which committed node should pulse — the most-recently committed one.
  const lastCommittedId = commitStep >= 0 ? selectedPath[commitStep] : null;

  // Phase header annotation
  const inPhaseA = t < 0.5;

  const phaseLabels = ['P1', 'P2', 'P3', 'P4'];

  return (
    <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="300" fill="#0e1116"/>

      <text x="40" y="30" fill="#5a6872" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.1em">
        DECISION TREE · COMMIT · DEFER · ABANDON
      </text>

      {/* Phase labels */}
      {phases.map((p, i) => (
        <g key={i} transform={`translate(${p.x} 270)`}>
          <text fill="#5a6872" fontSize="10" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.12em">
            {phaseLabels[i]}
          </text>
        </g>
      ))}

      {/* Edges */}
      {tree.slice(1).map((col, ci) => col.map(n => {
        const p = nodeMap[n.parent];
        const c = nodeMap[n.id];
        const reveal = phases[ci + 1].reveal;
        const visible = t > reveal;
        if (!visible) return null;
        const onPath = committedSet.has(c.id) && committedSet.has(n.parent);
        const pruned = prunedSet.has(c.id);
        return (
          <line key={c.id}
            x1={p.x} y1={p.y}
            x2={c.x} y2={c.y}
            stroke={onPath ? '#b8955a' : (pruned ? '#3d4a52' : '#5a6872')}
            strokeWidth={onPath ? 1.8 : 0.9}
            strokeDasharray={pruned ? '3 2' : '0'}
            opacity={pruned ? 0.45 : 1}
            style={{ animation: `fadeUp 0.4s both` }}/>
        );
      }))}

      {/* Nodes */}
      {tree.map((col, ci) => col.map((n, ni) => {
        const reveal = phases[ci].reveal;
        const visible = t > reveal;
        if (!visible) return null;
        const onPath = committedSet.has(n.id);
        const pruned = prunedSet.has(n.id);
        const isLastCommitted = n.id === lastCommittedId;
        return (
          <g key={n.id} transform={`translate(${phases[ci].x} ${n.y})`}
            style={{ animation: `stonePlace 0.4s ${ni*0.05}s both` }}>
            <circle r="14"
              fill={onPath ? '#b8955a' : (pruned ? 'none' : '#1a1f26')}
              stroke={onPath ? '#b8955a' : (pruned ? '#3d4a52' : '#f5f1e8')}
              strokeWidth={onPath ? 2 : 1}
              strokeDasharray={pruned ? '3 2' : '0'}
              opacity={pruned ? 0.5 : 1}/>
            {isLastCommitted && (
              <circle r="20" fill="none" stroke="#b8955a" strokeWidth="0.5" opacity="0.4">
                <animate attributeName="r" from="14" to="22" dur="1.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.6" to="0" dur="1.8s" repeatCount="indefinite"/>
              </circle>
            )}
            {pruned && (
              <g stroke="#5a6872" strokeWidth="1" opacity="0.5">
                <line x1="-6" y1="-6" x2="6" y2="6"/>
                <line x1="-6" y1="6" x2="6" y2="-6"/>
              </g>
            )}
          </g>
        );
      }))}

      {/* Annotations */}
      {inPhaseA && revealedPhase >= 1 && (
        <g style={{ animation: 'fadeUp 0.5s both' }}>
          <text x="200" y="48" fill="#5a6872" fontSize="8" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">
            ALL PATHWAYS OPEN
          </text>
        </g>
      )}
      {!inPhaseA && commitStep >= 0 && (
        <g style={{ animation: 'fadeUp 0.5s both' }} key={`hdr-${commitStep}`}>
          <text x="200" y="48" fill="#c85a4a" fontSize="8" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">
            COMMIT &amp; ABANDON AS INFO ARRIVES
          </text>
        </g>
      )}
      {commitStep >= 3 && (
        <g style={{ animation: 'fadeUp 0.5s both' }}>
          <text x="315" y="38" fill="#b8955a" fontSize="9" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">SELECTED PATH</text>
        </g>
      )}

      {/* Legend — moved to bottom-left below phase ticks so it doesn't collide */}
      <g transform="translate(40 292)" fontFamily="var(--mono)" fontSize="8" letterSpacing="0.08em">
        <circle r="4" fill="#1a1f26" stroke="#f5f1e8" strokeWidth="0.8"/>
        <text x="10" y="3" fill="#5a6872">OPEN</text>
        <g transform="translate(70 0)">
          <circle r="4" fill="#b8955a"/>
          <text x="10" y="3" fill="#b8955a">COMMITTED</text>
        </g>
        <g transform="translate(180 0)" opacity="0.6">
          <circle r="4" fill="none" stroke="#3d4a52" strokeDasharray="2 1.5"/>
          <text x="10" y="3" fill="#5a6872">ABANDONED</text>
        </g>
      </g>
    </svg>
  );
};

/* 5. CONTRACTUAL OPTIONS — contract document stack with exercisable clauses */
const ContractualOptions = () => {
  const [active, setActive] = React.useState(-1);
  React.useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setActive(i % 5); // -1, 0, 1, 2, 3 cycle with one "rest"
      i++;
    }, 1400);
    return () => clearInterval(t);
  }, []);

  // Stack of contract clauses, each an exercisable option right.
  const clauses = [
    { tag: 'VOL',      label: 'Volume option',       detail: 'Offtake +30% at strike', key: '§4.2' },
    { tag: 'EXTEND',   label: 'Extension right',     detail: 'Lease +5y at indexed rate', key: '§7.1' },
    { tag: 'ASSIGN',   label: 'Assignment',          detail: 'Transferable to qualified buyer', key: '§9.3' },
    { tag: 'TERM',     label: 'Early termination',   detail: 'Walk-away at 18 months', key: '§11.4' },
  ];

  return (
    <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="300" fill="#0e1116"/>

      {/* Document outline — a stylized contract page */}
      <g>
        {/* Page shadow / stack hint */}
        <rect x="48" y="48" width="300" height="220" fill="#1a1f26" stroke="#3d4a52" strokeWidth="0.5"/>
        <rect x="44" y="44" width="300" height="220" fill="#1a1f26" stroke="#3d4a52" strokeWidth="0.5"/>
        {/* Top page */}
        <rect x="40" y="40" width="300" height="220" fill="#16191e" stroke="#f5f1e8" strokeWidth="1"/>
      </g>

      {/* Page header */}
      <text x="52" y="60" fill="#5a6872" fontSize="8" fontFamily="var(--mono)" letterSpacing="0.14em">
        MASTER AGREEMENT · EXECUTED
      </text>
      <line x1="52" y1="66" x2="328" y2="66" stroke="#3d4a52" strokeWidth="0.4"/>

      {/* Body prose — dim lines suggesting paragraphs */}
      {[72, 77, 82].map(y => (
        <line key={y} x1="52" y1={y} x2={52 + 250 + (y % 3) * 15} y2={y}
          stroke="#3d4a52" strokeWidth="0.5" opacity="0.6"/>
      ))}

      {/* Option clauses — each a highlighted block within the doc */}
      {clauses.map((c, i) => {
        const y = 100 + i * 38;
        const isActive = active === i;
        return (
          <g key={i}>
            {/* Clause block */}
            <rect x="52" y={y} width="276" height="30"
              fill={isActive ? '#b8955a' : 'none'}
              stroke={isActive ? '#b8955a' : '#5a6872'}
              strokeWidth={isActive ? 1 : 0.6}
              strokeDasharray={isActive ? '0' : '3 2'}/>

            {/* Section marker */}
            <text x="60" y={y + 13} fill={isActive ? '#0e1116' : '#5a6872'}
              fontSize="8" fontFamily="var(--mono)" letterSpacing="0.1em">
              {c.key}
            </text>
            {/* Clause label */}
            <text x="98" y={y + 13} fill={isActive ? '#0e1116' : '#f5f1e8'}
              fontSize="10" fontFamily="var(--serif)" fontStyle="italic">
              {c.label}
            </text>
            {/* Detail */}
            <text x="60" y={y + 24} fill={isActive ? '#0e1116' : '#5a6872'}
              fontSize="8.5" fontFamily="var(--mono)" letterSpacing="0.05em" opacity="0.85">
              {c.detail}
            </text>
            {/* Status chip on the right */}
            <rect x="272" y={y + 5} width="48" height="20"
              fill={isActive ? '#0e1116' : 'none'}
              stroke={isActive ? '#0e1116' : '#5a6872'}
              strokeWidth="0.6"/>
            <text x="296" y={y + 18}
              fill={isActive ? '#b8955a' : '#5a6872'}
              fontSize="8" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.12em">
              {isActive ? 'EXERCISED' : 'HELD'}
            </text>
            {/* Exercise indicator arrow */}
            {isActive && (
              <g style={{ animation: 'fadeUp 0.3s both' }}>
                <line x1="348" y1={y + 15} x2="380" y2={y + 15}
                  stroke="#b8955a" strokeWidth="1"/>
                <polygon points={`380,${y + 15} 375,${y + 12} 375,${y + 18}`}
                  fill="#b8955a"/>
              </g>
            )}
          </g>
        );
      })}

      {/* Bottom caption */}
      <text x="40" y="285" fill="#5a6872" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.1em">
        FOUR OPTION RIGHTS · EMBEDDED IN CONTRACT AT SIGNATURE
      </text>
    </svg>
  );
};

const MECHANISMS = [
  { tag: 'SPATIAL RIGHTS', title: 'Secure physical resources before they are needed.',
    caption: 'Options on adjacent land, reserved expansion space, and rights-of-way for infrastructure that does not yet exist. The cheapest time to own land is before anyone else wants it.', Comp: SpatialRights },
  { tag: 'MULTI-USE DESIGN', title: 'Engineer multi-purpose assets.',
    caption: 'A data center whose power, cooling, and network topology can host AI training, inference, or general cloud workloads — for whichever hyperscaler wins the round. The shell stays fixed; the tenant and the workload can change.', Comp: MultiUse },
  { tag: 'CAPACITY BUFFERS', title: 'Oversize quietly; densify cheaply.',
    caption: 'Conduit, switchgear, HVAC, and fiber rated today for loads the base case does not predict. When demand arrives, the marginal cost of meeting it has already been paid.', Comp: CapacityBuffers },
  { tag: 'STAGED DEVELOPMENT', title: 'Build decision gates into the plan.',
    caption: 'Modular phases that can be added, modified, or deferred as information arrives. Every phase boundary is an option to commit, defer, or walk away.', Comp: StagedDev },
  { tag: 'CONTRACTUAL OPTIONS', title: 'Write optionality into the paperwork.',
    caption: 'Volume rights in offtake, extension and termination rights in leases, oversized permits, and clean assignment clauses. Optionality embedded at signature, exercisable later.', Comp: ContractualOptions },
];

const FlexibilitySection = () => (
  <section id="flexibility" style={{ padding: '0 var(--gutter)' }}>
    <div className="wrap-wide">
      <div className="section-head">
        <div className="num">02 / FIVE MECHANISMS</div>
        <div>
          <h2>Five ways to build <em>aji</em> into real assets.</h2>
        </div>
      </div>
      {MECHANISMS.map((m, i) => (
        <Mechanism key={i} idx={i+1} tag={m.tag} title={m.title} caption={m.caption}>
          <m.Comp/>
        </Mechanism>
      ))}
    </div>
  </section>
);

Object.assign(window, { FlexibilitySection });


// === sections.jsx ===
/* Aji — assets: asset-class imagery, team, LP inquiry, Move 37 narrative */

/* Striped placeholder — used when a real photo isn't provided. Clean, editorial. */
const PhotoPlaceholder = ({ label, sublabel, ratio = '4 / 3', tone = 'default' }) => {
  const tones = {
    default: { bg: 'linear-gradient(135deg, #2a3138 0%, #1a1e24 100%)', stripe: 'rgba(184,149,90,0.08)' },
    warm:    { bg: 'linear-gradient(135deg, #3a2f1f 0%, #1e1810 100%)', stripe: 'rgba(245,241,232,0.06)' },
    steel:   { bg: 'linear-gradient(135deg, #2c363f 0%, #151a1f 100%)', stripe: 'rgba(180,200,220,0.06)' },
    earth:   { bg: 'linear-gradient(135deg, #2f3528 0%, #191c14 100%)', stripe: 'rgba(210,200,160,0.07)' },
  };
  const t = tones[tone] || tones.default;
  return (
    <div style={{
      aspectRatio: ratio,
      background: t.bg,
      backgroundImage: `repeating-linear-gradient(45deg, ${t.stripe} 0 2px, transparent 2px 24px), ${t.bg}`,
      border: '1px solid var(--rule)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'flex-end',
      padding: '20px',
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10,
          letterSpacing: '0.14em', color: 'var(--gold)',
          textTransform: 'uppercase', marginBottom: 6,
        }}>
          {label}
        </div>
        {sublabel && (
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 9,
            letterSpacing: '0.1em', color: 'var(--paper-dim)',
            opacity: 0.6,
          }}>
            {sublabel}
          </div>
        )}
      </div>
      {/* corner crosshair */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        fontFamily: 'var(--mono)', fontSize: 9,
        color: 'var(--paper-dim)', opacity: 0.4,
        letterSpacing: '0.1em',
      }}>
        PLACEHOLDER · {ratio.replace(' / ', ':')}
      </div>
    </div>
  );
};

const ASSET_CLASSES = [
  {
    code: 'A01', name: 'Data Centers',
    note: 'Power headroom, multi-hyperscaler readiness, modular expansion.',
    diagram: (
      <svg viewBox="0 0 80 60" style={{ width: '100%', height: '100%' }}>
        <rect x="6" y="10" width="68" height="44" fill="none" stroke="var(--paper)" strokeWidth="0.8"/>
        {[0,1,2,3,4].map(i => (
          <rect key={i} x={12 + i*12} y="18" width="8" height="28" fill="var(--gold)" opacity={i < 3 ? 1 : 0.35}/>
        ))}
        <line x1="12" y1="52" x2="68" y2="52" stroke="var(--gold)" strokeWidth="0.4" strokeDasharray="1 1"/>
      </svg>
    ),
  },
  {
    code: 'A02', name: 'Industrial Facilities',
    note: 'Fungible production lines, feedstock flexibility, capacity buffers.',
    diagram: (
      <svg viewBox="0 0 80 60" style={{ width: '100%', height: '100%' }}>
        <path d="M 6 50 L 6 30 L 20 30 L 20 20 L 34 20 L 34 35 L 48 35 L 48 25 L 62 25 L 62 40 L 74 40 L 74 50 Z"
          fill="none" stroke="var(--paper)" strokeWidth="0.8"/>
        <circle cx="20" cy="26" r="1.5" fill="var(--gold)"/>
        <circle cx="34" cy="26" r="1.5" fill="var(--gold)"/>
        <circle cx="48" cy="31" r="1.5" fill="var(--gold)"/>
        <line x1="20" y1="26" x2="48" y2="31" stroke="var(--gold)" strokeWidth="0.4" strokeDasharray="1 1"/>
      </svg>
    ),
  },
  {
    code: 'A03', name: 'Energy Systems',
    note: 'Interconnection rights, storage oversize, solar and EV readiness.',
    diagram: (
      <svg viewBox="0 0 80 60" style={{ width: '100%', height: '100%' }}>
        {[0,1,2,3].map(i => (
          <g key={i} transform={`translate(${12 + i*18} 42)`}>
            <rect x="-6" y="-20" width="12" height="18" fill="none" stroke="var(--paper)" strokeWidth="0.6"/>
            <line x1="-6" y1="-14" x2="6" y2="-14" stroke="var(--paper)" strokeWidth="0.4"/>
            <line x1="-6" y1="-8" x2="6" y2="-8" stroke="var(--paper)" strokeWidth="0.4"/>
          </g>
        ))}
        <line x1="6" y1="44" x2="74" y2="44" stroke="var(--gold)" strokeWidth="0.8"/>
        <circle cx="30" cy="44" r="1.8" fill="var(--gold)"/>
      </svg>
    ),
  },
  {
    code: 'A04', name: 'Transportation Infrastructure',
    note: 'Rights-of-way, mode-shift capacity, berth reconfigurability.',
    diagram: (
      <svg viewBox="0 0 80 60" style={{ width: '100%', height: '100%' }}>
        <line x1="4" y1="22" x2="76" y2="22" stroke="var(--paper)" strokeWidth="0.6"/>
        <line x1="4" y1="30" x2="76" y2="30" stroke="var(--paper)" strokeWidth="0.6"/>
        <line x1="4" y1="38" x2="76" y2="38" stroke="var(--gold)" strokeWidth="0.8" strokeDasharray="2 1.5"/>
        <line x1="4" y1="46" x2="76" y2="46" stroke="var(--paper)" strokeWidth="0.6" opacity="0.4"/>
        {[0,1,2,3,4,5,6].map(i => (
          <line key={i} x1={12 + i*10} y1="16" x2={12 + i*10} y2="50" stroke="var(--paper)" strokeWidth="0.3" opacity="0.3"/>
        ))}
      </svg>
    ),
  },
  {
    code: 'A05', name: 'Commercial Real Estate',
    note: 'Conversion-ready plumbing, zoning accommodation, fungible floorplates.',
    diagram: (
      <svg viewBox="0 0 80 60" style={{ width: '100%', height: '100%' }}>
        <rect x="10" y="8" width="26" height="44" fill="none" stroke="var(--paper)" strokeWidth="0.8"/>
        <rect x="44" y="8" width="26" height="44" fill="none" stroke="var(--gold)" strokeWidth="0.8" strokeDasharray="2 1.5"/>
        {[0,1,2,3,4].map(i => (
          <line key={`a${i}`} x1="10" y1={14 + i*8} x2="36" y2={14 + i*8} stroke="var(--paper)" strokeWidth="0.3" opacity="0.5"/>
        ))}
        {[0,1,2].map(i => (
          <rect key={`b${i}`} x={48} y={14 + i*12} width="18" height="8" fill="none" stroke="var(--gold)" strokeWidth="0.4" opacity="0.6"/>
        ))}
        <path d="M 38 30 L 42 30" stroke="var(--gold)" strokeWidth="0.8"/>
        <path d="M 40 28 L 42 30 L 40 32" fill="none" stroke="var(--gold)" strokeWidth="0.8"/>
      </svg>
    ),
  },
  {
    code: 'A06', name: 'Critical Minerals',
    note: 'Mineral rights optionality, multi-feedstock processing, swing refining capacity.',
    diagram: (
      <svg viewBox="0 0 80 60" style={{ width: '100%', height: '100%' }}>
        <polygon points="20,14 30,14 36,24 30,34 20,34 14,24" fill="none" stroke="var(--paper)" strokeWidth="0.8"/>
        <polygon points="50,26 60,26 66,36 60,46 50,46 44,36" fill="none" stroke="var(--paper)" strokeWidth="0.8"/>
        <polygon points="35,40 45,40 51,50 45,60 35,60 29,50" fill="none" stroke="var(--gold)" strokeWidth="0.8" strokeDasharray="2 1.5"/>
        <line x1="28" y1="28" x2="46" y2="36" stroke="var(--gold)" strokeWidth="0.4" strokeDasharray="1 1"/>
      </svg>
    ),
  },
];

const AssetClassesSection = () => (
  <section id="assets" style={{ padding: '0 var(--gutter)' }}>
    <div className="wrap-wide">
      <div className="section-head">
        <div className="num">03 / COVERAGE</div>
        <div>
          <h2>Aji&rsquo;s thesis applies wherever irreversible capital meets uncertainty.</h2>
        </div>
      </div>
      <div style={{
        borderTop: '1px solid var(--rule)',
        marginTop: 40,
      }}>
        {ASSET_CLASSES.map(a => (
          <div key={a.code} style={{
            display: 'grid',
            gridTemplateColumns: '80px 80px 1fr auto',
            alignItems: 'center',
            gap: 32,
            padding: '24px 0',
            borderBottom: '1px solid var(--rule)',
          }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 11,
              letterSpacing: '0.14em', color: 'var(--gold)',
              textTransform: 'uppercase',
            }}>
              {a.code}
            </div>
            <div style={{ height: 54, width: 80 }}>{a.diagram}</div>
            <div>
              <div style={{
                fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1.2,
                color: 'var(--paper)', marginBottom: 4,
                letterSpacing: '-0.01em',
              }}>
                {a.name}
              </div>
              <div style={{
                fontFamily: 'var(--serif)', fontSize: 14,
                color: 'var(--paper-soft)', lineHeight: 1.45,
              }}>
                {a.note}
              </div>
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 9,
              letterSpacing: '0.14em', color: 'var(--paper-dim)',
              textTransform: 'uppercase',
              textAlign: 'right',
              opacity: 0.6,
            }}>
              {['A01','A02','A06'].includes(a.code) ? 'Current focus' : 'Aperture'}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* Move 37 narrative section */
const Move37Section = () => null;

/* Team */
const TeamSection = () => (
  <section id="team" style={{ padding: '0 var(--gutter)' }}>
    <div className="wrap-wide">
      <div className="section-head">
        <div className="num">04 / TEAM</div>
        <div>
          <h2>Built by a practitioner, for practitioners.</h2>
          <p className="dek" style={{ marginTop: 18 }}>
            Aji is guided by a diverse board of advisors and supported by a network of subject-matter experts across engineering, finance, policy, and operations.
          </p>
        </div>
      </div>

      <div style={{
        display: 'block',
        padding: '40px 0 80px',
        maxWidth: 780,
      }} className="team-grid">
        <div>
          <h3 style={{ fontSize: 36, marginBottom: 6 }}>Jonathan Leape</h3>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 28 }}>
            Founder & Managing Partner · Inventor of Aji&rsquo;s ROV tool
          </div>

          <div className="prose" style={{ maxWidth: '60ch' }}>
            <p>
              15 years advising governments, owners, and investors on real assets.
              Currently leads advisory on first-of-a-kind commercial deployments at
              Arup, where he has led technical due diligence on transactions
              totalling over <em>$80 billion</em> across asset classes and geographies.
            </p>
            <p>
              B.S. in Engineering, Cornell University. Master of Science in
              Transportation and Master of City Planning, MIT.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* LP inquiry form */
const InquirySection = () => {
  const [sent, setSent] = React.useState(false);
  const [persona, setPersona] = React.useState('investor'); // 'investor' | 'non-investor'
  const [formOpen, setFormOpen] = React.useState(false);
  const [intent, setIntent] = React.useState(null); // label of which card opened the form
  const openForm = (p, i) => { setPersona(p); setIntent(i); setFormOpen(true); setSent(false); };
  const closeForm = () => setFormOpen(false);
  React.useEffect(() => {
    if (!formOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeForm(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [formOpen]);
  const [form, setForm] = React.useState({ name: '', org: '', email: '', type: '', role: '', note: '' });
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    const subject = persona === 'investor'
      ? `Aji Fund · LP inquiry — ${form.name || form.org || 'New inquiry'}`
      : `Aji Fund · ${intent || 'inquiry'} — ${form.name || form.org || 'New message'}`;
    const lines = [
      `Name: ${form.name}`,
      `Organization: ${form.org}`,
      `Email: ${form.email}`,
      persona === 'investor' ? `Investor type: ${form.type}` : `Role / capacity: ${form.role}`,
      '',
      'Message:',
      form.note,
    ];
    window.location.href = `mailto:jleape@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    setSent(true);
  };
  return (
    <section id="contact" style={{ padding: '0 var(--gutter)' }}>
      <div className="wrap-wide">
        <div className="section-head">
          <div className="num">05 / INVEST</div>
          <div>
            <h2>Get in on Aji.</h2>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          padding: '40px 0 80px',
          alignItems: 'start',
        }} className="inquiry-grid">
          <div>
            {/* ============= WAYS TO INVEST ============= */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                borderBottom: '1px solid var(--gold-dim)', paddingBottom: 12, marginBottom: 20,
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                  Ways to invest
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--paper-dim)', textTransform: 'uppercase' }}>
                  Qualified investors
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 1. Aji Fund */}
                <button type="button"
                  onClick={() => openForm('investor', 'invest')}
                  style={{
                    textAlign: 'left', cursor: 'pointer',
                    padding: '24px 28px',
                    background: 'var(--ink-soft)',
                    border: '1px solid var(--rule-strong)',
                    display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 20, alignItems: 'center',
                    fontFamily: 'inherit',
                  }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 22, color: 'var(--gold)', letterSpacing: '0.04em' }}>01</div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--paper)', marginBottom: 4 }}>
                      Invest in the Aji Fund
                    </div>
                    <div style={{ color: 'var(--paper-soft)', fontSize: 14, lineHeight: 1.5, maxWidth: '46ch' }}>
                      Back the thesis directly. Reg D limited partnership for institutions,
                      family offices, and accredited investors.
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                    Inquire <span style={{ marginLeft: 4 }}>→</span>
                  </div>
                </button>

                {/* 2. Co-invest */}
                <button type="button"
                  onClick={() => openForm('investor', 'invest')}
                  style={{
                    textAlign: 'left', cursor: 'pointer',
                    padding: '24px 28px',
                    background: 'var(--ink-soft)',
                    border: '1px solid var(--rule-strong)',
                    display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 20, alignItems: 'center',
                    fontFamily: 'inherit',
                  }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 22, color: 'var(--gold)', letterSpacing: '0.04em' }}>02</div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--paper)', marginBottom: 4 }}>
                      Co-invest in a deal
                    </div>
                    <div style={{ color: 'var(--paper-soft)', fontSize: 14, lineHeight: 1.5, maxWidth: '46ch' }}>
                      Take a direct position on an underwritten asset alongside the Fund.
                      Deal-by-deal basis, LP-first allocation.
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                    Inquire <span style={{ marginLeft: 4 }}>→</span>
                  </div>
                </button>

                {/* 3. Marketplace */}
                <a href="marketplace.html"
                  onClick={(e) => {
                    const q = window.location.search;
                    if (q) { e.preventDefault(); window.location.assign('marketplace.html' + q); }
                  }}
                  style={{
                    padding: '24px 28px',
                    background: 'linear-gradient(135deg, #1a1e24 0%, #0e1116 100%)',
                    border: '1px solid var(--gold-dim)',
                    display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 20, alignItems: 'center',
                    position: 'relative', overflow: 'hidden',
                  }}>
                  <div style={{
                    position: 'absolute', top: -20, right: -20, width: 140, height: 140,
                    background: 'radial-gradient(circle, rgba(184,149,90,0.15), transparent 60%)',
                    pointerEvents: 'none',
                  }}/>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 22, color: 'var(--gold)', letterSpacing: '0.04em' }}>03</div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--paper)', marginBottom: 4 }}>
                      Purchase a security on the Aji Exchange
                    </div>
                    <div style={{ color: 'var(--paper-soft)', fontSize: 14, lineHeight: 1.5, maxWidth: '46ch' }}>
                      A marketplace of transferable claims on Aji contracts &mdash;
                      single-contract positions and pooled thematic baskets.
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                    Enter <span style={{ marginLeft: 4 }}>→</span>
                  </div>
                </a>
              </div>
            </div>

          </div>

                    {/* ============= WAYS TO PARTICIPATE ============= */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              borderBottom: '1px solid var(--rule-strong)', paddingBottom: 12, marginBottom: 20,
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--paper)', textTransform: 'uppercase' }}>
                Ways to participate
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--paper-dim)', textTransform: 'uppercase' }}>
                Conversations welcome
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Developers / Owners / Officials */}
              <button type="button"
                onClick={() => openForm('non-investor', 'participate')}
                style={{
                  textAlign: 'left', cursor: 'pointer',
                  padding: '22px 28px',
                  background: 'transparent',
                  border: '1px dashed var(--rule-strong)',
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center',
                  fontFamily: 'inherit',
                }}>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--paper-dim)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Developers · Owners · Officials
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--paper)', marginBottom: 4 }}>
                    Tell Aji about your project.
                  </div>
                  <div style={{ color: 'var(--paper-soft)', fontSize: 13.5, lineHeight: 1.5, maxWidth: '48ch' }}>
                    First-of-a-kind facilities, merchant infrastructure, critical-mineral supply chains,
                    permitted sites looking for flexibility capital.
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                  Talk <span style={{ marginLeft: 4 }}>→</span>
                </div>
              </button>

              {/* Advisors / Academics */}
              <button type="button"
                onClick={() => openForm('non-investor', 'participate')}
                style={{
                  textAlign: 'left', cursor: 'pointer',
                  padding: '22px 28px',
                  background: 'transparent',
                  border: '1px dashed var(--rule-strong)',
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center',
                  fontFamily: 'inherit',
                }}>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--paper-dim)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Advisors · Academics
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--paper)', marginBottom: 4 }}>
                    Tell Aji about your expertise.
                  </div>
                  <div style={{ color: 'var(--paper-soft)', fontSize: 13.5, lineHeight: 1.5, maxWidth: '48ch' }}>
                    Legal, commercial, engineering, quant, policy. Much of the thesis sits upstream of
                    investing &mdash; in how real assets are designed, underwritten, and regulated.
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                  Talk <span style={{ marginLeft: 4 }}>→</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {formOpen && (
          <div
            onClick={closeForm}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(8, 11, 14, 0.82)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              padding: '40px 20px',
              overflowY: 'auto',
            }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%', maxWidth: 620,
              }}>
              <button type="button" onClick={closeForm}
                aria-label="Close"
                style={{
                  position: 'absolute', top: 12, right: 12, zIndex: 2,
                  width: 36, height: 36,
                  background: 'var(--ink)',
                  border: '1px solid var(--rule-strong)',
                  color: 'var(--paper-soft)',
                  cursor: 'pointer',
                  fontSize: 20, lineHeight: 1,
                  fontFamily: 'var(--mono)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
          <form id="inquiry-form" onSubmit={submit} style={{
            padding: '36px 32px',
            background: 'var(--ink-soft)',
            border: '1px solid var(--gold-dim)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            alignSelf: 'start',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="eyebrow"><span>{persona === 'investor' ? '01 · Limited partnership' : 'Get in touch'}</span></div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                {persona === 'investor' ? 'By introduction' : 'Direct'}
              </div>
            </div>

            {/* Persona toggle */}
            <div role="tablist" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              border: '1px solid var(--rule-strong)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              {[
                { id: 'investor',     label: 'Investor' },
                { id: 'non-investor', label: 'Everyone else' },
              ].map(p => (
                <button key={p.id}
                  id={`inquiry-persona-${p.id}`}
                  role="tab"
                  type="button"
                  onClick={() => setPersona(p.id)}
                  style={{
                    fontFamily: 'var(--mono)', fontSize: 11,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    padding: '12px 14px',
                    background: persona === p.id ? 'var(--gold)' : 'transparent',
                    color: persona === p.id ? 'var(--ink)' : 'var(--paper-soft)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: 26, marginBottom: 4 }}>Introduce yourself.</h3>
            <p style={{ color: 'var(--paper-soft)', fontSize: 14, lineHeight: 1.55, margin: '-8px 0 8px', maxWidth: '42ch' }}>
              {persona === 'investor'
                ? 'Aji is a Reg D limited partnership. Institutions, family offices, and accredited investors only. We respond personally to every message.'
                : 'Academics, developers, government officials, advisors. Tell us what you’re working on and we’ll find time to talk.'}
            </p>

            {sent ? (
              <div style={{ padding: '40px 0', textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--gold)', marginBottom: 12 }}>Message received.</div>
                <p style={{ color: 'var(--paper-soft)' }}>
                  We&rsquo;ll be in touch within two business days. In the meantime,
                  the thesis PDF is in your downloads.
                </p>
              </div>
            ) : (
              <>
                <Field label="Name" value={form.name} onChange={v => update('name', v)}/>
                <Field label="Organization" value={form.org} onChange={v => update('org', v)}/>
                <Field label="Email" value={form.email} onChange={v => update('email', v)} type="email"/>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 10 }}><span>Investor type</span></div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Endowment','Pension','Sovereign','Family office','Fund of funds','Insurer','Other'].map(t => (
                      <button key={t} type="button" onClick={() => update('type', t)} style={{
                        fontFamily: 'var(--mono)', fontSize: 11,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '8px 12px',
                        background: form.type === t ? 'var(--gold)' : 'transparent',
                        color: form.type === t ? 'var(--ink)' : 'var(--paper-soft)',
                        border: `1px solid ${form.type === t ? 'var(--gold)' : 'var(--rule-strong)'}`,
                        cursor: 'pointer',
                        borderRadius: 2,
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
                <Field label="Anything specific you're exploring?" value={form.note} onChange={v => update('note', v)} multiline/>
                <button type="submit" style={{
                  marginTop: 12,
                  padding: '16px 24px',
                  background: 'var(--gold)', color: 'var(--ink)',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 12,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  fontWeight: 600,
                  borderRadius: 2,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--paper)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}>
                  Request introduction →
                </button>
              </>
            )}
          </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const Field = ({ label, value, onChange, type = 'text', multiline = false }) => (
  <label style={{ display: 'block' }}>
    <div className="eyebrow" style={{ marginBottom: 10 }}><span>{label}</span></div>
    {multiline ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={inputStyle}/>
    ) : (
      <input value={value} onChange={e => onChange(e.target.value)} type={type} style={inputStyle}/>
    )}
  </label>
);
const inputStyle = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--rule-strong)',
  color: 'var(--paper)',
  fontFamily: 'var(--serif)',
  fontSize: 20,
  padding: '8px 0',
  outline: 'none',
  resize: 'vertical',
};

Object.assign(window, { AssetClassesSection, Move37Section, TeamSection, InquirySection, PhotoPlaceholder });


// === app.jsx ===
/* Aji — hero + app */

const Nav = ({ mode }) => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', on);
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <a href="#top" className="nav-brand">
        <span className="stone"/>
        <span>Aji</span>
      </a>
      <div className="nav-links">
        <a href="#philosophy">Process</a>
        <a href="#flexibility">Mechanisms</a>
        <a href="#assets">Coverage</a>
        <a href="#team">Team</a>
        <a href="#contact">Contact</a>
      </div>
      <a href="#contact" className="nav-cta">LP Inquiry</a>
    </nav>
  );
};

const Hero = () => (
  <section id="top" className="hero">
    <div className="hero-text">
      <div className="eyebrow" style={{ marginBottom: 32 }}>
        <span>The Aji Fund · Reg D Limited Partnership</span>
      </div>
      <h1 className="serif">
        Real assets are built<br/>
        for one future.<br/>
        <em>Aji</em> invests in their<br/>
        options to thrive<br/>
        across many.
      </h1>
      <div style={{ marginTop: 32, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <a href={thesisPdf} download="aji_fund_thesis_v34.pdf" className="link-ghost">Download the thesis <span className="arrow">→</span></a>
      </div>
    </div>
    <div>
      <GoBoard/>
    </div>
  </section>
);

const Philosophy = () => (
  <section id="philosophy" style={{ padding: '0 var(--gutter)' }}>
    <div className="wrap-wide">
      <div className="section-head">
        <div className="num">01 / PROCESS</div>
        <div>
          <h2>The Aji Process</h2>
        </div>
      </div>
      <div style={{ padding: '40px 0 80px' }}>
        <ol style={{
          fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1.5, color: 'var(--paper)',
          paddingLeft: 0, listStyle: 'none', counterReset: 'step',
          maxWidth: 880, margin: 0,
        }}>
          {[
            ['Discover', 'Identify opportunities to create options.'],
            ['Value', "Select and size options with Aji's proprietary real-options valuation tool."],
            ['Fund', 'Invest in those options directly.'],
          ].map(([k, v], i) => (
            <li key={i} style={{
              counterIncrement: 'step', paddingLeft: 80, position: 'relative',
              paddingBottom: 28, marginBottom: 28, borderBottom: '1px solid var(--rule)',
            }}>
              <span style={{
                position: 'absolute', left: 0, top: 6,
                fontFamily: 'var(--mono)', fontSize: 12,
                letterSpacing: '0.14em', color: 'var(--gold)',
                textTransform: 'uppercase',
              }}>0{i+1}</span>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>{k}</div>
              <div>{v}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer>
    <div className="wrap-wide">
      <div>
        <div className="brandmark serif">Aji<span style={{ color: 'var(--gold)' }}>.</span></div>
        <div style={{ color: 'var(--paper-soft)', maxWidth: '32ch', lineHeight: 1.5, fontSize: 12 }}>
          A limited partnership investing in flexibility — the options that let
          real assets adapt across many futures.
        </div>
      </div>
      <div>
        <h4>The Fund</h4>
        <a href="#philosophy">The Aji Process</a>
        <a href="#flexibility">Five mechanisms</a>
        <a href="#assets">Coverage</a>
        <a href="#team">Team</a>
      </div>
      <div>
        <h4>Resources</h4>
        <a href={thesisPdf} download="aji_fund_thesis_v34.pdf">Investment thesis (PDF)</a>
        <a href="https://jleape.github.io/apps/aji/marketplace.html" target="_blank" rel="noopener">Aji Exchange →</a>
      </div>
      <div>
        <h4>Contact</h4>
        <a href="#contact">LP inquiry</a>
        <a href="mailto:jleape@gmail.com">jleape@gmail.com</a>
        <div style={{ marginTop: 24, fontSize: 10, opacity: 0.6, lineHeight: 1.6 }}>
          No part of this site constitutes an offer to sell or a solicitation to buy securities.
          Any offering made only by PPM to qualified investors.
        </div>
      </div>
    </div>
    <div style={{
      maxWidth: 1440, margin: '60px auto 0',
      padding: '24px 0 0',
      borderTop: '1px solid var(--rule)',
      display: 'flex', justifyContent: 'space-between',
      fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
      opacity: 0.6,
    }}>
      <span>© 2026 Aji Capital Management, LP</span>
      <span>Confidential · For qualified investors only</span>
    </div>
  </footer>
);

const App = () => (
  <>
    <Nav/>
    <Hero/>
    <Philosophy/>
    <FlexibilitySection/>
    <AssetClassesSection/>
    <TeamSection/>
    <InquirySection/>
    <Footer/>
  </>
);

export default App;
