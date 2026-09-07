import { Outlet, ScrollRestoration, createRootRoute } from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/start";
import { useEffect, useState } from "react";
import { LocationProvider } from "@/lib/location-context";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="en">
      <head>
        <Meta />
      </head>
      <body>
        <LocationProvider>
          {mounted ? <Outlet /> : null}
        </LocationProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
