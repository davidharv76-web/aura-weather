import { createFileRoute } from "@tanstack/react-router";
import { Leaf, Sun, Wind } from "lucide-react";

import { AqiDial } from "@/components/weather/AqiDial";
import { MetricTile, SectionHeading } from "@/components/weather/MetricTile";
import { PageFrame } from "@/components/weather/PageFrame";
import { useLocationState, validateLocationSearch } from "@/lib/location-context";
import {
  aqiBand,
  formatHour,
  formatSpeed,
  placeLabel,
  pollutantBand,
  uvBand,
  windDirectionLabel,
} from "@/lib/weather";

export const Route = createFileRoute("/air-quality")({
  validateSearch: validateLocationSearch,
  head: () => ({
    meta: [
      { title: "Air Quality & Pollen — Dawncast" },
      {
        name: "description",
        content:
          "Live air quality index, PM2.5, PM10, ozone and nitrogen dioxide levels with plain-language health guidance.",
      },
      { property: "og:title", content: "Air Quality & Pollen — Dawncast" },
      {
        property: "og:description",
        content: "Live AQI, particulates and ozone with health guidance for your location.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/air-quality" }],
  }),
  component: AirQualityPage,
});

const POLLUTANTS = [
  { key: "pm2_5", label: "PM2.5", unit: "µg/m³" },
  { key: "pm10", label: "PM10", unit: "µg/m³" },
  { key: "ozone", label: "Ozone", unit: "µg/m³" },
  { key: "no2", label: "Nitrogen dioxide", unit: "µg/m³" },
  { key: "so2", label: "Sulphur dioxide", unit: "µg/m³" },
] as const;

function AirQualityPage() {
  const { units, place } = useLocationState();

  return (
    <PageFrame>
      {({ forecast, air }) => (
        <>
          <header className="pt-8">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent">
              {placeLabel(place)}
            </p>
            <h1 className="mt-2 text-4xl sm:text-5xl">Air quality</h1>
            <p className="mt-3 max-w-xl text-foreground/85">
              European air quality index with the pollutants behind the number, plus how much sun
              exposure to expect today.
            </p>
          </header>

          {!air ? (
            <div className="glass mt-9 rounded-3xl p-8 text-center text-sm text-muted-foreground">
              Air quality readings aren't available for this location right now.
            </div>
          ) : (
            <>
              <section className="glass mt-9 flex flex-col items-center gap-8 rounded-3xl p-7 sm:flex-row sm:p-9">
                <AqiDial aqi={air.current.aqi} size={172} />
                <div className="text-center sm:text-left">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent">
                    {aqiBand(air.current.aqi).label}
                  </p>
                  <p className="mt-2 text-xl">{aqiBand(air.current.aqi).advice}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Measured {formatHour(air.current.time)} local time.
                  </p>
                </div>
              </section>

              <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricTile
                  icon={Sun}
                  label="UV index"
                  value={`${Math.round(forecast.daily[0]!.uvIndexMax)}`}
                  note={uvBand(forecast.daily[0]!.uvIndexMax).label}
                />
                <MetricTile
                  icon={Wind}
                  label="Wind"
                  value={formatSpeed(forecast.current.windSpeed, units)}
                  note={`From ${windDirectionLabel(forecast.current.windDirection)} — disperses pollutants`}
                />
                <MetricTile
                  icon={Leaf}
                  label="Grass pollen"
                  value={
                    air.current.pollenGrass === null
                      ? "—"
                      : `${Math.round(air.current.pollenGrass)}`
                  }
                  note={air.current.pollenGrass === null ? "Not reported here" : "grains/m³"}
                />
                <MetricTile
                  icon={Wind}
                  label="Carbon monoxide"
                  value={`${Math.round(air.current.co)}`}
                  note="µg/m³"
                />
              </section>

              <section className="mt-12">
                <SectionHeading eyebrow="Breakdown" title="Pollutants" />
                <div className="glass divide-y divide-border rounded-3xl">
                  {POLLUTANTS.map((p) => {
                    const value = air.current[p.key];
                    const band = pollutantBand(p.key, value);
                    return (
                      <div
                        key={p.key}
                        className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7"
                      >
                        <div>
                          <p className="text-sm text-foreground/90">{p.label}</p>
                          <p className="text-xs text-muted-foreground">{band.label}</p>
                        </div>
                        <p className="tabular font-display text-2xl">
                          {Math.round(value)}
                          <span className="ml-1 text-xs text-muted-foreground">{p.unit}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {air.hourly.length > 0 && (
                <section className="mt-12">
                  <SectionHeading eyebrow="Next hours" title="AQI trend" />
                  <div className="glass overflow-x-auto rounded-3xl p-5 no-scrollbar">
                    <div className="flex items-end gap-3">
                      {air.hourly.slice(0, 24).map((h) => (
                        <div
                          key={h.time}
                          className="flex w-12 shrink-0 flex-col items-center gap-2"
                        >
                          <p className="tabular text-xs text-foreground/85">{Math.round(h.aqi)}</p>
                          <div
                            className="w-2.5 rounded-full bg-accent"
                            style={{ height: `${Math.max(6, Math.min(1, h.aqi / 120) * 110)}px` }}
                          />
                          <p className="tabular text-[10px] text-muted-foreground">
                            {formatHour(h.time)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </PageFrame>
  );
}
