import { format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { GeracaoOverview, type MonthlyGeracaoPoint, type PlantGeracaoSummary } from "@/components/monitoramento/GeracaoOverview";

export default async function GeracaoPage() {
  const supabase = await createClient();

  const now = new Date();
  const windowStart = startOfMonth(subMonths(now, 5));
  const mesAtualKey = format(now, "yyyy-MM");

  const [{ data: plants }, { data: logs }] = await Promise.all([
    supabase.from("plants").select("id, nome, potencia_kwp").order("nome"),
    supabase
      .from("plant_logs")
      .select("plant_id, data, geracao_kwh")
      .gte("data", windowStart.toISOString().slice(0, 10)),
  ]);

  const months: { key: string; label: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = subMonths(now, 5 - i);
    months.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM/yy", { locale: ptBR }) });
  }
  const buckets: Record<string, number> = {};
  months.forEach((m) => (buckets[m.key] = 0));

  const logsList = logs ?? [];
  logsList.forEach((l: { data: string; geracao_kwh: number | null }) => {
    const key = l.data.slice(0, 7);
    if (buckets[key] === undefined) return;
    buckets[key] += l.geracao_kwh ?? 0;
  });

  const monthlyData: MonthlyGeracaoPoint[] = months.map((m) => ({ mes: m.label, geracao: buckets[m.key] }));

  const plantsSummary: PlantGeracaoSummary[] = (plants ?? []).map((p) => {
    const logsPlant = logsList.filter((l) => l.plant_id === p.id);
    const totalMes = logsPlant
      .filter((l) => l.data.slice(0, 7) === mesAtualKey)
      .reduce((sum, l) => sum + (l.geracao_kwh ?? 0), 0);
    const ultimoRegistro = logsPlant.length > 0 ? [...logsPlant].sort((a, b) => b.data.localeCompare(a.data))[0].data : null;
    return { id: p.id, nome: p.nome, potencia_kwp: p.potencia_kwp, totalMes, ultimoRegistro };
  });

  return <GeracaoOverview monthlyData={monthlyData} plantsSummary={plantsSummary} />;
}
