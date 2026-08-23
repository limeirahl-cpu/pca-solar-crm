import { createClient } from "@/lib/supabase/server";
import { CommissionsManager } from "@/components/financeiro/CommissionsManager";

export default async function ComissoesPage({
  searchParams,
}: {
  searchParams: Promise<{ project_id?: string; novo?: string }>;
}) {
  const { project_id, novo } = await searchParams;
  const supabase = await createClient();
  const [{ data: entries }, { data: vendedores }, { data: projects }] = await Promise.all([
    supabase
      .from("financial_entries")
      .select("*, profiles(full_name)")
      .not("vendedor_id", "is", null)
      .order("data_vencimento", { ascending: true }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("projects").select("id, nome").order("nome"),
  ]);

  return (
    <CommissionsManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialEntries={(entries ?? []) as any}
      vendedores={vendedores ?? []}
      projects={projects ?? []}
      defaultProjectId={project_id}
      autoOpen={novo === "1"}
    />
  );
}
