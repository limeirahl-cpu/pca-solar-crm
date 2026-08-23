import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { BadgeTone } from "@/lib/funil";

export type PlantPerformanceRow = {
  id: string;
  nome: string;
  potencia_kwp: number | null;
  geracaoMensalEsperada: number | null;
  geracaoUltimos30Dias: number;
  ultimoRegistro: string | null;
};

function classificar(row: PlantPerformanceRow): { label: string; tone: BadgeTone; ratio: number | null } {
  if (!row.geracaoMensalEsperada || row.geracaoMensalEsperada <= 0) {
    return { label: "Sem referência cadastrada", tone: "neutral", ratio: null };
  }
  if (!row.ultimoRegistro) {
    return { label: "Sem dados", tone: "neutral", ratio: null };
  }
  const ratio = (row.geracaoUltimos30Dias / row.geracaoMensalEsperada) * 100;
  if (ratio >= 90) return { label: "Bom", tone: "green", ratio };
  if (ratio >= 60) return { label: "Atenção", tone: "amber", ratio };
  return { label: "Crítico", tone: "red", ratio };
}

export function PerformanceManager({ rows }: { rows: PlantPerformanceRow[] }) {
  const ordenadas = [...rows].sort((a, b) => {
    const ra = classificar(a).ratio ?? 999;
    const rb = classificar(b).ratio ?? 999;
    return ra - rb;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Performance</h1>
        <p className="text-sm text-muted">
          Comparativo entre a geração dos últimos 30 dias e a média mensal esperada de cada usina.
        </p>
      </div>

      <Card>
        <CardHeader title="Ranking de performance" subtitle="Usinas com pior performance aparecem primeiro" />
        <CardBody className="p-0">
          {ordenadas.length === 0 ? (
            <EmptyState title="Nenhuma usina cadastrada" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Usina</th>
                    <th className="px-5 py-3 font-medium">Últimos 30 dias</th>
                    <th className="px-5 py-3 font-medium">Média esperada</th>
                    <th className="px-5 py-3 font-medium">Performance</th>
                    <th className="px-5 py-3 font-medium">Último registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ordenadas.map((row) => {
                    const status = classificar(row);
                    return (
                      <tr key={row.id} className="hover:bg-black/[0.02]">
                        <td className="px-5 py-3 font-medium text-foreground">
                          <Link href={`/usinas/${row.id}`} className="hover:underline">
                            {row.nome}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {row.geracaoUltimos30Dias.toLocaleString("pt-BR")} kWh
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {row.geracaoMensalEsperada ? `${row.geracaoMensalEsperada.toLocaleString("pt-BR")} kWh` : "-"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Badge tone={status.tone}>{status.label}</Badge>
                            {status.ratio !== null && (
                              <span className="text-xs text-muted">{status.ratio.toFixed(0)}%</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {row.ultimoRegistro ? formatDate(row.ultimoRegistro) : "Sem registros"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
