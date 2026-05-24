import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="tracking-luxe text-xs text-gold">Mima Boutique</p>
        <h1 className="mt-4 text-7xl font-display">404</h1>
        <p className="mt-4 text-muted-foreground">Cette page s'est égarée dans le dressing.</p>
        <Link to="/" className="mt-6 inline-block tracking-luxe text-xs border-b border-foreground pb-1">
          Retour à la boutique
        </Link>
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
        <h1 className="text-2xl font-display">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-muted-foreground">Réessayez ou retournez à l'accueil.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="bg-primary text-primary-foreground px-5 py-2 text-xs tracking-luxe"
          >Réessayer</button>
          <a href="/" className="border border-foreground px-5 py-2 text-xs tracking-luxe">Accueil</a>
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
      { title: "Mima Boutique — Style · Élégance · Confiance" },
      { name: "description", content: "Mima Boutique : robes, ensembles, chaussures, sacs et accessoires. La mode féminine luxe, livrée chez vous." },
      { property: "og:title", content: "Mima Boutique — Style · Élégance · Confiance" },
      { property: "og:description", content: "Mima Boutique : robes, ensembles, chaussures, sacs et accessoires. La mode féminine luxe, livrée chez vous." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Mima Boutique — Style · Élégance · Confiance" },
      { name: "twitter:description", content: "Mima Boutique : robes, ensembles, chaussures, sacs et accessoires. La mode féminine luxe, livrée chez vous." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f8032ab5-e832-452b-a992-ce467271d0a3/id-preview-e7c06442--8d2508e2-65ad-4820-8510-7eba1bc002be.lovable.app-1779592889500.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f8032ab5-e832-452b-a992-ce467271d0a3/id-preview-e7c06442--8d2508e2-65ad-4820-8510-7eba1bc002be.lovable.app-1779592889500.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" },
      { rel: "icon", href: "/logo-mima.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Outlet />
          <Toaster position="top-center" theme="light" toastOptions={{ style: { fontFamily: 'var(--font-body)' } }} />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
