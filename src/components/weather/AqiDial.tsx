import { aqiBand } from "@/lib/weather";

const TONE_VAR: Record<string, string> = {
  "aqi-good": "var(--aqi-good)",
  "aqi-moderate": "var(--aqi-moderate)",
  "aqi-poor": "var(--aqi-poor)",
  "aqi-bad": "var(--aqi-bad)",
};

export function AqiDial({ aqi, size = 148 }: { aqi: number; size?: number }) {
  const band = aqiBand(aqi);
  const color = TONE_VAR[band.tone];
  const r = size / 2 - 12;
  const circumference = Math.PI * r * 1.5;
  const pct = Math.min(1, aqi / 120);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-[135deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--cream)"
          strokeOpacity={0.16}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference * 3}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference * 3}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="tabular font-display text-4xl leading-none">{Math.round(aqi)}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em]" style={{ color }}>
          {band.label}
        </p>
      </div>
    </div>
  );
}
