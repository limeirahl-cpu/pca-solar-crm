import { createClient } from "@/lib/supabase/server";
import { PurchasesManager } from "@/components/estoque/PurchasesManager";

export default async function ComprasPage() {
  const supabase = await createClient();
  const [{ data: purchases }, { data: suppliers }] = await Promise.all([
    supabase.from("purchases").select("*, suppliers(nome)").order("created_at", { ascending: false }),
    supabase.from("suppliers").select("id, nome").order("nome"),
  ]);

  return (
    <PurchasesManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialPurchases={(purchases ?? []) as any}
      suppliers={suppliers ?? []}
    />
  );
}
