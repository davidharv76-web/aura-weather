// Browser-safe weather domain helpers, types and formatting utilities.

export type GeoPlace = {
  id: number;
  name: string;
  admin1?: string | undefined;
  country?: string | undefined;
  countryCode?: string | undefined;
  latitude: number;
  longitude: number;
  timezone?: string | undefined;
  population?: number | undefined;
};

export type Forecast = {
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffsetSeconds: number;
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    dewPoint: number;
    pressure: number;
    windSpeed: number;
    windGusts: number;
    windDirection: number;
    cloudCover: number;
    visibility: number;
    precipitation: number;
    isDay: boolean;
    weatherCode: number;
    uvIndex: number;
  };
  minute: Array<{
    time: string;
    precipitationProbability: number;
    precipitation: number;
  }>;
  hourly: Array<{
    time: string;
    temperature: number;
    apparentTemperature: number;
    precipitationProbability: number;
    precipitation: number;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
    humidity: number;
    uvIndex: number;
    isDay: boolean;
  }>;
  daily: Array<{
    date: string;
    weatherCode: number;
    tempMax: number;
    tempMin: number;
    apparentMax: number;
    apparentMin: number;
    sunrise: string;
    sunset: string;
    uvIndexMax: number;
    precipitationSum: number;
    precipitationProbabilityMax: number;
    windSpeedMax: number;
    windGustsMax: number;
    windDirection: number;
  }>;
};

export type AirQuality = {
  current: {
    time: string;
    aqi: number;
    pm2_5: number;
    pm10: number;
    ozone: number;
    no2: number;
    so2: number;
    co: number;
    pollenTree: number | null;
    pollenGrass: number | null;
    pollenWeed: number | null;
  };
  hourly: Array<{ time: string; aqi: number }>;
};

export type WeatherBundle = {
  place: GeoPlace;
  forecast: Forecast;
  air: AirQuality | null;
};

export const DEFAULT_PLACE: GeoPlace = {
  id: 5128581,
  name: "New York",
  admin1: "New York",
  country: "United States",
  countryCode: "US",
  latitude: 40.7143,
  longitude: -74.006,
  timezone: "America/New_York",
};

export const FEATURED_PLACES: GeoPlace[] = [
  DEFAULT_PLACE,
  {
    id: 2643743,
    name: "London",
    country: "United Kingdom",
    countryCode: "GB",
    latitude: 51.5085,
    longitude: -0.1257,
  },
  {
    id: 1850147,
    name: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    latitude: 35.6895,
    longitude: 139.6917,
  },
  {
    id: 993800,
    name: "Johannesburg",
    country: "South Africa",
    countryCode: "ZA",
    latitude: -26.2023,
    longitude: 28.0436,
  },
  {
    id: 292223,
    name: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    latitude: 25.0657,
    longitude: 55.1713,
  },
  {
    id: 3448439,
    name: "São Paulo",
    country: "Brazil",
    countryCode: "BR",
    latitude: -23.5475,
    longitude: -46.6361,
  },
];

type CodeInfo = { label: string; group: WeatherGroup };
export type WeatherGroup =
  "clear" | "partly" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "storm";

const CODES: Record<number, CodeInfo> = {
  0: { label: "Clear sky", group: "clear" },
  1: { label: "Mainly clear", group: "clear" },
  2: { label: "Partly cloudy", group: "partly" },
  3: { label: "Overcast", group: "cloud" },
  45: { label: "Fog", group: "fog" },
  48: { label: "Freezing fog", group: "fog" },
  51: { label: "Light drizzle", group: "drizzle" },
  53: { label: "Drizzle", group: "drizzle" },
  55: { label: "Heavy drizzle", group: "drizzle" },
  56: { label: "Freezing drizzle", group: "drizzle" },
  57: { label: "Freezing drizzle", group: "drizzle" },
  61: { label: "Light rain", group: "rain" },
  63: { label: "Rain", group: "rain" },
  65: { label: "Heavy rain", group: "rain" },
  66: { label: "Freezing rain", group: "rain" },
  67: { label: "Freezing rain", group: "rain" },
  71: { label: "Light snow", group: "snow" },
  73: { label: "Snow", group: "snow" },
  75: { label: "Heavy snow", group: "snow" },
  77: { label: "Snow grains", group: "snow" },
  80: { label: "Rain showers", group: "rain" },
  81: { label: "Rain showers", group: "rain" },
  82: { label: "Violent showers", group: "rain" },
  85: { label: "Snow showers", group: "snow" },
  86: { label: "Snow showers", group: "snow" },
  95: { label: "Thunderstorm", group: "storm" },
  96: { label: "Thunderstorm, hail", group: "storm" },
  99: { label: "Thunderstorm, hail", group: "storm" },
};

export function describeCode(code: number): CodeInfo {
  return CODES[code] ?? { label: "Unsettled", group: "cloud" };
}

