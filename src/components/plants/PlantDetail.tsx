"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Plant, PlantLog, PlantStatus } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type PlantWithClient = Plant & { clients: { nome: string } | null };

const STATUS_OPTIONS: { value: PlantStatus; label: string; tone: "green" | "amber" | "red" }[] = [
  { value: "ativa", label: "Ativa", tone: "green" },
  { value: "manutencao", label: "Em manutenção", tone: "amber" },
  { value: "inativa", label: "Inativa", tone: "red" },
];

export function PlantDetail({ plant, logs }: { plant: PlantWithClient; logs: PlantLog[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<PlantStatus>(plant.status);
  const [entries, setEntries] = useState<PlantLog[]>(logs);
  const [logData, setLogData] = useState(new Date().toISOString().slice(0, 10));
  const [logGeracao, setLogGeracao] = useState("");
  const [logObs, setLogObs] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleStatusChange(newStatus: PlantStatus) {
    setStatus(newStatus);
    await supabase.from("plants").update({ status: newStatus }).eq("id", plant.id);
    router.refresh();
  }

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase
      .from("plant_logs")
      .insert({
        plant_id: plant.id,
        data: logData,
        geracao_kwh: logGeracao ? Number(logGeracao) : null,
        observacao: logObs || null,
      })
      .select()
      .single();

    if (!error && data) {
      setEntries((prev) => [...prev, data].sort((a, b) => a.data.localeCompare(b.data)));
      setLogGeracao("");
      setLogObs("");
    }
    setSaving(false);
    router.refresh();
  }

  const chartData = entries.map((e) => ({
    data: formatDate(e.data),
    geracao: e.geracao_kwh ?? 0,
  }));

  const statusMeta = STATUS_OPTIONS.find((s) => s.value === status);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={plant.nome}
          subtitle={plant.clients?.nome ?? undefined}
          action={
            <div className="flex items-center gap-2">
              <Select value={status} onChange={(e) => handleStatusChange(e.target.value as PlantStatus)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <Badge tone={statusMeta?.tone}>{statusMeta?.label}</Badge>
            </div>
          }
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Info label="Potência" value={plant.potencia_kwp ? `${plant.potencia_kwp} kWp` : "-"} />
            <Info label="Painéis" value={plant.quantidade_paineis ? String(plant.quantidade_paineis) : "-"} />
            <Info label="Inversor" value={[plant.marca_inversor, plant.modelo_inversor].filter(Boolean).join(" ") || "-"} />
            <Info label="Instalação" value={formatDate(plant.data_instalacao)} />
            <Info label="Endereço" value={plant.endereco || "-"} className="sm:col-span-2" />
            <Info label="Cidade/UF" value={[plant.cidade, plant.estado].filter(Boolean).join("/") || "-"} />
            <Info
              label="Geração mensal média"
              value={plant.geracao_mensal_media_kwh ? `${plant.geracao_mensal_media_kwh} kWh` : "-"}
            />
          </div>
          {plant.observacoes && (
            <p className="mt-4 text-sm text-muted">
              <span className="font-medium text-foreground">Observações: </span>
              {plant.observacoes}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Histórico de geração" subtitle="Registros manuais de geração de energia" />
        <CardBody>
          <form onSubmit={handleAddLog} className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <FieldGroup label="Data">
              <Input type="date" value={logData} onChange={(e) => setLogData(e.target.value)} required />
            </FieldGroup>
            <FieldGroup label="Geração (kWh)">
              <Input
                type="number"
                step="0.01"
                value={logGeracao}
                onChange={(e) => setLogGeracao(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Observação" className="sm:col-span-2">
              <div className="flex gap-2">
                <Input value={logObs} onChange={(e) => setLogObs(e.target.value)} placeholder="Opcional" />
                <Button type="submit" disabled={saving}>
                  Adicionar
                </Button>
              </div>
            </FieldGroup>
          </form>

          {entries.length === 0 ? (
            <EmptyState title="Nenhum registro de geração ainda" />
          ) : (
            <>
              <div className="mb-6 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="geracao" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted">
                  <tr>
                    <th className="py-2 font-medium">Data</th>
                    <th className="py-2 font-medium">Geração (kWh)</th>
                    <th className="py-2 font-medium">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...entries].reverse().map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-2 text-foreground">{formatDate(entry.data)}</td>
                      <td className="py-2 text-muted">{entry.geracao_kwh ?? "-"}</td>
                      <td className="py-2 text-muted">{entry.observacao ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
