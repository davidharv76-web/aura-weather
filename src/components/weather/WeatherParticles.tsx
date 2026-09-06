import { useEffect, useRef } from "react";

import type { SkyMood, WeatherGroup } from "@/lib/weather";

type ParticleKind = "rain" | "snow" | "rays" | "mist" | "stars" | "dust";

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
  phase: number;
};

type WeatherParticlesProps = {
  mood: SkyMood;
  weatherGroup?: WeatherGroup | undefined;
};

function getParticleKind(mood: SkyMood, group?: WeatherGroup): ParticleKind {
  if (group === "snow") return "snow";
  if (group === "rain" || group === "drizzle" || group === "storm") return "rain";
  if (mood === "night") return "stars";
  if (group === "fog" || group === "cloud") return "mist";
  if (group === "clear" && (mood === "day" || mood === "dawn" || mood === "dusk")) {
    return "rays";
  }
  return "dust";
}

function particleCount(kind: ParticleKind, width: number) {
  const scale = Math.min(1.5, Math.max(0.7, width / 1100));
  const counts: Record<ParticleKind, number> = {
    rain: 72,
    snow: 52,
    rays: 18,
    mist: 12,
    stars: 46,
    dust: 22,
  };
  return Math.round(counts[kind] * scale);
}

function makeParticles(kind: ParticleKind, width: number, height: number): Particle[] {
  return Array.from({ length: particleCount(kind, width) }, (_, index) => {
    const seed = (index * 9301 + 49297) % 233280;
    const random = seed / 233280;
    const secondary = ((seed * 37 + 17) % 233280) / 233280;

    return {
      x: random * width,
      y: secondary * height,
      size:
        kind === "rain" ? 8 + random * 16 : kind === "mist" ? 90 + random * 180 : 1 + random * 2.8,
      speed:
        kind === "rain" ? 280 + random * 260 : kind === "snow" ? 18 + random * 30 : 4 + random * 10,
      drift: (secondary - 0.5) * (kind === "snow" ? 24 : 10),
      opacity: 0.08 + random * (kind === "stars" ? 0.34 : 0.2),
      phase: random * Math.PI * 2,
    };
  });
}

export function WeatherParticles({ mood, weatherGroup }: WeatherParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const kind = getParticleKind(mood, weatherGroup);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let animationFrame = 0;
    let previousTime = performance.now();
    let visible = !document.hidden;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      particles = makeParticles(kind, width, height);
    };

    const wrap = (particle: Particle) => {
      if (particle.y > height + particle.size) {
        particle.y = -particle.size;
        particle.x = (particle.x + width * 0.37) % width;
      }
      if (particle.x > width + particle.size) particle.x = -particle.size;
      if (particle.x < -particle.size) particle.x = width + particle.size;
    };

    const draw = (time: number) => {
      const delta = Math.min(0.034, Math.max(0, (time - previousTime) / 1000));
      previousTime = time;
      context.clearRect(0, 0, width, height);

      if (kind === "rays") {
        const glow = context.createRadialGradient(
          width * 0.52,
          0,
          0,
          width * 0.52,
          0,
          width * 0.75,
        );
        glow.addColorStop(0, "rgba(255, 229, 154, 0.13)");
        glow.addColorStop(1, "rgba(255, 229, 154, 0)");
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);
      }

      for (const particle of particles) {
        const pulse = 0.72 + Math.sin(time * 0.0007 + particle.phase) * 0.28;

        if (kind === "rain") {
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(particle.x - particle.size * 0.22, particle.y + particle.size);
          context.strokeStyle = `rgba(226, 236, 255, ${particle.opacity})`;
          context.lineWidth = Math.max(0.65, particle.size / 18);
          context.stroke();
          particle.x -= particle.speed * 0.08 * delta;
          particle.y += particle.speed * delta;
        } else if (kind === "snow") {
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fillStyle = `rgba(255, 249, 238, ${particle.opacity * pulse})`;
          context.fill();
          particle.x += (particle.drift + Math.sin(time * 0.001 + particle.phase) * 10) * delta;
          particle.y += particle.speed * delta;
        } else if (kind === "mist") {
          const gradient = context.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.size,
          );
          gradient.addColorStop(0, `rgba(255, 247, 236, ${particle.opacity * 0.2})`);
          gradient.addColorStop(1, "rgba(255, 247, 236, 0)");
          context.fillStyle = gradient;
          context.fillRect(
            particle.x - particle.size,
            particle.y - particle.size * 0.28,
            particle.size * 2,
            particle.size * 0.56,
          );
          particle.x += particle.speed * delta;
        } else {
          const isRay = kind === "rays";
          const radius = isRay ? particle.size * 1.5 : particle.size;
          context.beginPath();
          context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
          context.fillStyle = isRay
            ? `rgba(255, 225, 145, ${particle.opacity * pulse})`
            : kind === "stars"
              ? `rgba(255, 247, 224, ${particle.opacity * pulse})`
              : `rgba(255, 237, 196, ${particle.opacity * 0.55 * pulse})`;
          context.fill();
          particle.x += particle.drift * delta;
          particle.y += particle.speed * delta;
        }

        wrap(particle);
      }

      if (visible && !reducedMotion) animationFrame = requestAnimationFrame(draw);
    };

    const onVisibilityChange = () => {
      visible = !document.hidden;
      cancelAnimationFrame(animationFrame);
      if (visible && !reducedMotion) {
        previousTime = performance.now();
        animationFrame = requestAnimationFrame(draw);
      }
    };

    resize();
    draw(previousTime);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [mood, weatherGroup]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-80"
      aria-hidden="true"
    />
  );
}
