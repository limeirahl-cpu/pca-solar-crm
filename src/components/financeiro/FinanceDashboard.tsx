import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FINANCIAL_STATUS_LABEL, FINANCIAL_STATUS_TONE, isVencido } from "@/lib/financeiro";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { FinancialEntry } from "@/lib/database.types";

type EntryLite = Pick<FinancialEntry, "id" | "tipo" | "descricao" | "valor" | "status" | "data_vencimento">;

const SHORTCUTS = [
  { href: "/financeiro/receber", label: "Contas a receber", icon: "⬇️" },
  { href: "/financeiro/pagar", label: "Contas a pagar", icon: "⬆️" },
  { href: "/financeiro/fluxo-caixa", label: "Fluxo de caixa", icon: "📈" },
  { href: "/financeiro/comissoes", label: "Comissões", icon: "🤝" },
  { href: "/financeiro/categorias", label: "Categorias", icon: "🏷️" },
  { href: "/financeiro/relatorios", label: "Relatórios", icon: "📑" },
];

export function FinanceDashboard({ entries }: { entries: EntryLite[] }) {
  const receberPendente = entries
    .filter((e) => e.tipo === "receita" && e.status === "pendente")
    .reduce((sum, e) => sum + e.valor, 0);
  const pagarPendente = entries
    .filter((e) => e.tipo === "despesa" && e.status === "pendente")
    .reduce((sum, e) => sum + e.valor, 0);
  const vencidos = entries.filter((e) => isVencido(e.data_vencimento, e.status));
  const proximos = entries
    .filter((e) => e.status === "pendente")
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted">Visão consolidada de receitas, despesas e fluxo de caixa.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="A receber (pendente)" value={formatCurrency(receberPendente)} tone="primary" />
        <StatCard label="A pagar (pendente)" value={formatCurrency(pagarPendente)} />
        <StatCard
          label="Saldo previsto"
          value={formatCurrency(receberPendente - pagarPendente)}
          tone="accent"
        />
      </div>

      {vencidos.length > 0 && (
        <Card>
          <CardHeader title="Lançamentos vencidos" subtitle={`${vencidos.length} pendência(s) fora do prazo`} />
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {vencidos.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-medium text-foreground">{e.descricao}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">{formatCurrency(e.valor)}</span>
                    <Badge tone="red">Vencido</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {SHORTCUTS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="flex flex-col items-center gap-1 p-4 text-center hover:bg-black/[0.02]">
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm font-medium text-foreground">{s.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader title="Próximos vencimentos" />
        <CardBody className="p-0">
          {proximos.length === 0 ? (
            <EmptyState title="Nenhum lançamento pendente" />
          ) : (
            <ul className="divide-y divide-border">
              {proximos.map((e) => (
                <li key={e.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="text-sm font-medium text-foreground">{e.descricao}</span>
                    <span className="ml-2 text-xs text-muted">{formatDate(e.data_vencimento)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">{formatCurrency(e.valor)}</span>
                    <Badge tone={e.tipo === "receita" ? "green" : "amber"}>
                      {e.tipo === "receita" ? "Receita" : "Despesa"}
                    </Badge>
                    <Badge tone={FINANCIAL_STATUS_TONE[e.status]}>{FINANCIAL_STATUS_LABEL[e.status]}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
