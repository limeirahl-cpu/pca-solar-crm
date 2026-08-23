import { createClient } from "@/lib/supabase/server";
import { FinancialEntriesManager } from "@/components/financeiro/FinancialEntriesManager";

export default async function ContasReceberPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; project_id?: string; novo?: string }>;
}) {
  const { client_id, project_id, novo } = await searchParams;
  const supabase = await createClient();
  const [{ data: entries }, { data: categories }, { data: clients }, { data: projects }] = await Promise.all([
    supabase
      .from("financial_entries")
      .select("*, clients(nome), suppliers(nome)")
      .eq("tipo", "receita")
      .order("data_vencimento", { ascending: true }),
    supabase.from("financial_categories").select("*").order("nome"),
    supabase.from("clients").select("id, nome").order("nome"),
    supabase.from("projects").select("id, nome").order("nome"),
  ]);

  return (
    <FinancialEntriesManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialEntries={(entries ?? []) as any}
      categories={categories ?? []}
      clients={clients ?? []}
      suppliers={[]}
      projects={projects ?? []}
      tipo="receita"
      title="Contas a Receber"
      description="Recebimentos de clientes, com vencimento e status."
      defaultClientId={client_id}
      defaultProjectId={project_id}
      autoOpen={novo === "1"}
    />
  );
}
