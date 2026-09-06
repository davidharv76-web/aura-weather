import { Moon, Sparkles, Sun } from "lucide-react";

import type { Forecast } from "@/lib/weather";
import { formatClock } from "@/lib/weather";

type SolarWindows = {
  morningBlueStart: number | null;
  morningBlueEnd: number | null;
  morningGoldenStart: number | null;
  morningGoldenEnd: number | null;
  eveningGoldenStart: number | null;
  eveningGoldenEnd: number | null;
  eveningBlueStart: number | null;
  eveningBlueEnd: number | null;
};

export function CelestialTracker({ forecast }: { forecast: Forecast }) {
  const today = forecast.daily[0];
  if (!today) return null;

  const sunrise = minutesFromIso(today.sunrise);
  const sunset = minutesFromIso(today.sunset);
  const current = minutesFromIso(forecast.current.time);
  const rawProgress = (current - sunrise) / Math.max(1, sunset - sunrise);
  const progress = Math.max(0, Math.min(1, rawProgress));
  const solarWindows = calculateSolarWindows(
    today.date,
    forecast.latitude,
    forecast.longitude,
    forecast.utcOffsetSeconds,
  );
  const moon = calculateMoonPhase(today.date);

  const width = 320;
  const height = 124;
  const radius = 126;
  const centerX = width / 2;
  const centerY = height + 6;
  const angle = Math.PI * (1 - progress);
  const sunX = centerX + Math.cos(angle) * radius;
  const sunY = centerY - Math.sin(angle) * radius;
  const arcLength = Math.PI * radius;
  const dayLength = Math.max(0, sunset - sunrise);

  return (
    <section className="glass rounded-3xl p-5" aria-labelledby="celestial-tracker-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Sky clock</p>
          <h2 id="celestial-tracker-title" className="mt-1 text-xl">
            Sun &amp; moon
          </h2>
        </div>
        <Sun className="h-5 w-5 text-gold" aria-hidden="true" />
      </div>

      <div className="mt-2 flex flex-col items-center">
        <svg
          viewBox={`0 0 ${width} ${height + 12}`}
          className="w-full max-w-[320px]"
          role="img"
          aria-label={`The sun is ${Math.round(progress * 100)} percent through today's daylight arc`}
        >
          <defs>
            <linearGradient id="celestial-arc-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.65" />
              <stop offset="50%" stopColor="var(--gold)" />
              <stop offset="100%" stopColor="var(--coral)" stopOpacity="0.65" />
            </linearGradient>
          </defs>
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke="var(--cream)"
            strokeDasharray="3 6"
            strokeOpacity={0.18}
            strokeWidth={2}
          />
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke="url(#celestial-arc-gradient)"
            strokeDasharray={arcLength}
            strokeDashoffset={arcLength * (1 - progress)}
            strokeLinecap="round"
            strokeWidth={3}
            style={{ transition: "stroke-dashoffset 900ms ease" }}
          />
          {rawProgress >= 0 && rawProgress <= 1 && (
            <g className="animate-pulse">
              <circle cx={sunX} cy={sunY} r={15} fill="var(--gold)" opacity={0.2} />
              <circle cx={sunX} cy={sunY} r={7} fill="var(--gold)" />
            </g>
          )}
        </svg>

        <div className="-mt-1 flex w-full items-start justify-between text-xs">
          <TimeLabel label="Sunrise" value={formatClock(today.sunrise)} />
          <p className="pt-4 text-center text-muted-foreground">
            {Math.floor(dayLength / 60)}h {dayLength % 60}m daylight
          </p>
          <TimeLabel label="Sunset" value={formatClock(today.sunset)} align="right" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <LightWindow
          icon={Sun}
          label="Golden hour"
          morning={formatWindow(solarWindows.morningGoldenStart, solarWindows.morningGoldenEnd)}
          evening={formatWindow(solarWindows.eveningGoldenStart, solarWindows.eveningGoldenEnd)}
          tone="gold"
        />
        <LightWindow
          icon={Sparkles}
          label="Blue hour"
          morning={formatWindow(solarWindows.morningBlueStart, solarWindows.morningBlueEnd)}
          evening={formatWindow(solarWindows.eveningBlueStart, solarWindows.eveningBlueEnd)}
          tone="blue"
        />
      </div>

      <div className="mt-3 flex items-center gap-4 rounded-2xl border border-border bg-cream/[0.04] p-3.5">
        <MoonPhaseVisual phase={moon.phase} label={moon.label} />
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Moon className="h-4 w-4 text-accent" aria-hidden="true" />
            {moon.label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round(moon.illumination)}% illuminated · {moon.age.toFixed(1)} days old
          </p>
        </div>
      </div>
    </section>
  );
}

function TimeLabel({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <p className="text-muted-foreground">{label}</p>
      <p className="tabular mt-0.5 font-semibold">{value}</p>
    </div>
  );
}

function LightWindow({
  icon: Icon,
  label,
  morning,
  evening,
  tone,
}: {
  icon: typeof Sun;
  label: string;
  morning: string;
  evening: string;
  tone: "gold" | "blue";
}) {
  return (
    <div className="rounded-2xl border border-border bg-cream/[0.04] p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold">
        <Icon className={tone === "gold" ? "h-3.5 w-3.5 text-gold" : "h-3.5 w-3.5 text-sky-300"} />
        {label}
      </p>
      <p className="tabular mt-2 text-[11px] text-foreground/80">Morning {morning}</p>
      <p className="tabular mt-1 text-[11px] text-foreground/80">Evening {evening}</p>
    </div>
  );
}

