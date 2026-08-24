import { createClient } from "@/lib/supabase/server";
import { PerformanceManager, type PlantPerformanceRow } from "@/components/monitoramento/PerformanceManager";

export default async function PerformancePage() {
  const supabase = await createClient();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

  const [{ data: plants }, { data: logs }] = await Promise.all([
    supabase.from("plants").select("id, nome, potencia_kwp, geracao_mensal_media_kwh").order("nome"),
    supabase
      .from("plant_logs")
      .select("plant_id, data, geracao_kwh")
      .gte("data", trintaDiasAtras.toISOString().slice(0, 10)),
  ]);

  const logsList = logs ?? [];
  const rows: PlantPerformanceRow[] = (plants ?? []).map((p) => {
    const logsPlant = logsList.filter((l) => l.plant_id === p.id);
    const geracaoUltimos30Dias = logsPlant.reduce((sum, l) => sum + (l.geracao_kwh ?? 0), 0);
    const ultimoRegistro = logsPlant.length > 0 ? [...logsPlant].sort((a, b) => b.data.localeCompare(a.data))[0].data : null;
    return {
      id: p.id,
      nome: p.nome,
      potencia_kwp: p.potencia_kwp,
      geracaoMensalEsperada: p.geracao_mensal_media_kwh,
      geracaoUltimos30Dias,
      ultimoRegistro,
    };
  });

  return <PerformanceManager rows={rows} />;
}
