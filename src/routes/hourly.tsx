import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Wind } from "lucide-react";

import { SectionHeading } from "@/components/weather/MetricTile";
import { PageFrame } from "@/components/weather/PageFrame";
import { TempCurve } from "@/components/weather/TempCurve";
import { WeatherGlyph } from "@/components/weather/WeatherGlyph";
import { useLocationState, validateLocationSearch } from "@/lib/location-context";
import {
  dayParts,
  describeCode,
  formatHour,
  formatLength,
  formatSpeed,
  formatTemp,
  placeLabel,
  windDirectionLabel,
} from "@/lib/weather";

export const Route = createFileRoute("/hourly")({
  validateSearch: validateLocationSearch,
  head: () => ({
    meta: [
      { title: "Hourly Forecast — Dawncast" },
      {
        name: "description",
        content:
          "A 72-hour hourly forecast with temperature curve, precipitation chance, wind and humidity for your city.",
      },
      { property: "og:title", content: "Hourly Forecast — Dawncast" },
      {
        property: "og:description",
        content: "72 hours of temperature, rain chance, wind and humidity, hour by hour.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/hourly" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/hourly" }],
  }),
  component: HourlyPage,
});

function HourlyPage() {
  const { units, place } = useLocationState();

  return (
    <PageFrame>
      {({ forecast }) => {
        const nowIndex = Math.max(
          0,
          forecast.hourly.findIndex(
            (h) => h.time.slice(0, 13) === forecast.current.time.slice(0, 13),
          ),
        );
        const hours = forecast.hourly.slice(nowIndex);
        const groups = new Map<string, typeof hours>();
        for (const h of hours) {
          const key = h.time.slice(0, 10);
          groups.set(key, [...(groups.get(key) ?? []), h]);
        }

        return (
          <>
            <header className="pt-8">
              <p className="text-[11px] uppercase tracking-[0.28em] text-accent">
                {placeLabel(place)}
              </p>
              <h1 className="mt-2 text-4xl sm:text-5xl">Hourly forecast</h1>
              <p className="mt-3 max-w-xl text-foreground/85">
                The next three days at hourly resolution. The curve shows temperature; the soft bars
                behind it are the chance of precipitation.
              </p>
            </header>

            <section className="mt-9">
              <div className="glass overflow-hidden rounded-3xl p-4">
                <div className="overflow-x-auto no-scrollbar">
                  <TempCurve
                    points={hours.slice(0, 48)}
                    units={units}
                    height={240}
                    labelEvery={2}
                  />
                </div>
              </div>
            </section>

            {[...groups.entries()].map(([date, list]) => {
              const parts = dayParts(date);
              const isToday = date === forecast.current.time.slice(0, 10);
              return (
                <section key={date} className="mt-12">
                  <SectionHeading
                    eyebrow={`${parts.month} ${parts.day}`}
                    title={isToday ? "Today" : parts.weekday}
                  />
                  <div className="glass divide-y divide-border rounded-3xl">
                    {list.map((h, i) => {
                      const g = describeCode(h.weatherCode);
                      return (
                        <div
                          key={h.time}
                          className="grid grid-cols-[4.5rem_2rem_1fr] items-center gap-4 px-5 py-3.5 sm:grid-cols-[5rem_2.5rem_5rem_1fr_auto] sm:px-7"
                        >
                          <p className="tabular text-sm text-muted-foreground">
                            {isToday && i === 0 ? "Now" : formatHour(h.time)}
                          </p>
                          <WeatherGlyph
                            group={g.group}
                            isDay={h.isDay}
                            className="h-7 w-7 text-cream"
                          />
                          <p className="tabular font-display text-2xl">
                            {formatTemp(h.temperature, units)}
                          </p>
                          <div className="col-span-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-foreground/80 sm:col-span-1">
                            <span className="text-foreground/90">{g.label}</span>
                            <span className="tabular flex items-center gap-1.5 text-accent">
                              <Droplets className="h-3.5 w-3.5" />
                              {Math.round(h.precipitationProbability)}%
                              {h.precipitation > 0 && (
                                <span className="text-muted-foreground">
                                  {formatLength(h.precipitation, units)}
                                </span>
                              )}
                            </span>
                            <span className="tabular flex items-center gap-1.5 text-muted-foreground">
                              <Wind className="h-3.5 w-3.5" />
                              {formatSpeed(h.windSpeed, units)}{" "}
                              {windDirectionLabel(h.windDirection)}
                            </span>
                            <span className="tabular text-muted-foreground">
                              RH {Math.round(h.humidity)}%
                            </span>
                          </div>
                          <p className="tabular hidden text-right text-xs text-muted-foreground sm:block">
                            feels {formatTemp(h.apparentTemperature, units)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </>
        );
      }}
    </PageFrame>
  );
}
