import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { AirQuality, Forecast, GeoPlace, WeatherBundle } from "./weather";

const placeSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  admin1: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().optional(),
  population: z.number().optional(),
});

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Weather service request failed [${res.status}]: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export const searchPlaces = createServerFn({ method: "GET" })
  .validator((data) => z.object({ query: z.string() }).parse(data))
  .handler(async ({ data }): Promise<GeoPlace[]> => {
    const query = data.query.trim();
    if (query.length < 2) return [];
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query,
    )}&count=10&language=en&format=json`;
    const json = await getJson<{
      results?: Array<{
        id: number;
        name: string;
        admin1?: string;
        country?: string;
        country_code?: string;
        latitude: number;
        longitude: number;
        timezone?: string;
        population?: number;
      }>;
    }>(url);
    return (json.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      admin1: r.admin1,
      country: r.country,
      countryCode: r.country_code,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
      population: r.population,
    }));
  });

export const reverseLookup = createServerFn({ method: "GET" })
  .validator((data) => z.object({ latitude: z.number(), longitude: z.number() }).parse(data))
  .handler(async ({ data }): Promise<GeoPlace> => {
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${data.latitude}&longitude=${data.longitude}&count=1&language=en&format=json`;
    try {
      const json = await getJson<{
        results?: Array<{
          id: number;
          name: string;
          admin1?: string;
          country?: string;
          country_code?: string;
          latitude: number;
          longitude: number;
          timezone?: string;
        }>;
      }>(url);
      const r = json.results?.[0];
      if (r) {
        return {
          id: r.id,
          name: r.name,
          admin1: r.admin1,
          country: r.country,
          countryCode: r.country_code,
          latitude: r.latitude,
          longitude: r.longitude,
          timezone: r.timezone,
        };
      }
    } catch {
      // fall through to coordinate label
    }
    return {
      id: 0,
      name: `${data.latitude.toFixed(2)}, ${data.longitude.toFixed(2)}`,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  });

const HOURLY_FIELDS = [
  "temperature_2m",
  "apparent_temperature",
  "precipitation_probability",
  "precipitation",
  "weather_code",
  "wind_speed_10m",
  "wind_direction_10m",
  "relative_humidity_2m",
  "uv_index",
  "is_day",
].join(",");

const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "apparent_temperature_min",
  "sunrise",
  "sunset",
  "uv_index_max",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "wind_direction_10m_dominant",
].join(",");

const CURRENT_FIELDS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "dew_point_2m",
  "surface_pressure",
  "wind_speed_10m",
  "wind_gusts_10m",
  "wind_direction_10m",
  "cloud_cover",
  "visibility",
  "precipitation",
  "is_day",
  "weather_code",
].join(",");

const MINUTELY_FIELDS = ["precipitation"].join(",");

type OMForecast = {
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset_seconds: number;
  current: Record<string, number | string>;
  minutely_15?: Record<string, Array<number | string>>;
  hourly: Record<string, Array<number | string>>;
  daily: Record<string, Array<number | string>>;
};

type OMAir = {
  current: Record<string, number | string>;
  hourly: Record<string, Array<number | string>>;
};

export type WeatherMapPoint = {
  latitude: number;
  longitude: number;
  temperature: number;
  cloudCover: number;
  windSpeed: number;
  windDirection: number;
};

export type RadarFrame = {
  time: number;
  path: string;
};

export type RadarMetadata = {
  host: string;
  radar: RadarFrame[];
  satellite: RadarFrame[];
};

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function localIsoToUtcMs(iso: string) {
  const [date = "1970-01-01", clock = "00:00"] = iso.split("T");
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number);
  const [hour = 0, minute = 0] = clock.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute);
}

function utcMsToLocalIso(milliseconds: number) {
  return new Date(milliseconds).toISOString().slice(0, 16);
}

