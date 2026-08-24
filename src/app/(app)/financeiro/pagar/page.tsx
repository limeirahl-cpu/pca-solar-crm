import { createClient } from "@/lib/supabase/server";
import { FinancialEntriesManager } from "@/components/financeiro/FinancialEntriesManager";

export default async function ContasPagarPage() {
  const supabase = await createClient();
  const [{ data: entries }, { data: categories }, { data: suppliers }, { data: projects }] = await Promise.all([
    supabase
      .from("financial_entries")
      .select("*, clients(nome), suppliers(nome)")
      .eq("tipo", "despesa")
      .order("data_vencimento", { ascending: true }),
    supabase.from("financial_categories").select("*").order("nome"),
    supabase.from("suppliers").select("id, nome").order("nome"),
    supabase.from("projects").select("id, nome").order("nome"),
  ]);

  return (
    <FinancialEntriesManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialEntries={(entries ?? []) as any}
      categories={categories ?? []}
      clients={[]}
      suppliers={suppliers ?? []}
      projects={projects ?? []}
      tipo="despesa"
      title="Contas a Pagar"
      description="Pagamentos a fornecedores e demais despesas, com vencimento e status."
    />
  );
}
