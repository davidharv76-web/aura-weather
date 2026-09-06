import { Outlet, createRootRoute } from "@tanstack/react-router";
import { LocationProvider } from "@/lib/location-context";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <LocationProvider>
      <Outlet />
    </LocationProvider>
  );
}
