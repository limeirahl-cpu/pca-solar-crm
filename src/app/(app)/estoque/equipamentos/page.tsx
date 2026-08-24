import { createClient } from "@/lib/supabase/server";
import { ProductsManager } from "@/components/estoque/ProductsManager";
import { EQUIPAMENTO_CATEGORIAS } from "@/lib/estoque";

export default async function EquipamentosPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: suppliers }] = await Promise.all([
    supabase.from("products").select("*, suppliers(nome)").in("categoria", EQUIPAMENTO_CATEGORIAS).order("nome"),
    supabase.from("suppliers").select("id, nome").order("nome"),
  ]);

  return (
    <ProductsManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialProducts={(products ?? []) as any}
      suppliers={suppliers ?? []}
      title="Equipamentos"
      description="Módulos, inversores e estruturas — o equipamento principal instalado."
      categoriaOptions={EQUIPAMENTO_CATEGORIAS}
    />
  );
}
