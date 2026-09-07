import React, { createContext, useContext, useEffect, useState } from "react";

export interface LocationState {
  units: "c" | "f";
  setUnits: (u: "c" | "f") => void;
  place: { name: string; lat: number; lon: number };
  setPlace: (p: { name: string; lat: number; lon: number }) => void;
  forecast: any;
  setForecast: (f: any) => void;
  air: any;
  setAir: (a: any) => void;
}

const DEFAULT_PLACE = {
  name: "New York, United States",
  lat: 40.7128,
  lon: -74.006,
};

const DEFAULT_FORECAST = {
  current: {
    time: new Date().toISOString(),
    temperature: 20,
    apparentTemperature: 21,
    weatherCode: 0,
    isDay: true,
    humidity: 55,
    windSpeed: 12,
    windGusts: 15,
    windDirection: 180,
    uvIndex: 5,
    dewPoint: 11,
    pressure: 1013,
    visibility: 10000,
    cloudCover: 20,
  },
  hourly: Array.from({ length: 24 }).map((_, i) => ({
    time: new Date(Date.now() + i * 3600000).toISOString(),
    temperature: 20 + Math.sin(i) * 3,
    weatherCode: 0,
    isDay: i >= 6 && i <= 20,
    precipitationProbability: 0,
  })),
  daily: Array.from({ length: 7 }).map((_, i) => ({
    date: new Date(Date.now() + i * 86400000).toISOString(),
    tempMin: 15,
    tempMax: 23,
    precipitationProbabilityMax: 10,
    precipitationSum: 0,
    windGustsMax: 18,
    weatherCode: 0,
  })),
};

const LocationContext = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnits] = useState<"c" | "f">("c");
  const [place, setPlace] = useState(DEFAULT_PLACE);
  const [forecast, setForecast] = useState<any>(DEFAULT_FORECAST);
  const [air, setAir] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadLiveData() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,precipitation_probability,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max&timezone=auto`
        );
        const data = await res.json();
        if (isMounted && data && data.current) {
          setForecast({
            current: {
              time: data.current.time,
              temperature: data.current.temperature_2m,
              apparentTemperature: data.current.apparent_temperature,
              weatherCode: data.current.weather_code,
              isDay: Boolean(data.current.is_day),
              humidity: data.current.relative_humidity_2m,
              windSpeed: data.current.wind_speed_10m,
              windGusts: data.current.wind_gusts_10m,
              windDirection: data.current.wind_direction_10m,
              uvIndex: data.current.uv_index,
              dewPoint: 10,
              pressure: data.current.pressure_msl,
              visibility: 10000,
              cloudCover: data.current.cloud_cover,
            },
            hourly: (data.hourly?.time || []).map((t: string, idx: number) => ({
              time: t,
              temperature: data.hourly.temperature_2m?.[idx] ?? 20,
              weatherCode: data.hourly.weather_code?.[idx] ?? 0,
              isDay: Boolean(data.hourly.is_day?.[idx]),
              precipitationProbability: data.hourly.precipitation_probability?.[idx] || 0,
            })),
            daily: (data.daily?.time || []).map((t: string, idx: number) => ({
              date: t,
              tempMin: data.daily.temperature_2m_min?.[idx] ?? 15,
              tempMax: data.daily.temperature_2m_max?.[idx] ?? 22,
              precipitationProbabilityMax: data.daily.precipitation_probability_max?.[idx] || 0,
              precipitationSum: data.daily.precipitation_sum?.[idx] || 0,
              windGustsMax: data.daily.wind_gusts_10m_max?.[idx] || 0,
              weatherCode: data.daily.weather_code?.[idx] ?? 0,
            })),
          });
        }
      } catch (err) {
        console.error("Error fetching live weather data:", err);
      }
    }

    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, [place]);

  return (
    <LocationContext.Provider
      value={{ units, setUnits, place, setPlace, forecast, setForecast, air, setAir }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationState() {
  const context = useContext(LocationContext);
  if (!context) {
    return {
      units: "c" as const,
      setUnits: () => {},
      place: DEFAULT_PLACE,
      setPlace: () => {},
      forecast: DEFAULT_FORECAST,
      setForecast: () => {},
      air: null,
      setAir: () => {},
    };
  }
  return context;
}

export function validateLocationSearch(search: Record<string, unknown>) {
  return search;
}
