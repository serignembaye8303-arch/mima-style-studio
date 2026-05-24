import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
}

interface CartCtx {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "mima_cart";

const keyOf = (i: CartItem) => `${i.id}__${i.size ?? ""}__${i.color ?? ""}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const add: CartCtx["add"] = (item) => {
    setItems((prev) => {
      const k = keyOf(item);
      const idx = prev.findIndex((p) => keyOf(p) === k);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
    setOpen(true);
  };

  const remove: CartCtx["remove"] = (k) => setItems((prev) => prev.filter((p) => keyOf(p) !== k));
  const setQuantity: CartCtx["setQuantity"] = (k, qty) =>
    setItems((prev) => prev.map((p) => (keyOf(p) === k ? { ...p, quantity: Math.max(1, qty) } : p)));
  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, add, remove, setQuantity, clear, total, count, open, setOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
};

export const cartItemKey = keyOf;
