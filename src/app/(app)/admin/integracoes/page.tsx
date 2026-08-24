import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/permissions";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { IntegrationsManager } from "@/components/admin/IntegrationsManager";

export default async function IntegracoesPage() {
  const admin = await isCurrentUserAdmin();

  if (!admin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Integrações</h1>
          <p className="text-sm text-muted">Conexões oficiais com APIs externas.</p>
        </div>
        <AccessDenied />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: configs } = await supabase.from("integration_configs").select("*");

  return <IntegrationsManager initialConfigs={configs ?? []} />;
}
