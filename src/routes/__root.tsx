import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LocationProvider } from "@/lib/location-context";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <LocationProvider>
      {mounted ? <Outlet /> : null}
    </LocationProvider>
  );
}
