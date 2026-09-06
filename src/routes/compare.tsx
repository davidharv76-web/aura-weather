import { createFileRoute } from "@tanstack/react-router";

import { CompareLocations } from "@/components/weather/CompareLocations";
import { PageFrame } from "@/components/weather/PageFrame";
import { useLocationState, validateLocationSearch } from "@/lib/location-context";

export const Route = createFileRoute("/compare")({
  validateSearch: validateLocationSearch,
  head: () => ({
    meta: [
      { title: "Compare City Weather — Dawncast" },
      {
        name: "description",
        content: "Compare current weather and short-range forecasts for three cities side by side.",
      },
      { property: "og:title", content: "Compare City Weather — Dawncast" },
      {
        property: "og:description",
        content: "Compare temperatures, rain and wind across three cities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/compare" }],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { place, units } = useLocationState();

  return (
    <PageFrame>
      {() => (
        <>
          <header className="pb-8 pt-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Three-city view</p>
            <h1 className="mt-2 text-4xl sm:text-5xl">Compare locations</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-foreground/85">
              Put three places side by side to compare current conditions and the next few days.
              Change any city without affecting your main forecast location.
            </p>
          </header>
          <CompareLocations currentPlace={place} units={units} />
        </>
      )}
    </PageFrame>
  );
}
