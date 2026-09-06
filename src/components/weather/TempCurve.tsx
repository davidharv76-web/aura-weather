import { formatTemp, type Units } from "@/lib/weather";

type Point = { time: string; temperature: number; precipitationProbability: number };

/** Lightweight hand-drawn SVG curve: temperature line + precipitation bars. */
export function TempCurve({
  points,
  units,
  height = 220,
  labelEvery = 3,
}: {
  points: Point[];
  units: Units;
  height?: number;
  labelEvery?: number;
}) {
  if (points.length < 2) return null;
  const width = Math.max(720, points.length * 46);
  const padX = 24;
  const padTop = 34;
  const padBottom = 46;
  const temps = points.map((p) => p.temperature);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(1, max - min);

  const x = (i: number) => padX + (i * (width - padX * 2)) / (points.length - 1);
  const y = (t: number) => padTop + (1 - (t - min) / span) * (height - padTop - padBottom);

  const line = points
    .map((p, i) => {
      const cx = x(i);
      const cy = y(p.temperature);
      if (i === 0) return `M ${cx} ${cy}`;
      const px = x(i - 1);
      const py = y(points[i - 1]?.temperature ?? p.temperature);
      const mx = (px + cx) / 2;
      return `C ${mx} ${py} ${mx} ${cy} ${cx} ${cy}`;
    })
    .join(" ");

  const area = `${line} L ${x(points.length - 1)} ${height - padBottom} L ${padX} ${height - padBottom} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block"
      role="img"
      aria-label="Temperature and precipitation trend"
    >
      <defs>
        <linearGradient id="curve-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--coral)" />
        </linearGradient>
        <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {points.map((p, i) =>
        p.precipitationProbability > 4 ? (
          <rect
            key={`bar-${p.time}`}
            x={x(i) - 7}
            width={14}
            y={
              height -
              padBottom -
              (p.precipitationProbability / 100) * (height - padTop - padBottom) * 0.5
            }
            height={(p.precipitationProbability / 100) * (height - padTop - padBottom) * 0.5}
            rx={7}
            fill="var(--cream)"
            opacity={0.14}
          />
        ) : null,
      )}

      <path d={area} fill="url(#curve-fill)" />
      <path
        d={line}
        fill="none"
        stroke="url(#curve-stroke)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      {points.map((p, i) => (
        <g key={p.time}>
          <circle cx={x(i)} cy={y(p.temperature)} r={3} fill="var(--cream)" />
          {i % labelEvery === 0 && (
            <>
              <text
                x={x(i)}
                y={y(p.temperature) - 14}
                textAnchor="middle"
                className="tabular"
                fontSize={13}
                fontWeight={600}
                fill="var(--cream)"
              >
                {formatTemp(p.temperature, units)}
              </text>
              <text
                x={x(i)}
                y={height - 18}
                textAnchor="middle"
                fontSize={11}
                fill="var(--cream)"
                opacity={0.65}
              >
                {p.time.slice(11, 16)}
              </text>
              {p.precipitationProbability > 4 && (
                <text
                  x={x(i)}
                  y={height - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--gold)"
                  opacity={0.9}
                >
                  {Math.round(p.precipitationProbability)}%
                </text>
              )}
            </>
          )}
        </g>
      ))}
    </svg>
  );
}
