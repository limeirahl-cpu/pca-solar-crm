import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/permissions";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { UsersManager } from "@/components/admin/UsersManager";

export default async function UsuariosPage() {
  const admin = await isCurrentUserAdmin();

  if (!admin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Usuários</h1>
          <p className="text-sm text-muted">Gestão de usuários do sistema.</p>
        </div>
        <AccessDenied />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("user_roles").select("*"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Usuários</h1>
        <p className="text-sm text-muted">
          Papéis e acesso dos usuários com login no sistema.
        </p>
      </div>
      <UsersManager initialProfiles={profiles ?? []} initialRoles={roles ?? []} />
    </div>
  );
}
