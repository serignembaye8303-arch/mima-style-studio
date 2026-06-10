import { supabase } from "@/integrations/supabase/client";

// Use any-typed client until generated types catch up
const sb = supabase as any;

export type PaymentMethod = "wave" | "orange_money" | "card" | "paypal" | "cash_on_delivery";
export type PaymentStatus = "unpaid" | "pending_verification" | "paid" | "failed" | "refunded";

export interface Order {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  customer_city: string | null;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  total: number;
  currency: string;
  notes: string | null;
  whatsapp_sent_at: string | null;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function setOrderPayment(orderId: string, method: PaymentMethod, reference?: string) {
  const { error } = await sb.from("orders").update({
    payment_method: method,
    payment_status: "pending_verification",
    payment_reference: reference ?? null,
  }).eq("id", orderId);
  if (error) throw error;
}

export async function updatePaymentStatus(orderId: string, status: PaymentStatus) {
  const patch: Record<string, unknown> = { payment_status: status };
  if (status === "paid") patch.paid_at = new Date().toISOString();
  const { error } = await sb.from("orders").update(patch).eq("id", orderId);
  if (error) throw error;
}

export async function fetchOrderPublic(id: string) {
  // Used by /paiement/$id — RLS allows owner or guest (user_id IS NULL) to read
  const { data, error } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Order | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
}

export interface CartLineInput {
  product_id: string;
  product_name: string;
  product_image?: string | null;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

export async function createOrder(input: {
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  customer_city?: string;
  notes?: string;
  items: CartLineInput[];
  user_id?: string | null;
}) {
  const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const { data: order, error } = await sb
    .from("orders")
    .insert({
      user_id: input.user_id ?? null,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      customer_address: input.customer_address ?? null,
      customer_city: input.customer_city ?? null,
      notes: input.notes ?? null,
      subtotal,
      total: subtotal,
      currency: "XOF",
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;

  const items = input.items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    product_name: i.product_name,
    product_image: i.product_image ?? null,
    price: i.price,
    quantity: i.quantity,
    size: i.size ?? null,
    color: i.color ?? null,
  }));
  const { error: itemsErr } = await sb.from("order_items").insert(items);
  if (itemsErr) throw itemsErr;
  return order as Order;
}

export async function markWhatsAppSent(orderId: string) {
  await sb.from("orders").update({ whatsapp_sent_at: new Date().toISOString() }).eq("id", orderId);
}

export async function fetchOrders(filter?: { status?: Order["status"] }) {
  let q = sb.from("orders").select("*").order("created_at", { ascending: false });
  if (filter?.status) q = q.eq("status", filter.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function fetchOrder(id: string) {
  const { data: order } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
  const { data: items } = await sb.from("order_items").select("*").eq("order_id", id);
  return { order: order as Order | null, items: (items ?? []) as OrderItem[] };
}

export async function updateOrderStatus(id: string, status: Order["status"]) {
  const { error } = await sb.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

// Products admin
export async function upsertProduct(p: Record<string, unknown>) {
  const { data, error } = await sb.from("products").upsert(p).select().single();
  if (error) {
    console.error("[upsertProduct] Supabase error:", error);
    throw error;
  }
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) {
    console.error("[deleteProduct] Supabase error:", error);
    throw error;
  }
}

// Stock movements
export async function addStockMovement(input: { product_id: string; delta: number; reason: string; note?: string }) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await sb.from("stock_movements").insert({
    ...input,
    note: input.note ?? null,
    created_by: u.user?.id ?? null,
  });
  if (error) throw error;
}

export async function fetchStockMovements(productId?: string) {
  let q = sb.from("stock_movements").select("*, products(name)").order("created_at", { ascending: false }).limit(200);
  if (productId) q = q.eq("product_id", productId);
  const { data } = await q;
  return (data ?? []) as any[];
}

// Users
export async function fetchAllProfiles() {
  const { data } = await sb.from("profiles").select("*").order("created_at", { ascending: false });
  return (data ?? []) as any[];
}

export async function fetchAllRoles() {
  const { data } = await sb.from("user_roles").select("*");
  return (data ?? []) as any[];
}

export async function setUserRole(userId: string, role: "super_admin" | "admin" | "manager" | "client") {
  await sb.from("user_roles").delete().eq("user_id", userId);
  const { error } = await sb.from("user_roles").insert({ user_id: userId, role });
  if (error) throw error;
}

export async function toggleSuspend(userId: string, suspended: boolean) {
  const { error } = await sb.from("profiles").update({ is_suspended: suspended }).eq("user_id", userId);
  if (error) throw error;
}

// Promotions
export async function fetchPromotions() {
  const { data } = await sb.from("promotions").select("*").order("created_at", { ascending: false });
  return (data ?? []) as any[];
}

export async function upsertPromotion(p: Record<string, unknown>) {
  const { data, error } = await sb.from("promotions").upsert(p).select().single();
  if (error) throw error;
  return data;
}

export async function deletePromotion(id: string) {
  const { error } = await sb.from("promotions").delete().eq("id", id);
  if (error) throw error;
}

// Notifications
export async function fetchNotifications(userId?: string) {
  let q = sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  if (userId) q = q.or(`user_id.eq.${userId},audience.eq.all,audience.eq.staff`);
  const { data } = await q;
  return (data ?? []) as any[];
}

export async function broadcastNotification(input: { title: string; body?: string; audience: "all" | "staff"; link?: string; type?: string }) {
  const { error } = await sb.from("notifications").insert({
    title: input.title,
    body: input.body ?? null,
    audience: input.audience,
    link: input.link ?? null,
    type: input.type ?? "promo",
  });
  if (error) throw error;
}

export async function markNotificationRead(id: string) {
  await sb.from("notifications").update({ is_read: true }).eq("id", id);
}

// Settings
export async function fetchSettings() {
  const { data } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return data as any;
}
export async function updateSettings(patch: Record<string, unknown>) {
  const { error } = await sb.from("site_settings").update(patch).eq("id", 1);
  if (error) throw error;
}

// Dashboard stats
export async function fetchDashboardStats() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 86400_000);
  const monthAgo = new Date(Date.now() - 30 * 86400_000);

  const [ordersAll, ordersToday, ordersWeek, ordersMonth, products, users] = await Promise.all([
    sb.from("orders").select("id,total,created_at,status"),
    sb.from("orders").select("total").gte("created_at", today.toISOString()),
    sb.from("orders").select("total").gte("created_at", weekAgo.toISOString()),
    sb.from("orders").select("total,created_at").gte("created_at", monthAgo.toISOString()),
    sb.from("products").select("id,stock,name"),
    sb.from("profiles").select("id"),
  ]);

  const sum = (rows: any[] | null) => (rows ?? []).reduce((s, r) => s + Number(r.total || 0), 0);

  // chart: orders per day last 14 days
  const days: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const rows = (ordersMonth.data ?? []).filter((o: any) => {
      const t = new Date(o.created_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    });
    days.push({
      date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      revenue: rows.reduce((s: number, r: any) => s + Number(r.total || 0), 0),
      orders: rows.length,
    });
  }

  const lowStock = (products.data ?? []).filter((p: any) => p.stock <= 3);

  return {
    totalOrders: (ordersAll.data ?? []).length,
    revenueToday: sum(ordersToday.data),
    revenueWeek: sum(ordersWeek.data),
    revenueMonth: sum(ordersMonth.data),
    productsCount: (products.data ?? []).length,
    usersCount: (users.data ?? []).length,
    lowStock,
    chart: days,
  };
}
