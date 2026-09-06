import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudRain,
  Loader2,
  Pause,
  Play,
  Wind,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GeoPlace, Units } from "@/lib/weather";
import {
  getRadarMetadata,
  getWeatherMapPoints,
  type WeatherMapPoint,
} from "@/lib/weather.functions";

type LayerKind = "precipitation" | "infrared" | "visible" | "wind";

export function SatelliteViewer({ place, units: _units }: { place: GeoPlace; units: Units }) {
  const [layer, setLayer] = useState<LayerKind>("precipitation");
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const fetchRadar = useServerFn(getRadarMetadata);
  const fetchPoints = useServerFn(getWeatherMapPoints);
  const radarQuery = useQuery({
    queryKey: ["rainviewer-global"],
    queryFn: () => fetchRadar(),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
  const pointsQuery = useQuery({
    queryKey: ["synoptic-grid", place.latitude.toFixed(2), place.longitude.toFixed(2)],
    queryFn: () => fetchPoints({ data: { latitude: place.latitude, longitude: place.longitude } }),
    staleTime: 15 * 60_000,
  });
  const frames =
    layer === "infrared" ? (radarQuery.data?.satellite ?? []) : (radarQuery.data?.radar ?? []);
  const animatedLayer = layer === "precipitation" || layer === "infrared";

  useEffect(() => {
    if (frames.length > 0) setFrameIndex(frames.length - 1);
  }, [frames.length, layer]);
  useEffect(() => {
    if (!playing || !animatedLayer || frames.length < 2) return;
    const timer = window.setInterval(
      () => setFrameIndex((current) => (current + 1) % frames.length),
      1100 / speed,
    );
    return () => window.clearInterval(timer);
  }, [animatedLayer, frames.length, playing, speed]);

  const safeIndex = Math.min(frameIndex, Math.max(0, frames.length - 1));
  const frame = frames[safeIndex];
  const overlayUrl =
    frame && radarQuery.data
      ? `${radarQuery.data.host}${frame.path}/256/{z}/{x}/{y}/${layer === "infrared" ? "0/0_0" : "2/1_1"}.png`
      : null;
  const timestamp = frame
    ? new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZone: place.timezone,
      }).format(new Date(frame.time * 1000))
    : "Live model";
  const legend = useMemo(() => layerLegend(layer), [layer]);

  const step = (direction: -1 | 1) => {
    setPlaying(false);
    setFrameIndex((current) => Math.max(0, Math.min(frames.length - 1, current + direction)));
  };

  return (
    <section className="glass-strong overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-4 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
        <Tabs value={layer} onValueChange={(value) => setLayer(value as LayerKind)}>
          <TabsList className="glass h-auto flex-wrap rounded-2xl p-1">
            <TabsTrigger value="precipitation" className="rounded-xl">
              <CloudRain className="h-4 w-4" />
              Doppler radar
            </TabsTrigger>
            <TabsTrigger value="infrared" className="rounded-xl">
              <Cloud className="h-4 w-4" />
              Satellite IR
            </TabsTrigger>
            <TabsTrigger value="visible" className="rounded-xl">
              <Cloud className="h-4 w-4" />
              Visible clouds
            </TabsTrigger>
            <TabsTrigger value="wind" className="rounded-xl">
              <Wind className="h-4 w-4" />
              Wind flow
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {(radarQuery.isFetching || pointsQuery.isFetching) && (
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          )}
          <span>{timestamp}</span>
        </div>
      </div>

      <div className="relative h-[calc(100vh-15rem)] min-h-[32rem]">
        <MapContainer
          center={[place.latitude, place.longitude]}
          zoom={layer === "precipitation" ? 6 : 4}
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
          {animatedLayer && overlayUrl && (
            <TileLayer
              key={overlayUrl}
              url={overlayUrl}
              opacity={layer === "infrared" ? 0.62 : 0.75}
              zIndex={300}
              attribution='<a href="https://www.rainviewer.com/">RainViewer</a>'
            />
          )}
          {layer === "visible" &&
            (pointsQuery.data ?? []).map((point) => (
              <CloudPoint key={`${point.latitude}-${point.longitude}`} point={point} />
            ))}
          {layer === "wind" && <WindStreamlines points={pointsQuery.data ?? []} />}
        </MapContainer>

        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[500] flex flex-col items-stretch gap-3 sm:inset-x-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="glass pointer-events-auto w-fit rounded-2xl p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">{legend.title}</p>
            <div className="mt-2 h-2 w-44 rounded-full" style={{ background: legend.gradient }} />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{legend.low}</span>
              <span>{legend.high}</span>
            </div>
          </div>
          {animatedLayer && frames.length > 0 && (
            <div className="glass pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl p-2">
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                onClick={() => step(-1)}
                disabled={safeIndex === 0}
                aria-label="Previous frame"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                onClick={() => setPlaying((value) => !value)}
                aria-label={playing ? "Pause animation" : "Play animation"}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                onClick={() => step(1)}
                disabled={safeIndex === frames.length - 1}
                aria-label="Next frame"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Slider
                min={0}
                max={Math.max(0, frames.length - 1)}
                step={1}
                value={[safeIndex]}
                onValueChange={([value = 0]) => {
                  setPlaying(false);
                  setFrameIndex(value);
                }}
                className="w-28 sm:w-44"
                aria-label="Radar timeline"
              />
              <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
                <span className="text-xs text-muted-foreground">Speed</span>
                <Slider
                  min={0.5}
                  max={2}
                  step={0.5}
                  value={[speed]}
                  onValueChange={([value = 1]) => setSpeed(value)}
                  className="w-16"
                />
                <span className="w-6 text-xs tabular">{speed}×</span>
              </div>
            </div>
          )}
        </div>
        {(radarQuery.isError || pointsQuery.isError) && (
          <div className="glass absolute right-4 top-4 z-[500] max-w-xs rounded-2xl p-3 text-sm">
            A live layer could not load. Switch layers or retry shortly.
          </div>
        )}
      </div>
    </section>
  );
}

