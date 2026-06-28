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
import ansemLogo from "@/assets/ansem-logo.jpg.asset.json";
// Wallet adapter base styles, vendored into src/wallet-adapter.css. The
// package's own styles.css starts with a remote Google Fonts @import that
// lightningcss can't resolve (the old "Vite 500 CSS error"), so we keep a
// copy without it. Without these styles the wallet modal renders unstyled
// and locks page scroll, freezing the whole app.
import walletAdapterCss from "../wallet-adapter.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SolanaProvider } from "@/components/SolanaProvider";
import { Toaster } from "@/components/ui/sonner";

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
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

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
      { title: "Ansem Land" },
      {
        name: "description",
        content:
          "A cozy multiplayer farming game on Solana. Plant crops, level up, and grow your land right in the browser. Open beta.",
      },
      { property: "og:title", content: "Ansem Land" },
      {
        property: "og:description",
        content:
          "A cozy multiplayer farming game on Solana. Plant crops, level up, and grow your land right in the browser. Open beta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Ansem Land" },
      {
        name: "twitter:description",
        content:
          "A cozy multiplayer farming game on Solana. Plant crops, level up, and grow your land right in the browser. Open beta.",
      },
      {
        property: "og:image",
        content: ansemLogo.url,
      },
      {
        name: "twitter:image",
        content: ansemLogo.url,
      },
      { name: "description", content: "Claim a field, plant a seed, and grow your farm." },
      {
        property: "og:description",
        content: "Ansem Land is a relaxing multiplayer Solana farming.",
      },
      {
        name: "twitter:description",
        content: "Ansem Land is a relaxing multiplayer Solana farming.",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/a38c539f-9bc4-44f5-9bf4-7dddced36b8c",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/a38c539f-9bc4-44f5-9bf4-7dddced36b8c",
      },
      { property: "og:description", content: "Claim a field, plant a seed, and grow your farm." },
      { name: "twitter:description", content: "Claim a field, plant a seed, and grow your farm." },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/78f968d6-2833-4f25-95c1-bc743a79bb36",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/78f968d6-2833-4f25-95c1-bc743a79bb36",
      },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d8a5ca54-7880-4815-9666-5a8fca31353a/id-preview-d7df4c1b--003f58c1-4f49-4fb2-937c-f878eee3fbf6.lovable.app-1782651420040.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d8a5ca54-7880-4815-9666-5a8fca31353a/id-preview-d7df4c1b--003f58c1-4f49-4fb2-937c-f878eee3fbf6.lovable.app-1782651420040.png" },
    ],
    links: [
      { rel: "icon", type: "image/jpeg", href: ansemLogo.url },
      { rel: "apple-touch-icon", href: ansemLogo.url },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@400;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: walletAdapterCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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
      <SolanaProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </SolanaProvider>
    </QueryClientProvider>
  );
}
