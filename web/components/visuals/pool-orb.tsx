/**
 * Hero centerpiece: a lit instrument cluster fused with a CPU die.
 *
 *   screen → backlit display: PCB traces, a processor die, LED tick ring
 *   dome   → convex glass: haze, diagonal specular, bottom shadow, lens rings
 *
 * No bezel: data lanes converge straight onto the glass edge.
 * Geometry is deterministic for SSR.
 */

const CX = 300;
const CY = 300;
const R = 138;
const EDGE = R + 2;
const DIE = R * 0.56;

type Lane = {
  d: string;
  dur: number;
  delay: number;
  warm: boolean;
  len: number;
  dash: number;
};

function buildLanes(): Lane[] {
  const out: Lane[] = [];

  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const sx = 618 + (i % 4) * 22;
    const sy = 10 + t * 560;
    const a = ((-52 + t * 92) * Math.PI) / 180;
    const ex = CX + Math.cos(a) * EDGE;
    const ey = CY + Math.sin(a) * EDGE;
    const c1x = sx - (sx - ex) * 0.5;
    const c1y = sy + (ey - sy) * 0.1;
    const c2x = ex + (sx - ex) * 0.32;
    const c2y = ey + (sy - ey) * 0.24;

    out.push({
      d: `M ${sx} ${sy} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      dur: 4.6 + (i % 7) * 0.62,
      delay: (i % 10) * 0.47,
      warm: i % 7 === 0,
      len: 1000,
      dash: 90 + (i % 5) * 26,
    });
  }

  for (let i = 0; i < 20; i++) {
    const t = i / 19;
    const sx = 40 + t * 470;
    const sy = 700 + (i % 4) * 18;
    const a = ((42 + t * 96) * Math.PI) / 180;
    const ex = CX + Math.cos(a) * EDGE;
    const ey = CY + Math.sin(a) * EDGE;
    const c1x = sx + (ex - sx) * 0.2;
    const c1y = sy - (sy - ey) * 0.48;
    const c2x = ex + (sx - ex) * 0.26;
    const c2y = ey + (sy - ey) * 0.32;

    out.push({
      d: `M ${sx} ${sy} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      dur: 5.2 + (i % 6) * 0.74,
      delay: (i % 9) * 0.55,
      warm: i % 8 === 0,
      len: 1000,
      dash: 80 + (i % 4) * 30,
    });
  }

  return out;
}

const LANES = buildLanes();

// LED tick ring around the screen edge.
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const a = (i / 72) * Math.PI * 2 - Math.PI / 2;
  const major = i % 6 === 0;
  const r1 = R - 9;
  const r2 = R - (major ? 24 : 16);
  return {
    x1: CX + Math.cos(a) * r1,
    y1: CY + Math.sin(a) * r1,
    x2: CX + Math.cos(a) * r2,
    y2: CY + Math.sin(a) * r2,
    o: major ? 0.34 : 0.14,
    w: major ? 1.3 : 0.8,
  };
});

// Lit LED segments (the "powered on" look).
const LIT = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
  return {
    x1: CX + Math.cos(a) * (R - 10),
    y1: CY + Math.sin(a) * (R - 10),
    x2: CX + Math.cos(a) * (R - 26),
    y2: CY + Math.sin(a) * (R - 26),
  };
});

// Die cells: an 8x8 processor floorplan.
const CELLS = Array.from({ length: 64 }, (_, i) => {
  const col = i % 8;
  const row = Math.floor(i / 8);
  const span = DIE * 1.72;
  const step = span / 8;
  const x = CX - span / 2 + step * col + step * 0.16;
  const y = CY - span / 2 + step * row + step * 0.16;
  const size = step * 0.62;
  const dist = Math.hypot(col - 3.5, row - 3.5) / 4.95;
  return { x, y, size, o: 0.06 + (1 - dist) * 0.22 };
});