function MoonPhaseVisual({ phase, label }: { phase: number; label: string }) {
  const shadowX = phase <= 0.5 ? 32 - (phase / 0.5) * 66 : 98 - ((phase - 0.5) / 0.5) * 66;

  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0" role="img" aria-label={label}>
      <defs>
        <clipPath id="moon-disc-clip">
          <circle cx="32" cy="32" r="27" />
        </clipPath>
        <radialGradient id="moon-glow" cx="35%" cy="30%">
          <stop offset="0%" stopColor="var(--cream)" />
          <stop offset="100%" stopColor="var(--gold)" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="var(--gold)" opacity={0.12} />
      <circle cx="32" cy="32" r="27" fill="url(#moon-glow)" />
      <circle
        cx={shadowX}
        cy="32"
        r="27"
        fill="var(--night)"
        opacity={0.94}
        clipPath="url(#moon-disc-clip)"
      />
    </svg>
  );
}

function calculateSolarWindows(
  date: string,
  latitude: number,
  longitude: number,
  utcOffsetSeconds: number,
): SolarWindows {
  return {
    morningBlueStart: solarEvent(date, latitude, longitude, -6, true, utcOffsetSeconds),
    morningBlueEnd: solarEvent(date, latitude, longitude, -4, true, utcOffsetSeconds),
    morningGoldenStart: solarEvent(date, latitude, longitude, -4, true, utcOffsetSeconds),
    morningGoldenEnd: solarEvent(date, latitude, longitude, 6, true, utcOffsetSeconds),
    eveningGoldenStart: solarEvent(date, latitude, longitude, 6, false, utcOffsetSeconds),
    eveningGoldenEnd: solarEvent(date, latitude, longitude, -4, false, utcOffsetSeconds),
    eveningBlueStart: solarEvent(date, latitude, longitude, -4, false, utcOffsetSeconds),
    eveningBlueEnd: solarEvent(date, latitude, longitude, -6, false, utcOffsetSeconds),
  };
}

function solarEvent(
  date: string,
  latitude: number,
  longitude: number,
  altitude: number,
  morning: boolean,
  utcOffsetSeconds: number,
): number | null {
  const [year = 2000, month = 1, day = 1] = date.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 0);
  const dayOfYear = Math.floor((target - start) / 86_400_000);
  const longitudeHour = longitude / 15;
  const approximateTime = dayOfYear + ((morning ? 6 : 18) - longitudeHour) / 24;
  const meanAnomaly = 0.9856 * approximateTime - 3.289;
  const trueLongitude = normalizeDegrees(
    meanAnomaly +
      1.916 * Math.sin(toRadians(meanAnomaly)) +
      0.02 * Math.sin(toRadians(2 * meanAnomaly)) +
      282.634,
  );
  let rightAscension = normalizeDegrees(
    toDegrees(Math.atan(0.91764 * Math.tan(toRadians(trueLongitude)))),
  );
  rightAscension += Math.floor(trueLongitude / 90) * 90 - Math.floor(rightAscension / 90) * 90;
  rightAscension /= 15;

  const sinDeclination = 0.39782 * Math.sin(toRadians(trueLongitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const zenith = 90 - altitude;
  const cosineHour =
    (Math.cos(toRadians(zenith)) - sinDeclination * Math.sin(toRadians(latitude))) /
    (cosDeclination * Math.cos(toRadians(latitude)));
  if (cosineHour < -1 || cosineHour > 1) return null;

  const hourAngle =
    (morning ? 360 - toDegrees(Math.acos(cosineHour)) : toDegrees(Math.acos(cosineHour))) / 15;
  const localMeanTime = hourAngle + rightAscension - 0.06571 * approximateTime - 6.622;
  const utcHour = normalizeHours(localMeanTime - longitudeHour);
  return normalizeMinutes(utcHour * 60 + utcOffsetSeconds / 60);
}

function calculateMoonPhase(date: string) {
  const dateAtNoon = Date.parse(`${date}T12:00:00Z`);
  const knownNewMoon = Date.parse("2000-01-06T18:14:00Z");
  const synodicMonth = 29.53058867;
  const daysSinceNewMoon = (dateAtNoon - knownNewMoon) / 86_400_000;
  const phase = (((daysSinceNewMoon / synodicMonth) % 1) + 1) % 1;
  const illumination = ((1 - Math.cos(phase * Math.PI * 2)) / 2) * 100;
  const labels = [
    "New moon",
    "Waxing crescent",
    "First quarter",
    "Waxing gibbous",
    "Full moon",
    "Waning gibbous",
    "Last quarter",
    "Waning crescent",
  ];
  const label = labels[Math.round(phase * 8) % 8] ?? "New moon";

  return { phase, illumination, age: phase * synodicMonth, label };
}

function minutesFromIso(iso: string) {
  return Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));
}

function formatWindow(start: number | null, end: number | null) {
  if (start === null || end === null) return "Not occurring";
  return `${formatMinuteClock(start)}–${formatMinuteClock(end)}`;
}

function formatMinuteClock(totalMinutes: number) {
  const roundedMinutes = Math.round(totalMinutes);
  const hour = Math.floor(roundedMinutes / 60) % 24;
  const minute = roundedMinutes % 60;
  const suffix = hour < 12 ? "AM" : "PM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function normalizeHours(value: number) {
  return ((value % 24) + 24) % 24;
}

function normalizeMinutes(value: number) {
  return ((value % 1_440) + 1_440) % 1_440;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}
