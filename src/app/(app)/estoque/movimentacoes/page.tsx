import { createClient } from "@/lib/supabase/server";
import { StockMovementsManager } from "@/components/estoque/StockMovementsManager";

export default async function MovimentacoesPage() {
  const supabase = await createClient();
  const [{ data: movements }, { data: products }] = await Promise.all([
    supabase.from("stock_movements").select("*, products(nome, unidade)").order("created_at", { ascending: false }),
    supabase.from("products").select("id, nome, unidade").order("nome"),
  ]);

  return (
    <StockMovementsManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialMovements={(movements ?? []) as any}
      products={products ?? []}
    />
  );
}
