import { createClient } from "@/lib/supabase/server";
import { SuppliersManager } from "@/components/estoque/SuppliersManager";

export default async function FornecedoresPage() {
  const supabase = await createClient();
  const { data: suppliers } = await supabase.from("suppliers").select("*").order("nome");

  return <SuppliersManager initialSuppliers={suppliers ?? []} />;
}
