import { Link, useSearch } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { GeolocateButton, LocationSearchButton } from "@/components/weather/LocationSearch";
import { ProSubscriptionModal } from "@/components/weather/ProSubscriptionModal";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLocationState } from "@/lib/location-context";
import { placeLabel } from "@/lib/weather";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Today" },
  { to: "/hourly", label: "Hourly" },
  { to: "/daily", label: "14 days" },
  { to: "/air-quality", label: "Air" },
  { to: "/surf", label: "Surf" },
  { to: "/radar", label: "Satellite" },
  { to: "/search", label: "Places" },
  { to: "/compare", label: "Compare" },
] as const;

export function SiteHeader() {
  const { place, units, setUnits } = useLocationState();
  const search = useSearch({ strict: false });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-4 sm:px-8">
        <Link to="/" search={search} className="mr-1 flex items-baseline gap-1.5">
          <span className="font-display text-xl tracking-tight text-foreground">Dawncast</span>
          <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-coral" />
        </Link>

        <nav className="glass hidden items-center gap-1 rounded-full p-1 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              search={search}
              activeOptions={{ exact: item.to === "/" }}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm text-foreground/70 transition-colors hover:text-foreground",
              )}
              activeProps={{
                className: "bg-cream/90 text-ink hover:text-ink shadow-sm",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="glass hidden items-center rounded-full p-0.5 md:flex">
            {(["metric", "imperial"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnits(u)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-colors",
                  units === u ? "bg-cream/90 text-ink" : "text-foreground/70 hover:text-foreground",
                )}
              >
                {u === "metric" ? "°C" : "°F"}
              </button>
            ))}
          </div>
          <ProSubscriptionModal />
          <GeolocateButton />
          <LocationSearchButton label={placeLabel(place)} />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="glass rounded-full xl:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="glass-strong border-border bg-night/95 p-6">
              <SheetTitle className="font-display text-2xl">Dawncast</SheetTitle>
              <nav className="mt-8 flex flex-col gap-2">
                {NAV.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to}
                      search={search}
                      activeOptions={{ exact: item.to === "/" }}
                      className="rounded-2xl px-4 py-3 text-base text-foreground/75 hover:bg-cream/10 hover:text-foreground"
                      activeProps={{ className: "bg-cream/12 text-accent" }}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
