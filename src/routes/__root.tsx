import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import appCss from "../styles.css?url";

// High-Performance React Wrapper for Adsterra Native Code
export function AdsterraNativeBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure this runs only on the client side and prevents double injection during hot-reloads
    if (typeof window !== "undefined" && containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = "https://pl29648714.effectivecpmnetwork.com/46e771d64f01e5c83ee164e89bb14e82/invoke.js";
      
      // Appending directly to the container guarantees the target div exists when the script evaluates
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-6 overflow-hidden min-h-[100px] px-4">
      {/* The script expects this specific container ID right next to it */}
      <div 
        ref={containerRef}
        id="container-46e771d64f01e5c83ee164e89bb14e82" 
        className="w-full max-w-4xl mx-auto" 
      />
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AYTA NEWS — عيتا نيوز" },
      { name: "description", content: "عيتا نيوز — آخر الأخبار والتطورات المحلية والعالمية على مدار الساعة." },
      { property: "og:title", content: "AYTA NEWS — عيتا نيوز" },
      { property: "og:description", content: "عيتا نيوز — آخر الأخبار والتطورات المحلية والعالمية على مدار الساعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "AYTA NEWS — عيتا نيوز" },
      { name: "twitter:description", content: "عيتا نيوز — آخر الأخبار والتطورات المحلية والعالمية على مدار الساعة." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      {/* Renders the ad layout perfectly at the footer of all route paths */}
      <AdsterraNativeBanner />
    </QueryClientProvider>
  );
}
