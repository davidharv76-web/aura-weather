import { Clock3, CloudRain } from "lucide-react";

import type { Forecast, Units } from "@/lib/weather";
import { formatLength } from "@/lib/weather";

export function MinuteCast({ forecast, units }: { forecast: Forecast; units: Units }) {
  const minutes = forecast.minute;
  if (minutes.length === 0) return null;

  const wetMinuteIndex = minutes.findIndex(
    (minute) => minute.precipitation > 0 || minute.precipitationProbability >= 50,
  );
  const peakChance = Math.max(...minutes.map((minute) => minute.precipitationProbability));
  const totalPrecipitation = minutes.reduce((sum, minute) => sum + minute.precipitation / 15, 0);
  const summary = minuteSummary(wetMinuteIndex, peakChance);

  return (
    <section className="mt-14" aria-labelledby="minutecast-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Next 60 minutes</p>
          <h2 id="minutecast-title" className="mt-1 text-2xl sm:text-[1.7rem]">
            MinuteCast
          </h2>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="h-4 w-4 text-accent" aria-hidden="true" />
          Updated with the current forecast
        </p>
      </div>

      <div className="glass rounded-3xl p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">{summary}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Peak likelihood {peakChance}% · About {formatLength(totalPrecipitation, units)}{" "}
              expected
            </p>
          </div>
          <CloudRain className="h-8 w-8 shrink-0 text-accent" aria-hidden="true" />
        </div>

        <div className="mt-7" role="img" aria-label="Minute-by-minute precipitation likelihood">
          <div className="flex h-28 items-end gap-px sm:gap-0.5">
            {minutes.map((minute, index) => (
              <div
                key={minute.time}
                className="group relative flex h-full min-w-[2px] flex-1 items-end"
                title={`${index === 0 ? "Now" : `In ${index} minutes`}: ${minute.precipitationProbability}%`}
              >
                <span
                  className="block w-full rounded-t-sm bg-gradient-to-t from-coral/75 to-gold transition-opacity group-hover:opacity-100"
                  style={{
                    height: `${Math.max(4, minute.precipitationProbability)}%`,
                    opacity: 0.42 + minute.precipitationProbability / 180,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-5 text-xs text-muted-foreground">
            <span>Now</span>
            <span className="text-center">15 min</span>
            <span className="text-center">30 min</span>
            <span className="text-center">45 min</span>
            <span className="text-right">60 min</span>
          </div>
        </div>

        <p className="mt-5 text-xs leading-5 text-muted-foreground">
          Minute estimates blend Open-Meteo&apos;s 15-minute precipitation signal with its hourly
          probability trend.
        </p>
      </div>
    </section>
  );
}

function minuteSummary(wetMinuteIndex: number, peakChance: number) {
  if (wetMinuteIndex === 0 && peakChance >= 50) return "Precipitation likely now";
  if (wetMinuteIndex > 0) return `Precipitation may begin in about ${wetMinuteIndex} minutes`;
  if (peakChance >= 30) return "A passing shower is possible within the hour";
  return "No meaningful precipitation expected for the next hour";
}
