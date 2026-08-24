import { createClient } from "@/lib/supabase/server";
import { StockDashboard } from "@/components/estoque/StockDashboard";

export default async function EstoquePage() {
  const supabase = await createClient();
  const [{ data: products }, { data: movements }] = await Promise.all([
    supabase.from("products").select("id, nome, unidade, estoque_atual, estoque_minimo, valor_unitario").order("nome"),
    supabase
      .from("stock_movements")
      .select("*, products(nome, unidade)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return (
    <StockDashboard
      products={products ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentMovements={(movements ?? []) as any}
    />
  );
}
