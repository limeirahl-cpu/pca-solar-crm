import { createClient } from "@/lib/supabase/server";
import { OrdensServicoManager } from "@/components/ordens/OrdensServicoManager";

export default async function AmpliacoesPage({
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
      .eq("tipo", "ampliacao")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, nome").order("nome"),
  ]);

  return (
    <OrdensServicoManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialOrdens={(ordens ?? []) as any}
      clients={clients ?? []}
      title="Ampliações"
      description="Oportunidades e acompanhamento de ampliação de sistemas existentes."
      fixedTipo="ampliacao"
      prefillClientId={client_id}
      autoOpen={novo === "1"}
    />
  );
}
