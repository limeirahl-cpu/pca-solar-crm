import { createClient } from "@/lib/supabase/server";
import { CatalogoFornecedoresManager } from "@/components/estoque/CatalogoFornecedoresManager";

export default async function CatalogoFornecedoresPage() {
  const supabase = await createClient();
  const [{ data: itens }, { data: suppliers }] = await Promise.all([
    supabase
      .from("supplier_components")
      .select("*, suppliers(nome)")
      .order("nome")
      .limit(1000),
    supabase.from("suppliers").select("id, nome").order("nome"),
  ]);

  return (
    <CatalogoFornecedoresManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialItens={(itens ?? []) as any}
      suppliers={suppliers ?? []}
    />
  );
}