export type Units = "metric" | "imperial";

export function formatTemp(celsius: number, units: Units, withUnit = false) {
  const value = units === "metric" ? celsius : celsius * 1.8 + 32;
  const rounded = Math.round(value);
  return withUnit ? `${rounded}°${units === "metric" ? "C" : "F"}` : `${rounded}°`;
}

export function formatSpeed(kmh: number, units: Units) {
  return units === "metric" ? `${Math.round(kmh)} km/h` : `${Math.round(kmh * 0.6214)} mph`;
}

export function formatLength(mm: number, units: Units) {
  return units === "metric" ? `${mm.toFixed(mm < 10 ? 1 : 0)} mm` : `${(mm / 25.4).toFixed(2)} in`;
}

export function formatDistance(meters: number, units: Units) {
  return units === "metric"
    ? `${(meters / 1000).toFixed(1)} km`
    : `${(meters / 1609).toFixed(1)} mi`;
}

export function formatPressure(hPa: number, units: Units) {
  return units === "metric" ? `${Math.round(hPa)} hPa` : `${(hPa * 0.02953).toFixed(2)} inHg`;
}

export function windDirectionLabel(deg: number) {
  const points = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return points[Math.round(deg / 22.5) % 16];
}

export function placeLabel(place: GeoPlace) {
  const region = place.admin1 && place.admin1 !== place.name ? place.admin1 : undefined;
  return [place.name, region, place.country].filter(Boolean).join(", ");
}

/** Format an ISO local timestamp coming from Open-Meteo (already in the place's timezone). */
export function formatHour(iso: string) {
  const hour = Number(iso.slice(11, 13));
  const suffix = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${suffix}`;
}

export function formatClock(iso: string) {
  const hour = Number(iso.slice(11, 13));
  const minute = iso.slice(14, 16);
  const suffix = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minute} ${suffix}`;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dayParts(isoDate: string) {
  const [y = 1970, m = 1, d = 1] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = WEEKDAYS[date.getUTCDay()] ?? "";
  return {
    weekday,
    weekdayShort: weekday.slice(0, 3),
    month: MONTHS[date.getUTCMonth()] ?? "",
    day: date.getUTCDate(),
  };
}

export function localNow(forecast: Forecast) {
  return forecast.current.time;
}

/** Sky mood drives the page gradient. */
export type SkyMood = "dawn" | "day" | "dusk" | "night" | "storm";

export function skyMood(forecast: Forecast): SkyMood {
  const group = describeCode(forecast.current.weatherCode).group;
  if (group === "storm" || group === "rain" || group === "snow") return "storm";
  const hour = Number(forecast.current.time.slice(11, 13));
  if (!forecast.current.isDay) return "night";
  if (hour < 9) return "dawn";
  if (hour >= 17) return "dusk";
  return "day";
}

export function aqiBand(aqi: number) {
  if (aqi <= 20)
    return {
      label: "Excellent",
      tone: "aqi-good",
      advice: "Air is pristine — ideal for any outdoor activity.",
    };
  if (aqi <= 40)
    return { label: "Good", tone: "aqi-good", advice: "Air quality is comfortable for everyone." };
  if (aqi <= 60)
    return {
      label: "Moderate",
      tone: "aqi-moderate",
      advice: "Sensitive groups may notice mild irritation.",
    };
  if (aqi <= 80)
    return { label: "Poor", tone: "aqi-poor", advice: "Reduce long, intense activity outdoors." };
  if (aqi <= 100)
    return {
      label: "Very poor",
      tone: "aqi-bad",
      advice: "Keep outdoor exertion brief; consider a mask.",
    };
  return {
    label: "Extremely poor",
    tone: "aqi-bad",
    advice: "Stay indoors where possible and filter your air.",
  };
}

export function uvBand(uv: number) {
  if (uv < 3) return { label: "Low", advice: "No protection needed for most skin types." };
  if (uv < 6) return { label: "Moderate", advice: "Seek shade near midday; SPF 30 recommended." };
  if (uv < 8) return { label: "High", advice: "Cover up, wear a hat and reapply sunscreen." };
  if (uv < 11) return { label: "Very high", advice: "Avoid the sun between 10am and 4pm." };
  return { label: "Extreme", advice: "Unprotected skin can burn within minutes." };
}

export function pollutantBand(kind: "pm2_5" | "pm10" | "ozone" | "no2" | "so2", value: number) {
  const limits: Record<typeof kind, number[]> = {
    pm2_5: [10, 25, 50],
    pm10: [20, 50, 100],
    ozone: [60, 120, 180],
    no2: [40, 90, 200],
    so2: [20, 80, 250],
  };
  const [good = 0, ok = 0] = limits[kind];
  if (value <= good) return { label: "Good" };
  if (value <= ok) return { label: "Moderate" };
  return { label: "Elevated" };
}
