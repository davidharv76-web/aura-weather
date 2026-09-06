import { cn } from "@/lib/utils";
import type { WeatherGroup } from "@/lib/weather";

type Props = {
  group: WeatherGroup;
  isDay?: boolean;
  className?: string;
};

/** Hand-built line/fill glyphs so iconography matches the dawn palette. */
export function WeatherGlyph({ group, isDay = true, className }: Props) {
  const stroke = "currentColor";
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 48 48" className={cn("h-10 w-10", className)} aria-hidden="true">
      <defs>
        <linearGradient id="glyph-warm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--coral)" />
        </linearGradient>
      </defs>

      {(group === "clear" || group === "partly") &&
        (isDay ? (
          <>
            <circle
              cx={group === "partly" ? 19 : 24}
              cy={group === "partly" ? 19 : 24}
              r={group === "partly" ? 7 : 9}
              fill="url(#glyph-warm)"
            />
            {group === "clear" &&
              [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <line
                  key={a}
                  {...common}
                  stroke="url(#glyph-warm)"
                  x1={24 + Math.cos((a * Math.PI) / 180) * 13}
                  y1={24 + Math.sin((a * Math.PI) / 180) * 13}
                  x2={24 + Math.cos((a * Math.PI) / 180) * 17}
                  y2={24 + Math.sin((a * Math.PI) / 180) * 17}
                />
              ))}
          </>
        ) : (
          <path
            d="M30 8a13 13 0 1 0 11 20A15 15 0 0 1 30 8Z"
            fill="url(#glyph-warm)"
            opacity={0.9}
          />
        ))}

      {group !== "clear" && (
        <path
          {...common}
          d="M14 33h18a6.5 6.5 0 0 0 .4-13 9.5 9.5 0 0 0-18.2 2.2A5.9 5.9 0 0 0 14 33Z"
        />
      )}

      {group === "fog" &&
        [37, 41].map((y) => <line key={y} {...common} x1="11" y1={y} x2="37" y2={y} />)}

      {(group === "drizzle" || group === "rain") &&
        [17, 24, 31].map((x, i) => (
          <line
            key={x}
            {...common}
            stroke="url(#glyph-warm)"
            x1={x}
            y1={36}
            x2={x - 2}
            y2={group === "rain" ? 43 : 40 + i * 0}
          />
        ))}

      {group === "snow" &&
        [17, 24, 31].map((x) => (
          <g key={x} stroke="url(#glyph-warm)" strokeWidth={1.5} strokeLinecap="round">
            <line x1={x - 3} y1={39} x2={x + 3} y2={39} />
            <line x1={x} y1={36} x2={x} y2={42} />
          </g>
        ))}

      {group === "storm" && (
        <path d="M25 35l-6 6h5l-2 6 8-8h-5l3-4Z" fill="url(#glyph-warm)" stroke="none" />
      )}
    </svg>
  );
}
