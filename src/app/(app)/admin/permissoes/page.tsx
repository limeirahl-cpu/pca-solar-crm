import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/permissions";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { PermissionsManager } from "@/components/admin/PermissionsManager";

export default async function PermissoesPage() {
  const admin = await isCurrentUserAdmin();

  if (!admin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Permissões</h1>
          <p className="text-sm text-muted">Controle granular de acesso por módulo.</p>
        </div>
        <AccessDenied />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: profiles }, { data: permissions }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("permissions").select("*"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Permissões</h1>
        <p className="text-sm text-muted">
          Defina o que cada usuário pode visualizar, criar, editar ou excluir em cada módulo.
          Administradores sempre têm acesso completo, independente do que estiver marcado aqui.
        </p>
      </div>
      <PermissionsManager profiles={profiles ?? []} initialPermissions={permissions ?? []} />
    </div>
  );
}
