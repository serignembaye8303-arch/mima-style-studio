import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useIsStaff } from "@/lib/use-role";

export const Route = createFileRoute("/login")({ component: Login });

const STAFF_ROLES = new Set(["admin", "super_admin", "manager"]);

function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isStaff, isLoading: rolesLoading } = useIsStaff();
  const [email, setEmail] = useState("admin@mima-boutique.com");
  const [password, setPassword] = useState("Azerty10@");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user || rolesLoading) return;
    navigate({ to: isStaff ? "/admin" : "/login", replace: true });
  }, [authLoading, user, rolesLoading, isStaff, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("[admin-login] sign-in failed", { email, message: error.message, status: error.status });
        throw error;
      }

      if (!data.user) {
        console.error("[admin-login] sign-in returned no user", { email });
        throw new Error("Connexion incomplète, merci de réessayer.");
      }

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (rolesError) {
        console.error("[admin-login] role lookup failed", {
          userId: data.user.id,
          email: data.user.email,
          message: rolesError.message,
        });
        throw new Error("Impossible de vérifier les permissions administrateur.");
      }

      const resolvedRoles = (roles ?? []).map((entry) => entry.role);
      const hasStaffAccess = resolvedRoles.some((role) => STAFF_ROLES.has(role));

      console.info("[admin-login] sign-in succeeded", {
        userId: data.user.id,
        email: data.user.email,
        roles: resolvedRoles,
        hasStaffAccess,
      });

      if (!hasStaffAccess) {
        await supabase.auth.signOut();
        toast.error("Ce compte n'a pas accès à l’administration.");
        navigate({ to: "/login", replace: true });
        return;
      }

      toast.success("Connexion administrateur réussie");
      navigate({ to: "/admin", replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur de connexion";
      toast.error(message === "Invalid login credentials" ? "Identifiants invalides." : message);
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

