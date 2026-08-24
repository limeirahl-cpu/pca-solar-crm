import { createClient } from "@/lib/supabase/server";
import { ProductsManager } from "@/components/estoque/ProductsManager";

export default async function ProdutosPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: suppliers }] = await Promise.all([
    supabase.from("products").select("*, suppliers(nome)").order("nome"),
    supabase.from("suppliers").select("id, nome").order("nome"),
  ]);

  return (
    <ProductsManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialProducts={(products ?? []) as any}
      suppliers={suppliers ?? []}
      title="Produtos"
      description="Catálogo completo de módulos, inversores, estruturas e acessórios."
    />
  );
}
