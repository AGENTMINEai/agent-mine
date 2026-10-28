function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261028);

const DOTS = Array.from({ length: 96 }, () => {
  const x = rand() * 1200;
  const y = rand() * 800;
  return {
    x,
    y,
    r: 0.5 + rand() * 1.3,
    o: 0.12 + rand() * 0.5,
    delay: rand() * 7,
    dur: 3 + rand() * 5,
    warm: rand() > 0.82,
  };
});

// A few constellation links between dots that happen to be near each other.
const LINKS: Array<[number, number]> = [];
for (let i = 0; i < DOTS.length && LINKS.length < 14; i += 3) {
  const a = DOTS[i];
  for (let j = i + 1; j < DOTS.length; j++) {
    const b = DOTS[j];
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    if (dx * dx + dy * dy < 130 * 130) {
      LINKS.push([i, j]);
      break;
    }
  }
}

export function Starfield({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      {LINKS.map(([i, j]) => (
        <line
          key={`l-${i}-${j}`}
          x1={DOTS[i].x}
          y1={DOTS[i].y}
          x2={DOTS[j].x}
          y2={DOTS[j].y}
          stroke="#7FE9FF"
          strokeOpacity="0.07"
          strokeWidth="0.7"
        />
      ))}
      {DOTS.map((d, i) => (
        <circle
          key={`d-${i}`}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={d.warm ? "#FFD9A3" : "#BFEFFF"}
          opacity={d.o}
          className="animate-breathe"
          style={{ animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }}
        />
      ))}
    </svg>
  );
}
