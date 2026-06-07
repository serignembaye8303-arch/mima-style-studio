import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("admin@mima-boutique.com");
  const [password, setPassword] = useState("Azerty10@");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/compte" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Bienvenue 🌸");
      navigate({ to: "/compte" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  };

  return (
    <SiteLayout>
      <div className="max-w-md mx-auto px-6 py-20">
        <div className="text-center">
          <p className="tracking-luxe text-[10px] text-gold">Mima Boutique</p>
          <h1 className="mt-3 font-display text-4xl">Connexion</h1>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border-b border-border py-3 bg-transparent focus:outline-none focus:border-foreground text-sm" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full border-b border-border py-3 bg-transparent focus:outline-none focus:border-foreground text-sm" />
          <button disabled={loading} className="w-full bg-foreground text-background py-3.5 tracking-luxe text-xs hover:bg-foreground/90 disabled:opacity-60">
            {loading ? "..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-8 text-center"><Link to="/" className="tracking-luxe text-[10px] text-muted-foreground">← Retour</Link></p>
      </div>
    </SiteLayout>
  );
}

