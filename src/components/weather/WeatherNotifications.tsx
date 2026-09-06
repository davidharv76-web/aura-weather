import { Bell, BellOff, Check, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildAlerts } from "@/components/weather/SevereAlerts";
import type { Forecast, GeoPlace, Units } from "@/lib/weather";

type PermissionState = NotificationPermission | "unsupported";

export function WeatherNotifications({
  forecast,
  place,
  units,
}: {
  forecast: Forecast;
  place: GeoPlace;
  units: Units;
}) {
  const [permission, setPermission] = useState<PermissionState>("unsupported");
  const [requesting, setRequesting] = useState(false);
  const alerts = useMemo(() => buildAlerts(forecast, units), [forecast, units]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    )
      return;
    setPermission(Notification.permission);
    void navigator.serviceWorker.register("/weather-sw.js");
  }, []);

  useEffect(() => {
    if (permission !== "granted" || alerts.length === 0 || typeof window === "undefined") return;
    const latest = alerts[0];
    if (!latest) return;
    const key = `${place.id}:${latest.id}:${forecast.current.time.slice(0, 13)}`;
    if (localStorage.getItem("dawncast:last-alert") === key) return;
    localStorage.setItem("dawncast:last-alert", key);
    void navigator.serviceWorker.ready.then((registration) =>
      registration.showNotification(`${latest.title} · ${place.name}`, {
        body: latest.detail,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `dawncast-${place.id}-${latest.id}`,
        data: { url: "/" },
      }),
    );
  }, [alerts, forecast.current.time, permission, place.id, place.name]);

  if (permission === "unsupported") return null;

  async function enable() {
    setRequesting(true);
    try {
      const next = await Notification.requestPermission();
      setPermission(next);
      if (next === "granted") {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("Dawncast alerts are on", {
          body: `You’ll be notified when ${place.name} reaches a severe weather threshold.`,
          icon: "/favicon.ico",
          tag: "dawncast-enabled",
          data: { url: "/" },
        });
      }
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-cream/[0.05] px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-cream/10 p-2 text-accent">
          {permission === "granted" ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </span>
        <div>
          <p className="text-sm font-semibold">Sudden-weather notifications</p>
          <p className="text-xs text-muted-foreground">
            {permission === "granted"
              ? `Monitoring live conditions for ${place.name}`
              : permission === "denied"
                ? "Notifications are blocked in your browser settings"
                : "Get an alert when conditions cross a severe threshold"}
          </p>
        </div>
      </div>
      {permission === "default" && (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={enable}
          disabled={requesting}
        >
          {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}{" "}
          Enable alerts
        </Button>
      )}
      {permission === "denied" && (
        <BellOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}
