import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Lead, Quote, Task } from "@/lib/database.types";

const LEAD_STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  contatado: "Contatado",
  orcamento_enviado: "Orçamento enviado",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: leadsAbertos },
    { count: totalClientes },
    { count: totalUsinas },
    { data: orcamentosPendentes },
    { data: leadsRecentes },
    { data: tarefasPendentes },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(fechado,perdido)"),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("plants").select("id", { count: "exact", head: true }),
    supabase
      .from("quotes")
      .select("id, valor_total, status")
      .in("status", ["rascunho", "enviado"]),
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("tasks")
      .select("*")
      .eq("concluida", false)
      .order("data_vencimento", { ascending: true })
      .limit(5),
  ]);

  const valorEmAberto = (orcamentosPendentes ?? []).reduce(
    (sum: number, q: Pick<Quote, "valor_total">) => sum + (q.valor_total ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Visão geral</h1>
        <p className="text-sm text-muted">Resumo do funil comercial e operação.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Leads em aberto" value={String(leadsAbertos ?? 0)} tone="primary" />
        <StatCard
          label="Orçamentos em aberto"
          value={formatCurrency(valorEmAberto)}
          hint={`${(orcamentosPendentes ?? []).length} orçamento(s)`}
        />
        <StatCard label="Clientes cadastrados" value={String(totalClientes ?? 0)} />
        <StatCard label="Usinas monitoradas" value={String(totalUsinas ?? 0)} tone="accent" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Leads recentes"
            action={
              <Link href="/leads" className="text-sm font-medium text-primary hover:underline">
                Ver todos
              </Link>
            }
          />
          <CardBody className="p-0">
            {leadsRecentes && leadsRecentes.length > 0 ? (
              <ul className="divide-y divide-border">
                {leadsRecentes.map((lead: Lead) => (
                  <li key={lead.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{lead.nome}</p>
                      <p className="text-xs text-muted">{formatDate(lead.created_at)}</p>
                    </div>
                    <Badge tone="amber">{LEAD_STATUS_LABEL[lead.status] ?? lead.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nenhum lead cadastrado ainda" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Tarefas pendentes"
            action={
              <Link href="/tarefas" className="text-sm font-medium text-primary hover:underline">
                Ver todas
              </Link>
            }
          />
          <CardBody className="p-0">
            {tarefasPendentes && tarefasPendentes.length > 0 ? (
              <ul className="divide-y divide-border">
                {tarefasPendentes.map((task: Task) => (
                  <li key={task.id} className="flex items-center justify-between px-5 py-3">
                    <p className="text-sm font-medium text-foreground">{task.titulo}</p>
                    <span className="text-xs text-muted">{formatDate(task.data_vencimento)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nenhuma tarefa pendente" />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
