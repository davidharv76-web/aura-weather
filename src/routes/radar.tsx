import { createFileRoute } from "@tanstack/react-router";

import { PageFrame } from "@/components/weather/PageFrame";
import { RadarClient } from "@/components/weather/RadarClient";
import { useLocationState, validateLocationSearch } from "@/lib/location-context";
import { placeLabel } from "@/lib/weather";

export const Route = createFileRoute("/radar")({
  validateSearch: validateLocationSearch,
  head: () => ({
    meta: [
      { title: "Live Satellite & Weather Radar — Dawncast" },
      {
        name: "description",
        content:
          "Explore animated Doppler precipitation radar, infrared satellite clouds, visible cloud coverage and wind flow.",
      },
      { property: "og:title", content: "Live Weather Radar — Dawncast" },
      {
        property: "og:description",
        content: "Interactive rain radar, satellite cloud imagery and animated wind flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/radar" }],
  }),
  component: RadarPage,
});

function RadarPage() {
  const { place, units } = useLocationState();

  return (
    <PageFrame wide>
      {() => (
        <>
          <header className="pb-6 pt-6 sm:flex sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-accent">
                {placeLabel(place)}
              </p>
              <h1 className="mt-2 text-4xl sm:text-5xl">Satellite & radar</h1>
            </div>
            <p className="mt-3 max-w-md text-base text-foreground/85 sm:mt-0 sm:text-right">
              Track precipitation and storm fronts, inspect cloud cover, or follow animated wind
              flow.
            </p>
          </header>

          <RadarClient place={place} units={units} />
        </>
      )}
    </PageFrame>
  );
}
