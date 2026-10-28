type AreaChartProps = {
  values: number[];
  height?: number;
  color?: string;
  fillId: string;
  yMax?: number;
  xLabels?: string[];
  className?: string;
};

const W = 560;

export function AreaChart({
  values,
  height = 200,
  color = "#FFB454",
  fillId,
  yMax,
  xLabels = [],
  className,
}: AreaChartProps) {
  const h = height;
  const padTop = 12;
  const padBottom = 10;
  const plotH = h - padTop - padBottom;
  const data = values.length >= 2 ? values : [0, 0];
  const max = Math.max(yMax ?? Math.max(...data) * 1.15, 1e-9);

  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => padTop + plotH - (Math.max(0, v) / max) * plotH;

  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${W} ${padTop + plotH} L 0 ${padTop + plotH} Z`;

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <div className="min-h-0 flex-1">
        <svg viewBox={`0 0 ${W} ${h}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${fillId}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="60%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1="0"
            x2={W}
            y1={padTop + plotH * p}
            y2={padTop + plotH * p}
            stroke="#ffffff"
            strokeOpacity={p === 1 ? 0.09 : 0.045}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={`url(#${fillId})`} />
        <path
          d={line}
          fill="none"
          stroke={`url(#${fillId}-line)`}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {data.length > 1 && (
          <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="2.6" fill={color} vectorEffect="non-scaling-stroke" />
        )}
        </svg>
      </div>

      {xLabels.length > 0 && (
        <div className="mt-2 flex justify-between font-mono text-[9px] text-ink-muted">
          {xLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Ring({
  value,
  size = 92,
  stroke = 7,
  color = "#4DE1FF",
  track = "rgba(255,255,255,0.08)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.2,0.7,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
