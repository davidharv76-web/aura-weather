import { Activity, Bone, Brain, Flower2, ShieldCheck, Sun } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { AirQuality, Forecast } from "@/lib/weather";

type Risk = { label: string; score: number; detail: string; tone: string };

export function HealthInsights({ forecast, air }: { forecast: Forecast; air: AirQuality | null }) {
  const uv = uvProtection(forecast.current.uvIndex);
  const migraine = migraineRisk(forecast);
  const arthritis = arthritisRisk(forecast);
  const pollen = pollenRisks(air);

  return (
    <section className="mt-14" aria-labelledby="health-insights-title">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Health & allergies</p>
        <h2 id="health-insights-title" className="mt-1 text-2xl sm:text-[1.7rem]">
          Personal comfort outlook
        </h2>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <article className="glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-2xl bg-gold/12 p-3 text-gold">
              <Sun className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-gold">
              UV {Math.round(forecast.current.uvIndex)}
            </span>
          </div>
          <h3 className="mt-5 text-xl">Sun protection</h3>
          <p className="mt-2 text-3xl font-display">
            {uv.minutes === null ? "Low risk" : `${uv.minutes} min`}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{uv.detail}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-foreground/80">
            <ShieldCheck className="h-4 w-4 text-accent" /> Based on fair, unprotected skin
          </div>
        </article>

        <RiskCard icon={Brain} title="Migraine sensitivity" risk={migraine} />
        <RiskCard icon={Bone} title="Joint discomfort" risk={arthritis} />
      </div>

      <div className="glass mt-3 rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-cream/10 p-3 text-accent">
            <Flower2 className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl">Pollen breakdown</h3>
            <p className="text-sm text-muted-foreground">
              Live grains per cubic metre where reporting is available
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {pollen.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-cream/[0.04] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground/80">{item.label}</p>
                <span className={`text-xs font-semibold ${item.tone}`}>{item.risk}</span>
              </div>
              <p className="tabular mt-2 font-display text-2xl">
                {item.value === null ? "—" : Math.round(item.value)}
                {item.value !== null && (
                  <span className="ml-1 text-xs text-muted-foreground">grains/m³</span>
                )}
              </p>
              <Progress value={item.progress} className="mt-4 bg-secondary [&>div]:bg-accent" />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Sensitivity scores use current pressure, humidity, temperature and wind. They are wellness
        guidance, not medical advice.
      </p>
    </section>
  );
}

function RiskCard({ icon: Icon, title, risk }: { icon: typeof Brain; title: string; risk: Risk }) {
  return (
    <article className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-2xl bg-cream/10 p-3 text-accent">
          <Icon className="h-5 w-5" />
        </span>
        <span className={`text-sm font-semibold ${risk.tone}`}>{risk.label}</span>
      </div>
      <h3 className="mt-5 text-xl">{title}</h3>
      <Progress value={risk.score} className="mt-4 bg-secondary [&>div]:bg-accent" />
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{risk.detail}</p>
    </article>
  );
}

function uvProtection(uv: number) {
  if (uv < 3)
    return {
      minutes: null,
      detail:
        "Protection is generally optional for short exposure, though sensitive skin may still need sunscreen.",
    };
  const minutes = Math.max(10, Math.round(200 / Math.max(1, uv) / 5) * 5);
  return {
    minutes,
    detail: `Apply broad-spectrum SPF 30+ now and seek shade around ${minutes} minutes of direct exposure.`,
  };
}

function migraineRisk(forecast: Forecast): Risk {
  const current = forecast.current;
  const later = forecast.hourly[Math.min(6, forecast.hourly.length - 1)];
  const temperatureSwing = later ? Math.abs(later.temperature - current.temperature) : 0;
  let score = Math.min(
    100,
    Math.abs(1013 - current.pressure) * 2.1 +
      current.humidity * 0.24 +
      temperatureSwing * 4 +
      current.windGusts * 0.18,
  );
  if (current.weatherCode >= 95) score += 18;
  return riskFromScore(
    score,
    "Pressure, humidity and the next six-hour temperature swing are the main weather-related signals.",
  );
}

function arthritisRisk(forecast: Forecast): Risk {
  const current = forecast.current;
  let score =
    Math.max(0, 18 - current.apparentTemperature) * 2 +
    current.humidity * 0.36 +
    Math.abs(1013 - current.pressure) * 1.2;
  if (current.precipitation > 0) score += 15;
  return riskFromScore(
    score,
    "Cool apparent temperatures, damp air and lower pressure can increase discomfort for weather-sensitive joints.",
  );
}

function riskFromScore(raw: number, detail: string): Risk {
  const score = Math.round(Math.max(0, Math.min(100, raw)));
  if (score >= 70) return { label: "High", score, detail, tone: "text-coral" };
  if (score >= 40) return { label: "Moderate", score, detail, tone: "text-gold" };
  return { label: "Low", score, detail, tone: "text-aqi-good" };
}

function pollenRisks(air: AirQuality | null) {
  return [
    pollenItem("Tree pollen", air?.current.pollenTree ?? null, 90),
    pollenItem("Grass pollen", air?.current.pollenGrass ?? null, 50),
    pollenItem("Weed pollen", air?.current.pollenWeed ?? null, 50),
  ];
}

function pollenItem(label: string, value: number | null, highThreshold: number) {
  if (value === null)
    return { label, value, risk: "Not reported", progress: 0, tone: "text-muted-foreground" };
  const moderate = highThreshold * 0.2;
  const risk = value >= highThreshold ? "High" : value >= moderate ? "Moderate" : "Low";
  return {
    label,
    value,
    risk,
    progress: Math.min(100, (value / highThreshold) * 100),
    tone: risk === "High" ? "text-coral" : risk === "Moderate" ? "text-gold" : "text-aqi-good",
  };
}
