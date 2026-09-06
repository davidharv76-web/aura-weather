import { cn } from "@/lib/utils";
import type { SkyMood, WeatherGroup } from "@/lib/weather";
import { WeatherParticles } from "@/components/weather/WeatherParticles";

const MOOD_CLASS: Record<SkyMood, string> = {
  dawn: "sky-dawn",
  day: "sky-day",
  dusk: "sky-dusk",
  night: "sky-night",
  storm: "sky-storm",
};

export function SkyBackdrop({
  mood = "dawn",
  weatherGroup,
}: {
  mood?: SkyMood;
  weatherGroup?: WeatherGroup | undefined;
}) {
  return (
    <div className={cn("pointer-events-none fixed inset-0 -z-10", MOOD_CLASS[mood])} aria-hidden>
      <div
        className="absolute inset-0 transition-[background] duration-1000"
        style={{
          background:
            "linear-gradient(180deg, var(--sky-top) 0%, var(--sky-mid) 52%, var(--sky-low) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[70vh]"
        style={{
          background: "radial-gradient(120% 90% at 50% 118%, var(--sky-glow) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute left-1/2 top-[8%] h-[42vw] w-[42vw] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--gold) 26%, transparent) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-soft-light"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--cream) 60%, transparent) 0.5px, transparent 0.6px)",
          backgroundSize: "3px 3px",
        }}
      />
      <WeatherParticles mood={mood} weatherGroup={weatherGroup} />
    </div>
  );
}
