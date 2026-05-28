import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllProfiles, fetchAllRoles, setUserRole, toggleSuspend } from "@/lib/admin-api";
import { useIsStaff } from "@/lib/use-role";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: UsersAdmin });

function UsersAdmin() {
  const qc = useQueryClient();
  const { isSuperAdmin } = useIsStaff();
  const { data: profiles } = useQuery({ queryKey: ["admin-profiles"], queryFn: fetchAllProfiles });
  const { data: roles } = useQuery({ queryKey: ["admin-roles"], queryFn: fetchAllRoles });

  function roleOf(uid: string) {
    return roles?.find((r: any) => r.user_id === uid)?.role ?? "client";
  }

  async function changeRole(uid: string, role: string) {
    try {
      await setUserRole(uid, role as any);
      toast.success("Rôle mis à jour");
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
    } catch (e: any) { toast.error(e.message); }
  }

  async function toggle(uid: string, current: boolean) {
    try {
      await toggleSuspend(uid, !current);
      toast.success(current ? "Compte réactivé" : "Compte suspendu");
      qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="tracking-luxe text-[10px] text-gold">Comptes</p>
        <h1 className="font-display text-3xl mt-1">Utilisateurs ({profiles?.length ?? 0})</h1>
        {!isSuperAdmin && <p className="text-xs text-muted-foreground mt-2">Seul un super admin peut modifier les rôles.</p>}
      </header>

      <div className="bg-background border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-luxe text-muted-foreground">
            <tr><th className="text-left px-4 py-3">Nom</th><th className="text-left px-4 py-3">Téléphone</th><th className="text-left px-4 py-3">Rôle</th><th className="text-left px-4 py-3">Statut</th><th className="text-left px-4 py-3">Inscrit</th><th></th></tr>
          </thead>
          <tbody className="divide-y">
            {(profiles ?? []).map((p: any) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.display_name ?? "—"}</td>
                <td className="px-4 py-3">{p.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  {isSuperAdmin ? (
                    <select value={roleOf(p.user_id)} onChange={(e) => changeRole(p.user_id, e.target.value)} className="border rounded px-2 py-1 text-sm">
                      <option value="client">Client</option>
                      <option value="manager">Gestionnaire</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  ) : <span className="capitalize">{roleOf(p.user_id)}</span>}
                </td>
                <td className="px-4 py-3">
                  {p.is_suspended ? <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded">Suspendu</span> : <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded">Actif</span>}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggle(p.user_id, p.is_suspended)} className="text-xs tracking-luxe border-b border-foreground">{p.is_suspended ? "Réactiver" : "Suspendre"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
