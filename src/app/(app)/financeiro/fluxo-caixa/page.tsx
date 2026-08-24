import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { CashFlowChart, type CashFlowPoint } from "@/components/financeiro/CashFlowChart";
import { formatCurrency } from "@/lib/utils";

export default async function FluxoCaixaPage() {
  const supabase = await createClient();

  const now = new Date();
  const windowStart = startOfMonth(subMonths(now, 5));
  const windowEnd = startOfMonth(addMonths(now, 3));

  const { data: entries } = await supabase
    .from("financial_entries")
    .select("tipo, valor, status, data_vencimento")
    .neq("status", "cancelado")
    .gte("data_vencimento", windowStart.toISOString().slice(0, 10))
    .lt("data_vencimento", windowEnd.toISOString().slice(0, 10));

  const months: { key: string; label: string }[] = [];
  for (let i = 0; i < 9; i++) {
    const d = addMonths(windowStart, i);
    months.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM/yy", { locale: ptBR }) });
  }

  const buckets: Record<string, { receitas: number; despesas: number }> = {};
  months.forEach((m) => (buckets[m.key] = { receitas: 0, despesas: 0 }));

  (entries ?? []).forEach((e: { tipo: string; valor: number; data_vencimento: string }) => {
    const key = e.data_vencimento.slice(0, 7);
    if (!buckets[key]) return;
    if (e.tipo === "receita") buckets[key].receitas += e.valor;
    else buckets[key].despesas += e.valor;
  });

  const chartData: CashFlowPoint[] = months.map((m) => ({
    mes: m.label,
    receitas: buckets[m.key].receitas,
    despesas: buckets[m.key].despesas,
  }));

  let acumulado = 0;
  const rows = months.map((m) => {
    const b = buckets[m.key];
    const saldoMes = b.receitas - b.despesas;
    acumulado += saldoMes;
    return { ...m, ...b, saldoMes, acumulado };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Fluxo de caixa</h1>
        <p className="text-sm text-muted">
          Receitas e despesas por mês de vencimento — de {months[0].label} a {months[months.length - 1].label}. Inclui lançamentos pendentes e pagos.
        </p>
      </div>

      <Card>
        <CardHeader title="Receitas x Despesas" />
        <CardBody>
          <CashFlowChart data={chartData} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Detalhamento mensal" />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Mês</th>
                  <th className="px-5 py-3 font-medium">Receitas</th>
                  <th className="px-5 py-3 font-medium">Despesas</th>
                  <th className="px-5 py-3 font-medium">Saldo do mês</th>
                  <th className="px-5 py-3 font-medium">Saldo acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td className="px-5 py-3 font-medium capitalize text-foreground">{r.label}</td>
                    <td className="px-5 py-3 text-green-700">{formatCurrency(r.receitas)}</td>
                    <td className="px-5 py-3 text-amber-700">{formatCurrency(r.despesas)}</td>
                    <td className={`px-5 py-3 ${r.saldoMes >= 0 ? "text-foreground" : "text-red-600"}`}>
                      {formatCurrency(r.saldoMes)}
                    </td>
                    <td className={`px-5 py-3 font-semibold ${r.acumulado >= 0 ? "text-foreground" : "text-red-600"}`}>
                      {formatCurrency(r.acumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
