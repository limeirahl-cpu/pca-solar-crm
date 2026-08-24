"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { Plant, PlantAlert, PlantAlertSeveridade, PlantLog } from "@/lib/database.types";
import {
  ALERT_SEVERIDADE,
  ALERT_SEVERIDADE_LABEL,
  ALERT_SEVERIDADE_TONE,
  ALERT_STATUS_LABEL,
  ALERT_STATUS_TONE,
  ALERT_TIPO_LABEL,
  DIAS_SEM_DADOS_LIMITE,
  PERCENTUAL_GERACAO_BAIXA,
} from "@/lib/monitoramento";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatDate, formatDateTime } from "@/lib/utils";

export type AlertWithPlant = PlantAlert & { plants: { nome: string } | null };
type PlantLite = Pick<Plant, "id" | "nome" | "status" | "geracao_mensal_media_kwh">;

export function AlertsManager({
  initialAlerts,
  plants,
  logs,
}: {
  initialAlerts: AlertWithPlant[];
  plants: PlantLite[];
  logs: Pick<PlantLog, "plant_id" | "data" | "geracao_kwh">[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [alerts, setAlerts] = useState<AlertWithPlant[]>(initialAlerts);
  const [statusFilter, setStatusFilter] = useState<"todos" | "aberto" | "resolvido">("aberto");
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    plant_id: "",
    severidade: "media" as PlantAlertSeveridade,
    titulo: "",
    descricao: "",
  });

  const filtered = useMemo(
    () => alerts.filter((a) => statusFilter === "todos" || a.status === statusFilter),
    [alerts, statusFilter]
  );

  async function detectarAlertas() {
    setDetecting(true);
    setDetectMsg(null);
    const hoje = new Date();
    const existentesAbertos = new Set(
      alerts.filter((a) => a.status === "aberto").map((a) => `${a.plant_id}:${a.tipo}`)
    );

    type NovoAlerta = {
      plant_id: string;
      tipo: "sem_dados" | "geracao_baixa";
      severidade: PlantAlertSeveridade;
      titulo: string;
      descricao: string;
      valor_esperado: number | null;
      valor_registrado: number | null;
    };
    const novos: NovoAlerta[] = [];

    for (const plant of plants) {
      if (plant.status === "inativa") continue;
      const logsPlant = logs
        .filter((l) => l.plant_id === plant.id)
        .sort((a, b) => b.data.localeCompare(a.data));
      const ultimoLog = logsPlant[0];
      const diasSemDados = ultimoLog ? differenceInCalendarDays(hoje, new Date(ultimoLog.data)) : Infinity;

      if (diasSemDados >= DIAS_SEM_DADOS_LIMITE) {
        if (!existentesAbertos.has(`${plant.id}:sem_dados`)) {
          novos.push({
            plant_id: plant.id,
            tipo: "sem_dados",
            severidade: diasSemDados >= 30 ? "alta" : "media",
            titulo: `${plant.nome}: sem registro de geração há ${
              diasSemDados === Infinity ? "nenhum registro" : `${diasSemDados} dias`
            }`,
            descricao: "Nenhum lançamento de geração recente encontrado para esta usina.",
            valor_esperado: null,
            valor_registrado: null,
          });
        }
        continue;
      }

      if (ultimoLog && plant.geracao_mensal_media_kwh) {
        const esperadoDiario = Number(plant.geracao_mensal_media_kwh) / 30;
        const registrado = ultimoLog.geracao_kwh ?? 0;
        if (esperadoDiario > 0 && registrado < esperadoDiario * PERCENTUAL_GERACAO_BAIXA) {
          if (!existentesAbertos.has(`${plant.id}:geracao_baixa`)) {
            novos.push({
              plant_id: plant.id,
              tipo: "geracao_baixa",
              severidade: "media",
              titulo: `${plant.nome}: geração de ${registrado} kWh em ${formatDate(
                ultimoLog.data
              )} abaixo do esperado`,
              descricao: `Esperado aproximadamente ${esperadoDiario.toFixed(1)} kWh/dia com base na média mensal cadastrada.`,
              valor_esperado: Number(esperadoDiario.toFixed(2)),
              valor_registrado: registrado,
            });
          }
        }
      }
    }

    if (novos.length === 0) {
      setDetectMsg("Nenhum alerta novo detectado a partir dos dados de geração registrados.");
      setDetecting(false);
      return;
    }

    const { data, error } = await supabase.from("plant_alerts").insert(novos).select("*, plants(nome)");
    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAlerts((prev) => [...(data as any as AlertWithPlant[]), ...prev]);
      setDetectMsg(`${data.length} alerta(s) novo(s) detectado(s) e registrado(s).`);
      router.refresh();
    } else if (error) {
      setDetectMsg(`Erro ao registrar alertas: ${error.message}`);
    }
    setDetecting(false);
  }

  async function resolverAlerta(alert: AlertWithPlant) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, status: "resolvido", resolvido_em: new Date().toISOString() } : a))
    );
    await supabase
      .from("plant_alerts")
      .update({ status: "resolvido", resolvido_em: new Date().toISOString() })
      .eq("id", alert.id);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.plant_id || !form.titulo) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("plant_alerts")
      .insert({
        plant_id: form.plant_id,
        tipo: "manual",
        severidade: form.severidade,
        titulo: form.titulo,
        descricao: form.descricao || null,
      })
      .select("*, plants(nome)")
      .single();
    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAlerts((prev) => [data as any as AlertWithPlant, ...prev]);
      setModalOpen(false);
      setForm({ plant_id: "", severidade: "media", titulo: "", descricao: "" });
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Alertas de monitoramento</h1>
          <p className="text-sm text-muted">
            Detecção automática a partir dos registros de geração, mais alertas manuais.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={detectarAlertas} disabled={detecting}>
            {detecting ? "Analisando..." : "🔍 Detectar alertas"}
          </Button>
          <Button onClick={() => setModalOpen(true)}>+ Alerta manual</Button>
        </div>
      </div>

      {detectMsg && (
        <Card className="p-3">
          <p className="text-sm text-muted">{detectMsg}</p>
        </Card>
      )}

      <div className="flex gap-2">
        {(["aberto", "resolvido", "todos"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-stone-100 text-stone-600"
            }`}
          >
            {s === "todos" ? "Todos" : ALERT_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum alerta"
            description="Use 'Detectar alertas' para analisar os dados de geração das usinas cadastradas."
          />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((alert) => (
              <li key={alert.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={ALERT_SEVERIDADE_TONE[alert.severidade]}>
                      {ALERT_SEVERIDADE_LABEL[alert.severidade]}
                    </Badge>
                    <Badge tone={ALERT_STATUS_TONE[alert.status]}>{ALERT_STATUS_LABEL[alert.status]}</Badge>
                    <span className="text-xs text-muted">{ALERT_TIPO_LABEL[alert.tipo]}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">{alert.titulo}</p>
                  {alert.descricao && <p className="text-sm text-muted">{alert.descricao}</p>}
                  <p className="mt-1 text-xs text-muted">
                    {alert.plants?.nome && (
                      <Link href={`/usinas`} className="hover:underline">
                        {alert.plants.nome}
                      </Link>
                    )}{" "}
                    · {formatDateTime(alert.created_at)}
                  </p>
                </div>
                {alert.status === "aberto" && (
                  <Button size="sm" variant="secondary" onClick={() => resolverAlerta(alert)}>
                    Marcar resolvido
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo alerta manual">
        <form onSubmit={handleSubmit} className="space-y-3">
          <FieldGroup label="Usina" required>
            <Select value={form.plant_id} onChange={(e) => setForm({ ...form, plant_id: e.target.value })}>
              <option value="">Selecione...</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Severidade">
            <Select
              value={form.severidade}
              onChange={(e) => setForm({ ...form, severidade: e.target.value as PlantAlertSeveridade })}
            >
              {ALERT_SEVERIDADE.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Título" required>
            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Descrição">
            <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </FieldGroup>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
