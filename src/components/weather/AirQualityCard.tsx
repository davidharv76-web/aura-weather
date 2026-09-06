import { Link, useSearch } from "@tanstack/react-router";
import { ArrowUpRight, Flower2, Wind } from "lucide-react";

import { AqiDial } from "@/components/weather/AqiDial";
import { Progress } from "@/components/ui/progress";
import type { AirQuality } from "@/lib/weather";
import { aqiBand, pollutantBand } from "@/lib/weather";

type RiskTone = "good" | "moderate" | "elevated" | "unknown";

type Reading = {
  label: string;
  value: number | null;
  unit: string;
  risk: string;
  tone: RiskTone;
  progress: number;
};

export function AirQualityCard({ air }: { air: AirQuality }) {
  const search = useSearch({ strict: false });
  const band = aqiBand(air.current.aqi);
  const readings = buildReadings(air);

  return (
    <section className="mt-14" aria-labelledby="air-quality-card-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Air quality</p>
          <h2 id="air-quality-card-title" className="mt-1 text-2xl sm:text-[1.7rem]">
            What you&apos;re breathing
          </h2>
        </div>
        <Link
          to="/air-quality"
          search={search}
          className="flex items-center gap-1 text-sm text-accent hover:underline"
        >
          Full details <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="glass grid gap-7 rounded-3xl p-6 sm:p-8 lg:grid-cols-[15rem_1fr]">
        <div className="flex flex-col items-center justify-center border-border lg:border-r lg:pr-8">
          <AqiDial aqi={air.current.aqi} size={156} />
          <p className="mt-4 text-center text-sm leading-6 text-foreground/85">{band.advice}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {readings.map((reading) => (
            <PollutantReading key={reading.label} reading={reading} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PollutantReading({ reading }: { reading: Reading }) {
  const Icon = reading.label === "Grass pollen" ? Flower2 : Wind;
  const toneClass = {
    good: "text-aqi-good [&>div]:bg-aqi-good",
    moderate: "text-gold [&>div]:bg-gold",
    elevated: "text-coral [&>div]:bg-coral",
    unknown: "text-muted-foreground [&>div]:bg-muted-foreground",
  }[reading.tone];

  return (
    <article className="rounded-2xl border border-border bg-cream/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm text-foreground/80">
            <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
            {reading.label}
          </p>
          <p className="tabular mt-2 font-display text-2xl">
            {reading.value === null ? "—" : Math.round(reading.value)}
            {reading.value !== null && (
              <span className="ml-1 text-xs text-muted-foreground">{reading.unit}</span>
            )}
          </p>
        </div>
        <span className={`text-xs font-semibold ${toneClass.split(" ")[0]}`}>{reading.risk}</span>
      </div>
      <Progress
        value={reading.progress}
        className={`mt-4 bg-secondary ${toneClass}`}
        aria-label={`${reading.label}: ${reading.risk}`}
      />
    </article>
  );
}

function buildReadings(air: AirQuality): Reading[] {
  const particulate = (
    label: string,
    key: "pm2_5" | "pm10" | "ozone",
    maximum: number,
  ): Reading => {
    const value = air.current[key];
    const risk = pollutantBand(key, value).label;
    return {
      label,
      value,
      unit: "µg/m³",
      risk,
      tone: riskTone(risk),
      progress: Math.min(100, (value / maximum) * 100),
    };
  };

  const pollen = air.current.pollenGrass;
  const pollenRisk =
    pollen === null ? "Not reported" : pollen < 10 ? "Low" : pollen < 50 ? "Moderate" : "High";

  return [
    particulate("PM2.5", "pm2_5", 75),
    particulate("PM10", "pm10", 150),
    particulate("Ozone", "ozone", 240),
    {
      label: "Grass pollen",
      value: pollen,
      unit: "grains/m³",
      risk: pollenRisk,
      tone:
        pollen === null
          ? "unknown"
          : pollenRisk === "Low"
            ? "good"
            : pollenRisk === "Moderate"
              ? "moderate"
              : "elevated",
      progress: pollen === null ? 0 : Math.min(100, pollen),
    },
  ];
}

function riskTone(risk: string): RiskTone {
  if (risk === "Good") return "good";
  if (risk === "Moderate") return "moderate";
  return "elevated";
}
