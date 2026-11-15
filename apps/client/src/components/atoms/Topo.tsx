/*
 * Contour lines, like a topographic map: concentric wobbly rings centred off
 * the top-right corner. The default banner art for spaces and profiles.
 * Strokes use currentColor; size and position it from the parent.
 */

const cache = new Map<number, string[]>();

function topoPaths(seed: number): string[] {
  const hit = cache.get(seed);
  if (hit) return hit;
  // Seed 0 is the original space-banner map; other seeds shift the phases so
  // every user/space gets their own terrain.
  const p1 = seed * 0.37;
  const p2 = seed * 0.61;
  const paths = Array.from({ length: 8 }, (_, i) => {
    const k = i + 1;
    const r = k * 10;
    let d = '';
    for (let a = 0; a <= 72; a++) {
      const t = (a / 72) * Math.PI * 2;
      const rr =
        r *
        (1 +
          0.16 * Math.sin(3 * t + k * 0.7 + p1) +
          0.07 * Math.sin(5 * t - k + p2));
      d += `${a ? 'L' : 'M'}${(196 + Math.cos(t) * rr * 1.5).toFixed(1)} ${(
        18 +
        Math.sin(t) * rr
      ).toFixed(1)}`;
    }
    return `${d}Z`;
  });
  cache.set(seed, paths);
  return paths;
}

export function Topo({
  seed = 0,
  className,
}: {
  seed?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 96"
      preserveAspectRatio="xMaxYMin slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      aria-hidden
    >
      {topoPaths(seed).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
