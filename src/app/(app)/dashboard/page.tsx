import Link from "next/link";
import { startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Lead, Task } from "@/lib/database.types";

const LEAD_STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  contatado: "Contatado",
  orcamento_enviado: "Orçamento enviado",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

const PLANT_STATUS_LABEL: Record<string, string> = {
  ativa: "🟢 Online",
  manutencao: "🟡 Manutenção",
  inativa: "🔴 Offline",
};

const PROXIMOS_MODULOS = [
  { label: "Financeiro", phase: "Fase 12" },
  { label: "Estoque", phase: "Fase 10" },
  { label: "Projetos & Homologação", phase: "Fases 6-7" },
  { label: "Marketing", phase: "Fase 19" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const hojeInicioIso = startOfDay(now).toISOString();
  const hojeInicioData = hojeInicioIso.slice(0, 10);
  const mesInicioIso = startOfMonth(now).toISOString();
  const mesFimData = endOfMonth(now).toISOString().slice(0, 10);

  const [
    { count: leadsHoje },
    { count: leadsMes },
    { count: leadsSemContato },
    { count: leadsNegociacao },
    { count: leadsFechadosMes },
    { count: leadsTotal },
    { data: orcamentosPendentes },
    { count: totalClientes },
    { data: plants },
    { data: geracaoMes },
    { count: tarefasPendentes },
    { count: tarefasAtrasadas },
    { data: leadsRecentes },
    { data: tarefasProximas },
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", hojeInicioIso),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", mesInicioIso),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "novo"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "negociacao"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "fechado")
      .gte("updated_at", mesInicioIso),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("quotes").select("id, valor_total, status").in("status", ["rascunho", "enviado"]),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("plants").select("id, status"),
    supabase
      .from("plant_logs")
      .select("geracao_kwh")
      .gte("data", mesInicioIso.slice(0, 10))
      .lte("data", mesFimData),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("concluida", false),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("concluida", false)
      .lt("data_vencimento", hojeInicioData),
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5),
    supabase
      .from("tasks")
      .select("*")
      .eq("concluida", false)
      .order("data_vencimento", { ascending: true })
      .limit(5),
  ]);

  const valorEmAberto = (orcamentosPendentes ?? []).reduce(
    (sum, q: { valor_total: number }) => sum + (q.valor_total ?? 0),
    0
  );
  const taxaConversao =
    leadsTotal && leadsTotal > 0 ? Math.round(((leadsFechadosMes ?? 0) / leadsTotal) * 100) : 0;

  const usinasAtivas = (plants ?? []).filter((p) => p.status === "ativa").length;
  const usinasManutencao = (plants ?? []).filter((p) => p.status === "manutencao").length;
  const usinasInativas = (plants ?? []).filter((p) => p.status === "inativa").length;
  const geracaoMesTotal = (geracaoMes ?? []).reduce(
    (sum, r: { geracao_kwh: number | null }) => sum + (r.geracao_kwh ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Visão geral</h1>
        <p className="text-sm text-muted">Resumo comercial, operacional e de monitoramento.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Comercial</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Leads hoje" value={String(leadsHoje ?? 0)} tone="primary" />
          <StatCard label="Leads no mês" value={String(leadsMes ?? 0)} />
          <StatCard label="Leads sem contato" value={String(leadsSemContato ?? 0)} />
          <StatCard label="Em negociação" value={String(leadsNegociacao ?? 0)} />
          <StatCard
            label="Orçamentos em aberto"
            value={formatCurrency(valorEmAberto)}
            hint={`${(orcamentosPendentes ?? []).length} orçamento(s)`}
          />
          <StatCard label="Fechados no mês" value={String(leadsFechadosMes ?? 0)} tone="accent" />
          <StatCard label="Taxa de conversão" value={`${taxaConversao}%`} />
          <StatCard label="Clientes cadastrados" value={String(totalClientes ?? 0)} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Monitoramento &amp; Operação
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Usinas online" value={String(usinasAtivas)} tone="primary" />
          <StatCard label="Usinas em manutenção" value={String(usinasManutencao)} />
          <StatCard label="Usinas offline" value={String(usinasInativas)} />
          <StatCard
            label="Geração do mês"
            value={`${geracaoMesTotal.toLocaleString("pt-BR")} kWh`}
            tone="accent"
          />
          <StatCard label="Tarefas pendentes" value={String(tarefasPendentes ?? 0)} />
          <StatCard label="Tarefas atrasadas" value={String(tarefasAtrasadas ?? 0)} />
        </div>
      </section>

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
            {tarefasProximas && tarefasProximas.length > 0 ? (
              <ul className="divide-y divide-border">
                {tarefasProximas.map((task: Task) => (
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

      {(plants ?? []).length > 0 && (
        <Card>
          <CardHeader title="Status das usinas" />
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {(plants ?? []).slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-foreground">{PLANT_STATUS_LABEL[p.status] ?? p.status}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Próximos módulos"
          subtitle="Áreas do roadmap que ainda serão conectadas ao banco de dados"
        />
        <CardBody className="flex flex-wrap gap-2">
          {PROXIMOS_MODULOS.map((m) => (
            <Badge key={m.label} tone="neutral">
              {m.label} · {m.phase}
            </Badge>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
