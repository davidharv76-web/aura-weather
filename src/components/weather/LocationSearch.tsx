import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MapPin, Navigation, Search, Users } from "lucide-react";
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
import { useLocationState } from "@/lib/location-context";
import { placeLabel, type GeoPlace } from "@/lib/weather";
import { reverseLookup, searchPlaces } from "@/lib/weather.functions";

export function LocationSearchButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass group flex items-center gap-2.5 rounded-full px-4 py-2 text-sm text-foreground/90 transition-colors hover:text-foreground"
      >
        <Search className="h-4 w-4 text-accent" />
        <span className="max-w-[42vw] truncate sm:max-w-none">{label}</span>
        <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </button>
      <LocationSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function LocationSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { setPlace, recents } = useLocationState();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [locating, setLocating] = useState(false);
  const runSearch = useServerFn(searchPlaces);
  const runReverse = useServerFn(reverseLookup);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(t);
  }, [term]);

  const results = useQuery({
    queryKey: ["places", debounced],
    queryFn: () => runSearch({ data: { query: debounced } }),
    enabled: debounced.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
  });

  const choose = (place: GeoPlace) => {
    setPlace(place);
    onOpenChange(false);
    setTerm("");
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const place = await runReverse({
            data: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          });
          choose(place);
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 10000 },
    );
  };

  const list = results.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Search locations</DialogTitle>
        <Command shouldFilter={false} className="bg-transparent">
          <CommandInput
            placeholder="Search any city, town or airport…"
            value={term}
            onValueChange={setTerm}
          />
          <CommandList className="max-h-[60vh]">
            <CommandGroup>
              <CommandItem onSelect={useMyLocation} value="__geo">
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                ) : (
                  <Navigation className="h-4 w-4 text-accent" />
                )}
                <span>Use my current location</span>
              </CommandItem>
            </CommandGroup>

            {debounced.trim().length >= 2 && (
              <CommandGroup heading={results.isFetching ? "Searching…" : "Results"}>
                {list.map((place) => (
                  <CommandItem
                    key={`${place.id}-${place.latitude}-${place.longitude}`}
                    value={`${place.id}-${place.name}`}
                    onSelect={() => choose(place)}
                  >
                    <span className="w-6 text-base" aria-hidden="true">
                      {place.countryCode ? countryFlag(place.countryCode) : "•"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{placeLabel(place)}</span>
                      {place.population !== undefined && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {formatPopulation(place.population)}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
                {!results.isFetching && list.length === 0 && (
                  <CommandEmpty>No places found.</CommandEmpty>
                )}
              </CommandGroup>
            )}

            {recents.length > 0 && (
              <CommandGroup heading="Recent">
                {recents.map((place) => (
                  <CommandItem
                    key={`r-${place.latitude}-${place.longitude}`}
                    value={`recent-${place.name}-${place.latitude}`}
                    onSelect={() => choose(place)}
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{placeLabel(place)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function countryFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
}

function formatPopulation(population: number) {
  return `${new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(population)} people`;
}

export function GeolocateButton() {
  const { setPlace } = useLocationState();
  const [busy, setBusy] = useState(false);
  const runReverse = useServerFn(reverseLookup);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="rounded-full text-foreground/85 hover:bg-secondary hover:text-foreground"
      onClick={() => {
        if (!navigator.geolocation) return;
        setBusy(true);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              setPlace(
                await runReverse({
                  data: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
                }),
              );
            } finally {
              setBusy(false);
            }
          },
          () => setBusy(false),
          { timeout: 10000 },
        );
      }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
      <span className="hidden sm:inline">My location</span>
    </Button>
  );
}
