import type { ComponentType } from "react";
import { useEffect, useState } from "react";

import type { GeoPlace, Units } from "@/lib/weather";

type RadarMapProps = {
  place: GeoPlace;
  units: Units;
};

export function RadarClient(props: RadarMapProps) {
  const [MapComponent, setMapComponent] = useState<ComponentType<RadarMapProps> | null>(null);

  useEffect(() => {
    let mounted = true;

    void import("./SatelliteViewer").then((module) => {
      if (mounted) setMapComponent(() => module.SatelliteViewer);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!MapComponent) {
    return (
      <div className="glass flex h-[62vh] min-h-[28rem] items-center justify-center rounded-3xl">
        <div className="text-center">
          <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Preparing the weather map…</p>
        </div>
      </div>
    );
  }

  return <MapComponent {...props} />;
}
