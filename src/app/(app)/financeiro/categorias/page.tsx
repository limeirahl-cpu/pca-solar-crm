import { createClient } from "@/lib/supabase/server";
import { CategoriesManager } from "@/components/financeiro/CategoriesManager";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("financial_categories").select("*").order("nome");

  return <CategoriesManager initialCategories={categories ?? []} />;
}
