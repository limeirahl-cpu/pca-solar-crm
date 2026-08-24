import { createClient } from "@/lib/supabase/server";
import { FinanceDashboard } from "@/components/financeiro/FinanceDashboard";

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("financial_entries")
    .select("id, tipo, descricao, valor, status, data_vencimento");

  return <FinanceDashboard entries={entries ?? []} />;
}
