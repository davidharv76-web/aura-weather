import { AlertTriangle, Loader2 } from "lucide-react";

import { SiteHeader } from "@/components/weather/SiteHeader";
import { SkyBackdrop } from "@/components/weather/SkyBackdrop";
import { describeCode, skyMood, type SkyMood, type WeatherBundle } from "@/lib/weather";
import { useWeatherQuery } from "@/lib/use-weather";
import { cn } from "@/lib/utils";

export function PageFrame({
  children,
  wide = false,
}: {
  children: (bundle: WeatherBundle) => React.ReactNode;
  wide?: boolean;
}) {
  const query = useWeatherQuery();
  const mood: SkyMood = query.data ? skyMood(query.data.forecast) : "dawn";
  const weatherGroup = query.data
    ? describeCode(query.data.forecast.current.weatherCode).group
    : undefined;

  return (
    <div className="min-h-screen">
      <SkyBackdrop mood={mood} weatherGroup={weatherGroup} />
      <SiteHeader />
      <main
        className={cn(
          "mx-auto w-full px-5 pb-24 pt-2 sm:px-8",
          wide ? "max-w-[1600px]" : "max-w-6xl",
        )}
      >
        {query.isPending && <FrameLoading />}
        {query.isError && (
          <FrameError message={(query.error as Error).message} onRetry={() => query.refetch()} />
        )}
        {query.data && children(query.data)}
      </main>
      <SiteFooter />
    </div>
  );
}

function FrameLoading() {
  return (
    <div className="space-y-4 pt-10">
      <div className="glass flex h-72 items-center justify-center rounded-3xl">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function FrameError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="glass mt-10 rounded-3xl p-8 text-center">
      <AlertTriangle className="mx-auto h-6 w-6 text-coral" />
      <h2 className="mt-3 text-xl">We couldn't reach the forecast service</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-5 pb-10 text-xs text-muted-foreground sm:px-8">
      <p>
        Dawncast · forecast data from Open-Meteo, refreshed hourly. Independent project, not
        affiliated with any weather network.
      </p>
    </footer>
  );
}
