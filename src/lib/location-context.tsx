import { useNavigate, useSearch } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { DEFAULT_PLACE, type GeoPlace, type Units } from "./weather";

export const locationSearchSchema = z.object({
  lat: z.coerce.number().optional(),
  lon: z.coerce.number().optional(),
  place: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
});

export type LocationSearch = z.infer<typeof locationSearchSchema>;

export function validateLocationSearch(search: Record<string, unknown>): LocationSearch {
  return locationSearchSchema.parse(search);
}

const RECENTS_KEY = "dawncast.recents";
const UNITS_KEY = "dawncast.units";

type Ctx = {
  place: GeoPlace;
  setPlace: (place: GeoPlace) => void;
  recents: GeoPlace[];
  units: Units;
  setUnits: (units: Units) => void;
};

const LocationContext = createContext<Ctx | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const search = useSearch({ strict: false }) as LocationSearch;
  const navigate = useNavigate();
  const [recents, setRecents] = useState<GeoPlace[]>([]);
  const [units, setUnitsState] = useState<Units>("metric");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw) as GeoPlace[]);
      const u = localStorage.getItem(UNITS_KEY);
      if (u === "metric" || u === "imperial") setUnitsState(u);
    } catch {
      // ignore unreadable storage
    }
  }, []);

  const place: GeoPlace = useMemo(() => {
    if (typeof search.lat === "number" && typeof search.lon === "number" && search.place) {
      return {
        id: 0,
        name: search.place,
        admin1: search.region,
        country: search.country,
        latitude: search.lat,
        longitude: search.lon,
      };
    }
    return DEFAULT_PLACE;
  }, [search.lat, search.lon, search.place, search.region, search.country]);

  const setPlace = useCallback(
    (next: GeoPlace) => {
      setRecents((prev) => {
        const merged = [
          next,
          ...prev.filter(
            (p) =>
              Math.abs(p.latitude - next.latitude) > 0.01 ||
              Math.abs(p.longitude - next.longitude) > 0.01,
          ),
        ].slice(0, 6);
        try {
          localStorage.setItem(RECENTS_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        return merged;
      });
      void navigate({
        to: ".",
        search: {
          lat: Number(next.latitude.toFixed(4)),
          lon: Number(next.longitude.toFixed(4)),
          place: next.name,
          region: next.admin1,
          country: next.country,
        },
      });
    },
    [navigate],
  );

  const setUnits = useCallback((next: Units) => {
    setUnitsState(next);
    try {
      localStorage.setItem(UNITS_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ place, setPlace, recents, units, setUnits }),
    [place, setPlace, recents, units, setUnits],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationState() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationState must be used inside LocationProvider");
  return ctx;
}
