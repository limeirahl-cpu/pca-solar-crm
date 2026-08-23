import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";

type EntryRow = {
  tipo: "receita" | "despesa";
  valor: number;
  status: "pendente" | "pago" | "cancelado";
  financial_categories: { nome: string } | null;
};

export default async function RelatoriosFinanceirosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const mesSelecionado = mes || new Date().toISOString().slice(0, 7);
  const inicio = `${mesSelecionado}-01`;
  const [ano, mesNum] = mesSelecionado.split("-").map(Number);
  const proximoMes = mesNum === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mesNum + 1).padStart(2, "0")}-01`;

  const supabase = await createClient();
  const { data } = await supabase
    .from("financial_entries")
    .select("tipo, valor, status, financial_categories(nome)")
    .neq("status", "cancelado")
    .gte("data_vencimento", inicio)
    .lt("data_vencimento", proximoMes);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = (data ?? []) as any as EntryRow[];

  const receitaTotal = entries.filter((e) => e.tipo === "receita").reduce((s, e) => s + e.valor, 0);
  const despesaTotal = entries.filter((e) => e.tipo === "despesa").reduce((s, e) => s + e.valor, 0);
  const receitaRealizada = entries
    .filter((e) => e.tipo === "receita" && e.status === "pago")
    .reduce((s, e) => s + e.valor, 0);
  const despesaRealizada = entries
    .filter((e) => e.tipo === "despesa" && e.status === "pago")
    .reduce((s, e) => s + e.valor, 0);

  const porCategoria = new Map<string, { tipo: "receita" | "despesa"; total: number }>();
  entries.forEach((e) => {
    const nome = e.financial_categories?.nome ?? "Sem categoria";
    const key = `${e.tipo}::${nome}`;
    const atual = porCategoria.get(key) ?? { tipo: e.tipo, total: 0 };
    atual.total += e.valor;
    porCategoria.set(key, atual);
  });
  const linhas = Array.from(porCategoria.entries())
    .map(([key, v]) => ({ nome: key.split("::")[1], ...v }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Relatórios financeiros</h1>
          <p className="text-sm text-muted">Totais por categoria no período — inclui pendentes e pagos, exceto cancelados.</p>
        </div>
        <form className="flex items-center gap-2">
          <input
            type="month"
            name="mes"
            defaultValue={mesSelecionado}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
          />
          <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            Filtrar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted">Receita do período (total / realizada)</p>
          <p className="mt-2 text-2xl font-semibold text-green-700">{formatCurrency(receitaTotal)}</p>
          <p className="mt-1 text-xs text-muted">Recebido: {formatCurrency(receitaRealizada)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Despesa do período (total / realizada)</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{formatCurrency(despesaTotal)}</p>
          <p className="mt-1 text-xs text-muted">Pago: {formatCurrency(despesaRealizada)}</p>
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-sm text-muted">Saldo do período</p>
        <p className={`mt-2 text-2xl font-semibold ${receitaTotal - despesaTotal >= 0 ? "text-foreground" : "text-red-600"}`}>
          {formatCurrency(receitaTotal - despesaTotal)}
        </p>
      </Card>

      <Card>
        <CardHeader title="Por categoria" />
        <CardBody className="p-0">
          {linhas.length === 0 ? (
            <EmptyState title="Nenhum lançamento neste período" />
          ) : (
            <ul className="divide-y divide-border">
              {linhas.map((l, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-foreground">{l.nome}</span>
                  <span className={l.tipo === "receita" ? "text-green-700" : "text-amber-700"}>
                    {formatCurrency(l.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
