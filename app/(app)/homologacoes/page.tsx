import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { HOMOLOGACAO_LABEL, HOMOLOGACAO_TONE, isHomologacaoAtrasada } from "@/lib/projetos";
import { formatDate } from "@/lib/utils";

export default async function HomologacoesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("homologacoes")
    .select("*, projects(nome)")
    .order("data_envio", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  const sorted = [...rows].sort((a, b) => {
    const aAtrasada = isHomologacaoAtrasada(a.data_envio, a.prazo_dias, a.status);
    const bAtrasada = isHomologacaoAtrasada(b.data_envio, b.prazo_dias, b.status);
    if (aAtrasada !== bAtrasada) return aAtrasada ? -1 : 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Homologações</h1>
        <p className="text-sm text-muted">Todas as solicitações, com as fora do prazo em destaque.</p>
      </div>

      <Card>
        {sorted.length === 0 ? (
          <EmptyState
            title="Nenhuma homologação em andamento"
            description="Solicitações de homologação são criadas dentro de cada projeto."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Projeto</th>
                  <th className="px-5 py-3 font-medium">Concessionária</th>
                  <th className="px-5 py-3 font-medium">Protocolo</th>
                  <th className="px-5 py-3 font-medium">Enviado em</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((h) => {
                  const atrasada = isHomologacaoAtrasada(h.data_envio, h.prazo_dias, h.status);
                  return (
                    <tr key={h.id} className="hover:bg-black/[0.02]">
                      <td className="px-5 py-3 font-medium text-foreground">
                        <Link href={`/projetos/${h.project_id}`} className="hover:underline">
                          {h.projects?.nome ?? "Projeto"}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted">{h.concessionaria || "-"}</td>
                      <td className="px-5 py-3 text-muted">{h.protocolo || "-"}</td>
                      <td className="px-5 py-3 text-muted">{formatDate(h.data_envio)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Badge tone={HOMOLOGACAO_TONE[h.status as keyof typeof HOMOLOGACAO_TONE]}>
                            {HOMOLOGACAO_LABEL[h.status as keyof typeof HOMOLOGACAO_LABEL]}
                          </Badge>
                          {atrasada && <Badge tone="red">⚠ Atrasada</Badge>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