function buildMinuteForecast(
  forecast: OMForecast,
  hours: string[],
  intervals: string[],
): Forecast["minute"] {
  const start = localIsoToUtcMs(String(forecast.current["time"]));
  const intervalTimes = intervals.map(localIsoToUtcMs);
  const intervalPrecipitation = forecast.minutely_15?.["precipitation"] ?? [];
  const hourlyProbability = forecast.hourly["precipitation_probability"] ?? [];

  return Array.from({ length: 60 }, (_, index) => {
    const timestamp = start + index * 60_000;
    const time = utcMsToLocalIso(timestamp);
    const hourStart = time.slice(0, 13);
    const hourIndex = Math.max(
      0,
      hours.findIndex((hour) => hour.slice(0, 13) === hourStart),
    );
    const minuteOfHour = Number(time.slice(14, 16));
    const fromProbability = num(hourlyProbability[hourIndex]);
    const toProbability = num(hourlyProbability[Math.min(hourIndex + 1, hours.length - 1)]);
    const interpolatedProbability =
      fromProbability + (toProbability - fromProbability) * (minuteOfHour / 60);

    let intervalIndex = 0;
    for (let i = 0; i < intervalTimes.length; i += 1) {
      if ((intervalTimes[i] ?? Number.POSITIVE_INFINITY) <= timestamp) intervalIndex = i;
      else break;
    }
    const precipitation = num(intervalPrecipitation[intervalIndex]);
    const precipitationSignal = precipitation > 0 ? Math.min(100, 30 + precipitation * 42) : 0;

    return {
      time,
      precipitation,
      precipitationProbability: Math.round(
        Math.max(0, Math.min(100, Math.max(interpolatedProbability, precipitationSignal))),
      ),
    };
  });
}

