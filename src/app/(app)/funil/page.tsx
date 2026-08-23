import { createClient } from "@/lib/supabase/server";
import { FunilManager } from "@/components/leads/FunilManager";

export default async function FunilPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .not("status", "eq", "pos_venda")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Funil de Vendas</h1>
        <p className="text-sm text-muted">
          Arraste os cards entre as etapas para atualizar o status do lead.
        </p>
      </div>
      <FunilManager initialLeads={leads ?? []} />
    </div>
  );
}
