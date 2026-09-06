import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, Droplets, Gauge, Loader2, Thermometer, Waves, Wind } from "lucide-react";
import { useMemo, useState } from "react";

import { SurfMapClient } from "@/components/weather/SurfMapClient";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getMarineForecast } from "@/lib/marine.functions";
import {
  SURF_SPOTS,
  compassDirection,
  formatWaterTemperature,
  formatWaveHeight,
  type MarineHour,
  type SurfSpot,
} from "@/lib/marine";
import { dayParts, formatClock, type Units } from "@/lib/weather";

export function SurfCheck({ units }: { units: Units }) {
  const [selected, setSelected] = useState<SurfSpot>(SURF_SPOTS[2]!);
  const fetchMarine = useServerFn(getMarineForecast);
  const query = useQuery({
    queryKey: ["marine", selected.id, selected.latitude, selected.longitude],
    queryFn: () =>
      fetchMarine({ data: { latitude: selected.latitude, longitude: selected.longitude } }),
    staleTime: 30 * 60 * 1000,
  });

  return (
    <div className="space-y-4">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-3">
          {SURF_SPOTS.map((spot) => (
            <Button
              key={spot.id}
              variant={spot.id === selected.id ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelected(spot)}
            >
              {countryFlag(spot.countryCode)} {spot.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="glass-strong grid overflow-hidden rounded-3xl lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,.75fr)]">
        <div className="h-[24rem] min-h-[20rem] lg:h-[34rem]">
          <SurfMapClient spots={SURF_SPOTS} selected={selected} onSelect={setSelected} />
        </div>
        <aside className="border-t border-border p-5 lg:border-l lg:border-t-0 lg:p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">
            {selected.region} · {selected.country}
          </p>
          <h2 className="mt-2 text-3xl">{selected.name}</h2>
          {query.isPending && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          )}
          {query.isError && (
            <div className="mt-6 rounded-2xl border border-coral/40 bg-coral/10 p-4 text-sm">
              {(query.error as Error).message}
            </div>
          )}
          {query.data && <CurrentMarine hour={query.data.current} units={units} />}
        </aside>
      </div>

      {query.data && <MarineOutlook forecast={query.data} units={units} />}
    </div>
  );
}

function CurrentMarine({ hour, units }: { hour: MarineHour; units: Units }) {
  return (
    <div className="mt-6">
      <p className="text-sm text-muted-foreground">Updated {formatClock(hour.time)}</p>
      <div className="mt-5 flex items-end gap-3">
        <Waves className="mb-2 h-8 w-8 text-accent" />
        <p className="font-display text-6xl leading-none">
          {formatWaveHeight(hour.waveHeight, units)}
        </p>
      </div>
      <p className="mt-2 text-sm text-foreground/85">
        Significant wave height · {hour.wavePeriod.toFixed(1)} s period
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric
          icon={ArrowDown}
          label="Primary swell"
          value={`${formatWaveHeight(hour.swellHeight, units)} · ${hour.swellPeriod.toFixed(1)} s`}
          note={`${compassDirection(hour.swellDirection)} ${Math.round(hour.swellDirection)}°`}
          rotate={hour.swellDirection}
        />
        <Metric
          icon={Wind}
          label="Wind waves"
          value={`${formatWaveHeight(hour.windWaveHeight, units)} · ${hour.windWavePeriod.toFixed(1)} s`}
          note={`${compassDirection(hour.windWaveDirection)} ${Math.round(hour.windWaveDirection)}°`}
        />
        <Metric
          icon={Thermometer}
          label="Water"
          value={formatWaterTemperature(hour.waterTemperature, units)}
        />
        <Metric
          icon={Gauge}
          label="Sea level"
          value={
            hour.seaLevelHeight === null
              ? "Not available"
              : `${hour.seaLevelHeight.toFixed(2)} m MSL`
          }
        />
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
  rotate,
}: {
  icon: typeof Waves;
  label: string;
  value: string;
  note?: string;
  rotate?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-cream/[0.04] p-3">
      <Icon
        className="h-4 w-4 text-accent"
        style={rotate === undefined ? undefined : { transform: `rotate(${rotate}deg)` }}
      />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

function MarineOutlook({
  forecast,
  units,
}: {
  forecast: import("@/lib/marine").MarineForecast;
  units: Units;
}) {
  const next = useMemo(() => {
    const start = Math.max(
      0,
      forecast.hourly.findIndex((hour) => hour.time === forecast.current.time),
    );
    return forecast.hourly.slice(start, start + 48);
  }, [forecast]);
  return (
    <>
      <section className="glass rounded-3xl p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Next 48 hours</p>
            <h2 className="mt-1 text-2xl">Swell and wind-wave timeline</h2>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-gold" />
              Primary swell
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-coral" />
              Wind wave
            </span>
          </div>
        </div>
        <WaveChart hours={next} units={units} />
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {forecast.daily.slice(0, 7).map((day, index) => {
          const parts = dayParts(day.date);
          return (
            <article key={day.date} className="glass rounded-2xl p-4">
              <p className="text-sm font-semibold">{index === 0 ? "Today" : parts.weekday}</p>
              <p className="text-xs text-muted-foreground">
                {parts.month} {parts.day}
              </p>
              <p className="mt-4 font-display text-3xl">
                {formatWaveHeight(day.waveHeightMax, units)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Maximum wave height</p>
              <p className="mt-3 text-sm">
                Swell {formatWaveHeight(day.swellHeightMax, units)} ·{" "}
                {day.swellPeriodMax.toFixed(1)} s
              </p>
            </article>
          );
        })}
      </section>
      <section className="glass rounded-3xl p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-accent" />
          <h2 className="text-2xl">Tide and sea-level trend</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Modelled sea-surface height relative to mean sea level; local harbour tide tables remain
          authoritative.
        </p>
        <SeaLevelChart hours={next} />
      </section>
    </>
  );
}

function WaveChart({ hours, units }: { hours: MarineHour[]; units: Units }) {
  const values = hours.flatMap((hour) => [hour.swellHeight, hour.windWaveHeight]);
  const max = Math.max(1, ...values);
  const points = (key: "swellHeight" | "windWaveHeight") =>
    hours
      .map(
        (hour, index) =>
          `${(index / Math.max(1, hours.length - 1)) * 100},${92 - (hour[key] / max) * 78}`,
      )
      .join(" ");
  return (
    <div className="mt-6 overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-44 w-full"
        role="img"
        aria-label="Primary swell and wind-wave height chart"
      >
        <line x1="0" y1="92" x2="100" y2="92" stroke="currentColor" className="text-border" />
        <polyline
          points={points("swellHeight")}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={points("windWaveHeight")}
          fill="none"
          stroke="var(--coral)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatClock(hours[0]?.time ?? "")}</span>
        <span>Peak {formatWaveHeight(max, units)}</span>
        <span>{formatClock(hours.at(-1)?.time ?? "")}</span>
      </div>
    </div>
  );
}

function SeaLevelChart({ hours }: { hours: MarineHour[] }) {
  const available = hours.filter((hour) => hour.seaLevelHeight !== null);
  if (available.length < 2)
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        Sea-level guidance is not available for this model cell.
      </p>
    );
  const values = available.map((hour) => hour.seaLevelHeight ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.01, max - min);
  const points = available
    .map(
      (hour, index) =>
        `${(index / (available.length - 1)) * 100},${90 - (((hour.seaLevelHeight ?? min) - min) / range) * 76}`,
    )
    .join(" ");
  return (
    <div className="mt-5">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-32 w-full"
        role="img"
        aria-label="Modelled sea-level trend"
      >
        <defs>
          <linearGradient id="sea-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--gold)" stopOpacity=".35" />
            <stop offset="1" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,94 ${points} 100,94`} fill="url(#sea-fill)" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Low {min.toFixed(2)} m</span>
        <span>High {max.toFixed(2)} m</span>
      </div>
    </div>
  );
}

function countryFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
}