export const getWeatherMapPoints = createServerFn({ method: "GET" })
  .validator((data) => z.object({ latitude: z.number(), longitude: z.number() }).parse(data))
  .handler(async ({ data }): Promise<WeatherMapPoint[]> => {
    const offsets = [-2, -1, 0, 1, 2];
    const coordinates = offsets.flatMap((latOffset) =>
      offsets.map((lonOffset) => ({
        latitude: Math.max(-89, Math.min(89, data.latitude + latOffset * 0.75)),
        longitude: data.longitude + lonOffset * 0.9,
      })),
    );
    const latitudes = coordinates.map((point) => point.latitude).join(",");
    const longitudes = coordinates.map((point) => point.longitude).join(",");
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}` +
      "&current=temperature_2m,cloud_cover,wind_speed_10m,wind_direction_10m&timezone=auto";
    const payload = await getJson<
      Array<{
        latitude: number;
        longitude: number;
        current?: {
          temperature_2m?: number;
          cloud_cover?: number;
          wind_speed_10m?: number;
          wind_direction_10m?: number;
        };
      }>
    >(url);

    return payload.map((item) => ({
      latitude: item.latitude,
      longitude: item.longitude,
      temperature: num(item.current?.temperature_2m),
      cloudCover: num(item.current?.cloud_cover),
      windSpeed: num(item.current?.wind_speed_10m),
      windDirection: num(item.current?.wind_direction_10m),
    }));
  });

export const getRadarMetadata = createServerFn({ method: "GET" }).handler(
  async (): Promise<RadarMetadata> => {
    const payload = await getJson<{
      host: string;
      radar?: { past?: RadarFrame[]; nowcast?: RadarFrame[] };
      satellite?: { infrared?: RadarFrame[] };
    }>("https://api.rainviewer.com/public/weather-maps.json");

    return {
      host: payload.host,
      radar: [...(payload.radar?.past ?? []), ...(payload.radar?.nowcast ?? [])],
      satellite: payload.satellite?.infrared ?? [],
    };
  },
);

export const getWeather = createServerFn({ method: "GET" })
  .validator((data) => z.object({ place: placeSchema }).parse(data))
  .handler(async ({ data }): Promise<WeatherBundle> => {
    const { latitude, longitude } = data.place;
    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=${CURRENT_FIELDS}&minutely_15=${MINUTELY_FIELDS}` +
      `&hourly=${HOURLY_FIELDS}&daily=${DAILY_FIELDS}` +
      `&timezone=auto&forecast_days=14&forecast_hours=72`;
    const airUrl =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
      `&current=european_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,alder_pollen,birch_pollen,olive_pollen,grass_pollen,mugwort_pollen,ragweed_pollen` +
      `&hourly=european_aqi&timezone=auto&forecast_days=2`;

    const [fRes, aRes] = await Promise.allSettled([
      getJson<OMForecast>(forecastUrl),
      getJson<OMAir>(airUrl),
    ]);

    if (fRes.status === "rejected") {
      throw fRes.reason instanceof Error ? fRes.reason : new Error("Forecast unavailable");
    }
    const f = fRes.value;
    const hours = (f.hourly["time"] ?? []) as string[];
    const days = (f.daily["time"] ?? []) as string[];
    const minuteIntervals = (f.minutely_15?.["time"] ?? []) as string[];
    const uvNow = (() => {
      const idx = hours.findIndex((t) => t.slice(0, 13) === String(f.current["time"]).slice(0, 13));
      return num(f.hourly["uv_index"]?.[idx === -1 ? 0 : idx]);
    })();

    const forecast: Forecast = {
      latitude: f.latitude,
      longitude: f.longitude,
      timezone: f.timezone,
      utcOffsetSeconds: f.utc_offset_seconds,
      current: {
        time: String(f.current["time"]),
        temperature: num(f.current["temperature_2m"]),
        apparentTemperature: num(f.current["apparent_temperature"]),
        humidity: num(f.current["relative_humidity_2m"]),
        dewPoint: num(f.current["dew_point_2m"]),
        pressure: num(f.current["surface_pressure"]),
        windSpeed: num(f.current["wind_speed_10m"]),
        windGusts: num(f.current["wind_gusts_10m"]),
        windDirection: num(f.current["wind_direction_10m"]),
        cloudCover: num(f.current["cloud_cover"]),
        visibility: num(f.current["visibility"]),
        precipitation: num(f.current["precipitation"]),
        isDay: num(f.current["is_day"]) === 1,
        weatherCode: num(f.current["weather_code"]),
        uvIndex: uvNow,
      },
      minute: buildMinuteForecast(f, hours, minuteIntervals),
      hourly: hours.map((time, i) => ({
        time,
        temperature: num(f.hourly["temperature_2m"]?.[i]),
        apparentTemperature: num(f.hourly["apparent_temperature"]?.[i]),
        precipitationProbability: num(f.hourly["precipitation_probability"]?.[i]),
        precipitation: num(f.hourly["precipitation"]?.[i]),
        weatherCode: num(f.hourly["weather_code"]?.[i]),
        windSpeed: num(f.hourly["wind_speed_10m"]?.[i]),
        windDirection: num(f.hourly["wind_direction_10m"]?.[i]),
        humidity: num(f.hourly["relative_humidity_2m"]?.[i]),
        uvIndex: num(f.hourly["uv_index"]?.[i]),
        isDay: num(f.hourly["is_day"]?.[i]) === 1,
      })),
      daily: days.map((date, i) => ({
        date,
        weatherCode: num(f.daily["weather_code"]?.[i]),
        tempMax: num(f.daily["temperature_2m_max"]?.[i]),
        tempMin: num(f.daily["temperature_2m_min"]?.[i]),
        apparentMax: num(f.daily["apparent_temperature_max"]?.[i]),
        apparentMin: num(f.daily["apparent_temperature_min"]?.[i]),
        sunrise: String(f.daily["sunrise"]?.[i] ?? ""),
        sunset: String(f.daily["sunset"]?.[i] ?? ""),
        uvIndexMax: num(f.daily["uv_index_max"]?.[i]),
        precipitationSum: num(f.daily["precipitation_sum"]?.[i]),
        precipitationProbabilityMax: num(f.daily["precipitation_probability_max"]?.[i]),
        windSpeedMax: num(f.daily["wind_speed_10m_max"]?.[i]),
        windGustsMax: num(f.daily["wind_gusts_10m_max"]?.[i]),
        windDirection: num(f.daily["wind_direction_10m_dominant"]?.[i]),
      })),
    };

    let air: AirQuality | null = null;
    if (aRes.status === "fulfilled") {
      const a = aRes.value;
      const aHours = (a.hourly["time"] ?? []) as string[];
      air = {
        current: {
          time: String(a.current["time"]),
          aqi: num(a.current["european_aqi"]),
          pm2_5: num(a.current["pm2_5"]),
          pm10: num(a.current["pm10"]),
          ozone: num(a.current["ozone"]),
          no2: num(a.current["nitrogen_dioxide"]),
          so2: num(a.current["sulphur_dioxide"]),
          co: num(a.current["carbon_monoxide"]),
          pollenTree: sumAvailable(a.current, ["alder_pollen", "birch_pollen", "olive_pollen"]),
          pollenGrass:
            typeof a.current["grass_pollen"] === "number" ? a.current["grass_pollen"] : null,
          pollenWeed: sumAvailable(a.current, ["mugwort_pollen", "ragweed_pollen"]),
        },
        hourly: aHours.map((time, i) => ({ time, aqi: num(a.hourly["european_aqi"]?.[i]) })),
      };
    }

    return { place: data.place as GeoPlace, forecast, air };
  });

function sumAvailable(record: Record<string, number | string>, keys: string[]) {
  const values = keys
    .filter((key) => typeof record[key] === "number")
    .map((key) => num(record[key]));
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : null;
}