// Die pins, 10 per side.
const PINS = Array.from({ length: 40 }, (_, i) => {
  const side = Math.floor(i / 10);
  const k = i % 10;
  const offset = -DIE * 0.9 + (DIE * 1.8 * (k + 0.5)) / 10;
  const len = 8;
  if (side === 0) return { x1: CX + offset, y1: CY - DIE, x2: CX + offset, y2: CY - DIE - len };
  if (side === 1) return { x1: CX + DIE, y1: CY + offset, x2: CX + DIE + len, y2: CY + offset };
  if (side === 2) return { x1: CX + offset, y1: CY + DIE, x2: CX + offset, y2: CY + DIE + len };
  return { x1: CX - DIE, y1: CY + offset, x2: CX - DIE - len, y2: CY + offset };
});

// Chip fanout: die edge → outer ring.
const FANOUT = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
  const t = DIE / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
  const sx = CX + Math.cos(a) * t;
  const sy = CY + Math.sin(a) * t;
  const ex = CX + Math.cos(a) * (R - 34);
  const ey = CY + Math.sin(a) * (R - 34);
  return { d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`, ex, ey, a };
});

// Neural nodes just outside the die.
const NODES = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
  return {
    x: CX + Math.cos(a) * (DIE + 26),
    y: CY + Math.sin(a) * (DIE + 26),
    delay: i * 0.5,
  };
});

export function PoolOrb({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <svg viewBox="0 0 600 600" className="h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="scr" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#0e3648" stopOpacity="1" />
            <stop offset="55%" stopColor="#061a25" stopOpacity="1" />
            <stop offset="100%" stopColor="#02080c" stopOpacity="1" />
          </radialGradient>
          <pattern id="scr-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" stroke="#4DE1FF" strokeOpacity="0.06" strokeWidth="0.7" />
          </pattern>
          <pattern id="scr-scan" width="3" height="3" patternUnits="userSpaceOnUse">
            <path d="M0 0H3" stroke="#000000" strokeOpacity="0.2" strokeWidth="1" />
          </pattern>

          <radialGradient id="glass-haze" cx="36%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="42%" stopColor="#CFF7FF" stopOpacity="0.03" />
            <stop offset="82%" stopColor="#7FE9FF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#EAFEFF" stopOpacity="0.16" />
          </radialGradient>
          <radialGradient id="spec" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
            <stop offset="55%" stopColor="#EAFEFF" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="dome-rim" x1="0.12" y1="0.06" x2="0.9" y2="0.96">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="40%" stopColor="#A8F0FF" stopOpacity="0.35" />
            <stop offset="78%" stopColor="#EAFEFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.65" />
          </linearGradient>

          <linearGradient id="lane-right" x1="760" y1="300" x2="430" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4DE1FF" stopOpacity="0.03" />
            <stop offset="62%" stopColor="#7FE9FF" stopOpacity="0.11" />
            <stop offset="100%" stopColor="#CFF7FF" stopOpacity="0.26" />
          </linearGradient>
          <linearGradient id="lane-bottom" x1="300" y1="760" x2="300" y2="430" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4DE1FF" stopOpacity="0.03" />
            <stop offset="62%" stopColor="#7FE9FF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#CFF7FF" stopOpacity="0.24" />
          </linearGradient>
          <linearGradient id="stream-warm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFB454" stopOpacity="0" />
            <stop offset="55%" stopColor="#FFD9A3" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFF3DD" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="stream-cool" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4DE1FF" stopOpacity="0" />
            <stop offset="55%" stopColor="#A8F0FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F2FFFF" stopOpacity="1" />
          </linearGradient>

          <filter id="blur-lg" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id="blur-md" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="led-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="scr-clip">
            <circle cx={CX} cy={CY} r={R - 4} />
          </clipPath>
        </defs>

        {/* lanes */}
        {LANES.map((s, i) => {
          const fromRight = i < 30;
          return (
            <g key={`l-${i}`}>
              <path d={s.d} stroke={fromRight ? "url(#lane-right)" : "url(#lane-bottom)"} strokeWidth="1" />
              <path
                d={s.d}
                stroke={s.warm ? "url(#stream-warm)" : "url(#stream-cool)"}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray={`${s.dash} ${s.len - s.dash}`}
                className="trace-flow"
                style={
                  {
                    "--trace-dur": `${s.dur}s`,
                    "--trace-delay": `${s.delay}s`,
                    "--trace-len": `${s.len}`,
                  } as React.CSSProperties
                }
                filter="url(#glow)"
              />
            </g>
          );
        })}

        {LANES.filter((_, i) => i % 5 === 0).map((s, i) => (
          <circle key={`p-${i}`} r="2" fill={s.warm ? "#FFE3B8" : "#D5F9FF"} filter="url(#glow)">
            <animateMotion dur={`${s.dur * 1.2}s`} begin={`${s.delay + 0.3}s`} repeatCount="indefinite" path={s.d} />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur={`${s.dur * 1.2}s`}
              begin={`${s.delay + 0.3}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* halo */}
        <circle cx={CX} cy={CY} r={EDGE + 42} fill="#7FE9FF" opacity="0.06" filter="url(#blur-lg)" />

        {/* screen */}
        <circle cx={CX} cy={CY} r={R} fill="url(#scr)" />
        <g clipPath="url(#scr-clip)">
          <rect x={CX - R} y={CY - R} width={R * 2} height={R * 2} fill="url(#scr-grid)" opacity="0.75" />
          <rect x={CX - R} y={CY - R} width={R * 2} height={R * 2} fill="url(#scr-scan)" opacity="0.5" />

          {/* backlight: cool core + warm floor, so the display is lit even at zero */}
          <circle cx={CX} cy={CY} r={R * 0.78} fill="#4DE1FF" opacity="0.1" filter="url(#blur-lg)" />
          <ellipse cx={CX} cy={CY + R * 0.52} rx={R * 0.62} ry={R * 0.32} fill="#FFB454" opacity="0.07" filter="url(#blur-lg)" />

          {/* chip fanout */}
          {FANOUT.map((f, i) => (
            <g key={`f-${i}`}>
              <path d={f.d} stroke="#7FE9FF" strokeOpacity="0.13" strokeWidth="0.8" />
              <circle cx={f.ex} cy={f.ey} r="1.3" fill="#7FE9FF" opacity="0.3" />
            </g>
          ))}
          {FANOUT.filter((_, i) => i % 4 === 0).map((f, i) => (
            <circle key={`fp-${i}`} r="1.4" fill="#D5F9FF" filter="url(#glow)">
              <animateMotion dur={`${4 + i * 0.6}s`} repeatCount="indefinite" path={f.d} />
            </circle>
          ))}

          {/* processor die */}
          <g>
            <rect
              x={CX - DIE}
              y={CY - DIE}
              width={DIE * 2}
              height={DIE * 2}
              rx="8"
              stroke="#7FE9FF"
              strokeOpacity="0.34"
              strokeWidth="1.1"
            />
            <rect
              x={CX - DIE * 0.94}
              y={CY - DIE * 0.94}
              width={DIE * 1.88}
              height={DIE * 1.88}
              rx="6"
              stroke="#7FE9FF"
              strokeOpacity="0.12"
              strokeWidth="0.8"
            />
            {PINS.map((p, i) => (
              <line
                key={`pin-${i}`}
                x1={p.x1}
                y1={p.y1}
                x2={p.x2}
                y2={p.y2}
                stroke="#9FDFF0"
                strokeOpacity="0.3"
                strokeWidth="1"
              />
            ))}
            {CELLS.map((c, i) => (
              <rect
                key={`cell-${i}`}
                x={c.x}
                y={c.y}
                width={c.size}
                height={c.size}
                rx="1"
                fill="#7FE9FF"
                opacity={c.o}
              />
            ))}
            {/* die core */}
            <circle cx={CX} cy={CY} r={DIE * 0.2} fill="#4DE1FF" opacity="0.08" filter="url(#blur-md)" />
            <circle cx={CX} cy={CY} r={DIE * 0.06} fill="#EAFEFF" opacity="0.16" filter="url(#glow)" className="core-pulse" />
          </g>

          {/* neural nodes */}
          {NODES.map((n, i) => (
            <g key={`n-${i}`}>
              <line
                x1={CX + (n.x - CX) * 0.62}
                y1={CY + (n.y - CY) * 0.62}
                x2={n.x}
                y2={n.y}
                stroke="#4DE1FF"
                strokeOpacity="0.16"
                strokeWidth="0.8"
              />
              <circle cx={n.x} cy={n.y} r="2.2" fill="#A8F0FF" opacity="0.55" className="led-blink" style={{ animationDelay: `${n.delay}s` }} />
            </g>
          ))}

          {/* LED tick ring */}
          {TICKS.map((t, i) => (
            <line
              key={`t-${i}`}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#9FDFF0"
              strokeOpacity={t.o}
              strokeWidth={t.w}
            />
          ))}
          {LIT.map((t, i) => (
            <line
              key={`lit-${i}`}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#9FEFFF"
              strokeOpacity="0.5"
              strokeWidth="1.8"
              strokeLinecap="round"
              filter="url(#led-glow)"
            />
          ))}

          {/* sweeping lit segment */}
          <g className="origin-center animate-spin-slow" opacity="0.85">
            {[0, 1, 2, 3].map((k) => {
              const a = (k / 72) * Math.PI * 2 - Math.PI / 2;
              return (
                <line
                  key={k}
                  x1={CX + Math.cos(a) * (R - 10)}
                  y1={CY + Math.sin(a) * (R - 10)}
                  x2={CX + Math.cos(a) * (R - 27)}
                  y2={CY + Math.sin(a) * (R - 27)}
                  stroke="#FFF3DD"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  filter="url(#led-glow)"
                />
              );
            })}
          </g>

          {/* corner markers */}
          {[0, 90, 180, 270].map((deg) => {
            const a = (deg * Math.PI) / 180;
            return (
              <circle
                key={deg}
                cx={CX + Math.cos(a) * (R - 5)}
                cy={CY + Math.sin(a) * (R - 5)}
                r="1.8"
                fill="#BFEFFF"
                opacity="0.4"
              />
            );
          })}
        </g>

        {/* glass dome */}
        <circle cx={CX} cy={CY} r={R} fill="url(#glass-haze)" />
        <g clipPath="url(#scr-clip)">
          <ellipse cx={CX} cy={CY + R * 0.66} rx={R * 0.94} ry={R * 0.46} fill="#000000" opacity="0.46" filter="url(#blur-md)" />
          <ellipse
            cx={CX - R * 0.44}
            cy={CY - R * 0.56}
            rx={R * 0.56}
            ry={R * 0.26}
            fill="url(#spec)"
            transform={`rotate(-24 ${CX} ${CY})`}
          />
          <ellipse
            cx={CX - R * 0.48}
            cy={CY - R * 0.6}
            rx={R * 0.22}
            ry={R * 0.1}
            fill="#FFFFFF"
            opacity="0.18"
            transform={`rotate(-24 ${CX} ${CY})`}
          />
          <path
            d={`M ${CX - R * 0.6} ${CY + R * 0.1} Q ${CX - R * 0.2} ${CY - R * 0.7} ${CX + R * 0.45} ${CY - R * 0.55}`}
            stroke="#FFFFFF"
            strokeOpacity="0.1"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </g>

        {/* glass edge + lens curvature rings */}
        <circle cx={CX} cy={CY} r={R - 1.5} fill="none" stroke="url(#dome-rim)" strokeWidth="2" />
        <circle cx={CX} cy={CY} r={R - 6} fill="none" stroke="#FFFFFF" strokeOpacity="0.06" strokeWidth="4" />
        <circle cx={CX} cy={CY} r={R - 15} fill="none" stroke="#FFFFFF" strokeOpacity="0.035" strokeWidth="7" />
        <circle cx={CX} cy={CY} r={R - 30} fill="none" stroke="#FFFFFF" strokeOpacity="0.018" strokeWidth="11" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative px-6 py-5 text-center">
          <div className="pointer-events-none absolute inset-x-2 inset-y-0 -z-10 rounded-full bg-obsidian-950/70 blur-xl" />
          {children}
        </div>
      </div>
    </div>
  );
}
