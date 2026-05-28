import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";
import { Package, ShoppingBag, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: fetchDashboardStats });

  return (
    <div className="space-y-8">
      <header>
        <p className="tracking-luxe text-[10px] text-gold">Tableau de bord</p>
        <h1 className="font-display text-3xl md:text-4xl mt-1">Bienvenue dans Mima Admin</h1>
        <p className="text-sm text-muted-foreground mt-2">Vue d'ensemble de l'activité de votre boutique en temps réel.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Revenus du jour" value={formatPrice(data?.revenueToday ?? 0)} icon={TrendingUp} accent />
        <Stat label="Revenus 7 jours" value={formatPrice(data?.revenueWeek ?? 0)} icon={TrendingUp} />
        <Stat label="Revenus 30 jours" value={formatPrice(data?.revenueMonth ?? 0)} icon={TrendingUp} />
        <Stat label="Commandes totales" value={String(data?.totalOrders ?? 0)} icon={Package} />
        <Stat label="Produits" value={String(data?.productsCount ?? 0)} icon={ShoppingBag} />
        <Stat label="Clients" value={String(data?.usersCount ?? 0)} icon={Users} />
        <Stat label="Stock faible" value={String(data?.lowStock?.length ?? 0)} icon={AlertTriangle} warn={!!data?.lowStock?.length} />
        <Stat label="Panier moyen" value={formatPrice(data?.totalOrders ? (data.revenueMonth / Math.max(1, data.totalOrders)) : 0)} icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-background rounded-lg border p-6">
          <h2 className="font-display text-xl mb-4">Revenus — 14 derniers jours</h2>
          {isLoading ? <div className="h-72 animate-pulse bg-muted rounded" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data?.chart ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--gold, 38 60% 55%))" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-background rounded-lg border p-6">
          <h2 className="font-display text-xl mb-4">Commandes / jour</h2>
          {isLoading ? <div className="h-72 animate-pulse bg-muted rounded" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.chart ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {data?.lowStock?.length ? (
        <div className="bg-background rounded-lg border p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Alertes stock faible</h2>
            <Link to="/admin/stock" className="text-xs tracking-luxe border-b border-foreground">Gérer →</Link>
          </div>
          <ul className="divide-y">
            {data.lowStock.slice(0, 6).map((p: any) => (
              <li key={p.id} className="py-3 flex justify-between text-sm"><span>{p.name}</span><span className="font-mono text-amber-600">{p.stock} restant</span></li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent, warn }: { label: string; value: string; icon: any; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-lg border p-5 transition-all hover:shadow-md ${accent ? "bg-foreground text-background" : "bg-background"} ${warn ? "border-amber-500/50" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-[11px] tracking-luxe uppercase ${accent ? "text-background/60" : "text-muted-foreground"}`}>{label}</p>
          <p className="mt-2 font-display text-2xl">{value}</p>
        </div>
        <Icon className={`h-5 w-5 ${accent ? "text-gold" : warn ? "text-amber-500" : "text-muted-foreground"}`} />
      </div>
    </div>
  );
}
