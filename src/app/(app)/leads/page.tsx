import { createClient } from "@/lib/supabase/server";
import { LeadsManager } from "@/components/leads/LeadsManager";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Leads</h1>
        <p className="text-sm text-muted">Capture e acompanhe novos contatos até virarem clientes.</p>
      </div>
      <LeadsManager initialLeads={leads ?? []} />
    </div>
  );
}
