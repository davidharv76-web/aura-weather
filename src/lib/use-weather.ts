import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { useLocationState } from "./location-context";
import { getWeather } from "./weather.functions";
import type { GeoPlace, WeatherBundle } from "./weather";

export function useWeatherQuery() {
  const { place } = useLocationState();
  return useWeatherForPlace(place);
}

export function useWeatherForPlace(place: GeoPlace) {
  const fetchWeather = useServerFn(getWeather);

  return useQuery<WeatherBundle>({
    queryKey: ["weather", Number(place.latitude.toFixed(3)), Number(place.longitude.toFixed(3))],
    queryFn: () => fetchWeather({ data: { place: stripPlace(place) } }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

function stripPlace(place: GeoPlace) {
  return {
    id: place.id,
    name: place.name,
    admin1: place.admin1,
    country: place.country,
    countryCode: place.countryCode,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  };
}
