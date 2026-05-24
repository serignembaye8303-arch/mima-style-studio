import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Heart } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts } from "@/lib/products";
import { CATEGORIES } from "@/lib/format";
import hero from "@/assets/hero-mima.jpg";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { data: featured = [] } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => fetchProducts({ featured: true }),
  });
  const { data: latest = [] } = useQuery({
    queryKey: ["products", "latest"],
    queryFn: () => fetchProducts(),
  });

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-[80vh]">
          <div className="flex items-center px-6 sm:px-12 lg:px-20 py-20 order-2 lg:order-1 gradient-luxe">
            <div className="max-w-md animate-fade-up">
              <p className="tracking-luxe text-xs text-gold">Nouvelle collection</p>
              <h1 className="mt-5 font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95]">
                L'élégance,<br /><em className="text-rose-deep" style={{ color: "var(--rose-deep)" }}>une signature</em>.
              </h1>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                Robes, ensembles, sacs, accessoires — la sélection Mima pour la femme qui sait ce qu'elle veut.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/boutique" className="group inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 tracking-luxe text-xs hover:bg-foreground/90 transition-colors">
                  Découvrir <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/boutique" search={{ category: "robes" }} className="inline-flex items-center px-8 py-4 tracking-luxe text-xs border-b border-foreground">
                  Les robes
                </Link>
              </div>
              <div className="mt-12 flex items-center gap-2 text-[10px] tracking-luxe text-muted-foreground">
                <span>Style</span><span className="text-gold">·</span><span>Élégance</span><span className="text-gold">·</span><span>Confiance</span>
              </div>
            </div>
          </div>
          <div className="relative order-1 lg:order-2 min-h-[420px]">
            <img src={hero} alt="Collection Mima Boutique" className="absolute inset-0 h-full w-full object-cover" width={1600} height={1280} />
            <div className="absolute inset-0 bg-gradient-to-tr from-foreground/20 via-transparent to-transparent" />
          </div>
        </div>

        {/* Marquee */}
        <div className="border-y border-border overflow-hidden bg-background">
          <div className="flex whitespace-nowrap animate-marquee py-3 text-[10px] tracking-luxe">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex shrink-0">
                {["Livraison rapide", "Commande WhatsApp", "Paiement à la livraison", "Pièces exclusives", "Service sur mesure"].map((t) => (
                  <span key={t + k} className="px-8 flex items-center gap-3"><Sparkles className="h-3 w-3 text-gold" />{t}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="tracking-luxe text-[10px] text-gold">Univers</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Explorer par catégorie</h2>
          </div>
          <Link to="/boutique" className="hidden sm:inline-flex tracking-luxe text-xs border-b border-foreground pb-1">Tout voir</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-5">
          {CATEGORIES.map((c, i) => {
            const sample = latest.find((p) => p.category === c.slug);
            return (
              <Link key={c.slug} to="/boutique" search={{ category: c.slug }} className="group relative aspect-[3/4] overflow-hidden bg-secondary">
                {sample && <img src={sample.images[0]} alt={c.label} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                <div className="absolute bottom-4 left-4 text-background">
                  <p className="tracking-luxe text-[9px] text-gold">0{i + 1}</p>
                  <p className="font-display text-xl">{c.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <p className="tracking-luxe text-[10px] text-gold">Sélection</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">Coups de cœur</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
          {featured.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* TRUST */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid sm:grid-cols-3 gap-8 border-y border-border py-12">
          {[
            { icon: Truck, t: "Livraison rapide", d: "Dakar 24h · International 3-7j" },
            { icon: ShieldCheck, t: "Paiement sécurisé", d: "À la livraison ou WhatsApp" },
            { icon: Heart, t: "Service sur mesure", d: "Conseils stylistes dédiés" },
          ].map((x) => (
            <div key={x.t} className="flex items-start gap-4">
              <x.icon className="h-6 w-6 text-gold mt-1" strokeWidth={1.2} />
              <div>
                <h3 className="font-display text-xl">{x.t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{x.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEW COLLECTION */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="tracking-luxe text-[10px] text-gold">Nouveautés</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Tout juste arrivés</h2>
          </div>
          <Link to="/boutique" className="hidden sm:inline-flex tracking-luxe text-xs border-b border-foreground pb-1">Toute la boutique</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
          {latest.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </SiteLayout>
  );
}
