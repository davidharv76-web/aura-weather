import { Car, Footprints, Sparkles, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AirQuality, Forecast } from "@/lib/weather";
import { describeCode } from "@/lib/weather";

type ActivityScore = {
  id: string;
  label: string;
  score: number;
  summary: string;
  factors: string[];
  icon: LucideIcon;
};

export function ActivityInsights({
  forecast,
  air,
}: {
  forecast: Forecast;
  air: AirQuality | null;
}) {
  const activities = calculateActivities(forecast, air);

  return (
    <section className="mt-14" aria-labelledby="activity-insights-title">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Right now</p>
        <h2 id="activity-insights-title" className="mt-1 text-2xl sm:text-[1.7rem]">
          Activity outlook
        </h2>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Scores combine current temperature, precipitation, wind, visibility, cloud, UV and available
        air-quality readings. They are practical guidance, not official safety advice.
      </p>
    </section>
  );
}

function ActivityCard({ activity }: { activity: ActivityScore }) {
  const Icon = activity.icon;
  const tone = scoreTone(activity.score);
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className="glass rounded-3xl p-5 sm:p-6"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      whileHover={reduceMotion ? {} : { y: -3 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-2xl bg-cream/10 p-3 text-accent">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="text-right">
          <p className="tabular font-display text-4xl leading-none">{activity.score}</p>
          <p className="mt-1 text-xs text-muted-foreground">out of 100</p>
        </div>
      </div>

      <h3 className="mt-5 text-xl">{activity.label}</h3>
      <p className="mt-1 text-sm font-semibold" style={{ color: tone.color }}>
        {tone.label}
      </p>
      <Progress
        className={cn("mt-4 bg-secondary", tone.progressClass)}
        value={activity.score}
        aria-label={`${activity.label} suitability`}
      />
      <p className="mt-4 text-sm leading-6 text-foreground/90">{activity.summary}</p>
      <ul className="mt-3 space-y-1.5 text-xs leading-5 text-muted-foreground">
        {activity.factors.slice(0, 2).map((factor) => (
          <li key={factor} className="flex gap-2">
            <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-accent" />
            {factor}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

function calculateActivities(forecast: Forecast, air: AirQuality | null): ActivityScore[] {
  const current = forecast.current;
  const group = describeCode(current.weatherCode).group;
  const hour = forecast.hourly.find((item) => item.time.slice(0, 13) === current.time.slice(0, 13));
  const precipitationChance = hour?.precipitationProbability ?? 0;

  let running = 100;
  running -= Math.min(42, Math.abs(current.apparentTemperature - 16) * 2.2);
  running -= Math.min(28, precipitationChance * 0.28 + current.precipitation * 4);
  running -= Math.max(0, current.windSpeed - 18) * 0.8;
  running -= Math.max(0, current.uvIndex - 5) * 3;
  running -= Math.max(0, current.humidity - 78) * 0.35;
  if (air) running -= Math.max(0, air.current.aqi - 35) * 0.35;
  if (group === "storm" || group === "snow") running -= 35;

  const runningFactors = [
    temperatureFactor(current.apparentTemperature),
    precipitationChance >= 35
      ? `${Math.round(precipitationChance)}% chance of precipitation reduces comfort.`
      : "Little immediate precipitation risk.",
    air && air.current.aqi > 40
      ? `Air quality is a limiting factor at AQI ${Math.round(air.current.aqi)}.`
      : "Air quality is not a major constraint.",
  ];

  let stargazing = 100;
  stargazing -= current.cloudCover * 0.82;
  stargazing -= precipitationChance * 0.25;
  stargazing -= Math.max(0, current.humidity - 65) * 0.35;
  if (current.visibility < 10_000) stargazing -= (10_000 - current.visibility) / 250;
  if (current.isDay) stargazing -= 72;
  if (group === "fog" || group === "rain" || group === "storm" || group === "snow") {
    stargazing -= 25;
  }

  const stargazingFactors = [
    current.isDay
      ? "Daylight is the main limitation right now."
      : "It is currently dark enough to observe.",
    `${Math.round(current.cloudCover)}% cloud cover ${
      current.cloudCover <= 25 ? "leaves much of the sky open." : "will obscure parts of the sky."
    }`,
  ];

  let driving = 100;
  if (current.visibility < 10_000) driving -= ((10_000 - current.visibility) / 10_000) * 55;
  driving -= Math.min(25, precipitationChance * 0.16 + current.precipitation * 3);
  driving -= Math.max(0, current.windGusts - 45) * 0.7;
  if (group === "storm") driving -= 35;
  if (group === "snow") driving -= 30;
  if (group === "fog") driving -= 25;

  const drivingFactors = [
    current.visibility >= 10_000
      ? "Visibility is good for normal driving."
      : "Reduced visibility requires more stopping distance.",
    current.windGusts >= 45
      ? "Strong gusts can affect exposed roads and high-sided vehicles."
      : "Wind is not significantly affecting vehicle control.",
  ];

  return [
    buildScore("running", "Outdoor running", running, runningFactors, Footprints),
    buildScore("stargazing", "Stargazing", stargazing, stargazingFactors, Sparkles),
    buildScore("driving", "Driving safety", driving, drivingFactors, Car),
  ];
}

function buildScore(
  id: string,
  label: string,
  rawScore: number,
  factors: string[],
  icon: LucideIcon,
): ActivityScore {
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));
  const summary =
    score >= 80
      ? "Conditions are strongly favourable."
      : score >= 60
        ? "Generally suitable, with minor compromises."
        : score >= 40
          ? "Possible, but use extra care and adjust your plans."
          : "Conditions are unfavourable right now.";
  return { id, label, score, summary, factors, icon };
}

function temperatureFactor(apparentTemperature: number) {
  if (apparentTemperature < 0) return "Cold exposure will make a longer run uncomfortable.";
  if (apparentTemperature > 30) return "Heat stress is the main concern for strenuous exercise.";
  if (apparentTemperature >= 10 && apparentTemperature <= 22) {
    return "The apparent temperature is comfortable for exercise.";
  }
  return "The apparent temperature is manageable with suitable clothing and pacing.";
}

function scoreTone(score: number) {
  if (score >= 80) {
    return {
      label: "Excellent",
      color: "var(--aqi-good)",
      progressClass: "[&>div]:bg-aqi-good",
    };
  }
  if (score >= 60) {
    return {
      label: "Good",
      color: "var(--gold)",
      progressClass: "[&>div]:bg-gold",
    };
  }
  if (score >= 40) {
    return {
      label: "Use caution",
      color: "var(--aqi-poor)",
      progressClass: "[&>div]:bg-aqi-poor",
    };
  }
  return {
    label: "Poor",
    color: "var(--coral)",
    progressClass: "[&>div]:bg-coral",
  };
}
