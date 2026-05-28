import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchOrders } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({ component: Analytics });

const PALETTE = ["#d4a574", "#1a1a1a", "#e8c5d0", "#c44569", "#5c2018"];

function Analytics() {
  const { data: orders } = useQuery({ queryKey: ["admin-orders", "all"], queryFn: () => fetchOrders() });
  const { data: items } = useQuery({
    queryKey: ["admin-items"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("order_items").select("product_name, quantity, price");
      return (data ?? []) as any[];
    },
  });

  // best sellers
  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  (items ?? []).forEach((i: any) => {
    const e = byProduct.get(i.product_name) ?? { name: i.product_name, qty: 0, revenue: 0 };
    e.qty += i.quantity; e.revenue += i.price * i.quantity;
    byProduct.set(i.product_name, e);
  });
  const top = Array.from(byProduct.values()).sort((a, b) => b.qty - a.qty).slice(0, 8);

  // status repartition
  const byStatus = (orders ?? []).reduce<Record<string, number>>((acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc; }, {});
  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

  const totalRevenue = (orders ?? []).reduce((s, o) => s + Number(o.total || 0), 0);
  const avg = orders?.length ? totalRevenue / orders.length : 0;
  const conversion = "—"; // placeholder until visitor analytics added

  function exportCSV() {
    const rows = [["id", "date", "client", "telephone", "statut", "total"], ...(orders ?? []).map((o) => [o.id, o.created_at, o.customer_name, o.customer_phone, o.status, String(o.total)])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tracking-luxe text-[10px] text-gold">Statistiques</p>
          <h1 className="font-display text-3xl mt-1">Analytics</h1>
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 border border-foreground px-4 py-2 text-xs tracking-luxe hover:bg-foreground hover:text-background"><Download className="h-3.5 w-3.5" /> Export CSV</button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Revenus totaux" value={formatPrice(totalRevenue)} />
        <Kpi label="Commandes" value={String(orders?.length ?? 0)} />
        <Kpi label="Panier moyen" value={formatPrice(avg)} />
        <Kpi label="Taux conversion" value={conversion} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-background border rounded-lg p-6">
          <h2 className="font-display text-xl mb-4">Meilleures ventes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="name" fontSize={10} width={120} />
              <Tooltip />
              <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-background border rounded-lg p-6">
          <h2 className="font-display text-xl mb-4">Statuts des commandes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={100} label>
                {statusData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background border rounded-lg p-5">
      <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}
