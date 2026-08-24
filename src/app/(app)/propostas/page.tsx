import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE } from "@/lib/propostas";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PropostasPage() {
  const supabase = await createClient();
  const { data: proposals } = await supabase
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Propostas</h1>
          <p className="text-sm text-muted">Documentos comerciais gerados a partir do simulador.</p>
        </div>
        <Link href="/simulador">
          <Button>+ Nova proposta</Button>
        </Link>
      </div>

      <Card>
        {!proposals || proposals.length === 0 ? (
          <EmptyState
            title="Nenhuma proposta gerada ainda"
            description="Use o simulador solar para dimensionar um sistema e gerar a primeira proposta."
            action={
              <Link href="/simulador">
                <Button>Ir para o simulador</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Nº</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Sistema</th>
                  <th className="px-5 py-3 font-medium">Investimento</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {proposals.map((p) => (
                  <tr key={p.id} className="hover:bg-black/[0.02]">
                    <td className="px-5 py-3 text-muted">#{p.numero}</td>
                    <td className="px-5 py-3 font-medium text-foreground">
                      <Link href={`/propostas/${p.id}`} className="hover:underline">
                        {p.cliente_nome}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {p.potencia_kwp ? `${Number(p.potencia_kwp).toFixed(2)} kWp` : "-"}
                    </td>
                    <td className="px-5 py-3 text-muted">{formatCurrency(p.investimento_total)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={PROPOSAL_STATUS_TONE[p.status]}>{PROPOSAL_STATUS_LABEL[p.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
