import { createClient } from "@/lib/supabase/server";
import { AlertsManager } from "@/components/monitoramento/AlertsManager";

export default async function AlertasPage() {
  const supabase = await createClient();
  const noventaDiasAtras = new Date();
  noventaDiasAtras.setDate(noventaDiasAtras.getDate() - 90);

  const [{ data: alerts }, { data: plants }, { data: logs }] = await Promise.all([
    supabase.from("plant_alerts").select("*, plants(nome)").order("created_at", { ascending: false }),
    supabase.from("plants").select("id, nome, status, geracao_mensal_media_kwh").order("nome"),
    supabase
      .from("plant_logs")
      .select("plant_id, data, geracao_kwh")
      .gte("data", noventaDiasAtras.toISOString().slice(0, 10))
      .order("data", { ascending: false }),
  ]);

  return (
    <AlertsManager
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      initialAlerts={(alerts ?? []) as any}
      plants={plants ?? []}
      logs={logs ?? []}
    />
  );
}
