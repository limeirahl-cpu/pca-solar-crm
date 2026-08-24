"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export type MonthlyGeracaoPoint = { mes: string; geracao: number };
export type PlantGeracaoSummary = {
  id: string;
  nome: string;
  potencia_kwp: number | null;
  totalMes: number;
  ultimoRegistro: string | null;
};

export function GeracaoOverview({
  monthlyData,
  plantsSummary,
}: {
  monthlyData: MonthlyGeracaoPoint[];
  plantsSummary: PlantGeracaoSummary[];
}) {
  const totalGeral = monthlyData.reduce((sum, m) => sum + m.geracao, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Geração</h1>
        <p className="text-sm text-muted">
          Histórico consolidado de geração por mês, a partir dos registros manuais de cada usina.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Geração mensal — todas as usinas"
          subtitle={`${totalGeral.toLocaleString("pt-BR")} kWh no período exibido`}
        />
        <CardBody>
          {monthlyData.every((m) => m.geracao === 0) ? (
            <EmptyState title="Nenhum registro de geração no período" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString("pt-BR")} kWh`} />
                  <Bar dataKey="geracao" name="Geração (kWh)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Por usina" subtitle="Geração no mês atual e último registro" />
        <CardBody className="p-0">
          {plantsSummary.length === 0 ? (
            <EmptyState title="Nenhuma usina cadastrada" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Usina</th>
                    <th className="px-5 py-3 font-medium">Potência</th>
                    <th className="px-5 py-3 font-medium">Geração no mês</th>
                    <th className="px-5 py-3 font-medium">Último registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {plantsSummary.map((p) => (
                    <tr key={p.id} className="hover:bg-black/[0.02]">
                      <td className="px-5 py-3 font-medium text-foreground">
                        <Link href={`/usinas/${p.id}`} className="hover:underline">
                          {p.nome}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted">{p.potencia_kwp ? `${p.potencia_kwp} kWp` : "-"}</td>
                      <td className="px-5 py-3 text-muted">{p.totalMes.toLocaleString("pt-BR")} kWh</td>
                      <td className="px-5 py-3 text-muted">
                        {p.ultimoRegistro ? formatDate(p.ultimoRegistro) : "Sem registros"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
