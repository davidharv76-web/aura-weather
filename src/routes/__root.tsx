import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { LocationProvider } from "../lib/location-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { to: "/", label: "Today" },
  { to: "/hourly", label: "Hourly" },
  { to: "/daily", label: "14 days" },
  { to: "/air-quality", label: "Air" },
  { to: "/surf", label: "Surf" },
  { to: "/radar", label: "Satellite" },
  { to: "/places", label: "Places" },
] as const;

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dawncast — Premium Weather Forecasts" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: NotFoundComponent,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = router.subscribe("onBeforeLoad", () => {
      // route transitions
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <LocationProvider>
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-6">
                  <Link to="/" className="flex items-center space-x-2 font-bold">
                    <span>Dawncast</span>
                  </Link>
                  <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
                    {NAV.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="transition-colors hover:text-foreground/80 text-foreground/60"
                        activeProps={{ className: "text-foreground font-semibold" }}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </header>

            <main className="flex-1">{children}</main>
          </div>
        </LocationProvider>
        <Scripts />
      </body>
    </html>
  );
}
