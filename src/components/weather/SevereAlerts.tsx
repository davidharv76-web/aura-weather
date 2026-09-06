import { CloudLightning, Eye, Sun, Thermometer, Wind, type LucideIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Forecast } from "@/lib/weather";
import { describeCode, formatDistance, formatSpeed, formatTemp, type Units } from "@/lib/weather";

type AlertLevel = "danger" | "warning";

export type WeatherAlert = {
  id: string;
  title: string;
  detail: string;
  level: AlertLevel;
  icon: LucideIcon;
};

export function SevereAlerts({ forecast, units }: { forecast: Forecast; units: Units }) {
  const alerts = buildAlerts(forecast, units);
  if (alerts.length === 0) return null;

  return (
    <aside className="mb-5 space-y-2" aria-label="Severe weather alerts" aria-live="polite">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <Alert
            key={alert.id}
            className={
              alert.level === "danger"
                ? "rounded-2xl border-coral/55 bg-coral/15 py-4 shadow-lg shadow-coral/5 backdrop-blur-xl [&>svg]:text-coral"
                : "rounded-2xl border-gold/45 bg-gold/10 py-4 backdrop-blur-xl [&>svg]:text-gold"
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <AlertTitle className="font-semibold text-foreground">{alert.title}</AlertTitle>
            <AlertDescription className="text-foreground/80">
              <p>{alert.detail}</p>
            </AlertDescription>
          </Alert>
        );
      })}
    </aside>
  );
}

export function buildAlerts(forecast: Forecast, units: Units): WeatherAlert[] {
  const current = forecast.current;
  const group = describeCode(current.weatherCode).group;
  const alerts: WeatherAlert[] = [];

  if (group === "storm") {
    alerts.push({
      id: "thunderstorm",
      title: "Thunderstorm conditions",
      detail:
        "Lightning may be nearby. Move indoors and avoid exposed areas until conditions pass.",
      level: "danger",
      icon: CloudLightning,
    });
  }

  if (current.windGusts >= 75) {
    alerts.push({
      id: "wind",
      title: "Damaging wind possible",
      detail: `Gusts are reaching ${formatSpeed(current.windGusts, units)}. Secure loose items and take care near trees and high-sided vehicles.`,
      level: current.windGusts >= 95 ? "danger" : "warning",
      icon: Wind,
    });
  }

  if (current.visibility < 3_000) {
    alerts.push({
      id: "visibility",
      title: "Very low visibility",
      detail: `Visibility is about ${formatDistance(current.visibility, units)}. Slow down, increase following distance and use appropriate lights.`,
      level: current.visibility < 1_000 ? "danger" : "warning",
      icon: Eye,
    });
  }

  if (current.precipitation >= 7.5) {
    alerts.push({
      id: "heavy-rain",
      title: "Heavy precipitation",
      detail:
        "Intense precipitation is occurring now. Watch for local flooding and water across roads.",
      level: "danger",
      icon: CloudLightning,
    });
  }

  if (current.apparentTemperature >= 40 || current.apparentTemperature <= -20) {
    const hot = current.apparentTemperature >= 40;
    alerts.push({
      id: "temperature",
      title: hot ? "Dangerous heat stress" : "Dangerous cold exposure",
      detail: `It currently feels like ${formatTemp(current.apparentTemperature, units, true)}. ${
        hot
          ? "Limit strenuous outdoor activity and stay hydrated."
          : "Cover exposed skin and keep time outdoors brief."
      }`,
      level: "danger",
      icon: Thermometer,
    });
  }

  if (current.uvIndex >= 11) {
    alerts.push({
      id: "uv",
      title: "Extreme UV exposure",
      detail:
        "Unprotected skin can burn within minutes. Seek shade and use protective clothing and sunscreen.",
      level: "warning",
      icon: Sun,
    });
  }

  return alerts;
}
