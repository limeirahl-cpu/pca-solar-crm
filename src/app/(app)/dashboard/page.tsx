import Link from "next/link";
import { startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardBarChart, type BarChartPoint } from "@/components/dashboard/DashboardBarChart";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FUNIL_STAGES, FUNIL_STAGE_LABEL, FUNIL_STAGE_TONE } from "@/lib/funil";
import { isEstoqueBaixo } from "@/lib/estoque";
import { isVencido } from "@/lib/financeiro";
import { isCheckinAtrasado } from "@/lib/monitoramento";
import type { Lead, Task, LeadStatus } from "@/lib/database.types";

const PLANT_STATUS_LABEL: Record<string, string> = {
  ativa: "🟢 Online",
  manutencao: "🟡 Manutenção",
  inativa: "🔴 Offline",
};

const PROXIMOS_MODULOS = [{ label: "Integrações oficiais", phase: "Fase 10" }];

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
    { data: produtos },
    { data: lancamentos },
    { count: alertasAbertos },
    { data: checkins },
    { count: campanhasAtivas },
    { count: postsAguardandoAprovacao },
    { data: leadsPorEtapaRaw },
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", hojeInicioIso),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", mesInicioIso),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "novo"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "negociacao"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "pos_venda")
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
    supabase.from("products").select("id, estoque_atual, estoque_minimo, valor_unitario"),
    supabase.from("financial_entries").select("id, tipo, valor, status, data_vencimento"),
    supabase.from("plant_alerts").select("id", { count: "exact", head: true }).eq("status", "aberto"),
    supabase.from("post_sale_checkins").select("id, data_prevista, status").eq("status", "pendente"),
    supabase.from("marketing_campaigns").select("id", { count: "exact", head: true }).eq("status", "ativa"),
    supabase
      .from("marketing_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "aguardando_aprovacao"),
    supabase.from("leads").select("status"),
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

  const produtosList = produtos ?? [];
  const produtosEstoqueBaixo = produtosList.filter((p) =>
    isEstoqueBaixo(p.estoque_atual, p.estoque_minimo)
  ).length;
  const valorEmEstoque = produtosList.reduce(
    (sum, p) => sum + p.estoque_atual * (p.valor_unitario ?? 0),
    0
  );

  const lancamentosList = lancamentos ?? [];
  const aReceberPendente = lancamentosList
    .filter((l) => l.tipo === "receita" && l.status === "pendente")
    .reduce((sum, l) => sum + l.valor, 0);
  const aPagarPendente = lancamentosList
    .filter((l) => l.tipo === "despesa" && l.status === "pendente")
    .reduce((sum, l) => sum + l.valor, 0);
  const lancamentosVencidos = lancamentosList.filter((l) => isVencido(l.data_vencimento, l.status)).length;

  const checkinsList = checkins ?? [];
  const checkinsAtrasados = checkinsList.filter((c) =>
    isCheckinAtrasado(c.data_prevista, c.status)
  ).length;

  // Gráfico: quantidade de leads em cada etapa do funil comercial.
  const leadsPorEtapaCount: Record<string, number> = {};
  for (const { status } of leadsPorEtapaRaw ?? []) {
    leadsPorEtapaCount[status] = (leadsPorEtapaCount[status] ?? 0) + 1;
  }
  const FUNIL_CHART_COLORS: Record<string, string> = {
    novo: "#f9700e",
    primeiro_contato: "#f9700e",
    qualificacao: "#2e9e52",
    visita_agendada: "#2e9e52",
    visita_realizada: "#2e9e52",
    dimensionamento: "#1e2f44",
    orcamento: "#1e2f44",
    negociacao: "#1e2f44",
    aprovacao: "#2e9e52",
    contrato: "#2e9e52",
    pagamento: "#2e9e52",
    instalacao: "#2e9e52",
    pos_venda: "#2e9e52",
    perdido: "#df2225",
  };
  const leadsPorEtapaChart: BarChartPoint[] = FUNIL_STAGES.filter(
    (s) => s.value !== ("perdido" as LeadStatus)
  ).map((stage) => ({
    label: stage.label,
    value: leadsPorEtapaCount[stage.value] ?? 0,
    color: FUNIL_CHART_COLORS[stage.value],
  }));

  // Gráfico: comparativo financeiro (a receber vs. a pagar vs. vencidos).
  const financeiroChart: BarChartPoint[] = [
    { label: "A receber", value: aReceberPendente, color: "#2e9e52" },
    { label: "A pagar", value: aPagarPendente, color: "#f9700e" },
  ];

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

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Estoque</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Produtos cadastrados" value={String(produtosList.length)} />
          <StatCard
            label="Estoque baixo"
            value={String(produtosEstoqueBaixo)}
            tone={produtosEstoqueBaixo > 0 ? "primary" : "default"}
          />
          <StatCard label="Valor em estoque" value={formatCurrency(valorEmEstoque)} tone="accent" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Financeiro</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="A receber (pendente)" value={formatCurrency(aReceberPendente)} tone="primary" />
          <StatCard label="A pagar (pendente)" value={formatCurrency(aPagarPendente)} />
          <StatCard
            label="Lançamentos vencidos"
            value={String(lancamentosVencidos)}
            tone={lancamentosVencidos > 0 ? "primary" : "default"}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Pós-venda &amp; Monitoramento</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Alertas abertos"
            value={String(alertasAbertos ?? 0)}
            tone={(alertasAbertos ?? 0) > 0 ? "primary" : "default"}
          />
          <StatCard label="Contatos de pós-venda pendentes" value={String(checkinsList.length)} />
          <StatCard
            label="Contatos atrasados"
            value={String(checkinsAtrasados)}
            tone={checkinsAtrasados > 0 ? "primary" : "default"}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Marketing</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Campanhas ativas" value={String(campanhasAtivas ?? 0)} tone="primary" />
          <StatCard
            label="Posts aguardando aprovação"
            value={String(postsAguardandoAprovacao ?? 0)}
            tone={(postsAguardandoAprovacao ?? 0) > 0 ? "primary" : "default"}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Leads por etapa do funil" subtitle="Quantidade de leads em cada etapa comercial" />
          <CardBody>
            <DashboardBarChart data={leadsPorEtapaChart} height={260} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Financeiro" subtitle="Pendente no momento" />
          <CardBody>
            <DashboardBarChart data={financeiroChart} format="currency" height={260} />
          </CardBody>
        </Card>
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
                    <Badge tone={FUNIL_STAGE_TONE[lead.status]}>
                      {FUNIL_STAGE_LABEL[lead.status] ?? lead.status}
                    </Badge>
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
