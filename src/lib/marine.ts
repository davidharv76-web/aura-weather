export type SurfSpot = {
  id: string;
  name: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
};

export type MarineHour = {
  time: string;
  waveHeight: number;
  waveDirection: number;
  wavePeriod: number;
  swellHeight: number;
  swellDirection: number;
  swellPeriod: number;
  windWaveHeight: number;
  windWaveDirection: number;
  windWavePeriod: number;
  waterTemperature: number | null;
  seaLevelHeight: number | null;
};

export type MarineForecast = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: MarineHour;
  hourly: MarineHour[];
  daily: Array<{
    date: string;
    waveHeightMax: number;
    swellHeightMax: number;
    swellPeriodMax: number;
  }>;
};

export const SURF_SPOTS: SurfSpot[] = [
  {
    id: "nazare",
    name: "Nazaré",
    region: "Leiria",
    country: "Portugal",
    countryCode: "PT",
    latitude: 39.6029,
    longitude: -9.0703,
  },
  {
    id: "pipeline",
    name: "Pipeline",
    region: "Oʻahu, Hawaii",
    country: "United States",
    countryCode: "US",
    latitude: 21.6644,
    longitude: -158.0531,
  },
  {
    id: "jeffreys-bay",
    name: "Jeffreys Bay",
    region: "Eastern Cape",
    country: "South Africa",
    countryCode: "ZA",
    latitude: -34.0507,
    longitude: 24.9288,
  },
  {
    id: "snapper-rocks",
    name: "Snapper Rocks",
    region: "Gold Coast",
    country: "Australia",
    countryCode: "AU",
    latitude: -28.164,
    longitude: 153.551,
  },
  {
    id: "teahupoo",
    name: "Teahupoʻo",
    region: "Tahiti",
    country: "French Polynesia",
    countryCode: "PF",
    latitude: -17.8333,
    longitude: -149.267,
  },
  {
    id: "muizenberg",
    name: "Muizenberg",
    region: "Western Cape",
    country: "South Africa",
    countryCode: "ZA",
    latitude: -34.108,
    longitude: 18.472,
  },
  {
    id: "uluwatu",
    name: "Uluwatu",
    region: "Bali",
    country: "Indonesia",
    countryCode: "ID",
    latitude: -8.8291,
    longitude: 115.0849,
  },
];

export function formatWaveHeight(metres: number, units: "metric" | "imperial") {
  return units === "metric" ? `${metres.toFixed(1)} m` : `${(metres * 3.28084).toFixed(1)} ft`;
}

export function formatWaterTemperature(celsius: number | null, units: "metric" | "imperial") {
  if (celsius === null) return "Not available";
  const value = units === "metric" ? celsius : celsius * 1.8 + 32;
  return `${Math.round(value)}°${units === "metric" ? "C" : "F"}`;
}

export function compassDirection(degrees: number) {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(degrees / 45) % 8] ?? "N";
}
