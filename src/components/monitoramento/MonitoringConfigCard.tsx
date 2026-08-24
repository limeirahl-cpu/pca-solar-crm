"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MonitoringProvider, PlantMonitoringConfig } from "@/lib/database.types";
import { MONITORING_PROVIDER, MONITORING_STATUS_LABEL, MONITORING_STATUS_TONE } from "@/lib/monitoramento";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Select } from "@/components/ui/Field";

export function MonitoringConfigCard({
  plantId,
  initialConfig,
}: {
  plantId: string;
  initialConfig: PlantMonitoringConfig | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [config, setConfig] = useState(initialConfig);
  const [editing, setEditing] = useState(false);
  const [provider, setProvider] = useState<MonitoringProvider>(initialConfig?.provider ?? "manual");
  const [identificador, setIdentificador] = useState(initialConfig?.identificador_externo ?? "");
  const [saving, setSaving] = useState(false);

  const providerMeta = MONITORING_PROVIDER.find((p) => p.value === provider);
  const status = config?.status ?? "manual";

  async function handleSave() {
    setSaving(true);
    const novoStatus = providerMeta?.disponivel ? "conectado" : provider === "manual" ? "manual" : "nao_configurado";
    const payload = {
      plant_id: plantId,
      provider,
      status: novoStatus as PlantMonitoringConfig["status"],
      identificador_externo: identificador || null,
    };
    const { data, error } = await supabase
      .from("plant_monitoring_configs")
      .upsert(payload, { onConflict: "plant_id" })
      .select()
      .single();
    if (!error && data) {
      setConfig(data);
      setEditing(false);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader
        title="Integração de monitoramento"
        subtitle="Origem dos dados de geração desta usina"
        action={
          <div className="flex items-center gap-2">
            <Badge tone={MONITORING_STATUS_TONE[status]}>{MONITORING_STATUS_LABEL[status]}</Badge>
            <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
              {editing ? "Fechar" : "Configurar"}
            </Button>
          </div>
        }
      />
      <CardBody className="space-y-3">
        {!editing ? (
          <p className="text-sm text-muted">
            {provider === "manual"
              ? "Os dados de geração são registrados manualmente nesta tela (padrão atual)."
              : providerMeta?.disponivel
                ? `Integração automática com ${providerMeta.label} configurada.`
                : `Integração automática com ${providerMeta?.label} ainda não está disponível — nenhuma API real está conectada. Continue usando o registro manual até essa integração ser implementada.`}
          </p>
        ) : (
          <div className="space-y-3">
            <FieldGroup label="Provedor de monitoramento">
              <Select value={provider} onChange={(e) => setProvider(e.target.value as MonitoringProvider)}>
                {MONITORING_PROVIDER.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                    {!p.disponivel && p.value !== "manual" ? " (em breve)" : ""}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            {provider !== "manual" && !providerMeta?.disponivel && (
              <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
                Esta integração ainda não está configurada — ainda não há conexão real com a API do fabricante.
                O status ficará como &quot;Não configurado&quot; até que essa integração seja implementada.
              </p>
            )}
            <FieldGroup label="Identificador externo (ID da usina no provedor)">
              <Input
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Opcional — preenchido quando a integração estiver ativa"
                disabled={provider === "manual"}
              />
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
