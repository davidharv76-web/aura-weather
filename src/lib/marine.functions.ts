import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { MarineForecast, MarineHour } from "./marine";

const marineInput = z.object({ latitude: z.number(), longitude: z.number() });

type MarineApi = {
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset_seconds?: number;
  hourly: Record<string, Array<number | string | null>>;
};

const MARINE_FIELDS = [
  "wave_height",
  "wave_direction",
  "wave_period",
  "wind_wave_height",
  "wind_wave_direction",
  "wind_wave_period",
  "swell_wave_height",
  "swell_wave_direction",
  "swell_wave_period",
  "sea_surface_temperature",
  "sea_level_height_msl",
].join(",");

export const getMarineForecast = createServerFn({ method: "GET" })
  .validator((data) => marineInput.parse(data))
  .handler(async ({ data }): Promise<MarineForecast> => {
    const url =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${data.latitude}&longitude=${data.longitude}` +
      `&hourly=${MARINE_FIELDS}&timezone=auto&forecast_days=7&cell_selection=sea`;
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Marine forecast unavailable (${response.status})`);
    const payload = (await response.json()) as MarineApi;
    const times = payload.hourly["time"] ?? [];
    const hourly = times.map((value, index) => mapHour(String(value), index, payload.hourly));
    if (hourly.length === 0) throw new Error("No marine data is available for this location");

    const localNow = new Date(Date.now() + (payload.utc_offset_seconds ?? 0) * 1000)
      .toISOString()
      .slice(0, 16);
    const current = hourly.reduce((closest, hour) =>
      Math.abs(localMinutes(hour.time) - localMinutes(localNow)) <
      Math.abs(localMinutes(closest.time) - localMinutes(localNow))
        ? hour
        : closest,
    );
    const dates = [...new Set(hourly.map((hour) => hour.time.slice(0, 10)))];

    return {
      latitude: payload.latitude,
      longitude: payload.longitude,
      timezone: payload.timezone,
      current,
      hourly,
      daily: dates.map((date) => {
        const hours = hourly.filter((hour) => hour.time.startsWith(date));
        return {
          date,
          waveHeightMax: maximum(hours.map((hour) => hour.waveHeight)),
          swellHeightMax: maximum(hours.map((hour) => hour.swellHeight)),
          swellPeriodMax: maximum(hours.map((hour) => hour.swellPeriod)),
        };
      }),
    };
  });

function mapHour(time: string, index: number, hourly: MarineApi["hourly"]): MarineHour {
  return {
    time,
    waveHeight: value(hourly["wave_height"]?.[index]),
    waveDirection: value(hourly["wave_direction"]?.[index]),
    wavePeriod: value(hourly["wave_period"]?.[index]),
    swellHeight: value(hourly["swell_wave_height"]?.[index]),
    swellDirection: value(hourly["swell_wave_direction"]?.[index]),
    swellPeriod: value(hourly["swell_wave_period"]?.[index]),
    windWaveHeight: value(hourly["wind_wave_height"]?.[index]),
    windWaveDirection: value(hourly["wind_wave_direction"]?.[index]),
    windWavePeriod: value(hourly["wind_wave_period"]?.[index]),
    waterTemperature: nullableValue(hourly["sea_surface_temperature"]?.[index]),
    seaLevelHeight: nullableValue(hourly["sea_level_height_msl"]?.[index]),
  };
}

function value(input: number | string | null | undefined) {
  return typeof input === "number" && Number.isFinite(input) ? input : 0;
}

function nullableValue(input: number | string | null | undefined) {
  return typeof input === "number" && Number.isFinite(input) ? input : null;
}

function maximum(values: number[]) {
  return values.length > 0 ? Math.max(...values) : 0;
}

function localMinutes(iso: string) {
  const [date = "1970-01-01", clock = "00:00"] = iso.split("T");
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number);
  const [hour = 0, minute = 0] = clock.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) / 60_000;
}
