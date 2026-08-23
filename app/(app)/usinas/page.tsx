import { createClient } from "@/lib/supabase/server";
import { PlantsManager } from "@/components/plants/PlantsManager";

export default async function UsinasPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string; client_id?: string }>;
}) {
  const { novo, client_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: plants }, { data: clients }] = await Promise.all([
    supabase
      .from("plants")
      .select("*, clients(nome)")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, nome").order("nome"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Monitoramento de usinas</h1>
        <p className="text-sm text-muted">
          Cadastro das usinas já instaladas, status e histórico de geração (atualização manual).
        </p>
      </div>
      <PlantsManager
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        initialPlants={(plants ?? []) as any}
        clients={clients ?? []}
        openCreate={novo === "1"}
        defaultClientId={client_id}
      />
    </div>
  );
}
