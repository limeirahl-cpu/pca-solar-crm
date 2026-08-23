"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Quote } from "@/lib/database.types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select, Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";

type QuoteWithRelations = Quote & {
  clients: { nome: string } | null;
  leads: { nome: string } | null;
};

const STATUS_TONE: Record<string, "neutral" | "amber" | "green" | "red" | "blue"> = {
  rascunho: "neutral",
  enviado: "blue",
  aprovado: "green",
  recusado: "red",
  expirado: "amber",
};

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  expirado: "Expirado",
};

export function QuotesTable({ quotes }: { quotes: QuoteWithRelations[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      const name = q.clients?.nome ?? q.leads?.nome ?? "";
      const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "todos" || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, statusFilter]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Buscar por cliente ou lead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:max-w-[180px]">
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="Nenhum orçamento encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Nº</th>
                  <th className="px-5 py-3 font-medium">Cliente/Lead</th>
                  <th className="px-5 py-3 font-medium">Potência</th>
                  <th className="px-5 py-3 font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-black/[0.02]">
                    <td className="px-5 py-3 font-medium text-foreground">
                      <Link href={`/orcamentos/${q.id}`} className="hover:underline">
                        #{q.numero}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">{q.clients?.nome ?? q.leads?.nome ?? "-"}</td>
                    <td className="px-5 py-3 text-muted">{q.potencia_kwp ? `${q.potencia_kwp} kWp` : "-"}</td>
                    <td className="px-5 py-3 text-muted">{formatCurrency(q.valor_total)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS_TONE[q.status]}>{STATUS_LABEL[q.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDate(q.created_at)}</td>
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