function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([latitude, longitude], Math.max(4, map.getZoom()), { duration: 1.1 });
  }, [latitude, longitude, map]);
  return null;
}

function CloudPoint({ point }: { point: WeatherMapPoint }) {
  const opacity = 0.1 + point.cloudCover / 135;
  return (
    <CircleMarker
      center={[point.latitude, point.longitude]}
      radius={38}
      pathOptions={{
        color: "#eef4ff",
        fillColor: "#eef4ff",
        fillOpacity: opacity,
        opacity: Math.min(0.65, opacity),
        weight: 1,
      }}
    >
      <Tooltip className="dawncast-map-tooltip">
        {Math.round(point.cloudCover)}% cloud cover
      </Tooltip>
    </CircleMarker>
  );
}

function WindStreamlines({ points }: { points: WeatherMapPoint[] }) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const container = map.getContainer();
    const canvas = document.createElement("canvas");
    canvas.className = "pointer-events-none absolute inset-0 z-[350]";
    container.appendChild(canvas);
    canvasRef.current = canvas;
    const context = canvas.getContext("2d");
    if (!context) return;
    let particles = Array.from({ length: 90 }, (_, index) => ({
      x: (index * 83) % Math.max(1, container.clientWidth),
      y: (index * 47) % Math.max(1, container.clientHeight),
      age: index % 80,
    }));
    let frame = 0;
    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = container.clientWidth * ratio;
      canvas.height = container.clientHeight * ratio;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const direction = points.length
      ? points.reduce((sum, point) => sum + point.windDirection, 0) / points.length
      : 270;
    const speed = points.length
      ? points.reduce((sum, point) => sum + point.windSpeed, 0) / points.length
      : 12;
    const radians = ((direction + 90) * Math.PI) / 180;
    const draw = () => {
      context.fillStyle = "rgba(25,14,45,.09)";
      context.fillRect(0, 0, container.clientWidth, container.clientHeight);
      context.strokeStyle = "rgba(255,225,145,.55)";
      context.lineWidth = 1;
      particles = particles.map((particle) => {
        const vx = Math.cos(radians) * Math.max(0.7, speed / 8);
        const vy = Math.sin(radians) * Math.max(0.7, speed / 8);
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x + vx * 3, particle.y + vy * 3);
        context.stroke();
        const next = { x: particle.x + vx, y: particle.y + vy, age: particle.age + 1 };
        if (
          next.x < 0 ||
          next.x > container.clientWidth ||
          next.y < 0 ||
          next.y > container.clientHeight ||
          next.age > 110
        )
          return {
            x: Math.random() * container.clientWidth,
            y: Math.random() * container.clientHeight,
            age: 0,
          };
        return next;
      });
      frame = requestAnimationFrame(draw);
    };
    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.remove();
      canvasRef.current = null;
    };
  }, [map, points]);
  return null;
}

function layerLegend(layer: LayerKind) {
  if (layer === "precipitation")
    return {
      title: "Precipitation intensity",
      low: "Light",
      high: "Severe",
      gradient: "linear-gradient(90deg,#7dd3fc,#2563eb,#a855f7,#ef4444)",
    };
  if (layer === "infrared")
    return {
      title: "Cloud-top temperature",
      low: "Warm",
      high: "Cold / high",
      gradient: "linear-gradient(90deg,#22243d,#7c67a5,#f5d978,#ffffff)",
    };
  if (layer === "visible")
    return {
      title: "Modelled cloud cover",
      low: "Clear",
      high: "Overcast",
      gradient: "linear-gradient(90deg,rgba(226,232,240,.15),#f8fafc)",
    };
  return {
    title: "Wind flow",
    low: "Lighter",
    high: "Stronger",
    gradient: "linear-gradient(90deg,#82d8e5,#f4d87b,#ef866f)",
  };
}
