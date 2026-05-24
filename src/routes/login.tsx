import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/compte" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/compte`, data: { display_name: name } },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vérifiez votre email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenue 🌸");
        navigate({ to: "/compte" });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/compte" });
    if (r.error) toast.error("Erreur Google");
  };

  return (
    <SiteLayout>
      <div className="max-w-md mx-auto px-6 py-20">
        <div className="text-center">
          <p className="tracking-luxe text-[10px] text-gold">Mima Boutique</p>
          <h1 className="mt-3 font-display text-4xl">{mode === "signin" ? "Connexion" : "Créer un compte"}</h1>
        </div>

        <button onClick={google} className="mt-8 w-full border border-foreground py-3 tracking-luxe text-xs hover:bg-foreground hover:text-background transition-colors">
          Continuer avec Google
        </button>
        <div className="my-6 flex items-center gap-4 text-[10px] tracking-luxe text-muted-foreground">
          <div className="flex-1 h-px bg-border" />ou<div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="w-full border-b border-border py-3 bg-transparent focus:outline-none focus:border-foreground text-sm" />
          )}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border-b border-border py-3 bg-transparent focus:outline-none focus:border-foreground text-sm" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full border-b border-border py-3 bg-transparent focus:outline-none focus:border-foreground text-sm" />
          <button disabled={loading} className="w-full bg-foreground text-background py-3.5 tracking-luxe text-xs hover:bg-foreground/90 disabled:opacity-60">
            {loading ? "..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {mode === "signin" ? "Pas encore de compte ?" : "Déjà inscrite ?"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-foreground underline underline-offset-4">
            {mode === "signin" ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
        <p className="mt-8 text-center"><Link to="/" className="tracking-luxe text-[10px] text-muted-foreground">← Retour</Link></p>
      </div>
    </SiteLayout>
  );
}
