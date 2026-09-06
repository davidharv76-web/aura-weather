import { formatClock } from "@/lib/weather";

/** Sunrise/sunset arc with the sun positioned by the current local time. */
export function SunArc({ sunrise, sunset, now }: { sunrise: string; sunset: string; now: string }) {
  const minutes = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));
  const start = minutes(sunrise);
  const end = minutes(sunset);
  const current = minutes(now);
  const raw = (current - start) / Math.max(1, end - start);
  const progress = Math.min(1, Math.max(0, raw));

  const width = 320;
  const height = 132;
  const r = 128;
  const cx = width / 2;
  const cy = height + 6;
  const angle = Math.PI * (1 - progress);
  const sx = cx + Math.cos(angle) * r;
  const sy = cy - Math.sin(angle) * r;

  const dayLength = Math.max(0, end - start);
  const hours = Math.floor(dayLength / 60);
  const mins = dayLength % 60;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${width} ${height + 10}`} className="w-full max-w-[320px]" aria-hidden>
        <defs>
          <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.5" />
            <stop offset="50%" stopColor="var(--gold)" />
            <stop offset="100%" stopColor="var(--coral)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--cream)"
          strokeOpacity={0.18}
          strokeWidth={2}
          strokeDasharray="3 6"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${sx} ${sy}`}
          fill="none"
          stroke="url(#arc-grad)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {raw >= 0 && raw <= 1 && (
          <>
            <circle cx={sx} cy={sy} r={13} fill="var(--gold)" opacity={0.25} />
            <circle cx={sx} cy={sy} r={6.5} fill="var(--gold)" />
          </>
        )}
      </svg>
      <div className="-mt-1 flex w-full items-center justify-between text-xs">
        <div>
          <p className="text-muted-foreground">Sunrise</p>
          <p className="tabular font-semibold">{formatClock(sunrise)}</p>
        </div>
        <p className="text-muted-foreground">
          {hours}h {mins}m of daylight
        </p>
        <div className="text-right">
          <p className="text-muted-foreground">Sunset</p>
          <p className="tabular font-semibold">{formatClock(sunset)}</p>
        </div>
      </div>
    </div>
  );
}
