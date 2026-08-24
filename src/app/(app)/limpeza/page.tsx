import { createClient } from "@/lib/supabase/server";
import { OrdensServicoManager } from "@/components/ordens/OrdensServicoManager";

export default async function LimpezaPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; novo?: string }>;
}) {
  const { client_id, novo } = await searchParams;
  const supabase = await createClient();
  const [{ data: ordens }, { data: clients }] = await Promise.all([
    supabase
      .from("ordens_servico")
      .select("*, clients(nome)")
      .eq("tipo", "limpeza")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, nome").order("nome"),
  ]);

  return (
    <OrdensServicoManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialOrdens={(ordens ?? []) as any}
      clients={clients ?? []}
      title="Limpeza"
      description="Agenda e histórico de serviços de limpeza de painéis."
      fixedTipo="limpeza"
      prefillClientId={client_id}
      autoOpen={novo === "1"}
    />
  );
}
