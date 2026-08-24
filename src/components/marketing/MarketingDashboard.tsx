import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { POST_CANAL_LABEL, POST_STATUS_LABEL, POST_STATUS_TONE } from "@/lib/marketing";
import { formatDate } from "@/lib/utils";
import type { MarketingCampaign, MarketingPost } from "@/lib/database.types";

type PostLite = Pick<MarketingPost, "id" | "titulo" | "canal" | "status" | "data_planejada" | "gerado_por_ia">;

const SHORTCUTS = [
  { href: "/marketing/calendario", label: "Calendário de Conteúdo", icon: "🗓️" },
  { href: "/marketing/criativos", label: "Criativos", icon: "🎨" },
  { href: "/marketing/campanhas", label: "Campanhas", icon: "🎯" },
  { href: "/marketing/leads", label: "Leads de campanhas", icon: "🧲" },
];

export function MarketingDashboard({
  campaigns,
  posts,
  aiConfigured,
}: {
  campaigns: MarketingCampaign[];
  posts: PostLite[];
  aiConfigured: boolean;
}) {
  const campanhasAtivas = campaigns.filter((c) => c.status === "ativa").length;
  const criativosNoBanco = posts.filter((p) => p.status === "ideia" || p.status === "rascunho").length;
  const aguardandoAprovacao = posts.filter((p) => p.status === "aguardando_aprovacao").length;
  const mesAtual = new Date().toISOString().slice(0, 7);
  const publicadosNoMes = posts.filter(
    (p) => p.status === "publicado" && p.data_planejada?.slice(0, 7) === mesAtual
  ).length;

  const proximos = posts
    .filter((p) => p.data_planejada && p.status !== "cancelado" && p.status !== "publicado")
    .sort((a, b) => (a.data_planejada ?? "").localeCompare(b.data_planejada ?? ""))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Central de Marketing</h1>
        <p className="text-sm text-muted">Conteúdo, campanhas e leads de marketing em um só lugar.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Campanhas ativas" value={String(campanhasAtivas)} tone="primary" />
        <StatCard label="Criativos no banco" value={String(criativosNoBanco)} />
        <StatCard
          label="Aguardando aprovação"
          value={String(aguardandoAprovacao)}
          tone={aguardandoAprovacao > 0 ? "primary" : "default"}
        />
        <StatCard label="Publicados no mês" value={String(publicadosNoMes)} tone="accent" />
      </div>

      {!aiConfigured && (
        <Card className="p-4">
          <p className="text-sm text-muted">
            ✨ A geração de legendas por IA ainda não está configurada — adicione a variável de ambiente{" "}
            <span className="font-mono text-xs">ANTHROPIC_API_KEY</span> na Vercel para ativar esse recurso em
            Criativos. Sem ela, dá para criar posts normalmente, só sem o botão de geração automática.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SHORTCUTS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-black/[0.02]">
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm font-medium text-foreground">{s.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader title="Próximos posts" subtitle="Agendados, ainda não publicados" />
        <CardBody className="p-0">
          {proximos.length === 0 ? (
            <EmptyState title="Nenhum post agendado" />
          ) : (
            <ul className="divide-y divide-border">
              {proximos.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {p.titulo} {p.gerado_por_ia && "✨"}
                    </p>
                    <p className="text-xs text-muted">
                      {POST_CANAL_LABEL[p.canal]} · {p.data_planejada ? formatDate(p.data_planejada) : "-"}
                    </p>
                  </div>
                  <Badge tone={POST_STATUS_TONE[p.status]}>{POST_STATUS_LABEL[p.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
