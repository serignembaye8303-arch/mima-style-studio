import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { CATEGORIES } from "@/lib/format";
import logo from "@/assets/logo-mima.png";

export function Header() {
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60">
      <div className="hidden md:block bg-foreground text-background text-[10px] tracking-luxe text-center py-2">
        Livraison offerte dès 80 000 FCFA · Commande par WhatsApp en 1 clic
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <button className="md:hidden p-2 -ml-2" onClick={() => setMenuOpen(true)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="Mima Boutique" className="h-12 w-12 object-contain" />
          <div className="hidden sm:block leading-tight">
            <div className="font-display text-2xl">mima</div>
            <div className="tracking-luxe text-[9px] text-gold -mt-1">Boutique</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs tracking-luxe">
          <Link to="/boutique" className="hover:text-gold transition-colors">Boutique</Link>
          {CATEGORIES.slice(0, 4).map((c) => (
            <Link key={c.slug} to="/boutique" search={{ category: c.slug }} className="hover:text-gold transition-colors">
              {c.label}
            </Link>
          ))}
          <Link to="/contact" className="hover:text-gold transition-colors">Contact</Link>
        </nav>

        <div className="flex items-center gap-1">
          <Link to="/boutique" className="p-2 hover:text-gold transition-colors" aria-label="Recherche">
            <Search className="h-5 w-5" />
          </Link>
          <Link to={user ? "/compte" : "/login"} className="p-2 hover:text-gold transition-colors" aria-label="Compte">
            <User className="h-5 w-5" />
          </Link>
          <Link to="/favoris" className="p-2 hover:text-gold transition-colors" aria-label="Favoris">
            <Heart className="h-5 w-5" />
          </Link>
          <button onClick={() => setOpen(true)} className="relative p-2 hover:text-gold transition-colors" aria-label="Panier">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background animate-fade-up">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-display text-2xl">mima</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Fermer"><X className="h-5 w-5" /></button>
          </div>
          <nav className="p-6 flex flex-col gap-6 text-sm tracking-luxe">
            <Link to="/boutique" onClick={() => setMenuOpen(false)}>Toute la boutique</Link>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} to="/boutique" search={{ category: c.slug }} onClick={() => setMenuOpen(false)}>
                {c.label}
              </Link>
            ))}
            <Link to="/favoris" onClick={() => setMenuOpen(false)}>Favoris</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
            <Link to={user ? "/compte" : "/login"} onClick={() => setMenuOpen(false)}>
              {user ? "Mon compte" : "Connexion"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
