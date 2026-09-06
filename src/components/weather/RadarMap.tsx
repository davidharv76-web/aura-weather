import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Cloud, CloudRain, Loader2, Pause, Play, Thermometer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { GeoPlace, Units } from "@/lib/weather";
import { formatTemp } from "@/lib/weather";
import {
  getRadarMetadata,
  getWeatherMapPoints,
  type WeatherMapPoint,
} from "@/lib/weather.functions";

type LayerKind = "precipitation" | "clouds" | "temperature";

export function RadarMap({ place, units }: { place: GeoPlace; units: Units }) {
  const [layer, setLayer] = useState<LayerKind>("precipitation");
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const fetchRadar = useServerFn(getRadarMetadata);
  const fetchPoints = useServerFn(getWeatherMapPoints);

  const radarQuery = useQuery({
    queryKey: ["radar-metadata"],
    queryFn: () => fetchRadar(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const pointsQuery = useQuery({
    queryKey: ["weather-map", place.latitude.toFixed(2), place.longitude.toFixed(2)],
    queryFn: () => fetchPoints({ data: { latitude: place.latitude, longitude: place.longitude } }),
    enabled: layer !== "precipitation",
    staleTime: 15 * 60 * 1000,
  });

  const frames = radarQuery.data?.radar ?? [];

  useEffect(() => {
    if (frames.length > 0) setFrameIndex(frames.length - 1);
  }, [frames.length]);

  useEffect(() => {
    if (!playing || layer !== "precipitation" || frames.length < 2) return;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 900);
    return () => window.clearInterval(timer);
  }, [frames.length, layer, playing]);

  const frame = frames[Math.min(frameIndex, Math.max(0, frames.length - 1))];
  const overlayUrl =
    frame && radarQuery.data
      ? `${radarQuery.data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`
      : null;
  const frameTime = frame
    ? new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: place.timezone,
      }).format(new Date(frame.time * 1000))
    : "Unavailable";

  const legend = useMemo(() => getLegend(layer, units), [layer, units]);

  return (
    <section className="glass-strong overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <Tabs value={layer} onValueChange={(value) => setLayer(value as LayerKind)}>
          <TabsList className="glass h-auto flex-wrap rounded-full p-1">
            <TabsTrigger value="precipitation" className="rounded-full">
              <CloudRain className="h-4 w-4" /> Rain
            </TabsTrigger>
            <TabsTrigger value="clouds" className="rounded-full">
              <Cloud className="h-4 w-4" /> Clouds
            </TabsTrigger>
            <TabsTrigger value="temperature" className="rounded-full">
              <Thermometer className="h-4 w-4" /> Temperature
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 text-sm">
          {(radarQuery.isFetching || pointsQuery.isFetching) && (
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          )}
          <span className="text-muted-foreground">
            {layer === "precipitation" ? frameTime : "Current conditions"}
          </span>
        </div>
      </div>

      <div className="relative h-[62vh] min-h-[28rem]">
        <MapContainer
          center={[place.latitude, place.longitude]}
          zoom={7}
          minZoom={2}
          maxZoom={12}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter latitude={place.latitude} longitude={place.longitude} />

          {layer === "precipitation" && overlayUrl && (
            <TileLayer
              key={overlayUrl}
              url={overlayUrl}
              opacity={0.72}
              zIndex={300}
              attribution='<a href="https://www.rainviewer.com/">RainViewer</a>'
            />
          )}

          {layer !== "precipitation" &&
            (pointsQuery.data ?? []).map((point) => (
              <ConditionPoint
                key={`${layer}-${point.latitude}-${point.longitude}`}
                point={point}
                layer={layer}
                units={units}
              />
            ))}
        </MapContainer>

        <div className="pointer-events-none absolute bottom-5 left-4 right-4 z-[500] flex items-end justify-between gap-3 sm:left-5 sm:right-5">
          <div className="glass pointer-events-auto rounded-2xl p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/80">
              {legend.title}
            </p>
            <div
              className="h-2 w-40 rounded-full sm:w-52"
              style={{ background: legend.gradient }}
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{legend.low}</span>
              <span>{legend.high}</span>
            </div>
          </div>

          {layer === "precipitation" && frames.length > 0 && (
            <div className="glass pointer-events-auto flex max-w-[55%] items-center gap-2 rounded-2xl p-2 sm:max-w-none">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0 rounded-full"
                onClick={() => setPlaying((value) => !value)}
                aria-label={playing ? "Pause radar animation" : "Play radar animation"}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <input
                type="range"
                min={0}
                max={Math.max(0, frames.length - 1)}
                value={frameIndex}
                onChange={(event) => {
                  setPlaying(false);
                  setFrameIndex(Number(event.target.value));
                }}
                className="w-28 accent-[var(--gold)] sm:w-44"
                aria-label="Radar time"
              />
            </div>
          )}
        </div>

        {(radarQuery.isError || pointsQuery.isError) && (
          <div className="glass absolute right-4 top-4 z-[500] max-w-xs rounded-2xl p-3 text-sm text-foreground/90">
            Some live map data could not be loaded. Try changing layers or refreshing.
          </div>
        )}
      </div>
    </section>
  );
}

function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 7), { duration: 1.2 });
  }, [latitude, longitude, map]);

  return null;
}

function ConditionPoint({
  point,
  layer,
  units,
}: {
  point: WeatherMapPoint;
  layer: Exclude<LayerKind, "precipitation">;
  units: Units;
}) {
  const value = layer === "clouds" ? point.cloudCover : point.temperature;
  const color = layer === "clouds" ? cloudColor(value) : temperatureColor(value);
  const label =
    layer === "clouds"
      ? `${Math.round(point.cloudCover)}% cloud cover`
      : formatTemp(point.temperature, units, true);

  return (
    <CircleMarker
      center={[point.latitude, point.longitude]}
      radius={32}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: layer === "clouds" ? 0.42 : 0.48,
        opacity: 0.2,
        weight: 1,
      }}
    >
      <Tooltip className="dawncast-map-tooltip" direction="top">
        {label}
      </Tooltip>
    </CircleMarker>
  );
}

function cloudColor(value: number) {
  const lightness = 82 + Math.round((value / 100) * 15);
  return `hsl(215 28% ${lightness}%)`;
}

function temperatureColor(celsius: number) {
  if (celsius <= 0) return "#69b7ff";
  if (celsius <= 10) return "#7bd9df";
  if (celsius <= 20) return "#f0d779";
  if (celsius <= 30) return "#f39a61";
  return "#e85f5c";
}

function getLegend(layer: LayerKind, units: Units) {
  if (layer === "precipitation") {
    return {
      title: "Precipitation intensity",
      low: "Light",
      high: "Heavy",
      gradient: "linear-gradient(90deg, #7dd3fc, #2563eb, #a855f7, #ef4444)",
    };
  }
  if (layer === "clouds") {
    return {
      title: "Cloud coverage",
      low: "Clear",
      high: "Overcast",
      gradient: "linear-gradient(90deg, rgba(226,232,240,.18), #f8fafc)",
    };
  }
  return {
    title: "Temperature",
    low: units === "metric" ? "≤ 0°C" : "≤ 32°F",
    high: units === "metric" ? "≥ 30°C" : "≥ 86°F",
    gradient: "linear-gradient(90deg, #69b7ff, #7bd9df, #f0d779, #f39a61, #e85f5c)",
  };
}
