"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Homologacao, HomologacaoStatus } from "@/lib/database.types";
import { HOMOLOGACAO_STATUS, HOMOLOGACAO_LABEL, HOMOLOGACAO_TONE, isHomologacaoAtrasada } from "@/lib/projetos";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

const emptyForm = {
  concessionaria: "",
  unidade_consumidora: "",
  numero_solicitacao: "",
  protocolo: "",
  data_envio: "",
  prazo_dias: "45",
  status: "pendente" as HomologacaoStatus,
  pendencias_descricao: "",
  data_aprovacao: "",
  observacoes: "",
};

export function HomologacaoSection({
  projectId,
  homologacoes,
}: {
  projectId: string;
  homologacoes: Homologacao[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState(homologacoes);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase
      .from("homologacoes")
      .insert({
        project_id: projectId,
        concessionaria: form.concessionaria || null,
        unidade_consumidora: form.unidade_consumidora || null,
        numero_solicitacao: form.numero_solicitacao || null,
        protocolo: form.protocolo || null,
        data_envio: form.data_envio || null,
        prazo_dias: Number(form.prazo_dias) || 45,
        status: form.status,
        observacoes: form.observacoes || null,
      })
      .select()
      .single();
    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      setCreating(false);
      setForm(emptyForm);
    }
    setSaving(false);
    router.refresh();
  }

  async function updateStatus(h: Homologacao, status: HomologacaoStatus) {
    setItems((prev) => prev.map((it) => (it.id === h.id ? { ...it, status } : it)));
    await supabase.from("homologacoes").update({ status }).eq("id", h.id);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Homologação"
        subtitle="Acompanhamento junto à concessionária"
        action={
          !creating && (
            <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
              + Nova solicitação
            </Button>
          )
        }
      />
      <CardBody className="space-y-4">
        {creating && (
          <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-border p-4">
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Concessionária">
                <Input value={form.concessionaria} onChange={(e) => setForm({ ...form, concessionaria: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Unidade consumidora">
                <Input value={form.unidade_consumidora} onChange={(e) => setForm({ ...form, unidade_consumidora: e.target.value })} />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Número da solicitação">
                <Input value={form.numero_solicitacao} onChange={(e) => setForm({ ...form, numero_solicitacao: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Protocolo">
                <Input value={form.protocolo} onChange={(e) => setForm({ ...form, protocolo: e.target.value })} />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FieldGroup label="Data de envio">
                <Input type="date" value={form.data_envio} onChange={(e) => setForm({ ...form, data_envio: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Prazo (dias)">
                <Input type="number" value={form.prazo_dias} onChange={(e) => setForm({ ...form, prazo_dias: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Status">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as HomologacaoStatus })}>
                  {HOMOLOGACAO_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
              </FieldGroup>
            </div>
            <FieldGroup label="Observações">
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        )}

        {items.length === 0 && !creating ? (
          <EmptyState title="Nenhuma solicitação de homologação ainda" />
        ) : (
          items.map((h) => {
            const atrasada = isHomologacaoAtrasada(h.data_envio, h.prazo_dias, h.status);
            return (
              <div key={h.id} className="rounded-lg border border-border p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {h.concessionaria || "Concessionária não informada"}
                    {h.unidade_consumidora ? ` · UC ${h.unidade_consumidora}` : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    {atrasada && <Badge tone="red">⚠ Prazo estourado</Badge>}
                    <Select value={h.status} onChange={(e) => updateStatus(h, e.target.value as HomologacaoStatus)} className="w-40">
                      {HOMOLOGACAO_STATUS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
                  <span>Protocolo: {h.protocolo || "-"}</span>
                  <span>Enviado em: {formatDate(h.data_envio)}</span>
                  <span>Prazo: {h.prazo_dias ?? 45} dias</span>
                  <span>
                    Status: <Badge tone={HOMOLOGACAO_TONE[h.status]}>{HOMOLOGACAO_LABEL[h.status]}</Badge>
                  </span>
                </div>
                {h.observacoes && <p className="mt-2 text-xs text-muted">{h.observacoes}</p>}
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
