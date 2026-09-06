import React from "react";
import { useLocationState } from "@/lib/location-context";

interface PageFrameProps {
  children: (data: { forecast: any; air: any }) => React.ReactNode;
}

export function PageFrame({ children }: PageFrameProps) {
  const { forecast, air } = useLocationState();

  // If forecast isn't ready yet, pass an empty structure rather than blocking children
  const activeForecast = forecast ?? {
    current: null,
    hourly: [],
    daily: [],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {children({ forecast: activeForecast, air })}
    </div>
  );
}
