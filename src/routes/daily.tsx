import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, CloudRain, Sun, Wind } from "lucide-react";
import { useState } from "react";

import { PageFrame } from "@/components/weather/PageFrame";
import { WeatherGlyph } from "@/components/weather/WeatherGlyph";
import { cn } from "@/lib/utils";
import { useLocationState, validateLocationSearch } from "@/lib/location-context";
import {
  dayParts,
  describeCode,
  formatClock,
  formatLength,
  formatSpeed,
  formatTemp,
  placeLabel,
  uvBand,
  windDirectionLabel,
} from "@/lib/weather";

export const Route = createFileRoute("/daily")({
  validateSearch: validateLocationSearch,
  head: () => ({
    meta: [
      { title: "14-Day Forecast — Dawncast" },
      {
        name: "description",
        content:
          "A two-week outlook with daily highs and lows, rain totals, UV peaks and wind — expand any day for the full detail.",
      },
      { property: "og:title", content: "14-Day Forecast — Dawncast" },
      {
        property: "og:description",
        content: "Two weeks of highs, lows, rain totals, UV peaks and wind for any city.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/daily" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/daily" }],
  }),
  component: DailyPage,
});

function DailyPage() {
  const { units, place } = useLocationState();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <PageFrame>
      {({ forecast }) => {
        const days = forecast.daily;
        const min = Math.min(...days.map((d) => d.tempMin));
        const max = Math.max(...days.map((d) => d.tempMax));

        return (
          <>
            <header className="pt-8">
              <p className="text-[11px] uppercase tracking-[0.28em] text-accent">
                {placeLabel(place)}
              </p>
              <h1 className="mt-2 text-4xl sm:text-5xl">Fourteen days ahead</h1>
              <p className="mt-3 max-w-xl text-foreground/85">
                Bars are scaled across the whole fortnight, so you can read the warming and cooling
                trend at a glance. Tap any day for the full picture.
              </p>
            </header>

            <section className="glass mt-9 divide-y divide-border rounded-3xl">
              {days.map((d, i) => {
                const g = describeCode(d.weatherCode);
                const parts = dayParts(d.date);
                const left = ((d.tempMin - min) / Math.max(1, max - min)) * 100;
                const width = ((d.tempMax - d.tempMin) / Math.max(1, max - min)) * 100;
                const expanded = open === d.date;
                const uv = uvBand(d.uvIndexMax);

                return (
                  <div key={d.date}>
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : d.date)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary sm:px-7"
                    >
                      <div className="w-24 shrink-0">
                        <p className="font-semibold">{i === 0 ? "Today" : parts.weekdayShort}</p>
                        <p className="text-xs text-muted-foreground">
                          {parts.month} {parts.day}
                        </p>
                      </div>
                      <WeatherGlyph group={g.group} className="h-8 w-8 shrink-0 text-cream" />
                      <p className="hidden flex-1 text-sm text-foreground/85 md:block">{g.label}</p>
                      <p className="tabular hidden w-14 text-sm text-accent sm:block">
                        {Math.round(d.precipitationProbabilityMax)}%
                      </p>
                      <p className="tabular w-10 text-right text-muted-foreground">
                        {formatTemp(d.tempMin, units)}
                      </p>
                      <div className="relative h-1.5 w-20 shrink-0 rounded-full bg-secondary sm:w-40">
                        <span
                          className="absolute inset-y-0 rounded-full"
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(8, width)}%`,
                            background: "linear-gradient(90deg, var(--gold), var(--coral))",
                          }}
                        />
                      </div>
                      <p className="tabular w-10 font-semibold">{formatTemp(d.tempMax, units)}</p>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          expanded && "rotate-180",
                        )}
                      />
                    </button>

                    {expanded && (
                      <div className="grid gap-4 px-5 pb-6 sm:grid-cols-2 sm:px-7 lg:grid-cols-4">
                        <Detail
                          icon={Sun}
                          label="Daylight"
                          lines={[
                            `Sunrise ${formatClock(d.sunrise)}`,
                            `Sunset ${formatClock(d.sunset)}`,
                          ]}
                        />
                        <Detail
                          icon={CloudRain}
                          label="Precipitation"
                          lines={[
                            `${formatLength(d.precipitationSum, units)} expected`,
                            `${Math.round(d.precipitationProbabilityMax)}% peak chance`,
                          ]}
                        />
                        <Detail
                          icon={Wind}
                          label="Wind"
                          lines={[
                            `${formatSpeed(d.windSpeedMax, units)} sustained max`,
                            `Gusts ${formatSpeed(d.windGustsMax, units)} ${windDirectionLabel(d.windDirection)}`,
                          ]}
                        />
                        <Detail
                          icon={Sun}
                          label={`UV ${Math.round(d.uvIndexMax)} · ${uv.label}`}
                          lines={[
                            uv.advice,
                            `Feels ${formatTemp(d.apparentMin, units)} – ${formatTemp(d.apparentMax, units, true)}`,
                          ]}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          </>
        );
      }}
    </PageFrame>
  );
}

function Detail({
  icon: Icon,
  label,
  lines,
}: {
  icon: typeof Sun;
  label: string;
  lines: string[];
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {label}
      </p>
      {lines.map((line) => (
        <p key={line} className="mt-1.5 text-sm text-foreground/90">
          {line}
        </p>
      ))}
    </div>
  );
}
