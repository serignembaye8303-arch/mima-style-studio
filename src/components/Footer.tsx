import { Link } from "@tanstack/react-router";
import { Instagram, Facebook } from "lucide-react";
import { CATEGORIES } from "@/lib/format";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <div className="font-display text-3xl">mima</div>
          <div className="tracking-luxe text-[10px] text-gold mt-1">Boutique</div>
          <p className="mt-6 text-sm text-background/70 leading-relaxed">
            Style · Élégance · Confiance. Une sélection pointue pour la femme contemporaine.
          </p>
        </div>
        <div>
          <h4 className="tracking-luxe text-[11px] text-gold mb-4">Boutique</h4>
          <ul className="space-y-2 text-sm text-background/80">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to="/boutique" search={{ category: c.slug }} className="hover:text-rose transition-colors">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="tracking-luxe text-[11px] text-gold mb-4">Aide</h4>
          <ul className="space-y-2 text-sm text-background/80">
            <li><Link to="/contact" className="hover:text-rose">Contact</Link></li>
            <li><Link to="/compte" className="hover:text-rose">Mon compte</Link></li>
            <li>Livraison & retours</li>
            <li>Tailles</li>
          </ul>
        </div>
        <div>
          <h4 className="tracking-luxe text-[11px] text-gold mb-4">Newsletter</h4>
          <p className="text-sm text-background/70 mb-3">Premières infos sur les nouveautés.</p>
          <form className="flex border-b border-background/40" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="Votre email"
              className="bg-transparent flex-1 py-2 text-sm placeholder:text-background/40 focus:outline-none"
            />
            <button className="tracking-luxe text-[10px] text-gold">OK</button>
          </form>
          <div className="flex gap-4 mt-6">
            <a href="#" aria-label="Instagram" className="hover:text-rose"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="Facebook" className="hover:text-rose"><Facebook className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-background/10 py-5 text-center text-[11px] text-background/50 tracking-wider">
        © {new Date().getFullYear()} Mima Boutique — Tous droits réservés
      </div>
    </footer>
  );
}
