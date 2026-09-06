import { createFileRoute } from "@tanstack/react-router";

import { PageFrame } from "@/components/weather/PageFrame";
import { SurfCheck } from "@/components/weather/SurfCheck";
import { useLocationState, validateLocationSearch } from "@/lib/location-context";

export const Route = createFileRoute("/surf")({
  validateSearch: validateLocationSearch,
  head: () => ({
    meta: [
      { title: "Global Surf & Swell — Dawncast" },
      {
        name: "description",
        content:
          "Live wave height, primary swell, wind waves, water temperature and sea-level trends for renowned surf breaks.",
      },
    ],
    links: [{ rel: "canonical", href: "/surf" }],
  }),
  component: SurfPage,
});

function SurfPage() {
  const { units } = useLocationState();
  return (
    <PageFrame>
      {() => (
        <>
          <header className="pb-6 pt-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Open-Meteo Marine</p>
            <h1 className="mt-2 text-4xl sm:text-5xl">Surf & swell</h1>
            <p className="mt-3 max-w-2xl text-base text-foreground/85">
              Select a break to check primary swell, wind waves, water temperature and the next
              seven days.
            </p>
          </header>
          <SurfCheck units={units} />
        </>
      )}
    </PageFrame>
  );
}
