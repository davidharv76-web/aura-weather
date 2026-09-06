import type { ComponentType } from "react";
import { useEffect, useState } from "react";

import type { SurfSpot } from "@/lib/marine";

type Props = { spots: SurfSpot[]; selected: SurfSpot; onSelect: (spot: SurfSpot) => void };

export function SurfMapClient(props: Props) {
  const [Map, setMap] = useState<ComponentType<Props> | null>(null);
  useEffect(() => {
    let mounted = true;
    void import("./SurfSpotMap").then((module) => {
      if (mounted) setMap(() => module.SurfSpotMap);
    });
    return () => {
      mounted = false;
    };
  }, []);
  if (!Map)
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading surf map…
      </div>
    );
  return <Map {...props} />;
}
