import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CloudRain, Loader2, MapPin, Plus, Search, Wind } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { WeatherGlyph } from "@/components/weather/WeatherGlyph";
import { useWeatherForPlace } from "@/lib/use-weather";
import {
  describeCode,
  FEATURED_PLACES,
  formatSpeed,
  formatTemp,
  placeLabel,
  type GeoPlace,
  type Units,
} from "@/lib/weather";
import { searchPlaces } from "@/lib/weather.functions";

export function CompareLocations({
  currentPlace,
  units,
}: {
  currentPlace: GeoPlace;
  units: Units;
}) {
  const [places, setPlaces] = useState<[GeoPlace, GeoPlace, GeoPlace]>(() =>
    initialPlaces(currentPlace),
  );
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  useEffect(() => {
    setPlaces((existing) => {
      const remaining = existing.slice(1).filter((place) => !samePlace(place, currentPlace));
      const fillers = FEATURED_PLACES.filter(
        (place) =>
          !samePlace(place, currentPlace) && !remaining.some((item) => samePlace(item, place)),
      );
      return [currentPlace, remaining[0] ?? fillers[0]!, remaining[1] ?? fillers[1]!];
    });
  }, [currentPlace]);

  const replacePlace = (place: GeoPlace) => {
    if (editingSlot === null) return;
    setPlaces((existing) => {
      const next = [...existing] as [GeoPlace, GeoPlace, GeoPlace];
      next[editingSlot] = place;
      return next;
    });
    setEditingSlot(null);
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {places.map((place, index) => (
          <CompareCityCard
            key={`${index}-${place.latitude}-${place.longitude}`}
            place={place}
            units={units}
            onChange={() => setEditingSlot(index)}
          />
        ))}
      </div>
      <CompareLocationDialog
        open={editingSlot !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSlot(null);
        }}
        onPick={replacePlace}
        excluded={places}
      />
    </>
  );
}

function CompareCityCard({
  place,
  units,
  onChange,
}: {
  place: GeoPlace;
  units: Units;
  onChange: () => void;
}) {
  const query = useWeatherForPlace(place);

  if (query.isPending) {
    return (
      <article className="glass flex min-h-[28rem] items-center justify-center rounded-3xl">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-label="Loading forecast" />
      </article>
    );
  }

  if (query.isError || !query.data) {
    return (
      <article className="glass flex min-h-[28rem] flex-col items-center justify-center rounded-3xl p-6 text-center">
        <p className="text-sm text-foreground/80">This forecast could not be loaded.</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={onChange}>
          Choose another city
        </Button>
      </article>
    );
  }

  const { forecast } = query.data;
  const current = forecast.current;
  const today = forecast.daily[0]!;
  const condition = describeCode(current.weatherCode);
  const nextDays = forecast.daily.slice(1, 4);

  return (
    <article className="glass overflow-hidden rounded-3xl">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-accent">Current</p>
            <h2 className="mt-1 text-2xl">{place.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {[place.admin1, place.country].filter(Boolean).join(", ")}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="rounded-full" onClick={onChange}>
            <Search className="h-4 w-4" /> Change
          </Button>
        </div>

        <div className="mt-8 flex items-start justify-between gap-4">
          <p className="tabular text-gradient-dawn font-display text-6xl leading-none">
            {formatTemp(current.temperature, units)}
          </p>
          <WeatherGlyph
            group={condition.group}
            isDay={current.isDay}
            className="h-14 w-14 text-cream"
          />
        </div>
        <p className="mt-4 text-base text-foreground/90">{condition.label}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          High {formatTemp(today.tempMax, units)} · Low {formatTemp(today.tempMin, units)} · Feels{" "}
          {formatTemp(current.apparentTemperature, units)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Metric
            icon={CloudRain}
            label="Rain"
            value={`${Math.round(today.precipitationProbabilityMax)}%`}
          />
          <Metric icon={Wind} label="Wind" value={formatSpeed(current.windSpeed, units)} />
        </div>
      </div>

      <div className="grid grid-cols-3 border-t border-border bg-cream/[0.035]">
        {nextDays.map((day) => {
          const date = new Date(`${day.date}T12:00:00Z`);
          const label = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
          const info = describeCode(day.weatherCode);
          return (
            <div
              key={day.date}
              className="border-r border-border px-2 py-4 text-center last:border-r-0"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <WeatherGlyph group={info.group} className="mx-auto my-2 h-7 w-7 text-cream" />
              <p className="tabular text-sm font-semibold">
                {formatTemp(day.tempMax, units)} / {formatTemp(day.tempMin, units)}
              </p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Wind; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream/[0.055] p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-accent" /> {label}
      </p>
      <p className="tabular mt-1.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

function CompareLocationDialog({
  open,
  onOpenChange,
  onPick,
  excluded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (place: GeoPlace) => void;
  excluded: GeoPlace[];
}) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const runSearch = useServerFn(searchPlaces);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 250);
    return () => window.clearTimeout(timer);
  }, [term]);

  const query = useQuery({
    queryKey: ["compare-places", debounced],
    queryFn: () => runSearch({ data: { query: debounced } }),
    enabled: open && debounced.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
  });

  const isExcluded = (place: GeoPlace) => excluded.some((item) => samePlace(item, place));
  const choose = (place: GeoPlace) => {
    if (isExcluded(place)) return;
    onPick(place);
    setTerm("");
  };
  const results = debounced.trim().length >= 2 ? (query.data ?? []) : FEATURED_PLACES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Choose a city to compare</DialogTitle>
        <Command shouldFilter={false} className="bg-transparent">
          <CommandInput
            placeholder="Search any city, town or airport…"
            value={term}
            onValueChange={setTerm}
          />
          <CommandList className="max-h-[60vh]">
            <CommandGroup
              heading={debounced.trim().length >= 2 ? "Search results" : "Popular cities"}
            >
              {results.map((place) => {
                const disabled = isExcluded(place);
                return (
                  <CommandItem
                    key={`${place.id}-${place.latitude}-${place.longitude}`}
                    value={`${place.id}-${place.name}`}
                    disabled={disabled}
                    onSelect={() => choose(place)}
                  >
                    {disabled ? (
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <MapPin className="h-4 w-4 text-coral" />
                    )}
                    <span className="truncate">{placeLabel(place)}</span>
                    {disabled && (
                      <span className="ml-auto text-xs text-muted-foreground">Added</span>
                    )}
                  </CommandItem>
                );
              })}
              {!query.isFetching && results.length === 0 && (
                <CommandEmpty>No places found.</CommandEmpty>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function initialPlaces(currentPlace: GeoPlace): [GeoPlace, GeoPlace, GeoPlace] {
  const alternatives = FEATURED_PLACES.filter((place) => !samePlace(place, currentPlace));
  return [currentPlace, alternatives[0]!, alternatives[1]!];
}

function samePlace(first: GeoPlace, second: GeoPlace) {
  return (
    Math.abs(first.latitude - second.latitude) < 0.01 &&
    Math.abs(first.longitude - second.longitude) < 0.01
  );
}
