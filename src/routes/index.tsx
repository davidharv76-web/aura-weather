import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CloudRain,
  Compass,
  Droplets,
  Eye,
  Gauge,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { ActivityInsights } from "@/components/weather/ActivityInsights";
import { AirQualityCard } from "@/components/weather/AirQualityCard";
import { CelestialTracker } from "@/components/weather/CelestialTracker";
import { HealthInsights } from "@/components/weather/HealthInsights";
import { MetricTile, SectionHeading } from "@/components/weather/MetricTile";
import { MinuteCast } from "@/components/weather/MinuteCast";
import { PageFrame } from "@/components/weather/PageFrame";
import { SevereAlerts } from "@/components/weather/SevereAlerts";
import { WeatherGlyph } from "@/components/weather/WeatherGlyph";
import { WeatherNotifications } from "@/components/weather/WeatherNotifications";
import { useLocationState, validateLocationSearch } from "@/lib/location-context";
import {
  dayParts,
  describeCode,
  formatDistance,
  formatHour,
  formatLength,
  formatPressure,
  formatSpeed,
  formatTemp,
  placeLabel,
  uvBand,
  windDirectionLabel,
} from "@/lib/weather";

export const Route = createFileRoute("/")({
  validateSearch: validateLocationSearch,
  head: () => ({
    meta: [
      { title: "Dawncast — Premium Weather Forecasts, Hour by Hour" },
      {
        name: "description",
        content:
          "Current conditions, 72-hour hourly detail, 14-day outlook, UV and air quality for any city — in a calm, beautifully readable forecast.",
      },
      { property: "og:title", content: "Dawncast — Premium Weather Forecasts" },
      {
        property: "og:description",
        content:
          "Live conditions, hourly detail, 14-day outlook and air quality for any city on earth.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { units, place } = useLocationState();
  const search = useSearch({ strict: false });

  return (
    <PageFrame>
      {({ forecast, air }) => {
        // Safe check if current data is present
        const c = forecast?.current ?? {
          time: new Date().toISOString(),
          temperature: 20,
          apparentTemperature: 20,
          weatherCode: 0,
          isDay: true,
          humidity: 50,
          windSpeed: 10,
          windGusts: 12,
          windDirection: 180,
          uvIndex: 5,
          dewPoint: 10,
          pressure: 1013,
          visibility: 10000,
          cloudCover: 20,
        };

        const info = describeCode(c.weatherCode ?? 0);
        const today = forecast?.daily?.[0] ?? {
          date: new Date().toISOString(),
          tempMin: c.temperature,
          tempMax: c.temperature,
          precipitationProbabilityMax: 0,
          precipitationSum: 0,
          windGustsMax: c.windGusts ?? 0,
        };

        const nowIndex = Math.max(
          0,
          (forecast?.hourly ?? []).findIndex(
            (h: any) => h.time.slice(0, 13) === c.time.slice(0, 13)
          )
        );
        const next24 = (forecast?.hourly ?? []).slice(nowIndex, nowIndex + 24);
        const week = (forecast?.daily ?? []).slice(0, 7);
        const weekMin = week.length ? Math.min(...week.map((d: any) => d.tempMin)) : 0;
        const weekMax = week.length ? Math.max(...week.map((d: any) => d.tempMax)) : 100;
        const uv = uvBand(c.uvIndex ?? 0);

        return (
          <>
            {forecast && <SevereAlerts forecast={forecast} units={units} />}
            {forecast && <WeatherNotifications forecast={forecast} place={place} units={units} />}
            <section className="glass-strong relative overflow-hidden rounded-4xl px-6 py-10 sm:px-12 sm:py-14">
              <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-accent">
                    {dayParts(today.date).weekday} · {formatHour(c.time)} local
                  </p>
                  <h1 className="mt-3 text-3xl sm:text-4xl">{placeLabel(place)}</h1>
                  <div className="mt-6 flex items-start gap-6">
                    <p className="tabular text-gradient-dawn font-display text-[5.5rem] leading-[0.85] sm:text-[7rem]">
                      {formatTemp(c.temperature, units)}
                    </p>
                    <div className="pt-3">
                      <WeatherGlyph group={info.group} isDay={c.isDay} className="h-16 w-16 text-cream" />
                    </div>
                  </div>
                  <p className="mt-4 max-w-md text-lg text-foreground/90">
                    {info.label}. Feels like {formatTemp(c.apparentTemperature, units, true)}, with a high of {formatTemp(today.tempMax, units)} and a low of{" "}
                    {formatTemp(today.tempMin, units)}.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2 text-sm">
                    <Chip>
                      {Math.round(today.precipitationProbabilityMax ?? 0)}% chance of precipitation
                    </Chip>
                    <Chip>
                      UV {Math.round(c.uvIndex ?? 0)} · {uv.label}
                    </Chip>
                    <Chip>
                      Wind {formatSpeed(c.windSpeed ?? 0, units)} {windDirectionLabel(c.windDirection ?? 0)}
                    </Chip>
                  </div>
                </div>
                <div className="w-full max-w-sm shrink-0 space-y-6 lg:w-[22rem]">
                  {forecast && <CelestialTracker forecast={forecast} />}
                  <div className="glass rounded-3xl p-5">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
                      Sun protection
                    </p>
                    <p className="mt-2 text-sm text-foreground/90">{uv.advice}</p>
                  </div>
                </div>
              </div>
            </section>
            {forecast && <MinuteCast forecast={forecast} units={units} />}
            <section className="mt-14">
              <SectionHeading
                eyebrow="Next 24 hours"
                title="Hour by hour"
                right={
                  <Link
                    to="/hourly"
                    search={search}
                    className="flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    72-hour detail
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                }
              />
              <div className="glass overflow-hidden rounded-3xl">
                <div className="flex gap-1 overflow-x-auto p-3 no-scrollbar">
                  {next24.map((h: any, i: number) => {
                    const g = describeCode(h.weatherCode);
                    return (
                      <div
                        key={h.time}
                        className="flex min-w-[86px] flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center transition-colors hover:bg-secondary"
                      >
                        <p className="text-xs text-muted-foreground">
                          {i === 0 ? "Now" : formatHour(h.time)}
                        </p>
                        <WeatherGlyph group={g.group} isDay={h.isDay} className="h-8 w-8 text-cream" />
                        <p className="tabular font-display text-xl">
                          {formatTemp(h.temperature, units)}
                        </p>
                        <p className="tabular text-[11px] text-accent">
                          {h.precipitationProbability > 0 ? `${Math.round(h.precipitationProbability)}%` : "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            <section className="mt-14">
              <SectionHeading eyebrow="Today's detail" title="Conditions in full" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <MetricTile icon={Thermometer} label="Feels like" value={formatTemp(c.apparentTemperature, units, true)} note={`Dew point ${formatTemp(c.dewPoint ?? 0, units, true)}`} />
                <MetricTile icon={Wind} label="Wind" value={formatSpeed(c.windSpeed ?? 0, units)} note={`Gusts ${formatSpeed(c.windGusts ?? 0, units)} · ${windDirectionLabel(c.windDirection ?? 0)}`} />
                <MetricTile icon={Droplets} label="Humidity" value={`${Math.round(c.humidity ?? 0)}%`} note={`Cloud cover ${Math.round(c.cloudCover ?? 0)}%`} />
                <MetricTile icon={Gauge} label="Pressure" value={formatPressure(c.pressure ?? 1013, units)} />
                <MetricTile icon={Eye} label="Visibility" value={formatDistance(c.visibility ?? 10000, units)} />
                <MetricTile icon={CloudRain} label="Precipitation" value={formatLength(today.precipitationSum ?? 0, units)} note="Total expected today" />
                <MetricTile icon={Sun} label="UV index" value={`${Math.round(c.uvIndex ?? 0)}`} note={uv.label} />
                <MetricTile icon={Compass} label="Max gusts today" value={formatSpeed(today.windGustsMax ?? 0, units)} />
              </div>
            </section>
            {forecast && <ActivityInsights forecast={forecast} air={air} />}
            {forecast && <HealthInsights forecast={forecast} air={air} />}
            {air && <AirQualityCard air={air} />}
            <section className="mt-14">
              <SectionHeading
                eyebrow="Week ahead"
                title="Seven-day outlook"
                right={
                  <Link
                    to="/daily"
                    search={search}
                    className="flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    All 14 days
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                }
              />
              <div className="glass divide-y divide-border rounded-3xl">
                {week.map((d: any, i: number) => {
                  const g = describeCode(d.weatherCode);
                  const left = ((d.tempMin - weekMin) / Math.max(1, weekMax - weekMin)) * 100;
                  const width = ((d.tempMax - d.tempMin) / Math.max(1, weekMax - weekMin)) * 100;
                  const parts = dayParts(d.date);
                  return (
                    <div key={d.date} className="flex items-center gap-4 px-5 py-4 sm:px-7">
                      <div className="w-24 shrink-0">
                        <p className="font-semibold">{i === 0 ? "Today" : parts.weekdayShort}</p>
                        <p className="text-xs text-muted-foreground">
                          {parts.month} {parts.day}
                        </p>
                      </div>
                      <WeatherGlyph group={g.group} className="h-8 w-8 shrink-0 text-cream" />
                      <p className="hidden flex-1 text-sm text-foreground/85 md:block">{g.label}</p>
                      <p className="tabular hidden w-16 text-sm text-accent sm:block">
                        {Math.round(d.precipitationProbabilityMax ?? 0)}%
                      </p>
                      <p className="tabular w-10 text-right text-muted-foreground">
                        {formatTemp(d.tempMin, units)}
                      </p>
                      <div className="relative h-1.5 w-24 shrink-0 rounded-full bg-secondary sm:w-40">
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
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        );
      }}
    </PageFrame>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="glass rounded-full px-3.5 py-1.5 text-sm text-foreground/90">
      {children}
    </span>
  );
}
