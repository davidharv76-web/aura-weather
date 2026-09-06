import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Loader2, MapPin, Search as SearchIcon, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GeolocateButton } from "@/components/weather/LocationSearch";
import { SectionHeading } from "@/components/weather/MetricTile";
import { PageFrame } from "@/components/weather/PageFrame";
import { Input } from "@/components/ui/input";
import { useLocationState, validateLocationSearch } from "@/lib/location-context";
import { placeLabel, type GeoPlace } from "@/lib/weather";
import { searchPlaces } from "@/lib/weather.functions";

export const Route = createFileRoute("/search")({
  validateSearch: validateLocationSearch,
  head: () => ({
    meta: [
      { title: "Global Place Search — Dawncast" },
      {
        name: "description",
        content:
          "Search cities, towns and coastal locations worldwide with live Open-Meteo geocoding.",
      },
      { property: "og:title", content: "Global Place Search — Dawncast" },
      {
        property: "og:description",
        content: "Find any city, town or coastal location and open its live forecast.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { setPlace, recents, place } = useLocationState();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const runSearch = useServerFn(searchPlaces);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term.trim()), 220);
    return () => window.clearTimeout(timer);
  }, [term]);

  const results = useQuery({
    queryKey: ["global-place-search", debounced],
    queryFn: () => runSearch({ data: { query: debounced } }),
    enabled: debounced.length >= 2,
    staleTime: 10 * 60 * 1000,
  });

  const choose = (next: GeoPlace) => {
    setPlace(next);
    setTerm("");
    inputRef.current?.focus();
  };

  return (
    <PageFrame>
      {() => (
        <>
          <header className="pt-8">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent">
              Currently {placeLabel(place)}
            </p>
            <h1 className="mt-2 text-4xl sm:text-5xl">Search the world</h1>
            <p className="mt-3 max-w-2xl text-base text-foreground/85">
              Find any city, town or coastal location. Results update as you type and include
              regional and population context.
            </p>
          </header>

          <section
            className="glass-strong mt-7 rounded-3xl p-4 sm:p-6"
            aria-label="Global location search"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <SearchIcon
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-accent"
                  aria-hidden="true"
                />
                <Input
                  ref={inputRef}
                  autoFocus
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="Try Cape Town, Ericeira or Shonan…"
                  className="h-13 rounded-2xl border-border bg-cream/[0.06] pl-12 text-base"
                  aria-label="Search city, town or coastal spot"
                />
                {results.isFetching && (
                  <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent" />
                )}
              </div>
              <GeolocateButton />
            </div>

            {debounced.length >= 2 && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2" aria-live="polite">
                {(results.data ?? []).map((result) => (
                  <PlaceResult
                    key={`${result.id}-${result.latitude}`}
                    place={result}
                    onPick={choose}
                  />
                ))}
                {!results.isFetching && !results.isError && results.data?.length === 0 && (
                  <p className="col-span-full rounded-2xl border border-border p-5 text-sm text-muted-foreground">
                    No matching places found. Try a nearby town or a broader spelling.
                  </p>
                )}
                {results.isError && (
                  <p className="col-span-full rounded-2xl border border-coral/40 bg-coral/10 p-5 text-sm">
                    Global search is temporarily unavailable. Please try again.
                  </p>
                )}
              </div>
            )}
          </section>

          {recents.length > 0 && (
            <section className="mt-12">
              <SectionHeading eyebrow="History" title="Recently viewed" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recents.map((recent) => (
                  <PlaceResult
                    key={`${recent.latitude}-${recent.longitude}`}
                    place={recent}
                    onPick={choose}
                    icon={Clock}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PageFrame>
  );
}

function PlaceResult({
  place,
  onPick,
  icon: Icon = MapPin,
}: {
  place: GeoPlace;
  onPick: (place: GeoPlace) => void;
  icon?: typeof MapPin;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(place)}
      className="group flex min-w-0 items-center gap-4 rounded-2xl border border-border bg-cream/[0.04] p-4 text-left transition hover:-translate-y-0.5 hover:bg-cream/10"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream/10 text-xl"
        aria-hidden="true"
      >
        {place.countryCode ? (
          countryFlag(place.countryCode)
        ) : (
          <Icon className="h-5 w-5 text-accent" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold text-foreground">{place.name}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {[place.admin1, place.country].filter(Boolean).join(", ") ||
            `${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)}`}
        </span>
        {place.population !== undefined && (
          <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {new Intl.NumberFormat(undefined, {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(place.population)}{" "}
            people
          </span>
        )}
      </span>
      <MapPin className="h-4 w-4 shrink-0 text-accent opacity-60 transition group-hover:opacity-100" />
    </button>
  );
}

function countryFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
}
